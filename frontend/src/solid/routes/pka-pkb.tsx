/**
 * pKa and pKb route.
 *
 * Runs the Ka, Kb, pKa, and pKb conversions through the calculation engine.
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
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("pka-pkb", inputs), setResult, setError);
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
