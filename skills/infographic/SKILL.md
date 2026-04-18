---
name: faostat-infographic
description: Use when the user wants a modern, non-expert-facing visual summary of FAOSTAT data on a single page — an infographic, one-pager, visual summary, explainer card, or shareable graphic for social, pitch decks, or press use. The deliverable is a standalone HTML file with inline SVG (optional PNG/PDF export). Aesthetic: Visual Capitalist / Our World in Data explainer cards / Statista — bold typography, generous whitespace, one hero stat, iconography over chart axes. Do NOT use when the user asks for an "analytical brief", "policy brief", "FAOSTAT brief", "policymaker-facing" document → route to `faostat-analytical-brief`. Do NOT use for "data story", "article", "long-read", "explainer" with paragraphs → route to `faostat-story`. Do NOT use for academic papers or dense chart-per-finding reports. Do NOT use when the user wants a standalone interactive chart only → use `faostat-viz`.
---

# FAOSTAT Infographic

Build a single-page infographic from FAOSTAT data for a non-expert audience. The reader should grasp the main point in under 10 seconds and the supporting detail in under 30. Aesthetic cue: modern data journalism (Visual Capitalist, OWID explainer cards, Statista) — not FAO yearbooks.

## Prerequisites

Before starting, confirm the FAOSTAT MCP tools are available: `faostat_get_data`, `faostat_search_codes`, `faostat_list_groups`, `faostat_list_domains`, `faostat_get_rankings`. If not, stop and tell the user this skill requires the FAOSTAT MCP server.

## Invariants

Cross-skill invariants (all six — violations are skill bugs):

1. **FILTER vs DISPLAY codes.** `faostat_get_data` takes FILTER codes (e.g., `2510` for Production). `faostat_get_rankings` takes DISPLAY codes (e.g., `5510`). Never invert.
2. **Year syntax.** Comma-separated lists only (`'2010,2011,...,2023'`); colon ranges return empty in practice.
3. **Element filter required** on every `faostat_get_data` call.
4. **TCL for national trade aggregates, TM only for partner breakdowns.** Never sum TM rows to reconstruct national totals.
5. **China composite default (Apr 2026 user preference).** For any country-level number or ranking, default to composite `China` (area 351). Offer `China, mainland` (41) as an opt-in. Flag the choice in the source footer. Map carve-out: if the main visual is a choropleth, the map uses the disaggregation path (area 41 on the CHN polygon; HKG 96 / MAC 128 / TWN 214 on their own polygons). Never blend the two in the same figure.
6. **`faostat_get_rankings` HTTP-500 fallback.** If the call fails, reconstruct by pulling `faostat_get_data` across all reporting countries and sorting client-side. Note the fallback in the source footer.

Infographic-specific invariants:

7. **One hero stat.** There is exactly one hero number on the page. If you're torn between two, pick the more surprising one and push the other into the supporting-stats row.
8. **One main visual.** Exactly one chart, map, or diagram. Rankings and compositions that would otherwise become a second chart render as a plain bulleted list or a small numeric table with no bar-width indicators. See Step 3 for the decision tree.
9. **Jargon only in the source footer.** `AR5`, `AR5 GWP-100`, `CAGR`, `n.e.c.`, `FILTER code`, `DISPLAY code`, `LULUCF`, bare `CO2eq`, `kt`/`Mt`/`Gt` on first reference, and numeric FAOSTAT element/item codes stay in the source footer. Not in visual titles, subtitles, chart labels, captions, or headlines.
10. **Ten-second test.** Read the page aloud in 10 seconds — can a non-expert recite the main point? If not, shrink the headline or enlarge the hero.
11. **No FAO branding.** Retain CC-BY-4.0 data attribution ("Data: FAOSTAT (FAO), CC-BY-4.0"), but do not reproduce the FAO logo, "Food and Agriculture Organization of the United Nations" masthead, ISSN, "FAO Statistics Division" stamp, or "Required citation: FAO. …" line. The infographic is the analyst's, not FAO's.

## Visual system

### Palettes (skill auto-picks by topic; user can override)

