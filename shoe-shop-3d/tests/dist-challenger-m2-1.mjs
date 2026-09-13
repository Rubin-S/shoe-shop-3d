// tests/challenger-m2-1-stress.ts
import * as THREE5 from "three";

// src/utils/proceduralTextures.ts
import * as THREE from "three";
var ProceduralTextureEngine = class {
  static normalCache = /* @__PURE__ */ new Map();
  static roughnessCache = /* @__PURE__ */ new Map();
  /**
   * Generates a tangent-space normal map as a raw RGBA Uint8ClampedArray buffer.
   * Guaranteed to work in both browser and headless Node.js test environments.
   */
  static generateNormalMap(type, size = 512) {
    if (!["leather", "mesh", "rubber"].includes(type)) {
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
          if (type === "leather") {
            const macroFolds = Math.sin(x * 0.08 + Math.cos(y * 0.07) * 1.5) * 18;
            const pebbleCells = Math.sin(x * 0.22 + y * 0.18) * Math.cos(y * 0.24 - x * 0.14) * 26;
            const microPores = Math.sin(x * 0.65) * Math.cos(y * 0.62) * 10;
            const totalDispX = macroFolds * 0.5 + pebbleCells + microPores * 0.8;
            const totalDispY = macroFolds * 0.4 + pebbleCells * 0.85 - microPores * 0.7;
            nx = Math.min(255, Math.max(0, 128 + Math.round(totalDispX)));
            ny = Math.min(255, Math.max(0, 128 + Math.round(totalDispY)));
          } else if (type === "mesh") {
            const warp = Math.sin(x * 0.48) * 36;
            const weft = Math.cos(y * 0.48) * 36;
            const microKnit = Math.sin((x + y) * 0.35) * 14;
            nx = Math.min(255, Math.max(0, 128 + Math.round(warp + microKnit)));
            ny = Math.min(255, Math.max(0, 128 - Math.round(weft + microKnit)));
          } else if (type === "rubber") {
            const chevronPhase = y % 16 < 8 ? y % 16 * 0.75 : (16 - y % 16) * 0.75;
            const chevronX = (x + chevronPhase) % 12;
            const tread = chevronX < 6 ? 42 : -42;
            const stipple = Math.sin(x * 0.35) * Math.cos(y * 0.35) * 8;
            nx = Math.min(255, Math.max(0, 128 + Math.round(tread + stipple)));
            ny = Math.min(255, Math.max(0, 128 + Math.round(stipple * 1.2)));
          }
          cached[idx] = nx;
          cached[idx + 1] = ny;
          cached[idx + 2] = nz;
          cached[idx + 3] = 255;
        }
      }
      this.normalCache.set(cacheKey, cached);
    }
    const buffer = new Uint8ClampedArray(cached);
    return {
      type,
      size: validSize,
      data: buffer,
      format: "RGBA",
      isNormalMap: true
    };
  }
  /**
   * Generates a complementary micro-roughness map to accentuate crevice depth.
   */
  static generateRoughnessMap(type, size = 512, baseRoughness = 0.5) {
    if (!["leather", "mesh", "rubber"].includes(type)) {
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
          if (type === "leather") {
            const pebble = Math.sin(x * 0.22 + y * 0.18) * Math.cos(y * 0.24 - x * 0.14) * 20;
            const pores = Math.sin(x * 0.65) * Math.cos(y * 0.62) * 8;
            r = Math.min(255, Math.max(0, baseByte + Math.round(pebble + pores)));
          } else if (type === "mesh") {
            const w = (Math.sin(x * 0.48) + Math.cos(y * 0.48)) * 25;
            r = Math.min(255, Math.max(0, baseByte + Math.round(w)));
          } else if (type === "rubber") {
            const t = x % 8 < 4 ? 18 : -18;
            r = Math.min(255, Math.max(0, baseByte + t));
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
      type,
      size: validSize,
      data: buffer,
      format: "RGBA",
      isNormalMap: false
    };
  }
  /**
   * Creates a GPU-ready Three.js CanvasTexture from procedural pixel data.
   * Configures seamless repeat wrapping, anisotropic filtering, and linear color space.
   */
  static createThreeTexture(type, size = 512, repeatX = 8, repeatY = 8) {
    const rawResult = this.generateNormalMap(type, size);
    if (typeof document !== "undefined" && typeof document.createElement === "function") {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
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
    dataTexture.name = `tex_procedural_${type}_data`;
    dataTexture.wrapS = THREE.RepeatWrapping;
    dataTexture.wrapT = THREE.RepeatWrapping;
    dataTexture.repeat.set(repeatX, repeatY);
    dataTexture.generateMipmaps = true;
    dataTexture.minFilter = THREE.LinearMipmapLinearFilter;
    dataTexture.magFilter = THREE.LinearFilter;
    dataTexture.colorSpace = THREE.NoColorSpace;
    dataTexture.needsUpdate = true;
    return dataTexture;
  }
  /**
   * Creates a GPU-ready Three.js CanvasTexture for micro-roughness modulation.
   */
  static createThreeRoughnessTexture(type, size = 512, baseRoughness = 0.5, repeatX = 8, repeatY = 8) {
    const rawResult = this.generateRoughnessMap(type, size, baseRoughness);
    if (typeof document !== "undefined" && typeof document.createElement === "function") {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
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
    dataTexture.minFilter = THREE.LinearMipmapLinearFilter;
    dataTexture.magFilter = THREE.LinearFilter;
    dataTexture.colorSpace = THREE.NoColorSpace;
    dataTexture.needsUpdate = true;
    return dataTexture;
  }
};

// src/materials/PBRMaterialSystem.ts
import * as THREE2 from "three";
import gsap from "gsap";
var PBRMaterialSystem = class _PBRMaterialSystem {
  /**
   * Returns authoritative PBR material preset parameters per segment.
   * Matches E2E Test Suite assertions in Tiers 1-4.
   */
  static getPresetProperties(segmentName) {
    switch (segmentName) {
      case "upper":
        return {
          roughness: 0.42,
          metalness: 0.05,
          clearcoat: 0.25,
          clearcoatRoughness: 0.1,
          reflectivity: 0.5,
          sheen: 0.25,
          sheenRoughness: 0.5,
          sheenColor: "#FFFFFF",
          normalScale: [0.8, 0.8],
          envMapIntensity: 1.15
        };
      case "sole":
        return {
          roughness: 0.65,
          metalness: 0.1,
          clearcoat: 0.1,
          clearcoatRoughness: 0.2,
          reflectivity: 0.3,
          normalScale: [1.5, 1.5],
          envMapIntensity: 0.8
        };
      case "accents":
        return {
          roughness: 0.15,
          metalness: 0.85,
          clearcoat: 0.9,
          clearcoatRoughness: 0.05,
          reflectivity: 0.95,
          iridescence: 0.75,
          iridescenceIOR: 1.45,
          iridescenceThicknessRange: [120, 380],
          normalScale: [0.3, 0.3],
          envMapIntensity: 2.4
        };
      case "laces":
        return {
          roughness: 0.75,
          metalness: 0.02,
          clearcoat: 0,
          clearcoatRoughness: 0,
          reflectivity: 0.2,
          sheen: 0.4,
          sheenRoughness: 0.7,
          sheenColor: "#E0E0E0",
          normalScale: [1.2, 1.2],
          envMapIntensity: 0.5
        };
      default:
        return {
          roughness: 0.5,
          metalness: 0.5,
          clearcoat: 0,
          reflectivity: 0.5,
          normalScale: [1, 1],
          envMapIntensity: 1
        };
    }
  }
  /**
   * Strict hex color validator supporting 3-digit (#RGB) and 6-digit (#RRGGBB).
   * Automatically trims whitespace.
   */
  static validateHex(hex) {
    if (typeof hex !== "string") return false;
    return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex.trim());
  }
  /**
   * Normalizes hex string: trims whitespace, expands 3-digit shorthand, converts to lowercase.
   */
  static normalizeHex(hex) {
    if (!_PBRMaterialSystem.validateHex(hex)) return "#000000";
    const clean = hex.trim();
    if (clean.length === 4) {
      return ("#" + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3]).toLowerCase();
    }
    return clean.toLowerCase();
  }
  /**
   * Bounds clamping utility for scalar PBR parameters [min, max].
   */
  static clamp(val, min = 0, max = 1) {
    if (!Number.isFinite(val)) return min;
    return Math.max(min, Math.min(max, val));
  }
  /**
   * Instantiates a pre-configured MeshPhysicalMaterial with pre-bound procedural normal maps.
   * Pre-binding textures and parameter hooks ensures `#define` shader flags are locked at compile-time,
   * completely preventing runtime WebGL recompilations during real-time customization.
   */
  static createMeshPhysicalMaterial(segment, baseColor = "#FFFFFF", overrides) {
    const preset = this.getPresetProperties(segment);
    const colorHex = this.validateHex(baseColor) ? baseColor : "#FFFFFF";
    let normalMap;
    let roughnessMap;
    if (segment === "upper") {
      normalMap = ProceduralTextureEngine.createThreeTexture("leather", 512, 12, 12);
      roughnessMap = ProceduralTextureEngine.createThreeRoughnessTexture("leather", 512, preset.roughness, 12, 12);
    } else if (segment === "sole") {
      normalMap = ProceduralTextureEngine.createThreeTexture("rubber", 512, 8, 24);
      roughnessMap = ProceduralTextureEngine.createThreeRoughnessTexture("rubber", 512, preset.roughness, 8, 24);
    } else if (segment === "laces") {
      normalMap = ProceduralTextureEngine.createThreeTexture("mesh", 512, 16, 16);
      roughnessMap = ProceduralTextureEngine.createThreeRoughnessTexture("mesh", 512, preset.roughness, 16, 16);
    }
    const mat = new THREE2.MeshPhysicalMaterial({
      name: `mat_${segment}_pbr`,
      color: new THREE2.Color(colorHex),
      roughness: preset.roughness,
      metalness: preset.metalness,
      clearcoat: preset.clearcoat,
      clearcoatRoughness: preset.clearcoatRoughness ?? 0.1,
      reflectivity: preset.reflectivity ?? 0.5,
      specularIntensity: 1,
      ...normalMap ? {
        normalMap,
        normalScale: new THREE2.Vector2(preset.normalScale[0], preset.normalScale[1])
      } : {},
      ...roughnessMap ? { roughnessMap } : {},
      envMapIntensity: preset.envMapIntensity ?? 1,
      side: segment === "upper" ? THREE2.DoubleSide : THREE2.FrontSide,
      ...overrides
    });
    if (preset.sheen && preset.sheen > 0) {
      mat.sheen = preset.sheen;
      mat.sheenRoughness = preset.sheenRoughness ?? 0.5;
      if (preset.sheenColor) mat.sheenColor = new THREE2.Color(preset.sheenColor);
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
  static updateSegmentMaterialUniforms(materials, patch, duration = 0.35) {
    if (!materials || materials.length === 0) return;
    if (patch.color && this.validateHex(patch.color)) {
      const targetColor = new THREE2.Color(patch.color);
      materials.forEach((mat) => {
        if (duration > 0) {
          gsap.to(mat.color, {
            r: targetColor.r,
            g: targetColor.g,
            b: targetColor.b,
            duration,
            ease: "power2.out",
            overwrite: "auto"
          });
        } else {
          mat.color.copy(targetColor);
        }
      });
    }
    materials.forEach((mat) => {
      if (patch.roughness !== void 0) mat.roughness = this.clamp(patch.roughness);
      if (patch.metalness !== void 0) mat.metalness = this.clamp(patch.metalness);
      if (patch.clearcoat !== void 0) mat.clearcoat = this.clamp(patch.clearcoat);
      if (patch.iridescence !== void 0) mat.iridescence = this.clamp(patch.iridescence);
    });
  }
};

// src/utils/colorways.ts
var COLORWAY_PRESETS = {
  "Cyber Phantom": {
    name: "Cyber Phantom",
    upper: { color: "#1a1a24", roughness: 0.42, metalness: 0.15, clearcoat: 0.3, iridescence: 0 },
    sole: { color: "#00f0ff", roughness: 0.6, metalness: 0.2, clearcoat: 0.1, iridescence: 0 },
    accents: { color: "#7928ca", roughness: 0.12, metalness: 0.9, clearcoat: 0.95, iridescence: 0.85 },
    laces: { color: "#ffffff", roughness: 0.7, metalness: 0.05, clearcoat: 0, iridescence: 0 }
  },
  "Retro Heritage": {
    name: "Retro Heritage",
    upper: { color: "#f4efe6", roughness: 0.45, metalness: 0.05, clearcoat: 0.2, iridescence: 0 },
    sole: { color: "#c84b31", roughness: 0.65, metalness: 0.08, clearcoat: 0.1, iridescence: 0 },
    accents: { color: "#2d4263", roughness: 0.2, metalness: 0.8, clearcoat: 0.85, iridescence: 0.1 },
    laces: { color: "#191919", roughness: 0.75, metalness: 0.02, clearcoat: 0, iridescence: 0 }
  },
  "Triple Stealth": {
    name: "Triple Stealth",
    upper: { color: "#111111", roughness: 0.4, metalness: 0.1, clearcoat: 0.25, iridescence: 0 },
    sole: { color: "#1c1c1c", roughness: 0.7, metalness: 0.05, clearcoat: 0.05, iridescence: 0 },
    accents: { color: "#222222", roughness: 0.15, metalness: 0.85, clearcoat: 0.9, iridescence: 0.05 },
    laces: { color: "#0d0d0d", roughness: 0.8, metalness: 0.02, clearcoat: 0, iridescence: 0 }
  },
  "Aurora Neon": {
    name: "Aurora Neon",
    upper: { color: "#0f2027", roughness: 0.4, metalness: 0.25, clearcoat: 0.4, iridescence: 0.75 },
    sole: { color: "#20e3b2", roughness: 0.55, metalness: 0.15, clearcoat: 0.15, iridescence: 0.1 },
    accents: { color: "#ff007f", roughness: 0.1, metalness: 0.95, clearcoat: 0.98, iridescence: 0.9 },
    laces: { color: "#2c5364", roughness: 0.72, metalness: 0.04, clearcoat: 0, iridescence: 0 }
  }
};
Object.defineProperty(COLORWAY_PRESETS, "Beige White", {
  value: {
    name: "Beige White",
    upper: { color: "#f5f2eb", roughness: 0.38, metalness: 0.02, clearcoat: 0.18, iridescence: 0 },
    sole: { color: "#e6ded1", roughness: 0.68, metalness: 0.02, clearcoat: 0.06, iridescence: 0 },
    accents: { color: "#c9bba8", roughness: 0.15, metalness: 0.85, clearcoat: 0.9, iridescence: 0.75 },
    laces: { color: "#ece5d8", roughness: 0.82, metalness: 0, clearcoat: 0, iridescence: 0 }
  },
  enumerable: false,
  writable: true,
  configurable: true
});
var COLORWAYS_LIST = [
  {
    id: "cyber-phantom",
    name: "Cyber Phantom",
    tagline: "Neo-Tokyo Stealth",
    description: "Deep obsidian matrix paired with high-voltage cyan outsole and polarized violet accents.",
    customization: {
      upper: { ...COLORWAY_PRESETS["Cyber Phantom"].upper },
      sole: { ...COLORWAY_PRESETS["Cyber Phantom"].sole },
      accents: { ...COLORWAY_PRESETS["Cyber Phantom"].accents },
      laces: { ...COLORWAY_PRESETS["Cyber Phantom"].laces }
    }
  },
  {
    id: "retro-heritage",
    name: "Retro Heritage",
    tagline: "Track & Field 1978",
    description: "Heritage sail leather balanced with volcanic crimson gum traction and classic collegiate navy.",
    customization: {
      upper: { ...COLORWAY_PRESETS["Retro Heritage"].upper },
      sole: { ...COLORWAY_PRESETS["Retro Heritage"].sole },
      accents: { ...COLORWAY_PRESETS["Retro Heritage"].accents },
      laces: { ...COLORWAY_PRESETS["Retro Heritage"].laces }
    }
  },
  {
    id: "triple-stealth",
    name: "Triple Stealth",
    tagline: "Zero Radar Cross-Section",
    description: "Monochromatic obsidian shades engineered with contrasting matte and gloss micro-textures.",
    customization: {
      upper: { ...COLORWAY_PRESETS["Triple Stealth"].upper },
      sole: { ...COLORWAY_PRESETS["Triple Stealth"].sole },
      accents: { ...COLORWAY_PRESETS["Triple Stealth"].accents },
      laces: { ...COLORWAY_PRESETS["Triple Stealth"].laces }
    }
  },
  {
    id: "aurora-neon",
    name: "Aurora Neon",
    tagline: "Atmospheric Ionization",
    description: "Deep midnight green infused with bioluminescent cyan tread and laser magenta accents.",
    customization: {
      upper: { ...COLORWAY_PRESETS["Aurora Neon"].upper },
      sole: { ...COLORWAY_PRESETS["Aurora Neon"].sole },
      accents: { ...COLORWAY_PRESETS["Aurora Neon"].accents },
      laces: { ...COLORWAY_PRESETS["Aurora Neon"].laces }
    }
  }
];
var FINISH_PRESETS = {
  matte: {
    id: "matte",
    label: "Matte",
    badge: "DIFFUSE",
    description: "Velvety non-reflective micro-texture with high light absorption",
    properties: {
      roughness: 0.85,
      metalness: 0.02,
      clearcoat: 0,
      clearcoatRoughness: 0,
      iridescence: 0
    }
  },
  gloss: {
    id: "gloss",
    label: "Gloss",
    badge: "SPECULAR",
    description: "High-clarity protective clearcoat with razor-sharp specular reflections",
    properties: {
      roughness: 0.18,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      iridescence: 0
    }
  },
  metallic: {
    id: "metallic",
    label: "Metallic",
    badge: "ANODIZED",
    description: "Aerospace-grade conductor alloy with intense anisotropic sheen",
    properties: {
      roughness: 0.2,
      metalness: 0.9,
      clearcoat: 0.4,
      clearcoatRoughness: 0.12,
      iridescence: 0.05
    }
  },
  iridescent: {
    id: "iridescent",
    label: "Iridescent",
    badge: "CHROMA",
    description: "Dynamic thin-film interference producing angle-dependent color shift",
    properties: {
      roughness: 0.15,
      metalness: 0.35,
      clearcoat: 0.95,
      clearcoatRoughness: 0.05,
      iridescence: 0.92
    }
  }
};
var CURATED_SWATCHES = [
  // Monochrome & Stealth
  { id: "obsidian", name: "Obsidian Black", hex: "#111114", family: "monochrome" },
  { id: "carbon", name: "Matte Carbon", hex: "#1a1a24", family: "monochrome" },
  { id: "gunmetal", name: "Gunmetal Slate", hex: "#2d3139", family: "monochrome" },
  { id: "pure-white", name: "Optic White", hex: "#ffffff", family: "monochrome" },
  { id: "sail", name: "Vintage Sail", hex: "#f4efe6", family: "monochrome" },
  // Hyper-Vibrant Neons
  { id: "cyber-volt", name: "Cyber Volt", hex: "#d4ff00", family: "neon" },
  { id: "ice-cyan", name: "Ice Cyan", hex: "#00f0ff", family: "neon" },
  { id: "signal-crimson", name: "Signal Crimson", hex: "#ff334b", family: "neon" },
  { id: "hot-pink", name: "Neon Coral", hex: "#ff007f", family: "neon" },
  { id: "phosphor-teal", name: "Phosphor Teal", hex: "#20e3b2", family: "neon" },
  { id: "electric-violet", name: "Electric Violet", hex: "#7928ca", family: "neon" },
  // Heritage & Luxury Metallics
  { id: "burgundy", name: "Heritage Burgundy", hex: "#c84b31", family: "heritage" },
  { id: "deep-navy", name: "Midnight Navy", hex: "#2d4263", family: "heritage" },
  { id: "anodized-gold", name: "Anodized Gold", hex: "#e5c378", family: "chroma" },
  { id: "liquid-chrome", name: "Liquid Chrome", hex: "#e8ecef", family: "chroma" },
  { id: "aurora-night", name: "Aurora Deep", hex: "#0f2027", family: "chroma" }
];
function validateHex(hex) {
  if (typeof hex !== "string") return false;
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex.trim());
}
function normalizeHex(hex) {
  if (!validateHex(hex)) return "#000000";
  const clean = hex.trim();
  if (clean.length === 4) {
    return ("#" + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3]).toLowerCase();
  }
  return clean.toLowerCase();
}

