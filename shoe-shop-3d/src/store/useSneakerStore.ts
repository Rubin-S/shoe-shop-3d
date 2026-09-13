/**
 * src/store/useSneakerStore.ts
 *
 * Reactive Customization Store for AEROPRO-X LAB 3D Sneaker.
 * Compatible with React 18 useSyncExternalStore and vanilla event subscriptions.
 * Enforces strict boundary validation, hex normalization, scalar clamping, and undo history.
 */

import { useSyncExternalStore } from 'react';
import { SegmentId, SneakerCustomization, SegmentCustomization } from '@/types/sneaker';
import {
  COLORWAY_PRESETS,
  validateHex,
  normalizeHex,
  MaterialFinishPreset,
  MATERIAL_FINISH_PRESETS,
} from '@/utils/colorways';

export { validateHex, normalizeHex };
export type { MaterialFinishPreset };
export { MATERIAL_FINISH_PRESETS };

export interface CustomizerHistoryEntry {
  segment: SegmentId;
  patch: Partial<SegmentCustomization>;
  timestamp: number;
}

export interface SneakerStoreState {
  selectedSegment: SegmentId;
  currentPreset: string;
  activeColorway: SneakerCustomization;
  customization: SneakerCustomization;
  history: CustomizerHistoryEntry[];
}

export interface SneakerStoreActions {
  selectSegment: (segment: SegmentId) => void;
  setSegmentColor: (segment: SegmentId, hexColor: string) => void;
  setSegmentMaterial: (segment: SegmentId, finish: MaterialFinishPreset | Partial<SegmentCustomization>) => void;
  updateSneakerSegment: (segment: SegmentId, patch: Partial<SegmentCustomization>) => void;
  applyPreset: (presetName: string) => void;
  applyColorway: (presetName: string) => void;
  resetCustomization: () => void;
}

export type SneakerStore = SneakerStoreState & SneakerStoreActions;

function clampScalar(val: number | undefined): number | undefined {
  if (val === undefined) return undefined;
  if (!Number.isFinite(val)) return 0.0;
  return Math.min(1.0, Math.max(0.0, val));
}

function cloneColorway(colorway: SneakerCustomization): SneakerCustomization {
  return {
    upper: { ...colorway.upper },
    sole: { ...colorway.sole },
    accents: { ...colorway.accents },
    laces: { ...colorway.laces },
  };
}

/**
 * Vanilla Customizer Engine Core
 */
export class SneakerStoreEngine {
  public selectedSegment: SegmentId;
  public currentPreset: string;
  public activeColorway: SneakerCustomization;
  public customization: SneakerCustomization;
  public history: CustomizerHistoryEntry[];
  private subscribers: Set<(state: SneakerStoreState) => void> = new Set();
  private cachedState: SneakerStoreState;

  constructor(initialPreset: string = 'Cyber Phantom') {
    const baseColorway =
      COLORWAY_PRESETS[initialPreset] ||
      COLORWAY_PRESETS['Cyber Phantom'];
    this.selectedSegment = 'upper';
    this.currentPreset = initialPreset;
    this.activeColorway = cloneColorway(baseColorway);
    this.customization = cloneColorway(baseColorway);
    this.history = [];
    this.cachedState = this.computeState();
  }

  private computeState(): SneakerStoreState {
    return {
      selectedSegment: this.selectedSegment,
      currentPreset: this.currentPreset,
      activeColorway: this.activeColorway,
      customization: {
        upper: { ...this.activeColorway.upper },
        sole: { ...this.activeColorway.sole },
        accents: { ...this.activeColorway.accents },
        laces: { ...this.activeColorway.laces },
      },
      history: this.history,
    };
  }

  public getState = (): SneakerStoreState => {
    return this.cachedState;
  };

  public subscribe = (listener: (state: SneakerStoreState) => void): (() => void) => {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  };

  public notify(): void {
    this.cachedState = this.computeState();
    const stateSnapshot = this.cachedState;
    this.subscribers.forEach((listener) => {
      try {
        listener(stateSnapshot);
      } catch (err) {
        console.error('[SneakerStoreEngine] Error in subscriber callback:', err);
      }
    });
  }

  public selectSegment = (segment: SegmentId | string): void => {
    if (!['upper', 'sole', 'accents', 'laces'].includes(segment)) {
      throw new Error(`Invalid sneaker segment: ${segment}`);
    }
    this.selectedSegment = segment as SegmentId;
    this.notify();
  };

