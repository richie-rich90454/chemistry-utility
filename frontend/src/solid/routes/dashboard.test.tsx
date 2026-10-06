import {render, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {ChartRenderer} from "../../modules/chartRenderer.js";
import type {CalculationRecord, DashboardStats} from "../../modules/dashboardManager.js";
import type {ActivityPoint} from "../../modules/chartRenderer.js";
const mocks = vi.hoisted(function () {
    return {
        "mockRefresh": vi.fn(),
        "mockStats": vi.fn(),
        "mockRecent": vi.fn(),
        "mockActivity": vi.fn(),
        "mockFavorites": vi.fn(),
        "mockLoading": vi.fn(),
        "mockError": vi.fn()
    };
});
vi.mock("../stores/dashboard", function () {
    return {
        "useDashboard": function (): {"stats": () => DashboardStats; "recent": () => CalculationRecord[]; "activity": () => ActivityPoint[]; "favorites": () => CalculationRecord[]; "loading": () => boolean; "error": () => string; "refresh": () => Promise<void>} {
            return {
                "stats": mocks.mockStats,
                "recent": mocks.mockRecent,
                "activity": mocks.mockActivity,
                "favorites": mocks.mockFavorites,
                "loading": mocks.mockLoading,
                "error": mocks.mockError,
                "refresh": mocks.mockRefresh
            };
        }
    };
});
import {Dashboard} from "./dashboard";
function makeCalc(overrides: {"ID"?: string; "CalculatorType"?: string; "Inputs"?: string; "Starred"?: boolean; "CreatedAt"?: string}): CalculationRecord {
    let base: CalculationRecord = {
        "ID": "1",
        "UserID": "local-user",
        "CalculatorType": "molar-mass",
        "Inputs": "H2O",
        "Result": "18.015",
        "Annotation": "",
        "Starred": false,
        "WorkspaceID": "",
        "CreatedAt": "2026-07-15T10:00:00.000Z"
    };
    let keys: string[] = Object.keys(overrides);
    let i: number;
    for (i = 0; i < keys.length; i++) {
        let key: string = keys[i];
        let value: string | boolean | undefined = overrides[key as "ID"];
        if (value !== undefined) {
            (base as unknown as Record<string, unknown>)[key] = value;
        }
    }
    return base;
}
function emptyStats(): DashboardStats {
    return {
        "totalCalculations": 0,
        "favoriteCount": 0,
        "thisWeekCount": 0,
        "calculatorsUsed": 0
    };
}
function emptyActivity(): ActivityPoint[] {
    return [
        {"day": "Mon", "count": 0},
        {"day": "Tue", "count": 0},
        {"day": "Wed", "count": 0},
        {"day": "Thu", "count": 0},
        {"day": "Fri", "count": 0},
        {"day": "Sat", "count": 0},
        {"day": "Sun", "count": 0}
    ];
}
function renderDashboard(): ReturnType<typeof render> {
    return render(function (): JSX.Element {
        return <Dashboard />;
    });
}
describe("Dashboard", function (): void {
    let renderBarChartSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        ChartRenderer.resetInstance();
        let instance = ChartRenderer.getInstance();
        renderBarChartSpy = vi.spyOn(Object.getPrototypeOf(instance), "renderBarChart").mockImplementation(function (): void { return; });
        vi.spyOn(Object.getPrototypeOf(instance), "destroyChart").mockImplementation(function (): void { return; });
        mocks.mockRefresh.mockReset();
        mocks.mockStats.mockReset();
        mocks.mockRecent.mockReset();
        mocks.mockActivity.mockReset();
        mocks.mockFavorites.mockReset();
        mocks.mockLoading.mockReset();
        mocks.mockError.mockReset();
        mocks.mockRefresh.mockResolvedValue(undefined);
        mocks.mockStats.mockReturnValue(emptyStats());
        mocks.mockRecent.mockReturnValue([]);
        mocks.mockActivity.mockReturnValue(emptyActivity());
        mocks.mockFavorites.mockReturnValue([]);
        mocks.mockLoading.mockReturnValue(false);
        mocks.mockError.mockReturnValue("");
    });
    afterEach(function (): void {
        cleanup();
        ChartRenderer.resetInstance();
        vi.restoreAllMocks();
    });
    it("renders the dashboard header", function (): void {
        let result = renderDashboard();
        expect(result.getByText("Dashboard")).toBeTruthy();
    });
    it("calls refresh on mount", function (): void {
        renderDashboard();
        expect(mocks.mockRefresh).toHaveBeenCalled();
    });
    it("renders four stat card labels", function (): void {
        let result = renderDashboard();
        expect(result.getByText("Total Calculations")).toBeTruthy();
        expect(result.getByText("Favorites", {"selector": "div"})).toBeTruthy();
        expect(result.getByText("This Week")).toBeTruthy();
        expect(result.getByText("Calculators Used")).toBeTruthy();
    });
    it("renders zero stat values when stats are empty", function (): void {
        let result = renderDashboard();
        let totalLabel = result.getByText("Total Calculations");
        let totalValue = totalLabel.nextElementSibling as Element;
        expect(totalValue.textContent).toBe("0");
        let favLabel = result.getByText("Favorites", {"selector": "div"});
        let favValue = favLabel.nextElementSibling as Element;
        expect(favValue.textContent).toBe("0");
        let weekLabel = result.getByText("This Week");
        let weekValue = weekLabel.nextElementSibling as Element;
        expect(weekValue.textContent).toBe("0");
        let usedLabel = result.getByText("Calculators Used");
        let usedValue = usedLabel.nextElementSibling as Element;
        expect(usedValue.textContent).toBe("0");
    });
    it("renders stat values from the store", function (): void {
        mocks.mockStats.mockReturnValue({
            "totalCalculations": 10,
            "favoriteCount": 3,
            "thisWeekCount": 5,
            "calculatorsUsed": 4
        });
        let result = renderDashboard();
        let totalLabel = result.getByText("Total Calculations");
        let totalValue = totalLabel.nextElementSibling as Element;
        expect(totalValue.textContent).toBe("10");
        let favLabel = result.getByText("Favorites", {"selector": "div"});
        let favValue = favLabel.nextElementSibling as Element;
        expect(favValue.textContent).toBe("3");
        let weekLabel = result.getByText("This Week");
        let weekValue = weekLabel.nextElementSibling as Element;
        expect(weekValue.textContent).toBe("5");
        let usedLabel = result.getByText("Calculators Used");
        let usedValue = usedLabel.nextElementSibling as Element;
        expect(usedValue.textContent).toBe("4");
    });
    it("renders loading indicator when loading is true", function (): void {
        mocks.mockLoading.mockReturnValue(true);
        let result = renderDashboard();
        expect(result.getByText("Loading dashboard...")).toBeTruthy();
    });
    it("does not show loading indicator when loading is false", function (): void {
        let result = renderDashboard();
        expect(result.queryByText("Loading dashboard...")).toBeNull();
    });
    it("renders error message when error is set", function (): void {
        mocks.mockError.mockReturnValue("Failed to load dashboard: Network error");
        let result = renderDashboard();
        let errorEl = result.container.querySelector('[role="alert"]');
        expect(errorEl).not.toBeNull();
        expect(errorEl && errorEl.textContent).toBe("Failed to load dashboard: Network error");
    });
    it("does not show error element when error is empty", function (): void {
        let result = renderDashboard();
        expect(result.container.querySelector('[role="alert"]')).toBeNull();
    });
    it("renders empty recent state when no calculations exist", function (): void {
        let result = renderDashboard();
        expect(result.getByText("No calculations yet. Try a calculator to get started.")).toBeTruthy();
    });
    it("renders recent calculations list with type inputs and date", function (): void {
        let calc = makeCalc({});
        mocks.mockRecent.mockReturnValue([calc]);
        let result = renderDashboard();
        expect(result.getByText("molar-mass")).toBeTruthy();
        expect(result.getByText("H2O")).toBeTruthy();
        expect(result.getByText("2026-07-15")).toBeTruthy();
    });
    it("renders two-digit month and day without padding", function (): void {
        let calc = makeCalc({"CreatedAt": "2026-12-25T10:00:00.000Z"});
        mocks.mockRecent.mockReturnValue([calc]);
        let result = renderDashboard();
        expect(result.getByText("2026-12-25")).toBeTruthy();
    });
    it("pads single-digit month and day with a leading zero", function (): void {
        let calc = makeCalc({"CreatedAt": "2026-07-05T10:00:00.000Z"});
        mocks.mockRecent.mockReturnValue([calc]);
        let result = renderDashboard();
        expect(result.getByText("2026-07-05")).toBeTruthy();
    });
    it("renders an empty date for an invalid CreatedAt value", function (): void {
        let calc = makeCalc({"CreatedAt": "not-a-date"});
        mocks.mockRecent.mockReturnValue([calc]);
        let result = renderDashboard();
        expect(result.getByText("molar-mass")).toBeTruthy();
        expect(result.queryByText("not-a-date")).toBeNull();
    });
    it("renders empty favorites state when no favorites exist", function (): void {
        let result = renderDashboard();
        expect(result.getByText("No favorite calculations yet. Star a calculation to pin it here.")).toBeTruthy();
    });
    it("renders favorites list with starred calculations", function (): void {
        let calc = makeCalc({"Starred": true, "CalculatorType": "dilution", "Inputs": "M1V1=M2V2"});
        mocks.mockFavorites.mockReturnValue([calc]);
        let result = renderDashboard();
        expect(result.getByText("dilution")).toBeTruthy();
        expect(result.getByText("M1V1=M2V2")).toBeTruthy();
    });
    it("renders the weekly activity chart canvas", function (): void {
        let result = renderDashboard();
        let canvas = result.container.querySelector("canvas");
        expect(canvas).not.toBeNull();
        expect(renderBarChartSpy).toHaveBeenCalled();
    });
    it("passes the dashboard-activity-chart canvasId to ChartCanvas", function (): void {
        let result = renderDashboard();
        let canvas = result.container.querySelector("canvas");
        expect(canvas).not.toBeNull();
        expect(canvas && canvas.getAttribute("id")).toBe("dashboard-activity-chart");
    });
    it("renders empty activity state when no activity points", function (): void {
        mocks.mockActivity.mockReturnValue([]);
        let result = renderDashboard();
        expect(result.getByText("Weekly activity chart unavailable.")).toBeTruthy();
        expect(result.container.querySelector("canvas")).toBeNull();
    });
    it("passes bar chart data and options to renderBarChart", function (): void {
        mocks.mockActivity.mockReturnValue([
            {"day": "Mon", "count": 2},
            {"day": "Tue", "count": 5},
            {"day": "Wed", "count": 0},
            {"day": "Thu", "count": 3},
            {"day": "Fri", "count": 1},
            {"day": "Sat", "count": 0},
            {"day": "Sun", "count": 4}
        ]);
        let result = renderDashboard();
        let canvas = result.container.querySelector("canvas");
        expect(canvas).not.toBeNull();
        expect(renderBarChartSpy).toHaveBeenCalled();
        let callArgs: unknown[] = renderBarChartSpy.mock.calls[0];
        expect(callArgs[0]).toBe("dashboard-activity-chart");
        let data = callArgs[1] as {"labels": string[]; "datasets": {"label": string; "data": number[]}[]};
        expect(data.labels).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
        expect(data.datasets[0].data).toEqual([2, 5, 0, 3, 1, 0, 4]);
        expect(data.datasets[0].label).toBe("Calculations");
        let options = callArgs[2] as {"title": string; "showLegend": boolean};
        expect(options.title).toBe("Weekly Activity");
        expect(options.showLegend).toBe(false);
    });
});
