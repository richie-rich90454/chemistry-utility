/**
 * Visual verification: The Solid-rendered Electrochemistry card should
 * match the legacy #electrochemistry card in frontend/index.html.
 * Intentional diffs:
 *  - This route surfaces a Clear button per calculator (legacy lacked one)
 *  - Each sub-section is wrapped in a <section> with a divider to mirror
 *    the legacy .sub-group visual rhythm
 * Routes math through calculatePure on CellPotentialCalculator,
 * NernstCalculator, and ElectrolysisCalculator. No Playwright screenshot
 * test is added per task spec; parity is verified by manual diff of the
 * rendered DOM.
 */
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {CellPotentialCalculator, NernstCalculator, ElectrolysisCalculator} from "../../modules/electrochemistryCalculators.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
import {resolveResult} from "../../modules/resultResolver.js";
import styles from "./electrochemistry.module.css";
let cellCalculator = new CellPotentialCalculator();
let nernstCalculator = new NernstCalculator();
let electrolysisCalculator = new ElectrolysisCalculator();
let cellFields: CalculatorField[] = [
    {"id": "E1", "label": "E°₁", "placeholder": "E°_1 (V)", "ariaLabel": "First reduction potential"},
    {"id": "E2", "label": "E°₂", "placeholder": "E°_2 (V)", "ariaLabel": "Second reduction potential"}
];
let nernstFields: CalculatorField[] = [
    {"id": "E-standard", "label": "E°", "placeholder": "E° (V)", "ariaLabel": "Standard cell potential"},
    {"id": "temperature", "label": "T", "placeholder": "T (K)", "ariaLabel": "Temperature"},
    {"id": "n-electrons", "label": "n", "placeholder": "n (moles of e⁻)", "ariaLabel": "Number of electrons"},
    {"id": "Q-reaction", "label": "Q", "placeholder": "Q (reaction quotient)", "ariaLabel": "Reaction quotient"}
];
let electrolysisFields: CalculatorField[] = [
    {"id": "electrolysis-m", "label": "m", "placeholder": "Mass (g)", "ariaLabel": "Mass"},
    {"id": "electrolysis-I", "label": "I", "placeholder": "Current (A)", "ariaLabel": "Current"},
    {"id": "electrolysis-t", "label": "t", "placeholder": "Time (s)", "ariaLabel": "Time"},
    {"id": "electrolysis-z", "label": "z", "placeholder": "z (electrons/ion)", "ariaLabel": "Electrons per ion"},
    {"id": "electrolysis-M", "label": "M", "placeholder": "Molar mass (g/mol)", "ariaLabel": "Molar mass"}
];
let electrolysisSelects: CalculatorSelect[] = [{
    "id": "electrolysis-solve-for",
    "label": "Solve for",
    "ariaLabel": "Select electrolysis parameter to solve for",
    "options": [
        {"value": "mass", "label": "Mass (m)"},
        {"value": "current", "label": "Current (I)"},
        {"value": "time", "label": "Time (t)"}
    ],
    "defaultValue": "mass"
}];
function Electrochemistry(): JSX.Element {
    let [cellResult, setCellResult] = createSignal("");
    let [cellError, setCellError] = createSignal("");
    let [nernstResult, setNernstResult] = createSignal("");
    let [nernstError, setNernstError] = createSignal("");
    let [electrolysisResult, setElectrolysisResult] = createSignal("");
    let [electrolysisError, setElectrolysisError] = createSignal("");
    function handleCellCalculate(inputs: Record<string, string>): void {
        resolveResult(cellCalculator.calculatePure(inputs), setCellResult, setCellError);
    }
    function handleCellClear(): void {
        setCellResult("");
        setCellError("");
    }
    function handleNernstCalculate(inputs: Record<string, string>): void {
        resolveResult(nernstCalculator.calculatePure(inputs), setNernstResult, setNernstError);
    }
    function handleNernstClear(): void {
        setNernstResult("");
        setNernstError("");
    }
    function handleElectrolysisCalculate(inputs: Record<string, string>): void {
        resolveResult(electrolysisCalculator.calculatePure(inputs), setElectrolysisResult, setElectrolysisError);
    }
    function handleElectrolysisClear(): void {
        setElectrolysisResult("");
        setElectrolysisError("");
    }
    return (
        <CalculatorCard
            title="Electrochemistry"
            description="Calculate standard cell potentials, non-standard conditions with the Nernst equation, and electrolysis mass/current/time relationships. This tool is valuable for redox chemistry, battery experiments, and electroplating calculations. Enter your values, and get instant results for your reactions."
        >
            <section class={styles.subGroup}>
                <h3>Cell Potential Calculator - Standard and Non-Standard</h3>
                <p>Enter the standard reduction potentials for the two half-reactions:</p>
                <CalculatorForm
                    fields={cellFields}
                    inputGroupLabel="Reduction potentials"
                    calculateLabel="Calculate E°_cell"
                    onCalculate={handleCellCalculate}
                    onClear={handleCellClear}
                    result={cellResult}
                    error={cellError}
                />
                <ExampleDetails>
                    <p>Try E°₁=0.34 V (Cu²⁺/Cu) and E°₂=-0.76 V (Zn²⁺/Zn). The cell potential is 1.10 V.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Nernst Equation Solver - Non-Standard Cell Potential</h3>
                <p>Calculate cell potential under non-standard conditions.</p>
                <CalculatorForm
                    fields={nernstFields}
                    inputGroupLabel="Nernst equation parameters"
                    calculateLabel="Calculate E"
                    onCalculate={handleNernstCalculate}
                    onClear={handleNernstClear}
                    result={nernstResult}
                    error={nernstError}
                />
                <ExampleDetails>
                    <p>Try E°=1.10 V, T=298 K, n=2, Q=0.01. The Nernst equation gives E≈1.159 V.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Electrolysis Calculator - Mass, Current, Time</h3>
                <CalculatorForm
                    fields={electrolysisFields}
                    selects={electrolysisSelects}
                    inputGroupLabel="Electrolysis parameters"
                    onCalculate={handleElectrolysisCalculate}
                    onClear={handleElectrolysisClear}
                    result={electrolysisResult}
                    error={electrolysisError}
                />
                <ExampleDetails>
                    <p>Try solving for mass: I=10 A, t=9650 s, z=1, M=63.55 g/mol (Cu). The result is approximately 6.34 g of copper deposited.</p>
                </ExampleDetails>
            </section>
        </CalculatorCard>
    );
}
export {Electrochemistry};
