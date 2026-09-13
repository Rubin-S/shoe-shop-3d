# AEROPRO-X LAB // Award-Winning 3D Interactive Sneaker Showcase

An award-winning 3D landing page and interactive e-commerce customizer for an exclusive footwear concept, built with **React 18**, **Three.js**, **GSAP ScrollTrigger**, and **Tailwind CSS**.

---

## Highlights & Features

- **Interactive 3D Sneaker Showcase**:
  - Full 360° orbital navigation, smooth damping, dynamic studio 3-point lighting, and soft contact ambient occlusion.
  - Compound 42-mesh anatomical sneaker geometry: sculpted upper with open throat recess, 3D eyestay panels, padded collar with asymmetric malleolus dips, plush tongue with 3D webbing pull tab, 11-point dual-loop tied bow knot with draped metallic aglets, multi-layered midsole with lateral compression channels, decoupled heel crash pad, and dual-camber carbon fiber torsional shank plate.
- **Micro-Surface Procedural PBR Materials**:
  - Tangent-space normal maps generated via procedural mathematics:
    - **Tumbled Leather**: Cellular Voronoi pebble micro-grain with crevice harmonics, micro-pores, and toe vamp micro-perforations.
    - **AeroWeave Knit**: Technical interlocking warp/weft relief with filament twist.
    - **Vulcanized Rubber**: Directional herringbone chevron traction grooves with stippled grip and flex siping slits.
    - **Carbon Fiber**: 2x2 twill weave with clearcoat depth reflection.
  - Realistic specular sheen, Fresnel edge falloff, tuned micro-roughness, and anisotropic light response.
- **Cinematic 5-Stage GSAP Scroll Choreography**:
  1. **Stage 01 // Series 01 Beauty Vantage**: Pristine 3/4 luxury overview, floating in calibrated studio poise.
  2. **Stage 02 // Anatomical Deconstruction**: Zero-G exploded view where upper, laces, carbon plate, midsole, and heel counter separate along calibrated vectors with leader lines and calipers.
  3. **Stage 03 // Macro Innovation & Telemetry**: Macro focal zoom onto key engineering innovations with interactive 3D coordinate pins.
  4. **Stage 04 // Studio Atelier Customizer**: Seamless real-time re-assembly; interactive atelier HUD allowing live material and color changes across Upper, Sole, Accents, and Laces with zero-recompile GPU uniform mutation.
  5. **Stage 05 // Serialized E-Commerce Acquisition**: Final beauty vantage with floating product HUD, live price, US/EU sizing selector, live stock ticker, slide-out cart drawer, promo code discounts, and simulated checkout flow.
- **Procedural Web Audio Engine**:
  - Synthesized ambient drone and reactive micro-interaction SFX (hover, click, exploded snap, color switch, checkout fanfare) with mute/unmute toggle.
- **Dual-Theme Adaptive**:
  - Daylight Luxury (editorial warm monochrome light theme) and Obsidian Onyx (dark cyber luxury theme).

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons
- **3D Graphics Engine**: Three.js (`WebGLRenderer`, `MeshPhysicalMaterial`, `TubeGeometry`, `PCFSoftShadowMap`, `OrbitControls`)
- **Animation**: GSAP 3 + ScrollTrigger
- **Audio Engine**: Native Web Audio API procedural synthesizer
- **Bundler & Tooling**: Vite 5

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation & Development

```bash
cd shoe-shop-3d
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### Production Build

```bash
cd shoe-shop-3d
npm run build
npm run preview
```

### Verification & Testing

```bash
cd shoe-shop-3d

# Automated E2E Test Suite (Tiers 1-4, 188 tests)
node tests/e2e-runner.js

# Sub-module verification (Cart, Choreography, Audio, Theme, 58 tests)
npx tsx tests/verify-new-modules.mjs

# TypeScript typecheck
npm run lint
```
