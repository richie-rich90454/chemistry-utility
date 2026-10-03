# Chemistry Utility 🔬

[![Go Version](https://img.shields.io/badge/go-%3E%3D1.25-00ADD8)](https://golang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6)](https://www.typescriptlang.org)
[![Gin](https://img.shields.io/badge/Gin-1.x-00ADD8)](https://gin-gonic.com)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.x-2C4F7C)](https://www.solidjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4)](https://github.com/richie-rich90454/chemistry-utility/pulls)
[![GitHub stars](https://img.shields.io/github/stars/richie-rich90454/chemistry-utility?style=social)](https://github.com/richie-rich90454/chemistry-utility/stargazers)

A research-grade **chemistry utility** for chemists, researchers, and students. Built with **Go + Gin**, **TypeScript + SolidJS + Vite**, and the **Lab Parchment** design system.

🌐 **Live Demo**: [chemutil.richardsblogs.com](https://chemutil.richardsblogs.com)

---

## 📋 Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Usage Examples](#usage-examples)
- [Project Structure](#project-structure)
- [Technical Architecture](#technical-architecture)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Chemistry Tooling (all platforms, works offline after first load)
- **30+ chemistry calculators** covering thermodynamics, kinetics, solution chemistry, quantum mechanics, electrochemistry, gas laws, nuclear chemistry, and more
- **Advanced equation balancer** with redox, ionic (charge-aware), and hydrated compound support, including large-coefficient handling
- **Molar mass calculator** parsing complex formulas with nested parentheses and robust error handling
- **Stoichiometry calculator** with product-from-reactant, reactant-from-product, and limiting-reactant modes
- **Interactive periodic table** with heatmap mode (electronegativity, atomic radius, ionization energy, etc.) and detailed element views
- **Molecular structure viewer** powered by SmilesDrawer
- **Unit converter** and **significant figures engine** for research-grade precision

### Platform
- **Dual-target app**: a native desktop build (Wails) and an anonymous web app — the web version has **no accounts and no server-side data retention**; the desktop version keeps everything local
- **Desktop dashboard** with activity chart, calculation history, and favorites (stored locally in the browser profile)
- **Local workspaces and experiment logs** for organizing calculations on desktop
- **Compound search** backed by PubChem-fetched records cached in the desktop's local SQLite database (returns `501` on the anonymous web build — see [API Reference](#api-reference))
- **Data visualization engine** using Chart.js with dark mode support and zoom/pan
- **Batch calculation mode** with CSV upload for high-throughput workflows (desktop)
- **Plugin architecture** with lifecycle hooks (see `frontend/src/modules/plugins/`)
- **Result annotation**, star/favorite, and comparison mode (local storage)
- **PWA installability** with offline caching via service worker (web build)

### No telemetry

No telemetry: the anonymous web build stores nothing server-side; desktop data stays local.

### Infrastructure & Developer Experience
- **REST API** with OpenAPI 3.1 documentation and Swagger UI (`/api/docs`)
- **Lab Parchment** design system with responsive layouts (desktop, tablet, mobile)
- **Dark / AMOLED / light themes** with optional time-based auto dark mode
- **Internationalization (i18n)** with locale detection and number formatting
- **CI/CD pipeline** with GitHub Actions: typecheck, lint, unit tests with coverage thresholds (frontend), `go vet`, Go tests, golangci-lint, bundle-size check, and Playwright E2E against the production web build

---

## 🏗 Architecture

One codebase, two targets:

- **Desktop**: Wails embeds the frontend and starts the same Gin API in-process on a loopback port, backed by a local database (SQLite default, PostgreSQL supported via `DB_DRIVER`) used for the compound cache and plugin records. All user data stays on the machine.
- **Web**: the standalone Gin server serves the static frontend plus a stateless calculator API. It opens no database and stores nothing.

### Backend
- **Language & framework:** Go 1.25+ + Gin
- **Persistence:** none on the anonymous web server; SQLite or PostgreSQL (via `DB_DRIVER`) in the desktop app
- **Migrations:** `golang-migrate` (see `migrations/`)
- **Security:** rate limiting per client IP, strict security headers, gzip, RFC 7807 problem details

### Frontend
- **Language & build:** TypeScript + SolidJS + Vite
- **Design system:** Lab Parchment (custom CSS modules)
- **Visualization:** Chart.js (+ zoom plugin), SmilesDrawer
- **Animation:** GSAP

### Deployment
- **Desktop app:** `wails build` produces a native binary for Windows, macOS, and Linux
- **Web app:** the Go server (`cmd/server`) serves `frontend/dist/` and the API from a single binary

| Layer | Location |
|---------|--------------------|
| Web server entry point | `cmd/server/main.go` |
| Desktop entry point | `main.go` / `app.go` |
| API handlers | `internal/api/` |
| Business logic | `internal/calculators/` |
| Compound cache / PubChem | `internal/compounds/` |
| Database access | `internal/db/` |
| Periodic table service | `internal/ptable/` |
| Frontend entry point | `frontend/src/solid/index.tsx` |
| Frontend calculators | `frontend/src/modules/` |

---

## 🚀 Getting Started

### Prerequisites
- **Go** 1.25 or higher
- **Node.js** 20.19+ or 22.12+ with **npm**
- A C toolchain for CGO (SQLite): MinGW-w64 on Windows (ensure `C:\msys64\ucrt64\bin` is on PATH), gcc/clang on macOS/Linux
- [Wails v2 CLI](https://wails.io/docs/gettingstarted/installation) only for the desktop target

### Option 1: Development environment

```bash
git clone https://github.com/richie-rich90454/chemistry-utility.git
cd chemistry-utility

# Frontend (Vite dev server with hot reload)
cd frontend && npm install && npm run dev
# -> http://localhost:5173

# Backend API (in a second terminal; air for live reload or plain go run)
npm run start:web
# -> http://localhost:6005
```

### Option 2: Production web build

```bash
# Frontend
cd frontend && npm install && npm run build:web
cd ..

# Server (serves frontend/dist and the API on :6005)
npm run build:server
./build/bin/server.exe   # PORT and DIST_DIR env vars override defaults
```

### Option 3: Desktop app

```bash
wails build          # output in build/bin/
```

---

## 💡 Usage Examples

### Molar Mass Calculation
```
Input:  Al2(SO4)3
Output: 342.15 g/mol
```

### Equation Balancing
```
Input:  C3H8+O2->CO2+H2O
Output: C3H8+5O2->3CO2+4H2O
```

### Stoichiometry (Limiting Reactant)
```
Equation: 2H2 + O2 -> 2H2O
Inputs:   H2 = 3 mol, O2 = 1 mol
Result:   Limiting reactant: O2
          Maximum H2O produced: 2 mol
```

### Bond Type Prediction
```
Input:  Sodium (electronegativity 0.93) and Chlorine (3.16)
Output: Ionic bond (ΔEN = 2.23)
```

---

## 📁 Project Structure

```
chemistry-utility/
├── cmd/
│   └── server/                 # Gin web server entry point (static files + stateless API)
│       └── main.go
├── internal/
│   ├── api/                    # HTTP handlers (calculators, compounds, plugins, docs), middleware
│   ├── calculators/            # Calculator domain logic (thermodynamics, kinetics, solution, quantum, gas laws, electrochemistry, etc.)
│   ├── compounds/              # PubChem integration and compound cache
│   ├── db/                     # Database connection, models, queries
│   └── ptable/                 # Periodic table service
├── migrations/                 # SQL migrations (golang-migrate)
│   ├── 000001_init_schema.up.sql / .down.sql
│   └── 000002_drop_auth_tables.up.sql / .down.sql
├── api/
│   └── openapi.yaml            # OpenAPI 3.1 specification
├── docs/                       # Developer guide and additional documentation
├── frontend/
│   ├── src/
│   │   ├── solid/              # SolidJS UI: App shell, routes, components, stores, lib
│   │   ├── modules/            # Calculator engines and shared frontend logic
│   │   │   ├── i18n/           # Internationalization
│   │   │   ├── plugins/        # Plugin architecture (lifecycle hooks)
│   │   │   ├── batchCalculator.ts
│   │   │   ├── calculatorRegistry.ts
│   │   │   ├── chartRenderer.ts
│   │   │   ├── comparisonManager.ts
│   │   │   ├── compoundSearchUI.ts
│   │   │   ├── dashboardManager.ts
│   │   │   ├── equationBalancer.ts
│   │   │   ├── interactivePTable.ts
│   │   │   ├── molecularViewer.ts
│   │   │   ├── pluginManager.ts
│   │   │   ├── resultAnnotation.ts
│   │   │   ├── thermodynamicsCalculators.ts
│   │   │   ├── kineticsCalculators.ts
│   │   │   ├── solutionCalculators.ts
│   │   │   ├── quantumCalculators.ts
│   │   │   ├── gasLawCalculators.ts
│   │   │   ├── electrochemistryCalculators.ts
│   │   │   └── ...             # Additional calculators and utilities
│   │   ├── cli/                # Command-line interface (npm run cli)
│   │   ├── integration/        # Integration tests
│   │   └── types.ts
│   ├── e2e/                    # Playwright end-to-end tests (run against the production build)
│   ├── public/                 # Static assets (fonts, icons, ptable.json, sw.js, sitemap.xml)
│   └── index.html              # Single app shell (web + desktop)
├── scripts/                    # Quality gate and coverage checks
├── .github/
│   ├── workflows/              # CI/CD pipelines
│   └── ISSUE_TEMPLATE/
├── main.go                     # Wails desktop app entry point
├── app.go                      # Wails app struct, bindings, embedded API server
├── go.mod
├── go.sum
├── CHANGELOG.md
└── README.md
```

---

## 🏗 Technical Architecture

### Frontend
- **TypeScript + SolidJS** for type-safe, fine-grained reactive UI
- **Vite** for fast development and optimized production builds (separate `web` and `app` modes)
- **Chart.js** (+ zoom plugin) for data visualization
- **SmilesDrawer** for molecular structure rendering
- **GSAP** for animations
- **Service worker** (production web builds) for installability and offline fallback of core assets

### Backend (Go + Gin)
- **Gin v1** for high-performance HTTP serving
- **Modular internal packages**: `api`, `calculators`, `compounds`, `db`, `ptable`
- **Rate limiting** per client IP (spoof-resistant; `TRUSTED_PROXIES` opt-in behind reverse proxies)
- **SQLite (desktop default) / PostgreSQL** via `DB_DRIVER` configuration
- **golang-migrate** for schema migrations (embedded in the desktop binary)
- **Recovery middleware**, security headers, gzip compression, and RFC 7807 error handling

### Data Layer
- **Periodic Table JSON** with 118 elements (symbol, name, atomic mass, electronegativity, electron affinity, atomic radius, ionization energy, valence electrons, group, period, type)
- **PubChem integration** with a caching layer feeding the desktop compound search
- **SQL migrations** versioned under `migrations/`

### Build & Deployment
- **Vite** for frontend bundling and optimization
- **Go compiler** for native backend binaries
- **Wails** for native desktop app packaging (Windows, macOS, Linux)
- **GitHub Actions** CI/CD: typecheck, eslint, vitest with enforced thresholds (82% lines / 68% branches / 85% functions / 80% statements), `go test ./...` with coverage reporting, golangci-lint, bundle-size gate, and Playwright E2E on the built site

---

## 🔌 API Reference

The full REST API is documented with **OpenAPI 3.1** and served via **Swagger UI**. See [`docs/developer-guide.md`](docs/developer-guide.md) for input schemas per calculator.

- **Interactive docs:** `/api/docs`
- **Specification:** [`api/openapi.yaml`](api/openapi.yaml)

### Key endpoints

| Method | Path | Description | Anonymous web |
|--------|------|-------------|---------------|
| `GET` | `/ptable.json` | Periodic table data (static file) | ✅ |
| `GET` | `/api/v1/calculators` | List registered calculator types | ✅ |
| `POST` | `/api/v1/calculators/{type}` | Run a calculation (JSON body) | ✅ |
| `GET` | `/api/v1/compounds?q=&type=&limit=&offset=` | Search cached compounds | ❌ `501` |
| `GET` | `/api/v1/compounds/{id}` | Compound detail by UUID | ❌ `501` |
| `GET` | `/api/v1/plugins` | List plugin records | ❌ `501` |
| `POST` | `/api/v1/plugins` | Register a plugin record | ❌ `501` |
| `PATCH` | `/api/v1/plugins/{id}/enable` / `disable` | Toggle a plugin record | ❌ `501` |
| `DELETE` | `/api/v1/plugins/{id}` | Delete a plugin record | ❌ `501` |
| `GET` | `/api/docs` | Swagger UI | ✅ |
| `GET` | `/api/docs/openapi.yaml` | OpenAPI spec | ✅ |

> The web deployment is intentionally anonymous: no accounts, no history, no server-side storage. Database-backed endpoints answer `501 Not Implemented` there. The desktop app runs the same API locally with a database attached.

### Static file caching (web server)
- `/assets/*`: `public, max-age=31536000, immutable` (content-hashed filenames)
- `/ptable.json`: `public, max-age=86400` (24 hours)
- HTML and other routes: no explicit `Cache-Control` (revalidated per request)

---

## 🗺 Roadmap

### Completed ✓
- [x] TypeScript migration with SolidJS
- [x] Vite build system integration (dual web/app modes)
- [x] Modular architecture
- [x] SEO optimization (sitemap, structured data, canonical URLs)
- [x] Go/Gin web server implementation
- [x] Wails desktop application
- [x] Dual-mode architecture (desktop + anonymous web)
- [x] 30+ chemistry calculators (thermodynamics, kinetics, solution, quantum, electrochemistry, gas laws, nuclear)
- [x] Advanced equation balancer (redox, charge-aware ionic terms, hydrated compounds)
- [x] Local dashboard with analytics
- [x] Local workspaces and experiment logs
- [x] PubChem chemical database search (desktop)
- [x] Interactive periodic table with heatmap
- [x] Molecular structure viewer (SmilesDrawer)
- [x] Data visualization (Chart.js) with dark mode
- [x] Batch calculation mode with CSV upload (desktop)
- [x] Plugin architecture with lifecycle hooks
- [x] Result annotation, star/favorite, and comparison
- [x] REST API with OpenAPI 3.1 documentation
- [x] Lab Parchment design system
- [x] Dark mode theme
- [x] Internationalization (i18n)
- [x] CI/CD pipeline with GitHub Actions
- [x] Test coverage thresholds enforced in CI

### In Progress 🚧
- [ ] Offline support expansion beyond core asset precaching
- [ ] Performance benchmarking suite
- [ ] Expanded PubChem-backed compound dataset

### Planned 🎯
- [ ] Export results as PDF
- [ ] Chemical structure drawing canvas
- [ ] Mobile app
- [ ] WebAssembly core for client-side calculations
- [ ] Marketplace for community plugins

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

Please ensure your PR:
- Follows existing code style
- Includes relevant documentation updates
- Passes TypeScript compilation (`npm run typecheck`)
- Passes Go compilation (`go build ./...`)
- Keeps CI green (tests, lint, coverage thresholds, bundle size)

Changelog entries are maintained per release in `CHANGELOG.md`; `.github/changelog-configuration.json` provides label categories for release automation.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

## 🙏 Acknowledgements

- [Gin](https://gin-gonic.com/) team for the high-performance Go web framework
- [Wails](https://wails.io/) team for the Go desktop framework
- Periodic table data adapted from [PubChem](https://pubchem.ncbi.nlm.nih.gov/)
- [Vite](https://vitejs.dev/) for the next-generation build tool
- [Chart.js](https://www.chartjs.org/) and [SmilesDrawer](https://github.com/reymond-group/smilesDrawer) for visualization
- The [SolidJS](https://www.solidjs.com/) team for the reactive UI framework

---

<p align="center">
  <a href="https://chemutil.richardsblogs.com">Live Demo</a> •
  <a href="https://github.com/richie-rich90454/chemistry-utility/issues">Report Bug</a> •
  <a href="https://github.com/richie-rich90454/chemistry-utility/issues">Request Feature</a>
</p>
