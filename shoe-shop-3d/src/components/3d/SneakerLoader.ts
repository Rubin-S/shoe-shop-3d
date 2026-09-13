import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { SegmentId, SneakerLoadResult, SneakerRigGroups } from '@/types/sneaker';
import { ProceduralSneakerGenerator } from './ProceduralSneaker';
import { ProceduralTextureEngine } from '@/utils/proceduralTextures';

export class SneakerModelLoader {
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader | null = null;
  private timeoutMs: number;
  private activeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(dracoPath: string = '/draco/', timeoutMs: number = 25000) {
    this.timeoutMs = timeoutMs;
    this.gltfLoader = new GLTFLoader();

    // Configure DRACO compression decoder with WebAssembly worker pool
    if (typeof window !== 'undefined') {
      try {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(dracoPath);
        this.gltfLoader.setDRACOLoader(dracoLoader);
        this.dracoLoader = dracoLoader;
      } catch (e) {
        console.warn('[SneakerModelLoader] DRACOLoader initialization warning:', e);
      }
    }
  }

  /**
   * Loads the sneaker model from the provided URL.
   * Seamlessly normalizes bounding geometry, creates 5 exploded rig groups,
   * converts textures/materials to PBR MeshPhysicalMaterial,
   * and falls back to procedural geometry on failure or timeout.
   */
  public async loadSneaker(
    url: string = '/models/sneaker.glb',
    onProgress?: (progress: number) => void
  ): Promise<SneakerLoadResult> {
    try {
      const gltfPromise = new Promise<SneakerLoadResult>((resolve, reject) => {
        this.gltfLoader.load(
          url,
          (gltf) => {
            const parsed = this.processGltfModel(gltf.scene);
            // Verify that the loaded glTF contains complete modular segmented geometry.
            // Non-modular placeholder models (such as the legacy monolithic 'shoe' mesh)
            // are automatically upgraded to the high-fidelity procedural compound assembly.
            const isPlaceholder =
              gltf.scene.children.length <= 1 ||
              (parsed.rigGroups?.upper.children.length ?? 0) < 3 ||
              parsed.model.getObjectByName('shoe') !== null ||
              gltf.scene.children.some(
                (c) => c.name.toLowerCase() === 'shoe' || c.name.toLowerCase() === 'g_shoe'
              );
            if (isPlaceholder) {
              resolve(this.loadProceduralFallback());
              return;
            }
            resolve(parsed);
          },
          (event) => {
            if (event.lengthComputable && onProgress) {
              onProgress(Math.round((event.loaded / event.total) * 100));
            }
          },
          (error) => {
            reject(error);
          }
        );
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        this.activeTimeoutId = setTimeout(
          () => reject(new Error(`Model load timed out after ${this.timeoutMs}ms`)),
          this.timeoutMs
        );
      });

      return await Promise.race([gltfPromise, timeoutPromise]);
    } catch (err) {
      console.warn(
        `[SneakerModelLoader] glTF model '${url}' load error. Falling back to high-fidelity procedural compound geometry.`,
        err
      );
      return this.loadProceduralFallback();
    } finally {
      if (this.activeTimeoutId !== null) {
        clearTimeout(this.activeTimeoutId);
        this.activeTimeoutId = null;
      }
    }
  }

  /**
   * Instantiates the self-contained procedural sneaker model.
   */
  public loadProceduralFallback(): SneakerLoadResult {
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    return {
      model: assembly.root,
      isProcedural: true,
      materialMap: assembly.materialMap,
      rigGroups: assembly.rigGroups,
    };
  }

  /**
   * Disposes loader resources, including DRACOLoader worker pools and active timers.
   */
  public dispose(): void {
    if (this.activeTimeoutId !== null) {
      clearTimeout(this.activeTimeoutId);
      this.activeTimeoutId = null;
    }
    if (this.dracoLoader) {
      try {
        this.dracoLoader.dispose();
      } catch (e) {
        console.warn('[SneakerModelLoader] Error disposing DRACOLoader:', e);
      }
      this.dracoLoader = null;
    }
  }

