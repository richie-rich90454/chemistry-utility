/**
 * Molality route.
 *
 * Runs molality math through the calculation engine.
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
    {"id": "molality-solute-mass", "label": "Solute mass", "placeholder": "Solute mass (g)", "ariaLabel": "Solute mass in grams"},
    {"id": "molality-solvent-mass", "label": "Solvent mass", "placeholder": "Solvent mass (g)", "ariaLabel": "Solvent mass in grams"},
    {"id": "molality-molar-mass", "label": "Molar mass", "placeholder": "Molar mass (g/mol)", "ariaLabel": "Molar mass in grams per mole"},
    {"id": "molality-value", "label": "Molality", "placeholder": "Molality (mol/kg)", "ariaLabel": "Molality in moles per kilogram"}
];
let selects: CalculatorSelect[] = [{
    "id": "molality-solve-for",
    "label": "Solve for",
    "ariaLabel": "Select molality parameter to solve for",
    "options": [
        {"value": "molality", "label": "Molality (m)"},
        {"value": "solute-mass", "label": "Solute Mass"},
        {"value": "solvent-mass", "label": "Solvent Mass"},
        {"value": "molar-mass", "label": "Molar Mass"}
    ],
    "defaultValue": "molality"
}];
function Molality(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("molality", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Molality Calculator - m = Moles of Solute per kg of Solvent"
            description="Compute molality from the solute mass, solvent mass, and molar mass, or solve for any one of those quantities from a target molality. Masses are in grams; unlike molarity, molality does not change with temperature."
            exampleDetails={
                <ExampleDetails>
                    <p>Try 20 g of NaOH (39.997 g/mol) in 500 g of water to get about 1.0001 mol/kg, or solve for solute mass at 1 mol/kg with the same solvent and molar mass.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/dilution">Preparing solutions by volume instead? See the Dilution calculator.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={fields}
                selects={selects}
                inputGroupLabel="Molality parameters"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {Molality};
