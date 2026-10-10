import type { ChemicalElement } from "../types.js";
import { PureCalculator } from "./calculators/pureCalculator.js";
import type { CalculatorResult } from "./calculators/pureCalculator.js";
import { bondType } from "./calculators/bondType.js";
import { InputElement } from "./inputElement.js";
import { ResultDisplay } from "./resultDisplay.js";

/**
 * Predicts the type of chemical bond formed between two elements based on
 * their electronegativity difference and element types. The periodic table
 * data is injected through the constructor, which makes the class DOM-free:
 * instantiating it never touches the document.
 */
export class BondTypePredictor extends PureCalculator {
    private elementsData: ChemicalElement[];

    constructor(elementsData: ChemicalElement[]) {
        super();
        this.elementsData = elementsData;
    }

    protected getCalculatorId(): string {
        return "bond-type";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return bondType(
            inputs["element1-input"] ?? "",
            inputs["element2-input"] ?? "",
            this.elementsData
        );
    }
}

function readInputs(): Record<string, string> {
    return {
        "element1-input": new InputElement("element1-input").getStringValue(),
        "element2-input": new InputElement("element2-input").getStringValue()
    };
}

/**
 * Backwards-compatible wrapper that creates a {@link BondTypePredictor}
 * instance and runs the calculation against the legacy element ids kept in
 * the pre-migration index.html wiring. A failed run is reported through the
 * same "Error: …" banner the old DOM calculators rendered.
 */
export function predictBondType(elementsData: ChemicalElement[]): void {
    let display: ResultDisplay = new ResultDisplay("bond-type-result");
    let inputs: Record<string, string>;
    try {
        inputs = readInputs();
    } catch (error) {
        display.showError((error as Error).message);
        return;
    }
    let result: CalculatorResult = new BondTypePredictor(elementsData).calculatePure(inputs);
    let explanation: string = result.explanation ?? "";
    if (explanation.startsWith("Error")) {
        display.showError(explanation.slice("Error: ".length));
        return;
    }
    display.showResult("<p>" + result.value + "</p>");
}
