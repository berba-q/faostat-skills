---
name: faostat-compare
description: Use when the user wants to compare countries, commodities, or agricultural metrics side by side. Keywords: compare, comparison, versus, vs, benchmark, ranking, countries, crops, production, yield, area harvested, trade, growth rate
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
   - Production/yield/area harvested: `QCL`
   - Trade value/quantity: `TM`
   - Food balance: `FBS`
   - Food security indicators: `FS`

Map the metric to the correct FAOSTAT element FILTER codes:
- Production: `'2510'`
- Yield: `'2413'`
- Area harvested: `'2312'`
- For trade, use appropriate TM element codes

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
- `year='<year_range>'` (e.g., `'2014:2023'` for a 10-year span)
- `response_format='compact'` (saves tokens for multi-entity queries)
- `limit=200` (increase limit for multi-year, multi-entity queries)
- `show_unit=True`

If comparing many entities, batch the calls to avoid excessively large responses. Prefer 2-4 entities per call.

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

## Output Format

Use a clean tabular layout for numerical comparisons. Follow the table with a concise narrative analysis. Keep growth rate calculations transparent by showing the formula values used.
