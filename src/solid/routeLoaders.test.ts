import {describe, it, expect, vi} from "vitest";

type LoadersModule = typeof import("./routeLoaders.js");

async function loadLoaders(): Promise<LoadersModule> {
    vi.resetModules();
    return import("./routeLoaders.js");
}

describe("routeLoaders", function (): void {
    it("returns the same lazy component for a path on repeated calls", async function (): Promise<void> {
        let loaders: LoadersModule = await loadLoaders();
        let first = loaders.lazyRoute("/molar-mass");
        let second = loaders.lazyRoute("/molar-mass");
        expect(first).toBe(second);
    });

    it("starts the chunk fetch for a known route", async function (): Promise<void> {
        let loaders: LoadersModule = await loadLoaders();
        await loaders.preloadRoute("/molar-mass");
        let component = loaders.lazyRoute("/molar-mass");
        expect(component.preload).toBeTypeOf("function");
    });

    it("resolves immediately for an unknown route", async function (): Promise<void> {
        let loaders: LoadersModule = await loadLoaders();
        await expect(loaders.preloadRoute("/not-a-route")).resolves.toBeUndefined();
    });

    it("preloads every lazy route chunk", async function (): Promise<void> {
        let loaders: LoadersModule = await loadLoaders();
        await expect(loaders.preloadAllLazyRoutes()).resolves.toBeUndefined();
        expect(loaders.lazyRoute("/report")).toBeTruthy();
    });
});
