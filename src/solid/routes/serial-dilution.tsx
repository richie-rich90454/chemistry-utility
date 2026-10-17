/**
 * Serial dilution route.
 *
 * Runs serial-dilution-series math through the calculation engine.
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
    {"id": "sd-initial-concentration", "label": "Initial concentration", "placeholder": "C0 (M)", "ariaLabel": "Initial concentration in molarity"},
    {"id": "sd-dilution-factor", "label": "Dilution factor", "placeholder": "factor", "ariaLabel": "Dilution factor per step"},
    {"id": "sd-steps", "label": "Steps", "placeholder": "Number of steps", "ariaLabel": "Number of dilution steps"}
];
function SerialDilution(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("serial-dilution", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Serial Dilution Calculator"
            description="Compute the concentration at every step of a serial dilution from the initial concentration, the dilution factor per step, and the number of steps. The total dilution factor and each intermediate concentration are reported in the explanation."
            exampleDetails={
                <ExampleDetails>
                    <p>Try C0 = 1 M with a 10-fold dilution for 3 steps to reach 0.001 M (total dilution 1000x), or 6 steps to reach 1.0000e-6 M.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/beer-lambert">Measuring the diluted samples? The Beer-Lambert calculator turns absorbance into concentration.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                inputGroupLabel="Serial dilution parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {SerialDilution};
