// tests/challenger-m2-verifier.ts
import * as THREE5 from "three";

// src/store/useSneakerStore.ts
import { useSyncExternalStore } from "react";

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
function getPreset(presetNameOrId) {
  if (COLORWAY_PRESETS[presetNameOrId]) {
    const p = COLORWAY_PRESETS[presetNameOrId];
    return {
      id: presetNameOrId.toLowerCase().replace(/\s+/g, "-"),
      name: p.name,
      tagline: "",
      description: "",
      customization: {
        upper: { ...p.upper },
        sole: { ...p.sole },
        accents: { ...p.accents },
        laces: { ...p.laces }
      }
    };
  }
  const found = COLORWAYS_LIST.find(
    (item) => item.id === presetNameOrId || item.name.toLowerCase() === presetNameOrId.toLowerCase()
  );
  if (found) return found;
  throw new Error(`Unknown preset: ${presetNameOrId}`);
}
function detectActiveFinish(segment) {
  if (!segment) return "matte";
  const { roughness = 0.5, metalness = 0, clearcoat = 0, iridescence = 0 } = segment;
  if (iridescence >= 0.5) return "iridescent";
  if (metalness >= 0.7) return "metallic";
  if (clearcoat >= 0.5 && roughness <= 0.35) return "gloss";
  if (roughness >= 0.65 && clearcoat <= 0.2 && metalness <= 0.2) return "matte";
  return "custom";
}

// src/store/useSneakerStore.ts
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
function useSneakerStore(selector) {
  const state = useSyncExternalStore(
    (callback) => sneakerStoreEngine.subscribe(callback),
    () => sneakerStoreEngine.getState(),
    () => sneakerStoreEngine.getState()
  );
  const fullStore = {
    ...state,
    selectSegment: sneakerStoreEngine.selectSegment,
    setSegmentColor: sneakerStoreEngine.setSegmentColor,
    setSegmentMaterial: sneakerStoreEngine.setSegmentMaterial,
    updateSneakerSegment: sneakerStoreEngine.updateSneakerSegment,
    applyPreset: sneakerStoreEngine.applyPreset,
    applyColorway: sneakerStoreEngine.applyColorway,
    resetCustomization: sneakerStoreEngine.resetCustomization
  };
  if (selector) {
    return selector(fullStore);
  }
  return fullStore;
}

// src/components/3d/UniformMutationEngine.ts
import * as THREE from "three";
import gsap from "gsap";
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
    const targetColor = new THREE.Color(hexColor);
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
      tween = gsap.to(mat.color, {
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
      tween = gsap.to(mat, {
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
      gsap.ticker.sleep();
    } catch {
    }
  }
};
var uniformMutationEngine = new UniformMutationEngine();

// src/materials/PBRMaterialSystem.ts
import * as THREE3 from "three";
import gsap2 from "gsap";

// src/utils/proceduralTextures.ts
import * as THREE2 from "three";
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
        const texture = new THREE2.CanvasTexture(canvas);
        texture.name = `tex_procedural_${type}_normal`;
        texture.wrapS = THREE2.RepeatWrapping;
        texture.wrapT = THREE2.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.generateMipmaps = true;
        texture.minFilter = THREE2.LinearMipmapLinearFilter;
        texture.magFilter = THREE2.LinearFilter;
        texture.anisotropy = 8;
        texture.colorSpace = THREE2.NoColorSpace;
        texture.needsUpdate = true;
        return texture;
      }
    }
    const dataTexture = new THREE2.DataTexture(
      new Uint8Array(rawResult.data),
      size,
      size,
      THREE2.RGBAFormat,
      THREE2.UnsignedByteType
    );
    dataTexture.name = `tex_procedural_${type}_data`;
    dataTexture.wrapS = THREE2.RepeatWrapping;
    dataTexture.wrapT = THREE2.RepeatWrapping;
    dataTexture.repeat.set(repeatX, repeatY);
    dataTexture.generateMipmaps = true;
    dataTexture.minFilter = THREE2.LinearMipmapLinearFilter;
    dataTexture.magFilter = THREE2.LinearFilter;
    dataTexture.colorSpace = THREE2.NoColorSpace;
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
        const texture = new THREE2.CanvasTexture(canvas);
        texture.name = `tex_procedural_${type}_roughness`;
        texture.wrapS = THREE2.RepeatWrapping;
        texture.wrapT = THREE2.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.generateMipmaps = true;
        texture.minFilter = THREE2.LinearMipmapLinearFilter;
        texture.magFilter = THREE2.LinearFilter;
        texture.anisotropy = 8;
        texture.colorSpace = THREE2.NoColorSpace;
        texture.needsUpdate = true;
        return texture;
      }
    }
    const dataTexture = new THREE2.DataTexture(
      new Uint8Array(rawResult.data),
      size,
      size,
      THREE2.RGBAFormat,
      THREE2.UnsignedByteType
    );
    dataTexture.name = `tex_procedural_${type}_roughness_data`;
    dataTexture.wrapS = THREE2.RepeatWrapping;
    dataTexture.wrapT = THREE2.RepeatWrapping;
    dataTexture.repeat.set(repeatX, repeatY);
    dataTexture.generateMipmaps = true;
    dataTexture.minFilter = THREE2.LinearMipmapLinearFilter;
    dataTexture.magFilter = THREE2.LinearFilter;
    dataTexture.colorSpace = THREE2.NoColorSpace;
    dataTexture.needsUpdate = true;
    return dataTexture;
  }
};

