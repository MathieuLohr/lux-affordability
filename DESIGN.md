# DESIGN.md

The locked design system for the Luxembourg housing affordability site. All tokens here are canonical; changes require explicit discussion (see PRODUCT.md, Strategic Principle 10).

## Color

### Strategy

**Restrained.** Tinted neutrals carry the chrome. The OKLCH affordability ramp carries all the chroma in the product. One warm accent is reserved exclusively for focus and active states. Drift past these constraints (additional accents, decorative color blocks, gradient backgrounds) constitutes a slip.

### Neutral palette (cool-tinted toward hue 250-260)

```css
--bg:        oklch(0.985 0.003 250);   /* page background */
--surface:   oklch(0.965 0.004 250);   /* recessed surfaces, segmented track, coverage strip variant */
--ink:       oklch(0.20 0.012 260);    /* primary text, slider thumb, tooltip background */
--ink-soft:  oklch(0.45 0.012 260);    /* secondary text, control labels */
--ink-faint: oklch(0.65 0.008 260);    /* tertiary text, ticks, attribution */
--rule:      oklch(0.90 0.006 260);    /* borders, dividers */
--rule-soft: oklch(0.94 0.005 260);    /* faintest hairlines */
```

Pure white and pure black are banned. Where translucent overlays are needed inside the dark tooltip (which has `--ink` background), use `oklch(0.985 0.003 250 / X)` not `oklch(1 0 0 / X)`.

### Accent

```css
--accent: oklch(0.52 0.18 30);   /* warm orange-red, used MINIMALLY */
```

Permitted uses: focus ring (3px halo at 30 percent alpha), active-state hint where structurally needed. Banned uses: hover backgrounds, link color, any decorative fill, brand mark.

### Affordability bands (the only saturated content in the product)

```css
--band-a: oklch(0.62 0.13 145);  /* under 30 percent of income: green, within affordability ceiling */
--band-b: oklch(0.78 0.16 95);   /* 30 to 40 percent: amber, stretched */
--band-c: oklch(0.66 0.18 50);   /* 40 to 50 percent: orange, burdened */
--band-d: oklch(0.52 0.20 25);   /* 50 to 70 percent: red, severely burdened */
--band-e: oklch(0.36 0.13 20);   /* over 70 percent: deep crimson, beyond reach */
--band-x: oklch(0.88 0.005 260); /* below publication threshold: light grey, no data */
```

The hue progression runs green to amber to red rather than a continuous diverging scale because the affordability question is about threshold crossings (the 30 / 50 / 70 percent benchmarks), not deviation from a midpoint. The 30 percent ceiling is the standard housing-economics benchmark (Center for Housing Policy, OECD); 50 and 70 percent match HUD severe-cost-burden categories.

### Color-blindness contract

The ramp must be verified in the Chrome DevTools Rendering panel under all three deficiency emulations (deuteranopia, protanopia, tritanopia) before each release. The cheapest fix for any band collapse is increasing lightness contrast between adjacent bands; the existing 0.62 / 0.78 / 0.66 / 0.52 / 0.36 lightness pattern provides a non-monotonic L-channel that survives most deficiencies. Provenance hatching on estimated communes adds a second non-color channel by default.

## Typography

Three families, each with a non-overlapping job. Do not introduce a fourth.

### Stack

| Family | Role | Notes |
|---|---|---|
| **Fraunces** (variable: opsz, wght 300-700, SOFT 0-100, WONK 0-1) | Display only | Masthead title, panel title, methodology page H1/H2/H3, pull-quotes. The `<em>` italic uses `SOFT 80-100` for a humanist literary feel. Optical size axis must match render size (opsz 14 at 17px, opsz 30 at 22px+, opsz 72 at 44px+). |
| **Inter** (400 / 500 / 600) | UI body, controls, paragraph text | The default for everything not explicitly assigned to Fraunces or JetBrains Mono. |
| **JetBrains Mono** (400 / 500) | All numerals, eyebrows, code, tags, ticks, mono labels | Used wherever a number lives, wherever a system metadata string lives, wherever an inline code or path appears. Tabular feel without forcing `font-variant-numeric: tabular-nums` (the metric is intentional). |

