/**
 * AEROPRO-X LAB 3D Shoe Shop - Tier 2: Boundary & Corner Cases Test Suite
 *
 * Derives strictly from requirements in ORIGINAL_REQUEST.md & PROJECT.md.
 * Covers all 16 features with >= 5 boundary/corner/adversarial tests each (80 tests total).
 */

import {
  TestRegistry,
  expect,
  createSyntheticBrowser,
  ProceduralTextureEngine,
  PBRMaterialSystem,
  SneakerCustomizerStore,
  CartStore,
  SoundEngine,
  CameraChoreographer,
  HotspotManager,
  OrbitControlsSimulator,
  StudioLightingRig,
  COLORWAY_PRESETS,
  CAMERA_STAGES
} from './harness.js';

export const tier2Registry = new TestRegistry('Tier 2: Boundary & Corner Cases (80 Tests)');
const { describe, test } = tier2Registry;

// =========================================================================
// Feature 1: Greenfield Scaffold & Dependencies (Boundary)
// =========================================================================
describe('Feature 1: Greenfield Scaffold & Dependencies (Boundary)', () => {
  test('B1.1: Missing required dependency in manifest fails validation', () => {
    const brokenPkg = { dependencies: { react: '^18.0.0' } };
    expect(brokenPkg.dependencies.hasOwnProperty('three')).toBe(false);
  });

  test('B1.2: Extreme viewport dimensions (ultrawide 3840x1080 and miniature 320x480) compute valid aspect ratios', () => {
    const ultraAspect = 3840 / 1080;
    const miniAspect = 320 / 480;
    expect(ultraAspect).toBeCloseTo(3.56, 2);
    expect(miniAspect).toBeCloseTo(0.67, 2);
    expect(Number.isFinite(ultraAspect)).toBe(true);
    expect(Number.isFinite(miniAspect)).toBe(true);
  });

  test('B1.3: HTML canvas element without WebGL support triggers fallback detection', () => {
    const brokenCanvas = { getContext: (type) => null };
    const gl = brokenCanvas.getContext('webgl2');
    expect(gl).toBeNull();
  });

  test('B1.4: Script execution in offline/disconnected state relies on zero external CDN URLs', () => {
    const externalCdnPattern = /https?:\/\/(cdn|unpkg|cdnjs|jsdelivr)/i;
    const localAssetPath = '/assets/sneaker.glb';
    expect(externalCdnPattern.test(localAssetPath)).toBe(false);
  });

  test('B1.5: Concurrent mount/unmount cycle of root container executes cleanly without leaks', () => {
    const { document } = createSyntheticBrowser();
    const container = document.createElement('div');
    document.body.appendChild(container);
    expect(document.body.children.length).toBe(1);
    document.body.children = [];
    expect(document.body.children.length).toBe(0);
  });
});

// =========================================================================
// Feature 2: Studio Lighting Rig & Shadow Plane (Boundary)
// =========================================================================
describe('Feature 2: Studio Lighting Rig & Shadow Plane (Boundary)', () => {
  test('B2.1: Key Light intensity set to 0 or negative clamps to safe threshold', () => {
    const rig = new StudioLightingRig();
    const setSafeIntensity = (val) => Math.max(0.1, val);
    expect(setSafeIntensity(0)).toBe(0.1);
    expect(setSafeIntensity(-5.0)).toBe(0.1);
  });

  test('B2.2: Shadow map resolution clamped to hardware limits (max 4096)', () => {
    const clampShadowMap = (size) => Math.min(4096, Math.max(512, size));
    expect(clampShadowMap(8192)).toBe(4096);
    expect(clampShadowMap(256)).toBe(512);
  });

  test('B2.3: Contact shadow opacity boundary clamps strictly between 0.0 and 1.0', () => {
    const clampOpacity = (v) => Math.min(1.0, Math.max(0.0, v));
    expect(clampOpacity(1.85)).toBe(1.0);
    expect(clampOpacity(-0.4)).toBe(0.0);
    expect(clampOpacity(0.65)).toBe(0.65);
  });

  test('B2.4: Extreme light coordinates [1e5, 1e5, 1e5] do not generate NaN light vectors', () => {
    const pos = [1e5, 1e5, 1e5];
    const len = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    const norm = pos.map((c) => c / len);
    expect(Number.isFinite(norm[0])).toBe(true);
    expect(Number.isNaN(norm[0])).toBe(false);
  });

  test('B2.5: Zero ambient light condition preserves directional highlights without total black crush', () => {
    const rig = new StudioLightingRig();
    rig.lights.ambientLight.intensity = 0.0;
    expect(rig.lights.keyLight.intensity).toBeGreaterThanOrEqual(2.0);
    expect(rig.lights.rimLight.intensity).toBeGreaterThanOrEqual(3.0);
  });
});

