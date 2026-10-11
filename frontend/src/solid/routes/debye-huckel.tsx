/**
 * Debye-Huckel route.
 *
 * Runs the activity coefficient math through the calculation engine.
 */
import type {JSX} from "solid-js";
import {getEngine} from "../../modules/engine.js";
import {createSignal} from "solid-js";
import {resolveResult} from "../../modules/resultResolver.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
let fields: CalculatorField[] = [
    {"id": "dh-zplus", "label": "Cation charge (z+)", "placeholder": "Cation charge (z+)", "ariaLabel": "Cation charge"},
    {"id": "dh-zminus", "label": "Anion charge (z-)", "placeholder": "Anion charge (z-)", "ariaLabel": "Anion charge"},
    {"id": "dh-concentration", "label": "Concentration (M)", "placeholder": "Concentration (M)", "ariaLabel": "Concentration"},
    {"id": "dh-ion-size", "label": "Ion size parameter a (Angstrom)", "placeholder": "Ion size parameter a (Angstrom)", "ariaLabel": "Ion size parameter"}
];
function DebyeHuckel(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("debye-huckel", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Debye-Huckel Calculator - Activity Coefficients"
            description="Calculate ionic strength and the mean activity coefficient using the Extended Debye-Huckel equation: log(gamma) = -0.509 |z+z-| sqrt(I) / (1 + 3.28 a sqrt(I)). Essential for accurate equilibrium calculations in electrolyte solutions."
            exampleDetails={
                <ExampleDetails>
                    <p>Try z+=1, z-=1, conc=0.01 M, ion size=9 Angstrom. I=0.01, gamma about 0.90.</p>
                </ExampleDetails>
            }
        >
            <CalculatorForm
                fields={fields}
                inputGroupLabel="Debye-Huckel parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {DebyeHuckel};
