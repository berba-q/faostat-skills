---
name: faostat-country-profile
description: Use when the user asks for a food security profile, country agricultural overview, country hunger or nutrition assessment, or food system summary for a specific country. Keywords: country profile, food security, undernourishment, production, trade, nutrition, calorie supply, dietary energy. Do NOT use for import dependence and supply chain risk → `faostat-trade`. Do NOT use for a global commodity briefing → `faostat-commodity`. Do NOT use for side-by-side country comparison → `faostat-compare`.
---

# Country Food Security Profile

Generate a comprehensive food security and agricultural profile for a given country using FAOSTAT data.

## Prerequisites

Verify that the following FAOSTAT MCP tools are available before proceeding:
- `faostat_search_codes`
- `faostat_get_data`
- `faostat_get_rankings`
- `faostat_list_domains`

If any tool is missing, inform the user: "This skill requires the FAOSTAT MCP server to be connected. Please ensure it is running and try again."

## Domain Reference

| Domain | Code | Used for |
|--------|------|----------|
| Crops & Livestock Products | **QCL** | Production quantities |
| Food Security | **FS** | Undernourishment and food-insecurity indicators |
| Food Balance Sheets (2010-) | **FBS** | Dietary energy, protein, fat supply |
| Crops & Livestock Trade (aggregate) | **TCL** | Country-level import/export totals |
| Detailed Trade Matrix | **TM** | Bilateral partner breakdown (use only when partner data is needed) |

## Element Code Reference

- **Production quantity (QCL)**: filter `2510`, display `5510`
- **Import quantity (TCL)**: filter `2610`; **Export quantity (TCL)**: filter `2910`
- **Import value (TCL, USD 1000)**: filter `2612`; **Export value (TCL, USD 1000)**: filter `2912`
- **FBS Food supply (kcal/capita/day)**: filter `664`
- **FBS Protein (g/capita/day)**: filter `674`
- **FBS Fat (g/capita/day)**: filter `684`
- **FBS Food supply (kg/cap/yr)**: filter `645`
- **FS Prevalence of undernourishment**: filter `210041`; **FS Number undernourished**: filter `210011`

For `faostat_get_data` use FILTER codes. For `faostat_get_rankings` use DISPLAY codes.

## Workflow

### Step 1: Accept Country Input

Identify the country name from the user's message or ask for it if not provided.

### Step 2: Resolve Country Code

Call `faostat_search_codes(domain_code='QCL', dimension_id='area', query='<country_name>')`.

**CRITICAL:** If the response contains `requires_confirmation: true`, present ALL matching options to the user and ask them to select the correct one. Do NOT proceed until the user confirms. This commonly happens with names like "China" (mainland vs. aggregate), "Sudan" (former vs. current), or "Korea".

**China-specific rule (user preference, Apr 2026).** If the user says "China" with no further qualifier, default to composite `China` (area code 351) — the roll-up of `China, mainland` (41) + Hong Kong SAR + Macao SAR + Taiwan. Do NOT substitute 41 unless the user specifies `China, mainland` explicitly. Mention this in the output so the reader knows which definition was used, and note that FAOSTAT's own publications default to 41, so the numbers here are marginally larger than the FAO data-portal default.

Store the confirmed `area` code for all subsequent queries.

### Step 3: Pull Production Data (Top Crops)

Call `faostat_get_data` with:
- `domain_code='QCL'`
- `area='<resolved_area_code>'`
- `element='2510'` (Production — this is the FILTER code)
- `year='<most_recent_year>'` (try the current year minus 2; if no data, try minus 3)
- `response_format='compact'`
- `limit=20`
- `show_unit=True`

Sort the results by value descending and identify the **top 5 crops by production volume**.

### Step 4: Pull Food Security Indicators

Call `faostat_get_data` with specific element filters so the payload stays small:
- `domain_code='FS'`
- `area='<resolved_area_code>'`
- `element='210041,210011'` (prevalence of undernourishment, number undernourished). Add other FS element codes if needed — resolve via `faostat_search_codes(domain_code='FS', dimension_id='element', query='...')`.
- `year='2014,2015,2016,2017,2018,2019,2020,2021,2022,2023'` (use explicit comma list — colon ranges like `'2014:2023'` have returned empty in practice)
- `response_format='compact'`

