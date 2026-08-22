/**
 * Visual verification: The Solid-rendered Colligative Properties card
 * should match the legacy #colligative-calc card in frontend/index.html.
 * Intentional diff: this route surfaces a Clear button (legacy lacked
 * one) and routes the boiling-point, freezing-point, osmotic-pressure,
 * and vapor-pressure math through
 * ColligativePropertiesCalculator.calculatePure. Parity is verified by
 * manual diff.
 */
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {ColligativePropertiesCalculator} from "../../modules/solutionCalculators.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
let calculator = new ColligativePropertiesCalculator();
let requiredFields: CalculatorField[] = [
    {"id": "collig-solute-mass", "label": "Solute mass (g)", "placeholder": "Solute mass (g)", "ariaLabel": "Solute mass"},
    {"id": "collig-molar-mass", "label": "Molar mass (g/mol)", "placeholder": "Molar mass (g/mol)", "ariaLabel": "Molar mass"},
    {"id": "collig-solvent-mass", "label": "Solvent mass (g)", "placeholder": "Solvent mass (g)", "ariaLabel": "Solvent mass"},
    {"id": "collig-vanthoff", "label": "Van't Hoff factor (i)", "placeholder": "Van't Hoff factor (i)", "ariaLabel": "Van't Hoff factor"}
];
let optionalFields: CalculatorField[] = [
    {"id": "collig-solvent-molar-mass", "label": "Solvent molar mass", "placeholder": "Solvent molar mass g/mol (default: water 18.015)", "ariaLabel": "Solvent molar mass"},
    {"id": "collig-Kb", "label": "Kb", "placeholder": "Kb (C kg/mol)", "ariaLabel": "Boiling point constant"},
    {"id": "collig-Kf", "label": "Kf", "placeholder": "Kf (C kg/mol)", "ariaLabel": "Freezing point constant"},
    {"id": "collig-solvent-bp", "label": "Solvent bp", "placeholder": "Solvent boiling point (C)", "ariaLabel": "Solvent boiling point"},
    {"id": "collig-solvent-fp", "label": "Solvent fp", "placeholder": "Solvent freezing point (C)", "ariaLabel": "Solvent freezing point"},
    {"id": "collig-Psolvent", "label": "Solvent vapor pressure", "placeholder": "Solvent vapor pressure (atm)", "ariaLabel": "Solvent vapor pressure"}
];
let allFields: CalculatorField[] = requiredFields.concat(optionalFields);
function Colligative(): JSX.Element {
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
            title="Colligative Properties Calculator - Boiling Point, Freezing Point, Osmotic Pressure"
            description="Calculate boiling point elevation (Tb = Kb m i), freezing point depression (Tf = Kf m i), osmotic pressure (pi = M R T i), and vapor pressure lowering (Raoult's law). Enter solute and solvent properties to compute all applicable colligative effects."
            exampleDetails={
                <ExampleDetails>
                    <p>Try 10 g NaCl (M=58.44, i=2) in 100 g water (Kb=0.512, Kf=1.86, bp=100, fp=0). Tb about 0.88 C, Tf about 3.18 C.</p>
                </ExampleDetails>
            }
        >
            <CalculatorForm
                fields={allFields}
                inputGroupLabel="Required and optional parameters (leave optionals blank to skip)"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {Colligative};
