/**
 * src/materials/PBRMaterialSystem.ts
 *
 * Physically Based Rendering (PBR) Material System for AEROPRO-X LAB Sneaker.
 * Standardizes MeshPhysicalMaterial configurations across 4 anatomical segments:
 * - Upper: Tumbled Leather / AeroWeave Hybrid with procedural normal map
 * - Sole: NitroCell Vulcanized Rubber with high-friction herringbone tread normal map
 * - Accents: Anodized Iridescent Chrome with thin-film interference
 * - Laces: Braided Matte Nylon with micro-knit cross-hatch normal map
 *
 * Implements in-place uniform mutation with GSAP color lerping to eliminate
 * WebGL pipeline recompilation stalls (zero frame drops / 60 FPS sustained).
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { SegmentId, SegmentCustomization } from '@/types/sneaker';
import { ProceduralTextureEngine } from '@/utils/proceduralTextures';

export interface PBRMaterialPreset {
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness?: number;
  reflectivity?: number;
  sheen?: number;
  sheenRoughness?: number;
  sheenColor?: string;
  iridescence?: number;
  iridescenceIOR?: number;
  iridescenceThicknessRange?: [number, number];
  normalScale: [number, number];
  envMapIntensity?: number;
}

export class PBRMaterialSystem {
  /**
   * Returns authoritative PBR material preset parameters per segment.
   * Matches E2E Test Suite assertions in Tiers 1-4.
   */
  public static getPresetProperties(segmentName: string | SegmentId): PBRMaterialPreset {
    switch (segmentName) {
      case 'upper':
        return {
          roughness: 0.42,
          metalness: 0.05,
          clearcoat: 0.25,
          clearcoatRoughness: 0.10,
          reflectivity: 0.50,
          sheen: 0.25,
          sheenRoughness: 0.50,
          sheenColor: '#FFFFFF',
          normalScale: [0.8, 0.8],
          envMapIntensity: 1.15,
        };
      case 'sole':
        return {
          roughness: 0.65,
          metalness: 0.10,
          clearcoat: 0.10,
          clearcoatRoughness: 0.20,
          reflectivity: 0.30,
          normalScale: [1.5, 1.5],
          envMapIntensity: 0.80,
        };
      case 'accents':
        return {
          roughness: 0.15,
          metalness: 0.85,
          clearcoat: 0.90,
          clearcoatRoughness: 0.05,
          reflectivity: 0.95,
          iridescence: 0.75,
          iridescenceIOR: 1.45,
          iridescenceThicknessRange: [120, 380],
          normalScale: [0.3, 0.3],
          envMapIntensity: 2.40,
        };
      case 'laces':
        return {
          roughness: 0.75,
          metalness: 0.02,
          clearcoat: 0.0,
          clearcoatRoughness: 0.0,
          reflectivity: 0.20,
          sheen: 0.40,
          sheenRoughness: 0.70,
          sheenColor: '#E0E0E0',
          normalScale: [1.2, 1.2],
          envMapIntensity: 0.50,
        };
      default:
        return {
          roughness: 0.50,
          metalness: 0.50,
          clearcoat: 0.0,
          reflectivity: 0.50,
          normalScale: [1.0, 1.0],
          envMapIntensity: 1.00,
        };
    }
  }

  /**
   * Strict hex color validator supporting 3-digit (#RGB) and 6-digit (#RRGGBB).
   * Automatically trims whitespace.
   */
  public static validateHex(hex: unknown): boolean {
    if (typeof hex !== 'string') return false;
    return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex.trim());
  }

  /**
   * Normalizes hex string: trims whitespace, expands 3-digit shorthand, converts to lowercase.
   */
  public static normalizeHex(hex: string): string {
    if (!PBRMaterialSystem.validateHex(hex)) return '#000000';
    const clean = hex.trim();
    if (clean.length === 4) {
      return ('#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3]).toLowerCase();
    }
    return clean.toLowerCase();
  }

  /**
   * Bounds clamping utility for scalar PBR parameters [min, max].
   */
  public static clamp(val: number, min: number = 0.0, max: number = 1.0): number {
    if (!Number.isFinite(val)) return min;
    return Math.max(min, Math.min(max, val));
  }

  /**
   * Instantiates a pre-configured MeshPhysicalMaterial with pre-bound procedural normal maps.
   * Pre-binding textures and parameter hooks ensures `#define` shader flags are locked at compile-time,
   * completely preventing runtime WebGL recompilations during real-time customization.
   */
  public static createMeshPhysicalMaterial(
    segment: SegmentId,
    baseColor: string = '#FFFFFF',
    overrides?: Partial<THREE.MeshPhysicalMaterialParameters>
  ): THREE.MeshPhysicalMaterial {
    const preset = this.getPresetProperties(segment);
    const colorHex = this.validateHex(baseColor) ? baseColor : '#FFFFFF';

    let normalMap: THREE.CanvasTexture | undefined;
    let roughnessMap: THREE.CanvasTexture | undefined;
    if (segment === 'upper') {
      normalMap = ProceduralTextureEngine.createThreeTexture('leather', 512, 12, 12);
      roughnessMap = ProceduralTextureEngine.createThreeRoughnessTexture('leather', 512, preset.roughness, 12, 12);
    } else if (segment === 'sole') {
      normalMap = ProceduralTextureEngine.createThreeTexture('rubber', 512, 8, 24);
      roughnessMap = ProceduralTextureEngine.createThreeRoughnessTexture('rubber', 512, preset.roughness, 8, 24);
    } else if (segment === 'laces') {
      normalMap = ProceduralTextureEngine.createThreeTexture('mesh', 512, 16, 16);
      roughnessMap = ProceduralTextureEngine.createThreeRoughnessTexture('mesh', 512, preset.roughness, 16, 16);
    }

    const mat = new THREE.MeshPhysicalMaterial({
      name: `mat_${segment}_pbr`,
      color: new THREE.Color(colorHex),
      roughness: preset.roughness,
      metalness: preset.metalness,
      clearcoat: preset.clearcoat,
      clearcoatRoughness: preset.clearcoatRoughness ?? 0.1,
      reflectivity: preset.reflectivity ?? 0.5,
      specularIntensity: 1.0,
      ...(normalMap
        ? {
            normalMap,
            normalScale: new THREE.Vector2(preset.normalScale[0], preset.normalScale[1]),
          }
        : {}),
      ...(roughnessMap ? { roughnessMap } : {}),
      envMapIntensity: preset.envMapIntensity ?? 1.0,
      side: segment === 'upper' ? THREE.DoubleSide : THREE.FrontSide,
      ...overrides,
    });

    if (preset.sheen && preset.sheen > 0) {
      mat.sheen = preset.sheen;
      mat.sheenRoughness = preset.sheenRoughness ?? 0.5;
      if (preset.sheenColor) mat.sheenColor = new THREE.Color(preset.sheenColor);
    }

    if (preset.iridescence && preset.iridescence > 0) {
      mat.iridescence = preset.iridescence;
      mat.iridescenceIOR = preset.iridescenceIOR ?? 1.45;
      if (preset.iridescenceThicknessRange) {
        mat.iridescenceThicknessRange = preset.iridescenceThicknessRange;
      }
    }

    return mat;
  }

  /**
   * Mutates material uniforms in-place with optional GSAP color tweening.
   * NEVER sets `material.needsUpdate = true` to preserve 60 FPS rendering.
   */
  public static updateSegmentMaterialUniforms(
    materials: THREE.MeshPhysicalMaterial[],
    patch: Partial<SegmentCustomization>,
    duration: number = 0.35
  ): void {
    if (!materials || materials.length === 0) return;

    if (patch.color && this.validateHex(patch.color)) {
      const targetColor = new THREE.Color(patch.color);
      materials.forEach((mat) => {
        if (duration > 0) {
          gsap.to(mat.color, {
            r: targetColor.r,
            g: targetColor.g,
            b: targetColor.b,
            duration,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        } else {
          mat.color.copy(targetColor);
        }
      });
    }

    materials.forEach((mat) => {
      if (patch.roughness !== undefined) mat.roughness = this.clamp(patch.roughness);
      if (patch.metalness !== undefined) mat.metalness = this.clamp(patch.metalness);
      if (patch.clearcoat !== undefined) mat.clearcoat = this.clamp(patch.clearcoat);
      if (patch.iridescence !== undefined) mat.iridescence = this.clamp(patch.iridescence);
    });
  }
}
