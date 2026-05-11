# Claude Code prompt: Luxembourg housing affordability site

I'm bringing in a working single-file HTML prototype (`prototype.html`) of a commune-level housing affordability map for Luxembourg. I want you to set it up as a deployable website I can ship to Vercel or Cloudflare Pages, and harden it for production. Read the prototype and `CONTEXT.md` first, then propose a plan before writing code.

## What the prototype already does

- Choropleth map of Luxembourg's 100 communes colored by rent burden (rent ÷ user-selected income)
- Income slider with presets (minimum wage tiers, median, average, dual income)
- Apartment size segmented control (studio/1-bed/2-bed)
- Tooltip showing rent, sale price, listing count, measured-vs-estimated tag
- Coverage: 34 communes with measured rents, 23 with estimated rents (via 4.4% median rental yield from communes publishing both rent and sale data), 43 with no data

## Stack I want

- **SvelteKit** (or Astro if you make a strong case for it). Static-export friendly, fast cold start, good for a mostly-static map app with a small island of interactivity.
- **MapLibre GL JS** instead of Leaflet for the production version. Vector tiles, smoother interactions, better mobile, no jQuery-era plumbing. The polygon-rendering approach stays the same, just port the styles.
- **TypeScript** throughout.
- **Tailwind v4** for utilities, but keep the existing CSS custom properties (`--band-a` etc) as the source of truth for the affordability ramp. The design tokens are tuned, don't replace them.
- **Vite** for build (comes with SvelteKit).
- **No CSS-in-JS**, no styled-components, no Emotion. Plain CSS modules or Tailwind only.
- **No state management library**. Svelte runes / Astro signals are enough.
- **pnpm** for package management.
- Deploy target: **Vercel** primary, with a working static-export config that also runs on **Cloudflare Pages** as a fallback.

## What needs to change vs. the prototype

### 1. Split the data from the code

The prototype embeds a 193KB GeoJSON inline. For production:
- Move `communes_v2.geojson` to `static/data/communes.geojson`
- Fetch it lazily on map mount, with a loading skeleton
- Add a build-time data pipeline (`scripts/build-data.ts` or `.mjs`) that:
  - Downloads the latest source files from `data.public.lu` (URLs in `CONTEXT.md`)
  - Re-runs the rent-yield estimation
  - Outputs the merged `communes.geojson` and a `meta.json` with the data period
- Run the pipeline on `pnpm run data:refresh` and commit the outputs. Don't run it at request time.

### 2. Add a real about/methodology page

The prototype's about sheet is too cramped for the full methodology. Make it a proper `/methodology` route with:
- Data sources (with live links to data.public.lu)
- The yield-estimation method explained, including limitations
- Income preset derivations (Class 1 tax assumptions)
- Update cadence (Observatoire publishes quarterly)

### 3. URL state

Affordability scenario should be shareable via URL params:
- `?income=3540&size=55` reflects in the URL as the user changes inputs
- Loading a URL with params restores the state
- Use SvelteKit's `$page.url` reactive store; debounce updates (300ms) to avoid history spam

### 4. Mobile

The prototype works on mobile but the panel covers half the screen. Production version needs:
- Bottom sheet pattern on small viewports (drag handle, snap points at 25%/60%/95% height)
- Touch-friendly slider thumb (min 44×44 hit target)
- Tap a commune to pin tooltip (since hover doesn't exist on touch)

### 5. Accessibility

The prototype is decent but not audited. Need:
- Keyboard navigation through commune polygons (arrow keys after Tab into the map)
- Screen reader announcements when income/size changes ("Now showing rent burden at €3,540 income, 1-bedroom: 49% in Luxembourg, 22% in Wiltz...")
- Color ramp must work for color-blindness (run it through a deuteranopia simulator in your testing). The current OKLCH ramp should mostly work but verify
- Focus-visible rings on all interactive elements
- Respect `prefers-reduced-motion` (already in prototype, keep it)
- Lighthouse a11y score 95+

### 6. Performance

- GeoJSON should be served gzipped (Vercel/CF do this automatically; verify in the response headers)
- Consider topojson if it shaves meaningful bytes (it should, ~30%)
- Lazy-load MapLibre GL only when the map mount is in the viewport (it's a 400KB+ library)
- Image preloading for tile basemap is fine, but the basemap itself should be the **MapTiler Positron** style or **Protomaps** if I want to host my own tiles. Default to MapTiler with their free tier, document switching to Protomaps as a future move.
- Lighthouse perf score 90+ on mobile

### 7. SEO and meta

- Server-rendered title and description (SvelteKit handles this)
- Open Graph image: a static rendering of the map at the median income preset, generated at build time via a headless browser screenshot or a pre-made PNG. Don't use og:image generation services.
- Schema.org structured data for the dataset (Dataset type)
- Sitemap.xml and robots.txt

### 8. Domain-thinking touches

- **i18n scaffolding**, not full translations. Wrap user-facing strings in a `t()` helper backed by a single `messages.en.json` for now, but structure it so French (`messages.fr.json`) can be added later by swapping the import. Most of the audience is multilingual; this isn't optional for a Luxembourg site, just deferred.
- **Currency and number formatting** via `Intl.NumberFormat`, locale-aware
- **No tracking by default**. Add a `VITE_ANALYTICS_ENABLED=false` env var. If true, use **Plausible** with a self-hosted or Plausible.io endpoint, configurable via `VITE_PLAUSIBLE_DOMAIN`. Never Google Analytics.

## What I do NOT want you to do

- Don't add user accounts, auth, comments, or any backend beyond static file serving
- Don't add a database. Everything is static JSON.
- Don't switch the map library to Mapbox GL (paid above free tier, license restrictions). MapLibre GL is the open fork.
- Don't add fancy animations beyond what's in the prototype. The whole point is precision.
- Don't change the design tokens (colors, typography, spacing rhythm). The aesthetic is deliberate. If you think something is wrong, flag it for me to decide.
- Don't add em dashes anywhere. Period.

## Process

1. Read `prototype.html` and `CONTEXT.md` carefully
2. Propose a project structure (file tree) and a phased plan
3. Wait for me to confirm before scaffolding
4. Build in this order: scaffold → data pipeline → port map → URL state → about page → mobile sheet → a11y pass → perf pass → deploy config
5. After each phase, run the build, fix errors, then ask before moving to the next phase
6. Do not silently swap libraries or restructure files without asking

## Definition of done

- `pnpm install && pnpm dev` runs the site locally
- `pnpm build && pnpm preview` runs a production build
- `pnpm run data:refresh` regenerates the dataset from data.public.lu
- Lighthouse mobile: perf 90+, a11y 95+, best-practices 95+, SEO 95+
- Vercel deployment via `vercel.json` config, no manual dashboard setup needed
- README documents: setup, data refresh cadence, methodology, deployment, how to add French translations later

Start by reading the two files, then come back with the plan. Don't write code yet.
