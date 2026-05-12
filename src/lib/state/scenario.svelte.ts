// Svelte 5 runes module: scenario state mirrored to the URL.
//
// Cross-island sync. Each Astro Svelte island gets its own module instance,
// but they all live in the same window. URL is the singleton source of truth.
// Writes go through replaceState (slider) or pushState (presets); a custom
// `scenariochange` event lets sibling islands re-read after a same-tab write,
// since `popstate` only fires for back/forward, not for replace/pushState.
//
// Reactivity is local: `income` and `size` are $state, plus an in-memory
// mirror that updates instantly on setter calls so slider drags don't lag
// behind the debounced URL flush.

import {
  DEFAULT_INCOME,
  DEFAULT_SIZE,
  decode,
  encode,
} from './url-codec.ts';

const DEBOUNCE_MS = 300;
const SYNC_EVENT = 'lux:scenariochange';

let income = $state(DEFAULT_INCOME);
let size = $state(DEFAULT_SIZE);
let writeTimer: ReturnType<typeof setTimeout> | undefined;

function readFromUrl(): void {
  if (typeof window === 'undefined') return;
  const next = decode(new URLSearchParams(window.location.search));
  if (next.income !== income) income = next.income;
  if (next.size !== size) size = next.size;
}

function writeUrl(method: 'replace' | 'push'): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.search = encode({ income, size });
  if (method === 'push') history.pushState({}, '', url);
  else history.replaceState({}, '', url);
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

function schedule(method: 'replace' | 'push'): void {
  if (typeof window === 'undefined') return;
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => writeUrl(method), DEBOUNCE_MS);
}

function flush(method: 'replace' | 'push'): void {
  if (typeof window === 'undefined') return;
  clearTimeout(writeTimer);
  writeTimer = undefined;
  writeUrl(method);
}

if (typeof window !== 'undefined') {
  readFromUrl();
  window.addEventListener('popstate', readFromUrl);
  window.addEventListener(SYNC_EVENT, readFromUrl);
}

export const scenario = {
  get income(): number {
    return income;
  },
  set income(v: number) {
    income = v;
    schedule('replace');
  },
  get size(): number {
    return size;
  },
  set size(v: number) {
    size = v;
    schedule('replace');
  },
  /** Preset selection: commit immediately and push history. */
  applyIncomePreset(v: number): void {
    income = v;
    flush('push');
  },
  applySizePreset(v: number): void {
    size = v;
    flush('push');
  },
};
