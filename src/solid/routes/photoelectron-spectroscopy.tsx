/**
 * Photoelectron spectroscopy route.
 *
 * Runs PES spectrum parsing through the calculation engine.
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
    {"id": "pes-peaks", "label": "Peaks", "placeholder": "E.g., 1.407, 2.446, 36.847", "ariaLabel": "PES peak positions in MJ/mol", "type": "text"}
];
function PhotoelectronSpectroscopy(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("photoelectron-spectroscopy", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Photoelectron Spectroscopy (PES) Calculator"
            description="Paste the peak positions from a photoelectron spectrum in MJ/mol and identify the element. The calculator matches the spectrum against reference binding energies for hydrogen through calcium, reports the electron configuration and valence electron count, and shows which subshell each peak belongs to."
            exampleDetails={
                <ExampleDetails>
                    <p>Try the nitrogen spectrum 1.407, 2.446, 36.847 to get 1s2 2s2 2p3, or the oxygen spectrum 1.314, 2.748, 52.403 for 1s2 2s2 2p4. Order does not matter; peaks are sorted from the largest binding energy down.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/quantum-atomic">Need the electron configuration or quantum numbers? See the Quantum &amp; Atomic calculators.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                inputGroupLabel="Peak positions (MJ/mol, comma-separated)"
                calculateLabel="Identify Element"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {PhotoelectronSpectroscopy};
