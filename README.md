# Chemistry Utility at [chemutil.richardsblogs.com](https://chemutil.richardsblogs.com)
- [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
- A comprehensive web‑based **Chemistry Utility** providing 11 specialized chemistry calculation tools for students, educators, and professionals. Built with **HTML5**, **CSS3**, **JavaScript ES6+**, and **Node.js**, served via **Fastify** for high performance and secure routing.

---
## Table of Contents
* [Features](#features)
* [Installation](#installation)
* [Usage](#usage)
* [Examples](#examples)
* [File Structure](#file-structure)
* [Technical Architecture](#technical-architecture)
* [API Endpoint](#api-endpoint)
* [Customization](#customization)
* [Contributing](#contributing)
* [Tests](#tests)
* [License](#license)
* [Acknowledgements](#acknowledgements)
---
## Features
* 🔎 **Element Information Lookup**
  * Retrieve comprehensive element data including: Symbol, Name, Atomic Mass (u), Atomic Number, Electronegativity, Electron Affinity (kJ/mol), Atomic Radius (pm), Ionization Energy (kJ/mol), Valence & Total Electrons, Group, Period, and Element Type.

* ⚖️ **Molar Mass Calculator**
  * Compute molar mass for any valid chemical formula—including nested parentheses—with error handling for invalid inputs.

* 🔢 **Chemical Equation Balancer**
  * Auto-balance chemical equations with adjustable coefficient search up to 10.

* 🧪 **Stoichiometry Calculator**
  * Three modes: Product from Reactant, Reactant from Product, and Limiting Reactant. Dynamically generates input fields based on balanced equations.

* 🧪 **Dilution Calculator**
  * Solution preparation using C₁V₁ = C₂V₂ formula with flexible parameter solving.

* 📊 **Mass Percent & Concentration Calculator**
  * Calculate mass percent, ppm (parts per million), and ppb (parts per billion) concentrations.

* 🧪 **Solution Mixing Calculator**
  * Determine final molarity when mixing two solutions of different concentrations and volumes.

* ☢️ **Nuclear Chemistry Tools**
  * Half-life calculator for exponential decay modeling with multiple solving options.

* 🌬️ **Gas Laws Calculator**
  * Ideal gas law (PV = nRT), combined gas law, and Van der Waals equation for real gases.

* ⚡ **Electrochemistry Tools**
  * Cell potential calculations (standard and non-standard), Nernst equation solver, and electrolysis mass/current/time relationships.

* 🔗 **Bond Type Predictor**
  * Predict ionic, covalent, or metallic bonds based on electronegativity differences.

* 🛡️ **Secure & Robust Server**
  * Fastify-powered server with security headers, API validation, and graceful shutdown logic.
---
## Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/richie-rich90454/Chemistry-Utility.git
   cd chemistry-utility
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Ensure** `ptable.json` is present in the project root under the schema defined in `Schema.txt`.
4. **Start the server**
   ```bash
   node server.js
   ```
   * By default, listens on port **6005**. Override via `PORT` environment variable if needed.
---
## Usage
1. **Start the server:**
   ```bash
   node server.js
   ```

2. **Access the application:**
   ```
   http://localhost:6005
   ```

3. **Navigate through 11 chemistry tools:**
   * **Element Lookup** - Enter element symbol or name for detailed atomic data
   * **Molar Mass Calculator** - Input chemical formulas for molecular weight calculations
   * **Equation Balancer** - Enter unbalanced equations to get balanced results
   * **Dilution Calculator** - Solve for any parameter in C₁V₁ = C₂V₂
   * **Mass Percent Calculator** - Calculate %, ppm, or ppb concentrations
   * **Solution Mixing Calculator** - Determine final molarity from mixed solutions
   * **Nuclear Chemistry** - Half-life calculations for exponential decay
   * **Gas Laws** - Ideal gas law, combined gas law, and Van der Waals equation
   * **Electrochemistry** - Cell potential, Nernst equation, and electrolysis
   * **Stoichiometry** - Product/reactant calculations and limiting reactants
   * **Bond Type Predictor** - Ionic, covalent, or metallic bond prediction

4. **Desktop Application (Optional):**
   ```bash
   npm start  # Launch Electron desktop app
   ```

Results update dynamically with instant calculations—no page reloads required.
---
## Examples
### Molar Mass
* **Input:** `Al2(SO4)3`
* **Output:** `342.15 g/mol`

### Equation Balancing
* **Input:** `C3H8+O2->CO2+H2O`
* **Output:** `C3H8+5O2->3CO2+4H2O`

### Stoichiometry (Limiting Reactant)
* **Equation:** `2H2+O2->2H2O`
* **Inputs:** H2 = 3 mol, O2 = 1 mol
* **Result:** Limiting reactant: `O2`, Max H2O = `2 mol`

### Gas Laws (Ideal Gas Law)
* **Input:** P = ?, V = 2.5 L, n = 0.1 mol, T = 298 K
* **Output:** `P = 0.98 atm`

### Electrochemistry (Cell Potential)
* **Input:** E°₁ = 0.34 V (Cu²⁺/Cu), E°₂ = -0.76 V (Zn²⁺/Zn)
* **Output:** `E°_cell = 1.10 V`

### Nuclear Chemistry (Half-Life)
* **Input:** Initial = 100 g, Time = 10 years, Half-life = 5 years
* **Output:** `Remaining = 25 g`

### Bond Type Prediction
* **Input:** Na (0.93) and Cl (3.16)
* **Output:** `Ionic bond (ΔEN = 2.23)`
---
## Technical Architecture
### Frontend
- **HTML5** with comprehensive SEO meta tags and structured data
- **CSS3** with responsive design and Google Fonts integration
- **JavaScript ES6+** with modular architecture
- **Progressive Web App** capabilities with service worker support

### Backend
- **Node.js** with **Fastify** framework for high-performance serving
- Secure API endpoints with XMLHttpRequest validation
- Static file serving with proper cache control headers
- Security headers (X-Content-Type-Options, HSTS)

### Data Layer
- **ptable.json** - Complete periodic table data with 118 elements
- Each element includes comprehensive properties: symbol, name, atomic mass, electronegativity, electron affinity, atomic radius, ionization energy, valence electrons, group, period, and type

### Modular Design
The application follows a modular architecture with specialized components:
- **Formula Parser** - Chemical formula parsing and validation
- **Equation Balancer** - Chemical equation balancing algorithms
- **Stoichiometry Calculator** - Mole ratio and limiting reactant calculations
- **Gas Law Solvers** - Ideal, combined, and Van der Waals equations
- **Electrochemistry Tools** - Cell potential and electrolysis calculations
- **Solution Calculators** - Concentration, dilution, and mixing calculations
- **Nuclear Chemistry** - Half-life and exponential decay modeling
- **Bond Predictor** - Electronegativity-based bond type prediction

### Security Features
- Removes X-Powered-By header
- Validates API requests with X-Requested-With header
- Secure file handling with temporary directories
- Input sanitization and error handling
- Graceful shutdown and cleanup procedures

### Build & Deployment
- **npm** package management
- **Electron** for cross-platform desktop applications
- **Fastify** for web server with optimized routing
- **Minification** for production assets
- **SEO optimization** with structured data and sitemap
---
## File Structure
```
chemistry-utility/
├── index.html              # Main application interface with SEO optimization
├── style.css              # Responsive CSS styling
├── script.js              # Main client-side JavaScript logic
├── script.min.js          # Minified production script
├── render.js              # UI rendering utilities
├── render.min.js          # Minified rendering utilities
├── server.js              # Fastify server with security features
├── main.js                # Electron main process (desktop app)
├── package.json           # Project metadata and dependencies
├── package-lock.json      # Dependency lock file
├── ptable.json            # Complete periodic table data (118 elements)
├── Schema.txt             # Data schema for ptable.json
├── README.md              # Project documentation
├── LICENSE                # MIT License
├── sitemap.xml            # SEO sitemap
├── terser.config.json     # JavaScript minification configuration
├── favicon.ico            # Website favicon
├── favicon.png            # PNG favicon
├── favicon.icns           # macOS icon
├── apple-touch-icon.png   # iOS touch icon
├── .gitignore             # Git ignore rules
└── modules/               # Modular JavaScript components
    ├── animationUtils.js & .full.js
    ├── bondPredictor.js & .full.js
    ├── electrochemistryCalculators.js & .full.js
    ├── equationBalancer.js & .full.js
    ├── eventListeners.js & .full.js
    ├── formulaParser.js & .full.js
    ├── gasLawCalculators.js & .full.js
    ├── solutionCalculators.js & .full.js
    ├── stoichiometryCalculator.js & .full.js
    └── uiHandlers.js & .full.js
```
---
## API Endpoint
### GET `/api/ptable`
* **Description:** Serves `ptable.json` only when `X-Requested-With: XMLHttpRequest` header is present.
* **Response:** JSON array of element objects.
* **Errors:** 403 if header missing, 500 if data missing.
### GET `/ptable.json`
* **Response:** 403 Forbidden (direct file access blocked).
### Static files
* All other assets and paths (`/`, `/*.html`, `/*.js`, etc.) are served via Fastify’s static plugin with appropriate `Cache-Control` headers.
---
## Customization
### Styling
- **CSS Variables:** Modify CSS custom properties in `style.css` for colors, fonts, and spacing
- **Responsive Design:** Adjust breakpoints and layout in `style.css`
- **Google Fonts:** Change font families in `index.html` head section

### Server Configuration
- **Port:** Set `PORT` environment variable or modify `server.js` default port (6005)
- **Security Headers:** Customize security policies in Fastify hooks
- **Caching:** Adjust cache control headers in static file serving
- **API Routes:** Add new endpoints in `server.js`

### Data Customization
- **Periodic Table:** Update `ptable.json` following `Schema.txt` format
- **Element Properties:** Add new element properties or modify existing ones
- **Validation:** Extend formula parsing in `modules/formulaParser.js`

### Module Development
- **New Calculators:** Create modules following the established pattern
- **Algorithm Updates:** Modify calculation logic in respective module files
- **UI Integration:** Add event listeners in `modules/eventListeners.js`
- **Animation:** Customize UI animations in `modules/animationUtils.js`

### Build Process
- **Minification:** Configure `terser.config.json` for JavaScript optimization
- **Electron Build:** Modify `package.json` build settings for desktop distribution
- **SEO:** Update structured data and meta tags in `index.html`
---
## Contributing
1. Fork the repository and create a feature branch.
2. Commit changes with clear messages.
3. Submit a PR describing your feature or fix.
Please include tests or examples for new logic.
---
## Tests
> *(No automated tests yet; manual UI tests recommended.)*
> *Future:* Add a test suite (e.g., Mocha/Chai) and document `npm test`.
---
## License
This project is licensed under the **MIT License**.
See [LICENSE](LICENSE) for details.
## Acknowledgements
* Fastify team for a performant Node.js framework.
* Periodic table data schema inspired by \[PubChem] and \[Wikidata].
* Fonts from Google Fonts (Noto Sans & EB Garamond).
