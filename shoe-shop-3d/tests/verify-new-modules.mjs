/**
 * tests/verify-new-modules.mjs
 *
 * Verifies real source code modules created in src/:
 * - src/store/useCartStore.ts
 * - src/components/3d/ChoreographyConfig.ts
 * - src/store/useChoreographyStore.ts
 * - src/utils/audio.ts
 */

import { CartStoreEngine } from '../src/store/useCartStore.ts';
import { getChoreographyFrame, CAMERA_STAGES, HOTSPOT_ITEMS } from '../src/components/3d/ChoreographyConfig.ts';
import { ChoreographyStoreEngine, hotspotsStoreEngine } from '../src/store/useChoreographyStore.ts';
import {
  audioEngine,
  startAmbient,
  stopAmbient,
  playRotation,
  playExplodeSnap,
  playCheckoutSuccess,
  playHover,
  playColorSwitch,
  playClick,
} from '../src/utils/audio.ts';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    passCount++;
    console.log(`  ✓ ${message}`);
  } else {
    failCount++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    failCount++;
    console.error(`  ✗ FAIL: Expected throw: ${message}`);
  } catch {
    passCount++;
    console.log(`  ✓ Threw as expected: ${message}`);
  }
}

console.log('\n--- VERIFYING CART STORE ENGINE ---');
const cart = new CartStoreEngine(285.0);
assert(cart.basePrice === 285.0, 'Base price initialized to 285.0');
assert(cart.sizeUnit === 'US', 'Default size unit is US');
assert(cart.selectedSize === 'US 10.5', 'Default size is US 10.5');
assert(cart.getStock('US 10.5') === 3, 'US 10.5 stock is 3');
assert(cart.isLowStock('US 10.5') === true, 'US 10.5 is low stock (3 units)');

// Size unit toggle
cart.setSizeUnit('EU');
assert(cart.sizeUnit === 'EU', 'Switched size unit to EU');
assert(cart.selectedSize.startsWith('EU'), 'Selected size normalized to EU');
cart.setSizeUnit('US');
assert(cart.sizeUnit === 'US', 'Switched back to US');

// Add item
const mockCustomization = {
  upper: { color: '#141518' },
  sole: { color: '#D4FF00' },
  accents: { color: '#E8ECEF' },
  laces: { color: '#0A0B0D' }
};

cart.addItem({
  size: 'US 10.5',
  customization: mockCustomization,
  quantity: 2
});

assert(cart.items.length === 1, '1 item added to cart');
assert(cart.items[0].quantity === 2, 'Quantity is 2');
assert(cart.subtotal === 570.0, 'Subtotal is $570.00');
assert(cart.isOpen === true, 'Cart automatically opened on item addition');

// Adding 2 more should exceed stock of 3 (2 + 2 = 4 > 3)
assertThrows(() => {
  cart.addItem({
    size: 'US 10.5',
    customization: mockCustomization,
    quantity: 2
  });
}, 'Exceeding available stock throws error');

// Adding 1 more should succeed (2 + 1 = 3 <= 3)
cart.addItem({
  size: 'US 10.5',
  customization: mockCustomization,
  quantity: 1
});
assert(cart.items[0].quantity === 3, 'Merged duplicate item up to max stock of 3');

// Promo code
assert(cart.applyPromoCode('AERO20') === true, 'AERO20 promo code accepted');
assert(cart.discount === cart.subtotal * 0.20, 'AERO20 applies 20% discount');
assert(cart.total === cart.subtotal * 0.80, 'Total reflects discount');

// Checkout & real-time inventory deduction
const order = cart.checkout();
assert(order.orderId.startsWith('ORD-'), 'Order created with valid order ID');
assert(cart.items.length === 0, 'Cart emptied after checkout');
assert(cart.isOrderComplete === true, 'Order marked complete');
assert(cart.getStock('US 10.5') === 0, 'Stock decremented to 0 for purchased size US 10.5');
assert(cart.isLowStock('US 10.5') === false, '0 stock is not low stock (it is sold out)');

console.log('\n--- VERIFYING CHOREOGRAPHY & STAGES ---');
const heroFrame = getChoreographyFrame(0.0);
assert(heroFrame.stage === 'hero', '0.0 progress corresponds to hero stage');
assert(heroFrame.explodedOffsets.upper[1] === 0, 'Upper exploded offset is 0 at 0.0');

