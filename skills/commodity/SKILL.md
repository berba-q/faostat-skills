---
name: faostat-commodity
description: Use when the user asks about a specific crop or commodity — global production, top producers, yield trends, trade flows, or a commodity briefing. Keywords — commodity, crop, wheat, rice, maize, coffee, cocoa, soybean, sugar, cotton, palm oil, production rankings, top producers, yield, trade, global supply, briefing, deep dive. Do NOT use for side-by-side entity comparison → `faostat-compare`. Do NOT use for a country food security profile → `faostat-country-profile`. Do NOT use for trend ranking across commodities → `faostat-trends`.
---

# Commodity Deep Dive

Produce a comprehensive global briefing for a specific agricultural commodity using FAOSTAT data. The output is a structured, data-driven document a reader can consume in ~2 minutes and come away with the essential picture: where it's produced, how efficiently, where it flows, and what's changing.

## Prerequisites

This skill uses these FAOSTAT MCP tools:
- `faostat_search_codes`
- `faostat_get_data`
- `faostat_get_rankings` (sometimes unreliable — see Step 3)

If the MCP is not connected, tell the user: "This skill requires the FAOSTAT MCP server to be connected."

## Orientation — the shape of the end product

Before following the steps, hold the target in mind. The briefing has four required sections plus up to two optional sections, determined by what kind of commodity it is:

- **Required**: Global Production Overview, Yield Trajectories, Trade Flows, Historical Context & Outlook
- **Optional**, depending on commodity type: Consumption & Food Security (for food staples), Price Dynamics (for volatile cash crops), Use Breakdown (for feed grains/oilseeds)

Knowing the shape up front helps you decide how much depth each data pull needs and avoid over-fetching.

## Workflow

### Step 1: Identify and resolve the commodity

Extract the commodity name from the user's request, or ask if not specified. Accept common names ("wheat", "coffee", "palm oil", "cocoa beans").

Call `faostat_search_codes(domain_code='QCL', dimension_id='item', query='<commodity_name>')`.

**Handle the response based on context:**

- **Single match** (`requires_confirmation: false`) — proceed with the returned item code.

- **Multiple matches** (`requires_confirmation: true`) — how you resolve depends on whether a user is available:
  - *Interactive flow (a user can reply):* present all matching options and ask the user to choose. Wait for their answer. This is the correct behavior for slash-command / chat use.
  - *Unattended flow (running inside an agent, script, or pipeline with no interactive user):* pick the canonical item — usually the bare commodity name (e.g., "Rice, paddy" over "Rice, milled"; "Wheat" over "Buckwheat"; "Cocoa beans" over a cocoa derivative). Record the choice you made and surface it in the methodology footer of the final briefing so the reader knows. Do not silently assume.

- **No matches** — try a broader or synonym query (e.g., "maize" → "corn"; "soybean" → "soy") before giving up.

Store the confirmed `item` code and move on.

### Step 2: Classify the commodity (lightweight)

Before pulling data, classify the commodity into one of three broad types. This determines which optional section to include later. Use your judgment from general knowledge — the classification is a lightweight hint, not a rigid taxonomy:

- **Food staple** — direct human caloric staple (wheat, rice, maize as food, cassava, potatoes, sorghum, millet, pulses, bananas). Plan to include a *Consumption & Food Security* section.
- **Traded cash crop** — primarily exported or industrially used, often price-volatile (coffee, cocoa, cotton, rubber, sugar, tea, oil palm, tobacco, vanilla, spices). Plan to include a *Price Dynamics* section.
- **Feed grain / oilseed** — significant feed or crushing/oil use (soybeans, maize when discussing feed/biofuel context, rapeseed, sunflower, barley, sorghum at scale). Plan to include a *Use Breakdown* section.

If the commodity fits more than one category (maize is both a food staple and a feed grain), pick the framing most likely to interest a generalist reader of a global briefing — usually trade/price for globally-traded commodities, consumption for domestic-staple-dominated ones. When unsure, default to food-staple treatment for cereals and pulses, cash-crop treatment for everything else.

### Step 3: Pull global production rankings

You need the top 10 producers by volume in the most recent reporting year.

**Start with** `faostat_get_rankings` — it's the purpose-built tool:

```
faostat_get_rankings(
  domain_code='QCL',
  element_code='5510',     # DISPLAY code for Production (not '2510')
  item_code='<item_code>',
  year='<recent_year>',     # try current year − 2; step back if empty
  limit=10,
  response_format='objects'
)
```

**If `faostat_get_rankings` returns an HTTP 500 or other error** (this happens — the endpoint is intermittently unreliable), fall back to pulling all countries via `faostat_get_data` and sorting client-side:

```
# Resolve element at runtime: faostat_search_codes(domain_code='QCL', dimension_id='element', query='production') → e.g. 2510
faostat_get_data(
  domain_code='QCL',
  item='<item_code>',
  element='<resolved_production_code>',
  year='<recent_year>',
  response_format='compact',
  limit=300,                # cover all reporter countries
  show_unit=True
)
```

