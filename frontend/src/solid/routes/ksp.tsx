/**
 * Solubility product route.
 *
 * Runs the Ksp math through the calculation engine.
 */
import type {JSX} from "solid-js";
import {getEngine} from "../../modules/engine.js";
import {createSignal} from "solid-js";
import {resolveResult} from "../../modules/resultResolver.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
let fields: CalculatorField[] = [
    {"id": "ksp-value", "label": "Ksp", "placeholder": "Ksp", "ariaLabel": "Ksp value"},
    {"id": "ksp-molar-solubility", "label": "Molar solubility (M)", "placeholder": "Molar solubility (M)", "ariaLabel": "Molar solubility"}
];
let selects: CalculatorSelect[] = [
    {
        "id": "ksp-solve-for",
        "label": "Select parameter",
        "ariaLabel": "Select Ksp parameter to solve for",
        "options": [
            {"value": "Ksp", "label": "Ksp"},
            {"value": "solubility", "label": "Molar Solubility"}
        ],
        "defaultValue": "Ksp"
    },
    {
        "id": "ksp-salt-type",
        "label": "Salt type",
        "ariaLabel": "Select salt type",
        "options": [
            {"value": "AB", "label": "AB"},
            {"value": "AB2", "label": "AB2"},
            {"value": "A2B", "label": "A2B"},
            {"value": "AB3", "label": "AB3"},
            {"value": "A3B", "label": "A3B"}
        ],
        "defaultValue": "AB"
    }
];
function Ksp(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("ksp", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Ksp Calculator - Solubility Product Constant"
            description="Calculate the solubility product constant (Ksp) from molar solubility, or find molar solubility from Ksp. Supports common salt types: AB, AB2, A2B, AB3, A3B."
            exampleDetails={
                <ExampleDetails>
                    <p>Try Ksp=1.8e-10, salt type AB (AgCl). Molar solubility = 1.34e-5 M.</p>
                </ExampleDetails>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="Ksp parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {Ksp};
