# Handover — final verification & deploy

Pick-up doc for the next session. Phases A.2 (data pipeline), B.1 (map port), B.2 (URL state + controls), C.1 (methodology page), C.2 (bottom sheet) and D (a11y + SEO + perf audit) are all done. What remains is the "Final Phase: Verification" from [PLAN.md](PLAN.md) — real-device passes, Lighthouse, deploy.

## Branch & shipping state

This branch is **3 commits ahead of `origin/main`**:

- `f7396c0` complete phase c.2: hand-rolled bottom sheet with 25/60/95 snap points
- `5920b15` complete phase d: a11y keyboard mirror, og/twitter/json-ld, sitemap
- `23b7101` fix: live-update pinned tooltip via template derivation, not effect

Open a PR for these. The B.2 wrangler.jsonc note in the prior handover is moot — B.1's static-assets-only [wrangler.jsonc](wrangler.jsonc) is on main.

End-to-end on this branch:

- `pnpm test` → 56 / 56 green
- `pnpm check` → 0 errors / 0 warnings / 0 hints
- `pnpm build` → clean static export, 2 pages
- `/methodology/index.html` ships **0** `<script>` tags, **0** `.js` refs, **0** `astro-island` markers
- Initial JS shell (Map + BottomSheet + scenario + svelte client + render): ~62 KB
- MapLibre is a separate 1 MB chunk loaded lazily on map mount
- Sitemap and full OG / Twitter / canonical chrome present in built HTML
- JSON-LD `Dataset` schema in `dist/index.html` with three data.public.lu upstreams and the GeoJSON distribution

## What C.2 shipped (bottom sheet)

- [src/lib/components/BottomSheet.svelte](src/lib/components/BottomSheet.svelte) wraps `IncomeSlider`, `PresetGrid`, `SizeControl` as one hydrated island
- Desktop: renders as the same top-left panel the prior `.panel` used (280 px, `position: absolute`, top-left)
- Mobile (`@media (max-width: 600px)`): `position: fixed; bottom: 0; height: 100vh`, `transform: translateY(calc((100 - snap) * 1vh))`
- Snap points: `[25, 60, 95]`. Default 60. Pointer events; snap-to-nearest on `pointerup`. 240 ms cubic-bezier transition.
- 44 × 44 handle hit target, arrow-key snap navigation, `touch-action: none` on handle, `touch-action: pan-y` on body
- IncomeSlider thumb bumps to 44 × 44 on `(hover: none) and (pointer: coarse)` ([src/lib/components/IncomeSlider.svelte](src/lib/components/IncomeSlider.svelte))
- `vaul-svelte` rejected: 14 months stale on npm, peer-deps Svelte 5 pre-release only, drags in bits-ui

## What D shipped (a11y, SEO, perf audit)

### D.1 a11y — inside [src/lib/map/Map.svelte](src/lib/map/Map.svelte)

- 100-button visually-hidden alphabetical commune list (`.sr-only.commune-list`). Arrow Up/Down/Home/End/PageUp/PageDown navigation. Focus pins the commune (same `setPinned` path as click). Enter triggers click. Escape unpins (already wired via global keydown).
- Focused list button surfaces at fixed top-left so sighted keyboard users see the indicator instead of focusing into the sr-only clip path.
- `aria-live="polite" aria-atomic="true"` sr-only region, 500 ms debounced. Fires on pin + scenario change with *"Commune, canton. N percent of income, band, provenance."*
- Pinned tooltip now live-updates on scenario change. **Implementation note**: the original B.2 effect mutated `hover` from inside a $effect that also read `hover`, which created an effect-update-depth loop when the pinned branch was added. Fix: hoist `hover` write into the template via `{@const}` — the effect now only calls `applyBurden`, and `<Tooltip>` receives a fresh-derived state at every render.
- `:focus-visible` ring and `prefers-reduced-motion: reduce` blanket rule were already global in [src/styles/global.css](src/styles/global.css). The sheet's 240 ms transition collapses to 0.01 ms under reduced motion via that rule.

