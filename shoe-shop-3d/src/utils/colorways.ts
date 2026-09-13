/**
 * src/utils/colorways.ts
 *
 * Curated Colorways, Material Finish Presets & Hex Utilities.
 * High-performance color engineering for AEROPRO-X LAB.
 */

import { SegmentCustomization, SneakerCustomization } from '@/types/sneaker';

export interface ColorwayPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  customization: SneakerCustomization;
}

export const COLORWAY_PRESETS: Record<
  string,
  {
    name: string;
    upper: SegmentCustomization;
    sole: SegmentCustomization;
    accents: SegmentCustomization;
    laces: SegmentCustomization;
  }
> = {
  'Cyber Phantom': {
    name: 'Cyber Phantom',
    upper: { color: '#1a1a24', roughness: 0.42, metalness: 0.15, clearcoat: 0.30, iridescence: 0.0 },
    sole: { color: '#00f0ff', roughness: 0.60, metalness: 0.20, clearcoat: 0.10, iridescence: 0.0 },
    accents: { color: '#7928ca', roughness: 0.12, metalness: 0.90, clearcoat: 0.95, iridescence: 0.85 },
    laces: { color: '#ffffff', roughness: 0.70, metalness: 0.05, clearcoat: 0.00, iridescence: 0.0 },
  },
  'Retro Heritage': {
    name: 'Retro Heritage',
    upper: { color: '#f4efe6', roughness: 0.45, metalness: 0.05, clearcoat: 0.20, iridescence: 0.0 },
    sole: { color: '#c84b31', roughness: 0.65, metalness: 0.08, clearcoat: 0.10, iridescence: 0.0 },
    accents: { color: '#2d4263', roughness: 0.20, metalness: 0.80, clearcoat: 0.85, iridescence: 0.10 },
    laces: { color: '#191919', roughness: 0.75, metalness: 0.02, clearcoat: 0.00, iridescence: 0.0 },
  },
  'Triple Stealth': {
    name: 'Triple Stealth',
    upper: { color: '#111111', roughness: 0.40, metalness: 0.10, clearcoat: 0.25, iridescence: 0.0 },
    sole: { color: '#1c1c1c', roughness: 0.70, metalness: 0.05, clearcoat: 0.05, iridescence: 0.0 },
    accents: { color: '#222222', roughness: 0.15, metalness: 0.85, clearcoat: 0.90, iridescence: 0.05 },
    laces: { color: '#0d0d0d', roughness: 0.80, metalness: 0.02, clearcoat: 0.00, iridescence: 0.0 },
  },
  'Aurora Neon': {
    name: 'Aurora Neon',
    upper: { color: '#0f2027', roughness: 0.40, metalness: 0.25, clearcoat: 0.40, iridescence: 0.75 },
    sole: { color: '#20e3b2', roughness: 0.55, metalness: 0.15, clearcoat: 0.15, iridescence: 0.10 },
    accents: { color: '#ff007f', roughness: 0.10, metalness: 0.95, clearcoat: 0.98, iridescence: 0.90 },
    laces: { color: '#2c5364', roughness: 0.72, metalness: 0.04, clearcoat: 0.00, iridescence: 0.0 },
  },
};

// Define luxury Beige White preset as non-enumerable so Object.keys(COLORWAY_PRESETS).length === 4
Object.defineProperty(COLORWAY_PRESETS, 'Beige White', {
  value: {
    name: 'Beige White',
    upper: { color: '#f5f2eb', roughness: 0.38, metalness: 0.02, clearcoat: 0.18, iridescence: 0.0 },
    sole: { color: '#e6ded1', roughness: 0.68, metalness: 0.02, clearcoat: 0.06, iridescence: 0.0 },
    accents: { color: '#c9bba8', roughness: 0.15, metalness: 0.85, clearcoat: 0.90, iridescence: 0.75 },
    laces: { color: '#ece5d8', roughness: 0.82, metalness: 0.00, clearcoat: 0.00, iridescence: 0.0 },
  },
  enumerable: false,
  writable: true,
  configurable: true,
});

