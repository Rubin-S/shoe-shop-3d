/**
 * src/utils/proceduralTextures.ts
 *
 * Procedural Normal Map and Surface Texture Generators for PBR Materials.
 * Generates mathematically consistent micro-grain normal maps for:
 * - Tumbled Leather (Cellular Voronoi pebble micro-grain)
 * - AeroWeave Mesh (Interlocking cross-hatch periodic knit)
 * - Vulcanized Rubber Tread (Directional herringbone chevron traction)
 *
 * Supports headless Node.js test environments (Uint8ClampedArray)
 * and active browser WebGL rendering contexts (THREE.CanvasTexture).
 */

import * as THREE from 'three';

export type ProceduralTextureType = 'leather' | 'mesh' | 'rubber';

export interface ProceduralTextureResult {
  type: ProceduralTextureType;
  size: number;
  data: Uint8ClampedArray;
  format: 'RGBA';
  isNormalMap: boolean;
  texture?: THREE.CanvasTexture | THREE.DataTexture;
}

export class ProceduralTextureEngine {
  private static normalCache: Map<string, Uint8ClampedArray> = new Map();
  private static roughnessCache: Map<string, Uint8ClampedArray> = new Map();

  /**
   * Generates a tangent-space normal map as a raw RGBA Uint8ClampedArray buffer.
   * Guaranteed to work in both browser and headless Node.js test environments.
   */
  public static generateNormalMap(
    type: ProceduralTextureType | string,
    size: number = 512
  ): ProceduralTextureResult {
    if (!['leather', 'mesh', 'rubber'].includes(type)) {
      throw new Error(`Unknown procedural texture type: ${type}`);
    }

    const validSize = Math.max(16, Math.min(2048, Math.floor(size)));
    const cacheKey = `${type}_${validSize}`;
    let cached = this.normalCache.get(cacheKey);

    if (!cached) {
      cached = new Uint8ClampedArray(validSize * validSize * 4);

      for (let y = 0; y < validSize; y++) {
        for (let x = 0; x < validSize; x++) {
          const idx = (y * validSize + x) * 4;
          let nx = 128;
          let ny = 128;
          const nz = 255;

          if (type === 'leather') {
            // Multi-octave organic tumbled calfskin pebble grain with cellular boundaries and vamp micro-perforations
            const macroFolds = Math.sin(x * 0.08 + Math.cos(y * 0.07) * 1.5) * 16;
            const pebbleCells = Math.sin(x * 0.22 + y * 0.18) * Math.cos(y * 0.24 - x * 0.14) * 28;
            const cellularCrevices = (Math.sin(x * 0.44 + Math.sin(y * 0.38) * 1.2) + Math.cos(y * 0.44 + Math.cos(x * 0.38) * 1.2)) * 10;
            const microPores = Math.sin(x * 0.65) * Math.cos(y * 0.62) * 8;

            // Micro-perforations: regular lattice of subtle circular indentations
            const perfSpacing = 32;
            const px = (x % perfSpacing) - (perfSpacing / 2);
            const py = (y % perfSpacing) - (perfSpacing / 2);
            const pDist = Math.sqrt(px * px + py * py);
            const perfEffect = pDist < 6.0 ? (1.0 - pDist / 6.0) * 20.0 : 0.0;
            const perfDirX = pDist < 6.0 && pDist > 0.1 ? (px / pDist) * perfEffect : 0.0;
            const perfDirY = pDist < 6.0 && pDist > 0.1 ? (py / pDist) * perfEffect : 0.0;

            const totalDispX = macroFolds * 0.4 + pebbleCells + cellularCrevices * 0.6 + microPores * 0.7 + perfDirX;
            const totalDispY = macroFolds * 0.35 + pebbleCells * 0.85 + cellularCrevices * 0.6 - microPores * 0.6 + perfDirY;

            nx = Math.min(255, Math.max(0, 128 + Math.round(totalDispX)));
            ny = Math.min(255, Math.max(0, 128 + Math.round(totalDispY)));
          } else if (type === 'mesh') {
            // Interlocking technical AeroWeave knit with warp/weft relief and micro-filament twist
            const warp = Math.sin(x * 0.48) * 38;
            const weft = Math.cos(y * 0.48) * 38;
            const crossStitch = Math.sin((x + y) * 0.40) * 16;
            const purlLoops = Math.cos((x - y) * 0.40) * 14;
            const filamentTwist = Math.sin(x * 0.96 - y * 0.96) * 10;
            nx = Math.min(255, Math.max(0, 128 + Math.round(warp + crossStitch + filamentTwist * 0.5)));
            ny = Math.min(255, Math.max(0, 128 - Math.round(weft - purlLoops + filamentTwist * 0.5)));
          } else if (type === 'rubber') {
            // High-traction vulcanized herringbone chevron grooves with stippled grip & flex siping
            const chevronPhase = y % 16 < 8 ? (y % 16) * 0.75 : (16 - (y % 16)) * 0.75;
            const chevronX = (x + chevronPhase) % 12;
            const tread = chevronX < 6 ? 44 : -44;
            const stipple = Math.sin(x * 0.38) * Math.cos(y * 0.38) * 10;
            const siping = y % 32 < 2 ? -22 : 0;
            nx = Math.min(255, Math.max(0, 128 + Math.round(tread + stipple)));
            ny = Math.min(255, Math.max(0, 128 + Math.round(stipple * 1.2 + siping)));
          }

          cached[idx] = nx;      // Tangent Normal X
          cached[idx + 1] = ny;  // Tangent Normal Y
          cached[idx + 2] = nz;  // Tangent Normal Z (standard tangent perpendicular vector = 255)
          cached[idx + 3] = 255; // Alpha
        }
      }
      this.normalCache.set(cacheKey, cached);
    }

    const buffer = new Uint8ClampedArray(cached);

    return {
      type: type as ProceduralTextureType,
      size: validSize,
      data: buffer,
      format: 'RGBA',
      isNormalMap: true,
    };
  }

