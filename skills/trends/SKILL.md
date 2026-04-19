---
name: faostat-trends
description: Use when the user wants to identify biggest changes, fastest-growing or declining agricultural productions, or anomalies in FAOSTAT data over a time window for a region or set of countries. Keywords — trends, growth, decline, anomaly, change, biggest movers, acceleration, deceleration, monitoring, shift, surge, drop, spike. Do NOT use for a global commodity briefing → `faostat-commodity`. Do NOT use for a country food security profile → `faostat-country-profile`. Do NOT use for side-by-side comparison → `faostat-compare`.
---

# Agricultural Trend Monitor

Identify the biggest changes and anomalies in agricultural production data over a specified time window and geography.

## Prerequisites

Before starting, confirm the FAOSTAT MCP tools are available by checking that tools `faostat_get_data`, `faostat_search_codes`, and `faostat_get_rankings` are accessible. If they are not, inform the user that this skill requires the FAOSTAT MCP server to be connected and stop.

## Workflow

### Step 1 — Gather Parameters

Ask the user for:
- **Region or countries** — one or more countries, a continent, or a region (e.g., "Africa", "Brazil and Argentina", "Southeast Asia")
- **Time window** — default to the last 5 years if not specified
- **Focus** (optional) — specific commodity groups to monitor, or leave broad for all major groups

If the user provides these in their initial message, proceed without re-asking.

### Step 2 — Resolve Area Codes

Use `faostat_search_codes` with `domain_code='QCL'` and `dimension_id='area'` to resolve each country or region name to its FAOSTAT area code.

**CRITICAL:** If `requires_confirmation` is `true` in the response (multiple matches), present the options to the user and ask them to choose before proceeding. Do NOT guess.

### Step 3 — Pull Production Data for Major Commodity Groups

Query the **QCL** (Crops and Livestock Products) domain using `faostat_get_data`. Pull production quantity data (element FILTER code resolved at runtime via `faostat_search_codes(domain_code='QCL', dimension_id='element', query='production')` → e.g. `'2510'`) across major commodity groups.

For broad monitoring, query across these key items:
- Cereals (wheat, rice, maize, barley, sorghum, millet)
- Oilcrops (soybeans, palm fruit, sunflower seed, rapeseed)
- Roots and tubers (cassava, potatoes, yams, sweet potatoes)
- Fruits (bananas, citrus, mangoes, avocados)
- Vegetables (tomatoes, onions)
- Livestock products (milk, meat — cattle, chicken, pig, sheep)

Use `faostat_search_codes` with `domain_code='QCL'` and `dimension_id='item'` to resolve each item name to its item code.

For each query, use `response_format='compact'` when pulling data for multiple entities to keep payloads efficient. Set `limit` appropriately to cover the full time window. Use explicit comma-separated year lists (e.g., `year='2019,2020,2021,2022,2023'`) — colon ranges like `'2019:2023'` have returned empty in practice.

**CRITICAL — FILTER vs DISPLAY.** Element codes come in two flavors:
- `faostat_get_data(..., element='<resolved_filter_code>')` uses the **FILTER** code for Production quantity (hint: `2510`).
- `faostat_get_rankings(..., element_code='<resolved_display_code>')` uses the **DISPLAY** code for Production quantity (hint: `5510`).
Do not invert these. Always resolve first: `faostat_search_codes(domain_code='QCL', dimension_id='element', query='production')` returns both codes for every element.

> Element codes above are verified hints. Resolve at runtime via `faostat_search_codes` before use.

**China composite rule (user preference, Apr 2026).** When building a regional aggregate or top-N ranking that includes China, default to composite `China` (area code 351) — the roll-up of mainland + HK SAR + Macao SAR + Taiwan. Do NOT substitute `China, mainland` (41) unless the user specifies 41 explicitly. Flag the choice in the output and note that FAOSTAT's own publications default to 41, so the numbers here are marginally larger than the FAO data-portal default.

