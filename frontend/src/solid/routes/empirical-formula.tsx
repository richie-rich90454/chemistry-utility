/**
 * Empirical formula route.
 *
 * Runs percent-composition-to-formula math through the calculation engine.
 */
import type {JSX} from "solid-js";
import {getEngine} from "../../modules/engine.js";
import {createSignal} from "solid-js";
import {resolveResult} from "../../modules/resultResolver.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
let fields: CalculatorField[] = [
    {"id": "ef-composition", "label": "Percent composition", "placeholder": "E.g., C:40,H:6.71,O:53.29", "ariaLabel": "Percent composition as element percent pairs", "type": "text"},
    {"id": "ef-molar-mass", "label": "Molar mass (optional)", "placeholder": "Molar mass (g/mol)", "ariaLabel": "Molar mass in grams per mole"}
];
function EmpiricalFormula(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("empirical-formula", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Empirical and Molecular Formula Calculator"
            description="Enter the percent composition of a compound as element:percent pairs to get its empirical formula. Supply the molar mass as well and the molecular formula is computed. The percentages should sum to about 100%."
            exampleDetails={
                <ExampleDetails>
                    <p>Try C:40,H:6.71,O:53.29 to get CH2O, then add molar mass 180.156 for the molecular formula C6H12O6. Or try H:11.19,O:88.81 for water.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/molar-mass">Working from a known formula instead? The Molar Mass calculator parses any formula.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                inputGroupLabel="Percent composition"
                calculateLabel="Calculate Empirical Formula"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {EmpiricalFormula};