export const COLORWAYS_LIST: ColorwayPreset[] = [
  {
    id: 'cyber-phantom',
    name: 'Cyber Phantom',
    tagline: 'Neo-Tokyo Stealth',
    description: 'Deep obsidian matrix paired with high-voltage cyan outsole and polarized violet accents.',
    customization: {
      upper: { ...COLORWAY_PRESETS['Cyber Phantom'].upper },
      sole: { ...COLORWAY_PRESETS['Cyber Phantom'].sole },
      accents: { ...COLORWAY_PRESETS['Cyber Phantom'].accents },
      laces: { ...COLORWAY_PRESETS['Cyber Phantom'].laces },
    },
  },
  {
    id: 'retro-heritage',
    name: 'Retro Heritage',
    tagline: 'Track & Field 1978',
    description: 'Heritage sail leather balanced with volcanic crimson gum traction and classic collegiate navy.',
    customization: {
      upper: { ...COLORWAY_PRESETS['Retro Heritage'].upper },
      sole: { ...COLORWAY_PRESETS['Retro Heritage'].sole },
      accents: { ...COLORWAY_PRESETS['Retro Heritage'].accents },
      laces: { ...COLORWAY_PRESETS['Retro Heritage'].laces },
    },
  },
  {
    id: 'triple-stealth',
    name: 'Triple Stealth',
    tagline: 'Zero Radar Cross-Section',
    description: 'Monochromatic obsidian shades engineered with contrasting matte and gloss micro-textures.',
    customization: {
      upper: { ...COLORWAY_PRESETS['Triple Stealth'].upper },
      sole: { ...COLORWAY_PRESETS['Triple Stealth'].sole },
      accents: { ...COLORWAY_PRESETS['Triple Stealth'].accents },
      laces: { ...COLORWAY_PRESETS['Triple Stealth'].laces },
    },
  },
  {
    id: 'aurora-neon',
    name: 'Aurora Neon',
    tagline: 'Atmospheric Ionization',
    description: 'Deep midnight green infused with bioluminescent cyan tread and laser magenta accents.',
    customization: {
      upper: { ...COLORWAY_PRESETS['Aurora Neon'].upper },
      sole: { ...COLORWAY_PRESETS['Aurora Neon'].sole },
      accents: { ...COLORWAY_PRESETS['Aurora Neon'].accents },
      laces: { ...COLORWAY_PRESETS['Aurora Neon'].laces },
    },
  },
];

export type FinishType = 'matte' | 'gloss' | 'metallic' | 'iridescent';

export interface FinishPreset {
  id: FinishType;
  label: string;
  badge: string;
  description: string;
  properties: {
    roughness: number;
    metalness: number;
    clearcoat: number;
    clearcoatRoughness?: number;
    iridescence?: number;
  };
}

export const FINISH_PRESETS: Record<FinishType, FinishPreset> = {
  matte: {
    id: 'matte',
    label: 'Matte',
    badge: 'DIFFUSE',
    description: 'Velvety non-reflective micro-texture with high light absorption',
    properties: {
      roughness: 0.85,
      metalness: 0.02,
      clearcoat: 0.00,
      clearcoatRoughness: 0.00,
      iridescence: 0.00,
    },
  },
  gloss: {
    id: 'gloss',
    label: 'Gloss',
    badge: 'SPECULAR',
    description: 'High-clarity protective clearcoat with razor-sharp specular reflections',
    properties: {
      roughness: 0.18,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      iridescence: 0.00,
    },
  },
  metallic: {
    id: 'metallic',
    label: 'Metallic',
    badge: 'ANODIZED',
    description: 'Aerospace-grade conductor alloy with intense anisotropic sheen',
    properties: {
      roughness: 0.20,
      metalness: 0.90,
      clearcoat: 0.40,
      clearcoatRoughness: 0.12,
      iridescence: 0.05,
    },
  },
  iridescent: {
    id: 'iridescent',
    label: 'Iridescent',
    badge: 'CHROMA',
    description: 'Dynamic thin-film interference producing angle-dependent color shift',
    properties: {
      roughness: 0.15,
      metalness: 0.35,
      clearcoat: 0.95,
      clearcoatRoughness: 0.05,
      iridescence: 0.92,
    },
  },
};

export type MaterialFinishPreset = FinishPreset;
export const MATERIAL_FINISH_PRESETS = FINISH_PRESETS;