| palette | background | hero | accent | text | secondary | fits |
|---|---|---|---|---|---|---|
| **Ember** | `#0B0B0F` | `#F6A33F` | `#FF5C39` | `#F3F3F1` | `#6D6D74` | climate, emissions, trade, shocks |
| **Meadow** | `#F6F5EF` | `#2E7D4F` | `#E8A03D` | `#1F2420` | `#6B6E67` | production, food security, nutrition |
| **Ink** | `#FAFAFA` | `#1B1F3A` | `#E23E57` | `#1B1F3A` | `#7A7D87` | prices, indicators, economic angles |

Topic routing: emissions / temperature / trade disruption → Ember. Crops / livestock / food security / undernourishment → Meadow. Producer prices / CPI / indicators → Ink. If ambiguous, ask the user once.

### Typography (fixed)

- Hero stat: **Space Grotesk 700** (or Inter 900 fallback), 120–180 px on desktop, 72–96 px on mobile.
- Headline: Space Grotesk 700, 40–56 px desktop / 28–36 mobile, ≤ 10 words, plain English.
- Supporting stats: Space Grotesk 700 for the number, Inter 500 for the caption.
- Body / takeaway: Inter 400 italic for the takeaway, Inter 400 for everything else.
- Numbers: IBM Plex Mono 500 for small inline stats inside chart labels (helps numeric alignment).

One font family loaded via Google Fonts (`https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter:wght@400;500;700;900&family=IBM+Plex+Mono:wght@500&display=swap`).

### Hierarchy (fixed, in page order)

1. **Hero stat** — one number, as big as it dares (≥ 30 % of viewport height on desktop). Unit spelled out ("16.5 billion tonnes of CO₂-equivalent", not "16.5 Gt CO₂eq").
2. **Headline** — one sentence, ≤ 10 words.
3. **Supporting stats row** — 2–4 numbers with a Lucide icon each and a one-line caption. No more than 4.
4. **Main visual** — exactly one. A line chart (temporal), a bar chart (compositional), or a choropleth map (geographic). Stripped of gridlines; labels on the data, not on axes where possible.
5. **Takeaway** — one italic sentence, plain-English "so-what" framing.
6. **Source footer** — "Data: FAOSTAT (FAO), accessed [Month YYYY]. Licence: CC-BY-4.0. Domains: [codes]. China: [composite 351 / mainland 41 per user opt-in / disaggregated for map]."

Everything on one scrollable page, mobile-responsive. Max content width 720 px; hero and main visual full-bleed to 1200 px.

### Iconography

Inline **Lucide** SVG icons (MIT licensed, ≤ 1 kB each). Fetch from `https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/<name>.svg` at build time and paste the SVG inline. Icon colour = palette accent. Icon size: 32 px next to supporting stats, 48 px next to the main visual title.

Common mappings: emissions → `cloud`, production → `wheat`, trade → `ship`, temperature → `thermometer-sun`, price → `trending-up`, yield → `sprout`, livestock → `beef`, water → `droplet`, land → `mountain`.

## Workflow

### Step 1 — Gather parameters

Ask the user (via `AskUserQuestion` if Cowork, inline otherwise) for anything not specified:
- Topic / angle
- Time window (endpoint year + optional start year for a change framing)
- Scope: global (default) / a region / a country
- Palette preference (Ember / Meadow / Ink / auto-pick)
- Output format preferences: HTML only (default), + PNG, + PDF, + companion CSV

Proceed without a second clarifying round — one is enough. Pick sensible defaults for anything still unspecified.

### Step 2 — Design the hero message

From the topic, identify the single most striking stat. Rules of thumb:
- **Biggest delta over the window** (e.g., "+48.8 % in pre- and post-production emissions since 2001")
- **Most extreme ratio** (e.g., "4× gap in cattle-meat emissions intensity between Africa and Europe")
- **Most surprising ranking** (e.g., "top 10 emitters = 55 % of world total")
- **A number at the edge of intuition** (e.g., "16.5 billion tonnes of CO₂-equivalent")

This becomes the hero + headline. Draft both before pulling data — if the narrative falls apart on the numbers, rewrite.

### Step 3 — Plan supporting stats and visual

2–4 supporting stats that reinforce or contextualise the hero. Each gets a Lucide icon and a one-line plain-English caption.

Pick the main visual type:
- **Line** for a temporal story ("emissions 2001–2023")
- **Bar** for a ranking ("top 10 emitters in 2023") or a composition ("three pillars of agrifood emissions")
- **Map (choropleth)** for a geographic story ("emissions per capita by country"). If map → compose with the `faostat-map` skill, which returns an SVG choropleth in one of the three palettes.

