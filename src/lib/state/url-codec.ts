// URL codec for scenario state. Pure functions only — no DOM, no history.
// Short param names keep the bar legible: ?i=4500&s=75.
// Defaults are omitted from the encoded string so a fresh visit lands on a
// canonical URL with no query.

export const INCOME_MIN = 1500;
export const INCOME_MAX = 8000;
export const SIZE_MIN = 20;
export const SIZE_MAX = 200;

export const DEFAULT_INCOME = 3540;
export const DEFAULT_SIZE = 55;

export type Scenario = {
  income: number;
  size: number;
};

export const DEFAULT_SCENARIO: Scenario = {
  income: DEFAULT_INCOME,
  size: DEFAULT_SIZE,
};

function parseInt_(raw: string | null, lo: number, hi: number): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  if (r < lo || r > hi) return null;
  return r;
}

export function decode(params: URLSearchParams): Scenario {
  const i = parseInt_(params.get('i'), INCOME_MIN, INCOME_MAX);
  const s = parseInt_(params.get('s'), SIZE_MIN, SIZE_MAX);
  return {
    income: i ?? DEFAULT_INCOME,
    size: s ?? DEFAULT_SIZE,
  };
}

export function encode(scenario: Scenario): string {
  const params = new URLSearchParams();
  const i = parseInt_(String(scenario.income), INCOME_MIN, INCOME_MAX) ?? DEFAULT_INCOME;
  const s = parseInt_(String(scenario.size), SIZE_MIN, SIZE_MAX) ?? DEFAULT_SIZE;
  if (i !== DEFAULT_INCOME) params.set('i', String(i));
  if (s !== DEFAULT_SIZE) params.set('s', String(s));
  return params.toString();
}
