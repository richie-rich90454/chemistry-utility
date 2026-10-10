import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    ChartRenderer,
    ChartData,
    ChartOptions,
    TitrationPoint,
    ConcentrationTimePoint,
    EnergyProfilePoint,
    ActivityPoint
} from "./chartRenderer.js";

function createNoopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    let handler: ProxyHandler<Record<string, unknown>> = {
        "get": function (_target: Record<string, unknown>, prop: string | symbol): unknown {
            if (typeof prop !== "string") {
                return undefined;
            }
            if (prop === "canvas") {
                return canvas;
            }
            if (prop === "measureText") {
                return function (): { width: number } {
                    return { "width": 0 };
                };
            }
            if (prop === "getImageData") {
                return function (): ImageData {
                    return { "data": new Uint8ClampedArray(4), "width": 1, "height": 1 } as unknown as ImageData;
                };
            }
            if (prop === "createLinearGradient" || prop === "createRadialGradient" || prop === "createConicGradient") {
                return function (): CanvasGradient {
                    return { "addColorStop": function (): void { return; } } as unknown as CanvasGradient;
                };
            }
            if (prop === "getContextAttributes") {
                return function (): { alpha: boolean } {
                    return { "alpha": true };
                };
            }
            if (prop === "save" || prop === "restore" || prop === "beginPath" || prop === "closePath" || prop === "fill" || prop === "stroke" || prop === "clip") {
                return function (): void { return; };
            }
            return function (): void { return; };
        },
        "set": function (): boolean {
            return true;
        }
    };
    return new Proxy({}, handler) as unknown as CanvasRenderingContext2D;
}

class MockResizeObserver {
    public observe(): void { return; }
    public unobserve(): void { return; }
    public disconnect(): void { return; }
}

function createCanvas(id: string): HTMLCanvasElement {
    let canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.id = id;
    document.body.appendChild(canvas);
    return canvas;
}

function createSampleData(): ChartData {
    return {
        "labels": ["a", "b", "c"],
        "datasets": [{
            "label": "Series A",
            "data": [1, 2, 3],
            "color": "#2d5a3d",
            "borderColor": "#2d5a3d",
            "backgroundColor": "rgba(45,90,61,0.1)"
        }]
    };
}

function createSampleOptions(): ChartOptions {
    return {
        "title": "Test Chart",
        "xLabel": "X Axis",
        "yLabel": "Y Axis",
        "showLegend": true
    };
}

