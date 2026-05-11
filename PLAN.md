# Lux Affordability — Implementation Plan

## Self-critique of proposed architecture

Before locking the plan, re-checking each architectural shift for soundness.

| Decision | Holds up? | Caveat |
|---|---|---|
| Astro + Svelte islands over SvelteKit | Yes | Astro has no `$page.url`. URL state needs `window.location` + `popstate` + small Svelte store. Slightly more wiring, still cleaner than bidirectional sync. |
| URL params as sole source of truth | Yes | See above plumbing note. Use `history.replaceState` for debounced writes (no history spam), `popstate` listener for back/forward. |
| vaul-svelte for bottom sheet | **Verify in Phase 0** | The official `vaul` is React-only (Emil Kowalski). There's at least one community Svelte port; need to confirm maintenance status, license, bundle size before committing. Fallback: `svelte-bottom-sheet` or `@svelte-put/movable` + custom snap logic. |
| Pre-made OG PNG | Yes | Zero risk. |
| Paraglide for i18n | Yes | Has both Astro (`@inlang/paraglide-astro`) and SvelteKit adapters. Confirm current API in Phase 0 since the project moves fast. |
| TS-only pipeline, geometry frozen | Yes | The shipped `communes_v2.geojson` is canonical. Pipeline only re-merges fresh prices into existing geometry. No Shapely. |
| MapLibre keyboard a11y | **Real risk, budget for it** | Polygons render to canvas, no native focus. Pattern: hidden `<ul>` of `<button>` elements mirroring features, focus syncs map highlight. Mapbox docs have a reference impl worth copying. |

**Verdict on the approach: yes, with two items requiring Phase 0 verification before they're locked** (vaul-svelte, Paraglide-Astro current API).

---

## Phase 0: Documentation Discovery

**Goal**: Verify every external API/library actually exists at the version we'd consume, with copy-ready snippet locations.

Deploy parallel subagents to gather:

