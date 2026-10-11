/**
 * Prerenders the WEB build (one static HTML file per route). The files are
 * hydrated at runtime by src/solid/entry.web.tsx.
 *
 *   1. bundle src/ssr/entrySsr.tsx with the same vite config (mode web)
 *   2. render every route with solid-js/web renderToString
 *   3. inject the markup plus per-route title/description/canonical/Open Graph
 *      tags into dist/<route>.html (dist/index.html for "/")
 *   4. regenerate the sitemap from the route list
 *
 * Run by `npm run build:web` after `vite build --mode web`.
 */
import {build} from "vite";
import {readFileSync, rmSync, writeFileSync, mkdirSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");
const ssrDir = join(distDir, ".ssr");

const SITE = "https://chemutil.richardsblogs.com";
const LASTMOD = new Date().toISOString().slice(0, 10);

// Every route in src/solid/App.tsx. title/description are the strings the
// route's CalculatorCard renders, so the meta tags can never drift from the
// page content; the four routes without a card on the web build (home, the
// two desktop-only tools, and the legacy redirect) carry their own copy.
const ROUTES = [
    {
        path: "/",
        dir: "index",
        title: "Free Online Chemistry Calculator Tools",
        description: "Free online chemistry calculator tools. Calculate molar mass, balance chemical equations, solve stoichiometry problems, compute gas laws, dilution formulas, electrochemistry, nuclear decay, and more. No signup required.",
        priority: "1.0",
        changefreq: "weekly",
    },
    {
        path: "/molar-mass",
        dir: "molar-mass",
        title: "Molar Mass Calculator",
        description: "Enter a chemical formula and the molar mass is calculated automatically. Supports nested parentheses, hydrates, and complex formulas. No button needed — just type.",
        priority: "0.9",
        changefreq: "monthly",
    },
    {
        path: "/element-lookup",
        dir: "element-lookup",
        title: "Element Lookup",
        description: "Type an element symbol, name, or atomic number and properties appear automatically. No button needed — just type. Supports all 118 elements with full property data.",
        priority: "0.9",
        changefreq: "monthly",
    },
    {
        path: "/periodic-table",
        dir: "periodic-table",
        title: "Interactive Periodic Table - Element Properties, Heatmaps, and Details",
        description: "Explore an interactive periodic table of all 118 elements with color-coded categories, hover tooltips, and a click-to-open detail panel. Switch to heatmap mode to visualize trends in electronegativity, atomic radius, ionization energy, or atomic mass using a blue-to-red gradient scale.",
        priority: "0.9",
        changefreq: "monthly",
    },
    {
        path: "/equation-balancer",
        dir: "equation-balancer",
        title: "Chemical Equation Balancer",
        description: "Enter an unbalanced chemical equation and it balances automatically. Supports regular equations (H2+O2->H2O), combustion (C6H6+O2->CO2+H2O), ionic species with charges, and redox half-reactions separated by ||. No button needed — just type.",
        priority: "0.9",
        changefreq: "monthly",
    },
    {
        path: "/unit-converter",
        dir: "unit-converter",
        title: "Unit Converter - Length, Mass, Temperature, Pressure, Energy & More",
        description: "Convert between SI and common chemistry units across length, mass, volume, pressure, energy, temperature, concentration, and time. The converter uses exact conversion factors and handles non-linear temperature scales (Celsius, Fahrenheit, Kelvin) separately. Pick a category, enter a value, and choose the source and target units to get a precise result.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/dilution",
        dir: "dilution",
        title: "Molarity and Dilution Calculator - Prepare Solutions Easily",
        description: "The dilution tool helps you figure out how much stock solution and solvent you need to reach a specific concentration. It uses the classic C1V1 = C2V2 relationship, making it easy to scale solutions up or down. Perfect for preparing lab samples or adjusting buffer strengths.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/mass-percent",
        dir: "mass-percent",
        title: "Mass Percent and Concentration Calculator",
        description: "This calculator shows the mass percent, ppm, or ppb of a solute in a solution. It is useful for environmental chemistry, purity checks, and analytical experiments. Just enter the amounts, and it quickly provides an easy-to-read breakdown of concentrations.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/solution-mixing",
        dir: "solution-mixing",
        title: "Solution Mixing Calculator - Calculate Final Molarity and more",
        description: "Mix two solutions of different concentrations and volumes to find the resulting molarity. This tool is great for preparing reactant mixtures or adjusting stock solutions in the lab. Enter your known values, and it calculates the final solution automatically.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/buffer",
        dir: "buffer",
        title: "Buffer Solution Calculator - Henderson-Hasselbalch Equation",
        description: "Calculate the pH of a buffer solution using the Henderson-Hasselbalch equation: pH = pKa + log([A-]/[HA]). You can also solve for pKa or the ratio of conjugate base to acid given a target pH.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/pka-pkb",
        dir: "pka-pkb",
        title: "pKa/pKb Calculator - Acid-Base Dissociation Constants",
        description: "Convert between Ka, pKa, Kb, and pKb using the relationships pKa = -log(Ka), pKb = -log(Kb), and pKa + pKb = 14 (at 25 C). Enter any one value to compute all four.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/ksp",
        dir: "ksp",
        title: "Ksp Calculator - Solubility Product Constant",
        description: "Calculate the solubility product constant (Ksp) from molar solubility, or find molar solubility from Ksp. Supports common salt types: AB, AB2, A2B, AB3, A3B.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/colligative",
        dir: "colligative",
        title: "Colligative Properties Calculator - Boiling Point, Freezing Point, Osmotic Pressure",
        description: "Calculate boiling point elevation (Tb = Kb m i), freezing point depression (Tf = Kf m i), osmotic pressure (pi = M R T i), and vapor pressure lowering (Raoult's law). Enter solute and solvent properties to compute all applicable colligative effects.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/titration",
        dir: "titration",
        title: "Titration Curve Calculator - pH vs Volume Data Points",
        description: "Generate pH vs volume data points for the titration of an acid with a strong base (NaOH). Supports strong and weak acids. Outputs data for chart rendering including equivalence and half-equivalence points.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/debye-huckel",
        dir: "debye-huckel",
        title: "Debye-Huckel Calculator - Activity Coefficients",
        description: "Calculate ionic strength and the mean activity coefficient using the Extended Debye-Huckel equation: log(gamma) = -0.509 |z+z-| sqrt(I) / (1 + 3.28 a sqrt(I)). Essential for accurate equilibrium calculations in electrolyte solutions.",
        priority: "0.7",
        changefreq: "monthly",
    },
    {
        path: "/common-ion",
        dir: "common-ion",
        title: "Common Ion Effect Calculator - Solubility with Common Ion",
        description: "Calculate the molar solubility of a salt when a common ion is already present in solution. Compares solubility with and without the common ion, demonstrating the common ion effect on equilibrium.",
        priority: "0.7",
        changefreq: "monthly",
    },
    {
        path: "/nuclear",
        dir: "nuclear",
        title: "Nuclear Chemistry Calculators",
        description: "The half-life calculator models exponential decay to show how much of a substance remains over time. It is helpful in radiochemistry, nuclear physics, and pharmacokinetics. Enter the initial quantity and half-life, and the calculator handles the rest with precise results.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/gas-laws",
        dir: "gas-laws",
        title: "Gas Laws",
        description: "Use this suite of gas calculators to solve for pressure, volume, temperature, or moles using the Ideal or Combined Gas Laws. For real gases, the Van der Waals correction adjusts for molecular interactions, giving more accurate predictions. It is perfect for review and more.",
        priority: "0.9",
        changefreq: "monthly",
    },
    {
        path: "/electrochemistry",
        dir: "electrochemistry",
        title: "Electrochemistry",
        description: "Calculate standard cell potentials, non-standard conditions with the Nernst equation, and electrolysis mass/current/time relationships. This tool is valuable for redox chemistry, battery experiments, and electroplating calculations. Enter your values, and get instant results for your reactions.",
        priority: "0.9",
        changefreq: "monthly",
    },
    {
        path: "/thermodynamics",
        dir: "thermodynamics",
        title: "Thermodynamics",
        description: "Calculate Gibbs free energy, Hess's Law enthalpy sums, entropy changes, heat capacity, bond enthalpy estimates, and Born-Haber cycle lattice energies. These tools cover the core thermodynamic relationships needed for general and physical chemistry courses.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/kinetics",
        dir: "kinetics",
        title: "Kinetics",
        description: "Calculate reaction rates, rate laws, and activation energies using the Arrhenius equation, integrated rate laws, and collision theory. Determine reaction orders from initial rates or concentration-time data. These tools are essential for understanding chemical kinetics and reaction mechanisms.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/quantum-atomic",
        dir: "quantum-atomic",
        title: "Quantum & Atomic",
        description: "Validate quantum numbers, generate electron configurations, calculate wavelengths with the Rydberg formula, de Broglie wavelengths, photoelectric effect parameters, and Heisenberg uncertainty limits. These tools cover the fundamental quantum mechanics concepts essential for modern chemistry and atomic physics courses.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/stoichiometry",
        dir: "stoichiometry",
        title: "Stoichiometry Calculator - Moles, Mass, and Limiting Reactants",
        description: "Enter a balanced chemical equation, choose a calculation type, and the calculator walks you through stoichiometric conversions — moles of product from moles of reactant, moles of reactant needed for a target product, or the limiting reactant and product yield given all reactant masses. Coefficients from the balanced equation are used directly.",
        priority: "0.9",
        changefreq: "monthly",
    },
    {
        path: "/bond-type",
        dir: "bond-type",
        title: "Bond Type Predictor - Ionic, Covalent, or Metallic",
        description: "Predict whether a bond is ionic, covalent, or metallic based on electronegativity differences and periodic table trends. This tool is ideal for students learning about chemical bonding. Simply enter the two element symbols, and get a clear prediction with the ΔEN calculation and the metal/non-metal classification that drove the decision.",
        priority: "0.8",
        changefreq: "monthly",
    },
    {
        path: "/molecular-viewer",
        dir: "molecular-viewer",
        title: "Molecular Structure Viewer - Render Molecules from SMILES",
        description: "Render 2D molecular structures from SMILES notation using SmilesDrawer. Choose a preset molecule or enter your own SMILES string, then click Render. Use the zoom controls (+/-) to adjust the scale, and Reset to return to the default view.",
        priority: "0.7",
        changefreq: "monthly",
    },
    {
        path: "/compound-search",
        dir: "compound-search",
        title: "Compound Database Search - Search Compounds by Name, Formula, CAS, or SMILES",
        description: "Look up chemical compounds by name, molecular formula, CAS number, or SMILES string. View detailed information including molar mass, InChI, and additional properties, then jump directly to the Molar Mass or Stoichiometry calculators with the formula pre-filled.",
        priority: "0.7",
        changefreq: "weekly",
    },
    {
        path: "/batch-calc",
        dir: "batch-calc",
        title: "Batch Calculation - Process Multiple Inputs from CSV",
        description: "Process many rows of calculator inputs from one CSV file. Available in the desktop app, where all data stays on your machine.",
        priority: "0.6",
        changefreq: "yearly",
    },
    {
        path: "/dashboard",
        dir: "dashboard",
        title: "Dashboard",
        description: "Saved calculations, workspaces, and plugin activity. Available in the desktop app, where all data stays on your machine.",
        priority: "0.6",
        changefreq: "yearly",
    },
    {
        path: "/mass-calc",
        dir: "mass-calc",
        title: "Molar Mass Calculator",
        description: "The legacy mass calculator moved to /molar-mass.",
        priority: "0.3",
        changefreq: "yearly",
        redirectTo: "/molar-mass",
    },
];

function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** Replaces the value of the first `attr` on the first `tag` match. */
function replaceAttr(html, tag, attr, value) {
    const re = new RegExp(`(<${tag}[^>]*?\\s${attr}=")[^"]*(")`);
    return html.replace(re, `$1${escapeHtml(value)}$2`);
}

function buildSitemap() {
    const urls = ROUTES.map(r => [
        "    <url>",
        `        <loc>${SITE}${r.path}</loc>`,
        `        <priority>${r.priority}</priority>`,
        `        <lastmod>${LASTMOD}</lastmod>`,
        `        <changefreq>${r.changefreq}</changefreq>`,
        "    </url>",
    ].join("\n")).join("\n");
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls,
        "</urlset>",
        "",
    ].join("\n");
}