Then sort the returned rows by value descending and take the top 10. Exclude regional aggregates (rows where the area is "World", "Africa", "Asia", "Europe" etc.) — keep only country-level entries.

**Year selection:** reporting lags mean the current year and the prior year are usually incomplete. Start at *current year − 2*; if the result is empty or sparse, step back to year − 3. Record the year you ultimately used.

**Important code-system note:** `faostat_get_rankings` uses DISPLAY element codes (Production = `5510`). `faostat_get_data` uses FILTER element codes (Production = `2510`, Area harvested = `2312`, Yield = `2413`). These are different code systems — don't mix them.

> Element codes above are verified hints. Resolve at runtime via `faostat_search_codes` before use.

### Step 4: Pull annual yield, production, and area series for the top 5

For each of the top 5 producers from Step 3, pull a full 10-year annual series rather than just endpoints. This is worth the extra rows because year-to-year volatility (droughts, disease outbreaks, policy shocks) is part of the story and a 2-point comparison can hide it.

Three calls, each for the top-5 area codes as a comma-separated list:

```
# Resolve elements at runtime:
# faostat_search_codes(domain_code='QCL', dimension_id='element', query='production') → e.g. 2510
# faostat_search_codes(domain_code='QCL', dimension_id='element', query='area harvested') → e.g. 2312
# faostat_search_codes(domain_code='QCL', dimension_id='element', query='yield') → e.g. 2413

# Production
faostat_get_data(domain_code='QCL', area='<top5_area_codes>', item='<item_code>',
                 element='<resolved_production_code>', year='2014:2023', response_format='compact',
                 limit=100, show_unit=True)

# Area harvested
faostat_get_data(domain_code='QCL', area='<top5_area_codes>', item='<item_code>',
                 element='<resolved_area_harvested_code>', year='2014:2023', response_format='compact',
                 limit=100, show_unit=True)

# Yield
faostat_get_data(domain_code='QCL', area='<top5_area_codes>', item='<item_code>',
                 element='<resolved_yield_code>', year='2014:2023', response_format='compact',
                 limit=100, show_unit=True)
```

Update the year window if you used a different reference year in Step 3 (aim for a 10-year window ending at your reference year).

### Step 5: Pull aggregate trade flows

**Use the `TCL` domain** (Trade — Crops and Livestock Products) for aggregate country-level import and export totals. TCL gives you each country's total exports and total imports of the commodity as single rows — which is what you need for a top-exporters and top-importers table.

```
# Resolve elements at runtime:
# faostat_search_codes(domain_code='TCL', dimension_id='element', query='export value') → e.g. 5922
# faostat_search_codes(domain_code='TCL', dimension_id='element', query='import value') → e.g. 5622

# Top exporters by value (or switch to quantity element resolved via faostat_search_codes)
faostat_get_data(domain_code='TCL', item='<item_code>',
                 element='<resolved_export_value_code>',
                 year='<recent_year>', response_format='compact',
                 limit=200, show_unit=True)

# Top importers
faostat_get_data(domain_code='TCL', item='<item_code>',
                 element='<resolved_import_value_code>',
                 year='<recent_year>', response_format='compact',
                 limit=200, show_unit=True)
```

Then filter to country-level rows and sort to get the top 10 of each. If the QCL item code doesn't return TCL data, use `faostat_search_codes(domain_code='TCL', dimension_id='item', query='<commodity_name>')` to find the TCL item code (they usually but not always match QCL).

**When to use `TM` instead:** the TM (Trade Matrix) domain is for *bilateral* flows — "how much did Country A export to Country B?". Use TM only if the user explicitly asks for bilateral flows, origin-destination pairs, or supply-chain mapping. For the standard top-exporters/top-importers ranking, TCL is correct.

**Year:** trade data often lags production by an additional year. If your production reference year returns no TCL data, step back one more year.

### Step 6: Pull commodity-type-specific data (optional section)

Based on the classification from Step 2, pull one additional dataset:

**Food staple — Consumption & Food Security:** pull Food Balance Sheet data via the `FBS` domain. Look for food supply (kg/capita/yr), calories (kcal/capita/day), and protein (g/capita/day) at the world level plus the top 5 producer/consumer countries.

```
# Resolve element at runtime: faostat_search_codes(domain_code='FBS', dimension_id='element', query='food supply') → e.g. 645 / 664 / 674
faostat_get_data(domain_code='FBS', item='<fbs_item_code>',
                 element='<resolved_food_supply_code>', year='<recent_year>',
                 response_format='compact', limit=50, show_unit=True)
```

You'll need to resolve the FBS item code separately via `faostat_search_codes(domain_code='FBS', dimension_id='item', query='<commodity>')` — FBS items are typically named "X and products" and have different codes from QCL.

**Cash crop — Price Dynamics:** pull producer-price series via the `PP` domain for the top 5 producers over the last 5 years. Report year-over-year changes and note any recent shocks.

