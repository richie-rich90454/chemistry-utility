import { Chart, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { ThemeManager, Theme } from "./themeManager.js";

let _i: number;
for (_i = 0; _i < registerables.length; _i++) {
    Chart.register(registerables[_i]);
}
Chart.register(zoomPlugin);

export interface ChartDataset {
    label: string;
    data: number[];
    color: string;
    borderColor: string;
    backgroundColor: string;
}

export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

export interface ChartOptions {
    title: string;
    xLabel: string;
    yLabel: string;
    showLegend: boolean;
}

export interface TitrationPoint {
    volume: number;
    pH: number;
}

export interface ConcentrationTimePoint {
    time: number;
    concentration: number;
}

export interface EnergyProfilePoint {
    coordinate: number;
    energy: number;
}

export interface ActivityPoint {
    day: string;
    count: number;
}

interface ChartThemeScale {
    title?: { color?: string };
    ticks?: { color?: string };
    grid?: { color?: string };
}
interface ChartThemeOptions {
    plugins?: {
        title?: { color?: string };
        legend?: { labels?: { color?: string } };
        tooltip?: { backgroundColor?: string; titleColor?: string; bodyColor?: string };
    };
    scales?: {
        x?: ChartThemeScale;
        y?: ChartThemeScale;
    };
}

type ChartType = "line" | "bar" | "scatter";
type ThemeChangeCallback = (theme: Theme) => void;

interface StoredChart {
    chart: Chart;
    data: ChartData;
    options: ChartOptions;
    type: ChartType;
}
function getThemeColorsForTheme(isDark: boolean): ThemeColors {
    if (isDark) {
        return {
            "textColor": "#e0e0e0",
            "tickColor": "#b0b0b0",
            "gridColor": "rgba(255,255,255,0.12)",
            "tooltipBg": "rgba(40,40,40,0.95)",
            "tooltipText": "#f0f0f0"
        };
    }
    return {
        "textColor": "#333333",
        "tickColor": "#555555",
        "gridColor": "rgba(0,0,0,0.1)",
        "tooltipBg": "rgba(60,60,60,0.95)",
        "tooltipText": "#ffffff"
    };
}
function toScatterPoints(values: number[], labels: string[]): DataPoint[] {
    let points: DataPoint[] = [];
    let i: number;
    for (i = 0; i < values.length; i++) {
        let x: number = parseFloat(labels[i]);
        if (isNaN(x)) {
            x = i;
        }
        points.push({ "x": x, "y": values[i] });
    }
    return points;
}
function formatTooltipLabel(context: TooltipContext): string {
    let label: string = context.dataset.label || "";
    let parsed: string;
    let value: number | DataPoint;
    if (typeof context.parsed.y === "number") {
        value = context.parsed.y;
    } else if (context.parsed.y !== null && typeof context.parsed.y === "object") {
        value = context.parsed.y;
    } else {
        value = context.parsed.x;
    }
    parsed = typeof value === "number" ? String(value) : "";
    if (label.length > 0) {
        return label + ": " + parsed;
    }
    return parsed;
}
function buildChartConfiguration(type: ChartType, data: ChartData, options: ChartOptions, isDark: boolean): ChartConfiguration {
    let datasetsConfig: ChartDatasetConfig[] = [];
    let i: number;
    for (i = 0; i < data.datasets.length; i++) {
        let ds: ChartDataset = data.datasets[i];
        let seriesData: DataPoint[] | number[];
        if (type === "scatter") {
            seriesData = toScatterPoints(ds.data, data.labels);
        } else {
            seriesData = ds.data;
        }
        datasetsConfig.push({
            "label": ds.label,
            "data": seriesData,
            "borderColor": ds.borderColor,
            "backgroundColor": ds.backgroundColor,
            "borderWidth": 2,
            "pointRadius": type === "line" ? 0 : 3,
            "pointHoverRadius": 5,
            "fill": type === "line" ? false : true,
            "tension": type === "line" ? 0.1 : 0,
            "showLine": type === "scatter" ? false : true
        });
    }
    let themeColors: ThemeColors = getThemeColorsForTheme(isDark);
    return {
        "type": type,
        "data": {
            "labels": data.labels,
            "datasets": datasetsConfig
        },
        "options": {
            "responsive": true,
            "maintainAspectRatio": false,
            "interaction": {
                "mode": "nearest",
                "intersect": false
            },
            "plugins": {
                "title": {
                    "display": options.title.length > 0,
                    "text": options.title,
                    "color": themeColors.textColor
                },
                "legend": {
                    "display": options.showLegend,
                    "labels": {
                        "color": themeColors.textColor
                    }
                },
                "tooltip": {
                    "enabled": true,
                    "backgroundColor": themeColors.tooltipBg,
                    "titleColor": themeColors.tooltipText,
                    "bodyColor": themeColors.tooltipText,
                    "callbacks": {
                        "label": function (context: TooltipContext): string {
                            return formatTooltipLabel(context);
                        }
                    }
                },
                "zoom": {
                    "pan": {
                        "enabled": true,
                        "mode": "xy"
                    },
                    "zoom": {
                        "wheel": {
                            "enabled": true
                        },
                        "pinch": {
                            "enabled": true
                        },
                        "mode": "xy"
                    }
                }
            },
            "scales": {
                "x": {
                    "title": {
                        "display": options.xLabel.length > 0,
                        "text": options.xLabel,
                        "color": themeColors.textColor
                    },
                    "ticks": {
                        "color": themeColors.tickColor
                    },
                    "grid": {
                        "color": themeColors.gridColor
                    }
                },
                "y": {
                    "title": {
                        "display": options.yLabel.length > 0,
                        "text": options.yLabel,
                        "color": themeColors.textColor
                    },
                    "ticks": {
                        "color": themeColors.tickColor
                    },
                    "grid": {
                        "color": themeColors.gridColor
                    }
                }
            }
        }
    };
}
/**
 * Singleton renderer wrapping Chart.js for chemistry-related visualizations.
 * Supports line, bar, and scatter charts with theme-aware styling, zoom/pan,
 * custom tooltips, and PNG export. Subscribes to ThemeManager so charts
 * re-style automatically when the app switches between light and dark modes.
 */
class ChartRenderer {
    private static instance: ChartRenderer | null;
    private charts: Map<string, StoredChart>;
    private isDark: boolean;
    private themeListener: ThemeChangeCallback;
    private subscribed: boolean;

    private constructor() {
        this.charts = new Map();
        this.isDark = false;
        this.subscribed = false;
        this.themeListener = this.handleThemeChange.bind(this);
        this.subscribeToTheme();
    }

    public static getInstance(): ChartRenderer {
        if (!ChartRenderer.instance) {
            ChartRenderer.instance = new ChartRenderer();
        }
        return ChartRenderer.instance;
    }

    public static resetInstance(): void {
        if (ChartRenderer.instance) {
            ChartRenderer.instance.unsubscribeFromTheme();
            ChartRenderer.instance.destroyAll();
        }
        ChartRenderer.instance = null;
    }

    public static defaultOptions(): ChartOptions {
        return {
            "title": "",
            "xLabel": "",
            "yLabel": "",
            "showLegend": false
        };
    }

    private handleThemeChange(theme: Theme): void {
        this.updateTheme(theme === "dark" || theme === "amoled");
    }

    private subscribeToTheme(): void {
        if (this.subscribed) {
            return;
        }
        this.subscribed = true;
        ThemeManager.getInstance().subscribe(this.themeListener);
    }

    private unsubscribeFromTheme(): void {
        if (!this.subscribed) {
            return;
        }
        this.subscribed = false;
        ThemeManager.getInstance().unsubscribe(this.themeListener);
    }

    /**
     * Validates the chart data structure. Throws when labels or datasets
     * are missing, or when a dataset's data array does not match the
     * number of labels.
     */
    public validateChartData(data: ChartData): void {
        if (!data) {
            throw new Error("Chart data is required");
        }
        if (!data.labels) {
            throw new Error("Chart data labels are required");
        }
        if (!data.datasets) {
            throw new Error("Chart data datasets are required");
        }
        if (data.datasets.length === 0) {
            throw new Error("At least one dataset is required");
        }
        let i: number;
        for (i = 0; i < data.datasets.length; i++) {
            let dataset: ChartDataset = data.datasets[i];
            if (!dataset.data) {
                throw new Error("Dataset data array is required at index " + String(i));
            }
            if (dataset.data.length !== data.labels.length) {
                throw new Error(
                    "Dataset data length (" + String(dataset.data.length) +
                    ") must match labels length (" + String(data.labels.length) +
                    ") at index " + String(i)
                );
            }
        }
    }

    /**
     * Renders a line chart on the canvas identified by canvasId.
     */
    public renderLineChart(canvasId: string, data: ChartData, options: ChartOptions): void {
        this.validateChartData(data);
        this.renderChart(canvasId, data, options, "line");
    }

    /**
     * Renders a bar chart on the canvas identified by canvasId.
     */
    public renderBarChart(canvasId: string, data: ChartData, options: ChartOptions): void {
        this.validateChartData(data);
        this.renderChart(canvasId, data, options, "bar");
    }

    /**
     * Renders a scatter chart on the canvas identified by canvasId. Labels
     * are parsed as numeric x-values and the dataset data array provides the
     * y-values.
     */
    public renderScatterChart(canvasId: string, data: ChartData, options: ChartOptions): void {
        this.validateChartData(data);
        this.renderChart(canvasId, data, options, "scatter");
    }

    private renderChart(canvasId: string, data: ChartData, options: ChartOptions, type: ChartType): void {
        let canvas: HTMLCanvasElement | null = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (!canvas) {
            throw new Error("Canvas element not found: " + canvasId);
        }
        this.destroyChart(canvasId);
        let config: ChartConfiguration = this.buildConfiguration(type, data, options);
        let chart: Chart = new Chart(canvas, config);
        this.charts.set(canvasId, {
            "chart": chart,
            "data": data,
            "options": options,
            "type": type
        });
    }

    private buildConfiguration(type: ChartType, data: ChartData, options: ChartOptions): ChartConfiguration {
        return buildChartConfiguration(type, data, options, this.isDark);
    }
    private getThemeColors(): ThemeColors {
        return getThemeColorsForTheme(this.isDark);
    }

    /**
     * Updates the theme of all active charts. Re-applies grid, text, and
     * tooltip colors based on the isDark flag and re-renders each chart.
     */
    public updateTheme(isDark: boolean): void {
        this.isDark = isDark;
        let themeColors: ThemeColors = this.getThemeColors();
        let keys: string[] = Array.from(this.charts.keys());
        let i: number;
        for (i = 0; i < keys.length; i++) {
            let key: string = keys[i];
            let stored: StoredChart | undefined = this.charts.get(key);
            if (!stored) {
                continue;
            }
            this.applyThemeToChart(stored.chart, themeColors);
            stored.chart.update();
        }
    }

    private applyThemeToChart(chart: Chart, colors: ThemeColors): void {
        let opts = chart.options as unknown as ChartThemeOptions;
        if (opts.plugins && opts.plugins.title) {
            opts.plugins.title.color = colors.textColor;
        }
        if (opts.plugins && opts.plugins.legend && opts.plugins.legend.labels) {
            opts.plugins.legend.labels.color = colors.textColor;
        }
        if (opts.plugins && opts.plugins.tooltip) {
            opts.plugins.tooltip.backgroundColor = colors.tooltipBg;
            opts.plugins.tooltip.titleColor = colors.tooltipText;
            opts.plugins.tooltip.bodyColor = colors.tooltipText;
        }
        if (opts.scales) {
            this.applyThemeToScale(opts.scales.x, colors);
            this.applyThemeToScale(opts.scales.y, colors);
        }
    }

    private applyThemeToScale(scale: ChartThemeScale | undefined, colors: ThemeColors): void {
        if (!scale) {
            return;
        }
        if (scale.title) {
            scale.title.color = colors.textColor;
        }
        if (scale.ticks) {
            scale.ticks.color = colors.tickColor;
        }
        if (scale.grid) {
            scale.grid.color = colors.gridColor;
        }
    }

    /**
     * Returns true when a chart is currently registered for the given canvas id.
     */
    public hasChart(canvasId: string): boolean {
        return this.charts.has(canvasId);
    }

    /**
     * Destroys the chart instance associated with canvasId and removes it
     * from the registry. Safe to call when no chart exists for the id.
     */
    public destroyChart(canvasId: string): void {
        let stored: StoredChart | undefined = this.charts.get(canvasId);
        if (!stored) {
            return;
        }
        stored.chart.destroy();
        this.charts.delete(canvasId);
    }

    /**
     * Destroys every active chart. Used during cleanup and reset.
     */
    public destroyAll(): void {
        let keys: string[] = Array.from(this.charts.keys());
        let i: number;
        for (i = 0; i < keys.length; i++) {
            this.destroyChart(keys[i]);
        }
    }

    /**
     * Exports the canvas content as a PNG download. Triggers a browser
     * download using the provided filename.
     */
    public exportChartAsPng(canvasId: string, filename: string): void {
        let canvas: HTMLCanvasElement | null = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (!canvas) {
            throw new Error("Canvas element not found: " + canvasId);
        }
        let dataUrl: string = canvas.toDataURL("image/png");
        let link: HTMLAnchorElement = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Renders a titration curve (pH vs volume) as a line chart. Detects the
     * steepest pH change and marks the equivalence point with a highlighted
     * scatter point.
     */
    public renderTitrationCurve(canvasId: string, dataPoints: TitrationPoint[]): void {
        if (!dataPoints || dataPoints.length === 0) {
            throw new Error("Titration data points are required");
        }
        let labels: string[] = [];
        let phValues: number[] = [];
        let i: number;
        for (i = 0; i < dataPoints.length; i++) {
            labels.push(this.formatNumber(dataPoints[i].volume));
            phValues.push(dataPoints[i].pH);
        }
        let equivPoint: TitrationPoint | null = this.findEquivalencePoint(dataPoints);
        let datasets: ChartDataset[] = [{
            "label": "pH",
            "data": phValues,
            "color": "#2d5a3d",
            "borderColor": "#2d5a3d",
            "backgroundColor": "rgba(45,90,61,0.1)"
        }];
        if (equivPoint) {
            let equivIndex: number = this.findNearestIndex(dataPoints, equivPoint.volume);
            let markerData: number[] = new Array(dataPoints.length).fill(NaN);
            markerData[equivIndex] = equivPoint.pH;
            datasets.push({
                "label": "Equivalence Point",
                "data": markerData,
                "color": "#d93025",
                "borderColor": "#d93025",
                "backgroundColor": "#d93025"
            });
        }
        let data: ChartData = {
            "labels": labels,
            "datasets": datasets
        };
        let options: ChartOptions = {
            "title": "Titration Curve",
            "xLabel": "Volume of Base (mL)",
            "yLabel": "pH",
            "showLegend": equivPoint !== null
        };
        this.renderLineChart(canvasId, data, options);
    }

    private findEquivalencePoint(dataPoints: TitrationPoint[]): TitrationPoint | null {
        if (dataPoints.length < 2) {
            return null;
        }
        let maxSlope: number = 0;
        let equivIndex: number = 0;
        let i: number;
        for (i = 1; i < dataPoints.length; i++) {
            let dV: number = dataPoints[i].volume - dataPoints[i - 1].volume;
            let dpH: number = dataPoints[i].pH - dataPoints[i - 1].pH;
            if (dV === 0) {
                continue;
            }
            let slope: number = Math.abs(dpH / dV);
            if (slope > maxSlope) {
                maxSlope = slope;
                equivIndex = i;
            }
        }
        return {
            "volume": dataPoints[equivIndex].volume,
            "pH": dataPoints[equivIndex].pH
        };
    }

    private findNearestIndex(dataPoints: TitrationPoint[], targetVolume: number): number {
        let nearestIndex: number = 0;
        let nearestDiff: number = Math.abs(dataPoints[0].volume - targetVolume);
        let i: number;
        for (i = 1; i < dataPoints.length; i++) {
            let diff: number = Math.abs(dataPoints[i].volume - targetVolume);
            if (diff < nearestDiff) {
                nearestDiff = diff;
                nearestIndex = i;
            }
        }
        return nearestIndex;
    }

    /**
     * Renders a concentration vs time line chart for kinetics data.
     */
    public renderConcentrationTimeChart(canvasId: string, dataPoints: ConcentrationTimePoint[]): void {
        if (!dataPoints || dataPoints.length === 0) {
            throw new Error("Concentration-time data points are required");
        }
        let labels: string[] = [];
        let values: number[] = [];
        let i: number;
        for (i = 0; i < dataPoints.length; i++) {
            labels.push(this.formatNumber(dataPoints[i].time));
            values.push(dataPoints[i].concentration);
        }
        let data: ChartData = {
            "labels": labels,
            "datasets": [{
                "label": "[A] (M)",
                "data": values,
                "color": "#0f3a3a",
                "borderColor": "#0f3a3a",
                "backgroundColor": "rgba(15,58,58,0.1)"
            }]
        };
        let options: ChartOptions = {
            "title": "Concentration vs Time",
            "xLabel": "Time (s)",
            "yLabel": "Concentration (M)",
            "showLegend": false
        };
        this.renderLineChart(canvasId, data, options);
    }

    /**
     * Renders an energy profile (energy vs reaction coordinate) as a line
     * chart. Useful for visualising activation energy and reaction enthalpy.
     */
    public renderEnergyProfile(canvasId: string, dataPoints: EnergyProfilePoint[]): void {
        if (!dataPoints || dataPoints.length === 0) {
            throw new Error("Energy profile data points are required");
        }
        let labels: string[] = [];
        let values: number[] = [];
        let i: number;
        for (i = 0; i < dataPoints.length; i++) {
            labels.push(this.formatNumber(dataPoints[i].coordinate));
            values.push(dataPoints[i].energy);
        }
        let data: ChartData = {
            "labels": labels,
            "datasets": [{
                "label": "Energy",
                "data": values,
                "color": "#c8553d",
                "borderColor": "#c8553d",
                "backgroundColor": "rgba(200,85,61,0.1)"
            }]
        };
        let options: ChartOptions = {
            "title": "Energy Profile",
            "xLabel": "Reaction Coordinate",
            "yLabel": "Energy (kJ/mol)",
            "showLegend": false
        };
        this.renderLineChart(canvasId, data, options);
    }

    /**
     * Renders a weekly activity bar chart. Each data point represents a day
     * and the number of calculations performed that day.
     */
    public renderActivityChart(canvasId: string, dataPoints: ActivityPoint[]): void {
        if (!dataPoints || dataPoints.length === 0) {
            throw new Error("Activity data points are required");
        }
        let labels: string[] = [];
        let values: number[] = [];
        let i: number;
        for (i = 0; i < dataPoints.length; i++) {
            labels.push(dataPoints[i].day);
            values.push(dataPoints[i].count);
        }
        let data: ChartData = {
            "labels": labels,
            "datasets": [{
                "label": "Calculations",
                "data": values,
                "color": "#0d652d",
                "borderColor": "#0d652d",
                "backgroundColor": "rgba(13,101,45,0.6)"
            }]
        };
        let options: ChartOptions = {
            "title": "Weekly Activity",
            "xLabel": "Day",
            "yLabel": "Calculations",
            "showLegend": false
        };
        this.renderBarChart(canvasId, data, options);
    }

    private formatNumber(value: number): string {
        if (Number.isInteger(value)) {
            return String(value);
        }
        return value.toFixed(2);
    }
}

interface ChartDatasetConfig {
    label: string;
    data: DataPoint[] | number[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    pointRadius: number;
    pointHoverRadius: number;
    fill: boolean;
    tension: number;
    showLine: boolean;
}

interface DataPoint {
    x: number;
    y: number;
}

interface ThemeColors {
    textColor: string;
    tickColor: string;
    gridColor: string;
    tooltipBg: string;
    tooltipText: string;
}

interface TooltipContext {
    dataset: { label?: string };
    parsed: { x: number; y: number | DataPoint | null };
}

export interface ChartConfiguration {
    type: ChartType;
    data: {
        labels: string[];
        datasets: ChartDatasetConfig[];
    };
    options: Record<string, unknown>;
}

export { ChartRenderer, buildChartConfiguration };
