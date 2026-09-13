import * as THREE from 'three';

export type SegmentId = 'upper' | 'sole' | 'accents' | 'laces';

export interface SegmentCustomization {
  color: string;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  iridescence?: number;
}

export interface SneakerCustomization {
  upper: SegmentCustomization;
  sole: SegmentCustomization;
  accents: SegmentCustomization;
  laces: SegmentCustomization;
}

export const DEFAULT_COLORWAY: SneakerCustomization = {
  upper: {
    color: '#f5f2eb',
    roughness: 0.38,
    metalness: 0.02,
    clearcoat: 0.18,
    iridescence: 0.0,
  },
  sole: {
    color: '#e6ded1',
    roughness: 0.68,
    metalness: 0.02,
    clearcoat: 0.06,
    iridescence: 0.0,
  },
  accents: {
    color: '#c9bba8',
    roughness: 0.22,
    metalness: 0.78,
    clearcoat: 0.85,
    iridescence: 0.30,
  },
  laces: {
    color: '#ece5d8',
    roughness: 0.82,
    metalness: 0.0,
    clearcoat: 0.0,
    iridescence: 0.0,
  },
};

export const DEFAULT_PRESET_NAME = 'Beige White';

export interface ExplodedOffsetsConfig {
  upper: [number, number, number];
  laces: [number, number, number];
  carbonPlate: [number, number, number];
  outsole: [number, number, number];
  heelAccents: [number, number, number];
}

export const DEFAULT_EXPLODED_OFFSETS: ExplodedOffsetsConfig = {
  upper: [0.00, 0.45, 0.00],
  laces: [0.00, 0.70, 0.15],
  carbonPlate: [0.00, -0.20, 0.00],
  outsole: [0.00, -0.55, 0.00],
  heelAccents: [-0.35, 0.15, 0.00],
};

export interface CameraStage {
  name: 'hero' | 'exploded' | 'specs' | 'customizer' | 'buy';
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
  shoeRotation: [number, number, number];
  shoePosition: [number, number, number];
  explodedOffsets?: ExplodedOffsetsConfig;
}

export interface HotspotData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  position: [number, number, number];
  segment: SegmentId;
}

export interface SneakerRigGroups {
  upper: THREE.Group;
  laces: THREE.Group;
  carbon: THREE.Group;
  sole: THREE.Group;
  accents: THREE.Group;
}

export interface ProceduralSneakerAssembly {
  root: THREE.Group;
  rigGroups: SneakerRigGroups;
  materialMap: Map<SegmentId, THREE.MeshPhysicalMaterial[]>;
}

export interface SneakerLoadResult {
  model: THREE.Group;
  isProcedural: boolean;
  materialMap: Map<SegmentId, THREE.MeshPhysicalMaterial[]>;
  rigGroups?: SneakerRigGroups;
}
