import * as THREE from 'three';
import gsap from 'gsap';

export interface ContactShadowSetup {
  shadowGroup: THREE.Group;
  shadowPlane: THREE.Mesh;
  aoPlane: THREE.Mesh;
  floorPlane: THREE.Mesh;
  setTheme: (theme: 'light' | 'dark') => void;
  dispose: () => void;
}

/**
 * Procedurally generates a 512x512 cosine radial falloff texture
 * representing soft ambient occlusion directly beneath the shoe sole.
 * Equation: I(r) = cos^2(pi * r / 2) * 0.75
 */
export function generateCosineAOTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    const centerX = size / 2;
    const centerY = size / 2;
    const radiusX = size * 0.22;
    const radiusY = size * 0.44;

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const dx = (px - centerX) / radiusX;
        const dy = (py - centerY) / radiusY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 1.0) {
          const factor = Math.cos((dist * Math.PI) / 2);
          const alpha = Math.pow(factor, 1.6) * 0.65;
          const idx = (py * size + px) * 4;
          data[idx] = 18;
          data[idx + 1] = 18;
          data[idx + 2] = 22;
          data[idx + 3] = Math.round(alpha * 255);
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

/**
 * Procedurally generates a 1024x1024 radial gradient alpha mask
 * ensuring the studio floor cyclorama dissolves seamlessly to 0% opacity
 * before reaching the geometric perimeter, eliminating visible circular horizon cuts.
 * Note: Three.js USE_ALPHAMAP shader chunk samples the green channel (.g).
 * Generating a pure grayscale rgb(x, x, x) gradient guarantees deterministic,
 * driver-independent smooth alpha falloff on all GPU architectures.
 */
export function generateCycloramaAlphaTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx && typeof ctx.createRadialGradient === 'function') {
    ctx.clearRect(0, 0, size, size);
    const center = size / 2;
    // Pure grayscale radial gradient from center opaque (white) to perimeter transparent (black)
    const grad = ctx.createRadialGradient(center, center, size * 0.10, center, center, size * 0.48);
    grad.addColorStop(0.0, 'rgb(255, 255, 255)');
    grad.addColorStop(0.25, 'rgb(225, 225, 225)');
    grad.addColorStop(0.55, 'rgb(120, 120, 120)');
    grad.addColorStop(0.82, 'rgb(28, 28, 28)');
    grad.addColorStop(1.0, 'rgb(0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  } else if (ctx) {
    if (typeof ctx.clearRect === 'function') ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'rgb(128, 128, 128)';
    if (typeof ctx.fillRect === 'function') ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

/**
 * Creates the multi-layer contact shadow system:
 * 1. Dynamic ShadowReceiver plane (ShadowMaterial) at y = 0.000.
 * 2. Procedural Cosine AO plane at y = 0.002.
 * 3. Seamless Studio Floor Cyclorama with radial alpha fade at y = -0.001.
 * Supports smooth Light/Dark theme transitions.
 */
export function createContactShadow(
  scene: THREE.Scene,
  initialTheme: 'light' | 'dark' = 'light'
): ContactShadowSetup {
  const shadowGroup = new THREE.Group();
  shadowGroup.name = 'contact_shadow_group';

  const isLight = initialTheme === 'light';

  // 1. Dynamic Shadow Receiver Plane
  const shadowGeo = new THREE.PlaneGeometry(16, 16);
  const shadowMat = new THREE.ShadowMaterial({
    opacity: isLight ? 0.22 : 0.38,
    transparent: true,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.name = 'mesh_dynamic_shadow_receiver';
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.0, 0);
  shadowPlane.receiveShadow = true;
  shadowGroup.add(shadowPlane);

  // 2. Procedural Cosine AO Contact Mesh
  const aoTexture = generateCosineAOTexture();
  const aoGeo = new THREE.PlaneGeometry(1.6, 3.2);
  const aoMat = new THREE.MeshBasicMaterial({
    map: aoTexture,
    transparent: true,
    opacity: isLight ? 0.35 : 0.65,
    depthWrite: false,
  });
  const aoPlane = new THREE.Mesh(aoGeo, aoMat);
  aoPlane.name = 'mesh_cosine_ao_contact';
  aoPlane.rotation.x = -Math.PI / 2;
  aoPlane.position.set(0, 0.002, 0);
  shadowGroup.add(aoPlane);

  // 3. Seamless Studio Floor Cyclorama (Radial Alpha Fade, Zero Geometric Edge)
  const floorAlphaTex = generateCycloramaAlphaTexture();
  const floorGeo = new THREE.PlaneGeometry(48, 48);
  const floorMat = new THREE.MeshStandardMaterial({
    color: isLight ? 0xf8f9fa : 0x050507,
    roughness: isLight ? 0.82 : 0.45,
    metalness: 0.0,
    alphaMap: floorAlphaTex,
    transparent: true,
    opacity: 0.0, // Disabled: clean floating zero-g aesthetic with transparent shadow
    depthWrite: false,
  });
  const floorPlane = new THREE.Mesh(floorGeo, floorMat);
  floorPlane.name = 'mesh_studio_floor';
  floorPlane.rotation.x = -Math.PI / 2;
  floorPlane.position.set(0, -0.001, 0);
  floorPlane.receiveShadow = true;
  floorPlane.renderOrder = -1;
  floorPlane.visible = false; // Completely remove visible white platform disc
  shadowGroup.add(floorPlane);

  scene.add(shadowGroup);

  const setTheme = (theme: 'light' | 'dark') => {
    const light = theme === 'light';

    gsap.to(shadowMat, {
      opacity: light ? 0.22 : 0.38,
      duration: 0.8,
      ease: 'power2.out',
    });

    gsap.to(aoMat, {
      opacity: light ? 0.35 : 0.65,
      duration: 0.8,
      ease: 'power2.out',
    });

    floorMat.color.set(light ? 0xf8f9fa : 0x050507);
    floorMat.roughness = light ? 0.82 : 0.45;
    floorMat.opacity = 0.0;
    floorPlane.visible = false;
  };

  return {
    shadowGroup,
    shadowPlane,
    aoPlane,
    floorPlane,
    setTheme,
    dispose: () => {
      scene.remove(shadowGroup);
      shadowGeo.dispose();
      shadowMat.dispose();
      aoGeo.dispose();
      aoMat.dispose();
      aoTexture.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      floorAlphaTex.dispose();
    },
  };
}
