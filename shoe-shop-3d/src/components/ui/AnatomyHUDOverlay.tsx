/**
 * src/components/ui/AnatomyHUDOverlay.tsx
 *
 * High-precision architectural SVG HUD Leader Lines & Mechanical Calipers
 * connecting Stage 2 specification cards directly to 3D floating rig groups.
 * Renders animated dashed telemetry lines, mechanical calipers, and live coordinate locks.
 * Seamlessly adapts to Daylight Luxury (Light) and Obsidian Onyx (Dark).
 */

import React, { useEffect, useState } from 'react';
import { useChoreographyStore, useHotspotsStore } from '@/store/useChoreographyStore';
import { useThemeStore } from '@/store/useThemeStore';
import { playHover, playClick } from '@/utils/audio';

interface LeaderTarget {
  hotspotId: string;
  cardId: string;
  label: string;
  telemetry: string;
  metric: string;
  accentColor?: string;
}

const LEADER_TARGETS: LeaderTarget[] = [
  {
    hotspotId: 'adaptive-laces',
    cardId: 'hud-card-adaptive-laces',
    label: '01 // LACES',
    telemetry: '+28mm ELEV',
    metric: '1200 N',
    accentColor: '#D4FF00',
  },
  {
    hotspotId: 'upper-mesh',
    cardId: 'hud-card-upper-mesh',
    label: '02 // UPPER',
    telemetry: '+18mm ELEV',
    metric: '98.4 CFM',
    accentColor: '#38BDF8',
  },
  {
    hotspotId: 'heel-accents',
    cardId: 'hud-card-heel-accents',
    label: '03 // ACCENTS',
    telemetry: '-5mm STAB',
    metric: '0.92 GRIP',
    accentColor: '#A78BFA',
  },
  {
    hotspotId: 'nitro-cushion',
    cardId: 'hud-card-nitro-cushion',
    label: '04 // MIDSOLE',
    telemetry: '-14mm BASE',
    metric: '45C SOFT',
    accentColor: '#FF334B',
  },
  {
    hotspotId: 'carbon-plate',
    cardId: 'hud-card-carbon-plate',
    label: '05 // CARBON',
    telemetry: '-6mm COMP',
    metric: '94.2% RET',
    accentColor: '#E5C378',
  },
];