// src/store/useSneakerStore.ts
import { useSyncExternalStore } from "react";
function clampScalar(val) {
  if (val === void 0) return void 0;
  if (!Number.isFinite(val)) return 0;
  return Math.min(1, Math.max(0, val));
}
function cloneColorway(colorway) {
  return {
    upper: { ...colorway.upper },
    sole: { ...colorway.sole },
    accents: { ...colorway.accents },
    laces: { ...colorway.laces }
  };
}
var SneakerStoreEngine = class {
  selectedSegment;
  currentPreset;
  activeColorway;
  customization;
  history;
  subscribers = /* @__PURE__ */ new Set();
  cachedState;
  constructor(initialPreset = "Cyber Phantom") {
    const baseColorway = COLORWAY_PRESETS[initialPreset] || COLORWAY_PRESETS["Cyber Phantom"];
    this.selectedSegment = "upper";
    this.currentPreset = initialPreset;
    this.activeColorway = cloneColorway(baseColorway);
    this.customization = cloneColorway(baseColorway);
    this.history = [];
    this.cachedState = this.computeState();
  }
  computeState() {
    return {
      selectedSegment: this.selectedSegment,
      currentPreset: this.currentPreset,
      activeColorway: this.activeColorway,
      customization: {
        upper: { ...this.activeColorway.upper },
        sole: { ...this.activeColorway.sole },
        accents: { ...this.activeColorway.accents },
        laces: { ...this.activeColorway.laces }
      },
      history: this.history
    };
  }
  getState = () => {
    return this.cachedState;
  };
  subscribe = (listener) => {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  };
  notify() {
    this.cachedState = this.computeState();
    const stateSnapshot = this.cachedState;
    this.subscribers.forEach((listener) => {
      try {
        listener(stateSnapshot);
      } catch (err) {
        console.error("[SneakerStoreEngine] Error in subscriber callback:", err);
      }
    });
  }
  selectSegment = (segment) => {
    if (!["upper", "sole", "accents", "laces"].includes(segment)) {
      throw new Error(`Invalid sneaker segment: ${segment}`);
    }
    this.selectedSegment = segment;
    this.notify();
  };
  updateSneakerSegment = (segment, patch) => {
    if (!["upper", "sole", "accents", "laces"].includes(segment)) {
      throw new Error(`Invalid sneaker segment: ${segment}`);
    }
    if (!patch || Object.keys(patch).length === 0) {
      return;
    }
    let nextColor = void 0;
    if (patch.color !== void 0) {
      if (!validateHex(patch.color)) {
        throw new Error(`Invalid hex color: ${patch.color}`);
      }
      nextColor = normalizeHex(patch.color);
    }
    const segKey = segment;
    const currentSegment = this.activeColorway[segKey];
    const updatedSegment = {
      ...currentSegment,
      ...nextColor !== void 0 ? { color: nextColor } : {},
      ...patch.roughness !== void 0 ? { roughness: clampScalar(patch.roughness) } : {},
      ...patch.metalness !== void 0 ? { metalness: clampScalar(patch.metalness) } : {},
      ...patch.clearcoat !== void 0 ? { clearcoat: clampScalar(patch.clearcoat) } : {},
      ...patch.iridescence !== void 0 ? { iridescence: clampScalar(patch.iridescence) } : {}
    };
    this.activeColorway = {
      ...this.activeColorway,
      [segKey]: updatedSegment
    };
    this.customization = cloneColorway(this.activeColorway);
    this.currentPreset = "Custom";
    this.history.push({
      segment: segKey,
      patch: { ...patch },
      timestamp: Date.now()
    });
    this.notify();
  };
  setSegmentColor = (segment, hexColor) => {
    this.updateSneakerSegment(segment, { color: hexColor });
  };
  setSegmentMaterial = (segment, finish) => {
    const props = "properties" in finish ? finish.properties : finish;
    const patch = {};
    if (props.roughness !== void 0) patch.roughness = props.roughness;
    if (props.metalness !== void 0) patch.metalness = props.metalness;
    if (props.clearcoat !== void 0) patch.clearcoat = props.clearcoat;
    if (props.iridescence !== void 0) patch.iridescence = props.iridescence;
    this.updateSneakerSegment(segment, patch);
  };
  applyPreset = (presetName) => {
    const preset = COLORWAY_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }
    this.currentPreset = presetName;
    this.activeColorway = cloneColorway(preset);
    this.customization = cloneColorway(preset);
    this.notify();
  };
  applyColorway = (presetName) => {
    this.applyPreset(presetName);
  };
  resetCustomization = () => {
    this.applyPreset("Cyber Phantom");
  };
};
var sneakerStoreEngine = new SneakerStoreEngine("Cyber Phantom");

// src/components/3d/UniformMutationEngine.ts
import * as THREE3 from "three";
import gsap2 from "gsap";
var UniformMutationEngine = class {
  materialMap = /* @__PURE__ */ new Map();
  meshMap = /* @__PURE__ */ new Map();
  activeTweens = /* @__PURE__ */ new Set();
  constructor() {
    this.materialMap.set("upper", []);
    this.materialMap.set("sole", []);
    this.materialMap.set("accents", []);
    this.materialMap.set("laces", []);
    this.meshMap.set("upper", []);
    this.meshMap.set("sole", []);
    this.meshMap.set("accents", []);
    this.meshMap.set("laces", []);
  }
  /**
   * Registers a 3D sneaker hierarchy or explicit material map.
   * Traverses mesh nodes and indexes unique material instances by SegmentId.
   */
  registerModel(root, explicitMaterialMap) {
    this.clear();
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
    root.traverse((child) => {
      if (child.isMesh) {
        const mesh = child;
        const segment = mesh.userData?.segment || "upper";
        const meshList = this.meshMap.get(segment) || [];
        if (!meshList.includes(mesh)) {
          meshList.push(mesh);
          this.meshMap.set(segment, meshList);
        }
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            if (m instanceof THREE3.MeshPhysicalMaterial) {
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
    this.primeMaterialShaders();
  }
  /**
   * Shader Priming:
   * Guarantees all materials have clearcoat, sheen, and iridescence uniforms
   * active so modifying them at runtime never alters shader defines.
   */
  primeMaterialShaders() {
    this.materialMap.forEach((mats) => {
      mats.forEach((mat) => {
        if (mat.clearcoat === void 0) mat.clearcoat = 0;
        if (mat.clearcoatRoughness === void 0) mat.clearcoatRoughness = 0;
        if (mat.sheen === void 0) mat.sheen = 0;
        if (mat.iridescence === void 0) mat.iridescence = 0;
      });
    });
  }
  /**
   * Pre-compiles the scene on the GPU ahead-of-time.
   * Call during loader/preloader phase to guarantee 60 FPS on first interaction.
   */
  precompile(renderer, scene, camera) {
    renderer.compile(scene, camera);
  }
  /**
   * Tweens segment color smoothly using GSAP.
   * Mutates the underlying WebGL color uniform directly with zero pipeline recompilation.
   */
  tweenSegmentColor(segment, hexColor, options = {}) {
    const materials = this.materialMap.get(segment);
    if (!materials || materials.length === 0) return;
    const targetColor = new THREE3.Color(hexColor);
    const duration = options.duration ?? 0.38;
    const ease = options.ease ?? "power2.out";
    materials.forEach((mat) => {
      if (duration === 0) {
        mat.color.copy(targetColor);
        if (options.onComplete) options.onComplete();
        return;
      }
      let tween;
      const cleanup = () => {
        if (tween) this.activeTweens.delete(tween);
      };
      tween = gsap2.to(mat.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration,
        ease,
        overwrite: "auto",
        onComplete: () => {
          cleanup();
          if (options.onComplete) options.onComplete();
        },
        onInterrupt: cleanup
      });
      this.activeTweens.add(tween);
    });
  }
  /**
   * Tweens scalar PBR properties (roughness, metalness, clearcoat, iridescence).
   */
  tweenSegmentScalars(segment, patch, options = {}) {
    const materials = this.materialMap.get(segment);
    if (!materials || materials.length === 0) return;
    const duration = options.duration ?? 0.38;
    const ease = options.ease ?? "power2.out";
    const targetProps = {};
    if (patch.roughness !== void 0) targetProps.roughness = patch.roughness;
    if (patch.metalness !== void 0) targetProps.metalness = patch.metalness;
    if (patch.clearcoat !== void 0) targetProps.clearcoat = patch.clearcoat;
    if (patch.iridescence !== void 0) targetProps.iridescence = patch.iridescence;
    if (Object.keys(targetProps).length === 0) return;
    materials.forEach((mat) => {
      if (duration === 0) {
        if (targetProps.roughness !== void 0) mat.roughness = targetProps.roughness;
        if (targetProps.metalness !== void 0) mat.metalness = targetProps.metalness;
        if (targetProps.clearcoat !== void 0) mat.clearcoat = targetProps.clearcoat;
        if (targetProps.iridescence !== void 0) mat.iridescence = targetProps.iridescence;
        return;
      }
      let tween;
      const cleanup = () => {
        if (tween) this.activeTweens.delete(tween);
      };
      tween = gsap2.to(mat, {
        ...targetProps,
        duration,
        ease,
        overwrite: "auto",
        onComplete: cleanup,
        onInterrupt: cleanup
      });
      this.activeTweens.add(tween);
    });
  }
  /**
   * Applies a full SneakerCustomization state across all 4 segments in a single pass.
   */
  applyCustomization(customization, options = {}) {
    const segments = ["upper", "sole", "accents", "laces"];
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
  getMaterials(segment) {
    return this.materialMap.get(segment) || [];
  }
  /**
   * Returns registered meshes for direct inspection.
   */
  getMeshes(segment) {
    return this.meshMap.get(segment) || [];
  }
  /**
   * Halts all active tweens and cleans up references on unmount.
   */
  clear() {
    this.activeTweens.forEach((t) => t.kill());
    this.activeTweens.clear();
    this.materialMap.get("upper").length = 0;
    this.materialMap.get("sole").length = 0;
    this.materialMap.get("accents").length = 0;
    this.materialMap.get("laces").length = 0;
    this.meshMap.get("upper").length = 0;
    this.meshMap.get("sole").length = 0;
    this.meshMap.get("accents").length = 0;
    this.meshMap.get("laces").length = 0;
    try {
      gsap2.ticker.sleep();
    } catch {
    }
  }
};
var uniformMutationEngine = new UniformMutationEngine();

// src/components/3d/ProceduralSneaker.ts
import * as THREE4 from "three";
var ProceduralSneakerGenerator = class {
  /**
   * Generates the anatomical 2D foot-last outline in X-Z space.
   * Runs from Heel (Z = -1.30) to Toe (Z = +1.35).
   */
  static createSoleFootprintShape() {
    const shape = new THREE4.Shape();
    shape.moveTo(0, -1.3);
    shape.bezierCurveTo(0.42, -1.3, 0.46, -0.9, 0.44, -0.5);
    shape.bezierCurveTo(0.42, -0.2, 0.45, 0.1, 0.48, 0.35);
    shape.bezierCurveTo(0.52, 0.65, 0.5, 0.95, 0.38, 1.2);
    shape.bezierCurveTo(0.28, 1.35, 0.08, 1.38, -0.05, 1.35);
    shape.bezierCurveTo(-0.25, 1.3, -0.46, 1.05, -0.48, 0.7);
    shape.bezierCurveTo(-0.5, 0.4, -0.32, 0.05, -0.3, -0.3);
    shape.bezierCurveTo(-0.28, -0.65, -0.38, -1.05, -0.38, -1.25);
    shape.bezierCurveTo(-0.25, -1.32, -0.1, -1.3, 0, -1.3);
    return shape;
  }
  /**
   * Builds the Outsole with herringbone traction treads.
   */
  static buildOutsole(soleMaterial) {
    const group = new THREE4.Group();
    group.name = "assembly_outsole";
    const footprint = this.createSoleFootprintShape();
    const extrudeSettings = {
      depth: 0.075,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.02,
      bevelThickness: 0.02
    };
    const soleGeom = new THREE4.ExtrudeGeometry(footprint, extrudeSettings);
    soleGeom.rotateX(-Math.PI * 0.5);
    soleGeom.rotateY(Math.PI);
    soleGeom.translate(0, 0.034, 0);
    const soleMesh = new THREE4.Mesh(soleGeom, soleMaterial);
    soleMesh.name = "mesh_outsole_base";
    soleMesh.castShadow = true;
    soleMesh.receiveShadow = true;
    soleMesh.userData = { segment: "sole", subpart: "outsole" };
    group.add(soleMesh);
    const treadGeom = new THREE4.BoxGeometry(0.55, 0.014, 0.05);
    const treadMat = soleMaterial.clone();
    treadMat.roughness = 0.85;
    treadMat.name = "mat_sole_tread";
    for (let i = 0; i < 12; i++) {
      const zPos = -1.1 + i * 0.2;
      const widthScale = zPos > 0.2 && zPos < 0.9 ? 1.35 : zPos < -0.6 ? 1.1 : 0.85;
      const treadMesh = new THREE4.Mesh(treadGeom, treadMat);
      treadMesh.name = `mesh_tread_lug_${i + 1}`;
      treadMesh.position.set(0, 7e-3, zPos);
      treadMesh.scale.set(widthScale, 1, 1);
      treadMesh.rotation.y = i % 2 === 0 ? 0.08 : -0.08;
      treadMesh.castShadow = true;
      treadMesh.receiveShadow = true;
      treadMesh.userData = { segment: "sole", subpart: "tread_lug" };
      group.add(treadMesh);
    }
    return group;
  }
  /**
   * Builds the Sculpted Aerodynamic Midsole (NitroCell Foam).
   */
  static buildMidsole(soleMaterial) {
    const length = 2.65;
    const width = 0.98;
    const height = 0.26;
    const geom = new THREE4.BoxGeometry(width, height, length, 12, 4, 20);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const t = (z + 1.3) / 2.6;
      let sculptY = y + 0.18 + (1 - t) * 0.12 - t * 0.04;
      if (t > 0.8) {
        sculptY += Math.pow((t - 0.8) / 0.2, 2) * 0.08;
      }
      let sculptX = x;
      if (t < 0.35) {
        sculptX *= 1.08;
      } else if (t >= 0.35 && t <= 0.6) {
        sculptX *= 0.86;
      } else {
        sculptX *= 1.02;
      }
      pos.setXYZ(i, sculptX, sculptY, z);
    }
    geom.computeVertexNormals();
    const mesh = new THREE4.Mesh(geom, soleMaterial);
    mesh.name = "mesh_midsole";
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { segment: "sole", subpart: "midsole" };
    return mesh;
  }
  /**
   * Builds the Carbon Fiber Torsional Shank Plate.
   */
  static buildCarbonShankPlate() {
    const shape = new THREE4.Shape();
    shape.moveTo(-0.18, -0.3);
    shape.lineTo(0.18, -0.3);
    shape.lineTo(0.24, 0.25);
    shape.lineTo(-0.24, 0.25);
    shape.closePath();
    const geom = new THREE4.ExtrudeGeometry(shape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 8e-3,
      bevelThickness: 8e-3
    });
    geom.rotateX(Math.PI * 0.5);
    geom.translate(0, 0.105, 0);
    const carbonMat = new THREE4.MeshPhysicalMaterial({
      color: new THREE4.Color("#1A1C20"),
      roughness: 0.24,
      metalness: 0.7,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      name: "mat_carbon_shank"
    });
    const mesh = new THREE4.Mesh(geom, carbonMat);
    mesh.name = "mesh_carbon_shank";
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { segment: "sole", subpart: "carbon_plate" };
    return mesh;
  }
  /**
   * Builds the Layered Upper Shoe Body (Vamp, Quarters, Collar, Inner Lining).
   */
  static buildUpper(upperMaterial) {
    const group = new THREE4.Group();
    group.name = "assembly_upper";
    const radiusTop = 0.4;
    const radiusBottom = 0.48;
    const height = 0.75;
    const radialSegments = 24;
    const heightSegments = 16;
    const geom = new THREE4.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, false);
    geom.rotateZ(Math.PI * 0.5);
    geom.rotateY(Math.PI * 0.5);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      z *= 3;
      x *= 0.95;
      const t = (z + 1.2) / 2.4;
      if (t > 0.6) {
        y = y * 0.65 + 0.35 + Math.pow(t - 0.6, 2) * 0.15;
      } else {
        y = y * 0.85 + 0.55 + (0.6 - t) * 0.35;
      }
      if (t > 0.85) {
        x *= 1 - (t - 0.85) * 2.2;
        if (t > 0.96) {
          y = Math.min(y, 0.28 + (1 - t) * 1.5);
        }
      }
      if (y < 0.12) {
        y = 0.12;
      }
      pos.setXYZ(i, x, y, z);
    }
    geom.computeVertexNormals();
    const normAttr = geom.attributes.normal;
    for (let i = 0; i < normAttr.count; i++) {
      const l = Math.hypot(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
      if (l < 1e-3) {
        normAttr.setXYZ(i, 0, 1, 0);
      }
    }
    const upperMesh = new THREE4.Mesh(geom, upperMaterial);
    upperMesh.name = "mesh_upper_body";
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    upperMesh.userData = { segment: "upper", subpart: "vamp_quarters" };
    group.add(upperMesh);
    const collarCurve = new THREE4.EllipseCurve(
      0,
      0,
      // ax, aY
      0.22,
      0.32,
      // xRadius, yRadius
      0,
      2 * Math.PI,
      // aStartAngle, aEndAngle
      false,
      // aClockwise
      0
      // aRotation
    );
    const collarPoints = collarCurve.getPoints(32).map((p) => new THREE4.Vector3(p.x, 0.82, p.y - 0.35));
    const collarPath = new THREE4.CatmullRomCurve3(collarPoints, true);
    const collarGeom = new THREE4.TubeGeometry(collarPath, 32, 0.045, 8, true);
    const collarMesh = new THREE4.Mesh(collarGeom, upperMaterial);
    collarMesh.name = "mesh_collar_rim";
    collarMesh.castShadow = true;
    collarMesh.userData = { segment: "upper", subpart: "collar" };
    group.add(collarMesh);
    const tongueCurve = new THREE4.CatmullRomCurve3([
      new THREE4.Vector3(0, 0.44, 0.55),
      new THREE4.Vector3(0, 0.62, 0.32),
      new THREE4.Vector3(0, 0.78, 0.1),
      new THREE4.Vector3(0, 0.95, -0.14)
    ]);
    const tongueGeom = new THREE4.TubeGeometry(tongueCurve, 24, 0.045, 8, false);
    tongueGeom.scale(3.8, 1, 1);
    const tongueMesh = new THREE4.Mesh(tongueGeom, upperMaterial);
    tongueMesh.name = "mesh_tongue";
    tongueMesh.castShadow = true;
    tongueMesh.receiveShadow = true;
    tongueMesh.userData = { segment: "upper", subpart: "tongue" };
    group.add(tongueMesh);
    return group;
  }
  /**
   * Builds the Criss-Cross Lacing System & Metallic Eyelets.
   */
  static buildLacingSystem(lacesMaterial, accentMaterial) {
    const group = new THREE4.Group();
    group.name = "assembly_laces";
    const eyeletPairs = [
      [new THREE4.Vector3(-0.19, 0.5, 0.52), new THREE4.Vector3(0.19, 0.5, 0.52)],
      [new THREE4.Vector3(-0.21, 0.58, 0.38), new THREE4.Vector3(0.21, 0.58, 0.38)],
      [new THREE4.Vector3(-0.22, 0.66, 0.24), new THREE4.Vector3(0.22, 0.66, 0.24)],
      [new THREE4.Vector3(-0.22, 0.74, 0.1), new THREE4.Vector3(0.22, 0.74, 0.1)],
      [new THREE4.Vector3(-0.21, 0.82, -0.04), new THREE4.Vector3(0.21, 0.82, -0.04)]
    ];
    const grommetGeom = new THREE4.TorusGeometry(0.022, 7e-3, 8, 16);
    grommetGeom.rotateX(Math.PI * 0.35);
    eyeletPairs.forEach(([left, right], idx) => {
      const leftRing = new THREE4.Mesh(grommetGeom, accentMaterial);
      leftRing.position.copy(left);
      leftRing.name = `mesh_eyelet_L_${idx + 1}`;
      leftRing.castShadow = true;
      leftRing.userData = { segment: "accents", subpart: "eyelet" };
      group.add(leftRing);
      const rightRing = new THREE4.Mesh(grommetGeom, accentMaterial);
      rightRing.position.copy(right);
      rightRing.name = `mesh_eyelet_R_${idx + 1}`;
      rightRing.castShadow = true;
      rightRing.userData = { segment: "accents", subpart: "eyelet" };
      group.add(rightRing);
    });
    for (let i = 0; i < eyeletPairs.length - 1; i++) {
      const [lCurrent, rCurrent] = eyeletPairs[i];
      const [lNext, rNext] = eyeletPairs[i + 1];
      const midPoint1 = new THREE4.Vector3(
        0,
        (lCurrent.y + rNext.y) * 0.5 + 0.035,
        // Arch slightly over tongue
        (lCurrent.z + rNext.z) * 0.5
      );
      const curve1 = new THREE4.CatmullRomCurve3([lCurrent, midPoint1, rNext]);
      const laceGeom1 = new THREE4.TubeGeometry(curve1, 16, 0.015, 8, false);
      const laceMesh1 = new THREE4.Mesh(laceGeom1, lacesMaterial);
      laceMesh1.name = `mesh_lace_cross_LR_${i}`;
      laceMesh1.castShadow = true;
      laceMesh1.userData = { segment: "laces", subpart: "criss_cross" };
      group.add(laceMesh1);
      const midPoint2 = new THREE4.Vector3(
        0,
        (rCurrent.y + lNext.y) * 0.5 + 0.025,
        (rCurrent.z + lNext.z) * 0.5
      );
      const curve2 = new THREE4.CatmullRomCurve3([rCurrent, midPoint2, lNext]);
      const laceGeom2 = new THREE4.TubeGeometry(curve2, 16, 0.015, 8, false);
      const laceMesh2 = new THREE4.Mesh(laceGeom2, lacesMaterial);
      laceMesh2.name = `mesh_lace_cross_RL_${i}`;
      laceMesh2.castShadow = true;
      laceMesh2.userData = { segment: "laces", subpart: "criss_cross" };
      group.add(laceMesh2);
    }
    const knotCurve = new THREE4.CatmullRomCurve3([
      new THREE4.Vector3(-0.12, 0.85, -0.04),
      new THREE4.Vector3(0, 0.88, -0.02),
      new THREE4.Vector3(0.12, 0.85, -0.04)
    ]);
    const knotGeom = new THREE4.TubeGeometry(knotCurve, 12, 0.02, 8, false);
    const knotMesh = new THREE4.Mesh(knotGeom, lacesMaterial);
    knotMesh.name = "mesh_lace_knot";
    knotMesh.castShadow = true;
    knotMesh.userData = { segment: "laces", subpart: "knot" };
    group.add(knotMesh);
    const agletGeom = new THREE4.CylinderGeometry(9e-3, 9e-3, 0.08, 8);
    const leftAglet = new THREE4.Mesh(agletGeom, accentMaterial);
    leftAglet.name = "mesh_aglet_L";
    leftAglet.castShadow = true;
    leftAglet.position.set(-0.14, 0.78, -0.02);
    leftAglet.rotation.z = 0.35;
    leftAglet.userData = { segment: "accents", subpart: "aglet" };
    group.add(leftAglet);
    const rightAglet = new THREE4.Mesh(agletGeom, accentMaterial);
    rightAglet.name = "mesh_aglet_R";
    rightAglet.castShadow = true;
    rightAglet.position.set(0.14, 0.78, -0.02);
    rightAglet.rotation.z = -0.35;
    rightAglet.userData = { segment: "accents", subpart: "aglet" };
    group.add(rightAglet);
    return group;
  }
  /**
   * Builds the Ergonomic Heel Stabilizer Clip & Lateral/Medial Branding Blades.
   */
  static buildAccents(accentMaterial) {
    const group = new THREE4.Group();
    group.name = "assembly_accents";
    const heelCurve = new THREE4.CatmullRomCurve3([
      new THREE4.Vector3(0.38, 0.38, -0.8),
      new THREE4.Vector3(0.42, 0.44, -1.05),
      new THREE4.Vector3(0, 0.46, -1.32),
      new THREE4.Vector3(-0.42, 0.44, -1.05),
      new THREE4.Vector3(-0.38, 0.38, -0.8)
    ]);
    const heelClipGeom = new THREE4.TubeGeometry(heelCurve, 28, 0.042, 8, false);
    heelClipGeom.scale(1, 1.8, 1);
    const heelClipMesh = new THREE4.Mesh(heelClipGeom, accentMaterial);
    heelClipMesh.name = "mesh_heel_clip";
    heelClipMesh.castShadow = true;
    heelClipMesh.receiveShadow = true;
    heelClipMesh.userData = { segment: "accents", subpart: "heel_clip" };
    group.add(heelClipMesh);
    const bladeShape = new THREE4.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.55, 0.08);
    bladeShape.lineTo(0.68, 0.16);
    bladeShape.lineTo(0.18, 0.07);
    bladeShape.closePath();
    const bladeExtrude = {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 6e-3,
      bevelThickness: 6e-3
    };
    const lateralGeom = new THREE4.ExtrudeGeometry(bladeShape, bladeExtrude);
    lateralGeom.rotateY(-Math.PI * 0.5);
    lateralGeom.translate(0.46, 0.42, -0.1);
    const lateralBlade = new THREE4.Mesh(lateralGeom, accentMaterial);
    lateralBlade.name = "mesh_lateral_accent_blade";
    lateralBlade.castShadow = true;
    lateralBlade.userData = { segment: "accents", subpart: "lateral_blade" };
    group.add(lateralBlade);
    const medialGeom = new THREE4.ExtrudeGeometry(bladeShape, bladeExtrude);
    medialGeom.rotateY(Math.PI * 0.5);
    medialGeom.translate(-0.46, 0.42, -0.1);
    const medialBlade = new THREE4.Mesh(medialGeom, accentMaterial);
    medialBlade.name = "mesh_medial_accent_blade";
    medialBlade.castShadow = true;
    medialBlade.userData = { segment: "accents", subpart: "medial_blade" };
    group.add(medialBlade);
    return group;
  }
  /**
   * Main Factory Method:
   * Constructs the complete compound sneaker assembly, groups, tags, and material maps.
   */
  static createSneakerAssembly() {
    const root = new THREE4.Group();
    root.name = "sneaker_root";
    root.userData = { isSneakerRoot: true };
    const matUpper = PBRMaterialSystem.createMeshPhysicalMaterial("upper", "#f5f2eb", {
      roughness: 0.38,
      metalness: 0.02,
      clearcoat: 0.18,
      clearcoatRoughness: 0.25,
      sheen: 0.35,
      sheenRoughness: 0.45,
      sheenColor: new THREE4.Color("#fcfbf8"),
      normalScale: new THREE4.Vector2(0.8, 0.8)
    });
    const matSole = PBRMaterialSystem.createMeshPhysicalMaterial("sole", "#e6ded1", {
      roughness: 0.68,
      metalness: 0.02,
      clearcoat: 0.06,
      clearcoatRoughness: 0.4,
      normalScale: new THREE4.Vector2(1.5, 1.5)
    });
    const matAccents = PBRMaterialSystem.createMeshPhysicalMaterial("accents", "#c9bba8", {
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
      iridescence: 0.75,
      iridescenceIOR: 1.45,
      iridescenceThicknessRange: [120, 380],
      normalScale: new THREE4.Vector2(0.3, 0.3),
      envMapIntensity: 2.4
    });
    const matLaces = PBRMaterialSystem.createMeshPhysicalMaterial("laces", "#ece5d8", {
      roughness: 0.82,
      metalness: 0,
      clearcoat: 0,
      sheen: 0.3,
      sheenRoughness: 0.6,
      sheenColor: new THREE4.Color("#f7f4ed"),
      normalScale: new THREE4.Vector2(1.2, 1.2)
    });
    const rigUpper = new THREE4.Group();
    rigUpper.name = "rig_upper";
    const rigLaces = new THREE4.Group();
    rigLaces.name = "rig_laces";
    const rigCarbon = new THREE4.Group();
    rigCarbon.name = "rig_carbon";
    const rigSole = new THREE4.Group();
    rigSole.name = "rig_sole";
    const rigAccents = new THREE4.Group();
    rigAccents.name = "rig_accents";
    const outsoleGroup = this.buildOutsole(matSole);
    const midsoleMesh = this.buildMidsole(matSole);
    const carbonShankMesh = this.buildCarbonShankPlate();
    const upperGroup = this.buildUpper(matUpper);
    const lacingGroup = this.buildLacingSystem(matLaces, matAccents);
    const accentsGroup = this.buildAccents(matAccents);
    rigSole.add(outsoleGroup);
    rigSole.add(midsoleMesh);
    rigCarbon.add(carbonShankMesh);
    rigUpper.add(upperGroup);
    rigLaces.add(lacingGroup);
    rigAccents.add(accentsGroup);
    root.add(rigSole);
    root.add(rigCarbon);
    root.add(rigUpper);
    root.add(rigLaces);
    root.add(rigAccents);
    const rigGroups = {
      upper: rigUpper,
      laces: rigLaces,
      carbon: rigCarbon,
      sole: rigSole,
      accents: rigAccents
    };
    const treadMat = outsoleGroup.children[1].material;
    const materialMap = /* @__PURE__ */ new Map();
    materialMap.set("upper", [matUpper]);
    materialMap.set("sole", [matSole, treadMat]);
    materialMap.set("accents", [matAccents]);
    materialMap.set("laces", [matLaces]);
    return {
      root,
      rigGroups,
      materialMap
    };
  }
};
try {
  const warmup = ProceduralSneakerGenerator.createSneakerAssembly();
  warmup.root.traverse((obj) => {
    if (obj.isMesh) {
      const mesh = obj;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material.dispose();
      }
    }
  });
} catch {
}

