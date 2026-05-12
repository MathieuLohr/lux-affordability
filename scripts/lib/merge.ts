import type {
  CommuneFeature,
  CommuneFeatureCollection,
  FeatureProperties,
  RentRow,
  SaleRow,
} from './types.ts';
import { pickSalePrice, type YieldOutput } from './yield-estimate.ts';

export function merge(
  boundaries: CommuneFeatureCollection,
  rents: RentRow[],
  sales: SaleRow[],
  yields: YieldOutput,
): { fc: CommuneFeatureCollection; unmatched: string[] } {
  const rentMap = new Map(rents.map((r) => [r.commune, r]));
  const saleMap = new Map(sales.map((s) => [s.commune, s]));
  const seen = new Set<string>();

  const features: CommuneFeature[] = boundaries.features.map((f) => {
    const name = f.properties.COMMUNE;
    seen.add(name);
    const rentRow = rentMap.get(name);
    const saleRow = saleMap.get(name);

    let rent_per_m2: number | null = null;
    let rent_source: FeatureProperties['rent_source'] = null;
    let rent_offers: number | null = null;
    if (rentRow?.rent_per_m2 !== undefined && rentRow?.rent_per_m2 !== null) {
      rent_per_m2 = round(rentRow.rent_per_m2, 2);
      rent_source = 'measured';
      rent_offers = rentRow.n_offers;
    } else if (yields.estimates.has(name)) {
      rent_per_m2 = round(yields.estimates.get(name)!, 2);
      rent_source = 'estimated';
      rent_offers = null;
    }

    let sale_per_m2: number | null = null;
    let sales_n: number | null = null;
    if (saleRow) {
      const picked = pickSalePrice(saleRow);
      if (picked) {
        sale_per_m2 = round(picked.value, 0);
        sales_n = picked.n;
      }
    }

    const props: FeatureProperties = {
      COMMUNE: name,
      CANTON: f.properties.CANTON,
      LAU2: f.properties.LAU2,
      rent_per_m2,
      rent_source,
      rent_offers,
      sale_per_m2,
      sales_n,
    };
    return { type: 'Feature', properties: props, geometry: f.geometry };
  });

  const unmatched: string[] = [];
  for (const r of rents) if (!seen.has(r.commune)) unmatched.push(`rent:${r.commune}`);
  for (const s of sales) if (!seen.has(s.commune)) unmatched.push(`sale:${s.commune}`);

  return {
    fc: { type: 'FeatureCollection', features },
    unmatched,
  };
}

function round(v: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}