const heroFrame2 = getChoreographyFrame(0.10);
assert(heroFrame2.stage === 'hero', '0.10 progress corresponds to hero stage');
assert(heroFrame2.explodedOffsets.upper[1] === 0, 'Upper exploded offset remains 0 during hero reading');

const explodedFrame = getChoreographyFrame(0.3);
assert(explodedFrame.stage === 'exploded', '0.3 progress corresponds to exploded stage');
assert(explodedFrame.explodedOffsets.upper[1] >= 0.15, 'Upper is elevated at peak exploded stage');

const customizerFrame = getChoreographyFrame(0.75);
assert(customizerFrame.stage === 'customizer', '0.75 progress corresponds to customizer stage');
assert(customizerFrame.explodedOffsets.upper[1] === 0, 'Sneaker re-assembled in customizer stage');

const buyFrame = getChoreographyFrame(0.95);
assert(buyFrame.stage === 'buy', '0.95 progress corresponds to buy stage');
assert(buyFrame.explodedOffsets.upper[1] === 0, 'Sneaker assembled at beauty angle in buy stage');

assert(HOTSPOT_ITEMS.length === 4, '4 hotspots configured');
assert(HOTSPOT_ITEMS.some(h => h.id === 'carbon-plate'), 'Carbon plate hotspot configured');
assert(HOTSPOT_ITEMS.every(h => Boolean(h.rigGroup)), 'All hotspots mapped to a 3D exploded rigGroup');

// Hotspots Store Engine
hotspotsStoreEngine.setPositions({
  'upper-mesh': { x: 100, y: 200, visible: true }
});
assert(hotspotsStoreEngine.getPositions()['upper-mesh'].x === 100, 'hotspotsStoreEngine stores projected coordinates');

console.log('\n--- VERIFYING AUDIO METHODS ---');
// In headless Node, audio methods will safely fall back / return false without throwing
assert(typeof startAmbient === 'function', 'startAmbient exported');
assert(typeof stopAmbient === 'function', 'stopAmbient exported');
assert(typeof playRotation === 'function', 'playRotation exported');
assert(typeof playExplodeSnap === 'function', 'playExplodeSnap exported');
assert(typeof playCheckoutSuccess === 'function', 'playCheckoutSuccess exported');
assert(typeof playHover === 'function', 'playHover exported');
assert(typeof playColorSwitch === 'function', 'playColorSwitch exported');
assert(typeof playClick === 'function', 'playClick exported');

assert(startAmbient() === false || true, 'startAmbient callable without throwing');
assert(playRotation() === false || true, 'playRotation callable without throwing');
assert(stopAmbient() === false || true, 'stopAmbient callable without throwing');

console.log('\n--- VERIFYING THEME STORE ENGINE ---');
import { themeStoreEngine } from '../src/store/useThemeStore.ts';
const initialThemeState = themeStoreEngine.getState();
assert(initialThemeState.theme === 'light' || initialThemeState.theme === 'dark', 'Theme state initialized with valid mode');
assert(typeof initialThemeState.isLight === 'boolean', 'isLight boolean flag available');
assert(typeof initialThemeState.isDark === 'boolean', 'isDark boolean flag available');

// Toggle theme
const newTheme = themeStoreEngine.toggleTheme();
assert(newTheme !== initialThemeState.theme, 'toggleTheme changes theme mode');
assert(themeStoreEngine.getState().theme === newTheme, 'themeStoreEngine state reflects toggled theme');

// Set theme explicitly
themeStoreEngine.setTheme('light');
assert(themeStoreEngine.getState().theme === 'light', 'setTheme("light") sets theme to light');
assert(themeStoreEngine.getState().isLight === true, 'isLight is true in light mode');
assert(themeStoreEngine.getState().isDark === false, 'isDark is false in light mode');

themeStoreEngine.setTheme('dark');
assert(themeStoreEngine.getState().theme === 'dark', 'setTheme("dark") sets theme to dark');
assert(themeStoreEngine.getState().isDark === true, 'isDark is true in dark mode');

// Reset to light as user requested
themeStoreEngine.setTheme('light');
assert(themeStoreEngine.getState().theme === 'light', 'Default theme settled on light');

console.log(`\n=========================================`);
console.log(`NEW MODULES VERIFICATION: ${passCount} passed, ${failCount} failed`);
console.log(`=========================================\n`);

if (failCount > 0) {
  process.exit(1);
}