// tests/challenger-m2-1-stress.ts
var allResults = [];
function runTest(suite, name, fn) {
  const start = performance.now();
  try {
    const res = fn();
    if (res && typeof res.then === "function") {
      throw new Error(`Async test not supported in sync runner: ${name}`);
    }
    const durationMs = Number((performance.now() - start).toFixed(3));
    allResults.push({ suite, name, passed: true, durationMs });
  } catch (err) {
    const durationMs = Number((performance.now() - start).toFixed(3));
    allResults.push({
      suite,
      name,
      passed: false,
      error: err?.message || String(err),
      durationMs
    });
  }
}
function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}
function assertEqual(actual, expected, desc) {
  if (actual !== expected) {
    throw new Error(`${desc}: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
function assertCloseTo(actual, expected, tolerance = 1e-3, desc) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${desc}: Expected ${expected} \xB1 ${tolerance}, got ${actual} (diff: ${diff})`);
  }
}
var textureTypes = ["leather", "mesh", "rubber"];
var powerOfTwoSizes = [16, 32, 64, 128, 256, 512, 1024, 2048];
for (const type of textureTypes) {
  for (const size of powerOfTwoSizes) {
    runTest("Suite 1: Buffer Dimensions", `Generate ${type} at ${size}x${size} (PoT)`, () => {
      const res = ProceduralTextureEngine.generateNormalMap(type, size);
      assertEqual(res.type, type, "Texture type");
      assertEqual(res.size, size, "Reported size");
      assertEqual(res.format, "RGBA", "Format");
      assertEqual(res.isNormalMap, true, "isNormalMap flag");
      assert(res.data instanceof Uint8ClampedArray, "Data must be Uint8ClampedArray");
      const expectedBytes = size * size * 4;
      assertEqual(res.data.byteLength, expectedBytes, `Byte length must be ${expectedBytes}`);
      assertEqual(res.data.length, expectedBytes, `Length must be ${expectedBytes}`);
    });
  }
}
runTest("Suite 1: Buffer Dimensions", "Clamps sub-minimum sizes (< 16) to validSize=16", () => {
  const subSizes = [-100, -1, 0, 1, 8, 15];
  for (const sz of subSizes) {
    const res = ProceduralTextureEngine.generateNormalMap("leather", sz);
    assertEqual(res.size, 16, `Size ${sz} clamped to 16`);
    assertEqual(res.data.byteLength, 16 * 16 * 4, `Byte length for size ${sz}`);
  }
});
runTest("Suite 1: Buffer Dimensions", "Clamps super-maximum sizes (> 2048) to validSize=2048", () => {
  const superSizes = [2049, 4096, 8192];
  for (const sz of superSizes) {
    const res = ProceduralTextureEngine.generateNormalMap("mesh", sz);
    assertEqual(res.size, 2048, `Size ${sz} clamped to 2048`);
    assertEqual(res.data.byteLength, 2048 * 2048 * 4, `Byte length for size ${sz}`);
  }
});
runTest("Suite 1: Buffer Dimensions", "Handles fractional floating-point sizes with Math.floor", () => {
  const res = ProceduralTextureEngine.generateNormalMap("rubber", 64.99);
  assertEqual(res.size, 64, "Fractional size 64.99 floored to 64");
  assertEqual(res.data.byteLength, 64 * 64 * 4, "Byte length 64x64x4");
});
runTest("Suite 1: Buffer Dimensions", "Rejects unknown procedural texture types with descriptive error", () => {
  const badTypes = ["wood", "carbon", "metal", "", "LEATHER", "Mesh", null, void 0];
  for (const bad of badTypes) {
    let threw = false;
    try {
      ProceduralTextureEngine.generateNormalMap(bad, 64);
    } catch (e) {
      threw = true;
      assert(e.message.includes("Unknown procedural texture type"), `Error message format for ${bad}`);
    }
    assert(threw, `Expected error for unknown type: ${bad}`);
  }
});
for (const type of textureTypes) {
  runTest("Suite 2: Normal Map Z=255 Invariant", `100% pixel audit of ${type} at 512x512 (262,144 pixels)`, () => {
    const size = 512;
    const res = ProceduralTextureEngine.generateNormalMap(type, size);
    const totalPixels = size * size;
    let minNx = 255, maxNx = 0;
    let minNy = 255, maxNy = 0;
    let z255Count = 0;
    let a255Count = 0;
    for (let p = 0; p < totalPixels; p++) {
      const idx = p * 4;
      const nx = res.data[idx];
      const ny = res.data[idx + 1];
      const nz = res.data[idx + 2];
      const alpha = res.data[idx + 3];
      if (nx < minNx) minNx = nx;
      if (nx > maxNx) maxNx = nx;
      if (ny < minNy) minNy = ny;
      if (ny > maxNy) maxNy = ny;
      if (nz === 255) z255Count++;
      if (alpha === 255) a255Count++;
    }
    assertEqual(z255Count, totalPixels, `All ${totalPixels} pixels must have Nz = 255 (blue channel)`);
    assertEqual(a255Count, totalPixels, `All ${totalPixels} pixels must have Alpha = 255`);
    assert(minNx >= 0 && maxNx <= 255, `Nx in valid uint8 byte range [${minNx}, ${maxNx}]`);
    assert(minNy >= 0 && maxNy <= 255, `Ny in valid uint8 byte range [${minNy}, ${maxNy}]`);
    assert(maxNx > minNx, `Texture ${type} has non-zero normal perturbation on X: [${minNx}, ${maxNx}]`);
  });
}
runTest("Suite 2: Micro-Roughness Map", "Generates roughness maps across all 3 types with byte ranges", () => {
  for (const type of textureTypes) {
    const res = ProceduralTextureEngine.generateRoughnessMap(type, 128, 0.45);
    assertEqual(res.type, type, "Roughness type");
    assertEqual(res.isNormalMap, false, "isNormalMap is false");
    assertEqual(res.data.byteLength, 128 * 128 * 4, "Byte length");
    const totalPixels = 128 * 128;
    let greyscaleMatch = 0;
    for (let p = 0; p < totalPixels; p++) {
      const idx = p * 4;
      if (res.data[idx] === res.data[idx + 1] && res.data[idx + 1] === res.data[idx + 2]) {
        greyscaleMatch++;
      }
      assertEqual(res.data[idx + 3], 255, "Alpha channel");
    }
    assertEqual(greyscaleMatch, totalPixels, `All ${totalPixels} pixels must be greyscale (R=G=B)`);
  }
});
runTest("Suite 3: Three.js Texture Properties", "Configures RepeatWrapping, Anisotropy, Mipmaps & Linear ColorSpace", () => {
  const tex = ProceduralTextureEngine.createThreeTexture("leather", 256, 10, 10);
  assert(tex !== void 0 && tex !== null, "Texture created");
  assertEqual(tex.wrapS, THREE5.RepeatWrapping, "wrapS must be RepeatWrapping (1000)");
  assertEqual(tex.wrapT, THREE5.RepeatWrapping, "wrapT must be RepeatWrapping (1000)");
  assertEqual(tex.repeat.x, 10, "repeat.x must match parameter");
  assertEqual(tex.repeat.y, 10, "repeat.y must match parameter");
  assertEqual(tex.colorSpace, THREE5.NoColorSpace, "colorSpace must be NoColorSpace (linear normal map)");
  assertEqual(tex.generateMipmaps, true, "generateMipmaps must be true");
  assertEqual(tex.minFilter, THREE5.LinearMipmapLinearFilter, "minFilter must be LinearMipmapLinearFilter");
  assertEqual(tex.magFilter, THREE5.LinearFilter, "magFilter must be LinearFilter");
});
runTest("Suite 3: Synthetic Canvas DOM Texture", "Configures CanvasTexture with 8x anisotropy in DOM environment", () => {
  const originalDoc = globalThis.document;
  globalThis.document = {
    createElement: (tag) => {
      if (tag === "canvas") {
        return {
          tagName: "CANVAS",
          width: 256,
          height: 256,
          getContext: (type) => {
            if (type === "2d") {
              return {
                createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
                putImageData: () => {
                }
              };
            }
            return null;
          }
        };
      }
      return {};
    }
  };
  try {
    const canvasTex = ProceduralTextureEngine.createThreeTexture("rubber", 256, 4, 12);
    assertEqual(canvasTex.name, "tex_procedural_rubber_normal", "Texture name");
    assertEqual(canvasTex.anisotropy, 8, "Anisotropy must be 8x for high-angle clarity");
    assertEqual(canvasTex.wrapS, THREE5.RepeatWrapping, "wrapS is RepeatWrapping");
    assertEqual(canvasTex.wrapT, THREE5.RepeatWrapping, "wrapT is RepeatWrapping");
    assertEqual(canvasTex.repeat.x, 4, "repeat.x");
    assertEqual(canvasTex.repeat.y, 12, "repeat.y");
    assertEqual(canvasTex.colorSpace, THREE5.NoColorSpace, "Normal map colorSpace must be linear");
  } finally {
    globalThis.document = originalDoc;
  }
});
runTest("Suite 3: Texture Disposal Lifecycle", "Executes dispose() cleanly and fires disposal event", () => {
  const tex = ProceduralTextureEngine.createThreeTexture("mesh", 128, 8, 8);
  let disposeEventFired = false;
  tex.addEventListener("dispose", () => {
    disposeEventFired = true;
  });
  tex.dispose();
  assert(disposeEventFired, "Disposal event listener was invoked on texture.dispose()");
});
runTest("Suite 3: Texture Memory Stress", "Executes 100 rapid generate & dispose cycles without leaks", () => {
  for (let i = 0; i < 100; i++) {
    const type = textureTypes[i % 3];
    const tex = ProceduralTextureEngine.createThreeTexture(type, 64, 4, 4);
    tex.dispose();
  }
});
runTest("Suite 4: Authoritative Presets", "Upper material has roughness 0.42, metalness 0.05, clearcoat 0.25", () => {
  const p = PBRMaterialSystem.getPresetProperties("upper");
  assertEqual(p.roughness, 0.42, "Upper roughness");
  assertEqual(p.metalness, 0.05, "Upper metalness");
  assertEqual(p.clearcoat, 0.25, "Upper clearcoat");
  assertEqual(p.normalScale[0], 0.8, "Upper normalScale X");
  assertEqual(p.normalScale[1], 0.8, "Upper normalScale Y");
});
runTest("Suite 4: Authoritative Presets", "Sole material has roughness 0.65, metalness 0.10, normalScale 1.5", () => {
  const p = PBRMaterialSystem.getPresetProperties("sole");
  assertEqual(p.roughness, 0.65, "Sole roughness");
  assertEqual(p.metalness, 0.1, "Sole metalness");
  assertEqual(p.normalScale[0], 1.5, "Sole normalScale X");
  assertEqual(p.normalScale[1], 1.5, "Sole normalScale Y");
});
runTest("Suite 4: Authoritative Presets", "Accents material has roughness 0.15, metalness 0.85, clearcoat 0.90, iridescence 0.75", () => {
  const p = PBRMaterialSystem.getPresetProperties("accents");
  assertEqual(p.roughness, 0.15, "Accents roughness");
  assertEqual(p.metalness, 0.85, "Accents metalness");
  assertEqual(p.clearcoat, 0.9, "Accents clearcoat");
  assertEqual(p.iridescence, 0.75, "Accents iridescence");
});
runTest("Suite 4: Authoritative Presets", "Laces material has roughness 0.75, metalness 0.02, clearcoat 0.0", () => {
  const p = PBRMaterialSystem.getPresetProperties("laces");
  assertEqual(p.roughness, 0.75, "Laces roughness");
  assertEqual(p.metalness, 0.02, "Laces metalness");
  assertEqual(p.clearcoat, 0, "Laces clearcoat");
  assertEqual(p.normalScale[0], 1.2, "Laces normalScale X");
});
runTest("Suite 4: Scalar Clamping Unit", "PBRMaterialSystem.clamp clamps across extreme numerical values", () => {
  assertEqual(PBRMaterialSystem.clamp(0), 0, "Clamp 0.0");
  assertEqual(PBRMaterialSystem.clamp(0.5), 0.5, "Clamp 0.5");
  assertEqual(PBRMaterialSystem.clamp(1), 1, "Clamp 1.0");
  assertEqual(PBRMaterialSystem.clamp(-1e-4), 0, "Clamp -0.0001");
  assertEqual(PBRMaterialSystem.clamp(-1), 0, "Clamp -1.0");
  assertEqual(PBRMaterialSystem.clamp(-999999), 0, "Clamp -999999");
  assertEqual(PBRMaterialSystem.clamp(-1e15), 0, "Clamp -1e15");
  assertEqual(PBRMaterialSystem.clamp(1.0001), 1, "Clamp 1.0001");
  assertEqual(PBRMaterialSystem.clamp(2.5), 1, "Clamp 2.5");
  assertEqual(PBRMaterialSystem.clamp(999999), 1, "Clamp 999999");
  assertEqual(PBRMaterialSystem.clamp(1e15), 1, "Clamp 1e15");
  assertEqual(PBRMaterialSystem.clamp(NaN), 0, "Clamp NaN");
  assertEqual(PBRMaterialSystem.clamp(Infinity), 0, "Clamp +Infinity");
  assertEqual(PBRMaterialSystem.clamp(-Infinity), 0, "Clamp -Infinity");
});
runTest("Suite 4: Uniform Mutation Clamping & Zero-Recompile Rule", "Mutates materials with strict [0, 1] clamping and needsUpdate=false", () => {
  const mat = new THREE5.MeshPhysicalMaterial({ roughness: 0.5, metalness: 0.5, clearcoat: 0.5 });
  const initialVersion = mat.version;
  let needsUpdateSet = false;
  Object.defineProperty(mat, "needsUpdate", {
    set: (val) => {
      if (val === true) needsUpdateSet = true;
    },
    get: () => void 0,
    configurable: true
  });
  PBRMaterialSystem.updateSegmentMaterialUniforms([mat], {
    roughness: 99.5,
    metalness: -50,
    clearcoat: 1.25,
    iridescence: -0.5
  }, 0);
  assertEqual(mat.roughness, 1, "Roughness clamped to 1.0");
  assertEqual(mat.metalness, 0, "Metalness clamped to 0.0");
  assertEqual(mat.clearcoat, 1, "Clearcoat clamped to 1.0");
  assertEqual(mat.iridescence, 0, "Iridescence clamped to 0.0");
  assertEqual(needsUpdateSet, false, "ZERO RECOMPILE: needsUpdate setter must NEVER be called");
  assertEqual(mat.version, initialVersion, "ZERO RECOMPILE: mat.version must remain unchanged");
});
runTest("Suite 4: MeshPhysicalMaterial Creation", "Pre-binds procedural normal maps and configures side/sheen/iridescence", () => {
  const upperMat = PBRMaterialSystem.createMeshPhysicalMaterial("upper", "#141518");
  assertEqual(upperMat.side, THREE5.DoubleSide, "Upper material must use DoubleSide");
  assert(upperMat.normalMap !== null && upperMat.normalMap !== void 0, "Upper has normal map");
  assertEqual(upperMat.sheen, 0.25, "Upper sheen");
  const soleMat = PBRMaterialSystem.createMeshPhysicalMaterial("sole", "#d4ff00");
  assertEqual(soleMat.side, THREE5.FrontSide, "Sole material uses FrontSide");
  assert(soleMat.normalMap !== null && soleMat.normalMap !== void 0, "Sole has normal map");
  const accentsMat = PBRMaterialSystem.createMeshPhysicalMaterial("accents", "#7928ca");
  assertEqual(accentsMat.iridescence, 0.75, "Accents iridescence");
  assertEqual(accentsMat.metalness, 0.85, "Accents metalness");
  const lacesMat = PBRMaterialSystem.createMeshPhysicalMaterial("laces", "#ffffff");
  assert(lacesMat.normalMap !== null && lacesMat.normalMap !== void 0, "Laces has normal map");
  assertEqual(lacesMat.sheen, 0.4, "Laces sheen");
});
var validHexCases = [
  ["#fff", "#ffffff"],
  ["#FFF", "#ffffff"],
  ["#000", "#000000"],
  ["#123", "#112233"],
  ["#abc", "#aabbcc"],
  ["#ABC", "#aabbcc"],
  ["#aBc", "#aabbcc"],
  ["#AbC", "#aabbcc"],
  ["#ffffff", "#ffffff"],
  ["#FFFFFF", "#ffffff"],
  ["#000000", "#000000"],
  ["#1a2b3c", "#1a2b3c"],
  ["#1A2B3C", "#1a2b3c"],
  ["#d4ff00", "#d4ff00"],
  ["#D4FF00", "#d4ff00"],
  ["#7928ca", "#7928ca"],
  ["#7928CA", "#7928ca"],
  // Leading/trailing whitespace
  ["  #fff  ", "#ffffff"],
  ["	#123\n", "#112233"],
  [" #d4ff00 ", "#d4ff00"]
];
runTest("Suite 5: Hex Validation (Valid)", "Accurately validates and normalizes all valid hex inputs", () => {
  for (const [input, expected] of validHexCases) {
    const pbrValid = PBRMaterialSystem.validateHex(input);
    const cwValid = validateHex(input);
    assert(pbrValid, `PBRMaterialSystem.validateHex('${input}') must be true`);
    assert(cwValid, `colorways.validateHex('${input}') must be true`);
    const pbrNorm = PBRMaterialSystem.normalizeHex(input);
    const cwNorm = normalizeHex(input);
    assertEqual(pbrNorm, expected, `PBRMaterialSystem.normalizeHex('${input}')`);
    assertEqual(cwNorm, expected, `colorways.normalizeHex('${input}')`);
  }
});
var invalidHexCases = [
  // Missing '#'
  "ffffff",
  "FFF",
  "123456",
  "abc",
  // Wrong lengths
  "#",
  "#1",
  "#12",
  "#1234",
  // 4 digits (RGBA not supported by validator)
  "#12345",
  // 5 digits
  "#1234567",
  // 7 digits
  "#12345678",
  // 8 digits (RRGGBBAA not supported by validator)
  "#123456789",
  // Invalid characters
  "#ggg",
  "#GGG",
  "#xyz",
  "#12345z",
  "#12345!",
  "#12 34",
  "#12-34-56",
  // CSS named colors & functions
  "red",
  "blue",
  "transparent",
  "rgb(255, 0, 0)",
  "rgba(0, 0, 0, 1)",
  "hsl(120, 100%, 50%)",
  // Injection / XSS / Malformed
  "<script>alert(1)</script>",
  "#<script>",
  "#1a2b3c; background: red;",
  "' OR '1'='1",
  "\\x00#ffffff",
  // Empty & whitespace only
  "",
  "   ",
  "\n	",
  // Non-string types
  null,
  void 0,
  123,
  16777215,
  true,
  false,
  {},
  [],
  Symbol("hex")
];
runTest("Suite 5: Hex Validation (Adversarial Fuzzing)", "Rejects all invalid hex formats and falls back to #000000 without crashes", () => {
  for (const bad of invalidHexCases) {
    const pbrValid = PBRMaterialSystem.validateHex(bad);
    const cwValid = validateHex(bad);
    assertEqual(pbrValid, false, `PBRMaterialSystem.validateHex(${JSON.stringify(String(bad))}) must be false`);
    assertEqual(cwValid, false, `colorways.validateHex(${JSON.stringify(String(bad))}) must be false`);
    const pbrNorm = PBRMaterialSystem.normalizeHex(bad);
    const cwNorm = normalizeHex(bad);
    assertEqual(pbrNorm, "#000000", `PBR normalize fallback for ${JSON.stringify(String(bad))}`);
    assertEqual(cwNorm, "#000000", `colorways normalize fallback for ${JSON.stringify(String(bad))}`);
  }
});
runTest("Suite 5: Curated Swatches & Presets Audit", "All 16 swatches and 4 colorways have valid hex and clamped scalars", () => {
  assertEqual(CURATED_SWATCHES.length, 16, "Exactly 16 curated swatches");
  for (const s of CURATED_SWATCHES) {
    assert(PBRMaterialSystem.validateHex(s.hex), `Swatch '${s.name}' (${s.hex}) is valid hex`);
  }
  const presetNames = ["Cyber Phantom", "Retro Heritage", "Triple Stealth", "Aurora Neon"];
  assertEqual(COLORWAYS_LIST.length, 4, "4 colorway presets");
  for (const name of presetNames) {
    const p = COLORWAY_PRESETS[name];
    assert(p !== void 0, `Preset '${name}' exists`);
    for (const seg of ["upper", "sole", "accents", "laces"]) {
      const cfg = p[seg];
      assert(PBRMaterialSystem.validateHex(cfg.color), `${name}.${seg}.color is valid hex`);
      assert(cfg.roughness >= 0 && cfg.roughness <= 1, `${name}.${seg}.roughness in [0, 1]`);
      assert(cfg.metalness >= 0 && cfg.metalness <= 1, `${name}.${seg}.metalness in [0, 1]`);
      assert(cfg.clearcoat >= 0 && cfg.clearcoat <= 1, `${name}.${seg}.clearcoat in [0, 1]`);
      assert(cfg.iridescence >= 0 && cfg.iridescence <= 1, `${name}.${seg}.iridescence in [0, 1]`);
    }
  }
  for (const fKey of ["matte", "gloss", "metallic", "iridescent"]) {
    const f = FINISH_PRESETS[fKey];
    assert(f !== void 0, `Finish ${fKey} exists`);
    assert(f.properties.roughness >= 0 && f.properties.roughness <= 1, `${fKey} roughness in [0, 1]`);
    assert(f.properties.metalness >= 0 && f.properties.metalness <= 1, `${fKey} metalness in [0, 1]`);
    assert(f.properties.clearcoat >= 0 && f.properties.clearcoat <= 1, `${fKey} clearcoat in [0, 1]`);
  }
});
runTest("Suite 6: SneakerStoreEngine", "Initializes with Cyber Phantom preset and 4 segments", () => {
  const store = new SneakerStoreEngine("Cyber Phantom");
  const state = store.getState();
  assertEqual(state.selectedSegment, "upper", "Default selected segment");
  assertEqual(state.currentPreset, "Cyber Phantom", "Initial preset");
  assertEqual(state.customization.upper.color, "#1a1a24", "Cyber Phantom upper color");
  assertEqual(state.customization.sole.color, "#00f0ff", "Cyber Phantom sole color");
});
runTest("Suite 6: SneakerStoreEngine", "Rejects invalid segment selection with descriptive error", () => {
  const store = new SneakerStoreEngine();
  let threw = false;
  try {
    store.selectSegment("tongue");
  } catch (e) {
    threw = true;
    assert(e.message.includes("Invalid sneaker segment"), "Error message");
  }
  assert(threw, "Should throw on invalid segment");
});
runTest("Suite 6: SneakerStoreEngine", "Rejects invalid hex color on mutation and leaves state untouched", () => {
  const store = new SneakerStoreEngine();
  const beforeColor = store.getState().customization.upper.color;
  let threw = false;
  try {
    store.setSegmentColor("upper", "not-a-hex");
  } catch (e) {
    threw = true;
    assert(e.message.includes("Invalid hex color"), "Error message");
  }
  assert(threw, "Should throw on invalid hex");
  assertEqual(store.getState().customization.upper.color, beforeColor, "Color unchanged after error");
});
runTest("Suite 6: SneakerStoreEngine", "Empty patch leaves segment state untouched (Boundary B7.3)", () => {
  const store = new SneakerStoreEngine();
  const before = { ...store.getState().customization.upper };
  store.updateSneakerSegment("upper", {});
  const after = store.getState().customization.upper;
  assertEqual(after.color, before.color, "Color untouched");
  assertEqual(after.roughness, before.roughness, "Roughness untouched");
  assertEqual(after.metalness, before.metalness, "Metalness untouched");
});
runTest("Suite 6: SneakerStoreEngine", "Clamps out-of-bounds scalars on store mutation", () => {
  const store = new SneakerStoreEngine();
  store.updateSneakerSegment("upper", {
    roughness: 10,
    metalness: -5,
    clearcoat: 3.5
  });
  const u = store.getState().customization.upper;
  assertEqual(u.roughness, 1, "Roughness clamped to 1.0");
  assertEqual(u.metalness, 0, "Metalness clamped to 0.0");
  assertEqual(u.clearcoat, 1, "Clearcoat clamped to 1.0");
});
runTest("Suite 6: SneakerStoreEngine", 'Modifying color switches currentPreset to "Custom" and adds history entry', () => {
  const store = new SneakerStoreEngine();
  store.setSegmentColor("sole", "#ff007f");
  const state = store.getState();
  assertEqual(state.currentPreset, "Custom", "Preset flips to Custom");
  assertEqual(state.customization.sole.color, "#ff007f", "Sole color updated");
  assert(state.history.length > 0, "History entry recorded");
  assertEqual(state.history[state.history.length - 1].segment, "sole", "History segment");
});
runTest("Suite 6: SneakerStoreEngine", "applyPreset switches colorways and rejects unknown preset", () => {
  const store = new SneakerStoreEngine();
  store.applyPreset("Retro Heritage");
  assertEqual(store.getState().currentPreset, "Retro Heritage", "Preset applied");
  assertEqual(store.getState().customization.upper.color, "#f4efe6", "Retro Heritage upper color");
  let threw = false;
  try {
    store.applyPreset("NonExistentPreset");
  } catch (e) {
    threw = true;
    assert(e.message.includes("Unknown preset"), "Unknown preset error");
  }
  assert(threw, "Should throw on unknown preset");
});
runTest("Suite 7: UniformMutationEngine", "Indexes materials and mutates uniforms with zero shader recompilation", () => {
  const engine = new UniformMutationEngine();
  const matUpper = new THREE5.MeshPhysicalMaterial({ color: new THREE5.Color("#141518") });
  const matSole = new THREE5.MeshPhysicalMaterial({ color: new THREE5.Color("#d4ff00") });
  const root = new THREE5.Group();
  const meshUpper = new THREE5.Mesh(new THREE5.BufferGeometry(), matUpper);
  meshUpper.userData = { segment: "upper" };
  const meshSole = new THREE5.Mesh(new THREE5.BufferGeometry(), matSole);
  meshSole.userData = { segment: "sole" };
  root.add(meshUpper);
  root.add(meshSole);
  engine.registerModel(root);
  assertEqual(engine.getMaterials("upper").length, 1, "Indexed upper material");
  assertEqual(engine.getMaterials("sole").length, 1, "Indexed sole material");
  const initialVersionUpper = matUpper.version;
  let upperNeedsUpdateCalled = false;
  Object.defineProperty(matUpper, "needsUpdate", {
    set: (v) => {
      if (v === true) upperNeedsUpdateCalled = true;
    },
    get: () => void 0,
    configurable: true
  });
  engine.tweenSegmentColor("upper", "#ff334b", { duration: 0 });
  const expectedColor = new THREE5.Color("#ff334b");
  assertCloseTo(matUpper.color.r, expectedColor.r, 1e-3, "Upper Color R");
  assertCloseTo(matUpper.color.g, expectedColor.g, 1e-3, "Upper Color G");
  assertCloseTo(matUpper.color.b, expectedColor.b, 1e-3, "Upper Color B");
  assertEqual(upperNeedsUpdateCalled, false, "ZERO RECOMPILE: upper needsUpdate setter never invoked");
  assertEqual(matUpper.version, initialVersionUpper, "matUpper.version must remain unchanged");
  const initialVersionSole = matSole.version;
  let soleNeedsUpdateCalled = false;
  Object.defineProperty(matSole, "needsUpdate", {
    set: (v) => {
      if (v === true) soleNeedsUpdateCalled = true;
    },
    get: () => void 0,
    configurable: true
  });
  engine.tweenSegmentScalars("sole", { roughness: 0.2, metalness: 0.9 }, { duration: 0 });
  assertEqual(matSole.roughness, 0.2, "Sole roughness updated");
  assertEqual(matSole.metalness, 0.9, "Sole metalness updated");
  assertEqual(soleNeedsUpdateCalled, false, "ZERO RECOMPILE: sole needsUpdate setter never invoked");
  assertEqual(matSole.version, initialVersionSole, "matSole.version must remain unchanged");
  engine.clear();
  assertEqual(engine.getMaterials("upper").length, 0, "Cleared upper materials");
});
runTest("Suite 8: Sneaker Assembly Integration", "Builds full procedural sneaker with 4 segments and pre-bound normal maps", () => {
  const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
  assert(assembly.root instanceof THREE5.Group, "Root is THREE.Group");
  assert(assembly.rigGroups !== void 0, "Rig groups defined");
  assertEqual(assembly.rigGroups.upper.name, "rig_upper", "Upper rig");
  assertEqual(assembly.rigGroups.sole.name, "rig_sole", "Sole rig");
  assertEqual(assembly.rigGroups.laces.name, "rig_laces", "Laces rig");
  assertEqual(assembly.rigGroups.carbon.name, "rig_carbon", "Carbon rig");
  assertEqual(assembly.rigGroups.accents.name, "rig_accents", "Accents rig");
  const matMap = assembly.materialMap;
  for (const seg of ["upper", "sole", "accents", "laces"]) {
    const mats = matMap.get(seg);
    assert(mats !== void 0 && mats.length > 0, `Segment ${seg} has materials`);
    const m = mats[0];
    assert(m instanceof THREE5.MeshPhysicalMaterial, `${seg} material is MeshPhysicalMaterial`);
    if (seg === "upper") {
      assert(m.normalMap !== null, "Upper has procedural leather normal map");
      assertEqual(m.side, THREE5.DoubleSide, "Upper side is DoubleSide");
    } else if (seg === "sole") {
      assert(m.normalMap !== null, "Sole has procedural rubber normal map");
    } else if (seg === "laces") {
      assert(m.normalMap !== null, "Laces has procedural mesh normal map");
    } else if (seg === "accents") {
      assertEqual(m.metalness, 0.85, "Accents metalness");
      assertEqual(m.iridescence, 0.75, "Accents iridescence");
    }
  }
  let meshCount = 0;
  let totalVertices = 0;
  assembly.root.traverse((node) => {
    if (node.isMesh) {
      meshCount++;
      const geom = node.geometry;
      if (geom && geom.attributes.position) {
        totalVertices += geom.attributes.position.count;
      }
    }
  });
  assert(meshCount >= 40, `Mesh count >= 40 (got ${meshCount})`);
  assert(totalVertices >= 1e4, `Vertex count >= 10000 (got ${totalVertices})`);
});
console.log("\n======================================================================");
console.log("   CHALLENGER M2-1: EMPIRICAL TEXTURE & SHADER STRESS VERIFIER");
console.log(`   Node.js: ${process.version} | Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}`);
console.log("======================================================================\n");
var suiteStats = {};
var totalPassed = 0;
var totalFailed = 0;
var totalDuration = allResults.reduce((sum, r) => sum + r.durationMs, 0);
for (const r of allResults) {
  if (!suiteStats[r.suite]) {
    suiteStats[r.suite] = { total: 0, passed: 0, failed: 0, time: 0 };
  }
  suiteStats[r.suite].total++;
  suiteStats[r.suite].time += r.durationMs;
  if (r.passed) {
    suiteStats[r.suite].passed++;
    totalPassed++;
  } else {
    suiteStats[r.suite].failed++;
    totalFailed++;
    console.error(`  FAIL [${r.suite}] ${r.name}`);
    console.error(`       Error: ${r.error}`);
  }
}
console.log("SUITE SUMMARY:");
console.log("---------------------------------------------------------------------------------------------------");
console.log(" Suite Name                                                 |  Pass |  Fail | Total |    Time");
console.log("---------------------------------------------------------------------------------------------------");
for (const [sName, s] of Object.entries(suiteStats)) {
  const pStr = s.passed.toString().padStart(5);
  const fStr = s.failed.toString().padStart(5);
  const tStr = s.total.toString().padStart(5);
  const tmStr = `${s.time.toFixed(1)}ms`.padStart(9);
  console.log(` ${sName.padEnd(58)} | ${pStr} | ${fStr} | ${tStr} | ${tmStr}`);
}
console.log("---------------------------------------------------------------------------------------------------");
console.log(` TOTAL                                                      | ${totalPassed.toString().padStart(5)} | ${totalFailed.toString().padStart(5)} | ${allResults.length.toString().padStart(5)} | ${totalDuration.toFixed(1)}ms`.padStart(9));
console.log("---------------------------------------------------------------------------------------------------\n");
if (totalFailed > 0) {
  console.error(`\x1B[31mVERDICT: REJECT - ${totalFailed} tests failed!\x1B[0m
`);
  process.exit(1);
} else {
  console.log(`\x1B[32mVERDICT: APPROVE - All ${totalPassed} stress tests passed successfully!\x1B[0m
`);
  process.exit(0);
}
