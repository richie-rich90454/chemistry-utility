/**
 * Visual verification: The Solid-rendered pKa/pKb card should match the
 * legacy #pka-pkb-calc card in frontend/index.html. Intentional diff:
 * this route surfaces a Clear button (legacy lacked one) and routes the
 * Ka/Kb/pKa/pKb conversion through PKaPKbCalculator.calculatePure.
 * Parity is verified by manual diff.
 */
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {PKaPKbCalculator} from "../../modules/solutionCalculators.js";
import {resolveResult} from "../../modules/resultResolver.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
let calculator = new PKaPKbCalculator();
let fields: CalculatorField[] = [
    {"id": "pka-pkb-input-value", "label": "Value", "placeholder": "Value", "ariaLabel": "Input value"}
];
let selects: CalculatorSelect[] = [{
    "id": "pka-pkb-input-type",
    "label": "Input type",
    "ariaLabel": "Select input type",
    "options": [
        {"value": "Ka", "label": "Ka"},
        {"value": "pKa", "label": "pKa"},
        {"value": "Kb", "label": "Kb"},
        {"value": "pKb", "label": "pKb"}
    ],
    "defaultValue": "Ka"
}];
function PKaPKb(): JSX.Element {
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(calculator.calculatePure(inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="pKa/pKb Calculator - Acid-Base Dissociation Constants"
            description="Convert between Ka, pKa, Kb, and pKb using the relationships pKa = -log(Ka), pKb = -log(Kb), and pKa + pKb = 14 (at 25 C). Enter any one value to compute all four."
            exampleDetails={
                <ExampleDetails>
                    <p>Try Ka=1.8e-5 (acetic acid). pKa = 4.74, pKb = 9.26, Kb = 5.56e-10.</p>
                </ExampleDetails>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="pKa/pKb parameter"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {PKaPKb};