### Scale

| Role | Family | Size | Weight | Letter-spacing | Notes |
|---|---|---|---|---|---|
| Methodology H1 | Fraunces (opsz 72) | 44-56px | 500 | -0.02em | Brand register, breathing room |
| Panel title | Fraunces (opsz 30) | 22px | 500 | -0.02em | "Set your income, see *where it fits*." |
| Masthead title | Fraunces (opsz 14) | 17px | 500 | -0.01em | "Salary *vs.* Rent" |
| Methodology H2 | Fraunces (opsz 30) | 24px | 500 | -0.015em | Section openers |
| Methodology body | Inter | 16px | 400 | 0 | Line length capped 65-75ch |
| Methodology pull-quote | Fraunces italic (opsz 30, SOFT 100, WONK 1) | 22px | 400 | -0.015em | One per section maximum |
| UI body / panel text | Inter | 14px | 400 | 0 | |
| Tooltip name | Inter | 13px | 600 | -0.005em | |
| Tooltip ratio | JetBrains Mono | 22px | 500 | -0.02em | The big number |
| Live-result chip | Inter / Mono mix | 13/14px | 400/500 | 0 | |
| Field label | Inter | 11px | 500 | +0.04em | UPPERCASE |
| Eyebrow / section title | JetBrains Mono | 10-11px | 400 | +0.12 to +0.14em | UPPERCASE |
| Tick / footnote | JetBrains Mono | 9-10px | 400 | +0.04 to +0.08em | |
| Provenance tag | JetBrains Mono | 9px | 400 | +0.08em | UPPERCASE |

Line height: 1.15 for display, 1.45 for tooltip, 1.5 for UI body, 1.6 for methodology body.

### Anti-patterns

- No system fonts as primary body. The site is editorial; webfont load is non-negotiable but use `font-display: swap` and preconnect to fonts.googleapis.com (already in prototype).
- No font weight below 400. Thin weights tank legibility on cheap mobile screens at the methodology body size.
- No tabular-nums override. Mono is the tabular signal.

## Spacing & Layout

### Scale

```
4  6  8  10  12  14  18  20  24  32  48  64
```

Variable padding deliberately. The masthead is `0 24px`, the panel header is `18px 20px 14px`, the panel body padding is `0 20px 18px`, the legend is `14px 20px 16px`, the about-trigger is `8px 14px 8px 12px`. This is rhythm; do not normalize to a 4-multiple grid for its own sake.

### Container & line-length rules

- Methodology body line length: capped at 70ch (target), maximum 75ch.
- Map page is full-bleed; the floating panel is the only "container" and is exactly 320px wide on desktop.
- No global container wrapping every page. Each page makes its own layout decisions per its register.

### Surfaces & radius (hierarchical)

| Surface | Radius | Reason |
|---|---|---|
| Masthead | 0 | Top-edge of page, no corner |
| Floating panel | 8px | Card scale |
| About sheet (legacy) → methodology page | n/a route | Routing replaces the sheet |
| Mobile bottom sheet | 16px top corners only | Sheet idiom |
| Tooltip | 4px | Crisp, small |
| Segmented track | 6px (outer), 4px (inner active pill) | Nested |
| Pill chips (presets, about-trigger, live-result, threshold-pill) | 999px | Capsule |
| Provenance tag inside tooltip | 2px | Tightest, smallest |

Radius decreases as element size decreases. Do not invert this.

## Elevation

Two-layer shadows, ink-tinted (never pure black).

```css
/* level 1: hover, button, attribution */
box-shadow: 0 1px 2px oklch(0.20 0.012 260 / 0.04),
            0 1px 3px oklch(0.20 0.012 260 / 0.06);

/* level 2: floating panel */
box-shadow: 0 1px 2px oklch(0.20 0.012 260 / 0.04),
            0 12px 32px oklch(0.20 0.012 260 / 0.08);

/* level 3: tooltip, modal-equivalent */
box-shadow: 0 8px 24px oklch(0.20 0.012 260 / 0.18);

/* level 4: full sheet (mobile, methodology overlays if any) */
box-shadow: 0 1px 2px oklch(0.20 0.012 260 / 0.04),
            0 24px 48px oklch(0.20 0.012 260 / 0.18);
```

