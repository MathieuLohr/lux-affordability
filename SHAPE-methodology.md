# Shape brief: /methodology

Status: draft, awaiting user confirmation. Do not implement until confirmed.

## 1. Feature summary

A single static Astro route at `/methodology` that explains how the affordability map is built, defends the rent-yield estimation, lists every data source with live links, and serves both quick-citing journalists and deep-reading researchers from one document. Editorial in voice, not doc-site in chrome. Ships zero JavaScript.

## 2. Primary user action

**A reader builds enough trust in the methodology to either cite it (journalist) or critique it on its own terms (researcher), without leaving the page to verify what's claimed.** Every methodological claim is either footnoted to a primary source or visibly defended in the body; the rent-yield estimation in particular is shown to be a measurement of a real cluster, not an assumption.

## 3. Design direction

**Color strategy:** Restrained, per DESIGN.md. Tinted neutrals only on this page; the band ramp colors appear once, in the inline yield-distribution figure, where the dot positions map to where each commune falls in the affordability ramp. The accent (`--accent: oklch(0.52 0.18 30)`) appears only on focus states.

**Theme via scene sentence:** *A journalist on a 14-inch laptop in a daylit Brussels press room, scrolling to verify a footnote before they file a story; or a STATEC researcher reading the same page top-to-bottom on a 27-inch monitor at home in the evening.* Forces a light theme. The page must read on both screens at both ambient light levels without any toggle.

**Anchor references** (chosen): NYT The Upshot methodology notes, ProPublica Nerd Blog / methodology pages. Both share: scannable hierarchy under a calm typographic voice, footnotes that read like working notes rather than academic citations, source-list discipline, no chrome that doesn't earn its place.

No visual direction probes were generated; the harness lacks native image generation and the brief is sufficiently constrained by DESIGN.md and the chosen anchor refs.

## 4. Scope

- **Fidelity:** production-ready
- **Breadth:** the full single page, all sections
- **Interactivity:** static, zero JS, anchor-link navigation only
- **Time intent:** ship-quality, brief is detailed enough to hand directly to `/impeccable craft` next

## 5. Layout strategy

