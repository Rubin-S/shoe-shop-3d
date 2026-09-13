import * as THREE from 'three';
import gsap from 'gsap';

export interface StudioLightingRig {
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  rimLight: THREE.DirectionalLight;
  bounceLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  lightGroup: THREE.Group;
  setTheme: (theme: 'light' | 'dark') => void;
  dispose: () => void;
}

export interface StudioLightingOptions {
  isMobile?: boolean;
  initialTheme?: 'light' | 'dark';
}

/**
 * Creates the high-end 4-point luxury studio lighting rig.
 * Key Light: 5200K warm-neutral daylight with PCFSoftShadowMap and normalBias.
 * Fill Light: 6500K cool fill, shadowless for balanced medial shadows.
 * Rim Light: High rear elevation kicker for crisp silhouette edge and collar highlights.
 * Ground Bounce Light: Soft upward reflection revealing intricate outsole traction lugs.
 * Ambient Hemisphere: Calibrated sky/ground balance for photorealistic ambient fill.
 */
export function createStudioLighting(
  scene: THREE.Scene,
  options: StudioLightingOptions = {}
): StudioLightingRig {
  const isMobile = options.isMobile ?? (typeof window !== 'undefined' && window.innerWidth < 768);
  const initialTheme = options.initialTheme ?? 'dark';
  const lightGroup = new THREE.Group();
  lightGroup.name = 'studio_lighting_rig';

  // 1. Key Light (Primary Modeling & Shadows)
  const keyLight = new THREE.DirectionalLight(
    initialTheme === 'light' ? 0xfffdf8 : 0xfff8ed,
    initialTheme === 'light' ? 2.15 : 2.20
  );
  keyLight.name = 'light_key';
  keyLight.position.set(4.2, 5.8, 3.8);
  keyLight.target.position.set(0, 0.4, 0);
  keyLight.castShadow = true;

  // Shadow Map Configuration
  const shadowResolution = isMobile ? 1024 : 2048;
  keyLight.shadow.mapSize.width = shadowResolution;
  keyLight.shadow.mapSize.height = shadowResolution;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 18.0;
  keyLight.shadow.camera.left = -3.5;
  keyLight.shadow.camera.right = 3.5;
  keyLight.shadow.camera.top = 3.5;
  keyLight.shadow.camera.bottom = -3.5;
  keyLight.shadow.bias = -0.00012;
  keyLight.shadow.normalBias = 0.038;
  keyLight.shadow.radius = 2.8;

  lightGroup.add(keyLight);
  lightGroup.add(keyLight.target);

  // 2. Fill Light (Medial Shadow Softener, Shadowless)
  const fillLight = new THREE.DirectionalLight(
    initialTheme === 'light' ? 0xf0f4f8 : 0xebf2ff,
    initialTheme === 'light' ? 1.15 : 0.85
  );
  fillLight.name = 'light_fill';
  fillLight.position.set(-4.8, 2.8, -1.8);
  fillLight.target.position.set(0, 0.4, 0);
  fillLight.castShadow = false;

  lightGroup.add(fillLight);
  lightGroup.add(fillLight.target);

  // 3. Rim / Kicker Light (Silhouette Edge & Specular Rim Accent)
  const rimLight = new THREE.DirectionalLight(
    0xffffff,
    initialTheme === 'light' ? 1.55 : 2.80
  );
  rimLight.name = 'light_rim';
  rimLight.position.set(-1.8, 5.2, -5.2);
  rimLight.target.position.set(0, 0.4, 0);
  rimLight.castShadow = false;

  lightGroup.add(rimLight);
  lightGroup.add(rimLight.target);

  // 4. Ground Bounce Light (Floor Reflection upward onto Outsole Lugs)
  const bounceLight = new THREE.DirectionalLight(
    initialTheme === 'light' ? 0xede7dc : 0x181920,
    initialTheme === 'light' ? 0.65 : 0.40
  );
  bounceLight.name = 'light_bounce';
  bounceLight.position.set(0.0, -2.5, 0.0);
  bounceLight.target.position.set(0, 0.4, 0);
  bounceLight.castShadow = false;

  lightGroup.add(bounceLight);
  lightGroup.add(bounceLight.target);

  // 5. Ambient Hemisphere Light
  const hemiLight = new THREE.HemisphereLight(
    initialTheme === 'light' ? 0xffffff : 0x1c1d22,
    initialTheme === 'light' ? 0xe8e4dc : 0x0a0a0c,
    initialTheme === 'light' ? 1.05 : 0.60
  );
  hemiLight.name = 'light_hemi';
  lightGroup.add(hemiLight);

  scene.add(lightGroup);

  const setTheme = (theme: 'light' | 'dark') => {
    const isLight = theme === 'light';

    gsap.to(keyLight, {
      intensity: isLight ? 2.15 : 2.20,
      duration: 0.8,
      ease: 'power2.out',
    });
    keyLight.color.set(isLight ? 0xfffdf8 : 0xfff8ed);

    gsap.to(fillLight, {
      intensity: isLight ? 1.15 : 0.85,
      duration: 0.8,
      ease: 'power2.out',
    });
    fillLight.color.set(isLight ? 0xf0f4f8 : 0xebf2ff);

    gsap.to(rimLight, {
      intensity: isLight ? 1.55 : 2.80,
      duration: 0.8,
      ease: 'power2.out',
    });

    gsap.to(bounceLight, {
      intensity: isLight ? 0.65 : 0.40,
      duration: 0.8,
      ease: 'power2.out',
    });
    bounceLight.color.set(isLight ? 0xede7dc : 0x181920);

    gsap.to(hemiLight, {
      intensity: isLight ? 1.05 : 0.60,
      duration: 0.8,
      ease: 'power2.out',
    });
    hemiLight.color.set(isLight ? 0xffffff : 0x1c1d22);
    hemiLight.groundColor.set(isLight ? 0xe8e4dc : 0x0a0a0c);
  };

  return {
    keyLight,
    fillLight,
    rimLight,
    bounceLight,
    hemiLight,
    lightGroup,
    setTheme,
    dispose: () => {
      scene.remove(lightGroup);
      keyLight.dispose();
      fillLight.dispose();
      rimLight.dispose();
      bounceLight.dispose();
      hemiLight.dispose();
    },
  };
}
