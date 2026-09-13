/**
 * src/components/ui/CustomizerHUD.tsx
 *
 * Double-Bezel Luxury Glassmorphic Real-Time Sneaker Customizer Panel.
 * Designed according to Awwwards-tier design standards:
 * - Nested Doppelrand (Double-Bezel) architecture with machined tactile depth
 * - 4 Curated Colorway Presets with live 4-quadrant preview thumbnails
 * - 4-Segment Anatomical Selector Tabs (Upper, Sole, Accents, Laces) with live color dots
 * - 16-Swatch Luxury Color Palette, native color dropper, and monospace hex validator
 * - 4 Material Finish Selector Buttons (Matte, Gloss, Metallic, Iridescent)
 * - Micro-SFX audio feedback on interaction
 * - Responsive collapsible panel for mobile viewports
 * - Full dual-theme styling (Daylight Light & Obsidian Dark)
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  COLORWAYS_LIST,
  COLORWAY_PRESETS,
  FINISH_PRESETS,
  CURATED_SWATCHES,
  FinishType,
  validateHex,
  normalizeHex,
  detectActiveFinish,
} from '@/utils/colorways';

const BEIGE_WHITE_PRESET = {
  id: 'beige-white',
  name: 'Beige White',
  tagline: 'Luxury Sail Atelier',
  description: 'Bespoke off-white tumbled leather with warm oatmeal outsole and champagne titanium accents.',
  customization: {
    upper: { ...COLORWAY_PRESETS['Beige White'].upper },
    sole: { ...COLORWAY_PRESETS['Beige White'].sole },
    accents: { ...COLORWAY_PRESETS['Beige White'].accents },
    laces: { ...COLORWAY_PRESETS['Beige White'].laces },
  },
};

const HUD_COLORWAYS = [
  BEIGE_WHITE_PRESET,
  ...COLORWAYS_LIST,
];

import { playColorSwitch, playSegmentSelect, playClick } from '@/utils/audio';
import { SegmentId, SegmentCustomization, SneakerCustomization } from '@/types/sneaker';
import { useSneakerStore } from '@/store/useSneakerStore';
import {
  Sparkles,
  Palette,
  Layers,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sliders,
  Eye,
} from 'lucide-react';

export interface CustomizerHUDProps {
  customization?: SneakerCustomization;
  currentPreset?: string;
  activeSegment?: SegmentId;
  onSelectSegment?: (segment: SegmentId) => void;
  onUpdateSegment?: (segment: SegmentId, patch: Partial<SegmentCustomization>) => void;
  onApplyPreset?: (presetName: string) => void;
  soundEffects?: {
    playColorSwitch?: () => void;
    playSegmentSelect?: () => void;
    playClick?: () => void;
  };
  className?: string;
  isCollapsible?: boolean;
}

const SEGMENT_CONFIGS: { id: SegmentId; label: string; sub: string }[] = [
  { id: 'upper', label: 'Upper', sub: 'Mesh & Leather' },
  { id: 'sole', label: 'Sole', sub: 'NitroCell Foam' },
  { id: 'accents', label: 'Accents', sub: 'Heel Clip & Trim' },
  { id: 'laces', label: 'Laces', sub: 'Braided Harness' },
];

export const CustomizerHUD: React.FC<CustomizerHUDProps> = ({
  customization: externalCustomization,
  currentPreset: externalCurrentPreset,
  activeSegment: externalActiveSegment,
  onSelectSegment,
  onUpdateSegment,
  onApplyPreset,
  soundEffects,
  className = '',
  isCollapsible = true,
}) => {
  const triggerColorSwitch = useCallback(() => {
    if (soundEffects?.playColorSwitch) {
      soundEffects.playColorSwitch();
    } else {
      playColorSwitch();
    }
  }, [soundEffects]);

  const triggerSegmentSelect = useCallback(() => {
    if (soundEffects?.playSegmentSelect) {
      soundEffects.playSegmentSelect();
    } else {
      playSegmentSelect();
    }
  }, [soundEffects]);

  const triggerClick = useCallback(() => {
    if (soundEffects?.playClick) {
      soundEffects.playClick();
    } else {
      playClick();
    }
  }, [soundEffects]);

  const store = useSneakerStore();

  const customization = externalCustomization || store.activeColorway;
  const currentPreset = externalCurrentPreset || store.currentPreset;
  const activeSegment = externalActiveSegment || store.selectedSegment;

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [customHexInput, setCustomHexInput] = useState<string>('');
  const [hexInputError, setHexInputError] = useState<string | null>(null);
  const nativeColorPickerRef = useRef<HTMLInputElement>(null);

  const currentSegmentData: SegmentCustomization = useMemo(() => {
    return (
      customization[activeSegment] || {
        color: '#FFFFFF',
        roughness: 0.5,
        metalness: 0.1,
      }
    );
  }, [customization, activeSegment]);

  const activeFinish = useMemo(
    () => detectActiveFinish(currentSegmentData),
    [currentSegmentData]
  );

  const handleSegmentChange = useCallback(
    (segment: SegmentId) => {
      triggerSegmentSelect();
      if (onSelectSegment) {
        onSelectSegment(segment);
      } else {
        store.selectSegment(segment);
      }
    },
    [onSelectSegment, store, triggerSegmentSelect]
  );

  const handleColorChange = useCallback(
    (hexColor: string) => {
      const normalized = normalizeHex(hexColor);
      triggerColorSwitch();
      if (onUpdateSegment) {
        onUpdateSegment(activeSegment, { color: normalized });
      } else {
        store.updateSneakerSegment(activeSegment, { color: normalized });
      }
    },
    [activeSegment, onUpdateSegment, store, triggerColorSwitch]
  );

  const handleFinishChange = useCallback(
    (finishId: FinishType) => {
      triggerClick();
      const finishConfig = FINISH_PRESETS[finishId];
      if (!finishConfig) return;

      if (onUpdateSegment) {
        onUpdateSegment(activeSegment, { ...finishConfig.properties });
      } else {
        store.updateSneakerSegment(activeSegment, { ...finishConfig.properties });
      }
    },
    [activeSegment, onUpdateSegment, store, triggerClick]
  );

  const handlePresetApply = useCallback(
    (presetName: string) => {
      triggerColorSwitch();
      if (onApplyPreset) {
        onApplyPreset(presetName);
      } else {
        store.applyPreset(presetName);
      }
    },
    [onApplyPreset, store, triggerColorSwitch]
  );

  const handleHexSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = customHexInput.trim();
      const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

      if (validateHex(withHash)) {
        handleColorChange(withHash);
        setCustomHexInput('');
        setHexInputError(null);
      } else {
        setHexInputError('Invalid hex (e.g. #D4FF00 or #F0F)');
      }
    },
    [customHexInput, handleColorChange]
  );

  return (
    <div
      className={`double-bezel-outer w-full max-w-md pointer-events-auto transition-all duration-300 ${className}`}
      data-testid="customizer-hud"
    >
      <div className="double-bezel-inner p-4 sm:p-5 flex flex-col gap-4 text-neutral-900 dark:text-white">
        {/* HUD Top Bar */}
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-brand-lime animate-pulse shadow-sm dark:shadow-glow-lime" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-900 dark:text-brand-lime font-bold">
                  Lab Atelier
                </span>
                <span className="text-neutral-400 dark:text-zinc-600 font-mono text-[10px]">•</span>
                <span className="font-mono text-[10px] tracking-wider text-neutral-500 dark:text-zinc-400 uppercase">
                  Spec APX-01
                </span>
              </div>
              <h3 className="font-display text-sm font-bold tracking-wide text-neutral-900 dark:text-white uppercase">
                Customizer HUD
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active Preset Pill */}
            <div className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-white/40" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-700 dark:text-zinc-300">
                {currentPreset}
              </span>
            </div>

            {/* Collapsible toggle */}
            {isCollapsible && (
              <button
                type="button"
                onClick={() => {
                  triggerClick();
                  setIsCollapsed((prev) => !prev);
                }}
                className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center transition-colors text-neutral-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                title={isCollapsed ? 'Expand Customizer' : 'Collapse Customizer'}
                aria-label="Toggle Customizer Visibility"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Main Body */}
        {!isCollapsed && (
          <>
            {/* Curated Colorway Presets */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
                  Curated Colorways
                </span>
                {currentPreset !== 'Custom' && (
                  <button
                    type="button"
                    onClick={() => handlePresetApply('Beige White')}
                    className="font-mono text-[10px] text-neutral-500 hover:text-black dark:text-zinc-500 dark:hover:text-brand-lime flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Baseline
                  </button>
                )}
              </div>

              {/* Preset Selector Pills */}
              <div className="grid grid-cols-2 gap-2">
                {HUD_COLORWAYS.map((preset) => {
                  const isActive = currentPreset === preset.name;
                  const { upper, sole, accents, laces } = preset.customization;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetApply(preset.name)}
                      className={`group relative p-2.5 rounded-xl border text-left transition-all duration-200 flex items-center gap-2.5 ${
                        isActive
                          ? 'bg-neutral-900/10 dark:bg-white/10 border-neutral-900 dark:border-brand-lime shadow-sm dark:shadow-glow-lime'
                          : 'bg-black/[0.03] dark:bg-white/[0.02] border-black/10 dark:border-white/5 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] hover:border-black/20 dark:hover:border-white/15'
                      }`}
                    >
                      {/* 4-Quadrant Swatch Preview */}
                      <div className="w-6 h-6 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 border border-black/15 dark:border-white/20 flex-shrink-0 shadow-sm">
                        <div style={{ backgroundColor: upper.color }} title={`Upper: ${upper.color}`} />
                        <div style={{ backgroundColor: accents.color }} title={`Accents: ${accents.color}`} />
                        <div style={{ backgroundColor: sole.color }} title={`Sole: ${sole.color}`} />
                        <div style={{ backgroundColor: laces.color }} title={`Laces: ${laces.color}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`font-display text-xs font-semibold truncate ${
                            isActive
                              ? 'text-neutral-900 dark:text-brand-lime'
                              : 'text-neutral-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white'
                          }`}
                        >
                          {preset.name}
                        </div>
                        <div className="font-mono text-[9px] text-neutral-500 dark:text-zinc-500 truncate">
                          {preset.tagline.split('&')[0]}
                        </div>
                      </div>

                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-brand-lime animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Segment Selector Tabs */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
                Active Segment
              </span>

              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/5">
                {SEGMENT_CONFIGS.map((seg) => {
                  const isActive = activeSegment === seg.id;
                  const segColor = customization[seg.id]?.color || '#ffffff';

                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => handleSegmentChange(seg.id)}
                      className={`relative py-2 px-1.5 rounded-lg text-center transition-all duration-200 flex flex-col items-center gap-1 ${
                        isActive
                          ? 'bg-white dark:bg-white/15 text-neutral-900 dark:text-white font-semibold shadow border border-black/10 dark:border-white/20'
                          : 'text-neutral-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-black/20 dark:border-white/30 shadow-sm transition-transform group-hover:scale-110"
                        style={{ backgroundColor: segColor }}
                      />
                      <span className="font-display text-[11px] tracking-wide uppercase">
                        {seg.label}
                      </span>
                      <span className="font-mono text-[8px] text-neutral-400 dark:text-zinc-500 truncate max-w-full">
                        {seg.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Swatch Palette */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
                  Colorway Palette
                </span>
                <div className="font-mono text-[10px] text-neutral-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="text-neutral-400 dark:text-zinc-500">HEX:</span>
                  <span className="text-neutral-900 dark:text-brand-lime font-bold">
                    {currentSegmentData.color.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Swatch Grid */}
              <div className="grid grid-cols-8 gap-2 p-2.5 rounded-xl bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/5">
                {CURATED_SWATCHES.map((swatch) => {
                  const isSelected =
                    normalizeHex(currentSegmentData.color) === normalizeHex(swatch.hex);

                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => handleColorChange(swatch.hex)}
                      title={`${swatch.name} (${swatch.hex})`}
                      className={`relative w-8 h-8 rounded-full border border-black/10 dark:border-white/20 transition-all duration-200 flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-neutral-900 dark:ring-brand-lime ring-offset-2 ring-offset-[#F8F9FA] dark:ring-offset-[#0B0C0E] scale-110 shadow-md dark:shadow-glow-lime'
                          : 'hover:scale-105 hover:border-black/30 dark:hover:border-white/40'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isSelected && (
                        <Check
                          className={`w-3.5 h-3.5 drop-shadow-md ${
                            ['#ffffff', '#f4efe6', '#d4ff00', '#20e3b2'].includes(
                              swatch.hex.toLowerCase()
                            )
                              ? 'text-black'
                              : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Dropper & Hex Input */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => nativeColorPickerRef.current?.click()}
                    className="h-9 px-3 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 flex items-center gap-2 transition-colors text-neutral-800 hover:text-black dark:text-zinc-300 dark:hover:text-white"
                    title="Open Native Color Wheel"
                  >
                    <div
                      className="w-4 h-4 rounded border border-black/20 dark:border-white/30"
                      style={{ backgroundColor: currentSegmentData.color }}
                    />
                    <span className="font-mono text-xs">Wheel</span>
                  </button>
                  <input
                    ref={nativeColorPickerRef}
                    type="color"
                    value={normalizeHex(currentSegmentData.color)}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="sr-only"
                    aria-label="Native Color Input"
                  />
                </div>

                <form onSubmit={handleHexSubmit} className="flex-1 flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={customHexInput}
                      onChange={(e) => {
                        setCustomHexInput(e.target.value);
                        setHexInputError(null);
                      }}
                      placeholder={`#${normalizeHex(currentSegmentData.color).replace('#', '')}`}
                      maxLength={7}
                      className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 focus:border-neutral-900 dark:focus:border-brand-lime focus:outline-none rounded-lg px-3 py-1.5 font-mono text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 uppercase tracking-widest transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-9 px-3 rounded-lg bg-neutral-900 text-white hover:bg-black dark:bg-white/10 dark:hover:bg-brand-lime dark:hover:text-black border border-black/10 dark:border-white/10 font-mono text-xs font-semibold tracking-wider uppercase transition-all duration-200"
                  >
                    Apply
                  </button>
                </form>
              </div>

              {hexInputError && (
                <span className="text-[10px] font-mono text-rose-500 tracking-wide">
                  {hexInputError}
                </span>
              )}
            </div>

            {/* Material Finish */}
            <div className="flex flex-col gap-2 pt-1 border-t border-black/10 dark:border-white/5 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
                  Material Finish
                </span>
                <span className="font-mono text-[10px] text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                  {FINISH_PRESETS[activeFinish as FinishType]?.label || 'Bespoke'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {(['matte', 'gloss', 'metallic', 'iridescent'] as FinishType[]).map((fKey) => {
                  const finish = FINISH_PRESETS[fKey];
                  const isSelected = activeFinish === fKey;

                  return (
                    <button
                      key={finish.id}
                      type="button"
                      onClick={() => handleFinishChange(fKey)}
                      className={`p-2 rounded-xl border text-center transition-all duration-200 flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-neutral-900/10 dark:bg-brand-lime/10 border-neutral-900 dark:border-brand-lime text-neutral-900 dark:text-brand-lime shadow-sm dark:shadow-glow-lime'
                          : 'bg-black/[0.03] dark:bg-white/[0.03] border-black/10 dark:border-white/5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-neutral-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-200'
                      }`}
                    >
                      <span className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                        {finish.badge}
                      </span>
                      <span className="font-display text-xs font-bold tracking-wide uppercase">
                        {finish.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Telemetry Status Bar */}
            <div className="pt-2 border-t border-black/10 dark:border-white/5 flex items-center justify-between text-neutral-500 dark:text-zinc-500 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3 text-neutral-900 dark:text-brand-lime" />
                <span>ACTIVE: {activeSegment.toUpperCase()}</span>
              </div>
              <div>
                R:{currentSegmentData.roughness?.toFixed(2) || '0.50'} M:
                {currentSegmentData.metalness?.toFixed(2) || '0.00'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
