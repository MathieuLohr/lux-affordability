import sourceUrls from '../../data/source-urls.json' with { type: 'json' };

const map = (sourceUrls as { name_normalization: { data_to_geojson: Record<string, string> } })
  .name_normalization.data_to_geojson;

export function normalizeCommune(raw: string): string {
  return map[raw] ?? raw;
}

const JUNK_PREFIXES = ['Total', 'Source', 'Moyenne nationale', 'A retrouver', 'Note', 'Précaution', 'Précisions'];

export function isJunkRow(firstCell: unknown): boolean {
  if (typeof firstCell !== 'string') return true;
  const t = firstCell.trim();
  if (t === '') return true;
  return JUNK_PREFIXES.some((p) => t.startsWith(p));
}
