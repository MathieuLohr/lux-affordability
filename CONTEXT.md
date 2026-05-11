# Project context: Luxembourg housing affordability map

## What this is

An interactive choropleth map showing what share of a chosen income would be consumed by rent in each of Luxembourg's 100 communes. Built to make the country's housing affordability gap legible: Luxembourg has the EU's highest GDP per capita and one of its worst rent-to-income ratios. The two facts are the same fact, viewed from different ends.

Audience: Luxembourg residents, prospective movers, journalists, policymakers, civil society. Multilingual (FR/EN/DE/LB), but English-first ships.

## Data sources

All published by Luxembourg state agencies under open licenses on `data.public.lu`. No scraping, no terms-of-service issues.

### Commune boundaries

- **Source**: Administration du cadastre et de la topographie (ACT)
- **Dataset**: "Limites administratives du Grand-Duché de Luxembourg"
- **Direct URL**: https://download.data.public.lu/resources/limites-administratives-du-grand-duche-de-luxembourg/20231123-101528/communes4326.geojson
- **License**: CC0
- **Format**: GeoJSON, EPSG:4326 (WGS84)
- **Properties**: `COMMUNE` (name), `CANTON`, `DISTRICT`, `LAU2` (statistical code)
- **100 features**, one per commune
- **Original size**: ~1MB. Simplified at 0.001 degree tolerance with Shapely → ~190KB
- **Update cadence**: Stable. Communes have merged historically (last big round 2018) but the file is essentially static for the foreseeable future.

### Advertised rents per commune

- **Source**: Observatoire de l'Habitat (Ministère du Logement et de l'Aménagement du territoire / LISER / STATEC)
- **Dataset**: "Loyers annoncés des logements - Par commune"
- **Dataset ID**: `57f25c07cc765e23279433af`
- **Latest resource**: `https://download.data.public.lu/resources/loyers-annonces-des-logements-par-commune/20260326-095959/location-appartement-2025.xls`
- **Period covered**: Rolling 12 months ending Q4 2025 (latest as of March 2026)
- **License**: CC-BY 4.0
- **Format**: XLS (yes, legacy Excel, not XLSX)
- **Cells suppressed** for communes with fewer than 30 listings, to protect identifiability. Marked `*` in the source.
- **Coverage**: 34 communes (out of 100) cleared the threshold in 2025
- **Update cadence**: Quarterly. New URLs published each quarter; the dataset page lists all historical resources.
- **Structure**: Header at row 9 (zero-indexed: 8), columns are: empty, empty, `Commune`, `Nombre d'annonces`, `Loyer moyen (€)`, `Loyer moyen au m² (€/m²)`. Last row is `Moyenne nationale` (national average).

### Sale prices per commune

- **Source**: same as rents
- **Dataset**: "Prix de vente des appartements - Par commune"
- **Dataset ID**: `57f26768cc765e23279433b0`
- **Latest resource**: `https://download.data.public.lu/resources/prix-de-vente-des-appartements-par-commune/20260326-094248/prix-moyen-au-metre-carre-enregistre-par-commune-2025.xls`
- **Period covered**: Calendar year 2025
- **License**: CC-BY 4.0
- **Format**: XLS
- **Two transaction types** in one sheet: `existing` (`Ventes d'appartements existants`) and `VEFA` (`Ventes en état futur d'achèvement`, off-plan / new construction)
- **Coverage in 2025**: 56 communes have at least one publishable price (existing or VEFA)
- **Suppression rule**: prices not displayed where transaction count < ~5 per category
- **Structure**: Header at row 11 (index 10). Columns: empty, `Commune`, `n existing`, `price existing per m²`, `range existing`, `n VEFA`, `price VEFA per m²`, `range VEFA`. Asterisks for suppressed cells.
- **Update cadence**: Annual full year, plus quarterly rolling 12-month aggregates

### Higher-level aggregates (zone level)

The Observatoire publishes "Le Logement en Chiffres" quarterly as a PDF report containing aggregate prices for four zones:

- **Canton de Luxembourg** (the capital + immediate suburbs)
- **Capellen-Mersch** (cantons of Capellen and Mersch)
- **Est** (cantons of Echternach, Grevenmacher, Remich)
- **Nord** (cantons of Clervaux, Diekirch, Redange, Vianden, Wiltz)
- **Canton d'Esch-sur-Alzette** (separate, the Minette industrial belt)

Latest: `https://download.data.public.lu/resources/prix-de-vente-des-appartements-le-logement-en-chiffres/20260326-100211/logement-en-chiffre-19.pdf`

These aren't used in the current prototype but could provide fallback regional data for unsuppressed communes if you want to extend coverage.

### Income data

Hardcoded in the prototype because Luxembourg doesn't publish median income at commune level. Sources for the presets:

- **Net median individual income €3,540/month** (2025): STATEC SILC 2025 wave, derived from disposable household income €6,522/month and standard equivalence scales
- **Average net €3,800/month**: STATEC labour-cost statistics, gross-to-net for Class 1 single-no-dependants
- **Minimum wage**: Set quarterly by law. As of January 2026:
  - Unqualified: €2,704 gross, ~€2,300 net
  - Qualified (typically 20% premium): €3,244 gross, ~€2,650 net
  - Source: ITM (Inspection du Travail et des Mines), https://itm.public.lu/
