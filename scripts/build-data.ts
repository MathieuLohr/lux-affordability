import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sourceUrls from '../data/source-urls.json' with { type: 'json' };
import { parseRents, parseSales } from './lib/parse-xls.ts';
import { estimateYields } from './lib/yield-estimate.ts';
import { merge } from './lib/merge.ts';
import { fetchLatestXls } from './lib/fetch-source.ts';
import type { CommuneFeatureCollection, Meta } from './lib/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const cacheDir = resolve(root, '.cache');
const outDir = resolve(root, 'public/data');

type Mode = 'live' | 'fixtures';

function modeFromArgs(): Mode {
  return process.argv.includes('--fixtures') ? 'fixtures' : 'live';
}

async function loadXls(kind: 'rents' | 'sales', mode: Mode): Promise<{ url: string; buf: Buffer }> {
  if (mode === 'fixtures') {
    const path = resolve(
      root,
      'scripts/fixtures',
      kind === 'rents' ? 'location-appartement-2025.xls' : 'prix-vente-2025.xls',
    );
    return { url: `file://${path}`, buf: readFileSync(path) };
  }
  const result = await fetchLatestXls(kind);
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(resolve(cacheDir, `${kind}.xls`), result.buf);
  return result;
}

export async function buildData(mode: Mode = 'live'): Promise<{
  fc: CommuneFeatureCollection;
  meta: Meta;
  unmatched: string[];
}> {
  const sources = sourceUrls as Record<string, { url?: string }>;
  const boundaryUrl = sources['boundaries']?.url ?? 'unknown';

  const [rentsRes, salesRes] = await Promise.all([loadXls('rents', mode), loadXls('sales', mode)]);
  const rents = parseRents(rentsRes.buf);
  const sales = parseSales(salesRes.buf);
  const yields = estimateYields(rents, sales);

  const boundaries = JSON.parse(
    readFileSync(resolve(root, 'data/communes_v2.geojson'), 'utf8'),
  ) as CommuneFeatureCollection;
  const { fc, unmatched } = merge(boundaries, rents, sales, yields);

  const counts = {
    measured: 0,
    estimated: 0,
    none: 0,
    total: fc.features.length,
  };
  for (const f of fc.features) {
    if (f.properties.rent_source === 'measured') counts.measured++;
    else if (f.properties.rent_source === 'estimated') counts.estimated++;
    else counts.none++;
  }

  const meta: Meta = {
    generated_at: new Date().toISOString(),
    period_rents: 'rolling 12 months ending Q4 2025',
    period_sales: 'calendar year 2025',
    source_urls: { rents: rentsRes.url, sales: salesRes.url, boundaries: boundaryUrl },
    yield_median: yields.median,
    counts,
  };

  return { fc, meta, unmatched };
}

async function main(): Promise<void> {
  const mode = modeFromArgs();
  const { fc, meta, unmatched } = await buildData(mode);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'communes.geojson'), JSON.stringify(fc));
  writeFileSync(resolve(outDir, 'meta.json'), JSON.stringify(meta, null, 2));

  console.log(`mode: ${mode}`);
  console.log(`features: ${fc.features.length}`);
  console.log(`measured: ${meta.counts.measured}, estimated: ${meta.counts.estimated}, none: ${meta.counts.none}`);
  console.log(`yield median: ${(meta.yield_median * 100).toFixed(3)}%`);
  if (unmatched.length > 0) {
    console.warn(`unmatched ${unmatched.length} rows: ${unmatched.join(', ')}`);
  }
  console.log(`wrote ${outDir}/communes.geojson and ${outDir}/meta.json`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
