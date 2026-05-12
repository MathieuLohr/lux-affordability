# Handover, Phase B.1 in flight

Continuation of the lux-affordability map port. Phase A.2 is fully shipped on `main`. Phase B.1 is half landed in commit [7e0a960](https://github.com/MathieuLohr/lux-affordability/commit/7e0a960) on `claude/ecstatic-grothendieck-76aed3`. The basemap renders. The commune polygons do not. The blocker is well-characterised below.

## Current state

### What's verified working

- `pnpm test` green: 44 tests across 6 files (the four phase A.2 files plus `burden`, `color-ramp`, `oklch-to-hex`).
- `pnpm check` clean: 0 errors, 0 warnings.
- `pnpm build` clean.
- `pnpm dev` boots, page at `/` renders the masthead, map container, Legend, CoverageStrip.
- MapTiler Positron basemap renders with the provided key (`f1VLUktLjsRGDVM5NFgE` in `.env`, gitignored).
- The `map.on('load')` event fires (logged).
- Astro env wiring works: `import.meta.env.PUBLIC_MAPTILER_KEY` returns the key client-side.

### What's blocked

The 100 commune polygons never appear. Console error:
```
[map error] There is no tile manager with ID 'communes'
```

This error fires when a layer references a source that doesn't exist. Yet my code calls `addSource(SOURCE_ID, ...)` synchronously before any `addLayer(...)`. A manual `addSource` from a `preview_eval` REPL using the same spec works fine: source is registered, no error.

## Pinpointed failure mode

The `m.on('load', async () => { ... })` handler logs `[map] load fired` then falls silent. No follow-up logs (`[map] fetched X features`, `[map] source added`, etc.) appear, even though they're wrapped in a try/catch that logs to console on throw. That means execution stops between line 105 (the first log) and line 107 (the `await fetch(dataUrl)`).

Most likely hypothesis: **the fetch promise never resolves in the headless preview**, OR the `await` on `requestAnimationFrame` (line 88) hangs in the headless context after the second mount. The Promise-collected error from an earlier eval ("Promise was collected") corroborates this — the JS task is being garbage-collected before it completes, which happens when the page is hidden / inactive in Playwright.

This is consistent with the observation that:
- The basemap (whose tiles are fetched by MapLibre's internal worker, not via the user load handler) renders fine.
- The user load handler (which awaits `fetch(dataUrl)`) silently stalls.

## Reproduction

```bash
cd .claude/worktrees/ecstatic-grothendieck-76aed3
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
pnpm install
pnpm test           # 44 should be green
pnpm dev            # localhost:4321
```

Open in a **real browser** (not Claude Preview / Playwright). The commune polygons may render immediately, in which case the only remaining work is to clean up the debug aids.

If polygons still don't render in a real browser:
1. DevTools Console → look for "[map] load fired" then "[map] fetched 100 features".
2. If the second log is missing, the fetch is stalling. Check Network tab for `/data/communes.geojson` request.
3. If both logs are present but "no tile manager" still fires, inspect `window.__map.getStyle().sources` — if `communes` is missing, addSource itself failed silently (try-catch should have caught it, so check the catch log).

## Diagnostic shortcuts left in the code

These are intentionally left in `src/lib/map/Map.svelte` for next-session debugging:

- `(window as any).__map = m` — map instance exposed for REPL inspection
- `m.on('error', (e) => console.error('[map error]', ...))` — surfaces internal MapLibre warnings
- `console.log('[map] load fired')` etc. — checkpoints inside the load handler
- `try { ... } catch (e) { console.error('[map] load handler threw:', e) }` — catches any silent throw in the load handler

Remove all four when polygons render.

## File map of B.1 work

```
src/lib/map/
  Map.svelte          # island, dynamic-imports maplibre, full lifecycle
  style.ts            # MapTiler Positron URL + Lux bbox constants
  layers.ts           # 5 layer specs (3 fills + hatch + outline) + toMapColor
  hatch-pattern.ts    # 8x8 diagonal stripe ImageData
  color-ramp.ts       # 5+1 OKLCH bands + threshold logic (pure, tested)
  burden.ts           # (rent_per_m2 × size) / income, pure, tested
  oklch-to-hex.ts     # OKLCH → sRGB hex math, tested
src/lib/components/
  Tooltip.svelte      # cursor-follow on hover, pinned top-right on click
  Legend.svelte       # 5-step ramp + 30% threshold pill + band labels
  CoverageStrip.svelte # 34/23/43 footer band
src/components/
  MapMasthead.astro   # top bar with site title + methodology link
src/pages/
  index.astro         # mounts Map (client:only="svelte") + chrome
scripts/__tests__/
  burden.test.ts          # 4 tests
  color-ramp.test.ts      # 9 tests
  oklch-to-hex.test.ts    # 7 tests
```

## Locked decisions in B.1 (don't relitigate)

- **MapLibre 5.x rejects OKLCH** in the style spec. Solution: `oklch-to-hex.ts` does the math directly (Ottosson's spec). Canvas `fillStyle` round-trip does NOT work in modern Chromium (keeps OKLCH as-is).
- **`feature-state` can't be used in `filter`**, only in paint expressions. Pinned outline is handled via paint-side `case` expressions in `outlineLayer`, not a separate filtered layer.
- **`addSource(..., { promoteId: undefined })`** trips MapLibre 5 validation. Omit the field entirely.
- **`maxBounds`** option was removed because MapLibre 5 had trouble with the constructor when both `maxBounds` and `attributionControl` were set. Bounds can be re-added later via `m.setMaxBounds(...)` after `load`.
- **Default scenario**: `{ income: 3540, size: 55 }` (STATEC SILC median net + 1-bed apartment). Hardcoded for B.1, becomes URL-driven in B.2.
- **Coverage counts** (34/23/43) come from `public/data/meta.json` imported at build time, not fetched at runtime.

## Next session, recommended first 30 minutes

1. `pnpm install && pnpm dev`, open `http://localhost:4321` in a real browser (Chrome/Safari/Firefox).
2. Check DevTools console for the load-handler checkpoints. They should ALL fire in a real browser. If they do, polygons should appear.
3. If they don't fire in a real browser either:
   - Bisect by commenting out the `await requestAnimationFrame(...)` line at Map.svelte:88. Replace with `await new Promise(r => setTimeout(r, 0))`.
   - If that doesn't help, replace the `client:only="svelte"` with `client:visible` in `src/pages/index.astro` and see if the directive matters.
4. Once polygons render:
   - Remove the 4 debug aids listed above.
   - Hover a measured commune, confirm tooltip shows a percent + band name + monthly rent.
   - Click to pin, Esc to unpin, click another to transfer pin.
   - Confirm 23 estimated communes show the diagonal hatch.
   - Confirm 43 no-data communes are flat grey (`band-x`).
5. Run `pnpm test && pnpm check && pnpm build`. All green.
6. Commit "complete phase b.1: communes render with provenance hatching".
7. Update the project's HANDOVER.md status table: B.1 → shipped.

## What's still NOT in B.1 (correctly deferred)

- Sliders / presets / segmented size control (Phase B.2)
- URL state encoding (Phase B.2)
- Live-result chip in masthead (depends on B.2)
- Mobile bottom sheet (Phase C.2)
- a11y hidden `<ul>` keyboard mirror (Phase D.1)
- LiveRegion announcements (Phase D.1)

Phase A.2 verification is unaffected and stays shipped.