**Exactly one main visual.** Not two, not a pair, not a chart-plus-ranks section. If the user asked for both a temporal story and a top-producers ranking, the line chart is the main visual and the ranking renders as **a plain bulleted list or a small numeric table** — text first, no second chart. No sparklines, no small multiples, no dual-axis, no "bar magnitude" indicators that turn a table into a chart. If the table's row lengths are visually dominant (bars filling the row width), it counts as a second chart — strip the bars.

If you feel the urge to add a second chart, pick one:
- Promote it to the main visual and demote the current one to a text stat.
- Split into two infographics.
- Drop it.

### Step 4 — Pull the data

Apply invariants 1–6. Log every `faostat_get_data` call if the user asked for the companion CSV.

- Use `response_format='compact'`, `show_unit=True`.
- Pass the element as a FILTER code.
- Use comma year lists.
- For trade aggregates: TCL; never sum TM.
- For China in rankings / country-level numbers: composite 351 by default, unless the user opted into 41.
- For the map path: disaggregate — area 41 + HKG 96 + MAC 128 + TWN 214, drop 351.
- For top-N: prefer `faostat_get_rankings` (DISPLAY codes); if HTTP 500, fall back to `faostat_get_data` across all reporting countries and sort client-side.

Pull only what you need for the 1 hero + 2–4 supporting stats + main visual. Do not pull a full dataset "in case" — infographics reward discipline.

### Step 5 — Compose the main visual

Inline SVG. Palette applied. Gridlines stripped. For line charts, label the endpoints directly on the line. For bar charts, label the bars directly and drop the numeric axis. For maps, call the map skill with `output_format='svg'`, `palette=<chosen>`, `disaggregate_china=true`.

Size: main visual 720 px wide on desktop, 100 % width on mobile, aspect ratio ~16:9 for charts and ~2:1 for maps.

### Step 6 — Write captions and takeaway

Plain-language rules:
- Spell out units the first time ("billion tonnes of CO₂-equivalent" not "Gt CO₂eq"). Second reference can contract.
- Round aggressively. "16.5 bn t" reads better than "16,543.2 Mt". Hero stats deserve the fullest pretty form; small inline stats can go compact.
- **Jargon belongs only in the source footer.** "Outside the source footer" means *nowhere else on the page* — not in headlines, not in supporting-stat captions, not in visual titles, not in visual subtitles, not in chart labels, not in takeaways. Banned in body: `CAGR`, `n.e.c.`, `FILTER code`, `DISPLAY code`, `AR5`, `AR5 GWP-100`, `GWP-100`, `CO2eq` as a standalone acronym (write "CO₂-equivalent" instead), `LULUCF`, element-code numbers, item-code numbers, `kt`/`Mt`/`Gt` on first reference. If methodology needs a unit-conversion or GWP-basis footnote, it goes in the source footer as a clause like "(CO₂-equivalents use AR5 GWP-100)."
- Takeaway is one sentence, italic, "so-what" framed: what it means for the reader, not what the data shows.

### Step 7 — Assemble the HTML

Single self-contained file. Inline CSS and inline SVG. One external resource allowed: the Google Fonts stylesheet. Structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Headline]</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...">
  <style>/* palette variables + responsive CSS */</style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="hero-stat">16.5 bn t</div>
      <h1 class="headline">[Headline]</h1>
    </section>
    <section class="supporting">
      <div class="stat"><svg>...</svg><div class="n">+21%</div><div class="cap">since 2001</div></div>
      <!-- 2–3 more -->
    </section>
    <section class="visual">
      <svg role="img" aria-label="[alt text]">...</svg>
    </section>
    <p class="takeaway"><em>[One-line so-what]</em></p>
    <footer class="source">Data: FAOSTAT (FAO), accessed [Month YYYY]. Licence: CC-BY-4.0. Domains: [codes]. [China footnote].</footer>
  </main>
