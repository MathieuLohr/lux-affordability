# Handover

Snapshot of where this project stands, how to pick it back up, and where
the authoritative answers live. Treat the canonical docs (PRODUCT.md,
DESIGN.md, PLAN.md, SHAPE-methodology.md) as source of truth; this file
is the index and runbook on top.

## Status

- Live at: `https://lux-affordability.pages.dev` (Cloudflare Pages, auto-deploy on push to `main`)
- Repo: [MathieuLohr/lux-affordability](https://github.com/MathieuLohr/lux-affordability)
- Branch: `main`. PRs auto-build preview URLs.

### What is built

| Surface | Status | Notes |
|---|---|---|
| Astro 6 + Svelte 5 + Tailwind v4 + Paraglide scaffold | shipped | TypeScript strict, build green, `astro check` 0/0/0 |
| `/` (map page) | shipped (B.1) | MapLibre 5 + MapTiler Positron basemap, 100 communes choropleth (34 measured, 23 estimated with diagonal hatch, 43 no-data grey), 5-band OKLCH ramp via `oklch-to-hex`, hover tooltip, click-to-pin with Esc unpin, hardcoded default scenario (€3540 income, 55m²). Sliders + URL state still deferred to B.2 |
| `/methodology` | production-ready | full 8-section editorial article per `SHAPE-methodology.md`, zero JS, mobile bottom-up to 375px verified |
| Paraglide messages (chrome) | en + fr | `messages/{en,fr}.json`; tree-shaken at build time; long-form prose still inline english pending fr content collection |
| Cloudflare Pages headers | shipped | `public/_headers` caches `/_astro/*` immutable, `/data/*` short with stale-while-revalidate, sets conservative security headers |
| GitHub repo + CF Git connection | live | every push to `main` redeploys, every PR gets a preview URL |

### What is not built (deferred phases from PLAN.md)

| Phase | Owns | Blocker / next move |
|---|---|---|
| A.2 Data pipeline | `scripts/build-data.ts`, source fetch, XLS parsing, yield estimation, `static/data/{communes.geojson,meta.json}` | run `/impeccable shape` against `PLAN.md §A.2` or `/gsd-plan-phase data-pipeline`. Source URLs already in `data/source-urls.json` |
| B.2 URL state | `src/lib/state/scenario.svelte.ts`, `url-codec.ts`, sliders / preset / segmented controls | depends on map mount; pure Svelte 5 runes, no nanostores |
| C.1 Methodology updates | swap illustrative yield data for real pipeline output; resolve income preset table from STATEC/ITM build | pipeline prerequisite |
| C.2 Mobile bottom sheet | `BottomSheet.svelte`, snap points 25/60/95 | requires resolving the vaul-svelte / hand-rolled call flagged in `PLAN.md §0.2` |
| D.1 A11y | a11y `<ul>` for canvas polygons, `LiveRegion`, deuteranopia verification | map prerequisite |
| D.2 Perf | topojson trial, MapLibre lazy load, bundle audit | map prerequisite |
| D.3 SEO | OG image, JSON-LD `Dataset` schema, sitemap.xml | mostly indep, can ship anytime |
| Custom domain | TBD | choose name (e.g. `salaryvsrent.lu`, `housing.lu`), point DNS at Cloudflare |

## Stack and rules (locked)

These are decided. Do not relitigate without an explicit conversation.

- Astro 6 + Svelte 5 islands. TypeScript strict. pnpm 11.
- Tailwind v4 via `@tailwindcss/vite`. No `@astrojs/tailwind` (legacy v3). Color tokens live in `:root` as bare names (`--ink`, `--band-a`); `@theme` carries only `--font-*` and `--ease-*` so Tailwind utilities (`font-display`, `ease-out`) still work.
- Paraglide JS via `paraglideVitePlugin`. Static export, no middleware. Per-locale routing when fr ships.
- MapLibre GL JS (not Mapbox). MapTiler Positron basemap.
- SheetJS for legacy XLS parsing in the data pipeline.
- Deploy: Cloudflare Pages primary. Vercel was the original PROMPT.md primary but CF won on unlimited bandwidth.
- Node 22.13+ (Cloudflare uses `NODE_VERSION=22.13.0` from the dashboard env vars; local devs use nvm v22).

Project rules:

- No em dashes anywhere (src, docs, commits, copy). Use commas, colons, semicolons, periods, parentheses.
- No emojis in code, commits, or shipped UI. README ban extends.
- Commits in imperative lowercase mood, no trailing period.
- Design tokens are locked (PRODUCT.md Strategic Principle 10). Token changes require an explicit conversation.

## Local setup

Requires Node 22.13+ and pnpm 11. If `pnpm --version` errors with a node version warning, switch to v22 first (the existing `package.json` `engines.node` enforces this).

```bash
nvm use 22                  # or any way you get node 22 on PATH
pnpm install                # honors pnpm-workspace.yaml allowBuilds for esbuild/sharp/workerd
pnpm dev                    # http://localhost:4321 with HMR
pnpm build                  # static export to dist/
pnpm preview                # serves dist/ on 4321
pnpm check                  # astro check (TS + Astro diagnostics)
```

## Repo layout

```
.
  astro.config.mjs               # svelte + tailwind + paraglide vite plugin
  svelte.config.js
  package.json                   # pnpm@11, engines node >=22.13
  pnpm-workspace.yaml            # build script allowlist (esbuild, sharp, workerd)
  tsconfig.json                  # extends astro/tsconfigs/strict

  project.inlang/settings.json   # paraglide locales (en, fr) + message format
  messages/{en,fr}.json          # all paraglide-tracked strings

  public/
    _headers                     # cloudflare pages cache + security headers
    robots.txt
    favicon.svg, favicon.ico

  src/
    pages/
      index.astro                # map page stub (Phase A.1)
      methodology.astro          # production /methodology
    layouts/
      Layout.astro               # shared <head>, font preload, global css
    components/
      MastheadStripped.astro     # 52px masthead for methodology page
      HatchRule.astro            # the site's one ornament (3px diagonal hatch)
      YieldFigure.astro          # inline svg dot plot, build-time computed
    styles/
      global.css                 # tailwind import + @theme fonts + focus + reduced-motion
      tokens.css                 # design.md tokens verbatim under :root
    paraglide/                   # generated by paraglide vite plugin (gitignored)

  data/
    communes_v2.geojson          # canonical 100-commune boundary seed
    source-urls.json             # data.public.lu dataset ids + parsing hints

  .docs-cache.md                 # phase 0 research cache (gitignored)
  .planning/                     # gsd workflow artifacts (if present, gitignored)

  HANDOVER.md                    # this file
  PROMPT.md                      # original intent
  PLAN.md                        # full phased implementation plan
  PRODUCT.md                     # locked product brief
  DESIGN.md                      # locked design system
  SHAPE-methodology.md           # locked /methodology shape brief
  CONTEXT.md                     # raw research notes
  prototype.html                 # original single-file prototype (reference only)
```

Generated files (gitignored): `node_modules/`, `dist/`, `.astro/`, `src/paraglide/`.

## Common workflows

### Iterate on existing pages

```bash
pnpm dev
# edit files, hot reload picks up changes
# when done:
git add <files>
git commit -m "describe what changed"
git push
# cloudflare auto-deploys
```

### Add a new page

Reuse `Layout.astro`. If the page is editorial (like methodology), reuse `MastheadStripped` + `HatchRule`. If interactive, add a Svelte island with `client:visible` or `client:only="svelte"` for map-style components.

### Add a new string

For chrome-level strings, add the key to both `messages/en.json` and `messages/fr.json`, then `import { m } from '../paraglide/messages.js'` and call `m.your_key()`. Compiler picks up the change at next build.

For body prose (paragraphs in editorial pages), inline english is the current pattern until the fr content-collection migration. Document the intent inline so the future translator finds it.

### Refresh data (Phase A.2, not yet built)

Will be: `pnpm run data:refresh`. Will fetch the latest XLS releases from `data.public.lu`, re-run the yield estimation, and rewrite `static/data/communes.geojson` and `static/data/meta.json`. Commit the outputs; Cloudflare picks them up on push.

### Deploy

Push to `main`. Cloudflare Pages rebuilds automatically. Watch the **Deployments** tab in the CF dashboard for status. PR branches get preview URLs at `<pr-hash>.lux-affordability.pages.dev`.

If a build fails with `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: <pkg>`, add `<pkg>: true` to `allowBuilds:` in `pnpm-workspace.yaml`, commit, push.

## How to iterate (re-entry recipe)

When picking this project back up after time away:

1. Read this file end to end (5 min).
2. If the work is design-flavored, re-read `PRODUCT.md` and `DESIGN.md` (15 min). They are the locked answers.
3. Open `PLAN.md` to the phase you are about to work on. PLAN.md has anti-pattern guards and verification steps per phase, do not skip them.
4. `pnpm install && pnpm dev`. Confirm local works before changing anything.
5. For a substantial feature, run `/impeccable shape <feature>` and wait for an explicit brief confirmation before any code. PRODUCT.md context does not count as shape; the gate exists for good reasons.
6. Implement, run `pnpm build && pnpm check`, screenshot at desktop / tablet / mobile, then commit. Use the project's commit style (imperative lowercase, no trailing period, no em dashes).
7. Push. CF deploys. Verify on the live URL.

## Soft spots and known TODOs

These are flagged in the existing docs but easy to lose track of.

- **Yield-distribution figure** uses 31 illustrative values matching the methodology's stated properties. Swap to real per-commune yields once Phase A.2 data pipeline emits them to `static/data/meta.json` (or a sibling file). See `src/components/YieldFigure.astro`.
- **Income preset table** in `/methodology` uses rounded illustrative figures. Update with the real STATEC and ITM 2025 publications when the pipeline lands. See `src/pages/methodology.astro` section `#income-presets`.
- **Cite-as URL** points at `https://lux-affordability.pages.dev`. If a custom domain ships, update the constant in `src/pages/methodology.astro` frontmatter.
- **`robots.txt` sitemap URL** points at `pages.dev`. Update on custom domain.
- **OG image** (`public/og.png`) not yet created. Phase D.3.
- **Sitemap.xml** not yet created. Phase D.3.
- **Tokens duplication** (`@theme` for `font-*` and `ease-*`, `:root` for everything else). Decision documented as intentional (DESIGN.md tokens win, Tailwind utilities still work). Reopen only if it bites.
- **Paraglide static export** uses build-time message resolution. Locale switching at runtime is possible by routing per-locale (`/fr/methodology`) but not yet wired. Adding it costs one Astro middleware or a per-locale routes split.

## Where authoritative answers live

| Question | Read |
|---|---|
| What is the product, who is it for, what voice? | `PRODUCT.md` |
| What does the design system say about color, type, spacing, components? | `DESIGN.md` |
| What is the full phased build plan, what are the anti-pattern guards per phase? | `PLAN.md` |
| Why is `/methodology` shaped the way it is, what copy was approved? | `SHAPE-methodology.md` |
| What were the locked decisions (Astro vs SvelteKit, Vercel vs Cloudflare, etc.)? | `PROMPT.md` + conversation log |
| Raw research, source URLs, parsing hints | `CONTEXT.md`, `data/source-urls.json` |
| Phase 0 docs research, copy-ready snippets for Astro/Svelte/Tailwind/Paraglide | `.docs-cache.md` (gitignored) |
| Live runtime status | Cloudflare dashboard, project `lux-affordability` |

## Future tooling (optional)

Already wired and working: `git push` to `main` deploys. Nothing else needed for normal updates.

If you want claude (or any AI assistant) to manage deploys, env vars, or roll back from a chat, add Cloudflare's official MCP servers:

```bash
# deploy management (build status, rollbacks)
claude mcp add cloudflare-builds -- npx mcp-remote https://builds.mcp.cloudflare.com/sse

# bindings management (env vars, secrets, KV, R2)
claude mcp add cloudflare-bindings -- npx mcp-remote https://bindings.mcp.cloudflare.com/sse

# observability (logs, analytics)
claude mcp add cloudflare-observability -- npx mcp-remote https://observability.mcp.cloudflare.com/sse
```

OAuth happens on first call. The MCP servers are remote-hosted by Cloudflare; no local install or token storage on disk.

Alternative for one-shot deploys outside Git: `pnpm add -g wrangler && wrangler login && wrangler pages deploy dist --project-name lux-affordability`. Useful only when you want to preview a build that is not committed; the normal flow is push to `main`.
