import {
  contrastRatio,
  hexToHsl,
  hslToHex,
  isValidHex,
  normalizeHex,
  relativeLuminance,
  WCAG_AA_CONTRAST,
} from '../colorUtils';

describe('colorUtils', () => {
  describe('isValidHex', () => {
    it.each([
      ['#FFFFFF', true],
      ['#fff', true],
      ['#FFFFFFB3', true],
      ['#FFF0', true],
      ['fff', false],
      ['#GGGGGG', false],
      ['#12345', false],
      ['', false],
      [undefined, false],
      [null, false],
    ])('%s -> %p', (input, expected) => {
      expect(isValidHex(input as string)).toBe(expected);
    });
  });

  describe('normalizeHex', () => {
    it('expands 3-digit and drops alpha', () => {
      expect(normalizeHex('#0fF')).toBe('#00ffff');
      expect(normalizeHex('#FFFFFFB3')).toBe('#ffffff');
      expect(normalizeHex('#F0F0')).toBe('#ff00ff');
      expect(normalizeHex('nope')).toBeNull();
    });
  });

  describe('hexToHsl / hslToHex roundtrip', () => {
    it('converts known colors', () => {
      expect(hexToHsl('#000000')).toEqual({ h: 0, s: 0, l: 0 });
      expect(hexToHsl('#FFFFFF')).toEqual({ h: 0, s: 0, l: 100 });
      expect(hexToHsl('#FF0000')).toEqual({ h: 0, s: 100, l: 50 });
      expect(hexToHsl('#00FF00')).toEqual({ h: 120, s: 100, l: 50 });
      expect(hexToHsl('#0000FF')).toEqual({ h: 240, s: 100, l: 50 });
    });

    it('roundtrips the reader defaults (±2/255 per channel)', () => {
      const channels = (hex: string) => [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
      ];
      for (const hex of ['#292832', '#CCCCCC', '#F7DFC6', '#593100']) {
        const result = hslToHex(hexToHsl(hex)!);
        const a = channels(hex);
        const b = channels(result);
        a.forEach((v, i) => expect(Math.abs(v - b[i])).toBeLessThanOrEqual(2));
      }
    });

    it('returns null for invalid input', () => {
      expect(hexToHsl('not-a-color')).toBeNull();
    });
  });

  describe('contrastRatio', () => {
    it('black vs white is 21:1', () => {
      expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    });

    it('identical colors are 1:1', () => {
      expect(contrastRatio('#292832', '#292832')).toBeCloseTo(1, 5);
    });

    it('reader default dark theme is readable', () => {
      expect(
        contrastRatio('#292832', '#CCCCCC'),
      ).toBeGreaterThan(WCAG_AA_CONTRAST);
    });

    it('flags unreadable pairs', () => {
      expect(contrastRatio('#777777', '#999999')).toBeLessThan(
        WCAG_AA_CONTRAST,
      );
    });
  });

  describe('relativeLuminance', () => {
    it('bounds', () => {
      expect(relativeLuminance('#000000')).toBe(0);
      expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    });
  });
});
