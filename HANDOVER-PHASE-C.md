# Handover, Phase C — Methodology & mobile sheet

Pick-up doc for the next session. Phases A.2 (data pipeline), B.1 (map port) and B.2 (URL state + controls) are now all done. C is next per [PLAN.md §C](PLAN.md).

## Branch & shipping state

B.2 work lives on `docs/phase-b2-handover` (branch name is now historical — it started as a handover-doc branch and grew the B.2 implementation on top). The B.2 commit(s) are not on `main` yet. Either rebase + PR this branch, or cherry-pick the B.2 commits onto a fresh branch first. Either way, ship B.2 before starting C, so C builds on a clean base.

The B.1 PR's known wrangler.jsonc conflict against [PR #1](https://github.com/MathieuLohr/lux-affordability/pull/1) is still unresolved upstream — see "Open infrastructure question" below.

## Current state on this branch

Last commit on `main`: [f6ec0c9](https://github.com/MathieuLohr/lux-affordability/commit/f6ec0c9). On top of that, B.2 adds:

- `src/lib/state/url-codec.ts` — pure `encode` / `decode` with bounds + defaults
- `src/lib/state/scenario.svelte.ts` — Svelte 5 runes module, debounced `replaceState` for slider, immediate `pushState` for presets, cross-island sync via `lux:scenariochange` window event
- `src/lib/components/IncomeSlider.svelte`, `PresetGrid.svelte`, `SizeControl.svelte`
- `scripts/__tests__/url-codec.test.ts` (12 cases)
- Updated [src/lib/map/Map.svelte](src/lib/map/Map.svelte) — `scenario` prop dropped, imports the rune
- Updated [src/pages/index.astro](src/pages/index.astro) — three control islands inside an `<aside class="panel">`

End-to-end:
- `pnpm test` → 56/56 green (44 prior + 12 url-codec)
- `pnpm check` → 0 errors / 0 warnings / 0 hints
- `pnpm build` → clean static export
- Headless preview verified the 4 PLAN §B.2 criteria: debounced replaceState, reload preservation, back/forward across pushed entries, garbage-param fall-through

## C scope (from PLAN.md §C)

### C.1 Methodology page — pure Astro, zero JS

- `src/pages/methodology.astro` — pure Astro page
- Optionally Astro content collection (`src/content/methodology.md`), or inline content
- Sections: Data sources (live links to data.public.lu and dataset pages), Yield estimation method (text **verbatim** from [CONTEXT.md §Methodology](CONTEXT.md)), Limitations, Income preset derivations (Class 1 tax assumptions, table), Update cadence (quarterly per Observatoire), Color ramp explanation
- Link from masthead already exists: [MapMasthead.astro](src/components/MapMasthead.astro) has `<a href="/methodology">{m.methodology_link()}</a>`

Anti-patterns (PLAN.md):
- Do NOT use Svelte for this page. Static content, zero JS shipped.
- Do NOT paraphrase the methodology — wording in CONTEXT.md is deliberate.

Verification:
- View source: no `<script type="module">` for Svelte islands
- All external links open dataset pages on data.public.lu, not raw download URLs
- Lighthouse a11y on /methodology = 100

### C.2 Mobile bottom sheet

This is the bigger piece. PLAN §C.2:
- `src/lib/components/BottomSheet.svelte` — wraps the panel; uses library chosen in Phase 0.2 OR custom impl
- Snap points 25 / 60 / 95 (% of viewport height) per CONTEXT prompt
- Drag handle visible, 44×44 hit target on slider thumb
- Tap-to-pin tooltip behavior already lives in [Map.svelte](src/lib/map/Map.svelte) (B.1 work). Re-verify on touch.

Anti-patterns:
- Do NOT bind sheet drag to map pan. `stopPropagation` on the handle.
- Do NOT trigger the sheet on desktop. Media query gate at the island root.

Verification:
- Chrome DevTools mobile emulation: snaps clean at 3 heights, no map-pan conflict
- Tap a commune on touch → tooltip pins, second tap dismisses (already works on desktop click; touch may behave differently)
- Slider thumb hits 44px in computed styles (currently 16px — needs bumping on mobile)

**Phase 0.2 was never completed.** No library decision exists on disk. Options to weigh in C.2:
- `vaul-svelte` — port of Emil Kowalski's vaul; check maintenance + Svelte 5 (runes) compat
- `svelte-bottom-sheet` — older alternative
- `@svelte-put/movable` + custom snap logic
- Hand-rolled with pointer events

The current panel in [index.astro](src/pages/index.astro) is just a positioned `<aside>` with three islands inside. On `max-width: 600px` it pins to the bottom. **That's fine for desktop but is NOT yet a real bottom sheet** — no drag handle, no snap points, no momentum. C.2 replaces this with a real sheet.

## Decisions made in B.2 that C must NOT relitigate

- **URL param keys** are `i` (income) and `s` (size). Short, fits in the address bar. Don't change to `income` / `size` later.
- **Slider step is 10**, not the prototype's 50. Prototype's 50 silently snapped the 3540 default to 3550 on first paint; not worth keeping.
- **Size segments are 40 / 55 / 75 m²**, NOT 35 / 55 / 80 from the original plan. Prototype values won.
- **Income presets are 2300 / 2650 / 3540 / 3800 / 5500** — pulled verbatim from prototype.
- **Defaults are omitted from the URL.** A fresh visit lands on `/` with no query. Encode emits `?` only when income ≠ 3540 or size ≠ 55.
- **`replaceState` for slider, `pushState` for presets** is the locked contract. Don't change without re-running PLAN §B.2 verification 3 (back/forward navigates between presets).
- **300ms debounce** for slider → URL.
- **Cross-island sync** uses a `lux:scenariochange` `CustomEvent` on `window`, because `popstate` does NOT fire for same-tab `replaceState`/`pushState`. Each Astro Svelte island instantiates its own copy of [scenario.svelte.ts](src/lib/state/scenario.svelte.ts); listeners on window are the bridge.
- **Bounds**: income 1500–8000, size 20–200. Out-of-range → default. NaN → default. Empty string → default. Boundary values pass.

If C.2 wraps the controls in a sheet, the cross-island event bus still applies because the sheet body will be (a) one island wrapping all controls — even cleaner, only one module instance — or (b) multiple islands inside one sheet. Either works.

## B.1 / B.2 decisions you must NOT relitigate (still relevant in C)

- **MapLibre 5 rejects OKLCH** in style spec. [oklch-to-hex.ts](src/lib/map/oklch-to-hex.ts) does Ottosson math.
- **`feature-state` can't appear in `filter`.** Pinned outline is a paint-side `case` in [outlineLayer](src/lib/map/layers.ts).
- **`addSource(..., { promoteId: undefined })`** trips MapLibre 5 validation. Omit the field.
- **`maxBounds`** is not set at construction. Re-add later via `m.setMaxBounds(...)` after `load` if needed.
- **Coverage counts (34 / 23 / 43)** are imported from [public/data/meta.json](public/data/meta.json) at build time.
- **Headless preview gotcha**: `document.hidden=true` pauses MapLibre's raf; polygons don't repaint after `setFeatureState`. C.1 is unaffected (no JS), but C.2 bottom-sheet verification will hit it. Use a real browser or the CF preview URL.

## One verification gap from B.2 you may want to close in C

Mid-session cross-island map repaint (panel writes URL → map's $effect re-runs → polygons recolor) was not visually confirmed in headless preview because of the raf-pause issue. Initial-load rendering at a specific `?i=…&s=…` IS confirmed via screenshot. The mechanism is identical, but if C.2 work spans many real-browser sessions anyway, do a quick visual confirm at that point.

## Open infrastructure question (still not for C)

[PR #1 cloudflare/workers-autoconfig](https://github.com/MathieuLohr/lux-affordability/pull/1) proposes migrating from static export to SSR-on-Workers. B.1 added a minimal static-assets-only [wrangler.jsonc](wrangler.jsonc) instead. If PR #1 lands later, wrangler.jsonc is a 30-second conflict resolve. C does not depend on either path.

## Recommended first 30 minutes of C

1. Open the working tree in a real browser (`pnpm install && pnpm dev`). Drag the slider, watch the URL update with the 300ms debounce. Click a preset, hit back, confirm both URL and map snap to the prior scenario. This is your sanity check that B.2 is intact before you build on it.
2. Read [PLAN.md §C](PLAN.md) end-to-end (~50 lines covering C.1 + C.2).
3. Decide order: C.1 first (low-risk static page, can ship in an hour) or C.2 first (bigger, depends on library choice). Recommendation: C.1 first, ship it, then tackle C.2 with a clean slate.
4. For C.2: spend 15 minutes on the Phase 0.2 work that was skipped — check `vaul-svelte` on npm (last publish, Svelte 5 compat, weekly downloads) before committing to it. If it looks stale, hand-roll. Don't get stuck on library archaeology mid-implementation.
5. Re-confirm the 44×44 touch target requirement against the prototype — the current slider thumb in [IncomeSlider.svelte](src/lib/components/IncomeSlider.svelte) is 16px; that needs to grow on touch viewports (CSS-only, no JS).

## What is NOT in C (deferred phases)

- D.1 a11y `<ul>` keyboard mirror + LiveRegion (the [Map.svelte](src/lib/map/Map.svelte) island has no keyboard parity yet)
- D.2 perf (topojson trial, MapLibre lazy load audit, JS bytes on /methodology = 0)
- D.3 SEO (OG image, JSON-LD Dataset schema, sitemap.xml, robots.txt is already done in B.1's earlier work)
- Paraglide message file additions for new copy (Phase D-ish)
- Custom domain

## File index for C

New in C.1:
- `src/pages/methodology.astro`
- Maybe `src/content/methodology.md` if you choose the content-collection route

New in C.2:
- `src/lib/components/BottomSheet.svelte`
- Possibly a new npm dep + update to [package.json](package.json) and lockfile

Modified in C.2:
- [src/pages/index.astro](src/pages/index.astro) — wrap the existing `<aside class="panel">` in a `BottomSheet` on mobile breakpoints, leave it untouched on desktop
- Possibly [src/lib/components/IncomeSlider.svelte](src/lib/components/IncomeSlider.svelte) — bump thumb to 44×44 on touch
