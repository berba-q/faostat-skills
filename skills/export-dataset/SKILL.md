---
name: faostat-export-dataset
description: Use when the user wants a clean, documented tabular export of FAOSTAT data — "export FAOSTAT", "download the data", "give me the CSV / xlsx of [indicator]", "I want the raw numbers", "tabular data pull", "export to spreadsheet". The deliverable is a bundle — one multi-sheet .xlsx (README / Data_tidy / Data_wide / Methodology / Sources) + one tidy-long .csv mirror + a data-dictionary .md. No prose, no charts, no narrative — just the data with full provenance. Do NOT use for reports, briefs, papers, infographics, or visualisations — those skills embed their own xlsx appendices. Use this skill when the data itself IS the deliverable.
---

# FAOSTAT Data Export

Ship clean, documented FAOSTAT data. The user wants the numbers, not the story. Deliver a three-file bundle: one multi-sheet `.xlsx`, one tidy-long `.csv`, and a data-dictionary `.md`. Every row traces back to the FAOSTAT API call that produced it.

## Prerequisites

FAOSTAT MCP tools: `faostat_get_data`, `faostat_search_codes`, `faostat_list_domains`, `faostat_get_metadata`. If any are missing, stop and tell the user the skill requires the FAOSTAT MCP server.

Python packages: `openpyxl`, `pandas`. Install with `--break-system-packages` in the sandbox.

## Invariants

Cross-skill invariants (all six — violations are skill bugs):

1. **FILTER vs DISPLAY codes.** `faostat_get_data` takes FILTER codes (e.g., `2510` Production). `faostat_get_rankings` takes DISPLAY codes (e.g., `5510`). Never invert.
2. **Year syntax.** Comma-separated lists only (`'2010,2011,...,2023'`). Colon ranges return empty in practice.
3. **Element filter required** on every `faostat_get_data` call. Unfiltered pulls are massive, especially in emissions domains.
4. **TCL for national trade aggregates, TM only for partner breakdowns.** Never sum TM rows to reconstruct national totals.
5. **China composite default (Apr 2026 user preference).** Default: composite `China` (area 351). `China, mainland` (41) is an opt-in; full disaggregation (41 + 96 + 128 + 214) is also opt-in. Record the choice in the README sheet with the FAOSTAT-default-41 caveat.
6. **`faostat_get_rankings` HTTP-500 fallback.** On failure, reconstruct by pulling `faostat_get_data` across all reporting countries and sorting client-side. Note the fallback in Methodology.

7. **Element and item code resolution.** Never use a hardcoded numeric element or item code as the primary value in a `faostat_get_data` call. Always resolve at runtime: `faostat_search_codes(domain_code='<dom>', dimension_id='element', query='<metric name>')` for elements; `faostat_search_codes(domain_code='<dom>', dimension_id='item', query='<item name>')` for items. Numeric codes shown in reference tables and code examples are verified hints — use them to validate the search result, not as the authoritative source. Domain letter-codes (QCL, TCL, GT, EM, FBS, FS…) are stable and may be used directly.

Export-specific invariants:

8. **Every value traces to an API call.** The Methodology sheet logs one row per `faostat_get_data` call with domain / area / element / item / year list / timestamp / rows-returned. No value appears in the export that did not come from a documented call.
9. **FAO-native units kept as-is.** No auto-conversion. Values stay in FAOSTAT's native units (kt CO₂eq, tonnes, USD 1000, etc.). Unit is a column in tidy-long and a header row in wide. If the user explicitly asks for normalised units, add normalised columns **alongside** the native ones — never in place of.
10. **No FAO branding.** No FAO logo, "Food and Agriculture Organization of the United Nations" masthead, ISSN, "FAO Statistics Division" stamp, or "Required citation: FAO. …" line. CC-BY-4.0 attribution to FAOSTAT (source, licence, access date) IS kept — that's a property of the source data.
11. **Both shapes in the xlsx.** `Data_tidy` (long) and `Data_wide` (years-as-columns pivot) are both always present. The CSV mirror is tidy-long only. A wide CSV is produced only if the user asks.

## Workflow

### Step 1 — Gather parameters

Required from the user (prompt via `AskUserQuestion` in Cowork, inline otherwise):

- **Domain** — e.g., GT, QCL, TCL, ET, PP, FBS, FS.
- **Element(s)** — FILTER code(s). If the user supplies a name rather than a code, resolve via `faostat_search_codes` (invariant 7) before use.
- **Year range** — list of years (will be passed comma-separated).
- **Area scope** — World, specific regions, specific country list, or "all reporting countries". Default if unspecified: all reporting countries plus regional aggregates (5000/5100/5200/5300/5400/5500).

Optional:

- **Item(s)** — FILTER code(s). If omitted, all items in domain for the chosen element.
- **Flag filter** — default keep all; optional strip to official-value-only.
- **China handling** — default `composite_351`. Options: `mainland_41` or `disaggregated` (`41,96,128,214`).
- **Topic title** — propose one from domain + element + item + year range if the user does not supply.

### Step 2 — Resolve codes

Always resolve element and item codes at runtime before the data pull (invariant 7). Call `faostat_search_codes(domain_code=…, dimension_id='element'|'item'|'area', query=…)` for every numeric code needed — even when the user supplies a code directly, verify it matches. Print the resolved codes back in a short confirmation block before the heavy pull so mismatches surface early.

### Step 3 — Pull data

Call `faostat_get_data` with:

- `domain_code`
- `area` = comma-separated list (applying the China rule: `351` composite / `41` mainland / `41,96,128,214` disaggregated)
- `element` = comma-separated FILTER codes
- `item` = comma-separated FILTER codes (or omit for "all items in domain")
- `year` = comma-separated year list (invariant 2)

Log **one Methodology row per API call, as the call is made** — do not retrofit. If multiple element codes need different item sets, issue separate calls and concatenate. Never conflate element-item pairings across calls.

### Step 4 — Clean the dataframe

In order:

1. Coerce `Value` to numeric. Drop rows where `Value` is null.
2. Rename columns to the canonical schema: `area_code, area, item_code, item, element_code, element, year, unit, value, flag, note` (omit `item_code`/`item` if the domain has no items, e.g. ET temperature anomalies).
3. Keep both code and label columns — downstream analysts need them.
4. Sort by `area, item, element, year`.

### Step 5 — Build the tidy-long CSV

Schema: `area_code, area, item_code, item, element_code, element, year, unit, value, flag, note`.

Header comment lines at the top of the CSV (prefixed with `#`):

```
# Source: FAOSTAT (https://www.fao.org/faostat/), accessed YYYY-MM-DD. Licence: CC-BY-4.0.
# Domain: <CODE> (<label>). Elements: <codes>. Items: <codes or "all">. Years: <list>.
# China handling: <composite_351 / mainland_41 / disaggregated>.
# Rows: <N>. Generated by faostat-export-dataset skill.
```

Save as `<topic_slug>_<year_start>-<year_end>_tidy.csv`.

### Step 6 — Build the wide pivot

Rows: `(area_code, area, item_code, item, element_code, element, unit)`. Columns: years. Values: `value`.

Keep `area_code` and `item_code` — do not drop identifiers. If the pivot contains multiple elements with different units, keep one row per element; unit shown in its own column.

### Step 7 — Assemble the xlsx

Sheets in this order:

- **README** — plain-prose block:
  - Title (topic + year range)
  - Source line (FAOSTAT, licence, access date)
  - Column dictionary (one line per column — mirrors the `.md` file)
  - China-handling choice with the FAOSTAT-default-41 caveat
  - Flag codes key (from `faostat_get_metadata`)
  - File manifest (tidy.csv / xlsx / data-dictionary.md)
- **Data_tidy** — identical schema to the tidy CSV (no `#` comment header inside xlsx).
- **Data_wide** — pivoted with years as columns.
- **Methodology** — one row per API call: `call_id, timestamp_utc, domain, area_param, element_param, item_param, year_param, rows_returned, notes`. Year param stored as the literal comma-separated string that was passed.
- **Sources** — one row per domain used: `domain_code, domain_label, citation, url, licence, access_date`. Pulled from `faostat_get_metadata`.

### Step 8 — Build data-dictionary.md

Plain markdown file:

- **Dataset description** — topic, year range, scope, row count.
- **Column schema table** — column name | type | description | example | nullable.
- **Unit reference table** — unit string | full name | note (no conversion applied; purely descriptive).
- **Flag codes** — flag | meaning.
- **Known caveats** — China handling, any FAOSTAT revisions relevant to the pulled years, any items that changed codes over the series.
- **Citation block** — FAOSTAT + licence + access date + full URL of each domain used.

### Step 9 — Save and present

Save all three files to the outputs folder with a shared slug:

- `<slug>.xlsx`
- `<slug>_tidy.csv`
- `<slug>_data-dictionary.md`

Confirm to the user with links to all three files and a one-line summary: "*topic*, *year range*, *N rows*, *K sheets in xlsx*, China handling = *choice*." Nothing more — this is a data-delivery skill, not a narrative skill.

## Slug convention

`{domain_lower}_{primary_element_label}_{year_start}-{year_end}`

Examples:

- `gt_emissions-total_2001-2023`
- `qcl_production_cattle-poultry-pig_2010-2024`
- `tcl_export-value_cereals_2015-2024`
- `pp_producer-price_coffee-cocoa_2020-2024`

Lowercase, hyphen-separated labels, underscore between segments.

## Error handling

- **Empty `faostat_get_data` result.** Re-check comma-separated year syntax (invariant 2) and the element/item resolution. If the problem persists, widen the item filter to "all items in domain" to confirm the domain + area + year combo returns anything at all. Log the failure in Methodology with `rows_returned = 0, notes = "…"`.
- **Rankings HTTP 500.** Use the `get_data` fallback (invariant 6). Record in Methodology.
- **Mixed units in one element.** Shouldn't happen for a single element code; if it does, split into separate `Data_wide` blocks per unit.
- **User asks for a narrative or a chart.** Decline politely and route to `faostat-analytical-brief` / `faostat-infographic` / `faostat-story` / `faostat-scientific-paper` / `faostat-viz`. This skill is data-only.
- **User asks to normalise units.** Explain the invariant (keep FAO-native, auditable). If they insist, add normalised columns alongside — never replace the native ones.

## Defaults summary

| knob | default |
|---|---|
| bundle | xlsx + tidy csv + data-dictionary md |
| shapes | tidy-long + wide pivot (both) |
| China | composite 351 |
| units | FAO-native (no conversion) |
| flag filter | keep all flags |
| year range | user must supply — no default |
| item filter | if omitted, all items in domain |
| area scope | if omitted, all reporting countries + regional aggregates |

All defaults can be overridden by the user; every override is documented in the README sheet and the data-dictionary.md.