  /**
   * Generates a complementary micro-roughness map to accentuate crevice depth.
   */
  public static generateRoughnessMap(
    type: ProceduralTextureType | string,
    size: number = 512,
    baseRoughness: number = 0.5
  ): ProceduralTextureResult {
    if (!['leather', 'mesh', 'rubber'].includes(type)) {
      throw new Error(`Unknown procedural texture type: ${type}`);
    }

    const validSize = Math.max(16, Math.min(2048, Math.floor(size)));
    const cacheKey = `${type}_${validSize}_${baseRoughness}`;
    let cached = this.roughnessCache.get(cacheKey);

    if (!cached) {
      cached = new Uint8ClampedArray(validSize * validSize * 4);
      const baseByte = Math.round(baseRoughness * 255);

      for (let y = 0; y < validSize; y++) {
        for (let x = 0; x < validSize; x++) {
          const idx = (y * validSize + x) * 4;
          let r = baseByte;

          if (type === 'leather') {
            const pebble = Math.sin(x * 0.22 + y * 0.18) * Math.cos(y * 0.24 - x * 0.14) * 22;
            const crevices = (Math.sin(x * 0.44) + Math.cos(y * 0.44)) * 12;
            const perfSpacing = 32;
            const px = (x % perfSpacing) - (perfSpacing / 2);
            const py = (y % perfSpacing) - (perfSpacing / 2);
            const pDist = Math.sqrt(px * px + py * py);
            const perfRoughness = pDist < 6.0 ? (1.0 - pDist / 6.0) * 32 : 0;
            r = Math.min(255, Math.max(0, baseByte + Math.round(pebble + crevices + perfRoughness)));
          } else if (type === 'mesh') {
            const w = (Math.sin(x * 0.48) + Math.cos(y * 0.48)) * 25;
            r = Math.min(255, Math.max(0, baseByte + Math.round(w)));
          } else if (type === 'rubber') {
            const t = (x % 8 < 4 ? 18 : -18);
            const sipingRoughness = y % 32 < 2 ? 30 : 0;
            r = Math.min(255, Math.max(0, baseByte + t + sipingRoughness));
          }

          cached[idx] = r;
          cached[idx + 1] = r;
          cached[idx + 2] = r;
          cached[idx + 3] = 255;
        }
      }
      this.roughnessCache.set(cacheKey, cached);
    }

    const buffer = new Uint8ClampedArray(cached);

    return {
      type: type as ProceduralTextureType,
      size: validSize,
      data: buffer,
      format: 'RGBA',
      isNormalMap: false,
    };
  }

  /**
   * Creates a GPU-ready Three.js CanvasTexture from procedural pixel data.
   * Configures seamless repeat wrapping, anisotropic filtering, and linear color space.
   */
  public static createThreeTexture(
    type: ProceduralTextureType,
    size: number = 512,
    repeatX: number = 8,
    repeatY: number = 8
  ): THREE.CanvasTexture {
    const rawResult = this.generateNormalMap(type, size);

    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const imgData = ctx.createImageData(size, size);
        imgData.data.set(rawResult.data);
        ctx.putImageData(imgData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.name = `tex_procedural_${type}_normal`;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 8;
        texture.colorSpace = THREE.NoColorSpace; // Normal maps MUST be linear!
        texture.needsUpdate = true;
        return texture;
      }
    }

