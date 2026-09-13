/**
 * src/hooks/useSneakerCustomizer.ts
 *
 * Bridge Hook connecting useSneakerStore, UniformMutationEngine, and Web Audio SFX.
 * Provides intuitive, high-level customization triggers to UI components.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSneakerStore, sneakerStoreEngine } from '@/store/useSneakerStore';
import { uniformMutationEngine } from '@/components/3d/UniformMutationEngine';
import { SegmentId, SneakerLoadResult, SneakerCustomization } from '@/types/sneaker';
import { FINISH_PRESETS, FinishType } from '@/utils/colorways';
import { playColorSwitch, playSegmentSelect, playClick } from '@/utils/audio';

export interface UseSneakerCustomizerReturn {
  selectedSegment: SegmentId;
  currentPreset: string;
  customization: SneakerCustomization;
  activeColorway: SneakerCustomization;
  selectSegment: (segment: SegmentId) => void;
  setColor: (hexColor: string) => void;
  setSegmentColor: (segment: SegmentId, hexColor: string) => void;
  setMaterialFinish: (finishKey: FinishType) => void;
  applyPreset: (presetName: string) => void;
  bindLoadedModel: (result: SneakerLoadResult) => void;
}

export function useSneakerCustomizer(): UseSneakerCustomizerReturn {
  const store = useSneakerStore();
  const isBoundRef = useRef<boolean>(false);

  // Bind mutation engine to model when loaded
  const bindLoadedModel = useCallback((result: SneakerLoadResult) => {
    uniformMutationEngine.registerModel(result.model, result.materialMap);
    // Apply current initial store state immediately without transition delay
    uniformMutationEngine.applyCustomization(store.customization, { duration: 0 });
    isBoundRef.current = true;
  }, [store.customization]);

  // Synchronize store updates with 3D uniform engine
  useEffect(() => {
    const unsub = sneakerStoreEngine.subscribe(() => {
      const state = sneakerStoreEngine.getState();
      if (isBoundRef.current) {
        uniformMutationEngine.applyCustomization(state.activeColorway, {
          duration: 0.38,
          ease: 'power2.out',
        });
      }
    });
    return () => unsub();
  }, []);

  const selectSegment = useCallback(
    (segment: SegmentId) => {
      if (store.selectedSegment !== segment) {
        playSegmentSelect();
        store.selectSegment(segment);
      }
    },
    [store]
  );

  const setColor = useCallback(
    (hexColor: string) => {
      playColorSwitch();
      store.setSegmentColor(store.selectedSegment, hexColor);
    },
    [store]
  );

  const setSegmentColor = useCallback(
    (segment: SegmentId, hexColor: string) => {
      playColorSwitch();
      store.setSegmentColor(segment, hexColor);
    },
    [store]
  );

  const setMaterialFinish = useCallback(
    (finishKey: FinishType) => {
      const finish = FINISH_PRESETS[finishKey];
      if (finish) {
        playClick();
        store.setSegmentMaterial(store.selectedSegment, finish.properties);
      }
    },
    [store]
  );

  const applyPreset = useCallback(
    (presetName: string) => {
      playColorSwitch();
      store.applyPreset(presetName);
    },
    [store]
  );

  return {
    selectedSegment: store.selectedSegment,
    currentPreset: store.currentPreset,
    customization: store.customization,
    activeColorway: store.activeColorway,
    selectSegment,
    setColor,
    setSegmentColor,
    setMaterialFinish,
    applyPreset,
    bindLoadedModel,
  };
}
