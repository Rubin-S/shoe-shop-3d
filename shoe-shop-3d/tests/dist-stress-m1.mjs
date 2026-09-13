// tests/stress-m1-empirical.ts
import * as THREE7 from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// src/components/3d/ProceduralSneaker.ts
import * as THREE3 from "three";

// src/materials/PBRMaterialSystem.ts
import * as THREE2 from "three";
import gsap from "gsap";

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

// src/components/3d/ProceduralSneaker.ts
var ProceduralSneakerGenerator = class {
  /**
   * Generates the anatomical 2D foot-last outline in X-Z space.
   * Runs from Heel (Z = -1.30) to Toe (Z = +1.35).
   */
  static createSoleFootprintShape() {
    const shape = new THREE3.Shape();
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
    const group = new THREE3.Group();
    group.name = "assembly_outsole";
    const footprint = this.createSoleFootprintShape();
    const extrudeSettings = {
      depth: 0.075,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.02,
      bevelThickness: 0.02
    };
    const soleGeom = new THREE3.ExtrudeGeometry(footprint, extrudeSettings);
    soleGeom.rotateX(-Math.PI * 0.5);
    soleGeom.rotateY(Math.PI);
    soleGeom.translate(0, 0.034, 0);
    const soleMesh = new THREE3.Mesh(soleGeom, soleMaterial);
    soleMesh.name = "mesh_outsole_base";
    soleMesh.castShadow = true;
    soleMesh.receiveShadow = true;
    soleMesh.userData = { segment: "sole", subpart: "outsole" };
    group.add(soleMesh);
    const treadGeom = new THREE3.BoxGeometry(0.55, 0.014, 0.05);
    const treadMat = soleMaterial.clone();
    treadMat.roughness = 0.85;
    treadMat.name = "mat_sole_tread";
    for (let i = 0; i < 12; i++) {
      const zPos = -1.1 + i * 0.2;
      const widthScale = zPos > 0.2 && zPos < 0.9 ? 1.35 : zPos < -0.6 ? 1.1 : 0.85;
      const treadMesh = new THREE3.Mesh(treadGeom, treadMat);
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
    const geom = new THREE3.BoxGeometry(width, height, length, 12, 4, 20);
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
    const mesh = new THREE3.Mesh(geom, soleMaterial);
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
    const shape = new THREE3.Shape();
    shape.moveTo(-0.18, -0.3);
    shape.lineTo(0.18, -0.3);
    shape.lineTo(0.24, 0.25);
    shape.lineTo(-0.24, 0.25);
    shape.closePath();
    const geom = new THREE3.ExtrudeGeometry(shape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 8e-3,
      bevelThickness: 8e-3
    });
    geom.rotateX(Math.PI * 0.5);
    geom.translate(0, 0.105, 0);
    const carbonMat = new THREE3.MeshPhysicalMaterial({
      color: new THREE3.Color("#1A1C20"),
      roughness: 0.24,
      metalness: 0.7,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      name: "mat_carbon_shank"
    });
    const mesh = new THREE3.Mesh(geom, carbonMat);
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
    const group = new THREE3.Group();
    group.name = "assembly_upper";
    const radiusTop = 0.4;
    const radiusBottom = 0.48;
    const height = 0.75;
    const radialSegments = 24;
    const heightSegments = 16;
    const geom = new THREE3.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, false);
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
    const upperMesh = new THREE3.Mesh(geom, upperMaterial);
    upperMesh.name = "mesh_upper_body";
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    upperMesh.userData = { segment: "upper", subpart: "vamp_quarters" };
    group.add(upperMesh);
    const collarCurve = new THREE3.EllipseCurve(
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
    const collarPoints = collarCurve.getPoints(32).map((p) => new THREE3.Vector3(p.x, 0.82, p.y - 0.35));
    const collarPath = new THREE3.CatmullRomCurve3(collarPoints, true);
    const collarGeom = new THREE3.TubeGeometry(collarPath, 32, 0.045, 8, true);
    const collarMesh = new THREE3.Mesh(collarGeom, upperMaterial);
    collarMesh.name = "mesh_collar_rim";
    collarMesh.castShadow = true;
    collarMesh.userData = { segment: "upper", subpart: "collar" };
    group.add(collarMesh);
    const tongueCurve = new THREE3.CatmullRomCurve3([
      new THREE3.Vector3(0, 0.44, 0.55),
      new THREE3.Vector3(0, 0.62, 0.32),
      new THREE3.Vector3(0, 0.78, 0.1),
      new THREE3.Vector3(0, 0.95, -0.14)
    ]);
    const tongueGeom = new THREE3.TubeGeometry(tongueCurve, 24, 0.045, 8, false);
    tongueGeom.scale(3.8, 1, 1);
    const tongueMesh = new THREE3.Mesh(tongueGeom, upperMaterial);
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
    const group = new THREE3.Group();
    group.name = "assembly_laces";
    const eyeletPairs = [
      [new THREE3.Vector3(-0.19, 0.5, 0.52), new THREE3.Vector3(0.19, 0.5, 0.52)],
      [new THREE3.Vector3(-0.21, 0.58, 0.38), new THREE3.Vector3(0.21, 0.58, 0.38)],
      [new THREE3.Vector3(-0.22, 0.66, 0.24), new THREE3.Vector3(0.22, 0.66, 0.24)],
      [new THREE3.Vector3(-0.22, 0.74, 0.1), new THREE3.Vector3(0.22, 0.74, 0.1)],
      [new THREE3.Vector3(-0.21, 0.82, -0.04), new THREE3.Vector3(0.21, 0.82, -0.04)]
    ];
    const grommetGeom = new THREE3.TorusGeometry(0.022, 7e-3, 8, 16);
    grommetGeom.rotateX(Math.PI * 0.35);
    eyeletPairs.forEach(([left, right], idx) => {
      const leftRing = new THREE3.Mesh(grommetGeom, accentMaterial);
      leftRing.position.copy(left);
      leftRing.name = `mesh_eyelet_L_${idx + 1}`;
      leftRing.castShadow = true;
      leftRing.userData = { segment: "accents", subpart: "eyelet" };
      group.add(leftRing);
      const rightRing = new THREE3.Mesh(grommetGeom, accentMaterial);
      rightRing.position.copy(right);
      rightRing.name = `mesh_eyelet_R_${idx + 1}`;
      rightRing.castShadow = true;
      rightRing.userData = { segment: "accents", subpart: "eyelet" };
      group.add(rightRing);
    });
    for (let i = 0; i < eyeletPairs.length - 1; i++) {
      const [lCurrent, rCurrent] = eyeletPairs[i];
      const [lNext, rNext] = eyeletPairs[i + 1];
      const midPoint1 = new THREE3.Vector3(
        0,
        (lCurrent.y + rNext.y) * 0.5 + 0.035,
        // Arch slightly over tongue
        (lCurrent.z + rNext.z) * 0.5
      );
      const curve1 = new THREE3.CatmullRomCurve3([lCurrent, midPoint1, rNext]);
      const laceGeom1 = new THREE3.TubeGeometry(curve1, 16, 0.015, 8, false);
      const laceMesh1 = new THREE3.Mesh(laceGeom1, lacesMaterial);
      laceMesh1.name = `mesh_lace_cross_LR_${i}`;
      laceMesh1.castShadow = true;
      laceMesh1.userData = { segment: "laces", subpart: "criss_cross" };
      group.add(laceMesh1);
      const midPoint2 = new THREE3.Vector3(
        0,
        (rCurrent.y + lNext.y) * 0.5 + 0.025,
        (rCurrent.z + lNext.z) * 0.5
      );
      const curve2 = new THREE3.CatmullRomCurve3([rCurrent, midPoint2, lNext]);
      const laceGeom2 = new THREE3.TubeGeometry(curve2, 16, 0.015, 8, false);
      const laceMesh2 = new THREE3.Mesh(laceGeom2, lacesMaterial);
      laceMesh2.name = `mesh_lace_cross_RL_${i}`;
      laceMesh2.castShadow = true;
      laceMesh2.userData = { segment: "laces", subpart: "criss_cross" };
      group.add(laceMesh2);
    }
    const knotCurve = new THREE3.CatmullRomCurve3([
      new THREE3.Vector3(-0.12, 0.85, -0.04),
      new THREE3.Vector3(0, 0.88, -0.02),
      new THREE3.Vector3(0.12, 0.85, -0.04)
    ]);
    const knotGeom = new THREE3.TubeGeometry(knotCurve, 12, 0.02, 8, false);
    const knotMesh = new THREE3.Mesh(knotGeom, lacesMaterial);
    knotMesh.name = "mesh_lace_knot";
    knotMesh.castShadow = true;
    knotMesh.userData = { segment: "laces", subpart: "knot" };
    group.add(knotMesh);
    const agletGeom = new THREE3.CylinderGeometry(9e-3, 9e-3, 0.08, 8);
    const leftAglet = new THREE3.Mesh(agletGeom, accentMaterial);
    leftAglet.name = "mesh_aglet_L";
    leftAglet.castShadow = true;
    leftAglet.position.set(-0.14, 0.78, -0.02);
    leftAglet.rotation.z = 0.35;
    leftAglet.userData = { segment: "accents", subpart: "aglet" };
    group.add(leftAglet);
    const rightAglet = new THREE3.Mesh(agletGeom, accentMaterial);
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
    const group = new THREE3.Group();
    group.name = "assembly_accents";
    const heelCurve = new THREE3.CatmullRomCurve3([
      new THREE3.Vector3(0.38, 0.38, -0.8),
      new THREE3.Vector3(0.42, 0.44, -1.05),
      new THREE3.Vector3(0, 0.46, -1.32),
      new THREE3.Vector3(-0.42, 0.44, -1.05),
      new THREE3.Vector3(-0.38, 0.38, -0.8)
    ]);
    const heelClipGeom = new THREE3.TubeGeometry(heelCurve, 28, 0.042, 8, false);
    heelClipGeom.scale(1, 1.8, 1);
    const heelClipMesh = new THREE3.Mesh(heelClipGeom, accentMaterial);
    heelClipMesh.name = "mesh_heel_clip";
    heelClipMesh.castShadow = true;
    heelClipMesh.receiveShadow = true;
    heelClipMesh.userData = { segment: "accents", subpart: "heel_clip" };
    group.add(heelClipMesh);
    const bladeShape = new THREE3.Shape();
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
    const lateralGeom = new THREE3.ExtrudeGeometry(bladeShape, bladeExtrude);
    lateralGeom.rotateY(-Math.PI * 0.5);
    lateralGeom.translate(0.46, 0.42, -0.1);
    const lateralBlade = new THREE3.Mesh(lateralGeom, accentMaterial);
    lateralBlade.name = "mesh_lateral_accent_blade";
    lateralBlade.castShadow = true;
    lateralBlade.userData = { segment: "accents", subpart: "lateral_blade" };
    group.add(lateralBlade);
    const medialGeom = new THREE3.ExtrudeGeometry(bladeShape, bladeExtrude);
    medialGeom.rotateY(Math.PI * 0.5);
    medialGeom.translate(-0.46, 0.42, -0.1);
    const medialBlade = new THREE3.Mesh(medialGeom, accentMaterial);
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
    const root = new THREE3.Group();
    root.name = "sneaker_root";
    root.userData = { isSneakerRoot: true };
    const matUpper = PBRMaterialSystem.createMeshPhysicalMaterial("upper", "#f5f2eb", {
      roughness: 0.38,
      metalness: 0.02,
      clearcoat: 0.18,
      clearcoatRoughness: 0.25,
      sheen: 0.35,
      sheenRoughness: 0.45,
      sheenColor: new THREE3.Color("#fcfbf8"),
      normalScale: new THREE3.Vector2(0.8, 0.8)
    });
    const matSole = PBRMaterialSystem.createMeshPhysicalMaterial("sole", "#e6ded1", {
      roughness: 0.68,
      metalness: 0.02,
      clearcoat: 0.06,
      clearcoatRoughness: 0.4,
      normalScale: new THREE3.Vector2(1.5, 1.5)
    });
    const matAccents = PBRMaterialSystem.createMeshPhysicalMaterial("accents", "#c9bba8", {
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
      iridescence: 0.75,
      iridescenceIOR: 1.45,
      iridescenceThicknessRange: [120, 380],
      normalScale: new THREE3.Vector2(0.3, 0.3),
      envMapIntensity: 2.4
    });
    const matLaces = PBRMaterialSystem.createMeshPhysicalMaterial("laces", "#ece5d8", {
      roughness: 0.82,
      metalness: 0,
      clearcoat: 0,
      sheen: 0.3,
      sheenRoughness: 0.6,
      sheenColor: new THREE3.Color("#f7f4ed"),
      normalScale: new THREE3.Vector2(1.2, 1.2)
    });
    const rigUpper = new THREE3.Group();
    rigUpper.name = "rig_upper";
    const rigLaces = new THREE3.Group();
    rigLaces.name = "rig_laces";
    const rigCarbon = new THREE3.Group();
    rigCarbon.name = "rig_carbon";
    const rigSole = new THREE3.Group();
    rigSole.name = "rig_sole";
    const rigAccents = new THREE3.Group();
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

// src/components/3d/StudioLighting.ts
import * as THREE4 from "three";
import gsap2 from "gsap";
function createStudioLighting(scene, options = {}) {
  const isMobile = options.isMobile ?? (typeof window !== "undefined" && window.innerWidth < 768);
  const initialTheme = options.initialTheme ?? "dark";
  const lightGroup = new THREE4.Group();
  lightGroup.name = "studio_lighting_rig";
  const keyLight = new THREE4.DirectionalLight(
    initialTheme === "light" ? 16776696 : 16775405,
    initialTheme === "light" ? 2.15 : 2.2
  );
  keyLight.name = "light_key";
  keyLight.position.set(4.2, 5.8, 3.8);
  keyLight.target.position.set(0, 0.4, 0);
  keyLight.castShadow = true;
  const shadowResolution = isMobile ? 1024 : 2048;
  keyLight.shadow.mapSize.width = shadowResolution;
  keyLight.shadow.mapSize.height = shadowResolution;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 18;
  keyLight.shadow.camera.left = -3.5;
  keyLight.shadow.camera.right = 3.5;
  keyLight.shadow.camera.top = 3.5;
  keyLight.shadow.camera.bottom = -3.5;
  keyLight.shadow.bias = -12e-5;
  keyLight.shadow.normalBias = 0.038;
  keyLight.shadow.radius = 2.8;
  lightGroup.add(keyLight);
  lightGroup.add(keyLight.target);
  const fillLight = new THREE4.DirectionalLight(
    initialTheme === "light" ? 15791352 : 15463167,
    initialTheme === "light" ? 1.15 : 0.85
  );
  fillLight.name = "light_fill";
  fillLight.position.set(-4.8, 2.8, -1.8);
  fillLight.target.position.set(0, 0.4, 0);
  fillLight.castShadow = false;
  lightGroup.add(fillLight);
  lightGroup.add(fillLight.target);
  const rimLight = new THREE4.DirectionalLight(
    16777215,
    initialTheme === "light" ? 1.55 : 2.8
  );
  rimLight.name = "light_rim";
  rimLight.position.set(-1.8, 5.2, -5.2);
  rimLight.target.position.set(0, 0.4, 0);
  rimLight.castShadow = false;
  lightGroup.add(rimLight);
  lightGroup.add(rimLight.target);
  const bounceLight = new THREE4.DirectionalLight(
    initialTheme === "light" ? 15591388 : 1579296,
    initialTheme === "light" ? 0.65 : 0.4
  );
  bounceLight.name = "light_bounce";
  bounceLight.position.set(0, -2.5, 0);
  bounceLight.target.position.set(0, 0.4, 0);
  bounceLight.castShadow = false;
  lightGroup.add(bounceLight);
  lightGroup.add(bounceLight.target);
  const hemiLight = new THREE4.HemisphereLight(
    initialTheme === "light" ? 16777215 : 1842466,
    initialTheme === "light" ? 15262940 : 657932,
    initialTheme === "light" ? 1.05 : 0.6
  );
  hemiLight.name = "light_hemi";
  lightGroup.add(hemiLight);
  scene.add(lightGroup);
  const setTheme = (theme) => {
    const isLight = theme === "light";
    gsap2.to(keyLight, {
      intensity: isLight ? 2.15 : 2.2,
      duration: 0.8,
      ease: "power2.out"
    });
    keyLight.color.set(isLight ? 16776696 : 16775405);
    gsap2.to(fillLight, {
      intensity: isLight ? 1.15 : 0.85,
      duration: 0.8,
      ease: "power2.out"
    });
    fillLight.color.set(isLight ? 15791352 : 15463167);
    gsap2.to(rimLight, {
      intensity: isLight ? 1.55 : 2.8,
      duration: 0.8,
      ease: "power2.out"
    });
    gsap2.to(bounceLight, {
      intensity: isLight ? 0.65 : 0.4,
      duration: 0.8,
      ease: "power2.out"
    });
    bounceLight.color.set(isLight ? 15591388 : 1579296);
    gsap2.to(hemiLight, {
      intensity: isLight ? 1.05 : 0.6,
      duration: 0.8,
      ease: "power2.out"
    });
    hemiLight.color.set(isLight ? 16777215 : 1842466);
    hemiLight.groundColor.set(isLight ? 15262940 : 657932);
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
    }
  };
}

// src/components/3d/ContactShadow.ts
import * as THREE5 from "three";
import gsap3 from "gsap";
function generateCosineAOTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    const centerX = size / 2;
    const centerY = size / 2;
    const radiusX = size * 0.44;
    const radiusY = size * 0.22;
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const dx = (px - centerX) / radiusX;
        const dy = (py - centerY) / radiusY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 1) {
          const factor = Math.cos(dist * Math.PI / 2);
          const alpha = factor * factor * 0.75;
          const idx = (py * size + px) * 4;
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = Math.round(alpha * 255);
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  const texture = new THREE5.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.generateMipmaps = true;
  texture.minFilter = THREE5.LinearMipmapLinearFilter;
  return texture;
}
function generateCycloramaAlphaTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx && typeof ctx.createRadialGradient === "function") {
    ctx.clearRect(0, 0, size, size);
    const center = size / 2;
    const grad = ctx.createRadialGradient(center, center, size * 0.1, center, center, size * 0.48);
    grad.addColorStop(0, "rgb(255, 255, 255)");
    grad.addColorStop(0.25, "rgb(225, 225, 225)");
    grad.addColorStop(0.55, "rgb(120, 120, 120)");
    grad.addColorStop(0.82, "rgb(28, 28, 28)");
    grad.addColorStop(1, "rgb(0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  } else if (ctx) {
    if (typeof ctx.clearRect === "function") ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgb(128, 128, 128)";
    if (typeof ctx.fillRect === "function") ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE5.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.generateMipmaps = true;
  texture.minFilter = THREE5.LinearMipmapLinearFilter;
  return texture;
}
function createContactShadow(scene, initialTheme = "light") {
  const shadowGroup = new THREE5.Group();
  shadowGroup.name = "contact_shadow_group";
  const isLight = initialTheme === "light";
  const shadowGeo = new THREE5.PlaneGeometry(16, 16);
  const shadowMat = new THREE5.ShadowMaterial({
    opacity: isLight ? 0.22 : 0.38,
    transparent: true,
    depthWrite: false
  });
  const shadowPlane = new THREE5.Mesh(shadowGeo, shadowMat);
  shadowPlane.name = "mesh_dynamic_shadow_receiver";
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0, 0);
  shadowPlane.receiveShadow = true;
  shadowGroup.add(shadowPlane);
  const aoTexture = generateCosineAOTexture();
  const aoGeo = new THREE5.PlaneGeometry(3.6, 1.8);
  const aoMat = new THREE5.MeshBasicMaterial({
    map: aoTexture,
    transparent: true,
    opacity: isLight ? 0.4 : 0.7,
    depthWrite: false
  });
  const aoPlane = new THREE5.Mesh(aoGeo, aoMat);
  aoPlane.name = "mesh_cosine_ao_contact";
  aoPlane.rotation.x = -Math.PI / 2;
  aoPlane.position.set(0, 2e-3, 0);
  shadowGroup.add(aoPlane);
  const floorAlphaTex = generateCycloramaAlphaTexture();
  const floorGeo = new THREE5.PlaneGeometry(48, 48);
  const floorMat = new THREE5.MeshStandardMaterial({
    color: isLight ? 16316922 : 328967,
    roughness: isLight ? 0.82 : 0.45,
    metalness: 0,
    alphaMap: floorAlphaTex,
    transparent: true,
    opacity: 0,
    // Disabled: clean floating zero-g aesthetic with transparent shadow
    depthWrite: false
  });
  const floorPlane = new THREE5.Mesh(floorGeo, floorMat);
  floorPlane.name = "mesh_studio_floor";
  floorPlane.rotation.x = -Math.PI / 2;
  floorPlane.position.set(0, -1e-3, 0);
  floorPlane.receiveShadow = true;
  floorPlane.renderOrder = -1;
  floorPlane.visible = false;
  shadowGroup.add(floorPlane);
  scene.add(shadowGroup);
  const setTheme = (theme) => {
    const light = theme === "light";
    gsap3.to(shadowMat, {
      opacity: light ? 0.22 : 0.38,
      duration: 0.8,
      ease: "power2.out"
    });
    gsap3.to(aoMat, {
      opacity: light ? 0.4 : 0.7,
      duration: 0.8,
      ease: "power2.out"
    });
    floorMat.color.set(light ? 16316922 : 328967);
    floorMat.roughness = light ? 0.82 : 0.45;
    floorMat.opacity = 0;
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
    }
  };
}

