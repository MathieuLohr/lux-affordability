import sourceUrls from '../../data/source-urls.json' with { type: 'json' };

type ApiResource = { url: string; last_modified: string; format: string };
type ApiResponse = { resources: ApiResource[] };

const FALLBACK_URL_KEYS = {
  rents: 'rents_apartments_by_commune',
  sales: 'sales_apartments_by_commune',
} as const;

const API_KEYS = {
  rents: 'rents_apartments_by_commune',
  sales: 'sales_apartments_by_commune',
} as const;

function fallbackUrl(kind: 'rents' | 'sales'): string {
  const sources = sourceUrls as Record<string, { url?: string; api_resources_endpoint?: string }>;
  const entry = sources[FALLBACK_URL_KEYS[kind]];
  if (!entry?.url) throw new Error(`no fallback URL in source-urls.json for ${kind}`);
  return entry.url;
}

function apiEndpoint(kind: 'rents' | 'sales'): string {
  const sources = sourceUrls as Record<string, { api_resources_endpoint?: string }>;
  const entry = sources[API_KEYS[kind]];
  if (!entry?.api_resources_endpoint) throw new Error(`no api endpoint for ${kind}`);
  return entry.api_resources_endpoint;
}

// The data.public.lu API returns resources without a stable schema for "latest year".
// We discriminate on URL pattern:
//   rents:  /location-appartement-YYYY.xls  (apartments only; ignore "maison" + historical timeseries)
//   sales:  /...par-commune-YYYY.xls        (calendar-year file; ignore "YYYYtN" rolling-quarter variants)
// Then pick the highest year.
const URL_PATTERNS: Record<'rents' | 'sales', RegExp> = {
  rents: /\/location-appartement-(\d{4})\.xls$/i,
  sales: /\/[^/]*par-commune-(\d{4})\.xls$/i,
};

async function resolveLatestXls(kind: 'rents' | 'sales'): Promise<string> {
  const endpoint = apiEndpoint(kind);
  const res = await fetch(endpoint);
  if (!res.ok) {
    console.warn(`api ${endpoint} returned ${res.status}, using hardcoded fallback`);
    return fallbackUrl(kind);
  }
  const json = (await res.json()) as ApiResponse;
  const pattern = URL_PATTERNS[kind];
  const matched = (json.resources ?? [])
    .filter((r) => r.format?.toLowerCase() === 'xls' && pattern.test(r.url))
    .map((r) => ({ url: r.url, year: parseInt(r.url.match(pattern)![1], 10) }))
    .sort((a, b) => b.year - a.year);
  if (matched.length === 0) {
    console.warn(`no ${kind} xls matched pattern ${pattern}, using fallback`);
    return fallbackUrl(kind);
  }
  return matched[0].url;
}

export async function fetchLatestXls(kind: 'rents' | 'sales'): Promise<{ url: string; buf: Buffer }> {
  const url = await resolveLatestXls(kind);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { url, buf };
}
