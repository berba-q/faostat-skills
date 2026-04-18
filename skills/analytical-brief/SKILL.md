---
name: faostat-analytical-brief
description: Use when the user wants a short, FAOSTAT-style analytical brief — a multi-page PDF policy document in the FAOSTAT house visual style, with a HIGHLIGHTS box, global/regional/country sections, numbered figures with source lines, explanatory notes, and a data appendix. Use when the user asks for "an analytical brief on X", "a FAOSTAT-style brief", "a policy brief", "a FAO-style write-up", or a short policymaker-facing report. Keywords — analytical brief, policy brief, FAOSTAT brief, FAO-style, brief, briefing (policy), policymakers, short report (policy). Do NOT use for journalistic long-reads (use `faostat-story`), academic papers (forthcoming `faostat-scientific-paper`), or single-page visual summaries (forthcoming `faostat-infographic`).
---

# FAOSTAT Analytical Brief

Produce a multi-page PDF analytical brief in the FAOSTAT house visual style, with the corresponding multi-sheet xlsx data appendix so every figure and discussion point is reproducible.

**Scope of the visual grammar (no FAO branding).** The brief uses the FAOSTAT visual grammar — teal/dark-blue palette, serif titles, → arrow bullets, teal section banners, numbered figures with `Source: FAOSTAT …` lines, and the familiar section order (HIGHLIGHTS / BACKGROUND / GLOBAL / REGIONAL / COUNTRY / EXPLANATORY NOTES / NEXT RELEASE / REFERENCES). It does **not** reproduce the FAO logo, "Food and Agriculture Organization of the United Nations" masthead, ISSN strip, "FAO Statistics Division" stamp, "Required citation: FAO. …" line, or any other FAO branding. The output must be clearly attributable as a user-generated analysis, not an FAO publication.

## Prerequisites

Confirm the FAOSTAT MCP tools are available: `faostat_get_data`, `faostat_search_codes`, `faostat_list_domains`, `faostat_get_metadata`. If they are not, tell the user and stop.

Python packages (install on demand via `pip install <pkg> --break-system-packages`):
- `plotly`, `pandas`, `kaleido` (figure rendering + PNG export, reused from `faostat-map`)
- `reportlab` (PDF assembly via Platypus)
- `openpyxl` (xlsx data appendix)

The forthcoming figure renders compose on top of `faostat-viz` (line/bar/stacked-bar) and `faostat-map` (choropleths). When a brief needs a map, invoke the map skill's rendering guidance rather than reimplementing.

## Cross-skill invariants (do not violate)

All 6 invariants from the FAOSTAT skill suite apply unchanged:

1. **FILTER vs DISPLAY element codes.** `faostat_get_data` takes FILTER codes (e.g., `'2510'`); never pass DISPLAY codes (`'5510'`).
2. **Year syntax.** Comma-separated lists only (`'2010,2011,...,2024'`); colon ranges return empty.
3. **Element filter required** on every `faostat_get_data` call.
4. **TCL for national trade aggregates, TM only for partner breakdowns.** Never sum TM rows to reconstruct national totals.
5. **China composite default (user preference, Apr 2026).** Default to composite `China` (area 351) for country rankings, top-N lists and country-level analysis. Offer `China, mainland` (41) as an opt-in — do not substitute 41 unless the user asks for 41 explicitly. Flag the choice in the Methodology sheet, and include the caveat whenever a China number is quoted: FAOSTAT's own publications default to 41, so a brief using 351 will show a marginally larger "China" value than the FAO data-portal default. (Map figures inside the brief are an exception: they use the disaggregation path — area 41 on the CHN polygon with HKG / MAC / TWN rendered separately — because choropleths cannot sensibly render 351. See the map skill.)
6. **`faostat_get_rankings` HTTP-500 fallback.** Reconstruct rankings from `faostat_get_data` + client-side sort; document fallback in the Methodology sheet.

## Workflow

### Step 1 — Gather parameters

Confirm or elicit from the user:
- **Topic/domain** — map to a FAOSTAT domain (QCL, TCL, GT, ET, PP, FBS, FS, RFN, RL, etc.).
- **Scope** — global (default, matching most reference briefs), regional, or a named country subset.
- **Time window** — a year range. Reference briefs use 15–25-year windows; default to the most recent 15 years if the user gives nothing.
- **Thematic breakdown** — optional. Production briefs split by commodity group; emissions briefs split by component (farm-gate / land-use / pre-and-post); trade briefs split by dimension (volume / value / concentration); climate briefs split by temporal slice. Pick a breakdown from the domain or ask the user.
- **Cover image** — optional user-supplied path. Default to a generic abstract teal gradient placeholder.
- **Brief number** — optional; omit by default (no number in cover kicker).
- **HTML sibling** — off by default; on request only.

### Step 2 — Plan the brief

Produce an internal outline before any data pulls:
- 5–8 HIGHLIGHTS bullets, each with a projected hard number placeholder.
- 4–7 numbered figures. Pattern:
  - Figure 1 — GLOBAL time series of the headline metric.
  - Figure 2 — REGIONAL breakdown (stacked bar or small multiples across 6 FAO regions).
  - Figure 3 — THEMATIC breakdown (by commodity / component / dimension per the domain).
  - Figure 4 — COUNTRY / TOP-10 bar chart.
  - Figure 5 (optional) — Choropleth map. Use `faostat-map`.
  - Figures 6–7 (optional) — additional regional or indicator figures.
- 1–2 tables where a cross-region / cross-indicator comparison is cleaner than a chart.

### Step 3 — Pull all data

For each figure and table, plan a specific `faostat_get_data` call. Log every call for the Methodology sheet. Always:
- Pass FILTER element codes.
- Use comma-separated year lists.
- Use `response_format='compact'`.
- Pass `show_unit=True`.
- For trade aggregates, use **TCL** elements (2610 import quantity, 2910 export quantity, 2612 import value, 2912 export value) — not TM sums.
- For region figures, pull the 6 continental area codes (Africa 5100, Americas 5200, Asia 5300, Europe 5400, Oceania 5500, World 5000) directly — don't compute them client-side.
- For top-N country figures, **don't** rely on `faostat_get_rankings`; pull `faostat_get_data` for the domain and element (no area filter) and sort client-side, so an HTTP-500 from `get_rankings` doesn't block the brief.
- For China in country rankings and country-level analysis, keep composite `China` (area 351) and drop 41 (mainland), unless the user opted into 41 explicitly. (Map figures inside the brief use the disaggregation path — area 41 + HKG 96 + MAC 128 + TWN 214 — because a choropleth cannot render 351 sensibly.)

Pull the dataset metadata with `faostat_get_metadata(domain_code=<D>)` so EXPLANATORY NOTES can be auto-generated from the same source the FAOSTAT team uses.

### Step 4 — Compute derived metrics

In pandas, compute and store:
- Period totals and averages.
- Year-over-year absolute and percentage changes.
- CAGR over the full window.
- Shares (country share of regional total, region share of world total).
- Rankings (top-10 by absolute value, by change, by intensity).

Keep the raw rows and the derived columns side-by-side for the xlsx appendix.

### Step 5 — Render figures as PNG

Use Plotly Express or Graph Objects with kaleido for static PNG export. Target:
- 2000×1200 px at `scale=2` for line/bar/stacked-bar charts.
- 2400×1400 px at `scale=2` for choropleth maps (via `faostat-map`).
- Colour palette: FAOSTAT house colours — teal `#1F5E7B`, dark blue `#1A3A5F`, warm grey `#7F7F7F`, accent ochre `#D89B2E`, accent green `#4F8A3B`.
- Sans-serif font for axis labels (Lato / Open Sans if available, else default sans).
- Source line embedded in the figure body: `Source: FAO. YYYY. FAOSTAT: [Dataset name]. [Accessed MMM YYYY]. https://www.fao.org/faostat/en/#data/[DOMAIN]. Licence: CC-BY-4.0.`

Save PNGs under `<outputs>/figures/fig<N>_<slug>.png`.

### Step 6 — Assemble the PDF

Use **ReportLab Platypus**. Build a `BaseDocTemplate` with two page templates:

**Cover page template** — no FAO branding. Elements, top to bottom:
- Hero image (user-supplied or generic teal gradient). ~55% of page height.
- Kicker `FAOSTAT ANALYTICAL BRIEF` in small caps, teal, sans-serif (serial number omitted unless user supplied).
- Title in dark-blue serif (26pt), centred.
- Subtitle (year range + scope) in grey serif (14pt), centred.
- Teal footer band with bar-chart motif (drawn as canvas primitives — small rectangles of varying heights).
- **No FAO logo. No "Food and Agriculture Organization of the United Nations" masthead. No ISSN. No "FAO Statistics Division" stamp.**

**Inside page template** — teal header band with:
- Brief title + subtitle + (optional brief number) in white sans-serif.
- Page content area with 2.5cm left/right margins.
- Footer: page number only. No institutional branding.

**Body flow**:
1. HIGHLIGHTS box on page 2:
   - "HIGHLIGHTS" caps heading in teal.
   - 5–8 bullets each prefixed with `→`, each carrying a hard number. Use `<b>` tags for the number. Render via Platypus `Paragraph` with custom bullet style.
2. `FAOSTAT [DOMAIN NAME]` teal all-caps banner.
3. `BACKGROUND` — 2–3 paragraphs of framing and policy context.
4. `GLOBAL` — narrative + Figure 1.
5. `REGIONAL` — narrative + Figure 2 (optionally Table 1 with regional indicators).
6. Thematic subsections (commodity / component / dimension) — each with its own figure.
7. `COUNTRY` — top-N narrative + Figure 4 (horizontal bar).
8. Optional map figure via `faostat-map`.
9. `EXPLANATORY NOTES` — auto-generated from `faostat_get_metadata` covering the dataset scope, update cycle, coverage caveats, aggregation rules.
10. `NEXT RELEASE` — single sentence with the next expected release window per FAOSTAT's update cadence.
11. `REFERENCES` — DOI-linked bibliography.

**Figure rendering in Platypus**:
```python
story.append(Paragraph(f"<b>Figure {n}:</b> {caption}", fig_caption_style))
story.append(Image(png_path, width=16*cm, height=9*cm))
story.append(Paragraph(source_line, fig_source_style))
```

**Typography**:
- Titles: serif, dark blue (`#1A3A5F`).
- Section banners: sans-serif, teal (`#1F5E7B`), all-caps.
- Body paragraphs: serif (Cambria / Georgia fallback), 10.5pt.
- HIGHLIGHTS bullets: sans-serif (Lato / Open Sans / default), 10pt, `→` bullet marker.
- Figure caption: sans-serif bold, 9.5pt.
- Figure source: sans-serif italic, 8pt, grey.

**Subscripts**. Never use Unicode subscripts (`CO₂`). Use Platypus XML markup: `CO<sub>2</sub>`.

### Step 7 — Build the xlsx data appendix (required)

Use `openpyxl` to write a workbook at `<outputs>/<brief-slug>-data.xlsx` with the following sheets. Every figure and every numeric claim in HIGHLIGHTS must trace back to a sheet row.

**Required sheets**:

1. `README` — brief title, pull date, scope, list of FAOSTAT domains/elements/years used, sheet index (sheet name + contents summary).
2. `Highlights_data` — one row per HIGHLIGHTS bullet, columns: `bullet_text`, `value`, `unit`, `source_sheet`, `source_row`. This is the audit trail so any reviewer can check every headline number.
3. `Fig<N>_<slug>` — one sheet per figure. Columns should match what was plotted (long form with `area`, `year`, `element`, `item`, `value`, `unit` as appropriate). Include any derived columns (CAGR, Δ, share) next to the raw ones.
4. `Tab<N>_<slug>` — one sheet per in-brief table, same rows as rendered.
5. `Methodology` — one row per `faostat_get_data` call, columns: `call_id`, `domain`, `element_filter_code`, `item_codes`, `area_codes`, `year_list`, `response_format`, `timestamp_utc`, `notes` (e.g., "China composite 351 used for country-level figures; area 41 dropped"; "map figure disaggregated China: 41 + HKG 96 + MAC 128 + TWN 214"; "get_rankings fallback via client-side sort on get_data").
6. `Sources` — bibliography. Columns: `id`, `citation`, `url`, `licence`.

