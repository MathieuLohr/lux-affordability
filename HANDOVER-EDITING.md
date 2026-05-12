# Handover — editing further

Pick-up doc for the next session. **The site is live and working.** This file is the orientation for someone who wants to edit, polish, or extend it — not a phase plan.

## Status

- **Production**: https://lux-affordability.pages.dev — serves `main`, auto-deploys on every push
- **Repo**: [MathieuLohr/lux-affordability](https://github.com/MathieuLohr/lux-affordability)
- **`main` HEAD** (as of this writing): `b1a3d96` — fix: sync cross-island scenario state immediately, not after URL debounce
- All phased work (A.2 data pipeline → B.1 map → B.2 URL/controls → C.1 methodology → C.2 bottom sheet → D a11y/SEO/perf) plus three post-launch fixes are merged via [PR #4](https://github.com/MathieuLohr/lux-affordability/pull/4).

### Latest fixes (PR #4, May 12)

1. **Commune search** — top of the controls panel; combobox semantics, NFKD-normalized substring match. Selecting fires `lux:findcommune` → Map island `fitBounds` + pin. → [src/lib/components/CommuneSearch.svelte](src/lib/components/CommuneSearch.svelte)
2. **Hover-while-pinned** — pinned dialog (top-right) and floating tooltip (cursor) now coexist. The single `hover` state was split into `pinnedHover` and `floatingHover`. → [src/lib/map/Map.svelte](src/lib/map/Map.svelte)
3. **Instant cross-island sync** — root cause of the earlier "map doesn't update online" report: `lux:scenariochange` was only dispatched as part of the 300 ms debounced URL write, so slider drags lagged. Setter now dispatches sync synchronously with values in `event.detail`; URL writes stay debounced. → [src/lib/state/scenario.svelte.ts](src/lib/state/scenario.svelte.ts)

## Quick start

```bash
nvm use 22          # engines field requires ≥22.13; pnpm 11 won't run on 20
pnpm install
pnpm dev            # http://localhost:4321
pnpm test           # 56 / 56
pnpm check          # 0 errors / 0 warnings / 0 hints
pnpm build          # static export to dist/
pnpm run data:refresh   # re-runs the pipeline against data.public.lu URLs
```

## Architecture in one minute

- **Astro static site** with two pages: `/` (the map) and `/methodology` (zero JS).
- **Islands** for interactivity:
  - `<Map client:only="svelte" />` — MapLibre, dynamic `import('maplibre-gl')` to keep it in its own ~1 MB lazy chunk
  - `<BottomSheet client:idle />` — contains `CommuneSearch`, `IncomeSlider`, `PresetGrid`, `SizeControl`. Desktop: top-left panel. Mobile (`max-width: 600px`): hand-rolled sheet with 25 / 60 / 95 snap points.
- **Cross-island state**: [src/lib/state/scenario.svelte.ts](src/lib/state/scenario.svelte.ts). Each Astro island gets its own module instance, so they communicate via:
  - `lux:scenariochange` window CustomEvent — carries `{ income, size }` in `detail`. Same-tab live sync, synchronous on slider input.
  - `lux:findcommune` window CustomEvent — carries `{ id }`. Search → Map.
  - URL `?i=…&s=…` — persistence (refresh, share, back/forward). Written via `replaceState` (slider, debounced 300 ms) or `pushState` (presets, flushed immediately).
- **Data pipeline**: [scripts/build-data.ts](scripts/build-data.ts) reads three XLS / GeoJSON URLs from [data/source-urls.json](data/source-urls.json), joins them by LAU2, computes per-commune yield, writes [public/data/communes.geojson](public/data/communes.geojson) + [public/data/meta.json](public/data/meta.json). Run `pnpm run data:refresh`.

## Backlog — deferred from V1 launch

None of these blocked the ship; they're real polish items.

- **`/og.png` asset** — [src/layouts/Layout.astro](src/layouts/Layout.astro) references `https://lux-affordability.pages.dev/og.png` for OG and Twitter share cards but the file does not exist. Either bake one (1200 × 630, Luxembourg outline + headline) or strip the OG image tag. Today, link previews on social platforms 404.
- **Plausible analytics** — PLAN §D.3 specified gating behind `VITE_ANALYTICS_ENABLED`. Not shipped. Easiest: add a `<script async defer data-domain="lux-affordability.pages.dev" src="https://plausible.io/js/script.js">` to [src/layouts/Layout.astro](src/layouts/Layout.astro) inside a `{import.meta.env.VITE_ANALYTICS_ENABLED && (…)}` guard.
- **topojson size trial** — `public/data/communes.geojson` is 193 KB. If `topojson` quantization saves ≥ 20 %, swap and decode client-side in `Map.svelte`'s `onMount` before `addSource`. Needs benchmarking.
- **Color-vision-deficiency documented test** — methodology page claims color-blind safety. Chrome DevTools → Rendering → "Emulate vision deficiencies" → deuteranopia / protanopia / tritanopia. If any band collapses, add a footnote to [src/pages/methodology.astro](src/pages/methodology.astro). Likely no change needed (ramp is OKLCH-spaced for perceptual uniformity) but it should be documented.
- **fr / de / lb translations** — chrome strings live in [src/paraglide/messages](src/paraglide/messages) and are EN + FR only. German and Luxembourgish are absent. Methodology page prose is EN-only.
- **Per-locale `<title>` and `<meta>`** — both routes use EN paraglide strings regardless of detected locale. Locale-prefixed routes (`/fr`, `/de`, `/lb`) need their own pages or Astro routing.
- **Real-device a11y pass** — VoiceOver (iOS) and NVDA (Windows) live-region announcement still un-verified on real assistive tech. The implementation looks right per WAI-ARIA APG but should be confirmed.

## Locked decisions — do not relitigate without a reason

- URL keys: `i` (income), `s` (size). Slider step 10. Size segments 40 / 55 / 75 m². Income presets 2300 / 2650 / 3540 / 3800 / 5500. Defaults omitted from URL. `replaceState` for slider (300 ms debounce), `pushState` for presets. Bounds 1500–8000 / 20–200; out-of-range → default.
- Cross-island sync: `lux:scenariochange` with `{ income, size }` in `detail`. Same-tab live channel, NOT the URL. URL is persistence only. Don't reintroduce URL-as-sync — it puts slider drags 300 ms behind input.
- MapLibre 5 rejects OKLCH; [src/lib/map/oklch-to-hex.ts](src/lib/map/oklch-to-hex.ts) does Ottosson math. `feature-state` can't appear in MapLibre `filter` (pinned outline is a paint-side `case`). `addSource(..., { promoteId: undefined })` trips MapLibre 5 validation. `maxBounds` is not set at construction.
- Bottom sheet: snap points `[25, 60, 95]`, default 60, 240 ms cubic-bezier, hand-rolled. `vaul-svelte` rejected (stale on npm, Svelte 5 pre-release peer-deps, drags in bits-ui). Handle is 44 × 44 with `touch-action: none`; body has `touch-action: pan-y`.
- Slider thumb is 16 px on fine pointer, 44 px on `(hover: none) and (pointer: coarse)`. Search input bumps to 16 px font-size under coarse pointer to defeat iOS zoom-on-focus.
- LiveRegion debounce 500 ms. Text format: commune, canton, percent, band, provenance.
- Pinned-tooltip live update via `{@const}` in template, not via `$effect` writing back into `hover` — that loops (effect-update-depth). Same applies to the floating tooltip now.
- Tooltips: two slots. `pinnedHover` → `Tooltip` with `pinned: true` (top-right dialog). `floatingHover` → `Tooltip` with `pinned: false` (cursor-following). Hovering the pinned commune itself suppresses the floating slot to avoid duplication.

## File index for editing

Most likely to touch when polishing:

- **Visual / layout / design tokens**: [src/styles/global.css](src/styles/global.css), [src/styles/tokens.css](src/styles/tokens.css)
- **Map appearance** (colors, layer order, filters): [src/lib/map/layers.ts](src/lib/map/layers.ts), [src/lib/map/color-ramp.ts](src/lib/map/color-ramp.ts), [src/lib/map/style.ts](src/lib/map/style.ts)
- **Tooltip content / format**: [src/lib/components/Tooltip.svelte](src/lib/components/Tooltip.svelte)
- **Controls** (slider, presets, size, search): [src/lib/components/IncomeSlider.svelte](src/lib/components/IncomeSlider.svelte), [src/lib/components/PresetGrid.svelte](src/lib/components/PresetGrid.svelte), [src/lib/components/SizeControl.svelte](src/lib/components/SizeControl.svelte), [src/lib/components/CommuneSearch.svelte](src/lib/components/CommuneSearch.svelte)
- **Bottom sheet shell** (snap math, mobile breakpoint): [src/lib/components/BottomSheet.svelte](src/lib/components/BottomSheet.svelte)
- **State + URL**: [src/lib/state/scenario.svelte.ts](src/lib/state/scenario.svelte.ts), [src/lib/state/url-codec.ts](src/lib/state/url-codec.ts)
- **Methodology page** (prose, JSON-LD, datepublished pulls from meta.json): [src/pages/methodology.astro](src/pages/methodology.astro), [src/pages/index.astro](src/pages/index.astro), [src/layouts/Layout.astro](src/layouts/Layout.astro)
- **Data pipeline**: [scripts/build-data.ts](scripts/build-data.ts), [scripts/burden.ts](scripts/burden.ts), [scripts/parse-xls.ts](scripts/parse-xls.ts), [data/source-urls.json](data/source-urls.json)

Read-only context:

- [PLAN.md](PLAN.md) — original phase plan, mostly historical now but useful for the "why" behind decisions
- [CONTEXT.md](CONTEXT.md) — the source-of-truth wording mirrored on the methodology page
- [HANDOVER.md](HANDOVER.md) — long-lived project index (status, links to canonical docs)

## What to do if data:refresh fails

Upstream `data.public.lu` URLs include dated path segments (e.g. `20260326-095959`) that rotate when the Observatoire publishes a new release. If `pnpm run data:refresh` fails with a 404, bump the matching URL in [data/source-urls.json](data/source-urls.json) to the latest dated path on the dataset's landing page on data.public.lu. The three datasets are linked from the JSON-LD `isBasedOn` in [src/pages/index.astro](src/pages/index.astro).

## Open infrastructure question (still not blocking)

[PR #1 cloudflare/workers-autoconfig](https://github.com/MathieuLohr/lux-affordability/pull/1) proposes SSR-on-Workers vs the current static export. If it ever lands, the static-assets-only [wrangler.jsonc](wrangler.jsonc) will need to be reconciled. No feature on the roadmap depends on the choice.
