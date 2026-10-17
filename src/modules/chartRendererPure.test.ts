import { describe, it, expect } from "vitest";
import { buildChartConfiguration } from "./chartRenderer.js";
import type { ChartConfiguration } from "./chartRenderer.js";
import type { ChartData, ChartOptions } from "./chartRenderer.js";
import { dps } from "./dom/hidpiCanvas.js";
interface TooltipCallbackContext {
    dataset: { label?: string };
    parsed: { x: number; y: number };
}
type TooltipLabelCallback = (context: TooltipCallbackContext) => string;
interface ChartConfigOptionsShape {
    scales: {
        x: {
            title: { display: boolean; text: string; color: string };
            ticks: { color: string };
            grid: { color: string };
        };
        y: {
            title: { display: boolean; text: string; color: string };
            ticks: { color: string };
            grid: { color: string };
        };
    };
    plugins: {
        title: { display: boolean; text: string; color: string };
        legend: { display: boolean; labels: { color: string } };
        tooltip: {
            enabled: boolean;
            backgroundColor: string;
            titleColor: string;
            bodyColor: string;
            callbacks: { label: TooltipLabelCallback };
        };
    };
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
function getOptions(config: ChartConfiguration): ChartConfigOptionsShape {
    return config.options as unknown as ChartConfigOptionsShape;
}
function getScales(config: ChartConfiguration): ChartConfigOptionsShape["scales"] {
    return getOptions(config).scales;
}
function getPlugins(config: ChartConfiguration): ChartConfigOptionsShape["plugins"] {
    return getOptions(config).plugins;
}
describe("buildChartConfiguration", function (): void {
    describe("line type", function (): void {
        it("returns a configuration with type line", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), createSampleOptions(), false);
            expect(config.type).toBe("line");
        });
        it("renders at the current device pixel ratio", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), createSampleOptions(), false);
            expect(config.options.devicePixelRatio).toBe(dps());
        });
        it("preserves labels and dataset properties from input data", function (): void {
            let data: ChartData = createSampleData();
            let config: ChartConfiguration = buildChartConfiguration("line", data, createSampleOptions(), false);
            expect(config.data.labels).toBe(data.labels);
            expect(config.data.datasets.length).toBe(1);
            expect(config.data.datasets[0].label).toBe("Series A");
            expect(config.data.datasets[0].borderColor).toBe("#2d5a3d");
            expect(config.data.datasets[0].backgroundColor).toBe("rgba(45,90,61,0.1)");
            expect(config.data.datasets[0].data).toEqual([1, 2, 3]);
        });
        it("sets line-specific dataset properties (pointRadius 0, fill false, tension 0.1, showLine true)", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), createSampleOptions(), false);
            expect(config.data.datasets[0].borderWidth).toBe(2);
            expect(config.data.datasets[0].pointRadius).toBe(0);
            expect(config.data.datasets[0].pointHoverRadius).toBe(5);
            expect(config.data.datasets[0].fill).toBe(false);
            expect(config.data.datasets[0].tension).toBe(0.1);
            expect(config.data.datasets[0].showLine).toBe(true);
        });
    });
    describe("bar type", function (): void {
        it("returns a configuration with type bar", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("bar", createSampleData(), createSampleOptions(), false);
            expect(config.type).toBe("bar");
        });
        it("sets bar-specific dataset properties (pointRadius 3, fill true, tension 0, showLine true)", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("bar", createSampleData(), createSampleOptions(), false);
            expect(config.data.datasets[0].pointRadius).toBe(3);
            expect(config.data.datasets[0].fill).toBe(true);
            expect(config.data.datasets[0].tension).toBe(0);
            expect(config.data.datasets[0].showLine).toBe(true);
        });
    });
    describe("scatter type", function (): void {
        it("returns a configuration with type scatter", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("scatter", createSampleData(), createSampleOptions(), false);
            expect(config.type).toBe("scatter");
        });
        it("converts numeric labels to scatter points with x and y coordinates", function (): void {
            let data: ChartData = {
                "labels": ["1", "2", "3"],
                "datasets": [{
                    "label": "Scatter",
                    "data": [10, 20, 30],
                    "color": "#000000",
                    "borderColor": "#000000",
                    "backgroundColor": "#000000"
                }]
            };
            let config: ChartConfiguration = buildChartConfiguration("scatter", data, createSampleOptions(), false);
            expect(config.data.datasets[0].data).toEqual([
                { "x": 1, "y": 10 },
                { "x": 2, "y": 20 },
                { "x": 3, "y": 30 }
            ]);
        });
        it("falls back to index-based x when labels are non-numeric", function (): void {
            let data: ChartData = {
                "labels": ["a", "b", "c"],
                "datasets": [{
                    "label": "Scatter",
                    "data": [10, 20, 30],
                    "color": "#000000",
                    "borderColor": "#000000",
                    "backgroundColor": "#000000"
                }]
            };
            let config: ChartConfiguration = buildChartConfiguration("scatter", data, createSampleOptions(), false);
            expect(config.data.datasets[0].data).toEqual([
                { "x": 0, "y": 10 },
                { "x": 1, "y": 20 },
                { "x": 2, "y": 30 }
            ]);
        });
        it("sets scatter-specific dataset properties (pointRadius 3, fill true, tension 0, showLine false)", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("scatter", createSampleData(), createSampleOptions(), false);
            expect(config.data.datasets[0].pointRadius).toBe(3);
            expect(config.data.datasets[0].fill).toBe(true);
            expect(config.data.datasets[0].tension).toBe(0);
            expect(config.data.datasets[0].showLine).toBe(false);
        });
    });
    describe("light theme", function (): void {
        it("applies light theme colors to title, legend, tooltip, and scales", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), createSampleOptions(), false);
            let plugins: ChartConfigOptionsShape["plugins"] = getPlugins(config);
            let scales: ChartConfigOptionsShape["scales"] = getScales(config);
            expect(plugins.title.color).toBe("#333333");
            expect(plugins.legend.labels.color).toBe("#333333");
            expect(plugins.tooltip.backgroundColor).toBe("rgba(60,60,60,0.95)");
            expect(plugins.tooltip.titleColor).toBe("#ffffff");
            expect(plugins.tooltip.bodyColor).toBe("#ffffff");
            expect(scales.x.ticks.color).toBe("#555555");
            expect(scales.x.grid.color).toBe("rgba(0,0,0,0.1)");
            expect(scales.y.ticks.color).toBe("#555555");
            expect(scales.y.grid.color).toBe("rgba(0,0,0,0.1)");
        });
    });
    describe("dark theme", function (): void {
        it("applies dark theme colors to title, legend, tooltip, and scales", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), createSampleOptions(), true);
            let plugins: ChartConfigOptionsShape["plugins"] = getPlugins(config);
            let scales: ChartConfigOptionsShape["scales"] = getScales(config);
            expect(plugins.title.color).toBe("#e0e0e0");
            expect(plugins.legend.labels.color).toBe("#e0e0e0");
            expect(plugins.tooltip.backgroundColor).toBe("rgba(40,40,40,0.95)");
            expect(plugins.tooltip.titleColor).toBe("#f0f0f0");
            expect(plugins.tooltip.bodyColor).toBe("#f0f0f0");
            expect(scales.x.ticks.color).toBe("#b0b0b0");
            expect(scales.x.grid.color).toBe("rgba(255,255,255,0.12)");
            expect(scales.y.ticks.color).toBe("#b0b0b0");
            expect(scales.y.grid.color).toBe("rgba(255,255,255,0.12)");
        });
    });
    describe("options propagation", function (): void {
        it("disables title display when title is empty", function (): void {
            let options: ChartOptions = {
                "title": "",
                "xLabel": "X",
                "yLabel": "Y",
                "showLegend": false
            };
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), options, false);
            expect(getPlugins(config).title.display).toBe(false);
        });
        it("enables title display when title is non-empty", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), createSampleOptions(), false);
            expect(getPlugins(config).title.display).toBe(true);
            expect(getPlugins(config).title.text).toBe("Test Chart");
        });
        it("disables legend display when showLegend is false", function (): void {
            let options: ChartOptions = {
                "title": "T",
                "xLabel": "X",
                "yLabel": "Y",
                "showLegend": false
            };
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), options, false);
            expect(getPlugins(config).legend.display).toBe(false);
        });
        it("disables x-axis title display when xLabel is empty", function (): void {
            let options: ChartOptions = {
                "title": "T",
                "xLabel": "",
                "yLabel": "Y",
                "showLegend": false
            };
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), options, false);
            expect(getScales(config).x.title.display).toBe(false);
        });
        it("disables y-axis title display when yLabel is empty", function (): void {
            let options: ChartOptions = {
                "title": "T",
                "xLabel": "X",
                "yLabel": "",
                "showLegend": false
            };
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), options, false);
            expect(getScales(config).y.title.display).toBe(false);
        });
    });
    describe("multiple datasets", function (): void {
        it("preserves order and properties of multiple datasets", function (): void {
            let data: ChartData = {
                "labels": ["a", "b"],
                "datasets": [
                    {
                        "label": "First",
                        "data": [1, 2],
                        "color": "#111111",
                        "borderColor": "#111111",
                        "backgroundColor": "rgba(1,1,1,0.1)"
                    },
                    {
                        "label": "Second",
                        "data": [3, 4],
                        "color": "#222222",
                        "borderColor": "#222222",
                        "backgroundColor": "rgba(2,2,2,0.1)"
                    }
                ]
            };
            let config: ChartConfiguration = buildChartConfiguration("line", data, createSampleOptions(), false);
            expect(config.data.datasets.length).toBe(2);
            expect(config.data.datasets[0].label).toBe("First");
            expect(config.data.datasets[1].label).toBe("Second");
            expect(config.data.datasets[0].borderColor).toBe("#111111");
            expect(config.data.datasets[1].borderColor).toBe("#222222");
        });
    });
    describe("tooltip callback", function (): void {
        it("formats a label using the dataset label and parsed y value", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), createSampleOptions(), false);
            let labelFn: TooltipLabelCallback = getPlugins(config).tooltip.callbacks.label;
            let result: string = labelFn({ "dataset": { "label": "Series A" }, "parsed": { "x": 0, "y": 42 } });
            expect(result).toBe("Series A: 42");
        });
        it("returns just the value when dataset label is empty", function (): void {
            let config: ChartConfiguration = buildChartConfiguration("line", createSampleData(), createSampleOptions(), false);
            let labelFn: TooltipLabelCallback = getPlugins(config).tooltip.callbacks.label;
            let result: string = labelFn({ "dataset": { "label": "" }, "parsed": { "x": 0, "y": 7 } });
            expect(result).toBe("7");
        });
    });
    describe("purity", function (): void {
        it("returns equal type and data for equal inputs (no internal state dependency)", function (): void {
            let data: ChartData = createSampleData();
            let options: ChartOptions = createSampleOptions();
            let a: ChartConfiguration = buildChartConfiguration("line", data, options, false);
            let b: ChartConfiguration = buildChartConfiguration("line", data, options, false);
            expect(a.type).toBe(b.type);
            expect(a.data).toEqual(b.data);
        });
        it("returns equal theme colors for equal isDark flag", function (): void {
            let data: ChartData = createSampleData();
            let options: ChartOptions = createSampleOptions();
            let a: ChartConfiguration = buildChartConfiguration("line", data, options, true);
            let b: ChartConfiguration = buildChartConfiguration("line", data, options, true);
            let pluginsA: ChartConfigOptionsShape["plugins"] = getPlugins(a);
            let pluginsB: ChartConfigOptionsShape["plugins"] = getPlugins(b);
            let scalesA: ChartConfigOptionsShape["scales"] = getScales(a);
            let scalesB: ChartConfigOptionsShape["scales"] = getScales(b);
            expect(pluginsA.title.color).toBe(pluginsB.title.color);
            expect(pluginsA.tooltip.backgroundColor).toBe(pluginsB.tooltip.backgroundColor);
            expect(scalesA.x.ticks.color).toBe(scalesB.x.ticks.color);
            expect(scalesA.x.grid.color).toBe(scalesB.x.grid.color);
        });
        it("does not mutate the input data", function (): void {
            let data: ChartData = createSampleData();
            let originalLabels: string[] = data.labels.slice();
            let originalData: number[] = data.datasets[0].data.slice();
            buildChartConfiguration("line", data, createSampleOptions(), false);
            expect(data.labels).toEqual(originalLabels);
            expect(data.datasets[0].data).toEqual(originalData);
        });
    });
});