rmSync(ssrDir, {recursive: true, force: true});

// 1. bundle the SSR entry with the same config (mode web keeps
//    RuntimeDetector.isWebMode true, so desktop-only routes render their notice)
await build({
    root,
    mode: "web",
    configFile: join(root, "vite.config.ts"),
    logLevel: "warn",
    clearScreen: false,
    resolve: {
        // The chart zoom plugin imports hammerjs, which needs a real window at
        // module scope, and nothing charts during prerendering.
        alias: [{find: /^chartjs-plugin-zoom$/, replacement: join(root, "scripts", "zoom-plugin.stub.mjs")}],
    },
    publicDir: false,
    build: {
        ssr: join(root, "src", "ssr", "entrySsr.tsx"),
        outDir: ssrDir,
        emptyOutDir: true,
        minify: false,
        sourcemap: false,
        target: "node20",
    },
});

const {renderRoute} = await import(pathToFileURL(join(ssrDir, "entrySsr.js")).href);
// Re-running into an already prerendered dist is fine: drop old markup first.
const emptyRoot = '<div id="root"></div>';
const shell = readFileSync(join(distDir, "index.html"), "utf8").replace(/<div id="root">[\s\S]*?<\/div>/, emptyRoot);
if (!shell.includes('<div id="root"') || !/rel="manifest"/.test(shell)) {
    process.stderr.write("prerender: dist/index.html is not the web shell (did `vite build --mode web` run?)\n");
    process.exit(1);
}

