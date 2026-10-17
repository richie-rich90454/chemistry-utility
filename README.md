# Chemistry Utility

[![Go Version](https://img.shields.io/badge/go-%3E%3D1.25-00ADD8)](https://golang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6)](https://www.typescriptlang.org)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.x-2C4F7C)](https://www.solidjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4)](https://github.com/richie-rich90454/chemistry-utility/pulls)

A research-grade **chemistry utility** for chemists, researchers, and students,
built with **TypeScript + SolidJS + Vite** and the **Lab Parchment** design
system. The website is static and runs entirely in the browser. An optional
**Go + Wails** wrapper embeds the same UI in a native desktop window.

Live site: [chemutil.richardsblogs.com](https://chemutil.richardsblogs.com)

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [License](#license)

---

## Features

### Chemistry tooling (all platforms, works offline after first load)
- **47 calculators** covering thermodynamics, kinetics, solution chemistry,
  quantum mechanics, electrochemistry, gas laws, nuclear chemistry, and the AP
  Chemistry set
- **Equation balancer** with redox, charge-aware ionic, and hydrated-compound
  support
- **Molar mass calculator** with nested parentheses, hydrates, and complex
  formulas
- **Stoichiometry calculator** with product-from-reactant,
  reactant-from-product, and limiting-reactant modes
- **Interactive periodic table** with heatmap mode and detailed element views
- **Molecular structure viewer** (SmilesDrawer), **compound search**, **unit
  converter**, and a **significant-figures engine**

### Platform
- **One UI, two targets**: a static website and a native desktop app that embed
  the identical bundle, so the interface is pixel-identical
- **Static and anonymous**: the website has no server runtime, no database, and
  no accounts; the desktop app keeps everything on the local machine
- **Data visualization** with Chart.js (dark mode, zoom/pan, HiDPI canvas)
- **Batch calculation** with CSV import (desktop)
- **Plugin architecture** with lifecycle hooks
- **Printable lab reports** and **shareable URL state**
- **PWA installability** with offline caching (website build)
- **Internationalization (i18n)**, dark/AMOLED/light themes, and time-based
  auto dark mode

### Developer experience
- **Lab Parchment** design system with responsive layouts
- **Per-route code splitting** with a gzipped bundle budget enforced in CI
- **CI/CD** with GitHub Actions: typecheck, ESLint, Vitest with coverage
  thresholds, `go vet`, Go tests, golangci-lint, bundle-size check, and
  Playwright E2E against the production build

---

## Architecture

The repository is **one npm project**. The root is the website; `core/` is an
optional Go desktop wrapper.

- **Website**: TypeScript + SolidJS + Vite. `npm run build:web` writes a fully
  static site to `dist/` — no server, no database, no API.
- **Desktop**: a Wails shell that embeds the built site and exposes a Go
  calculator registry through Wails bindings. No HTTP server runs.

### Two engines, one contract

The calculators the desktop wrapper ports exist twice: the TypeScript
implementation in `src/modules/calculators/` and the Go port in
`core/internal/calculators/`. Both are held to the same behavior by the shared
vectors in `conformance/`, which `vitest` and `go test` both consume.

`src/modules/engine.ts` is the only file that chooses an engine. If the Go
registry does not implement a calculator id (the equation balancer, for
example), the desktop engine falls back to the TypeScript calculator bundled in
the app, so the desktop always exposes the full calculator set.

### Layers

| Layer | Location |
| --- | --- |
| Website entry points | `src/solid/entry.web.tsx` (hydrate), `src/solid/entry.app.tsx`, `src/ssr/entrySsr.tsx` |
| Router and routes | `src/solid/App.tsx`, `src/solid/routes/` |
| Engine seam | `src/modules/engine.ts` |
| Pure calculators | `src/modules/calculators/` |
| DOM / platform adapters | `src/modules/dom/` |
| Desktop shell (Go) | `core/main.go`, `core/app.go`, `core/services.go` |
| Go calculators | `core/internal/calculators/` |
| Conformance vectors | `conformance/` |

---

## Getting Started

### Prerequisites
- **Node.js** 20.19+ (or 22.12+) with **npm** — required
- **Go** 1.25+ and the [Wails v2 CLI](https://wails.io/docs/gettingstarted/installation)
  — only for the desktop app

### Website

```bash
git clone https://github.com/richie-rich90454/chemistry-utility.git
cd chemistry-utility
npm install
npm run dev            # http://localhost:5173
```

Static build:

```bash
npm run build:web      # output in dist/ - serve with any static host
```

### Desktop app

```bash
npm run desktop:build  # builds the web bundle and the native binary
```

---

## Project Structure

```
chemistry-utility/
├── src/
│   ├── modules/
│   │   ├── calculators/    # pure calculator math (no DOM, no storage, no network)
│   │   ├── dom/            # DOM, charts, platform adapters (web vs native)
│   │   ├── i18n/           # internationalization
│   │   └── plugins/        # plugin architecture
│   ├── solid/              # App shell, routes, components, stores, entry points
│   ├── ssr/                # prerender entry (used by scripts/prerender.mjs)
│   ├── cli/                # command-line interface
│   └── workers/            # web workers for heavy calculation
├── public/                 # static assets (fonts, icons, ptable.json, sw.js)
├── scripts/                # build, prerender, conformance, quality scripts
├── conformance/            # shared calculator test vectors
├── core/                   # optional Go wrapper (Wails desktop shell)
│   ├── internal/calculators/   # ported calculators + registry
│   ├── internal/ptable/        # periodic table service
│   ├── main.go                 # Wails entry point; embeds core/dist
│   ├── app.go                  # app struct and PTableService binding
│   └── services.go             # CalculatorService, DataService, FileService
├── e2e/                    # Playwright end-to-end tests
├── docs/                   # developer guide and architecture notes
├── index.web.html          # website shell (SEO, Open Graph, JSON-LD)
├── index.app.html          # desktop shell (minimal)
├── vite.config.ts          # web vs app mode, entry selection
├── package.json            # the single project manifest
└── .github/workflows/      # CI pipelines
```

---

## Development

All commands run from the repository root. See
[`docs/developer-guide.md`](docs/developer-guide.md) for the full list and
[`docs/architecture.md`](docs/architecture.md) for the engine seam.

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `src/` |
| `npm run build:web` | Static website build |
| `npm run conformance:generate` | Regenerate `conformance/*.json` |
| `npm run desktop:build` | Native desktop binary |
| `npm run core:test` | Go tests for the wrapper |
| `npm run check` | typecheck + lint + tests |

---

## Contributing

Contributions are welcome.

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes
4. **Push** to the branch
5. **Open** a Pull Request

Please ensure your PR passes `npm run check`, keeps the Go wrapper green
(`npm run core:test`), and leaves `npm run conformance:verify` unchanged unless
you intended a calculator behavior change.

---

## License

Distributed under the **MIT License**. See [LICENSE](LICENSE).

---

## Acknowledgements

- [Wails](https://wails.io/) for the Go desktop framework
- Periodic table data adapted from [PubChem](https://pubchem.ncbi.nlm.nih.gov/)
- [Vite](https://vitejs.dev/), [Chart.js](https://www.chartjs.org/),
  [SmilesDrawer](https://github.com/reymond-group/smilesDrawer), and
  [SolidJS](https://www.solidjs.com/)
