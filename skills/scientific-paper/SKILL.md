---
name: faostat-scientific-paper
description: Use when the user wants an academic / peer-reviewable research paper built from FAOSTAT data — "scientific paper", "academic paper", "research paper", "journal article", "IMRaD write-up", "peer-reviewed paper", "manuscript". The deliverable is a .docx following IMRaD structure (Abstract, Introduction, Methods, Results, Discussion, Conclusion, References), a multi-sheet .xlsx data appendix, and a .bib BibTeX reference file. Tone is cautious, hedged, and statistically framed. Do NOT use when the user asks for an "analytical brief" or "policy brief" → route to `faostat-analytical-brief`. Do NOT use for "story" / "article" / "explainer" → `faostat-story`. Do NOT use for "infographic" / "one-pager" → `faostat-infographic`. Do NOT use for a policy brief styled as a "white paper" — that's still `faostat-analytical-brief`.
---

# FAOSTAT Scientific Paper

Build a peer-reviewable research paper from FAOSTAT data. Audience is researchers, reviewers and methodologists — not policymakers, not general readers. Length target 3,000–8,000 words, 6–12 numbered figures/tables, 15–40 references. Deliverable bundle: `.docx` manuscript + `.xlsx` data appendix + `.bib` BibTeX file.

## Prerequisites

Before starting, confirm FAOSTAT MCP tools are available: `faostat_get_data`, `faostat_search_codes`, `faostat_list_groups`, `faostat_list_domains`, `faostat_get_rankings`, `faostat_get_metadata`. If not, stop and tell the user the skill requires the FAOSTAT MCP server.

Python packages needed for output: `python-docx`, `openpyxl`, `pandas`, `scipy` (for `scipy.stats.kendalltau` and Mann–Kendall test — install `pymannkendall` if available, otherwise implement from `scipy.stats`). Install with `--break-system-packages` in the sandbox.

## Invariants

Cross-skill invariants (all six — violations are skill bugs):

1. **FILTER vs DISPLAY codes.** `faostat_get_data` takes FILTER codes (e.g., `2510` Production). `faostat_get_rankings` takes DISPLAY codes (e.g., `5510`). Never invert.
2. **Year syntax.** Comma-separated lists only (`'2010,2011,...,2023'`). Colon ranges return empty in practice.
3. **Element filter required** on every `faostat_get_data` call.
4. **TCL for national trade aggregates, TM only for partner breakdowns.** Never sum TM rows to reconstruct national totals.
5. **China composite default (Apr 2026 user preference).** Country-level numbers and rankings default to composite `China` (area 351). `China, mainland` (41) is available as an opt-in — do not substitute 41 unless the user explicitly asks. Flag the choice in the Methods section with the FAOSTAT-default-41 caveat. Map carve-out: if the paper embeds a choropleth, the map uses disaggregation (41 on CHN polygon + HKG 96 + MAC 128 + TWN 214) while narrative rankings and tables use 351.
6. **`faostat_get_rankings` HTTP-500 fallback.** On failure, reconstruct by pulling `faostat_get_data` across all reporting countries and sorting client-side. Note the fallback in Methods.

Paper-specific invariants:

7. **Every number traces to the xlsx.** Results-section numbers and every numeric claim in the Abstract, Discussion, and Conclusion live in a row of the data appendix (with `source_sheet` + `source_row` columns in a `Claims` sheet). Unverifiable numbers are a bug.
8. **Hedged claims.** No unqualified causal language unless the method is causal (DiD, IV, RCT). Use "associated with", "correlated with", "consistent with", "suggests". Reserve "causes" / "drives" / "due to" for causal designs only.
9. **Complete Limitations subsection.** Every paper names at least three limitations: (a) FAOSTAT data-quality caveats (estimated or imputed values, revisions), (b) coverage or temporal gaps, (c) methodological boundaries (descriptive vs causal, unit conversions, aggregation choices). This is non-optional.
10. **Structured abstract.** Fixed order: Background / Methods / Results / Conclusions. 200–300 words total, four labelled paragraphs or inline labelled sentences.
11. **No FAO impersonation.** Do not reproduce the FAO logo, "Food and Agriculture Organization of the United Nations" masthead, ISSN, "FAO Statistics Division" stamp, or "Required citation: FAO. …" line. Use a neutral "Suggested citation: [Author] ([YYYY])" block. CC-BY-4.0 data attribution to FAOSTAT stays — it's a property of the source data.

## Workflow

### Step 1 — Gather parameters

Ask the user (via `AskUserQuestion` if Cowork, inline otherwise) for anything not specified:

- **Topic / research question** — the paper needs a single testable framing ("Did global agrifood emissions grow significantly between 2001 and 2023, and what components drove the trend?").
- **Time window** — start year, end year. At least 10 years for a meaningful trend test.
- **Geographic scope** — global, regional (Africa / Americas / Asia / Europe / Oceania), or country-level.
- **Citation style** — APA 7 (default) or Nature / Science numbered. Use `AskUserQuestion` if not specified. No third option — keep the skill lean.
- **Author block** — name, affiliation, email. Neutral defaults if unspecified ("Prepared by [Analyst]").
- **Target journal / venue** — informs word-count target and figure density. Not required.

One clarifying round maximum. Pick sensible defaults for anything still unspecified (global scope, APA 7, anonymous author block).

### Step 2 — Draft the research question and title

A good FAOSTAT paper question is:

- **Measurable** — can be answered with the data that exists
- **Bounded** — specific commodity / emission category / country list / time window
- **Testable** — admits a clear statistical test (trend / difference / rank correlation / regression)

Write a working title and the one-sentence research question before pulling data. If the data contradicts the framing on pull, rewrite.

### Step 3 — Design the Methods before pulling data

Specify in advance (so Methods is fully determined before any figures are drawn):

- **Data source** — FAOSTAT domain(s) by code (GT, QCL, TCL, etc.), accessed date, licence (CC-BY-4.0).
- **Elements** — FILTER element codes on all `get_data` calls (e.g., `2510` Production quantity).
- **Items** — FAOSTAT item codes with canonical names.
- **Geographic coverage** — FAOSTAT area codes. Rankings use composite China (area 351) unless the user opts into mainland (41); map figures disaggregate (see invariant 5).
- **Temporal coverage** — comma-separated year list.
- **Aggregations** — regional groupings by FAOSTAT group codes (`5100` Africa, etc.) or user-defined; unit conversions (kt → Mt, etc.).
- **Statistical tests** — default battery (see Step 6). Pre-declare which test applies to which question.
- **Software** — Python 3.x, pandas, scipy, openpyxl, python-docx; cite versions in Methods.

### Step 4 — Pull the data

Apply invariants 1–6. Use `response_format='compact'`, `show_unit=True`, comma year lists, FILTER element codes on `get_data`.

Log every pull into the xlsx `Methodology` sheet with columns: `call_id`, `domain`, `element`, `items`, `areas`, `years`, `timestamp`, `row_count`, `notes`.

### Step 5 — Build the data appendix (xlsx) first

Before writing prose, lay out the xlsx with at minimum:

| sheet | purpose |
|---|---|
| `README` | paper title, author, citation-style, build date, one-paragraph scope |
| `Claims` | every numeric claim in the paper — columns: `claim_id`, `text`, `section`, `value`, `units`, `source_sheet`, `source_row` |
| `Fig<N>_<slug>` | one per figure — data + chart spec |
| `Tab<N>_<slug>` | one per table — tidy rows |
| `Methodology` | one row per `faostat_get_data` call (see Step 4) |
| `Stats` | one row per statistical test — columns: `test_id`, `question`, `method`, `statistic`, `p_value`, `ci_lower`, `ci_upper`, `n`, `notes` |
| `Sources` | all cited works, mirror of the .bib |

Per invariant 7, every number that appears in the `.docx` must have a `Claims` row with a pointer back.

### Step 6 — Run the statistical tests

Default battery (descriptive + trend-tests):

- **Descriptive** — means, medians, IQR, growth rates: compound annual growth rate (CAGR = `(end/start)^(1/n) - 1`), absolute deltas, shares of total.
- **Trend test** — **Mann–Kendall non-parametric trend test** on the full time series (reports tau, p-value). Preferred over linear regression for FAOSTAT annual series because it is robust to non-normality, monotonic trends, and outliers from methodological revisions. Use `pymannkendall.original_test(series)` if available; otherwise implement from `scipy.stats.kendalltau(years, values)`.
- **Rank correlation** — **Spearman's rho** when comparing two rank orders (e.g., countries ranked by production vs by exports). Reports rho, p-value, n.
- **Group comparison** — **Kruskal–Wallis H-test** when comparing three or more groups (regions, commodity classes). Reports H-statistic, degrees of freedom, p-value. Pairwise follow-up with Dunn's test only if the user asks for it — otherwise report effect sizes (median differences) without claiming causality.

**Not in the default battery** (ask before using): OLS regression, panel/fixed-effects, difference-in-differences, causal-inference methods. These require a user-named identification strategy and go in a custom Methods subsection.

