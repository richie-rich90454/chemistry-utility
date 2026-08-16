/**
 * Visual verification: The Solid-rendered Buffer Solution card should
 * match the legacy #buffer-calc card in frontend/index.html. Intentional
 * diff: this route surfaces a Clear button (legacy lacked one) and routes
 * the Henderson-Hasselbalch math through
 * BufferSolutionCalculator.calculatePure. Parity is verified by manual
 * diff.
 */
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {BufferSolutionCalculator} from "../../modules/solutionCalculators.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
let calculator = new BufferSolutionCalculator();
let fields: CalculatorField[] = [
    {"id": "buffer-pKa", "label": "pKa", "placeholder": "pKa", "ariaLabel": "pKa value"},
    {"id": "buffer-HA", "label": "[HA]", "placeholder": "[HA] (M)", "ariaLabel": "Acid concentration"},
    {"id": "buffer-Aminus", "label": "[A-]", "placeholder": "[A-] (M)", "ariaLabel": "Conjugate base concentration"},
    {"id": "buffer-pH", "label": "pH", "placeholder": "pH", "ariaLabel": "pH value"},
    {"id": "buffer-ratio", "label": "[A-]/[HA]", "placeholder": "[A-]/[HA]", "ariaLabel": "Ratio value"}
];
let selects: CalculatorSelect[] = [{
    "id": "buffer-solve-for",
    "label": "Select parameter",
    "ariaLabel": "Select buffer parameter to solve for",
    "options": [
        {"value": "pH", "label": "pH"},
        {"value": "pKa", "label": "pKa"},
        {"value": "ratio", "label": "[A-]/[HA] ratio"}
    ],
    "defaultValue": "pH"
}];
function BufferSolution(): JSX.Element {
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        let res = calculator.calculatePure(inputs);
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
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Buffer Solution Calculator - Henderson-Hasselbalch Equation"
            description="Calculate the pH of a buffer solution using the Henderson-Hasselbalch equation: pH = pKa + log([A-]/[HA]). You can also solve for pKa or the ratio of conjugate base to acid given a target pH."
            exampleDetails={
                <ExampleDetails>
                    <p>Try pKa=4.75, [HA]=0.1 M, [A-]=0.2 M. The pH is approximately 5.05 with a good buffer capacity.</p>
                </ExampleDetails>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="Buffer parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {BufferSolution};
