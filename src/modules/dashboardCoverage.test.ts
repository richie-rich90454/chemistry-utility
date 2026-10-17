import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { DashboardManager, CalculationRecord } from "./dashboardManager.js";
import { ChartRenderer } from "./chartRenderer.js";

function makeCalc(overrides: Partial<CalculationRecord>): CalculationRecord {
    let base: CalculationRecord = {
        "ID": "1",
        "UserID": "local-user",
        "CalculatorType": "molar-mass",
        "Inputs": "H2O",
        "Result": "18.015",
        "Annotation": "",
        "Starred": false,
        "WorkspaceID": "",
        "CreatedAt": new Date().toISOString()
    };
    let keys: string[] = Object.keys(overrides);
    let i: number;
    for (i = 0; i < keys.length; i++) {
        let k: string = keys[i];
        (base as unknown as Record<string, unknown>)[k] = (overrides as unknown as Record<string, unknown>)[k];
    }
    return base;
}

function setupMain(): void {
    let main: HTMLElement = document.createElement("main");
    main.id = "main-content";
    document.body.appendChild(main);
}

type MutableManager = {
    loading: boolean;
    showLoading: (show: boolean) => void;
    showError: (message: string) => void;
};

function asMutable(manager: DashboardManager): MutableManager {
    return manager as unknown as MutableManager;
}

