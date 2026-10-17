/**
 * VSEPR geometry route.
 *
 * Runs AXE-notation to molecular-geometry math through the calculation engine.
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
    {"id": "vsepr-central", "label": "Central atom", "placeholder": "E.g., N", "ariaLabel": "Central atom element symbol", "type": "text"},
    {"id": "vsepr-bonded", "label": "Bonded atoms", "placeholder": "Bonded atoms (X)", "ariaLabel": "Number of bonded atoms"},
    {"id": "vsepr-lone-pairs", "label": "Lone pairs", "placeholder": "Lone pairs (E)", "ariaLabel": "Number of lone pairs"}
];
function VseprGeometry(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("vsepr-geometry", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="VSEPR Geometry Calculator - Molecular Shape and Polarity"
            description="Enter the central atom, the number of bonded atoms (X), and the number of lone pairs (E) in AXE notation to get the electron-pair geometry, molecular geometry, ideal bond angle, hybridization, and polarity."
            exampleDetails={
                <ExampleDetails>
                    <p>Try N with 3 bonded atoms and 1 lone pair for trigonal pyramidal ammonia, or O with 2 bonded atoms and 2 lone pairs for bent water (104.5 degrees).</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/bond-type">Predicting bond ionic or covalent character instead? See the Bond Type Predictor.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                inputGroupLabel="AXE counts"
                calculateLabel="Determine Geometry"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {VseprGeometry};
