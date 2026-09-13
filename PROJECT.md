# Project: Exclusive 3D Shoe Shop Landing Page ("AEROPRO-X LAB")

## Architecture
- **Runtime**: Vite + React 18 + TypeScript + Tailwind CSS
- **3D Graphics Engine**: Three.js (WebGLRenderer, PCFSoftShadowMap, PMREMGenerator, MeshPhysicalMaterial, OrbitControls)
- **Animation & Choreography**: GSAP 3 + ScrollTrigger (scrubbed camera dolly/rotation, exploded mesh offsets, entry reveals)
- **Audio Engine**: Native Web Audio API procedural synthesizer (ambient dual-oscillator drone, reactive micro-interaction SFX, zero external audio dependencies)
- **E-Commerce State**: Reactive store (customization colorway state, sizing matrix, cart drawer items, stock indicators)
- **Design Language**: Luxury dark-mode glassmorphism (`bg-black/80`, `backdrop-blur-xl`, double-bezel concentric squircles, high typographic contrast)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Greenfield Scaffold & Dependencies | Vite + React + TS + Tailwind + Three.js + GSAP + Lucide setup | M1 | Survey E1 |
| 2 | Studio Lighting Rig & Shadow Plane | 3-point luxury lighting (Key, Fill, Rim) + contact shadow plane + cosine AO | M1 | Survey E2 |
| 3 | 3D Sneaker Geometry Engine | Compound procedural sneaker model (Upper, Sole, Accents, Laces, Carbon Shank) + GLTF loader | M1 | Survey E1/E2 |
| 4 | OrbitControls with Boundaries & Damping | 360° rotation with damping 0.045, polar limits (32.4°-93.6°), distance clamp, idle auto-rotation | M1 | Survey E2 |
| 5 | PBR Material Definition System | MeshPhysicalMaterial with leather grain, mesh sheen, rubber tread, iridescent chrome | M2 | Survey E2 |
| 6 | Procedural Texture Generators | Canvas-generated normal maps for micro-tumbled leather, mesh weave, and rubber sole tread | M2 | Survey E1/E2 |
| 7 | Real-Time 4-Segment Customizer | Interactive customization for Upper, Sole, Accents, Laces without shader hitching | M2 | Survey E2 |
| 8 | Curated Colorway & Finish Presets | Cyber Phantom, Retro Heritage, Triple Stealth, Aurora Neon + custom hex picker | M2 | Survey E2 |
| 9 | Cinematic Preloader & Entrance | Loading percentage tracking, split-curtain reveal, sneaker scale/levitate entrance | M3 | Survey E3 |
| 10 | 5-Stage GSAP Scroll Choreography | Camera & shoe animation across Hero, Anatomy/Exploded, Tech Specs, Customizer, Buy | M3 | Survey E3 |
| 11 | Interactive 3D Hotspots & Callouts | 3D coordinate pins projected to 2D screen (`Vector3.project`) with click-to-focus GSAP transition | M3 | Survey E2/E3 |
| 12 | Procedural Audio Atmosphere & SFX | Web Audio API ambient drone + micro-SFX (hover, click, color chime, cart whoosh) + mute toggle | M3 | Survey E3 |
| 13 | Floating Glassmorphic Product HUD | Luxury HUD with live price ($285), model name, US/EU sizing selector, live stock ticker, CTA | M4 | Survey E3 |
| 14 | Slide-Out Cart Drawer & Dynamic Preview | Slide-out cart with customized sneaker SVG thumbnail matching live colors, quantity, subtotal | M4 | Survey E3 |
| 15 | Checkout Trigger & Micro-Interactions | Simulated express checkout flow with celebratory feedback, magnetic cursor, button physics | M4 | Survey E3 |
| 16 | 60 FPS Performance & Mobile Responsiveness | Clamped DPR, touch orbit arbitration, responsive viewport adaptation, zero console errors | M4 | Survey E1/E3 |
| 17 | E2E Automated Verification & Testing | Comprehensive test suite (Tiers 1-4) verifying all 16 features, headless tests & runner | M5 / Test Track | Spec / Audit |
| 18 | Adversarial Coverage & Integrity Hardening | Stress testing corner cases, rapid customization, audio recovery, forensic audit clearance | M5 | Integrity Spec |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | 3D Scene Foundation & Sneaker Model | Vite scaffold, Three.js canvas, studio lighting, compound sneaker geometry, OrbitControls | none | DONE |
| M2 | PBR Materials & Customization Engine | MeshPhysicalMaterial shaders, procedural normal maps, 4-segment customizer, color presets | M1 | IN_PROGRESS |
| M3 | GSAP Scroll Storytelling, Hotspots & Audio | Intro preloader, 5-stage scroll camera timeline, 3D callouts, Web Audio atmosphere | M2 | PLANNED |
| M4 | E-Commerce HUD, Cart Drawer & Mobile UX | Glassmorphic HUD, size picker, slide-out cart with customized preview, responsive layout | M3 | PLANNED |
| M5 | 100% E2E Pass & Adversarial Hardening | E2E test execution, 60 FPS performance tuning, adversarial testing, forensic audit | M4, Test Track | PLANNED |

## Milestone 1 Outputs
- `shoe-shop-3d/src/components/3d/SceneCanvas.tsx`
- `shoe-shop-3d/src/components/3d/StudioLighting.ts`
- `shoe-shop-3d/src/components/3d/ContactShadow.ts`
- `shoe-shop-3d/src/components/3d/ProceduralSneaker.ts` (42 meshes, 11,465 vertices, 4 tagged segments, 5 rig groups)
- `shoe-shop-3d/src/components/3d/SneakerLoader.ts`
- Test Suite: 188/188 tests passing (100.0%)

## Dual Track: E2E Testing Track
- **Status**: Complete (`TEST_READY.md` published, 188 tests across Tiers 1-4)
- **Runner**: `node shoe-shop-3d/tests/e2e-runner.js`

## Interface Contracts
### 3D Engine ↔ Customizer State
```typescript
export interface SegmentCustomization {
  color: string;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
}

export interface SneakerCustomization {
  upper: SegmentCustomization;
  sole: SegmentCustomization;
  accents: SegmentCustomization;
  laces: SegmentCustomization;
}

// In-place mutation contract (no shader recompilation)
export function updateSneakerSegment(
  segment: keyof SneakerCustomization,
  patch: Partial<SegmentCustomization>
): void;
```

### Camera Storytelling ↔ Scroll Trigger
```typescript
export interface CameraStage {
  name: 'hero' | 'exploded' | 'specs' | 'customizer' | 'buy';
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
  shoeRotation: [number, number, number];
  shoePosition: [number, number, number];
  explodedOffsets?: {
    upper: [number, number, number];
    laces: [number, number, number];
    carbonPlate: [number, number, number];
    outsole: [number, number, number];
    heelAccents: [number, number, number];
  };
}
```

### E-Commerce Store ↔ Cart Drawer
```typescript
export interface CartItem {
  id: string;
  shoeName: string;
  price: number;
  size: string; // e.g., "US 10.5" or "EU 44"
  customization: SneakerCustomization;
  quantity: number;
}

export interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  subtotal: number;
  openCart: () => void;
  closeCart: () => void;
}
```

### Audio Engine ↔ UI Events
```typescript
export interface AudioEngine {
  init: () => void;
  toggleMute: () => boolean;
  isMuted: boolean;
  playHover: () => void;
  playClick: () => void;
  playColorSwitch: () => void;
  playSegmentSelect: () => void;
  playCartSlide: () => void;
  playExplodeSnap: () => void;
}
```
