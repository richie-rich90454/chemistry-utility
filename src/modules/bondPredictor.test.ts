import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { predictBondType } from "./bondPredictor";
import { mockElements } from "../test/elementsData";
import type { ChemicalElement } from "../types";

function setOrCreateInput(id: string, value: string, parentId: string) {
    let input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) {
        input = document.createElement("input");
        input.id = id;
        document.getElementById(parentId)!.appendChild(input);
    }
    input.value = value;
    input.classList.remove("error");
}

function getResultHTML(id: string): string {
    const el = document.getElementById(id);
    return el ? el.innerHTML : "";
}

describe("bondPredictor", () => {
    beforeEach(() => {
        const container = document.createElement("div");
        container.id = "bond-predictor";
        const resultDiv = document.createElement("div");
        resultDiv.id = "bond-type-result";
        container.appendChild(resultDiv);
        document.body.appendChild(container);
    });

    afterEach(() => {
        const el = document.getElementById("bond-predictor");
        if (el) el.remove();
    });

    it("should predict Metallic bond for Metal + Metal (Na + Ca)", () => {
        setOrCreateInput("element1-input", "Na", "bond-predictor");
        setOrCreateInput("element2-input", "Ca", "bond-predictor");
        predictBondType(mockElements);
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("Metallic");
    });

    it("should predict Ionic bond for Metal + Non-metal (Na + Cl)", () => {
        setOrCreateInput("element1-input", "Na", "bond-predictor");
        setOrCreateInput("element2-input", "Cl", "bond-predictor");
        predictBondType(mockElements);
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("Ionic");
    });

    it("should predict Polar Covalent bond for Non-metal + Non-metal with high deltaEN (H + O)", () => {
        setOrCreateInput("element1-input", "H", "bond-predictor");
        setOrCreateInput("element2-input", "O", "bond-predictor");
        predictBondType(mockElements);
        const html = getResultHTML("bond-type-result");
        // H=2.20, O=3.44, deltaEN=1.24 → since one is not metal and deltaEN < 1.7, it's Polar Covalent
        expect(html).toContain("Polar Covalent");
    });

    it("should predict Polar Covalent for C + O (deltaEN = 0.89)", () => {
        setOrCreateInput("element1-input", "C", "bond-predictor");
        setOrCreateInput("element2-input", "O", "bond-predictor");
        predictBondType(mockElements);
        const html = getResultHTML("bond-type-result");
        // C=2.55, O=3.44, deltaEN=0.89 → 0.4 <= 0.89 < 1.7, both non-metals → Polar Covalent
        expect(html).toContain("Polar Covalent");
    });

    it("should predict Nonpolar Covalent for same element (deltaEN = 0)", () => {
        setOrCreateInput("element1-input", "H", "bond-predictor");
        setOrCreateInput("element2-input", "H", "bond-predictor");
        predictBondType(mockElements);
        const html = getResultHTML("bond-type-result");
        // Same element: deltaEN=0 → Nonpolar Covalent
        expect(html).toContain("Nonpolar Covalent");
    });

    it("should handle case-insensitive input (na + cl)", () => {
        setOrCreateInput("element1-input", "na", "bond-predictor");
        setOrCreateInput("element2-input", "cl", "bond-predictor");
        predictBondType(mockElements);
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("Ionic");
    });

    it("should show error for missing element", () => {
        setOrCreateInput("element1-input", "Xx", "bond-predictor");
        setOrCreateInput("element2-input", "Na", "bond-predictor");
        predictBondType(mockElements);
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("Error");
        expect(html).toContain("not found");
    });

    it("should handle element with null electronegativity gracefully", () => {
        const elementsWithNullEN: ChemicalElement[] = [
            ...mockElements,
            {
                atomicNumber: 999,
                symbol: "Zz",
                name: "TestElement",
                atomicMass: 1,
                type: "non-metal",
                period: 1,
                group: 1,
                electronegativity: null,
                electronAffinity: null,
                atomicRadius: null,
                ionizationEnergy: null,
                valenceElectrons: 1,
                totalElectrons: 1,
            },
        ];
        setOrCreateInput("element1-input", "Zz", "bond-predictor");
        setOrCreateInput("element2-input", "H", "bond-predictor");
        predictBondType(elementsWithNullEN);
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("unavailable electronegativity data");
    });

    it("should show error when inputs are empty", () => {
        setOrCreateInput("element1-input", "", "bond-predictor");
        setOrCreateInput("element2-input", "", "bond-predictor");
        predictBondType(mockElements);
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("Error");
        expect(html).toContain("enter both element symbols");
    });
});
