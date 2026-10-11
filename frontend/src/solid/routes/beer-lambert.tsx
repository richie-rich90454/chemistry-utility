/**
 * Beer-Lambert law route.
 *
 * Runs A = epsilon*b*c math through the calculation engine.
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
    {"id": "bl-absorbance", "label": "Absorbance", "placeholder": "Absorbance (A)", "ariaLabel": "Absorbance"},
    {"id": "bl-absorptivity", "label": "Absorptivity", "placeholder": "Absorptivity (L/(mol*cm))", "ariaLabel": "Molar absorptivity"},
    {"id": "bl-path-length", "label": "Path length", "placeholder": "Path length (cm)", "ariaLabel": "Path length in centimeters"},
    {"id": "bl-concentration", "label": "Concentration", "placeholder": "Concentration (mol/L)", "ariaLabel": "Concentration in moles per liter"}
];
let selects: CalculatorSelect[] = [{
    "id": "bl-solve-for",
    "label": "Solve for",
    "ariaLabel": "Select Beer-Lambert parameter to solve for",
    "options": [
        {"value": "absorbance", "label": "Absorbance (A)"},
        {"value": "absorptivity", "label": "Absorptivity (epsilon)"},
        {"value": "path-length", "label": "Path Length (b)"},
        {"value": "concentration", "label": "Concentration (c)"},
        {"value": "transmittance", "label": "Percent Transmittance (%T)"}
    ],
    "defaultValue": "absorbance"
}];
function BeerLambert(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("beer-lambert", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Beer-Lambert Law Calculator - A = epsilon*b*c"
            description="Solve the Beer-Lambert law A = epsilon*b*c for absorbance, absorptivity, path length, or concentration, and convert absorbance to percent transmittance with %T = 100*10^(-A). Leaving absorbance blank when solving for the others keeps the units straight."
            exampleDetails={
                <ExampleDetails>
                    <p>Try absorptivity 6239.5 L/(mol*cm), path length 1 cm, and concentration 0.0001 mol/L to get A = 0.6240. Or convert A = 0.9 to about 12.6% transmittance.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/serial-dilution">Building a calibration series? The Serial Dilution calculator steps down concentrations.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="Beer-Lambert parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {BeerLambert};
