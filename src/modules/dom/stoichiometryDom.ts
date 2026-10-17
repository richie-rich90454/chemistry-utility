import { Calculator } from "../calculator.js";
import type { CalculatorResult } from "../calculators/pureCalculator.js";
import { parseBalancedEquation, stoichiometry } from "../calculators/stoichiometry.js";
import type { StochEquationObject, StochTermObject } from "../calculators/stoichiometry.js";
import { HtmlSanitizer } from "../htmlSanitizer.js";
import { sanitizeId } from "../equationFormatter.js";

const INPUT_CONTAINER_ID = "stoich-inputs";
const RESULT_ELEMENT_ID = "stoich-result";
const TYPE_SELECT_ID = "calculation-type";

function calculationType(): string {
    return (document.getElementById(TYPE_SELECT_ID) as HTMLSelectElement).value;
}

function optionsHtml(terms: StochTermObject[]): string {
    let html = "";
    for (let i = 0; i < terms.length; i++) {
        let esc = HtmlSanitizer.escape(terms[i].formula);
        html = html + "<option value=\"" + esc + "\">" + esc + "</option>";
    }
    return html;
}

function molesInputsHtml(reactants: StochTermObject[]): string {
    let html = "";
    for (let i = 0; i < reactants.length; i++) {
        let formula = reactants[i].formula;
        let sanitizedId = sanitizeId(formula);
        let esc = HtmlSanitizer.escape(formula);
        html = html + "<label for=\"moles-" + sanitizedId + "\">Moles of " + esc + "</label><input type=\"number\" id=\"moles-" + sanitizedId + "\" placeholder=\"Moles of " + esc + "\" min=\"0\" step=\"any\">";
    }
    return html;
}

/**
 * Rebuilds the legacy `#stoich-inputs` container with the inputs the given
 * calculation type needs: species selects for the two conversion modes, one
 * moles input per reactant plus a product select for the limiting-reactant
 * mode. An unknown calculation type leaves the container empty.
 */
export function buildStoichInputContainer(containerId: string, parsed: StochEquationObject, calculationType: string): void {
    let inputsDiv = document.getElementById(containerId) as HTMLElement;
    inputsDiv.innerHTML = "";
    if (calculationType === "product-from-reactant") {
        let molesInput = "<input type=\"number\" id=\"reactant-moles\" placeholder=\"Moles of reactant\" min=\"0\" step=\"any\">";
        inputsDiv.innerHTML = "<label for=\"reactant-select\">Select reactant</label>" +
            "<select id=\"reactant-select\">" + optionsHtml(parsed.reactants) + "</select>" +
            "<label for=\"reactant-moles\">Enter moles</label>" + molesInput +
            "<label for=\"product-select\">Select product</label>" +
            "<select id=\"product-select\">" + optionsHtml(parsed.products) + "</select>";
        inputsDiv.classList.add("show");
    }
    else if (calculationType === "reactant-from-product") {
        let molesInput = "<input type=\"number\" id=\"product-moles\" placeholder=\"Moles of product\" min=\"0\" step=\"any\">";
        inputsDiv.innerHTML = "<label for=\"product-select\">Select product</label>" +
            "<select id=\"product-select\">" + optionsHtml(parsed.products) + "</select>" +
            "<label for=\"product-moles\">Enter moles</label>" + molesInput +
            "<label for=\"reactant-select\">Select reactant</label>" +
            "<select id=\"reactant-select\">" + optionsHtml(parsed.reactants) + "</select>";
        inputsDiv.classList.add("show");
    }
    else if (calculationType === "limiting-reactant") {
        inputsDiv.innerHTML = molesInputsHtml(parsed.reactants) +
            "<label for=\"product-select\">Select product to calculate</label>" +
            "<select id=\"product-select\">" + optionsHtml(parsed.products) + "</select>";
        inputsDiv.classList.add("show");
    }
}

function selectValue(id: string): string {
    return (document.getElementById(id) as HTMLSelectElement).value;
}

/** Reads a moles input, flagging it with the legacy "error" class when it is not a positive number. */
function readMoles(id: string): string {
    let input = document.getElementById(id) as HTMLInputElement;
    let moles = parseFloat(input.value);
    if (isNaN(moles) || moles <= 0) {
        input.classList.add("error");
    }
    else {
        input.classList.remove("error");
    }
    return input.value;
}

/** Collects the element ids the legacy page owned into the pure input record. */
function readInputs(equation: string, type: string, reactants: StochTermObject[]): Record<string, string> {
    let inputs: Record<string, string> = { "equation": equation, "calculation-type": type };
    if (type === "product-from-reactant") {
        inputs["reactant-select"] = selectValue("reactant-select");
        inputs["reactant-moles"] = readMoles("reactant-moles");
        inputs["product-select"] = selectValue("product-select");
    }
    else if (type === "reactant-from-product") {
        inputs["product-select"] = selectValue("product-select");
        inputs["product-moles"] = readMoles("product-moles");
        inputs["reactant-select"] = selectValue("reactant-select");
    }
    else if (type === "limiting-reactant") {
        for (let i = 0; i < reactants.length; i++) {
            let formula = reactants[i].formula;
            inputs["moles-" + sanitizeId(formula)] = readMoles("moles-" + sanitizeId(formula));
        }
        inputs["product-select"] = selectValue("product-select");
    }
    return inputs;
}

/**
 * Legacy DOM path for the stoichiometry form. It reads the element ids the
 * old page wiring owned, delegates the math to the pure API in
 * ../calculators/stoichiometry.js, and renders what the legacy view
 * rendered. The component-driven UI in src/solid/ calls the pure API
 * directly and never instantiates this class.
 *
 * Unlike the other legacy bridges this one keeps the old contract of
 * throwing on invalid input instead of rendering an error banner: the
 * legacy tests drive both outcomes through the thrown message.
 */
export class StoichiometryCalculatorDom extends Calculator {
    private equation: string = "";

    constructor() {
        super(RESULT_ELEMENT_ID, []);
    }

    public setEquation(equation: string): void {
        this.equation = equation;
    }

    /** Rebuilds the dynamic input section for the selected calculation type. */
    public getCalculationType(equation: string): void {
        buildStoichInputContainer(INPUT_CONTAINER_ID, parseBalancedEquation(equation), calculationType());
    }

    /** Runs the calculation and renders the outcome, propagating input errors. */
    public runCalculation(): void {
        this.performCalculation();
    }

    protected performCalculation(): void {
        let type = calculationType();
        let inputs = readInputs(this.equation, type, parseBalancedEquation(this.equation).reactants);
        let result: CalculatorResult = stoichiometry(inputs);
        this.resultDisplay.showResult("<p>" + result.value + "</p>");
    }
}

export function getCalculationType(equation: string): void {
    let calc = new StoichiometryCalculatorDom();
    calc.getCalculationType(equation);
}

export function calculateStoichiometry(equation: string): void {
    let calc = new StoichiometryCalculatorDom();
    calc.setEquation(equation);
    calc.runCalculation();
}
