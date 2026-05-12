import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseRents, parseSales } from '../lib/parse-xls.ts';

const here = dirname(fileURLToPath(import.meta.url));
const rentBuf = readFileSync(resolve(here, '../fixtures/location-appartement-2025.xls'));
const saleBuf = readFileSync(resolve(here, '../fixtures/prix-vente-2025.xls'));

describe('parseRents', () => {
  const rents = parseRents(rentBuf);

  it('produces one row per published commune', () => {
    expect(rents.length).toBeGreaterThan(50);
    expect(rents.length).toBeLessThan(110);
  });

  it('drops Total / Source / Moyenne nationale aggregate rows', () => {
    for (const r of rents) {
      expect(r.commune).not.toMatch(/^(Total|Source|Moyenne|A retrouver)/);
    }
  });

  it('converts suppression marker "*" to null', () => {
    const beaufort = rents.find((r) => r.commune === 'Beaufort');
    expect(beaufort).toBeDefined();
    expect(beaufort?.n_offers).toBe(3);
    expect(beaufort?.rent_per_m2).toBeNull();
    expect(beaufort?.avg_rent_eur).toBeNull();
  });

  it('parses a known measured commune precisely', () => {
    const bertrange = rents.find((r) => r.commune === 'Bertrange');
    expect(bertrange).toBeDefined();
    expect(bertrange?.n_offers).toBe(197);
    expect(bertrange?.rent_per_m2).toBeCloseTo(39.70805, 4);
    expect(bertrange?.avg_rent_eur).toBeCloseTo(1940.305, 2);
  });

  it('counts ~34 measured communes (rows with non-null rent_per_m2)', () => {
    const measured = rents.filter((r) => r.rent_per_m2 !== null);
    expect(measured.length).toBeGreaterThanOrEqual(32);
    expect(measured.length).toBeLessThanOrEqual(36);
  });
});

describe('parseSales', () => {
  const sales = parseSales(saleBuf);

  it('parses one row per commune', () => {
    expect(sales.length).toBeGreaterThan(80);
  });

  it('drops aggregate / source rows', () => {
    for (const s of sales) {
      expect(s.commune).not.toMatch(/^(Total|Source|Moyenne|A retrouver)/);
    }
  });

  it('normalizes commune names per data_to_geojson map', () => {
    expect(sales.find((s) => s.commune === 'Luxembourg')).toBeDefined();
    expect(sales.find((s) => s.commune === 'Luxembourg-Ville')).toBeUndefined();
    expect(sales.find((s) => s.commune === 'Pétange')).toBeDefined();
    expect(sales.find((s) => s.commune === 'Redange/Attert')).toBeDefined();
  });

  it('converts suppression marker "*" to null in both existing and VEFA columns', () => {
    const beaufort = sales.find((s) => s.commune === 'Beaufort');
    expect(beaufort).toBeDefined();
    expect(beaufort?.n_existing).toBe(4);
    expect(beaufort?.price_existing_per_m2).toBeNull();
    expect(beaufort?.price_vefa_per_m2).toBeNull();
  });

  it('parses a known dual-priced commune precisely', () => {
    const bertrange = sales.find((s) => s.commune === 'Bertrange');
    expect(bertrange).toBeDefined();
    expect(bertrange?.n_existing).toBe(47);
    expect(bertrange?.price_existing_per_m2).toBeCloseTo(9991.416, 2);
    expect(bertrange?.n_vefa).toBe(16);
    expect(bertrange?.price_vefa_per_m2).toBeCloseTo(12360.54, 2);
  });
});
