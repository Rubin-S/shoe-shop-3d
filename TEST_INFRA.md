# E2E Test Infrastructure & Verification Architecture

## 1. Executive Summary

This document defines the end-to-end testing infrastructure, methodology, execution guide, and complete coverage matrix for the **AEROPRO-X LAB (3D Shoe Shop)** luxury landing page and e-commerce experience.

The test suite is architected as an **opaque-box, requirement-driven, zero-dependency** testing system. It validates application behavior, interface contracts, user journeys, and mathematical boundaries across all 16 features specified in `ORIGINAL_REQUEST.md` and `PROJECT.md`.

---

## 2. Test Architecture & Runner Design

### 2.1 Technology Stack & Runtime
- **Runtime**: Native Node.js (ESM, `v20.x+` / `v22.x+`)
- **Dependencies**: 0 external npm dependencies required for test execution.
- **Harness**: Built-in synthetic DOM, WebGL2 simulation, Web Audio synthesis engine, and GSAP timeline orchestrator in `shoe-shop-3d/tests/harness.js`.
- **Micro-Assertion Engine**: Native `expect()` supporting `toBe`, `toEqual`, `toBeCloseTo`, `toBeGreaterThan`, `toBeLessThan`, `toHaveLength`, `toThrow`, etc.
- **Reporting**: Colorized ANSI console dashboard with tier breakdown, duration metrics, pass/fail counts, and standard Unix exit codes (`0` on success, `1` on failure).

### 2.2 Test Structure
The test suite is organized into 4 distinct tiers:

```
shoe-shop-3d/tests/
├── harness.js                 # Shared synthetic DOM/WebGL/Audio mocks & interface contracts
├── tier1-feature.test.js      # Tier 1: Feature Coverage (80 tests, >=5 per feature)
├── tier2-boundary.test.js     # Tier 2: Boundary & Corner Cases (80 tests, >=5 per feature)
├── tier3-integration.test.js  # Tier 3: Cross-Feature Interactions (18 tests, >=16 required)
├── tier4-scenarios.test.js    # Tier 4: Real-World Scenarios (10 user journeys, >=8 required)
└── e2e-runner.js              # Unified Master E2E Runner with aggregated reporting
```

---

## 3. How to Execute the Tests

### 3.1 Master Suite Execution (Recommended)
From the project root or the `shoe-shop-3d` directory:
```bash
# From shoe-shop-3d directory:
node tests/e2e-runner.js

# Or from radiant-darwin root:
node shoe-shop-3d/tests/e2e-runner.js
```

### 3.2 Individual Tier Execution
Each tier can also be executed independently in isolation:
```bash
# Tier 1: Feature Coverage
node shoe-shop-3d/tests/tier1-feature.test.js

# Tier 2: Boundary & Corner Cases
node shoe-shop-3d/tests/tier2-boundary.test.js

# Tier 3: Cross-Feature Interactions
node shoe-shop-3d/tests/tier3-integration.test.js

# Tier 4: Real-World User Scenarios
node shoe-shop-3d/tests/tier4-scenarios.test.js
```

---

## 4. Coverage Matrix (16 Features × 4 Tiers)

