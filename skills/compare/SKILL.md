---
name: faostat-compare
description: Use ONLY when the user explicitly asks to compare two or more specific named entities (countries, commodities, or regions) side by side. Keywords: compare, comparison, versus, vs, benchmark, countries, crops, production, yield, area harvested, trade, growth rate. Do NOT use for a global commodity briefing → `faostat-commodity`. Do NOT use for a country food security profile → `faostat-country-profile`. Do NOT use for trend ranking (fastest growing/declining) → `faostat-trends`. Do NOT use for import dependency or supply chain risk → `faostat-trade`.
---

# Comparative Agricultural Analysis

Produce a structured side-by-side comparison of countries, commodities, or both across agricultural metrics using FAOSTAT data.

## Prerequisites

Verify that the following FAOSTAT MCP tools are available before proceeding:
- `faostat_search_codes`
- `faostat_get_data`
- `faostat_get_rankings`

If any tool is missing, inform the user: "This skill requires the FAOSTAT MCP server to be connected. Please ensure it is running and try again."

## Workflow

### Step 1: Clarify Comparison Parameters

Determine from the user's message (or ask if unclear):

1. **What to compare:** Countries, commodities, or a cross-comparison (e.g., wheat production in Brazil vs. Argentina).
2. **Metric:** Production volume, yield, area harvested, trade value, or another indicator. Default to production if unspecified.
3. **Time range:** Specific years or a span. Default to the most recent 10 years if unspecified.
4. **Domain:** Infer the FAOSTAT domain:
   - Production / yield / area harvested: **QCL**
   - **Aggregate** trade quantities or values for a country-commodity pair: **TCL** (not TM)
   - Bilateral trade by partner country: **TM** (use only if the user specifically asks about partners)
   - Food balance sheets (supply, dietary energy): **FBS**
   - Food security indicators: **FS**
   - Agrifood emissions: **GT**; temperature change: **ET**; land use: **RL**

Map the metric to the correct FAOSTAT element FILTER codes:
- Production (QCL): `'2510'`
- Yield (QCL): `'2413'`
- Area harvested (QCL): `'2312'`
- Import quantity (TCL): `'2610'`; Export quantity (TCL): `'2910'`
- Import value (TCL, USD 1000): `'2612'`; Export value (TCL, USD 1000): `'2912'`

### Step 2: Resolve All Codes

For each entity (country or commodity), call `faostat_search_codes`:

**Countries:**
`faostat_search_codes(domain_code='<domain>', dimension_id='area', query='<country_name>')`

**Commodities:**
`faostat_search_codes(domain_code='<domain>', dimension_id='item', query='<commodity_name>')`

**CRITICAL:** If ANY search returns `requires_confirmation: true`, present the options to the user and wait for confirmation before proceeding. Resolve each entity independently — do not skip confirmation for any of them.

Store all confirmed codes.

### Step 3: Pull Data for All Entities

For each entity combination, call `faostat_get_data` with:
- `domain_code='<domain>'`
- `area='<area_code>'` (or comma-separated codes if comparing multiple countries for one item)
- `item='<item_code>'` (or comma-separated codes if comparing multiple items)
- `element='<element_filter_code>'`
- `year='2014,2015,2016,2017,2018,2019,2020,2021,2022,2023'` — use an **explicit comma-separated year list**. Colon ranges like `'2014:2023'` have returned empty in practice; avoid them.
- `response_format='compact'` (saves tokens for multi-entity queries)
- `limit=200` (increase limit for multi-year, multi-entity queries)
- `show_unit=True`

If comparing many entities, batch the calls to avoid excessively large responses. Prefer 2-4 entities per call.

**China composite rule (user preference, Apr 2026).** If any entity is "China" without qualification, use composite `China` (area code 351) — the roll-up of mainland + HK SAR + Macao SAR + Taiwan. Do NOT substitute `China, mainland` (41) unless the user asks for 41 explicitly. Note the choice in the methodology section and flag that FAOSTAT's own publications default to 41, so "China" values here are marginally larger than the FAO data-portal default.

### Step 4: Calculate Derived Metrics

From the retrieved data, compute:

- **Growth rate:** Percentage change from first year to last year in the range.
- **Average annual growth rate (CAGR):** `(end_value / start_value) ^ (1 / years) - 1`
- **Period average:** Mean value across all years.
- **Volatility (optional):** Standard deviation of year-over-year changes, if the user is interested in stability.

### Step 5: Present the Comparison

Structure the output as follows:

**Title:** Comparative Analysis: [Entity A] vs. [Entity B] [vs. Entity C...] — [Metric]

1. **Comparison Table** — Tabular summary with entities as columns and years (or summary stats) as rows. Include units.

2. **Growth Rates** — CAGR and total period change for each entity, clearly indicating which grew faster.

3. **Key Differences** — Narrative highlighting:
   - Largest producer/highest yield/biggest trader
   - Fastest and slowest growth
   - Any crossover points (where one entity overtook another)
   - Notable divergences or convergences in trends

4. **Context & Insights** — Brief interpretation:
   - Possible explanations for differences (climate, policy, investment)
   - Caveats about the data (reporting gaps, methodology changes)

End with:

> Source: FAOSTAT (FAO), accessed [current date].

## Error Handling

- If data is missing for some years for an entity, note the gap and compute metrics on available data only.
- If an entity has no data for the chosen domain/metric, inform the user and suggest an alternative metric or domain.
- Limit comparisons to 5 entities maximum. If the user requests more, suggest narrowing the scope or running multiple comparisons.
- **`faostat_get_rankings` sometimes returns HTTP 500.** If you need rankings for context (e.g., "show how Brazil ranks globally before comparing to Argentina"), fall back to `faostat_get_data` across reporting countries and sort client-side.
- **Colon year range returns empty.** If `year='2014:2023'` produces no rows, retry with `year='2014,2015,...,2023'`.

## Output Format

Use a clean tabular layout for numerical comparisons. Follow the table with a concise narrative analysis. Keep growth rate calculations transparent by showing the formula values used.

## Related Skills

| If you need… | Use |
|---|---|
| Global commodity briefing | `/faostat-commodity` |
| Country food security profile | `/faostat-country-profile` |
| Trend ranking across commodities | `/faostat-trends` |
| Import dependency / supply chain risk | `/faostat-trade` |