### D.3 SEO — [src/layouts/Layout.astro](src/layouts/Layout.astro), [src/pages/index.astro](src/pages/index.astro), [public/sitemap.xml](public/sitemap.xml)

- Layout: canonical, full OG (type / url / title / description / image / locale / site_name), Twitter (card / title / description / image), and a named `head` slot for per-page schema
- Index: schema.org `Dataset` JSON-LD with creator, spatial / temporal coverage, three measured variables, `isBasedOn` for the three data.public.lu upstream datasets, `distribution` pointing at the GeoJSON
- Sitemap: two routes (`/` monthly, `/methodology` quarterly)
- `astro.config.mjs` site updated from `.example` to `lux-affordability.pages.dev`

### D.2 perf — audit only, no changes shipped

- Methodology page ships 0 JS in the built HTML (verified via `grep -c "<script\|astro-island" dist/methodology/index.html`)
- MapLibre's dynamic `import('maplibre-gl')` in `Map.svelte:85` already produces a separate 1 MB chunk loaded only when the map island mounts
- Bundle sizes (`ls -la dist/_astro/ | sort -rn`):
  - `maplibre-gl.*.js` 1.05 MB (lazy)
  - `Map.*.css` 73 KB (eager — bundled MapLibre CSS; defer-loading it would risk FOUC)
  - `render.*.js` 30 KB
  - `Map.*.js` 17 KB
  - `scenario.svelte.*.js` 9.5 KB
  - `BottomSheet.*.js` 4.6 KB

## Verification gaps that need a real-device pass

These could not be exercised in headless Playwright preview during the build session. The documented MapLibre `document.hidden=true` raf-pause caused the canvas never to load, and synthetic `PointerEvent` dispatch doesn't propagate through `setPointerCapture`. I forced `document.hidden=false` via `Object.defineProperty` to unstick MapLibre and verified the keyboard list + live region work, but a real-browser pass is still needed for:

1. **Bottom sheet drag interaction on real touch hardware (iOS Safari, Android Chrome).** The snap math is unit-test-shaped (`snapTo` finds nearest of `[25, 60, 95]`); the rest is pointer-event plumbing. Verify: drag from 60 down to ~70 px translateY → snaps to 25; from 60 up to ~5 px → snaps to 95; drag halfway → returns to 60. Confirm no map-pan conflict during sheet drag (the `touch-action: none` on the handle should handle this).
2. **44 × 44 slider thumb on real coarse-pointer device.** Preview tool can't emulate `pointer: coarse` via viewport resize. The CSS rule `(hover: none) and (pointer: coarse)` is correct; just confirm on a real phone that the thumb is finger-tappable.
3. **Tap-to-pin tooltip on touch.** Per B.1 handover, this lives in Map.svelte and works on desktop click. Verify it works on touch (tap pins, tap again unpins).
4. **Screen-reader announcement.** I verified the live region populates the right text via a forced-visible preview. Confirm VoiceOver / NVDA actually reads it. The `aria-live="polite" aria-atomic="true"` is right per WAI-ARIA APG.

## Deferred items, not in scope for V1 ship

Documented here so they don't get re-invented next session:

- **`/og.png` asset.** Layout references it but the file doesn't exist; OG previews will 404 on share. Either bake one (1200 × 630, Luxembourg outline + headline) or strip the OG image tag until ready.
- **Plausible analytics behind `VITE_ANALYTICS_ENABLED`.** Per PLAN §D.3. Not shipped.
- **topojson size trial.** Per PLAN §D.2. The current commune GeoJSON is 193 KB; if topojson saves ≥ 20 %, swap and decode client-side. Needs benchmarking.
- **Deuteranopia / protanopia / tritanopia documentation.** Methodology page already claims color-blind safety; PLAN §D.1 asks for a documented test pass. Methodology page text mentions all three already — confirm via Chrome DevTools Rendering panel "Emulate vision deficiencies" and add a footnote if any band collapses.
- **`pnpm run data:refresh` against current upstreams.** The pipeline tests pass against fixtures; the live upstream URLs may have rotated since the last refresh (data.public.lu uses dated URLs). Run before deploy. Will write fresh `public/data/communes.geojson` and `public/data/meta.json`.
- **fr / de / lb translations.** Paraglide chrome strings are bilingual EN / FR; methodology page prose is EN-only; German and Luxembourgish locales not present.
- **Per-locale `<title>` and `<meta>`.** Both routes use EN paraglide strings regardless of detected locale; route-prefixed locales (`/fr`, `/de`) need their own pages or Astro routing.