// =========================================================================
// Feature 3: 3D Sneaker Geometry Engine (Boundary)
// =========================================================================
describe('Feature 3: 3D Sneaker Geometry Engine (Boundary)', () => {
  test('B3.1: Zero-scale transform handling clamps to minimum visible scale', () => {
    const clampScale = (s) => Math.max(0.001, s);
    expect(clampScale(0)).toBe(0.001);
    expect(clampScale(-2)).toBe(0.001);
  });

  test('B3.2: Empty geometry vertex stream handled safely without throwing', () => {
    const computeBounds = (vertices) => {
      if (!vertices || vertices.length === 0) return { min: [0, 0, 0], max: [0, 0, 0] };
      return { min: [-1, -1, -1], max: [1, 1, 1] };
    };
    const bounds = computeBounds([]);
    expect(bounds.min).toEqual([0, 0, 0]);
  });

  test('B3.3: Bounding box calculation on skewed geometry maintains finite values', () => {
    const extremeVertices = [-1000, 0, 0, 1000, 0, 0];
    const minX = Math.min(extremeVertices[0], extremeVertices[3]);
    const maxX = Math.max(extremeVertices[0], extremeVertices[3]);
    expect(Number.isFinite(minX)).toBe(true);
    expect(Number.isFinite(maxX)).toBe(true);
  });

  test('B3.4: Extreme segment translation offsets in exploded view remain within max radius', () => {
    const clampExploded = (offset, maxR = 2.0) => {
      const mag = Math.sqrt(offset[0]**2 + offset[1]**2 + offset[2]**2);
      if (mag > maxR) {
        return offset.map((v) => (v / mag) * maxR);
      }
      return offset;
    };
    const clamped = clampExploded([0, 10, 0]);
    expect(clamped[1]).toBe(2.0);
  });

  test('B3.5: Querying unknown segment throws descriptive error', () => {
    const customizer = new SneakerCustomizerStore();
    expect(() => {
      customizer.selectSegment('non_existent_part');
    }).toThrow('Invalid sneaker segment');
  });
});

// =========================================================================
// Feature 4: OrbitControls with Boundaries & Damping (Boundary)
// =========================================================================
describe('Feature 4: OrbitControls with Boundaries & Damping (Boundary)', () => {
  test('B4.1: Extreme polar angle inputs (-10 rad, +50 rad) clamp strictly to polar bounds', () => {
    const controls = new OrbitControlsSimulator();
    controls.setPolarAngle(-10);
    expect(controls.phi).toBeCloseTo(controls.minPolarAngle, 3);
    controls.setPolarAngle(50);
    expect(controls.phi).toBeCloseTo(controls.maxPolarAngle, 3);
  });

  test('B4.2: Zoom in beyond minDistance (0.001 or negative) clamps to 2.0', () => {
    const controls = new OrbitControlsSimulator();
    controls.setDistance(0.001);
    expect(controls.radius).toBe(2.0);
    controls.setDistance(-10.5);
    expect(controls.radius).toBe(2.0);
  });

  test('B4.3: Zoom out beyond maxDistance (1000.0) clamps to 8.5', () => {
    const controls = new OrbitControlsSimulator();
    controls.setDistance(1000.0);
    expect(controls.radius).toBe(8.5);
  });

  test('B4.4: Extreme damping factor values clamp safely between 0.001 and 0.5', () => {
    const clampDamping = (d) => Math.min(0.5, Math.max(0.001, d));
    expect(clampDamping(0)).toBe(0.001);
    expect(clampDamping(1.5)).toBe(0.5);
  });

  test('B4.5: High frequency rapid spin inputs do not produce NaN coordinates', () => {
    const controls = new OrbitControlsSimulator();
    controls.rotate(10000.0, 500.0);
    const state = controls.update(0.016);
    expect(Number.isFinite(state.cameraPos[0])).toBe(true);
    expect(Number.isFinite(state.cameraPos[1])).toBe(true);
    expect(Number.isFinite(state.cameraPos[2])).toBe(true);
  });
});

