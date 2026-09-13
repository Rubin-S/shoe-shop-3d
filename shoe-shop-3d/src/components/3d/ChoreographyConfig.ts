/**
 * src/components/3d/ChoreographyConfig.ts
 *
 * Defines the 5-Stage GSAP Scroll Animation Choreography,
 * Camera Paths, Exploded Rig Offsets, and 3D Hotspot Coordinates.
 */

import * as THREE from 'three';
import { SegmentId } from '@/types/sneaker';

export type StageName = 'hero' | 'exploded' | 'specs' | 'customizer' | 'buy';

export interface StageConfig {
  name: StageName;
  label: string;
  scrollRange: [number, number]; // [start, end] from 0.0 to 1.0
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
  shoeRotation: [number, number, number];
  shoePosition: [number, number, number];
  explodedOffsets: {
    upper: [number, number, number];
    laces: [number, number, number];
    carbonPlate: [number, number, number];
    outsole: [number, number, number];
    heelAccents: [number, number, number];
  };
}

export const CAMERA_STAGES: Record<StageName, StageConfig> = {
  hero: {
    name: 'hero',
    label: 'Series 01 Beauty Vantage',
    scrollRange: [0.0, 0.20],
    cameraPos: [2.80, 1.35, 4.0],
    lookAt: [0.38, 0.42, 0.0],
    shoeRotation: [0.04, -0.22, 0.0],
    shoePosition: [1.10, 0.0, 0.0],
    explodedOffsets: {
      upper: [0, 0, 0],
      laces: [0, 0, 0],
      carbonPlate: [0, 0, 0],
      outsole: [0, 0, 0],
      heelAccents: [0, 0, 0],
    },
  },
  exploded: {
    name: 'exploded',
    label: 'Anatomical Deconstruction',
    scrollRange: [0.20, 0.40],
    cameraPos: [2.45, 1.45, 3.8],
    lookAt: [0.28, 0.42, 0.0],
    shoeRotation: [0.18, 0.65, -0.06],
    shoePosition: [0.88, 0.22, 0.0],
    explodedOffsets: {
      upper: [0.0, 0.18, 0.0],
      laces: [0.0, 0.28, 0.03],
      carbonPlate: [0.0, -0.06, 0.0],
      outsole: [0.0, -0.14, 0.0],
      heelAccents: [0.0, -0.05, -0.04],
    },
  },
  specs: {
    name: 'specs',
    label: 'Macro Innovation & Telemetry',
    scrollRange: [0.40, 0.60],
    cameraPos: [-1.5, 0.85, 3.2],
    lookAt: [-0.20, 0.35, 0.0],
    shoeRotation: [-0.10, -1.15, 0.0],
    shoePosition: [-0.45, 0.05, 0.0],
    explodedOffsets: {
      upper: [0.0, 0.12, 0.0],
      laces: [0.0, 0.20, 0.05],
      carbonPlate: [0.0, -0.08, 0.0],
      outsole: [0.0, -0.15, 0.0],
      heelAccents: [0.0, 0.0, 0.0],
    },
  },
  customizer: {
    name: 'customizer',
    label: 'Studio Atelier Customizer',
    scrollRange: [0.60, 0.80],
    cameraPos: [0.0, 1.4, 3.8],
    lookAt: [0.0, 0.45, 0.0],
    shoeRotation: [0.20, 0.0, 0.0],
    shoePosition: [-0.15, -0.08, 0.0],
    explodedOffsets: {
      upper: [0, 0, 0],
      laces: [0, 0, 0],
      carbonPlate: [0, 0, 0],
      outsole: [0, 0, 0],
      heelAccents: [0, 0, 0],
    },
  },
  buy: {
    name: 'buy',
    label: 'Serialized Acquisition',
    scrollRange: [0.80, 1.0],
    cameraPos: [1.85, 0.40, 3.2],
    lookAt: [0.0, 0.40, 0.0],
    shoeRotation: [0.10, 0.55, 0.04],
    shoePosition: [-0.35, 0.05, 0.0],
    explodedOffsets: {
      upper: [0, 0, 0],
      laces: [0, 0, 0],
      carbonPlate: [0, 0, 0],
      outsole: [0, 0, 0],
      heelAccents: [0, 0, 0],
    },
  },
};

export const STAGE_SEQUENCE: StageName[] = ['hero', 'exploded', 'specs', 'customizer', 'buy'];

export interface HotspotItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  statLabel: string;
  statValue: string;
  worldPos: [number, number, number];
  focusStage: StageName;
  segment: SegmentId;
  rigGroup: 'upper' | 'laces' | 'carbon' | 'sole' | 'accents';
}

