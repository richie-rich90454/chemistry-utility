# Chemistry Utility 🔬

[![Go Version](https://img.shields.io/badge/go-%3E%3D1.25-00ADD8)](https://golang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org)
[![Gin](https://img.shields.io/badge/Gin-1.x-00ADD8)](https://gin-gonic.com)
[![Docker](https://img.shields.io/badge/Docker-multi--stage-2496ED)](https://www.docker.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D)](https://redis.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4)](https://github.com/richie-rich90454/chemistry-utility/pulls)
[![GitHub stars](https://img.shields.io/github/stars/richie-rich90454/chemistry-utility?style=social)](https://github.com/richie-rich90454/chemistry-utility/stargazers)
[![Go Report Card](https://goreportcard.com/badge/github.com/richie-rich90454/chemistry-utility)](https://goreportcard.com/report/github.com/richie-rich90454/chemistry-utility)

A research-grade **chemistry SaaS platform** for chemists, researchers, and students. Built with **Go + Gin**, **TypeScript + Vite**, and the **Material Design 3** design system, deployed via **Docker** with **PostgreSQL** and **Redis**.

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

### Chemistry Tooling
- **30+ chemistry calculators** covering thermodynamics, kinetics, solution chemistry, quantum mechanics, electrochemistry, gas laws, nuclear chemistry, and more
- **Advanced equation balancer** with redox, ionic, and hydrated compound support, including large-coefficient handling
- **Molar mass calculator** parsing complex formulas with nested parentheses and robust error handling
- **Stoichiometry calculator** with product-from-reactant, reactant-from-product, and limiting-reactant modes
- **Interactive periodic table** with heatmap mode (electronegativity, atomic radius, ionization energy, etc.) and detailed element views
- **Molecular structure viewer** powered by SmilesDrawer
- **Unit converter** and **significant figures engine** for research-grade precision

### Platform & SaaS
- **User authentication & authorization** — JWT-based sessions, OAuth, and role-based access control (RBAC)
- **User dashboard** with analytics, calculation history, and an admin view
- **Workspace collaboration** with shared calculations and team workspaces
- **Chemical database search** with PubChem integration and caching
- **Data visualization engine** using Chart.js with dark mode support and zoom/pan
- **Batch calculation mode** with CSV upload for high-throughput workflows
- **Plugin architecture** with lifecycle hooks (see `frontend/src/modules/plugins/`)
- **Result annotation**, star/favorite, and comparison mode
- **Offline indicator** and graceful degradation via service workers

### Infrastructure & Developer Experience
- **Docker deployment** with multi-stage production builds
- **REST API** with OpenAPI 3.1 documentation and Swagger UI
- **Material Design 3** design system with responsive layouts (desktop, tablet, mobile)
- **Dark mode** theme support
- **Internationalization (i18n)** with locale detection and number formatting
- **CI/CD pipeline** with GitHub Actions, enforcing 90% line / 85% branch coverage

---

## 🏗 Architecture

The Chemistry Utility is a full SaaS platform composed of a Go backend, a TypeScript frontend, and supporting data stores.

### Backend
- **Language & framework:** Go 1.25 + Gin
- **Persistence:** SQLite (development) or PostgreSQL 17 (production), selected via `DB_DRIVER`
- **Cache & sessions:** Redis 7
- **Auth:** JWT, OAuth, and RBAC middleware
- **Migrations:** `golang-migrate` (see `migrations/`)

### Frontend
- **Language & build:** TypeScript + Vite
- **Design system:** Material Design 3
- **Visualization:** Chart.js (+ zoom plugin), SmilesDrawer, KaTeX for equations
- **Animation:** GSAP

### Deployment
- **Production:** `docker-compose.yml` — app + PostgreSQL + Redis
- **Development:** `docker-compose.dev.yml` — hot-reloading app + frontend dev server

| Feature | Backend (Go + Gin) | Frontend (TS + Vite) |
|---------|--------------------|-----------------------|
| Entry point | `cmd/server/main.go` | `frontend/src/script.ts` |
| API surface | `internal/api/` | `frontend/src/modules/apiClient.ts` |
| Business logic | `internal/calculators/`, `internal/compounds/` | `frontend/src/modules/` |
| Auth | `internal/auth/` | `frontend/src/modules/authManager.ts` |
| Data | `internal/db/`, PostgreSQL/SQLite | Chart.js, service worker cache |

---

## 🚀 Getting Started

### Prerequisites
- **Go** 1.25 or higher
- **Node.js** 18.x or higher with **npm** 9.x+
- **Docker** and **Docker Compose** (for containerized deployment)

### Option 1: Docker (recommended)

```bash
# Clone the repository
git clone https://github.com/richie-rich90454/chemistry-utility.git
cd chemistry-utility

# Copy environment defaults and adjust secrets
cp .env.example .env

# Start the full stack (app + PostgreSQL + Redis)
docker-compose up
```

The app is available on `http://localhost:6005`.

### Option 2: Development environment

```bash
git clone https://github.com/richie-rich90454/chemistry-utility.git
cd chemistry-utility

# Hot-reloading backend + frontend dev server
docker-compose -f docker-compose.dev.yml up
```

- Backend: `http://localhost:6005`
- Frontend (Vite dev server): `http://localhost:5173`

### Option 3: Manual build

```bash
# Frontend
cd frontend
npm install
npm run build
cd ..

# Backend
go build -o server ./cmd/server
./server
```

For development with hot reload:

```bash
# Frontend
cd frontend && npm run dev

# Backend (with air for live reload)
air
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
│   └── server/                 # Gin web server entry point
│       └── main.go
├── internal/
│   ├── api/                    # HTTP handlers (auth, calculations, compounds, plugins, users, workspaces, analytics, API keys)
│   ├── auth/                   # JWT, OAuth, password hashing, RBAC middleware
│   ├── calculators/            # Calculator domain logic (thermodynamics, kinetics, solution, quantum, gas laws, electrochemistry, etc.)
│   ├── compounds/              # PubChem integration and compound cache
│   ├── db/                     # Database connection, models, queries
│   └── ptable/                 # Periodic table service
├── migrations/                 # SQL migrations (golang-migrate)
│   ├── 000001_init_schema.up.sql
│   └── 000001_init_schema.down.sql
├── api/
│   └── openapi.yaml            # OpenAPI 3.1 specification
├── docs/                       # Developer guide and additional documentation
├── frontend/
│   ├── src/
│   │   ├── modules/            # Modular frontend components
│   │   │   ├── i18n/           # Internationalization
│   │   │   ├── plugins/        # Plugin architecture (lifecycle hooks)
│   │   │   ├── authManager.ts
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
│   │   ├── integration/        # Integration tests
│   │   ├── render.ts           # UI rendering utilities
│   │   ├── script.ts           # Main client logic
│   │   └── style.css           # Shared base styles (MD3 design system)
│   ├── public/                 # Static assets (fonts, icons, ptable.json, sw.js)
│   ├── e2e/                    # Playwright end-to-end tests
│   ├── index.html              # Web version (SEO optimized)
│   └── index-app.html          # Desktop version (minimal)
├── .github/
│   ├── workflows/              # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/
│   └── changelog-configuration.json
├── Dockerfile                  # Multi-stage production build
├── Dockerfile.dev              # Development image
├── docker-compose.yml          # Production stack (app + PostgreSQL + Redis)
├── docker-compose.dev.yml      # Development stack
├── main.go                     # Wails desktop app entry point
├── app.go                      # Wails app struct and bindings
├── go.mod
├── go.sum
├── CHANGELOG.md
└── README.md
```

---

## 🏗 Technical Architecture

### Frontend
- **TypeScript** for type-safe, maintainable code
- **Vite** for fast development and optimized production builds
- **Material Design 3** design system with theming and dark mode
- **Chart.js** (+ zoom plugin) for data visualization
- **SmilesDrawer** for molecular structure rendering
- **KaTeX** for rendering chemical equations
- **GSAP** for animations
- **Service worker** for offline indication and graceful degradation

### Backend (Go + Gin)
- **Gin v1** for high-performance HTTP serving
- **Modular internal packages**: `api`, `auth`, `calculators`, `compounds`, `db`, `ptable`
- **JWT + OAuth + RBAC** for authentication and authorization
- **Redis** for caching and session storage
- **SQLite (dev) / PostgreSQL (prod)** via `DB_DRIVER` configuration
- **golang-migrate** for schema migrations
- **Recovery middleware** and structured error handling

### Data Layer
- **Periodic Table JSON** with 118 elements (symbol, name, atomic mass, electronegativity, electron affinity, atomic radius, ionization energy, electron configuration, group, period, type)
- **PubChem integration** with a caching layer for compound lookups
- **SQL migrations** versioned under `migrations/`

### Build & Deployment
- **Docker multi-stage builds** for small production images
- **Docker Compose** stacks for development and production
- **Vite** for frontend bundling and optimization
- **Go compiler** for native backend binaries
- **GitHub Actions** CI/CD with test coverage enforcement (90% lines, 85% branches)

---

## 🔌 API Reference

The full REST API is documented with **OpenAPI 3.1** and served via **Swagger UI**.

- **Interactive docs:** [`/api/docs`](https://chemutil.richardsblogs.com/api/docs)
- **Specification:** `api/openapi.yaml`

### Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/ptable` | Periodic table data |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/me` | Current user profile |
| `POST` | `/api/calculations` | Run a calculation |
| `GET` | `/api/calculations` | List calculation history |
| `GET` | `/api/compounds/search` | Search compounds (PubChem-backed) |
| `GET` | `/api/workspaces` | List user workspaces |
| `POST` | `/api/plugins` | Manage plugins |
| `GET` | `/api/admin/analytics` | Admin analytics (RBAC-protected) |

> The `/api/ptable` endpoint requires the `X-Requested-With: XMLHttpRequest` header. Direct access to `/ptable.json` returns `403 Forbidden`.

### Static Files
- `.html` files: `no-store`
- Other assets: `public, max-age=86400` (24 hours)

---

## 🗺 Roadmap

### Completed ✓
- [x] TypeScript migration
- [x] Vite build system integration
- [x] ES modules adoption
- [x] Modular architecture
- [x] SEO optimization
- [x] Go/Gin web server implementation
- [x] Wails desktop application
- [x] Dual-mode architecture (desktop + web)
- [x] 30+ chemistry calculators (thermodynamics, kinetics, solution, quantum, electrochemistry, gas laws, nuclear)
- [x] Advanced equation balancer (redox, ionic, hydrated compounds)
- [x] User authentication & authorization (JWT, OAuth, RBAC)
- [x] User dashboard with analytics
- [x] Workspace collaboration
- [x] PubChem chemical database search
- [x] Interactive periodic table with heatmap
- [x] Molecular structure viewer (SmilesDrawer)
- [x] Data visualization (Chart.js) with dark mode
- [x] Batch calculation mode with CSV upload
- [x] Plugin architecture with lifecycle hooks
- [x] Result annotation, star/favorite, and comparison
- [x] Docker deployment with multi-stage builds
- [x] REST API with OpenAPI 3.1 documentation
- [x] Material Design 3 design system
- [x] Dark mode theme
- [x] Internationalization (i18n)
- [x] CI/CD pipeline with GitHub Actions
- [x] Test coverage enforcement (90% lines, 85% branches)

### In Progress 🚧
- [ ] Offline support expansion with service worker caching
- [ ] Performance benchmarking suite
- [ ] Expanded PubChem-backed compound dataset

### Planned 🎯
- [ ] Export results as PDF
- [ ] Chemical structure drawing canvas
- [ ] Mobile app (React Native)
- [ ] WebAssembly core for client-side calculations
- [ ] Real-time collaborative editing in workspaces
- [ ] Advanced analytics and reporting for teams
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
- Maintains test coverage thresholds (90% lines, 85% branches)

Changelog entries are generated automatically from merged PRs using the configuration in `.github/changelog-configuration.json`.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

## 🙏 Acknowledgements

- [Gin](https://gin-gonic.com/) team for the high-performance Go web framework
- [Wails](https://wails.io/) team for the Go desktop framework
- [PostgreSQL](https://www.postgresql.org/) and [Redis](https://redis.io/) for robust data infrastructure
- Periodic table data adapted from [PubChem](https://pubchem.ncbi.nlm.nih.gov/)
- [Vite](https://vitejs.dev/) for the next-generation build tool
- [Chart.js](https://www.chartjs.org/), [SmilesDrawer](https://github.com/reymond-group/smilesDrawer), and [KaTeX](https://katex.org/) for visualization
- [Material Design 3](https://m3.material.io/) for the design system

---

<p align="center">
  <a href="https://chemutil.richardsblogs.com">Live Demo</a> •
  <a href="https://github.com/richie-rich90454/chemistry-utility/issues">Report Bug</a> •
  <a href="https://github.com/richie-rich90454/chemistry-utility/issues">Request Feature</a>
</p>
