import type {JSX} from "solid-js";
import {onMount, lazy} from "solid-js";
import {Router, Route, Navigate} from "@solidjs/router";
const HomePage = lazy(() => import("./routes/HomePage"));
const MolarMass = lazy(() => import("./routes/molar-mass"));
const ElementLookup = lazy(() => import("./routes/element-lookup"));
const PeriodicTable = lazy(() => import("./routes/periodic-table"));
const EquationBalancerRoute = lazy(() => import("./routes/equation-balancer"));
const UnitConverter = lazy(() => import("./routes/unit-converter"));
const Dilution = lazy(() => import("./routes/dilution"));
const MassPercent = lazy(() => import("./routes/mass-percent"));
const SolutionMixing = lazy(() => import("./routes/solution-mixing"));
const BufferSolution = lazy(() => import("./routes/buffer"));
const PKaPKb = lazy(() => import("./routes/pka-pkb"));
const Ksp = lazy(() => import("./routes/ksp"));
const Colligative = lazy(() => import("./routes/colligative"));
const Titration = lazy(() => import("./routes/titration"));
const DebyeHuckel = lazy(() => import("./routes/debye-huckel"));
const CommonIonEffect = lazy(() => import("./routes/common-ion"));
const NuclearChemistry = lazy(() => import("./routes/nuclear"));
const GasLaws = lazy(() => import("./routes/gas-laws"));
const Electrochemistry = lazy(() => import("./routes/electrochemistry"));
const Thermodynamics = lazy(() => import("./routes/thermodynamics"));
const Kinetics = lazy(() => import("./routes/kinetics"));
const QuantumAtomic = lazy(() => import("./routes/quantum-atomic"));
const Stoichiometry = lazy(() => import("./routes/stoichiometry"));
const BondType = lazy(() => import("./routes/bond-type"));
const MolecularViewerRoute = lazy(() => import("./routes/molecular-viewer"));
const CompoundSearch = lazy(() => import("./routes/compound-search"));
const BatchCalc = lazy(() => import("./routes/batch-calc"));
const Dashboard = lazy(() => import("./routes/dashboard"));
import {Sidebar} from "./components/Sidebar";
import {MobileBottomTabs} from "./components/MobileBottomTabs";
import {MobileNavSheet} from "./components/MobileNavSheet";
import {SkipLink} from "./components/SkipLink";
import {ScrollTopButton} from "./components/ScrollTopButton";
import {createSignal} from "solid-js";
function MassCalcRedirect(): JSX.Element {
    return <Navigate href="/molar-mass" />;
}
function CatchAllRedirect(): JSX.Element {
    return <Navigate href="/" />;
}
function AppShell(props: {children?: JSX.Element}): JSX.Element {
    let [collapsed, setCollapsed] = createSignal(false);
    return (
        <div class={"app-shell" + (collapsed() ? " nav-collapsed" : "")}>
            <aside class="nav-pane">
                <Sidebar collapsed={collapsed()} onToggle={() => setCollapsed(!collapsed())} />
                <MobileBottomTabs />
            </aside>
            <main class="app-content">
                <SkipLink />
                {props.children}
                <ScrollTopButton />
            </main>
            <MobileNavSheet />
        </div>
    );
}
function App(): JSX.Element {
    onMount(function (): void {
        if (window.location.hash === "#mass-calc") {
            window.location.replace("/molar-mass");
        }
        if (window.location.hash === "#element-lookup") {
            window.location.replace("/element-lookup");
        }
        if (window.location.hash === "#periodic-table") {
            window.location.replace("/periodic-table");
        }
        if (window.location.hash === "#ptable-view") {
            window.location.replace("/periodic-table");
        }
        if (window.location.hash === "#balancing") {
            window.location.replace("/equation-balancer");
        }
        if (window.location.hash === "#equation-balancer") {
            window.location.replace("/equation-balancer");
        }
        if (window.location.hash === "#unit-converter") {
            window.location.replace("/unit-converter");
        }
        if (window.location.hash === "#dilution-calc") {
            window.location.replace("/dilution");
        }
        if (window.location.hash === "#mass-percent-calc") {
            window.location.replace("/mass-percent");
        }
        if (window.location.hash === "#solution-mixing-calc") {
            window.location.replace("/solution-mixing");
        }
        if (window.location.hash === "#buffer-calc") {
            window.location.replace("/buffer");
        }
        if (window.location.hash === "#pka-pkb-calc") {
            window.location.replace("/pka-pkb");
        }
        if (window.location.hash === "#ksp-calc") {
            window.location.replace("/ksp");
        }
        if (window.location.hash === "#colligative-calc") {
            window.location.replace("/colligative");
        }
        if (window.location.hash === "#titration-calc") {
            window.location.replace("/titration");
        }
        if (window.location.hash === "#debye-huckel-calc") {
            window.location.replace("/debye-huckel");
        }
        if (window.location.hash === "#common-ion-calc") {
            window.location.replace("/common-ion");
        }
        if (window.location.hash === "#nuclear-chemistry") {
            window.location.replace("/nuclear");
        }
        if (window.location.hash === "#half-life-calc") {
            window.location.replace("/nuclear");
        }
        if (window.location.hash === "#gas-laws") {
            window.location.replace("/gas-laws");
        }
        if (window.location.hash === "#ideal-gas-law") {
            window.location.replace("/gas-laws");
        }
        if (window.location.hash === "#combined-gas-law") {
            window.location.replace("/gas-laws");
        }
        if (window.location.hash === "#van-der-waals") {
            window.location.replace("/gas-laws");
        }
        if (window.location.hash === "#electrochemistry") {
            window.location.replace("/electrochemistry");
        }
        if (window.location.hash === "#cell-potential") {
            window.location.replace("/electrochemistry");
        }
        if (window.location.hash === "#nernst-equation") {
            window.location.replace("/electrochemistry");
        }
        if (window.location.hash === "#electrolysis") {
            window.location.replace("/electrochemistry");
        }
        if (window.location.hash === "#thermodynamics") {
            window.location.replace("/thermodynamics");
        }
        if (window.location.hash === "#gibbs-free-energy") {
            window.location.replace("/thermodynamics");
        }
        if (window.location.hash === "#hess-law") {
            window.location.replace("/thermodynamics");
        }
        if (window.location.hash === "#entropy-change") {
            window.location.replace("/thermodynamics");
        }
        if (window.location.hash === "#heat-capacity") {
            window.location.replace("/thermodynamics");
        }
        if (window.location.hash === "#bond-enthalpy") {
            window.location.replace("/thermodynamics");
        }
        if (window.location.hash === "#born-haber") {
            window.location.replace("/thermodynamics");
        }
        if (window.location.hash === "#kinetics") {
            window.location.replace("/kinetics");
        }
        if (window.location.hash === "#arrhenius-calc") {
            window.location.replace("/kinetics");
        }
        if (window.location.hash === "#rate-law-calc") {
            window.location.replace("/kinetics");
        }
        if (window.location.hash === "#integrated-rate-law-calc") {
            window.location.replace("/kinetics");
        }
        if (window.location.hash === "#reaction-order-calc") {
            window.location.replace("/kinetics");
        }
        if (window.location.hash === "#collision-theory-calc") {
            window.location.replace("/kinetics");
        }
        if (window.location.hash === "#quantum-atomic") {
            window.location.replace("/quantum-atomic");
        }
        if (window.location.hash === "#quantum-numbers") {
            window.location.replace("/quantum-atomic");
        }
        if (window.location.hash === "#electron-configuration") {
            window.location.replace("/quantum-atomic");
        }
        if (window.location.hash === "#rydberg-calc") {
            window.location.replace("/quantum-atomic");
        }
        if (window.location.hash === "#debroglie-calc") {
            window.location.replace("/quantum-atomic");
        }
        if (window.location.hash === "#photoelectric-calc") {
            window.location.replace("/quantum-atomic");
        }
        if (window.location.hash === "#heisenberg-calc") {
            window.location.replace("/quantum-atomic");
        }
        if (window.location.hash === "#stoichiometry") {
            window.location.replace("/stoichiometry");
        }
        if (window.location.hash === "#bond-type-predictor") {
            window.location.replace("/bond-type");
        }
        if (window.location.hash === "#molecular-viewer") {
            window.location.replace("/molecular-viewer");
        }
        if (window.location.hash === "#compound-search") {
            window.location.replace("/compound-search");
        }
        if (window.location.hash === "#batch-calc") {
            window.location.replace("/batch-calc");
        }
        if (window.location.hash === "#dashboard-view") {
            window.location.replace("/dashboard");
        }
        if (window.location.hash === "#dashboard") {
            window.location.replace("/dashboard");
        }
        if (window.location.hash === "#home") {
            window.location.replace("/dashboard");
        }
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
                <Route path="/batch-calc" component={BatchCalc} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="*" component={CatchAllRedirect} />
            </Route>
        </Router>
    );
}
export {App};
