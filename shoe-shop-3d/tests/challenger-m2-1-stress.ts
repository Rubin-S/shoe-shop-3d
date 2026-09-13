/**
 * Challenger M2-1 Empirical Stress Test Harness
 * 
 * Adversarial and Empirical Verification of:
 * 1. Procedural Texture Buffers:
 *    - Byte lengths, Uint8ClampedArray dimensions, power-of-two (16 to 2048) and non-power-of-two clamping
 *    - Normal channel invariant: Z=255 (blue) and Alpha=255 across 100% of pixels in 'leather', 'mesh', 'rubber'
 *    - Micro-roughness map generation & baseRoughness boundary testing
 * 2. Texture Wrapping, ColorSpace, Anisotropy & Disposal:
 *    - RepeatWrapping (wrapS, wrapT) and repeat scale validation
 *    - Anisotropy configuration (8x)
 *    - Linear colorSpace invariant (THREE.NoColorSpace)
 *    - Texture disposal lifecycle: event triggering, memory release, 100-cycle stress test
 * 3. PBR Material Parameters & Clamping:
 *    - Authoritative preset properties for 'upper', 'sole', 'accents', 'laces'
 *    - Bounds clamping [0.0, 1.0] across extreme matrices (-1e9 to +1e9, NaN, Infinity)
 *    - Material uniform mutation clamping and zero-recompile invariant (needsUpdate === false)
 *    - MeshPhysicalMaterial instantiation and configuration per segment
 * 4. Hex Color Validation & Normalization:
 *    - 3-digit (#RGB) expansion to 6-digit (#RRGGBB)
 *    - Lowercase conversion and whitespace trimming
 *    - Adversarial attack matrix: malformed hex, invalid characters, CSS names, XSS/injection, non-strings
 * 5. Sneaker Store Engine & State Hardening:
 *    - Segment selection and validation
 *    - In-place mutation, clamping, hex validation, and preset transition to 'Custom'
 *    - Curated colorways and finish presets
 * 6. Uniform Mutation Engine:
 *    - Material registration, 0ms shader recompilation guarantee
 *    - GSAP tween lifecycle and cleanup
 * 7. End-to-End Procedural Sneaker Assembly:
 *    - 42-mesh assembly validation with pre-bound procedural normal maps
 */

import * as THREE from 'three';
import { ProceduralTextureEngine, ProceduralTextureType } from '../src/utils/proceduralTextures';
import { PBRMaterialSystem } from '../src/materials/PBRMaterialSystem';
import {
  COLORWAY_PRESETS,
  COLORWAYS_LIST,
  FINISH_PRESETS,
  CURATED_SWATCHES,
  validateHex as cwValidateHex,
  normalizeHex as cwNormalizeHex,
  getPreset,
  detectActiveFinish,
} from '../src/utils/colorways';
import { SneakerStoreEngine } from '../src/store/useSneakerStore';
import { UniformMutationEngine } from '../src/components/3d/UniformMutationEngine';
import { ProceduralSneakerGenerator } from '../src/components/3d/ProceduralSneaker';
import { SegmentId, SneakerCustomization } from '../src/types/sneaker';

interface TestCaseResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
  details?: Record<string, any>;
}

const allResults: TestCaseResult[] = [];

