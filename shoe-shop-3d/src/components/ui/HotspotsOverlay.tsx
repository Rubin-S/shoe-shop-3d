/**
 * src/components/ui/HotspotsOverlay.tsx
 *
 * 3D Hotspot Screen Space Interactive Projection Overlay.
 * Renders precision pins synced with Three.js camera projection,
 * micro-annotations, and expandable architectural cards.
 * Dual-theme adaptive (Daylight Luxury Light and Obsidian Onyx Dark).
 */

import React from 'react';
import { HOTSPOT_ITEMS, HotspotItem } from '@/components/3d/ChoreographyConfig';
import { useChoreographyStore, useHotspotsStore } from '@/store/useChoreographyStore';
import { X, Activity, ChevronRight } from 'lucide-react';

export interface HotspotsOverlayProps {
  screenPositions?: Record<string, { x: number; y: number; visible: boolean }>;
}

export const HotspotsOverlay: React.FC<HotspotsOverlayProps> = ({ screenPositions: propPositions }) => {
  const { activeHotspotId, selectHotspot, activeStage } = useChoreographyStore();
  const storePositions = useHotspotsStore();
  const screenPositions = propPositions || storePositions;

  const isEnabledInStage = activeStage === 'specs';

  if (!isEnabledInStage) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {HOTSPOT_ITEMS.map((hotspot: HotspotItem, idx: number) => {
        const coords = screenPositions[hotspot.id];
        if (!coords || !coords.visible) return null;

        const isActive = activeHotspotId === hotspot.id;

        return (
          <div
            key={hotspot.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-300"
            style={{
              left: `${coords.x}px`,
              top: `${coords.y}px`,
            }}
          >
            {/* Hotspot Pin Anchor */}
            <button
              type="button"
              onClick={() => selectHotspot(isActive ? null : hotspot.id)}
              className="group relative flex items-center justify-center w-8 h-8 focus:outline-none"
              aria-label={`Inspect ${hotspot.title}`}
            >
              {/* Sonar Ping Ring */}
              <span className="absolute inset-0 rounded-full bg-neutral-900/20 dark:bg-brand-lime/20 animate-ping opacity-75 group-hover:opacity-100" />

              {/* Outer Ring */}
              <span
                className={`w-6 h-6 rounded-full border transition-all duration-300 flex items-center justify-center backdrop-blur-md ${
                  isActive
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-brand-lime dark:bg-brand-lime dark:text-black scale-110 shadow-md dark:shadow-glow-lime'
                    : 'border-black/20 bg-white/90 text-neutral-900 dark:border-white/30 dark:bg-dark-950/80 dark:text-white/90 hover:scale-105 shadow-sm'
                }`}
              >
                <span className="font-mono text-[9px] font-bold">
                  0{idx + 1}
                </span>
              </span>
            </button>

            {/* Expandable Glassmorphic Callout Card */}
            {isActive && (
              <div
                className="absolute left-6 top-6 sm:left-8 sm:top-0 w-72 sm:w-80 p-4 rounded-2xl bg-white/95 dark:bg-dark-900/95 border border-black/10 dark:border-white/15 backdrop-blur-2xl shadow-xl dark:shadow-glass z-20 animate-scale-in text-neutral-900 dark:text-white"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-black/10 dark:border-white/10 mb-3">
                  <div className="flex items-center gap-1.5 text-neutral-900 dark:text-brand-lime font-mono text-[10px] uppercase tracking-wider font-bold">
                    <Activity className="w-3 h-3" />
                    <span>SPEC 0{idx + 1} // {hotspot.subtitle}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectHotspot(null);
                    }}
                    className="w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Content */}
                <h4 className="font-display font-bold text-sm text-neutral-900 dark:text-white mb-1.5">
                  {hotspot.title}
                </h4>
                <p className="text-xs text-neutral-600 dark:text-zinc-300 font-sans leading-relaxed mb-3">
                  {hotspot.description}
                </p>

                {/* Stat Pill */}
                <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-neutral-500 dark:text-zinc-400">{hotspot.statLabel}:</span>
                  <span className="font-bold text-neutral-900 dark:text-brand-lime">
                    {hotspot.statValue}
                  </span>
                </div>

                {/* Action CTA */}
                <div className="mt-3 pt-2 border-t border-black/10 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">
                    Rig Component Focus
                  </span>
                  <span className="text-[10px] font-mono text-neutral-900 dark:text-brand-lime flex items-center gap-1 font-semibold">
                    <span>Active</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
