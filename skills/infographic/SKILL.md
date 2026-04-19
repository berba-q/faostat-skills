---
name: faostat-infographic
description: Use when the user wants a modern, non-expert-facing visual summary of FAOSTAT data on a single page — an infographic, one-pager, visual summary, explainer card, or shareable graphic for social, pitch decks, or press use. The deliverable is a standalone HTML file with inline SVG (optional PNG/PDF export). Aesthetic — Visual Capitalist / Our World in Data explainer cards / Statista — bold typography, generous whitespace, one hero stat, iconography over chart axes. Do NOT use when the user asks for an analytical brief, policy brief, FAOSTAT brief, or policymaker-facing document → route to `faostat-analytical-brief`. Do NOT use for a data story, article, long-read, or explainer with paragraphs → route to `faostat-story`. Do NOT use for academic papers or dense chart-per-finding reports. Do NOT use when the user wants a standalone interactive chart only → use `faostat-viz`.
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
7. **Element and item code resolution.** Never use a hardcoded numeric element or item code as the primary value in a `faostat_get_data` call. Always resolve at runtime: `faostat_search_codes(domain_code='<dom>', dimension_id='element', query='<metric name>')` for elements; `faostat_search_codes(domain_code='<dom>', dimension_id='item', query='<item name>')` for items. Numeric codes shown in reference tables and code examples are verified hints — use them to validate the search result, not as the authoritative source. Domain letter-codes (QCL, TCL, GT, EM, FBS, FS…) are stable and may be used directly.

Infographic-specific invariants:

8. **One hero stat.** There is exactly one hero number on the page. If you're torn between two, pick the more surprising one and push the other into the supporting-stats row.
9. **One main visual.** Exactly one chart, map, or diagram. Rankings and compositions that would otherwise become a second chart render as a plain bulleted list or a small numeric table with no bar-width indicators. See Step 3 for the decision tree.
10. **Jargon only in the source footer.** `AR5`, `AR5 GWP-100`, `CAGR`, `n.e.c.`, `FILTER code`, `DISPLAY code`, `LULUCF`, bare `CO2eq`, `kt`/`Mt`/`Gt` on first reference, and numeric FAOSTAT element/item codes stay in the source footer. Not in visual titles, subtitles, chart labels, captions, or headlines.
11. **Ten-second test.** Read the page aloud in 10 seconds — can a non-expert recite the main point? If not, shrink the headline or enlarge the hero.
12. **No FAO branding.** Retain CC-BY-4.0 data attribution ("Data: FAOSTAT (FAO), CC-BY-4.0"), but do not reproduce the FAO logo, "Food and Agriculture Organization of the United Nations" masthead, ISSN, "FAO Statistics Division" stamp, or "Required citation: FAO. …" line. The infographic is the analyst's, not FAO's.

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

**Two-tier icon selection rule:** choose by *stat type first* (what kind of number is this?), then by *domain* (what is it about?) when the stat type doesn't resolve it.

Stat-type icons (use these before anything domain-specific):

| Stat type | Icon | Notes |
|---|---|---|
| Monetary value (USD, EUR, etc.) | `banknote` | Any dollar/price figure. Do NOT use `ship` for export *value*. |
| Growth rate / percentage change | `trending-up` or `trending-down` | Sign-aware: use `trending-down` for negative. |
| Share / concentration / % of total | `pie-chart` | "59% shipped by top 5" → `pie-chart`, not `ship`. |
| Record / all-time peak | `flame` | "2024 was the peak year" → `flame`, not `calendar`. |
| Ranking / #1 / leader | `trophy` | "Russia is the top exporter" → `trophy`. |
| Milestone / threshold crossed | `zap` | Sudden change, tipping point. |
| Count / number of entities | `hash` | "10 countries account for…" |
| Year / time reference (non-record) | `calendar` | Only when the year itself is the fact, not the record it holds. |
| Physical quantity shipped/moved | `package` | Export *volume* (tonnes, litres). NOT `ship` — `ship` is the vessel. |

Domain icons (use when the stat type is already resolved by the Lucide icon above, or when you need a second icon):