// src/materials/PBRMaterialSystem.ts
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
    const mat = new THREE3.MeshPhysicalMaterial({
      name: `mat_${segment}_pbr`,
      color: new THREE3.Color(colorHex),
      roughness: preset.roughness,
      metalness: preset.metalness,
      clearcoat: preset.clearcoat,
      clearcoatRoughness: preset.clearcoatRoughness ?? 0.1,
      reflectivity: preset.reflectivity ?? 0.5,
      specularIntensity: 1,
      ...normalMap ? {
        normalMap,
        normalScale: new THREE3.Vector2(preset.normalScale[0], preset.normalScale[1])
      } : {},
      ...roughnessMap ? { roughnessMap } : {},
      envMapIntensity: preset.envMapIntensity ?? 1,
      side: segment === "upper" ? THREE3.DoubleSide : THREE3.FrontSide,
      ...overrides
    });
    if (preset.sheen && preset.sheen > 0) {
      mat.sheen = preset.sheen;
      mat.sheenRoughness = preset.sheenRoughness ?? 0.5;
      if (preset.sheenColor) mat.sheenColor = new THREE3.Color(preset.sheenColor);
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
      const targetColor = new THREE3.Color(patch.color);
      materials.forEach((mat) => {
        if (duration > 0) {
          gsap2.to(mat.color, {
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

// tests/challenger-m2-verifier.ts
import React2 from "react";
import ReactDOMServer from "react-dom/server";

// src/components/ui/CustomizerHUD.tsx
import { useState, useCallback, useMemo, useRef } from "react";

// src/utils/audio.ts
var WebAudioAtmosphere = class {
  ctx = null;
  masterGain = null;
  ambientGain = null;
  ambientOsc1 = null;
  ambientOsc2 = null;
  ambientFilter = null;
  isMutedState = false;
  isInitialized = false;
  isAmbientPlaying = false;
  constructor() {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem("shoe_shop_audio_muted");
      if (stored !== null) {
        this.isMutedState = stored === "true";
      }
    }
  }
  init() {
    if (this.isInitialized || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMutedState ? 1e-4 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMutedState ? 1e-4 : 0.05, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);
      this.isInitialized = true;
    } catch {
    }
  }
  ensureContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {
      });
    }
    return this.ctx;
  }
  get isMuted() {
    return this.isMutedState;
  }
  toggleMute() {
    this.isMutedState = !this.isMutedState;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("shoe_shop_audio_muted", String(this.isMutedState));
    }
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMutedState ? 1e-4 : 0.35;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    if (this.ambientGain && this.ctx) {
      const ambientTarget = this.isMutedState ? 1e-4 : 0.05;
      this.ambientGain.gain.setTargetAtTime(ambientTarget, this.ctx.currentTime, 0.1);
    }
    return this.isMutedState;
  }
  /**
   * Starts warm, generative luxury ambient drone pad.
   */
  startAmbient() {
    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain || this.isAmbientPlaying) return false;
    try {
      const now = ctx.currentTime;
      this.ambientFilter = ctx.createBiquadFilter();
      this.ambientFilter.type = "lowpass";
      this.ambientFilter.frequency.setValueAtTime(180, now);
      this.ambientFilter.Q.setValueAtTime(1.5, now);
      this.ambientOsc1 = ctx.createOscillator();
      this.ambientOsc1.type = "sine";
      this.ambientOsc1.frequency.setValueAtTime(55, now);
      this.ambientOsc2 = ctx.createOscillator();
      this.ambientOsc2.type = "triangle";
      this.ambientOsc2.frequency.setValueAtTime(110.15, now);
      this.ambientOsc1.connect(this.ambientFilter);
      this.ambientOsc2.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);
      this.ambientOsc1.start(now);
      this.ambientOsc2.start(now);
      this.isAmbientPlaying = true;
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Smoothly stops ambient background audio.
   */
  stopAmbient() {
    if (!this.isAmbientPlaying || !this.ctx) return false;
    try {
      const now = this.ctx.currentTime;
      if (this.ambientGain) {
        this.ambientGain.gain.setTargetAtTime(1e-4, now, 0.2);
      }
      setTimeout(() => {
        if (this.ambientOsc1) {
          try {
            this.ambientOsc1.stop();
          } catch {
          }
          this.ambientOsc1.disconnect();
          this.ambientOsc1 = null;
        }
        if (this.ambientOsc2) {
          try {
            this.ambientOsc2.stop();
          } catch {
          }
          this.ambientOsc2.disconnect();
          this.ambientOsc2 = null;
        }
        this.isAmbientPlaying = false;
      }, 300);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Harmonically tuned dual-sine chime for colorway and preset changes.
   */
  playColorSwitch() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(528, now);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1056, now);
      gain.gain.setValueAtTime(1e-4, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 4e-3);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.22);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.23);
      osc2.stop(now + 0.23);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Tactile low-frequency pitch envelope for anatomical segment tab switching.
   */
  playSegmentSelect() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);
      gain.gain.setValueAtTime(1e-4, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 1e-3);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.07);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.075);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Precise filtered mechanical tick for button and finish switches.
   */
  playClick() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1760, now);
      filter.Q.setValueAtTime(3.5, now);
      gain.gain.setValueAtTime(1e-4, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 1e-3);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.045);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.05);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Tactile micro-mechanical whir/friction sound when orbiting the 3D model.
   */
  playRotation() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(340, now + 0.025);
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(2, now);
      gain.gain.setValueAtTime(1e-4, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 2e-3);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.03);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.035);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Snappy pneumatic / magnetic tactile sound for exploded view separation and snap-back.
   */
  playExplodeSnap() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const clickOsc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);
      clickOsc.type = "triangle";
      clickOsc.frequency.setValueAtTime(1200, now);
      clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
      gain.gain.setValueAtTime(1e-4, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 2e-3);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.1);
      osc.connect(gain);
      clickOsc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      clickOsc.start(now);
      osc.stop(now + 0.11);
      clickOsc.stop(now + 0.11);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Celebratory ascending harmonic chord progression for checkout completion.
   */
  playCheckoutSuccess() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.07;
        const endTime = startTime + 0.45;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(1e-4, startTime);
        gain.gain.linearRampToValueAtTime(0.06, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(1e-4, endTime);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(endTime + 0.02);
      });
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Micro hover blip for magnetic cursor interaction with UI elements.
   */
  playHover() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, now);
      gain.gain.setValueAtTime(1e-4, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 2e-3);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.025);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.03);
      return true;
    } catch {
      return false;
    }
  }
};
var audioEngine = new WebAudioAtmosphere();
var playColorSwitch = () => audioEngine.playColorSwitch();
var playSegmentSelect = () => audioEngine.playSegmentSelect();
var playClick = () => audioEngine.playClick();

