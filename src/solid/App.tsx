import type {JSX} from "solid-js";
import {onMount} from "solid-js";
import {Router, Route, Navigate} from "@solidjs/router";
import {HomePage} from "./routes/HomePage";
import {lazyRoute} from "./routeLoaders";
import {Sidebar} from "./components/Sidebar";
import {SidebarResizer} from "./components/SidebarResizer";
import {MobileBottomTabs} from "./components/MobileBottomTabs";
import {MobileNavSheet} from "./components/MobileNavSheet";
import {SkipLink} from "./components/SkipLink";
import {ScrollTopButton} from "./components/ScrollTopButton";
import {CommandPalette} from "./components/CommandPalette";
import {OnboardingTour} from "./components/OnboardingTour";
import {ComparisonModal} from "./components/ComparisonModal";
import {RouteTransition} from "./components/RouteTransition";
import {createSignal} from "solid-js";
import {onCleanup} from "solid-js";
import {useUrlState} from "./lib/useUrlState";
import {initSidebarWidth, isResizingSidebar} from "./stores/sidebarWidth";
// Heavy routes are code-split: each lazyRoute() key is a dynamic import
// chunk in routeLoaders.ts. The home route stays eager.
const MolarMass = lazyRoute("/molar-mass");
const ElementLookup = lazyRoute("/element-lookup");
const PeriodicTable = lazyRoute("/periodic-table");
const EquationBalancerRoute = lazyRoute("/equation-balancer");
const UnitConverter = lazyRoute("/unit-converter");
const Dilution = lazyRoute("/dilution");
const MassPercent = lazyRoute("/mass-percent");
const SolutionMixing = lazyRoute("/solution-mixing");
const BufferSolution = lazyRoute("/buffer");
const PKaPKb = lazyRoute("/pka-pkb");
const Ksp = lazyRoute("/ksp");
const Colligative = lazyRoute("/colligative");
const Titration = lazyRoute("/titration");
const DebyeHuckel = lazyRoute("/debye-huckel");
const CommonIonEffect = lazyRoute("/common-ion");
const NuclearChemistry = lazyRoute("/nuclear");
const GasLaws = lazyRoute("/gas-laws");
const Electrochemistry = lazyRoute("/electrochemistry");
const Thermodynamics = lazyRoute("/thermodynamics");
const Kinetics = lazyRoute("/kinetics");
const QuantumAtomic = lazyRoute("/quantum-atomic");
const Stoichiometry = lazyRoute("/stoichiometry");
const BondType = lazyRoute("/bond-type");
const PhotoelectronSpectroscopy = lazyRoute("/photoelectron-spectroscopy");
const EmpiricalFormula = lazyRoute("/empirical-formula");
const MassSpectrometry = lazyRoute("/mass-spectrometry");
const VseprGeometry = lazyRoute("/vsepr-geometry");
const Calorimetry = lazyRoute("/calorimetry");
const GibbsEquilibrium = lazyRoute("/gibbs-equilibrium");
const Molality = lazyRoute("/molality");
const BeerLambert = lazyRoute("/beer-lambert");
const SerialDilution = lazyRoute("/serial-dilution");
const LeChatelier = lazyRoute("/le-chatelier");
const MolecularViewerRoute = lazyRoute("/molecular-viewer");
const CompoundSearch = lazyRoute("/compound-search");
const BatchCalc = lazyRoute("/batch-calc");
const LabReport = lazyRoute("/report");
function MassCalcRedirect(): JSX.Element {
    return <Navigate href="/molar-mass" />;
}
function CatchAllRedirect(): JSX.Element {
    return <Navigate href="/" />;
}
const HASH_REDIRECTS: Array<[string, string]> = [
    ["#mass-calc", "/molar-mass"],
    ["#element-lookup", "/element-lookup"],
    ["#periodic-table", "/periodic-table"],
    ["#ptable-view", "/periodic-table"],
    ["#balancing", "/equation-balancer"],
    ["#equation-balancer", "/equation-balancer"],
    ["#unit-converter", "/unit-converter"],
    ["#dilution-calc", "/dilution"],
    ["#mass-percent-calc", "/mass-percent"],
    ["#solution-mixing-calc", "/solution-mixing"],
    ["#buffer-calc", "/buffer"],
    ["#pka-pkb-calc", "/pka-pkb"],
    ["#ksp-calc", "/ksp"],
    ["#colligative-calc", "/colligative"],
    ["#titration-calc", "/titration"],
    ["#debye-huckel-calc", "/debye-huckel"],
    ["#common-ion-calc", "/common-ion"],
    ["#nuclear-chemistry", "/nuclear"],
    ["#half-life-calc", "/nuclear"],
    ["#gas-laws", "/gas-laws"],
    ["#ideal-gas-law", "/gas-laws"],
    ["#combined-gas-law", "/gas-laws"],
    ["#van-der-waals", "/gas-laws"],
    ["#electrochemistry", "/electrochemistry"],
    ["#cell-potential", "/electrochemistry"],
    ["#nernst-equation", "/electrochemistry"],
    ["#electrolysis", "/electrochemistry"],
    ["#thermodynamics", "/thermodynamics"],
    ["#gibbs-free-energy", "/thermodynamics"],
    ["#hess-law", "/thermodynamics"],
    ["#entropy-change", "/thermodynamics"],
    ["#heat-capacity", "/thermodynamics"],
    ["#bond-enthalpy", "/thermodynamics"],
    ["#born-haber", "/thermodynamics"],
    ["#kinetics", "/kinetics"],
    ["#arrhenius-calc", "/kinetics"],
    ["#rate-law-calc", "/kinetics"],
    ["#integrated-rate-law-calc", "/kinetics"],
    ["#reaction-order-calc", "/kinetics"],
    ["#collision-theory-calc", "/kinetics"],
    ["#quantum-atomic", "/quantum-atomic"],
    ["#quantum-numbers", "/quantum-atomic"],
    ["#electron-configuration", "/quantum-atomic"],
    ["#rydberg-calc", "/quantum-atomic"],
    ["#debroglie-calc", "/quantum-atomic"],
    ["#photoelectric-calc", "/quantum-atomic"],
    ["#heisenberg-calc", "/quantum-atomic"],
    ["#stoichiometry", "/stoichiometry"],
    ["#bond-type-predictor", "/bond-type"],
    ["#molecular-viewer", "/molecular-viewer"],
    ["#compound-search", "/compound-search"],
    ["#batch-calc", "/batch-calc"],
    ["#home", "/"],
];
function hashToPath(hash: string): string | null {
    for (let i = 0; i < HASH_REDIRECTS.length; i++) {
        if (HASH_REDIRECTS[i][0] === hash) {
            return HASH_REDIRECTS[i][1];
        }
    }
    return null;
}
function applyHashRedirect(): void {
    let path: string | null = hashToPath(window.location.hash);
    if (path !== null) {
        window.location.replace(path);
    }
}
function AppShell(props: {children?: JSX.Element}): JSX.Element {
    let [collapsed, setCollapsed] = createSignal(false);
    // One owner of the shareable URL state for every calculator route.
    useUrlState();
    onMount(function (): void {
        // Restores the saved sidebar width and keeps it clamped on resize.
        onCleanup(initSidebarWidth());
    });
    return (
        <div class={"app-shell" + (collapsed() ? " nav-collapsed" : "")} data-resizing={isResizingSidebar() ? "" : undefined}>
            <aside class="nav-pane">
                <Sidebar collapsed={collapsed()} onToggle={() => setCollapsed(!collapsed())} />
                <MobileBottomTabs />
            </aside>
            {collapsed() ? null : <SidebarResizer />}
            <main class="app-content" id="main-content" aria-label="Main content">
                <SkipLink />
                <RouteTransition>{props.children}</RouteTransition>
                <ScrollTopButton />
            </main>
            <MobileNavSheet />
            <CommandPalette />
            <OnboardingTour />
            <ComparisonModal />
        </div>
    );
}
/**
 * The whole route tree, shell included, so the browser router and the
 * prerender entry (src/ssr/entrySsr.tsx) share one definition.
 */