Every test result lands in the `Stats` sheet with the columns in Step 5.

### Step 7 — Draft the manuscript in IMRaD order

Write in this order. Do not skip ahead — Abstract last, Conclusion second-to-last.

#### Title page
- Title (≤ 15 words, includes the outcome, the domain, and the time window)
- Author block (name, affiliation, email)
- Running head
- Keywords — 4–6, include "FAOSTAT"
- Data availability statement (points to the xlsx appendix and to FAOSTAT)

#### Introduction (≤ 800 words)
- Paragraph 1 — subject framing and policy/scientific relevance
- Paragraph 2 — short related-work review citing **named FAO sources** and one or two peer-reviewed anchor works. Suggested anchors by topic:
  - Emissions (GT/EM): Tubiello et al. (2022) *Pre- and post-production processes...*; FAO (2024) *The State of Food and Agriculture*; FAO / IPCC AR6 Ch.7.
  - Production (QCL): FAO (annual) *World Food and Agriculture – Statistical Yearbook*; Alexandratos & Bruinsma (2012) *World agriculture towards 2030/2050*.
  - Trade (TCL): FAO (2024) *The State of Agricultural Commodity Markets*; Fuglie et al. (2020) *Harvesting Prosperity*.
  - Temperature change (ET): Hansen et al. (2010) *Global surface temperature change*; FAO (2024) *Temperature change on land in FAOSTAT*.
  - Prices (PP): FAO Food Price Index methodology note; Headey & Martin (2016) *The Rising Price of Food*.
  For any topic without a canonical anchor, insert `[add peer-reviewed refs]` placeholders and tell the user. **Never fabricate citations.** Invented references are a skill bug; when in doubt, leave a placeholder.
- Paragraph 3 — research question, explicit and testable.
- Last paragraph — paper roadmap ("Section 2 describes…; Section 3 presents…; Section 4 discusses…").

#### Materials and Methods (≤ 1,200 words)
Fixed subsections:
1. **Data source** — FAOSTAT domain codes, licence, accessed date, composite-China choice, map carve-out if applicable.
2. **Variables** — element codes (FILTER), item codes, unit conversions.
3. **Geographic and temporal coverage** — area codes, comma year list.
4. **Statistical analysis** — every test by name (Mann–Kendall, Spearman, Kruskal–Wallis), software versions, significance threshold (α = 0.05 unless the user says otherwise).
5. **Reproducibility** — refer to the xlsx `Methodology` and `Stats` sheets. Include a sentence: "All `faostat_get_data` API calls, parameters, and results are logged in the accompanying xlsx appendix."

#### Results (text + figures + tables; 800–2,000 words)
Write one paragraph per figure / table. Open each paragraph with the finding, then the test statistic. Example:
> **Fig. 1** shows a monotonic increase in global agrifood-systems emissions between 2001 and 2023. A Mann–Kendall trend test returned τ = 0.89 (p < 0.001, n = 23), consistent with a significant upward trend. CAGR over the window was 0.87 %.

Every figure gets a **"Figure N: caption"** line with a Source line below:
```
Source: FAO. 2026. FAOSTAT: Climate Change - Agrifood Systems Emissions. Licence: CC-BY-4.0.
```
Tables follow the same convention ("Table N").

Results reports findings **without interpreting** them. Interpretation lives in Discussion.

#### Discussion (≤ 1,500 words)
Fixed subsections:
1. **Interpretation** — what the findings mean, hedged language only (invariant 8).
2. **Comparison with prior work** — where findings agree/disagree with cited anchor works.
3. **Limitations** — non-optional (invariant 9). Name at least: FAOSTAT data quality, coverage gaps, methodological boundaries (descriptive vs causal, aggregation choices).
4. **Future work** — 2–4 sentences on what a follow-up could do (causal identification, finer disaggregation, updated vintages).

#### Conclusion (≤ 250 words)
One paragraph. Restate the research question, the headline finding with its test statistic, and one practical implication. Hedged.

#### Abstract (200–300 words, structured)
Fixed four-label order:
- **Background** (2–3 sentences) — why the question matters.
- **Methods** (2–3 sentences) — data source, time window, tests used.
- **Results** (3–5 sentences) — headline numbers with test statistics.
- **Conclusions** (1–2 sentences) — hedged takeaway.

Write the Abstract last so the numbers already match the Results section.

#### References
Render in the chosen style.