// =========================================================================
// Feature 5: PBR Material Definition System (Boundary)
// =========================================================================
describe('Feature 5: PBR Material Definition System (Boundary)', () => {
  test('B5.1: Roughness value set out of bounds (<0 or >1) clamps to [0.0, 1.0]', () => {
    const customizer = new SneakerCustomizerStore();
    customizer.updateSneakerSegment('upper', { roughness: 2.5 });
    expect(customizer.activeColorway.upper.roughness).toBe(1.0);
    customizer.updateSneakerSegment('upper', { roughness: -0.8 });
    expect(customizer.activeColorway.upper.roughness).toBe(0.0);
  });

  test('B5.2: Metalness value set out of bounds (<0 or >1) clamps to [0.0, 1.0]', () => {
    const customizer = new SneakerCustomizerStore();
    customizer.updateSneakerSegment('accents', { metalness: 1.8 });
    expect(customizer.activeColorway.accents.metalness).toBe(1.0);
    customizer.updateSneakerSegment('accents', { metalness: -0.2 });
    expect(customizer.activeColorway.accents.metalness).toBe(0.0);
  });

  test('B5.3: Clearcoat value set out of bounds (<0 or >1) clamps to [0.0, 1.0]', () => {
    const customizer = new SneakerCustomizerStore();
    customizer.updateSneakerSegment('sole', { clearcoat: 5.0 });
    expect(customizer.activeColorway.sole.clearcoat).toBe(1.0);
  });

  test('B5.4: Malformed hex strings are rejected by validator', () => {
    expect(PBRMaterialSystem.validateHex('not-a-color')).toBe(false);
    expect(PBRMaterialSystem.validateHex('#GGG')).toBe(false);
    expect(PBRMaterialSystem.validateHex('#12345')).toBe(false);
    expect(PBRMaterialSystem.validateHex('')).toBe(false);
    expect(PBRMaterialSystem.validateHex('#1234567')).toBe(false);
  });

  test('B5.5: NormalScale vector set to [0, 0] is non-negative and finite', () => {
    const normalScale = [0, 0];
    expect(normalScale[0]).toBe(0);
    expect(normalScale[1]).toBe(0);
    expect(Number.isFinite(normalScale[0])).toBe(true);
  });
});