| Domain | Icon |
|---|---|
| Agrifood emissions / GHG | `cloud` |
| Crop production | `wheat` |
| Trade route / logistics | `ship` (only for the concept of shipping, e.g. a section header) |
| Temperature / warming | `thermometer-sun` |
| Producer price / CPI | `coins` |
| Yield / efficiency | `sprout` |
| Livestock | `beef` |
| Water | `droplet` |
| Land | `mountain` |
| Food security / hunger | `utensils` |
| Forest / land cover | `trees` |

### Design principles

These principles are extracted from best-in-class data journalism infographics. Apply them every time:

1. **Narrative arc.** Every infographic tells a complete arc: *scale the problem → show the data → land the implication*. Plan the arc in Step 2 before pulling data. If the data doesn't support the arc, reframe — don't just display numbers.
2. **Progressive disclosure.** A reader stopping after 5 s gets the hero. One stopping after 15 s gets the supporting stats. One reading fully gets the chart and takeaway. Each layer adds detail without requiring the previous layer to be re-read.
3. **Data-ink ratio.** Remove every visual element that doesn't carry a data signal. No decorative borders, no 3-D effects, no unnecessary tick marks, no legend if labels on the data suffice.
4. **Icon as cognitive anchor.** Icons beside supporting stats aren't decoration — they help readers recall the number later. Every supporting stat gets exactly one Lucide icon; the icon carries semantic meaning (not generic icons like `star` or `check`).
5. **Whitespace as structure.** Margins and padding do the job of dividers. Don't add horizontal rules or coloured bands — generous padding between sections is cleaner.
6. **Typography does the heavy lifting.** The hero number should be readable from arm's length. If a reader needs to lean in to read the hero, it's too small.

### Animations (HTML only)

Scroll-triggered, zero external dependencies — `IntersectionObserver` + CSS transitions + inline JS. Every animation must respect `prefers-reduced-motion: reduce` via a single early-return guard.

**Hero counter** — the hero number counts from 0 to its final value over 1.2 s (ease-out cubic). Store the numeric portion in `data-value` on `.hero-stat`; keep unit and prefix in separate `<span>` elements so only the digit string animates.

**Supporting-stats cascade** — each `.stat` card starts invisible (`opacity: 0; transform: translateY(16px)`) and transitions in with a 100 ms stagger as the section enters the viewport.

**Bar chart draw** — each bar `<rect>` starts at `width="0"` (or `height="0"` for horizontal). Set the target dimension via a CSS custom property; transition to it over 0.8 s with 50 ms per-bar stagger.

**Line chart draw** — set `stroke-dasharray` equal to the path's `getTotalLength()` at paint time; start `stroke-dashoffset` at that same value and transition to `0` over `1.4s cubic-bezier(0.25, 1, 0.5, 1)`. Triggered by an `IntersectionObserver` adding `.visible`.

**Hero glow pulse** (Ember palette only) — a repeating `box-shadow` keyframe on the hero stat container. Fades an amber glow in and out over 2 s. Omit on Meadow and Ink — those topics don't warrant urgency drama.

Standard JS boilerplate (inline `<script>` at end of `<body>`):

```javascript
document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      if (e.target.classList.contains('hero-stat')) _counter(e.target);
      if (e.target.dataset.draw) _drawPath(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.hero-stat, .stat, [data-draw]').forEach(el => io.observe(el));

  function _counter(el) {
    const end = parseFloat(el.dataset.value);
    const decimals = (String(end).split('.')[1] ?? '').length;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / 1200, 1);
      const v = (end * (1 - Math.pow(1 - p, 3))).toFixed(decimals);
      el.querySelector('.counter-value').textContent = v;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function _drawPath(el) {
    const len = el.getTotalLength ? el.getTotalLength() : parseFloat(el.dataset.draw);
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    el.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.25,1,.5,1)';
    requestAnimationFrame(() => { el.style.strokeDashoffset = 0; });
  }
});
```

CSS additions inside `<style>`:

```css
@media (prefers-reduced-motion: no-preference) {
  .stat { opacity: 0; transform: translateY(16px);
          transition: opacity .5s ease, transform .5s ease; }
  .stat.visible { opacity: 1; transform: none; }
  .stat:nth-child(2) { transition-delay: .1s; }
  .stat:nth-child(3) { transition-delay: .2s; }
  .stat:nth-child(4) { transition-delay: .3s; }

  /* Ember palette hero pulse */
  body.palette-ember .hero-stat {
    animation: _glow 2s ease-in-out infinite;
  }
  @keyframes _glow {
    0%, 100% { box-shadow: 0 0 0 transparent; }
    50%       { box-shadow: 0 0 52px rgba(246,163,63,.30); }
  }
}
```

Add `class="palette-ember"` (or `palette-meadow` / `palette-ink`) to `<body>` to activate the correct palette-scoped animation rules.

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
- **Biggest delta over the window** (e.g., "+127 % in aquaculture output since 2000", "+48.8 % in pre- and post-production emissions since 2001", "wheat yield in the EU grew 3× faster than Sub-Saharan Africa over 30 years")
- **Most extreme ratio** (e.g., "4× gap in cattle-meat emissions intensity between Africa and Europe", "top 5 countries account for 72 % of global wheat production")
- **Most surprising ranking** (e.g., "India overtook the US as the world's top rice exporter in 2021", "top 10 emitters = 55 % of world total")
- **A number at the edge of intuition** (e.g., "815 million people undernourished — roughly 1 in 10", "16.5 billion tonnes of CO₂-equivalent", "Brazil's soybean exports tripled in 20 years")

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

Apply invariants 1–7. Log every `faostat_get_data` call if the user asked for the companion CSV.

- Use `response_format='compact'`, `show_unit=True`.
- Pass the element as a FILTER code.
- Use comma year lists.
- For trade aggregates: TCL; never sum TM.
- For China in rankings / country-level numbers: composite 351 by default, unless the user opted into 41.
- For the map path: disaggregate — area 41 + HKG 96 + MAC 128 + TWN 214, drop 351.
- For top-N: prefer `faostat_get_rankings` (DISPLAY codes); if HTTP 500, fall back to `faostat_get_data` across all reporting countries and sort client-side.
- **Emissions indicators — always fetch from EM domain, never compute.** Resolve element codes at runtime before calling `faostat_get_data`: `faostat_search_codes(domain_code='EM', dimension_id='element', query='per capita')` for per-capita (verified `7279`); `faostat_search_codes(domain_code='EM', dimension_id='element', query='share CO2eq')` for share of national total (verified `726313`). Also filter by item — `6518` for agrifood systems total, `6996` farm gate, `6516` land-use change, `6517` pre- and post-production. Do NOT divide GT totals by population or otherwise reconstruct these metrics.
- **Unfamiliar topic or domain:** Call `faostat_list_domains()` to browse all available FAOSTAT domains, identify the right one(s) for the topic, then call `faostat_search_codes(domain_code='<dom>', dimension_id='element', query='<metric>')` and `faostat_search_codes(domain_code='<dom>', dimension_id='item', query='<item>')` to resolve codes. Do not guess domain codes — the infographic skill works with any FAOSTAT domain, not just emissions.

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

Single self-contained file. Inline CSS and inline SVG. One external resource allowed: the Google Fonts stylesheet. Include the animation boilerplate from the **Animations** section of the Visual system.

HTML structure template (with animation hooks):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Headline]</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter:wght@400;500;700;900&family=IBM+Plex+Mono:wght@500&display=swap">
  <style>
    /* 1. Palette CSS variables */
    /* 2. Base + typography */
    /* 3. Layout: hero, supporting, visual, takeaway, footer */
    /* 4. Responsive breakpoints (480 / 768 / 1024 px) */
    /* 5. Animation CSS block from Visual system Animations section */
  </style>
