import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
    isWails: false,
    configureCalls: [] as Array<Record<string, unknown>>,
    renderCalls: 0,
}));

vi.mock("solid-js/web", async (importOriginal) => {
    const actual = await importOriginal<typeof import("solid-js/web")>();
    return {
        ...actual,
        render: vi.fn((fn: () => unknown) => {
            mocks.renderCalls += 1;
            fn();
        }),
    };
});

vi.mock("./App", () => ({
    App: () => null,
}));

vi.mock("../modules/runtimeDetector.js", () => ({
    RuntimeDetector: {
        getInstance: () => ({ isWails: mocks.isWails, isWebMode: !mocks.isWails }),
    },
}));

vi.mock("../modules/apiClient.js", () => ({
    ApiClient: {
        configure: vi.fn((opts: Record<string, unknown>) => {
            mocks.configureCalls.push(opts);
        }),
    },
}));

function setServiceWorker(impl: object | null): void {
    const nav = navigator as unknown as Record<string, unknown>;
    if (impl === null) {
        delete nav["serviceWorker"];
    } else {
        Object.defineProperty(navigator, "serviceWorker", {
            value: impl,
            writable: true,
            configurable: true,
        });
    }
}

function setCaches(impl: object | null): void {
    const w = window as unknown as Record<string, unknown>;
    if (impl === null) {
        delete w["caches"];
    } else {
        Object.defineProperty(window, "caches", {
            value: impl,
            writable: true,
            configurable: true,
        });
    }
}

async function loadIndex(): Promise<void> {
    vi.resetModules();
    await import("./index");
    await new Promise((r) => setTimeout(r, 20));
}

beforeEach(() => {
    mocks.isWails = false;
    mocks.configureCalls.length = 0;
    mocks.renderCalls = 0;
    document.body.innerHTML = "";
    setServiceWorker(null);
    setCaches(null);
    const w = window as unknown as Record<string, unknown>;
    delete w["go"];
    vi.unstubAllEnvs();
});

afterEach(() => {
    vi.unstubAllEnvs();
    document.body.innerHTML = "";
});

describe("solid entrypoint", () => {
    it("does nothing wails-specific outside the desktop app", async () => {
        mocks.isWails = false;
        await loadIndex();
        expect(mocks.configureCalls.length).toBe(0);
        expect(mocks.renderCalls).toBe(0);
    });

    it("renders the app when a root element exists", async () => {
        mocks.isWails = false;
        const root = document.createElement("div");
        root.id = "root";
        document.body.appendChild(root);
        await loadIndex();
        expect(mocks.renderCalls).toBe(1);
    });

    it("unregisters stale service workers and clears caches in wails", async () => {
        mocks.isWails = true;
        const unregister = vi.fn();
        setServiceWorker({ getRegistrations: () => Promise.resolve([{ unregister }]), register: vi.fn() });
        const deleted: string[] = [];
        setCaches({
            keys: () => Promise.resolve(["a", "b"]),
            delete: (k: string) => { deleted.push(k); return Promise.resolve(true); },
        });
        const root = document.createElement("div");
        root.id = "root";
        document.body.appendChild(root);
        await loadIndex();
        expect(unregister).toHaveBeenCalledTimes(1);
        expect(deleted).toEqual(["a", "b"]);
    });

    it("tolerates service-worker and cache failures", async () => {
        mocks.isWails = true;
        setServiceWorker({ getRegistrations: () => Promise.reject(new Error("nope")), register: vi.fn() });
        setCaches({ keys: () => Promise.reject(new Error("nope")), delete: vi.fn() });
        await loadIndex();
        expect(mocks.renderCalls).toBe(0);
    });

    it("skips service-worker handling when APIs are absent", async () => {
        mocks.isWails = true;
        setServiceWorker(null);
        setCaches(null);
        await loadIndex();
        expect(mocks.renderCalls).toBe(0);
    });

    it("configures the api client from the wails binding", async () => {
        mocks.isWails = true;
        const w = window as unknown as Record<string, unknown>;
        w["go"] = { main: { App: { GetAPIURL: () => Promise.resolve("http://localhost:1") } } };
        await loadIndex();
        expect(mocks.configureCalls.length).toBe(1);
        expect(mocks.configureCalls[0]).toEqual({ baseURL: "http://localhost:1", timeout: 30000 });
    });

    it("skips api configuration for empty binding urls", async () => {
        mocks.isWails = true;
        const w = window as unknown as Record<string, unknown>;
        w["go"] = { main: { App: { GetAPIURL: () => Promise.resolve("") } } };
        await loadIndex();
        expect(mocks.configureCalls.length).toBe(0);
    });

    it("tolerates missing wails bindings", async () => {
        mocks.isWails = true;
        const w = window as unknown as Record<string, unknown>;
        w["go"] = { main: { App: { GetAPIURL: () => Promise.reject(new Error("missing")) } } };
        await loadIndex();
        expect(mocks.configureCalls.length).toBe(0);
    });

    it("registers the service worker on production web builds", async () => {
        mocks.isWails = false;
        vi.stubEnv("PROD", true);
        const register = vi.fn(() => Promise.resolve(undefined));
        setServiceWorker({ getRegistrations: () => Promise.resolve([]), register });
        const root = document.createElement("div");
        root.id = "root";
        document.body.appendChild(root);
        await loadIndex();
        expect(register).toHaveBeenCalledWith("/sw.js");
    });

    it("tolerates service-worker registration failure", async () => {
        mocks.isWails = false;
        vi.stubEnv("PROD", true);
        setServiceWorker({
            getRegistrations: () => Promise.resolve([]),
            register: () => Promise.reject(new Error("denied")),
        });
        await loadIndex();
        expect(mocks.renderCalls).toBe(0);
    });
});
