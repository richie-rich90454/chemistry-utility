/**
 * Visual verification: The Solid-rendered Titration card should match the
 * legacy #titration-calc card in frontend/index.html. Intentional diff:
 * this route surfaces a Clear button (legacy lacked one) and routes the
 * titration math through TitrationCurveCalculator.calculatePure. The
 * TitrationPoint[] returned from calculatePure is converted to ChartData
 * inline and rendered through the Solid <ChartCanvas> wrapper instead of
 * the legacy ChartRenderer.renderTitrationCurve path; the canvas id
 * remains "titration-chart" for parity. No Playwright screenshot test is
 * added per task spec; parity is verified by manual diff.
 */
import type {JSX} from "solid-js";
import {createSignal, Show} from "solid-js";
import {TitrationCurveCalculator} from "../../modules/solutionCalculators.js";
import {resolveResult} from "../../modules/resultResolver.js";
import type {ChartData, ChartOptions, TitrationPoint} from "../../modules/chartRenderer.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
import {ChartCanvas} from "../components/third-party/ChartCanvas";
let calculator = new TitrationCurveCalculator();
let fields: CalculatorField[] = [
    {"id": "titration-acid-conc", "label": "Acid concentration (M)", "placeholder": "Acid concentration (M)", "ariaLabel": "Acid concentration"},
    {"id": "titration-acid-vol", "label": "Acid volume (mL)", "placeholder": "Acid volume (mL)", "ariaLabel": "Acid volume"},
    {"id": "titration-base-conc", "label": "Base concentration (M)", "placeholder": "Base concentration (M)", "ariaLabel": "Base concentration"},
    {"id": "titration-max-vol", "label": "Max volume (mL)", "placeholder": "Max volume (mL)", "ariaLabel": "Maximum volume"},
    {"id": "titration-Ka", "label": "Ka (for weak acid)", "placeholder": "Ka (for weak acid)", "ariaLabel": "Ka value"}
];
let selects: CalculatorSelect[] = [{
    "id": "titration-acid-type",
    "label": "Acid type",
    "ariaLabel": "Select acid type",
    "options": [
        {"value": "strong", "label": "Strong acid"},
        {"value": "weak", "label": "Weak acid (requires Ka)"}
    ],
    "defaultValue": "strong"
}];
let chartOptions: ChartOptions = {
    "title": "Titration Curve: pH vs Volume of Base",
    "xLabel": "Volume of NaOH (mL)",
    "yLabel": "pH",
    "showLegend": true
};
function buildChartData(points: TitrationPoint[]): ChartData {
    let labels: string[] = [];
    let phValues: number[] = [];
    for (let i = 0; i < points.length; i = i + 1) {
        labels.push(String(points[i].volume));
        phValues.push(points[i].pH);
    }
    return {
        "labels": labels,
        "datasets": [{
            "label": "pH",
            "data": phValues,
            "color": "#2d5a3d",
            "borderColor": "#2d5a3d",
            "backgroundColor": "rgba(45,90,61,0.1)"
        }]
    };
}
function Titration(): JSX.Element {
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    let [chartData, setChartData] = createSignal<ChartData | null>(null);
    function handleCalculate(inputs: Record<string, string>): void {
        let res = calculator.calculatePure(inputs);
        resolveResult(res, setResult, setError);
        if (Array.isArray(res.chartData)) {
            setChartData(buildChartData(res.chartData as TitrationPoint[]));
        } else {
            setChartData(null);
        }
    }
    function handleClear(): void {
        setResult("");
        setError("");
        setChartData(null);
    }
    return (
        <CalculatorCard
            title="Titration Curve Calculator - pH vs Volume Data Points"
            description="Generate pH vs volume data points for the titration of an acid with a strong base (NaOH). Supports strong and weak acids. Outputs data for chart rendering including equivalence and half-equivalence points."
            exampleDetails={
                <ExampleDetails>
                    <p>Try strong acid: conc=0.1 M, vol=25 mL, base conc=0.1 M, max vol=50 mL. Equivalence at 25 mL.</p>
                </ExampleDetails>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="Titration parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            >
                <Show when={chartData() !== null}>
                    <ChartCanvas type="line" data={chartData() as ChartData} options={chartOptions} canvasId="titration-chart" />
                </Show>
            </CalculatorForm>
        </CalculatorCard>
    );
}
export {Titration};