describe("DashboardManager coverage", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        DashboardManager.resetInstance();
        vi.restoreAllMocks();
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        DashboardManager.resetInstance();
        vi.restoreAllMocks();
    });

    it("handles show/hide/isVisible with no container", function () {
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.show();
        expect(manager.isVisible()).toBe(false);
        manager.hide();
        expect(manager.isVisible()).toBe(false);
    });

    it("intercepts sidebar navigation clicks", function () {
        setupMain();
        let nav: HTMLElement = document.createElement("nav");
        nav.className = "sidebar-nav";
        let dashLink: HTMLElement = document.createElement("a");
        dashLink.setAttribute("href", "#dashboard-view");
        dashLink.textContent = "Dashboard";
        nav.appendChild(dashLink);
        let noHref: HTMLElement = document.createElement("a");
        noHref.textContent = "NoHref";
        nav.appendChild(noHref);
        let dashDup: HTMLElement = document.createElement("a");
        dashDup.setAttribute("href", "#dashboard-view");
        dashDup.textContent = "Dashboard2";
        nav.appendChild(dashDup);
        let other: HTMLElement = document.createElement("a");
        other.setAttribute("href", "#calc-view");
        other.textContent = "Calc";
        nav.appendChild(other);
        document.body.appendChild(nav);
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        let showSpy: ReturnType<typeof vi.spyOn> = vi.spyOn(manager, "show");
        let hideSpy: ReturnType<typeof vi.spyOn> = vi.spyOn(manager, "hide");
        dashLink.click();
        expect(showSpy).toHaveBeenCalled();
        other.click();
        expect(hideSpy).toHaveBeenCalled();
        let hideCalls: number = hideSpy.mock.calls.length;
        noHref.click();
        dashDup.click();
        expect(hideSpy.mock.calls.length).toBe(hideCalls);
    });

    it("show hides surrounding views and reveals dashboard", async function () {
        setupMain();
        let appView: HTMLElement = document.createElement("div");
        appView.className = "app-view";
        let section: HTMLElement = document.createElement("div");
        section.className = "main-groups card view-active";
        appView.appendChild(section);
        let welcome: HTMLElement = document.createElement("div");
        welcome.className = "welcome-screen";
        appView.appendChild(welcome);
        document.body.appendChild(appView);
        let viewHeader: HTMLElement = document.createElement("div");
        viewHeader.className = "view-header";
        document.body.appendChild(viewHeader);
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        manager.show();
        await new Promise(function (resolve: (value: unknown) => void): void { setTimeout(resolve, 0); });
        expect(section.classList.contains("view-hidden")).toBe(true);
        expect(section.classList.contains("view-active")).toBe(false);
        expect(welcome.style.display).toBe("none");
        expect(viewHeader.style.display).toBe("none");
        expect(manager.isVisible()).toBe(true);
    });

    it("render without main-content leaves section detached", function () {
        let manager: DashboardManager = DashboardManager.getInstance();
        let el: HTMLElement = manager.render();
        expect(el.id).toBe("dashboard-view");
        expect(document.getElementById("main-content")).toBeNull();
        expect(manager.isVisible()).toBe(false);
    });

    it("render reuses existing section and structure", function () {
        setupMain();
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        let first: HTMLElement | null = document.getElementById("dashboard-view");
        expect(first).not.toBeNull();
        let second: HTMLElement = manager.render();
        expect(second).toBe(first);
    });

    it("loadDashboardData returns early while loading", async function () {
        setupMain();
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        asMutable(manager).loading = true;
        await manager.loadDashboardData();
        expect(manager.getLastCalculations()).toEqual([]);
        asMutable(manager).loading = false;
    });

    it("loadDashboardData surfaces Error failures", async function () {
        setupMain();
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        vi.spyOn(manager, "renderUsageStats").mockImplementation(function (): void {
            throw new Error("boom");
        });
        await manager.loadDashboardData();
        let errorEl: HTMLElement | null = document.querySelector(".dashboard-error");
        expect(errorEl).not.toBeNull();
        if (errorEl) {
            expect(errorEl.textContent).toContain("boom");
            expect(errorEl.style.display).toBe("block");
        }
    });

    it("loadDashboardData surfaces non-Error failures", async function () {
        setupMain();
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        vi.spyOn(manager, "renderUsageStats").mockImplementation(function (): void {
            throw "kaput";
        });
        await manager.loadDashboardData();
        let errorEl: HTMLElement | null = document.querySelector(".dashboard-error");
        expect(errorEl).not.toBeNull();
        if (errorEl) {
            expect(errorEl.textContent).toContain("Unknown error");
        }
    });

    it("computeStats handles invalid, old, and recent dates", async function () {
        setupMain();
        let old: string = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
        let recent: CalculationRecord = makeCalc({ "ID": "r1", "CalculatorType": "molar-mass", "Starred": true, "CreatedAt": new Date().toISOString() });
        let stale: CalculationRecord = makeCalc({ "ID": "o1", "CalculatorType": "balancing", "Starred": false, "CreatedAt": old });
        let broken: CalculationRecord = makeCalc({ "ID": "b1", "CalculatorType": "molar-mass", "Starred": false, "CreatedAt": "not-a-date" });
        localStorage.setItem("chemutil_calculations", JSON.stringify([recent, stale, broken]));
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        await manager.loadDashboardData();
        expect(manager.getLastCalculations().length).toBe(3);
        let stats: HTMLElement | null = document.querySelector(".dashboard-stats");
        expect(stats).not.toBeNull();
    });

    it("public render methods tolerate missing container", function () {
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.renderUsageStats({ "totalCalculations": 1, "favoriteCount": 1, "thisWeekCount": 1, "calculatorsUsed": 1 });
        manager.renderRecentCalculations([]);
        manager.renderWeeklyActivity([]);
        manager.renderFavorites([]);
        asMutable(manager).showLoading(true);
        asMutable(manager).showLoading(false);
        asMutable(manager).showError("x");
        asMutable(manager).showError("");
        expect(manager.isVisible()).toBe(false);
    });

    it("public render methods tolerate missing child elements", async function () {
        setupMain();
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        let stats: Element | null = document.querySelector(".dashboard-stats");
        if (stats) { stats.remove(); }
        manager.renderUsageStats({ "totalCalculations": 1, "favoriteCount": 0, "thisWeekCount": 0, "calculatorsUsed": 0 });
        let recent: Element | null = document.querySelector(".dashboard-recent");
        if (recent) { recent.remove(); }
        manager.renderRecentCalculations([]);
        let activity: Element | null = document.querySelector(".dashboard-activity");
        if (activity) { activity.remove(); }
        manager.renderWeeklyActivity([]);
        let favorites: Element | null = document.querySelector(".dashboard-favorites");
        if (favorites) { favorites.remove(); }
        manager.renderFavorites([]);
        let loading: Element | null = document.querySelector(".dashboard-loading");
        if (loading) { loading.remove(); }
        asMutable(manager).showLoading(true);
        asMutable(manager).showLoading(false);
        let errorEl: Element | null = document.querySelector(".dashboard-error");
        if (errorEl) { errorEl.remove(); }
        asMutable(manager).showError("oops");
        await manager.loadDashboardData();
        expect(manager.getLastCalculations().length).toBe(0);
    });

    it("renderWeeklyActivity buckets only the last 7 days and recreates canvas", function () {
        setupMain();
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        let yesterday: string = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        let ancient: string = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        let future: string = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
        let inRange: CalculationRecord = makeCalc({ "ID": "in", "CreatedAt": yesterday });
        let tooOld: CalculationRecord = makeCalc({ "ID": "old", "CreatedAt": ancient });
        let notYet: CalculationRecord = makeCalc({ "ID": "fut", "CreatedAt": future });
        let bad: CalculationRecord = makeCalc({ "ID": "bad", "CreatedAt": "bad-date" });
        manager.renderWeeklyActivity([inRange, tooOld, notYet, bad]);
        expect(document.querySelector("canvas#dashboard-activity-chart")).not.toBeNull();
        manager.renderWeeklyActivity([]);
        expect(document.querySelectorAll("canvas#dashboard-activity-chart").length).toBe(1);
    });

    it("renderWeeklyActivity shows fallback when chart rendering fails", function () {
        setupMain();
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        let spy: ReturnType<typeof vi.spyOn> = vi.spyOn(ChartRenderer.prototype, "renderActivityChart").mockImplementation(function (): void {
            throw new Error("chart fail");
        });
        manager.renderWeeklyActivity([]);
        expect(document.body.textContent).toContain("Weekly activity chart unavailable");
        spy.mockRestore();
    });

    it("renderRecentCalculations handles invalid dates", function () {
        setupMain();
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        let bad: CalculationRecord = makeCalc({ "ID": "bad", "CreatedAt": "bad-date" });
        manager.renderRecentCalculations([bad]);
        let dateEl: Element | null = document.querySelector(".dashboard-list-date");
        expect(dateEl).not.toBeNull();
        if (dateEl) {
            expect(dateEl.textContent).toBe("");
        }
    });

    it("showLoading and showError toggle display", function () {
        setupMain();
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        asMutable(manager).showLoading(true);
        expect((document.querySelector(".dashboard-loading") as HTMLElement).style.display).toBe("block");
        asMutable(manager).showLoading(false);
        expect((document.querySelector(".dashboard-loading") as HTMLElement).style.display).toBe("none");
        asMutable(manager).showError("oops");
        let errorEl: HTMLElement | null = document.querySelector(".dashboard-error");
        expect(errorEl).not.toBeNull();
        if (errorEl) {
            expect(errorEl.textContent).toBe("oops");
            expect(errorEl.style.display).toBe("block");
        }
        asMutable(manager).showError("");
        if (errorEl) {
            expect(errorEl.textContent).toBe("");
            expect(errorEl.style.display).toBe("none");
        }
    });

    it("readCalculations returns empty for non-array JSON", async function () {
        setupMain();
        localStorage.setItem("chemutil_calculations", "{\"a\":1}");
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        await manager.loadDashboardData();
        expect(manager.getLastCalculations()).toEqual([]);
    });

    it("readCalculations returns empty for invalid JSON", async function () {
        setupMain();
        localStorage.setItem("chemutil_calculations", "not-json{{{");
        let manager: DashboardManager = DashboardManager.getInstance();
        manager.init();
        await manager.loadDashboardData();
        expect(manager.getLastCalculations()).toEqual([]);
    });
});
