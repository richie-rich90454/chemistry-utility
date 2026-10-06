import { render, cleanup, waitFor } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useElementLookup } from "./useElementLookup";
import { DataCache } from "../../modules/dataCache.js";

type HookApi = ReturnType<typeof useElementLookup>;

function Host(props: { ref: (api: HookApi) => void }): JSX.Element {
    const api = useElementLookup();
    props.ref(api);
    return <div data-testid="host" />;
}

function mockCache(getImpl: () => Promise<string | null>): { set: ReturnType<typeof vi.fn> } {
    const set = vi.fn();
    vi.spyOn(DataCache, "getInstance").mockReturnValue({
        get: vi.fn().mockImplementation(getImpl),
        set,
    } as unknown as DataCache);
    return { set };
}

const ELEMENTS = [
    {
        symbol: "H",
        name: "Hydrogen",
        atomicMass: 1.008,
        atomicNumber: 1,
        valenceElectrons: 1,
        totalElectrons: 1,
        group: 1,
        period: 1,
        type: "Nonmetal",
    },
];

function mockFetchOk(data: unknown): ReturnType<typeof vi.fn> {
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
    });
}

beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("useElementLookup loading from cache", () => {
    it("uses cached elements without fetching", async () => {
        const cache = mockCache(() => Promise.resolve(JSON.stringify(ELEMENTS)));
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await waitFor(() => expect(api.loading()).toBe(false));
        expect(api.elements()).toEqual(ELEMENTS);
        expect(api.loadError()).toBe("");
        expect(fetchMock).not.toHaveBeenCalled();
        expect(cache.set).not.toHaveBeenCalled();
    });

    it("falls through to fetch on corrupt cache", async () => {
        mockCache(() => Promise.resolve("not-json{{{"));
        vi.stubGlobal("fetch", mockFetchOk(ELEMENTS));
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await waitFor(() => expect(api.loading()).toBe(false));
        expect(api.elements()).toEqual(ELEMENTS);
        expect(api.loadError()).toBe("");
    });

    it("fetches when cache is empty and caches the result", async () => {
        const cache = mockCache(() => Promise.resolve(null));
        vi.stubGlobal("fetch", mockFetchOk(ELEMENTS));
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await waitFor(() => expect(api.loading()).toBe(false));
        expect(api.elements()).toEqual(ELEMENTS);
        expect(cache.set).toHaveBeenCalledWith("ptable", expect.any(String));
    });

    it("sets loadError on HTTP error status", async () => {
        mockCache(() => Promise.resolve(null));
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve(null) }),
        );
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await waitFor(() => expect(api.loading()).toBe(false));
        expect(api.loadError()).toContain("500");
        expect(api.elements()).toEqual([]);
    });

    it("sets loadError on network failure", async () => {
        mockCache(() => Promise.resolve(null));
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await waitFor(() => expect(api.loading()).toBe(false));
        expect(api.loadError()).toBe("down");
    });

    it("sets loadError from non-Error throws", async () => {
        mockCache(() => Promise.resolve(null));
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue("bad-string"));
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await waitFor(() => expect(api.loading()).toBe(false));
        expect(api.loadError()).toBe("bad-string");
    });

    it("ignores abort errors silently", async () => {
        mockCache(() => Promise.resolve(null));
        const abortErr = new DOMException("aborted", "AbortError");
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortErr));
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await new Promise((r) => setTimeout(r, 50));
        expect(api.loadError()).toBe("");
        expect(api.elements()).toEqual([]);
    });
});