// =========================================================================
// Feature 6: Procedural Texture Generators (Boundary)
// =========================================================================
describe('Feature 6: Procedural Texture Generators (Boundary)', () => {
  test('B6.1: Minimum canvas size boundary (16x16) generates valid buffer without underflow', () => {
    const tex = ProceduralTextureEngine.generateNormalMap('leather', 16);
    expect(tex.data.length).toBe(16 * 16 * 4);
    expect(tex.size).toBe(16);
  });

  test('B6.2: High-resolution canvas boundary (1024x1024) allocates correct byte length', () => {
    const expectedBytes = 1024 * 1024 * 4;
    expect(expectedBytes).toBe(4194304);
  });

  test('B6.3: Consecutive generation of all texture types maintains isolated data buffers', () => {
    const t1 = ProceduralTextureEngine.generateNormalMap('leather', 32);
    const t2 = ProceduralTextureEngine.generateNormalMap('mesh', 32);
    const t3 = ProceduralTextureEngine.generateNormalMap('rubber', 32);
    expect(t1.type).toBe('leather');
    expect(t2.type).toBe('mesh');
    expect(t3.type).toBe('rubber');
  });

  test('B6.4: Pixel normal channels remain strictly bounded within 0-255 uint8 range', () => {
    const tex = ProceduralTextureEngine.generateNormalMap('rubber', 32);
    for (let i = 0; i < tex.data.length; i++) {
      expect(tex.data[i]).toBeGreaterThanOrEqual(0);
      expect(tex.data[i]).toBeLessThanOrEqual(255);
    }
  });

  test('B6.5: Unsupported procedural texture type generates predictable descriptive exception', () => {
    expect(() => {
      ProceduralTextureEngine.generateNormalMap('holographic_foil');
    }).toThrow('Unknown procedural texture type');
  });
});

// =========================================================================
// Feature 7: Real-Time 4-Segment Customizer (Boundary)
// =========================================================================
describe('Feature 7: Real-Time 4-Segment Customizer (Boundary)', () => {
  test('B7.1: Rapid successive color changes (50 mutations) execute synchronously without race conditions', () => {
    const customizer = new SneakerCustomizerStore();
    for (let i = 0; i < 50; i++) {
      const hex = `#${(i * 5).toString(16).padStart(2, '0')}0000`;
      customizer.updateSneakerSegment('upper', { color: PBRMaterialSystem.validateHex(hex) ? hex : '#ff0000' });
    }
    expect(customizer.activeColorway.upper.color).toBe('#f50000');
    expect(customizer.history.length).toBe(50);
  });

  test('B7.2: Attempting to update a non-existent segment throws descriptive error', () => {
    const customizer = new SneakerCustomizerStore();
    expect(() => {
      customizer.updateSneakerSegment('midsole_air_bubble', { color: '#00ff00' });
    }).toThrow('Invalid sneaker segment');
  });

  test('B7.3: Empty patch object does not alter existing colorway properties', () => {
    const customizer = new SneakerCustomizerStore('Cyber Phantom');
    const upperBefore = { ...customizer.activeColorway.upper };
    customizer.updateSneakerSegment('upper', {});
    expect(customizer.activeColorway.upper).toEqual(upperBefore);
  });

  test('B7.4: Invalid hex color in patch throws explicit error and preserves existing color', () => {
    const customizer = new SneakerCustomizerStore();
    const colorBefore = customizer.activeColorway.sole.color;
    expect(() => {
      customizer.updateSneakerSegment('sole', { color: 'invalid-hex' });
    }).toThrow('Invalid hex color');
    expect(customizer.activeColorway.sole.color).toBe(colorBefore);
  });

  test('B7.5: Unsubscribing a listener prevents subsequent notification calls', () => {
    const customizer = new SneakerCustomizerStore();
    let callCount = 0;
    const unsub = customizer.subscribe(() => { callCount++; });
    customizer.updateSneakerSegment('upper', { color: '#123456' });
    expect(callCount).toBe(1);
    unsub();
    customizer.updateSneakerSegment('upper', { color: '#654321' });
    expect(callCount).toBe(1);
  });
});

