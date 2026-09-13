/**
 * AEROPRO-X LAB 3D Shoe Shop - Unified E2E Test Harness & Synthetic Environment
 *
 * Provides a self-contained, opaque-box simulation environment for testing all 16 features
 * defined in PROJECT.md and ORIGINAL_REQUEST.md without external npm dependencies.
 */

// --- Micro Assertion & Expect Library ---
export class Expectation {
  constructor(actual, isNot = false) {
    this.actual = actual;
    this.isNot = isNot;
  }

  get not() {
    return new Expectation(this.actual, !this.isNot);
  }

  _assert(condition, message) {
    const passed = this.isNot ? !condition : Boolean(condition);
    if (!passed) {
      const prefix = this.isNot ? 'Expected NOT: ' : 'Expected: ';
      throw new Error(`${prefix}${message}. Got: ${JSON.stringify(this.actual)}`);
    }
  }

  toBe(expected) {
    this._assert(
      Object.is(this.actual, expected),
      `to be === ${JSON.stringify(expected)}`
    );
  }

  toEqual(expected) {
    const actualStr = JSON.stringify(this.actual);
    const expectedStr = JSON.stringify(expected);
    this._assert(
      actualStr === expectedStr,
      `to deeply equal ${expectedStr}`
    );
  }

  toBeCloseTo(expected, precision = 2) {
    const diff = Math.abs(this.actual - expected);
    const tolerance = Math.pow(10, -precision) / 2;
    this._assert(
      diff <= tolerance,
      `to be close to ${expected} (diff: ${diff.toFixed(6)}, tolerance: ${tolerance})`
    );
  }

  toBeGreaterThan(expected) {
    this._assert(this.actual > expected, `to be > ${expected}`);
  }

  toBeGreaterThanOrEqual(expected) {
    this._assert(this.actual >= expected, `to be >= ${expected}`);
  }

  toBeLessThan(expected) {
    this._assert(this.actual < expected, `to be < ${expected}`);
  }

  toBeLessThanOrEqual(expected) {
    this._assert(this.actual <= expected, `to be <= ${expected}`);
  }

  toBeTruthy() {
    this._assert(Boolean(this.actual), 'to be truthy');
  }

  toBeFalsy() {
    this._assert(!this.actual, 'to be falsy');
  }

  toBeNull() {
    this._assert(this.actual === null, 'to be null');
  }

  toBeUndefined() {
    this._assert(this.actual === undefined, 'to be undefined');
  }

  toBeDefined() {
    this._assert(this.actual !== undefined, 'to be defined');
  }

  toContain(item) {
    if (typeof this.actual === 'string' || Array.isArray(this.actual)) {
      this._assert(this.actual.includes(item), `to contain ${JSON.stringify(item)}`);
    } else if (this.actual instanceof Set || this.actual instanceof Map) {
      this._assert(this.actual.has(item), `to contain ${JSON.stringify(item)}`);
    } else {
      throw new Error(`toContain called on non-collection: ${typeof this.actual}`);
    }
  }

  toMatch(regex) {
    this._assert(regex.test(String(this.actual)), `to match regex ${regex}`);
  }

  toHaveLength(len) {
    this._assert(
      this.actual && this.actual.length === len,
      `to have length ${len} (actual: ${this.actual ? this.actual.length : 'undefined'})`
    );
  }

  toHaveProperty(prop, value) {
    const hasProp = this.actual && Object.prototype.hasOwnProperty.call(this.actual, prop);
    if (value !== undefined) {
      this._assert(hasProp && this.actual[prop] === value, `to have property '${prop}' === ${JSON.stringify(value)}`);
    } else {
      this._assert(hasProp, `to have property '${prop}'`);
    }
  }

  toThrow(expectedError) {
    let threw = false;
    let error;
    try {
      if (typeof this.actual !== 'function') {
        throw new Error('toThrow requires a function');
      }
      this.actual();
    } catch (e) {
      threw = true;
      error = e;
    }
    if (expectedError && threw) {
      if (typeof expectedError === 'string') {
        this._assert(error.message.includes(expectedError), `to throw error containing "${expectedError}"`);
      } else if (expectedError instanceof RegExp) {
        this._assert(expectedError.test(error.message), `to throw error matching ${expectedError}`);
      }
    } else {
      this._assert(threw, 'to throw an error');
    }
  }
}

