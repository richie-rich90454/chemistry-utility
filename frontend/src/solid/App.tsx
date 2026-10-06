import type {JSX} from "solid-js";
import {createMemo, onMount} from "solid-js";
import {Router, Route, Navigate} from "@solidjs/router";
import {HomePage} from "./routes/HomePage";
import {MolarMass} from "./routes/molar-mass";
import {ElementLookup} from "./routes/element-lookup";
import {PeriodicTable} from "./routes/periodic-table";
import {EquationBalancerRoute} from "./routes/equation-balancer";
import UnitConverter from "./routes/unit-converter";
import {Dilution} from "./routes/dilution";
import {MassPercent} from "./routes/mass-percent";
import {SolutionMixing} from "./routes/solution-mixing";
import {BufferSolution} from "./routes/buffer";
import {PKaPKb} from "./routes/pka-pkb";
import {Ksp} from "./routes/ksp";
import {Colligative} from "./routes/colligative";
import {Titration} from "./routes/titration";
import {DebyeHuckel} from "./routes/debye-huckel";
import {CommonIonEffect} from "./routes/common-ion";
import {NuclearChemistry} from "./routes/nuclear";
import {GasLaws} from "./routes/gas-laws";
import {Electrochemistry} from "./routes/electrochemistry";
import {Thermodynamics} from "./routes/thermodynamics";
import {Kinetics} from "./routes/kinetics";
import {QuantumAtomic} from "./routes/quantum-atomic";
import {Stoichiometry} from "./routes/stoichiometry";
import {BondType} from "./routes/bond-type";
import {MolecularViewerRoute} from "./routes/molecular-viewer";
import {CompoundSearch} from "./routes/compound-search";
import {BatchCalc} from "./routes/batch-calc";
import {Dashboard} from "./routes/dashboard";
import {Sidebar} from "./components/Sidebar";
import {MobileBottomTabs} from "./components/MobileBottomTabs";
import {MobileNavSheet} from "./components/MobileNavSheet";
import {SkipLink} from "./components/SkipLink";
import {ScrollTopButton} from "./components/ScrollTopButton";
import {CommandPalette} from "./components/CommandPalette";
import {OnboardingTour} from "./components/OnboardingTour";
import {ComparisonModal} from "./components/ComparisonModal";
import {createSignal} from "solid-js";
import {isDesktop} from "./lib/desktopOnly";
function MassCalcRedirect(): JSX.Element {
    return <Navigate href="/molar-mass" />;
}
function CatchAllRedirect(): JSX.Element {
    return <Navigate href="/" />;
}
function DesktopOnlyNotice(): JSX.Element {
    return (
        <main aria-label="Desktop-only feature">
            <h1>Desktop app only</h1>
            <p>This feature is available in the desktop app, where all data stays on your machine. The anonymous web build does not include it.</p>
        </main>
    );
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
    ["#dashboard-view", "/dashboard"],
    ["#dashboard", "/dashboard"],
    ["#home", "/dashboard"],
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
    return (
        <div class={"app-shell" + (collapsed() ? " nav-collapsed" : "")}>
            <aside class="nav-pane">
                <Sidebar collapsed={collapsed()} onToggle={() => setCollapsed(!collapsed())} />
                <MobileBottomTabs />
            </aside>
            <main class="app-content" id="main-content" aria-label="Main content">
                <SkipLink />
                {props.children}
                <ScrollTopButton />
            </main>
            <MobileNavSheet />
            <CommandPalette />
            <OnboardingTour />
            <ComparisonModal />
        </div>
    );
}
function App(): JSX.Element {
    // Reactive (not a one-time snapshot) so tests/devtools toggling the
    // runtime mode re-resolves the desktop-only routes.
    let desktop = createMemo(function (): boolean {
        return isDesktop();
    });
    onMount(function (): void {
        applyHashRedirect();
    });
    return (
        <Router>
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
                <Route path="/molecular-viewer" component={MolecularViewerRoute} />
                <Route path="/compound-search" component={CompoundSearch} />
                {desktop() ? <Route path="/batch-calc" component={BatchCalc} /> : <Route path="/batch-calc" component={DesktopOnlyNotice} />}
                {desktop() ? <Route path="/dashboard" component={Dashboard} /> : <Route path="/dashboard" component={DesktopOnlyNotice} />}
                <Route path="*" component={CatchAllRedirect} />
            </Route>
        </Router>
    );
}
export {App, hashToPath};