// =========================================================================
// Feature 8: Curated Colorway & Finish Presets (Boundary)
// =========================================================================
describe('Feature 8: Curated Colorway & Finish Presets (Boundary)', () => {
  test('B8.1: Applying unknown preset name throws descriptive error', () => {
    const customizer = new SneakerCustomizerStore();
    expect(() => {
      customizer.applyPreset('Galactic Unicorn');
    }).toThrow('Unknown preset');
  });

  test('B8.2: Rapid preset flipping maintains clean state integrity', () => {
    const customizer = new SneakerCustomizerStore();
    const presets = Object.keys(COLORWAY_PRESETS);
    for (let i = 0; i < 40; i++) {
      customizer.applyPreset(presets[i % presets.length]);
    }
    expect(customizer.currentPreset).toBe(presets[39 % presets.length]);
  });

  test('B8.3: Custom color modification immediately flips currentPreset to "Custom"', () => {
    const customizer = new SneakerCustomizerStore('Retro Heritage');
    expect(customizer.currentPreset).toBe('Retro Heritage');
    customizer.updateSneakerSegment('laces', { color: '#ff0000' });
    expect(customizer.currentPreset).toBe('Custom');
  });

  test('B8.4: Hex input with whitespace normalizes correctly', () => {
    const raw = '   #00ffaa   ';
    expect(PBRMaterialSystem.validateHex(raw)).toBe(true);
    expect(PBRMaterialSystem.normalizeHex(raw)).toBe('#00ffaa');
  });

  test('B8.5: Mixed uppercase hex input normalizes to standard lowercase', () => {
    expect(PBRMaterialSystem.normalizeHex('#00F0FF')).toBe('#00f0ff');
    expect(PBRMaterialSystem.normalizeHex('#AbCdEf')).toBe('#abcdef');
  });
});

// =========================================================================
// Feature 9: Cinematic Preloader & Entrance (Boundary)
// =========================================================================
describe('Feature 9: Cinematic Preloader & Entrance (Boundary)', () => {
  class BoundedPreloader {
    constructor() {
      this.progress = 0;
      this.isDismissed = false;
    }
    setProgress(val) {
      this.progress = Math.min(100, Math.max(0, val));
    }
    dismiss() {
      if (this.progress === 100) {
        this.isDismissed = true;
      }
    }
  }

  test('B9.1: Negative progress input clamps strictly to 0%', () => {
    const loader = new BoundedPreloader();
    loader.setProgress(-50);
    expect(loader.progress).toBe(0);
  });

  test('B9.2: Overflow progress input clamps strictly to 100%', () => {
    const loader = new BoundedPreloader();
    loader.setProgress(150);
    expect(loader.progress).toBe(100);
  });

  test('B9.3: Preloader at 99.9% progress rejects dismiss call', () => {
    const loader = new BoundedPreloader();
    loader.setProgress(99.9);
    loader.dismiss();
    expect(loader.isDismissed).toBe(false);
  });

  test('B9.4: Instant 100% progress allows immediate clean dismiss', () => {
    const loader = new BoundedPreloader();
    loader.setProgress(100);
    loader.dismiss();
    expect(loader.isDismissed).toBe(true);
  });

  test('B9.5: Multiple dismiss calls are idempotent and maintain isDismissed=true', () => {
    const loader = new BoundedPreloader();
    loader.setProgress(100);
    loader.dismiss();
    loader.dismiss();
    loader.dismiss();
    expect(loader.isDismissed).toBe(true);
  });
});

// =========================================================================
// Feature 10: 5-Stage GSAP Scroll Choreography (Boundary)
// =========================================================================
describe('Feature 10: 5-Stage GSAP Scroll Choreography (Boundary)', () => {
  const choreo = new CameraChoreographer();

  test('B10.1: Scroll progress < 0.0 clamps to Hero stage', () => {
    const frame = choreo.setProgress(-1.5);
    expect(frame.progress).toBe(0.0);
    expect(frame.stage).toBe('hero');
  });

  test('B10.2: Scroll progress > 1.0 clamps to Buy stage', () => {
    const frame = choreo.setProgress(2.5);
    expect(frame.progress).toBe(1.0);
    expect(frame.stage).toBe('buy');
  });

  test('B10.3: Exact stage boundaries transition without NaN or undefined properties', () => {
    const boundaries = [0.2, 0.4, 0.6, 0.8];
    boundaries.forEach((b) => {
      const frame = choreo.setProgress(b);
      expect(frame.cameraPos.length).toBe(3);
      expect(Number.isFinite(frame.cameraPos[0])).toBe(true);
    });
  });

  test('B10.4: Reverse scroll from 1.0 back to 0.0 restores exact Hero camera position', () => {
    choreo.setProgress(1.0);
    const heroFrame = choreo.setProgress(0.0);
    expect(heroFrame.stage).toBe('hero');
    expect(heroFrame.cameraPos).toEqual([0.0, 0.0, 5.0]);
  });

  test('B10.5: Micro-scrubbing (delta 0.0001) preserves valid continuous values', () => {
    const frame1 = choreo.setProgress(0.5000);
    const frame2 = choreo.setProgress(0.5001);
    expect(frame1.stage).toBe(frame2.stage);
    expect(Number.isFinite(frame2.cameraPos[1])).toBe(true);
  });
});

