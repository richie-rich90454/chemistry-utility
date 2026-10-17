import {render, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {ChartRenderer} from "../../../modules/chartRenderer.js";
import type {ChartData, ChartOptions} from "../../../modules/chartRenderer.js";
import {ChartCanvas} from "./ChartCanvas";
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
let externalSetData: (data: ChartData) => void = function (): void { return; };
function ReactiveHost(props: {options: ChartOptions}): JSX.Element {
    let [data, setData] = createSignal<ChartData>(createSampleData());
    externalSetData = setData;
    return <ChartCanvas type="line" data={data()} options={props.options} canvasId="effect-test" />;
}
describe("ChartCanvas lifecycle", function (): void {
    let renderLineChartSpy: ReturnType<typeof vi.spyOn>;
    let destroyChartSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        ChartRenderer.resetInstance();
        let instance = ChartRenderer.getInstance();
        renderLineChartSpy = vi.spyOn(Object.getPrototypeOf(instance), "renderLineChart").mockImplementation(function (): void { return; });
        destroyChartSpy = vi.spyOn(Object.getPrototypeOf(instance), "destroyChart").mockImplementation(function (): void { return; });
    });
    afterEach(function (): void {
        cleanup();
        externalSetData = function (): void { return; };
        ChartRenderer.resetInstance();
        vi.restoreAllMocks();
    });
    it("renders a canvas element inside the chart container", function (): void {
        let result = render(function () {
            return <ChartCanvas type="line" data={createSampleData()} options={createSampleOptions()} canvasId="canvas-exists" />;
        });
        let canvas = result.container.querySelector("canvas");
        expect(canvas).not.toBeNull();
        expect(canvas && canvas.getAttribute("id")).toBe("canvas-exists");
    });
    it("calls renderLineChart on mount with the provided canvasId, data, and options", function (): void {
        let data = createSampleData();
        let options = createSampleOptions();
        render(function () {
            return <ChartCanvas type="line" data={data} options={options} canvasId="lifecycle-mount" />;
        });
        expect(renderLineChartSpy).toHaveBeenCalledWith("lifecycle-mount", data, options);
    });
    it("calls destroyChart on cleanup with the canvasId", function (): void {
        let data = createSampleData();
        let options = createSampleOptions();
        render(function () {
            return <ChartCanvas type="line" data={data} options={options} canvasId="lifecycle-cleanup" />;
        });
        cleanup();
        expect(destroyChartSpy).toHaveBeenCalledWith("lifecycle-cleanup");
    });
    it("re-renders the chart when data changes via createEffect", async function (): Promise<void> {
        let options = createSampleOptions();
        render(function () { return <ReactiveHost options={options} />; });
        renderLineChartSpy.mockClear();
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
        externalSetData(newData);
        await Promise.resolve();
        expect(renderLineChartSpy).toHaveBeenCalledWith("effect-test", newData, options);
    });
});
describe("ChartCanvas update in place", function (): void {
    let updateChartSpy: ReturnType<typeof vi.spyOn>;
    let destroyChartSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        ChartRenderer.resetInstance();
        let proto = Object.getPrototypeOf(ChartRenderer.getInstance());
        updateChartSpy = vi.spyOn(proto, "updateChart");
        destroyChartSpy = vi.spyOn(proto, "destroyChart");
    });
    afterEach(function (): void {
        cleanup();
        externalSetData = function (): void { return; };
        ChartRenderer.resetInstance();
        vi.restoreAllMocks();
    });
    it("calls updateChart instead of destroy+re-render when data changes", async function (): Promise<void> {
        let options = createSampleOptions();
        render(function () { return <ReactiveHost options={options} />; });
        expect(ChartRenderer.getInstance().hasChart("effect-test")).toBe(true);
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
        updateChartSpy.mockClear();
        destroyChartSpy.mockClear();
        externalSetData(newData);
        await Promise.resolve();
        expect(updateChartSpy).toHaveBeenCalledWith("effect-test", newData, options);
        expect(destroyChartSpy).not.toHaveBeenCalled();
        expect(ChartRenderer.getInstance().hasChart("effect-test")).toBe(true);
    });
    it("keeps the same chart instance across a data update", async function (): Promise<void> {
        let options = createSampleOptions();
        render(function () { return <ReactiveHost options={options} />; });
        let first = (ChartRenderer.getInstance() as unknown as { charts: Map<string, unknown> }).charts.get("effect-test");
        externalSetData(createSampleData());
        await Promise.resolve();
        let second = (ChartRenderer.getInstance() as unknown as { charts: Map<string, unknown> }).charts.get("effect-test");
        expect(second).toBe(first);
    });
});
describe("ChartCanvas chart types", function (): void {
    let renderLineChartSpy: ReturnType<typeof vi.spyOn>;
    let renderBarChartSpy: ReturnType<typeof vi.spyOn>;
    let renderScatterChartSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        ChartRenderer.resetInstance();
        let instance = ChartRenderer.getInstance();
        let proto = Object.getPrototypeOf(instance);
        renderLineChartSpy = vi.spyOn(proto, "renderLineChart").mockImplementation(function (): void { return; });
        renderBarChartSpy = vi.spyOn(proto, "renderBarChart").mockImplementation(function (): void { return; });
        renderScatterChartSpy = vi.spyOn(proto, "renderScatterChart").mockImplementation(function (): void { return; });
    });
    afterEach(function (): void {
        cleanup();
        ChartRenderer.resetInstance();
        vi.restoreAllMocks();
    });
    it("calls renderBarChart on mount for bar type", function (): void {
        let data = createSampleData();
        let options = createSampleOptions();
        render(function () {
            return <ChartCanvas type="bar" data={data} options={options} canvasId="bar-mount" />;
        });
        expect(renderBarChartSpy).toHaveBeenCalledWith("bar-mount", data, options);
    });
    it("calls renderScatterChart on mount for scatter type", function (): void {
        let data = createSampleData();
        let options = createSampleOptions();
        render(function () {
            return <ChartCanvas type="scatter" data={data} options={options} canvasId="scatter-mount" />;
        });
        expect(renderScatterChartSpy).toHaveBeenCalledWith("scatter-mount", data, options);
    });
    it("generates a default canvas id when canvasId is not provided", function (): void {
        let result = render(function () {
            return <ChartCanvas type="line" data={createSampleData()} options={createSampleOptions()} />;
        });
        let canvas = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.getAttribute("id")).toMatch(/^chart-/);
        expect(renderLineChartSpy).toHaveBeenCalledTimes(1);
        let usedId: string = renderLineChartSpy.mock.calls[0][0] as string;
        expect(usedId).toMatch(/^chart-/);
        expect(usedId).toBe(canvas.getAttribute("id"));
    });
});
