# Visual QA Audit Report 001: Initial Render Critique

**Target Asset**: `renders/final/hero_three_quarter.jpg` (Blockout v01)  
**Standard**: €1,500 Luxury Men's Oxford Advertising Campaign  
**Status**: **REJECTED (CRITICAL DEFECTS IDENTIFIED)**  

---

## Defect Inventory

| # | Location | Severity | Probable Cause | Recommended Blender Correction |
| :--- | :--- | :--- | :--- | :--- |
| **D1** | **Studio Lighting & Exposure** | **CRITICAL** | Softbox energy set to 450W at 0.5m distance in Cycles caused complete specular blowout; shoe appears solid white. | Reduce key light energy from 450W to 25W; reduce fill to 10W and rim to 15W. Tune color management to AgX / Filmic High Contrast. |
| **D2** | **Shoe Last Orientation & Camera Angle** | **CRITICAL** | Coordinate axes mismatch: shoe longitudinal axis is oriented along Y, but camera target/roll makes the shoe appear canted and rolling on its side. | Establish standard footwear coordinate convention: longitudinal axis Y (heel at -Y, toe at +Y), Z is vertical up (sole at Z=0, heel seat at Z=0.027), X is lateral/medial width. Calibrate camera rotation to look at `(0, 0, 0.04)` from `(-0.35, -0.38, 0.22)` with upward elevation and 0 roll. |
| **D3** | **Upper Anatomy & Panel Gaps** | **CRITICAL** | Disconnected geometry between `Upper_Toe_Cap` and `Upper_Vamp` created a gaping hole at the cap-toe seam line. The heel back ended abruptly in an open polygon disk. | Construct continuous organic watertight shoe last volume first; then sculpt/derive the semantic panels (`toe_panel`, `vamp`, `quarters`, `collar`) with clean overlapping skived borders, seamless backseam closure, and pinched heel counter cup. |
| **D4** | **Tongue & Internal Alignment** | **HIGH** | The tongue mesh generated on the floor plane beneath the sole rather than inside the instep throat under the quarters. | Anchor the tongue geometry precisely to the vamp throat interior (`Z: 0.045 to 0.085`, `Y: -0.010 to 0.040`) curving naturally along the instep arch. |
| **D5** | **Sole, Welt & Heel Integration** | **CRITICAL** | Outsole, welt shelf, and stacked leather heel failed to enclose the bottom of the upper, leaving the bottom of the upper exposed. | Extrude the bottom last perimeter into the 270° welt shelf (`4.5mm` extension around forefoot and waist). Construct the 5.2mm oak-bark outsole directly bonded beneath the welt, with the beveled fiddleback triangular ridge along the waist arch, and the 4-lift stacked leather heel anchored to the heel seat at `Z: 0 to 0.027`. |
| **D6** | **Laces & Eyelets** | **HIGH** | Laces floating in free space above the throat without threading through eyelet apertures; eyelet rings misaligned with facing leather. | Recalibrate the 5 pairs of eyelet coordinates flush along the Oxford closed facing margin (`X: ±0.009 to ±0.012`, `Y: -0.025 to 0.035`, `Z: 0.075 to 0.090`). Snap Bézier lace curves through the eyelet apertures with tension and catenary drape. |
| **D7** | **Leather Shader Micro-Physics** | **HIGH** | Base color node graph mapping was washed out by extreme light power and oversized procedural mapping coordinates. | Rebalance Principled BSDF: base color `#241813` (Imperial Espresso) with gradient to `#140d0a` (Obsidian patina) at toe and heel; set roughness to 0.32–0.38; add carnauba clearcoat (0.85 on toe cap, 0.35 on vamp); scale procedural bump to 0.002 strength. |

---

## Action Plan for Iteration 02
1. Re-engineer `build_aurelius_master.py` with a unified parametric shoe last mesh that guarantees watertight topology, smooth organic curvature, and seamless panel boundaries.
2. Calibrate lighting: Key softbox 28W, Fill 12W, Rim strip 18W.
3. Fix camera framing: target center of shoe last `(0, 0.01, 0.045)` with 85mm lens at 3/4 beauty perspective.
4. Integrate welt, outsole, and stacked heel solidly against the upper.
5. Thread laces accurately through the 5 eyelet pairs.
6. Render verification pass with 16 samples + OpenImageDenoise (completes in ~12 seconds per shot).
