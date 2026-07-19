import {render, cleanup} from "@solidjs/testing-library";
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
        ChartRenderer.resetInstance();
        vi.restoreAllMocks();
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
});
