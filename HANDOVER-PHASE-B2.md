# Handover, Phase B.2 — URL state & controls

Pick-up doc for the next session. Phases A.2 (data pipeline) and B.1 (map port) are shipped on `main`. B.2 is the next phase per [PLAN.md §B.2](PLAN.md). Nothing of B.2 is started.

## Current state on `main`

Last commit: [f6ec0c9](https://github.com/MathieuLohr/lux-affordability/commit/f6ec0c9) (rebased B.1 PR + wrangler fix).

What works on `main` end-to-end:
- `pnpm test` → 44/44 green (`burden`, `color-ramp`, `oklch-to-hex`, `parse-xls`, `regression`, `yield-estimate`)
- `pnpm check` → 0 errors / 0 warnings / 0 hints
- `pnpm build` → clean static export to `dist/` (1.5MB, 15 files)
- `pnpm dev` → real browser sees full choropleth: 34 measured solid, 23 estimated hatched, 43 no-data grey, hover tooltip, click-to-pin, Esc unpin, Legend, CoverageStrip
- CF Workers Builds → green via `wrangler.jsonc` pointing `./dist` as static assets

The default scenario is **hardcoded** at `{ income: 3540, size: 55 }` in [src/lib/map/burden.ts](src/lib/map/burden.ts) and passed into `<Map>` from [src/pages/index.astro](src/pages/index.astro). Phase B.2 replaces this hardcoded prop with a URL-driven Svelte 5 rune.

## B.2 scope (from PLAN.md §B.2)

Files to create:
- `src/lib/state/scenario.svelte.ts` — Svelte 5 runes module exporting a `scenario` proxy with `income`, `size`. Getters read `window.location.search`; setters write via debounced `history.replaceState`. `popstate` listener triggers re-read.
- `src/lib/state/url-codec.ts` — pure functions `encode({income, size})` / `decode(URLSearchParams)` with bounds validation and defaults.
- `src/lib/components/IncomeSlider.svelte` — bound to `scenario.income`.
- `src/lib/components/PresetGrid.svelte` — preset buttons set `scenario.income` to known values from [CONTEXT.md](CONTEXT.md).
- `src/lib/components/SizeControl.svelte` — segmented studio / 1-bed / 2-bed; presets map to m² (35/55/80; confirm against prototype before locking).

Files to modify:
- `src/pages/index.astro` — stop passing the hardcoded `DEFAULT_SCENARIO` prop; instead let `<Map>` read from the rune (or pass the rune through, depending on Svelte 5 cross-island pattern).
- `src/lib/map/Map.svelte` — replace `scenario` prop with rune subscription. The existing `$effect` at the bottom of the file already re-applies burden when `scenario` changes; just point it at the rune source.

Anti-patterns (PLAN.md is explicit about these — do NOT relitigate):
- Use `replaceState` for slider input, NOT `pushState`. Otherwise back-button replays every drag tick.
- 300ms debounce on slider writes. CONTEXT.md is the source.
- Never `URL`-parse inside components. Codec only.
- Presets DO push history (so back/forward jumps between distinct scenarios).

Verification (PLAN.md §B.2 closes with these):
1. Drag slider → URL updates after 300ms idle, no history spam
2. Reload preserves scenario
3. Back/forward navigates between preset-set scenarios
4. Garbage params (`?income=foo`) silently fall back to defaults
5. Then **checkpoint**: screenshot desktop + mobile widths, ask user before Phase C.

## B.1 decisions you must NOT relitigate

These were settled the hard way in B.1. They affect B.2 only insofar as the map code references them.

- **MapLibre 5 rejects OKLCH** in style spec. [oklch-to-hex.ts](src/lib/map/oklch-to-hex.ts) does Ottosson's conversion math. Canvas `fillStyle` round-trip does NOT work in modern Chromium.
- **`feature-state` can't appear in `filter`**, only paint expressions. Pinned outline is a paint-side `case` in [outlineLayer](src/lib/map/layers.ts), not a separate filtered layer.
- **`addSource(..., { promoteId: undefined })`** trips MapLibre 5 validation. Omit the field entirely.
- **`maxBounds`** was removed because MapLibre 5 broke the constructor when both `maxBounds` and `attributionControl` were set. Re-add later via `m.setMaxBounds(...)` after `load`.
- **Coverage counts (34/23/43)** come from [public/data/meta.json](public/data/meta.json) imported at build time, not fetched at runtime.

## One runtime gotcha to know

**Headless preview tools (Claude Preview, Playwright with `document.hidden=true`) will not render the map.** MapLibre's `load` event fires from inside `_render`, which is scheduled via `requestAnimationFrame`. When `document.visibilityState === "hidden"`, Chromium pauses raf. The polygons never paint, even though the basemap appears.

In a real browser tab this is a non-issue. To verify the map in Claude Preview during dev, force a render manually:

```js
// In preview_eval after the page loads
const m = window.__map; // only if __map debug aid is re-added
m._render(0);
// Then drive the loop until tiles load:
for (let i = 0; i < 40; i++) { m._render(0); await new Promise(r => setTimeout(r, 20)); if (m.areTilesLoaded()) break; }
```

The map debug aid `window.__map = m` was removed in B.1's final commit. Re-add it temporarily in [Map.svelte](src/lib/map/Map.svelte) if you need to poke at the map from a preview REPL again — but remove before committing.

## Open infrastructure question (not for B.2)

[PR #1 cloudflare/workers-autoconfig](https://github.com/MathieuLohr/lux-affordability/pull/1) is still open. It proposes migrating from static export to SSR-on-Workers (adds `@astrojs/cloudflare` adapter, fuller wrangler.jsonc with `main` server entry, `wrangler` devDep, vite ^7 override). My B.1 PR added a minimal static-assets-only wrangler.jsonc instead. If PR #1 is later merged, the wrangler.jsonc conflict is a 30-second resolve.

Decision deferred. B.2 does not depend on either path.

## Recommended first 30 minutes of B.2

1. `pnpm install && pnpm dev`, open in a real browser, confirm the map still renders the way B.1 left it.
2. Read [PLAN.md §B.2](PLAN.md) end-to-end (~30 lines).
3. Read [CONTEXT.md](CONTEXT.md) for the preset income values and m² mapping.
4. Confirm the prototype's segmented-control sizes (35/55/80) match the locked plan.
5. Start with [url-codec.ts](src/lib/state/url-codec.ts) (pure, easy to unit-test) before touching anything Svelte.

## What is NOT in B.2 (deferred phases)

- C.1 Methodology refresh, C.2 mobile bottom sheet
- D.1 a11y `<ul>` keyboard mirror + LiveRegion
- D.2 perf (topojson trial, MapLibre lazy load)
- D.3 SEO (OG image, JSON-LD Dataset schema, sitemap)
- Custom domain
