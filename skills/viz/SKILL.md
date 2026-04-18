---
name: faostat-viz
description: Use when the user asks to visualize, chart, graph, or plot FAOSTAT data, or when they want a visual representation of agricultural statistics. Also use when another skill needs to produce a chart. Keywords: chart, graph, plot, visualize, visualization, bar chart, line chart, scatter plot, stacked bar, HTML, interactive, Chart.js, trend chart, comparison chart. Do NOT use when the user wants a shareable, public-facing one-pager or social graphic → use `faostat-infographic`. Do NOT use when the user wants a full narrative report with charts → use `faostat-story` or `faostat-analytical-brief`.
---

# FAOSTAT Data Visualizer

Generate interactive, standalone HTML charts from FAOSTAT data. Charts use Chart.js via CDN and are designed to be self-contained, responsive, accessible, and properly attributed.

## Prerequisites

Before starting, verify that the FAOSTAT MCP tools are available: `faostat_search_codes`, `faostat_get_data`. If they are not available and the user has not provided data in the conversation context, inform the user they need the FAOSTAT MCP server configured and stop.

If data is already available in the conversation context (e.g., from a previous query or another skill), skip directly to chart generation.

## Chart Type Selection

Choose the chart type based on the data relationship. If the user does not specify a chart type, select the most appropriate one:

| Data Relationship | Chart Type | When to Use |
|-------------------|------------|-------------|
| Values over time | **Line chart** | Trends, time series, historical data |
| Values across categories | **Bar chart** | Comparing countries, commodities, or regions |
| Composition breakdown | **Stacked bar chart** | Shares of a total (e.g., emissions by source, trade by partner) |
| Two-variable relationship | **Scatter plot** | Correlations (e.g., fertilizer use vs. emissions) |

Do NOT use pie charts. They are difficult to read with more than 3-4 categories and do not convey FAOSTAT data well.

## Workflow

### Step 1: Determine data source

Check if usable data already exists in the conversation context:
- If YES: extract the relevant data points (values, labels, years, units) and proceed to Step 4.
- If NO: proceed to Step 2 to query FAOSTAT.

### Step 2: Query data (if needed)

1. Ask the user what they want to visualize if not clear from context:
   - What metric? (production, yield, trade volume, emissions, etc.)
   - Which entities? (countries, commodities, regions)
   - What time range?

2. Resolve all codes using `faostat_search_codes`:
   - Resolve area codes: `faostat_search_codes(domain_code='<domain>', dimension_id='area', query='<name>')`
   - Resolve item codes: `faostat_search_codes(domain_code='<domain>', dimension_id='item', query='<name>')`
   - Handle `requires_confirmation` for every search -- present options and wait for user choice.

3. Pull data using `faostat_get_data`:
   ```
   faostat_get_data(
     domain_code='<domain>',
     area='<codes>',
     item='<codes>',
     element='<filter_code>',
     response_format='compact'
   )
   ```

### Step 3: Prepare data

Extract from the query results:
- **Labels**: years (for time series) or entity names (for comparisons)
- **Datasets**: one dataset per series (e.g., one per country in a multi-country comparison)
- **Values**: numeric data points
- **Units**: the unit of measurement (tonnes, hectares, gigagrams CO2eq, etc.)
- **Title elements**: what is being shown, for whom, over what period

### Step 4: Generate the HTML chart

Create a standalone HTML file with the following structure and requirements:

**Color Palette (colorblind-friendly -- use these in order):**
```
#2196F3 (blue)
#FF9800 (orange)
#4CAF50 (green)
#E91E63 (pink)
#9C27B0 (purple)
#00BCD4 (cyan)
#FF5722 (deep orange)
#795548 (brown)
#607D8B (blue-grey)
#CDDC39 (lime)
```

