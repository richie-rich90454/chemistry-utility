# Chemistry Utility 🔬

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Go Version](https://img.shields.io/badge/go-%3E%3D1.21-00ADD8)](https://golang.org)
[![Gin](https://img.shields.io/badge/Gin-1.x-00ADD8)](https://gin-gonic.com)
[![Wails](https://img.shields.io/badge/Wails-2.x-F24E4E)](https://wails.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)](https://vitejs.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4)](https://github.com/richie-rich90454/chemistry-utility/pulls)
[![GitHub stars](https://img.shields.io/github/stars/richie-rich90454/chemistry-utility?style=social)](https://github.com/richie-rich90454/chemistry-utility/stargazers)
[![Go Report Card](https://goreportcard.com/badge/github.com/richie-rich90454/chemistry-utility)](https://goreportcard.com/report/github.com/richie-rich90454/chemistry-utility)
[![Bundle Size](https://img.shields.io/badge/bundle%20size-optimized-blueviolet)](https://vitejs.dev)

A comprehensive **Chemistry Utility** offering 11 specialized calculation tools for chemistry students, educators, and professionals. Built with **TypeScript**, **HTML5**, **CSS3**, with a **Wails** desktop app and **Gin** web server.

🌐 **Live Demo**: [chemutil.richardsblogs.com](https://chemutil.richardsblogs.com)

---

## 📋 Table of Contents
- [Features](#features)
- [Dual-Mode Architecture](#dual-mode-architecture)
- [Getting Started](#getting-started)
- [Usage Examples](#usage-examples)
- [Project Structure](#project-structure)
- [Technical Architecture](#technical-architecture)
- [API Reference](#api-reference)
- [Customization](#customization)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Chemistry Tools
| Tool | Description |
|------|-------------|
| 🔎 **Element Information** | Complete periodic table data for 118 elements including atomic mass, electronegativity, electron affinity, atomic radius, ionization energy, and electron configuration |
| ⚖️ **Molar Mass Calculator** | Parse complex formulas with nested parentheses, error handling for invalid inputs |
| 🔢 **Equation Balancer** | Auto-balance chemical equations with adjustable coefficient search range |
| 🧪 **Stoichiometry Calculator** | Three calculation modes: product from reactant, reactant from product, limiting reactant |
| 🧪 **Dilution Calculator** | Solve C₁V₁ = C₂V₂ equations with flexible parameter solving |
| 📊 **Mass Percent & Concentration** | Calculate mass percent, ppm, and ppb concentrations |
| 🧪 **Solution Mixing** | Determine final molarity when mixing two solutions |
| ☢️ **Nuclear Chemistry** | Half-life calculator for exponential decay modeling |
| 🌬️ **Gas Laws** | Ideal gas law, combined gas law, and Van der Waals equation solvers |
| ⚡ **Electrochemistry** | Cell potential calculations (standard and non-standard), Nernst equation, electrolysis relationships |
| 🔗 **Bond Type Predictor** | Predict ionic, covalent, or metallic bonds based on electronegativity differences |

### Technical Highlights
- **TypeScript Migration**: Full conversion from JavaScript to TypeScript for improved type safety
- **Dual-Mode Architecture**: Wails desktop app and Gin web server
- **Modular Architecture**: Separated concerns with dedicated modules for each calculator type
- **Responsive Design**: Mobile-first approach with fluid layouts
- **Vite Build System**: Fast development with optimized production builds
- **SEO Optimized**: Structured data, sitemap, and comprehensive meta tags

---

## 🏗 Dual-Mode Architecture

The Chemistry Utility offers two deployment modes: a native desktop application and a web server.

### Mode Comparison

| Feature | Desktop (Wails) | Web Server (Gin) |
|---------|-----------------|-------------------|
| **Use Case** | Local desktop app | Web deployment |
| **Framework** | Wails v2 | Gin v1 |
| **Frontend** | Embedded (go:embed) | Served from disk |
| **Data Loading** | Wails bindings (IPC) | HTTP API endpoint |
| **HTML Entry** | index-app.html (minimal) | index.html (SEO optimized) |
| **Fonts** | Local (embedded) | CDN (Google Fonts) |
| **Startup** | ~1-2s | ~5-10ms |
| **Memory** | ~50-80 MB | ~10-15 MB |

### Running Both Modes

```bash
# Desktop app (Wails)
wails dev          # Development with hot reload
wails build        # Build desktop binary

# Web server (Gin)
go run ./cmd/server     # Run directly
go build -o server ./cmd/server  # Build standalone binary
./server                # Run binary
```

Both the desktop app and web server provide identical chemistry functionality. The web server runs on port `6005` by default (configurable via `PORT` environment variable).

---

## 🚀 Getting Started

### Prerequisites
- **Go** 1.21 or higher
- **Node.js** 18.x or higher (for frontend build)
- **npm** 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/richie-rich90454/chemistry-utility.git
cd chemistry-utility

# Install frontend dependencies
cd frontend && npm install && cd ..

# Build the frontend
cd frontend && npm run build && cd ..

# Start the web server
go run ./cmd/server

# Or build the desktop app
wails dev
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
├── frontend/               # Frontend application
│   ├── src/                # TypeScript source files
│   │   ├── modules/        # Modular calculator components
│   │   ├── render.ts       # UI rendering utilities
│   │   ├── script.ts       # Main client logic
│   │   ├── style.css       # Shared base styles
│   │   └── style-app.css   # Desktop app local fonts
│   ├── public/             # Static assets (fonts, icons, ptable.json)
│   ├── index.html          # Web version (SEO optimized, CDN fonts)
│   └── index-app.html      # Desktop version (minimal, local fonts)
├── cmd/
│   └── server/             # Gin web server binary
│       └── main.go         # Server entry point
├── internal/
│   └── ptable/             # Shared periodic table service
│       ├── ptable.go       # Service implementation
│       └── ptable_test.go  # Service tests
├── main.go                 # Wails desktop app entry point
├── app.go                  # Wails app struct and bindings
├── go.mod                  # Go module definition
├── go.sum                  # Go checksums
├── dist/                   # Production build output
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.js          # Vite configuration
└── README.md
```

---

## 🏗 Technical Architecture

### Frontend
- **TypeScript** for type-safe, maintainable code
- **Vite** for fast development and optimized builds
- **CSS3** with responsive design patterns
- **Modular JavaScript** with ES6+ features
- **Dual CSS** variants (web with CDN fonts and desktop with local fonts)

### Backend (Desktop — Wails)
- **Wails v2** for native desktop application
- **Go** backend with Wails bindings for frontend communication
- **Embedded frontend** via go:embed
- **Local fonts** for offline operation

### Backend (Web Server — Gin)
- **Gin v1** for high-performance HTTP serving
- **Single binary** deployment
- **Recovery middleware** for panic handling
- **SPA fallback** for client-side routing
- **Static file serving** from frontend/dist

### Data Layer
- **Periodic Table JSON** with 118 elements
- Each element includes: symbol, name, atomic mass, electronegativity, electron affinity, atomic radius, ionization energy, electron configuration, group, period, and type

### Build & Deployment
- **TypeScript Compiler** for type checking
- **Vite** for bundling and optimization
- **Terser** for JavaScript minification
- **Go compiler** for native binaries
- **Cross-platform** compatibility

---

## 🔌 API Reference

### GET `/api/ptable`
Returns periodic table data (requires `X-Requested-With: XMLHttpRequest` header)

**Response:** JSON array of element objects
```json
[
  {
    "symbol": "H",
    "name": "Hydrogen",
    "atomicMass": 1.008,
    "electronegativity": 2.20,
    "atomicNumber": 1,
    "group": 1,
    "period": 1
  }
]
```

**Error Responses:**
- `403` - Missing required header
- `500` - Data unavailable

### GET `/ptable.json`
Returns `403 Forbidden` (direct file access blocked)

### Static Files
All other assets are served with appropriate cache headers:
- `.html` files: `no-store`
- Other assets: `public, max-age=86400` (24 hours)

---

## 🎨 Customization

### Styling
Modify CSS variables in `src/style-*.css`:
```css
:root {
  --primary-color: #2c3e50;
  --secondary-color: #3498db;
  --font-family: 'Noto Sans', sans-serif;
}
```

### Adding New Calculators
1. Create a new module in `src/modules/`
2. Implement calculation logic
3. Add event listeners in `src/modules/eventListeners.ts`
4. Update UI handlers in `src/modules/uiHandlers.ts`

### Server Configuration
```bash
# Change port (both servers)
PORT=3000 npm start
PORT=3000 go run main.go

# Build Go binary with optimizations
go build -ldflags="-s -w" -o server
```

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

### In Progress 🚧
- [ ] Unit testing with Jest and Go testing
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Performance benchmarking suite
- [ ] Docker containers for both servers

### Planned 🎯
- [x] **Wails v2 desktop application** - Cross-platform native app with Go backend
- [ ] Offline support with service workers
- [ ] Chemical structure drawing with ChemDoodle
- [ ] Periodic table visualization
- [ ] Save/load calculation history
- [ ] Export results as PDF
- [ ] Dark mode theme
- [ ] Mobile app (React Native)
- [ ] WebAssembly core for client-side calculations

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
- Passes TypeScript compilation (`npm run build`)
- Passes Go compilation (`go build`)

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

## 🙏 Acknowledgements

- [Gin](https://gin-gonic.com/) team for the high-performance Go web framework
- [Wails](https://wails.io/) team for the Go desktop framework
- Periodic table data structure adapted from [PubChem](https://pubchem.ncbi.nlm.nih.gov/)
- [Vite](https://vitejs.dev/) for the next-generation build tool
- [TypeScript](https://www.typescriptlang.org/) for making JavaScript scale

---

<p align="center">
  <a href="https://chemutil.richardsblogs.com">Live Demo</a> •
  <a href="https://github.com/richie-rich90454/chemistry-utility/issues">Report Bug</a> •
  <a href="https://github.com/richie-rich90454/chemistry-utility/issues">Request Feature</a>
</p>