  public updateSneakerSegment = (
    segment: SegmentId | string,
    patch: Partial<SegmentCustomization>
  ): void => {
    if (!['upper', 'sole', 'accents', 'laces'].includes(segment)) {
      throw new Error(`Invalid sneaker segment: ${segment}`);
    }

    // Boundary Test B7.3: Empty patch object does not alter existing properties
    if (!patch || Object.keys(patch).length === 0) {
      return;
    }

    // Boundary Test B7.4: Validate hex before mutation
    let nextColor: string | undefined = undefined;
    if (patch.color !== undefined) {
      if (!validateHex(patch.color)) {
        throw new Error(`Invalid hex color: ${patch.color}`);
      }
      nextColor = normalizeHex(patch.color);
    }

    const segKey = segment as SegmentId;
    const currentSegment = this.activeColorway[segKey];

    const updatedSegment: SegmentCustomization = {
      ...currentSegment,
      ...(nextColor !== undefined ? { color: nextColor } : {}),
      ...(patch.roughness !== undefined ? { roughness: clampScalar(patch.roughness)! } : {}),
      ...(patch.metalness !== undefined ? { metalness: clampScalar(patch.metalness)! } : {}),
      ...(patch.clearcoat !== undefined ? { clearcoat: clampScalar(patch.clearcoat)! } : {}),
      ...(patch.iridescence !== undefined ? { iridescence: clampScalar(patch.iridescence)! } : {}),
    };

    this.activeColorway = {
      ...this.activeColorway,
      [segKey]: updatedSegment,
    };

    this.customization = cloneColorway(this.activeColorway);
    this.currentPreset = 'Custom';

    this.history.push({
      segment: segKey,
      patch: { ...patch },
      timestamp: Date.now(),
    });

    this.notify();
  };

  public setSegmentColor = (segment: SegmentId, hexColor: string): void => {
    this.updateSneakerSegment(segment, { color: hexColor });
  };

  public setSegmentMaterial = (
    segment: SegmentId,
    finish: MaterialFinishPreset | Partial<SegmentCustomization>
  ): void => {
    const props = 'properties' in finish ? finish.properties : finish;
    const patch: Partial<SegmentCustomization> = {};
    if (props.roughness !== undefined) patch.roughness = props.roughness;
    if (props.metalness !== undefined) patch.metalness = props.metalness;
    if (props.clearcoat !== undefined) patch.clearcoat = props.clearcoat;
    if (props.iridescence !== undefined) patch.iridescence = props.iridescence;

    this.updateSneakerSegment(segment, patch);
  };


  public applyPreset = (presetName: string): void => {
    const preset = COLORWAY_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    this.currentPreset = presetName;
    this.activeColorway = cloneColorway(preset);
    this.customization = cloneColorway(preset);
    this.notify();
  };

  public applyColorway = (presetName: string): void => {
    this.applyPreset(presetName);
  };

  public resetCustomization = (): void => {
    this.applyPreset('Cyber Phantom');
  };
}

export const SneakerCustomizerStore = SneakerStoreEngine;

// Global Singleton Store Engine
export const sneakerStoreEngine = new SneakerStoreEngine('Cyber Phantom');

/**
 * React 18 Custom Hook with useSyncExternalStore
 */
export function useSneakerStore(): SneakerStore;
export function useSneakerStore<T>(selector: (state: SneakerStore) => T): T;
export function useSneakerStore<T>(selector?: (state: SneakerStore) => T): T | SneakerStore {
  const state = useSyncExternalStore(
    (callback) => sneakerStoreEngine.subscribe(callback),
    () => sneakerStoreEngine.getState(),
    () => sneakerStoreEngine.getState()
  );

  const fullStore: SneakerStore = {
    ...state,
    selectSegment: sneakerStoreEngine.selectSegment,
    setSegmentColor: sneakerStoreEngine.setSegmentColor,
    setSegmentMaterial: sneakerStoreEngine.setSegmentMaterial,
    updateSneakerSegment: sneakerStoreEngine.updateSneakerSegment,
    applyPreset: sneakerStoreEngine.applyPreset,
    applyColorway: sneakerStoreEngine.applyColorway,
    resetCustomization: sneakerStoreEngine.resetCustomization,
  };

  if (selector) {
    return selector(fullStore);
  }
  return fullStore;
}
