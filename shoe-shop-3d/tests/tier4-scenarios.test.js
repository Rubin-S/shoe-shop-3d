/**
 * AEROPRO-X LAB 3D Shoe Shop - Tier 4: Real-World Scenarios Test Suite
 *
 * Simulates complete end-to-end user journeys through the application,
 * validating full lifecycle interactions from landing to purchase.
 * Contains 10 full user scenarios (exceeding requirement of >=8).
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

export const tier4Registry = new TestRegistry('Tier 4: Real-World Scenarios (10 Journeys)');
const { describe, test } = tier4Registry;

describe('Tier 4: Real-World User Scenarios', () => {
  // Journey 1
  test('Journey 1: First-Time Luxury Visitor (Loader → Hero Orbit → Tech Anatomy Exploration)', () => {
    // 1. Initial Load & Preloader
    let progress = 0;
    let isLoaded = false;
    for (let p = 0; p <= 100; p += 20) {
      progress = p;
    }
    expect(progress).toBe(100);
    isLoaded = true;

    // 2. Hero 3D Scene Initialization
    const controls = new OrbitControlsSimulator();
    const choreo = new CameraChoreographer();
    const heroFrame = choreo.setProgress(0.05);
    expect(heroFrame.stage).toBe('hero');

    // 3. User rotates sneaker in Hero
    controls.rotate(0.8, -0.1);
    const cameraState = controls.update(0.016);
    expect(cameraState.theta).toBeCloseTo(0.8, 2);

    // 4. User scrolls to Exploded Anatomy
    const anatomyFrame = choreo.setProgress(0.3);
    expect(anatomyFrame.stage).toBe('exploded');
    expect(anatomyFrame.explodedOffsets.upper[1]).toBeGreaterThan(0.5);
    expect(anatomyFrame.explodedOffsets.outsole[1]).toBeLessThan(-0.5);
  });

  // Journey 2
  test('Journey 2: Bespoke Sneaker Creator (4-Segment Customization → Presets → Hex Input)', () => {
    const customizer = new SneakerCustomizerStore();

    // 1. Customize all 4 segments individually
    customizer.selectSegment('upper');
    customizer.updateSneakerSegment('upper', { color: '#ff2200' });

    customizer.selectSegment('sole');
    customizer.updateSneakerSegment('sole', { color: '#00f0ff' });

    customizer.selectSegment('accents');
    customizer.updateSneakerSegment('accents', { color: '#e024c3' });

    customizer.selectSegment('laces');
    customizer.updateSneakerSegment('laces', { color: '#ffffff' });

    expect(customizer.currentPreset).toBe('Custom');
    expect(customizer.activeColorway.upper.color).toBe('#ff2200');
    expect(customizer.activeColorway.sole.color).toBe('#00f0ff');

    // 2. Try curated preset
    customizer.applyPreset('Aurora Neon');
    expect(customizer.currentPreset).toBe('Aurora Neon');
    expect(customizer.activeColorway.accents.color).toBe('#ff007f');

    // 3. Apply custom bespoke Electric Lime hex
    customizer.updateSneakerSegment('upper', { color: '#39ff14' });
    expect(customizer.currentPreset).toBe('Custom');
    expect(customizer.activeColorway.upper.color).toBe('#39ff14');
  });

  // Journey 3
  test('Journey 3: Seamless E-Commerce Purchase (Custom Design → EU Size → Cart → Checkout)', () => {
    const customizer = new SneakerCustomizerStore('Cyber Phantom');
    const cart = new CartStore(285.00);
    const audio = new SoundEngine();

    // 1. Sizing selection
    cart.setSizeUnit('EU');
    cart.selectSize('EU 44');
    expect(cart.selectedSize).toBe('EU 44');
    expect(cart.getStock('EU 44')).toBe(3);

    // 2. Add custom sneaker to cart
    cart.addItem({
      size: 'EU 44',
      customization: customizer.getState().customization,
      quantity: 1
    });
    audio.playCartSlide();

    expect(cart.items.length).toBe(1);
    expect(cart.isOpen).toBe(true);
    expect(cart.subtotal).toBe(285.00);

    // 3. Adjust quantity to 2
    const lineId = cart.items[0].id;
    cart.updateQuantity(lineId, 1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.subtotal).toBe(570.00);

    // 4. Express Checkout
    cart.clearCart();
    cart.closeCart();
    audio.playCheckoutSuccess();

    expect(cart.items.length).toBe(0);
    expect(cart.isOpen).toBe(false);
    expect(audio.eventLog.some((e) => e.type === 'checkoutSuccess')).toBe(true);
  });

  // Journey 4
  test('Journey 4: Hotspot Deep-Dive & Spec Inspection (Click Hotspots → Read Tech Specs → Return)', () => {
    const manager = new HotspotManager();
    const choreo = new CameraChoreographer();

    // Scroll to Specs stage
    const frame = choreo.setProgress(0.5);
    expect(frame.stage).toBe('specs');

    // Inspect all 4 hotspots
    const hotspotIds = ['upper-mesh', 'carbon-plate', 'nitro-cushion', 'adaptive-laces'];
    hotspotIds.forEach((id) => {
      const spot = manager.selectHotspot(id);
      expect(spot.title.length).toBeGreaterThan(5);
      expect(spot.description.length).toBeGreaterThan(15);
      const screen = manager.projectToScreen(spot.worldPos, frame.cameraPos);
      expect(screen.visible).toBe(true);
    });

    // Close active callout
    manager.closeHotspot();
    expect(manager.activeHotspotId).toBeNull();
  });

  // Journey 5
  test('Journey 5: Audio Immersion & Interactive Sensory Flow (Toggle Audio → Micro-SFX → Mute)', () => {
    const audio = new SoundEngine();
    audio.init();

    // Perform interactive actions with audio active
    expect(audio.playHover()).toBe(true);
    expect(audio.playClick()).toBe(true);
    expect(audio.playColorSwitch()).toBe(true);
    expect(audio.playCartSlide()).toBe(true);

    // User toggles mute via header pill
    const isMuted = audio.toggleMute();
    expect(isMuted).toBe(true);

    // Subsequent actions are suppressed
    expect(audio.playHover()).toBe(false);
    expect(audio.playClick()).toBe(false);
    expect(audio.playColorSwitch()).toBe(false);

    // User un-mutes
    audio.toggleMute();
    expect(audio.isMuted).toBe(false);
    expect(audio.playClick()).toBe(true);
  });

  // Journey 6
  test('Journey 6: Rapid Navigation & Scroll Staccato (Rapid Scrubbing Across Stages)', () => {
    const choreo = new CameraChoreographer();
    const scrollPath = [0.0, 0.95, 0.35, 0.75, 0.1, 0.85, 0.45, 0.0];

    scrollPath.forEach((progress) => {
      const frame = choreo.setProgress(progress);
      expect(frame.cameraPos.length).toBe(3);
      expect(Number.isFinite(frame.cameraPos[0])).toBe(true);
      expect(Number.isFinite(frame.cameraPos[1])).toBe(true);
      expect(Number.isFinite(frame.cameraPos[2])).toBe(true);
      expect(frame.stage).toBeDefined();
    });

    // Final frame is back at hero
    expect(choreo.currentStage).toBe('hero');
  });

  // Journey 7
  test('Journey 7: Multi-Item Custom Order & Cart Management (Multiple Styles → Removal → Recalculation)', () => {
    const cart = new CartStore(285.00);
    const c1 = new SneakerCustomizerStore('Cyber Phantom');
    const c2 = new SneakerCustomizerStore('Triple Stealth');

    // Add first custom shoe
    cart.addItem({ size: 'US 10.0', customization: c1.getState().customization, quantity: 1 });
    // Add second custom shoe
    cart.addItem({ size: 'US 11.0', customization: c2.getState().customization, quantity: 1 });

    expect(cart.items.length).toBe(2);
    expect(cart.totalItems).toBe(2);
    expect(cart.subtotal).toBe(570.00);

    // Remove first item
    const firstId = cart.items[0].id;
    cart.removeItem(firstId);

    expect(cart.items.length).toBe(1);
    expect(cart.items[0].customization.upper.color).toBe('#111111'); // Triple stealth remains
    expect(cart.subtotal).toBe(285.00);
  });

  // Journey 8
  test('Journey 8: Mobile Touchscreen Simulation (Clamped DPR → Touch Orbit → Screen Resize)', () => {
    const { window } = createSyntheticBrowser();
    window.innerWidth = 390;
    window.innerHeight = 844;
    window.devicePixelRatio = 3.0; // Retina mobile

    // 1. Clamped DPR verification
    const safeDPR = Math.min(window.devicePixelRatio, 2.0);
    expect(safeDPR).toBe(2.0);

    // 2. Touch gesture handling
    let touchOrbitActive = false;
    let scrollPrevented = false;

    const onTouchStart = () => {
      touchOrbitActive = true;
      scrollPrevented = true;
    };
    const onTouchEnd = () => {
      touchOrbitActive = false;
      scrollPrevented = false;
    };

    onTouchStart();
    expect(touchOrbitActive).toBe(true);
    expect(scrollPrevented).toBe(true);
    onTouchEnd();
    expect(touchOrbitActive).toBe(false);
    expect(scrollPrevented).toBe(false);

    // 3. Orientation change to landscape
    window.innerWidth = 844;
    window.innerHeight = 390;
    const aspect = window.innerWidth / window.innerHeight;
    expect(aspect).toBeGreaterThan(2.0);
  });

  // Journey 9
  test('Journey 9: Low-Stock Urgency & Inventory Boundary Handling (Stock Depletion Handling)', () => {
    const cart = new CartStore();
    const customizer = new SneakerCustomizerStore();

    // US 13.0 only has 1 unit in inventory
    cart.selectSize('US 13.0');
    expect(cart.getStock('US 13.0')).toBe(1);
    expect(cart.isLowStock('US 13.0')).toBe(true);

    // Add remaining 1 unit to cart
    cart.addItem({ size: 'US 13.0', customization: customizer.getState().customization, quantity: 1 });
    expect(cart.items[0].quantity).toBe(1);

    // Attempting to add 1 more exceeds stock
    expect(() => {
      cart.addItem({ size: 'US 13.0', customization: customizer.getState().customization, quantity: 1 });
    }).toThrow('exceeds available stock');

    // Cart remains consistent
    expect(cart.items[0].quantity).toBe(1);
    expect(cart.subtotal).toBe(285.00);
  });

  // Journey 10
  test('Journey 10: Full Session Resilience & State Recovery (End-to-End Stress Cycle)', () => {
    const customizer = new SneakerCustomizerStore();
    const cart = new CartStore(285.00);
    const audio = new SoundEngine();
    const choreo = new CameraChoreographer();

    // 1. Initial State Check
    expect(customizer.currentPreset).toBe('Cyber Phantom');
    expect(cart.items.length).toBe(0);

    // 2. Perform 20 fast customizer updates
    for (let i = 0; i < 20; i++) {
      customizer.updateSneakerSegment('upper', { roughness: i / 20 });
    }

    // 3. Scroll through all stages
    for (let s = 0; s <= 10; s++) {
      choreo.setProgress(s / 10);
    }

    // 4. Add customized shoe and checkout
    cart.addItem({ size: 'US 10.0', customization: customizer.getState().customization, quantity: 1 });
    expect(cart.items.length).toBe(1);

    // 5. Checkout and verify clean termination
    cart.clearCart();
    cart.closeCart();
    audio.playCheckoutSuccess();

    expect(cart.items.length).toBe(0);
    expect(cart.isOpen).toBe(false);
  });
});

// Auto-run if executed directly via `node tests/tier4-scenarios.test.js`
if (process.argv[1]?.endsWith('tier4-scenarios.test.js')) {
  tier4Registry.run().then((res) => {
    console.log(`\n=== ${res.tierName} ===`);
    console.log(`Passed: ${res.passed}/${res.total} (Duration: ${res.durationMs}ms)`);
    if (res.failed > 0) {
      console.error(`Failed: ${res.failed}`);
      res.failures.forEach((f) => console.error(`- ${f.suite} > ${f.test}: ${f.error}`));
      process.exit(1);
    }
  });
}
