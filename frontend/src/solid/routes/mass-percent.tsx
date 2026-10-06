/**
 * Visual verification: The Solid-rendered Mass Percent card should match
 * the legacy #mass-percent-calc card in frontend/index.html. Intentional
 * diff: this route surfaces a Clear button (legacy lacked one) and routes
 * the concentration math through MassPercentCalculator.calculatePure.
 * Parity is verified by manual diff of the rendered DOM.
 */
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {MassPercentCalculator} from "../../modules/solutionCalculators.js";
import {resolveResult} from "../../modules/resultResolver.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
let calculator = new MassPercentCalculator();
let fields: CalculatorField[] = [
    {"id": "mass-solute", "label": "Mass of solute (g)", "placeholder": "Mass of solute (g)", "ariaLabel": "Mass of solute"},
    {"id": "mass-solution", "label": "Mass of solution (g)", "placeholder": "Mass of solution (g)", "ariaLabel": "Mass of solution"}
];
let selects: CalculatorSelect[] = [{
    "id": "concentration-unit",
    "label": "Concentration unit",
    "ariaLabel": "Select concentration unit",
    "options": [
        {"value": "percent", "label": "%"},
        {"value": "ppm", "label": "ppm"},
        {"value": "ppb", "label": "ppb"}
    ],
    "defaultValue": "percent"
}];
function MassPercent(): JSX.Element {
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(calculator.calculatePure(inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Mass Percent and Concentration Calculator - ppm (parts per million) and ppb (parts per billion)"
            description="This calculator shows the mass percent, ppm, or ppb of a solute in a solution. It is useful for environmental chemistry, purity checks, and analytical experiments. Just enter the amounts, and it quickly provides an easy-to-read breakdown of concentrations."
            exampleDetails={
                <ExampleDetails>
                    <p>Try entering solute=5 g, solution=100 g, unit=% to get 5% concentration. Or try solute=0.005 g, solution=1 kg, unit=ppm to get 5 ppm.</p>
                </ExampleDetails>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="Mass percent parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {MassPercent};
