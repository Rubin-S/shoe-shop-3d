/**
 * src/store/useThemeStore.ts
 *
 * Ultra-fast reactive Theme Store using React 18 useSyncExternalStore.
 * Supports Light Theme (Daylight Luxury Alabaster) and Dark Theme (Obsidian Onyx).
 * Syncs seamlessly with localStorage, document.documentElement classes, and meta tags.
 */

import { useSyncExternalStore } from 'react';
import { playClick } from '@/utils/audio';

export type ThemeMode = 'light' | 'dark';

export interface ThemeStoreState {
  theme: ThemeMode;
  isLight: boolean;
  isDark: boolean;
}

class ThemeStoreEngine {
  private theme: ThemeMode = 'light';
  private cachedState: ThemeStoreState = {
    theme: 'light',
    isLight: true,
    isDark: false,
  };
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ax_theme') as ThemeMode | null;
        if (saved === 'light' || saved === 'dark') {
          this.theme = saved;
        } else {
          this.theme = 'light';
        }
      } catch {
        this.theme = 'light';
      }
      this.recomputeCachedState();
      this.applyToDOM();
    }
  }

  private recomputeCachedState(): void {
    this.cachedState = {
      theme: this.theme,
      isLight: this.theme === 'light',
      isDark: this.theme === 'dark',
    };
  }

  private applyToDOM(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const isLight = this.theme === 'light';

    if (isLight) {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.style.backgroundColor = '#F8F9FA';
      document.body.style.color = '#0A0B0E';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      document.body.style.backgroundColor = '#050507';
      document.body.style.color = '#FFFFFF';
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isLight ? '#F8F9FA' : '#050507');
    }
    const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (colorSchemeMeta) {
      colorSchemeMeta.setAttribute('content', isLight ? 'light' : 'dark');
    }
  }

  public getState = (): ThemeStoreState => {
    return this.cachedState;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify(): void {
    this.recomputeCachedState();
    this.applyToDOM();
    this.listeners.forEach((l) => l());
  }

  public setTheme(nextTheme: ThemeMode): void {
    if (this.theme === nextTheme) return;
    this.theme = nextTheme;
    try {
      localStorage.setItem('ax_theme', nextTheme);
    } catch {
      // Ignore localStorage errors in private browsing
    }
    this.notify();
  }

  public toggleTheme = (): ThemeMode => {
    playClick();
    const next = this.theme === 'light' ? 'dark' : 'light';
    this.setTheme(next);
    return next;
  };
}

export const themeStoreEngine = new ThemeStoreEngine();

export function useThemeStore(): ThemeStoreState & {
  toggleTheme: () => ThemeMode;
  setTheme: (theme: ThemeMode) => void;
} {
  const state = useSyncExternalStore(
    themeStoreEngine.subscribe,
    themeStoreEngine.getState,
    themeStoreEngine.getState
  );

  return {
    ...state,
    toggleTheme: themeStoreEngine.toggleTheme,
    setTheme: (t: ThemeMode) => themeStoreEngine.setTheme(t),
  };
}