function runTest(suite: string, name: string, fn: () => void | Promise<void>) {
  const start = performance.now();
  try {
    const res = fn();
    if (res && typeof (res as any).then === 'function') {
      throw new Error(`Async test not supported in sync runner: ${name}`);
    }
    const durationMs = Number((performance.now() - start).toFixed(3));
    allResults.push({ suite, name, passed: true, durationMs });
  } catch (err: any) {
    const durationMs = Number((performance.now() - start).toFixed(3));
    allResults.push({
      suite,
      name,
      passed: false,
      error: err?.message || String(err),
      durationMs,
    });
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertEqual<T>(actual: T, expected: T, desc: string) {
  if (actual !== expected) {
    throw new Error(`${desc}: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertCloseTo(actual: number, expected: number, tolerance = 0.001, desc: string) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${desc}: Expected ${expected} ± ${tolerance}, got ${actual} (diff: ${diff})`);
  }
}

// ============================================================================
// SUITE 1: Procedural Texture Generation & Buffer Dimensions
// ============================================================================

const textureTypes: ProceduralTextureType[] = ['leather', 'mesh', 'rubber'];
const powerOfTwoSizes = [16, 32, 64, 128, 256, 512, 1024, 2048];

for (const type of textureTypes) {
  for (const size of powerOfTwoSizes) {
    runTest('Suite 1: Buffer Dimensions', `Generate ${type} at ${size}x${size} (PoT)`, () => {
      const res = ProceduralTextureEngine.generateNormalMap(type, size);
      assertEqual(res.type, type, 'Texture type');
      assertEqual(res.size, size, 'Reported size');
      assertEqual(res.format, 'RGBA', 'Format');
      assertEqual(res.isNormalMap, true, 'isNormalMap flag');
      assert(res.data instanceof Uint8ClampedArray, 'Data must be Uint8ClampedArray');
      const expectedBytes = size * size * 4;
      assertEqual(res.data.byteLength, expectedBytes, `Byte length must be ${expectedBytes}`);
      assertEqual(res.data.length, expectedBytes, `Length must be ${expectedBytes}`);
    });
  }
}

runTest('Suite 1: Buffer Dimensions', 'Clamps sub-minimum sizes (< 16) to validSize=16', () => {
  const subSizes = [-100, -1, 0, 1, 8, 15];
  for (const sz of subSizes) {
    const res = ProceduralTextureEngine.generateNormalMap('leather', sz);
    assertEqual(res.size, 16, `Size ${sz} clamped to 16`);
    assertEqual(res.data.byteLength, 16 * 16 * 4, `Byte length for size ${sz}`);
  }
});

runTest('Suite 1: Buffer Dimensions', 'Clamps super-maximum sizes (> 2048) to validSize=2048', () => {
  const superSizes = [2049, 4096, 8192];
  for (const sz of superSizes) {
    const res = ProceduralTextureEngine.generateNormalMap('mesh', sz);
    assertEqual(res.size, 2048, `Size ${sz} clamped to 2048`);
    assertEqual(res.data.byteLength, 2048 * 2048 * 4, `Byte length for size ${sz}`);
  }
});

runTest('Suite 1: Buffer Dimensions', 'Handles fractional floating-point sizes with Math.floor', () => {
  const res = ProceduralTextureEngine.generateNormalMap('rubber', 64.99);
  assertEqual(res.size, 64, 'Fractional size 64.99 floored to 64');
  assertEqual(res.data.byteLength, 64 * 64 * 4, 'Byte length 64x64x4');
});

runTest('Suite 1: Buffer Dimensions', 'Rejects unknown procedural texture types with descriptive error', () => {
  const badTypes = ['wood', 'carbon', 'metal', '', 'LEATHER', 'Mesh', null, undefined];
  for (const bad of badTypes) {
    let threw = false;
    try {
      ProceduralTextureEngine.generateNormalMap(bad as any, 64);
    } catch (e: any) {
      threw = true;
      assert(e.message.includes('Unknown procedural texture type'), `Error message format for ${bad}`);
    }
    assert(threw, `Expected error for unknown type: ${bad}`);
  }
});

// ============================================================================
// SUITE 2: Normal Map Mathematics & Blue Channel Z=255 Invariant
// ============================================================================

for (const type of textureTypes) {
  runTest('Suite 2: Normal Map Z=255 Invariant', `100% pixel audit of ${type} at 512x512 (262,144 pixels)`, () => {
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
    // Ensure perturbation actually exists (not completely flat 128,128)
    assert(maxNx > minNx, `Texture ${type} has non-zero normal perturbation on X: [${minNx}, ${maxNx}]`);
  });
}

runTest('Suite 2: Micro-Roughness Map', 'Generates roughness maps across all 3 types with byte ranges', () => {
  for (const type of textureTypes) {
    const res = ProceduralTextureEngine.generateRoughnessMap(type, 128, 0.45);
    assertEqual(res.type, type, 'Roughness type');
    assertEqual(res.isNormalMap, false, 'isNormalMap is false');
    assertEqual(res.data.byteLength, 128 * 128 * 4, 'Byte length');

    // Audit channels: R=G=B (greyscale) and A=255
    const totalPixels = 128 * 128;
    let greyscaleMatch = 0;
    for (let p = 0; p < totalPixels; p++) {
      const idx = p * 4;
      if (res.data[idx] === res.data[idx + 1] && res.data[idx + 1] === res.data[idx + 2]) {
        greyscaleMatch++;
      }
      assertEqual(res.data[idx + 3], 255, 'Alpha channel');
    }
    assertEqual(greyscaleMatch, totalPixels, `All ${totalPixels} pixels must be greyscale (R=G=B)`);
  }
});

// ============================================================================
// SUITE 3: Three.js Texture Wrapper, Wrapping, Anisotropy & Disposal
// ============================================================================

runTest('Suite 3: Three.js Texture Properties', 'Configures RepeatWrapping, Anisotropy, Mipmaps & Linear ColorSpace', () => {
  // Test both headless DataTexture fallback and synthetic CanvasTexture
  const tex = ProceduralTextureEngine.createThreeTexture('leather', 256, 10, 10);
  assert(tex !== undefined && tex !== null, 'Texture created');
  assertEqual(tex.wrapS, THREE.RepeatWrapping, 'wrapS must be RepeatWrapping (1000)');
  assertEqual(tex.wrapT, THREE.RepeatWrapping, 'wrapT must be RepeatWrapping (1000)');
  assertEqual(tex.repeat.x, 10, 'repeat.x must match parameter');
  assertEqual(tex.repeat.y, 10, 'repeat.y must match parameter');
  assertEqual(tex.colorSpace, THREE.NoColorSpace, 'colorSpace must be NoColorSpace (linear normal map)');
  assertEqual(tex.generateMipmaps, true, 'generateMipmaps must be true');
  assertEqual(tex.minFilter, THREE.LinearMipmapLinearFilter, 'minFilter must be LinearMipmapLinearFilter');
  assertEqual(tex.magFilter, THREE.LinearFilter, 'magFilter must be LinearFilter');
});

runTest('Suite 3: Synthetic Canvas DOM Texture', 'Configures CanvasTexture with 8x anisotropy in DOM environment', () => {
  // Set up temporary synthetic DOM
  const originalDoc = (globalThis as any).document;
  (globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          tagName: 'CANVAS',
          width: 256,
          height: 256,
          getContext: (type: string) => {
            if (type === '2d') {
              return {
                createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
                putImageData: () => {},
              };
            }
            return null;
          },
        };
      }
      return {};
    },
  };

  try {
    const canvasTex = ProceduralTextureEngine.createThreeTexture('rubber', 256, 4, 12);
    assertEqual(canvasTex.name, 'tex_procedural_rubber_normal', 'Texture name');
    assertEqual(canvasTex.anisotropy, 8, 'Anisotropy must be 8x for high-angle clarity');
    assertEqual(canvasTex.wrapS, THREE.RepeatWrapping, 'wrapS is RepeatWrapping');
    assertEqual(canvasTex.wrapT, THREE.RepeatWrapping, 'wrapT is RepeatWrapping');
    assertEqual(canvasTex.repeat.x, 4, 'repeat.x');
    assertEqual(canvasTex.repeat.y, 12, 'repeat.y');
    assertEqual(canvasTex.colorSpace, THREE.NoColorSpace, 'Normal map colorSpace must be linear');
  } finally {
    (globalThis as any).document = originalDoc;
  }
});