export const HOTSPOT_ITEMS: HotspotItem[] = [
  {
    id: 'upper-mesh',
    title: 'AeroWeave Upper',
    subtitle: 'High-Tensile Interlocking Knit',
    description: 'Engineered multi-density micro-filament matrix offering dynamic thermal ventilation and 360° adaptive foot wrap.',
    statLabel: 'Breathability',
    statValue: '98.4 CFM',
    worldPos: [0.0, 0.52, 0.45],
    focusStage: 'specs',
    segment: 'upper',
    rigGroup: 'upper',
  },
  {
    id: 'carbon-plate',
    title: 'Carbon Flight Plate',
    subtitle: 'Dual-Camber Arch Stabilizer',
    description: 'Torsional aerospace-grade 3K carbon composite plate returning 94% kinetic energy on midfoot transition.',
    statLabel: 'Kinetic Return',
    statValue: '94.2%',
    worldPos: [0.0, 0.12, 0.02],
    focusStage: 'exploded',
    segment: 'sole',
    rigGroup: 'carbon',
  },
  {
    id: 'nitro-cushion',
    title: 'NitroCell Midsole',
    subtitle: 'Supercritical Nitrogen-Infused Foam',
    description: 'Supercritical nitrogen-infused dynamic rebound elastomer cushioning foot strikes with sub-35ms response damping.',
    statLabel: 'Durometer',
    statValue: '45C Soft',
    worldPos: [0.28, 0.08, -0.40],
    focusStage: 'specs',
    segment: 'sole',
    rigGroup: 'sole',
  },
  {
    id: 'adaptive-laces',
    title: 'Adaptive Dynamic Lacing',
    subtitle: 'Kevlar-Reinforced Tension Lock',
    description: 'Kevlar-reinforced tension distribution system with zoned lockdown micro-adjusters and friction-free eyelets.',
    statLabel: 'Tensile Rating',
    statValue: '1200 N',
    worldPos: [0.0, 0.68, 0.20],
    focusStage: 'hero',
    segment: 'laces',
    rigGroup: 'laces',
  },
];

/**
 * Linear interpolation helper for 3D tuples
 */
