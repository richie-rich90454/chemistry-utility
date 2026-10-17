import {describe, it, expect, vi, beforeEach} from "vitest";

const webMocks = vi.hoisted(function () {
    return {
        "renderToString": vi.fn(),
        "preloadAllLazyRoutes": vi.fn()
    };
});

vi.mock("solid-js/web", async function (importOriginal) {
    let actual = await importOriginal<typeof import("solid-js/web")>();
    return {
        ...actual,
        "renderToString": webMocks.renderToString,
        "HydrationScript": function (): null { return null; }
    };
});

vi.mock("../solid/App.js", function () {
    return {
        "App": function (): null { return null; }
    };
});

vi.mock("../solid/routeLoaders.js", function () {
    return {
        "preloadAllLazyRoutes": webMocks.preloadAllLazyRoutes
    };
});

import {renderRoute} from "./entrySsr.js";

describe("entrySsr renderRoute", function (): void {
    beforeEach(function (): void {
        webMocks.preloadAllLazyRoutes.mockReset();
        webMocks.preloadAllLazyRoutes.mockResolvedValue(undefined);
        webMocks.renderToString.mockReset();
        webMocks.renderToString.mockImplementation(function (fn: () => unknown): string {
            fn();
            return "<div class=\"app-shell\"></div>";
        });
    });

    it("preloads every lazy route then renders the shared app tree", async function (): Promise<void> {
        let html = await renderRoute("/molar-mass");
        expect(webMocks.preloadAllLazyRoutes).toHaveBeenCalledTimes(1);
        expect(webMocks.renderToString).toHaveBeenCalledTimes(1);
        expect(html).toContain("app-shell");
    });

    it("renders the root path", async function (): Promise<void> {
        let html = await renderRoute("/");
        expect(html).toContain("app-shell");
    });
});
