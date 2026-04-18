# FAOSTAT Skills

[![npm version](https://img.shields.io/npm/v/faostat-skills)](https://www.npmjs.com/package/faostat-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-blueviolet)](https://claude.com/claude-code)
[![Codex](https://img.shields.io/badge/Codex-compatible-green)](https://openai.com)

AI-powered analysis skills for the [UN FAOSTAT](https://www.fao.org/faostat/en/#data) database, the world's most comprehensive source of food and agriculture statistics. These platform-agnostic skills guide your AI assistant through multi-step analytical workflows: country food security profiles, trade dependency analysis, commodity deep dives, agrifood climate assessments, and data-driven storytelling.

**Works with:** Claude Code, OpenAI Codex, and any AI assistant that supports the `SKILL.md` format.

### Quick Start

**Claude Code**
```bash
# 1. Add this repo as a marketplace (one-time)
/plugin marketplace add berba-q/faostat-skills

# 2. Install
claude plugin install faostat-skills@faostat
```

**OpenAI Codex**
```bash
git clone https://github.com/berba-q/faostat-skills.git ~/.agents/skills/faostat-skills
```

**Other AI assistants** — copy the `skills/` directory to wherever your tool discovers skill files. Consult your provider's documentation for the correct skills directory path.

Once installed, try asking:
```
"Give me a food security profile for Kenya"
"Compare wheat yields in France, USA, and India"
"How dependent is Egypt on wheat imports?"
```

## Prerequisites

The [FAOSTAT MCP Server](https://github.com/berba-q/faostat-mcp) must be installed and configured before using these skills.

```bash
pip install faostat-mcp
```

Then configure your credentials (one-time setup) by asking your AI assistant:
> "Set up FAOSTAT with my credentials"

## Installation

### Claude Code

Claude Code uses a marketplace model. Add this repo as a marketplace source once, then install:

```bash
# Step 1 — add marketplace (one-time setup)
/plugin marketplace add berba-q/faostat-skills

# Step 2 — install the plugin
claude plugin install faostat-skills@faostat
```

To update to a new version later:
```bash
claude plugin update faostat-skills@faostat
```

### OpenAI Codex

Clone this repo into your Codex skills directory:

```bash
git clone https://github.com/berba-q/faostat-skills.git ~/.agents/skills/faostat-skills
```

Or symlink the skills directory:

```bash
ln -s /path/to/faostat-skills/skills ~/.agents/skills/faostat
```

### Other AI Assistants

Copy the `skills/` directory to wherever your AI tool discovers skill files. Each skill is a self-contained `SKILL.md` with YAML frontmatter and markdown instructions.

## Available Skills

### Tier 1: Core Analysis

| Skill | Command | Description |
|-------|---------|-------------|
| **Country Food Security Profile** | `/faostat-country-profile` | Comprehensive food security assessment — production, trade, nutrition, and risk indicators for any country |
| **Comparative Agricultural Analysis** | `/faostat-compare` | Side-by-side comparison of agricultural metrics for two or more specific named entities |
| **Commodity Deep Dive** | `/faostat-commodity` | Complete global briefing for any commodity — production rankings, yield trends, trade flows |
| **Trade Dependency Analyzer** | `/faostat-trade` | Import dependence assessment with self-sufficiency ratios and supply chain risk indicators |
| **Agrifood Climate Analyzer** | `/faostat-climate` | Climate-agriculture nexus analysis — emissions profiles, temperature trends, land use, inputs-emissions links |
| **Agricultural Trend Monitor** | `/faostat-trends` | Identify biggest changes and anomalies in agricultural data over a time window |

### Tier 2: Outputs

| Skill | Command | Description |
|-------|---------|-------------|
| **Choropleth Map** | `/faostat-map` | Interactive world map of any FAOSTAT country-level metric |
| **Data Visualizer** | `/faostat-viz` | Interactive Chart.js HTML charts — use when the chart itself is the deliverable |
| **Infographic** | `/faostat-infographic` | Shareable single-page visual summary for social, press, or pitch decks |
| **Data Storyteller** | `/faostat-story` | Data-driven narrative article with embedded charts for research |
| **Analytical Brief** | `/faostat-analytical-brief` | Multi-page policymaker-facing brief in FAOSTAT house style (PDF + xlsx appendix) |
| **Scientific Paper** | `/faostat-scientific-paper` | Peer-reviewable IMRaD research paper (docx + xlsx + bib) |

### Tier 3: Utilities

| Skill | Command | Description |
|-------|---------|-------------|
| **Data Export** | `/faostat-export-dataset` | Clean tabular data bundle (xlsx + csv + data dictionary) — when data itself is the deliverable |
| **FAOSTAT Explorer** | `/faostat-explore` | Guided discovery of FAOSTAT's data catalog with sample data and explanations |

## Examples

```
> Give me a food security profile for Kenya

> Compare wheat yields in France, USA, and India over the last 10 years

> Tell me everything about global rice production and trade

> What are the agrifood emissions for Brazil? How do they compare per capita?

> How dependent is Egypt on wheat imports?

> Chart the top 10 maize producers over the last 20 years

> What's changed most in African agriculture over the last 5 years?

> Help me write a data story about the global avocado boom

> What data does FAOSTAT have about fertilizers?
```

## FAOSTAT Domain Reference

Key domains used by these skills:

| Domain | Content |
|--------|---------|
| **QCL** | Crops and Livestock Products (production, area, yield) |
| **TM** | Trade Matrix (import/export by partner) |
| **FBS** | Food Balance Sheets (supply/demand for 360+ foods) |
| **FS** | Food Security indicators |
| **GT** | Emissions Totals — agrifood systems (broadest scope) |
| **GCE** | Emissions from crops only |
| **GF** | Forest emissions/removals — sinks, net conversion |
| **EI** | Emissions Intensities |
| **EM** | Emissions Indicators (shares, per capita, per value) |
| **ET** | Temperature Change |
| **RL** | Land Use |
| **RFN/RFM/RFB** | Fertilizers |
| **RP/RT** | Pesticides use and trade |

## Architecture

```
FAOSTAT Skills (this repo)          FAOSTAT MCP Server (separate)
┌────────────────────────┐          ┌────────────────────────┐
│ 9 platform-agnostic    │  uses    │ 21 MCP tools           │
│ SKILL.md workflows     │────────→ │ Published on PyPI      │
│                        │          │ v1.2.2 · stable        │
└────────────────────────┘          └────────────────────────┘
```

Skills orchestrate the MCP server's tools into multi-step analysis workflows. They encode FAOSTAT domain expertise so users can easily interact with the FAOSTAT data.

## Project Structure

```
faostat-skills/
├── skills/                     ← Core: platform-agnostic SKILL.md files
│   ├── country-profile/
│   ├── compare/
│   ├── commodity/
│   ├── trade/
│   ├── trends/
│   ├── climate/
│   ├── viz/
│   ├── story/
│   └── explore/
├── .claude-plugin/             ← Claude Code packaging
├── .agents/skills/             ← OpenAI Codex packaging (symlink)
├── commands/                   ← Claude Code slash commands
├── README.md
└── LICENSE
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-skill`)
3. Follow the existing SKILL.md format (YAML frontmatter + markdown instructions)
4. Test the skill with a real FAOSTAT MCP server connection
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [FAOSTAT MCP Server](https://github.com/berba-q/faostat-mcp) — The MCP server these skills are built on
- [FAOSTAT](https://www.fao.org/faostat/en/#data) — The UN FAO FAOSTAT database
