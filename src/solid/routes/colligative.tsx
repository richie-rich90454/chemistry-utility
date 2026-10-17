/**
 * Colligative properties route.
 *
 * Runs the freezing and boiling point math through the calculation engine.
 */
import type {JSX} from "solid-js";
import {getEngine} from "../../modules/engine.js";
import {createSignal} from "solid-js";
import {resolveResult} from "../../modules/resultResolver.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
let requiredFields: CalculatorField[] = [
    {"id": "collig-solute-mass", "label": "Solute mass (g)", "placeholder": "Solute mass (g)", "ariaLabel": "Solute mass"},
    {"id": "collig-molar-mass", "label": "Molar mass (g/mol)", "placeholder": "Molar mass (g/mol)", "ariaLabel": "Molar mass"},
    {"id": "collig-solvent-mass", "label": "Solvent mass (g)", "placeholder": "Solvent mass (g)", "ariaLabel": "Solvent mass"},
    {"id": "collig-vanthoff", "label": "Van't Hoff factor (i)", "placeholder": "e.g. 2", "ariaLabel": "Van't Hoff factor"}
];
let optionalFields: CalculatorField[] = [
    {"id": "collig-solvent-molar-mass", "label": "Solvent molar mass", "placeholder": "g/mol", "ariaLabel": "Solvent molar mass"},
    {"id": "collig-density", "label": "Solution density", "placeholder": "g/mL", "ariaLabel": "Solution density"},
    {"id": "collig-temp", "label": "Temperature", "placeholder": "K", "ariaLabel": "Temperature for osmotic pressure"},
    {"id": "collig-Kb", "label": "Kb", "placeholder": "Kb (C kg/mol)", "ariaLabel": "Boiling point constant"},
    {"id": "collig-Kf", "label": "Kf", "placeholder": "Kf (C kg/mol)", "ariaLabel": "Freezing point constant"},
    {"id": "collig-solvent-bp", "label": "Solvent bp", "placeholder": "C", "ariaLabel": "Solvent boiling point"},
    {"id": "collig-solvent-fp", "label": "Solvent fp", "placeholder": "C", "ariaLabel": "Solvent freezing point"},
    {"id": "collig-Psolvent", "label": "Solvent vapor pressure", "placeholder": "atm", "ariaLabel": "Solvent vapor pressure"}
];
let allFields: CalculatorField[] = requiredFields.concat(optionalFields);
function Colligative(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("colligative-properties", inputs), setResult, setError);
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