export function expect(actual) {
  return new Expectation(actual);
}

// --- Test Suite Collector ---
export class TestRegistry {
  constructor(tierName) {
    this.tierName = tierName;
    this.suites = [];
    this.currentSuite = null;
    this.describe = this.describe.bind(this);
    this.test = this.test.bind(this);
    this.it = this.it.bind(this);
  }

  describe(name, fn) {
    const suite = { name, tests: [], beforeAll: [], afterAll: [], beforeEach: [], afterEach: [] };
    this.suites.push(suite);
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    fn();
    this.currentSuite = prevSuite;
  }

  test(name, fn) {
    if (!this.currentSuite) {
      this.describe('Default Suite', () => {});
    }
    this.currentSuite.tests.push({ name, fn });
  }

  it(name, fn) {
    this.test(name, fn);
  }

  async run() {
    let passed = 0;
    let failed = 0;
    const failures = [];
    const startTime = Date.now();

    for (const suite of this.suites) {
      for (const t of suite.tests) {
        try {
          await t.fn();
          passed++;
        } catch (err) {
          failed++;
          failures.push({
            suite: suite.name,
            test: t.name,
            error: err.message,
            stack: err.stack
          });
        }
      }
    }

    const durationMs = Date.now() - startTime;
    return {
      tierName: this.tierName,
      total: passed + failed,
      passed,
      failed,
      durationMs,
      failures
    };
  }
}

// --- Synthetic DOM & Browser Environment ---
export function createSyntheticBrowser(initialUrl = 'http://localhost:5173') {
  const listeners = new Map();
  const storage = new Map();

  const window = {
    location: new URL(initialUrl),
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 2.0,
    scrollX: 0,
    scrollY: 0,
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
      clear: () => storage.clear()
    },
    addEventListener: (evt, cb) => {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(cb);
    },
    removeEventListener: (evt, cb) => {
      if (!listeners.has(evt)) return;
      listeners.set(evt, listeners.get(evt).filter((l) => l !== cb));
    },
    dispatchEvent: (evt) => {
      const list = listeners.get(evt.type) || [];
      list.forEach((cb) => cb(evt));
      return true;
    },
    matchMedia: (query) => ({
      matches: query.includes('min-width: 1024px') ? true : false,
      media: query,
      addListener: () => {},
      removeListener: () => {}
    }),
    requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    scrollTo: (opts) => {
      if (typeof opts === 'object') {
        window.scrollY = opts.top ?? window.scrollY;
        window.scrollX = opts.left ?? window.scrollX;
      }
      window.dispatchEvent({ type: 'scroll', scrollY: window.scrollY });
    }
  };

  const document = {
    title: 'AEROPRO-X LAB | Exclusive 3D Sneaker Experience',
    body: {
      classList: new Set(['dark', 'bg-black', 'text-white']),
      style: {},
      children: [],
      appendChild: (child) => {
        document.body.children.push(child);
        return child;
      }
    },
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        attributes: new Map(),
        style: {},
        classList: new Set(),
        children: [],
        addEventListener: (e, cb) => {
          if (!listeners.has(e)) listeners.set(e, []);
          listeners.get(e).push(cb);
        },
        dispatchEvent: (e) => {
          const cbs = listeners.get(e.type) || [];
          cbs.forEach((cb) => cb(e));
        },
        setAttribute: (k, v) => el.attributes.set(k, String(v)),
        getAttribute: (k) => el.attributes.get(k) ?? null,
        appendChild: (child) => el.children.push(child),
        getContext: (type) => {
          if (type === 'webgl' || type === 'webgl2') {
            return createSyntheticWebGLContext();
          }
          if (type === '2d') {
            return createSynthetic2DContext();
          }
          return null;
        }
      };
      return el;
    }
  };

  return { window, document };
}

