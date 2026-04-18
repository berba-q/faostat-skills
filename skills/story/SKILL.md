---
name: faostat-story
description: Use when the user wants to build a data-driven narrative or article from FAOSTAT data for journalists, researchers, or general-audience communicators. Use when the user provides a research question, story angle, or topic they want to explore as an HTML data story with embedded interactive charts. Keywords — story, narrative, article, journalism, data story, investigation, angle, headline, write-up, explainer, data journalism, long-read. Do NOT use when the user asks for an "analytical brief", "policy brief", "FAOSTAT brief", or a PDF policymaker-facing document — route to `faostat-analytical-brief` instead. Do NOT use for academic/scientific papers or single-page infographics.
---

# Data Storyteller

Build data-driven narratives for journalists, researchers, and communicators using FAOSTAT data, with embedded interactive charts and properly sourced statistics.

## Prerequisites

Before starting, confirm the FAOSTAT MCP tools are available by checking that tools `faostat_get_data`, `faostat_search_codes`, `faostat_list_groups`, `faostat_list_domains`, and `faostat_get_rankings` are accessible. If they are not, inform the user that this skill requires the FAOSTAT MCP server to be connected and stop.

## Workflow

### Step 1 — Understand the Story Angle

Ask the user for their research question or story angle. Examples:
- "The global avocado boom"
- "Africa's fertilizer gap"
- "Wheat after the Ukraine crisis"
- "Who feeds the world's growing cities?"
- "The rise of quinoa"

If the user provides the angle in their initial message, proceed without re-asking.

Identify:
- **Subject** — what commodity, country, or theme?
- **Tension** — what's surprising, changing, or at stake?
- **Scope** — global, regional, or country-level?
- **Time frame** — recent years, historical arc, or a specific event window?

### Step 2 — Identify Relevant FAOSTAT Domains

Based on the story angle, determine which FAOSTAT domains contain relevant data. Use `faostat_list_groups` and `faostat_list_domains` to confirm domain availability.

Common domain mappings:
- Production stories: **QCL** (Crops and Livestock Products)
- Trade stories — **aggregate flows** (total imports/exports for a country-commodity): **TCL** (Crops and Livestock Trade, country-level)
- Trade stories — **partner / bilateral flows** (who ships to whom): **TM** (Detailed Trade Matrix)
- Food security stories: **FS** (Food Security), **FBS** (Food Balance Sheets)
- Climate/emissions stories: **GT** (Emissions Totals), **ET** (Temperature Change), **GF** (Forests)
- Input stories: **RFN/RFM/RFB** (Fertilizers), **RP** (Pesticides)
- Land use stories: **RL** (Land Use)
- Producer prices: **PP**

**Do not use TM for national totals.** TM returns one row per (reporter × partner × year). Summing them to get a country's total is fragile (mirror-data gaps, re-exports). Pull totals from TCL and drop into TM only when the narrative calls for a partner breakdown ("who buys Ukraine's wheat", "who supplies Egypt").

### Step 3 — Resolve Codes and Pull Data

For each entity referenced in the story:

1. Use `faostat_search_codes` with the appropriate `domain_code` and `dimension_id` to resolve names to codes.

   **CRITICAL:** If `requires_confirmation` is `true` in the response (multiple matches), present the options to the user and ask them to choose before proceeding. Do NOT guess.

2. Pull data using `faostat_get_data` with the resolved codes.

   **Important:** Element FILTER codes differ from DISPLAY codes. When calling `faostat_get_data`, use the filter code for the `element` parameter (e.g., filter `'2510'` for Production). When calling `faostat_get_rankings`, use the DISPLAY code (e.g., `'5510'` for Production).

   Always pass an `element` filter (payloads without one can be huge) and an explicit comma-separated `year` list (`'2014,2015,...,2023'`). Colon ranges like `'2014:2023'` have returned empty in practice.

3. Use `response_format='compact'` for multi-entity queries.

4. Use `faostat_get_rankings` (with DISPLAY element codes) to find top producers, importers, or exporters for context and rankings.

   **`faostat_get_rankings` reliability.** The tool sometimes returns HTTP 500. If it fails, reconstruct rankings by pulling `faostat_get_data` across all reporting countries for the target element/year and sorting client-side. Note the fallback in the story's methodology / footnote.

5. **China composite rule.** If the story involves China, default to composite `China` (area code 351) — the roll-up of mainland + Hong Kong SAR + Macao SAR + Taiwan — not `China, mainland` (41). Note the choice in the body text when China features prominently, and add the caveat that FAOSTAT's own publications default to 41, so this story's "China" number is marginally larger than the FAO data-portal default.

