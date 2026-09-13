/**
 * src/components/ui/CustomCursor.tsx
 *
 * Luxury Magnetic Fluid Cursor Follower with contextual micro-states.
 * Clamped to desktop pointer viewports (auto-disabled on touch devices).
 * Dual-theme adaptive: Crisp obsidian on light backgrounds, cyber-lime on dark.
 */

import React, { useEffect, useState, useRef } from 'react';
import { playHover } from '@/utils/audio';

export const CustomCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [cursorText, setCursorText] = useState<string>('');

  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const isTouchDeviceRef = useRef<boolean>(false);
  const targetPosRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const currentRingPosRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const wasHoveredRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if touch device
    if (window.matchMedia('(pointer: coarse)').matches) {
      isTouchDeviceRef.current = true;
      return;
    }

    // Animation loop for fluid magnetic ring follower
    const updateRing = () => {
      const target = targetPosRef.current;
      const current = currentRingPosRef.current;

      const lerp = 0.22;
      current.x += (target.x - current.x) * lerp;
      current.y += (target.y - current.y) * lerp;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
      }
      rafIdRef.current = requestAnimationFrame(updateRing);
    };
    rafIdRef.current = requestAnimationFrame(updateRing);

    const onMouseMove = (e: MouseEvent) => {
      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        currentRingPosRef.current = { x: e.clientX, y: e.clientY };
        targetPosRef.current = { x: e.clientX, y: e.clientY };
      }

      targetPosRef.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
      setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveEl = target.closest(
        'button, a, input, [role="button"], [data-cursor-hover]'
      ) as HTMLElement | null;
      const interactive = !!interactiveEl;
      if (interactive && !wasHoveredRef.current) {
        playHover();
      }
      wasHoveredRef.current = interactive;
      setIsHovered(interactive);

      if (interactiveEl && (interactiveEl.tagName.toLowerCase() === 'button' || interactiveEl.getAttribute('role') === 'button')) {
        const rect = interactiveEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // Subtle magnetic pull toward button center
        targetPosRef.current = {
          x: e.clientX * 0.65 + centerX * 0.35,
          y: e.clientY * 0.65 + centerY * 0.35,
        };
      } else {
        targetPosRef.current = { x: e.clientX, y: e.clientY };
      }

      if (target.closest('canvas')) {
        setCursorText('360°');
      } else {
        setCursorText('');
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
      hasMovedRef.current = false;
      setCursorText('');
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  if (isTouchDeviceRef.current || !isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Outer Magnetic Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full border transition-[width,height,border-color,background-color] duration-200 ease-out flex items-center justify-center backdrop-blur-[1px] ${
          isHovered
            ? 'w-12 h-12 border-neutral-900 bg-black/10 dark:border-brand-lime dark:bg-brand-lime/10 shadow-md dark:shadow-glow-lime'
            : cursorText
            ? 'w-14 h-14 border-black/40 bg-black/5 dark:border-white/40 dark:bg-white/5'
            : 'w-8 h-8 border-black/30 dark:border-white/30'
        }`}
        style={{
          willChange: 'transform',
        }}
      >
        {cursorText && (
          <span className="font-mono text-[9px] font-bold text-neutral-900 dark:text-white tracking-widest">
            {cursorText}
          </span>
        )}
      </div>

      {/* Center Micro-Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-brand-lime pointer-events-none"
        style={{
          willChange: 'transform',
        }}
      />
    </div>
  );
};
