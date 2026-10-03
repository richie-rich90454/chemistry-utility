import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDashboard } from "./dashboard";
import { DashboardManager } from "../../modules/dashboardManager.js";
import type { CalculationRecord } from "../../modules/dashboardManager.js";

function makeRecord(overrides: Partial<CalculationRecord> = {}): CalculationRecord {
    return {
        ID: "1",
        UserID: "u",
        CalculatorType: "gas-laws",
        Inputs: "{}",
        Result: "42",
        Annotation: "",
        Starred: false,
        WorkspaceID: "",
        CreatedAt: new Date().toISOString(),
        ...overrides,
    };
}

beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useDashboard", () => {
    it("exposes stats, recent, activity, favorites, loading, error and refresh", () => {
        const store = useDashboard();
        expect(store.stats()).toEqual({
            totalCalculations: 0,
            favoriteCount: 0,
            thisWeekCount: 0,
            calculatorsUsed: 0,
        });
        expect(store.recent()).toEqual([]);
        expect(store.activity()).toEqual([]);
        expect(store.favorites()).toEqual([]);
        expect(store.loading()).toBe(false);
        expect(store.error()).toBe("");
        expect(typeof store.refresh).toBe("function");
    });

    it("refresh loads calculations and computes stats", async () => {
        const now = new Date();
        const old = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
        const records = [
            makeRecord({ ID: "1", CalculatorType: "gas-laws", Starred: true, CreatedAt: now.toISOString() }),
            makeRecord({ ID: "2", CalculatorType: "gas-laws", Starred: false, CreatedAt: old }),
            makeRecord({ ID: "3", CalculatorType: "molar-mass", Starred: false, CreatedAt: "not-a-date" }),
        ];
        const manager = DashboardManager.getInstance();
        vi.spyOn(DashboardManager, "getInstance").mockReturnValue(manager);
        vi.spyOn(manager, "loadDashboardData").mockResolvedValue(undefined);
        vi.spyOn(manager, "getLastCalculations").mockReturnValue(records);
        const store = useDashboard();
        await store.refresh();
        expect(store.loading()).toBe(false);
        expect(store.error()).toBe("");
        expect(store.stats().totalCalculations).toBe(3);
        expect(store.stats().favoriteCount).toBe(1);
        expect(store.stats().thisWeekCount).toBe(1);
        expect(store.stats().calculatorsUsed).toBe(2);
        expect(store.recent()).toEqual(records);
        expect(store.favorites().map((r) => r.ID)).toEqual(["1"]);
        expect(store.activity().length).toBe(7);
    });

    it("refresh builds activity points skipping invalid and out-of-range dates", async () => {
        const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
        const ancient = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const records = [
            makeRecord({ ID: "1", CreatedAt: future }),
            makeRecord({ ID: "2", CreatedAt: ancient }),
            makeRecord({ ID: "3", CreatedAt: "bad-date" }),
            makeRecord({ ID: "4", CreatedAt: yesterday }),
        ];
        const manager = DashboardManager.getInstance();
        vi.spyOn(DashboardManager, "getInstance").mockReturnValue(manager);
        vi.spyOn(manager, "loadDashboardData").mockResolvedValue(undefined);
        vi.spyOn(manager, "getLastCalculations").mockReturnValue(records);
        const store = useDashboard();
        await store.refresh();
        const total = store.activity().reduce((sum, p) => sum + p.count, 0);
        expect(total).toBe(1);
    });

    it("refresh reports manager failures with Error", async () => {
        const manager = DashboardManager.getInstance();
        vi.spyOn(DashboardManager, "getInstance").mockReturnValue(manager);
        vi.spyOn(manager, "loadDashboardData").mockRejectedValue(new Error("offline"));
        const store = useDashboard();
        await store.refresh();
        expect(store.error()).toContain("offline");
        expect(store.loading()).toBe(false);
    });

    it("refresh reports non-Error failures as unknown error", async () => {
        const manager = DashboardManager.getInstance();
        vi.spyOn(DashboardManager, "getInstance").mockReturnValue(manager);
        vi.spyOn(manager, "loadDashboardData").mockRejectedValue("kaput");
        const store = useDashboard();
        await store.refresh();
        expect(store.error()).toBe("Failed to load dashboard: Unknown error");
    });

    it("second concurrent refresh returns early while loading", async () => {
        const manager = DashboardManager.getInstance();
        vi.spyOn(DashboardManager, "getInstance").mockReturnValue(manager);
        let release!: () => void;
        const gate = new Promise<void>((resolve) => { release = resolve; });
        vi.spyOn(manager, "loadDashboardData").mockImplementation(() => gate);
        vi.spyOn(manager, "getLastCalculations").mockReturnValue([]);
        const store = useDashboard();
        const first = store.refresh();
        const second = store.refresh();
        await second;
        expect(store.loading()).toBe(true);
        release();
        await first;
        expect(store.loading()).toBe(false);
    });
});
