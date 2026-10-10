import type { ConcentrationTimePoint } from "../calculators/kinetics.js";
import type { TitrationPoint } from "../chartRenderer.js";

type ChartRendererModule = typeof import("../chartRenderer.js");

let rendererModule: Promise<ChartRendererModule> | null = null;

function loadChartRenderer(): Promise<ChartRendererModule> {
    if (rendererModule === null) {
        rendererModule = import("../chartRenderer.js");
    }
    return rendererModule;
}

/**
 * Renders the concentration-vs-time series on the canvas identified by
 * `canvasId`. The Chart.js-backed renderer is imported on first use so the
 * pure calculation layer never pulls it in, and the call is a no-op when
 * the canvas is not mounted.
 */
export function renderConcentrationTimeChart(canvasId: string, points: unknown[]): void {
    if (typeof document === "undefined" || document.getElementById(canvasId) === null) {
        return;
    }
    void loadChartRenderer().then(function (renderer: ChartRendererModule): void {
        renderer.ChartRenderer.getInstance().renderConcentrationTimeChart(canvasId, points as ConcentrationTimePoint[]);
    }).catch(function (): void {
        // The chart is decoration on top of an already-computed result, so a
        // render failure must not surface as a calculation error.
    });
}

/**
 * Renders the titration curve (pH vs volume) on the canvas identified by
 * `canvasId`. The Chart.js-backed renderer is imported on first use so the
 * pure calculation layer never pulls it in, and the call is a no-op when the
 * canvas is not mounted.
 */
export function renderTitrationCurve(canvasId: string, points: unknown[]): void {
    if (typeof document === "undefined" || document.getElementById(canvasId) === null) {
        return;
    }
    void loadChartRenderer().then(function (renderer: ChartRendererModule): void {
        renderer.ChartRenderer.getInstance().renderTitrationCurve(canvasId, points as TitrationPoint[]);
    }).catch(function (): void {
        // The chart is decoration on top of an already-computed result, so a
        // render failure must not surface as a calculation error.
    });
}
