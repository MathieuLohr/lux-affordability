# PRODUCT.md

## Product Purpose

An interactive choropleth map showing what share of a chosen income would be consumed by rent in each of Luxembourg's 100 communes. Built to make the country's housing affordability gap legible. Luxembourg has the EU's highest GDP per capita and one of its worst rent-to-income ratios. The two facts are the same fact viewed from different ends; the map exists to make that single fact stand still long enough to be looked at.

The site is civic data journalism, not a SaaS tool. The map is the editorial. Interactivity exists to let any reader find their own situation in the picture (set income, set apartment size, see where they fit), and to share that scenario via URL with someone else.

## Register

**brand**

The design carries the message. The choropleth, the typography, the legend, the methodology page; these are the product. The slider and the segmented control are minimal scaffolding around the editorial argument, not the point of the visit.

## Users

Three audiences, ranked by frequency of visit:

1. **Luxembourg residents** asking "could I afford to live in commune X on my income?" Most likely route in: a press citation, a Reddit thread, a friend's link. Time on site: 2 to 6 minutes. Wants a personal answer fast, but rewards a thoughtful methodology if the design earns trust.
2. **Prospective movers** (cross-border commuters from France/Belgium/Germany weighing relocation, EU mobility candidates evaluating Luxembourg). Wants to compare communes, understand the geography, internalize the price gradient from the capital outward. Higher tolerance for exploration.
3. **Journalists, policymakers, civil-society researchers**. Wants to cite figures, link to a stable URL with a defensible methodology, screenshot a specific scenario. Methodology page must hold up to scrutiny. Sources must be linked, not just named.

Multilingual audience by default. English ships first; French is a near-term follow-up via Paraglide. The design must not assume English-only typography (no font choices that go feral in French/German/Luxembourgish).

## Brand & Tone

**Editorial, not marketing.** The site reads like a well-typeset civic publication, not a product landing page. No hero metric grids, no testimonial blocks, no "trusted by" logos, no signup form. The headline argument lives in the masthead and the live-result chip; the body of the argument is the map itself.

**Voice characteristics:**
- Precise, declarative, unadorned. Short sentences. No marketing verbs ("unleash," "empower," "transform").
- Honest about what's measured, estimated, and unknown. The 43 communes with no data stay grey on the map and grey on the page; admitting that is the brand.
- Comma-spliced explanations are welcome where they read naturally; the methodology page should sound like someone who knows the material talking, not a doc site.
- No em dashes. Project rule, no exceptions. Use commas, colons, semicolons, periods, or parentheses.
- No emojis anywhere in shipped UI, code, or commit messages.

**Trust signals are structural, not decorative.** Provenance is shown in the tooltip's mono tag (`measured` vs `estimated`), in the diagonal hatch on estimated polygons, and in the methodology page's footnoted citations. There is no "verified" badge, no security-theatre trust seal.

## Anti-references

What this site is *not*, and the visual languages it must avoid converging on:

- **Not a SaaS dashboard.** No KPI tiles, no sidebar nav with icon list, no dark mode "because tools look cool dark," no card grid of identical metric cards.
- **Not a real-estate listing portal** (Athome, Immotop, Idealista). Those sites optimize conversion to lead capture; this site has nothing to sell.
- **Not a government data portal** (data.public.lu, Eurostat). Those sites are warehouses; this site is a single argument with a single visual.
- **Not a generic civic-tech blue-and-grey** look. The first-order reflex for "European housing data" is navy + grey + sans-serif; this site avoids that by leaning literary (Fraunces with optical-size and SOFT axis), tinting all neutrals warm-cool toward hue 250-260 (not pure grey), and reserving chroma exclusively for the band ramp on the map.
- **Not data art.** No animated transitions between scenarios beyond minimal feedback, no scroll-triggered reveals, no narrative scrollytelling. The map is read like a chart, not watched like a film.

## Strategic Principles

1. **The map is the headline.** Every other element must demonstrably serve reading the map; if it competes for attention with the choropleth, it is wrong. The masthead is 52px, the panel is a 320px floating card, the about link is a small pill. The map gets the rest of the screen.
2. **Provenance is non-negotiable.** Measured / estimated / no-data must be visible in three places per data point: the polygon fill (solid / hatched / grey), the tooltip tag (mono pill), and the legend coverage strip. If any of these three goes missing, the design has slipped.
3. **Honest grey beats inferred color.** The 43 communes with neither rents nor sales stay grey. A regression model (distance to capital, etc.) could fill them in but would invent precision the source data does not have. The grey is the brand.
4. **One ornament.** The diagonal hatch pattern is the site's only repeating visual motif. It identifies estimated provenance on the map and reappears as a 1px-tall section divider on the methodology page. No second ornament, no logo mark, no decorative flourish.
5. **Restrained color, committed typography.** The color strategy is Restrained (tinted neutrals + the band ramp + one warm accent for focus/active). The typography is committed: three families (Fraunces, Inter, JetBrains Mono), each with a non-overlapping job. Do not introduce a fourth font; do not let the accent color leak beyond focus and active states.
6. **Two surfaces, two tones.** The map page is dense and operational (panel, slider, tooltip, legend). The methodology page is editorial and breathing (display Fraunces, generous line height, single column, footnoted citations). Each surface gets its own typesetting rules. They are recognizably the same site by tokens and ornament, not by template.
7. **Mobile is a redesign, not a reflow.** The bottom-sheet pattern at snap points 25 / 60 / 95 percent is the production mobile experience; the desktop panel does not appear on mobile. Tap-to-pin replaces hover-to-show on touch devices.
8. **Performance is part of the brand.** A civic site that takes 3 seconds to draw the map fails the audience that came in from a press link on mobile. Lighthouse mobile perf 90+, a11y 95+. MapLibre lazy-loaded behind viewport visibility. Methodology page ships zero JavaScript.
9. **No tracking by default.** The site does not need analytics to exist. If analytics ship, they ship via Plausible behind an explicit `VITE_ANALYTICS_ENABLED=true` flag; never Google Analytics, never a third-party tag manager. The lack of tracking is itself an editorial position and may be stated quietly in the methodology page footer.
10. **Design tokens are locked.** The OKLCH band ramp, the neutral palette, the type stack, and the spacing scale are fixed by this document. Changes require an explicit conversation; they do not happen as a side effect of adding a feature.
