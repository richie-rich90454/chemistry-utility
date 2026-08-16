import {render} from "solid-js/web";
import type {JSX} from "solid-js";
import {App} from "./App";
import {ApiClient} from "../modules/apiClient.js";
import {RuntimeDetector} from "../modules/runtimeDetector.js";
import "./styles/global.css";

// Wails ships no service worker. A stale PWA service worker registered by an
// earlier build persists in the WebView2 profile and intercepts wails-dev
// fetches and route navigations, breaking them ("Failed to convert value to
// Response"). Unregister it and drop its caches before the app boots.
function clearStaleServiceWorker(): void {
    if (!RuntimeDetector.getInstance().isWails) {
        return;
    }
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (regs: ServiceWorkerRegistration[]): void {
            for (let i = 0; i < regs.length; i++) {
                regs[i].unregister();
            }
        }).catch(function (): void { /* best effort */ });
    }
    if ("caches" in window) {
        caches.keys().then(function (keys: string[]): void {
            for (let i = 0; i < keys.length; i++) {
                caches.delete(keys[i]);
            }
        }).catch(function (): void { /* best effort */ });
    }
}

function initializeSolidApp(): void {
    let root: HTMLElement | null = document.getElementById("root");
    if (root === null) {
        return;
    }
    render(function (): JSX.Element { return <App />; }, root);
}

// In the Wails desktop app the API runs in-process on a loopback port exposed
// by the App.GetAPIURL binding; the web build uses same-origin API calls.
// Resolved before any user action can trigger an API request.
async function configureApiClientForWails(): Promise<void> {
    if (!RuntimeDetector.getInstance().isWails) {
        return;
    }
    try {
        let w = window as unknown as {
            go?: { main?: { App?: { GetAPIURL?: () => Promise<string> } } };
        };
        let url: string | undefined = await w.go?.main?.App?.GetAPIURL?.();
        if (url && url !== "") {
            ApiClient.configure({ "baseURL": url, "timeout": 30000 });
        }
    } catch {
        // Binding unavailable: fall back to same-origin (harmless in web).
    }
}

clearStaleServiceWorker();
void configureApiClientForWails();
initializeSolidApp();