describe("useElementLookup search and clear", () => {
    async function readyHook(): Promise<HookApi> {
        mockCache(() => Promise.resolve(JSON.stringify(ELEMENTS)));
        vi.stubGlobal("fetch", vi.fn());
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await waitFor(() => expect(api.loading()).toBe(false));
        return api;
    }

    it("does nothing while loading", async () => {
        let resolveGet!: (v: string | null) => void;
        const pending = new Promise<string | null>((resolve) => { resolveGet = resolve; });
        mockCache(() => pending);
        vi.stubGlobal("fetch", vi.fn());
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        expect(api.loading()).toBe(true);
        api.setQuery("H");
        api.search();
        expect(api.error()).toBe("");
        expect(api.result()).toBeNull();
        resolveGet(JSON.stringify(ELEMENTS));
        await waitFor(() => expect(api.loading()).toBe(false));
    });

    it("does nothing when a load error is present", async () => {
        mockCache(() => Promise.resolve(null));
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await waitFor(() => expect(api.loading()).toBe(false));
        expect(api.loadError()).toBe("down");
        api.setQuery("H");
        api.search();
        expect(api.result()).toBeNull();
    });

    it("requires a non-empty query", async () => {
        const api = await readyHook();
        api.setQuery("   ");
        api.search();
        expect(api.error()).toBe("Please enter an element symbol, name, or atomic number");
        expect(api.result()).toBeNull();
    });

    it("reports element not found", async () => {
        const api = await readyHook();
        api.setQuery("Xyzz");
        api.search();
        expect(api.error()).toBe("Element not found");
        expect(api.result()).toBeNull();
    });

    it("finds an element by symbol", async () => {
        const api = await readyHook();
        api.setQuery("H");
        api.search();
        expect(api.error()).toBe("");
        expect(api.result()?.symbol).toBe("H");
    });

    it("clear resets query, result and error", async () => {
        const api = await readyHook();
        api.setQuery("H");
        api.search();
        expect(api.result()).not.toBeNull();
        api.clear();
        expect(api.query()).toBe("");
        expect(api.result()).toBeNull();
        expect(api.error()).toBe("");
    });
});

describe("useElementLookup disposal", () => {
    it("aborts in-flight fetch on unmount", async () => {
        let resolveFetch!: (v: unknown) => void;
        const fetchPending = new Promise((resolve) => { resolveFetch = resolve; });
        mockCache(() => Promise.resolve(null));
        vi.stubGlobal(
            "fetch",
            vi.fn().mockImplementation(() => fetchPending),
        );
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await waitFor(() => expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1));
        cleanup();
        resolveFetch({ ok: true, status: 200, json: () => Promise.resolve(ELEMENTS) });
        await new Promise((r) => setTimeout(r, 20));
        expect(api.loading()).toBe(true);
    });

    it("ignores late fetch rejection after unmount", async () => {
        let rejectFetch!: (e: unknown) => void;
        const fetchPending = new Promise((_, reject) => { rejectFetch = reject; });
        mockCache(() => Promise.resolve(null));
        vi.stubGlobal(
            "fetch",
            vi.fn().mockImplementation(() => fetchPending),
        );
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await waitFor(() => expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1));
        cleanup();
        rejectFetch(new Error("late"));
        await new Promise((r) => setTimeout(r, 20));
        expect(api.loading()).toBe(true);
        expect(api.loadError()).toBe("");
    });

    it("ignores late cache resolution after unmount", async () => {
        let resolveGet!: (v: string | null) => void;
        const pending = new Promise<string | null>((resolve) => { resolveGet = resolve; });
        mockCache(() => pending);
        vi.stubGlobal("fetch", vi.fn());
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        cleanup();
        resolveGet(JSON.stringify(ELEMENTS));
        await new Promise((r) => setTimeout(r, 20));
        expect(api.loading()).toBe(true);
        expect(api.elements()).toEqual([]);
    });

    it("cleans up without an active fetch", async () => {
        mockCache(() => Promise.resolve(JSON.stringify(ELEMENTS)));
        vi.stubGlobal("fetch", vi.fn());
        let api!: HookApi;
        render(() => <Host ref={(a) => { api = a; }} />);
        await waitFor(() => expect(api.loading()).toBe(false));
        cleanup();
        expect(api.elements()).toEqual(ELEMENTS);
    });
});
