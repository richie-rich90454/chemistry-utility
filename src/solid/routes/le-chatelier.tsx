/**
 * Le Chatelier's principle route.
 *
 * Runs qualitative equilibrium-shift prediction through the calculation engine.
 */
import type {JSX} from "solid-js";
import {getEngine} from "../../modules/engine.js";
import {createSignal} from "solid-js";
import {resolveResult} from "../../modules/resultResolver.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
let reactionTypeSelect: CalculatorSelect = {
    "id": "lc-reaction-type",
    "label": "Forward reaction",
    "ariaLabel": "Select whether the forward reaction is exothermic or endothermic",
    "options": [
        {"value": "exothermic", "label": "Exothermic (releases heat)"},
        {"value": "endothermic", "label": "Endothermic (absorbs heat)"}
    ],
    "defaultValue": "exothermic"
};
let stressTypeSelect: CalculatorSelect = {
    "id": "lc-stress-type",
    "label": "Stress",
    "ariaLabel": "Select the type of stress applied to the equilibrium",
    "options": [
        {"value": "concentration", "label": "Concentration change"},
        {"value": "temperature", "label": "Temperature change"},
        {"value": "pressure", "label": "Pressure change"},
        {"value": "volume", "label": "Volume change"},
        {"value": "catalyst", "label": "Catalyst added"}
    ],
    "defaultValue": "temperature"
};
let changeSelect: CalculatorSelect = {
    "id": "lc-change",
    "label": "Change",
    "ariaLabel": "Select the direction of the change",
    "options": [
        {"value": "increase", "label": "Increase"},
        {"value": "decrease", "label": "Decrease"},
        {"value": "none", "label": "None"}
    ],
    "defaultValue": "increase"
};
let sideSelect: CalculatorSelect = {
    "id": "lc-side",
    "label": "Side",
    "ariaLabel": "Select the affected side, or the side with fewer moles of gas",
    "options": [
        {"value": "reactants", "label": "Reactants"},
        {"value": "products", "label": "Products"},
        {"value": "equal", "label": "Equal moles of gas"}
    ],
    "defaultValue": "reactants"
};
function LeChatelier(): JSX.Element {
    let engine = getEngine();
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    function handleCalculate(inputs: Record<string, string>): void {
        resolveResult(engine.calculate("le-chatelier", inputs), setResult, setError);
    }
    function handleClear(): void {
        setResult("");
        setError("");
    }
    return (
        <CalculatorCard
            title="Le Chatelier's Principle Calculator - Predicting Equilibrium Shifts"
            description="Predict the direction an equilibrium shifts when a stress is applied: a concentration, temperature, pressure, or volume change, or a catalyst. The calculator reports the shift direction (left, right, or no change) and whether the equilibrium constant K changes."
            exampleDetails={
                <ExampleDetails>
                    <p>For a concentration change, the side is the one whose concentration changed. For pressure or volume, the side is the one with fewer moles of gas. Catalysts never shift the equilibrium and never change K.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/gibbs-equilibrium">Connecting equilibrium to energetics? See the Gibbs Free Energy and Equilibrium calculator.</SeeAlsoLink>
            }
        >
            <CalculatorForm
                fields={[]}
                selects={[reactionTypeSelect, stressTypeSelect, changeSelect, sideSelect]}
                inputGroupLabel="Stress on the equilibrium"
                calculateLabel="Predict Shift"
                onCalculate={handleCalculate}
                onClear={handleClear}
                result={result}
                error={error}
            />
        </CalculatorCard>
    );
}
export {LeChatelier};