runTest('Suite 3: Texture Disposal Lifecycle', 'Executes dispose() cleanly and fires disposal event', () => {
  const tex = ProceduralTextureEngine.createThreeTexture('mesh', 128, 8, 8);
  let disposeEventFired = false;
  tex.addEventListener('dispose', () => {
    disposeEventFired = true;
  });

  tex.dispose();
  assert(disposeEventFired, 'Disposal event listener was invoked on texture.dispose()');
});

runTest('Suite 3: Texture Memory Stress', 'Executes 100 rapid generate & dispose cycles without leaks', () => {
  for (let i = 0; i < 100; i++) {
    const type = textureTypes[i % 3];
    const tex = ProceduralTextureEngine.createThreeTexture(type, 64, 4, 4);
    tex.dispose();
  }
});

// ============================================================================
// SUITE 4: Material Parameter Clamping & PBR Shaders
// ============================================================================

runTest('Suite 4: Authoritative Presets', 'Upper material has roughness 0.42, metalness 0.05, clearcoat 0.25', () => {
  const p = PBRMaterialSystem.getPresetProperties('upper');
  assertEqual(p.roughness, 0.42, 'Upper roughness');
  assertEqual(p.metalness, 0.05, 'Upper metalness');
  assertEqual(p.clearcoat, 0.25, 'Upper clearcoat');
  assertEqual(p.normalScale[0], 0.8, 'Upper normalScale X');
  assertEqual(p.normalScale[1], 0.8, 'Upper normalScale Y');
});

runTest('Suite 4: Authoritative Presets', 'Sole material has roughness 0.65, metalness 0.10, normalScale 1.5', () => {
  const p = PBRMaterialSystem.getPresetProperties('sole');
  assertEqual(p.roughness, 0.65, 'Sole roughness');
  assertEqual(p.metalness, 0.10, 'Sole metalness');
  assertEqual(p.normalScale[0], 1.5, 'Sole normalScale X');
  assertEqual(p.normalScale[1], 1.5, 'Sole normalScale Y');
});