## Open infrastructure question (still not blocking)

[PR #1 cloudflare/workers-autoconfig](https://github.com/MathieuLohr/lux-affordability/pull/1) proposes SSR-on-Workers vs the current static export. B.1 added a minimal static-assets-only [wrangler.jsonc](wrangler.jsonc). If PR #1 lands later it's a small conflict to resolve in `wrangler.jsonc`. Nothing in C, D, or the verification phase depends on the choice.

## Locked decisions — do not relitigate

From B.2 and prior:

- URL keys: `i` (income), `s` (size). Slider step 10. Size segments 40 / 55 / 75 m². Income presets 2300 / 2650 / 3540 / 3800 / 5500. Defaults omitted from URL. `replaceState` for slider (300 ms debounce), `pushState` for presets. Cross-island sync via `lux:scenariochange` window CustomEvent. Bounds 1500–8000 / 20–200, out-of-range → default.
- MapLibre 5 rejects OKLCH; [oklch-to-hex.ts](src/lib/map/oklch-to-hex.ts) does Ottosson math. `feature-state` can't appear in `filter` (pinned outline is a paint-side `case`). `addSource(..., { promoteId: undefined })` trips MapLibre 5 validation. `maxBounds` is not set at construction.

From C and D:

- Bottom sheet snap points `[25, 60, 95]` (% viewport height). Default 60. 240 ms cubic-bezier. Hand-rolled — not vaul-svelte.
- Sheet handle is 44 × 44, focusable, `touch-action: none`. Body has `touch-action: pan-y`.
- Slider thumb is 16 px on fine pointer, 44 px on coarse pointer. Both branches in the same CSS file.
- LiveRegion debounce 500 ms. Text format includes commune, canton, percent, band, and provenance.
- Pinned-tooltip live update is done via `{@const}` in the template, not via `$effect` writing back to `hover`. Don't reintroduce the effect-side write — it loops.

## Recommended first 20 minutes of the next session

1. `pnpm install && pnpm dev`. Tab into the map area on desktop. Confirm arrow keys cycle the focused commune, Enter pins, Escape unpins. Run VoiceOver / NVDA briefly to confirm the live region is announced.
2. Resize to a phone viewport in Chrome DevTools mobile emulation (with touch simulation enabled — preset viewport resize alone is not enough). Drag the bottom sheet handle. Confirm snap points and that the map underneath doesn't pan during the drag.
3. `pnpm run data:refresh`. If it errors, the upstream URL has rotated; bump `data/source-urls.json` to the new dated URL on data.public.lu and re-run.
4. `pnpm build && wrangler pages dev dist` (or whatever the local CF preview is). Run Lighthouse mobile against `/` and `/methodology`. Target: perf ≥ 90, a11y ≥ 95, best-practices ≥ 95, SEO ≥ 95.
5. Open PR with the three commits. The C.2 + D.1 + D.3 work is one logical unit; squash optional.

## File index for verification phase

Read-only:
- [PLAN.md](PLAN.md) §C and §D — the spec you're verifying against
- [CONTEXT.md](CONTEXT.md) §Methodology — the source-of-truth wording mirrored on the methodology page

Touch if needed:
- [data/source-urls.json](data/source-urls.json) — only if data:refresh fails on a URL rotation
- [src/layouts/Layout.astro](src/layouts/Layout.astro) — if you bake an `og.png` asset
- [scripts/build-data.ts](scripts/build-data.ts) — only if pipeline behavior needs to change
