import {render} from "solid-js/web";
import type {JSX} from "solid-js";
import {App} from "./App";
import "./styles/global.css";

function initializeSolidApp(): void {
    let root: HTMLElement | null = document.getElementById("root");
    if (root === null) {
        return;
    }
    render(function (): JSX.Element { return <App />; }, root);
}

initializeSolidApp();
