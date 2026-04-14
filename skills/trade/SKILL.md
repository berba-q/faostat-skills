---
name: faostat-trade
description: Use when the user asks about food import dependence, self-sufficiency ratio, supply chain risk, trade partners, trade concentration, food security vulnerability, import reliance, export dependence, or whether a country can feed itself for a specific commodity. Keywords: import, export, trade, self-sufficiency, dependency, supply chain, food security, trade partners, concentration risk, import reliance, vulnerability
---

# Trade Dependency Analyzer

Assess a country's import dependence for critical food commodities, calculate self-sufficiency ratios, identify supply chain concentration risks, and track dependency trends over time.

## Prerequisites

Before starting, verify that the FAOSTAT MCP tools are available: `faostat_search_codes`, `faostat_get_data`. If they are not available, inform the user they need the FAOSTAT MCP server configured and stop.

## Domain Reference (CRITICAL -- use exactly these codes)

| Domain | Code | Content |
|--------|------|---------|
| Crops & Livestock Products | **QCL** | Domestic production (area, yield, production volume) |
| Trade Matrix | **TM** | Bilateral trade -- imports and exports by partner country |

## Element Code Reference (CRITICAL)

- **Production quantity**: filter code `2510`, display code `5510`
- For `faostat_get_data` queries, use FILTER codes in the `element` parameter (e.g., `element='2510'`)
- For `faostat_get_rankings` queries, use DISPLAY codes in the `element_code` parameter (e.g., `element_code='5510'`)

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

2. Resolve the commodity to an item code in the production domain:
   `faostat_search_codes(domain_code='QCL', dimension_id='item', query='<commodity>')`
   - Handle `requires_confirmation` the same way.

3. Also resolve the commodity in the trade domain (item codes may differ):
   `faostat_search_codes(domain_code='TM', dimension_id='item', query='<commodity>')`
   - Handle `requires_confirmation`.

### Step 3: Pull domestic production

Query the QCL domain for the country's domestic production of this commodity:
```
faostat_get_data(
  domain_code='QCL',
  area='<area_code>',
  item='<item_code_qcl>',
  element='2510',
  response_format='compact'
)
```
Extract production quantities for the most recent 10-15 years to establish a trend.

### Step 4: Pull trade data

Query the TM domain for imports and exports of this commodity for the country:
```
faostat_get_data(
  domain_code='TM',
  area='<area_code>',
  item='<item_code_tm>',
  response_format='compact'
)
```
Extract:
- **Total import volume** (by year)
- **Total export volume** (by year)
- **Import values** (USD, if available)
- **Partner country breakdown** -- who supplies the imports, who receives the exports

### Step 5: Calculate self-sufficiency ratio

For each year where data is available, calculate:

```
Self-Sufficiency Ratio (SSR) = Production / (Production + Imports - Exports)
```

Interpretation:
- **SSR > 1.0** -- the country produces more than it consumes; net exporter
- **SSR = 1.0** -- perfectly self-sufficient (rare)
- **SSR 0.7-1.0** -- mostly self-sufficient, moderate import reliance
- **SSR 0.5-0.7** -- significant import dependence
- **SSR < 0.5** -- heavily import-dependent; vulnerable

Calculate SSR for the latest year and for 5 and 10 years ago (if data available) to show the trend.

### Step 6: Identify trading partners and concentration risk

From the trade data, rank import partners by volume:
1. List the top 5 import source countries with their share of total imports.
2. Calculate a concentration metric: what percentage of imports comes from the top 1, top 2, and top 3 suppliers?
3. Assess concentration risk:
   - **Top 1 supplier > 50%** -- HIGH concentration risk (single point of failure)
   - **Top 3 suppliers > 80%** -- MODERATE concentration risk
   - **No single supplier > 30%** -- LOW concentration risk (diversified)

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
