/**
 * src/App.tsx
 *
 * AEROPRO-X LAB 3D Sneaker Shop Landing Page.
 * Full Award-Winning Experience:
 * - Three.js WebGL Canvas with PBR Material System & Procedural Sneaker Assembly
 * - 5-Stage GSAP Scroll Choreography with ScrollTrigger & Smooth Camera Interpolation
 * - Anatomical Exploded View with Precision Offsets
 * - 3D-to-2D Interactive Hotspots Projection System
 * - Real-Time Zero-Recompile Customizer HUD Workshop
 * - Floating E-Commerce Sizing & Stock HUD with Live Inventory Ticker
 * - Slide-Out Cart Drawer with Promo Codes and Simulated Bespoke Checkout
 * - Cinematic Preloader, Magnetic Custom Cursor, and Web Audio Atmosphere
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { SneakerLoadResult } from '@/types/sneaker';
import { CustomizerHUD } from '@/components/ui/CustomizerHUD';
import { useSneakerCustomizer } from '@/hooks/useSneakerCustomizer';
import { audioEngine, playClick } from '@/utils/audio';
import { useCartStore } from '@/store/useCartStore';
import { useChoreographyStore, choreographyStoreEngine } from '@/store/useChoreographyStore';
import { StageName } from '@/components/3d/ChoreographyConfig';
import { sneakerStoreEngine } from '@/store/useSneakerStore';
import { CinematicPreloader } from '@/components/ui/CinematicPreloader';
import { HotspotsOverlay } from '@/components/ui/HotspotsOverlay';
import { AnatomyHUDOverlay } from '@/components/ui/AnatomyHUDOverlay';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { CartDrawer } from '@/components/ui/CartDrawer';
import { ScrollStages } from '@/components/ui/ScrollStages';
import { StudioBackdrop } from '@/components/ui/StudioBackdrop';
import { useThemeStore } from '@/store/useThemeStore';
import {
  Volume2,
  VolumeX,
  ShoppingBag,
  SlidersHorizontal,
  Sun,
  Moon,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const NAV_STAGES: { id: StageName; label: string }[] = [
  { id: 'hero', label: 'Overview' },
  { id: 'exploded', label: 'Anatomy' },
  { id: 'specs', label: 'Specs' },
  { id: 'customizer', label: 'Atelier' },
  { id: 'buy', label: 'Acquire' },
];

export const App: React.FC = () => {
  const [modelData, setModelData] = useState<SneakerLoadResult | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => audioEngine.isMuted);
  const [isCustomizerManuallyOpen, setIsCustomizerManuallyOpen] = useState<boolean>(false);
  const [isPreloaderActive, setIsPreloaderActive] = useState<boolean>(true);

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const { isLight, toggleTheme } = useThemeStore();
  const customizer = useSneakerCustomizer();
  const cart = useCartStore();
  const choreo = useChoreographyStore();

  const handleModelLoaded = useCallback(
    (result: SneakerLoadResult) => {
      setModelData(result);
      customizer.bindLoadedModel(result);
      // Refresh ScrollTrigger once DOM and 3D geometries are settled
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    },
    [customizer]
  );

  const handleToggleMute = useCallback(() => {
    const nextMute = audioEngine.toggleMute();
    setIsMuted(nextMute);
  }, []);

  // GSAP ScrollTrigger timeline binding for 5-stage storytelling (created once on mount)
  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container) return;

    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.3,
      onUpdate: (self) => {
        choreographyStoreEngine.setScrollProgress(self.progress);
      },
    });

    const unsubScrollDispatcher = choreographyStoreEngine.registerScrollDispatcher((stage: StageName) => {
      const el = document.getElementById(`stage-${stage}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => {
      scrollTriggerInstance.kill();
      unsubScrollDispatcher();
    };
  }, []);

  // Initialize default colorway to luxury Beige White as requested
  useEffect(() => {
    sneakerStoreEngine.applyPreset('Beige White');
  }, []);

  // Determine whether Customizer HUD should be open
  // Open automatically when scrolled to Stage 4 (customizer workshop), or when manually toggled
  const isCustomizerVisible =
    choreo.activeStage === 'customizer' || isCustomizerManuallyOpen;

  return (
    <main
      ref={mainContainerRef}
      className="relative w-full min-h-[500dvh] bg-[#F8F9FA] dark:bg-dark-950 text-neutral-900 dark:text-white selection:bg-brand-lime selection:text-black transition-colors duration-300"
    >
      {/* Cinematic Entrance Preloader */}
      {isPreloaderActive && (
        <CinematicPreloader
          isModelReady={!!modelData}
          onEnter={() => setIsPreloaderActive(false)}
        />
      )}

      {/* Luxury Fluid Custom Cursor Follower */}
      <CustomCursor />

      {/* Award-Winning Studio Cyclorama Atmosphere & Blueprint Framing */}
      <StudioBackdrop />

      {/* Fixed 3D WebGL Three.js Canvas Layer */}
      <SceneCanvas
        onModelLoaded={handleModelLoaded}
        isInteractive={true}
      />

      {/* 3D Interactive Hotspot Screen Space Pins */}
      <HotspotsOverlay />

      {/* Stage 2 Precision SVG HUD Leader Lines & Mechanical Calipers */}
      <AnatomyHUDOverlay />

      {/* Floating Glassmorphic Top Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-30 px-4 sm:px-8 py-4 sm:py-5 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
          {/* Brand Monogram & Title */}
          <button
            type="button"
            onClick={() => choreo.scrollToStage('hero')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 group-hover:border-brand-lime/40 flex items-center justify-center shadow-sm dark:shadow-bezel backdrop-blur-xl transition-colors">
              <span className="font-display font-black text-neutral-900 dark:text-brand-lime tracking-tighter text-lg">
                AX
              </span>
            </div>
            <div>
              <h1 className="font-display font-bold text-xs tracking-widest uppercase text-neutral-900 dark:text-white/90">
                AEROPRO-X LAB
              </h1>
              <p className="font-mono text-[9px] tracking-widest text-neutral-500 dark:text-zinc-400 uppercase">
                Series 01 // Titanium Nitro
              </p>
            </div>
          </button>

          {/* 5-Stage Storytelling Nav Switcher */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-white/80 dark:bg-dark-900/80 border border-black/10 dark:border-white/10 backdrop-blur-2xl shadow-lg dark:shadow-glass font-mono text-[11px]">
            {NAV_STAGES.map((s) => {
              const isActive = choreo.activeStage === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => choreo.scrollToStage(s.id)}
                  className={`px-3.5 py-1.5 rounded-full transition-all duration-300 uppercase tracking-wider ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-brand-lime dark:text-black font-bold shadow-md dark:shadow-glow-lime'
                      : 'text-neutral-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Right Utilities & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Interactive Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center transition-all duration-300 text-neutral-700 dark:text-zinc-300 hover:text-black dark:hover:text-white backdrop-blur-xl shadow-sm dark:shadow-bezel"
              aria-label={isLight ? 'Switch to Dark Mode (Obsidian)' : 'Switch to Light Mode (Daylight)'}
              title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            >
              {isLight ? (
                <Moon className="w-4 h-4 text-neutral-800 transition-transform duration-300 hover:-rotate-12" />
              ) : (
                <Sun className="w-4 h-4 text-brand-lime transition-transform duration-300 hover:rotate-45" />
              )}
            </button>

            {/* Customizer Panel Quick Toggle */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setIsCustomizerManuallyOpen((prev) => !prev);
              }}
              className={`px-3.5 py-2 rounded-full border text-xs font-mono tracking-wider transition-all duration-300 backdrop-blur-xl shadow-sm dark:shadow-bezel flex items-center gap-2 ${
                isCustomizerVisible
                  ? 'bg-neutral-900 text-white dark:bg-brand-lime/15 dark:border-brand-lime dark:text-brand-lime dark:shadow-glow-lime'
                  : 'bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border-black/10 dark:border-white/10 text-neutral-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
              }`}
              title="Toggle Customizer Workshop Panel"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline uppercase">
                {isCustomizerVisible ? 'Atelier Open' : 'Customizer'}
              </span>
            </button>

            {/* Shopping Bag Drawer Button */}
            <button
              type="button"
              onClick={cart.openCart}
              className="relative px-3.5 py-2 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-xs font-mono tracking-wider transition-all duration-300 backdrop-blur-xl shadow-sm dark:shadow-bezel flex items-center gap-2 text-neutral-900 dark:text-white"
              title="View Shopping Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" />
              <span className="hidden sm:inline font-bold">BAG</span>
              {cart.totalItems > 0 && (
                <span className="w-4 h-4 rounded-full bg-neutral-900 text-white dark:bg-brand-lime dark:text-black font-bold text-[10px] flex items-center justify-center font-mono animate-scale-in">
                  {cart.totalItems}
                </span>
              )}
            </button>

            {/* Web Audio Mute Toggle */}
            <button
              type="button"
              onClick={handleToggleMute}
              className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center transition-colors text-neutral-600 dark:text-zinc-400 hover:text-black dark:hover:text-white backdrop-blur-xl shadow-sm dark:shadow-bezel"
              aria-label={isMuted ? 'Unmute Audio Engine' : 'Mute Audio Engine'}
              title={isMuted ? 'Unmute Procedural Audio' : 'Mute Procedural Audio'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-neutral-400 dark:text-zinc-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-neutral-900 dark:text-brand-lime" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Customizer HUD Panel (Pinned / Visible on Right) */}
      {isCustomizerVisible && (
        <aside className="fixed top-20 sm:top-24 right-4 sm:right-8 z-30 max-w-[390px] w-[calc(100%-2rem)] sm:w-full max-h-[calc(100dvh-7rem)] overflow-y-auto pointer-events-auto custom-scrollbar animate-slide-in-right">
          <CustomizerHUD
            customization={customizer.activeColorway}
            currentPreset={customizer.currentPreset}
            activeSegment={customizer.selectedSegment}
            onSelectSegment={customizer.selectSegment}
            onUpdateSegment={(seg, patch) => {
              if (patch.color) customizer.setSegmentColor(seg, patch.color);
              sneakerStoreEngine.updateSneakerSegment(seg, patch);
            }}
            onApplyPreset={customizer.applyPreset}
            isCollapsible={true}
          />
        </aside>
      )}

      {/* 5-Stage Storytelling Scroll Content Layers */}
      <ScrollStages />

      {/* Slide-Out Shopping Bag & Checkout Drawer */}
      <CartDrawer />
    </main>
  );
};
