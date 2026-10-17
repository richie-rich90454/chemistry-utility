import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mocks = vi.hoisted(function () {
    return {
        "renderConcentrationTimeChart": vi.fn(),
        "renderTitrationCurve": vi.fn()
    };
});

vi.mock("../chartRenderer.js", function () {
    return {
        "ChartRenderer": {
            "getInstance": function () {
                return {
                    "renderConcentrationTimeChart": mocks.renderConcentrationTimeChart,
                    "renderTitrationCurve": mocks.renderTitrationCurve
                };
            }
        }
    };
});

import { renderConcentrationTimeChart, renderTitrationCurve } from "./chartBindings.js";

function flush(): Promise<void> {
    return new Promise<void>(function (resolve: (value: void) => void): void {
        setTimeout(function (): void {
            resolve();
        }, 0);
    });
}

function addCanvas(id: string): void {
    let canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.id = id;
    document.body.appendChild(canvas);
}

describe("chartBindings", function (): void {
    beforeEach(function (): void {
        document.body.innerHTML = "";
        mocks.renderConcentrationTimeChart.mockReset();
        mocks.renderTitrationCurve.mockReset();
    });
    afterEach(function (): void {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("does nothing when the canvas is not mounted", function (): void {
        renderConcentrationTimeChart("missing", []);
        renderTitrationCurve("missing", []);
        expect(mocks.renderConcentrationTimeChart).not.toHaveBeenCalled();
        expect(mocks.renderTitrationCurve).not.toHaveBeenCalled();
    });

    it("renders the concentration-time chart when the canvas exists", async function (): Promise<void> {
        addCanvas("conc");
        let points: unknown[] = [{"time": 0, "concentration": 1}];
        renderConcentrationTimeChart("conc", points);
        await flush();
        expect(mocks.renderConcentrationTimeChart).toHaveBeenCalledWith("conc", points);
    });

    it("renders the titration curve when the canvas exists", async function (): Promise<void> {
        addCanvas("titration");
        let points: unknown[] = [{"volume": 0, "pH": 1}];
        renderTitrationCurve("titration", points);
        await flush();
        expect(mocks.renderTitrationCurve).toHaveBeenCalledWith("titration", points);
    });

    it("reuses the loaded renderer module on later calls", async function (): Promise<void> {
        addCanvas("reuse");
        renderConcentrationTimeChart("reuse", []);
        renderTitrationCurve("reuse", []);
        await flush();
        expect(mocks.renderConcentrationTimeChart).toHaveBeenCalledTimes(1);
        expect(mocks.renderTitrationCurve).toHaveBeenCalledTimes(1);
    });

    it("swallows concentration render failures", async function (): Promise<void> {
        addCanvas("boom");
        mocks.renderConcentrationTimeChart.mockImplementation(function (): void {
            throw new Error("render failed");
        });
        renderConcentrationTimeChart("boom", []);
        await flush();
        expect(mocks.renderConcentrationTimeChart).toHaveBeenCalled();
    });

    it("swallows titration render failures", async function (): Promise<void> {
        addCanvas("boom");
        mocks.renderTitrationCurve.mockImplementation(function (): void {
            throw new Error("render failed");
        });
        renderTitrationCurve("boom", []);
        await flush();
        expect(mocks.renderTitrationCurve).toHaveBeenCalled();
    });
});
