import { RuntimeDetector } from "./runtimeDetector.js";

/**
 * Singleton guard that detects when the application is running in web mode
 * (a browser without the Wails desktop runtime) and disables features that
 * depend on the Go backend API. Backend-dependent features include the
 * Compound Database Search and the Batch Calculator, both of which issue
 * requests to /api/v1/* endpoints that only exist when the Go server is
 * running alongside the frontend.
 *
 * In web mode the guard applies a `web-mode` class to the document root so
 * that CSS can hide backend-dependent navigation entries and cards. Callers
 * can also query isWebMode() directly to skip module initialization.
 */
export class WebModeGuard {
    private static instance: WebModeGuard | null=null;
    private readonly _isWebMode: boolean;
    private _applied: boolean;

    private constructor() {
        let detector: RuntimeDetector=RuntimeDetector.getInstance();
        // Web mode = running in a browser tab WITHOUT the Wails bridge.
        // Node CLI and Wails desktop are both non-web for this purpose:
        // Node has no DOM, and Wails provides the Go backend inline.
        this._isWebMode=detector.isBrowser && !detector.isWails;
        this._applied=false;
    }

    public static getInstance(): WebModeGuard {
        if (WebModeGuard.instance===null) {
            WebModeGuard.instance=new WebModeGuard();
        }
        return WebModeGuard.instance;
    }

    public static resetInstance(): void {
        WebModeGuard.instance=null;
    }

    /**
     * Returns true when the app is running in a browser without the Wails
     * backend. Backend-dependent features must not be initialized in this
     * state because their /api/v1/* requests would fail.
     */
    public get isWebMode(): boolean {
        return this._isWebMode;
    }

    /**
     * Applies the `web-mode` class to the document root so CSS can hide
     * backend-dependent UI. Safe to call multiple times; only applies once.
     * No-op when not in a browser (e.g. Node CLI) or when not in web mode.
     */
    public apply(): void {
        if (this._applied) {
            return;
        }
        this._applied=true;
        if (!this._isWebMode) {
            return;
        }
        if (typeof document==="undefined") {
            return;
        }
        let root: HTMLElement=document.documentElement;
        root.classList.add("web-mode");
    }
}
