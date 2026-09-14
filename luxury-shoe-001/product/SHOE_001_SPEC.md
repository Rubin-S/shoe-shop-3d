# Product Specification: SHOE_001 "AEROPRO AURELIUS"

**Artifact Target**: `product/SHOE_001_SPEC.md`  
**Status**: DESIGN SPECIFICATION // READY FOR VISUAL PROTOTYPING  
**Class**: Flagship Luxury Men's Formal Dress Shoe  

---

## 1. Product Identity & Design Architecture

- **Product Family**: Bespoke Handcrafted Formal Footwear (Maison Aeropro)
- **Model Code**: `SHOE_001` // Codename: **Aurelius Sovereign Oxford**
- **Silhouette**: Modernized Continental Wholecut-Balmoral Hybrid. Features a sleek, flowing vamp with an integrated micro-beveled cap-toe seam and an aggressive fiddleback waist.
- **Last Philosophy**:
  - Sculpted anatomical last (Last "Atelier 01").
  - Soft-chisel toe with asymmetric medial hallux contour.
  - Slim, tailored instep with pinched heel cup and high medial arch wrap.
- **Key Proportions**:
  - Total Length: 298mm (US Size 10.5 / EU 44 standard reference).
  - Ball Width: 104mm.
  - Waist Width: 68mm (dramatic 34% reduction for an athletic bespoke stance).
  - Heel Height: 27mm (including top rubber dovetail piece).
  - Toe Spring: 14mm upward sweep from ball pivot to toe tip.

---

## 2. Component & Panel Architecture

```
SHOE_001 (AURELIUS)
├── UPPER
│   ├── Vamp & Quarters (Single-piece continuous French Box Calfskin)
│   ├── Floating Soft-Chisel Toe Cap (Precision skived overlap, 29% length)
│   ├── Integrated Padded Tongue (Ergonomic instep curvature)
│   └── Pinched Heel Counter with Reverse Suede Pocket
├── LACING SYSTEM
│   ├── 5-Pair Blind Eyelets (Countersunk on underside with reinforced eyelet tape)
│   └── 2mm Braided Waxed Cotton Laces (Flat-round profile with brass aglets)
├── CONSTRUCTION & SOLE
│   ├── Insole: 4.5mm Hand-channeled full-grain vegetable-tanned shoulder
│   ├── 270° Hand-Welt (2.5mm calfskin welt with 12 SPI fudged wheeling)
│   ├── Midfoot Shank: Tempered spring steel with lightweight carbon-fiber composite casing
│   ├── Outsole: 5.2mm Oak-bark tanned leather with closed-channel rapid stitching
│   └── Heel Stack: 4 compressed oak-bark leather lifts + dovetail quarter-rubber strike pad
└── DETAILS & FINISHING
    ├── Upper Seams: Twin parallel micro-stitching at 11 SPI
    ├── Fiddleback Waist: Beveled triangular arch ridge skived flush to upper
    └── Edge Finish: Hand-burnished dark espresso aniline dye with hot carnauba wax seal
```

---

## 3. Materials & Colorway Palette

### Baseline Curated Finish: "Imperial Espresso & Midnight Patina"
- **Upper Skin**: French Box Calfskin from Tanneries d'Annonay. Deep dual-tone espresso brown with subtle hand-burnished obsidian shadow patina at the toe and heel counter.
- **Lining**: 100% drum-dyed vegetable-tanned glove leather in natural warm parchment (`#f2ede4`).
- **Welt**: Burnished espresso calf welt with wheel-toothed fudging.
- **Sole Bottom**: Two-tone fiddleback finish—natural hand-stained waist with dark espresso forefoot tread and embossed Maison monogram.
- **Hardware & Aglets**: Brushed antique champagne brass.

---

## 4. Customization Architecture Schema

For the interactive WebGL customizer, the shoe exposes distinct customizable regions without compromising structural integrity:

| Region ID | Semantic Part | Customizable Attributes | Default Value |
| :--- | :--- | :--- | :--- |
| `upper_vamp` | Main upper body & quarters | Leather type, Colorway, Patina intensity | French Box Calf, Imperial Espresso |
| `toe_cap` | Chiseled toe cap panel | Finish (Mirror gloss, brushed, tonal patina) | Hand-burnished obsidian patina |
| `laces` | 5-pair waxed lacing | Color, weave density, aglet material | Tonal espresso waxed cotton, brass aglets |
| `welt` | 270° welt perimeter | Welt color, fudging wheel contrast | Dark espresso, 12 SPI fudging |
| `sole_waist` | Outsole & fiddleback bottom | Natural oak, black dress, or oxblood stain | Two-tone natural parchment / espresso |
| `lining` | Interior glove leather | Natural parchment, British racing green, or burgundy | Natural parchment (`#f2ede4`) |

### Non-Customizable Structural Invariants
- 270° welt geometry and hand-channeled insole holdfast.
- Anatomical last curvature and 14mm toe spring.
- Closed-channel stitch concealment and dovetail brass nail array.