### Step 4 — Calculate Period-over-Period Changes

For each country-commodity pair:
1. Identify the **baseline value** (first year or average of first 2 years in the window)
2. Identify the **latest value** (most recent year or average of last 2 years)
3. Calculate:
   - **Absolute change** = latest - baseline
   - **Percentage change** = ((latest - baseline) / baseline) * 100
   - **Annualized growth rate** = ((latest / baseline)^(1/years) - 1) * 100

Exclude any country-commodity pairs where baseline data is zero or missing.

### Step 5 — Rank by Magnitude

Sort all country-commodity pairs by:
- **Percentage change** (descending) for top growers
- **Percentage change** (ascending) for top decliners

Select:
- **Top 5 fastest-growing** productions (highest positive percentage change)
- **Top 5 largest declines** (most negative percentage change)

### Step 6 — Flag Anomalies

For each country-commodity time series:
1. Calculate the mean and standard deviation of annual values across the time window
2. Flag any year where the value deviates by more than 2 standard deviations from the mean
3. Note the direction (spike up or drop down) and the year

An anomaly could indicate a drought, bumper harvest, policy change, conflict, or data issue.

### Step 7 — Compile the Trend Report

Present the results in a structured format:

**Top 5 Growing Productions**
For each entry: country, commodity, baseline value, latest value, percentage change, annualized growth rate. Add a brief note on possible drivers if context is evident.

**Top 5 Declining Productions**
Same format as above. Flag any that may indicate food security concerns.

**Anomaly Flags**
For each anomaly: country, commodity, year, actual value vs. expected range, direction (spike/drop). Note if additional investigation is warranted.

**Trend Directions Summary**
A concise table showing all analyzed country-commodity pairs with trend direction indicators:
- Strong growth (>20% over period)
- Moderate growth (5-20%)
- Stable (-5% to +5%)
- Moderate decline (-5% to -20%)
- Sharp decline (>20% decline)

### Step 8 — Attribution

End the report with:

> Source: FAOSTAT (FAO), accessed [current date]. Domain: QCL (Crops and Livestock Products).

Replace `[current date]` with today's date.

### Step 9 — Offer Next Steps

Suggest to the user:
- "Would you like me to visualize any of these trends as charts?" (invokes the visualization skill)
- "Want a deeper dive into any specific commodity or country?" (invokes the commodity or country-profile skill)
- "Should I check the trade data for any of the anomalies?" (invokes the trade skill)

## Important Rules

**Element and item code resolution.** Never use a hardcoded numeric element or item code as the primary value in a `faostat_get_data` call. Always resolve at runtime: `faostat_search_codes(domain_code='<dom>', dimension_id='element', query='<metric name>')` for elements; `faostat_search_codes(domain_code='<dom>', dimension_id='item', query='<item name>')` for items. Numeric codes shown in reference tables and code examples are verified hints — use them to validate the search result, not as the authoritative source. Domain letter-codes (QCL, TCL, GT, EM, FBS, FS…) are stable and may be used directly.

## Error Handling and Reliability Notes

- **`faostat_get_rankings` sometimes returns HTTP 500.** If you were planning to use it to pre-rank top producers before pulling time series, fall back to `faostat_get_data` with a country list and sort client-side. Document the fallback in the output.
- **FILTER vs DISPLAY codes.** See Step 3 — the two forms are not interchangeable.
- **Colon year ranges return empty.** Use comma-separated year lists.
- **Zero baseline excluded.** In Step 4 exclude any country-commodity pairs where the baseline is zero or missing — dividing by zero produces infinite growth rates that dominate the rankings.

## Related Skills

| If you need… | Use |
|---|---|
| Commodity deep dive | `/faostat-commodity` |
| Country food security profile | `/faostat-country-profile` |
| Side-by-side comparison | `/faostat-compare` |
| Import dependency | `/faostat-trade` |
| Visualize results as charts | `/faostat-viz` |
