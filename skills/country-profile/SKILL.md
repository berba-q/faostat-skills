---
name: faostat-country-profile
description: Use when the user asks for a food security profile, country agricultural overview, country hunger or nutrition assessment, or food system summary for a specific country. Keywords: country profile, food security, undernourishment, production, trade, nutrition, calorie supply, dietary energy
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

## Workflow

### Step 1: Accept Country Input

Identify the country name from the user's message or ask for it if not provided.

### Step 2: Resolve Country Code

Call `faostat_search_codes(domain_code='QCL', dimension_id='area', query='<country_name>')`.

**CRITICAL:** If the response contains `requires_confirmation: true`, present ALL matching options to the user and ask them to select the correct one. Do NOT proceed until the user confirms. This commonly happens with names like "China" (mainland vs. aggregate), "Sudan" (former vs. current), or "Korea".

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

Call `faostat_get_data` with:
- `domain_code='FS'`
- `area='<resolved_area_code>'`
- `response_format='objects'`
- `limit=50`

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
- `response_format='compact'`
- `limit=50`

Extract:
- Dietary energy supply (kcal/capita/day)
- Protein supply (g/capita/day)
- Fat supply (g/capita/day)

### Step 6: Pull Trade Summary

Call `faostat_get_data` with:
- `domain_code='TM'`
- `area='<resolved_area_code>'`
- `response_format='compact'`
- `limit=30`

Determine:
- Total import value vs. total export value
- Whether the country is a net food importer or exporter
- Key imported and exported commodities

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

## Output Format

Deliver the report as a well-structured narrative with clear section headings. Use bullet points for data summaries and tables where comparisons aid readability. Keep the tone analytical and factual.