export function lerpTuple(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

interface ChoreographyKeyframe {
  progress: number;
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
  shoeRotation: [number, number, number];
  shoePosition: [number, number, number];
  explodedOffsets: {
    upper: [number, number, number];
    laces: [number, number, number];
    carbonPlate: [number, number, number];
    outsole: [number, number, number];
    heelAccents: [number, number, number];
  };
}

const ZERO_OFFSETS = {
  upper: [0, 0, 0] as [number, number, number],
  laces: [0, 0, 0] as [number, number, number],
  carbonPlate: [0, 0, 0] as [number, number, number],
  outsole: [0, 0, 0] as [number, number, number],
  heelAccents: [0, 0, 0] as [number, number, number],
};

const FULL_EXPLODED_OFFSETS = {
  upper: [0.0, 0.18, 0.0] as [number, number, number],
  laces: [0.0, 0.28, 0.03] as [number, number, number],
  carbonPlate: [0.0, -0.06, 0.0] as [number, number, number],
  outsole: [0.0, -0.14, 0.0] as [number, number, number],
  heelAccents: [0.0, -0.05, -0.04] as [number, number, number],
};

const CHOREOGRAPHY_KEYFRAMES: ChoreographyKeyframe[] = [
  // 1. Stage 1: Hero entrance and beauty inspection (offsets remain 0)
  {
    progress: 0.0,
    cameraPos: [2.80, 1.35, 4.0],
    lookAt: [0.38, 0.42, 0.0],
    shoeRotation: [0.04, -0.22, 0.0],
    shoePosition: [1.10, 0.0, 0.0],
    explodedOffsets: ZERO_OFFSETS,
  },
  {
    progress: 0.12,
    cameraPos: [2.80, 1.35, 4.0],
    lookAt: [0.38, 0.42, 0.0],
    shoeRotation: [0.04, -0.22, 0.0],
    shoePosition: [1.10, 0.0, 0.0],
    explodedOffsets: ZERO_OFFSETS,
  },
  // 2. Stage 2: Smooth deconstruction explosion into peak exploded view
  {
    progress: 0.25,
    cameraPos: [2.45, 1.45, 3.8],
    lookAt: [0.28, 0.42, 0.0],
    shoeRotation: [0.18, 0.65, -0.06],
    shoePosition: [0.88, 0.22, 0.0],
    explodedOffsets: FULL_EXPLODED_OFFSETS,
  },
  {
    progress: 0.36,
    cameraPos: [2.45, 1.45, 3.8],
    lookAt: [0.28, 0.42, 0.0],
    shoeRotation: [0.18, 0.65, -0.06],
    shoePosition: [0.88, 0.22, 0.0],
    explodedOffsets: FULL_EXPLODED_OFFSETS,
  },
  // 3. Stage 3: Macro Specs telemetry inspection
  {
    progress: 0.48,
    cameraPos: [-1.5, 0.85, 3.2],
    lookAt: [-0.20, 0.35, 0.0],
    shoeRotation: [-0.10, -1.15, 0.0],
    shoePosition: [-0.45, 0.05, 0.0],
    explodedOffsets: {
      upper: [0.0, 0.10, 0.0],
      laces: [0.0, 0.15, 0.04],
      carbonPlate: [0.0, -0.06, 0.0],
      outsole: [0.0, -0.10, 0.0],
      heelAccents: [0.0, 0.0, 0.0],
    },
  },
  {
    progress: 0.58,
    cameraPos: [-1.5, 0.85, 3.2],
    lookAt: [-0.20, 0.35, 0.0],
    shoeRotation: [-0.10, -1.15, 0.0],
    shoePosition: [-0.45, 0.05, 0.0],
    explodedOffsets: {
      upper: [0.0, 0.04, 0.0],
      laces: [0.0, 0.06, 0.01],
      carbonPlate: [0.0, -0.02, 0.0],
      outsole: [0.0, -0.03, 0.0],
      heelAccents: [0.0, 0.0, 0.0],
    },
  },
  // 4. Stage 4: Seamless reassembly for Atelier Customizer Workshop
  {
    progress: 0.68,
    cameraPos: [0.0, 1.4, 3.8],
    lookAt: [0.0, 0.45, 0.0],
    shoeRotation: [0.20, 0.0, 0.0],
    shoePosition: [-0.15, -0.08, 0.0],
    explodedOffsets: ZERO_OFFSETS,
  },
  {
    progress: 0.80,
    cameraPos: [0.0, 1.4, 3.8],
    lookAt: [0.0, 0.45, 0.0],
    shoeRotation: [0.20, 0.0, 0.0],
    shoePosition: [-0.15, -0.08, 0.0],
    explodedOffsets: ZERO_OFFSETS,
  },
  // 5. Stage 5: Serialized Acquisition & 3/4 beauty angle
  {
    progress: 0.92,
    cameraPos: [1.85, 0.40, 3.2],
    lookAt: [0.0, 0.40, 0.0],
    shoeRotation: [0.10, 0.55, 0.04],
    shoePosition: [-0.35, 0.05, 0.0],
    explodedOffsets: ZERO_OFFSETS,
  },
  {
    progress: 1.0,
    cameraPos: [1.85, 0.40, 3.2],
    lookAt: [0.0, 0.40, 0.0],
    shoeRotation: [0.10, 0.55, 0.04],
    shoePosition: [-0.35, 0.05, 0.0],
    explodedOffsets: ZERO_OFFSETS,
  },
];

/**
 * Computes interpolated transformation frame given global scroll progress (0.0 to 1.0)
 */
export function getChoreographyFrame(progress: number): {
  stage: StageName;
  stageProgress: number;
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
  shoeRotation: [number, number, number];
  shoePosition: [number, number, number];
  explodedOffsets: StageConfig['explodedOffsets'];
} {
  const p = Math.min(1.0, Math.max(0.0, progress));

  // Determine stage name
  let stage: StageName = 'hero';
  if (p < 0.20) {
    stage = 'hero';
  } else if (p < 0.40) {
    stage = 'exploded';
  } else if (p < 0.60) {
    stage = 'specs';
  } else if (p < 0.80) {
    stage = 'customizer';
  } else {
    stage = 'buy';
  }

  // Find keyframe interval
  let idx = 0;
  for (let i = 0; i < CHOREOGRAPHY_KEYFRAMES.length - 1; i++) {
    if (p >= CHOREOGRAPHY_KEYFRAMES[i].progress && p <= CHOREOGRAPHY_KEYFRAMES[i + 1].progress) {
      idx = i;
      break;
    }
  }

  const k1 = CHOREOGRAPHY_KEYFRAMES[idx];
  const k2 = CHOREOGRAPHY_KEYFRAMES[idx + 1] || k1;

  const span = k2.progress - k1.progress;
  const localT = span > 0 ? (p - k1.progress) / span : 0;
  const smoothT = THREE.MathUtils.smoothstep(localT, 0, 1);

  return {
    stage,
    stageProgress: localT,
    cameraPos: lerpTuple(k1.cameraPos, k2.cameraPos, smoothT),
    lookAt: lerpTuple(k1.lookAt, k2.lookAt, smoothT),
    shoeRotation: lerpTuple(k1.shoeRotation, k2.shoeRotation, smoothT),
    shoePosition: lerpTuple(k1.shoePosition, k2.shoePosition, smoothT),
    explodedOffsets: {
      upper: lerpTuple(k1.explodedOffsets.upper, k2.explodedOffsets.upper, smoothT),
      laces: lerpTuple(k1.explodedOffsets.laces, k2.explodedOffsets.laces, smoothT),
      carbonPlate: lerpTuple(k1.explodedOffsets.carbonPlate, k2.explodedOffsets.carbonPlate, smoothT),
      outsole: lerpTuple(k1.explodedOffsets.outsole, k2.explodedOffsets.outsole, smoothT),
      heelAccents: lerpTuple(k1.explodedOffsets.heelAccents, k2.explodedOffsets.heelAccents, smoothT),
    },
  };
}
