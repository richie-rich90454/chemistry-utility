import type { ChemicalElement } from "../../types.js";
import { NumberFormatter } from "../i18n/numberFormatter.js";
import type { CalculatorResult } from "./pureCalculator.js";

function formatter(): NumberFormatter {
    return NumberFormatter.createFromCurrentLocale();
}

function isMetal(type: string): boolean {
    return type == "lanthanide" || type == "actinide" || (type.indexOf("metal") != -1 && type != "metalloid" && type != "non-metal");
}

/**
 * Predicts the type of chemical bond formed between two elements from their
 * electronegativity difference and element types. Element symbols are
 * matched case-insensitively against the supplied periodic table data.
 */
export function bondType(element1Symbol: string, element2Symbol: string, elements: ChemicalElement[]): CalculatorResult {
    let element1Value: string = element1Symbol.trim();
    let element2Value: string = element2Symbol.trim();
    if (!element1Value || !element2Value) {
        throw new Error("Please enter both element symbols");
    }
    element1Value = element1Value.charAt(0).toUpperCase() + element1Value.slice(1).toLowerCase();
    element2Value = element2Value.charAt(0).toUpperCase() + element2Value.slice(1).toLowerCase();
    let element1: ChemicalElement | null = null;
    let element2: ChemicalElement | null = null;
    for (let i = 0; i < elements.length; i++) {
        let currentElement: ChemicalElement = elements[i];
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
        throw new Error("One or both elements not found in periodic table");
    }
    let en1: number | null | undefined = element1.electronegativity;
    let en2: number | null | undefined = element2.electronegativity;
    if (en1 == null || en2 == null) {
        return {
            value: "Bond prediction not possible due to unavailable electronegativity data",
            explanation: "Element " + element1.symbol + " or " + element2.symbol + " has null electronegativity; cannot compute ΔEN.",
            metadata: {
                element1: element1.symbol,
                element2: element2.symbol,
                en1: en1,
                en2: en2
            }
        };
    }
    let deltaENValue: number = Math.abs(en1 - en2);
    let deltaEN: string = formatter().format(deltaENValue, 2);
    let isMetal1: boolean = isMetal(element1.type.toLowerCase());
    let isMetal2: boolean = isMetal(element2.type.toLowerCase());
    let type: string;
    if (isMetal1 && isMetal2) {
        type = "Metallic";
    }
    else if (isMetal1 != isMetal2 || deltaENValue >= 1.7) {
        type = "Ionic";
    }
    else if (deltaENValue >= .4) {
        type = "Polar Covalent";
    }
    else {
        type = "Nonpolar Covalent";
    }
    return {
        value: element1.symbol + " (" + en1 + ") and " + element2.symbol + " (" + en2 + ") -> ΔEN=" + deltaEN + " -> " + type + " bond",
        explanation: "ΔEN = |EN(" + element1.symbol + ") - EN(" + element2.symbol + ")| = |" + en1 + " - " + en2 + "| = " + deltaEN + "; isMetal1=" + isMetal1 + ", isMetal2=" + isMetal2 + " -> " + type,
        metadata: {
            element1: element1.symbol,
            element2: element2.symbol,
            en1: en1,
            en2: en2,
            deltaEN: deltaENValue,
            bondType: type,
            isMetal1: isMetal1,
            isMetal2: isMetal2
        }
    };
}
