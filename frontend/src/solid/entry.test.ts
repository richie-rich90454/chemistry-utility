import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
    isWails: false,
    renderCalls: 0,
    hydrateCalls: 0,
    registrations: [] as Array<{ unregister: () => void; register: () => unknown }>,
}));

vi.mock("solid-js/web", async (importOriginal) => {
    const actual = await importOriginal<typeof import("solid-js/web")>();
    return {
        ...actual,
        render: vi.fn((fn: () => unknown) => {
            mocks.renderCalls += 1;
            fn();
        }),
        hydrate: vi.fn((fn: () => unknown) => {
            mocks.hydrateCalls += 1;
            fn();
        }),
    };
});

vi.mock("./App", () => ({
    App: () => null,
}));

vi.mock("../modules/runtimeDetector.js", () => ({
    RuntimeDetector: {
        getInstance: () => ({ isWails: mocks.isWails }),
    },
}));

function setServiceWorker(impl: object | null): void {
    const nav = navigator as unknown as Record<string, unknown>;
    if (impl === null) {
        delete nav["serviceWorker"];
    } else {
        Object.defineProperty(nav, "serviceWorker", {
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
        Object.defineProperty(w, "caches", {
            value: impl,
            writable: true,
            configurable: true,
        });
    }
}

function addRoot(): void {
    const root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);
}

async function load(entry: string): Promise<void> {
    vi.resetModules();
    await import(entry);
    await new Promise((r) => setTimeout(r, 20));
}

beforeEach(() => {
    mocks.isWails = false;
    mocks.renderCalls = 0;
    mocks.hydrateCalls = 0;
    mocks.registrations = [];
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

describe("web entry", () => {
    it("hydrates the prerendered root when a root element exists", async () => {
        addRoot();
        await load("./entry.web");
        expect(mocks.hydrateCalls).toBe(1);
        expect(mocks.renderCalls).toBe(0);
    });

    it("does nothing without a root element", async () => {
        await load("./entry.web");
        expect(mocks.hydrateCalls).toBe(0);
    });

    it("registers the service worker on production web builds", async () => {
        mocks.isWails = false;
        vi.stubEnv("PROD", true);
        const register = vi.fn(() => Promise.resolve(undefined));
        setServiceWorker({ getRegistrations: () => Promise.resolve([]), register });
        await load("./entry.web");
        expect(register).toHaveBeenCalledWith("/sw.js");
    });

    it("tolerates service-worker registration failure", async () => {
        vi.stubEnv("PROD", true);
        setServiceWorker({ getRegistrations: () => Promise.resolve([]), register: () => Promise.reject(new Error("denied")) });
        addRoot();
        await load("./entry.web");
        expect(mocks.hydrateCalls).toBe(1);
    });

    it("skips registration in dev and in the desktop app", async () => {
        const register = vi.fn(() => Promise.resolve(undefined));
        setServiceWorker({ getRegistrations: () => Promise.resolve([]), register });
        mocks.isWails = true;
        vi.stubEnv("PROD", true);
        await load("./entry.web");
        expect(register).not.toHaveBeenCalled();
    });
});

describe("desktop entry", () => {
    it("renders the app from scratch when a root element exists", async () => {
        addRoot();
        await load("./entry.app");
        expect(mocks.renderCalls).toBe(1);
        expect(mocks.hydrateCalls).toBe(0);
    });

    it("never registers a service worker", async () => {
        vi.stubEnv("PROD", true);
        const register = vi.fn(() => Promise.resolve(undefined));
        setServiceWorker({ getRegistrations: () => Promise.resolve([]), register });
        await load("./entry.app");
        expect(register).not.toHaveBeenCalled();
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
        await load("./entry.app");
        expect(unregister).toHaveBeenCalledTimes(1);
        expect(deleted).toEqual(["a", "b"]);
    });

    it("tolerates service-worker and cache failures", async () => {
        mocks.isWails = true;
        setServiceWorker({ getRegistrations: () => Promise.reject(new Error("nope")), register: vi.fn() });
        setCaches({ keys: () => Promise.reject(new Error("nope")), delete: vi.fn() });
        await load("./entry.app");
        expect(mocks.renderCalls).toBe(0);
    });
});
