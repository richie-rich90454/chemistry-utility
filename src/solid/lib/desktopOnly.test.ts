import { describe, it, expect, vi, afterEach } from "vitest";
import {
    DESKTOP_ONLY_IDS,
    DESKTOP_ONLY_ROUTES,
    isDesktop,
    isDesktopOnlyId,
    isDesktopOnlyRoute,
    visibleCalculators,
} from "./desktopOnly";
import { RuntimeDetector } from "../../modules/runtimeDetector.js";
import type { CalculatorInfo } from "../../modules/navigationManager.js";

function makeInfo(id: string): CalculatorInfo {
    return { id, name: id, category: "General", icon: "x", description: "d" };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("desktopOnly constants", () => {
    it("lists batch-calc and dashboard as desktop-only", () => {
        expect(DESKTOP_ONLY_IDS).toContain("batch-calc");
        expect(DESKTOP_ONLY_IDS).toContain("dashboard");
        expect(DESKTOP_ONLY_ROUTES).toContain("/batch-calc");
        expect(DESKTOP_ONLY_ROUTES).toContain("/dashboard");
    });
});

describe("isDesktop", () => {
    it("is true in unit tests (non-web mode)", () => {
        expect(isDesktop()).toBe(true);
    });

    it("is false when runtime reports web mode", () => {
        vi.spyOn(RuntimeDetector, "getInstance").mockReturnValue({ isWebMode: true } as RuntimeDetector);
        expect(isDesktop()).toBe(false);
    });
});

describe("isDesktopOnlyId", () => {
    it("returns true for desktop-only ids", () => {
        expect(isDesktopOnlyId("batch-calc")).toBe(true);
        expect(isDesktopOnlyId("dashboard")).toBe(true);
    });

    it("returns false for regular ids", () => {
        expect(isDesktopOnlyId("gas-laws")).toBe(false);
        expect(isDesktopOnlyId("")).toBe(false);
    });
});

describe("isDesktopOnlyRoute", () => {
    it("returns true for desktop-only routes", () => {
        expect(isDesktopOnlyRoute("/batch-calc")).toBe(true);
        expect(isDesktopOnlyRoute("/dashboard")).toBe(true);
    });

    it("returns false for regular routes", () => {
        expect(isDesktopOnlyRoute("/gas-laws")).toBe(false);
        expect(isDesktopOnlyRoute("/")).toBe(false);
    });
});

describe("visibleCalculators", () => {
    it("returns all entries on desktop", () => {
        const all = [makeInfo("batch-calc"), makeInfo("gas-laws")];
        expect(visibleCalculators(all)).toEqual(all);
    });

    it("filters desktop-only entries on web", () => {
        vi.spyOn(RuntimeDetector, "getInstance").mockReturnValue({ isWebMode: true } as RuntimeDetector);
        const all = [makeInfo("batch-calc"), makeInfo("gas-laws"), makeInfo("dashboard")];
        const visible = visibleCalculators(all);
        expect(visible.map((c) => c.id)).toEqual(["gas-laws"]);
    });

    it("returns empty array when all are desktop-only on web", () => {
        vi.spyOn(RuntimeDetector, "getInstance").mockReturnValue({ isWebMode: true } as RuntimeDetector);
        expect(visibleCalculators([makeInfo("batch-calc")])).toEqual([]);
    });
});
