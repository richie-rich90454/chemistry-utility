import type {JSX} from "solid-js";
import {onMount} from "solid-js";
import {Router, Route, Navigate} from "@solidjs/router";
import {HomePage} from "./routes/HomePage";
import {MolarMass} from "./routes/molar-mass";
import {ElementLookup} from "./routes/element-lookup";
import {PeriodicTable} from "./routes/periodic-table";
import {EquationBalancer} from "./routes/equation-balancer";
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
function MassCalcRedirect(): JSX.Element {
    return <Navigate href="/molar-mass" />;
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
    });
    return (
        <Router>
            <Route path="/" component={HomePage} />
            <Route path="/molar-mass" component={MolarMass} />
            <Route path="/mass-calc" component={MassCalcRedirect} />
            <Route path="/element-lookup" component={ElementLookup} />
            <Route path="/periodic-table" component={PeriodicTable} />
            <Route path="/equation-balancer" component={EquationBalancer} />
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
        </Router>
    );
}
export {App};
