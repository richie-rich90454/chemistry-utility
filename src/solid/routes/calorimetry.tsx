/**
 * Calorimetry route.
 *
 * Runs q = m*c*dT math through the calculation engine.
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
    {"id": "calor-mass", "label": "Mass", "placeholder": "Mass (g)", "ariaLabel": "Mass in grams"},
    {"id": "calor-specific-heat", "label": "Specific heat", "placeholder": "J/(g*C)", "ariaLabel": "Specific heat"},
    {"id": "calor-delta-t", "label": "Temperature change", "placeholder": "Delta T (C)", "ariaLabel": "Temperature change in Celsius"},
    {"id": "calor-heat", "label": "Heat", "placeholder": "Heat (J)", "ariaLabel": "Heat in joules"}
];
let selects: CalculatorSelect[] = [{
    "id": "calor-solve-for",
    "label": "Solve for",
    "ariaLabel": "Select calorimetry parameter to solve for",
    "options": [
        {"value": "q", "label": "Heat (q)"},
        {"value": "m", "label": "Mass (m)"},
        {"value": "c", "label": "Specific Heat (c)"},
        {"value": "deltaT", "label": "Temperature Change (Delta T)"}
    ],
    "defaultValue": "q"
}];
function Calorimetry(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("calorimetry", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Coffee-Cup Calorimetry Calculator - q = mcDelta T"
            description="Solve q = mcDelta T for heat (q), mass (m), specific heat (c), or temperature change, the way a coffee-cup calorimeter problem is set up in AP Chemistry. A positive q means the reaction absorbed heat; a negative q means it released heat."
            exampleDetails={
                <ExampleDetails>
                    <p>Try solving for q with mass = 100 g, specific heat = 4.184 J/(g*C), and Delta T = 50 C to get 20920 J. Water's specific heat is 4.184 J/(g*C).</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/thermodynamics">Working with enthalpy or Gibbs free energy? See the Thermodynamics calculators.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="Calorimetry parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {Calorimetry};
