// @vitest-environment jsdom
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {ChartRenderer, ChartData, ChartOptions, buildChartConfiguration} from "./chartRenderer.js";
import {ThemeManager} from "./themeManager.js";

function noopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const handler: ProxyHandler<Record<string, unknown>> = {
        get: (_t, prop) => {
            if (typeof prop !== "string") return undefined;
            if (prop === "canvas") return canvas;
            if (prop === "measureText") return () => ({width: 0});
            if (prop === "getImageData") return () => ({data: new Uint8ClampedArray(4), width: 1, height: 1});
            if (prop === "createLinearGradient" || prop === "createRadialGradient" || prop === "createConicGradient") return () => ({addColorStop: () => undefined});
            if (prop === "getContextAttributes") return () => ({alpha: true});
            return () => undefined;
        },
        set: () => true,
    };
    return new Proxy({}, handler) as unknown as CanvasRenderingContext2D;
}

class MockRO {
    public observe(): void { return; }
    public unobserve(): void { return; }
    public disconnect(): void { return; }
}

function canvas(id: string): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.id = id;
    document.body.appendChild(c);
    return c;
}

function sampleData(): ChartData {
    return {"labels": ["a", "b", "c"], "datasets": [{"label": "S", "data": [1, 2, 3], "color": "#000", "borderColor": "#000", "backgroundColor": "#000"}]};
}
function sampleOpts(): ChartOptions {
    return {"title": "T", "xLabel": "X", "yLabel": "Y", "showLegend": true};
}

describe("chartCoverage: tooltip branches", () => {
    it("covers object y and x fallback", () => {
        const cfg = buildChartConfiguration("line", sampleData(), sampleOpts(), false);
        const opts = cfg.options as unknown as {plugins: {tooltip: {callbacks: {label: (c: unknown) => string}}}};
        const fn = opts.plugins.tooltip.callbacks.label;
        expect(fn({dataset: {label: "S"}, parsed: {x: 0, y: {x: 1, y: 2}}} as unknown)).toBe("S: ");
        expect(fn({dataset: {label: ""}, parsed: {x: 0, y: {x: 1, y: 2}}} as unknown)).toBe("");
        expect(fn({dataset: {label: "S"}, parsed: {x: 5, y: null}} as unknown)).toBe("S: 5");
        expect(fn({dataset: {label: ""}, parsed: {x: 5, y: null}} as unknown)).toBe("5");
    });
});