Pull data across multiple domains to build a multi-dimensional picture. A good data story typically draws from at least 2-3 different domains.

### Step 4 — Find the Narrative Arc

Analyze the pulled data to identify:

1. **The hook** — what is the single most surprising or compelling finding? A number that stops the reader.
2. **The trend** — what direction is the data moving, and does it break at some point? Inflection points make great story elements.
3. **The key players** — which countries or entities dominate? Are there unexpected names in the top ranks?
4. **The contrast** — what counterpoint or comparison makes the trend more vivid? (e.g., "Country X now produces more avocados than Y, which was the dominant producer just a decade ago")
5. **The stakes** — why does this matter for food security, livelihoods, climate, or trade?

### Step 5 — Generate Supporting Charts

For each key data point in the story, generate a standalone HTML chart using Chart.js. Each chart file must include:

- **Chart.js loaded via CDN** (`https://cdn.jsdelivr.net/npm/chart.js`)
- **Descriptive title** as an HTML heading above the chart
- **Properly labeled axes** with units (tonnes, hectares, USD, %, etc.)
- **Legend** with clear entity names
- **Colorblind-friendly palette** — use these colors in order:
  `#2271B2`, `#F748A5`, `#359B73`, `#D55E00`, `#E69F00`, `#56B4E9`, `#009E73`, `#CC79A7`
- **Responsive design** — canvas should resize with the viewport
- **FAOSTAT source attribution** — a footer line: "Source: FAOSTAT (FAO), accessed [current date]"

Choose chart types that match the data relationship:
- **Line chart** for trends over time
- **Bar chart** for comparisons across entities at a point in time
- **Stacked bar** for composition breakdowns
- **Scatter plot** for correlations between two variables

Do NOT use pie charts for trends or comparisons with more than 5 categories.

Generate 3-5 charts that support the narrative arc. Save each as a separate HTML file.

### Step 6 — Draft the Data Narrative

Compose an HTML report that interleaves narrative text with embedded charts. Structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Story Title]</title>
    <style>
        /* Clean, readable typography */
        body { font-family: Georgia, 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.7; color: #1a1a1a; }
        h1 { font-size: 2.2rem; line-height: 1.2; margin-bottom: 0.5rem; }
        .subtitle { font-size: 1.1rem; color: #666; margin-bottom: 2rem; }
        .stat-callout { background: #f0f4f8; border-left: 4px solid #2271B2; padding: 1rem 1.5rem; margin: 1.5rem 0; font-size: 1.2rem; }
        .chart-container { margin: 2rem 0; }
        .chart-container canvas { max-height: 400px; }
        .source { font-size: 0.85rem; color: #888; margin-top: 0.5rem; }
        .takeaways { background: #f8f8f8; padding: 1.5rem; border-radius: 4px; margin-top: 2rem; }
        .takeaways h2 { margin-top: 0; }
        footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ddd; font-size: 0.85rem; color: #888; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <!-- Narrative sections interleaved with charts -->
</body>
</html>
```

The narrative must include:

1. **Headline** — concise, attention-grabbing, data-grounded
2. **Subtitle** — one sentence expanding on the headline
3. **Hook paragraph** — lead with the most surprising statistic or finding
4. **Key statistics callouts** — highlighted stat boxes with the source noted
5. **Body sections** — each building on the previous, with a chart following each major claim
6. **Context paragraphs** — explain why the data looks the way it does (policy, climate, economic factors)
7. **Key takeaways** — 3-5 bullet points summarizing the story
8. **Footer** — full FAOSTAT attribution with access date and domain codes used

Every statistic cited must include the FAOSTAT domain it came from.

### Step 7 — Produce the Final Output

Save the complete HTML report as a single file. If the charts are embedded inline (preferred), produce one HTML file. If charts are separate files, list them and explain how they connect to the narrative.

Open the HTML file in the browser for the user to review.

### Step 8 — Attribution

Every chart and the report footer must include:

> Source: FAOSTAT (FAO), accessed [current date]. Domains: [list domain codes used].

Replace `[current date]` with today's date.

### Step 9 — Offer Refinements

Ask the user:
- "Would you like me to adjust the angle or emphasis?"
- "Should I add more charts or data points?"
- "Want me to explore a related angle?" (e.g., if the story is about avocados, offer to look at trade flows or environmental impact)
- "Should I dig deeper into any country or time period?"