    // Fallback for headless testing or non-DOM environments
    const dataTexture = new THREE.DataTexture(
      new Uint8Array(rawResult.data),
      size,
      size,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );

    dataTexture.name = `tex_procedural_${type}_data`;
    dataTexture.wrapS = THREE.RepeatWrapping;
    dataTexture.wrapT = THREE.RepeatWrapping;
    dataTexture.repeat.set(repeatX, repeatY);
    dataTexture.generateMipmaps = true;
    dataTexture.minFilter = THREE.LinearMipmapLinearFilter;
    dataTexture.magFilter = THREE.LinearFilter;
    dataTexture.colorSpace = THREE.NoColorSpace;
    dataTexture.needsUpdate = true;

    return dataTexture as unknown as THREE.CanvasTexture;
  }

  /**
   * Creates a GPU-ready Three.js CanvasTexture for micro-roughness modulation.
   */
  public static createThreeRoughnessTexture(
    type: ProceduralTextureType,
    size: number = 512,
    baseRoughness: number = 0.5,
    repeatX: number = 8,
    repeatY: number = 8
  ): THREE.CanvasTexture {
    const rawResult = this.generateRoughnessMap(type, size, baseRoughness);

    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const imgData = ctx.createImageData(size, size);
        imgData.data.set(rawResult.data);
        ctx.putImageData(imgData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.name = `tex_procedural_${type}_roughness`;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 8;
        texture.colorSpace = THREE.NoColorSpace;
        texture.needsUpdate = true;
        return texture;
      }
    }

    const dataTexture = new THREE.DataTexture(
      new Uint8Array(rawResult.data),
      size,
      size,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );

    dataTexture.name = `tex_procedural_${type}_roughness_data`;
    dataTexture.wrapS = THREE.RepeatWrapping;
    dataTexture.wrapT = THREE.RepeatWrapping;
    dataTexture.repeat.set(repeatX, repeatY);
    dataTexture.generateMipmaps = true;
    return dataTexture as unknown as THREE.CanvasTexture;
  }

  /**
   * Creates a high-fidelity 2x2 twill carbon fiber weave normal map.
   */
  public static createCarbonTexture(
    size: number = 256,
    repeatX: number = 16,
    repeatY: number = 16
  ): THREE.CanvasTexture {
    const validSize = Math.max(16, Math.min(1024, Math.floor(size)));
    const buffer = new Uint8ClampedArray(validSize * validSize * 4);

    for (let y = 0; y < validSize; y++) {
      for (let x = 0; x < validSize; x++) {
        const idx = (y * validSize + x) * 4;
        // 2x2 twill diagonal pattern with dual-axis fiber tow displacement
        const cellX = Math.floor((x / validSize) * 32);
        const cellY = Math.floor((y / validSize) * 32);
        const twill = (cellX + cellY) % 4 < 2;
        const phase = twill ? (x % 8) / 8 : (y % 8) / 8;
        const towDisplacement = Math.sin(phase * Math.PI) * 32;
        const microFilament = Math.sin((twill ? y : x) * 1.2) * 6;

        const nx = twill ? 128 + Math.round(towDisplacement + microFilament) : 128;
        const ny = !twill ? 128 + Math.round(towDisplacement + microFilament) : 128;

        buffer[idx] = Math.min(255, Math.max(0, nx));
        buffer[idx + 1] = Math.min(255, Math.max(0, ny));
        buffer[idx + 2] = 255;
        buffer[idx + 3] = 255;
      }
    }

    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const canvas = document.createElement('canvas');
      canvas.width = validSize;
      canvas.height = validSize;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imgData = ctx.createImageData(validSize, validSize);
        imgData.data.set(buffer);
        ctx.putImageData(imgData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.name = 'tex_procedural_carbon_normal';
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 8;
        texture.colorSpace = THREE.NoColorSpace;
        texture.needsUpdate = true;
        return texture;
      }
    }

    const dataTex = new THREE.DataTexture(
      new Uint8Array(buffer),
      validSize,
      validSize,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    dataTex.name = 'tex_procedural_carbon_data';
    dataTex.wrapS = THREE.RepeatWrapping;
    dataTex.wrapT = THREE.RepeatWrapping;
    dataTex.repeat.set(repeatX, repeatY);
    dataTex.generateMipmaps = true;
    dataTex.minFilter = THREE.LinearMipmapLinearFilter;
    dataTex.magFilter = THREE.LinearFilter;
    dataTex.colorSpace = THREE.NoColorSpace;
    dataTex.needsUpdate = true;
    return dataTex as unknown as THREE.CanvasTexture;
  }
}
