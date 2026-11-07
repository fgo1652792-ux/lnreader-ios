/**
 * Pure color helpers for the reader color picker. Kept dependency-free and
 * framework-free so they are trivially unit-testable.
 */

export type Hsl = {
  /** 0–360 */
  h: number;
  /** 0–100 */
  s: number;
  /** 0–100 */
  l: number;
};

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Whether the string is a hex color RN can render (3/4/6/8 digits). */
export const isValidHex = (value: string | null | undefined): boolean =>
  typeof value === 'string' && HEX_PATTERN.test(value.trim());

/**
 * Normalizes any supported hex form to `#rrggbb` (alpha is intentionally
 * dropped: the reader background/text colors are opaque).
 */
export const normalizeHex = (value: string): string | null => {
  if (!isValidHex(value)) {
    return null;
  }
  let hex = value.trim().replace('#', '');
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .slice(0, 3)
      .split('')
      .map(c => c + c)
      .join('');
  }
  if (hex.length === 8) {
    hex = hex.slice(0, 6);
  }
  return `#${hex.toLowerCase()}`;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** `#rrggbb` -> {h: 0-360, s: 0-100, l: 0-100}. Invalid input -> null. */
export const hexToHsl = (value: string): Hsl | null => {
  const normalized = normalizeHex(value);
  if (!normalized) {
    return null;
  }
  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;
  if (delta !== 0) {
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        hue = ((b - r) / delta + 2) * 60;
        break;
      default:
        hue = ((r - g) / delta + 4) * 60;
    }
  }

  return {
    h: Math.round(hue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
};

const hueToRgb = (p: number, q: number, t: number): number => {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
};

const byte = (v: number) =>
  Math.round(Math.min(255, Math.max(0, v)))
    .toString(16)
    .padStart(2, '0');

/** {h,s,l} -> `#rrggbb`. */
export const hslToHex = ({ h, s, l }: Hsl): string => {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp01(s / 100);
  const lig = clamp01(l / 100);

  if (sat === 0) {
    const v = byte(lig * 255);
    return `#${v}${v}${v}`;
  }

  const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat;
  const p = 2 * lig - q;
  const r = hueToRgb(p, q, hue / 360 + 1 / 3) * 255;
  const g = hueToRgb(p, q, hue / 360) * 255;
  const b = hueToRgb(p, q, hue / 360 - 1 / 3) * 255;

  return `#${byte(r)}${byte(g)}${byte(b)}`;
};

/** Relative luminance per WCAG 2.1. Input: `#rrggbb`. */
export const relativeLuminance = (value: string): number => {
  const normalized = normalizeHex(value);
  if (!normalized) {
    return 0;
  }
  const channel = (index: number) => {
    const raw = parseInt(normalized.slice(index, index + 2), 16) / 255;
    return raw <= 0.03928 ? raw / 12.92 : Math.pow((raw + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
  );
};

/** WCAG contrast ratio (1–21). Invalid inputs yield 1. */
export const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
};

/** WCAG AA body-text threshold. */
export const WCAG_AA_CONTRAST = 4.5;