- **Couple at 2× median**: derived

Important: net figures assume Class 1 (single, no dependants). Class 2 (couples filing jointly) has lower effective tax. If you ever expose a "tax class" toggle, recompute.

## Methodology: rent yield estimation

The prototype's biggest contribution beyond raw data display is bridging the rent-data coverage gap (34 communes) using the sale-data coverage (56 communes).

**Procedure**:
1. Identify communes that publish both: 31 communes
2. For each, compute gross annual rental yield: `(monthly_rent_per_m² × 12) / sale_price_per_m²`
3. Yields cluster tightly between 3% and 8%, median 4.39%
4. For communes with a published sale price but no published rent, estimate monthly rent per m² as `(sale_price_per_m² × 0.0439) / 12`

**Why this is defensible**:
- The yield distribution is empirically narrow, not assumed
- 4.4% is consistent with Luxembourg's reputation as a low-yield, capital-gains-driven property market
- The estimate is bounded: it can be checked against the published rent if/when that commune crosses the listing threshold
- Estimated communes are visually distinguished (hatched fill) and tagged in tooltips

**Why this isn't a regression on distance to Luxembourg City** (the obvious alternative):
- The Observatoire's own work shows distance explains >50% of price variance, but error bars on a regression are large at the commune level
- Estimating from observed sales data is closer to ground truth than estimating from a model
- For the 43 communes with neither rents nor sales published, no estimation method is honest enough. They stay grey.

**Limitations to surface in the methodology page**:
- Advertised rents are asking prices; concluded contracts settle 3-6% below
- The estimate assumes the same yield applies in lower-volume markets, which may not hold (low-volume markets often have unusual yields due to small sample distortion)
- Mixing sources from slightly different periods (annual sales vs rolling 12-month rents) introduces minor temporal mismatch

## Color logic (don't change without thinking)

Discrete bands at affordability thresholds, OKLCH:

| Band | Threshold | OKLCH | Meaning |
|------|-----------|-------|---------|
| A | < 30% | `oklch(0.62 0.13 145)` | Within international affordability ceiling |
| B | 30-40% | `oklch(0.78 0.16 95)` | Stretched |
| C | 40-50% | `oklch(0.66 0.18 50)` | Burdened |
| D | 50-70% | `oklch(0.52 0.20 25)` | Severely burdened |
| E | > 70% | `oklch(0.36 0.13 20)` | Beyond reach |
| X | no data | `oklch(0.88 0.005 260)` | Below publication threshold |

The 30% threshold is the standard housing-economics affordability benchmark (Center for Housing Policy, OECD), not a Luxembourg legal definition. The 50% and 70% thresholds match HUD-style "severe cost burden" categories.

The hue progression deliberately runs green to amber to red rather than a continuous diverging scale, because the affordability question is about *threshold crossings*, not deviation from a midpoint.

## Provenance signaling

Two visual states needed:

- **Measured** (34 communes): solid fill, full opacity (0.85)
- **Estimated** (23 communes): solid fill at lower opacity (0.72) + diagonal hatch overlay
- **No data** (43 communes): light grey fill, no hatching

The hatching in the prototype is implemented via SVG pattern fill applied as an overlay layer. In MapLibre GL, this becomes a separate `fill-pattern` layer or a stroke-based pattern. Verify it survives the port.

## Known gaps and future work (not for the first ship)

These are documented so they don't get reinvented:

1. **Quartier-level zoom for Luxembourg City**: The Observatoire publishes data for 24 administrative quartiers. Bonnevoie ≠ Belair. Single biggest enhancement.
2. **Time slider**: Observatoire data goes back to 2009. Showing the affordability collapse over time is the strongest persuasive story.
3. **Buy mode**: Same map, price-to-income ratio, mortgage calculator (LTV slider, rate input)
4. **Cross-border commute time overlay**: From geoportail.lu via Luxtram / CFL APIs. The "cheap rural" trade-off is meaningless without showing the 90-minute commute.
5. **Quartier-level income**: STATEC publishes commune-level *average* salary (not median, suppressed at commune level for privacy). Could overlay as a comparison layer rather than a denominator.

## File manifest in this handoff

- `PROMPT.md`: the prompt to paste into Claude Code (or use as the first user message)
- `CONTEXT.md`: this file
- `prototype.html`: the working MVP, single file, drop in a browser to see what's expected
- `data/communes_v2.geojson`: pre-built dataset (193KB), ready to use as `static/data/communes.geojson`
- `data/source-urls.json`: machine-readable list of upstream data URLs for the build pipeline

## Coding conventions I prefer

- Comma-spliced explanations in comments where they fit
- No emojis in code or commit messages
- Commit messages: imperative mood, lowercase first word, no period at end ("port map to maplibre", not "Ported the map to MapLibre.")
- Functions over classes where possible
- Early returns over nested conditionals
- Don't write tests for trivial wiring code; write them for the data pipeline and the rent-yield estimation, those are the parts that can silently go wrong
