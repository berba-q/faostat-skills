---
name: faostat-commodity
description: Use when the user asks about a specific crop or commodity — global production, top producers, yield trends, trade flows, or a commodity briefing. Keywords: commodity, crop, wheat, rice, maize, coffee, cocoa, soybean, production rankings, top producers, yield, trade, global supply
---

# Commodity Deep Dive

Generate a comprehensive global briefing for a specific agricultural commodity using FAOSTAT data.

## Prerequisites

Verify that the following FAOSTAT MCP tools are available before proceeding:
- `faostat_search_codes`
- `faostat_get_data`
- `faostat_get_rankings`

If any tool is missing, inform the user: "This skill requires the FAOSTAT MCP server to be connected. Please ensure it is running and try again."

## Workflow

### Step 1: Identify the Commodity

Extract the commodity name from the user's message, or ask if not specified. Accept common names (e.g., "wheat", "coffee", "palm oil").

### Step 2: Resolve Commodity Code

Call `faostat_search_codes(domain_code='QCL', dimension_id='item', query='<commodity_name>')`.

**CRITICAL:** If the response contains `requires_confirmation: true`, present ALL matching options to the user and ask them to select the correct one. This is common for items like "rice" (paddy vs. milled), "oil" (multiple types), or "beans" (multiple varieties). Do NOT proceed until the user confirms.

Store the confirmed `item` code.

### Step 3: Pull Global Production Rankings

Call `faostat_get_rankings` with:
- `domain_code='QCL'`
- `element_code='5510'` (Production — NOTE: this is the DISPLAY code, which `faostat_get_rankings` requires, NOT the filter code '2510')
- `item_code='<resolved_item_code>'`
- `year='<most_recent_year>'` (try current year minus 2; if no data, try minus 3)
- `limit=10`
- `response_format='objects'`

Record the top 10 producers and their production volumes.

### Step 4: Pull Yield and Area Trends for Top Producers

For the **top 5 producers** from Step 3, pull multi-year data.

Call `faostat_get_data` for each metric:

**Production trends:**
- `domain_code='QCL'`
- `area='<top5_area_codes>'` (comma-separated)
- `item='<item_code>'`
- `element='2510'` (Production — FILTER code for `faostat_get_data`)
- `year='<10_year_range>'` (e.g., `'2014:2023'`)
- `response_format='compact'`
- `limit=100`
- `show_unit=True`

**Area harvested trends:**
- Same parameters but `element='2312'` (Area harvested — FILTER code)

**Yield trends:**
- Same parameters but `element='2413'` (Yield — FILTER code)

**IMPORTANT DISTINCTION:** `faostat_get_rankings` uses DISPLAY element codes (e.g., `'5510'`). `faostat_get_data` uses FILTER element codes (e.g., `'2510'`). These are different code systems — do not mix them.

### Step 5: Pull Global Trade Data

Call `faostat_get_data` with:
- `domain_code='TM'`
- `item='<item_code>'` (search for the item in the TM domain first if the QCL item code does not work)
- `response_format='compact'`
- `limit=50`

Extract:
- Top exporters and importers by value or quantity
- Total global trade volume if available
- Trade flow direction (which regions export, which import)

If the QCL item code does not return trade data, call `faostat_search_codes(domain_code='TM', dimension_id='item', query='<commodity_name>')` to find the correct TM item code.

### Step 6: Compose the Briefing

Structure the output as follows:

**Title:** Commodity Briefing: [Commodity Name]

1. **Global Production Overview**
   - Total global production (if available) and the year of data
   - Top 10 producers ranked by volume, with percentage share of global total
   - Concentration: how much the top 3 and top 5 producers control

2. **Yield Trajectories**
   - Yield trends for top 5 producers over the past decade
   - Which countries are improving yields fastest
   - Current yield levels and gaps between leaders and laggards
   - Area harvested trends — is growth coming from expansion or intensification?

3. **Trade Flows**
   - Major exporters and importers
   - Net trade position of top producers (do they consume domestically or export?)
   - Any notable trade dependencies

4. **Historical Context & Outlook**
   - How has production shifted over the past decade?
   - Emerging producers (countries with fastest growth)
   - Key risks: concentration risk, climate vulnerability, trade dependency
   - Brief note on the commodity's global significance (food staple, cash crop, animal feed, biofuel feedstock, etc.)

End with:

> Source: FAOSTAT (FAO), accessed [current date]. Production rankings and trade data may reflect reporting lags of 1-3 years.

## Error Handling

- If trade data is unavailable for the commodity, note this and complete the briefing with production data only.
- If yield data is missing for some countries, compute trends only for countries with sufficient data.
- If the most recent year returns no data, step back one year at a time (up to 3 attempts).

## Output Format

Lead with the production rankings table for immediate impact. Follow with narrative sections. Use tables for ranked data and inline numbers for trend descriptions. Keep the analysis concise but substantive — aim for a briefing that gives the reader a complete picture in under 2 minutes of reading.
