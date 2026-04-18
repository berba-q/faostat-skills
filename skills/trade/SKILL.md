---
name: faostat-trade
description: Use when the user asks about food import dependence, self-sufficiency ratio, supply chain risk, trade partners, trade concentration, food security vulnerability, import reliance, export dependence, or whether a country can feed itself for a specific commodity. Keywords: import, export, trade, self-sufficiency, dependency, supply chain, food security, trade partners, concentration risk, import reliance, vulnerability. Do NOT use for a comprehensive country food security profile → `faostat-country-profile`. Do NOT use for a global commodity briefing → `faostat-commodity`. Do NOT use for side-by-side country comparison → `faostat-compare`.
---

# Trade Dependency Analyzer

Assess a country's import dependence for critical food commodities, calculate self-sufficiency ratios, identify supply chain concentration risks, and track dependency trends over time.

## Prerequisites

Before starting, verify that the FAOSTAT MCP tools are available: `faostat_search_codes`, `faostat_get_data`. If they are not available, inform the user they need the FAOSTAT MCP server configured and stop.

## Domain Reference (CRITICAL -- use exactly these codes)

| Domain | Code | Content | When to use |
|--------|------|---------|-------------|
| Crops & Livestock Products | **QCL** | Domestic production (area, yield, production volume) | Always for production |
| Crops & Livestock Trade (aggregate) | **TCL** | Country-level totals for import/export quantity and value | **Use for total imports / total exports of a country** |
| Detailed Trade Matrix | **TM** | Bilateral trade by partner country | Use ONLY for "who are the top partners" breakdown |
| Food Balance Sheets | **FBS** | Supply utilization including feed, seed, stock change | Use for food-specific SSR (element 645 Food, 5131 Feed, etc.) |

**CRITICAL — TM vs TCL.** TM returns one row per (reporter × partner × element × year). Summing TM rows to get national imports/exports is fragile (mirror-data gaps, re-exports). **Pull aggregate import/export volumes from TCL.** Only drop into TM when you need the partner breakdown.

## Element Code Reference (CRITICAL)

- **Production quantity (QCL)**: filter code `2510`, display code `5510`
- **Import quantity (TCL)**: filter code `2610`
- **Export quantity (TCL)**: filter code `2910`
- **Import value (TCL, USD 1000)**: filter code `2612`
- **Export value (TCL, USD 1000)**: filter code `2912`
- For `faostat_get_data` queries, use FILTER codes in the `element` parameter (e.g., `element='2510'`)
- For `faostat_get_rankings` queries, use DISPLAY codes in the `element_code` parameter (e.g., `element_code='5510'`)

## Area-Code Pitfall: China

FAOSTAT has both `China` (area code 351, aggregate including Hong Kong SAR, Macao SAR, and Taiwan Province of China) and `China, mainland` (area code 41, mainland only). **Default to composite `China` (351)** for any single-country analysis (user preference, Apr 2026). Do NOT substitute `China, mainland` (41) unless the user asks for 41 explicitly. In trade data this means the "China" total will include trade through HK / Macao / Taiwan — flag this to the user and note that FAOSTAT's own publications default to 41, so the numbers here are larger than the FAO data-portal default.

## Workflow

### Step 1: Accept inputs

Ask the user for:
- **Country** (required) -- e.g., "Egypt", "Japan", "Nigeria"
- **Commodity** (required) -- e.g., "wheat", "rice", "soybeans", "palm oil"

If the user provides both in their initial message, proceed directly. If either is missing, ask.

### Step 2: Resolve codes

1. Resolve the country to an area code:
   `faostat_search_codes(domain_code='QCL', dimension_id='area', query='<country>')`
   - If `requires_confirmation` is true, present the matching options and ask the user to choose. Do NOT proceed until confirmed.
   - If the user asked about "China" generically, default to composite `China` (351) and offer `China, mainland` (41) as an opt-in. Do not proceed with 41 unless the user asks for 41 explicitly.

2. Resolve the commodity to an item code in the production domain:
   `faostat_search_codes(domain_code='QCL', dimension_id='item', query='<commodity>')`
   - Handle `requires_confirmation` the same way.

3. Resolve the commodity in the aggregate-trade domain (item codes may differ):
   `faostat_search_codes(domain_code='TCL', dimension_id='item', query='<commodity>')`
   - Handle `requires_confirmation`.

4. If you will also do a partner breakdown in Step 6, resolve the item in TM:
   `faostat_search_codes(domain_code='TM', dimension_id='item', query='<commodity>')`

### Step 3: Pull domestic production

Query the QCL domain for the country's domestic production of this commodity:
```
faostat_get_data(
  domain_code='QCL',
  area='<area_code>',
  item='<item_code_qcl>',
  element='2510',
  year='2014,2015,2016,2017,2018,2019,2020,2021,2022,2023',
  response_format='compact'
)
```
Extract production quantities for the most recent 10-15 years to establish a trend.

> **Year-range syntax.** Use an explicit comma-separated year list. Colon ranges like `'2014:2023'` have returned empty results in practice — avoid them.

### Step 4: Pull aggregate trade volumes (TCL, not TM)

Pull import and export quantities for this country-commodity pair from **TCL** (country-level aggregates):
```
faostat_get_data(
  domain_code='TCL',
  area='<area_code>',
  item='<item_code_tcl>',
  element='2610,2910',              # 2610 Import qty, 2910 Export qty
  year='2014,2015,...,2023',
  response_format='compact'
)
```