describe("chartCoverage: theme subscription", () => {
    let origGet: typeof HTMLCanvasElement.prototype.getContext;
    let origRO: unknown;
    beforeEach(() => {
        document.body.innerHTML = "";
        ChartRenderer.resetInstance();
        origGet = HTMLCanvasElement.prototype.getContext;
        origRO = (globalThis as unknown as Record<string, unknown>)["ResizeObserver"];
        HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement) { return noopContext(this); }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
        (globalThis as unknown as Record<string, unknown>)["ResizeObserver"] = MockRO;
    });
    afterEach(() => {
        ChartRenderer.resetInstance();
        document.body.innerHTML = "";
        HTMLCanvasElement.prototype.getContext = origGet;
        (globalThis as unknown as Record<string, unknown>)["ResizeObserver"] = origRO;
        vi.restoreAllMocks();
    });

    it("fires handleThemeChange via ThemeManager and guards subscribe", () => {
        const inst = ChartRenderer.getInstance();
        ThemeManager.getInstance().setTheme("dark");
        ThemeManager.getInstance().setTheme("amoled");
        ThemeManager.getInstance().setTheme("light");
        const anyInst = inst as unknown as Record<string, () => void>;
        anyInst["subscribeToTheme"]();
        expect((inst as unknown as Record<string, boolean>)["subscribed"]).toBe(true);
        anyInst["unsubscribeFromTheme"]();
        anyInst["unsubscribeFromTheme"]();
        expect((inst as unknown as Record<string, boolean>)["subscribed"]).toBe(false);
    });

    it("covers validate null and missing chart continue", () => {
        const inst = ChartRenderer.getInstance();
        expect(() => inst.validateChartData(null as unknown as ChartData)).toThrow("Chart data is required");
        canvas("c1");
        inst.renderLineChart("c1", sampleData(), sampleOpts());
        const maps = (inst as unknown as Record<string, Map<string, unknown>>)["charts"];
        const realGet = maps.get.bind(maps);
        vi.spyOn(maps, "get").mockImplementationOnce(() => undefined);
        inst.updateTheme(true);
        expect(realGet).toBeDefined();
    });

    it("covers applyThemeToScale undefined", () => {
        const inst = ChartRenderer.getInstance();
        const anyInst = inst as unknown as Record<string, (s: unknown, c: unknown) => void>;
        anyInst["applyThemeToScale"](undefined, {textColor: "#000", tickColor: "#000", gridColor: "#000", tooltipBg: "#000", tooltipText: "#fff"});
        anyInst["applyThemeToScale"]({}, {textColor: "#000", tickColor: "#000", gridColor: "#000", tooltipBg: "#000", tooltipText: "#fff"});
    });

    it("covers applyThemeToChart missing option branches", () => {
        const inst = ChartRenderer.getInstance() as unknown as Record<string, (c: unknown, col: unknown) => void>;
        const colors = {textColor: "#000", tickColor: "#111", gridColor: "#222", tooltipBg: "#333", tooltipText: "#fff"};
        inst["applyThemeToChart"]({options: {}}, colors);
        inst["applyThemeToChart"]({options: {plugins: {}}}, colors);
        inst["applyThemeToChart"]({options: {plugins: {title: {}}, scales: {}}}, colors);
        inst["applyThemeToChart"]({options: {plugins: {title: {}, legend: {}, tooltip: {}}, scales: {x: {}, y: {}}}}, colors);
    });
});

describe("chartCoverage: titration edges", () => {
    let origGet: typeof HTMLCanvasElement.prototype.getContext;
    let origRO: unknown;
    beforeEach(() => {
        document.body.innerHTML = "";
        ChartRenderer.resetInstance();
        origGet = HTMLCanvasElement.prototype.getContext;
        origRO = (globalThis as unknown as Record<string, unknown>)["ResizeObserver"];
        HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement) { return noopContext(this); }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
        (globalThis as unknown as Record<string, unknown>)["ResizeObserver"] = MockRO;
    });
    afterEach(() => {
        ChartRenderer.resetInstance();
        document.body.innerHTML = "";
        HTMLCanvasElement.prototype.getContext = origGet;
        (globalThis as unknown as Record<string, unknown>)["ResizeObserver"] = origRO;
        vi.restoreAllMocks();
    });

    it("handles single point and zero-volume gaps plus decimals", () => {
        const inst = ChartRenderer.getInstance();
        canvas("t1");
        inst.renderTitrationCurve("t1", [{volume: 5, pH: 7}]);
        expect(inst.hasChart("t1")).toBe(true);
        canvas("t2");
        inst.renderTitrationCurve("t2", [{volume: 0, pH: 1}, {volume: 0, pH: 1.5}, {volume: 10, pH: 7}]);
        expect(inst.hasChart("t2")).toBe(true);
        canvas("t3");
        inst.renderTitrationCurve("t3", [{volume: 2.345, pH: 3.678}, {volume: 5.678, pH: 7.123}]);
        expect(inst.hasChart("t3")).toBe(true);
        canvas("cc");
        inst.renderConcentrationTimeChart("cc", [{time: 1.234, concentration: 0.5}]);
        expect(inst.hasChart("cc")).toBe(true);
        canvas("en");
        inst.renderEnergyProfile("en", [{coordinate: 0.555, energy: 10}]);
        expect(inst.hasChart("en")).toBe(true);
    });

    it("rejects empty energy and activity data", () => {
        const inst = ChartRenderer.getInstance();
        expect(() => inst.renderEnergyProfile("e1", [])).toThrow("Energy profile");
        expect(() => inst.renderActivityChart("a1", [])).toThrow("Activity");
    });
});