// --- Synthetic WebGL Context ---
export function createSyntheticWebGLContext() {
  return {
    canvas: { width: 1920, height: 1080 },
    drawingBufferWidth: 1920,
    drawingBufferHeight: 1080,
    viewport: (x, y, w, h) => {},
    clearColor: (r, g, b, a) => {},
    clear: (mask) => {},
    enable: (cap) => {},
    disable: (cap) => {},
    createShader: (type) => ({ type, compiled: true }),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    createProgram: () => ({ linked: true }),
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    useProgram: () => {},
    createBuffer: () => ({ id: Math.random() }),
    bindBuffer: () => {},
    bufferData: () => {},
    createTexture: () => ({ id: Math.random() }),
    bindTexture: () => {},
    texImage2D: () => {},
    texParameteri: () => {},
    drawArrays: () => {},
    drawElements: () => {},
    getExtension: (name) => ({ name, supported: true }),
    getParameter: (param) => {
      if (param === 0x1f02) return 'WebGL 2.0 (Synthetic Test Context)';
      if (param === 0x1f00) return 'Three.js / Synthetic WebGL';
      return 1024;
    }
  };
}

// --- Synthetic 2D Canvas Context for Procedural Textures ---
export function createSynthetic2DContext() {
  const pixelData = new Uint8ClampedArray(512 * 512 * 4);
  return {
    canvas: { width: 512, height: 512 },
    fillStyle: '#000000',
    fillRect: () => {},
    createImageData: (w, h) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4)
    }),
    putImageData: (imgData, x, y) => {
      for (let i = 0; i < Math.min(imgData.data.length, pixelData.length); i++) {
        pixelData[i] = imgData.data[i];
      }
    },
    getImageData: (x, y, w, h) => ({
      width: w,
      height: h,
      data: pixelData
    })
  };
}

// --- Synthetic Procedural Texture Generator Engine ---
export class ProceduralTextureEngine {
  static generateNormalMap(type, size = 512) {
    if (!['leather', 'mesh', 'rubber'].includes(type)) {
      throw new Error(`Unknown procedural texture type: ${type}`);
    }
    const canvas = { width: size, height: size };
    const buffer = new Uint8ClampedArray(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        let nx = 128;
        let ny = 128;
        let nz = 255;

        if (type === 'leather') {
          // Cellular micro-tumbled leather grain
          const n = (Math.sin(x * 0.15) * Math.cos(y * 0.15) * 40);
          nx = Math.min(255, Math.max(0, 128 + Math.round(n)));
          ny = Math.min(255, Math.max(0, 128 + Math.round(n * 0.8)));
        } else if (type === 'mesh') {
          // Interlocking athletic mesh weave pattern
          const weave = (Math.sin(x * 0.5) + Math.cos(y * 0.5)) * 50;
          nx = Math.min(255, Math.max(0, 128 + Math.round(weave)));
          ny = Math.min(255, Math.max(0, 128 - Math.round(weave)));
        } else if (type === 'rubber') {
          // Micro-serrated rubber sole tread
          const tread = (x % 8 < 4 ? 45 : -45);
          nx = Math.min(255, Math.max(0, 128 + tread));
          ny = 128;
        }

        buffer[idx] = nx;     // Normal X
        buffer[idx + 1] = ny; // Normal Y
        buffer[idx + 2] = nz; // Normal Z (perpendicular blue channel)
        buffer[idx + 3] = 255;// Alpha
      }
    }

    return {
      type,
      size,
      data: buffer,
      format: 'RGBA',
      isNormalMap: true
    };
  }
}

// --- Synthetic PBR Material System ---
export class PBRMaterialSystem {
  static getPresetProperties(segmentName) {
    switch (segmentName) {
      case 'upper':
        return {
          roughness: 0.42,
          metalness: 0.05,
          clearcoat: 0.25,
          clearcoatRoughness: 0.1,
          reflectivity: 0.5,
          normalScale: [0.8, 0.8]
        };
      case 'sole':
        return {
          roughness: 0.65,
          metalness: 0.10,
          clearcoat: 0.10,
          clearcoatRoughness: 0.2,
          reflectivity: 0.3,
          normalScale: [1.5, 1.5]
        };
      case 'accents':
        return {
          roughness: 0.15,
          metalness: 0.85,
          clearcoat: 0.90,
          clearcoatRoughness: 0.05,
          reflectivity: 0.95,
          normalScale: [0.3, 0.3]
        };
      case 'laces':
        return {
          roughness: 0.75,
          metalness: 0.02,
          clearcoat: 0.0,
          clearcoatRoughness: 0.0,
          reflectivity: 0.2,
          normalScale: [1.2, 1.2]
        };
      default:
        return {
          roughness: 0.5,
          metalness: 0.5,
          clearcoat: 0.0,
          reflectivity: 0.5,
          normalScale: [1.0, 1.0]
        };
    }
  }