| Feature # | Feature Name | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Integration) | Tier 4 (Scenario) | Total Tests |
|---|---|---|---|---|---|---|
| **F1** | Greenfield Scaffold & Dependencies | 5 tests | 5 tests | - | J8 | 11 |
| **F2** | Studio Lighting Rig & Shadow Plane | 5 tests | 5 tests | INT-14 | J1 | 12 |
| **F3** | 3D Sneaker Geometry Engine | 5 tests | 5 tests | INT-05 | J1 | 12 |
| **F4** | OrbitControls with Boundaries & Damping | 5 tests | 5 tests | INT-13, INT-14 | J1, J8 | 14 |
| **F5** | PBR Material Definition System | 5 tests | 5 tests | INT-01, INT-15 | J2 | 13 |
| **F6** | Procedural Texture Generators | 5 tests | 5 tests | INT-15 | J2 | 12 |
| **F7** | Real-Time 4-Segment Customizer | 5 tests | 5 tests | INT-01, INT-08 | J2, J3, J10 | 15 |
| **F8** | Curated Colorway & Finish Presets | 5 tests | 5 tests | INT-02 | J2, J7, J10 | 14 |
| **F9** | Cinematic Preloader & Entrance | 5 tests | 5 tests | - | J1 | 11 |
| **F10** | 5-Stage GSAP Scroll Choreography | 5 tests | 5 tests | INT-05, INT-06 | J1, J6, J10 | 15 |
| **F11** | Interactive 3D Hotspots & Callouts | 5 tests | 5 tests | INT-06, INT-07 | J4 | 13 |
| **F12** | Procedural Audio Atmosphere & SFX | 5 tests | 5 tests | INT-08, INT-09, INT-10 | J3, J5, J10 | 16 |
| **F13** | Floating Glassmorphic Product HUD | 5 tests | 5 tests | INT-03, INT-04 | J3, J9 | 14 |
| **F14** | Slide-Out Cart Drawer & Dynamic Preview | 5 tests | 5 tests | INT-01, INT-11, INT-12 | J3, J7, J9, J10 | 16 |
| **F15** | Checkout Trigger & Micro-Interactions | 5 tests | 5 tests | INT-16 | J3, J10 | 13 |
| **F16** | 60 FPS Performance & Mobile Responsiveness | 5 tests | 5 tests | INT-17, INT-18 | J8, J10 | 14 |
| **TOTAL** | **All 16 Features** | **80 tests** | **80 tests** | **18 tests** | **10 tests** | **188 tests** |

---

## 5. Test Tier Specifications

### Tier 1: Feature Coverage (80 tests)
Verifies happy path and core requirement compliance for each feature:
- Package manifests, build scripts, HTML root setup.
- 3-point luxury lighting (Key, Fill, Rim) and contact shadow plane.
- Compound sneaker geometry hierarchy (Upper, Sole, Accents, Laces, Carbon Plate).
- Orbit controls damping factor 0.045, polar angle limits, and distance clamping.
- PBR material properties (roughness, metalness, clearcoat, normalScale) per segment.
- Canvas-generated procedural normal maps for leather, mesh, and rubber tread.
- 4-segment customizer state mutation and change broadcasting.
- Curated colorway presets (Cyber Phantom, Retro Heritage, Triple Stealth, Aurora Neon).
- Preloader progress tracking (0-100%), split-curtain trigger, and dismiss flow.
- 5-stage GSAP scroll choreography camera positions and exploded part offsets.
- 3D hotspot projection to screen coordinates and callout cards.
- Web Audio procedural sound engine and micro-SFX triggers.
- Product HUD sizing selector (US/EU), live pricing ($285.00), and stock levels.
- Slide-out cart drawer line items, dynamic preview payload, and subtotal arithmetic.
- Express checkout flow, modal presentation, and celebration feedback.
- Performance clamping (DPR max 2.0), 60 FPS frame budgets, and mobile touch handlers.

### Tier 2: Boundary & Corner Cases (80 tests)
Validates extreme values, edge cases, and adversarial conditions:
- Missing dependency detection and extreme viewport aspect ratios (ultrawide 3.56 to mini 0.67).
- Light intensity non-negativity clamping and shadow resolution boundaries.
- Geometry zero-scale clamps, empty vertex handling, and translation bounds.
- Extreme polar rotation (-10 rad to +50 rad) and distance zoom clamping (2.0 to 8.5).
- Roughness, metalness, and clearcoat bounds clamping [0.0, 1.0].
- Invalid hex rejection (`not-a-color`, `#GGG`, empty strings) and normalization.
- Procedural texture minimum dimensions (16x16) and byte allocation integrity.
- Rapid successive state mutations (50 fast updates) and invalid segment querying.
- Preloader underflow (<0%) and overflow (>100%) bounds clamping.
- Scroll progress clamping (<0.0 and >1.0) and reverse scrubbing consistency.
- Off-screen and behind-camera hotspot projection culling.
- Audio engine call safety before initialization and muted event suppression.
- Sizing boundary conditions and zero inventory handling.
- Out-of-stock and inventory exhaustion rejection in cart additions.
- Empty cart checkout prevention and debounced submission.
- DPR fallbacks (NaN/zero to 1.0) and rapid window resize event storms.

