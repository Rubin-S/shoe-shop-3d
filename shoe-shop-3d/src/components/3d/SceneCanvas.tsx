import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { createStudioLighting, StudioLightingRig } from './StudioLighting';
import { createContactShadow, ContactShadowSetup } from './ContactShadow';
import { SneakerModelLoader } from './SneakerLoader';
import { uniformMutationEngine } from './UniformMutationEngine';
import { SneakerLoadResult } from '@/types/sneaker';
import { getChoreographyFrame, HOTSPOT_ITEMS } from './ChoreographyConfig';
import { choreographyStoreEngine, hotspotsStoreEngine } from '@/store/useChoreographyStore';
import { themeStoreEngine } from '@/store/useThemeStore';
import { playExplodeSnap, playRotation } from '@/utils/audio';

export interface SceneCanvasProps {
  onModelLoaded?: (result: SneakerLoadResult) => void;
  className?: string;
  isInteractive?: boolean;
  onHotspotsUpdate?: (positions: Record<string, { x: number; y: number; visible: boolean }>) => void;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  onModelLoaded,
  className = '',
  isInteractive = true,
  onHotspotsUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Stable refs for callbacks to prevent re-instantiating WebGL context on parent re-renders
  const onModelLoadedRef = useRef(onModelLoaded);
  useEffect(() => {
    onModelLoadedRef.current = onModelLoaded;
  }, [onModelLoaded]);

  const onHotspotsUpdateRef = useRef(onHotspotsUpdate);
  useEffect(() => {
    onHotspotsUpdateRef.current = onHotspotsUpdate;
  }, [onHotspotsUpdate]);

