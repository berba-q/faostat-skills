---
name: faostat-climate
description: Use when the user asks about agricultural emissions, climate impact of farming, agrifood carbon footprint, greenhouse gases from agriculture, deforestation, forest carbon sinks, temperature change, fertilizer emissions, N2O, land use change, emissions intensity, or the climate-agriculture nexus. Keywords: emissions, climate, carbon, greenhouse gas, GHG, deforestation, forest, temperature, warming, N2O, fertilizer emissions, land use, agrifood, emissions intensity, carbon sink
---

# Agrifood Climate Analyzer

Analyze the climate-agriculture nexus using FAOSTAT emissions, temperature, land use, and agricultural inputs data. This skill has five sub-workflows. Detect the appropriate one from the user's question, or present the options and ask.

## Prerequisites

Before starting, verify that the FAOSTAT MCP tools are available: `faostat_search_codes`, `faostat_get_data`, `faostat_get_rankings`. If they are not available, inform the user they need the FAOSTAT MCP server configured and stop.

## Domain Reference (CRITICAL -- use exactly these codes)

| Domain | Code | Content |
|--------|------|---------|
| Emissions Totals | **GT** | Agrifood systems emissions -- broadest scope, full agrifood chain |
| Crop Emissions | **GCE** | Emissions from crops only (narrower than GT) |
| Forest Emissions/Removals | **GF** | Forest sinks, net forest conversion (deforestation proxy) |
| Emissions Intensities | **EI** | Emissions per unit of output |
| Emissions Indicators | **EM** | Shares, per capita, per value of agricultural production |
| Temperature Change | **ET** | Country-level warming trends |
| Land Use | **RL** | Agricultural and forest land use |
| Fertilizers (use & trade) | **RFN**, **RFM**, **RFB** | Nitrogen, manufactured, bulk fertilizers |
| Pesticides Use | **RP** | Pesticide application data |
| Pesticides Trade | **RT** | Pesticide import/export data |

## Sub-workflow Detection

Read the user's question and select the most appropriate sub-workflow:

- **Country emissions profile** -- questions about a single country's agrifood emissions footprint, climate impact, or warming trend. Use Sub-workflow A.
- **Emissions comparison** -- questions comparing emissions across countries or regions, "who emits the most," rankings. Use Sub-workflow B.
- **Crop emissions / efficiency** -- questions about emissions from specific crops, which countries produce most efficiently, emissions intensity. Use Sub-workflow C.
- **Deforestation / forest / land use** -- questions about forest loss, carbon sinks, agricultural expansion, land use change. Use Sub-workflow D.
- **Fertilizer-emissions link** -- questions about fertilizer use and emissions, N2O, pesticide trends, input intensity. Use Sub-workflow E.

If the question does not clearly match one sub-workflow, present the five options with a one-line description of each and ask the user to choose.

## Sub-workflow A: Country Emissions Profile

1. Ask for the country if not already specified.
2. Resolve the country name to an area code using `faostat_search_codes(domain_code='GT', dimension_id='area', query='<country>')`.
   - If `requires_confirmation` is true in the response, present the matching options and ask the user to choose. Do NOT proceed until the user confirms.
3. Pull agrifood systems emissions totals from the **GT** domain:
   `faostat_get_data(domain_code='GT', area='<area_code>', response_format='compact')`
   Focus on the most recent 10 years. Identify total agrifood emissions and breakdown by source category (farm gate, land use, pre/post production).
4. Pull emissions indicators from the **EM** domain:
   `faostat_get_data(domain_code='EM', area='<area_code>', response_format='compact')`
   Extract per capita emissions, share of national total, emissions per value of agricultural production.
5. Pull temperature change data from the **ET** domain:
   `faostat_get_data(domain_code='ET', area='<area_code>', response_format='compact')`
   Identify the warming trend over the available period.
6. Synthesize into a structured profile:
   - **Agrifood Emissions Overview** -- total emissions, trend (rising/falling/stable), breakdown by source
   - **Normalized Metrics** -- per capita, share of national emissions, per dollar of agricultural output
   - **Temperature Trend** -- warming trajectory for this country
   - **Key Findings** -- 2-3 headline insights connecting the data
7. Attribute: "Source: FAOSTAT (FAO), accessed [current date]"

## Sub-workflow B: Emissions Comparison

1. Ask for the countries or region to compare (minimum 2, maximum 10). Accept country names, region names, or a mix.
2. Resolve each entity to area codes using `faostat_search_codes(domain_code='GT', dimension_id='area', query='<name>')`.
   - Handle `requires_confirmation` for each entity separately. Do NOT proceed until all codes are confirmed.
3. Pull emissions totals from the **GT** domain for all entities:
   `faostat_get_data(domain_code='GT', area='<code1>,<code2>,...', response_format='compact')`
4. Pull emissions indicators from the **EM** domain for all entities:
   `faostat_get_data(domain_code='EM', area='<code1>,<code2>,...', response_format='compact')`
   Extract per capita and share metrics for normalization.