### Glassmorphism policy

`backdrop-filter: blur()` is permitted on **the floating panel only**, because it overlaps the colored choropleth and needs background separation. It is **not** permitted on the masthead or the about-trigger or any future floating UI; those must be opaque tints with a 1px rule. This is a deliberate departure from the prototype, where blur was applied liberally.

## Components

### Slider

- 4px track in `--rule`, 16px circular thumb in `--ink`.
- Thumb scales to 1.18× on hover with `cubic-bezier(0.16, 1, 0.3, 1)` over 150ms.
- Focus-visible: 3px halo at `oklch(0.52 0.18 30 / 0.3)` (the accent at 30% alpha).
- Mobile: thumb hit target ≥ 44×44 via `::before` pseudo-element overlay (visual thumb stays 16px).

### Preset pill chip

- Inter 11px / 500, padding `5px 10px`, radius 999px.
- Default: transparent bg, `--ink-soft` text, 1px `--rule` border.
- Hover: `--ink-soft` border, `--ink` text, no bg change.
- Active: `--ink` bg, `--bg` text, `--ink` border.
- No icon.

### Segmented control

- Outer: `--surface` bg, 1px `--rule` border, 6px radius, 2px inner padding.
- Active segment: `--bg` bg, `--ink` text, level-1 shadow + 1px `--rule` outline.
- Sub-label inside segment uses Mono 9px in `--ink-faint`.
- Each segment's sub-label states the m² mapping (Studio = 40, 1-bed = 55, 2-bed = 75).

### Tooltip

- `--ink` bg, `--bg` foreground; level-3 shadow; 4px radius; 240px max-width.
- Stack: name (Inter 13/600) → canton (Mono 9 eyebrow, 0.55 alpha) → ratio (Mono 22 / 500) → ratio label → divider rule (1px translucent) → detail rows (Inter 11, justified flex, 0.75 alpha) → provenance tag (Mono 9 pill, 2px radius).
- No-data variant: italic Inter 12, 0.65 alpha, no ratio block.

### Legend

- Section title (Mono 9 eyebrow) → 8px ramp bar (5 segments, no gap, 2px outer radius) → tick labels (Mono 9, six positions: 0/30/40/50/70/100+) → 30 percent threshold pill annotation.
- **Active read-out (new in production):** as the user changes income or apartment size, append a single-line counter row beneath the threshold pill showing distribution: "23 affordable / 34 stretched / 22 burdened / 18 severe / 3 beyond reach." Mono 10, `--ink-soft`, comma-separated, no icons.

### Coverage strip

- Single horizontal line at 11px Inter, `--ink-soft`, padded `11px 20px`.
- Three groups separated by `·` dividers in `--ink-faint`: measured (8px solid dot in `--band-c`) / estimated (8px dot in `--band-c` at 0.45 alpha) / no-data (8px dot in `--band-x`). Counts in `--ink` weight 500.
- Background tinted slightly darker than panel (`oklch(0.93 0.005 250)`) to set it apart as a status footer.
- This strip explicitly replaces the banned hero-metric-grid pattern. Do not regress to a card grid here.

### Live-result chip (masthead)

- Pill, Inter 13 in `--ink-soft`, `--surface` bg, 1px `--rule`, padded `6px 14px`.
- Renders one of two states:
  - **Aggregate (default):** "X communes affordable / Y with data" where X is the count of measured + estimated communes in band A under the current scenario, Y is measured + estimated total.
  - **Pinned (when a commune is pinned):** replaces aggregate with "{commune name}: {ratio}% of income / {provenance tag}." Tooltip on the map dismisses to leaves only this chip visible.
- One slot, two states. They never coexist.

