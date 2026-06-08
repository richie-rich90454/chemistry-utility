import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { calculateCellPotential, calculateNernst, calculateElectrolysis } from "./electrochemistryCalculators.js";
import { createContainer, createInput, createSelect, createResultDiv, cleanupDOM, getResultHTML } from "../test/helpers.js";

describe("Electrochemistry Edge Cases", () => {
    afterEach(() => {
        cleanupDOM();
    });

    describe("Cell Potential", () => {
        beforeEach(() => {
            createContainer("cell-potential");
            createInput("E1", "0.34", "cell-potential");
            createInput("E2", "-0.76", "cell-potential");
            createResultDiv("cell-potential-result", "cell-potential");
        });

        it("should return E_cell = 0 when E1 and E2 are equal", () => {
            const e1 = document.getElementById("E1") as HTMLInputElement;
            const e2 = document.getElementById("E2") as HTMLInputElement;
            e1.value = "1.23";
            e2.value = "1.23";
            calculateCellPotential();
            const html = getResultHTML("cell-potential-result");
            expect(html).toContain("0.000");
        });

        it("should handle negative values for both potentials", () => {
            const e1 = document.getElementById("E1") as HTMLInputElement;
            const e2 = document.getElementById("E2") as HTMLInputElement;
            e1.value = "-0.76";
            e2.value = "-2.37";
            calculateCellPotential();
            const html = getResultHTML("cell-potential-result");
            expect(html).toContain("1.610");
        });

        it("should show error when one input is NaN", () => {
            const e1 = document.getElementById("E1") as HTMLInputElement;
            e1.value = "abc";
            calculateCellPotential();
            const html = getResultHTML("cell-potential-result");
            expect(html).toContain("Please enter valid numbers for both potentials");
        });

        it("should show error when both inputs are NaN", () => {
            const e1 = document.getElementById("E1") as HTMLInputElement;
            const e2 = document.getElementById("E2") as HTMLInputElement;
            e1.value = "abc";
            e2.value = "xyz";
            calculateCellPotential();
            const html = getResultHTML("cell-potential-result");
            expect(html).toContain("Please enter valid numbers for both potentials");
        });
    });

    describe("Nernst Equation", () => {
        beforeEach(() => {
            createContainer("nernst-equation");
            createInput("E-standard", "1.10", "nernst-equation");
            createInput("temperature", "298", "nernst-equation");
            createInput("n-electrons", "2", "nernst-equation");
            createInput("Q-reaction", "1", "nernst-equation");
            createResultDiv("nernst-result", "nernst-equation");
        });

        it("should return E = E_standard when Q = 1 (standard conditions)", () => {
            calculateNernst();
            const html = getResultHTML("nernst-result");
            expect(html).toContain("1.100");
        });

        it("should show error when T = 0", () => {
            const temp = document.getElementById("temperature") as HTMLInputElement;
            temp.value = "0";
            calculateNernst();
            const html = getResultHTML("nernst-result");
            expect(html).toContain("Please enter valid positive numbers for all fields");
        });

        it("should show error when n = 0", () => {
            const n = document.getElementById("n-electrons") as HTMLInputElement;
            n.value = "0";
            calculateNernst();
            const html = getResultHTML("nernst-result");
            expect(html).toContain("Please enter valid positive numbers for all fields");
        });

        it("should show error when Q = 0", () => {
            const q = document.getElementById("Q-reaction") as HTMLInputElement;
            q.value = "0";
            calculateNernst();
            const html = getResultHTML("nernst-result");
            expect(html).toContain("Please enter valid positive numbers for all fields");
        });

        it("should show error when T is negative", () => {
            const temp = document.getElementById("temperature") as HTMLInputElement;
            temp.value = "-50";
            calculateNernst();
            const html = getResultHTML("nernst-result");
            expect(html).toContain("Please enter valid positive numbers for all fields");
        });
    });

    describe("Electrolysis", () => {
        beforeEach(() => {
            createContainer("electrolysis");
            createInput("electrolysis-m", "0", "electrolysis");
            createInput("electrolysis-I", "2", "electrolysis");
            createInput("electrolysis-t", "3600", "electrolysis");
            createInput("electrolysis-z", "1", "electrolysis");
            createInput("electrolysis-M", "63.546", "electrolysis");
            createSelect("electrolysis-solve-for", "mass", ["mass", "current", "time"], "electrolysis");
            createResultDiv("electrolysis-result", "electrolysis");
        });

        it("should solve for mass with valid inputs", () => {
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("4.742");
        });

        it("should solve for current with valid inputs", () => {
            const m = document.getElementById("electrolysis-m") as HTMLInputElement;
            m.value = "4.746";
            const select = document.getElementById("electrolysis-solve-for") as HTMLSelectElement;
            select.value = "current";
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("2.002");
        });

        it("should solve for time with valid inputs", () => {
            const m = document.getElementById("electrolysis-m") as HTMLInputElement;
            m.value = "4.746";
            const select = document.getElementById("electrolysis-solve-for") as HTMLSelectElement;
            select.value = "time";
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("3603.042");
        });

        it("should show error when current is zero (solving for mass)", () => {
            const current = document.getElementById("electrolysis-I") as HTMLInputElement;
            current.value = "0";
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("Please enter valid positive numbers for I, t, z, and M");
        });

        it("should show error when mass is negative (solving for current)", () => {
            const m = document.getElementById("electrolysis-m") as HTMLInputElement;
            m.value = "-5";
            const select = document.getElementById("electrolysis-solve-for") as HTMLSelectElement;
            select.value = "current";
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("Please enter valid positive numbers for m, t, z, and M");
        });

        it("should show error with NaN inputs (solving for time)", () => {
            const m = document.getElementById("electrolysis-m") as HTMLInputElement;
            m.value = "abc";
            const select = document.getElementById("electrolysis-solve-for") as HTMLSelectElement;
            select.value = "time";
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("Please enter valid positive numbers for m, I, z, and M");
        });

        it("handles zero molar mass in mass mode", () => {
            (document.getElementById("electrolysis-m") as HTMLInputElement).value = "0";
            (document.getElementById("electrolysis-I") as HTMLInputElement).value = "2";
            (document.getElementById("electrolysis-t") as HTMLInputElement).value = "3600";
            (document.getElementById("electrolysis-z") as HTMLInputElement).value = "1";
            (document.getElementById("electrolysis-M") as HTMLInputElement).value = "0";
            (document.getElementById("electrolysis-solve-for") as HTMLSelectElement).value = "mass";
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("valid positive numbers");
        });
    });
});