5. Present comparison:
   - **Absolute emissions** -- rank by total agrifood emissions (latest year)
   - **Per capita emissions** -- re-rank by per capita to show a different picture
   - **Per value of output** -- emissions efficiency ranking
   - **Trend comparison** -- who is reducing, who is increasing?
   - **Key insights** -- highlight surprising reversals or contrasts between absolute and normalized rankings
6. Attribute: "Source: FAOSTAT (FAO), accessed [current date]"

## Sub-workflow C: Crop Emissions Analysis

1. Ask for the crop and optionally a set of countries. If no countries specified, use global top producers.
2. Resolve the crop to an item code using `faostat_search_codes(domain_code='GCE', dimension_id='item', query='<crop>')`.
   - Handle `requires_confirmation` as always.
3. If countries were specified, resolve their area codes. If not, use `faostat_get_rankings` to identify top 10 producers for context.
4. Pull crop-specific emissions from the **GCE** domain:
   `faostat_get_data(domain_code='GCE', item='<item_code>', area='<codes>', response_format='compact')`
5. Pull emissions intensities from the **EI** domain:
   `faostat_get_data(domain_code='EI', item='<item_code>', area='<codes>', response_format='compact')`
6. Rank countries by emissions intensity (lowest = most efficient).
7. Present analysis:
   - **Total crop emissions** -- who emits the most growing this crop?
   - **Emissions intensity ranking** -- who produces most efficiently per unit of output?
   - **Efficiency trends** -- is intensity improving or worsening over time?
   - **Key insight** -- highlight the gap between the most and least efficient producers
8. Attribute: "Source: FAOSTAT (FAO), accessed [current date]"

## Sub-workflow D: Forest & Land Use

1. Ask for the country or region if not specified.
2. Resolve area codes using `faostat_search_codes(domain_code='GF', dimension_id='area', query='<name>')`.
   - Handle `requires_confirmation`.
3. Pull forest emissions and removals from the **GF** domain:
   `faostat_get_data(domain_code='GF', area='<area_code>', response_format='compact')`
   Look for: net forest conversion (deforestation proxy), forest land emissions, forest land removals (carbon sinks).
4. Pull land use data from the **RL** domain:
   `faostat_get_data(domain_code='RL', area='<area_code>', response_format='compact')`
   Look for: agricultural land area, forest area, changes over time.
5. Analyze the relationship:
   - **Forest carbon balance** -- are removals (sinks) offsetting emissions? What is the net?
   - **Net forest conversion** -- proxy for deforestation rate and trend
   - **Land use shift** -- is agricultural land expanding at the expense of forest?
   - **Timeline** -- when did the biggest changes occur?
6. Present findings:
   - **Forest Emissions & Sinks** -- net balance, trend
   - **Deforestation Proxy** -- net forest conversion figures and direction
   - **Land Use Dynamics** -- agricultural vs. forest area over time
   - **Key Finding** -- is agriculture driving deforestation here? How do sinks compare to emissions?
7. Attribute: "Source: FAOSTAT (FAO), accessed [current date]"

## Sub-workflow E: Inputs-Emissions Link

1. Ask for the country or set of countries if not specified.
2. Resolve area codes using `faostat_search_codes(domain_code='GT', dimension_id='area', query='<name>')`.
   - Handle `requires_confirmation`.
3. Pull fertilizer use data from the **RFN** domain (nitrogen fertilizers are the primary N2O driver):
   `faostat_get_data(domain_code='RFN', area='<area_code>', response_format='compact')`
4. Optionally pull from **RFM** (manufactured) and **RFB** (bulk) for a fuller picture.
5. Pull pesticide use from the **RP** domain:
   `faostat_get_data(domain_code='RP', area='<area_code>', response_format='compact')`
6. Pull agrifood emissions from the **GT** domain:
   `faostat_get_data(domain_code='GT', area='<area_code>', response_format='compact')`
   Focus on N2O emissions components if available.
7. Analyze the correlation:
   - **Fertilizer use trend** -- is nitrogen fertilizer use increasing or decreasing?
   - **Emissions trend** -- do N2O / total agrifood emissions track fertilizer use?
   - **Pesticide trend** -- increasing or decreasing? Any policy-driven shifts?
   - **Correlation assessment** -- does higher fertilizer use correspond to higher emissions in this country/set?
8. Present findings:
   - **Fertilizer Use** -- volumes, trends, nitrogen share
   - **Pesticide Use** -- volumes, trends
   - **Emissions Correlation** -- how closely do inputs track emissions?
   - **Policy Implications** -- what does this suggest for emissions reduction strategies?
9. Attribute: "Source: FAOSTAT (FAO), accessed [current date]"

## Important Rules

- Always use `faostat_search_codes` before `faostat_get_data` to resolve codes. Never guess domain-specific codes.
- When `requires_confirmation` is true in a search result, always present options to the user and wait for their choice.
- Use `response_format='compact'` when querying multiple entities or large time ranges.
- For rankings, use DISPLAY element codes (e.g., '5510' for production). For data filtering, use FILTER codes (e.g., '2510' for production).
- Always include the source attribution line at the end of any output.