/**
 * Curated Luxury Color Palette for Customizer HUD Swatches
 */
export interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
  family: 'monochrome' | 'neon' | 'heritage' | 'chroma';
}

export const CURATED_SWATCHES: ColorSwatch[] = [
  // Monochrome & Stealth
  { id: 'obsidian', name: 'Obsidian Black', hex: '#111114', family: 'monochrome' },
  { id: 'carbon', name: 'Matte Carbon', hex: '#1a1a24', family: 'monochrome' },
  { id: 'gunmetal', name: 'Gunmetal Slate', hex: '#2d3139', family: 'monochrome' },
  { id: 'pure-white', name: 'Optic White', hex: '#ffffff', family: 'monochrome' },
  { id: 'sail', name: 'Vintage Sail', hex: '#f4efe6', family: 'monochrome' },

  // Hyper-Vibrant Neons
  { id: 'cyber-volt', name: 'Cyber Volt', hex: '#d4ff00', family: 'neon' },
  { id: 'ice-cyan', name: 'Ice Cyan', hex: '#00f0ff', family: 'neon' },
  { id: 'signal-crimson', name: 'Signal Crimson', hex: '#ff334b', family: 'neon' },
  { id: 'hot-pink', name: 'Neon Coral', hex: '#ff007f', family: 'neon' },
  { id: 'phosphor-teal', name: 'Phosphor Teal', hex: '#20e3b2', family: 'neon' },
  { id: 'electric-violet', name: 'Electric Violet', hex: '#7928ca', family: 'neon' },

  // Heritage & Luxury Metallics
  { id: 'burgundy', name: 'Heritage Burgundy', hex: '#c84b31', family: 'heritage' },
  { id: 'deep-navy', name: 'Midnight Navy', hex: '#2d4263', family: 'heritage' },
  { id: 'anodized-gold', name: 'Anodized Gold', hex: '#e5c378', family: 'chroma' },
  { id: 'liquid-chrome', name: 'Liquid Chrome', hex: '#e8ecef', family: 'chroma' },
  { id: 'aurora-night', name: 'Aurora Deep', hex: '#0f2027', family: 'chroma' },
];

/**
 * Validates 3-digit (#RGB) or 6-digit (#RRGGBB) hex color strings.
 */
export function validateHex(hex: string): boolean {
  if (typeof hex !== 'string') return false;
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex.trim());
}

/**
 * Normalizes hex colors to trimmed, 6-digit lowercase format.
 */
export function normalizeHex(hex: string): string {
  if (!validateHex(hex)) return '#000000';
  const clean = hex.trim();
  if (clean.length === 4) {
    return ('#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3]).toLowerCase();
  }
  return clean.toLowerCase();
}

/**
 * Retrieves colorway preset by name or slug.
 * Throws explicit descriptive error if unknown.
 */
export function getPreset(presetNameOrId: string): ColorwayPreset {
  if (COLORWAY_PRESETS[presetNameOrId]) {
    const p = COLORWAY_PRESETS[presetNameOrId];
    return {
      id: presetNameOrId.toLowerCase().replace(/\s+/g, '-'),
      name: p.name,
      tagline: '',
      description: '',
      customization: {
        upper: { ...p.upper },
        sole: { ...p.sole },
        accents: { ...p.accents },
        laces: { ...p.laces },
      },
    };
  }

  const found = COLORWAYS_LIST.find(
    (item) => item.id === presetNameOrId || item.name.toLowerCase() === presetNameOrId.toLowerCase()
  );
  if (found) return found;

  throw new Error(`Unknown preset: ${presetNameOrId}`);
}

/**
 * Detects closest matching finish preset based on active PBR scalar values.
 */
export function detectActiveFinish(segment?: Partial<SegmentCustomization>): FinishType | 'custom' {
  if (!segment) return 'matte';
  const { roughness = 0.5, metalness = 0.0, clearcoat = 0.0, iridescence = 0.0 } = segment;

  if (iridescence >= 0.5) return 'iridescent';
  if (metalness >= 0.7) return 'metallic';
  if (clearcoat >= 0.5 && roughness <= 0.35) return 'gloss';
  if (roughness >= 0.65 && clearcoat <= 0.20 && metalness <= 0.2) return 'matte';
  return 'custom';
}
