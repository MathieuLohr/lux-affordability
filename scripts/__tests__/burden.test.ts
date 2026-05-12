import { describe, expect, it } from 'vitest';
import { DEFAULT_SCENARIO, burden } from '../../src/lib/map/burden.ts';

describe('burden', () => {
  it('returns null when rent_per_m2 is null', () => {
    expect(burden(null, DEFAULT_SCENARIO)).toBeNull();
  });

  it('returns null on zero/negative income', () => {
    expect(burden(30, { income: 0, size: 55 })).toBeNull();
    expect(burden(30, { income: -100, size: 55 })).toBeNull();
  });

  it('computes monthly burden ratio (rent_per_m2 is monthly per m²)', () => {
    expect(burden(30, { income: 3000, size: 50 })).toBeCloseTo(0.5, 6);
    expect(burden(20, { income: 4000, size: 60 })).toBeCloseTo(0.3, 6);
  });

  it('default scenario: Bertrange-like (rent 39.7 €/m²) is 61.7% burdened', () => {
    expect(burden(39.7, DEFAULT_SCENARIO)).toBeCloseTo((39.7 * 55) / 3540, 4);
  });
});