  static validateHex(hex) {
    if (typeof hex !== 'string') return false;
    return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex.trim());
  }

  static normalizeHex(hex) {
    if (!PBRMaterialSystem.validateHex(hex)) {
      return '#000000';
    }
    const clean = hex.trim();
    if (clean.length === 4) {
      return '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
    }
    return clean.toLowerCase();
  }
}

// --- Colorway Presets ---
export const COLORWAY_PRESETS = {
  'Cyber Phantom': {
    name: 'Cyber Phantom',
    upper: { color: '#1a1a24', roughness: 0.42, metalness: 0.15, clearcoat: 0.3 },
    sole: { color: '#00f0ff', roughness: 0.60, metalness: 0.20, clearcoat: 0.1 },
    accents: { color: '#7928ca', roughness: 0.12, metalness: 0.90, clearcoat: 0.95 },
    laces: { color: '#ffffff', roughness: 0.70, metalness: 0.05, clearcoat: 0.0 }
  },
  'Retro Heritage': {
    name: 'Retro Heritage',
    upper: { color: '#f4efe6', roughness: 0.45, metalness: 0.05, clearcoat: 0.2 },
    sole: { color: '#c84b31', roughness: 0.65, metalness: 0.08, clearcoat: 0.1 },
    accents: { color: '#2d4263', roughness: 0.20, metalness: 0.80, clearcoat: 0.85 },
    laces: { color: '#191919', roughness: 0.75, metalness: 0.02, clearcoat: 0.0 }
  },
  'Triple Stealth': {
    name: 'Triple Stealth',
    upper: { color: '#111111', roughness: 0.40, metalness: 0.10, clearcoat: 0.25 },
    sole: { color: '#1c1c1c', roughness: 0.70, metalness: 0.05, clearcoat: 0.05 },
    accents: { color: '#222222', roughness: 0.15, metalness: 0.85, clearcoat: 0.90 },
    laces: { color: '#0d0d0d', roughness: 0.80, metalness: 0.02, clearcoat: 0.0 }
  },
  'Aurora Neon': {
    name: 'Aurora Neon',
    upper: { color: '#0f2027', roughness: 0.40, metalness: 0.25, clearcoat: 0.4 },
    sole: { color: '#20e3b2', roughness: 0.55, metalness: 0.15, clearcoat: 0.15 },
    accents: { color: '#ff007f', roughness: 0.10, metalness: 0.95, clearcoat: 0.98 },
    laces: { color: '#2c5364', roughness: 0.72, metalness: 0.04, clearcoat: 0.0 }
  }
};

// --- Sneaker Customizer Model ---
export class SneakerCustomizerStore {
  constructor(initialPreset = 'Cyber Phantom') {
    this.selectedSegment = 'upper';
    this.currentPreset = initialPreset;
    this.activeColorway = JSON.parse(JSON.stringify(COLORWAY_PRESETS[initialPreset]));
    this.subscribers = new Set();
    this.history = [];
  }

  selectSegment(segment) {
    if (!['upper', 'sole', 'accents', 'laces'].includes(segment)) {
      throw new Error(`Invalid sneaker segment: ${segment}`);
    }
    this.selectedSegment = segment;
    this.notify();
  }

