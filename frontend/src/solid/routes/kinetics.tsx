/**
 * Visual verification: The Solid-rendered Kinetics card should match the
 * legacy #kinetics card in frontend/index.html. Intentional diffs:
 *  - This route surfaces a Clear button per calculator (legacy lacked one)
 *  - Each sub-section is wrapped in a <section> with a divider to mirror
 *    the legacy .sub-group visual rhythm
 *  - The Integrated Rate Law sub-calculator renders a <ChartCanvas> for
 *    the concentration-vs-time series returned by calculatePure; the
 *    canvas id remains "integrated-rate-law-chart" for parity
 * Routes math through calculatePure on ArrheniusCalculator,
 * RateLawCalculator, IntegratedRateLawCalculator,
 * ReactionOrderCalculator, and CollisionTheoryCalculator. No Playwright
 * screenshot test is added per task spec; parity is verified by manual
 * diff of the rendered DOM.
 */
import type {JSX} from "solid-js";
import {createSignal, Show} from "solid-js";
import {ArrheniusCalculator, RateLawCalculator, IntegratedRateLawCalculator, ReactionOrderCalculator, CollisionTheoryCalculator} from "../../modules/kineticsCalculators.js";
import type {ChartData, ChartOptions, ConcentrationTimePoint} from "../../modules/chartRenderer.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import {ChartCanvas} from "../components/third-party/ChartCanvas";
import {resolveResult} from "../../modules/resultResolver.js";
import styles from "./kinetics.module.css";
let arrheniusCalculator = new ArrheniusCalculator();
let rateLawCalculator = new RateLawCalculator();
let integratedRateLawCalculator = new IntegratedRateLawCalculator();
let reactionOrderCalculator = new ReactionOrderCalculator();
let collisionTheoryCalculator = new CollisionTheoryCalculator();
let arrheniusFields: CalculatorField[] = [
    {"id": "arrhenius-A", "label": "A", "placeholder": "A (s⁻¹)", "ariaLabel": "Frequency factor"},
    {"id": "arrhenius-Ea", "label": "Ea", "placeholder": "Ea (kJ/mol)", "ariaLabel": "Arrhenius activation energy"},
    {"id": "arrhenius-T", "label": "T", "placeholder": "T (K)", "ariaLabel": "Arrhenius temperature"},
    {"id": "arrhenius-k", "label": "k", "placeholder": "k (s⁻¹)", "ariaLabel": "Arrhenius rate constant"}
];
let arrheniusSelects: CalculatorSelect[] = [{
    "id": "arrhenius-solve-for",
    "label": "Solve for",
    "ariaLabel": "Select Arrhenius parameter to solve for",
    "options": [
        {"value": "k", "label": "Rate constant (k)"},
        {"value": "Ea", "label": "Activation energy (Ea)"},
        {"value": "T", "label": "Temperature (T)"},
        {"value": "A", "label": "Frequency factor (A)"}
    ],
    "defaultValue": "k"
}];
let rateLawFields: CalculatorField[] = [
    {"id": "ratelaw-A1", "label": "[A]₁", "placeholder": "[A]₁ (M)", "ariaLabel": "Experiment 1 concentration A"},
    {"id": "ratelaw-B1", "label": "[B]₁", "placeholder": "[B]₁ (M)", "ariaLabel": "Experiment 1 concentration B"},
    {"id": "ratelaw-rate1", "label": "Rate₁", "placeholder": "Rate₁ (M/s)", "ariaLabel": "Experiment 1 rate"},
    {"id": "ratelaw-A2", "label": "[A]₂", "placeholder": "[A]₂ (M)", "ariaLabel": "Experiment 2 concentration A"},
    {"id": "ratelaw-B2", "label": "[B]₂", "placeholder": "[B]₂ (M)", "ariaLabel": "Experiment 2 concentration B"},
    {"id": "ratelaw-rate2", "label": "Rate₂", "placeholder": "Rate₂ (M/s)", "ariaLabel": "Experiment 2 rate"}
];
let integratedRateLawFields: CalculatorField[] = [
    {"id": "irl-A0", "label": "[A]₀", "placeholder": "[A]₀ (M)", "ariaLabel": "Initial concentration"},
    {"id": "irl-k", "label": "k", "placeholder": "k", "ariaLabel": "IRL rate constant"},
    {"id": "irl-t", "label": "t", "placeholder": "Time (s)", "ariaLabel": "IRL time"},
    {"id": "irl-A", "label": "[A]", "placeholder": "[A] (M)", "ariaLabel": "Final concentration"}
];
let integratedRateLawSelects: CalculatorSelect[] = [
    {
        "id": "irl-solve-for",
        "label": "Solve for",
        "ariaLabel": "Select integrated rate law parameter to solve for",
        "options": [
            {"value": "concentration", "label": "Concentration [A]"},
            {"value": "time", "label": "Time (t)"}
        ],
        "defaultValue": "concentration"
    },
    {
        "id": "irl-order",
        "label": "Reaction order",
        "ariaLabel": "Select reaction order",
        "options": [
            {"value": "0", "label": "Zero order"},
            {"value": "1", "label": "First order"},
            {"value": "2", "label": "Second order"}
        ],
        "defaultValue": "1"
    }
];
let reactionOrderFields: CalculatorField[] = [
    {"id": "reaction-order-data", "label": "Data", "placeholder": "E.g., 0,1.0; 100,0.5; 200,0.25; 300,0.125", "ariaLabel": "Time-concentration data", "type": "text"}
];
let collisionFields: CalculatorField[] = [
    {"id": "collision-Ea", "label": "Ea", "placeholder": "Ea (kJ/mol)", "ariaLabel": "Collision activation energy"},
    {"id": "collision-T", "label": "T", "placeholder": "T (K)", "ariaLabel": "Collision temperature"},
    {"id": "collision-Z", "label": "Z", "placeholder": "Z (s⁻¹)", "ariaLabel": "Collision frequency"},
    {"id": "collision-p", "label": "p", "placeholder": "p (steric factor)", "ariaLabel": "Steric factor"},
    {"id": "collision-k", "label": "k", "placeholder": "k (s⁻¹)", "ariaLabel": "Collision rate constant"}
];
let collisionSelects: CalculatorSelect[] = [{
    "id": "collision-solve-for",
    "label": "Solve for",
    "ariaLabel": "Select collision theory parameter to solve for",
    "options": [
        {"value": "k", "label": "Rate constant (k)"},
        {"value": "Z", "label": "Collision frequency (Z)"},
        {"value": "p", "label": "Steric factor (p)"}
    ],
    "defaultValue": "k"
}];
let irlChartOptions: ChartOptions = {
    "title": "Concentration vs Time",
    "xLabel": "Time (s)",
    "yLabel": "Concentration (M)",
    "showLegend": false
};
function buildConcentrationChartData(points: ConcentrationTimePoint[]): ChartData {
    let labels: string[] = [];
    let values: number[] = [];
    let i: number;
    for (i = 0; i < points.length; i = i + 1) {
        labels.push(String(points[i].time));
        values.push(points[i].concentration);
    }
    return {
        "labels": labels,
        "datasets": [{
            "label": "[A] (M)",
            "data": values,
            "color": "#0f3a3a",
            "borderColor": "#0f3a3a",
            "backgroundColor": "rgba(15,58,58,0.1)"
        }]
    };
}
function Kinetics(): JSX.Element {
    let [arrheniusResult, setArrheniusResult] = createSignal("");
    let [arrheniusError, setArrheniusError] = createSignal("");
    let [rateLawResult, setRateLawResult] = createSignal("");
    let [rateLawError, setRateLawError] = createSignal("");
    let [integratedRateLawResult, setIntegratedRateLawResult] = createSignal("");
    let [integratedRateLawError, setIntegratedRateLawError] = createSignal("");
    let [integratedRateLawChartData, setIntegratedRateLawChartData] = createSignal<ChartData | null>(null);
    let [reactionOrderResult, setReactionOrderResult] = createSignal("");
    let [reactionOrderError, setReactionOrderError] = createSignal("");
    let [collisionResult, setCollisionResult] = createSignal("");
    let [collisionError, setCollisionError] = createSignal("");
    function handleArrheniusCalculate(inputs: Record<string, string>): void {
        resolveResult(arrheniusCalculator.calculatePure(inputs), setArrheniusResult, setArrheniusError);
    }
    function handleArrheniusClear(): void {
        setArrheniusResult("");
        setArrheniusError("");
    }
    function handleRateLawCalculate(inputs: Record<string, string>): void {
        resolveResult(rateLawCalculator.calculatePure(inputs), setRateLawResult, setRateLawError);
    }
    function handleRateLawClear(): void {
        setRateLawResult("");
        setRateLawError("");
    }
    function handleIntegratedRateLawCalculate(inputs: Record<string, string>): void {
        let res = integratedRateLawCalculator.calculatePure(inputs);
        resolveResult(res, setIntegratedRateLawResult, setIntegratedRateLawError);
        if (Array.isArray(res.chartData)) {
            setIntegratedRateLawChartData(buildConcentrationChartData(res.chartData as ConcentrationTimePoint[]));
        }
        else {
            setIntegratedRateLawChartData(null);
        }
    }
    function handleIntegratedRateLawClear(): void {
        setIntegratedRateLawResult("");
        setIntegratedRateLawError("");
        setIntegratedRateLawChartData(null);
    }
    function handleReactionOrderCalculate(inputs: Record<string, string>): void {
        resolveResult(reactionOrderCalculator.calculatePure(inputs), setReactionOrderResult, setReactionOrderError);
    }
    function handleReactionOrderClear(): void {
        setReactionOrderResult("");
        setReactionOrderError("");
    }
    function handleCollisionCalculate(inputs: Record<string, string>): void {
        resolveResult(collisionTheoryCalculator.calculatePure(inputs), setCollisionResult, setCollisionError);
    }
    function handleCollisionClear(): void {
        setCollisionResult("");
        setCollisionError("");
    }
    return (
        <CalculatorCard
            title="Kinetics"
            description="Calculate reaction rates, rate laws, and activation energies using the Arrhenius equation, integrated rate laws, and collision theory. Determine reaction orders from initial rates or concentration-time data. These tools are essential for understanding chemical kinetics and reaction mechanisms."
            seeAlso={
                <SeeAlsoLink href="/thermodynamics">Exploring reaction energetics? See the Thermodynamics calculators for Gibbs free energy, Hess's Law, and more.</SeeAlsoLink>
            }
        >
            <section class={styles.subGroup}>
                <h3>Arrhenius Equation Calculator - k = A·e^(-Ea/RT)</h3>
                <p>Solve for the rate constant (k), activation energy (Ea), temperature (T), or frequency factor (A).</p>
                <CalculatorForm
                    fields={arrheniusFields}
                    selects={arrheniusSelects}
                    inputGroupLabel="Arrhenius parameters"
                    calculateLabel="Calculate Arrhenius"
                    onCalculate={handleArrheniusCalculate}
                    onClear={handleArrheniusClear}
                    result={arrheniusResult}
                    error={arrheniusError}
                />
                <ExampleDetails>
                    <p>Try A=1e13, Ea=75, T=298 to get k. Or solve for Ea with A=1e13, k=0.03, T=298.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Rate Law Calculator - rate = k[A]^m[B]^n</h3>
                <p>Determine the rate law from two experiments with initial rates data.</p>
                <CalculatorForm
                    fields={rateLawFields}
                    inputGroupLabel="Experiment 1 and 2 concentrations and rates"
                    calculateLabel="Determine Rate Law"
                    onCalculate={handleRateLawCalculate}
                    onClear={handleRateLawClear}
                    result={rateLawResult}
                    error={rateLawError}
                />
                <ExampleDetails>
                    <p>Experiment 1: [A]=0.1, [B]=0.2, rate=0.004. Experiment 2: [A]=0.2, [B]=0.2, rate=0.008. This gives order m=1 in A, n=0 in B.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Integrated Rate Law Calculator</h3>
                <p>Solve for concentration or time using zero, first, or second order integrated rate laws.</p>
                <CalculatorForm
                    fields={integratedRateLawFields}
                    selects={integratedRateLawSelects}
                    inputGroupLabel="Integrated rate law parameters"
                    calculateLabel="Calculate IRL"
                    onCalculate={handleIntegratedRateLawCalculate}
                    onClear={handleIntegratedRateLawClear}
                    result={integratedRateLawResult}
                    error={integratedRateLawError}
                >
                    <Show when={integratedRateLawChartData() !== null}>
                        <ChartCanvas type="line" data={integratedRateLawChartData() as ChartData} options={irlChartOptions} canvasId="integrated-rate-law-chart" />
                    </Show>
                </CalculatorForm>
                <ExampleDetails>
                    <p>First order: [A]₀=1 M, k=0.05 s⁻¹, t=10 s → [A]≈0.607 M. Or solve for time with [A]=0.5 M → t≈13.86 s.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Reaction Order Determination</h3>
                <p>Enter time-concentration data to determine the reaction order. Use semicolons or new lines to separate data points.</p>
                <CalculatorForm
                    fields={reactionOrderFields}
                    inputGroupLabel="Time-concentration data"
                    calculateLabel="Determine Order"
                    onCalculate={handleReactionOrderCalculate}
                    onClear={handleReactionOrderClear}
                    result={reactionOrderResult}
                    error={reactionOrderError}
                />
                <ExampleDetails>
                    <p>Enter: 0,1.0; 100,0.5; 200,0.25; 300,0.125 — this first-order decay gives R²≈1.0 for ln[A] vs t.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Collision Theory Calculator - k = Z·p·e^(-Ea/RT)</h3>
                <p>Solve for the rate constant (k), collision frequency (Z), or steric factor (p).</p>
                <CalculatorForm
                    fields={collisionFields}
                    selects={collisionSelects}
                    inputGroupLabel="Collision theory parameters"
                    calculateLabel="Calculate Collision Theory"
                    onCalculate={handleCollisionCalculate}
                    onClear={handleCollisionClear}
                    result={collisionResult}
                    error={collisionError}
                />
                <ExampleDetails>
                    <p>Try Ea=50 kJ/mol, T=298 K, Z=1e11 s⁻¹, p=0.01 to get k. Or solve for p with k known.</p>
                </ExampleDetails>
            </section>
        </CalculatorCard>
    );
}
export {Kinetics};