function AppRoutes(): JSX.Element {
    return (
        <Route path="/" component={AppShell}>
            <Route path="/" component={HomePage} />
            <Route path="/molar-mass" component={MolarMass} />
            <Route path="/mass-calc" component={MassCalcRedirect} />
            <Route path="/element-lookup" component={ElementLookup} />
            <Route path="/periodic-table" component={PeriodicTable} />
            <Route path="/equation-balancer" component={EquationBalancerRoute} />
            <Route path="/unit-converter" component={UnitConverter} />
            <Route path="/dilution" component={Dilution} />
            <Route path="/mass-percent" component={MassPercent} />
            <Route path="/solution-mixing" component={SolutionMixing} />
            <Route path="/buffer" component={BufferSolution} />
            <Route path="/pka-pkb" component={PKaPKb} />
            <Route path="/ksp" component={Ksp} />
            <Route path="/colligative" component={Colligative} />
            <Route path="/titration" component={Titration} />
            <Route path="/debye-huckel" component={DebyeHuckel} />
            <Route path="/common-ion" component={CommonIonEffect} />
            <Route path="/nuclear" component={NuclearChemistry} />
            <Route path="/gas-laws" component={GasLaws} />
            <Route path="/electrochemistry" component={Electrochemistry} />
            <Route path="/thermodynamics" component={Thermodynamics} />
            <Route path="/kinetics" component={Kinetics} />
            <Route path="/quantum-atomic" component={QuantumAtomic} />
            <Route path="/stoichiometry" component={Stoichiometry} />
            <Route path="/bond-type" component={BondType} />
            <Route path="/photoelectron-spectroscopy" component={PhotoelectronSpectroscopy} />
            <Route path="/empirical-formula" component={EmpiricalFormula} />
            <Route path="/mass-spectrometry" component={MassSpectrometry} />
            <Route path="/vsepr-geometry" component={VseprGeometry} />
            <Route path="/calorimetry" component={Calorimetry} />
            <Route path="/gibbs-equilibrium" component={GibbsEquilibrium} />
            <Route path="/molality" component={Molality} />
            <Route path="/beer-lambert" component={BeerLambert} />
            <Route path="/serial-dilution" component={SerialDilution} />
            <Route path="/le-chatelier" component={LeChatelier} />
            <Route path="/molecular-viewer" component={MolecularViewerRoute} />
            <Route path="/compound-search" component={CompoundSearch} />
            <Route path="/batch-calc" component={BatchCalc} />
            <Route path="/report" component={LabReport} />
            <Route path="*" component={CatchAllRedirect} />
        </Route>
    );
}
/**
 * `url` is only passed by the prerender entry, which renders the same
 * component tree as the browser so every Solid hydration key lines up.
 */
function App(props: {url?: string}): JSX.Element {
    onMount(function (): void {
        applyHashRedirect();
    });
    return (
        <Router url={props.url}>
            <AppRoutes />
        </Router>
    );
}
export {App, AppRoutes, hashToPath};