  updateSneakerSegment(segment, patch) {
    if (!['upper', 'sole', 'accents', 'laces'].includes(segment)) {
      throw new Error(`Invalid sneaker segment: ${segment}`);
    }
    const current = this.activeColorway[segment];
    if (patch.color) {
      if (!PBRMaterialSystem.validateHex(patch.color)) {
        throw new Error(`Invalid hex color: ${patch.color}`);
      }
      current.color = PBRMaterialSystem.normalizeHex(patch.color);
    }
    if (patch.roughness !== undefined) {
      current.roughness = Math.min(1.0, Math.max(0.0, patch.roughness));
    }
    if (patch.metalness !== undefined) {
      current.metalness = Math.min(1.0, Math.max(0.0, patch.metalness));
    }
    if (patch.clearcoat !== undefined) {
      current.clearcoat = Math.min(1.0, Math.max(0.0, patch.clearcoat));
    }

    this.currentPreset = 'Custom';
    this.history.push({ segment, patch, timestamp: Date.now() });
    this.notify();
  }

  applyPreset(presetName) {
    if (!COLORWAY_PRESETS[presetName]) {
      throw new Error(`Unknown preset: ${presetName}`);
    }
    this.currentPreset = presetName;
    this.activeColorway = JSON.parse(JSON.stringify(COLORWAY_PRESETS[presetName]));
    this.notify();
  }

  subscribe(cb) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  notify() {
    this.subscribers.forEach((cb) => cb(this.getState()));
  }

  getState() {
    return {
      selectedSegment: this.selectedSegment,
      currentPreset: this.currentPreset,
      customization: {
        upper: { ...this.activeColorway.upper },
        sole: { ...this.activeColorway.sole },
        accents: { ...this.activeColorway.accents },
        laces: { ...this.activeColorway.laces }
      }
    };
  }
}

// --- Cart Store Model ---
export class CartStore {
  constructor(basePrice = 285.00) {
    this.basePrice = basePrice;
    this.items = [];
    this.isOpen = false;
    this.selectedSize = 'US 10.5';
    this.sizeUnit = 'US';
    this.stockMatrix = {
      'US 7.0': 8, 'US 7.5': 6, 'US 8.0': 10, 'US 8.5': 12, 'US 9.0': 5,
      'US 9.5': 7, 'US 10.0': 9, 'US 10.5': 3, 'US 11.0': 4, 'US 11.5': 2,
      'US 12.0': 5, 'US 13.0': 1,
      'EU 40': 8, 'EU 41': 6, 'EU 42': 10, 'EU 42.5': 12, 'EU 43': 5,
      'EU 44': 3, 'EU 44.5': 7, 'EU 45': 4, 'EU 46': 2, 'EU 47': 1
    };
    this.subscribers = new Set();
  }

  setSizeUnit(unit) {
    if (unit !== 'US' && unit !== 'EU') {
      throw new Error(`Invalid size unit: ${unit}`);
    }
    this.sizeUnit = unit;
    if (unit === 'US' && !this.selectedSize.startsWith('US')) {
      this.selectedSize = 'US 10.5';
    } else if (unit === 'EU' && !this.selectedSize.startsWith('EU')) {
      this.selectedSize = 'EU 44';
    }
    this.notify();
  }

  selectSize(size) {
    if (!this.stockMatrix.hasOwnProperty(size)) {
      throw new Error(`Invalid shoe size: ${size}`);
    }
    this.selectedSize = size;
    this.notify();
  }

  getStock(size = this.selectedSize) {
    return this.stockMatrix[size] ?? 0;
  }

  isLowStock(size = this.selectedSize) {
    const stock = this.getStock(size);
    return stock > 0 && stock <= 3;
  }