// src/components/ui/CustomizerHUD.tsx
import {
  Sparkles,
  Palette,
  Layers,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sliders,
  Eye
} from "lucide-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var SEGMENT_CONFIGS = [
  { id: "upper", label: "Upper", sub: "Mesh & Leather" },
  { id: "sole", label: "Sole", sub: "NitroCell Foam" },
  { id: "accents", label: "Accents", sub: "Heel Clip & Trim" },
  { id: "laces", label: "Laces", sub: "Braided Harness" }
];
var CustomizerHUD = ({
  customization: externalCustomization,
  currentPreset: externalCurrentPreset,
  activeSegment: externalActiveSegment,
  onSelectSegment,
  onUpdateSegment,
  onApplyPreset,
  soundEffects,
  className = "",
  isCollapsible = true
}) => {
  const triggerColorSwitch = useCallback(() => {
    if (soundEffects?.playColorSwitch) {
      soundEffects.playColorSwitch();
    } else {
      playColorSwitch();
    }
  }, [soundEffects]);
  const triggerSegmentSelect = useCallback(() => {
    if (soundEffects?.playSegmentSelect) {
      soundEffects.playSegmentSelect();
    } else {
      playSegmentSelect();
    }
  }, [soundEffects]);
  const triggerClick = useCallback(() => {
    if (soundEffects?.playClick) {
      soundEffects.playClick();
    } else {
      playClick();
    }
  }, [soundEffects]);
  const store = useSneakerStore();
  const customization = externalCustomization || store.activeColorway;
  const currentPreset = externalCurrentPreset || store.currentPreset;
  const activeSegment = externalActiveSegment || store.selectedSegment;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [customHexInput, setCustomHexInput] = useState("");
  const [hexInputError, setHexInputError] = useState(null);
  const nativeColorPickerRef = useRef(null);
  const currentSegmentData = useMemo(() => {
    return customization[activeSegment] || {
      color: "#FFFFFF",
      roughness: 0.5,
      metalness: 0.1
    };
  }, [customization, activeSegment]);
  const activeFinish = useMemo(
    () => detectActiveFinish(currentSegmentData),
    [currentSegmentData]
  );
  const handleSegmentChange = useCallback(
    (segment) => {
      triggerSegmentSelect();
      if (onSelectSegment) {
        onSelectSegment(segment);
      } else {
        store.selectSegment(segment);
      }
    },
    [onSelectSegment, store, triggerSegmentSelect]
  );
  const handleColorChange = useCallback(
    (hexColor) => {
      const normalized = normalizeHex(hexColor);
      triggerColorSwitch();
      if (onUpdateSegment) {
        onUpdateSegment(activeSegment, { color: normalized });
      } else {
        store.updateSneakerSegment(activeSegment, { color: normalized });
      }
    },
    [activeSegment, onUpdateSegment, store, triggerColorSwitch]
  );
  const handleFinishChange = useCallback(
    (finishId) => {
      triggerClick();
      const finishConfig = FINISH_PRESETS[finishId];
      if (!finishConfig) return;
      if (onUpdateSegment) {
        onUpdateSegment(activeSegment, { ...finishConfig.properties });
      } else {
        store.updateSneakerSegment(activeSegment, { ...finishConfig.properties });
      }
    },
    [activeSegment, onUpdateSegment, store, triggerClick]
  );
  const handlePresetApply = useCallback(
    (presetName) => {
      triggerColorSwitch();
      if (onApplyPreset) {
        onApplyPreset(presetName);
      } else {
        store.applyPreset(presetName);
      }
    },
    [onApplyPreset, store, triggerColorSwitch]
  );
  const handleHexSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const trimmed = customHexInput.trim();
      const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
      if (validateHex(withHash)) {
        handleColorChange(withHash);
        setCustomHexInput("");
        setHexInputError(null);
      } else {
        setHexInputError("Invalid hex (e.g. #D4FF00 or #F0F)");
      }
    },
    [customHexInput, handleColorChange]
  );
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `double-bezel-outer w-full max-w-md pointer-events-auto transition-all duration-300 ${className}`,
      "data-testid": "customizer-hud",
      children: /* @__PURE__ */ jsxs("div", { className: "double-bezel-inner p-4 sm:p-5 flex flex-col gap-4 text-neutral-900 dark:text-white", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-black/10 dark:border-white/5 pb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-brand-lime animate-pulse shadow-sm dark:shadow-glow-lime" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-900 dark:text-brand-lime font-bold", children: "Lab Atelier" }),
                /* @__PURE__ */ jsx("span", { className: "text-neutral-400 dark:text-zinc-600 font-mono text-[10px]", children: "\u2022" }),
                /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] tracking-wider text-neutral-500 dark:text-zinc-400 uppercase", children: "Spec APX-01" })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "font-display text-sm font-bold tracking-wide text-neutral-900 dark:text-white uppercase", children: "Customizer HUD" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-white/40" }),
              /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] uppercase tracking-wider text-neutral-700 dark:text-zinc-300", children: currentPreset })
            ] }),
            isCollapsible && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  triggerClick();
                  setIsCollapsed((prev) => !prev);
                },
                className: "w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center transition-colors text-neutral-600 hover:text-black dark:text-zinc-400 dark:hover:text-white",
                title: isCollapsed ? "Expand Customizer" : "Collapse Customizer",
                "aria-label": "Toggle Customizer Visibility",
                children: isCollapsed ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" })
              }
            )
          ] })
        ] }),
        !isCollapsed && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-zinc-400 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" }),
                "Curated Colorways"
              ] }),
              currentPreset !== "Custom" && /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => handlePresetApply("Beige White"),
                  className: "font-mono text-[10px] text-neutral-500 hover:text-black dark:text-zinc-500 dark:hover:text-brand-lime flex items-center gap-1 transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(RotateCcw, { className: "w-3 h-3" }),
                    "Reset Baseline"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: COLORWAYS_LIST.map((preset) => {
              const isActive = currentPreset === preset.name;
              const { upper, sole, accents, laces } = preset.customization;
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => handlePresetApply(preset.name),
                  className: `group relative p-2.5 rounded-xl border text-left transition-all duration-200 flex items-center gap-2.5 ${isActive ? "bg-neutral-900/10 dark:bg-white/10 border-neutral-900 dark:border-brand-lime shadow-sm dark:shadow-glow-lime" : "bg-black/[0.03] dark:bg-white/[0.02] border-black/10 dark:border-white/5 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] hover:border-black/20 dark:hover:border-white/15"}`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "w-6 h-6 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 border border-black/15 dark:border-white/20 flex-shrink-0 shadow-sm", children: [
                      /* @__PURE__ */ jsx("div", { style: { backgroundColor: upper.color }, title: `Upper: ${upper.color}` }),
                      /* @__PURE__ */ jsx("div", { style: { backgroundColor: accents.color }, title: `Accents: ${accents.color}` }),
                      /* @__PURE__ */ jsx("div", { style: { backgroundColor: sole.color }, title: `Sole: ${sole.color}` }),
                      /* @__PURE__ */ jsx("div", { style: { backgroundColor: laces.color }, title: `Laces: ${laces.color}` })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className: `font-display text-xs font-semibold truncate ${isActive ? "text-neutral-900 dark:text-brand-lime" : "text-neutral-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white"}`,
                          children: preset.name
                        }
                      ),
                      /* @__PURE__ */ jsx("div", { className: "font-mono text-[9px] text-neutral-500 dark:text-zinc-500 truncate", children: preset.tagline.split("&")[0] })
                    ] }),
                    isActive && /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-brand-lime animate-pulse" })
                  ]
                },
                preset.id
              );
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 pt-1", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-zinc-400 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Layers, { className: "w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" }),
              "Active Segment"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/5", children: SEGMENT_CONFIGS.map((seg) => {
              const isActive = activeSegment === seg.id;
              const segColor = customization[seg.id]?.color || "#ffffff";
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => handleSegmentChange(seg.id),
                  className: `relative py-2 px-1.5 rounded-lg text-center transition-all duration-200 flex flex-col items-center gap-1 ${isActive ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white font-semibold shadow border border-black/10 dark:border-white/20" : "text-neutral-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"}`,
                  children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: "w-3 h-3 rounded-full border border-black/20 dark:border-white/30 shadow-sm transition-transform group-hover:scale-110",
                        style: { backgroundColor: segColor }
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "font-display text-[11px] tracking-wide uppercase", children: seg.label }),
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-[8px] text-neutral-400 dark:text-zinc-500 truncate max-w-full", children: seg.sub })
                  ]
                },
                seg.id
              );
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 pt-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-zinc-400 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Palette, { className: "w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" }),
                "Colorway Palette"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "font-mono text-[10px] text-neutral-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-neutral-400 dark:text-zinc-500", children: "HEX:" }),
                /* @__PURE__ */ jsx("span", { className: "text-neutral-900 dark:text-brand-lime font-bold", children: currentSegmentData.color.toUpperCase() })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-8 gap-2 p-2.5 rounded-xl bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/5", children: CURATED_SWATCHES.map((swatch) => {
              const isSelected = normalizeHex(currentSegmentData.color) === normalizeHex(swatch.hex);
              return /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleColorChange(swatch.hex),
                  title: `${swatch.name} (${swatch.hex})`,
                  className: `relative w-8 h-8 rounded-full border border-black/10 dark:border-white/20 transition-all duration-200 flex items-center justify-center ${isSelected ? "ring-2 ring-neutral-900 dark:ring-brand-lime ring-offset-2 ring-offset-[#F8F9FA] dark:ring-offset-[#0B0C0E] scale-110 shadow-md dark:shadow-glow-lime" : "hover:scale-105 hover:border-black/30 dark:hover:border-white/40"}`,
                  style: { backgroundColor: swatch.hex },
                  children: isSelected && /* @__PURE__ */ jsx(
                    Check,
                    {
                      className: `w-3.5 h-3.5 drop-shadow-md ${["#ffffff", "#f4efe6", "#d4ff00", "#20e3b2"].includes(
                        swatch.hex.toLowerCase()
                      ) ? "text-black" : "text-white"}`
                    }
                  )
                },
                swatch.id
              );
            }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => nativeColorPickerRef.current?.click(),
                    className: "h-9 px-3 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 flex items-center gap-2 transition-colors text-neutral-800 hover:text-black dark:text-zinc-300 dark:hover:text-white",
                    title: "Open Native Color Wheel",
                    children: [
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className: "w-4 h-4 rounded border border-black/20 dark:border-white/30",
                          style: { backgroundColor: currentSegmentData.color }
                        }
                      ),
                      /* @__PURE__ */ jsx("span", { className: "font-mono text-xs", children: "Wheel" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    ref: nativeColorPickerRef,
                    type: "color",
                    value: normalizeHex(currentSegmentData.color),
                    onChange: (e) => handleColorChange(e.target.value),
                    className: "sr-only",
                    "aria-label": "Native Color Input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("form", { onSubmit: handleHexSubmit, className: "flex-1 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: "relative flex-1", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: customHexInput,
                    onChange: (e) => {
                      setCustomHexInput(e.target.value);
                      setHexInputError(null);
                    },
                    placeholder: `#${normalizeHex(currentSegmentData.color).replace("#", "")}`,
                    maxLength: 7,
                    className: "w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 focus:border-neutral-900 dark:focus:border-brand-lime focus:outline-none rounded-lg px-3 py-1.5 font-mono text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 uppercase tracking-widest transition-colors"
                  }
                ) }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "submit",
                    className: "h-9 px-3 rounded-lg bg-neutral-900 text-white hover:bg-black dark:bg-white/10 dark:hover:bg-brand-lime dark:hover:text-black border border-black/10 dark:border-white/10 font-mono text-xs font-semibold tracking-wider uppercase transition-all duration-200",
                    children: "Apply"
                  }
                )
              ] })
            ] }),
            hexInputError && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-rose-500 tracking-wide", children: hexInputError })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 pt-1 border-t border-black/10 dark:border-white/5 pt-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-zinc-400 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Sliders, { className: "w-3.5 h-3.5 text-neutral-900 dark:text-brand-lime" }),
                "Material Finish"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] text-neutral-500 dark:text-zinc-400 uppercase tracking-wider", children: FINISH_PRESETS[activeFinish]?.label || "Bespoke" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: ["matte", "gloss", "metallic", "iridescent"].map((fKey) => {
              const finish = FINISH_PRESETS[fKey];
              const isSelected = activeFinish === fKey;
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => handleFinishChange(fKey),
                  className: `p-2 rounded-xl border text-center transition-all duration-200 flex flex-col items-center gap-1 ${isSelected ? "bg-neutral-900/10 dark:bg-brand-lime/10 border-neutral-900 dark:border-brand-lime text-neutral-900 dark:text-brand-lime shadow-sm dark:shadow-glow-lime" : "bg-black/[0.03] dark:bg-white/[0.03] border-black/10 dark:border-white/5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-neutral-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-200"}`,
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-[9px] uppercase tracking-widest opacity-60", children: finish.badge }),
                    /* @__PURE__ */ jsx("span", { className: "font-display text-xs font-bold tracking-wide uppercase", children: finish.label })
                  ]
                },
                finish.id
              );
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-black/10 dark:border-white/5 flex items-center justify-between text-neutral-500 dark:text-zinc-500 font-mono text-[10px]", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Eye, { className: "w-3 h-3 text-neutral-900 dark:text-brand-lime" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "ACTIVE: ",
                activeSegment.toUpperCase()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "R:",
              currentSegmentData.roughness?.toFixed(2) || "0.50",
              " M:",
              currentSegmentData.metalness?.toFixed(2) || "0.00"
            ] })
          ] })
        ] })
      ] })
    }
  );
};

