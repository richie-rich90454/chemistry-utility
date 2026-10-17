/**
 * Mass spectrometry route.
 *
 * Runs isotope-abundance math through the calculation engine.
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
    {"id": "ms-isotopes", "label": "Isotopes", "placeholder": "E.g., 34.97,0.7576;36.97,0.2424", "ariaLabel": "Isotope masses and abundances", "type": "text"}
];
function MassSpectrometry(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("mass-spectrometry", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Mass Spectrometry Calculator - Average Atomic Mass"
            description="Enter isotope masses and relative abundances as mass,abundance pairs to compute the weighted average atomic mass and identify the closest element on the periodic table. Fractions and percentages both work because the abundances are normalized."
            exampleDetails={
                <ExampleDetails>
                    <p>Try 34.97,0.7576;36.97,0.2424 for chlorine (about 35.45 u), or 78.92,0.5069;80.92,0.4931 for bromine (about 79.90 u). One isotope is enough: 197,1 gives gold.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/element-lookup">Once you have the element, the Element Lookup shows its full property set.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                inputGroupLabel="Isotopes (mass,abundance separated by semicolons)"
                calculateLabel="Calculate Average Atomic Mass"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {MassSpectrometry};