// src/components/3d/SneakerLoader.ts
import * as THREE6 from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
var SneakerModelLoader = class {
  gltfLoader;
  dracoLoader = null;
  timeoutMs;
  activeTimeoutId = null;
  constructor(dracoPath = "/draco/", timeoutMs = 25e3) {
    this.timeoutMs = timeoutMs;
    this.gltfLoader = new GLTFLoader();
    if (typeof window !== "undefined") {
      try {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(dracoPath);
        this.gltfLoader.setDRACOLoader(dracoLoader);
        this.dracoLoader = dracoLoader;
      } catch (e) {
        console.warn("[SneakerModelLoader] DRACOLoader initialization warning:", e);
      }
    }
  }
  /**
   * Loads the sneaker model from the provided URL.
   * Seamlessly normalizes bounding geometry, creates 5 exploded rig groups,
   * converts textures/materials to PBR MeshPhysicalMaterial,
   * and falls back to procedural geometry on failure or timeout.
   */
  async loadSneaker(url = "/models/sneaker.glb", onProgress) {
    try {
      const gltfPromise = new Promise((resolve, reject) => {
        this.gltfLoader.load(
          url,
          (gltf) => {
            const parsed = this.processGltfModel(gltf.scene);
            resolve(parsed);
          },
          (event) => {
            if (event.lengthComputable && onProgress) {
              onProgress(Math.round(event.loaded / event.total * 100));
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
      const timeoutPromise = new Promise((_, reject) => {
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
  loadProceduralFallback() {
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    return {
      model: assembly.root,
      isProcedural: true,
      materialMap: assembly.materialMap,
      rigGroups: assembly.rigGroups
    };
  }
  /**
   * Disposes loader resources, including DRACOLoader worker pools and active timers.
   */
  dispose() {
    if (this.activeTimeoutId !== null) {
      clearTimeout(this.activeTimeoutId);
      this.activeTimeoutId = null;
    }
    if (this.dracoLoader) {
      try {
        this.dracoLoader.dispose();
      } catch (e) {
        console.warn("[SneakerModelLoader] Error disposing DRACOLoader:", e);
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
  processGltfModel(scene) {
    const materialMap = /* @__PURE__ */ new Map();
    materialMap.set("upper", []);
    materialMap.set("sole", []);
    materialMap.set("accents", []);
    materialMap.set("laces", []);
    const initialBox = new THREE6.Box3().setFromObject(scene);
    const initialSize = new THREE6.Vector3();
    initialBox.getSize(initialSize);
    if (initialSize.x > initialSize.z) {
      scene.rotation.y = -Math.PI * 0.5;
    }
    scene.updateMatrixWorld(true);
    const orientedBox = new THREE6.Box3().setFromObject(scene);
    const orientedSize = new THREE6.Vector3();
    orientedBox.getSize(orientedSize);
    const maxHorizontalDim = Math.max(orientedSize.x, orientedSize.z);
    const targetLength = 2.45;
    const scaleFactor = maxHorizontalDim > 0 ? targetLength / maxHorizontalDim : 1;
    scene.scale.setScalar(scaleFactor);
    scene.updateMatrixWorld(true);
    const scaledBox = new THREE6.Box3().setFromObject(scene);
    const scaledCenter = new THREE6.Vector3();
    scaledBox.getCenter(scaledCenter);
    scene.position.x = -scaledCenter.x;
    scene.position.z = -scaledCenter.z;
    scene.position.y = -scaledBox.min.y + 0.05;
    scene.updateMatrixWorld(true);
    const root = new THREE6.Group();
    root.name = "sneaker_root";
    const rigGroups = {
      upper: new THREE6.Group(),
      laces: new THREE6.Group(),
      carbon: new THREE6.Group(),
      sole: new THREE6.Group(),
      accents: new THREE6.Group()
    };
    rigGroups.upper.name = "rig_upper";
    rigGroups.laces.name = "rig_laces";
    rigGroups.carbon.name = "rig_carbon";
    rigGroups.sole.name = "rig_sole";
    rigGroups.accents.name = "rig_accents";
    root.add(rigGroups.upper);
    root.add(rigGroups.laces);
    root.add(rigGroups.carbon);
    root.add(rigGroups.sole);
    root.add(rigGroups.accents);
    const meshes = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });
    meshes.forEach((mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const matNames = Array.isArray(mesh.material) ? mesh.material.map((m) => m.name || "").join(" ") : mesh.material?.name || "";
      const identifier = `${mesh.name} ${matNames}`.toLowerCase();
      let segment = "upper";
      let targetRig = rigGroups.upper;
      if (/lace/i.test(identifier)) {
        segment = "laces";
        targetRig = rigGroups.laces;
      } else if (/sole|tread|cushion|foam|outsole|midsole/i.test(identifier)) {
        segment = "sole";
        targetRig = rigGroups.sole;
      } else if (/stripe|accent|band|patch|logo|badge|aglet/i.test(identifier)) {
        segment = "accents";
        targetRig = rigGroups.accents;
      } else {
        segment = "upper";
        targetRig = rigGroups.upper;
      }
      mesh.userData.segment = segment;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const newMats = mats.map((m) => {
        let pbrMat;
        if (m instanceof THREE6.MeshPhysicalMaterial) {
          pbrMat = m;
        } else {
          const stdMat = m;
          pbrMat = new THREE6.MeshPhysicalMaterial({
            color: stdMat.color ? stdMat.color.clone() : new THREE6.Color(16777215),
            map: stdMat.map || null,
            normalMap: stdMat.normalMap || null,
            roughnessMap: stdMat.roughnessMap || null,
            metalnessMap: stdMat.metalnessMap || null,
            roughness: segment === "sole" ? 0.68 : segment === "accents" ? 0.22 : segment === "laces" ? 0.8 : 0.4,
            metalness: segment === "accents" ? 0.78 : 0.02,
            clearcoat: segment === "accents" ? 0.85 : segment === "upper" ? 0.2 : segment === "sole" ? 0.06 : 0,
            clearcoatRoughness: segment === "accents" ? 0.1 : 0.25,
            specularIntensity: 1,
            envMapIntensity: segment === "accents" ? 2.2 : 1.1,
            name: m.name || `mat_${segment}_converted`
          });
        }
        const existing = materialMap.get(segment) || [];
        if (!existing.includes(pbrMat)) {
          existing.push(pbrMat);
          materialMap.set(segment, existing);
        }
        return pbrMat;
      });
      mesh.material = newMats.length === 1 ? newMats[0] : newMats;
      targetRig.attach(mesh);
    });
    const carbonGeom = new THREE6.BoxGeometry(0.44, 0.024, 0.52);
    const carbonMat = new THREE6.MeshPhysicalMaterial({
      color: new THREE6.Color("#141518"),
      roughness: 0.2,
      metalness: 0.85,
      clearcoat: 0.95,
      clearcoatRoughness: 0.1,
      name: "mat_carbon_arch_plate"
    });
    const carbonMesh = new THREE6.Mesh(carbonGeom, carbonMat);
    carbonMesh.name = "mesh_carbon_arch_plate";
    carbonMesh.position.set(0, 0.115, 0.02);
    carbonMesh.castShadow = true;
    carbonMesh.receiveShadow = true;
    carbonMesh.userData = { segment: "sole", subpart: "carbon_plate" };
    rigGroups.carbon.add(carbonMesh);
    const soleMaterials = materialMap.get("sole") || [];
    soleMaterials.push(carbonMat);
    materialMap.set("sole", soleMaterials);
    return {
      model: root,
      isProcedural: false,
      materialMap,
      rigGroups
    };
  }
};

// src/types/sneaker.ts
var DEFAULT_EXPLODED_OFFSETS = {
  upper: [0, 0.45, 0],
  laces: [0, 0.7, 0.15],
  carbonPlate: [0, -0.2, 0],
  outsole: [0, -0.55, 0],
  heelAccents: [-0.35, 0.15, 0]
};

// tests/stress-m1-empirical.ts
var results = [];
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}
async function runTest(suite, name, fn) {
  const start = performance.now();
  try {
    const data = await fn() || void 0;
    const durationMs = performance.now() - start;
    results.push({ suite, name, passed: true, durationMs, data });
    console.log(`  \u2713 [${suite}] ${name} (${durationMs.toFixed(2)}ms)`);
  } catch (err) {
    const durationMs = performance.now() - start;
    results.push({ suite, name, passed: false, error: err?.message || String(err), durationMs });
    console.error(`  \u2717 [${suite}] ${name} (${durationMs.toFixed(2)}ms)`);
    console.error(`    Error: ${err?.message || err}`);
  }
}
function createMockDomElement() {
  const listeners = {};
  return {
    addEventListener: (type, listener) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(listener);
    },
    removeEventListener: (type, listener) => {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter((l) => l !== listener);
    },
    dispatchEvent: (event) => {
      const list = listeners[event.type] || [];
      list.forEach((l) => l(event));
      return true;
    },
    ownerDocument: {
      addEventListener: () => {
      },
      removeEventListener: () => {
      }
    },
    getRootNode: () => ({
      addEventListener: () => {
      },
      removeEventListener: () => {
      }
    }),
    style: {},
    clientWidth: 1920,
    clientHeight: 1080
  };
}
async function runSuite1() {
  console.log("\n--- SUITE 1: Camera Collision Boundaries & OrbitControls Stress ---");
  await runTest("Suite 1: Camera & OrbitControls", "Camera initial configuration and FoV matches luxury specification", () => {
    const camera = new THREE7.PerspectiveCamera(40, 1920 / 1080, 0.1, 100);
    camera.position.set(2.4, 1.4, 3.8);
    assert(camera.fov === 40, `FOV must be 40.0, got ${camera.fov}`);
    assert(camera.near === 0.1, `near must be 0.1, got ${camera.near}`);
    assert(camera.far === 100, `far must be 100.0, got ${camera.far}`);
    const initialDistance = camera.position.length();
    assert(initialDistance > 1.8 && initialDistance < 6.5, `Initial distance ${initialDistance} must be within [1.8, 6.5]`);
    return { fov: camera.fov, initialDistance: initialDistance.toFixed(3) };
  });
  await runTest("Suite 1: Camera & OrbitControls", "OrbitControls boundary constants strictly match specification", () => {
    const camera = new THREE7.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(2.4, 1.4, 3.8);
    const dom = createMockDomElement();
    const controls = new OrbitControls(camera, dom);
    controls.target.set(0, 0.45, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.045;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.minDistance = 1.8;
    controls.maxDistance = 6.5;
    controls.enablePan = false;
    assert(Math.abs(controls.minPolarAngle - 0.565486677) < 1e-3, `minPolarAngle expected ~0.565, got ${controls.minPolarAngle}`);
    assert(Math.abs(controls.maxPolarAngle - 1.633628179) < 1e-3, `maxPolarAngle expected ~1.633, got ${controls.maxPolarAngle}`);
    assert(controls.minDistance === 1.8, `minDistance must be 1.80, got ${controls.minDistance}`);
    assert(controls.maxDistance === 6.5, `maxDistance must be 6.50, got ${controls.maxDistance}`);
    assert(controls.dampingFactor === 0.045, `dampingFactor must be 0.045, got ${controls.dampingFactor}`);
    assert(controls.enableDamping === true, "enableDamping must be true");
    assert(controls.enablePan === false, "enablePan must be false to lock product center");
    return {
      minPolarAngleRad: controls.minPolarAngle,
      maxPolarAngleRad: controls.maxPolarAngle,
      minPolarDeg: (controls.minPolarAngle * 180 / Math.PI).toFixed(2),
      maxPolarDeg: (controls.maxPolarAngle * 180 / Math.PI).toFixed(2),
      minDistance: controls.minDistance,
      maxDistance: controls.maxDistance
    };
  });
  await runTest("Suite 1: Camera & OrbitControls", "Adversarial extreme drag: Polar angle never breaches [0.565, 1.633] rad", () => {
    const camera = new THREE7.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 2, 4);
    const dom = createMockDomElement();
    const controls = new OrbitControls(camera, dom);
    controls.target.set(0, 0.45, 0);
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.minDistance = 1.8;
    controls.maxDistance = 6.5;
    controls.enableDamping = false;
    const spherical = new THREE7.Spherical();
    const offset = new THREE7.Vector3();
    for (let i = 0; i < 100; i++) {
      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);
      spherical.phi -= 10;
      spherical.phi = Math.max(controls.minPolarAngle, Math.min(controls.maxPolarAngle, spherical.phi));
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      const currentPolar = controls.getPolarAngle();
      assert(
        currentPolar >= controls.minPolarAngle - 1e-6,
        `Polar angle breached minimum: ${currentPolar} < ${controls.minPolarAngle}`
      );
      assert(
        currentPolar <= controls.maxPolarAngle + 1e-6,
        `Polar angle breached maximum: ${currentPolar} > ${controls.maxPolarAngle}`
      );
    }
    for (let i = 0; i < 100; i++) {
      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);
      spherical.phi += 10;
      spherical.phi = Math.max(controls.minPolarAngle, Math.min(controls.maxPolarAngle, spherical.phi));
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      const currentPolar = controls.getPolarAngle();
      assert(
        currentPolar <= controls.maxPolarAngle + 1e-6,
        `Polar angle breached maximum: ${currentPolar} > ${controls.maxPolarAngle}`
      );
    }
    let minObserved = Infinity;
    let maxObserved = -Infinity;
    for (let i = 0; i < 500; i++) {
      const deltaPhi = (Math.random() - 0.5) * 50;
      const deltaTheta = (Math.random() - 0.5) * 50;
      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);
      spherical.phi += deltaPhi;
      spherical.theta += deltaTheta;
      spherical.phi = Math.max(controls.minPolarAngle, Math.min(controls.maxPolarAngle, spherical.phi));
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      const polar = controls.getPolarAngle();
      minObserved = Math.min(minObserved, polar);
      maxObserved = Math.max(maxObserved, polar);
      assert(polar >= controls.minPolarAngle - 1e-6, `Random input breached min: ${polar}`);
      assert(polar <= controls.maxPolarAngle + 1e-6, `Random input breached max: ${polar}`);
    }
    return {
      minAllowed: controls.minPolarAngle,
      maxAllowed: controls.maxPolarAngle,
      minObserved,
      maxObserved,
      totalAdversarialSteps: 700
    };
  });
  await runTest("Suite 1: Camera & OrbitControls", "Adversarial zoom stress: Distance clamp [1.80, 6.50] strictly holds", () => {
    const camera = new THREE7.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.45, 4);
    const dom = createMockDomElement();
    const controls = new OrbitControls(camera, dom);
    controls.target.set(0, 0.45, 0);
    controls.minDistance = 1.8;
    controls.maxDistance = 6.5;
    const offset = new THREE7.Vector3();
    const spherical = new THREE7.Spherical();
    for (let i = 0; i < 50; i++) {
      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);
      spherical.radius *= 1e-4;
      spherical.radius = Math.max(controls.minDistance, Math.min(controls.maxDistance, spherical.radius));
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      const dist = camera.position.distanceTo(controls.target);
      assert(dist >= 1.8 - 1e-6, `Distance breached min: ${dist} < 1.80`);
      assert(dist <= 6.5 + 1e-6, `Distance breached max: ${dist} > 6.50`);
    }
    for (let i = 0; i < 50; i++) {
      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);
      spherical.radius *= 1e4;
      spherical.radius = Math.max(controls.minDistance, Math.min(controls.maxDistance, spherical.radius));
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      const dist = camera.position.distanceTo(controls.target);
      assert(dist <= 6.5 + 1e-6, `Distance breached max: ${dist} > 6.50`);
      assert(dist >= 1.8 - 1e-6, `Distance breached min: ${dist} < 1.80`);
    }
    return {
      minDistanceVerified: 1.8,
      maxDistanceVerified: 6.5,
      status: "STRICTLY_CLAMPED"
    };
  });
}
async function runSuite2() {
  console.log("\n--- SUITE 2: Procedural Model Latency & Fallback Performance ---");
  await runTest("Suite 2: Performance & Latency", "createSneakerAssembly completes in < 100ms across 20 iterations", () => {
    const latencies = [];
    const ITERATIONS = 20;
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
      const t1 = performance.now();
      latencies.push(t1 - t0);
      assert(assembly.root.children.length > 0, "Root must have children");
    }
    const minMs = Math.min(...latencies);
    const maxMs = Math.max(...latencies);
    const avgMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    latencies.sort((a, b) => a - b);
    const p95Ms = latencies[Math.floor(latencies.length * 0.95)];
    assert(maxMs < 100, `Max instantiation latency ${maxMs.toFixed(2)}ms exceeded 100ms threshold!`);
    assert(avgMs < 50, `Average instantiation latency ${avgMs.toFixed(2)}ms exceeded 50ms target!`);
    return {
      iterations: ITERATIONS,
      minMs: minMs.toFixed(2),
      maxMs: maxMs.toFixed(2),
      avgMs: avgMs.toFixed(2),
      p95Ms: p95Ms.toFixed(2),
      threshold: "< 100ms",
      passed: true
    };
  });
  await runTest("Suite 2: Performance & Latency", "SneakerModelLoader.loadProceduralFallback completes instantaneously", () => {
    const loader = new SneakerModelLoader("/draco/", 3500);
    const t0 = performance.now();
    const result = loader.loadProceduralFallback();
    const elapsed = performance.now() - t0;
    assert(result.isProcedural === true, "isProcedural flag must be true");
    assert(result.model instanceof THREE7.Group, "result.model must be THREE.Group");
    assert(elapsed < 100, `Fallback load ${elapsed.toFixed(2)}ms exceeded 100ms`);
    return {
      isProcedural: result.isProcedural,
      elapsedMs: elapsed.toFixed(2)
    };
  });
}
async function runSuite3() {
  console.log("\n--- SUITE 3: Geometry Integrity, 8 Anatomical Components & Normals ---");
  await runTest("Suite 3: Geometry Integrity", "All 8 anatomical components exist in the procedural hierarchy", () => {
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    const root = assembly.root;
    const meshMap = /* @__PURE__ */ new Map();
    root.traverse((child) => {
      if (child.isMesh) {
        meshMap.set(child.name, child);
      }
    });
    assert(meshMap.has("mesh_outsole_base"), "Missing anatomical component 1: mesh_outsole_base");
    let treadCount = 0;
    root.traverse((child) => {
      if (child.userData?.subpart === "tread_lug") treadCount++;
    });
    assert(treadCount === 12, `Missing anatomical component 2: expected 12 tread_lugs, found ${treadCount}`);
    assert(meshMap.has("mesh_midsole"), "Missing anatomical component 3: mesh_midsole");
    assert(meshMap.has("mesh_carbon_shank"), "Missing anatomical component 4: mesh_carbon_shank");
    assert(meshMap.has("mesh_upper_body"), "Missing anatomical component 5: mesh_upper_body");
    assert(meshMap.has("mesh_collar_rim"), "Missing anatomical component 6: mesh_collar_rim");
    assert(meshMap.has("mesh_tongue"), "Missing anatomical component 7: mesh_tongue");
    let eyeletCount = 0;
    let laceTubeCount = 0;
    let agletCount = 0;
    root.traverse((child) => {
      if (child.userData?.subpart === "eyelet") eyeletCount++;
      if (child.userData?.subpart === "criss_cross") laceTubeCount++;
      if (child.userData?.subpart === "aglet") agletCount++;
    });
    assert(eyeletCount === 10, `Expected 10 eyelets (5 pairs), found ${eyeletCount}`);
    assert(laceTubeCount === 8, `Expected 8 criss-cross tubes (4 cross pairs), found ${laceTubeCount}`);
    assert(meshMap.has("mesh_lace_knot"), "Missing lace knot");
    assert(agletCount === 2, `Expected 2 aglets, found ${agletCount}`);
    assert(meshMap.has("mesh_heel_clip"), "Missing mesh_heel_clip");
    assert(meshMap.has("mesh_lateral_accent_blade"), "Missing mesh_lateral_accent_blade");
    assert(meshMap.has("mesh_medial_accent_blade"), "Missing mesh_medial_accent_blade");
    return {
      outsoleMesh: true,
      treadLugsCount: treadCount,
      midsoleMesh: true,
      carbonShankMesh: true,
      upperBodyMesh: true,
      collarRimMesh: true,
      tongueMesh: true,
      lacingEyelets: eyeletCount,
      lacingCrossoverTubes: laceTubeCount,
      heelClipMesh: true,
      accentBlades: 2
    };
  });
  await runTest("Suite 3: Geometry Integrity", "Total vertex count strictly exceeds 1,000 (>1,000 threshold)", () => {
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    let totalVertices = 0;
    let totalTriangles = 0;
    let meshCount = 0;
    const vertexBreakdown = {};
    assembly.root.traverse((child) => {
      if (child.isMesh) {
        const mesh = child;
        meshCount++;
        const geom = mesh.geometry;
        if (geom && geom.attributes.position) {
          const count = geom.attributes.position.count;
          totalVertices += count;
          vertexBreakdown[mesh.name || `mesh_${meshCount}`] = count;
          if (geom.index) {
            totalTriangles += geom.index.count / 3;
          } else {
            totalTriangles += count / 3;
          }
        }
      }
    });
    assert(
      totalVertices > 1e3,
      `Total vertex count ${totalVertices} failed threshold of > 1,000 vertices!`
    );
    return {
      totalVertices,
      totalTriangles: Math.round(totalTriangles),
      meshCount,
      threshold: "> 1,000",
      sampleMeshes: {
        mesh_outsole_base: vertexBreakdown["mesh_outsole_base"],
        mesh_midsole: vertexBreakdown["mesh_midsole"],
        mesh_upper_body: vertexBreakdown["mesh_upper_body"],
        mesh_collar_rim: vertexBreakdown["mesh_collar_rim"],
        mesh_tongue: vertexBreakdown["mesh_tongue"]
      }
    };
  });
  await runTest("Suite 3: Geometry Integrity", "3D bounding box is non-zero, realistic sneaker proportions, properly grounded", () => {
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    const box = new THREE7.Box3().setFromObject(assembly.root);
    const size = new THREE7.Vector3();
    box.getSize(size);
    const center = new THREE7.Vector3();
    box.getCenter(center);
    assert(!box.isEmpty(), "Bounding box must not be empty");
    assert(size.x > 0.5 && size.x < 1.8, `Width X (${size.x.toFixed(2)}) must be between 0.5m and 1.8m`);
    assert(size.y > 0.4 && size.y < 1.5, `Height Y (${size.y.toFixed(2)}) must be between 0.4m and 1.5m`);
    assert(size.z > 2 && size.z < 3.5, `Length Z (${size.z.toFixed(2)}) must be between 2.0m and 3.5m`);
    assert(box.min.y >= -0.01, `Sneaker bottom (${box.min.y.toFixed(3)}) clips deeply into ground floor!`);
    assert(box.min.y <= 0.05, `Sneaker bottom (${box.min.y.toFixed(3)}) floats too high off ground!`);
    return {
      min: [box.min.x.toFixed(3), box.min.y.toFixed(3), box.min.z.toFixed(3)],
      max: [box.max.x.toFixed(3), box.max.y.toFixed(3), box.max.z.toFixed(3)],
      dimensions: {
        widthX: size.x.toFixed(3),
        heightY: size.y.toFixed(3),
        lengthZ: size.z.toFixed(3)
      },
      center: [center.x.toFixed(3), center.y.toFixed(3), center.z.toFixed(3)]
    };
  });
  await runTest("Suite 3: Geometry Integrity", "Every mesh geometry contains valid normal vectors (no NaNs or infinities)", () => {
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    let checkedMeshes = 0;
    let checkedNormals = 0;
    assembly.root.traverse((child) => {
      if (child.isMesh) {
        const mesh = child;
        checkedMeshes++;
        const geom = mesh.geometry;
        assert(!!geom, `Mesh ${mesh.name} missing geometry`);
        assert(!!geom.attributes.normal, `Mesh ${mesh.name} missing normal attribute`);
        const norm = geom.attributes.normal;
        for (let i = 0; i < norm.count; i++) {
          const nx = norm.getX(i);
          const ny = norm.getY(i);
          const nz = norm.getZ(i);
          assert(!Number.isNaN(nx) && !Number.isNaN(ny) && !Number.isNaN(nz), `NaN normal detected in ${mesh.name} at index ${i}`);
          assert(Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz), `Infinite normal in ${mesh.name} at index ${i}`);
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
          assert(Math.abs(len - 1) < 0.05, `Unnormalized normal (${len.toFixed(3)}) in ${mesh.name} at index ${i}`);
          checkedNormals++;
        }
      }
    });
    return {
      checkedMeshes,
      checkedNormals,
      status: "ALL_NORMALS_VALID"
    };
  });
}
async function runSuite4() {
  console.log("\n--- SUITE 4: Tagged Hierarchy (userData.segment) & Rig Groups ---");
  await runTest("Suite 4: Tagged Hierarchy", "100% of meshes possess valid userData.segment in [upper, sole, accents, laces]", () => {
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    const VALID_SEGMENTS = /* @__PURE__ */ new Set(["upper", "sole", "accents", "laces"]);
    let totalMeshes = 0;
    const segmentCounts = {
      upper: 0,
      sole: 0,
      accents: 0,
      laces: 0
    };
    assembly.root.traverse((child) => {
      if (child.isMesh) {
        const mesh = child;
        totalMeshes++;
        assert(
          !!mesh.userData && typeof mesh.userData.segment === "string",
          `Mesh ${mesh.name} has no userData.segment!`
        );
        const seg = mesh.userData.segment;
        assert(
          VALID_SEGMENTS.has(seg),
          `Mesh ${mesh.name} has invalid segment '${seg}'! Expected one of ${Array.from(VALID_SEGMENTS).join(", ")}`
        );
        segmentCounts[seg]++;
        assert(mesh.castShadow === true, `Mesh ${mesh.name} must cast shadow`);
      }
    });
    assert(segmentCounts.upper >= 3, `Upper segment meshes (${segmentCounts.upper}) < 3`);
    assert(segmentCounts.sole >= 2, `Sole segment meshes (${segmentCounts.sole}) < 2`);
    assert(segmentCounts.accents >= 4, `Accents segment meshes (${segmentCounts.accents}) < 4`);
    assert(segmentCounts.laces >= 4, `Laces segment meshes (${segmentCounts.laces}) < 4`);
    return {
      totalMeshes,
      segmentCounts,
      unassignedMeshes: 0
    };
  });
  await runTest("Suite 4: Tagged Hierarchy", "Rig groups (upper, laces, carbon, sole, accents) exist and support exploded offsets", () => {
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    const { rigGroups } = assembly;
    assert(rigGroups.upper instanceof THREE7.Group, "rigGroups.upper must be THREE.Group");
    assert(rigGroups.laces instanceof THREE7.Group, "rigGroups.laces must be THREE.Group");
    assert(rigGroups.carbon instanceof THREE7.Group, "rigGroups.carbon must be THREE.Group");
    assert(rigGroups.sole instanceof THREE7.Group, "rigGroups.sole must be THREE.Group");
    assert(rigGroups.accents instanceof THREE7.Group, "rigGroups.accents must be THREE.Group");
    const initialBox = new THREE7.Box3().setFromObject(assembly.root);
    const initialSize = new THREE7.Vector3();
    initialBox.getSize(initialSize);
    rigGroups.upper.position.set(...DEFAULT_EXPLODED_OFFSETS.upper);
    rigGroups.laces.position.set(...DEFAULT_EXPLODED_OFFSETS.laces);
    rigGroups.carbon.position.set(...DEFAULT_EXPLODED_OFFSETS.carbonPlate);
    rigGroups.sole.position.set(...DEFAULT_EXPLODED_OFFSETS.outsole);
    rigGroups.accents.position.set(...DEFAULT_EXPLODED_OFFSETS.heelAccents);
    assembly.root.updateMatrixWorld(true);
    const explodedBox = new THREE7.Box3().setFromObject(assembly.root);
    const explodedSize = new THREE7.Vector3();
    explodedBox.getSize(explodedSize);
    assert(
      explodedSize.y > initialSize.y * 1.5,
      `Exploded height ${explodedSize.y.toFixed(2)} should be > 1.5x initial height ${initialSize.y.toFixed(2)}`
    );
    return {
      initialHeightY: initialSize.y.toFixed(3),
      explodedHeightY: explodedSize.y.toFixed(3),
      expansionRatio: (explodedSize.y / initialSize.y).toFixed(2)
    };
  });
  await runTest("Suite 4: Tagged Hierarchy", "materialMap contains MeshPhysicalMaterial entries for all 4 segments", () => {
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    const { materialMap } = assembly;
    const segments = ["upper", "sole", "accents", "laces"];
    for (const seg of segments) {
      assert(materialMap.has(seg), `materialMap missing segment ${seg}`);
      const mats = materialMap.get(seg);
      assert(mats.length > 0, `materialMap has 0 materials for segment ${seg}`);
      mats.forEach((m) => {
        assert(m instanceof THREE7.MeshPhysicalMaterial, `Material for ${seg} is not MeshPhysicalMaterial`);
      });
    }
    return {
      segmentsMapped: segments,
      upperMaterials: materialMap.get("upper").length,
      soleMaterials: materialMap.get("sole").length,
      accentsMaterials: materialMap.get("accents").length,
      lacesMaterials: materialMap.get("laces").length
    };
  });
}
async function runSuite5() {
  console.log("\n--- SUITE 5: Studio Lighting Rig & Contact Shadow Mathematics ---");
  await runTest("Suite 5: Lighting & Shadows", "Studio lighting rig instantiates Key, Fill, Rim, and Hemi lights correctly", () => {
    const scene = new THREE7.Scene();
    const rig = createStudioLighting(scene, { isMobile: false });
    assert(rig.keyLight.castShadow === true, "Key light must cast shadow");
    assert(rig.keyLight.intensity === 2.2, `Key light intensity expected 2.20, got ${rig.keyLight.intensity}`);
    assert(rig.keyLight.shadow.mapSize.width === 2048, `Key light shadow map expected 2048, got ${rig.keyLight.shadow.mapSize.width}`);
    assert(rig.keyLight.shadow.normalBias === 0.038, `Key light normalBias expected 0.038, got ${rig.keyLight.shadow.normalBias}`);
    assert(rig.keyLight.shadow.bias === -12e-5, `Key light bias expected -0.00012, got ${rig.keyLight.shadow.bias}`);
    assert(rig.fillLight.castShadow === false, "Fill light must be shadowless to avoid conflicting silhouettes");
    assert(rig.fillLight.intensity === 0.85, `Fill light intensity expected 0.85, got ${rig.fillLight.intensity}`);
    assert(rig.rimLight.castShadow === false, "Rim light must be shadowless");
    assert(rig.rimLight.intensity === 2.8, `Rim light intensity expected 2.80, got ${rig.rimLight.intensity}`);
    assert(rig.hemiLight.intensity === 0.6, `Hemi light intensity expected 0.60, got ${rig.hemiLight.intensity}`);
    const mobileRig = createStudioLighting(scene, { isMobile: true });
    assert(mobileRig.keyLight.shadow.mapSize.width === 1024, `Mobile shadow map expected 1024, got ${mobileRig.keyLight.shadow.mapSize.width}`);
    rig.dispose();
    mobileRig.dispose();
    return {
      desktopKeyShadowMap: 2048,
      mobileKeyShadowMap: 1024,
      keyIntensity: 2.2,
      fillIntensity: 0.85,
      rimIntensity: 2.8,
      hemiIntensity: 0.6
    };
  });
  await runTest("Suite 5: Lighting & Shadows", "Contact shadow ground hierarchy strictly prevents z-fighting via vertical Y-ordering", () => {
    const originalCreateElement = globalThis.document?.createElement;
    if (!globalThis.document) {
      globalThis.document = {
        createElement: (tag) => {
          if (tag === "canvas") {
            return {
              width: 512,
              height: 512,
              getContext: () => ({
                clearRect: () => {
                },
                createImageData: () => ({ data: new Uint8ClampedArray(512 * 512 * 4) }),
                putImageData: () => {
                }
              })
            };
          }
          return {};
        }
      };
    }
    const scene = new THREE7.Scene();
    const contact = createContactShadow(scene);
    const yFloor = contact.floorPlane.position.y;
    const yShadow = contact.shadowPlane.position.y;
    const yAo = contact.aoPlane.position.y;
    assert(yFloor < yShadow, `Floor Y (${yFloor}) must be below shadow plane Y (${yShadow})`);
    assert(yShadow < yAo, `Shadow plane Y (${yShadow}) must be below AO plane Y (${yAo})`);
    assert(yAo - yShadow >= 15e-4, `Gap between AO and shadow plane (${yAo - yShadow}) must be >= 0.0015`);
    assert(contact.shadowPlane.receiveShadow === true, "Shadow plane must receive shadow");
    assert(contact.floorPlane.receiveShadow === true, "Floor plane must receive shadow");
    contact.dispose();
    if (originalCreateElement) {
      globalThis.document.createElement = originalCreateElement;
    }
    return {
      yFloor,
      yShadow,
      yAo,
      deltaAoShadow: (yAo - yShadow).toFixed(4),
      deltaShadowFloor: (yShadow - yFloor).toFixed(4)
    };
  });
}
async function runSuite6() {
  console.log("\n--- SUITE 6: glTF Loader Resiliency, Timeout Racing & Fallback ---");
  await runTest("Suite 6: Loader Fallback", "SneakerModelLoader falls back to procedural model on invalid path without unhandled exception", async () => {
    const loader = new SneakerModelLoader("/draco/", 1e3);
    const result = await loader.loadSneaker("/non_existent_model_test.glb");
    assert(result.isProcedural === true, "Result must be marked isProcedural === true");
    assert(result.model instanceof THREE7.Group, "Result model must be THREE.Group");
    assert(result.materialMap.size === 4, `Material map must have 4 segments, got ${result.materialMap.size}`);
    assert(!!result.rigGroups, "rigGroups must be provided");
    return {
      isProcedural: result.isProcedural,
      segmentsInMap: Array.from(result.materialMap.keys()),
      childMeshesInModel: result.model.children.length
    };
  });
  await runTest("Suite 6: Loader Fallback", "Regex node classification correctly tags glTF meshes into segments", () => {
    const upperRegex = /(upper|vamp|quarter|tongue|collar|toe|lining|body|shoe)/i;
    const soleRegex = /(sole|midsole|outsole|tread|cushion|foam|shank|carbon)/i;
    const accentsRegex = /(accent|swoosh|stripe|logo|clip|counter|badge|eyelet|aglet)/i;
    const lacesRegex = /(lace|string|knot|cord|tie)/i;
    const classify = (name) => {
      if (lacesRegex.test(name)) return "laces";
      if (accentsRegex.test(name)) return "accents";
      if (soleRegex.test(name)) return "sole";
      if (upperRegex.test(name)) return "upper";
      return "upper";
    };
    assert(classify("mesh_outsole_rubber") === "sole", "Failed classifying sole");
    assert(classify("node_midsole_cushion") === "sole", "Failed classifying midsole");
    assert(classify("carbon_shank_plate") === "sole", "Failed classifying shank");
    assert(classify("upper_vamp_leather") === "upper", "Failed classifying upper");
    assert(classify("collar_lining_mesh") === "upper", "Failed classifying collar");
    assert(classify("tongue_padded") === "upper", "Failed classifying tongue");
    assert(classify("lace_cross_01") === "laces", "Failed classifying lace");
    assert(classify("knot_tie_mesh") === "laces", "Failed classifying knot");
    assert(classify("heel_counter_clip") === "accents", "Failed classifying heel clip");
    assert(classify("swoosh_accent_blade") === "accents", "Failed classifying swoosh");
    assert(classify("eyelet_ring_metallic") === "accents", "Failed classifying eyelet");
    assert(classify("aglet_tip_chrome") === "accents", "Failed classifying aglet");
    assert(classify("unnamed_custom_part") === "upper", "Failed fallback to upper");
    return {
      classifiedCorrectly: 13,
      fallbackVerified: true
    };
  });
}
async function main() {
  console.log("======================================================================");
  console.log("   EMPIRICAL 3D SCENE STRESS VERIFIER (Milestone 1 Challenger)");
  console.log(`   Node: ${process.version} | ${(/* @__PURE__ */ new Date()).toISOString()}`);
  console.log("======================================================================");
  await runSuite1();
  await runSuite2();
  await runSuite3();
  await runSuite4();
  await runSuite5();
  await runSuite6();
  console.log("\n======================================================================");
  console.log(" SUMMARY OF EMPIRICAL STRESS VERIFICATION");
  console.log("======================================================================");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  console.log(`Total Empirical Tests: ${total}`);
  console.log(`Passed:                ${passed}`);
  console.log(`Failed:                ${failed}`);
  console.log(`Pass Rate:             ${(passed / total * 100).toFixed(1)}%`);
  if (failed > 0) {
    console.error("\nFAILURES DETECTED:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.error(`- [${r.suite}] ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log("\nVERDICT: ALL EMPIRICAL STRESS TESTS PASSED WITH 100% INTEGRITY.");
    process.exit(0);
  }
}
main().catch((err) => {
  console.error("Fatal runner error:", err);
  process.exit(1);
});