export const AnatomyHUDOverlay: React.FC = () => {
  const { activeStage, activeHotspotId, selectHotspot, scrollProgress } = useChoreographyStore();
  const screenPositions = useHotspotsStore();
  const { isLight } = useThemeStore();
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const [cardRects, setCardRects] = useState<Record<string, { x: number; y: number }>>({});

  const isVisibleStage = activeStage === 'exploded' || (scrollProgress >= 0.18 && scrollProgress <= 0.42);

  // Measure card right-edge connector positions
  useEffect(() => {
    if (!isVisibleStage) return;

    const updateRects = () => {
      const rects: Record<string, { x: number; y: number }> = {};
      LEADER_TARGETS.forEach((target) => {
        const el = document.getElementById(target.cardId);
        if (el) {
          const r = el.getBoundingClientRect();
          rects[target.hotspotId] = {
            x: r.right,
            y: r.top + r.height / 2,
          };
        }
      });
      setCardRects(rects);
    };

    updateRects();
    window.addEventListener('resize', updateRects);
    window.addEventListener('scroll', updateRects, { passive: true });

    return () => {
      window.removeEventListener('resize', updateRects);
      window.removeEventListener('scroll', updateRects);
    };
  }, [isVisibleStage, scrollProgress]);

  if (!isVisibleStage) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[15] overflow-hidden transition-opacity duration-500 hidden md:block">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Animated Dash Array Pattern Filter */}
          <filter id="glow-lime" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#D4FF00" floodOpacity="0.6" />
          </filter>
          <filter id="glow-dark" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {LEADER_TARGETS.map((target) => {
          const start = cardRects[target.hotspotId];
          const end = screenPositions[target.hotspotId];

          if (!start || !end || !end.visible) return null;

          // Only draw if 3D point is to the right of card
          if (end.x <= start.x + 20) return null;

          const isSelected = activeHotspotId === target.hotspotId;
          const isHovered = hoveredTarget === target.hotspotId;
          const isActive = isSelected || isHovered;

          // Dogleg drafting geometry
          const midX = start.x + (end.x - start.x) * 0.38;
          const leadInX = end.x - 26;

          // Path: Start -> Horizontal to midX -> Dogleg to (leadInX, end.y) -> Horizontal to end.x
          const pathD = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${leadInX} ${end.y} L ${end.x} ${end.y}`;

          // Styling colors based on theme and active state
          const activeAccent = !isLight ? (target.accentColor || '#D4FF00') : '#0A0B0E';
          const strokeColor = isActive
            ? activeAccent
            : isLight ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.25)';

          const accentFill = isActive ? activeAccent : isLight ? '#0A0B0E' : '#D4FF00';
          const cardDotFill = isActive ? accentFill : isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';

          return (
            <g
              key={target.hotspotId}
              className="transition-all duration-300 pointer-events-auto cursor-pointer"
              onMouseEnter={() => {
                setHoveredTarget(target.hotspotId);
                playHover();
              }}
              onMouseLeave={() => setHoveredTarget(null)}
              onClick={() => {
                selectHotspot(isSelected ? null : target.hotspotId);
                playClick();
              }}
            >
              {/* Card Start Terminal Pin */}
              <circle
                cx={start.x}
                cy={start.y}
                r={isActive ? 4.5 : 2.5}
                fill={cardDotFill}
                className="transition-all duration-300"
              />
              {isActive && (
                <circle
                  cx={start.x}
                  cy={start.y}
                  r={7}
                  fill="none"
                  stroke={accentFill}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  className="animate-spin-slow"
                />
              )}

              {/* Technical Telemetry Leader Line */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? 'none' : '4 4'}
                filter={isActive && !isLight ? 'url(#glow-lime)' : undefined}
                className={`transition-colors duration-300 ${!isActive ? 'animate-hud-dash' : ''}`}
              />

              {/* Data Readout Tag at Dogleg Elbow */}
              <g transform={`translate(${midX + 6}, ${(start.y + end.y) / 2 - 8})`}>
                <rect
                  x="-2"
                  y="-8"
                  width="72"
                  height="16"
                  rx="3"
                  fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(11, 12, 14, 0.92)'}
                  stroke={isActive ? accentFill : isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)'}
                  strokeWidth="0.8"
                />
                <text
                  x="4"
                  y="3.5"
                  fill={isActive ? (isLight ? '#000' : (target.accentColor || '#D4FF00')) : (isLight ? '#666' : '#999')}
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                  letterSpacing="0.06em"
                >
                  {target.telemetry}
                </text>
              </g>

              {/* Mechanical Caliper Reticle on Floating 3D Part */}
              <g transform={`translate(${end.x}, ${end.y})`}>
                {/* Center Target Dot */}
                <circle
                  cx="0"
                  cy="0"
                  r={isActive ? 4 : 2.5}
                  fill={accentFill}
                  className="transition-all duration-300"
                />

                {/* Caliper Upper Bracket */}
                <path
                  d="M -10 -14 L -10 -18 L 10 -18 L 10 -14"
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isActive ? 1.5 : 1}
                />
                {/* Caliper Lower Bracket */}
                <path
                  d="M -10 14 L -10 18 L 10 18 L 10 14"
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isActive ? 1.5 : 1}
                />
                {/* Central Caliper Tick Lines */}
                <line
                  x1="-14"
                  y1="0"
                  x2="-7"
                  y2="0"
                  stroke={strokeColor}
                  strokeWidth={isActive ? 1.5 : 0.8}
                />
                <line
                  x1="7"
                  y1="0"
                  x2="14"
                  y2="0"
                  stroke={strokeColor}
                  strokeWidth={isActive ? 1.5 : 0.8}
                />

                {/* Caliper Technical Label */}
                <text
                  x="18"
                  y="3"
                  fill={isActive ? (isLight ? '#0A0B0E' : '#FFFFFF') : (isLight ? '#555' : '#AAA')}
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                  letterSpacing="0.08em"
                >
                  {target.label}
                </text>
                <text
                  x="18"
                  y="13"
                  fill={isLight ? '#777' : '#666'}
                  fontSize="7.5"
                  fontFamily="JetBrains Mono, monospace"
                  letterSpacing="0.05em"
                >
                  [{target.metric}]
                </text>

                {/* Pulsing Active Lock Circle */}
                {isActive && (
                  <circle
                    cx="0"
                    cy="0"
                    r="16"
                    fill="none"
                    stroke={accentFill}
                    strokeWidth="0.8"
                    strokeDasharray="3 3"
                    className="animate-spin-slow"
                  />
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
