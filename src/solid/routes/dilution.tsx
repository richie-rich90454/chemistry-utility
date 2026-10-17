/**
 * Dilution route.
 *
 * Runs the M1V1 = M2V2 math through the calculation engine.
 */
import type {JSX} from "solid-js";
import {getEngine} from "../../modules/engine.js";
import {createSignal} from "solid-js";
import {resolveResult} from "../../modules/resultResolver.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
let fields: CalculatorField[] = [
    {"id": "dilution-M1", "label": "M1", "placeholder": "M1 (M)", "ariaLabel": "Initial molarity"},
    {"id": "dilution-V1", "label": "V1", "placeholder": "V1 (L)", "ariaLabel": "Initial volume"},
    {"id": "dilution-M2", "label": "M2", "placeholder": "M2 (M)", "ariaLabel": "Final molarity"},
    {"id": "dilution-V2", "label": "V2", "placeholder": "V2 (L)", "ariaLabel": "Final volume"}
];
let selects: CalculatorSelect[] = [{
    "id": "dilution-solve-for",
    "label": "Select parameter",
    "ariaLabel": "Select dilution parameter to solve for",
    "options": [
        {"value": "M1", "label": "Initial Molarity (M1)"},
        {"value": "V1", "label": "Initial Volume (V1)"},
        {"value": "M2", "label": "Final Molarity (M2)"},
        {"value": "V2", "label": "Final Volume (V2)"}
    ],
    "defaultValue": "V2"
}];
function Dilution(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("dilution", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Molarity and Dilution Calculator - Prepare Solutions Easily"
            description="The dilution tool helps you figure out how much stock solution and solvent you need to reach a specific concentration. It uses the classic C1V1 = C2V2 relationship, making it easy to scale solutions up or down. Perfect for preparing lab samples or adjusting buffer strengths."
            exampleDetails={
                <ExampleDetails>
                    <p>Try solving for V2: set M1=6, V1=1, M2=3, and leave V2 empty. The result is 2 L.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/stoichiometry">If you're preparing solutions for reactions, check the Stoichiometry Calculator for molar relationships.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="Dilution parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {Dilution};