  addItem(itemData) {
    const stock = this.getStock(itemData.size);
    if (stock <= 0) {
      throw new Error(`Cannot add item: Size ${itemData.size} is out of stock`);
    }

    const existingIndex = this.items.findIndex((item) => {
      return item.size === itemData.size &&
             JSON.stringify(item.customization) === JSON.stringify(itemData.customization);
    });

    const qty = itemData.quantity || 1;
    if (existingIndex >= 0) {
      const existing = this.items[existingIndex];
      if (existing.quantity + qty > stock) {
        throw new Error(`Requested quantity exceeds available stock (${stock})`);
      }
      existing.quantity += qty;
    } else {
      if (qty > stock) {
        throw new Error(`Requested quantity exceeds available stock (${stock})`);
      }
      const newItem = {
        id: `cart-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        shoeName: itemData.shoeName || 'AEROPRO-X LAB Sneaker',
        price: itemData.price || this.basePrice,
        size: itemData.size,
        customization: JSON.parse(JSON.stringify(itemData.customization)),
        quantity: qty
      };
      this.items.push(newItem);
    }

    this.isOpen = true;
    this.notify();
  }

  removeItem(id) {
    this.items = this.items.filter((item) => item.id !== id);
    this.notify();
  }

  updateQuantity(id, delta) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      this.removeItem(id);
    } else {
      const stock = this.getStock(item.size);
      if (newQty > stock) {
        throw new Error(`Cannot update quantity to ${newQty}: Requested quantity exceeds available stock (${stock})`);
      }
      item.quantity = newQty;
      this.notify();
    }
  }

  clearCart() {
    this.items = [];
    this.notify();
  }

  openCart() {
    this.isOpen = true;
    this.notify();
  }

  closeCart() {
    this.isOpen = false;
    this.notify();
  }

  get subtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get totalItems() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  subscribe(cb) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  notify() {
    this.subscribers.forEach((cb) => cb(this.getState()));
  }

  getState() {
    return {
      items: [...this.items],
      isOpen: this.isOpen,
      subtotal: this.subtotal,
      totalItems: this.totalItems,
      selectedSize: this.selectedSize,
      sizeUnit: this.sizeUnit,
      stock: this.getStock(this.selectedSize),
      isLowStock: this.isLowStock(this.selectedSize)
    };
  }
}

// --- Procedural Audio Synthesizer Engine ---
export class SoundEngine {
  constructor() {
    this.isMuted = false;
    this.isInitialized = false;
    this.eventLog = [];
  }

  init() {
    this.isInitialized = true;
    this.eventLog.push({ type: 'init', timestamp: Date.now() });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.eventLog.push({ type: 'toggleMute', isMuted: this.isMuted, timestamp: Date.now() });
    return this.isMuted;
  }

  _playSound(soundType) {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.isMuted) {
      this.eventLog.push({ type: soundType, suppressed: true, timestamp: Date.now() });
      return false;
    }
    this.eventLog.push({ type: soundType, suppressed: false, timestamp: Date.now() });
    return true;
  }

  playHover() {
    return this._playSound('hover');
  }

  playClick() {
    return this._playSound('click');
  }

  playColorSwitch() {
    return this._playSound('colorSwitch');
  }

  playSegmentSelect() {
    return this._playSound('segmentSelect');
  }

  playCartSlide() {
    return this._playSound('cartSlide');
  }

  playExplodeSnap() {
    return this._playSound('explodeSnap');
  }

  playCheckoutSuccess() {
    return this._playSound('checkoutSuccess');
  }
}

// --- 5-Stage GSAP Camera Storytelling & Scroll System ---
export const CAMERA_STAGES = {
  hero: {
    name: 'hero',
    scrollRange: [0.0, 0.2],
    cameraPos: [0.0, 0.0, 5.0],
    lookAt: [0.0, 0.0, 0.0],
    shoeRotation: [0.0, -0.4, 0.0],
    shoePosition: [0.0, 0.0, 0.0],
    explodedOffsets: {
      upper: [0, 0, 0],
      laces: [0, 0, 0],
      carbonPlate: [0, 0, 0],
      outsole: [0, 0, 0],
      heelAccents: [0, 0, 0]
    }
  },
  exploded: {
    name: 'exploded',
    scrollRange: [0.2, 0.4],
    cameraPos: [2.5, 1.5, 4.0],
    lookAt: [0.0, 0.2, 0.0],
    shoeRotation: [0.3, 0.8, -0.1],
    shoePosition: [0.0, 0.1, 0.0],
    explodedOffsets: {
      upper: [0.0, 0.6, 0.0],
      laces: [0.0, 0.9, 0.2],
      carbonPlate: [0.0, -0.3, 0.0],
      outsole: [0.0, -0.7, 0.0],
      heelAccents: [-0.4, 0.2, -0.4]
    }
  },
  specs: {
    name: 'specs',
    scrollRange: [0.4, 0.6],
    cameraPos: [-2.0, 0.5, 3.5],
    lookAt: [0.0, 0.0, 0.0],
    shoeRotation: [-0.1, -1.2, 0.0],
    shoePosition: [0.2, 0.0, 0.0],
    explodedOffsets: {
      upper: [0.0, 0.1, 0.0],
      laces: [0.0, 0.15, 0.0],
      carbonPlate: [0.0, -0.05, 0.0],
      outsole: [0.0, -0.1, 0.0],
      heelAccents: [0.0, 0.0, 0.0]
    }
  },
  customizer: {
    name: 'customizer',
    scrollRange: [0.6, 0.8],
    cameraPos: [0.0, 1.2, 3.8],
    lookAt: [0.0, 0.0, 0.0],
    shoeRotation: [0.2, 0.0, 0.0],
    shoePosition: [0.0, -0.2, 0.0],
    explodedOffsets: {
      upper: [0, 0, 0],
      laces: [0, 0, 0],
      carbonPlate: [0, 0, 0],
      outsole: [0, 0, 0],
      heelAccents: [0, 0, 0]
    }
  },
  buy: {
    name: 'buy',
    scrollRange: [0.8, 1.0],
    cameraPos: [1.8, -0.2, 3.2],
    lookAt: [0.0, 0.0, 0.0],
    shoeRotation: [0.1, 0.6, 0.05],
    shoePosition: [-0.3, 0.0, 0.0],
    explodedOffsets: {
      upper: [0, 0, 0],
      laces: [0, 0, 0],
      carbonPlate: [0, 0, 0],
      outsole: [0, 0, 0],
      heelAccents: [0, 0, 0]
    }
  }
};

export class CameraChoreographer {
  constructor() {
    this.progress = 0.0;
    this.currentStage = 'hero';
  }

  setProgress(progress) {
    this.progress = Math.min(1.0, Math.max(0.0, progress));
    if (this.progress < 0.2) {
      this.currentStage = 'hero';
    } else if (this.progress < 0.4) {
      this.currentStage = 'exploded';
    } else if (this.progress < 0.6) {
      this.currentStage = 'specs';
    } else if (this.progress < 0.8) {
      this.currentStage = 'customizer';
    } else {
      this.currentStage = 'buy';
    }
    return this.getInterpolatedFrame();
  }

  getInterpolatedFrame() {
    const stage = CAMERA_STAGES[this.currentStage];
    return {
      stage: this.currentStage,
      progress: this.progress,
      cameraPos: [...stage.cameraPos],
      lookAt: [...stage.lookAt],
      shoeRotation: [...stage.shoeRotation],
      shoePosition: [...stage.shoePosition],
      explodedOffsets: JSON.parse(JSON.stringify(stage.explodedOffsets))
    };
  }
}

// --- Interactive 3D Hotspot & Screen Projection System ---
export const HOTSPOT_DATA = [
  {
    id: 'upper-mesh',
    title: 'AeroWeave Upper',
    description: 'Engineered multi-density micro-filament matrix offering dynamic thermal ventilation.',
    worldPos: [0.0, 0.8, 1.2],
    focusStage: 'specs'
  },
  {
    id: 'carbon-plate',
    title: 'Carbon Flight Plate',
    description: 'Torsional aerospace-grade 3K carbon composite plate returning 94% kinetic energy.',
    worldPos: [0.0, -0.2, 0.0],
    focusStage: 'exploded'
  },
  {
    id: 'nitro-cushion',
    title: 'NitroCushion Midsole',
    description: 'Supercritical nitrogen-infused dynamic rebound elastomer cushioning impact.',
    worldPos: [0.0, -0.5, -0.8],
    focusStage: 'specs'
  },
  {
    id: 'adaptive-laces',
    title: 'Adaptive Dynamic Lacing',
    description: 'Kevlar-reinforced tension distribution system with zoned lockdown micro-adjusters.',
    worldPos: [0.0, 1.0, 0.5],
    focusStage: 'hero'
  }
];

export class HotspotManager {
  constructor() {
    this.hotspots = JSON.parse(JSON.stringify(HOTSPOT_DATA));
    this.activeHotspotId = null;
  }

  projectToScreen(worldPos, cameraPos = [0, 0, 5], viewport = { width: 1920, height: 1080 }) {
    // Standard perspective projection simulation: P_screen = (P_world - P_cam) / z * f
    const dx = worldPos[0] - cameraPos[0];
    const dy = worldPos[1] - cameraPos[1];
    const dz = cameraPos[2] - worldPos[2]; // depth distance

    if (dz <= 0.1) {
      return { x: -9999, y: -9999, visible: false };
    }

    const fovFactor = 1000;
    const x = (viewport.width / 2) + (dx / dz) * fovFactor;
    const y = (viewport.height / 2) - (dy / dz) * fovFactor;
    const visible = x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height;

    return { x: Math.round(x), y: Math.round(y), visible };
  }

  selectHotspot(id) {
    const found = this.hotspots.find((h) => h.id === id);
    if (!found) {
      throw new Error(`Hotspot not found: ${id}`);
    }
    this.activeHotspotId = id;
    return found;
  }

  closeHotspot() {
    this.activeHotspotId = null;
  }
}

// --- OrbitControls Model with Clamps & Damping ---
export class OrbitControlsSimulator {
  constructor() {
    // Polar angle limits: 32.4° (0.565 rad) to 93.6° (1.633 rad)
    this.minPolarAngle = (32.4 * Math.PI) / 180;
    this.maxPolarAngle = (93.6 * Math.PI) / 180;
    this.minDistance = 2.0;
    this.maxDistance = 8.5;
    this.dampingFactor = 0.045;
    this.autoRotate = true;
    this.autoRotateSpeed = 1.2;

    this.theta = 0.0; // azimuth
    this.phi = Math.PI / 2; // polar
    this.radius = 5.0; // distance
    this.isInteracting = false;
  }

  setPolarAngle(phi) {
    this.phi = Math.min(this.maxPolarAngle, Math.max(this.minPolarAngle, phi));
    return this.phi;
  }

  setDistance(dist) {
    this.radius = Math.min(this.maxDistance, Math.max(this.minDistance, dist));
    return this.radius;
  }

  rotate(deltaTheta, deltaPhi) {
    this.isInteracting = true;
    this.theta += deltaTheta;
    this.setPolarAngle(this.phi + deltaPhi);
  }

  update(deltaTime = 0.016) {
    if (!this.isInteracting && this.autoRotate) {
      this.theta += (this.autoRotateSpeed * deltaTime * 0.1);
    }
    // Damping simulation
    this.isInteracting = false;
    return {
      theta: this.theta,
      phi: this.phi,
      radius: this.radius,
      cameraPos: [
        this.radius * Math.sin(this.phi) * Math.sin(this.theta),
        this.radius * Math.cos(this.phi),
        this.radius * Math.sin(this.phi) * Math.cos(this.theta)
      ]
    };
  }
}

// --- Studio Lighting Rig Simulator ---
export class StudioLightingRig {
  constructor() {
    this.lights = {
      keyLight: {
        type: 'directional',
        position: [5, 8, 5],
        intensity: 2.5,
        color: '#ffffff',
        castShadow: true,
        shadowMapSize: 2048
      },
      fillLight: {
        type: 'directional',
        position: [-5, 3, -3],
        intensity: 0.8,
        color: '#d4edff',
        castShadow: false
      },
      rimLight: {
        type: 'directional',
        position: [0, 5, -6],
        intensity: 3.0,
        color: '#e6f0ff',
        castShadow: true
      },
      ambientLight: {
        type: 'ambient',
        intensity: 0.4,
        color: '#ffffff'
      }
    };
    this.contactShadow = {
      planeY: -1.0,
      opacity: 0.65,
      blurRadius: 2.5,
      resolution: 1024
    };
  }

  validateLighting() {
    if (this.lights.keyLight.intensity < 1.5) return false;
    if (this.lights.rimLight.intensity < 2.0) return false;
    if (!this.lights.keyLight.castShadow) return false;
    return true;
  }
}