  /**
   * Normalizes glTF scene:
   * 1. Bounding box computation & scale normalization to length ~2.45
   * 2. Spatial orientation (Toe along +Z, Heel along -Z)
   * 3. Rig Groups creation (Upper, Laces, Carbon, Sole, Accents)
   * 4. Upgrade materials to MeshPhysicalMaterial for zero-recompile uniform customization
   */
  private processGltfModel(scene: THREE.Group): SneakerLoadResult {
    const materialMap = new Map<SegmentId, THREE.MeshPhysicalMaterial[]>();
    materialMap.set('upper', []);
    materialMap.set('sole', []);
    materialMap.set('accents', []);
    materialMap.set('laces', []);

    // 1. Initial size and orientation measurement
    const initialBox = new THREE.Box3().setFromObject(scene);
    const initialSize = new THREE.Vector3();
    initialBox.getSize(initialSize);

    // If length is oriented along X (size.x > size.z), rotate by -90 deg around Y
    // so toe points along +Z and heel points along -Z
    if (initialSize.x > initialSize.z) {
      scene.rotation.y = -Math.PI * 0.5;
    }

    // 2. Scale normalization
    scene.updateMatrixWorld(true);
    const orientedBox = new THREE.Box3().setFromObject(scene);
    const orientedSize = new THREE.Vector3();
    orientedBox.getSize(orientedSize);

    const maxHorizontalDim = Math.max(orientedSize.x, orientedSize.z);
    const targetLength = 2.45;
    const scaleFactor = maxHorizontalDim > 0 ? targetLength / maxHorizontalDim : 1.0;
    scene.scale.setScalar(scaleFactor);

    // 3. Center X and Z, align sole bottom to Y = 0.05
    scene.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(scene);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    scene.position.x = -scaledCenter.x;
    scene.position.z = -scaledCenter.z;
    scene.position.y = -scaledBox.min.y + 0.05;
    scene.updateMatrixWorld(true);

    // 4. Create Rig Groups hierarchy
    const root = new THREE.Group();
    root.name = 'sneaker_root';

    const rigGroups: SneakerRigGroups = {
      upper: new THREE.Group(),
      laces: new THREE.Group(),
      carbon: new THREE.Group(),
      sole: new THREE.Group(),
      accents: new THREE.Group(),
    };

    rigGroups.upper.name = 'rig_upper';
    rigGroups.laces.name = 'rig_laces';
    rigGroups.carbon.name = 'rig_carbon';
    rigGroups.sole.name = 'rig_sole';
    rigGroups.accents.name = 'rig_accents';

    root.add(rigGroups.upper);
    root.add(rigGroups.laces);
    root.add(rigGroups.carbon);
    root.add(rigGroups.sole);
    root.add(rigGroups.accents);

    // 5. Collect all meshes from the glTF hierarchy
    const meshes: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push(child as THREE.Mesh);
      }
    });

    // 6. Classification & Reparenting into Rig Groups
    meshes.forEach((mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const matNames = Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.name || '').join(' ')
        : (mesh.material?.name || '');
      const identifier = `${mesh.name} ${matNames}`.toLowerCase();

      let segment: SegmentId = 'upper';
      let targetRig = rigGroups.upper;

      if (/lace/i.test(identifier)) {
        segment = 'laces';
        targetRig = rigGroups.laces;
      } else if (/sole|tread|cushion|foam|outsole|midsole/i.test(identifier)) {
        segment = 'sole';
        targetRig = rigGroups.sole;
      } else if (/stripe|accent|band|patch|logo|badge|aglet/i.test(identifier)) {
        segment = 'accents';
        targetRig = rigGroups.accents;
      } else {
        segment = 'upper';
        targetRig = rigGroups.upper;
      }

      mesh.userData.segment = segment;

      // Upgrade material to MeshPhysicalMaterial with high-fidelity PBR micro-textures
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const newMats = mats.map((m) => {
        let pbrMat: THREE.MeshPhysicalMaterial;
        if (m instanceof THREE.MeshPhysicalMaterial) {
          pbrMat = m;
        } else {
          const stdMat = m as THREE.MeshStandardMaterial;
          const proceduralNormal =
            segment === 'upper'
              ? ProceduralTextureEngine.createThreeTexture('leather', 512, 12.0)
              : segment === 'sole'
              ? ProceduralTextureEngine.createThreeTexture('rubber', 512, 16.0)
              : segment === 'laces'
              ? ProceduralTextureEngine.createThreeTexture('mesh', 512, 20.0)
              : null;

          pbrMat = new THREE.MeshPhysicalMaterial({
            color: stdMat.color ? stdMat.color.clone() : new THREE.Color(0xffffff),
            map: stdMat.map || null,
            normalMap: stdMat.normalMap || proceduralNormal,
            roughnessMap: stdMat.roughnessMap || null,
            metalnessMap: stdMat.metalnessMap || null,
            roughness: segment === 'sole' ? 0.72 : segment === 'accents' ? 0.18 : segment === 'laces' ? 0.82 : 0.40,
            metalness: segment === 'accents' ? 0.85 : 0.02,
            clearcoat: segment === 'accents' ? 0.90 : segment === 'upper' ? 0.20 : segment === 'sole' ? 0.05 : 0.0,
            clearcoatRoughness: segment === 'accents' ? 0.08 : 0.20,
            sheen: segment === 'upper' ? 0.35 : segment === 'laces' ? 0.50 : 0.0,
            sheenRoughness: segment === 'laces' ? 0.60 : 0.45,
            sheenColor: new THREE.Color(segment === 'laces' ? '#f5efe6' : '#ffffff'),
            specularIntensity: 1.0,
            envMapIntensity: segment === 'accents' ? 2.4 : 1.2,
            name: m.name || `mat_${segment}_converted`,
          });

          if (pbrMat.normalMap) {
            const scale = segment === 'sole' ? 1.2 : segment === 'laces' ? 0.8 : 0.65;
            pbrMat.normalScale = new THREE.Vector2(scale, scale);
          }
        }

        const existing = materialMap.get(segment) || [];
        if (!existing.includes(pbrMat)) {
          existing.push(pbrMat);
          materialMap.set(segment, existing);
        }
        return pbrMat;
      });

      mesh.material = newMats.length === 1 ? newMats[0] : newMats;

      // Reparent to rig group while maintaining precise world transform
      targetRig.attach(mesh);
    });

    // 7. Add High-Tech Carbon Fiber Arch Shank Plate into rigGroups.carbon
    const carbonGeom = new THREE.BoxGeometry(0.44, 0.024, 0.52);
    const carbonMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#141518'),
      roughness: 0.20,
      metalness: 0.85,
      clearcoat: 0.95,
      clearcoatRoughness: 0.10,
      name: 'mat_carbon_arch_plate',
    });
    const carbonMesh = new THREE.Mesh(carbonGeom, carbonMat);
    carbonMesh.name = 'mesh_carbon_arch_plate';
    carbonMesh.position.set(0.0, 0.115, 0.02);
    carbonMesh.castShadow = true;
    carbonMesh.receiveShadow = true;
    carbonMesh.userData = { segment: 'sole', subpart: 'carbon_plate' };
    rigGroups.carbon.add(carbonMesh);

    const soleMaterials = materialMap.get('sole') || [];
    soleMaterials.push(carbonMat);
    materialMap.set('sole', soleMaterials);

    return {
      model: root,
      isProcedural: false,
      materialMap,
      rigGroups,
    };
  }
}
