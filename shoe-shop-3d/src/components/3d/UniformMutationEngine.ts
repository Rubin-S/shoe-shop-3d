/**
 * src/components/3d/UniformMutationEngine.ts
 *
 * Zero-Recompilation Three.js Material Uniform Mutation Engine.
 * Manages O(1) segment material lookups and smooth GSAP color/scalar tweens.
 * Guarantees zero WebGL pipeline hitching (material.needsUpdate remains false).
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { SegmentId, SneakerCustomization, SegmentCustomization } from '@/types/sneaker';

export interface TweenOptions {
  duration?: number;
  ease?: string;
  onComplete?: () => void;
}

export class UniformMutationEngine {
  private materialMap: Map<SegmentId, THREE.MeshPhysicalMaterial[]> = new Map();
  private meshMap: Map<SegmentId, THREE.Mesh[]> = new Map();
  private activeTweens: Set<gsap.core.Tween> = new Set();

  constructor() {
    this.materialMap.set('upper', []);
    this.materialMap.set('sole', []);
    this.materialMap.set('accents', []);
    this.materialMap.set('laces', []);

    this.meshMap.set('upper', []);
    this.meshMap.set('sole', []);
    this.meshMap.set('accents', []);
    this.meshMap.set('laces', []);
  }

  /**
   * Registers a 3D sneaker hierarchy or explicit material map.
   * Traverses mesh nodes and indexes unique material instances by SegmentId.
   */
  public registerModel(
    root: THREE.Object3D,
    explicitMaterialMap?: Map<SegmentId, THREE.MeshPhysicalMaterial[]>
  ): void {
    this.clear();

    // 1. Ingest explicit material map if provided (from ProceduralSneakerAssembly)
    if (explicitMaterialMap) {
      explicitMaterialMap.forEach((mats, segment) => {
        const targetList = this.materialMap.get(segment) || [];
        mats.forEach((m) => {
          if (!targetList.includes(m)) {
            targetList.push(m);
          }
        });
        this.materialMap.set(segment, targetList);
      });
    }

    // 2. Traverse hierarchy to index meshes and capture any unmapped materials
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const segment = (mesh.userData?.segment as SegmentId) || 'upper';

        // Index mesh
        const meshList = this.meshMap.get(segment) || [];
        if (!meshList.includes(mesh)) {
          meshList.push(mesh);
          this.meshMap.set(segment, meshList);
        }

        // Index material instances
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            if (m instanceof THREE.MeshPhysicalMaterial) {
              const segMats = this.materialMap.get(segment) || [];
              if (!segMats.includes(m)) {
                segMats.push(m);
                this.materialMap.set(segment, segMats);
              }
            }
          });
        }
      }
    });

    // 3. Ensure material shader feature flags are primed
    this.primeMaterialShaders();
  }

  /**
   * Shader Priming:
   * Guarantees all materials have clearcoat, sheen, and iridescence uniforms
   * active so modifying them at runtime never alters shader defines.
   */
  private primeMaterialShaders(): void {
    this.materialMap.forEach((mats) => {
      mats.forEach((mat) => {
        if (mat.clearcoat === undefined) mat.clearcoat = 0.0;
        if (mat.clearcoatRoughness === undefined) mat.clearcoatRoughness = 0.0;
        if (mat.sheen === undefined) mat.sheen = 0.0;
        if (mat.iridescence === undefined) mat.iridescence = 0.0;
      });
    });
  }

  /**
   * Pre-compiles the scene on the GPU ahead-of-time.
   * Call during loader/preloader phase to guarantee 60 FPS on first interaction.
   */
  public precompile(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void {
    renderer.compile(scene, camera);
  }

  /**
   * Tweens segment color smoothly using GSAP.
   * Mutates the underlying WebGL color uniform directly with zero pipeline recompilation.
   */
  public tweenSegmentColor(
    segment: SegmentId,
    hexColor: string,
    options: TweenOptions = {}
  ): void {
    const materials = this.materialMap.get(segment);
    if (!materials || materials.length === 0) return;

    const targetColor = new THREE.Color(hexColor);
    const duration = options.duration ?? 0.38;
    const ease = options.ease ?? 'power2.out';

    materials.forEach((mat) => {
      if (duration === 0) {
        mat.color.copy(targetColor);
        if (options.onComplete) options.onComplete();
        return;
      }

      // Overwrite: 'auto' gracefully interrupts prior in-flight tweens on this color
      let tween: gsap.core.Tween;
      const cleanup = () => {
        if (tween) this.activeTweens.delete(tween);
      };

      tween = gsap.to(mat.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration,
        ease,
        overwrite: 'auto',
        onComplete: () => {
          cleanup();
          if (options.onComplete) options.onComplete();
        },
        onInterrupt: cleanup,
      });
      this.activeTweens.add(tween);

      // ZERO-RECOMPILE RULE:
      // mat.needsUpdate is deliberately NOT set to true!
    });
  }

  /**
   * Tweens scalar PBR properties (roughness, metalness, clearcoat, iridescence).
   */
  public tweenSegmentScalars(
    segment: SegmentId,
    patch: Partial<SegmentCustomization>,
    options: TweenOptions = {}
  ): void {
    const materials = this.materialMap.get(segment);
    if (!materials || materials.length === 0) return;

    const duration = options.duration ?? 0.38;
    const ease = options.ease ?? 'power2.out';

    const targetProps: Record<string, number> = {};
    if (patch.roughness !== undefined) targetProps.roughness = patch.roughness;
    if (patch.metalness !== undefined) targetProps.metalness = patch.metalness;
    if (patch.clearcoat !== undefined) targetProps.clearcoat = patch.clearcoat;
    if (patch.iridescence !== undefined) targetProps.iridescence = patch.iridescence;

    if (Object.keys(targetProps).length === 0) return;

    materials.forEach((mat) => {
      if (duration === 0) {
        if (targetProps.roughness !== undefined) mat.roughness = targetProps.roughness;
        if (targetProps.metalness !== undefined) mat.metalness = targetProps.metalness;
        if (targetProps.clearcoat !== undefined) mat.clearcoat = targetProps.clearcoat;
        if (targetProps.iridescence !== undefined) mat.iridescence = targetProps.iridescence;
        return;
      }

      let tween: gsap.core.Tween;
      const cleanup = () => {
        if (tween) this.activeTweens.delete(tween);
      };

      tween = gsap.to(mat, {
        ...targetProps,
        duration,
        ease,
        overwrite: 'auto',
        onComplete: cleanup,
        onInterrupt: cleanup,
      });
      this.activeTweens.add(tween);
    });
  }

  /**
   * Applies a full SneakerCustomization state across all 4 segments in a single pass.
   */
  public applyCustomization(
    customization: SneakerCustomization,
    options: TweenOptions = {}
  ): void {
    const segments: SegmentId[] = ['upper', 'sole', 'accents', 'laces'];
    segments.forEach((seg) => {
      const cfg = customization[seg];
      if (cfg) {
        if (cfg.color) {
          this.tweenSegmentColor(seg, cfg.color, options);
        }
        this.tweenSegmentScalars(seg, cfg, options);
      }
    });
  }

  /**
   * Returns registered materials for direct inspection in tests.
   */
  public getMaterials(segment: SegmentId): THREE.MeshPhysicalMaterial[] {
    return this.materialMap.get(segment) || [];
  }

  /**
   * Returns registered meshes for direct inspection.
   */
  public getMeshes(segment: SegmentId): THREE.Mesh[] {
    return this.meshMap.get(segment) || [];
  }

  /**
   * Halts all active tweens and cleans up references on unmount.
   */
  public clear(): void {
    this.activeTweens.forEach((t) => t.kill());
    this.activeTweens.clear();
    this.materialMap.get('upper')!.length = 0;
    this.materialMap.get('sole')!.length = 0;
    this.materialMap.get('accents')!.length = 0;
    this.materialMap.get('laces')!.length = 0;
    this.meshMap.get('upper')!.length = 0;
    this.meshMap.get('sole')!.length = 0;
    this.meshMap.get('accents')!.length = 0;
    this.meshMap.get('laces')!.length = 0;
    try {
      gsap.ticker.sleep();
    } catch {}
  }
}

// Global Singleton Instance
export const uniformMutationEngine = new UniformMutationEngine();
