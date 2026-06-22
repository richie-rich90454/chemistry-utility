import {ChemicalElement} from "../types.js";
import {Calculator} from "./calculator.js";

/**
 * Predicts the type of chemical bond formed between two elements based on
 * their electronegativity difference and element types. Extends the
 * {@link Calculator} template-method base class.
 */
export class BondTypePredictor extends Calculator {
	private elementsData: ChemicalElement[];

	constructor(elementsData: ChemicalElement[]) {
		super("bond-type-result", ["element1-input", "element2-input"]);
		this.elementsData = elementsData;
	}

	protected performCalculation(): void {
		let element1Input = this.getInput("element1-input");
		let element2Input = this.getInput("element2-input");
		let element1Value = element1Input.getStringValue().trim();
		let element2Value = element2Input.getStringValue().trim();
		if (!element1Value || !element2Value) {
			element1Input.markError();
			element2Input.markError();
			throw new Error("Please enter both element symbols");
		}
		element1Value = element1Value.charAt(0).toUpperCase() + element1Value.slice(1).toLowerCase();
		element2Value = element2Value.charAt(0).toUpperCase() + element2Value.slice(1).toLowerCase();
		let element1: ChemicalElement | null = null;
		let element2: ChemicalElement | null = null;
		for (let i = 0; i < this.elementsData.length; i++) {
			let currentElement = this.elementsData[i];
			if (currentElement.symbol == element1Value) {
				element1 = currentElement;
			}
			if (currentElement.symbol == element2Value) {
				element2 = currentElement;
			}
			if (element1 != null && element2 != null) {
				break;
			}
		}
		if (!element1 || !element2) {
			element1Input.markError();
			element2Input.markError();
			throw new Error("One or both elements not found in periodic table");
		}
		let en1 = element1.electronegativity;
		let en2 = element2.electronegativity;
		if (en1 == null || en2 == null) {
			this.resultDisplay.showResult("<p>Bond prediction not possible due to unavailable electronegativity data</p>");
			return;
		}
		let deltaEN = this.numberFormatter.format(Math.abs(en1 - en2), 2);
		let type1 = element1.type.toLowerCase();
		let type2 = element2.type.toLowerCase();
		let isMetal1 = (type1 == "lanthanide" || type1 == "actinide" || (type1.indexOf("metal") != -1 && type1 != "metalloid" && type1 != "non-metal"));
		let isMetal2 = (type2 == "lanthanide" || type2 == "actinide" || (type2.indexOf("metal") != -1 && type2 != "metalloid" && type2 != "non-metal"));
		let bondType: string;
		if (isMetal1 && isMetal2) {
			bondType = "Metallic";
		}
		else if (isMetal1 != isMetal2 || parseFloat(deltaEN) >= 1.7) {
			bondType = "Ionic";
		}
		else if (parseFloat(deltaEN) >= .4) {
			bondType = "Polar Covalent";
		}
		else {
			bondType = "Nonpolar Covalent";
		}
		let result = "<p>" + element1.symbol + " (" + en1 + ") and " + element2.symbol + " (" + en2 + ") -> ΔEN=" + deltaEN + " -> " + bondType + " bond</p>";
		this.resultDisplay.showResult(result);
	}
}

/**
 * Backwards-compatible wrapper that creates a {@link BondTypePredictor}
 * instance and runs the calculation.
 */
export function predictBondType(elementsData: ChemicalElement[]): void {
	let predictor = new BondTypePredictor(elementsData);
	predictor.calculate();
}