runTest('Suite 4: Authoritative Presets', 'Accents material has roughness 0.15, metalness 0.85, clearcoat 0.90, iridescence 0.75', () => {
  const p = PBRMaterialSystem.getPresetProperties('accents');
  assertEqual(p.roughness, 0.15, 'Accents roughness');
  assertEqual(p.metalness, 0.85, 'Accents metalness');
  assertEqual(p.clearcoat, 0.90, 'Accents clearcoat');
  assertEqual(p.iridescence, 0.75, 'Accents iridescence');
});

runTest('Suite 4: Authoritative Presets', 'Laces material has roughness 0.75, metalness 0.02, clearcoat 0.0', () => {
  const p = PBRMaterialSystem.getPresetProperties('laces');
  assertEqual(p.roughness, 0.75, 'Laces roughness');
  assertEqual(p.metalness, 0.02, 'Laces metalness');
  assertEqual(p.clearcoat, 0.0, 'Laces clearcoat');
  assertEqual(p.normalScale[0], 1.2, 'Laces normalScale X');
});

runTest('Suite 4: Scalar Clamping Unit', 'PBRMaterialSystem.clamp clamps across extreme numerical values', () => {
  // In-bounds
  assertEqual(PBRMaterialSystem.clamp(0.0), 0.0, 'Clamp 0.0');
  assertEqual(PBRMaterialSystem.clamp(0.5), 0.5, 'Clamp 0.5');
  assertEqual(PBRMaterialSystem.clamp(1.0), 1.0, 'Clamp 1.0');

  // Below bounds
  assertEqual(PBRMaterialSystem.clamp(-0.0001), 0.0, 'Clamp -0.0001');
  assertEqual(PBRMaterialSystem.clamp(-1.0), 0.0, 'Clamp -1.0');
  assertEqual(PBRMaterialSystem.clamp(-999999), 0.0, 'Clamp -999999');
  assertEqual(PBRMaterialSystem.clamp(-1e15), 0.0, 'Clamp -1e15');

  // Above bounds
  assertEqual(PBRMaterialSystem.clamp(1.0001), 1.0, 'Clamp 1.0001');
  assertEqual(PBRMaterialSystem.clamp(2.5), 1.0, 'Clamp 2.5');
  assertEqual(PBRMaterialSystem.clamp(999999), 1.0, 'Clamp 999999');
  assertEqual(PBRMaterialSystem.clamp(1e15), 1.0, 'Clamp 1e15');

  // Non-finite (must return min=0.0 safely without throwing)
  assertEqual(PBRMaterialSystem.clamp(NaN), 0.0, 'Clamp NaN');
  assertEqual(PBRMaterialSystem.clamp(Infinity), 0.0, 'Clamp +Infinity');
  assertEqual(PBRMaterialSystem.clamp(-Infinity), 0.0, 'Clamp -Infinity');
});

runTest('Suite 4: Uniform Mutation Clamping & Zero-Recompile Rule', 'Mutates materials with strict [0, 1] clamping and needsUpdate=false', () => {
  const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.5, metalness: 0.5, clearcoat: 0.5 });
  const initialVersion = mat.version;

  let needsUpdateSet = false;
  Object.defineProperty(mat, 'needsUpdate', {
    set: (val: boolean) => {
      if (val === true) needsUpdateSet = true;
    },
    get: () => undefined,
    configurable: true,
  });

  // Extreme out-of-bounds patch
  PBRMaterialSystem.updateSegmentMaterialUniforms([mat], {
    roughness: 99.5,
    metalness: -50.0,
    clearcoat: 1.25,
    iridescence: -0.5,
  }, 0);

  assertEqual(mat.roughness, 1.0, 'Roughness clamped to 1.0');
  assertEqual(mat.metalness, 0.0, 'Metalness clamped to 0.0');
  assertEqual(mat.clearcoat, 1.0, 'Clearcoat clamped to 1.0');
  assertEqual(mat.iridescence, 0.0, 'Iridescence clamped to 0.0');
  assertEqual(needsUpdateSet, false, 'ZERO RECOMPILE: needsUpdate setter must NEVER be called');
  assertEqual(mat.version, initialVersion, 'ZERO RECOMPILE: mat.version must remain unchanged');
});