### 0.1 Astro + Svelte islands
- Read https://docs.astro.build/en/guides/integrations-guide/svelte/
- Read https://docs.astro.build/en/concepts/islands/
- Confirm: `client:visible`, `client:idle`, `client:only="svelte"` directives and when each fires
- Confirm: how shared state works between two Svelte islands on the same page (it doesn't, by design — must use a singleton module or `nanostores`)
- Output: minimal `astro.config.mjs` snippet with Svelte integration, example island invocation

### 0.2 vaul-svelte (or alternative)
- Search npm for active Svelte bottom-sheet packages: `vaul-svelte`, `svelte-bottom-sheet`, others
- Check: last publish date, weekly downloads, open issues, Svelte 5 compatibility (runes), license
- Reject anything stale (>12 months no commits) or Svelte 4 only
- Output: chosen package name, install command, minimal usage example with snap points
- If nothing viable: spec the build-it-ourselves approach with `@svelte-put/movable` or pointer events directly

### 0.3 Paraglide for Astro
- Read https://inlang.com/m/gerre34r/library-inlang-paraglideJs (or current Paraglide JS docs)
- Read https://inlang.com/m/iljlwzfs/paraglide-astro-i18n (Astro adapter)
- Confirm: setup steps, message file format, how `m.key()` import works, build-time tree-shaking
- Output: minimal `messages/en.json` example, how to import a message in `.svelte` and `.astro`

### 0.4 MapLibre GL JS — relevant APIs
- Read https://maplibre.org/maplibre-gl-js/docs/API/ (Map, addSource, addLayer, addImage)
- Identify: `fill-pattern` for hatching, `interpolate` vs `step` for color bands, `setFeatureState` for hover/selection
- Read MapLibre a11y docs and any keyboard navigation example (or Mapbox's, since APIs overlap)
- Identify: how to trigger a feature highlight from outside the map (e.g., from a focused list item)
- Output: copy-ready snippets for: addSource(geojson), three fill layers (measured/estimated-hatched/no-data), addImage(hatch pattern), feature-state-driven hover

### 0.5 MapTiler vector tiles + free tier
- Read https://docs.maptiler.com/cloud/api/maps/
- Confirm: Positron style URL pattern, how the API key is passed, free-tier limits, attribution requirements
- Output: style URL template, env-var name convention

### 0.6 SheetJS (xlsx) for legacy XLS
- Read https://docs.sheetjs.com/docs/getting-started/installation/nodejs
- Confirm: `XLSX.read(buffer, { type: 'buffer' })` reads .xls (BIFF), header row offset handling, how to detect `*` cells
- Output: minimal parser for one of our XLS files showing header offset 8 and 10

### 0.7 data.public.lu API — latest-resource pattern
- Hit https://data.public.lu/api/1/datasets/57f25c07cc765e23279433af/ (rents) and `.../57f26768cc765e23279433b0/` (sales)
- Confirm: `resources[]` shape, `last_modified` field, `url` field, no auth required
- Output: TypeScript type for the response, the sort-and-pick-latest snippet

### 0.8 Vercel + Cloudflare Pages static deploy
- Read https://vercel.com/docs/frameworks/astro
- Read https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/
- Confirm: `vercel.json` for static-only, headers (gzip is automatic, `Cache-Control` for `/data/*`)
- Output: `vercel.json` snippet, `_headers` file for CF Pages

**Phase 0 deliverable**: `.docs-cache.md` (gitignored) with all the above, including exact citations. Plan is allowed to proceed only when this is complete.

---

## Phase A: Scaffold + Data Pipeline

### A.1 Scaffold
- `pnpm create astro@latest .` — minimal template, TypeScript strict, no Tailwind from the wizard
- Add Svelte integration per Phase 0.1
- Add Tailwind v4 manually (`@tailwindcss/vite`), config in `app.css` with `@theme` block
- Port the prototype's CSS custom properties (`--band-a` ... `--band-x`, typography, spacing) **verbatim** into `src/styles/tokens.css`, imported once in the root layout
- Set up `.env.example` with `VITE_MAPTILER_KEY`, `VITE_ANALYTICS_ENABLED=false`, `VITE_PLAUSIBLE_DOMAIN`
- Create `vercel.json` from Phase 0.8 snippet
- Create `static/_headers` for Cloudflare Pages
- `git init`, `.gitignore` for `node_modules`, `.env`, `.docs-cache.md`, `dist/`

**Anti-pattern guards**:
- Do NOT use Astro's React or Vue integrations. Svelte only.
- Do NOT add `@astrojs/tailwind` (legacy). Use `@tailwindcss/vite` for v4.
- Do NOT modify the OKLCH band tokens. Copy exactly from prototype lines containing `--band-a`/`--band-b`/etc.

**Verification**:
- `pnpm dev` serves a blank page on :4321
- `pnpm build && pnpm preview` succeeds
- `dist/` contains static HTML
- A computed style on a test element resolves to the prototype's `oklch(0.62 0.13 145)` for `--band-a`

### A.2 Data pipeline

Files:
- `scripts/build-data.ts` — top-level orchestrator
- `scripts/lib/fetch-source.ts` — uses Phase 0.7 API pattern to resolve latest URL per dataset
- `scripts/lib/parse-xls.ts` — uses Phase 0.6 SheetJS, header offsets per CONTEXT.md (rows 8 and 10), `*` → null
- `scripts/lib/normalize-names.ts` — `data_to_geojson` map from `data/source-urls.json`
- `scripts/lib/yield-estimate.ts` — pure function: takes `{rent, sale}[]`, returns `{median_yield, estimates}`
- `scripts/lib/merge.ts` — joins boundary GeoJSON with rents + sales + estimates, attaches per-feature `provenance` (`measured`/`estimated`/`none`)
- `scripts/__tests__/yield-estimate.test.ts` — proves median is 4.39% on the known 31-commune set
- `scripts/__tests__/parse-xls.test.ts` — fixture-based, proves header offsets, suppression marker handling, national-average row exclusion
- `scripts/__tests__/regression.test.ts` — runs full pipeline on cached fixtures, hashes output, compares to snapshot

Outputs:
- `static/data/communes.geojson`
- `static/data/meta.json` — `{ generated_at, period_rents, period_sales, source_urls, yield_median }`

`package.json` script: `"data:refresh": "tsx scripts/build-data.ts"`

**Anti-pattern guards**:
- Do NOT call SheetJS with `type: 'binary'` on Node — use `type: 'buffer'` (Phase 0.6 confirmed)
- Do NOT hardcode the quarterly URL — always resolve via the dataset API endpoint
- Do NOT mutate the boundary GeoJSON; produce a new feature collection
- Do NOT re-simplify geometry — use as-is from upstream (or use the existing `data/communes_v2.geojson` as canonical seed)

**Verification**:
- `pnpm test` passes all three test files
- `pnpm run data:refresh` produces a `communes.geojson` with 100 features
- 34 features have `provenance: "measured"`, ~23 have `"estimated"`, ~43 have `"none"` (allow ±2 drift for new data)
- Diff against existing `data/communes_v2.geojson` shows only data updates, no schema changes

**Checkpoint**: stop, show diff stats, ask user before Phase B.

---

## Phase B: Map Port + URL State

### B.1 Map port

Files:
- `src/lib/map/Map.svelte` — Svelte 5 runes, MapLibre mount, lifecycle cleanup
- `src/lib/map/style.ts` — exports MapTiler Positron style URL with key from env
- `src/lib/map/layers.ts` — three fill layer specs: `communes-measured`, `communes-estimated`, `communes-no-data`
- `src/lib/map/hatch-pattern.ts` — generates a 8x8 diagonal-stripe canvas, returns ImageData for `map.addImage`
- `src/lib/map/color-ramp.ts` — pure function `burdenToColor(percent: number, provenance): string` returning the OKLCH from tokens
- `src/lib/map/a11y-list.svelte` — visually-hidden `<ul>` of focusable `<button>` elements, one per commune; focus → highlight via `setFeatureState`
- `src/lib/components/Tooltip.svelte` — pinned-on-tap, hover-on-pointer
- `src/lib/components/Legend.svelte` — band swatches, provenance key
- `src/pages/index.astro` — hosts `<Map client:visible>` island, server-renders shell + skeleton

**Copy-ready snippets to use** (from Phase 0):
- 0.4 — addSource/addLayer/addImage skeleton
- 0.4 — feature-state-driven hover
- 0.5 — Positron style URL

**Anti-pattern guards**:
- Do NOT import `maplibre-gl` at the top of the Astro page. Dynamic-import inside the Svelte island so SSR doesn't see it.
- Do NOT use `fill-color` with a JS function. Pre-compute color per feature in the GeoJSON load step or use MapLibre `step` expression with token values.
- Do NOT use Mapbox-only methods (e.g., `map.queryTerrainElevation`). Pure MapLibre.

**Verification**:
- Map renders on dev with all 100 communes visible
- Hovering a measured commune shows a tooltip with rent/sale/n_listings/measured tag
- Estimated communes show diagonal hatch overlay; no-data communes are flat grey
- Lighthouse mobile perf ≥ 80 (target 90 comes in Phase D)

### B.2 URL state

Files:
- `src/lib/state/scenario.svelte.ts` — Svelte 5 runes module exporting `scenario` proxy with `income`, `size`; getters read `window.location.search`, setters write via debounced `history.replaceState`; `popstate` listener triggers re-read
- `src/lib/state/url-codec.ts` — pure functions `encode({income, size})` / `decode(URLSearchParams)`, with bounds validation and defaults
- `src/lib/components/IncomeSlider.svelte` — bound to `scenario.income`
- `src/lib/components/PresetGrid.svelte` — preset buttons set `scenario.income` to known values from CONTEXT.md
- `src/lib/components/SizeControl.svelte` — segmented studio/1-bed/2-bed; presets map to m² (35/55/80, confirm against prototype before locking)

**Anti-pattern guards**:
- Do NOT use `pushState` for slider input. Always `replaceState` so back-button doesn't replay every drag tick.
- Do NOT skip the debounce. 300ms per CONTEXT prompt.
- Do NOT bypass the codec — never `URL` parse inside components.

**Verification**:
- Drag slider → URL updates after 300ms idle, no history spam
- Reload preserves the scenario
- Back/forward navigates between distinct scenarios (set by clicking presets, which DO push history)
- Decimal/garbage params (e.g., `?income=foo`) fall back to defaults silently

**Checkpoint**: stop, screenshot the working map at desktop and mobile widths, ask user before Phase C.

---

## Phase C: Methodology + Mobile Sheet

### C.1 Methodology page

Files:
- `src/pages/methodology.astro` — pure Astro, zero JS
- `src/content/methodology.md` (Astro content collection) OR inline in the Astro page
- Sections: Data sources (with live links to data.public.lu and dataset pages), Yield estimation method (text from CONTEXT.md §Methodology), Limitations, Income preset derivations (Class 1 tax assumptions, table), Update cadence (quarterly per Observatoire), Color ramp explanation

**Anti-pattern guards**:
- Do NOT use Svelte for this page. Static content, zero JS.
- Do NOT paraphrase the methodology — it's been carefully worded in CONTEXT.md.

**Verification**:
- View source: no `<script type="module">` for islands
- All external links open data.public.lu dataset pages, not raw download URLs
- Lighthouse a11y on this page = 100

### C.2 Mobile bottom sheet

Files:
- `src/lib/components/BottomSheet.svelte` — wraps the panel; uses library chosen in Phase 0.2 OR custom impl
- Snap points 25/60/95 per CONTEXT prompt
- Drag handle visible, 44×44 hit target on slider thumb (CSS)
- Tap-to-pin tooltip behavior added to `Map.svelte`

**Anti-pattern guards**:
- Do NOT bind sheet drag to map pan. Must `stopPropagation` on the handle.
- Do NOT trigger the sheet on desktop. Media query gate at the island root.

**Verification**:
- Chrome DevTools mobile emulation: sheet snaps cleanly at 3 heights, no map-pan conflict
- Tap a commune on touch → tooltip pins, second tap dismisses
- Slider thumb hits 44px in computed styles

**Checkpoint**: stop, ask user before Phase D.

---

## Phase D: A11y + Perf + SEO

### D.1 A11y
- Wire the hidden `<ul>` from B.1 (`a11y-list.svelte`) to actually receive Tab focus, arrow keys cycle through, Enter pins
- `LiveRegion.svelte` — `aria-live="polite"`, debounced 500ms, announces "Now showing rent burden at €X income, Y-bedroom: Z% in commune Q"
- Run color ramp through deuteranopia simulator (Chrome DevTools Rendering panel "Emulate vision deficiencies"); document outcome in methodology page if any band collapses
- Verify `prefers-reduced-motion` honored (port from prototype)
- Verify focus-visible rings on all interactive elements

**Verification**: Lighthouse mobile a11y ≥ 95, axe DevTools clean

### D.2 Perf
- Verify `Content-Encoding: gzip` (or `br`) on `/data/communes.geojson` from `vercel preview` build
- Convert to topojson; if ≥20% smaller, ship `.topo.json` and decode client-side; else stay GeoJSON
- Lazy-load MapLibre via dynamic import inside `Map.svelte` mount handler (already specified in B.1, verify it actually defers in the network tab)
- Bundle audit: `pnpm build` then check `dist/_astro/*.js` sizes; methodology page should ship 0 KB JS
- Image: ensure `static/og.png` is ≤200KB (squoosh it)

**Verification**: Lighthouse mobile perf ≥ 90, JS shipped on `/methodology` = 0 bytes

### D.3 SEO
- `<title>` and `<meta name="description">` per page (via Astro layout slot)
- Open Graph tags pointing at `/og.png`
- JSON-LD `Dataset` schema in the index page head, citing data.public.lu sources
- `static/sitemap.xml` (hand-written, 2 routes)
- `static/robots.txt` (allow all)
- Plausible analytics behind `VITE_ANALYTICS_ENABLED` flag, no-op when false

**Verification**: Lighthouse SEO ≥ 95, Open Graph debugger renders the card, schema.org validator passes

**Checkpoint**: stop, run all four Lighthouse scores, ask user before merge/deploy.

---

## Final Phase: Verification

1. `pnpm install && pnpm dev` — site runs locally
2. `pnpm build && pnpm preview` — production build runs
3. `pnpm run data:refresh` — regenerates dataset, tests pass
4. `pnpm test` — pipeline tests green
5. Lighthouse mobile, all four scores at targets
6. `vercel deploy --prod` from CLI uses `vercel.json` only (no dashboard tweaks)
7. README documents: setup, data refresh cadence, methodology summary + link to /methodology, deployment to both Vercel and Cloudflare Pages, how to add French translations later (Paraglide message file path + Astro/Svelte usage examples)

**Anti-pattern grep at end**:
- `grep -r "—"` in `src/` → must be zero (no em dashes per prompt)
- `grep -r "import.*mapbox-gl"` → must be zero
- `grep -r "google-analytics\|gtag"` → must be zero
- `grep -r "process.env"` in `src/` → must be zero (use `import.meta.env`)

---

## Open questions to confirm before Phase A

1. **Astro vs SvelteKit final call** — the case is in the table above. Yes/no?
2. **vaul-svelte risk** — willing to let Phase 0.2 pick a library, or do you want me to pre-decide between library and hand-rolled?
3. **Repo init** — `git init` in `/Users/mathieulohr/Downloads/lux-affordability-handoff/` directly, or move to a fresh path first?
4. **MapTiler key** — do you have one, or should the dev fallback raster basemap (no key needed) be the documented dev path?
5. **README emoji policy** — prompt says no emojis in code/commits; checking if README is included in that ban.

Answer these and I start Phase 0.