  // Synchronize dynamic interactive prop changes without scene teardown
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = isInteractive;
    }
  }, [isInteractive]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dynamically create pristine canvas element to guarantee fresh WebGL context on each mount
    const canvas = document.createElement('canvas');
    canvas.className = 'w-full h-full block outline-none';
    container.insertBefore(canvas, container.firstChild);

    let isDisposed = false;
    let animationFrameId: number;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;
    let isMobile = width < 768;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent to allow CSS dark gradient / background

    // 2. Camera setup (Telephoto 40.0 deg FOV for realistic product proportions)
    const camera = new THREE.PerspectiveCamera(40.0, width / height, 0.1, 100.0);
    camera.position.set(2.4, 1.4, 3.8); // 3/4 hero presentation vantage

    // 3. WebGLRenderer configuration with resilient fallback
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'default',
      });
    } catch (err) {
      console.warn('[SceneCanvas] WebGL standard context initialization failed, falling back:', err);
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
      });
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0)); // DPR Clamping for 60 FPS
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.00;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. OrbitControls with damping and luxury constraints
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enabled = isInteractive;
    controls.target.set(0.0, 0.45, 0.0); // Focus on sneaker center of mass
    controls.enableDamping = true;
    controls.dampingFactor = 0.045; // Luxury tactile mechanical weight

    controls.minPolarAngle = Math.PI * 0.18; // ~32.4° (prevent top-pole flip)
    controls.maxPolarAngle = Math.PI * 0.52; // ~93.6° (prevent floor clipping)
    controls.minDistance = 1.80; // Macro close-up limit
    controls.maxDistance = 6.50; // Framing boundary
    controls.enablePan = false; // Keep product locked in center
    controls.enableZoom = false; // Crucial: allow mouse wheel to scroll document stages instead of hijacking zoom
    controls.enableRotate = true; // Retain smooth 3D orbit inspection on left mouse drag

    // Auto-rotation with gentle resume
    const TARGET_ROT_SPEED = 1.20; // 1.2 deg/s
    controls.autoRotate = true;
    controls.autoRotateSpeed = TARGET_ROT_SPEED;

    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let autoRotateTween: gsap.core.Tween | null = null;
    let isUserInteracting = false;

    const pauseAutoRotate = () => {
      if (autoRotateTween) autoRotateTween.kill();
      controls.autoRotate = false;
      isUserInteracting = true;
      choreographyStoreEngine.setIsUserInteracting(true);
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    };

    const scheduleResume = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (isDisposed) return;
        isUserInteracting = false;
        choreographyStoreEngine.setIsUserInteracting(false);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.0;
        autoRotateTween = gsap.to(controls, {
          autoRotateSpeed: TARGET_ROT_SPEED,
          duration: 1.5,
          ease: 'power2.out',
        });
      }, 2500); // 2.5s idle threshold
    };

    // Orbit rotation SFX on user drag
    let lastRotationSoundTime = 0;
    const onControlsChange = () => {
      if (isUserInteracting) {
        const now = performance.now();
        if (now - lastRotationSoundTime > 110) {
          lastRotationSoundTime = now;
          playRotation();
        }
      }
    };
    controls.addEventListener('change', onControlsChange);

    // User interaction arbitration
    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', pauseAutoRotate);
    window.addEventListener('pointerup', scheduleResume);
    dom.addEventListener('touchstart', pauseAutoRotate, { passive: true });
    window.addEventListener('touchend', scheduleResume);
    window.addEventListener('pointercancel', scheduleResume);

    const onWheel = () => {
      pauseAutoRotate();
      scheduleResume();
    };
    dom.addEventListener('wheel', onWheel, { passive: true });

    // 5. Studio Lighting Rig & Contact Shadow with Theme Reactivity
    const initialTheme = themeStoreEngine.getState().theme;
    const lightingRig: StudioLightingRig = createStudioLighting(scene, { isMobile, initialTheme });
    const contactShadow: ContactShadowSetup = createContactShadow(scene, initialTheme);

    const unsubTheme = themeStoreEngine.subscribe(() => {
      const currentTheme = themeStoreEngine.getState().theme;
      lightingRig.setTheme(currentTheme);
      contactShadow.setTheme(currentTheme);
    });

    /**
     * Deep disposal helper: iterates all meshes in hierarchy,
     * releasing geometries, materials, and attached textures.
     */
    const disposeHierarchy = (root: THREE.Object3D) => {
      root.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              const pbr = m as unknown as Record<string, unknown>;
              const textureKeys = [
                'map',
                'normalMap',
                'roughnessMap',
                'metalnessMap',
                'aoMap',
                'alphaMap',
                'envMap',
                'clearcoatMap',
                'clearcoatRoughnessMap',
                'clearcoatNormalMap',
                'sheenColorMap',
                'sheenRoughnessMap',
                'iridescenceMap',
                'iridescenceThicknessMap',
                'transmissionMap',
                'thicknessMap',
              ];
              textureKeys.forEach((key) => {
                const tex = pbr[key];
                if (tex && typeof (tex as THREE.Texture).dispose === 'function') {
                  (tex as THREE.Texture).dispose();
                }
              });
              m.dispose();
            });
          }
        }
      });
    };

    // 7. Model Loader with Resilient Fallback & In-Flight Cleanup
    const loader = new SneakerModelLoader('/draco/', 25000);
    let loadedResult: SneakerLoadResult | null = null;
    let isEntranceAnimating = true;

    const triggerEntranceAnimation = (model: THREE.Group) => {
      model.position.set(0.0, -0.85, 0.0);
      model.rotation.set(0.1, -1.4, 0.0);
      model.scale.set(0.7, 0.7, 0.7);

      gsap.to(model.position, {
        y: 0.0,
        duration: 1.8,
        ease: 'power3.out',
      });
      gsap.to(model.rotation, {
        y: -0.40,
        x: 0.0,
        duration: 2.0,
        ease: 'power3.out',
      });
      gsap.to(model.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 1.6,
        ease: 'back.out(1.3)',
        onComplete: () => {
          isEntranceAnimating = false;
        },
      });
    };

    loader.loadSneaker('/models/sneaker.glb', (prog) => {
      if (!isDisposed) setLoadProgress(prog);
    }).then((result) => {
      if (isDisposed) {
        disposeHierarchy(result.model);
        return;
      }
      loadedResult = result;
      scene.add(result.model);

      uniformMutationEngine.registerModel(result.model, result.materialMap);
      uniformMutationEngine.precompile(renderer, scene, camera);

      triggerEntranceAnimation(result.model);

      setIsLoading(false);
      setLoadProgress(100);
      if (onModelLoadedRef.current) {
        onModelLoadedRef.current(result);
      }
    }).catch((err) => {
      console.warn('[SceneCanvas] Model load error, invoking procedural fallback directly:', err);
      if (isDisposed) return;
      const fallback = loader.loadProceduralFallback();
      if (isDisposed) {
        disposeHierarchy(fallback.model);
        return;
      }
      loadedResult = fallback;
      scene.add(fallback.model);

      uniformMutationEngine.registerModel(fallback.model, fallback.materialMap);
      uniformMutationEngine.precompile(renderer, scene, camera);

      triggerEntranceAnimation(fallback.model);

      setIsLoading(false);
      setLoadProgress(100);
      if (onModelLoadedRef.current) {
        onModelLoadedRef.current(fallback);
      }
    });

    // 8. Resize Listener
    const handleResize = () => {
      if (!container || isDisposed) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      isMobile = width < 768;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Render Loop with Delta Clamping and GSAP Choreography
    const clock = new THREE.Clock();
    const targetCamPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();
    const tempVec = new THREE.Vector3();
    const tempVecUpper = new THREE.Vector3();
    const tempVecLaces = new THREE.Vector3();
    const tempVecCarbon = new THREE.Vector3();
    const tempVecSole = new THREE.Vector3();
    const tempVecAccents = new THREE.Vector3();
    const hotspotCamOffset = new THREE.Vector3(1.2, 0.7, 1.6); // Stable vantage > minDistance (1.80)

    let wasExplodedState = false;

    const renderLoop = () => {
      if (isDisposed) return;
      const rawDelta = clock.getDelta();
      const delta = Math.min(rawDelta, 0.1);
      void delta;

      const choreo = choreographyStoreEngine.getState();
      const frame = getChoreographyFrame(choreo.scrollProgress);

      // Sound trigger for exploded transition crossing
      const isExplodedNow = (frame.explodedOffsets.upper[1] > 0.08);
      if (isExplodedNow !== wasExplodedState) {
        wasExplodedState = isExplodedNow;
        playExplodeSnap();
      }

      // Camera choreography interpolation when not manually interacting
      if (!isUserInteracting) {
        if (choreo.activeHotspotData && choreo.activeStage !== 'exploded') {
          tempVec.set(...choreo.activeHotspotData.worldPos);
          if (loadedResult && loadedResult.rigGroups) {
            const rg = loadedResult.rigGroups[choreo.activeHotspotData.rigGroup];
            if (rg) {
              tempVec.add(rg.position);
            }
          }
          if (loadedResult && loadedResult.model) {
            tempVec.applyMatrix4(loadedResult.model.matrixWorld);
          }
          controls.target.lerp(tempVec, 0.05);

          // Position camera at stable offset from the hotspot (> minDistance 1.80)
          targetCamPos.copy(tempVec).add(hotspotCamOffset);
          camera.position.lerp(targetCamPos, 0.05);
        } else {
          targetCamPos.set(...frame.cameraPos);
          targetLookAt.set(...frame.lookAt);
          camera.position.lerp(targetCamPos, 0.045);
          controls.target.lerp(targetLookAt, 0.045);
        }

        // Apply shoe base rotation & levitation once entrance finishes
        if (loadedResult && loadedResult.model && !isEntranceAnimating) {
          const levitationY = choreo.activeStage === 'hero'
            ? Math.sin(clock.getElapsedTime() * 1.8) * 0.035
            : 0;

          const effectiveShoePosX = isMobile ? 0.0 : frame.shoePosition[0];
          const effectiveShoePosY = isMobile ? frame.shoePosition[1] * 0.6 : frame.shoePosition[1];
          loadedResult.model.position.x = THREE.MathUtils.lerp(loadedResult.model.position.x, effectiveShoePosX, 0.06);
          loadedResult.model.position.y = THREE.MathUtils.lerp(loadedResult.model.position.y, effectiveShoePosY + levitationY, 0.06);
          loadedResult.model.position.z = THREE.MathUtils.lerp(loadedResult.model.position.z, frame.shoePosition[2], 0.06);

          loadedResult.model.rotation.x = THREE.MathUtils.lerp(loadedResult.model.rotation.x, frame.shoeRotation[0], 0.06);
          loadedResult.model.rotation.y = THREE.MathUtils.lerp(loadedResult.model.rotation.y, frame.shoeRotation[1], 0.06);
          loadedResult.model.rotation.z = THREE.MathUtils.lerp(loadedResult.model.rotation.z, frame.shoeRotation[2], 0.06);

          // Dynamic contact shadow & AO plane synchronization with shoe ground projection
          contactShadow.aoPlane.position.x = loadedResult.model.position.x;
          contactShadow.aoPlane.position.z = loadedResult.model.position.z;
          contactShadow.aoPlane.rotation.z = loadedResult.model.rotation.y;
          contactShadow.shadowPlane.position.x = loadedResult.model.position.x;
          contactShadow.shadowPlane.position.z = loadedResult.model.position.z;

          // Diffuse & soften ambient occlusion shadow when floating in zero-g
          const elevation = Math.max(0, loadedResult.model.position.y);
          const currentTheme = themeStoreEngine.getState().theme;
          const baseAoOpacity = currentTheme === 'light' ? 0.35 : 0.65;
          (contactShadow.aoPlane.material as THREE.MeshBasicMaterial).opacity =
            baseAoOpacity * Math.max(0.18, 1.0 - elevation * 1.6);
          const aoScale = 1.0 + elevation * 0.5;
          contactShadow.aoPlane.scale.set(aoScale, aoScale, 1.0);
        }
      }

      // Exploded Rig Groups position update
      if (loadedResult && loadedResult.rigGroups) {
        const rg = loadedResult.rigGroups;
        tempVecUpper.set(...frame.explodedOffsets.upper);
        tempVecLaces.set(...frame.explodedOffsets.laces);
        tempVecCarbon.set(...frame.explodedOffsets.carbonPlate);
        tempVecSole.set(...frame.explodedOffsets.outsole);
        tempVecAccents.set(...frame.explodedOffsets.heelAccents);

        // In Stage 2, add subtle tactile elevation emphasis to selected component
        if (choreo.activeStage === 'exploded' && choreo.activeHotspotId) {
          if (choreo.activeHotspotId === 'upper-mesh') tempVecUpper.y += 0.025;
          if (choreo.activeHotspotId === 'adaptive-laces') tempVecLaces.y += 0.025;
          if (choreo.activeHotspotId === 'carbon-plate') tempVecCarbon.y -= 0.025;
          if (choreo.activeHotspotId === 'nitro-cushion') tempVecSole.y -= 0.025;
          if (choreo.activeHotspotId === 'heel-accents') tempVecAccents.z -= 0.025;
        }

        rg.upper.position.lerp(tempVecUpper, 0.08);
        rg.laces.position.lerp(tempVecLaces, 0.08);
        rg.carbon.position.lerp(tempVecCarbon, 0.08);
        rg.sole.position.lerp(tempVecSole, 0.08);
        rg.accents.position.lerp(tempVecAccents, 0.08);
      }

      // Hotspots 3D-to-2D screen projection (tracks exploded rig groups)
      if (width > 0 && height > 0) {
        const projected: Record<string, { x: number; y: number; visible: boolean }> = {};
        for (let i = 0; i < HOTSPOT_ITEMS.length; i++) {
          const h = HOTSPOT_ITEMS[i];
          tempVec.set(...h.worldPos);
          if (loadedResult && loadedResult.rigGroups) {
            const rg = loadedResult.rigGroups[h.rigGroup];
            if (rg) {
              tempVec.add(rg.position);
            }
          }
          if (loadedResult && loadedResult.model) {
            tempVec.applyMatrix4(loadedResult.model.matrixWorld);
          }
          tempVec.project(camera);

          const isFacing = tempVec.z < 1.0;
          const sx = (tempVec.x * 0.5 + 0.5) * width;
          const sy = (-tempVec.y * 0.5 + 0.5) * height;
          const visible = isFacing && sx >= 20 && sx <= width - 20 && sy >= 20 && sy <= height - 20;
          projected[h.id] = { x: Math.round(sx), y: Math.round(sy), visible };
        }

        // Project heel counter & aerodynamic accents for Stage 2 architectural calipers
        tempVecAccents.set(0.0, 0.25, -0.85);
        if (loadedResult && loadedResult.rigGroups) {
          tempVecAccents.add(loadedResult.rigGroups.accents.position);
        }
        if (loadedResult && loadedResult.model) {
          tempVecAccents.applyMatrix4(loadedResult.model.matrixWorld);
        }
        tempVecAccents.project(camera);
        const heelFacing = tempVecAccents.z < 1.0;
        const heelSx = (tempVecAccents.x * 0.5 + 0.5) * width;
        const heelSy = (-tempVecAccents.y * 0.5 + 0.5) * height;
        const heelVis = heelFacing && heelSx >= 20 && heelSx <= width - 20 && heelSy >= 20 && heelSy <= height - 20;
        projected['heel-accents'] = { x: Math.round(heelSx), y: Math.round(heelSy), visible: heelVis };

        hotspotsStoreEngine.setPositions(projected);
        if (onHotspotsUpdateRef.current) {
          onHotspotsUpdateRef.current(projected);
        }
      }

      controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // 10. Comprehensive Teardown Routine
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      if (idleTimer) clearTimeout(idleTimer);
      if (autoRotateTween) autoRotateTween.kill();

      // Clean up window and DOM event listeners
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('change', onControlsChange);
      dom.removeEventListener('pointerdown', pauseAutoRotate);
      window.removeEventListener('pointerup', scheduleResume);
      dom.removeEventListener('touchstart', pauseAutoRotate);
      window.removeEventListener('touchend', scheduleResume);
      window.removeEventListener('pointercancel', scheduleResume);
      dom.removeEventListener('wheel', onWheel);

      // Step 1: Dispose model geometries, materials, and textures
      if (loadedResult && loadedResult.model) {
        disposeHierarchy(loadedResult.model);
        scene.remove(loadedResult.model);
      }

      // Step 2: Dispose remaining scene meshes/geometries/materials
      disposeHierarchy(scene);

      // Step 3: Dispose lighting rig, shadow plane, controls, mutation engine, and loader
      unsubTheme();
      lightingRig.dispose();
      contactShadow.dispose();
      controls.dispose();
      controlsRef.current = null;
      uniformMutationEngine.clear();
      try {
        gsap.ticker.sleep();
      } catch {}
      loader.dispose();

      // Step 4: Dispose WebGLRenderer internal state and release WebGL hardware context
      if (typeof (renderer as any).forceContextLoss === 'function') {
        (renderer as any).forceContextLoss();
      }
      renderer.dispose();

      // Step 5: Detach dynamic canvas from DOM
      if (container) {
        const hasCanvas = typeof container.contains === 'function'
          ? container.contains(canvas)
          : (canvas.parentNode === container || (Array.isArray(container.childNodes) && container.childNodes.indexOf(canvas as any) !== -1));
        if (hasCanvas) {
          try {
            container.removeChild(canvas);
          } catch {
            // Ignore removal errors if already detached
          }
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`three-canvas-container ${isInteractive ? 'interactive' : ''} ${className}`}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-950/80 backdrop-blur-md z-30 transition-opacity duration-700 pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-brand-lime/20 animate-ping" />
              <div className="w-16 h-16 rounded-full border-2 border-brand-lime border-t-transparent animate-spin" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs tracking-[0.25em] text-brand-lime uppercase">
                Calibrating 3D Engine
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
                {loadProgress}% loaded
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