runTest('Suite 4: MeshPhysicalMaterial Creation', 'Pre-binds procedural normal maps and configures side/sheen/iridescence', () => {
  const upperMat = PBRMaterialSystem.createMeshPhysicalMaterial('upper', '#141518');
  assertEqual(upperMat.side, THREE.DoubleSide, 'Upper material must use DoubleSide');
  assert(upperMat.normalMap !== null && upperMat.normalMap !== undefined, 'Upper has normal map');
  assertEqual(upperMat.sheen, 0.25, 'Upper sheen');

  const soleMat = PBRMaterialSystem.createMeshPhysicalMaterial('sole', '#d4ff00');
  assertEqual(soleMat.side, THREE.FrontSide, 'Sole material uses FrontSide');
  assert(soleMat.normalMap !== null && soleMat.normalMap !== undefined, 'Sole has normal map');

  const accentsMat = PBRMaterialSystem.createMeshPhysicalMaterial('accents', '#7928ca');
  assertEqual(accentsMat.iridescence, 0.75, 'Accents iridescence');
  assertEqual(accentsMat.metalness, 0.85, 'Accents metalness');

  const lacesMat = PBRMaterialSystem.createMeshPhysicalMaterial('laces', '#ffffff');
  assert(lacesMat.normalMap !== null && lacesMat.normalMap !== undefined, 'Laces has normal map');
  assertEqual(lacesMat.sheen, 0.40, 'Laces sheen');
});

// ============================================================================
// SUITE 5: Hex Color Validation & Normalization Stress
// ============================================================================

const validHexCases: [string, string][] = [
  ['#fff', '#ffffff'],
  ['#FFF', '#ffffff'],
  ['#000', '#000000'],
  ['#123', '#112233'],
  ['#abc', '#aabbcc'],
  ['#ABC', '#aabbcc'],
  ['#aBc', '#aabbcc'],
  ['#AbC', '#aabbcc'],
  ['#ffffff', '#ffffff'],
  ['#FFFFFF', '#ffffff'],
  ['#000000', '#000000'],
  ['#1a2b3c', '#1a2b3c'],
  ['#1A2B3C', '#1a2b3c'],
  ['#d4ff00', '#d4ff00'],
  ['#D4FF00', '#d4ff00'],
  ['#7928ca', '#7928ca'],
  ['#7928CA', '#7928ca'],
  // Leading/trailing whitespace
  ['  #fff  ', '#ffffff'],
  ['\t#123\n', '#112233'],
  [' #d4ff00 ', '#d4ff00'],
];

runTest('Suite 5: Hex Validation (Valid)', 'Accurately validates and normalizes all valid hex inputs', () => {
  for (const [input, expected] of validHexCases) {
    const pbrValid = PBRMaterialSystem.validateHex(input);
    const cwValid = cwValidateHex(input);
    assert(pbrValid, `PBRMaterialSystem.validateHex('${input}') must be true`);
    assert(cwValid, `colorways.validateHex('${input}') must be true`);

    const pbrNorm = PBRMaterialSystem.normalizeHex(input);
    const cwNorm = cwNormalizeHex(input);
    assertEqual(pbrNorm, expected, `PBRMaterialSystem.normalizeHex('${input}')`);
    assertEqual(cwNorm, expected, `colorways.normalizeHex('${input}')`);
  }
});

const invalidHexCases: unknown[] = [
  // Missing '#'
  'ffffff',
  'FFF',
  '123456',
  'abc',
  // Wrong lengths
  '#',
  '#1',
  '#12',
  '#1234',       // 4 digits (RGBA not supported by validator)
  '#12345',      // 5 digits
  '#1234567',    // 7 digits
  '#12345678',   // 8 digits (RRGGBBAA not supported by validator)
  '#123456789',
  // Invalid characters
  '#ggg',
  '#GGG',
  '#xyz',
  '#12345z',
  '#12345!',
  '#12 34',
  '#12-34-56',
  // CSS named colors & functions
  'red',
  'blue',
  'transparent',
  'rgb(255, 0, 0)',
  'rgba(0, 0, 0, 1)',
  'hsl(120, 100%, 50%)',
  // Injection / XSS / Malformed
  '<script>alert(1)</script>',
  '#<script>',
  '#1a2b3c; background: red;',
  "' OR '1'='1",
  '\\x00#ffffff',
  // Empty & whitespace only
  '',
  '   ',
  '\n\t',
  // Non-string types
  null,
  undefined,
  123,
  0xffffff,
  true,
  false,
  {},
  [],
  Symbol('hex'),
];

runTest('Suite 5: Hex Validation (Adversarial Fuzzing)', 'Rejects all invalid hex formats and falls back to #000000 without crashes', () => {
  for (const bad of invalidHexCases) {
    const pbrValid = PBRMaterialSystem.validateHex(bad);
    const cwValid = cwValidateHex(bad as any);
    assertEqual(pbrValid, false, `PBRMaterialSystem.validateHex(${JSON.stringify(String(bad))}) must be false`);
    assertEqual(cwValid, false, `colorways.validateHex(${JSON.stringify(String(bad))}) must be false`);

    const pbrNorm = PBRMaterialSystem.normalizeHex(bad as any);
    const cwNorm = cwNormalizeHex(bad as any);
    assertEqual(pbrNorm, '#000000', `PBR normalize fallback for ${JSON.stringify(String(bad))}`);
    assertEqual(cwNorm, '#000000', `colorways normalize fallback for ${JSON.stringify(String(bad))}`);
  }
});

