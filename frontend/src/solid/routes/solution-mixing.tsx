/**
 * Solution mixing route.
 *
 * Runs the mixed concentration math through the calculation engine.
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
    {"id": "mix-C1", "label": "C1", "placeholder": "C1 (M)", "ariaLabel": "Concentration 1"},
    {"id": "mix-V1", "label": "V1", "placeholder": "V1 (L)", "ariaLabel": "Volume 1"},
    {"id": "mix-C2", "label": "C2", "placeholder": "C2 (M)", "ariaLabel": "Concentration 2"},
    {"id": "mix-V2", "label": "V2", "placeholder": "V2 (L)", "ariaLabel": "Volume 2"}
];
function SolutionMixing(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("solution-mixing", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Solution Mixing Calculator - Calculate Final Molarity and more"
            description="Mix two solutions of different concentrations and volumes to find the resulting molarity. This tool is great for preparing reactant mixtures or adjusting stock solutions in the lab. Enter your known values, and it calculates the final solution automatically."
            exampleDetails={
                <ExampleDetails>
                    <p>Try mixing C1=1 M, V1=2 L with C2=3 M, V2=1 L. The final concentration is 1.667 M.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/dilution">For simple dilutions of a single stock solution, use the Dilution Calculator.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                inputGroupLabel="Mixing parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {SolutionMixing};
