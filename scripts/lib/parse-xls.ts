import * as XLSX from 'xlsx';
import type { RentRow, SaleRow } from './types.ts';
import { isJunkRow, normalizeCommune } from './normalize-names.ts';

function readFirstSheet(buf: Buffer): unknown[][] {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false }) as unknown[][];
}

function findHeaderRow(aoa: unknown[][]): number {
  for (let i = 0; i < aoa.length; i++) {
    const first = aoa[i]?.[0];
    if (typeof first === 'string' && first.trim() === 'Commune') return i;
  }
  throw new Error('header row not found: no row with first cell "Commune"');
}

function numOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

export function parseRents(buf: Buffer): RentRow[] {
  const aoa = readFirstSheet(buf);
  const header = findHeaderRow(aoa);
  const out: RentRow[] = [];
  for (let i = header + 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row || isJunkRow(row[0])) continue;
    const commune = normalizeCommune((row[0] as string).trim());
    const n = numOrNull(row[1]) ?? 0;
    out.push({
      commune,
      n_offers: n,
      avg_rent_eur: numOrNull(row[2]),
      rent_per_m2: numOrNull(row[3]),
    });
  }
  return out;
}

export function parseSales(buf: Buffer): SaleRow[] {
  const aoa = readFirstSheet(buf);
  const header = findHeaderRow(aoa);
  const out: SaleRow[] = [];
  for (let i = header + 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row || isJunkRow(row[0])) continue;
    const commune = normalizeCommune((row[0] as string).trim());
    out.push({
      commune,
      n_existing: numOrNull(row[1]) ?? 0,
      price_existing_per_m2: numOrNull(row[2]),
      n_vefa: numOrNull(row[4]) ?? 0,
      price_vefa_per_m2: numOrNull(row[5]),
    });
  }
  return out;
}
