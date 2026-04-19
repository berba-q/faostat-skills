---
name: faostat-map
description: Use when the user wants a world or regional choropleth map of a FAOSTAT metric — production, yield, trade flow, emissions, temperature change, fertilizer use, undernourishment, or any other country-level indicator. Use when the user asks for "a map of X", "where is Y grown/produced/emitted", "show global distribution of Z", or for a choropleth / heat-map style visualization of FAOSTAT data. Keywords — map, choropleth, world map, global distribution, country map, geographic, geospatial, heatmap, where, by country
---

# FAOSTAT Choropleth Map

Render a country-level choropleth map of any FAOSTAT metric. Produces an interactive HTML map by default; can optionally export a static PNG for embedding in reports.

This skill is a visual primitive. It is composed on by `faostat-analytical-brief`, `faostat-infographic`, and `faostat-story` whenever they need a geographic view.

## Prerequisites

Before starting, confirm the FAOSTAT MCP tools are reachable by checking that `faostat_get_data`, `faostat_search_codes`, `faostat_list_domains`, and `faostat_ping` are available. If they are not, tell the user this skill requires the FAOSTAT MCP server and stop.

Python packages required in the sandbox: `plotly`, `pandas`. For PNG export only, also install `kaleido` (~150MB). Install on demand with `pip install plotly pandas --break-system-packages`, and `pip install kaleido --break-system-packages` only when PNG is requested.

## Metric / Domain reference

> Element codes below are verified hints. Resolve at runtime via `faostat_search_codes` before use.

| Metric | Domain | Element (FILTER) | Natural scale | Color scale |
|---|---|---|---|---|
| Crop / livestock production quantity | QCL | 2510 | sequential | viridis |
| Crop yield | QCL | 2413 | sequential | YlGn |
| Area harvested | QCL | 2312 | sequential | YlGnBu |
| Import value (USD 1000) | TCL | 2612 | sequential | PuBu |
| Export value (USD 1000) | TCL | 2912 | sequential | PuBu |
| Import quantity | TCL | 2610 | sequential | PuBu |
| Export quantity | TCL | 2910 | sequential | PuBu |
| Agrifood-system emissions | GT | 724313 | sequential | YlOrRd |
| Emissions per capita | EM | resolve via `faostat_search_codes(domain_code='EM', dimension_id='element', query='per capita')` — verified `7279` | sequential | YlOrRd |
| Mean surface-temperature change | ET | 7271 | diverging | RdBu_r |
| Prevalence of undernourishment (%) | FS | 210041 | sequential | YlOrRd |
| Fertilizer use per ha | RFN | 5157 | sequential | YlGn |
| Net forest conversion | GF | 6646 | diverging | RdBu |

For any metric not in this table, look up the element FILTER code with `faostat_search_codes(domain_code=<D>, dimension_id='element', query=<metric>)` and pick a scale based on whether the metric is a stock (sequential) or a change / signed quantity (diverging).

## Invariants (do not violate)

1. **FILTER vs DISPLAY codes.** `faostat_get_data` takes FILTER codes (e.g., `'2510'` for Production). Never pass DISPLAY codes (`'5510'`) to `get_data`.
2. **Year syntax.** Use explicit comma-separated year lists (`'2021,2022,2023'`). Colon ranges (`'2021:2023'`) return empty in practice.
3. **Element filter required.** Always pass an `element` parameter to `faostat_get_data`; unfiltered pulls blow up the payload.
4. **China disaggregation — map carve-out (locked Apr 2026).** Other FAOSTAT skills default to composite `China` (area 351); the map skill does **not**. Maps always disaggregate: keep `China, mainland` (41) on the CHN polygon and let Hong Kong SAR (96), Macao SAR (128) and Taiwan Province of China (214) render on their own polygons where FAOSTAT supplies values. Drop composite 351. Rationale: a choropleth needs one value per ISO3 polygon; using 351 would paint the combined value on CHN and leave HKG / MAC / TWN blank (or double-paint them). Flag the choice in the caption: "China shown as mainland (area 41); HKG / MAC / TWN shown separately where data exists."
5. **Drop composite and region rows before plotting.** FAOSTAT returns region rows (World, Africa, Americas, Europe, Asia, Oceania, EU27, Low-income food-deficit countries, etc.) alongside country rows. These have no ISO3 code and must be excluded before rendering.
6. **TCL for national trade aggregates, TM only for partner breakdowns.** This skill maps country totals, so trade maps always pull from TCL. Never sum TM rows to build a country total.
7. **Element and item code resolution.** Never use a hardcoded numeric element or item code as the primary value in a `faostat_get_data` call. Always resolve at runtime: `faostat_search_codes(domain_code='<dom>', dimension_id='element', query='<metric name>')` for elements; `faostat_search_codes(domain_code='<dom>', dimension_id='item', query='<item name>')` for items. Numeric codes shown in reference tables and code examples are verified hints — use them to validate the search result, not as the authoritative source. Domain letter-codes (QCL, TCL, GT, EM, FBS, FS…) are stable and may be used directly.