// tests/challenger-m2-verifier.ts
var results = [];
function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}
function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(msg + ": expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
  }
}
function runTest(name, fn) {
  const start = performance.now();
  try {
    const res = fn();
    if (res instanceof Promise) {
      throw new Error("Test " + name + " returned a promise; use runAsyncTest");
    }
    results.push({ name, passed: true, durationMs: performance.now() - start });
    console.log("  \u2713 " + name);
  } catch (err) {
    results.push({ name, passed: false, error: err.message, durationMs: performance.now() - start });
    console.error("  \u2717 " + name + ": " + err.message);
  }
}
async function runAsyncTest(name, fn) {
  const start = performance.now();
  try {
    await fn();
    results.push({ name, passed: true, durationMs: performance.now() - start });
    console.log("  \u2713 " + name);
  } catch (err) {
    results.push({ name, passed: false, error: err.message, durationMs: performance.now() - start });
    console.error("  \u2717 " + name + ": " + err.message);
  }
}
async function main() {
  console.log("======================================================================");
  console.log("  CHALLENGER M2: CUSTOMIZER ENGINE & HUD UI INDEPENDENT VERIFICATION");
  console.log("======================================================================\n");
  console.log("--- 1. Testing SneakerStoreEngine ---");
  runTest("Store: Initializes with default preset 'Cyber Phantom' and 'upper' segment", () => {
    const store = new SneakerStoreEngine();
    assertEqual(store.selectedSegment, "upper", "Selected segment default");
    assertEqual(store.currentPreset, "Cyber Phantom", "Current preset default");
    assertEqual(store.activeColorway.sole.color, "#00f0ff", "Sole color in Cyber Phantom");
    assertEqual(store.activeColorway.accents.color, "#7928ca", "Accents color in Cyber Phantom");
  });
  runTest("Store: selectSegment switches segment and notifies listeners", () => {
    const store = new SneakerStoreEngine();
    let notified = false;
    store.subscribe((state) => {
      if (state.selectedSegment === "laces") notified = true;
    });
    store.selectSegment("laces");
    assertEqual(store.selectedSegment, "laces", "Selected segment switched");
    assert(notified, "Subscriber was notified of segment change");
  });
  runTest("Store: selectSegment rejects invalid segment names", () => {
    const store = new SneakerStoreEngine();
    let caught = false;
    try {
      store.selectSegment("midsole");
    } catch (e) {
      caught = true;
      assert(e.message.includes("Invalid sneaker segment"), "Error message format");
    }
    assert(caught, "Did not throw on invalid segment");
  });
  runTest("Store: updateSneakerSegment with empty patch does not modify state (B7.3)", () => {
    const store = new SneakerStoreEngine();
    const beforeState = JSON.stringify(store.getState());
    store.updateSneakerSegment("upper", {});
    const afterState = JSON.stringify(store.getState());
    assertEqual(afterState, beforeState, "State should be unmodified on empty patch");
    assertEqual(store.history.length, 0, "No history entry added for empty patch");
  });
  runTest("Store: updateSneakerSegment validates hex color (B7.4)", () => {
    const store = new SneakerStoreEngine();
    let caught = false;
    try {
      store.updateSneakerSegment("sole", { color: "not-a-hex" });
    } catch (e) {
      caught = true;
      assert(e.message.includes("Invalid hex color"), "Error message format");
    }
    assert(caught, "Did not throw on invalid hex color");
  });
  runTest("Store: updateSneakerSegment normalizes 3-digit shorthand and lowercases", () => {
    const store = new SneakerStoreEngine();
    store.updateSneakerSegment("sole", { color: "#0F8" });
    assertEqual(store.activeColorway.sole.color, "#00ff88", "Normalized 3-digit hex");
    assertEqual(store.currentPreset, "Custom", "Preset flipped to Custom");
  });
  runTest("Store: updateSneakerSegment isolates targeted segment without mutating others", () => {
    const store = new SneakerStoreEngine();
    const soleBefore = store.activeColorway.sole.color;
    const accentsBefore = store.activeColorway.accents.color;
    const lacesBefore = store.activeColorway.laces.color;
    store.updateSneakerSegment("upper", { color: "#ff334b" });
    assertEqual(store.activeColorway.upper.color, "#ff334b", "Upper color updated");
    assertEqual(store.activeColorway.sole.color, soleBefore, "Sole preserved");
    assertEqual(store.activeColorway.accents.color, accentsBefore, "Accents preserved");
    assertEqual(store.activeColorway.laces.color, lacesBefore, "Laces preserved");
  });
  runTest("Store: updateSneakerSegment clamps scalar PBR properties [0.0, 1.0]", () => {
    const store = new SneakerStoreEngine();
    store.updateSneakerSegment("upper", {
      roughness: 2.5,
      metalness: -0.8,
      clearcoat: 1.05,
      iridescence: NaN
    });
    assertEqual(store.activeColorway.upper.roughness, 1, "Clamped max roughness");
    assertEqual(store.activeColorway.upper.metalness, 0, "Clamped min metalness");
    assertEqual(store.activeColorway.upper.clearcoat, 1, "Clamped max clearcoat");
    assertEqual(store.activeColorway.upper.iridescence, 0, "Handled NaN iridescence safely");
  });
  runTest("Store: applyPreset updates full colorway and rejects invalid preset", () => {
    const store = new SneakerStoreEngine();
    store.applyPreset("Retro Heritage");
    assertEqual(store.currentPreset, "Retro Heritage", "Preset name updated");
    assertEqual(store.activeColorway.upper.color, "#f4efe6", "Retro Heritage upper color");
    assertEqual(store.activeColorway.sole.color, "#c84b31", "Retro Heritage sole color");
    let caught = false;
    try {
      store.applyPreset("NonExistentPreset");
    } catch (e) {
      caught = true;
      assert(e.message.includes("Unknown preset"), "Throws on unknown preset");
    }
    assert(caught, "Did not throw on invalid preset");
  });
  runTest("Store: applyPreset deep-clones so subsequent mutations do not corrupt preset dictionary", () => {
    const store = new SneakerStoreEngine();
    store.applyPreset("Triple Stealth");
    store.updateSneakerSegment("upper", { color: "#ff0000" });
    assertEqual(COLORWAY_PRESETS["Triple Stealth"].upper.color, "#111111", "Original preset remains intact");
  });
  runTest("Store: resetCustomization reverts back to 'Cyber Phantom'", () => {
    const store = new SneakerStoreEngine();
    store.applyPreset("Aurora Neon");
    store.resetCustomization();
    assertEqual(store.currentPreset, "Cyber Phantom", "Reverted preset");
    assertEqual(store.activeColorway.sole.color, "#00f0ff", "Reverted sole color");
  });
  console.log("\n--- 2. Testing UniformMutationEngine ---");
  runTest("UniformMutationEngine: registerModel indexes materials and meshes correctly", () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    engine.registerModel(assembly.root, assembly.materialMap);
    const upperMats = engine.getMaterials("upper");
    const soleMats = engine.getMaterials("sole");
    const accentMats = engine.getMaterials("accents");
    const laceMats = engine.getMaterials("laces");
    assert(upperMats.length >= 1, "Upper materials indexed");
    assert(soleMats.length >= 1, "Sole materials indexed");
    assert(accentMats.length >= 1, "Accent materials indexed");
    assert(laceMats.length >= 1, "Lace materials indexed");
    const soleMeshes = engine.getMeshes("sole");
    assert(soleMeshes.length >= 2, "Sole meshes indexed (outsole + tread lugs)");
  });
  runTest("UniformMutationEngine: ZERO-RECOMPILE GUARANTEE (material.needsUpdate remains false)", () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    engine.registerModel(assembly.root, assembly.materialMap);
    const upperMats = engine.getMaterials("upper");
    const soleMats = engine.getMaterials("sole");
    const vUpperBefore = upperMats.map((m) => m.version);
    const vSoleBefore = soleMats.map((m) => m.version);
    engine.tweenSegmentColor("upper", "#ff00ff", { duration: 0 });
    upperMats.forEach((m, i) => {
      assertEqual(m.version, vUpperBefore[i], "Material version MUST NOT increment on color mutation (zero-recompile)!");
      assertEqual(m.color.getHexString(), "ff00ff", "Direct color uniform updated");
    });
    engine.tweenSegmentScalars("sole", { roughness: 0.12, metalness: 0.95 }, { duration: 0 });
    soleMats.forEach((m, i) => {
      assertEqual(m.version, vSoleBefore[i], "Material version MUST NOT increment on scalar mutation (zero-recompile)!");
      assertEqual(m.roughness, 0.12, "Direct roughness updated");
      assertEqual(m.metalness, 0.95, "Direct metalness updated");
    });
  });
  await runAsyncTest("UniformMutationEngine: GSAP smooth color tweening interpolates RGB uniforms", async () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    engine.registerModel(assembly.root, assembly.materialMap);
    const upperMats = engine.getMaterials("upper");
    upperMats[0].color.set("#000000");
    const vBefore = upperMats[0].version;
    let completed = false;
    engine.tweenSegmentColor("upper", "#ffffff", {
      duration: 0.05,
      onComplete: () => {
        completed = true;
      }
    });
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (completed) {
          clearInterval(check);
          resolve();
        }
      }, 10);
    });
    assert(completed, "GSAP tween completed callback fired");
    assert(upperMats[0].color.r > 0.95, "Color tweened towards target: " + upperMats[0].color.r);
    assertEqual(upperMats[0].version, vBefore, "Material version unchanged after GSAP tween");
  });
  runTest("UniformMutationEngine: overwrite: 'auto' gracefully interrupts rapid mutations without leak", () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    engine.registerModel(assembly.root, assembly.materialMap);
    for (let i = 0; i < 20; i++) {
      const hex = "#" + (i * 10).toString(16).padStart(2, "0") + "0000";
      engine.tweenSegmentColor("upper", hex, { duration: 0.38 });
    }
    const upperMat = engine.getMaterials("upper")[0];
    assert(Number.isFinite(upperMat.color.r), "Color uniform remains finite");
    assert(Number.isFinite(upperMat.color.g), "Color uniform remains finite");
    assert(Number.isFinite(upperMat.color.b), "Color uniform remains finite");
    engine.clear();
  });
  runTest("UniformMutationEngine: applyCustomization applies 4 segments in a single pass", () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    engine.registerModel(assembly.root, assembly.materialMap);
    const testCustomization = {
      upper: { color: "#112233", roughness: 0.3 },
      sole: { color: "#445566", roughness: 0.5 },
      accents: { color: "#778899", roughness: 0.7 },
      laces: { color: "#aabbcc", roughness: 0.9 }
    };
    engine.applyCustomization(testCustomization, { duration: 0 });
    const upperMat = engine.getMaterials("upper")[0];
    const soleMat = engine.getMaterials("sole")[0];
    const accentMat = engine.getMaterials("accents")[0];
    const laceMat = engine.getMaterials("laces")[0];
    assertEqual(upperMat.color.getHexString(), "112233", "Upper color applied");
    assertEqual(soleMat.color.getHexString(), "445566", "Sole color applied");
    assertEqual(accentMat.color.getHexString(), "778899", "Accents color applied");
    assertEqual(laceMat.color.getHexString(), "aabbcc", "Laces color applied");
    assertEqual(upperMat.roughness, 0.3, "Upper roughness applied");
    assertEqual(soleMat.roughness, 0.5, "Sole roughness applied");
    assertEqual(accentMat.roughness, 0.7, "Accents roughness applied");
    assertEqual(laceMat.roughness, 0.9, "Laces roughness applied");
  });
  runTest("UniformMutationEngine: clear() halts active tweens and frees maps", () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    engine.registerModel(assembly.root, assembly.materialMap);
    engine.tweenSegmentColor("upper", "#ff0000", { duration: 5 });
    engine.clear();
    assertEqual(engine.getMaterials("upper").length, 0, "Upper materials emptied");
    assertEqual(engine.getMeshes("upper").length, 0, "Upper meshes emptied");
  });
  console.log("\n--- 3. Testing Colorways, Presets & Utilities ---");
  runTest("Colorways: 4 Curated Presets exist and contain valid 6-digit hex values", () => {
    const expectedPresets = ["Cyber Phantom", "Retro Heritage", "Triple Stealth", "Aurora Neon"];
    for (const name of expectedPresets) {
      const p = COLORWAY_PRESETS[name];
      assert(Boolean(p), "Preset " + name + " must exist");
      assert(validateHex(p.upper.color), name + " upper hex valid");
      assert(validateHex(p.sole.color), name + " sole hex valid");
      assert(validateHex(p.accents.color), name + " accents hex valid");
      assert(validateHex(p.laces.color), name + " laces hex valid");
    }
  });
  runTest("Colorways: COLORWAYS_LIST contains all 4 presets with taglines and descriptions", () => {
    assertEqual(COLORWAYS_LIST.length, 4, "4 presets in list");
    const ids = COLORWAYS_LIST.map((p) => p.id);
    assert(ids.includes("cyber-phantom"), "Has cyber-phantom");
    assert(ids.includes("retro-heritage"), "Has retro-heritage");
    assert(ids.includes("triple-stealth"), "Has triple-stealth");
    assert(ids.includes("aurora-neon"), "Has aurora-neon");
    COLORWAYS_LIST.forEach((item) => {
      assert(item.tagline.length > 0, item.id + " has non-empty tagline");
      assert(item.description.length > 0, item.id + " has non-empty description");
    });
  });
  runTest("Colorways: 4 Material Finish Presets exist with valid physical properties", () => {
    const finishes = ["matte", "gloss", "metallic", "iridescent"];
    for (const f of finishes) {
      const preset = FINISH_PRESETS[f];
      assert(Boolean(preset), "Finish preset " + f + " exists");
      assert(preset.properties.roughness >= 0 && preset.properties.roughness <= 1, f + " roughness in range");
      assert(preset.properties.metalness >= 0 && preset.properties.metalness <= 1, f + " metalness in range");
      assert(preset.properties.clearcoat >= 0 && preset.properties.clearcoat <= 1, f + " clearcoat in range");
    }
  });
  runTest("Colorways: CURATED_SWATCHES contains exactly 16 luxury colors", () => {
    assertEqual(CURATED_SWATCHES.length, 16, "16 curated swatches");
    const ids = /* @__PURE__ */ new Set();
    CURATED_SWATCHES.forEach((s) => {
      assert(!ids.has(s.id), "Duplicate swatch ID: " + s.id);
      ids.add(s.id);
      assert(validateHex(s.hex), "Swatch " + s.id + " hex " + s.hex + " is valid");
      assert(["monochrome", "neon", "heritage", "chroma"].includes(s.family), "Valid family " + s.family);
    });
  });
  runTest("Colorways: validateHex handles valid and adversarial inputs", () => {
    assert(validateHex("#FFF"), "3-digit hex valid");
    assert(validateHex("#ffffff"), "6-digit hex valid");
    assert(validateHex("#00F0FF"), "Uppercase hex valid");
    assert(validateHex("  #1a1a24  "), "Padded whitespace valid");
    assert(!validateHex("#GGGGGG"), "Invalid characters rejected");
    assert(!validateHex("#12"), "2-digit rejected");
    assert(!validateHex("#1234"), "4-digit rejected");
    assert(!validateHex("#1234567"), "7-digit rejected");
    assert(!validateHex(""), "Empty string rejected");
    assert(!validateHex(null), "null rejected");
    assert(!validateHex(void 0), "undefined rejected");
    assert(!validateHex(123456), "number rejected");
  });
  runTest("Colorways: normalizeHex formats correctly", () => {
    assertEqual(normalizeHex("#fff"), "#ffffff", "Expand 3-digit");
    assertEqual(normalizeHex("#ABC"), "#aabbcc", "Expand and lowercase");
    assertEqual(normalizeHex("#00F0FF"), "#00f0ff", "Lowercase 6-digit");
    assertEqual(normalizeHex("invalid"), "#000000", "Fallback on invalid");
  });
  runTest("Colorways: getPreset looks up by exact name or slug", () => {
    const p1 = getPreset("Cyber Phantom");
    assertEqual(p1.name, "Cyber Phantom", "Found by exact name");
    const p2 = getPreset("cyber-phantom");
    assertEqual(p2.name, "Cyber Phantom", "Found by slug");
    let caught = false;
    try {
      getPreset("invalid-name");
    } catch (e) {
      caught = true;
      assert(e.message.includes("Unknown preset"), "Error message format");
    }
    assert(caught, "Threw on unknown preset");
  });
  runTest("Colorways: detectActiveFinish identifies correct finish preset", () => {
    assertEqual(detectActiveFinish({ roughness: 0.85, clearcoat: 0, metalness: 0.02 }), "matte", "Detected matte");
    assertEqual(detectActiveFinish({ roughness: 0.18, clearcoat: 0.85 }), "gloss", "Detected gloss");
    assertEqual(detectActiveFinish({ metalness: 0.9 }), "metallic", "Detected metallic");
    assertEqual(detectActiveFinish({ iridescence: 0.92 }), "iridescent", "Detected iridescent");
    assertEqual(detectActiveFinish({ roughness: 0.5, metalness: 0.5, clearcoat: 0.2 }), "custom", "Detected custom");
  });
  console.log("\n--- 4. Testing PBRMaterialSystem ---");
  runTest("PBRMaterialSystem: getPresetProperties matches project specifications", () => {
    const upper = PBRMaterialSystem.getPresetProperties("upper");
    assertEqual(upper.roughness, 0.42, "Upper roughness 0.42");
    assertEqual(upper.clearcoat, 0.25, "Upper clearcoat 0.25");
    assertEqual(upper.normalScale[0], 0.8, "Upper normalScale X");
    const sole = PBRMaterialSystem.getPresetProperties("sole");
    assertEqual(sole.roughness, 0.65, "Sole roughness 0.65");
    assertEqual(sole.normalScale[0], 1.5, "Sole normalScale X");
    const accents = PBRMaterialSystem.getPresetProperties("accents");
    assertEqual(accents.metalness, 0.85, "Accents metalness 0.85");
    assertEqual(accents.iridescence, 0.75, "Accents iridescence 0.75");
    const laces = PBRMaterialSystem.getPresetProperties("laces");
    assertEqual(laces.roughness, 0.75, "Laces roughness 0.75");
    assertEqual(laces.metalness, 0.02, "Laces metalness 0.02");
  });
  runTest("PBRMaterialSystem: createMeshPhysicalMaterial attaches normal maps and sets params", () => {
    const matUpper = PBRMaterialSystem.createMeshPhysicalMaterial("upper", "#112233");
    assertEqual(matUpper.name, "mat_upper_pbr", "Material name");
    assert(matUpper instanceof THREE5.MeshPhysicalMaterial, "Is MeshPhysicalMaterial");
    assertEqual(matUpper.color.getHexString(), "112233", "Color hex applied");
    assert(matUpper.normalMap !== null, "Normal map attached to upper");
    assertEqual(matUpper.normalScale.x, 0.8, "Normal scale X matches preset");
    const matAccents = PBRMaterialSystem.createMeshPhysicalMaterial("accents", "#E8ECEF");
    assertEqual(matAccents.iridescence, 0.75, "Accents iridescence configured");
    assertEqual(matAccents.iridescenceIOR, 1.45, "Accents iridescenceIOR configured");
  });
  console.log("\n--- 5. Adversarial Stress Testing ---");
  runTest("Adversarial: 500 Rapid-Fire Random Color Mutations across All Segments", () => {
    const store = new SneakerStoreEngine();
    const segments = ["upper", "sole", "accents", "laces"];
    for (let i = 0; i < 500; i++) {
      const seg = segments[i % segments.length];
      const r = Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
      const g = Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
      const b = Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
      const hex = "#" + r + g + b;
      store.updateSneakerSegment(seg, { color: hex });
      assertEqual(store.activeColorway[seg].color, hex, "Iteration " + i + " updated color");
    }
    assertEqual(store.history.length, 500, "500 history entries recorded");
    assertEqual(store.currentPreset, "Custom", "Preset remains Custom");
  });
  runTest("Adversarial: Preset Thrashing 100 Cycles", () => {
    const store = new SneakerStoreEngine();
    const presetNames = ["Cyber Phantom", "Retro Heritage", "Triple Stealth", "Aurora Neon"];
    for (let i = 0; i < 100; i++) {
      const name = presetNames[i % presetNames.length];
      store.applyPreset(name);
      assertEqual(store.currentPreset, name, "Preset cycle " + i);
    }
  });
  runTest("Adversarial: Malicious / Weird Hex Inputs Rejection", () => {
    const store = new SneakerStoreEngine();
    const maliciousInputs = [
      "<script>alert(1)</script>",
      "#",
      "#1",
      "#12",
      "#1234",
      "#12345",
      "#1234567",
      "rgb(255,0,0)",
      "hsl(0, 100%, 50%)",
      "red",
      "undefined",
      "#GGGGGG",
      "#zzz",
      "# 123456",
      "#123 456",
      "#123456 "
      // space inside? wait, trim handles leading/trailing, internal space fails
    ];
    for (const bad of [
      "<script>alert(1)</script>",
      "#",
      "#1",
      "#12",
      "#1234",
      "#12345",
      "#1234567",
      "rgb(255,0,0)",
      "hsl(0, 100%, 50%)",
      "red",
      "undefined",
      "#GGGGGG",
      "#zzz",
      "# 123456",
      "#123 456"
    ]) {
      let threw = false;
      try {
        store.updateSneakerSegment("upper", { color: bad });
      } catch (e) {
        threw = true;
      }
      assert(threw, "Malicious hex " + JSON.stringify(bad) + " must throw an error");
    }
    store.updateSneakerSegment("upper", { color: "   #123456\n  " });
    assertEqual(store.activeColorway.upper.color, "#123456", "Whitespace padded hex normalized");
  });
  console.log("\n--- 6. Testing Customizer HUD UI ---");
  runTest("CustomizerHUD: Renders with double-bezel concentric hierarchy", () => {
    const html = ReactDOMServer.renderToStaticMarkup(React2.createElement(CustomizerHUD));
    assert(html.includes("double-bezel-outer"), "Contains double-bezel-outer class");
    assert(html.includes("double-bezel-inner"), "Contains double-bezel-inner class");
    assert(html.includes('data-testid="customizer-hud"'), "Contains data-testid");
  });
  runTest("CustomizerHUD: Renders all 4 anatomical segment tabs with labels and subtitles", () => {
    const html = ReactDOMServer.renderToStaticMarkup(React2.createElement(CustomizerHUD));
    assert(html.includes("Upper"), "Contains Upper segment");
    assert(html.includes("Sole"), "Contains Sole segment");
    assert(html.includes("Accents"), "Contains Accents segment");
    assert(html.includes("Laces"), "Contains Laces segment");
    assert(html.includes("NitroCell Foam"), "Contains Sole subtitle");
  });
  runTest("CustomizerHUD: Renders all 4 curated colorway presets with 4-quadrant previews", () => {
    const html = ReactDOMServer.renderToStaticMarkup(React2.createElement(CustomizerHUD));
    assert(html.includes("Cyber Phantom"), "Contains Cyber Phantom preset");
    assert(html.includes("Retro Heritage"), "Contains Retro Heritage preset");
    assert(html.includes("Triple Stealth"), "Contains Triple Stealth preset");
    assert(html.includes("Aurora Neon"), "Contains Aurora Neon preset");
    assert(html.includes("grid-cols-2 grid-rows-2"), "Contains 4-quadrant preview mini swatches");
  });
  runTest("CustomizerHUD: Renders 16 curated swatches with colors", () => {
    const html = ReactDOMServer.renderToStaticMarkup(React2.createElement(CustomizerHUD));
    for (const swatch of CURATED_SWATCHES) {
      assert(html.includes(swatch.hex), "HTML contains swatch hex " + swatch.hex);
    }
  });
  runTest("CustomizerHUD: Renders all 4 material finish buttons with badges", () => {
    const html = ReactDOMServer.renderToStaticMarkup(React2.createElement(CustomizerHUD));
    assert(html.includes("Matte"), "Contains Matte finish");
    assert(html.includes("DIFFUSE"), "Contains DIFFUSE badge");
    assert(html.includes("Gloss"), "Contains Gloss finish");
    assert(html.includes("SPECULAR"), "Contains SPECULAR badge");
    assert(html.includes("Metallic"), "Contains Metallic finish");
    assert(html.includes("ANODIZED"), "Contains ANODIZED badge");
    assert(html.includes("Iridescent"), "Contains Iridescent finish");
    assert(html.includes("CHROMA"), "Contains CHROMA badge");
  });
  runTest("CustomizerHUD: Displays live telemetry and hex inputs", () => {
    const html = ReactDOMServer.renderToStaticMarkup(React2.createElement(CustomizerHUD));
    assert(html.includes("ACTIVE: UPPER"), "Shows active segment telemetry");
    assert(html.includes("Native Color Input"), "Contains native color wheel input");
    assert(html.includes("Apply"), "Contains hex submit apply button");
  });
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log("\n======================================================================");
  console.log("  VERIFICATION RESULTS: " + passed + "/" + total + " PASSED (" + (passed / total * 100).toFixed(1) + "%)");
  console.log("======================================================================");
  if (failed > 0) {
    console.error("\nFAILED TESTS (" + failed + "):");
    results.filter((r) => !r.passed).forEach((r) => {
      console.error("  - " + r.name + ": " + r.error);
    });
    process.exit(1);
  } else {
    console.log("\nALL CHALLENGER M2 INDEPENDENT TESTS PASSED!");
    process.exit(0);
  }
}
main().catch((err) => {
  console.error("Fatal error in test runner:", err);
  process.exit(1);
});