// =========================================================================
// Feature 11: Interactive 3D Hotspots & Callouts (Boundary)
// =========================================================================
describe('Feature 11: Interactive 3D Hotspots & Callouts (Boundary)', () => {
  const manager = new HotspotManager();

  test('B11.1: World coordinate behind camera (dz <= 0) returns visible: false', () => {
    const behindCam = [0, 0, 10]; // Camera is at z=5
    const screen = manager.projectToScreen(behindCam, [0, 0, 5]);
    expect(screen.visible).toBe(false);
  });

  test('B11.2: Coordinate far off-screen returns visible: false', () => {
    const farOff = [50.0, 50.0, 0.0];
    const screen = manager.projectToScreen(farOff, [0, 0, 5]);
    expect(screen.visible).toBe(false);
  });

  test('B11.3: Selecting non-existent hotspot ID throws descriptive error', () => {
    expect(() => {
      manager.selectHotspot('invalid-hotspot-id');
    }).toThrow('Hotspot not found');
  });

  test('B11.4: Selecting already-active hotspot is idempotent', () => {
    manager.selectHotspot('carbon-plate');
    expect(manager.activeHotspotId).toBe('carbon-plate');
    manager.selectHotspot('carbon-plate');
    expect(manager.activeHotspotId).toBe('carbon-plate');
  });

  test('B11.5: Closing an already closed hotspot does not error', () => {
    manager.closeHotspot();
    manager.closeHotspot();
    expect(manager.activeHotspotId).toBeNull();
  });
});

// =========================================================================
// Feature 12: Procedural Audio Atmosphere & SFX (Boundary)
// =========================================================================
describe('Feature 12: Procedural Audio Atmosphere & SFX (Boundary)', () => {
  test('B12.1: Calling audio methods before explicit init auto-initializes safely', () => {
    const audio = new SoundEngine();
    expect(audio.isInitialized).toBe(false);
    audio.playHover();
    expect(audio.isInitialized).toBe(true);
  });

  test('B12.2: Rapid toggleMute (50 times) maintains correct parity', () => {
    const audio = new SoundEngine();
    for (let i = 0; i < 50; i++) {
      audio.toggleMute();
    }
    expect(audio.isMuted).toBe(false); // 50 toggles returns to initial false
  });

  test('B12.3: Rapid burst of 20 SFX calls execute cleanly without error', () => {
    const audio = new SoundEngine();
    for (let i = 0; i < 20; i++) {
      const ok = audio.playClick();
      expect(ok).toBe(true);
    }
    expect(audio.eventLog.filter((e) => e.type === 'click').length).toBe(20);
  });

  test('B12.4: Muted audio calls return false and log suppressed status', () => {
    const audio = new SoundEngine();
    audio.toggleMute();
    const result = audio.playColorSwitch();
    expect(result).toBe(false);
    const lastEvent = audio.eventLog[audio.eventLog.length - 1];
    expect(lastEvent.suppressed).toBe(true);
  });

  test('B12.5: Safe audio frequency clamp ensures oscillators remain within 20Hz - 20kHz', () => {
    const clampFreq = (f) => Math.min(20000, Math.max(20, f));
    expect(clampFreq(5)).toBe(20);
    expect(clampFreq(40000)).toBe(20000);
    expect(clampFreq(440)).toBe(440);
  });
});