## Workflow

### Step 1 — Clarify the map request

Confirm or infer from the user's message:
- **Metric** — production, yield, emissions, temperature change, etc. Map to a FILTER element code and domain using the table above.
- **Item** — commodity, emissions source, or "total" (some metrics, like temperature change or undernourishment, have no item dimension — skip this step for those).
- **Year** — a single year for a stock map, or two years for a change/delta map. Default to the most recent year with data (typically 2 years behind present).
- **Geography** — world (default) or a named region. v1 supports world only; for regional focus, tell the user regional framing is coming in v2 and render the world map.

If any of metric / item / year is ambiguous and the user has not specified it, ask before pulling data.

### Step 2 — Resolve codes

- `faostat_search_codes(domain_code=<D>, dimension_id='item', query=<commodity>)` to resolve the item code. If `requires_confirmation` is true, present matches and ask the user to choose.
- `faostat_search_codes(domain_code=<D>, dimension_id='element', query=<metric>)` to confirm the FILTER element code if not in the reference table above.

### Step 3 — Pull the country-level data

Call `faostat_get_data` with **all reporting areas** (omit the `area` parameter, or pass the full list for the domain). Required parameters:
- `domain_code=<D>`
- `element=<FILTER_code>` (required)
- `item=<item_code>` (if the domain has an item dimension)
- `year=<comma-separated year list>`
- `response_format='compact'`
- `limit=400` (enough for ~250 reporting areas × a couple of years)
- `show_unit=True`

For a **change map**, pull both endpoint years in a single call (e.g., `year='2013,2023'`). For a **stock map**, pull a single year.

If `faostat_get_data` returns fewer rows than expected, first check that the `element` parameter used is the FILTER code (see Invariant 1), then retry with the explicit comma-separated year list (Invariant 2).

### Step 4 — Clean and join ISO3

Load the result into pandas. Required cleaning:

1. **Drop composite and region rows.** Remove any row whose `area` is a region or composite. Use `faostat_get_codes(domain_code=<D>, dimension_id='area')` to get the authoritative list of area codes and their `ISO3` attribute. Any area without an ISO3 (or with a blank one) is a region/composite and must be dropped. This covers World, continents, EU27, LIFDC, the `China` composite (area 351), etc.

2. **Keep only `China, mainland` for China.** After the ISO3-join step, if both `China` (351) and `China, mainland` (41) are still in the frame, drop 351. (Usually 351 has no ISO3 and is already dropped, but some endpoints leak it.)

3. **Join ISO3 onto each row.** The `faostat_get_codes` response carries an `ISO3` field per area code. Use it as the join key into Plotly's `locations` argument with `locationmode='ISO-3'`.

4. **Log unmatched rows.** Any country row still missing an ISO3 after the join must be listed, not silently dropped. See Step 6 for handling.

### Step 5 — Classify values and choose colors

Pick a classification from the data:
- **Quantile bins (default), 5 classes.** Robust to long-tailed distributions common in FAOSTAT (one or two countries often dominate).
- **Equal-interval** only when the distribution is roughly uniform.
- **Diverging** for change metrics centred on zero (Δ production, temperature change, net forest conversion). Set `color_continuous_midpoint=0` and use an RdBu-family scale.

Default color choices are in the metric reference table. Grey (`#cccccc`) for missing data.

For change maps, compute the delta client-side (`end_value - start_value`, or `(end - start) / start * 100` for percent change) and map that derived column.

### Step 6 — Render the map

Use Plotly Express for a quick, reliable render:

```python
import plotly.express as px
fig = px.choropleth(
    df,
    locations='ISO3',
    locationmode='ISO-3',
    color='value',
    color_continuous_scale='viridis',   # pick per metric
    projection='robinson',              # default
    hover_name='area',
    hover_data={'ISO3': False, 'value': ':,.0f', 'unit': True},
    title='<metric> by country, <year> (Source: FAOSTAT)',
)
fig.update_layout(
    geo=dict(showframe=False, showcoastlines=True, coastlinecolor='#888',
             landcolor='#eaeaea', showocean=False),
    coloraxis_colorbar=dict(title='<unit>'),
    margin=dict(l=0, r=0, t=60, b=30),
)
```

For a change map, add `color_continuous_midpoint=0` and use `color_continuous_scale='RdBu_r'`.

Other notes:
- Default projection is **Robinson**. For polar-focused metrics, use `natural earth`.
- Set `fig.update_traces(marker_line_color='white', marker_line_width=0.4)` for cleaner borders.
- If the user asks for a regional inset, re-render with `fig.update_geos(scope='africa')` (or `asia`, `europe`, `americas`) as a second figure — don't replace the world map.

### Step 7 — Handle missing ISO3 matches (do not silently drop)

After the join in Step 4, if any country-level rows have no ISO3 match, do **all three** of the following:

1. **Render the map anyway**, with the unmatched countries shown as grey (missing data).
2. **List the unmatched countries in the caption** under the map, flagged clearly (e.g., "Not mapped: Kosovo, Western Sahara").
3. **Ask the user how to resolve each unmatched country** before finalizing. Offer three concrete options per country:
   - (a) **render as grey with a footnote** — the default if the user declines to choose,
   - (b) **assign an ISO3 manually** — user provides the 3-letter code; re-render,
   - (c) **exclude entirely** — drop from the map and the caption footnote.

Do NOT attempt phonetic or fuzzy matching to guess an ISO3. Do NOT silently drop unmatched rows. The user must see the gap and decide.

### Step 8 — Save outputs and describe

Save the interactive HTML with `fig.write_html(path, include_plotlyjs='cdn')`. Use an output path under the session working directory with a descriptive filename: `map-<metric>-<item>-<year>.html`.

**PNG export is opt-in.** Only produce a PNG when the caller (the user, or a composing skill like analytical-brief/infographic) explicitly asks for it. PNG export uses kaleido: `fig.write_image(path, width=1600, height=900, scale=2)`. If kaleido isn't installed, install it on demand with `pip install kaleido --break-system-packages` and retry once.

After saving, describe the map to the user: the top-5 countries by value, the geographic pattern (e.g., "concentrated in South and Southeast Asia"), and any unmatched countries surfaced in Step 7. Include a one-line source citation:

> Source: FAOSTAT (FAO), accessed <current date>. Domain: <D>, element <FILTER_code>, year <Y>.

## Error Handling

- **Empty payload.** First check FILTER vs DISPLAY (Invariant 1), then check year syntax (Invariant 2), then check the element exists in the domain.
- **`faostat_get_rankings` HTTP 500.** This skill doesn't use rankings — it pulls all countries via `faostat_get_data` and filters client-side, which is robust to the rankings-endpoint flakiness. Don't fall back to rankings even for "top-N overlay" map variants.
- **Sparse year.** If the requested year has <50 reporting countries, warn the user and offer to re-pull the previous year.
- **Region rows present.** If the rendered map shows a value on the "World" or "EU27" entity, Step 4 cleaning was incomplete. Re-run with ISO3 join as the drop criterion.
- **Legend dominated by one country.** If a single country's value is >40% of the total, note it in the caption and consider switching to a log scale (`fig.update_layout(coloraxis=dict(colorscale='viridis'))` with a log-transformed column) or to quantile bins if using equal-interval.
- **Kaleido install fails.** Fall back to HTML-only and tell the user PNG requires kaleido.

## Limitations (v1)

- World maps only; regional-focus modes (Africa, Asia, Europe, Americas) render as insets, not as primary view. Native regional framing is v2.
- SVG export is v2 (kaleido can do it, but not exposed yet).
- Bivariate choropleths (two metrics overlaid) are v2.
- Subnational (state/province) maps are out of scope — FAOSTAT is country-level.

## Related Skills

| If you need… | Use |
|---|---|
| Interactive chart (non-geographic) | `/faostat-viz` |
| Shareable one-pager with a map | `/faostat-infographic` |
| Full narrative article | `/faostat-story` |
| Policy report | `/faostat-analytical-brief` |