</head>
<body class="palette-[ember|meadow|ink]">
  <main>
    <section class="hero">
      <!-- data-value holds the numeric portion only; unit and prefix in sibling spans -->
      <div class="hero-stat" data-value="16.5">
        <span class="counter-value">16.5</span><span class="unit"> bn t CO₂-eq</span>
      </div>
      <h1 class="headline">[Headline ≤ 10 words]</h1>
    </section>
    <section class="supporting">
      <!-- Each .stat starts invisible; IntersectionObserver adds .visible -->
      <div class="stat">
        <svg aria-hidden="true"><!-- Lucide icon inline --></svg>
        <div class="n">+21%</div>
        <div class="cap">since 2001</div>
      </div>
      <!-- 2–3 more .stat cards -->
    </section>
    <section class="visual">
      <!-- Line chart: add data-draw attribute to the <path> element -->
      <svg role="img" aria-label="[descriptive alt text]">
        <path data-draw class="chart-line" d="M..." stroke="var(--hero)" fill="none" stroke-width="3"/>
      </svg>
      <!-- Bar chart: start each <rect> at width="0"; animate width via JS or CSS -->
    </section>
    <p class="takeaway"><em>[One-line so-what, italic]</em></p>
    <footer class="source">Data: FAOSTAT (FAO), accessed [Month YYYY]. Licence: CC-BY-4.0. Domains: [codes]. [China footnote].</footer>
  </main>
  <script>/* Animation boilerplate from Visual system Animations section */</script>
</body>
</html>
```

Responsive breakpoints at 480 / 768 / 1024 px. On mobile the hero shrinks to 72–96 px, supporting stats stack vertically, and the main visual goes full-width.

Accessibility: every SVG gets `role="img"` and a meaningful `aria-label`; decorative icons use `aria-hidden="true"`. Colour contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text. `prefers-reduced-motion` is handled by the animation boilerplate's early-return guard.

### Step 8 — Offer exports

After the HTML is saved, ask the user what additional formats they want. The options, with cost notes:

- **Social media card** — a *separate, purpose-built layout* (not a screenshot of the web infographic). See Social media card rules below.
- **PNG (high-DPI)** — Playwright `page.screenshot()` at `deviceScaleFactor: 3` (retina-quality, 3× pixel density). Good for Slack, social feeds, pitch decks.
- **PDF (vector, default)** — Playwright `page.pdf(print_background=True)`. Text and CSS shapes stay as vectors — suitable for print and email. No extra install needed.
- **PDF (print-grade, opt-in)** — Inkscape CLI converts the extracted inline SVG to a true resolution-independent PDF. Every element scales to any size without aliasing. Requires `inkscape` (`brew install inkscape`). Check availability with `shutil.which('inkscape')` and offer this upgrade silently if found.
- **Companion CSV** — the hero + supporting stats + main-visual data in a flat table. Fast (~1 s). Good for fact-checkers.

If Playwright / Chromium is unavailable, fall back to `weasyprint` (HTML → PDF only). Document any fallback in the output description.

Save exports with matching names:

```
outputs/
  <slug>-infographic.html      # always
  <slug>-infographic.pdf       # opt-in (Playwright page.pdf or Inkscape)
  <slug>-infographic.png       # opt-in (Playwright screenshot, 3× DPI)
  <slug>-social-portrait.html  # social card source (opt-in)
  <slug>-social-portrait.png   # screenshot of the above (opt-in)
  <slug>-social-square.html    # square variant (opt-in)
  <slug>-social-square.png     # screenshot of the above (opt-in)
  <slug>-data.csv              # opt-in
