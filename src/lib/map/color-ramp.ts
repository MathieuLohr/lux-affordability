/**
 * OKLCH values copied verbatim from DESIGN.md "Affordability bands".
 * Five thresholded bands plus no-data grey, in monthly-burden-ratio space.
 *
 * Thresholds match the housing-economics tradition: 30% ceiling (OECD),
 * 50% / 70% match HUD severe-cost-burden categories.
 */
export const BAND_COLORS = {
  a: 'oklch(0.62 0.13 145)', // < 30%
  b: 'oklch(0.78 0.16 95)', //  30 - 40
  c: 'oklch(0.66 0.18 50)', //  40 - 50
  d: 'oklch(0.52 0.20 25)', //  50 - 70
  e: 'oklch(0.36 0.13 20)', // > 70
  x: 'oklch(0.88 0.005 260)', // no data
} as const;

export const BAND_LABELS = {
  a: 'within budget',
  b: 'stretched',
  c: 'burdened',
  d: 'severely burdened',
  e: 'beyond reach',
} as const;

export type BandKey = keyof typeof BAND_COLORS;

const THRESHOLDS: Array<{ max: number; key: BandKey }> = [
  { max: 0.3, key: 'a' },
  { max: 0.4, key: 'b' },
  { max: 0.5, key: 'c' },
  { max: 0.7, key: 'd' },
  { max: Infinity, key: 'e' },
];

export function burdenToBand(ratio: number | null): BandKey {
  if (ratio === null || !Number.isFinite(ratio)) return 'x';
  for (const t of THRESHOLDS) {
    if (ratio < t.max) return t.key;
  }
  return 'e';
}

export function burdenColor(ratio: number | null): string {
  return BAND_COLORS[burdenToBand(ratio)];
}
