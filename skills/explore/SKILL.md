---
name: faostat-explore
description: Use when the user wants to discover what data is available in FAOSTAT, browse domains, understand what a domain contains, or is new to FAOSTAT and wants a guided tour. Use when the user mentions a topic and wants to know what FAOSTAT data covers it. Keywords: explore, discover, browse, what data, available, domains, catalog, tour, overview, what can I find, show me, help me understand, new to FAOSTAT, getting started
---

# FAOSTAT Explorer

Guided discovery of FAOSTAT's data catalog. Help users understand what data is available, browse domains, see sample data, and find the right starting point for their analysis.

## Prerequisites

Before starting, confirm the FAOSTAT MCP tools are available by checking that tools `faostat_list_groups`, `faostat_list_domains`, `faostat_get_dimensions`, `faostat_get_data`, and `faostat_get_metadata` are accessible. If they are not, inform the user that this skill requires the FAOSTAT MCP server to be connected and stop.

## Workflow

### Step 1 — Understand the User's Interest

Ask the user: "What topic are you interested in exploring?" Examples:
- A subject area: "fisheries", "fertilizers", "food prices", "livestock", "trade"
- A question: "What data does FAO have about rice production?"
- A broad theme: "climate and agriculture", "food security in Africa"
- Or just: "Show me what's available" (full catalog overview)

If the user provides their interest in their initial message, proceed without re-asking.

### Step 2 — Map the FAOSTAT Catalog

Call `faostat_list_groups(lang='en')` to retrieve all domain groups in FAOSTAT.

Present the groups to the user in a clear, organized list. FAOSTAT organizes data into groups such as:
- Production
- Trade
- Food Security
- Food Balances
- Prices
- Inputs
- Population
- Investment
- Macro-Statistics
- Emissions (Agriculture, Land Use, Forestry)
- Climate Change
- and more

If the user gave a specific topic, identify which group(s) are most relevant. If the user asked for a full overview, present all groups briefly.

### Step 3 — Drill Into Relevant Domain Groups

For each relevant group, call `faostat_list_domains(group_code, lang='en')` to list the specific domains within that group.

Present the domains with their codes and descriptions. For example, within the Production group:
- **QCL** — Crops and Livestock Products
- **QI** — Production Indices
- etc.

If the user's topic spans multiple groups, show domains from all relevant groups.

### Step 4 — Explore Domain Structure

For each domain the user finds interesting (or the 1-3 most relevant domains if the user gave a specific topic):

**A. Show Dimensions**

Call `faostat_get_dimensions(domain_code, lang='en')` to show what dimensions (filters) the domain supports.

Present the dimensions in plain language. For example:
- "This domain lets you filter by: **Area** (countries/regions), **Item** (commodities like wheat, rice, cattle), **Element** (metrics like Production, Area Harvested, Yield), and **Year**."

**B. Show Sample Data**

Call `faostat_get_data(domain_code, lang='en', limit=5, response_format='objects')` to pull a small sample of data.

Present the sample rows in a readable format (a table or formatted list). Explain what each column means:
- What does the "Element" represent?
- What are the units?
- What time period is covered?

**C. Explain the Domain**

Call `faostat_get_metadata(domain_code, lang='en')` to retrieve the domain's metadata description.

Summarize the metadata for the user in accessible language:
- What does this domain measure?
- What is the data source?
- How frequently is it updated?
- What geographic and temporal coverage does it have?
- Any important caveats or methodology notes?

### Step 5 — Suggest Analytical Paths

Based on what the user is exploring, suggest which skills would help them go deeper:

- **For production data:** "You could use `/faostat-commodity` for a deep dive into a specific crop, or `/faostat-country-profile` to see a country's full production picture."
- **For trade data:** "Try `/faostat-trade` to analyze import dependencies and trade flows."
- **For emissions/climate data:** "Use `/faostat-climate` to analyze emissions profiles, compare countries, or examine the inputs-emissions link."
- **For trends and changes:** "Use `/faostat-trends` to identify the biggest movers and anomalies."
- **For comparison questions:** "Try `/faostat-compare` for a structured side-by-side comparison."
- **For visual output:** "Use `/faostat-viz` to generate interactive charts from any data you find."
- **For narrative output:** "Use `/faostat-story` to build a data-driven article with embedded charts."

### Step 6 — Offer to Run a Query

Ask the user:
- "Would you like me to pull specific data from any of these domains?"
- "Want me to search for a particular country, commodity, or indicator?"
- "Should I run one of the suggested skills for a deeper analysis?"

If the user wants to query, use `faostat_search_codes` to resolve any entity names to codes before calling `faostat_get_data`.

**CRITICAL:** If `requires_confirmation` is `true` in a search response (multiple matches), present the options to the user and ask them to choose before proceeding. Do NOT guess.

**Important:** Element FILTER codes differ from DISPLAY codes. When calling `faostat_get_data`, use the filter code for the `element` parameter. When calling `faostat_get_rankings`, use the DISPLAY code. If unsure, use `faostat_search_codes` with `dimension_id='element'` to find the correct code.

### Step 7 — Attribution

When presenting any data, always include:

> Source: FAOSTAT (FAO), accessed [current date].

Replace `[current date]` with today's date. Include the domain code(s) referenced.
