// Svelte 5 runes module: scenario state mirrored to the URL.
//
// Cross-island sync. Each Astro Svelte island gets its own module instance,
// but they all live in the same window. The URL is the singleton source of
// truth for *persistence* (refresh / share / back-forward), but it is NOT the
// channel used for live sync between islands — the `lux:scenariochange` event
// carries the new values in its `detail` payload so a sibling island can
// update synchronously without waiting for the debounced URL write.
//
// Why not "write URL then dispatch"? Slider drags would either flood URL
// history (no debounce) or leave the map and tooltip lagging 300 ms behind
// the user's input (debounce). Carrying values in the event detail lets us
// keep the debounce on URL writes only.
//
// Reactivity is local: `income` and `size` are $state. On any same-tab write
// (setter, preset, or popstate), every island's listener updates its own
// local $state, which kicks each island's effects.

import {
  DEFAULT_INCOME,
  DEFAULT_SIZE,
  decode,
  encode,
} from './url-codec.ts';

const DEBOUNCE_MS = 300;
const SYNC_EVENT = 'lux:scenariochange';

type SyncDetail = { income?: number; size?: number };

let income = $state(DEFAULT_INCOME);
let size = $state(DEFAULT_SIZE);
let writeTimer: ReturnType<typeof setTimeout> | undefined;

function readFromUrl(): void {
  if (typeof window === 'undefined') return;
  const next = decode(new URLSearchParams(window.location.search));
  if (next.income !== income) income = next.income;
  if (next.size !== size) size = next.size;
}

function applySync(detail: SyncDetail | null): void {
  if (detail && (typeof detail.income === 'number' || typeof detail.size === 'number')) {
    if (typeof detail.income === 'number' && detail.income !== income) income = detail.income;
    if (typeof detail.size === 'number' && detail.size !== size) size = detail.size;
    return;
  }
  // No detail (e.g. popstate fallback): re-read URL.
  readFromUrl();
}

function dispatchSync(): void {
  if (typeof window === 'undefined') return;
  const detail: SyncDetail = { income, size };
  window.dispatchEvent(new CustomEvent<SyncDetail>(SYNC_EVENT, { detail }));
}

function writeUrl(method: 'replace' | 'push'): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.search = encode({ income, size });
  if (method === 'push') history.pushState({}, '', url);
  else history.replaceState({}, '', url);
}

function scheduleUrl(method: 'replace' | 'push'): void {
  if (typeof window === 'undefined') return;
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => writeUrl(method), DEBOUNCE_MS);
}

function flushUrl(method: 'replace' | 'push'): void {
  if (typeof window === 'undefined') return;
  clearTimeout(writeTimer);
  writeTimer = undefined;
  writeUrl(method);
}

if (typeof window !== 'undefined') {
  readFromUrl();
  window.addEventListener('popstate', readFromUrl);
  window.addEventListener(SYNC_EVENT, (ev) => {
    applySync((ev as CustomEvent<SyncDetail>).detail ?? null);
  });
}

export const scenario = {
  get income(): number {
    return income;
  },
  set income(v: number) {
    income = v;
    dispatchSync();
    scheduleUrl('replace');
  },
  get size(): number {
    return size;
  },
  set size(v: number) {
    size = v;
    dispatchSync();
    scheduleUrl('replace');
  },
  /** Preset selection: commit immediately and push history. */
  applyIncomePreset(v: number): void {
    income = v;
    dispatchSync();
    flushUrl('push');
  },
  applySizePreset(v: number): void {
    size = v;
    dispatchSync();
    flushUrl('push');
  },
};
