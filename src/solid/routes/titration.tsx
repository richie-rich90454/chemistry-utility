/**
 * Titration route.
 *
 * Runs the titration curve math through the calculation engine. The
 * returned pH series is rendered to a canvas through the chart binding.
 */
import type {JSX} from "solid-js";
import {getEngine} from "../../modules/engine.js";
import type {CalculatorResult} from "../../modules/calculators/pureCalculator.js";
import {createSignal, onMount, Show} from "solid-js";
import {renderTitrationCurve} from "../../modules/dom/chartBindings.js";
import {resolveResult} from "../../modules/resultResolver.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
import styles from "./titration.module.css";
let fields: CalculatorField[] = [
    {"id": "titration-acid-conc", "label": "Acid concentration (M)", "placeholder": "M", "ariaLabel": "Acid concentration"},
    {"id": "titration-acid-vol", "label": "Acid volume (mL)", "placeholder": "Acid volume (mL)", "ariaLabel": "Acid volume"},
    {"id": "titration-base-conc", "label": "Base concentration (M)", "placeholder": "M", "ariaLabel": "Base concentration"},
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
function TitrationChart(props: {points: unknown[]}): JSX.Element {
    onMount(function (): void {
        renderTitrationCurve("titration-chart", props.points);
    });
    return (
        <canvas id="titration-chart" class={styles.chartCanvas} role="img" aria-label="Titration curve: pH versus volume of base" />
    );
}
function Titration(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    let [chartPoints, setChartPoints] = createSignal<unknown[] | null>(null);
    function handleCalculate(inputs: Record<string, string>): void {
        let res = engine.calculate("titration-curve", inputs);
        resolveResult(res, setResult, setError);
        void res.then(function (settled: CalculatorResult): void {
            setChartPoints(Array.isArray(settled.chartData) ? settled.chartData : null);
        });
    }
    function handleClear(): void {
        setResult("");
        setError("");
        setChartPoints(null);
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
                <Show when={chartPoints() !== null}>
                    <TitrationChart points={chartPoints() as unknown[]} />
                </Show>
            </CalculatorForm>
        </CalculatorCard>
    );
}
export {Titration};