Look for these key indicators:
- Prevalence of undernourishment (%)
- Number of undernourished people
- Average dietary energy supply adequacy (%)
- Prevalence of severe food insecurity (%)

If data is sparse, note which indicators are unavailable.

### Step 5: Pull Food Balance Sheet Data

Call `faostat_get_data` with:
- `domain_code='FBS'`
- `area='<resolved_area_code>'`
- `element='664,674,684,645'` (kcal/cap/day, protein g/cap/day, fat g/cap/day, food kg/cap/yr)
- `year='<latest 2-3 years available — FBS typically lags QCL by 1 year>'`
- `item='2901'` (Grand Total for headline metrics); for item-specific breakdown (e.g., wheat contribution) resolve via `faostat_search_codes`
- `response_format='compact'`

Without an element filter this call returns 100+ indicators per year and blows the context. Always specify elements.

Extract:
- Dietary energy supply (kcal/capita/day)
- Protein supply (g/capita/day)
- Fat supply (g/capita/day)

### Step 6: Pull Trade Summary (TCL, not TM)

Use **TCL** (country-level aggregate trade) for total imports and exports:
```
faostat_get_data(
  domain_code='TCL',
  area='<resolved_area_code>',
  element='2610,2910,2612,2912',    # import qty, export qty, import value, export value
  year='<latest 3 years>',
  response_format='compact',
  limit=500
)
```

Do NOT pull this from TM — TM is bilateral (partner × reporter), so summing TM rows to get national totals is fragile (mirror-data gaps, re-exports). Only drop into TM if the user specifically asks about trading partners for a given commodity.

Determine:
- Total import value vs. total export value (latest year)
- Whether the country is a net food importer or exporter
- Key imported and exported commodities (from the top-value items in the TCL pull, sorted client-side)

### Step 7: Synthesize the Report

Compose a narrative report with the following sections:

**Title:** Food Security Profile: [Country Name]

1. **Production Capacity** — Top 5 crops, total agricultural output volume, any notable specializations.

2. **Food Access & Security** — Undernourishment prevalence, food insecurity rates, trends over available years (improving/worsening/stable).

3. **Nutritional Supply** — Calorie and protein supply per capita, how these compare to global benchmarks (2,100 kcal/day minimum; 2,500 kcal/day adequate).

4. **Trade Position** — Net importer or exporter, main trade partners if available, key agricultural imports and exports.

5. **Key Risks & Trends** — Synthesize insights: dependency on imports, narrow crop base, declining yields, improving food security, etc.

Include trend indicators where multi-year data is available:
- Rising trend
- Declining trend
- Stable

End the report with:

> Source: FAOSTAT (FAO), accessed [current date]. Data may reflect reporting lags of 1-3 years.

## Error Handling

- If a domain returns no data for the country, note it in the report and continue with available data.
- If the country code cannot be resolved, ask the user to try an alternative name or spelling.
- If rate limits are hit, wait briefly and retry. Inform the user if delays are expected.
- **`faostat_get_rankings` returns HTTP 500.** Fall back to `faostat_get_data` with a country list and sort client-side. Note the fallback in the methodology line.
- **Empty result with colon year range.** If `year='2014:2023'` returns empty, retry with explicit comma-list `year='2014,2015,2016,2017,2018,2019,2020,2021,2022,2023'`.
- **FBS data lag.** FBS typically lags QCL by 1 year. If the latest FBS year is not what the user expected, state it explicitly.

## Output Format

Deliver the report as a well-structured narrative with clear section headings. Use bullet points for data summaries and tables where comparisons aid readability. Keep the tone analytical and factual.

## Related Skills

| If you need… | Use |
|---|---|
| Import risk + supply chain analysis | `/faostat-trade` |
| Emissions + land use context | `/faostat-climate` |
| Recent changes + anomalies | `/faostat-trends` |
| Side-by-side country comparison | `/faostat-compare` |