```
# Resolve element at runtime: faostat_search_codes(domain_code='PP', dimension_id='element', query='producer price') → e.g. 5532
faostat_get_data(domain_code='PP', area='<top5_area_codes>', item='<item_code>',
                 element='<resolved_producer_price_code>',
                 year='<5yr_range>', response_format='compact',
                 limit=100, show_unit=True)
```

**Feed grain / oilseed — Use Breakdown:** pull FBS use categories (food, feed, seed, processing, losses, other) for the most recent FBS year to show the feed-vs-food split and any industrial processing share.

If the dataset is unavailable or sparse for the commodity, skip the optional section and note the limitation in the methodology footer. The briefing should still work with just the four required sections.

### Step 7: Compose the briefing

Structure the output exactly as follows.

**Title:** `# Commodity Briefing: [Commodity Name]` — this specific wording is how users recognize the skill's output.

**1. Global Production Overview**
- Total global production (most recent year) and the year used
- Top 10 producers ranked by volume, with share of global total — present as a table
- Concentration: top 3 share, top 5 share
- Regional composition (one-line summary of continental shares)

**2. Yield Trajectories**
- Annual yield and area series for top 5 producers over the 10-year window — present as a compact table with one row per country showing yield at multiple anchor years (e.g., 2014, 2018, 2021, 2023) or a full series if space permits
- Narrative on which countries are improving, plateauing, or declining
- Whether production growth is coming from yield intensification or area expansion for each

**3. Trade Flows**
- Top 10 exporters (country + volume or value)
- Top 10 importers (country + volume or value)
- Net trade position of top producers (self-consuming vs. export-oriented)
- Any notable trade dependencies, concentration risks, or recent policy disruptions

**4. Historical Context & Outlook**
- Decade-over-decade production shift (which regions gained/lost share)
- Emerging producers with the fastest growth
- Key risks: concentration, climate vulnerability, disease, policy, trade dependency
- A brief note on the commodity's global significance (food staple, cash crop, animal feed, etc.)

**Optional section** (include exactly one, based on Step 2 classification):

- *(Food staple)* **5. Consumption & Food Security** — per-capita food supply, calories, and protein contribution globally and for largest consumers; notable deficit regions.
- *(Cash crop)* **5. Price Dynamics** — producer prices for top 5 over last 5 years; yoy changes; recent supply or policy shocks visible in the price series.
- *(Feed / oilseed)* **5. Use Breakdown** — food vs. feed vs. processing vs. other uses as shares of domestic supply.

End the briefing with a methodology footer and source line:

```
### Methodology & Data Notes
- Production & yield: FAOSTAT QCL, item <code>, year <Y>. (Note any fallbacks used, e.g., "faostat_get_rankings returned errors; rankings were reconstructed by sorting faostat_get_data output client-side.")
- Trade: FAOSTAT TCL, year <Y>.
- [Optional-section data source, if used.]
- Disambiguation choice: [if unattended flow, note which item code was chosen and why.]

> Source: FAOSTAT (FAO), accessed <YYYY-MM-DD>. Production rankings and trade data may reflect reporting lags of 1-3 years.
```

Do not omit the source line — it's how users verify figures and know when the data was pulled.

## Important Rules

**Element and item code resolution.** Never use a hardcoded numeric element or item code as the primary value in a `faostat_get_data` call. Always resolve at runtime: `faostat_search_codes(domain_code='<dom>', dimension_id='element', query='<metric name>')` for elements; `faostat_search_codes(domain_code='<dom>', dimension_id='item', query='<item name>')` for items. Numeric codes shown in reference tables and code examples are verified hints — use them to validate the search result, not as the authoritative source. Domain letter-codes (QCL, TCL, GT, EM, FBS, FS…) are stable and may be used directly.

## Error handling and reliability notes

- **`faostat_get_rankings` returns HTTP 500 intermittently.** This is the most common failure you'll hit. The Step 3 fallback (pull all countries with `faostat_get_data` and sort client-side) is the documented workaround. Don't spend many retries on the rankings endpoint — try once, fall back, and move on.
- **Empty / sparse most-recent year.** FAOSTAT reporting lags differ by country and domain. If your target year returns few rows, step back one year at a time (up to 3 tries) before giving up.
- **Partial yield data for some top-5 countries.** If yield or area data is missing for one of the top producers, report what you have and note the gap — don't extrapolate.
- **TCL unavailable for a commodity.** Some less-traded items (e.g., cassava) have thin TCL coverage. If the Trade Flows section has to be short, say so and fill with domestic-consumption framing.

## Output format notes

Lead with the production rankings table for immediate impact. Follow with narrative prose for each section, using tables only where ranked or time-series data benefits from them. Keep section lengths roughly proportional to the amount of data — don't pad. Aim for a briefing that gives a reader the full picture in under 2 minutes of reading.

## Related Skills

| If you need… | Use |
|---|---|
| Side-by-side producer comparison | `/faostat-compare` |
| Biggest movers over time | `/faostat-trends` |
| Import dependency for this commodity | `/faostat-trade` |
| Country food security context | `/faostat-country-profile` |