For USD trade values, add `2612` (Import value) and `2912` (Export value).

Extract, per year:
- **Total import quantity** (tonnes)
- **Total export quantity** (tonnes)
- **Import value** and **Export value** (USD 1000, if needed)

> Do NOT pull these from TM. TM gives partner-level rows that must be aggregated, and mirror-data gaps / re-exports distort the total. Use TM only in Step 6.

### Step 5: Calculate self-sufficiency ratio

For each year where data is available, calculate:

```
Self-Sufficiency Ratio (SSR) = Production / (Production + Imports - Exports)
```

This is a "net availability" proxy. For a stricter food-focused SSR that accounts for feed, seed, and stock change, pull from **FBS** instead (element 5511 Production vs 5301 Domestic Supply). If FBS is available for the country-commodity, prefer it and note the switch in the methodology section.

Interpretation:
- **SSR > 1.0** -- the country produces more than it consumes; net exporter
- **SSR = 1.0** -- perfectly self-sufficient (rare)
- **SSR 0.7-1.0** -- mostly self-sufficient, moderate import reliance
- **SSR 0.5-0.7** -- significant import dependence
- **SSR < 0.5** -- heavily import-dependent; vulnerable

Calculate SSR for the latest year and for 5 and 10 years ago (if data available) to show the trend.

### Step 6: Identify trading partners and concentration risk (TM)

Now — and only now — pull the partner breakdown from TM:
```
faostat_get_data(
  domain_code='TM',
  area='<area_code>',
  item='<item_code_tm>',
  element='5622,5922',              # Import qty, Export qty in TM element codes
  year='<latest available year>',
  response_format='compact',
  limit=500
)
```
Note: TM uses different element codes than TCL. If unsure, `faostat_search_codes(domain_code='TM', dimension_id='element', query='import')` will surface the right pair.

From the partner data, rank import partners by volume:
1. List the top 5 import source countries with their share of total imports (use the TCL total from Step 4 as the denominator — TM partner totals sometimes don't perfectly reconcile).
2. Calculate a concentration metric: what percentage of imports comes from the top 1, top 2, and top 3 suppliers?
3. Assess concentration risk:
   - **Top 1 supplier > 50%** -- HIGH concentration risk (single point of failure)
   - **Top 3 suppliers > 80%** -- MODERATE concentration risk
   - **No single supplier > 30%** -- LOW concentration risk (diversified)

If TM data is sparse for the latest year (common — TM reporting often lags TCL by 1 year), step back to the most recent year with partner data and note the year mismatch.

### Step 7: Trend analysis

Analyze the trajectory:
- Is the SSR **improving** (moving toward 1.0), **stable**, or **deteriorating** (moving away from 1.0)?
- Is import volume growing faster than domestic production?
- Are trading partners becoming more or less concentrated over time?

### Step 8: Present the dependency assessment

Structure the output as follows:

**1. Self-Sufficiency Summary**
- Current SSR with interpretation
- SSR 5 years ago and 10 years ago
- Trend direction (improving / stable / deteriorating)

**2. Domestic Production**
- Latest production volume with units
- Production trend (growing / shrinking / stagnant)

**3. Trade Position**
- Total imports (volume and value)
- Total exports (volume and value)
- Net trade position (net importer or net exporter)

**4. Supply Chain Risk**
- Top 5 import partners with share percentages
- Concentration risk rating (HIGH / MODERATE / LOW)
- Any single-supplier vulnerability

**5. Trend & Outlook**
- Direction of dependency over time
- Key risk factors (e.g., "Production is flat while imports grow 5% annually")
- One-line vulnerability narrative (e.g., "Egypt imports 55% of its wheat, with 40% coming from a single supplier -- Russia")

**6. Source Attribution**
"Source: FAOSTAT (FAO), accessed [current date]"

## Important Rules

- Always use `faostat_search_codes` before `faostat_get_data` to resolve codes. Never guess or hardcode domain-specific codes.
- When `requires_confirmation` is true in a search result, always present options to the user and wait for their choice.
- Use `response_format='compact'` for multi-year or multi-partner queries to keep response sizes manageable.
- For `faostat_get_data`, use FILTER element codes (e.g., '2510'). For `faostat_get_rankings`, use DISPLAY element codes (e.g., '5510').
- If production data returns zero or null for a country-commodity pair, note this explicitly -- it may mean the country does not produce this commodity at all (SSR = 0, fully import-dependent).
- Always include the source attribution line at the end of any output.

## Error Handling and Reliability Notes

- **`faostat_get_rankings` sometimes returns HTTP 500.** If the tool fails, reconstruct rankings by calling `faostat_get_data` for the relevant element/year across all reporting countries and sorting client-side. Document the fallback in the methodology section of the output.
- **China composite rule (user preference, Apr 2026).** Default to composite `China` (351) for single-country analysis. Offer `China, mainland` (41) as an opt-in. Flag the choice in output.
- **TM reporting lag.** TM partner data typically lags TCL aggregate data by ~1 year. If TM has no data for the latest year, drop to the most recent year available and state the mismatch.
- **Year range syntax.** Prefer explicit comma-separated year lists (`'2014,2015,...,2023'`). Colon ranges (`'2014:2023'`) have returned empty results in some MCP configurations.

## Related Skills

| If you need… | Use |
|---|---|
| Full country food security profile | `/faostat-country-profile` |
| Global commodity supply overview | `/faostat-commodity` |
| Trend ranking over time | `/faostat-trends` |
| Side-by-side country comparison | `/faostat-compare` |