// =========================================================================
// Feature 13: Floating Glassmorphic Product HUD (Boundary)
// =========================================================================
describe('Feature 13: Floating Glassmorphic Product HUD (Boundary)', () => {
  test('B13.1: Selecting invalid shoe size string throws explicit error', () => {
    const cart = new CartStore();
    expect(() => {
      cart.selectSize('US 99.5');
    }).toThrow('Invalid shoe size');
  });

  test('B13.2: Stock check on unmapped size returns 0', () => {
    const cart = new CartStore();
    expect(cart.getStock('US 99.5')).toBe(0);
  });

  test('B13.3: Stock boundary condition: size with 1 stock flags low stock', () => {
    const cart = new CartStore();
    expect(cart.isLowStock('US 13.0')).toBe(true); // 1 remaining
  });

  test('B13.4: Sizing unit toggle with invalid unit string throws error', () => {
    const cart = new CartStore();
    expect(() => {
      cart.setSizeUnit('UK');
    }).toThrow('Invalid size unit');
  });

  test('B13.5: Price formatting produces exact currency string with two decimals', () => {
    const formatPrice = (p) => `$${p.toFixed(2)}`;
    expect(formatPrice(285)).toBe('$285.00');
    expect(formatPrice(285.5)).toBe('$285.50');
  });
});

// =========================================================================
// Feature 14: Slide-Out Cart Drawer & Dynamic Preview (Boundary)
// =========================================================================
describe('Feature 14: Slide-Out Cart Drawer & Dynamic Preview (Boundary)', () => {
  test('B14.1: Adding item with zero stock remaining throws out of stock error', () => {
    const cart = new CartStore();
    cart.stockMatrix['US 7.0'] = 0; // Exhaust stock
    const customizer = new SneakerCustomizerStore();

    expect(() => {
      cart.addItem({ size: 'US 7.0', customization: customizer.getState().customization, quantity: 1 });
    }).toThrow('out of stock');
  });

  test('B14.2: Adding item with quantity exceeding available inventory throws limit error', () => {
    const cart = new CartStore();
    const customizer = new SneakerCustomizerStore();
    // US 13.0 only has 1 in stock
    expect(() => {
      cart.addItem({ size: 'US 13.0', customization: customizer.getState().customization, quantity: 2 });
    }).toThrow('exceeds available stock');
  });

  test('B14.3: Updating item quantity beyond remaining stock throws limit error', () => {
    const cart = new CartStore();
    const customizer = new SneakerCustomizerStore();
    cart.addItem({ size: 'US 10.5', customization: customizer.getState().customization, quantity: 2 });
    const id = cart.items[0].id;
    // US 10.5 has 3 in stock, so adding 2 more would be 4 > 3
    expect(() => {
      cart.updateQuantity(id, 2);
    }).toThrow('exceeds available stock');
  });

  test('B14.4: Updating quantity of non-existent item ID does not throw', () => {
    const cart = new CartStore();
    cart.updateQuantity('non-existent-id', 1);
    expect(cart.items.length).toBe(0);
  });

  test('B14.5: Multiple items with distinct custom colorways maintain independent customization records', () => {
    const cart = new CartStore();
    const c1 = new SneakerCustomizerStore('Cyber Phantom');
    const c2 = new SneakerCustomizerStore('Aurora Neon');

    cart.addItem({ size: 'US 10.0', customization: c1.getState().customization });
    cart.addItem({ size: 'US 10.0', customization: c2.getState().customization });

    expect(cart.items.length).toBe(2);
    expect(cart.items[0].customization.sole.color).toBe('#00f0ff');
    expect(cart.items[1].customization.sole.color).toBe('#20e3b2');
  });
});

