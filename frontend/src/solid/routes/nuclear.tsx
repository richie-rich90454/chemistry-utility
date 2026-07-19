/**
 * Visual verification: The Solid-rendered Nuclear Chemistry card should
 * match the legacy #nuclear-chemistry card in frontend/index.html.
 * Intentional diff: this route surfaces a Clear button (legacy lacked
 * one) and routes the decay math through HalfLifeCalculator.calculatePure
 * instead of the DOM-coupled performCalculation path. No Playwright
 * screenshot test is added per task spec; parity is verified by manual
 * diff of the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {HalfLifeCalculator} from "../../modules/gasLawCalculators.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
let calculator = new HalfLifeCalculator();
let fields: CalculatorField[] = [
    {"id": "initial-quantity", "label": "Initial Quantity", "placeholder": "Initial Quantity", "ariaLabel": "Initial quantity"},
    {"id": "time-input", "label": "Time", "placeholder": "Time (s/min/yr)", "ariaLabel": "Time"},
    {"id": "half-life-input", "label": "Half-Life", "placeholder": "Half-Life", "ariaLabel": "Half-life"},
    {"id": "remaining-quantity", "label": "Remaining Quantity", "placeholder": "Remaining Quantity", "ariaLabel": "Remaining quantity"}
];
let selects: CalculatorSelect[] = [{
    "id": "half-life-solve-for",
    "label": "Calculate",
    "ariaLabel": "Select half-life parameter to solve for",
    "options": [
        {"value": "remaining", "label": "Remaining Quantity"},
        {"value": "time", "label": "Time Required"},
        {"value": "half-life", "label": "Half-Life"}
    ],
    "defaultValue": "remaining"
}];
function NuclearChemistry(): JSX.Element {
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
            title="Nuclear Chemistry Calculators"
            description="The half-life calculator models exponential decay to show how much of a substance remains over time. It is helpful in radiochemistry, nuclear physics, and pharmacokinetics. Enter the initial quantity and half-life, and the calculator handles the rest with precise results."
            exampleDetails={
                <ExampleDetails>
                    <p>Try calculating remaining quantity: initial=100, time=10, half-life=5. After 10 years, 25 units remain (two half-lives).</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="#gas-laws">For gas-phase reactions, see the Gas Laws calculators for pressure, volume, and temperature relationships.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="Half-life parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {NuclearChemistry};