### Tier 3: Cross-Feature Interactions (18 tests)
Validates reactive synchronizations across distinct subsystems:
- `INT-01`: Customizer colorway changes synchronize to cart item payload and SVG thumbnail.
- `INT-02`: Preset switching atomically updates all 4 segments in a single notification.
- `INT-03`: Sizing selection interacts with inventory limits and cart add constraints.
- `INT-04`: Switching between US and EU sizing standards maintains cart state continuity.
- `INT-05`: GSAP scroll choreography drives exploded mesh offsets on sneaker geometry.
- `INT-06`: Scroll progression into Specs stage aligns camera to project hotspots in visible screen bounds.
- `INT-07`: Clicking a hotspot triggers stage transition in camera choreographer.
- `INT-08`: Segment selection and color picking emit specific synthesized audio events.
- `INT-09`: Cart drawer opening emits slide sound effect.
- `INT-10`: Global mute toggle suppresses all micro-interaction SFX.
- `INT-11`: Multi-item cart quantity adjustments dynamically recalculate subtotal.
- `INT-12`: Removing a line item from a multi-item cart recalculates count and subtotal.
- `INT-13`: Orbit controls user interaction halts auto-rotation and seamlessly resumes on idle.
- `INT-14`: Maximum polar angle clamp maintains camera above contact shadow floor plane.
- `INT-15`: Procedural normal maps match PBR material normalScale uniforms.
- `INT-16`: Express checkout clears cart, closes drawer, and triggers celebratory sound.
- `INT-17`: Viewport resize dynamically reprojects hotspot screen coordinates.
- `INT-18`: Touch orbit gesture arbitration coordinates with page scroll locks.

### Tier 4: Real-World Scenarios (10 Journeys)
End-to-end user journeys validating complete session lifecycles:
- `Journey 1`: First-Time Luxury Visitor (Loader → Hero Orbit → Tech Anatomy Exploration).
- `Journey 2`: Bespoke Sneaker Creator (4-Segment Customization → Presets → Hex Input).
- `Journey 3`: Seamless E-Commerce Purchase (Custom Design → EU Size → Cart → Checkout).
- `Journey 4`: Hotspot Deep-Dive & Spec Inspection (Click Hotspots → Read Tech Specs → Return).
- `Journey 5`: Audio Immersion & Interactive Sensory Flow (Toggle Audio → Micro-SFX → Mute).
- `Journey 6`: Rapid Navigation & Scroll Staccato (Rapid Scrubbing Across Stages).
- `Journey 7`: Multi-Item Custom Order & Cart Management (Multiple Styles → Removal → Recalculation).
- `Journey 8`: Mobile Touchscreen Simulation (Clamped DPR → Touch Orbit → Screen Resize).
- `Journey 9`: Low-Stock Urgency & Inventory Boundary Handling (Stock Depletion Handling).
- `Journey 10`: Full Session Resilience & State Recovery (End-to-End Stress Cycle).

---

## 6. Verification & CI Integration

The test suite integrates cleanly with any CI/CD pipeline or local development hook:
```json
{
  "scripts": {
    "test": "node tests/e2e-runner.js",
    "test:tier1": "node tests/tier1-feature.test.js",
    "test:tier2": "node tests/tier2-boundary.test.js",
    "test:tier3": "node tests/tier3-integration.test.js",
    "test:tier4": "node tests/tier4-scenarios.test.js"
  }
}
```
All tests return deterministic exit code `0` on success and exit code `1` on failure, with comprehensive error tracing to file, line, suite, and test name.
