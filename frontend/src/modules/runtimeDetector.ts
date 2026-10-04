export class RuntimeDetector {
    private static instance: RuntimeDetector | null=null;
    private readonly _isBrowser: boolean;
    private readonly _isWails: boolean;
    private readonly _isNode: boolean;
    private readonly _isWorker: boolean;
    private readonly _hasDOM: boolean;
    private readonly _hasLocalStorage: boolean;
    private readonly _hasFetch: boolean;
    private readonly _hasNavigator: boolean;
    private constructor() {
        this._isBrowser=typeof window!=="undefined"&&typeof document!=="undefined";
        this._isWails=typeof window!=="undefined"&&"__wails__" in window;
        this._isNode=typeof process!=="undefined"&&process.versions!=null&&process.versions.node!=null;
        this._isWorker=this.detectWorker();
        this._hasDOM=typeof document!=="undefined";
        this._hasLocalStorage=this.detectLocalStorage();
        this._hasFetch=typeof fetch!=="undefined";
        this._hasNavigator=typeof navigator!=="undefined";
    }
    public static getInstance(): RuntimeDetector {
        if (RuntimeDetector.instance===null) {
            RuntimeDetector.instance=new RuntimeDetector();
        }
        return RuntimeDetector.instance;
    }
    public static resetInstance(): void {
        RuntimeDetector.instance=null;
    }
    public get isBrowser(): boolean {
        return this._isBrowser;
    }
    public get isWails(): boolean {
        return this._isWails;
    }
    public get isNode(): boolean {
        return this._isNode;
    }
    public get isWorker(): boolean {
        return this._isWorker;
    }
    public get hasDOM(): boolean {
        return this._hasDOM;
    }
    public get hasLocalStorage(): boolean {
        return this._hasLocalStorage;
    }
    public get hasFetch(): boolean {
        return this._hasFetch;
    }
    public get hasNavigator(): boolean {
        return this._hasNavigator;
    }
    /** True on the anonymous web build (deployed web mode or a plain browser
     *  during local dev), where desktop-only features such as the dashboard,
     *  batch calculator, export/import, and plugins are hidden. False in the
     *  Wails desktop app and in unit tests. */
    public get isWebMode(): boolean {
        // import.meta.env is always defined in Vite bundles; tests set
        // MODE per case below so every path is reachable in unit tests.
        let mode: string = import.meta.env.MODE || "";
        if (mode === "web") {
            return true;
        }
        if (mode === "app" || mode === "test") {
            return false;
        }
        // "development": a plain browser is the web build, the Wails runtime
        // is the desktop app.
        return !this._isWails;
    }
    public describe(): string {
        if (this._isWails) {
            return "browser+wails";
        }
        if (this._isBrowser) {
            return "browser";
        }
        if (this._isNode) {
            return "node";
        }
        if (this._isWorker) {
            return "worker";
        }
        return "unknown";
    }
    private detectLocalStorage(): boolean {
        try {
            return typeof localStorage!=="undefined";
        } catch {
            return false;
        }
    }
    private detectWorker(): boolean {
        if (typeof self==="undefined") {
            return false;
        }
        const workerSelf=self as unknown as { importScripts?: unknown };
        return typeof workerSelf.importScripts==="function";
    }
}
