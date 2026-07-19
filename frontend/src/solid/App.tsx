import type {JSX} from "solid-js";
import {onMount} from "solid-js";
import {Router, Route, Redirect} from "@solidjs/router";
import {HomePage} from "./routes/HomePage";
import {MolarMass} from "./routes/molar-mass";
function MassCalcRedirect(): JSX.Element {
    return <Redirect href="/molar-mass" />;
}
function App(): JSX.Element {
    onMount(function (): void {
        if (window.location.hash === "#mass-calc") {
            window.location.replace("/molar-mass");
        }
    });
    return (
        <Router>
            <Route path="/" component={HomePage} />
            <Route path="/molar-mass" component={MolarMass} />
            <Route path="/mass-calc" component={MassCalcRedirect} />
        </Router>
    );
}
export {App};