Single column, max content width 720px, centered, generous left/right gutter on viewports above 900px. The page reads as one continuous document; section boundaries are signaled by the 1px hatch row (the site's single ornament, defined in DESIGN.md), never by full-width banded backgrounds or card containers.

**Vertical rhythm:**

```
[masthead: 52px, stripped variant]

[80px space]

[H1, Fraunces opsz 72, 44-56px, weight 500, -0.02em]
[24px gap]
[deck / standfirst, Inter 18px, ink-soft, max 60ch]
[40px gap]

[On this page index, JetBrains Mono 11px, 4-6 lines, hung dot leaders to numbers]
[64px gap]

[H2 section opener with hatch row above, Fraunces opsz 30, 24px, weight 500]
[24px gap]
[body in Inter 16px / 1.6, capped 70ch]
  [pull-quote where one earns its place: Fraunces italic 22px with SOFT 100 WONK 1, 1px ink-faint left hairline at 16px padding]
  [inline figure: yield-distribution SVG, 600x180, full content-width, caption in Mono 11 below]
[H3 if needed, Fraunces opsz 24, 18px]
[continued body]

[hatch row, then next H2 section]

...

[Footnotes section: H2 in same style, then numbered list, mono 11px, hung first-line indent, links underlined in ink-soft]

[Cite-as line: single line, mono 11px, ink-faint, full content-width]

[Footer line: mono 9px, ink-faint, "no tracking, no cookies, source on GitHub"]

[80px bottom gutter]
```

The hatch row is the one piece of ornament. It appears between H2 sections only, never between H3s, never above the H1.

## 6. Section list (canonical, in order)

1. **What this is**: 2-3 paragraphs framing the map as an affordability instrument, the 30/50/70 thresholds defined and sourced, who built it and why.
2. **How to read the map**: affordability bands with their thresholds, the three provenance states (measured / estimated / no data), how to interpret hatched polygons, what the tooltip surfaces.
3. **Data sources**: three subsections (commune boundaries, advertised rents, sale prices). Each lists publisher, license, format, period covered, suppression rules, update cadence. Live links to data.public.lu dataset pages (not raw download URLs).
4. **The rent-yield estimation**: the core methodological move. Walks the procedure: identify communes that publish both, compute gross annual yield, observe the cluster, apply the median to communes with sales but no rents. Contains the inline yield-distribution SVG. Defends the choice over a distance-to-capital regression.
5. **Limitations**: advertised vs concluded prices, low-volume yield distortion, temporal mismatch between annual sales and rolling-12-month rents, the 43-commune coverage gap.
6. **Income presets**: derivation table for each preset (minimum unqualified, minimum qualified, median, average, couple at 2x median). Notes Class 1 single-no-dependants tax assumption. Sources STATEC and ITM.
7. **Color choices**: table of bands with thresholds, OKLCH values, semantic meaning, citation for the 30% benchmark (Center for Housing Policy, OECD) and the 50/70% benchmarks (HUD severe-cost-burden categories). Brief note on the green-to-red threshold-crossing logic vs a continuous diverging scale.
8. **Update cadence**: quarterly per the Observatoire's release schedule, link to `meta.json` with the current data period and `generated_at` timestamp.
9. **Footnotes**: numbered, hung-indent, mono 11px.

The "What this is" and "How to read the map" sections are deliberately at the top because both audiences need them as orientation. The yield estimation is section 4 because journalists need to find it (it's the most-asked-about choice) and researchers need to read sections 1-3 first to follow it.

## 7. Key states

| State | What the reader sees | What they need to feel |
|---|---|---|
| **Default (page load)** | Stripped masthead, page title, deck, anchor index, body. SVG figure renders inline as static markup. | Calm, oriented, in the right place. |
| **Anchor click** | Smooth scroll (CSS `scroll-behavior: smooth`, 80px scroll-padding-top to clear masthead). Section top aligns under the masthead. | Instant control, no jank. |
| **Footnote click (jump down)** | Same smooth scroll to the numbered note. Note is briefly highlighted via `:target` selector with a 200ms transition on background to `--surface`. | "I went to the note." |
| **Footnote click (jump back)** | Each footnote ends with a `↩` mono character (one of the two SVG-icon exemptions, kept inline) linking back to the in-text reference. | "I know how to return." |
| **Cross-link click** (e.g., "see Wiltz") | Standard link navigation to `/?income=3540&size=55&pin=Wiltz`. Map page handles the rest. | "The methodology is connected to the map." |
| **External source click** | Standard link to data.public.lu dataset page. New tab. | Trust signal: the source is one click away. |
| **Reduced motion** | All scroll behavior collapses to `auto`; the `:target` highlight transition collapses to instant. | No vestibular discomfort, same content. |
| **Print** | Print stylesheet: drops the masthead and footer line. Footnotes render at the bottom of the page (unchanged). Body widens to full page width minus standard margins. Inline links render with their URLs in mono 9px after the link text (CSS `a::after { content: " (" attr(href) ")"; }` scoped to `@media print`). | The methodology survives outside the browser. |
| **Narrow viewport (≤ 720px)** | Same single column, gutters collapse to 16px each side, anchor index expands to a slightly larger tap target, footnote `↩` characters get a 24px tap target via padding. | Same reading experience, scaled. |
| **No-JS** (which is every reader, since the page ships none) | Identical to default. The page never relied on JS in the first place. | Invisible. |

There is no "loading" state because the page is fully static prerendered HTML.

## 8. Interaction model

The page is editorial, not interactive in the product sense. Every interaction reduces to a link click or a scroll. No accordions, no tabs, no expand-collapse, no hover-revealed content.

**Link inventory:**

- Anchor index links (4-6, in-page jump to section)
- Footnote in-text references (number, jumps down)
- Footnote return arrows (`↩`, jumps back up to the in-text reference)
- External source links (data.public.lu dataset pages, ITM, STATEC, OECD, HUD; all open in new tab via `target="_blank" rel="noopener"`)
- Cross-link to map: commune names in the body link to `/?income=3540&size=55&pin={commune}`. The default income/size in the URL match the map's defaults so the reader lands on a recognizable view, with the named commune pinned.
- "Back to the map" link in the masthead (top-right, JetBrains Mono 11px, one of two interactive elements in the masthead, alongside the title which is also a link to `/`).

**No analytics events. No copy-to-clipboard JS. No expand-this-section JS. No share buttons.** The cite-as line at the bottom is plain text that select-and-copy handles natively.

**Hover and focus:** all links use the same treatment defined in DESIGN.md: no underline by default for anchor index and back-to-map (these are mono and clearly functional), underline by default for body links and source links (these are inline prose). Focus-visible is the 3px accent halo on every link.

## 9. Content requirements

### H1

> **The methodology behind the map**

(Two-deck-line variant, considered: "Salary vs. Rent in Luxembourg / How this map is built." Single line is cleaner; the deck below the H1 absorbs the second line.)

### Deck (standfirst)

> Each commune is colored by the share of a chosen income that an estimated rent would consume. Some figures are measured, some are estimated from observed sales using the median rental yield, and some communes have no published data at all. This page explains all three.

(Inter 18px, `--ink-soft`, max 60ch. The deck does the work the about-sheet was doing in the prototype.)

### Anchor index

```
01    What this is
02    How to read the map
03    Data sources
04    The rent-yield estimation
05    Limitations
06    Income presets
07    Color choices
08    Update cadence
```

(JetBrains Mono 11px. Numbers in `--ink-faint`, labels in `--ink-soft`. Hung dot leaders optional; if too fussy, drop them. Each line is a link to `#section-N`.)

### Inline yield-distribution figure (caption)

> **Figure 1.** Gross annual rental yields for the 31 communes that publish both rents and sales in 2025. The 4.39% median (red line) is used to estimate rents in 23 communes that publish sales but not rents. Source: Observatoire de l'Habitat, calculations by the author.

(Caption in JetBrains Mono 11px, `--ink-soft`. "**Figure 1.**" weight 500.)

### One pull-quote candidate (in section 4, "The rent-yield estimation")

> The yield distribution is empirically narrow, not assumed: 31 communes, clustered between 3 and 8 percent, median 4.39. Estimating rent from observed sales is closer to ground truth than estimating from a regression on distance to the capital, even when the regression has lower variance.

(Fraunces italic 22px, SOFT 100 WONK 1, `--ink`, 1px `--ink-faint` left hairline at 16px padding. One per page maximum, per DESIGN.md.)

### Footnote example

> 1. Center for Housing Policy. "Affordability indicator." See also OECD Housing Database, Indicator HM1.2.1. ↩

(Mono 11px, hung first-line indent. Number in `--ink-soft`, body in `--ink-soft`, link underlined in `--ink-soft`. The `↩` arrow is mono 11px, no link styling, jumps to `#fnref-1`.)

### Cite-as line

> Cite as: Lohr, M. (2026). *Salary vs. Rent in Luxembourg, by commune.* Retrieved from [https://lux-affordability.example](#) on [today's date]. Data period: rents Q4 2025, sales 2025.

(Mono 11px, `--ink-faint`. The italic title uses Fraunces italic via inline `<cite>` styling. Date is statically rendered at build time; "today's date" is the build date.)

### Footer line (very bottom, after the cite)

> No tracking, no cookies. Source on GitHub.

(Mono 9px, `--ink-faint`. "Source on GitHub" is a link to the project repo.)

### Microcopy elsewhere

- Back-to-map link in masthead: `← Back to the map` (Mono 11px)
- External link affordance: no decorative external-link icon; the convention "external links open in new tab" is documented in section 3 and signaled by `target="_blank"` only

## 10. Recommended references

Files in the impeccable reference set most useful for craft:

- **brand.md**: primary register reference; the methodology page is the cleanest brand-register surface in the product
- **typeset.md**: for the Fraunces optical-axis tuning, opsz 72 at H1, the pull-quote SOFT/WONK settings, the mono hung-indent footnote treatment
- **layout.md**: for the section-rhythm spacing, the anchor index placement, the print stylesheet
- **clarify.md**: to second-pass the deck and the section openers; copy must hold up to journalist scrutiny

PRODUCT.md and DESIGN.md remain the canonical reference for tokens and product-level constraints throughout.

## 11. Open questions for craft

1. **Author attribution in the cite-as.** Currently "Lohr, M." Confirm before locking; could be an organization name or "Open Data Luxembourg" if institutional framing is preferred.
2. **GitHub repo URL.** "Source on GitHub" needs a real URL by ship time; placeholder until the repo is created.
3. **Yield distribution data points for the SVG.** The 31 commune-level yields need to be exposed in `static/data/meta.json` (or a sibling file) at build time so the SVG can be hand-authored against real numbers. The SVG itself is static markup, but its dot coordinates derive from the same pipeline that produces `communes.geojson`. Add this output to the data-pipeline phase of PLAN.md.
4. **Default income and size in cross-link URLs.** Currently proposed as `?income=3540&size=55` (median + 1-bed). If the URL state codec lands on different defaults, update the cross-link template to match.
5. **Rendering of the German and French versions later.** The German "Wohnungsmarkt" and French "Méthodologie" headings need to render acceptably at the H1 size (44-56px Fraunces) without breaking the deck max-width. Verify when the i18n scaffold lands; not blocking for the English ship.

---

## Confirmation request

Before this brief is locked and craft can begin: please confirm or push back on any of the following. If you object to any single item, this is the cheap moment to redirect.

- The 9-section structure and the canonical order
- The deck copy as written, the H1, the pull-quote candidate, the cite-as line, the footer line
- The anchor-index format (mono numbers + labels)
- The yield-distribution SVG as a single inline figure, no second figure
- The deep-link template `/?income=3540&size=55&pin={commune}` for in-body commune mentions
- The stripped masthead with "Back to the map" mono link top-right
- The print stylesheet behavior (drop chrome, render link URLs in mono after the link text)

Once confirmed, the next step is `/impeccable craft methodology` (or hand this brief directly to `/impeccable` for freeform implementation).
