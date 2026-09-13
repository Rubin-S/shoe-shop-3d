/**
 * src/components/ui/StudioBackdrop.tsx
 *
 * Award-Winning Studio Cyclorama Atmosphere & Architectural Blueprint Framing.
 * Features:
 * - Luxury radial studio lighting vignette centered behind the 3D sneaker
 * - Ghosted editorial watermark typography (AEROPRO-X and dynamic stage title)
 * - Precision architectural framing border with corner crosshairs (+) and telemetry
 * - Atmospheric micro-grid texture for depth and material texture
 * - Dual-theme reactive for Daylight Luxury (Light) and Obsidian Onyx (Dark)
 */

import React from 'react';
import { useChoreographyStore } from '@/store/useChoreographyStore';
import { useThemeStore } from '@/store/useThemeStore';

const STAGE_WATERMARKS: Record<string, { num: string; title: string; coord: string }> = {
  hero: { num: '01', title: 'BEAUTY // OVERVIEW', coord: 'CAM [2.5, 1.4, 3.8]' },
  exploded: { num: '02', title: 'ANATOMICAL // DECONSTRUCT', coord: 'RIG [0.65, 0.22, 0.0]' },
  specs: { num: '03', title: 'TELEMETRY // SPECS', coord: 'MACRO [-1.5, 0.85, 3.2]' },
  customizer: { num: '04', title: 'ATELIER // WORKSHOP', coord: 'LIVE UNIFORM GPU' },
  buy: { num: '05', title: 'SERIALIZED // ACQUIRE', coord: 'EDITION // NFC CHIP' },
};

export const StudioBackdrop: React.FC = () => {
  const { activeStage, scrollProgress } = useChoreographyStore();
  const { isLight } = useThemeStore();

  const currentWatermark = STAGE_WATERMARKS[activeStage] || STAGE_WATERMARKS.hero;

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
      {/* 1. Studio Lighting Radial Spotlight (Vignette) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isLight
            ? 'opacity-100'
            : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(ellipse 85% 70% at 68% 45%, rgba(250, 248, 244, 0.95) 0%, rgba(240, 238, 233, 0.90) 45%, rgba(228, 225, 218, 0.96) 100%)',
        }}
      />
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          !isLight
            ? 'opacity-100'
            : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(ellipse 80% 65% at 68% 45%, rgba(24, 23, 22, 0.95) 0%, rgba(14, 13, 13, 0.97) 48%, rgba(6, 6, 8, 1) 100%)',
        }}
      />

      {/* 2. Dark Mode Cyber Glow Accent behind the shoe */}
      {!isLight && (
        <div
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-brand-lime/[0.03] blur-[140px] pointer-events-none transition-transform duration-1000"
          style={{
            transform: `translate(${(scrollProgress - 0.5) * 60}px, ${(scrollProgress - 0.5) * 40}px)`,
          }}
        />
      )}

      {/* 3. Architectural Micro-Grid Texture */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.045] pointer-events-none"
        style={{
          backgroundImage: isLight
            ? 'radial-gradient(#000000 1px, transparent 1px)'
            : 'radial-gradient(#FFFFFF 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* 4. Ghosted Master Editorial Watermark Typography */}
      <div className="absolute top-20 sm:top-24 left-4 sm:left-12 right-4 flex items-center justify-between pointer-events-none overflow-hidden">
        <span
          className={`font-display font-black text-[12vw] sm:text-[14vw] tracking-tighter uppercase leading-none opacity-[0.035] dark:opacity-[0.05] transition-opacity duration-500 whitespace-nowrap ${
            isLight ? 'stroke-text-light' : 'stroke-text-dark'
          }`}
          style={{ color: 'transparent' }}
        >
          AEROPRO-X
        </span>
        <span className="hidden xl:block font-mono text-xs tracking-[0.3em] uppercase opacity-[0.10] dark:opacity-[0.15] mr-8 text-neutral-900 dark:text-white">
          SERIES 01 // 240g
        </span>
      </div>

      {/* 5. Dynamic Scrolling Stage Watermark (Elevated to avoid bottom dock collision) */}
      <div className="absolute bottom-28 sm:bottom-32 right-6 sm:right-12 text-right pointer-events-none">
        <div className="flex items-baseline justify-end gap-3 opacity-[0.04] dark:opacity-[0.055] transition-all duration-700">
          <span className="font-mono text-3xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white">
            {currentWatermark.num}
          </span>
          <span className="font-display font-black text-xl sm:text-3xl tracking-tight text-neutral-900 dark:text-white uppercase">
            {currentWatermark.title}
          </span>
        </div>
      </div>

      {/* 6. Precision Architectural Blueprint Framing Border */}
      <div className="hidden sm:block absolute inset-4 sm:inset-6 lg:inset-8 border border-black/[0.04] dark:border-white/[0.04] rounded-[2rem] pointer-events-none">
        {/* Corner Precision Crosshairs (+) */}
        <div className="absolute top-3 left-4 text-neutral-400/40 dark:text-zinc-600/40 font-mono text-[10px] font-bold select-none">+</div>
        <div className="absolute top-3 right-4 text-neutral-400/40 dark:text-zinc-600/40 font-mono text-[10px] font-bold select-none">+</div>
        <div className="absolute bottom-3 left-4 text-neutral-400/40 dark:text-zinc-600/40 font-mono text-[10px] font-bold select-none">+</div>
        <div className="absolute bottom-3 right-4 text-neutral-400/40 dark:text-zinc-600/40 font-mono text-[10px] font-bold select-none">+</div>

        {/* Center Architectural Ticks */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 border-t border-black/10 dark:border-white/10" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 border-t border-black/10 dark:border-white/10" />
      </div>
    </div>
  );
};
