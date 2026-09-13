/**
 * Challenger M2 Independent Verification Suite
 * Directly imports and stress-tests source files from src/
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { SneakerStoreEngine, useSneakerStore, sneakerStoreEngine } from '../src/store/useSneakerStore';
import { UniformMutationEngine, uniformMutationEngine } from '../src/components/3d/UniformMutationEngine';
import {
  COLORWAY_PRESETS,
  COLORWAYS_LIST,
  FINISH_PRESETS,
  CURATED_SWATCHES,
  validateHex,
  normalizeHex,
  getPreset,
  detectActiveFinish,
  FinishType,
} from '../src/utils/colorways';
import { PBRMaterialSystem } from '../src/materials/PBRMaterialSystem';
import { ProceduralSneakerGenerator } from '../src/components/3d/ProceduralSneaker';
import { SegmentId } from '../src/types/sneaker';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { CustomizerHUD } from '../src/components/ui/CustomizerHUD';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertEqual<T>(actual: T, expected: T, msg: string) {
  if (actual !== expected) {
    throw new Error(msg + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}

function runTest(name: string, fn: () => void | Promise<void>) {
  const start = performance.now();
  try {
    const res = fn();
    if (res instanceof Promise) {
      throw new Error('Test ' + name + ' returned a promise; use runAsyncTest');
    }
    results.push({ name, passed: true, durationMs: performance.now() - start });
    console.log('  ✓ ' + name);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message, durationMs: performance.now() - start });
    console.error('  ✗ ' + name + ': ' + err.message);
  }
}

async function runAsyncTest(name: string, fn: () => Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    results.push({ name, passed: true, durationMs: performance.now() - start });
    console.log('  ✓ ' + name);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message, durationMs: performance.now() - start });
    console.error('  ✗ ' + name + ': ' + err.message);
  }
}

async function main() {
  console.log('======================================================================');
  console.log('  CHALLENGER M2: CUSTOMIZER ENGINE & HUD UI INDEPENDENT VERIFICATION');
  console.log('======================================================================\n');

  // 1. SneakerStoreEngine (Feature 7 & 8)
  console.log('--- 1. Testing SneakerStoreEngine ---');

  runTest("Store: Initializes with default preset 'Cyber Phantom' and 'upper' segment", () => {
    const store = new SneakerStoreEngine();
    assertEqual(store.selectedSegment, 'upper', 'Selected segment default');
    assertEqual(store.currentPreset, 'Cyber Phantom', 'Current preset default');
    assertEqual(store.activeColorway.sole.color, '#00f0ff', 'Sole color in Cyber Phantom');
    assertEqual(store.activeColorway.accents.color, '#7928ca', 'Accents color in Cyber Phantom');
  });

  runTest('Store: selectSegment switches segment and notifies listeners', () => {
    const store = new SneakerStoreEngine();
    let notified = false;
    store.subscribe((state) => {
      if (state.selectedSegment === 'laces') notified = true;
    });
    store.selectSegment('laces');
    assertEqual(store.selectedSegment, 'laces', 'Selected segment switched');
    assert(notified, 'Subscriber was notified of segment change');
  });

  runTest('Store: selectSegment rejects invalid segment names', () => {
    const store = new SneakerStoreEngine();
    let caught = false;
    try {
      store.selectSegment('midsole' as any);
    } catch (e: any) {
      caught = true;
      assert(e.message.includes('Invalid sneaker segment'), 'Error message format');
    }
    assert(caught, 'Did not throw on invalid segment');
  });

  runTest('Store: updateSneakerSegment with empty patch does not modify state (B7.3)', () => {
    const store = new SneakerStoreEngine();
    const beforeState = JSON.stringify(store.getState());
    store.updateSneakerSegment('upper', {});
    const afterState = JSON.stringify(store.getState());
    assertEqual(afterState, beforeState, 'State should be unmodified on empty patch');
    assertEqual(store.history.length, 0, 'No history entry added for empty patch');
  });

  runTest('Store: updateSneakerSegment validates hex color (B7.4)', () => {
    const store = new SneakerStoreEngine();
    let caught = false;
    try {
      store.updateSneakerSegment('sole', { color: 'not-a-hex' });
    } catch (e: any) {
      caught = true;
      assert(e.message.includes('Invalid hex color'), 'Error message format');
    }
    assert(caught, 'Did not throw on invalid hex color');
  });

  runTest('Store: updateSneakerSegment normalizes 3-digit shorthand and lowercases', () => {
    const store = new SneakerStoreEngine();
    store.updateSneakerSegment('sole', { color: '#0F8' });
    assertEqual(store.activeColorway.sole.color, '#00ff88', 'Normalized 3-digit hex');
    assertEqual(store.currentPreset, 'Custom', 'Preset flipped to Custom');
  });

  runTest('Store: updateSneakerSegment isolates targeted segment without mutating others', () => {
    const store = new SneakerStoreEngine();
    const soleBefore = store.activeColorway.sole.color;
    const accentsBefore = store.activeColorway.accents.color;
    const lacesBefore = store.activeColorway.laces.color;

    store.updateSneakerSegment('upper', { color: '#ff334b' });

    assertEqual(store.activeColorway.upper.color, '#ff334b', 'Upper color updated');
    assertEqual(store.activeColorway.sole.color, soleBefore, 'Sole preserved');
    assertEqual(store.activeColorway.accents.color, accentsBefore, 'Accents preserved');
    assertEqual(store.activeColorway.laces.color, lacesBefore, 'Laces preserved');
  });

  runTest('Store: updateSneakerSegment clamps scalar PBR properties [0.0, 1.0]', () => {
    const store = new SneakerStoreEngine();
    store.updateSneakerSegment('upper', {
      roughness: 2.5,
      metalness: -0.8,
      clearcoat: 1.05,
      iridescence: NaN,
    });
    assertEqual(store.activeColorway.upper.roughness, 1.0, 'Clamped max roughness');
    assertEqual(store.activeColorway.upper.metalness, 0.0, 'Clamped min metalness');
    assertEqual(store.activeColorway.upper.clearcoat, 1.0, 'Clamped max clearcoat');
    assertEqual(store.activeColorway.upper.iridescence, 0.0, 'Handled NaN iridescence safely');
  });

  runTest('Store: applyPreset updates full colorway and rejects invalid preset', () => {
    const store = new SneakerStoreEngine();
    store.applyPreset('Retro Heritage');
    assertEqual(store.currentPreset, 'Retro Heritage', 'Preset name updated');
    assertEqual(store.activeColorway.upper.color, '#f4efe6', 'Retro Heritage upper color');
    assertEqual(store.activeColorway.sole.color, '#c84b31', 'Retro Heritage sole color');

    let caught = false;
    try {
      store.applyPreset('NonExistentPreset');
    } catch (e: any) {
      caught = true;
      assert(e.message.includes('Unknown preset'), 'Throws on unknown preset');
    }
    assert(caught, 'Did not throw on invalid preset');
  });

  runTest('Store: applyPreset deep-clones so subsequent mutations do not corrupt preset dictionary', () => {
    const store = new SneakerStoreEngine();
    store.applyPreset('Triple Stealth');
    store.updateSneakerSegment('upper', { color: '#ff0000' });
    assertEqual(COLORWAY_PRESETS['Triple Stealth'].upper.color, '#111111', 'Original preset remains intact');
  });

  runTest("Store: resetCustomization reverts back to 'Cyber Phantom'", () => {
    const store = new SneakerStoreEngine();
    store.applyPreset('Aurora Neon');
    store.resetCustomization();
    assertEqual(store.currentPreset, 'Cyber Phantom', 'Reverted preset');
    assertEqual(store.activeColorway.sole.color, '#00f0ff', 'Reverted sole color');
  });

  // 2. UniformMutationEngine (Feature 7 Zero-Recompile & GSAP Tweens)
  console.log('\n--- 2. Testing UniformMutationEngine ---');

  runTest('UniformMutationEngine: registerModel indexes materials and meshes correctly', () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();

    engine.registerModel(assembly.root, assembly.materialMap);

    const upperMats = engine.getMaterials('upper');
    const soleMats = engine.getMaterials('sole');
    const accentMats = engine.getMaterials('accents');
    const laceMats = engine.getMaterials('laces');

    assert(upperMats.length >= 1, 'Upper materials indexed');
    assert(soleMats.length >= 1, 'Sole materials indexed');
    assert(accentMats.length >= 1, 'Accent materials indexed');
    assert(laceMats.length >= 1, 'Lace materials indexed');

    const soleMeshes = engine.getMeshes('sole');
    assert(soleMeshes.length >= 2, 'Sole meshes indexed (outsole + tread lugs)');
  });

  runTest('UniformMutationEngine: ZERO-RECOMPILE GUARANTEE (material.needsUpdate remains false)', () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    engine.registerModel(assembly.root, assembly.materialMap);

    const upperMats = engine.getMaterials('upper');
    const soleMats = engine.getMaterials('sole');

    const vUpperBefore = upperMats.map(m => m.version);
    const vSoleBefore = soleMats.map(m => m.version);

    // Perform immediate color mutation (duration 0)
    engine.tweenSegmentColor('upper', '#ff00ff', { duration: 0 });

    upperMats.forEach((m, i) => {
      assertEqual(m.version, vUpperBefore[i], "Material version MUST NOT increment on color mutation (zero-recompile)!");
      assertEqual(m.color.getHexString(), 'ff00ff', "Direct color uniform updated");
    });

    // Perform scalar mutation (duration 0)
    engine.tweenSegmentScalars('sole', { roughness: 0.12, metalness: 0.95 }, { duration: 0 });

    soleMats.forEach((m, i) => {
      assertEqual(m.version, vSoleBefore[i], "Material version MUST NOT increment on scalar mutation (zero-recompile)!");
      assertEqual(m.roughness, 0.12, "Direct roughness updated");
      assertEqual(m.metalness, 0.95, "Direct metalness updated");
    });
  });

  await runAsyncTest('UniformMutationEngine: GSAP smooth color tweening interpolates RGB uniforms', async () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    engine.registerModel(assembly.root, assembly.materialMap);

    const upperMats = engine.getMaterials('upper');
    upperMats[0].color.set('#000000');
    const vBefore = upperMats[0].version;

    let completed = false;
    engine.tweenSegmentColor('upper', '#ffffff', {
      duration: 0.05,
      onComplete: () => {
        completed = true;
      },
    });

    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (completed) {
          clearInterval(check);
          resolve();
        }
      }, 10);
    });

    assert(completed, 'GSAP tween completed callback fired');
    assert(upperMats[0].color.r > 0.95, 'Color tweened towards target: ' + upperMats[0].color.r);
    assertEqual(upperMats[0].version, vBefore, 'Material version unchanged after GSAP tween');
  });

  runTest("UniformMutationEngine: overwrite: 'auto' gracefully interrupts rapid mutations without leak", () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    engine.registerModel(assembly.root, assembly.materialMap);

    for (let i = 0; i < 20; i++) {
      const hex = '#' + (i * 10).toString(16).padStart(2, '0') + '0000';
      engine.tweenSegmentColor('upper', hex, { duration: 0.38 });
    }

    const upperMat = engine.getMaterials('upper')[0];
    assert(Number.isFinite(upperMat.color.r), 'Color uniform remains finite');
    assert(Number.isFinite(upperMat.color.g), 'Color uniform remains finite');
    assert(Number.isFinite(upperMat.color.b), 'Color uniform remains finite');

    engine.clear();
  });

  runTest('UniformMutationEngine: applyCustomization applies 4 segments in a single pass', () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    engine.registerModel(assembly.root, assembly.materialMap);

    const testCustomization = {
      upper: { color: '#112233', roughness: 0.3 },
      sole: { color: '#445566', roughness: 0.5 },
      accents: { color: '#778899', roughness: 0.7 },
      laces: { color: '#aabbcc', roughness: 0.9 },
    };

    engine.applyCustomization(testCustomization, { duration: 0 });

    const upperMat = engine.getMaterials('upper')[0];
    const soleMat = engine.getMaterials('sole')[0];
    const accentMat = engine.getMaterials('accents')[0];
    const laceMat = engine.getMaterials('laces')[0];

    assertEqual(upperMat.color.getHexString(), '112233', 'Upper color applied');
    assertEqual(soleMat.color.getHexString(), '445566', 'Sole color applied');
    assertEqual(accentMat.color.getHexString(), '778899', 'Accents color applied');
    assertEqual(laceMat.color.getHexString(), 'aabbcc', 'Laces color applied');

    assertEqual(upperMat.roughness, 0.3, 'Upper roughness applied');
    assertEqual(soleMat.roughness, 0.5, 'Sole roughness applied');
    assertEqual(accentMat.roughness, 0.7, 'Accents roughness applied');
    assertEqual(laceMat.roughness, 0.9, 'Laces roughness applied');
  });

  runTest('UniformMutationEngine: clear() halts active tweens and frees maps', () => {
    const engine = new UniformMutationEngine();
    const assembly = ProceduralSneakerGenerator.createSneakerAssembly();
    engine.registerModel(assembly.root, assembly.materialMap);

    engine.tweenSegmentColor('upper', '#ff0000', { duration: 5.0 });
    engine.clear();

    assertEqual(engine.getMaterials('upper').length, 0, 'Upper materials emptied');
    assertEqual(engine.getMeshes('upper').length, 0, 'Upper meshes emptied');
  });

  // 3. Colorways, Swatches & Presets (Feature 8)
  console.log('\n--- 3. Testing Colorways, Presets & Utilities ---');

  runTest('Colorways: 4 Curated Presets exist and contain valid 6-digit hex values', () => {
    const expectedPresets = ['Cyber Phantom', 'Retro Heritage', 'Triple Stealth', 'Aurora Neon'];
    for (const name of expectedPresets) {
      const p = COLORWAY_PRESETS[name];
      assert(Boolean(p), 'Preset ' + name + ' must exist');
      assert(validateHex(p.upper.color), name + ' upper hex valid');
      assert(validateHex(p.sole.color), name + ' sole hex valid');
      assert(validateHex(p.accents.color), name + ' accents hex valid');
      assert(validateHex(p.laces.color), name + ' laces hex valid');
    }
  });

  runTest('Colorways: COLORWAYS_LIST contains all 4 presets with taglines and descriptions', () => {
    assertEqual(COLORWAYS_LIST.length, 4, '4 presets in list');
    const ids = COLORWAYS_LIST.map(p => p.id);
    assert(ids.includes('cyber-phantom'), 'Has cyber-phantom');
    assert(ids.includes('retro-heritage'), 'Has retro-heritage');
    assert(ids.includes('triple-stealth'), 'Has triple-stealth');
    assert(ids.includes('aurora-neon'), 'Has aurora-neon');

    COLORWAYS_LIST.forEach(item => {
      assert(item.tagline.length > 0, item.id + ' has non-empty tagline');
      assert(item.description.length > 0, item.id + ' has non-empty description');
    });
  });

  runTest('Colorways: 4 Material Finish Presets exist with valid physical properties', () => {
    const finishes: FinishType[] = ['matte', 'gloss', 'metallic', 'iridescent'];
    for (const f of finishes) {
      const preset = FINISH_PRESETS[f];
      assert(Boolean(preset), 'Finish preset ' + f + ' exists');
      assert(preset.properties.roughness >= 0 && preset.properties.roughness <= 1, f + ' roughness in range');
      assert(preset.properties.metalness >= 0 && preset.properties.metalness <= 1, f + ' metalness in range');
      assert(preset.properties.clearcoat >= 0 && preset.properties.clearcoat <= 1, f + ' clearcoat in range');
    }
  });

  runTest('Colorways: CURATED_SWATCHES contains exactly 16 luxury colors', () => {
    assertEqual(CURATED_SWATCHES.length, 16, '16 curated swatches');
    const ids = new Set<string>();
    CURATED_SWATCHES.forEach(s => {
      assert(!ids.has(s.id), 'Duplicate swatch ID: ' + s.id);
      ids.add(s.id);
      assert(validateHex(s.hex), 'Swatch ' + s.id + ' hex ' + s.hex + ' is valid');
      assert(['monochrome', 'neon', 'heritage', 'chroma'].includes(s.family), 'Valid family ' + s.family);
    });
  });

  runTest('Colorways: validateHex handles valid and adversarial inputs', () => {
    assert(validateHex('#FFF'), '3-digit hex valid');
    assert(validateHex('#ffffff'), '6-digit hex valid');
    assert(validateHex('#00F0FF'), 'Uppercase hex valid');
    assert(validateHex('  #1a1a24  '), 'Padded whitespace valid');

    assert(!validateHex('#GGGGGG'), 'Invalid characters rejected');
    assert(!validateHex('#12'), '2-digit rejected');
    assert(!validateHex('#1234'), '4-digit rejected');
    assert(!validateHex('#1234567'), '7-digit rejected');
    assert(!validateHex(''), 'Empty string rejected');
    assert(!validateHex(null as any), 'null rejected');
    assert(!validateHex(undefined as any), 'undefined rejected');
    assert(!validateHex(123456 as any), 'number rejected');
  });

  runTest('Colorways: normalizeHex formats correctly', () => {
    assertEqual(normalizeHex('#fff'), '#ffffff', 'Expand 3-digit');
    assertEqual(normalizeHex('#ABC'), '#aabbcc', 'Expand and lowercase');
    assertEqual(normalizeHex('#00F0FF'), '#00f0ff', 'Lowercase 6-digit');
    assertEqual(normalizeHex('invalid'), '#000000', 'Fallback on invalid');
  });

  runTest('Colorways: getPreset looks up by exact name or slug', () => {
    const p1 = getPreset('Cyber Phantom');
    assertEqual(p1.name, 'Cyber Phantom', 'Found by exact name');
    const p2 = getPreset('cyber-phantom');
    assertEqual(p2.name, 'Cyber Phantom', 'Found by slug');

    let caught = false;
    try {
      getPreset('invalid-name');
    } catch (e: any) {
      caught = true;
      assert(e.message.includes('Unknown preset'), 'Error message format');
    }
    assert(caught, 'Threw on unknown preset');
  });

  runTest('Colorways: detectActiveFinish identifies correct finish preset', () => {
    assertEqual(detectActiveFinish({ roughness: 0.85, clearcoat: 0.0, metalness: 0.02 }), 'matte', 'Detected matte');
    assertEqual(detectActiveFinish({ roughness: 0.18, clearcoat: 0.85 }), 'gloss', 'Detected gloss');
    assertEqual(detectActiveFinish({ metalness: 0.90 }), 'metallic', 'Detected metallic');
    assertEqual(detectActiveFinish({ iridescence: 0.92 }), 'iridescent', 'Detected iridescent');
    assertEqual(detectActiveFinish({ roughness: 0.5, metalness: 0.5, clearcoat: 0.2 }), 'custom', 'Detected custom');
  });

  // 4. PBRMaterialSystem (Feature 5 & 7 integration)
  console.log('\n--- 4. Testing PBRMaterialSystem ---');

  runTest('PBRMaterialSystem: getPresetProperties matches project specifications', () => {
    const upper = PBRMaterialSystem.getPresetProperties('upper');
    assertEqual(upper.roughness, 0.42, 'Upper roughness 0.42');
    assertEqual(upper.clearcoat, 0.25, 'Upper clearcoat 0.25');
    assertEqual(upper.normalScale[0], 0.8, 'Upper normalScale X');

    const sole = PBRMaterialSystem.getPresetProperties('sole');
    assertEqual(sole.roughness, 0.65, 'Sole roughness 0.65');
    assertEqual(sole.normalScale[0], 1.5, 'Sole normalScale X');

    const accents = PBRMaterialSystem.getPresetProperties('accents');
    assertEqual(accents.metalness, 0.85, 'Accents metalness 0.85');
    assertEqual(accents.iridescence, 0.75, 'Accents iridescence 0.75');

    const laces = PBRMaterialSystem.getPresetProperties('laces');
    assertEqual(laces.roughness, 0.75, 'Laces roughness 0.75');
    assertEqual(laces.metalness, 0.02, 'Laces metalness 0.02');
  });

  runTest('PBRMaterialSystem: createMeshPhysicalMaterial attaches normal maps and sets params', () => {
    const matUpper = PBRMaterialSystem.createMeshPhysicalMaterial('upper', '#112233');
    assertEqual(matUpper.name, 'mat_upper_pbr', 'Material name');
    assert(matUpper instanceof THREE.MeshPhysicalMaterial, 'Is MeshPhysicalMaterial');
    assertEqual(matUpper.color.getHexString(), '112233', 'Color hex applied');
    assert(matUpper.normalMap !== null, 'Normal map attached to upper');
    assertEqual(matUpper.normalScale.x, 0.8, 'Normal scale X matches preset');

    const matAccents = PBRMaterialSystem.createMeshPhysicalMaterial('accents', '#E8ECEF');
    assertEqual(matAccents.iridescence, 0.75, 'Accents iridescence configured');
    assertEqual(matAccents.iridescenceIOR, 1.45, 'Accents iridescenceIOR configured');
  });

  // 5. Adversarial Stress Testing (500 Rapid Mutations & Boundary Attacks)
  console.log('\n--- 5. Adversarial Stress Testing ---');

  runTest('Adversarial: 500 Rapid-Fire Random Color Mutations across All Segments', () => {
    const store = new SneakerStoreEngine();
    const segments: SegmentId[] = ['upper', 'sole', 'accents', 'laces'];

    for (let i = 0; i < 500; i++) {
      const seg = segments[i % segments.length];
      const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const hex = '#' + r + g + b;

      store.updateSneakerSegment(seg, { color: hex });
      assertEqual(store.activeColorway[seg].color, hex, 'Iteration ' + i + ' updated color');
    }

    assertEqual(store.history.length, 500, '500 history entries recorded');
    assertEqual(store.currentPreset, 'Custom', 'Preset remains Custom');
  });

  runTest('Adversarial: Preset Thrashing 100 Cycles', () => {
    const store = new SneakerStoreEngine();
    const presetNames = ['Cyber Phantom', 'Retro Heritage', 'Triple Stealth', 'Aurora Neon'];

    for (let i = 0; i < 100; i++) {
      const name = presetNames[i % presetNames.length];
      store.applyPreset(name);
      assertEqual(store.currentPreset, name, 'Preset cycle ' + i);
    }
  });

  runTest('Adversarial: Malicious / Weird Hex Inputs Rejection', () => {
    const store = new SneakerStoreEngine();
    const maliciousInputs = [
      '<script>alert(1)</script>',
      '#',
      '#1',
      '#12',
      '#1234',
      '#12345',
      '#1234567',
      'rgb(255,0,0)',
      'hsl(0, 100%, 50%)',
      'red',
      'undefined',
      '#GGGGGG',
      '#zzz',
      '# 123456',
      '#123 456',
      '#123456 ', // space inside? wait, trim handles leading/trailing, internal space fails
    ];

    for (const bad of [
      '<script>alert(1)</script>',
      '#',
      '#1',
      '#12',
      '#1234',
      '#12345',
      '#1234567',
      'rgb(255,0,0)',
      'hsl(0, 100%, 50%)',
      'red',
      'undefined',
      '#GGGGGG',
      '#zzz',
      '# 123456',
      '#123 456',
    ]) {
      let threw = false;
      try {
        store.updateSneakerSegment('upper', { color: bad });
      } catch (e: any) {
        threw = true;
      }
      assert(threw, 'Malicious hex ' + JSON.stringify(bad) + ' must throw an error');
    }

    // Verify Contract B8.4: Whitespace-padded valid hex is normalized, not rejected
    store.updateSneakerSegment('upper', { color: '   #123456\n  ' });
    assertEqual(store.activeColorway.upper.color, '#123456', 'Whitespace padded hex normalized');
  });

  // -------------------------------------------------------------------------
  // 6. Customizer HUD UI Verification (Feature 8)
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Testing Customizer HUD UI ---');

  runTest('CustomizerHUD: Renders with double-bezel concentric hierarchy', () => {
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(CustomizerHUD));
    assert(html.includes('double-bezel-outer'), 'Contains double-bezel-outer class');
    assert(html.includes('double-bezel-inner'), 'Contains double-bezel-inner class');
    assert(html.includes('data-testid="customizer-hud"'), 'Contains data-testid');
  });

  runTest('CustomizerHUD: Renders all 4 anatomical segment tabs with labels and subtitles', () => {
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(CustomizerHUD));
    assert(html.includes('Upper'), 'Contains Upper segment');
    assert(html.includes('Sole'), 'Contains Sole segment');
    assert(html.includes('Accents'), 'Contains Accents segment');
    assert(html.includes('Laces'), 'Contains Laces segment');
    assert(html.includes('NitroCell Foam'), 'Contains Sole subtitle');
  });

  runTest('CustomizerHUD: Renders all 4 curated colorway presets with 4-quadrant previews', () => {
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(CustomizerHUD));
    assert(html.includes('Cyber Phantom'), 'Contains Cyber Phantom preset');
    assert(html.includes('Retro Heritage'), 'Contains Retro Heritage preset');
    assert(html.includes('Triple Stealth'), 'Contains Triple Stealth preset');
    assert(html.includes('Aurora Neon'), 'Contains Aurora Neon preset');
    assert(html.includes('grid-cols-2 grid-rows-2'), 'Contains 4-quadrant preview mini swatches');
  });

  runTest('CustomizerHUD: Renders 16 curated swatches with colors', () => {
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(CustomizerHUD));
    for (const swatch of CURATED_SWATCHES) {
      assert(html.includes(swatch.hex), 'HTML contains swatch hex ' + swatch.hex);
    }
  });

  runTest('CustomizerHUD: Renders all 4 material finish buttons with badges', () => {
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(CustomizerHUD));
    assert(html.includes('Matte'), 'Contains Matte finish');
    assert(html.includes('DIFFUSE'), 'Contains DIFFUSE badge');
    assert(html.includes('Gloss'), 'Contains Gloss finish');
    assert(html.includes('SPECULAR'), 'Contains SPECULAR badge');
    assert(html.includes('Metallic'), 'Contains Metallic finish');
    assert(html.includes('ANODIZED'), 'Contains ANODIZED badge');
    assert(html.includes('Iridescent'), 'Contains Iridescent finish');
    assert(html.includes('CHROMA'), 'Contains CHROMA badge');
  });

  runTest('CustomizerHUD: Displays live telemetry and hex inputs', () => {
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(CustomizerHUD));
    assert(html.includes('ACTIVE: UPPER'), 'Shows active segment telemetry');
    assert(html.includes('Native Color Input'), 'Contains native color wheel input');
    assert(html.includes('Apply'), 'Contains hex submit apply button');
  });

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  console.log('\n======================================================================');
  console.log('  VERIFICATION RESULTS: ' + passed + '/' + total + ' PASSED (' + ((passed/total)*100).toFixed(1) + '%)');
  console.log('======================================================================');

  if (failed > 0) {
    console.error('\nFAILED TESTS (' + failed + '):');
    results.filter(r => !r.passed).forEach(r => {
      console.error('  - ' + r.name + ': ' + r.error);
    });
    process.exit(1);
  } else {
    console.log('\nALL CHALLENGER M2 INDEPENDENT TESTS PASSED!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});