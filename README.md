# Scarab Hub / PoE Flipup

A single-page web application for **Path of Exile** that evaluates **vendor recipe profitability** (“flipping”) across several stackable item categories—not only Scarabs. The UI brands the tool as **PoE Flipup**; the repository package name is `scarab-hub`.

## What it does

- Loads **item definitions** from local JSON under `public/data/items/` (and related metadata).
- Fetches **league-specific market prices** from `https://data.poeatlas.app/` with **local fallback** files in `public/data/prices/` and a **one-hour `localStorage` cache** so recently loaded data still works if the network is briefly unavailable.
- Pulls **drop-weight / MLE** data from `poedata.dev` where applicable to support threshold and expected-value calculations.
- Lets you pick a **league** (from `https://data.poeatlas.app/leagues.json`) so price files follow patterns like `scarabPrices_{league}.json`.
- Computes **economic thresholds** and **profitability** (with configurable confidence and trade assumptions) and shows results in **list** and **in-game-style grid** views.
- Provides a **3-to-1 vendor simulation** focused on **Scarabs** (optimized, user-chosen, and random strategies).

## Features

| Area | Details |
|------|---------|
| **Categories** | Scarabs, Fossils, Catalysts, Essences, Delirium Orbs, Emblems, Tattoos, Oils, and Temple (Incursion) upgrades—each with navigation, filters, and views where implemented. |
| **Pages** | **Welcome** (`#`), **Flipping** (main analysis), **Simulation** (Scarab 3-to-1). Hash routes: `#/category` and optional `#/category/simulation`. |
| **Views** | **List** (sort/filter, regex-oriented workflow) and **Grid** (canvas/layout per category). |
| **Economy** | **Chaos** and **Divine** display; threshold settings (e.g. confidence percentile, trade mode). |
| **Data UX** | **Data Status** overlay, **league selector**, periodic price refresh (default **1 hour**). |

## Tech stack

- **Build**: [Vite](https://vitejs.dev/) 5 (`root: src`, static assets from `public/`, output `dist/`)
- **Language**: Vanilla **ES modules** (no React/Vue)
- **Tests**: [Vitest](https://vitest.dev/) with **jsdom**, plus unit, integration, and performance tests under `tests/`

## Getting started

### Prerequisites

- **Node.js 18+**
- A modern browser (Chrome, Firefox, Safari, Edge—current versions)

### Install and run

```bash
npm install
npm run dev
```

Dev server defaults to **http://localhost:5173** (see `vite.config.js`).

### Production build

```bash
npm run build
npm run preview
```

Artifacts go to `dist/` at the repo root.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server with HMR |
| `npm run build` | Production bundle |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run Vitest |
| `npm run test:ui` | Vitest UI |
| `npm run test:coverage` | Coverage (v8) |

## Project layout

```
scarab-hub/
├── src/
│   ├── index.html          # HTML shell
│   ├── main.js             # App bootstrap and orchestration
│   ├── styles/main.css
│   └── js/
│       ├── adapters/       # Grid adapters per item type
│       ├── components/     # UI (navigation, filters, simulation, overlays, …)
│       ├── config/         # Grid/layout configuration
│       ├── models/         # Domain models (e.g. Scarab, Essence, Fossil, …)
│       ├── services/       # Data, calculations, routing, league, prices, …
│       ├── utils/          # Canvas, colors, fetch/cache helpers, …
│       └── views/           # List/grid views per category
├── public/
│   ├── data/               # Bundled JSON: items, prices (fallback), …
│   └── assets/             # Images referenced by the UI
├── tests/                  # unit/, integration/, performance/
├── vite.config.js
└── package.json
```

## Data and third-party services

- **Prices & leagues**: `data.poeatlas.app` (remote JSON; cached in the browser).
- **MLE / weights**: `poedata.dev` for several categories’ calculation inputs.
- **Fallback**: Files under `public/data/prices/` and `public/data/items/` ship with the app for offline-first *loading* of definitions and backup prices when remote fetch fails.

## Performance notes (non-binding)

The codebase documents informal targets (e.g. fast view switches and calculations). Actual performance depends on dataset size, device, and browser.

## Legal

*Path of Exile* is a trademark of Grinding Gear Games. This is an independent fan tool and is not affiliated with or endorsed by GGG.
