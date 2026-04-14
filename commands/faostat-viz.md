---
description: Generate interactive HTML charts from FAOSTAT data (line, bar, scatter, stacked bar)
argument-hint: <what to visualize, e.g. "wheat production trends for top 5 producers">
---

Invoke the `faostat-viz` skill to handle this request. The skill queries FAOSTAT data (or uses data already in conversation context), selects the appropriate chart type, and generates a standalone interactive HTML chart with Chart.js.
