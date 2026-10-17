// @vitest-environment jsdom
import {describe, it, expect, afterEach} from "vitest";
import {
    DilutionCalculator,
    calculateDilution,
} from "./solutionCalculators.js";
import {createContainer, createInput, createSelect, createResultDiv, getResultText} from "../test/helpers.js";

function dilutionDom(solveFor: string, M1: string, V1: string, M2: string, V2: string): void {
    document.body.innerHTML = "";
    createContainer("dilution-calc");
    createResultDiv("dilution-result", "dilution-calc");
    createSelect("dilution-solve-for", solveFor, ["M1", "V1", "M2", "V2", "bogus"], "dilution-calc");
    createInput("dilution-M1", M1, "dilution-calc");
    createInput("dilution-V1", V1, "dilution-calc");
    createInput("dilution-M2", M2, "dilution-calc");
    createInput("dilution-V2", V2, "dilution-calc");
}

function dilutionPure(solveFor: string, M1: string, V1: string, M2: string, V2: string) {
    document.body.innerHTML = "";
    const result = document.createElement("div");
    result.id = "dilution-result";
    document.body.appendChild(result);
    return new DilutionCalculator().calculatePure({
        "dilution-solve-for": solveFor,
        "dilution-M1": M1,
        "dilution-V1": V1,
        "dilution-M2": M2,
        "dilution-V2": V2,
    });
}

describe("solutionDomCoverage: Dilution branches", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("DOM solves each variable and rejects bad solveFor", () => {
        
        dilutionDom("M1", "", "1", "0.5", "4");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("2.0000");
        dilutionDom("V1", "6", "", "2", "500");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("166.6667");
        dilutionDom("M2", "2", "1", "", "4");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("0.5000");
        dilutionDom("V2", "6", "100", "2", "");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("300.0000");
        dilutionDom("bogus", "6", "100", "2", "");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
    });

    it("DOM rejects non-positive inputs per branch", () => {
        
        dilutionDom("M1", "", "0", "0.5", "4");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("M1", "", "1", "0", "4");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("M1", "", "1", "0.5", "0");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("V1", "0", "", "2", "500");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("V1", "6", "", "0", "500");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("V1", "6", "", "2", "0");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("M2", "0", "1", "", "4");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("M2", "2", "0", "", "4");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("M2", "2", "1", "", "0");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("V2", "0", "100", "2", "");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("V2", "6", "0", "2", "");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("V2", "6", "100", "0", "");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
    });

    it("DOM rejects missing inputs per branch", () => {
        
        dilutionDom("M1", "", "", "0.5", "4");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("V1", "", "", "2", "500");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("M2", "", "", "0.5", "4");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
        dilutionDom("V2", "", "100", "2", "");
        calculateDilution();
        expect(getResultText("dilution-result")).toContain("Error");
    });

    it("pure mirrors the DOM branches", () => {
        expect(dilutionPure("M1", "", "1", "0.5", "4").value).toContain("2.0000");
        expect(dilutionPure("V1", "6", "", "2", "500").value).toContain("166.6667");
        expect(dilutionPure("M2", "2", "1", "", "4").value).toContain("0.5000");
        expect(dilutionPure("V2", "6", "100", "2", "").value).toContain("300.0000");
        expect(dilutionPure("bogus", "6", "100", "2", "").explanation).toContain("Error");
        expect(dilutionPure("M1", "", "", "0.5", "4").explanation).toContain("Error");
        expect(dilutionPure("V1", "", "", "2", "500").explanation).toContain("Error");
        expect(dilutionPure("M2", "", "", "0.5", "4").explanation).toContain("Error");
        expect(dilutionPure("V2", "", "100", "2", "").explanation).toContain("Error");
        expect(dilutionPure("M1", "", "0", "0.5", "4").explanation).toContain("Error");
        expect(dilutionPure("V1", "0", "", "2", "500").explanation).toContain("Error");
        expect(dilutionPure("M2", "0", "1", "", "4").explanation).toContain("Error");
        expect(dilutionPure("V2", "6", "0", "2", "").explanation).toContain("Error");
    });
});
