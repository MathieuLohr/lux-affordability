export type Scenario = {
  income: number;
  size: number;
};

export const DEFAULT_SCENARIO: Scenario = {
  income: 3540,
  size: 55,
};

/**
 * rent_per_m2 from data.public.lu is monthly euros per square meter.
 * burden = monthly rent for unit / monthly net income.
 * Returns null when rent is unknown.
 */
export function burden(rent_per_m2: number | null, scenario: Scenario): number | null {
  if (rent_per_m2 === null) return null;
  if (scenario.income <= 0) return null;
  return (rent_per_m2 * scenario.size) / scenario.income;
}
