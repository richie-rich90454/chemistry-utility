import type {JSX} from "solid-js";
import {Router, Route} from "@solidjs/router";
import {HomePage} from "./routes/HomePage";
import {MolarMass} from "./routes/molar-mass";
function App(): JSX.Element {
    return (
        <Router>
            <Route path="/" component={HomePage} />
            <Route path="/molar-mass" component={MolarMass} />
        </Router>
    );
}

export {App};
