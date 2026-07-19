/**
 * Visual verification: The Solid-rendered Gas Laws card should match the
 * legacy #gas-laws card in frontend/index.html. Intentional diffs:
 *  - This route surfaces a Clear button per calculator (legacy lacked one)
 *  - The Ideal Gas Law "Gas constant units" select renders above the
 *    input group (CalculatorForm renders all selects first) instead of
 *    below it as in the legacy markup
 *  - The Van der Waals form remains inside a <details> element to
 *    preserve the "Advanced: Real Gas Correction" collapsible pattern
 * Routes math through calculatePure on IdealGasLawCalculator,
 * CombinedGasLawCalculator, and VanDerWaalsCalculator. No Playwright
 * screenshot test is added per task spec; parity is verified by manual
 * diff of the rendered DOM.
 */
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {IdealGasLawCalculator, CombinedGasLawCalculator, VanDerWaalsCalculator} from "../../modules/gasLawCalculators.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./gas-laws.module.css";
let idealCalculator = new IdealGasLawCalculator();
let combinedCalculator = new CombinedGasLawCalculator();
let vdwCalculator = new VanDerWaalsCalculator();
let idealFields: CalculatorField[] = [
    {"id": "ideal-P", "label": "P", "placeholder": "P (atm)", "ariaLabel": "Pressure"},
    {"id": "ideal-V", "label": "V", "placeholder": "V (L)", "ariaLabel": "Volume"},
    {"id": "ideal-n", "label": "n", "placeholder": "n (mol)", "ariaLabel": "Moles"},
    {"id": "ideal-T", "label": "T", "placeholder": "T (K)", "ariaLabel": "Temperature"}
];
let idealSelects: CalculatorSelect[] = [
    {
        "id": "ideal-solve-for",
        "label": "Solve for",
        "ariaLabel": "Select ideal gas law parameter to solve for",
        "options": [
            {"value": "P", "label": "Pressure (P)"},
            {"value": "V", "label": "Volume (V)"},
            {"value": "n", "label": "Moles (n)"},
            {"value": "T", "label": "Temperature (T)"}
        ],
        "defaultValue": "P"
    },
    {
        "id": "ideal-R-units",
        "label": "Gas constant units",
        "ariaLabel": "Select gas constant units",
        "options": [
            {"value": "atm-L", "label": "atm, L (R=0.08206)"},
            {"value": "SI", "label": "Pa, m³ (R=8.314)"}
        ],
        "defaultValue": "atm-L"
    }
];
let combinedFields: CalculatorField[] = [
    {"id": "combined-P1", "label": "P₁", "placeholder": "P₁", "ariaLabel": "Initial pressure"},
    {"id": "combined-V1", "label": "V₁", "placeholder": "V₁", "ariaLabel": "Initial volume"},
    {"id": "combined-T1", "label": "T₁", "placeholder": "T₁ (K)", "ariaLabel": "Initial temperature"},
    {"id": "combined-P2", "label": "P₂", "placeholder": "P₂", "ariaLabel": "Final pressure"},
    {"id": "combined-V2", "label": "V₂", "placeholder": "V₂", "ariaLabel": "Final volume"},
    {"id": "combined-T2", "label": "T₂", "placeholder": "T₂ (K)", "ariaLabel": "Final temperature"}
];
let combinedSelects: CalculatorSelect[] = [{
    "id": "combined-solve-for",
    "label": "Solve for",
    "ariaLabel": "Select combined gas law parameter to solve for",
    "options": [
        {"value": "P1", "label": "P₁"},
        {"value": "V1", "label": "V₁"},
        {"value": "T1", "label": "T₁"},
        {"value": "P2", "label": "P₂"},
        {"value": "V2", "label": "V₂"},
        {"value": "T2", "label": "T₂"}
    ],
    "defaultValue": "P1"
}];
let vdwFields: CalculatorField[] = [
    {"id": "vdw-V", "label": "V", "placeholder": "V (L)", "ariaLabel": "Volume"},
    {"id": "vdw-n", "label": "n", "placeholder": "n (mol)", "ariaLabel": "Moles"},
    {"id": "vdw-T", "label": "T", "placeholder": "T (K)", "ariaLabel": "Temperature"},
    {"id": "vdw-a", "label": "a", "placeholder": "a (L² atm mol⁻²)", "ariaLabel": "Van der Waals constant a"},
    {"id": "vdw-b", "label": "b", "placeholder": "b (L mol⁻¹)", "ariaLabel": "Van der Waals constant b"}
];
function resolveResult(res: {value: string; explanation?: string}, setResult: (v: string) => void, setError: (v: string) => void): void {
    let value: string = res.value;
    let explanation: string = res.explanation !== undefined ? res.explanation : "";
    if (value === "" || explanation.indexOf("Error") !== -1) {
        setError(explanation !== "" ? explanation : "Calculation failed");
        setResult("");
        return;
    }
    setError("");
    setResult(explanation !== "" ? explanation : value);
}
function GasLaws(): JSX.Element {
    let [idealResult, setIdealResult] = createSignal("");
    let [idealError, setIdealError] = createSignal("");
    let [combinedResult, setCombinedResult] = createSignal("");
    let [combinedError, setCombinedError] = createSignal("");
    let [vdwResult, setVdwResult] = createSignal("");
    let [vdwError, setVdwError] = createSignal("");
    function handleIdealCalculate(inputs: Record<string, string>): void {
        resolveResult(idealCalculator.calculatePure(inputs), setIdealResult, setIdealError);
    }
    function handleIdealClear(): void {
        setIdealResult("");
        setIdealError("");
    }
    function handleCombinedCalculate(inputs: Record<string, string>): void {
        resolveResult(combinedCalculator.calculatePure(inputs), setCombinedResult, setCombinedError);
    }
    function handleCombinedClear(): void {
        setCombinedResult("");
        setCombinedError("");
    }
    function handleVdwCalculate(inputs: Record<string, string>): void {
        resolveResult(vdwCalculator.calculatePure(inputs), setVdwResult, setVdwError);
    }
    function handleVdwClear(): void {
        setVdwResult("");
        setVdwError("");
    }
    return (
        <CalculatorCard
            title="Gas Laws"
            description="Use this suite of gas calculators to solve for pressure, volume, temperature, or moles using the Ideal or Combined Gas Laws. For real gases, the Van der Waals correction adjusts for molecular interactions, giving more accurate predictions. It is perfect for review and more."
            seeAlso={
                <SeeAlsoLink href="#molar-mass">Working with gases? You may also need molar masses from the Molar Mass Calculator.</SeeAlsoLink>
            }
        >
            <section class={styles.subGroup}>
                <h3>Ideal Gas Law Calculator - PV = nRT</h3>
                <CalculatorForm
                    fields={idealFields}
                    selects={idealSelects}
                    inputGroupLabel="Ideal gas parameters"
                    onCalculate={handleIdealCalculate}
                    onClear={handleIdealClear}
                    result={idealResult}
                    error={idealError}
                />
                <ExampleDetails>
                    <p>Find the volume of 1 mol of gas at STP: set P=1 atm, n=1 mol, T=273.15 K, and solve for V. The answer is approximately 22.4 L.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Combined Gas Law Calculator - P₁V₁/T₁ = P₂V₂/T₂</h3>
                <CalculatorForm
                    fields={combinedFields}
                    selects={combinedSelects}
                    inputGroupLabel="Combined gas parameters"
                    onCalculate={handleCombinedCalculate}
                    onClear={handleCombinedClear}
                    result={combinedResult}
                    error={combinedError}
                />
                <ExampleDetails>
                    <p>Try solving for V₂: set P₁=1, V₁=10, T₁=300, P₂=2, T₂=400. The result is V₂≈6.667 L.</p>
                </ExampleDetails>
            </section>
            <details class={styles.vdwDetails}>
                <summary>Advanced: Real Gas Correction</summary>
                <section class={styles.subGroup}>
                    <h3>Van der Waals Equation - Real Gas Pressure Calculator</h3>
                    <p>Calculate Pressure (P) for a real gas.</p>
                    <CalculatorForm
                        fields={vdwFields}
                        inputGroupLabel="Van der Waals parameters"
                        calculateLabel="Calculate P"
                        onCalculate={handleVdwCalculate}
                        onClear={handleVdwClear}
                        result={vdwResult}
                        error={vdwError}
                    />
                    <ExampleDetails>
                        <p>Try N₂ at high pressure: V=1 L, n=1 mol, T=300 K, a=1.39, b=0.0391. The real gas pressure differs from the ideal prediction.</p>
                    </ExampleDetails>
                </section>
            </details>
        </CalculatorCard>
    );
}
export {GasLaws};
