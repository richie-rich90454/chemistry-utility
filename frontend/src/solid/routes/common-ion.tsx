/**
 * Visual verification: The Solid-rendered Common Ion Effect card should
 * match the legacy #common-ion-calc card in frontend/index.html.
 * Intentional diff: this route surfaces a Clear button (legacy lacked
 * one) and routes the common-ion solubility math through
 * CommonIonEffectCalculator.calculatePure. Parity is verified by manual
 * diff.
 */
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {CommonIonEffectCalculator} from "../../modules/solutionCalculators.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
let calculator = new CommonIonEffectCalculator();
let fields: CalculatorField[] = [
    {"id": "common-ion-Ksp", "label": "Ksp", "placeholder": "Ksp", "ariaLabel": "Ksp value"},
    {"id": "common-ion-concentration", "label": "Common ion concentration (M)", "placeholder": "Common ion concentration (M)", "ariaLabel": "Common ion concentration"}
];
let selects: CalculatorSelect[] = [{
    "id": "common-ion-salt-type",
    "label": "Salt type",
    "ariaLabel": "Select salt type",
    "options": [
        {"value": "AB", "label": "AB"},
        {"value": "AB2", "label": "AB2"},
        {"value": "A2B", "label": "A2B"},
        {"value": "AB3", "label": "AB3"},
        {"value": "A3B", "label": "A3B"}
    ],
    "defaultValue": "AB"
}];
function CommonIonEffect(): JSX.Element {
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        let res = calculator.calculatePure(inputs);
        let value: string = res.value;
        let explanation: string = res.explanation !== undefined ? res.explanation : "";
        if (value === "" || explanation.indexOf("Error") !== -1) {
            setError(explanation !== "" ? explanation : "Calculation failed");
            setResult("");
            return;
        }
        setError("");
        setResult(explanation !== "" ? explanation : value);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Common Ion Effect Calculator - Solubility with Common Ion"
            description="Calculate the molar solubility of a salt when a common ion is already present in solution. Compares solubility with and without the common ion, demonstrating the common ion effect on equilibrium."
            exampleDetails={
                <ExampleDetails>
                    <p>Try Ksp=1.8e-10 (AgCl), common ion=0.1 M Cl-, salt type AB. Solubility drops from 1.34e-5 to 1.8e-9 M.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="#ksp-calc">For solubility in pure water, use the Ksp Calculator.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="Common ion parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {CommonIonEffect};
