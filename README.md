# Chemistry Utility 🔬

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Go Version](https://img.shields.io/badge/go-%3E%3D1.21-00ADD8)](https://golang.org)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-000000)](https://fastify.dev)
[![Fiber](https://img.shields.io/badge/Fiber-2.x-00ADD8)](https://gofiber.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)](https://vitejs.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4)](https://github.com/richie-rich90454/chemistry-utility/pulls)
[![GitHub stars](https://img.shields.io/github/stars/richie-rich90454/chemistry-utility?style=social)](https://github.com/richie-rich90454/chemistry-utility/stargazers)
[![Go Report Card](https://goreportcard.com/badge/github.com/richie-rich90454/chemistry-utility)](https://goreportcard.com/report/github.com/richie-rich90454/chemistry-utility)
[![Bundle Size](https://img.shields.io/badge/bundle%20size-optimized-blueviolet)](https://vitejs.dev)

A comprehensive **Chemistry Utility** offering 11 specialized calculation tools for chemistry students, educators, and professionals. Built with **TypeScript**, **HTML5**, **CSS3**, and dual-server architecture with **Node.js/Fastify** and **Go/Fiber** implementations.

🌐 **Live Demo**: [chemutil.richardsblogs.com](https://chemutil.richardsblogs.com)

---

## 📋 Table of Contents
- [Features](#features)
- [Dual-Server Architecture](#dual-server-architecture)
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
- **Dual-Server Architecture**: Choose between Node.js/Fastify or Go/Fiber implementations
- **Modular Architecture**: Separated concerns with dedicated modules for each calculator type
- **Responsive Design**: Mobile-first approach with fluid layouts
- **Vite Build System**: Fast development with optimized production builds
- **SEO Optimized**: Structured data, sitemap, and comprehensive meta tags

---

## 🏗 Dual-Server Architecture

The Chemistry Utility offers two server implementations, allowing you to choose based on your deployment needs:

### Server Comparison

| Feature | Node.js (Fastify) | Go (Fiber) |
|---------|-------------------|------------|
| **Language** | JavaScript/TypeScript | Go |
| **Framework** | Fastify 4.x | Fiber 2.x |
| **Startup Time** | ~200-400ms | ~5-10ms |
| **Memory Footprint** | ~30-50 MB | ~5-15 MB |
| **Concurrency** | Good (event loop) | Excellent (goroutines) |
| **Development Speed** | Faster (hot reload) | Moderate |
| **Type Safety** | TypeScript | Native |
| **Binary Size** | N/A (interpreter) | ~12-15 MB standalone |
| **Cross-Compilation** | Requires Node.js | Single binary |

### When to Use Each

**Choose Node.js/Fastify if you:**
- Prefer JavaScript/TypeScript ecosystem
- Want faster development cycles with hot reload
- Need access to npm packages
- Are deploying to traditional Node.js environments

**Choose Go/Fiber if you:**
- Need minimal resource usage
- Want a single binary deployment
- Require maximum performance and concurrency
- Are deploying to containerized environments
- Need native cross-platform compilation

### Running Both Servers

```bash
# Node.js/Fastify server
npm run dev        # Development with hot reload
npm start          # Production server

# Go/Fiber server
go mod download    # Download Go dependencies
go run main.go     # Run directly
go build -o server # Build standalone binary
./server           # Run binary
```

Both servers run on port `6005` by default (configurable via `PORT` environment variable) and provide identical functionality.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.x or higher (for Node.js server)
- **Go** 1.21 or higher (for Go server)
- **npm** 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/richie-rich90454/chemistry-utility.git
cd chemistry-utility

# Install Node.js dependencies
npm install

# Download Go dependencies
go mod download

# Build the frontend
npm run build

# Start the server (choose one)
npm start                    # Node.js server
go run main.go              # Go server
./server                    # Pre-built Go binary
```

The application will be available at `http://localhost:6005`

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
├── src/                    # TypeScript source files
│   ├── modules/            # Modular calculator components
│   │   ├── animationUtils.ts
│   │   ├── bondPredictor.ts
│   │   ├── electrochemistryCalculators.ts
│   │   ├── equationBalancer.ts
│   │   ├── eventListeners.ts
│   │   ├── formulaParser.ts
│   │   ├── gasLawCalculators.ts
│   │   ├── solutionCalculators.ts
│   │   ├── stoichiometryCalculator.ts
│   │   └── uiHandlers.ts
│   ├── render.ts           # UI rendering utilities
│   ├── script.ts           # Main client logic
│   └── types.d.ts          # TypeScript type definitions
├── public/                 # Static assets
│   ├── index.html          # Main application interface
│   ├── style-web.css       # Web styling
│   ├── style-tauri.css     # Tauri app styling
│   ├── favicon.ico         # Website favicon
│   └── sitemap.xml         # SEO sitemap
├── server/                 # Server implementations
│   ├── server.js           # Node.js/Fastify server (ES modules)
│   └── ptable.json         # Periodic table data (118 elements)
├── main.go                 # Go/Fiber server implementation
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
- **Dual CSS** variants (web and Tauri-optimized)

### Backend (Node.js/Fastify)
- **Node.js** runtime with **Fastify** framework
- **ES Modules** for modern import/export syntax
- **Security headers** and request validation
- **Static file serving** with cache control
- **Graceful shutdown** with timeout handling

### Backend (Go/Fiber)
- **Go** compiled binary with **Fiber** framework
- **Single executable** deployment
- **Recovery middleware** for panic handling
- **Security headers** and URL sanitization
- **Graceful shutdown** with configurable timeout

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
- [x] Go/Fiber server implementation
- [x] Dual-server architecture

### In Progress 🚧
- [ ] Unit testing with Jest and Go testing
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Performance benchmarking suite
- [ ] Docker containers for both servers

### Planned 🎯
- [ ] **Tauri v2 desktop application** - Cross-platform native app with smaller bundle size
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

- [Fastify](https://fastify.dev/) team for the excellent Node.js framework
- [Fiber](https://gofiber.io/) team for the performant Go framework
- Periodic table data structure adapted from [PubChem](https://pubchem.ncbi.nlm.nih.gov/)
- [Vite](https://vitejs.dev/) for the next-generation build tool
- [TypeScript](https://www.typescriptlang.org/) for making JavaScript scale
- [Tauri](https://tauri.app/) for future desktop application capabilities

---

<p align="center">
  <a href="https://chemutil.richardsblogs.com">Live Demo</a> •
  <a href="https://github.com/richie-rich90454/chemistry-utility/issues">Report Bug</a> •
  <a href="https://github.com/richie-rich90454/chemistry-utility/issues">Request Feature</a>
</p>