### Methodology link / about-trigger

- Pill, Inter 12 / 500, `--ink-soft`, 1px `--rule`, padded `8px 14px 8px 12px`, info-circle icon 14px to the left.
- **No backdrop blur** (deliberate departure from prototype).
- Hover: `--ink` text, `--ink-soft` border.

### Map zoom controls (MapLibre default, restyled)

- Move to top-right (MapLibre `position: 'top-right'`) to clear the about-trigger area at bottom-left.
- 28×28 buttons, `--bg` fill, `--ink-soft` text, 1px `--rule` border, level-1 shadow.

### Pinned-commune visual state

- Polygon stroke increases from 0.5px (default) to 1.5px in `--ink`.
- Polygon fill alpha increases by 0.05 (so measured polygons go 0.85 → 0.90, estimated 0.72 → 0.77).
- Tooltip migrates from cursor-following to a fixed slot: top-right of the map on desktop, top of the bottom sheet on mobile, replacing the live-result chip per the rule above.
- Tap (touch) or click (desktop) toggles pinning. Esc unpins. Clicking another commune transfers the pin.

## Mobile bottom sheet (snap points 25 / 60 / 95)

The desktop floating panel is **not** rendered on mobile. The bottom sheet replaces it.

| Snap | Visible content | Drag behavior |
|---|---|---|
| **25% (peek)** | 28×4 rounded handle (in `--rule`), income value (Mono 14), slider (full width), pinned-commune ratio if pinned (Mono 22 + name in Inter 13). | Drag handle area only; map gestures pass through everywhere else. |
| **60% (default)** | Above + presets row + segmented control + legend ramp with active read-out. | Same. |
| **95% (full)** | Above + coverage strip + methodology link. | Same. |

- Sheet uses 16px top corners, opaque bg, level-4 shadow.
- No backdrop overlay behind the sheet (would obscure the map; the map is the point).
- Snap interpolation eases out with `cubic-bezier(0.16, 1, 0.3, 1)`, 280ms.
- Transitions honor `prefers-reduced-motion`.

## Loading & error states

- **Loading (map data not yet fetched):** stationary outline of Luxembourg's national boundary drawn in `--rule`, no shimmer, no spinner. The masthead, panel, and about-trigger render normally; the live-result chip shows `· · / ·`.
- **Error (data fetch failed):** same outline + a single line in `--ink-soft` Inter 13: "live data unavailable, showing cached snapshot from {meta.json:generated_at}." If no cache available, the line reads "data sources are temporarily unreachable; try again in a moment."
- **No-scenario URL (e.g., `?income=foo`):** silently fall back to defaults (median income, 1-bed). Do not show an error.

Brand-respectful failure: never a stack trace, never a generic "Something went wrong" page.

## Motion

- Default easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-quint). Strictly no bounce, no elastic, no spring overshoot.
- Default duration: 150ms for micro-interactions (button hover, focus ring, segmented switch). 280ms for sheet snap and tooltip slot transitions. Never animate above 400ms outside an explicit scrollytelling moment (which this site does not have).
- Never animate CSS layout properties (`top`, `left`, `width`, `height`); use `transform` and `opacity` only.
- `prefers-reduced-motion: reduce` collapses all transition and animation durations to 0.01ms (already in prototype).

## Iconography

- Two icons in the entire product: the info circle (about-trigger, methodology link), and the close X (sheet dismiss). Both stroke-based, 1.5-2px stroke weight, sourced inline as SVG (no icon library).
- No additional icons. If a label needs an icon to be understood, the label is wrong.

## Ornament

**One repeating ornament in the site:** the 8px diagonal stripe pattern.

- On the map: applied as a `fill-pattern` overlay on estimated provenance polygons.
- On the methodology page: a 1px-tall hatch row separates major sections (between H2 sections only, not H3). The hatch color is `--ink-faint`.
- Used nowhere else. No second ornament. No logo mark. The site has no separate "brand identity" beyond this single gesture and the type stack.

## Page-level typesetting

