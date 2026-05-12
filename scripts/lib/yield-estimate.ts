import type { RentRow, SaleRow } from './types.ts';

export function median(values: number[]): number {
  if (values.length === 0) throw new Error('median of empty array');
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function pickSalePrice(s: SaleRow): { value: number; n: number } | null {
  if (s.price_existing_per_m2 !== null) {
    const n = s.n_existing + (s.price_vefa_per_m2 !== null ? s.n_vefa : 0);
    return { value: s.price_existing_per_m2, n };
  }
  if (s.price_vefa_per_m2 !== null) return { value: s.price_vefa_per_m2, n: s.n_vefa };
  return null;
}

export type YieldOutput = {
  median: number;
  intersect_count: number;
  estimates: Map<string, number>;
};

export function estimateYields(rents: RentRow[], sales: SaleRow[]): YieldOutput {
  const rentByName = new Map<string, number>();
  for (const r of rents) {
    if (r.rent_per_m2 !== null) rentByName.set(r.commune, r.rent_per_m2);
  }

  const yields: number[] = [];
  for (const s of sales) {
    const sale = pickSalePrice(s);
    if (!sale) continue;
    const rent = rentByName.get(s.commune);
    if (rent === undefined) continue;
    yields.push((rent * 12) / sale.value);
  }
  if (yields.length < 10) {
    throw new Error(`refusing to compute yield from ${yields.length} pairs (need >=10)`);
  }
  const med = median(yields);

  const estimates = new Map<string, number>();
  for (const s of sales) {
    if (rentByName.has(s.commune)) continue;
    const sale = pickSalePrice(s);
    if (!sale) continue;
    estimates.set(s.commune, (sale.value * med) / 12);
  }

  return { median: med, intersect_count: yields.length, estimates };
}