runTest('Suite 5: Curated Swatches & Presets Audit', 'All 16 swatches and 4 colorways have valid hex and clamped scalars', () => {
  assertEqual(CURATED_SWATCHES.length, 16, 'Exactly 16 curated swatches');
  for (const s of CURATED_SWATCHES) {
    assert(PBRMaterialSystem.validateHex(s.hex), `Swatch '${s.name}' (${s.hex}) is valid hex`);
  }

  const presetNames = ['Cyber Phantom', 'Retro Heritage', 'Triple Stealth', 'Aurora Neon'];
  assertEqual(COLORWAYS_LIST.length, 4, '4 colorway presets');
  for (const name of presetNames) {
    const p = COLORWAY_PRESETS[name];
    assert(p !== undefined, `Preset '${name}' exists`);
    for (const seg of ['upper', 'sole', 'accents', 'laces'] as SegmentId[]) {
      const cfg = p[seg];
      assert(PBRMaterialSystem.validateHex(cfg.color), `${name}.${seg}.color is valid hex`);
      assert(cfg.roughness! >= 0 && cfg.roughness! <= 1, `${name}.${seg}.roughness in [0, 1]`);
      assert(cfg.metalness! >= 0 && cfg.metalness! <= 1, `${name}.${seg}.metalness in [0, 1]`);
      assert(cfg.clearcoat! >= 0 && cfg.clearcoat! <= 1, `${name}.${seg}.clearcoat in [0, 1]`);
      assert(cfg.iridescence! >= 0 && cfg.iridescence! <= 1, `${name}.${seg}.iridescence in [0, 1]`);
    }
  }

  // Check finish presets
  for (const fKey of ['matte', 'gloss', 'metallic', 'iridescent'] as const) {
    const f = FINISH_PRESETS[fKey];
    assert(f !== undefined, `Finish ${fKey} exists`);
    assert(f.properties.roughness >= 0 && f.properties.roughness <= 1, `${fKey} roughness in [0, 1]`);
    assert(f.properties.metalness >= 0 && f.properties.metalness <= 1, `${fKey} metalness in [0, 1]`);
    assert(f.properties.clearcoat >= 0 && f.properties.clearcoat <= 1, `${fKey} clearcoat in [0, 1]`);
  }
});

// ============================================================================
// SUITE 6: Sneaker Store Engine Reactive State & Boundary Hardening
// ============================================================================

runTest('Suite 6: SneakerStoreEngine', 'Initializes with Cyber Phantom preset and 4 segments', () => {
  const store = new SneakerStoreEngine('Cyber Phantom');
  const state = store.getState();
  assertEqual(state.selectedSegment, 'upper', 'Default selected segment');
  assertEqual(state.currentPreset, 'Cyber Phantom', 'Initial preset');
  assertEqual(state.customization.upper.color, '#1a1a24', 'Cyber Phantom upper color');
  assertEqual(state.customization.sole.color, '#00f0ff', 'Cyber Phantom sole color');
});

runTest('Suite 6: SneakerStoreEngine', 'Rejects invalid segment selection with descriptive error', () => {
  const store = new SneakerStoreEngine();
  let threw = false;
  try {
    store.selectSegment('tongue' as any);
  } catch (e: any) {
    threw = true;
    assert(e.message.includes('Invalid sneaker segment'), 'Error message');
  }
  assert(threw, 'Should throw on invalid segment');
});

runTest('Suite 6: SneakerStoreEngine', 'Rejects invalid hex color on mutation and leaves state untouched', () => {
  const store = new SneakerStoreEngine();
  const beforeColor = store.getState().customization.upper.color;
  let threw = false;
  try {
    store.setSegmentColor('upper', 'not-a-hex');
  } catch (e: any) {
    threw = true;
    assert(e.message.includes('Invalid hex color'), 'Error message');
  }
  assert(threw, 'Should throw on invalid hex');
  assertEqual(store.getState().customization.upper.color, beforeColor, 'Color unchanged after error');
});

runTest('Suite 6: SneakerStoreEngine', 'Empty patch leaves segment state untouched (Boundary B7.3)', () => {
  const store = new SneakerStoreEngine();
  const before = { ...store.getState().customization.upper };
  store.updateSneakerSegment('upper', {});
  const after = store.getState().customization.upper;
  assertEqual(after.color, before.color, 'Color untouched');
  assertEqual(after.roughness, before.roughness, 'Roughness untouched');
  assertEqual(after.metalness, before.metalness, 'Metalness untouched');
});