### Map page (`/`)

- Full-bleed map below 52px masthead.
- Floating panel top-left desktop / bottom sheet mobile.
- About-trigger bottom-left.
- Zoom controls top-right.
- Tooltip / pinned slot top-right (desktop) or top of sheet (mobile).
- The live-result chip lives inside the masthead.

### Methodology page (`/methodology`)

- No floating panel. No map. Single-column editorial layout.
- Max content width 720px, centered, generous left/right gutter on wide viewports.
- H1 in Fraunces 44-56px (opsz 72), 80px top margin from masthead.
- Section openers (H2) in Fraunces 24px (opsz 30), preceded by the 1px hatch row.
- Body in Inter 16px / 1.6, capped 70ch.
- Pull-quotes in Fraunces italic 22px (opsz 30, SOFT 100, WONK 1), set off with a 1px `--ink-faint` left border at 16px padding (this is permitted; the absolute ban on side-stripe borders applies to colored accent borders > 1px on cards/list items/callouts; a 1px hairline on a pull-quote is editorial typography, not card decoration).
- Citations as numbered footnotes at end of page, Mono 11px, hung first-line indent, links in `--ink-soft` underlined.
- A small footer line at the very bottom in Mono 9, `--ink-faint`: "no tracking, no cookies, source on GitHub."
- Methodology page ships zero JavaScript.

### OG image

A pre-made 1200×630 PNG depicting the map at the median-income / 1-bed default scenario, with the live-result chip visible and a Fraunces 36px tagline overlay reading "Salary vs. Rent in Luxembourg, by commune." Stored at `static/og.png`; regenerated by hand when the data refresh produces a meaningfully different visual (color distribution shift). Recipe documented in README.

## Internationalization

- All user-facing strings wrapped in `m.<key>()` from Paraglide.
- Number and currency formatting via `Intl.NumberFormat` with the active locale.
- The type stack must render French, German, and Luxembourgish acceptably (Fraunces and Inter both have full Latin Extended; JetBrains Mono covers all needed code points). Verify with French rendering of "Méthodologie" and German "Wohnungsmarkt" before locking the methodology page typography.
- Right-to-left support is not in scope.

## Tracking

Off by default. Plausible only behind `VITE_ANALYTICS_ENABLED=true`. The methodology footer states the no-tracking position quietly.

## Compliance summary against impeccable absolute bans

| Ban | Status | Notes |
|---|---|---|
| Side-stripe borders | Compliant | Pull-quote 1px hairline is editorial typography, not card decoration; explicitly carved out above. |
| Gradient text | Compliant | No gradient text anywhere. |
| Glassmorphism as default | Compliant | Blur restricted to floating panel only. Stripped from masthead and about-trigger relative to prototype. |
| Hero-metric template | Compliant | Coverage strip is a sentence, not a tile grid. |
| Identical card grids | Compliant | No card grids in the design. Presets are pill chips. |
| Modal as first thought | Compliant | About sheet promoted to a route. No other modals. |

## Tokens summary (canonical reference for implementation)

```css
:root {
  /* neutrals */
  --bg:        oklch(0.985 0.003 250);
  --surface:   oklch(0.965 0.004 250);
  --ink:       oklch(0.20 0.012 260);
  --ink-soft:  oklch(0.45 0.012 260);
  --ink-faint: oklch(0.65 0.008 260);
  --rule:      oklch(0.90 0.006 260);
  --rule-soft: oklch(0.94 0.005 260);

  /* accent (focus and active states only) */
  --accent: oklch(0.52 0.18 30);

  /* affordability ramp */
  --band-a: oklch(0.62 0.13 145);
  --band-b: oklch(0.78 0.16 95);
  --band-c: oklch(0.66 0.18 50);
  --band-d: oklch(0.52 0.20 25);
  --band-e: oklch(0.36 0.13 20);
  --band-x: oklch(0.88 0.005 260);

  /* type families */
  --font-display: 'Fraunces', Georgia, serif;
  --font-ui:      'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, monospace;

  /* easing */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```
