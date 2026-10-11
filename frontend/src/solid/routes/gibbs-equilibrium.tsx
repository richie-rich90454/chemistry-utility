/**
 * Gibbs free energy and equilibrium route.
 *
 * Runs Delta G = -RT ln K math through the calculation engine.
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
    {"id": "geq-delta-g", "label": "Delta G", "placeholder": "Delta G (kJ/mol)", "ariaLabel": "Standard Gibbs free energy change in kilojoules per mole"},
    {"id": "geq-k", "label": "K", "placeholder": "Equilibrium constant K", "ariaLabel": "Equilibrium constant"},
    {"id": "geq-temperature", "label": "Temperature", "placeholder": "T (K)", "ariaLabel": "Temperature in Kelvin"}
];
let selects: CalculatorSelect[] = [{
    "id": "geq-solve-for",
    "label": "Solve for",
    "ariaLabel": "Select whether to solve for K or Delta G",
    "options": [
        {"value": "K", "label": "Equilibrium constant (K)"},
        {"value": "delta-g", "label": "Gibbs Free Energy (Delta G)"}
    ],
    "defaultValue": "K"
}];
function GibbsEquilibrium(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("gibbs-equilibrium", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Gibbs Free Energy and Equilibrium Calculator - Delta G = -RT ln K"
            description="Convert between the standard Gibbs free energy change and the equilibrium constant with Delta G = -RT ln K, in either direction. Temperature is in Kelvin and defaults to 298.15 K, and the result reports which side the equilibrium favors."
            exampleDetails={
                <ExampleDetails>
                    <p>Try Delta G = 46.5 kJ/mol at 298.15 K to get K, or K = 10 to get Delta G = -5.708 kJ/mol. R = 8.314 J/(mol*K).</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/thermodynamics">Getting Delta G from enthalpy and entropy instead? See the Thermodynamics calculators.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="Gibbs equilibrium parameters"
                calculateLabel="Calculate"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {GibbsEquilibrium};
