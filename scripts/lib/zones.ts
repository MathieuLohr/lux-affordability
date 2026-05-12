/**
 * Zone-level fallback for communes lacking commune-level rent AND sale data.
 *
 * Source: Le Logement en Chiffres n°19 (Mars 2026), Graphique 6, p. 13.
 * URL: https://download.data.public.lu/resources/prix-de-vente-des-appartements-le-logement-en-chiffres/20260326-100211/logement-en-chiffre-19.pdf
 *
 * The Observatoire publishes apartment sale prices aggregated into 5 zones
 * covering all 12 Luxembourgish cantons. Period: 2025-01-01 to 2025-12-31,
 * existing-stock segment. Values are arithmetic means of commune-level prices
 * weighted by transaction count within each zone.
 *
 * Rents are not published by zone, so we derive a zone-level rent by applying
 * the national median yield to the zone sale price (same formula as the
 * commune-level estimated path), producing rent_source = "zone".
 *
 * Maintenance: when a new "Logement en Chiffres" issue is published, update
 * the numbers in ZONE_SALE_EUR_PER_M2 and bump PDF_REFERENCE.
 */

export type ZoneId = 'luxembourg' | 'capellen-mersch' | 'esch' | 'est' | 'nord';

export const PDF_REFERENCE = {
  issue: 'n°19',
  date: 'Mars 2026',
  period: '2025-01-01 to 2025-12-31',
  url: 'https://download.data.public.lu/resources/prix-de-vente-des-appartements-le-logement-en-chiffres/20260326-100211/logement-en-chiffre-19.pdf',
  graph: 'Graphique 6, p. 13',
} as const;

export const CANTON_TO_ZONE: Record<string, ZoneId> = {
  Luxembourg: 'luxembourg',
  Capellen: 'capellen-mersch',
  Mersch: 'capellen-mersch',
  'Esch-sur-Alzette': 'esch',
  Echternach: 'est',
  Grevenmacher: 'est',
  Remich: 'est',
  Clervaux: 'nord',
  Diekirch: 'nord',
  Redange: 'nord',
  Vianden: 'nord',
  Wiltz: 'nord',
};

export const ZONE_SALE_EUR_PER_M2: Record<
  ZoneId,
  { existing: number; vefa: number; label: string }
> = {
  luxembourg: { existing: 9787, vefa: 11661, label: 'Canton de Luxembourg' },
  'capellen-mersch': { existing: 7526, vefa: 9093, label: 'Capellen-Mersch' },
  esch: { existing: 6864, vefa: 8688, label: "Canton d'Esch-sur-Alzette" },
  est: { existing: 6751, vefa: 9154, label: 'Est' },
  nord: { existing: 6214, vefa: 7872, label: 'Nord' },
};

export function zoneForCanton(canton: string): ZoneId | null {
  return CANTON_TO_ZONE[canton] ?? null;
}

export function zoneSalePrice(
  canton: string,
): { eur_per_m2: number; zone: ZoneId; label: string } | null {
  const zone = zoneForCanton(canton);
  if (!zone) return null;
  return { eur_per_m2: ZONE_SALE_EUR_PER_M2[zone].existing, zone, label: ZONE_SALE_EUR_PER_M2[zone].label };
}
