import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { buildData } from '../build-data.ts';

describe('full pipeline regression (fixtures)', () => {
  it('produces 100 features and counts within drift tolerance', async () => {
    const { fc, meta } = await buildData('fixtures');
    expect(fc.features.length).toBe(100);

    expect(meta.counts.measured).toBeGreaterThanOrEqual(32);
    expect(meta.counts.measured).toBeLessThanOrEqual(36);
    expect(meta.counts.estimated).toBeGreaterThanOrEqual(22);
    expect(meta.counts.estimated).toBeLessThanOrEqual(28);
    expect(meta.counts.none).toBe(100 - meta.counts.measured - meta.counts.estimated);
    expect(meta.counts.total).toBe(100);
  });

  it('yields a 2025-vintage median in the 4.0% - 4.8% band', async () => {
    const { meta } = await buildData('fixtures');
    expect(meta.yield_median).toBeGreaterThan(0.04);
    expect(meta.yield_median).toBeLessThan(0.048);
  });

  it('every feature keeps boundary identity fields (COMMUNE/CANTON/LAU2)', async () => {
    const { fc } = await buildData('fixtures');
    for (const f of fc.features) {
      expect(typeof f.properties.COMMUNE).toBe('string');
      expect(typeof f.properties.CANTON).toBe('string');
      expect(typeof f.properties.LAU2).toBe('string');
    }
  });

  it('preserves schema (no extra or missing property keys)', async () => {
    const { fc } = await buildData('fixtures');
    const expected = [
      'COMMUNE',
      'CANTON',
      'LAU2',
      'rent_per_m2',
      'rent_source',
      'rent_offers',
      'sale_per_m2',
      'sales_n',
    ].sort();
    for (const f of fc.features) {
      const got = Object.keys(f.properties).sort();
      expect(got).toEqual(expected);
    }
  });

  it('emits no estimates for communes that have no sale price', async () => {
    const { fc } = await buildData('fixtures');
    for (const f of fc.features) {
      if (f.properties.rent_source === 'estimated') {
        expect(f.properties.sale_per_m2).not.toBeNull();
      }
    }
  });

  it('reports zero unmatched data rows (all data names normalize to a boundary)', async () => {
    const { unmatched } = await buildData('fixtures');
    expect(unmatched).toEqual([]);
  });

  it('output is deterministic across runs (snapshot hash)', async () => {
    const a = await buildData('fixtures');
    const b = await buildData('fixtures');
    const ha = createHash('sha256').update(JSON.stringify(a.fc)).digest('hex');
    const hb = createHash('sha256').update(JSON.stringify(b.fc)).digest('hex');
    expect(ha).toBe(hb);
  });
});
