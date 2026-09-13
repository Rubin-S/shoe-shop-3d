/**
 * src/components/ui/CinematicPreloader.tsx
 *
 * Luxury Cinematic Preloader with brand reveal,
 * real-time telemetry ticker, and audio activation prompt.
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { playClick, startAmbient } from '@/utils/audio';

export interface CinematicPreloaderProps {
  isModelReady: boolean;
  onEnter: () => void;
}

const TELEMETRY_LOGS = [
  'INITIALIZING WEBGL 2.0 CONTEXT...',
  'COMPILING ACES FILMIC TONE MAPPING PIPELINE...',
  'GENERATING INTERLOCKING PROCEDURAL NORMAL MAPS...',
  'CALIBRATING NITROCELL SUPERCRITICAL CUSHION MATRIX...',
  'MOUNTING DUAL-CAMBER CARBON CHASSIS RIG...',
  'SYNCHRONIZING PBR UNIFORM MUTATION ENGINE...',
  'AEROPRO-X LAB ENGINE READY // SERIES 01 NOMINAL',
];

export const CinematicPreloader: React.FC<CinematicPreloaderProps> = ({
  isModelReady,
  onEnter,
}) => {
  const [progress, setProgress] = useState<number>(12);
  const [logIndex, setLogIndex] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          const inc = Math.floor(Math.random() * 8) + 4;
          return Math.min(90, prev + inc);
        }
        if (isModelReady) {
          return 100;
        }
        return prev;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isModelReady]);

  useEffect(() => {
    if (progress === 100) {
      setLogIndex(TELEMETRY_LOGS.length - 1);
    } else {
      const idx = Math.min(
        TELEMETRY_LOGS.length - 2,
        Math.floor((progress / 100) * (TELEMETRY_LOGS.length - 1))
      );
      setLogIndex(idx);
    }
  }, [progress]);

  const handleEnter = () => {
    playClick();
    startAmbient();
    setIsDismissed(true);
    setTimeout(() => {
      onEnter();
    }, 600);
  };

  const isReadyToEnter = progress >= 100 && isModelReady;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-12 bg-dark-950 text-white transition-opacity duration-700 select-none ${
        isDismissed ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, #101216 0%, #060709 100%)',
      }}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl">
            <span className="font-display font-black text-brand-lime tracking-tighter text-lg">
              AX
            </span>
          </div>
          <div>
            <h2 className="font-display font-bold text-xs tracking-widest uppercase text-white/90">
              AEROPRO-X LAB
            </h2>
            <p className="font-mono text-[9px] tracking-widest text-zinc-500 uppercase">
              Prototyping Atelier // 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-lime" />
          <span>HARDWARE ACCELERATED</span>
        </div>
      </div>

      {/* Center Monogram & Progress HUD */}
      <div className="flex flex-col items-center justify-center my-auto max-w-xl mx-auto text-center w-full">
        {/* Pulsing Monogram Ring */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-brand-lime/20 animate-ping opacity-60" />
          <div className="absolute inset-2 rounded-full border border-white/10 border-t-brand-lime animate-spin-slow" />
          <div className="absolute inset-4 rounded-full bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl shadow-glass flex items-center justify-center">
            <span className="font-display font-black text-3xl sm:text-4xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-brand-lime">
              AX
            </span>
          </div>
        </div>

        {/* Counter */}
        <div className="font-mono text-5xl sm:text-7xl font-bold tracking-tight text-white mb-3 tabular-nums">
          {progress}
          <span className="text-brand-lime text-3xl sm:text-4xl">%</span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-brand-lime to-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Dynamic Telemetry Log */}
        <div className="font-mono text-[10px] sm:text-[11px] text-zinc-400 tracking-wider h-6 flex items-center justify-center uppercase">
          <Sparkles className="w-3 h-3 text-brand-lime mr-2 animate-pulse" />
          <span>{TELEMETRY_LOGS[logIndex]}</span>
        </div>

        {/* Enter Button (Shown when ready or auto-prompt) */}
        {isReadyToEnter && (
          <button
            type="button"
            onClick={handleEnter}
            className="mt-8 px-7 py-3.5 rounded-full bg-brand-lime text-black font-mono font-bold text-xs tracking-widest uppercase hover:bg-white transition-all duration-300 shadow-glow-lime flex items-center gap-2.5 animate-bounce-slow active:scale-95"
          >
            <span>ENTER EXPERIENCE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-zinc-500 gap-2">
        <div>THREE.JS WEBGL RENDERER // 60 FPS CLAMPED DPR</div>
        <div className="flex items-center gap-3">
          <span>HEADPHONES RECOMMENDED</span>
          <span>•</span>
          <span>SPATIAL AUDIO SYNTHESIS</span>
        </div>
      </div>
    </div>
  );
};
