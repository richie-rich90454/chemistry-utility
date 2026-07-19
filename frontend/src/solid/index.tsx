import {render} from "solid-js/web";
import type {JSX} from "solid-js";
import {App} from "./App";

function initializeSolidApp(): void {
    let script: HTMLScriptElement | null = document.currentScript as HTMLScriptElement | null;
    if (script !== null && script.getAttribute("data-solid-disabled") === "true") {
        return;
    }
    let root: HTMLElement | null = document.getElementById("root");
    if (root === null) {
        return;
    }
    render(function (): JSX.Element { return <App />; }, root);
}

initializeSolidApp();
