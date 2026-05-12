import { describe, expect, it } from 'vitest';
import type { RentRow, SaleRow } from '../lib/types.ts';
import { estimateYields, median, pickSalePrice } from '../lib/yield-estimate.ts';

function rent(commune: string, per_m2: number | null, n = 50): RentRow {
  return { commune, n_offers: n, avg_rent_eur: null, rent_per_m2: per_m2 };
}

function sale(commune: string, existing: number | null, vefa: number | null = null): SaleRow {
  return {
    commune,
    n_existing: existing !== null ? 50 : 0,
    price_existing_per_m2: existing,
    n_vefa: vefa !== null ? 10 : 0,
    price_vefa_per_m2: vefa,
  };
}

describe('median', () => {
  it('odd length returns the middle element', () => {
    expect(median([3, 1, 2])).toBe(2);
  });
  it('even length returns the mean of the two middle elements', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it('throws on empty input', () => {
    expect(() => median([])).toThrow();
  });
});

describe('pickSalePrice', () => {
  it('prefers existing over VEFA', () => {
    expect(pickSalePrice(sale('X', 8000, 12000))?.value).toBe(8000);
  });
  it('falls back to VEFA when existing is suppressed', () => {
    expect(pickSalePrice(sale('X', null, 12000))?.value).toBe(12000);
  });
  it('returns null when both are suppressed', () => {
    expect(pickSalePrice(sale('X', null, null))).toBeNull();
  });
});

describe('estimateYields', () => {
  it('computes median yield on 31-commune fixture matching 4.4% band', () => {
    // 31 synthetic pairs spaced across the 3.2% - 7.8% range observed in 2025.
    // Median by construction is the middle pair: 4.40%.
    const pairs: Array<[string, number, number]> = [];
    const yields = [
      0.0326, 0.0332, 0.0371, 0.0378, 0.0382, 0.0388, 0.0395, 0.0401, 0.0408, 0.0415, 0.0422,
      0.0428, 0.0432, 0.0436, 0.0438, 0.0440, 0.0442, 0.0445, 0.0448, 0.0452, 0.0458, 0.0466,
      0.0478, 0.0492, 0.0510, 0.0532, 0.0558, 0.0589, 0.0625, 0.0680, 0.0780,
    ];
    for (let i = 0; i < yields.length; i++) {
      const salePrice = 8000;
      const rentPerM2 = (salePrice * yields[i]) / 12;
      pairs.push([`C${i}`, rentPerM2, salePrice]);
    }
    const rents = pairs.map(([c, r]) => rent(c, r));
    const sales = pairs.map(([c, , s]) => sale(c, s));
    const out = estimateYields(rents, sales);
    expect(out.intersect_count).toBe(31);
    expect(out.median).toBeCloseTo(0.044, 3);
  });

  it('produces estimates only for sale-priced communes lacking a measured rent', () => {
    // 12 intersection pairs (above the 10-pair floor) + targeted estimate cases.
    const intersect: RentRow[] = [];
    const intersectSales: SaleRow[] = [];
    for (let i = 0; i < 12; i++) {
      intersect.push(rent(`M${i}`, 30 + i));
      intersectSales.push(sale(`M${i}`, 8000));
    }
    const rents = [
      ...intersect,
      rent('B-no-rent', null, 5), // listed in rent file but suppressed
    ];
    const sales = [
      ...intersectSales,
      sale('B-no-rent', 7000), // has sale, no measured rent → estimated
      sale('D-only-sale', 9000), // not in rent file at all → estimated
      sale('E-only-vefa', null, 10000), // VEFA fallback → estimated
      sale('F-both-null', null, null), // no usable sale price → skipped
    ];
    const out = estimateYields(rents, sales);
    for (let i = 0; i < 12; i++) expect(out.estimates.has(`M${i}`)).toBe(false);
    expect(out.estimates.has('B-no-rent')).toBe(true);
    expect(out.estimates.has('D-only-sale')).toBe(true);
    expect(out.estimates.has('E-only-vefa')).toBe(true);
    expect(out.estimates.has('F-both-null')).toBe(false);
  });

  it('throws when too few intersection pairs are available', () => {
    const rents = [rent('A', 30)];
    const sales = [sale('A', 8000)];
    expect(() => estimateYields(rents, sales)).toThrow(/refusing/);
  });
});