// 2+3. one HTML file per route, written as <route>/index.html so the URL the
//    browser reports matches the route path exactly. A flat molar-mass.html
//    would leave window.location.pathname as /molar-mass.html, which matches
//    no route and sends the router to the catch-all redirect, discarding the
//    hydrated markup.
for (const route of ROUTES) {
    const fullTitle = `${route.title} | Chemistry Utility`;
    const body = await renderRoute(route.path);
    if (!body.includes("app-shell")) {
        process.stderr.write(`prerender: ${route.path} rendered no app shell\n`);
        process.exit(1);
    }
    let html = shell.replace(emptyRoot, `<div id="root">${body}</div>`);
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`);
    html = replaceAttr(html, 'meta name="description"', "content", route.description);
    html = replaceAttr(html, 'link rel="canonical"', "href", `${SITE}${route.redirectTo ?? route.path}`);
    html = replaceAttr(html, 'meta property="og:url"', "content", `${SITE}${route.path}`);
    html = replaceAttr(html, 'meta property="og:title"', "content", fullTitle);
    html = replaceAttr(html, 'meta property="og:description"', "content", route.description);
    html = replaceAttr(html, 'meta property="twitter:url"', "content", `${SITE}${route.path}`);
    html = replaceAttr(html, 'meta property="twitter:title"', "content", fullTitle);
    html = replaceAttr(html, 'meta property="twitter:description"', "content", route.description);
    if (route.redirectTo) {
        html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n        <meta http-equiv="refresh" content="0; url=${route.redirectTo}">`);
        html = replaceAttr(html, 'meta name="robots"', "content", "noindex, follow");
    }
    const routeDir = join(distDir, route.dir);
    mkdirSync(routeDir, {recursive: true});
    writeFileSync(join(routeDir, "index.html"), html);
    // The root route must also live at dist/index.html. Static hosts serve
    // "/" from that file, not from dist/index/index.html, so without this copy
    // the homepage ships the empty vite shell and hydration has no markup to
    // adopt.
    if (route.path === "/") {
        writeFileSync(join(distDir, "index.html"), html);
    }
}

// 4. sitemap + robots
const sitemap = buildSitemap();
writeFileSync(join(distDir, "sitemap.xml"), sitemap);
writeFileSync(join(root, "public", "sitemap.xml"), sitemap);

const robotsPath = join(distDir, "robots.txt");
let robots = readFileSync(robotsPath, "utf8");
if (!/^Sitemap:/m.test(robots)) {
    robots = `${robots.trimEnd()}\nSitemap: ${SITE}/sitemap.xml\n`;
    writeFileSync(robotsPath, robots);
}

rmSync(ssrDir, {recursive: true, force: true});

process.stdout.write(`prerender: ${ROUTES.length} routes written to dist\n`);
