import type {JSX} from "solid-js";
import {Router, Route} from "@solidjs/router";
import {HomePage} from "./routes/HomePage";

function App(): JSX.Element {
    return (
        <Router>
            <Route path="/" component={HomePage} />
        </Router>
    );
}

export {App};