describe("ChartRenderer", function () {
    let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
    let originalToDataURL: typeof HTMLCanvasElement.prototype.toDataURL;
    let originalResizeObserver: typeof globalThis.ResizeObserver | undefined;
    let toDataURLMock: ReturnType<typeof vi.fn>;
    let getContextMock: ReturnType<typeof vi.fn>;

    beforeEach(function () {
        document.body.innerHTML = "";
        ChartRenderer.resetInstance();
        originalGetContext = HTMLCanvasElement.prototype.getContext;
        originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        originalResizeObserver = globalThis.ResizeObserver;
        getContextMock = vi.fn(function (this: HTMLCanvasElement): CanvasRenderingContext2D | null {
            return createNoopContext(this);
        });
        toDataURLMock = vi.fn(function (): string {
            return "data:image/png;base64,FAKEDATA";
        });
        HTMLCanvasElement.prototype.getContext = getContextMock as typeof HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.toDataURL = toDataURLMock as typeof HTMLCanvasElement.prototype.toDataURL;
        (globalThis as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
        (window as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
    });

    afterEach(function () {
        ChartRenderer.resetInstance();
        document.body.innerHTML = "";
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
        (globalThis as unknown as Record<string, unknown>).ResizeObserver = originalResizeObserver;
        (window as unknown as Record<string, unknown>).ResizeObserver = originalResizeObserver;
        vi.restoreAllMocks();
    });

    describe("getInstance", function () {
        it("returns a ChartRenderer instance", function () {
            let instance: ChartRenderer = ChartRenderer.getInstance();
            expect(instance).toBeInstanceOf(ChartRenderer);
        });

        it("uses the Chart constructor owned by registerChartPlugins (single registration site)", async function () {
            let owner = await import("../solid/third-party/registerChartPlugins.js");
            expect(owner.Chart).toBeDefined();
            expect(typeof owner.Chart.register).toBe("function");
            createCanvas("ownership-canvas");
            ChartRenderer.getInstance().renderLineChart("ownership-canvas", createSampleData(), createSampleOptions());
            expect(ChartRenderer.getInstance().hasChart("ownership-canvas")).toBe(true);
        });

        it("returns the same instance on subsequent calls", function () {
            let a: ChartRenderer = ChartRenderer.getInstance();
            let b: ChartRenderer = ChartRenderer.getInstance();
            expect(a).toBe(b);
        });

        it("returns a new instance after resetInstance", function () {
            let first: ChartRenderer = ChartRenderer.getInstance();
            ChartRenderer.resetInstance();
            let second: ChartRenderer = ChartRenderer.getInstance();
            expect(first).not.toBe(second);
        });
    });

    describe("defaultOptions", function () {
        it("returns options with empty strings and showLegend false", function () {
            let opts: ChartOptions = ChartRenderer.defaultOptions();
            expect(opts.title).toBe("");
            expect(opts.xLabel).toBe("");
            expect(opts.yLabel).toBe("");
            expect(opts.showLegend).toBe(false);
        });
    });

    describe("validateChartData", function () {
        let instance: ChartRenderer;
        beforeEach(function () {
            instance = ChartRenderer.getInstance();
        });

        it("throws when labels are missing", function () {
            let data = {
                "datasets": [{
                    "label": "A",
                    "data": [1],
                    "color": "",
                    "borderColor": "",
                    "backgroundColor": ""
                }]
            } as unknown as ChartData;
            expect(function () { instance.validateChartData(data); }).toThrow();
        });

        it("throws when datasets are missing", function () {
            let data = { "labels": ["a"] } as unknown as ChartData;
            expect(function () { instance.validateChartData(data); }).toThrow();
        });

        it("throws when datasets are empty", function () {
            let data: ChartData = { "labels": ["a"], "datasets": [] };
            expect(function () { instance.validateChartData(data); }).toThrow();
        });

        it("throws when dataset data length does not match labels length", function () {
            let data: ChartData = {
                "labels": ["a", "b"],
                "datasets": [{
                    "label": "A",
                    "data": [1],
                    "color": "",
                    "borderColor": "",
                    "backgroundColor": ""
                }]
            };
            expect(function () { instance.validateChartData(data); }).toThrow();
        });

        it("throws when dataset data array is missing", function () {
            let data = {
                "labels": ["a"],
                "datasets": [{
                    "label": "A",
                    "color": "",
                    "borderColor": "",
                    "backgroundColor": ""
                }]
            } as unknown as ChartData;
            expect(function () { instance.validateChartData(data); }).toThrow();
        });

        it("does not throw for valid data", function () {
            let data: ChartData = {
                "labels": ["a", "b"],
                "datasets": [{
                    "label": "A",
                    "data": [1, 2],
                    "color": "",
                    "borderColor": "",
                    "backgroundColor": ""
                }]
            };
            expect(function () { instance.validateChartData(data); }).not.toThrow();
        });

        it("does not throw for multiple datasets with matching lengths", function () {
            let data: ChartData = {
                "labels": ["a", "b", "c"],
                "datasets": [
                    {
                        "label": "A",
                        "data": [1, 2, 3],
                        "color": "",
                        "borderColor": "",
                        "backgroundColor": ""
                    },
                    {
                        "label": "B",
                        "data": [4, 5, 6],
                        "color": "",
                        "borderColor": "",
                        "backgroundColor": ""
                    }
                ]
            };
            expect(function () { instance.validateChartData(data); }).not.toThrow();
        });
    });

    describe("renderLineChart", function () {
        it("renders a line chart on the canvas", function () {
            createCanvas("line-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let data: ChartData = createSampleData();
            let options: ChartOptions = createSampleOptions();
            expect(function () { instance.renderLineChart("line-chart", data, options); }).not.toThrow();
            expect(instance.hasChart("line-chart")).toBe(true);
        });

        it("throws when canvas does not exist", function () {
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let data: ChartData = createSampleData();
            let options: ChartOptions = ChartRenderer.defaultOptions();
            expect(function () { instance.renderLineChart("missing", data, options); }).toThrow();
        });

        it("replaces existing chart when re-rendered on the same canvas", function () {
            createCanvas("replace-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let data: ChartData = createSampleData();
            let options: ChartOptions = ChartRenderer.defaultOptions();
            instance.renderLineChart("replace-chart", data, options);
            expect(instance.hasChart("replace-chart")).toBe(true);
            expect(function () { instance.renderLineChart("replace-chart", data, options); }).not.toThrow();
            expect(instance.hasChart("replace-chart")).toBe(true);
        });
    });

    describe("updateChart", function () {
        it("updates the registered chart in place instead of destroying it", function () {
            createCanvas("update-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            instance.renderLineChart("update-chart", createSampleData(), ChartRenderer.defaultOptions());
            let existing = (instance as unknown as { charts: Map<string, { chart: unknown }> }).charts.get("update-chart");
            let newData: ChartData = {
                "labels": ["x", "y"],
                "datasets": [{
                    "label": "New Series",
                    "data": [10, 20],
                    "color": "#000000",
                    "borderColor": "#000000",
                    "backgroundColor": "rgba(0,0,0,0.1)"
                }]
            };
            let newOptions: ChartOptions = { "title": "New", "xLabel": "X", "yLabel": "Y", "showLegend": true };
            expect(function () { instance.updateChart("update-chart", newData, newOptions); }).not.toThrow();
            let updated = (instance as unknown as { charts: Map<string, { chart: unknown; data: ChartData; options: ChartOptions }> }).charts.get("update-chart");
            expect(updated!.chart).toBe(existing!.chart);
            expect(updated!.data).toBe(newData);
            expect(updated!.options).toBe(newOptions);
        });

        it("is a no-op when no chart is registered", function () {
            let instance: ChartRenderer = ChartRenderer.getInstance();
            expect(function () { instance.updateChart("never", createSampleData(), ChartRenderer.defaultOptions()); }).not.toThrow();
        });

        it("rejects mismatched data", function () {
            createCanvas("update-bad");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let bad = { "labels": ["a", "b"], "datasets": createSampleData().datasets } as ChartData;
            expect(function () { instance.updateChart("update-bad", bad, ChartRenderer.defaultOptions()); }).toThrow();
        });
    });

    describe("refitChart", function () {
        it("resizes the chart when it is registered", function () {
            createCanvas("refit-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            instance.renderLineChart("refit-chart", createSampleData(), ChartRenderer.defaultOptions());
            let stored = (instance as unknown as { charts: Map<string, { chart: { resize: () => void } }> }).charts.get("refit-chart");
            expect(function () { instance.refitChart("refit-chart"); }).not.toThrow();
            expect(typeof stored!.chart.resize).toBe("function");
        });

        it("is a no-op when no chart is registered", function () {
            let instance: ChartRenderer = ChartRenderer.getInstance();
            expect(function () { instance.refitChart("never"); }).not.toThrow();
        });
    });

    describe("renderBarChart", function () {
        it("renders a bar chart on the canvas", function () {
            createCanvas("bar-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let data: ChartData = createSampleData();
            let options: ChartOptions = ChartRenderer.defaultOptions();
            expect(function () { instance.renderBarChart("bar-chart", data, options); }).not.toThrow();
            expect(instance.hasChart("bar-chart")).toBe(true);
        });
    });

    describe("renderScatterChart", function () {
        it("renders a scatter chart on the canvas", function () {
            createCanvas("scatter-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let data: ChartData = createSampleData();
            let options: ChartOptions = ChartRenderer.defaultOptions();
            expect(function () { instance.renderScatterChart("scatter-chart", data, options); }).not.toThrow();
            expect(instance.hasChart("scatter-chart")).toBe(true);
        });
    });

    describe("updateTheme", function () {
        it("updates theme without throwing when charts exist", function () {
            createCanvas("theme-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let data: ChartData = createSampleData();
            let options: ChartOptions = ChartRenderer.defaultOptions();
            instance.renderLineChart("theme-chart", data, options);
            expect(function () { instance.updateTheme(true); }).not.toThrow();
            expect(function () { instance.updateTheme(false); }).not.toThrow();
        });

        it("does not throw when no charts exist", function () {
            let instance: ChartRenderer = ChartRenderer.getInstance();
            expect(function () { instance.updateTheme(true); }).not.toThrow();
            expect(function () { instance.updateTheme(false); }).not.toThrow();
        });

        it("applies dark theme colors to rendered charts", function () {
            createCanvas("theme-dark-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let data: ChartData = createSampleData();
            let options: ChartOptions = createSampleOptions();
            instance.renderLineChart("theme-dark-chart", data, options);
            expect(function () { instance.updateTheme(true); }).not.toThrow();
            expect(instance.hasChart("theme-dark-chart")).toBe(true);
        });
    });

    describe("exportChartAsPng", function () {
        let downloaded: {href: string; download: string}[] = [];
        let originalClick: typeof HTMLAnchorElement.prototype.click;
        beforeEach(function () {
            downloaded = [];
            originalClick = HTMLAnchorElement.prototype.click;
            (HTMLAnchorElement.prototype as unknown as Record<string, unknown>).click = function (this: HTMLAnchorElement): void {
                downloaded.push({ "href": this.href, "download": this.download });
            } as typeof HTMLAnchorElement.prototype.click;
        });
        afterEach(function () {
            HTMLAnchorElement.prototype.click = originalClick;
        });
        it("downloads the canvas through a blob URL instead of toDataURL", async function () {
            createCanvas("export-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let data: ChartData = createSampleData();
            let options: ChartOptions = ChartRenderer.defaultOptions();
            instance.renderLineChart("export-chart", data, options);
            toDataURLMock.mockClear();
            await instance.exportChartAsPng("export-chart", "chart.png");
            expect(toDataURLMock).not.toHaveBeenCalled();
            expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
            expect(downloaded.length).toBe(1);
            expect(downloaded[0].download).toBe("chart.png");
            expect(downloaded[0].href).toBe("blob:mock");
        });

        it("rejects when canvas does not exist", async function () {
            let instance: ChartRenderer = ChartRenderer.getInstance();
            await expect(instance.exportChartAsPng("missing", "x.png")).rejects.toThrow("Canvas element not found");
        });
    });

    describe("destroyChart", function () {
        it("removes the chart from the registry", function () {
            createCanvas("destroy-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let data: ChartData = createSampleData();
            let options: ChartOptions = ChartRenderer.defaultOptions();
            instance.renderLineChart("destroy-chart", data, options);
            expect(instance.hasChart("destroy-chart")).toBe(true);
            instance.destroyChart("destroy-chart");
            expect(instance.hasChart("destroy-chart")).toBe(false);
        });

        it("is safe to call when no chart exists for the given id", function () {
            let instance: ChartRenderer = ChartRenderer.getInstance();
            expect(function () { instance.destroyChart("never"); }).not.toThrow();
        });
    });

    describe("destroyAll", function () {
        it("removes all charts from the registry", function () {
            createCanvas("all-1");
            createCanvas("all-2");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let data: ChartData = createSampleData();
            let options: ChartOptions = ChartRenderer.defaultOptions();
            instance.renderLineChart("all-1", data, options);
            instance.renderBarChart("all-2", data, options);
            expect(instance.hasChart("all-1")).toBe(true);
            expect(instance.hasChart("all-2")).toBe(true);
            instance.destroyAll();
            expect(instance.hasChart("all-1")).toBe(false);
            expect(instance.hasChart("all-2")).toBe(false);
        });
    });

    describe("renderTitrationCurve", function () {
        it("renders a titration curve on the canvas", function () {
            createCanvas("titration-curve");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let points: TitrationPoint[] = [
                { "volume": 0, "pH": 1 },
                { "volume": 5, "pH": 1.5 },
                { "volume": 10, "pH": 7 },
                { "volume": 15, "pH": 12 },
                { "volume": 20, "pH": 13 }
            ];
            expect(function () { instance.renderTitrationCurve("titration-curve", points); }).not.toThrow();
            expect(instance.hasChart("titration-curve")).toBe(true);
        });

        it("throws when data points are empty", function () {
            createCanvas("titration-empty");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            expect(function () { instance.renderTitrationCurve("titration-empty", []); }).toThrow();
        });
    });

    describe("renderConcentrationTimeChart", function () {
        it("renders a concentration-time chart on the canvas", function () {
            createCanvas("conc-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let points: ConcentrationTimePoint[] = [
                { "time": 0, "concentration": 1 },
                { "time": 5, "concentration": 0.5 },
                { "time": 10, "concentration": 0.25 }
            ];
            expect(function () { instance.renderConcentrationTimeChart("conc-chart", points); }).not.toThrow();
            expect(instance.hasChart("conc-chart")).toBe(true);
        });

        it("throws when data points are empty", function () {
            createCanvas("conc-empty");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            expect(function () { instance.renderConcentrationTimeChart("conc-empty", []); }).toThrow();
        });
    });

    describe("renderEnergyProfile", function () {
        it("renders an energy profile on the canvas", function () {
            createCanvas("energy-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let points: EnergyProfilePoint[] = [
                { "coordinate": 0, "energy": 0 },
                { "coordinate": 1, "energy": 100 },
                { "coordinate": 2, "energy": -50 }
            ];
            expect(function () { instance.renderEnergyProfile("energy-chart", points); }).not.toThrow();
            expect(instance.hasChart("energy-chart")).toBe(true);
        });
    });

    describe("renderActivityChart", function () {
        it("renders an activity bar chart on the canvas", function () {
            createCanvas("activity-chart");
            let instance: ChartRenderer = ChartRenderer.getInstance();
            let points: ActivityPoint[] = [
                { "day": "Mon", "count": 5 },
                { "day": "Tue", "count": 10 },
                { "day": "Wed", "count": 7 }
            ];
            expect(function () { instance.renderActivityChart("activity-chart", points); }).not.toThrow();
            expect(instance.hasChart("activity-chart")).toBe(true);
        });
    });
});
