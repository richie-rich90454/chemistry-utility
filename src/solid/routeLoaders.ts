import {lazy} from "solid-js";
import type {Component} from "solid-js";

type RouteLoader = () => Promise<{default: Component}>;
type PreloadableComponent = Component & {preload?: () => unknown};

/**
 * One dynamic import per heavy route so each route's code (and its CSS)
 * ships as its own chunk. The home route and the app shell stay eager in
 * App.tsx. entry.web.tsx preloads the entry route before hydration, and
 * scripts/prerender.mjs preloads every route before rendering.
 */
const ROUTE_LOADERS: Record<string, RouteLoader> = {
    "/molar-mass": () => import("./routes/molar-mass").then(m => ({default: m.MolarMass})),
    "/element-lookup": () => import("./routes/element-lookup").then(m => ({default: m.ElementLookup})),
    "/periodic-table": () => import("./routes/periodic-table").then(m => ({default: m.PeriodicTable})),
    "/equation-balancer": () => import("./routes/equation-balancer").then(m => ({default: m.EquationBalancerRoute})),
    "/unit-converter": () => import("./routes/unit-converter").then(m => ({default: m.default})),
    "/dilution": () => import("./routes/dilution").then(m => ({default: m.Dilution})),
    "/mass-percent": () => import("./routes/mass-percent").then(m => ({default: m.MassPercent})),
    "/solution-mixing": () => import("./routes/solution-mixing").then(m => ({default: m.SolutionMixing})),
    "/buffer": () => import("./routes/buffer").then(m => ({default: m.BufferSolution})),
    "/pka-pkb": () => import("./routes/pka-pkb").then(m => ({default: m.PKaPKb})),
    "/ksp": () => import("./routes/ksp").then(m => ({default: m.Ksp})),
    "/colligative": () => import("./routes/colligative").then(m => ({default: m.Colligative})),
    "/titration": () => import("./routes/titration").then(m => ({default: m.Titration})),
    "/debye-huckel": () => import("./routes/debye-huckel").then(m => ({default: m.DebyeHuckel})),
    "/common-ion": () => import("./routes/common-ion").then(m => ({default: m.CommonIonEffect})),
    "/nuclear": () => import("./routes/nuclear").then(m => ({default: m.NuclearChemistry})),
    "/gas-laws": () => import("./routes/gas-laws").then(m => ({default: m.GasLaws})),
    "/electrochemistry": () => import("./routes/electrochemistry").then(m => ({default: m.Electrochemistry})),
    "/thermodynamics": () => import("./routes/thermodynamics").then(m => ({default: m.Thermodynamics})),
    "/kinetics": () => import("./routes/kinetics").then(m => ({default: m.Kinetics})),
    "/quantum-atomic": () => import("./routes/quantum-atomic").then(m => ({default: m.QuantumAtomic})),
    "/stoichiometry": () => import("./routes/stoichiometry").then(m => ({default: m.Stoichiometry})),
    "/bond-type": () => import("./routes/bond-type").then(m => ({default: m.BondType})),
    "/photoelectron-spectroscopy": () => import("./routes/photoelectron-spectroscopy").then(m => ({default: m.PhotoelectronSpectroscopy})),
    "/empirical-formula": () => import("./routes/empirical-formula").then(m => ({default: m.EmpiricalFormula})),
    "/mass-spectrometry": () => import("./routes/mass-spectrometry").then(m => ({default: m.MassSpectrometry})),
    "/vsepr-geometry": () => import("./routes/vsepr-geometry").then(m => ({default: m.VseprGeometry})),
    "/calorimetry": () => import("./routes/calorimetry").then(m => ({default: m.Calorimetry})),
    "/gibbs-equilibrium": () => import("./routes/gibbs-equilibrium").then(m => ({default: m.GibbsEquilibrium})),
    "/molality": () => import("./routes/molality").then(m => ({default: m.Molality})),
    "/beer-lambert": () => import("./routes/beer-lambert").then(m => ({default: m.BeerLambert})),
    "/serial-dilution": () => import("./routes/serial-dilution").then(m => ({default: m.SerialDilution})),
    "/le-chatelier": () => import("./routes/le-chatelier").then(m => ({default: m.LeChatelier})),
    "/molecular-viewer": () => import("./routes/molecular-viewer").then(m => ({default: m.MolecularViewerRoute})),
    "/compound-search": () => import("./routes/compound-search").then(m => ({default: m.CompoundSearch})),
    "/batch-calc": () => import("./routes/batch-calc").then(m => ({default: m.BatchCalc})),
    "/report": () => import("./routes/report").then(m => ({default: m.LabReport}))
};

let lazyComponents: Map<string, PreloadableComponent> = new Map();

function lazyRoute(path: string): PreloadableComponent {
    let existing: PreloadableComponent | undefined = lazyComponents.get(path);
    if (existing !== undefined) {
        return existing;
    }
    let loader: RouteLoader | undefined = ROUTE_LOADERS[path];
    /* v8 ignore next 3 -- every caller passes a key of ROUTE_LOADERS */
    if (loader === undefined) {
        throw new Error("No lazy loader registered for route: " + path);
    }
    let component: PreloadableComponent = lazy(loader) as PreloadableComponent;
    lazyComponents.set(path, component);
    return component;
}

/** Starts (idempotently) the chunk fetch for one route. */
function preloadRoute(path: string): Promise<void> {
    if (!(path in ROUTE_LOADERS)) {
        return Promise.resolve();
    }
    return Promise.resolve(lazyRoute(path).preload?.()).then(function (): void { return; });
}

/** Preloads every lazy route chunk (used by the prerender entry). */
function preloadAllLazyRoutes(): Promise<void> {
    let paths: string[] = Object.keys(ROUTE_LOADERS);
    return Promise.all(paths.map(preloadRoute)).then(function (): void { return; });
}

export {lazyRoute, preloadRoute, preloadAllLazyRoutes};