```

#### Social media card rules

A social media card is a **separate HTML file with a fixed, single-screen viewport**. It is NOT a screenshot of the main infographic HTML. The main infographic is a scrollable web page; a social card is a single, non-scrolling frame that looks complete on its own.

**Supported formats:**

| Format | Dimensions | Best for |
|---|---|---|
| Square | 1080 × 1080 px | Instagram feed, Twitter/X |
| Portrait 4:5 | 1080 × 1350 px | Instagram feed (preferred) |
| Stories / Reels | 1080 × 1920 px | Instagram Stories, TikTok |

Default to **portrait 4:5** unless the user specifies otherwise.

**Layout inside the card (portrait 4:5 example):**

```
┌──────────────────────────┐
│  topic pill / eyebrow    │  ← 8% height, small caps, accent color
│                          │
│  HERO NUMBER             │  ← 40% height, full-bleed, ≥ 200 px font
│  unit spelled out        │
│                          │
│  Headline (≤ 8 words)    │  ← 15% height, bold
│  One-line sub-message    │  ← 10% height, lighter weight
│                          │
│  ┌────┐  ┌────┐          │  ← 2 supporting stats max (not 4)
│  │icon│  │icon│          │
│  │stat│  │stat│          │  ← 20% height
│  │cap │  │cap │          │
│  └────┘  └────┘          │
│                          │
│  Source (tiny, muted)    │  ← 7% height
└──────────────────────────┘
```

**CSS rules that make it work:**

```css
html, body {
  width: 1080px;
  height: 1350px;   /* adjust per format */
  overflow: hidden; /* CRITICAL — no scroll; Playwright sees exactly this frame */
  margin: 0;
  background: var(--bg);
}
main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 72px 80px;
  box-sizing: border-box;
}
```

**Content rules (stricter than main infographic):**
- Hero number only — no chart. If the main visual was a line chart, replace it with the start-and-end delta ("from X to Y") as a two-number comparison or drop it entirely.
- Max 2 supporting stats. Pick the 2 most arresting from the main infographic's 4.
- No main visual (chart/map) — the hero + 2 stats fill the card. Exception: a single large donut/ring chart that illustrates a share (e.g., "59% of exports") can replace the 2 supporting stats.
- No takeaway sentence — the sub-message line does that job in ≤ 8 words.
- Source footer is 11 px, muted — just "Data: FAOSTAT (FAO), CC-BY-4.0."

**Visual quality standard — Figma-grade, not webpage-screenshot-grade:**

Social cards must look like a designer built them from scratch — not like a webpage cropped to a square. Target aesthetic: color-blocked, illustration-rich, typographically bold — the premium data journalism studio standard. Required elements:

1. **Color-blocked sections with organic edges.** The hero area is a distinct, richly colored block (not white). Section transitions use curved `clip-path` edges — no flat horizontal dividers.

2. **Background blob shapes.** One or two large abstract blobs positioned behind the hero or stats area add depth without competing with data.

3. **Large decorative SVG illustration.** One topic-appropriate SVG illustration element (100–220 px) anchors the visual — a wheat stalk silhouette for trade, a cloud/smoke form for emissions, a globe outline for geographic topics, a bowl/plate for food security. This is a *decorative* element, not a Lucide icon. It sits in the background at reduced opacity (15–25%) or in a corner at full opacity as a design accent. It gives the eye visual texture between the numbers.

4. **Rich gradient backgrounds.** Hero backgrounds use a linear or radial gradient, not a flat solid fill.

CSS patterns for organic design:

```css
/* Hero section: full-bleed with organic curved bottom */
.hero-section {
  background: linear-gradient(145deg, var(--hero) 0%, var(--accent) 100%);
  clip-path: ellipse(115% 78% at 50% 8%);
  padding: 80px 80px 120px;
  position: relative;
  overflow: hidden;
}

/* Background blob — large organic accent shape */
.blob {
  position: absolute;
  width: 380px; height: 380px;
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  background: var(--accent);
  opacity: 0.18;
  pointer-events: none;
}
.blob-tl { top: -60px; left: -80px; }
.blob-br { bottom: -80px; right: -60px; transform: rotate(45deg); }

/* Stats area: rounded card on contrasting background */
.stats-section {
  background: rgba(255,255,255,0.07);
  border-radius: 28px;
  padding: 44px 48px;
  backdrop-filter: blur(4px);
}