**HTML Template Requirements:**
- DOCTYPE html with UTF-8 charset and viewport meta tag
- Chart.js loaded from CDN: `https://cdn.jsdelivr.net/npm/chart.js`
- A single `<canvas>` element for the chart
- Responsive: chart container should be `max-width: 900px; margin: 0 auto;`
- Chart must fill its container with `responsive: true` and `maintainAspectRatio: false`
- Chart container height: at least 500px
- Clean background: white or very light grey (#fafafa)

**Chart Configuration Requirements:**
- **Title**: descriptive, includes what is measured, for whom, and the time period. Use Chart.js plugin title: `plugins: { title: { display: true, text: '<title>', font: { size: 16 } } }`
- **Axes**: both axes must be labeled. Y-axis label must include the unit of measurement (e.g., "Production (tonnes)", "Emissions (Gg CO2eq)"). Use `scales: { x: { title: { display: true, text: '...' } }, y: { title: { display: true, text: '...' } } }`
- **Legend**: display with `plugins: { legend: { display: true, position: 'top' } }`
- **Tooltips**: enabled by default in Chart.js, ensure they show the value with appropriate precision
- **Data labels**: for bar charts with few bars (< 6), consider adding value labels

**Source Attribution (REQUIRED):**
Add a footer below the chart canvas:
```html
<p style="text-align: center; color: #666; font-size: 12px; margin-top: 10px;">
  Source: FAOSTAT (FAO), accessed [current date]
</p>
```

**Line Chart Specifics:**
- Use `tension: 0.3` for slightly smoothed lines
- Use `pointRadius: 3` for visible but not overwhelming data points
- Set `fill: false` unless showing area comparison

**Bar Chart Specifics:**
- Use `borderWidth: 1` with a slightly darker border color
- For grouped bars (multiple datasets), ensure `barPercentage` and `categoryPercentage` provide adequate spacing
- For horizontal bars, swap x and y axis configurations with `indexAxis: 'y'`

**Stacked Bar Specifics:**
- Set `scales: { x: { stacked: true }, y: { stacked: true } }`
- Use distinct colors from the palette for each stack segment

**Scatter Plot Specifics:**
- Use `pointRadius: 5` for visibility
- Add axis labels that clearly identify the two variables
- Consider adding a trend line if correlation is being demonstrated

### Step 5: Save and offer to open

1. Save the HTML file to a meaningful filename:
   - Format: `faostat-<subject>-<chart-type>.html`
   - Examples: `faostat-wheat-production-trends-line.html`, `faostat-emissions-comparison-bar.html`
   - Save in the current working directory unless the user specifies otherwise.

2. Tell the user the file path and offer to open it in their default browser:
   - On macOS: `open <filepath>`
   - On Linux: `xdg-open <filepath>`
   - On Windows: `start <filepath>`

### Step 6: Describe the chart

Provide a brief text description of what the chart shows:
- The main trend or comparison visible
- Any notable outliers or patterns
- What conclusions can be drawn

This ensures the insight is captured even if the user cannot view the chart immediately.

## Important Rules

- Always use `faostat_search_codes` before `faostat_get_data` to resolve codes. Never guess or hardcode codes.
- When `requires_confirmation` is true in a search result, always present options and wait for the user to choose.
- Use `response_format='compact'` for queries with multiple entities or time ranges.
- For `faostat_get_data`, use FILTER element codes (e.g., '2510'). For `faostat_get_rankings`, use DISPLAY element codes (e.g., '5510').
- Every chart MUST include source attribution: "Source: FAOSTAT (FAO), accessed [current date]"
- Use the colorblind-friendly palette defined above. Do not use default Chart.js colors.
- The HTML file must be fully standalone -- no external dependencies except the Chart.js CDN.
- Always include the source attribution line at the end of any text output as well.

## Related Skills

| If you need… | Use |
|---|---|
| Shareable one-pager / social graphic | `/faostat-infographic` |
| Full narrative article with charts | `/faostat-story` |
| Policy report with charts | `/faostat-analytical-brief` |