</body>
</html>
```

Responsive breakpoints at 480 / 768 / 1024 px. On mobile the hero shrinks, supporting stats stack vertically, and the main visual goes full-width.

Accessibility: every SVG gets `role="img"` and a meaningful `aria-label`. Colour contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text.

### Step 8 — Offer exports

After the HTML is saved, ask the user what additional formats they want. The options, with cost notes:

- **PNG** — rendered via headless Chromium (Playwright) at 2× pixel density. Fast (~5 s). Good for Slack / Twitter / pitch decks.
- **PDF** — rendered via Chromium print-to-PDF, US Letter or A4 portrait. Fast (~5 s). Good for print and email.
- **Companion CSV** — the hero + supporting stats + main-visual data in a flat table. Fast (~1 s). Good for fact-checkers.

If Playwright / Chromium is unavailable in the sandbox, fall back to `weasyprint` (HTML → PDF only; no PNG). Document the fallback in the output description if it fires.

Save exports with matching names:

```
outputs/
  <slug>-infographic.html   # always
  <slug>-infographic.png    # opt-in
  <slug>-infographic.pdf    # opt-in
  <slug>-data.csv           # opt-in
```

### Step 9 — Save and describe

Share a `computer://` link to the HTML file and any opt-in exports. Give a 2–3 sentence description:

- The hero number and what it means.
- Which palette was chosen and why.
- Any invariant that materially shaped the output (China composite choice, rankings fallback).

### Step 10 — Offer refinements

Offer four specific levers:
- Different hero stat ("what if we lead with the Africa–Europe intensity gap instead?").
- Different main visual ("swap the time series for a map?").
- Palette swap ("try Meadow instead of Ember?").
- Emphasis shift ("shrink the headline, grow the hero?").

## Composition with other skills

- **`faostat-map`** — called when the main visual is a choropleth. Pass `palette`, `disaggregate_china=true`, `output_format='svg'`. Map skill returns an SVG string to paste inline.
- **`faostat-analytical-brief`** — separate deliverable. An infographic is *not* a slimmed-down brief; the brief keeps the dense information-per-pixel house style with a data appendix. Infographic is sparse, single-page, visual-first.
- **`faostat-story`** — sibling. A story is long-form prose with charts interspersed; an infographic collapses the same subject into one page. They can share data pulls but not layouts.

## Error handling

- **Empty `faostat_get_data` payload** — retry with comma year list (invariant 2); if still empty, widen the year range by ±2 years and note the adjustment in the source footer.
- **`requires_confirmation` on `faostat_search_codes`** — stop and ask the user via `AskUserQuestion`. Do not guess.
- **`faostat_get_rankings` HTTP 500** — fall back to `faostat_get_data` across all reporting countries and sort client-side. Note in the source footer: "Rankings reconstructed client-side".
- **Playwright / Chromium unavailable** — fall back to `weasyprint` for PDF; skip PNG and tell the user the sandbox lacks the headless-browser runtime.
- **Google Fonts CDN blocked** — inline a system font stack as fallback: `-apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif` for body and `Georgia, 'Times New Roman', serif` for hero. Note the fallback.
- **User asks to add FAO branding (logo, masthead, "Required citation: FAO")** — push back. Explain that the infographic skill drops FAO branding by design so the output isn't mistaken for an FAO publication. The CC-BY-4.0 data attribution in the source footer is sufficient and legally required. Only proceed if the user explicitly overrides.
- **User asks for multiple hero stats** — push back. Invariant 7: one hero. Offer to turn the second would-be-hero into a supporting stat, or to build a second infographic.
- **User asks for a second chart (rankings, second time series, composition + map, etc.)** — push back. Invariant 8: one main visual. Offer (a) to promote the new chart to the main visual and demote the current one, (b) to render the ranking/composition as a plain numbered list or a small numeric table with no bar indicators, or (c) to split into two infographics.
- **Urge to label a chart "AR5 GWP-100", "CO2eq", "kt", etc.** — push back. Invariant 9: jargon belongs only in the source footer. Rewrite the label in plain English and add the methodology clause to the footer.

## Suggested citation

```
Prepared by [Author]. [YYYY]. [Headline]. Infographic based on FAOSTAT data, accessed [Month YYYY]. Licence: CC-BY-4.0.
```

Not "Required citation: FAO. …". Any such line is a bug.

## Related Skills

| If you need… | Use |
|---|---|
| Standalone interactive chart | `/faostat-viz` |
| Narrative data article | `/faostat-story` |
| Policy document | `/faostat-analytical-brief` |
| Academic paper with figures | `/faostat-scientific-paper` |
