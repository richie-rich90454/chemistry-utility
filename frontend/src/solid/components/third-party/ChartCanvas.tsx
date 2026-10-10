import type {JSX} from "solid-js";
import {onMount, onCleanup, createMemo, createRenderEffect, createEffect} from "solid-js";
import "../../third-party/registerChartPlugins.js";
import {ChartRenderer} from "../../../modules/chartRenderer.js";
import type {ChartData, ChartOptions} from "../../../modules/chartRenderer.js";
import {observeCanvasResize} from "../../../modules/dom/hidpiCanvas.js";
import styles from "./ChartCanvas.module.css";
export interface ChartCanvasProps {
    type: "line" | "bar" | "scatter";
    data: ChartData;
    options: ChartOptions;
    canvasId?: string;
}
function ChartCanvas(props: ChartCanvasProps): JSX.Element {
    let canvasIdMemo = createMemo(function (): string {
        if (props.canvasId !== undefined) {
            return props.canvasId;
        }
        return "chart-" + Math.random().toString(36).slice(2, 11);
    });
    let canvasId: string = "";
    createRenderEffect(function (): void {
        canvasId = canvasIdMemo();
    });
    let canvasEl: HTMLCanvasElement | undefined;
    let stopObserving: (() => void) | null = null;
    function renderByType(type: "line" | "bar" | "scatter", data: ChartData, options: ChartOptions): void {
        let renderer = ChartRenderer.getInstance();
        if (type === "line") {
            renderer.renderLineChart(canvasId, data, options);
        }
        else if (type === "bar") {
            renderer.renderBarChart(canvasId, data, options);
        }
        else {
            renderer.renderScatterChart(canvasId, data, options);
        }
    }
    onMount(function (): void {
        renderByType(props.type, props.data, props.options);
        if (canvasEl !== undefined) {
            stopObserving = observeCanvasResize(canvasEl, function (): void {
                ChartRenderer.getInstance().refitChart(canvasId);
            });
        }
    });
    let firstEffectRun: boolean = true;
    createEffect(function (): void {
        let currentData: ChartData = props.data;
        let currentOptions: ChartOptions = props.options;
        let currentType: "line" | "bar" | "scatter" = props.type;
        if (firstEffectRun) {
            firstEffectRun = false;
            return;
        }
        if (ChartRenderer.getInstance().hasChart(canvasId)) {
            ChartRenderer.getInstance().updateChart(canvasId, currentData, currentOptions);
            return;
        }
        renderByType(currentType, currentData, currentOptions);
    });
    onCleanup(function (): void {
        if (stopObserving !== null) {
            stopObserving();
            stopObserving = null;
        }
        ChartRenderer.getInstance().destroyChart(canvasId);
    });
    return (
        <div class={styles.chartContainer}>
            <canvas id={canvasId} ref={function (el: HTMLCanvasElement): void { canvasEl = el; }} role="img" aria-label={props.options.title} />
        </div>
    );
}
export {ChartCanvas};
