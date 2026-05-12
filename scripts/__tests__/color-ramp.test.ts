import { describe, expect, it } from 'vitest';
import { BAND_COLORS, burdenToBand, burdenColor } from '../../src/lib/map/color-ramp.ts';

describe('burdenToBand', () => {
  it('null/NaN/Infinity → x (no data)', () => {
    expect(burdenToBand(null)).toBe('x');
    expect(burdenToBand(NaN)).toBe('x');
    expect(burdenToBand(Infinity)).toBe('x');
  });

  it('under 30% → a', () => {
    expect(burdenToBand(0)).toBe('a');
    expect(burdenToBand(0.299)).toBe('a');
  });

  it('30% boundary lands in b (stretched)', () => {
    expect(burdenToBand(0.3)).toBe('b');
    expect(burdenToBand(0.399)).toBe('b');
  });

  it('40% boundary lands in c (burdened)', () => {
    expect(burdenToBand(0.4)).toBe('c');
    expect(burdenToBand(0.499)).toBe('c');
  });

  it('50% boundary lands in d (severely burdened)', () => {
    expect(burdenToBand(0.5)).toBe('d');
    expect(burdenToBand(0.699)).toBe('d');
  });

  it('70%+ lands in e (beyond reach)', () => {
    expect(burdenToBand(0.7)).toBe('e');
    expect(burdenToBand(1.5)).toBe('e');
  });
});

describe('burdenColor', () => {
  it('routes each band through BAND_COLORS', () => {
    expect(burdenColor(null)).toBe(BAND_COLORS.x);
    expect(burdenColor(0.2)).toBe(BAND_COLORS.a);
    expect(burdenColor(0.35)).toBe(BAND_COLORS.b);
    expect(burdenColor(0.45)).toBe(BAND_COLORS.c);
    expect(burdenColor(0.6)).toBe(BAND_COLORS.d);
    expect(burdenColor(0.8)).toBe(BAND_COLORS.e);
  });
});
