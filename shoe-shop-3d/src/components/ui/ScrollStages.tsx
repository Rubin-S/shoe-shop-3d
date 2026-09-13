/**
 * src/components/ui/ScrollStages.tsx
 *
 * 5-Stage Editorial Scroll Choreography Content Layers.
 * Built with GSAP ScrollTrigger anchors, luxury dual-theme typography,
 * architectural spec badges, and macro feature highlights.
 * Seamlessly adapts to Daylight Luxury (Light) and Obsidian Onyx (Dark).
 */

import React from 'react';
import { useChoreographyStore } from '@/store/useChoreographyStore';
import { BuySectionHUD } from './BuySectionHUD';
import { playHover, playClick } from '@/utils/audio';
import {
  Sparkles,
  ArrowDown,
  Layers,
  Cpu,
  ShieldCheck,
  Compass,
  SlidersHorizontal,
  Flame,
  Wind,
  Activity,
} from 'lucide-react';

export const ScrollStages: React.FC = () => {
  const { scrollToStage, activeHotspotId, selectHotspot } = useChoreographyStore();

  return (
    <div className="relative z-10 w-full pointer-events-none">
      {/* STAGE 1: HERO SECTION */}
      <section
        id="stage-hero"
        className="relative min-h-[100dvh] flex flex-col justify-between px-4 sm:px-8 lg:px-12 pt-24 sm:pt-28 pb-12 max-w-7xl mx-auto"
      >
        <div className="max-w-xl lg:max-w-lg pt-4 sm:pt-8 z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-lime/20 dark:bg-brand-lime/10 border border-brand-lime/40 dark:border-brand-lime/20 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-neutral-900 dark:text-brand-lime font-bold">
                Real-Time PBR Engine // Series 01
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-300 font-semibold">
                Atelier Edition // Beige White
              </span>
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.06] text-neutral-900 dark:text-white">
            GRAVITY<br />
            <span className="whitespace-nowrap">RE-ENGINEERED.</span>
          </h1>

          <p className="mt-4 text-neutral-600 dark:text-zinc-400 text-sm sm:text-base max-w-md font-sans leading-relaxed">
            Bone white tumbled calfskin, warm oatmeal accents, and vulcanized sail rubber
            engineered with real-time zero-recompile uniform customization.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 pointer-events-auto">
            <button
              type="button"
              onClick={() => scrollToStage('exploded')}
              className="px-6 py-3.5 rounded-full bg-neutral-900 text-white dark:bg-brand-lime dark:text-black font-mono font-bold text-xs tracking-widest uppercase hover:bg-black/80 dark:hover:bg-white transition-all duration-300 shadow-md dark:shadow-glow-lime flex items-center gap-2"
            >
              <span>DECONSTRUCT ANATOMY</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => scrollToStage('customizer')}
              className="px-6 py-3.5 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/15 text-neutral-900 dark:text-white font-mono text-xs tracking-widest uppercase transition-all duration-300 backdrop-blur-xl flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
              <span>CUSTOMIZER ATELIER</span>
            </button>
          </div>
        </div>

        {/* Bottom Hero Dock */}
        <div className="w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pointer-events-auto pt-8">
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-dark-900/80 border border-black/10 dark:border-white/10 backdrop-blur-xl max-w-md w-full flex items-center justify-between gap-4 shadow-lg dark:shadow-bezel">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-neutral-900 dark:text-brand-lime" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                  Carbon Matrix Chassis
                </h4>
                <p className="font-mono text-[10px] text-neutral-500 dark:text-zinc-400">
                  Dual-Camber Arch Stabilization
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs font-bold text-neutral-900 dark:text-brand-lime">240g</div>
              <div className="font-mono text-[9px] text-neutral-500 dark:text-zinc-500 uppercase tracking-widest">
                Net Mass
              </div>
            </div>
          </div>

          <div className="px-5 py-2.5 rounded-full bg-white/90 dark:bg-dark-900/90 border border-black/10 dark:border-white/10 backdrop-blur-2xl shadow-lg dark:shadow-glass flex items-center gap-3 text-neutral-700 dark:text-zinc-300 font-mono text-[11px] tracking-wider">
            <Compass className="w-4 h-4 text-neutral-900 dark:text-brand-lime animate-spin-slow" />
            <span>360° Interactive Orbit</span>
            <span className="text-neutral-400 dark:text-zinc-600">•</span>
            <span className="text-neutral-500 dark:text-zinc-400">Scroll to Explore Stages</span>
          </div>
        </div>
      </section>

      {/* STAGE 2: ANATOMY & EXPLODED VIEW */}
      <section
        id="stage-exploded"
        className="relative min-h-[100dvh] flex flex-col justify-center px-4 sm:px-8 py-20 max-w-7xl mx-auto"
      >
        <div className="max-w-xl lg:max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-4 backdrop-blur-md">
            <Layers className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-neutral-900 dark:text-brand-lime font-semibold">
              Stage 02 // Zero-G Deconstructed Rig
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight uppercase text-neutral-900 dark:text-white leading-[1.08]">
            ANATOMICAL<br />DECONSTRUCTION.
          </h2>

          <p className="mt-3 text-neutral-600 dark:text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
            Five modular sub-assemblies suspended in calibrated micro-gravity. Engineered
            for sub-millimeter kinetic alignment, dynamic thermal venting, and instantaneous torsional recovery.
          </p>

          {/* Module Spec Interactive Cards (Anchors for HUD Leader Lines) */}
          <div className="mt-6 space-y-2.5 max-w-md pointer-events-auto">
            {/* Card 01: Kevlar Dynamic Lacing (+28mm Elevation) */}
            <div
              id="hud-card-adaptive-laces"
              onClick={() => {
                selectHotspot(activeHotspotId === 'adaptive-laces' ? null : 'adaptive-laces');
                playClick();
              }}
              onMouseEnter={() => playHover()}
              className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-xl ${
                activeHotspotId === 'adaptive-laces'
                  ? 'bg-white dark:bg-dark-900 border-neutral-900 dark:border-brand-lime shadow-md dark:shadow-glow-lime scale-[1.02]'
                  : 'bg-white/80 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border-black/10 dark:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold transition-colors ${
                    activeHotspotId === 'adaptive-laces'
                      ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 text-neutral-800 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white'
                  }`}>
                    01
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-neutral-900 dark:text-white">
                      Kevlar Dynamic Harness
                    </h4>
                    <p className="font-mono text-[9.5px] text-neutral-500 dark:text-zinc-400">
                      Zoned lockdown tension lock // 1200 N
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[9.5px] font-semibold tracking-wider transition-colors ${
                    activeHotspotId === 'adaptive-laces'
                      ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-zinc-400'
                  }`}>
                    +28mm ELEV
                  </span>
                  <div className={`w-2 h-2 rounded-full transition-transform ${
                    activeHotspotId === 'adaptive-laces'
                      ? 'bg-neutral-900 dark:bg-brand-lime scale-125'
                      : 'bg-neutral-300 dark:bg-zinc-600 group-hover:scale-110'
                  }`} />
                </div>
              </div>
            </div>

            {/* Card 02: AeroWeave 3D Upper (+18mm Elevation) */}
            <div
              id="hud-card-upper-mesh"
              onClick={() => {
                selectHotspot(activeHotspotId === 'upper-mesh' ? null : 'upper-mesh');
                playClick();
              }}
              onMouseEnter={() => playHover()}
              className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-xl ${
                activeHotspotId === 'upper-mesh'
                  ? 'bg-white dark:bg-dark-900 border-neutral-900 dark:border-brand-lime shadow-md dark:shadow-glow-lime scale-[1.02]'
                  : 'bg-white/80 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border-black/10 dark:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold transition-colors ${
                    activeHotspotId === 'upper-mesh'
                      ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 text-neutral-800 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white'
                  }`}>
                    02
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-neutral-900 dark:text-white">
                      AeroWeave 3D Upper
                    </h4>
                    <p className="font-mono text-[9.5px] text-neutral-500 dark:text-zinc-400">
                      Adaptive thermal micro-matrix // 98.4 CFM
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[9.5px] font-semibold tracking-wider transition-colors ${
                    activeHotspotId === 'upper-mesh'
                      ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-zinc-400'
                  }`}>
                    +18mm ELEV
                  </span>
                  <div className={`w-2 h-2 rounded-full transition-transform ${
                    activeHotspotId === 'upper-mesh'
                      ? 'bg-neutral-900 dark:bg-brand-lime scale-125'
                      : 'bg-neutral-300 dark:bg-zinc-600 group-hover:scale-110'
                  }`} />
                </div>
              </div>
            </div>

            {/* Card 03: Kinetic Heel Counter & Accents (-5mm Stability Offset) */}
            <div
              id="hud-card-heel-accents"
              onClick={() => {
                selectHotspot(activeHotspotId === 'heel-accents' ? null : 'heel-accents');
                playClick();
              }}
              onMouseEnter={() => playHover()}
              className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-xl ${
                activeHotspotId === 'heel-accents'
                  ? 'bg-white dark:bg-dark-900 border-neutral-900 dark:border-brand-lime shadow-md dark:shadow-glow-lime scale-[1.02]'
                  : 'bg-white/80 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border-black/10 dark:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold transition-colors ${
                    activeHotspotId === 'heel-accents'
                      ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 text-neutral-800 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white'
                  }`}>
                    03
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-neutral-900 dark:text-white">
                      Kinetic Heel Counter & Blades
                    </h4>
                    <p className="font-mono text-[9.5px] text-neutral-500 dark:text-zinc-400">
                      Ergonomic TPU stabilization clamp // 0.92 Grip
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[9.5px] font-semibold tracking-wider transition-colors ${
                    activeHotspotId === 'heel-accents'
                      ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-zinc-400'
                  }`}>
                    -5mm STAB
                  </span>
                  <div className={`w-2 h-2 rounded-full transition-transform ${
                    activeHotspotId === 'heel-accents'
                      ? 'bg-neutral-900 dark:bg-brand-lime scale-125'
                      : 'bg-neutral-300 dark:bg-zinc-600 group-hover:scale-110'
                  }`} />
                </div>
              </div>
            </div>

            {/* Card 04: NitroCell Rebound Midsole (-14mm Base Offset) */}
            <div
              id="hud-card-nitro-cushion"
              onClick={() => {
                selectHotspot(activeHotspotId === 'nitro-cushion' ? null : 'nitro-cushion');
                playClick();
              }}
              onMouseEnter={() => playHover()}
              className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-xl ${
                activeHotspotId === 'nitro-cushion'
                  ? 'bg-white dark:bg-dark-900 border-neutral-900 dark:border-brand-lime shadow-md dark:shadow-glow-lime scale-[1.02]'
                  : 'bg-white/80 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border-black/10 dark:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold transition-colors ${
                    activeHotspotId === 'nitro-cushion'
                      ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 text-neutral-800 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white'
                  }`}>
                    04
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-neutral-900 dark:text-white">
                      NitroCell Rebound Midsole
                    </h4>
                    <p className="font-mono text-[9.5px] text-neutral-500 dark:text-zinc-400">
                      Supercritical nitrogen foam // 45C Soft
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[9.5px] font-semibold tracking-wider transition-colors ${
                    activeHotspotId === 'nitro-cushion'
                      ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-zinc-400'
                  }`}>
                    -14mm BASE
                  </span>
                  <div className={`w-2 h-2 rounded-full transition-transform ${
                    activeHotspotId === 'nitro-cushion'
                      ? 'bg-neutral-900 dark:bg-brand-lime scale-125'
                      : 'bg-neutral-300 dark:bg-zinc-600 group-hover:scale-110'
                  }`} />
                </div>
              </div>
            </div>

            {/* Card 05: Dual-Camber Carbon Flight Plate (-6mm Compression Offset) */}
            <div
              id="hud-card-carbon-plate"
              onClick={() => {
                selectHotspot(activeHotspotId === 'carbon-plate' ? null : 'carbon-plate');
                playClick();
              }}
              onMouseEnter={() => playHover()}
              className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-xl ${
                activeHotspotId === 'carbon-plate'
                  ? 'bg-white dark:bg-dark-900 border-neutral-900 dark:border-brand-lime shadow-md dark:shadow-glow-lime scale-[1.02]'
                  : 'bg-white/80 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border-black/10 dark:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold transition-colors ${
                    activeHotspotId === 'carbon-plate'
                      ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 text-neutral-800 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white'
                  }`}>
                    05
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-neutral-900 dark:text-white">
                      Dual-Camber Carbon Plate
                    </h4>
                    <p className="font-mono text-[9.5px] text-neutral-500 dark:text-zinc-400">
                      T800 torsional flight plate // 94.2% Return
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[9.5px] font-semibold tracking-wider transition-colors ${
                    activeHotspotId === 'carbon-plate'
                      ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-zinc-400'
                  }`}>
                    -6mm COMP
                  </span>
                  <div className={`w-2 h-2 rounded-full transition-transform ${
                    activeHotspotId === 'carbon-plate'
                      ? 'bg-neutral-900 dark:bg-brand-lime scale-125'
                      : 'bg-neutral-300 dark:bg-zinc-600 group-hover:scale-110'
                  }`} />
                </div>
              </div>
            </div>

            {/* Architectural Telemetry Footer Bar */}
            <div className="pt-2 flex items-center justify-between text-[9.5px] font-mono text-neutral-500 dark:text-zinc-400 border-t border-black/10 dark:border-white/10 px-1">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-neutral-900 dark:text-brand-lime animate-pulse" />
                <span className="uppercase tracking-widest font-semibold text-neutral-900 dark:text-brand-lime">ZERO-G STATUS: CALIBRATED</span>
              </div>
              <div className="flex items-center gap-2 tracking-wider">
                <span>MASS: 240g</span>
                <span>•</span>
                <span>SPAN: 420mm</span>
                <span>•</span>
                <span>±0.02mm</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAGE 3: TECH SPECS & INNOVATION */}
      <section
        id="stage-specs"
        className="relative min-h-[100dvh] flex flex-col justify-center px-4 sm:px-8 py-20 max-w-7xl mx-auto"
      >
        <div className="max-w-xl md:ml-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-4 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-neutral-900 dark:text-brand-lime font-semibold">
              Stage 03 // Telemetry & Specs
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight uppercase text-neutral-900 dark:text-white leading-tight">
            MACRO INNOVATION.
          </h2>

          <p className="mt-3 text-neutral-600 dark:text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
            Close-range inspection of our proprietary aerodynamic curvature and cellular foam matrices.
          </p>

          {/* 4 Feature Specification Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pointer-events-auto">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-dark-900/80 border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-lg dark:shadow-glass">
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-brand-lime/10 flex items-center justify-center text-neutral-900 dark:text-brand-lime mb-2.5">
                <Flame className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                94.2% Energy Return
              </h4>
              <p className="font-sans text-[11px] text-neutral-600 dark:text-zinc-400 mt-1 leading-relaxed">
                T800 aerospace carbon plate dynamically stores and snaps forward kinetic energy.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-dark-900/80 border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-lg dark:shadow-glass">
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-brand-lime/10 flex items-center justify-center text-neutral-900 dark:text-brand-lime mb-2.5">
                <Wind className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                AeroWeave Airflow
              </h4>
              <p className="font-sans text-[11px] text-neutral-600 dark:text-zinc-400 mt-1 leading-relaxed">
                Micro-channel air currents evacuate heat 3.2x faster than traditional mesh uppers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-dark-900/80 border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-lg dark:shadow-glass">
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-brand-lime/10 flex items-center justify-center text-neutral-900 dark:text-brand-lime mb-2.5">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                NitroCell Foam
              </h4>
              <p className="font-sans text-[11px] text-neutral-600 dark:text-zinc-400 mt-1 leading-relaxed">
                Supercritical nitrogen injection produces closed-cell ultra-plush 45C durometer cushioning.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-dark-900/80 border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-lg dark:shadow-glass">
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-brand-lime/10 flex items-center justify-center text-neutral-900 dark:text-brand-lime mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                0.92 Friction Wet Grip
              </h4>
              <p className="font-sans text-[11px] text-neutral-600 dark:text-zinc-400 mt-1 leading-relaxed">
                12-Chevron vulcanized compound grips tarmac, court, and wet polished marble.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STAGE 4: INTERACTIVE CUSTOMIZER WORKSHOP */}
      <section
        id="stage-customizer"
        className="relative min-h-[100dvh] flex flex-col justify-start sm:justify-center px-4 sm:px-8 py-20 max-w-7xl mx-auto"
      >
        <div className="max-w-md pt-8 sm:pt-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-lime/20 dark:bg-brand-lime/10 border border-brand-lime/40 dark:border-brand-lime/20 mb-4 backdrop-blur-md">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-neutral-900 dark:text-brand-lime font-semibold">
              Stage 04 // Bespoke Atelier
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight uppercase text-neutral-900 dark:text-white leading-tight">
            CUSTOMIZER WORKSHOP.
          </h2>

          <p className="mt-3 text-neutral-600 dark:text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
            Fully re-assembled and ready for creation. Select segments, test curated colorway presets,
            and modify PBR material finishes with instant zero-recompile GPU shaders.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 backdrop-blur-xl text-xs font-mono text-neutral-700 dark:text-zinc-300 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-brand-lime">
              <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-brand-lime animate-ping" />
              <span className="font-bold">LIVE UNIFORM MUTATION ACTIVE</span>
            </div>
            <p className="text-neutral-500 dark:text-zinc-400 text-[11px]">
              Use the control panel on the right to customize materials in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* STAGE 5: E-COMMERCE SHOWCASE / BUY */}
      <section
        id="stage-buy"
        className="relative min-h-[100dvh] flex flex-col justify-center items-start px-4 sm:px-8 py-20 max-w-7xl mx-auto"
      >
        <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-4 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-neutral-900 dark:text-brand-lime font-semibold">
                Stage 05 // Serialized Acquisition
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight uppercase text-neutral-900 dark:text-white leading-tight">
              MAKE IT YOURS.
            </h2>

            <p className="mt-3 text-neutral-600 dark:text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
              Every customized pair is built to your individual specification and serialized with an
              embedded tamper-proof NFC authenticity chip.
            </p>
          </div>

          {/* Buy Section HUD */}
          <BuySectionHUD />
        </div>
      </section>
    </div>
  );
};
