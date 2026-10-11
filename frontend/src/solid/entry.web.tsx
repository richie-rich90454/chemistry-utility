import {hydrate} from "solid-js/web";
import type {JSX} from "solid-js";
import {App} from "./App";
import {preloadRoute} from "./routeLoaders";
import {RuntimeDetector} from "../modules/runtimeDetector.js";
import "./styles/global.css";

// The entry route's chunk has to be resolved before hydration starts, so the
// lazy route component renders the same markup as the prerendered HTML the
// page was served with. Routes reached later load their chunk on demand
// (with a hover prefetch from the sidebar).
function preloadCurrentRoute(): Promise<void> {
    let path: string = window.location.pathname.replace(/\/+$/, "") || "/";
    return preloadRoute(path).catch(function (): void {
        /* hydration proceeds either way; the route renders once loaded */
    });
}

async function initializeSolidApp(): Promise<void> {
    let root: HTMLElement | null = document.getElementById("root");
    if (root === null) {
        return;
    }
    // The web build ships prerendered per-route HTML from scripts/prerender.mjs,
    // so the root already holds markup to adopt rather than create.
    await preloadCurrentRoute();
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