- **APA 7** — alphabetical by first author surname, author-date in-text (e.g., "(Tubiello et al., 2022)").
- **Nature / Science numbered** — superscripts `¹²³`, references numbered in order of appearance.

All references also land in `references.bib` as BibTeX for import into Zotero / Mendeley.

#### Data availability
One paragraph: "The FAOSTAT data used in this study (domains [codes]) are freely available under CC-BY-4.0 at https://www.fao.org/faostat/. All API calls, parameters, derived tables, and statistical test outputs are logged in the xlsx appendix accompanying this manuscript."

#### Funding, Acknowledgements, COI, Author contributions
All optional; generate blank templates if the user hasn't filled them in.

### Step 8 — Build the docx

Use `python-docx`. Structure:

- Times New Roman or Cambria, 11pt body, 10pt tables, 10pt footnotes, 1.5 line-spacing double-column layout is NOT default — keep single-column for editability.
- Numbered headings (`1. Introduction`, `2. Materials and Methods`, …) — matches IMRaD convention.
- Figures embedded as PNG (render with matplotlib or the `faostat-map` skill for choropleths). Caption style "Figure N." in bold, rest in regular weight.
- In-text citations follow the chosen style; rebuild the reference list in the chosen style at the end.
- Page numbers in the footer.
- Suggested citation block in the front matter:
  ```
  Suggested citation: [Author] ([YYYY]). [Title]. Manuscript.
  ```
  — no "Required citation: FAO. …". Any such line is a skill bug.

### Step 9 — Write the BibTeX file

Create `references.bib` alongside the docx. One entry per cited work. Use `@article`, `@book`, `@techreport`, or `@misc` as appropriate. Include `doi =` where known, leave blank otherwise. Key format: `author-year-firstword` (e.g., `tubiello-2022-pre`).

### Step 10 — Save and describe

Share `computer://` links for:
- the `.docx`
- the `.xlsx` appendix
- the `.bib` file

Give a 4–5 sentence description: the research question, the time window, the key Mann–Kendall / Spearman / Kruskal–Wallis finding, any invariant that materially shaped the output (China composite choice, rankings fallback, unit conversion).

### Step 11 — Offer refinements

- **Swap citation style** (APA ↔ Nature).
- **Add a regression** (requires the user to name covariates).
- **Deepen the lit review** (requires the user to upload or name specific papers).
- **Alternate time window / geographic scope** — triggers a full rebuild.
- **Causal framing** — requires the user to name an identification strategy; skill adds a "Causal identification" subsection to Methods.

## Composition with other skills

- **`faostat-map`** — called when a Results figure is a choropleth. Pass `palette` (any neutral — "Ink" is closest to academic), `disaggregate_china=true`, `output_format='png'` (for embedding) or `'svg'` (for sharper output).
- **`faostat-analytical-brief`** — different audience (policymakers vs researchers). A paper is not a brief with more words — the statistical framing, hedged tone, and structured abstract are fundamentally different. Do not cross-use templates.
- **`faostat-infographic`** — cross-link only via the Data availability statement ("A public-facing infographic summary is available at […]"). Papers and infographics do not share figures.
- **`faostat-export-dataset`** — the xlsx appendix is already an export; the export skill is for standalone data releases without a manuscript.

## Error handling

- **Empty `faostat_get_data` payload** — retry with comma year list (invariant 2); if still empty, widen by ±2 years and log the adjustment in Methods.
- **`requires_confirmation` on `faostat_search_codes`** — stop and ask the user via `AskUserQuestion`. Never guess codes — a wrong item code is a silent fabrication.
- **`faostat_get_rankings` HTTP 500** — fall back to client-side sort (invariant 6) and note in Methods.
- **Mann–Kendall on fewer than 8 data points** — refuse the trend test; report descriptive stats only and note the minimum-n limitation in Limitations.
- **User asks for a causal claim without a causal design** — push back. Offer to either rewrite the claim as an association or to add a custom causal-identification subsection. Do not silently soften — explain the invariant.
- **User asks to add FAO branding (logo, masthead, "Required citation: FAO.")** — push back. Explain invariant 11. The CC-BY-4.0 data attribution in Methods and Data availability is sufficient.
- **User requests auto-drafted literature review beyond the named anchors** — push back. Explain fabrication risk. Offer the skeleton + `[add peer-reviewed refs]` path, or ask the user to upload / name papers.

## Suggested citation block (goes in the docx front matter)

```
Suggested citation: [Author]. [YYYY]. [Title]. Manuscript. Accessed FAOSTAT [Month YYYY].
```

Never "Required citation: FAO. …". Any such line is a skill bug.