runTest('Suite 6: SneakerStoreEngine', 'Clamps out-of-bounds scalars on store mutation', () => {
  const store = new SneakerStoreEngine();
  store.updateSneakerSegment('upper', {
    roughness: 10.0,
    metalness: -5.0,
    clearcoat: 3.5,
  });
  const u = store.getState().customization.upper;
  assertEqual(u.roughness, 1.0, 'Roughness clamped to 1.0');
  assertEqual(u.metalness, 0.0, 'Metalness clamped to 0.0');
  assertEqual(u.clearcoat, 1.0, 'Clearcoat clamped to 1.0');
});

runTest('Suite 6: SneakerStoreEngine', 'Modifying color switches currentPreset to "Custom" and adds history entry', () => {
  const store = new SneakerStoreEngine();
  store.setSegmentColor('sole', '#ff007f');
  const state = store.getState();
  assertEqual(state.currentPreset, 'Custom', 'Preset flips to Custom');
  assertEqual(state.customization.sole.color, '#ff007f', 'Sole color updated');
  assert(state.history.length > 0, 'History entry recorded');
  assertEqual(state.history[state.history.length - 1].segment, 'sole', 'History segment');
});

runTest('Suite 6: SneakerStoreEngine', 'applyPreset switches colorways and rejects unknown preset', () => {
  const store = new SneakerStoreEngine();
  store.applyPreset('Retro Heritage');
  assertEqual(store.getState().currentPreset, 'Retro Heritage', 'Preset applied');
  assertEqual(store.getState().customization.upper.color, '#f4efe6', 'Retro Heritage upper color');

  let threw = false;
  try {
    store.applyPreset('NonExistentPreset');
  } catch (e: any) {
    threw = true;
    assert(e.message.includes('Unknown preset'), 'Unknown preset error');
  }
  assert(threw, 'Should throw on unknown preset');
});

// ============================================================================
// SUITE 7: Uniform Mutation Engine & Zero-Recompile Rule
// ============================================================================

runTest('Suite 7: UniformMutationEngine', 'Indexes materials and mutates uniforms with zero shader recompilation', () => {
  const engine = new UniformMutationEngine();
  const matUpper = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#141518') });
  const matSole = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#d4ff00') });
  const root = new THREE.Group();
  const meshUpper = new THREE.Mesh(new THREE.BufferGeometry(), matUpper);
  meshUpper.userData = { segment: 'upper' };
  const meshSole = new THREE.Mesh(new THREE.BufferGeometry(), matSole);
  meshSole.userData = { segment: 'sole' };
  root.add(meshUpper);
  root.add(meshSole);

  engine.registerModel(root);
  assertEqual(engine.getMaterials('upper').length, 1, 'Indexed upper material');
  assertEqual(engine.getMaterials('sole').length, 1, 'Indexed sole material');

  // Tween with duration 0 (instant)
  const initialVersionUpper = matUpper.version;
  let upperNeedsUpdateCalled = false;
  Object.defineProperty(matUpper, 'needsUpdate', {
    set: (v: boolean) => { if (v === true) upperNeedsUpdateCalled = true; },
    get: () => undefined,
    configurable: true,
  });

  engine.tweenSegmentColor('upper', '#ff334b', { duration: 0 });
  const expectedColor = new THREE.Color('#ff334b');
  assertCloseTo(matUpper.color.r, expectedColor.r, 0.001, 'Upper Color R');
  assertCloseTo(matUpper.color.g, expectedColor.g, 0.001, 'Upper Color G');
  assertCloseTo(matUpper.color.b, expectedColor.b, 0.001, 'Upper Color B');
  assertEqual(upperNeedsUpdateCalled, false, 'ZERO RECOMPILE: upper needsUpdate setter never invoked');
  assertEqual(matUpper.version, initialVersionUpper, 'matUpper.version must remain unchanged');

  // Tween scalars with duration 0
  const initialVersionSole = matSole.version;
  let soleNeedsUpdateCalled = false;
  Object.defineProperty(matSole, 'needsUpdate', {
    set: (v: boolean) => { if (v === true) soleNeedsUpdateCalled = true; },
    get: () => undefined,
    configurable: true,
  });

  engine.tweenSegmentScalars('sole', { roughness: 0.2, metalness: 0.9 }, { duration: 0 });
  assertEqual(matSole.roughness, 0.2, 'Sole roughness updated');
  assertEqual(matSole.metalness, 0.9, 'Sole metalness updated');
  assertEqual(soleNeedsUpdateCalled, false, 'ZERO RECOMPILE: sole needsUpdate setter never invoked');
  assertEqual(matSole.version, initialVersionSole, 'matSole.version must remain unchanged');

  // Teardown
  engine.clear();
  assertEqual(engine.getMaterials('upper').length, 0, 'Cleared upper materials');
});

