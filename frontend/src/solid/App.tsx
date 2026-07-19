import type {JSX} from "solid-js";
import {onMount} from "solid-js";
import {Router, Route, Navigate} from "@solidjs/router";
import {HomePage} from "./routes/HomePage";
import {MolarMass} from "./routes/molar-mass";
import {ElementLookup} from "./routes/element-lookup";
import {PeriodicTable} from "./routes/periodic-table";
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
    });
    return (
        <Router>
            <Route path="/" component={HomePage} />
            <Route path="/molar-mass" component={MolarMass} />
            <Route path="/mass-calc" component={MassCalcRedirect} />
            <Route path="/element-lookup" component={ElementLookup} />
            <Route path="/periodic-table" component={PeriodicTable} />
        </Router>
    );
}
export {App};