**Formatting conventions**:
- Header row bold, teal fill (`#1F5E7B`, white text).
- Numeric columns right-aligned; text left-aligned.
- Freeze the first row.
- Auto-fit column widths (or set to a sensible default and wrap long text).
- Number format for percentages (`0.0%`), integers with thousands separator (`#,##0`), decimals where native.

Link the xlsx from the brief footer: `Data appendix: <brief-slug>-data.xlsx`.

### Step 8 — Write the back matter (no FAO impersonation)

Replace every FAO-branded element with neutral author-and-source attribution:

- **Authorship line**: `Prepared by [user name / organisation] using FAOSTAT data.`
- **FAO legal disclaimer**: OMIT. Instead include a short note: "This analysis is based on FAOSTAT data, released under the CC-BY-4.0 licence. Any interpretation, emphasis, or conclusion is the author's and does not represent an FAO position."
- **Required citation**: `Suggested citation: [author], [year]. [Brief title]. Analytical brief based on FAOSTAT data, accessed [MMM YYYY].` — **no "Required citation: FAO. …" line.**
- **Cover photo credit**: `Cover image: [source]` — if using a stock or generic image, say so. Never use `© FAO` or `FAO/<photographer>`.
- **No ISSN. No FAO contact footer. No FAO-catalogue code.**
- Data-licence footer: `Underlying data © FAO, used under CC-BY-4.0. https://creativecommons.org/licenses/by/4.0/`.

### Step 9 — Save and describe

Save outputs to the session workspace:
- `<outputs>/<brief-slug>.pdf` (primary)
- `<outputs>/<brief-slug>-data.xlsx` (required appendix)
- `<outputs>/figures/fig<N>_<slug>.png` (individual PNG figures)
- `<outputs>/<brief-slug>.html` (optional HTML sibling, if requested)

Describe to the user:
- The headline numbers (repeating the HIGHLIGHTS bullets).
- Any sparse-data or coverage notes surfaced during the pulls.
- Any invariant that mattered (e.g., "TCL used for trade aggregates; TM sums would have double-counted re-exports", "China composite 351 used for country rankings; 41 available as opt-in").
- Direct links to the PDF and the xlsx.

### Step 10 — Offer refinements

Ask:
- "Want a different year window or scope?"
- "Should I add a country-level map?" (invokes `faostat-map`).
- "Any highlights you'd like emphasised or deprioritised?"
- "Replace the cover image?" (user can supply a file path).
- "Generate the HTML sibling?"

## Error handling

- **Empty data pull.** First check FILTER vs DISPLAY (invariant 1), then year syntax (invariant 2), then element exists in the domain.
- **Sparse region years.** If a region has <80% year-coverage in the window, note it in the REGIONAL narrative and in the Methodology sheet rather than silently interpolating.
- **`faostat_get_rankings` HTTP 500.** Use the `faostat_get_data` fallback (invariant 6). Log the fallback on the Methodology sheet.
- **Kaleido install fails.** The skill cannot produce the PDF without PNG renders. Install `kaleido` on demand and retry; if install still fails, fall back to the HTML sibling and tell the user the PDF path requires kaleido.
- **ReportLab font missing.** If the preferred serif (Cambria / Georgia) or sans-serif (Lato / Open Sans) isn't available in the sandbox, fall back to ReportLab's built-in `Times-Roman` / `Helvetica` without failing. Note the font fallback in the Methodology sheet.
- **User asked for content implying FAO authorship.** If the user asks to put FAO logos, "Food and Agriculture Organization" masthead, or "Required citation: FAO. …" in the brief, push back: the skill produces FAOSTAT-style analyses for user authorship, not FAO-branded documents. Offer to proceed without the FAO branding.

## Limitations (v1)

- Cover-image generation is a placeholder gradient unless the user supplies a path.
- Typography is limited to ReportLab's built-in fonts and whatever TrueType fonts are available in the sandbox.
- HTML sibling is v2 — v1 ships PDF + xlsx only unless explicitly requested.
- Subnational analysis is out of scope (FAOSTAT is country-level).
- Automatic cross-domain briefs (e.g., production + trade in one brief) are v2; v1 covers one headline domain per brief with optional supporting pulls from 1–2 related domains.
