export type RentRow = {
  commune: string;
  n_offers: number;
  avg_rent_eur: number | null;
  rent_per_m2: number | null;
};

export type SaleRow = {
  commune: string;
  n_existing: number;
  price_existing_per_m2: number | null;
  n_vefa: number;
  price_vefa_per_m2: number | null;
};

export type YieldResult = {
  median_yield: number;
  intersect_count: number;
};

export type FeatureProperties = {
  COMMUNE: string;
  CANTON: string;
  LAU2: string;
  rent_per_m2: number | null;
  rent_source: 'measured' | 'estimated' | 'zone' | null;
  rent_offers: number | null;
  sale_per_m2: number | null;
  sales_n: number | null;
  zone_label: string | null;
};

export type CommuneFeature = {
  type: 'Feature';
  properties: FeatureProperties;
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };
};

export type CommuneFeatureCollection = {
  type: 'FeatureCollection';
  features: CommuneFeature[];
};

export type Meta = {
  generated_at: string;
  period_rents: string;
  period_sales: string;
  source_urls: { rents: string; sales: string; boundaries: string };
  yield_median: number;
  counts: { measured: number; estimated: number; zone: number; none: number; total: number };
};
