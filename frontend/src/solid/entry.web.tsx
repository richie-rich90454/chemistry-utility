import {hydrate} from "solid-js/web";
import type {JSX} from "solid-js";
import {App} from "./App";
import {RuntimeDetector} from "../modules/runtimeDetector.js";
import "./styles/global.css";

function initializeSolidApp(): void {
    let root: HTMLElement | null = document.getElementById("root");
    if (root === null) {
        return;
    }
    // The web build ships prerendered per-route HTML from scripts/prerender.mjs,
    // so the root already holds markup to adopt rather than create.
    hydrate(function (): JSX.Element { return <App />; }, root);
}

// Register the PWA service worker on the web build only (production). The
// desktop build never reaches this entry, and dev mode is skipped so Vite
// HMR is never intercepted.
function registerServiceWorker(): void {
    if (RuntimeDetector.getInstance().isWails || !import.meta.env.PROD || !("serviceWorker" in navigator)) {
        return;
    }
    navigator.serviceWorker.register("/sw.js").catch(function (): void {
        /* best effort: app works without offline support */
    });
}

initializeSolidApp();
registerServiceWorker();
