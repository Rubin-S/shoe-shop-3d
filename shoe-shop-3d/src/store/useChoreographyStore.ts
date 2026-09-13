/**
 * src/store/useChoreographyStore.ts
 *
 * Coordinates 5-stage GSAP ScrollTrigger timeline,
 * camera focus states, active hotspots, and user interaction arbitration.
 */

import { useSyncExternalStore } from 'react';
import { StageName, HOTSPOT_ITEMS, HotspotItem } from '@/components/3d/ChoreographyConfig';
import { playSegmentSelect, playClick } from '@/utils/audio';

export interface ChoreographyState {
  scrollProgress: number;
  activeStage: StageName;
  activeHotspotId: string | null;
  activeHotspotData: HotspotItem | null;
  isUserInteracting: boolean;
}

export interface HotspotScreenPosition {
  x: number;
  y: number;
  visible: boolean;
}

export class HotspotsStoreEngine {
  private positions: Record<string, HotspotScreenPosition> = {};
  private subscribers: Set<(pos: Record<string, HotspotScreenPosition>) => void> = new Set();

  public getPositions = (): Record<string, HotspotScreenPosition> => {
    return this.positions;
  };

  public setPositions = (next: Record<string, HotspotScreenPosition>): void => {
    this.positions = next;
    this.subscribers.forEach((cb) => cb(this.positions));
  };

  public subscribe = (listener: (pos: Record<string, HotspotScreenPosition>) => void): (() => void) => {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  };
}

export const hotspotsStoreEngine = new HotspotsStoreEngine();

export function useHotspotsStore(): Record<string, HotspotScreenPosition> {
  return useSyncExternalStore(
    (cb) => hotspotsStoreEngine.subscribe(cb),
    () => hotspotsStoreEngine.getPositions(),
    () => hotspotsStoreEngine.getPositions()
  );
}

export class ChoreographyStoreEngine {
  public scrollProgress: number = 0;
  public activeStage: StageName = 'hero';
  public activeHotspotId: string | null = null;
  public isUserInteracting: boolean = false;
  private scrollDispatcher: ((stage: StageName) => void) | null = null;
  private subscribers: Set<(state: ChoreographyState) => void> = new Set();
  private cachedState: ChoreographyState;

  constructor() {
    this.cachedState = this.computeState();
  }

  private computeState(): ChoreographyState {
    const activeHotspotData = this.activeHotspotId
      ? HOTSPOT_ITEMS.find((h) => h.id === this.activeHotspotId) || null
      : null;

    return {
      scrollProgress: this.scrollProgress,
      activeStage: this.activeStage,
      activeHotspotId: this.activeHotspotId,
      activeHotspotData,
      isUserInteracting: this.isUserInteracting,
    };
  }

  public getState = (): ChoreographyState => {
    return this.cachedState;
  };

  public setScrollProgress = (p: number): void => {
    this.scrollProgress = Math.min(1.0, Math.max(0.0, p));
    if (this.scrollProgress < 0.20) {
      this.activeStage = 'hero';
    } else if (this.scrollProgress < 0.40) {
      this.activeStage = 'exploded';
    } else if (this.scrollProgress < 0.60) {
      this.activeStage = 'specs';
    } else if (this.scrollProgress < 0.80) {
      this.activeStage = 'customizer';
    } else {
      this.activeStage = 'buy';
    }
    this.notify();
  };

  public setActiveStage = (stage: StageName): void => {
    this.activeStage = stage;
    this.notify();
  };

  public selectHotspot = (id: string | null): void => {
    if (this.activeHotspotId !== id) {
      this.activeHotspotId = id;
      if (id) {
        playSegmentSelect();
      } else {
        playClick();
      }
      this.notify();
    }
  };

  public setIsUserInteracting = (interacting: boolean): void => {
    if (this.isUserInteracting !== interacting) {
      this.isUserInteracting = interacting;
      this.notify();
    }
  };

  public registerScrollDispatcher = (fn: (stage: StageName) => void): (() => void) => {
    this.scrollDispatcher = fn;
    return () => {
      this.scrollDispatcher = null;
    };
  };

  public scrollToStage = (stage: StageName): void => {
    playClick();
    if (this.scrollDispatcher) {
      this.scrollDispatcher(stage);
    } else {
      // Fallback: search for anchor element
      const el = document.getElementById(`stage-${stage}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  public subscribe = (listener: (state: ChoreographyState) => void): (() => void) => {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  };

  public notify = (): void => {
    this.cachedState = this.computeState();
    const s = this.cachedState;
    this.subscribers.forEach((cb) => cb(s));
  };
}

export const choreographyStoreEngine = new ChoreographyStoreEngine();

export function useChoreographyStore(): ChoreographyState & {
  setScrollProgress: (p: number) => void;
  setActiveStage: (stage: StageName) => void;
  selectHotspot: (id: string | null) => void;
  setIsUserInteracting: (interacting: boolean) => void;
  scrollToStage: (stage: StageName) => void;
  registerScrollDispatcher: (fn: (stage: StageName) => void) => () => void;
} {
  const state = useSyncExternalStore(
    (cb) => choreographyStoreEngine.subscribe(cb),
    () => choreographyStoreEngine.getState(),
    () => choreographyStoreEngine.getState()
  );

  return {
    ...state,
    setScrollProgress: choreographyStoreEngine.setScrollProgress,
    setActiveStage: choreographyStoreEngine.setActiveStage,
    selectHotspot: choreographyStoreEngine.selectHotspot,
    setIsUserInteracting: choreographyStoreEngine.setIsUserInteracting,
    scrollToStage: choreographyStoreEngine.scrollToStage,
    registerScrollDispatcher: choreographyStoreEngine.registerScrollDispatcher,
  };
}