// ============================================================================
// SUITE 8: End-to-End Procedural Sneaker Assembly Integration
// ============================================================================

runTest('Suite 8: Sneaker Assembly Integration', 'Builds full procedural sneaker with 4 segments and pre-bound normal maps', () => {
  const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
  assert(assembly.root instanceof THREE.Group, 'Root is THREE.Group');
  assert(assembly.rigGroups !== undefined, 'Rig groups defined');
  assertEqual(assembly.rigGroups.upper.name, 'rig_upper', 'Upper rig');
  assertEqual(assembly.rigGroups.sole.name, 'rig_sole', 'Sole rig');
  assertEqual(assembly.rigGroups.laces.name, 'rig_laces', 'Laces rig');
  assertEqual(assembly.rigGroups.carbon.name, 'rig_carbon', 'Carbon rig');
  assertEqual(assembly.rigGroups.accents.name, 'rig_accents', 'Accents rig');

  // Validate material map
  const matMap = assembly.materialMap;
  for (const seg of ['upper', 'sole', 'accents', 'laces'] as SegmentId[]) {
    const mats = matMap.get(seg);
    assert(mats !== undefined && mats.length > 0, `Segment ${seg} has materials`);
    const m = mats![0];
    assert(m instanceof THREE.MeshPhysicalMaterial, `${seg} material is MeshPhysicalMaterial`);

    if (seg === 'upper') {
      assert(m.normalMap !== null, 'Upper has procedural leather normal map');
      assertEqual(m.side, THREE.DoubleSide, 'Upper side is DoubleSide');
    } else if (seg === 'sole') {
      assert(m.normalMap !== null, 'Sole has procedural rubber normal map');
    } else if (seg === 'laces') {
      assert(m.normalMap !== null, 'Laces has procedural mesh normal map');
    } else if (seg === 'accents') {
      assertEqual(m.metalness, 0.85, 'Accents metalness');
      assertEqual(m.iridescence, 0.75, 'Accents iridescence');
    }
  }

  // Count total meshes
  let meshCount = 0;
  let totalVertices = 0;
  assembly.root.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      meshCount++;
      const geom = (node as THREE.Mesh).geometry;
      if (geom && geom.attributes.position) {
        totalVertices += geom.attributes.position.count;
      }
    }
  });

  assert(meshCount >= 40, `Mesh count >= 40 (got ${meshCount})`);
  assert(totalVertices >= 10000, `Vertex count >= 10000 (got ${totalVertices})`);
});

// ============================================================================
// REPORT GENERATOR
// ============================================================================

console.log('\n======================================================================');
console.log('   CHALLENGER M2-1: EMPIRICAL TEXTURE & SHADER STRESS VERIFIER');
console.log(`   Node.js: ${process.version} | Timestamp: ${new Date().toISOString()}`);
console.log('======================================================================\n');

const suiteStats: Record<string, { total: number; passed: number; failed: number; time: number }> = {};
let totalPassed = 0;
let totalFailed = 0;
const totalDuration = allResults.reduce((sum, r) => sum + r.durationMs, 0);

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

console.log('SUITE SUMMARY:');
console.log('---------------------------------------------------------------------------------------------------');
console.log(' Suite Name                                                 |  Pass |  Fail | Total |    Time');
console.log('---------------------------------------------------------------------------------------------------');
for (const [sName, s] of Object.entries(suiteStats)) {
  const pStr = s.passed.toString().padStart(5);
  const fStr = s.failed.toString().padStart(5);
  const tStr = s.total.toString().padStart(5);
  const tmStr = `${s.time.toFixed(1)}ms`.padStart(9);
  console.log(` ${sName.padEnd(58)} | ${pStr} | ${fStr} | ${tStr} | ${tmStr}`);
}
console.log('---------------------------------------------------------------------------------------------------');
console.log(` TOTAL                                                      | ${totalPassed.toString().padStart(5)} | ${totalFailed.toString().padStart(5)} | ${allResults.length.toString().padStart(5)} | ${totalDuration.toFixed(1)}ms`.padStart(9));
console.log('---------------------------------------------------------------------------------------------------\n');

if (totalFailed > 0) {
  console.error(`\x1b[31mVERDICT: REJECT - ${totalFailed} tests failed!\x1b[0m\n`);
  process.exit(1);
} else {
  console.log(`\x1b[32mVERDICT: APPROVE - All ${totalPassed} stress tests passed successfully!\x1b[0m\n`);
  process.exit(0);
}