/* Large decorative SVG illustration anchor */
.illus {
  position: absolute;
  opacity: 0.15;
  right: 48px; bottom: 48px;
  width: 180px; height: 180px;
  fill: var(--text);
}
```

SVG illustration guidance: build a simple but bold thematic silhouette in inline SVG. Examples:
- **Wheat/grain trade:** Three wheat stalks, side by side, with stylised grain heads — 5–8 `<path>` elements.
- **Emissions/climate:** A billowing cloud/smoke column rising from a horizon line.
- **Food security/hunger:** A stylised bowl with a spoon, or a globe with fork and knife flanking.
- **Livestock:** A side-profile cow or chicken silhouette, single solid fill.
- **Temperature:** A thermometer with a rising mercury column and radiating lines.

These do NOT need to be photorealistic — geometric, flat-style SVG in 2–3 path shapes is the right aesthetic. Fill with palette `--hero` or `--text` at 15–25% opacity for depth without distraction.

**Screenshotting the card:** use Playwright with `viewport` matching card dimensions exactly and `deviceScaleFactor: 3` for retina-quality output (yields a 3240 × 4050 px PNG at 4:5):

```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(
        viewport={"width": 1080, "height": 1350},
        device_scale_factor=3,   # 3× retina — 3240×4050 output
    )
    page.goto(f"file://{path_to_social_html}")
    page.wait_for_load_state("networkidle")  # wait for Google Fonts
    page.screenshot(path=png_path, full_page=False)  # full_page=False = viewport only
    browser.close()
```

`full_page=False` is critical — it captures exactly the viewport, not the full scrollable document.

#### Export quality pipeline

Three tiers of output, in increasing quality order. Always use the highest tier available.

| Tier | Method | Quality | Requirement |
|---|---|---|---|
| 1 — Screen PNG | Playwright `screenshot()` `deviceScaleFactor: 3` | 3× retina, ~3 MP | Playwright (already required) |
| 2 — Vector PDF | Playwright `page.pdf(print_background=True)` | Vectors for text + CSS shapes | Playwright (already required) |
| 3 — Print PDF | Inkscape CLI `--export-type=pdf` | True SVG vector, resolution-independent | `brew install inkscape` |

**Tier 2 — Playwright `page.pdf()`** (default for all PDF asks):

```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(f"file://{path_to_html}")
    page.wait_for_load_state("networkidle")
    page.pdf(
        path=pdf_path,
        format="A4",              # or "Letter"
        print_background=True,    # CRITICAL — without this, all fills/gradients are stripped
        margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
    )
    browser.close()
```

**Tier 3 — Inkscape CLI** (upgrade silently when `inkscape` is installed; skip if not found):

```python
import subprocess, shutil
from bs4 import BeautifulSoup

def export_via_inkscape(html_path, svg_path, pdf_path):
    # Extract the primary <svg> from the HTML and save standalone
    soup = BeautifulSoup(open(html_path).read(), "html.parser")
    svg = soup.find("svg")
    if not svg:
        return False  # no SVG to extract; fall back to Tier 2
    svg_path.write_text(str(svg))
    subprocess.run([
        "inkscape", str(svg_path),
        "--export-type=pdf",
        f"--export-filename={pdf_path}",
        "--export-dpi=300",
    ], check=True)
    return True

if shutil.which("inkscape"):
    ok = export_via_inkscape(html_path, svg_path, pdf_path)
if not shutil.which("inkscape") or not ok:
    # Fall back to Tier 2
    ...
```

**Quality ceiling without external design tools:**

With Tier 2/3, the output reaches 85–90% of premium data journalism studio quality. The remaining gap is hand-crafted illustration work: character figures, complex flow diagrams, and multi-element scene compositions. Those require a human designer or an interactive vector tool (Figma, Illustrator). Figma, Canva, and Adobe Express are not currently suitable for agent-driven layout generation — they require interactive editing sessions and have no practical programmatic "generate from data" API for arbitrary layouts.

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
- **User asks for multiple hero stats** — push back. Invariant 8: one hero. Offer to turn the second would-be-hero into a supporting stat, or to build a second infographic.
- **User asks for a second chart (rankings, second time series, composition + map, etc.)** — push back. Invariant 9: one main visual. Offer (a) to promote the new chart to the main visual and demote the current one, (b) to render the ranking/composition as a plain numbered list or a small numeric table with no bar indicators, or (c) to split into two infographics.
- **Urge to label a chart "AR5 GWP-100", "CO2eq", "kt", etc.** — push back. Invariant 10: jargon belongs only in the source footer. Rewrite the label in plain English and add the methodology clause to the footer.

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