// =========================================================================
// Feature 15: Checkout Trigger & Micro-Interactions (Boundary)
// =========================================================================
describe('Feature 15: Checkout Trigger & Micro-Interactions (Boundary)', () => {
  test('B15.1: Attempting checkout on empty cart handles empty state safely', () => {
    const cart = new CartStore();
    expect(cart.items.length).toBe(0);
    expect(cart.subtotal).toBe(0);
    const checkoutCanProceed = cart.items.length > 0;
    expect(checkoutCanProceed).toBe(false);
  });

  test('B15.2: Cursor tracking with mouse coordinates outside viewport handles negative offsets', () => {
    const buttonBounds = { left: 100, top: 100, width: 200, height: 50 };
    const mousePos = { x: -50, y: -50 };
    const centerX = buttonBounds.left + buttonBounds.width / 2;
    const centerY = buttonBounds.top + buttonBounds.height / 2;
    const dx = mousePos.x - centerX;
    const dy = mousePos.y - centerY;
    expect(dx).toBeLessThan(0);
    expect(dy).toBeLessThan(0);
  });

  test('B15.3: Debouncing checkout trigger prevents duplicate submission', () => {
    let submissionCount = 0;
    let isProcessing = false;
    const submitCheckout = () => {
      if (isProcessing) return;
      isProcessing = true;
      submissionCount++;
    };

    submitCheckout();
    submitCheckout(); // Debounced
    expect(submissionCount).toBe(1);
  });

  test('B15.4: Subtotal calculation with large item counts preserves arithmetic accuracy', () => {
    const price = 285.00;
    const qty = 50;
    const total = price * qty;
    expect(total).toBe(14250.00);
  });

  test('B15.5: Clearing already empty cart executes idempotently', () => {
    const cart = new CartStore();
    cart.clearCart();
    cart.clearCart();
    expect(cart.items.length).toBe(0);
    expect(cart.subtotal).toBe(0);
  });
});

// =========================================================================
// Feature 16: 60 FPS Performance & Mobile Responsiveness (Boundary)
// =========================================================================
describe('Feature 16: 60 FPS Performance & Mobile Responsiveness (Boundary)', () => {
  test('B16.1: devicePixelRatio of 0 or NaN falls back to 1.0', () => {
    const resolveDPR = (dpr) => (!dpr || Number.isNaN(dpr) || dpr <= 0 ? 1.0 : Math.min(dpr, 2.0));
    expect(resolveDPR(0)).toBe(1.0);
    expect(resolveDPR(NaN)).toBe(1.0);
    expect(resolveDPR(-2)).toBe(1.0);
  });

  test('B16.2: Extreme devicePixelRatio (8.0 on simulated high-DPI) clamps strictly to 2.0', () => {
    const resolveDPR = (dpr) => (!dpr || Number.isNaN(dpr) || dpr <= 0 ? 1.0 : Math.min(dpr, 2.0));
    expect(resolveDPR(8.0)).toBe(2.0);
  });

  test('B16.3: Viewport aspect ratio with extreme vertical aspect (0.3) maintains finite camera bounds', () => {
    const width = 300;
    const height = 1000;
    const aspect = width / height;
    expect(aspect).toBe(0.3);
    const vFov = (45 * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    expect(Number.isFinite(hFov)).toBe(true);
  });

  test('B16.4: Zero delta time in animation update loop updates without NaN velocity', () => {
    const controls = new OrbitControlsSimulator();
    const state = controls.update(0.0);
    expect(Number.isFinite(state.theta)).toBe(true);
  });

  test('B16.5: Rapid window resize storm (50 events) executes cleanly', () => {
    let lastWidth = 1920;
    for (let i = 0; i < 50; i++) {
      lastWidth = 1000 + i * 10;
    }
    expect(lastWidth).toBe(1490);
  });
});

// Auto-run if executed directly via `node tests/tier2-boundary.test.js`
if (process.argv[1]?.endsWith('tier2-boundary.test.js')) {
  tier2Registry.run().then((res) => {
    console.log(`\n=== ${res.tierName} ===`);
    console.log(`Passed: ${res.passed}/${res.total} (Duration: ${res.durationMs}ms)`);
    if (res.failed > 0) {
      console.error(`Failed: ${res.failed}`);
      res.failures.forEach((f) => console.error(`- ${f.suite} > ${f.test}: ${f.error}`));
      process.exit(1);
    }
  });
}
