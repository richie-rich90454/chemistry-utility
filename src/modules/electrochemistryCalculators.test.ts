import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    calculateCellPotential,
    calculateNernst,
    calculateElectrolysis,
} from "./electrochemistryCalculators";

const FARADAY = 96485;
const GAS_R = 8.314;

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

function setOrCreateSelect(id: string, value: string, parentId: string, optionValues?: string[]) {
    let select = document.getElementById(id) as HTMLSelectElement | null;
    if (!select) {
        select = document.createElement("select");
        select.id = id;
        const opts = optionValues || [value];
        for (const v of opts) {
            const o = document.createElement("option");
            o.value = v;
            o.textContent = v;
            select.appendChild(o);
        }
        document.getElementById(parentId)!.appendChild(select);
    }
    select.value = value;
}

function getResultHTML(id: string): string {
    const el = document.getElementById(id);
    return el ? el.innerHTML : "";
}

describe("electrochemistryCalculators", () => {
    beforeEach(() => {
        // cell-potential section
        const cpDiv = document.createElement("div");
        cpDiv.id = "cell-potential";
        const cpResult = document.createElement("div");
        cpResult.id = "cell-potential-result";
        cpDiv.appendChild(cpResult);
        document.body.appendChild(cpDiv);

        // nernst section
        const nDiv = document.createElement("div");
        nDiv.id = "nernst-equation";
        const nResult = document.createElement("div");
        nResult.id = "nernst-result";
        nDiv.appendChild(nResult);
        document.body.appendChild(nDiv);

        // electrolysis section
        const eDiv = document.createElement("div");
        eDiv.id = "electrolysis";
        const eResult = document.createElement("div");
        eResult.id = "electrolysis-result";
        eDiv.appendChild(eResult);
        document.body.appendChild(eDiv);
    });

    afterEach(() => {
        ["cell-potential", "nernst-equation", "electrolysis"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    });

    describe("calculateCellPotential", () => {
        it("should calculate E_cell = 1.10 V for Cu (0.34) and Zn (-0.76)", () => {
            setOrCreateInput("E1", "0.34", "cell-potential");
            setOrCreateInput("E2", "-0.76", "cell-potential");
            calculateCellPotential();
            const html = getResultHTML("cell-potential-result");
            expect(html).toContain("1.100");
            expect(html).toContain("0.34");
            expect(html).toContain("-0.76");
        });

        it("should calculate E_cell = 3.51 V for Ag (0.80) and Na (-2.71)", () => {
            setOrCreateInput("E1", "0.80", "cell-potential");
            setOrCreateInput("E2", "-2.71", "cell-potential");
            calculateCellPotential();
            const html = getResultHTML("cell-potential-result");
            expect(html).toContain("3.510");
        });

        it("should return E_cell = 0 when both potentials are the same", () => {
            setOrCreateInput("E1", "1.23", "cell-potential");
            setOrCreateInput("E2", "1.23", "cell-potential");
            calculateCellPotential();
            const html = getResultHTML("cell-potential-result");
            expect(html).toContain("0.000");
        });

        it("should show error for invalid (NaN) inputs", () => {
            setOrCreateInput("E1", "abc", "cell-potential");
            setOrCreateInput("E2", "0.5", "cell-potential");
            calculateCellPotential();
            const html = getResultHTML("cell-potential-result");
            expect(html).toContain("Please enter valid numbers");
        });
    });

    describe("calculateNernst", () => {
        it("should return E = E_standard when Q = 1 (standard conditions)", () => {
            setOrCreateInput("E-standard", "1.10", "nernst-equation");
            setOrCreateInput("temperature", "298", "nernst-equation");
            setOrCreateInput("n-electrons", "2", "nernst-equation");
            setOrCreateInput("Q-reaction", "1", "nernst-equation");
            calculateNernst();
            const html = getResultHTML("nernst-result");
            // E = E_standard - (R*T)/(n*F)*ln(1) = E_standard - 0 = E_standard
            expect(html).toContain("1.100");
        });

        it("should compute correct E for non-standard Q", () => {
            setOrCreateInput("E-standard", "1.10", "nernst-equation");
            setOrCreateInput("temperature", "298", "nernst-equation");
            setOrCreateInput("n-electrons", "2", "nernst-equation");
            setOrCreateInput("Q-reaction", "10", "nernst-equation");
            calculateNernst();
            const html = getResultHTML("nernst-result");
            const expected = 1.1 - (GAS_R * 298) / (2 * FARADAY) * Math.log(10);
            expect(html).toContain(expected.toFixed(3));
        });

        it("should show error when Q <= 0", () => {
            setOrCreateInput("E-standard", "1.10", "nernst-equation");
            setOrCreateInput("temperature", "298", "nernst-equation");
            setOrCreateInput("n-electrons", "2", "nernst-equation");
            setOrCreateInput("Q-reaction", "0", "nernst-equation");
            calculateNernst();
            const html = getResultHTML("nernst-result");
            expect(html).toContain("Please enter valid positive numbers");
        });

        it("should show error when n <= 0", () => {
            setOrCreateInput("E-standard", "1.10", "nernst-equation");
            setOrCreateInput("temperature", "298", "nernst-equation");
            setOrCreateInput("n-electrons", "0", "nernst-equation");
            setOrCreateInput("Q-reaction", "1", "nernst-equation");
            calculateNernst();
            const html = getResultHTML("nernst-result");
            expect(html).toContain("Please enter valid positive numbers");
        });

        it("should show error when T <= 0", () => {
            setOrCreateInput("E-standard", "1.10", "nernst-equation");
            setOrCreateInput("temperature", "-10", "nernst-equation");
            setOrCreateInput("n-electrons", "2", "nernst-equation");
            setOrCreateInput("Q-reaction", "1", "nernst-equation");
            calculateNernst();
            const html = getResultHTML("nernst-result");
            expect(html).toContain("Please enter valid positive numbers");
        });
    });

    describe("calculateElectrolysis", () => {
        // The source reads ALL inputs upfront, so we must create all of them
        function setupElectrolysisInputs(solveFor: string, values: { m?: string; I?: string; t?: string; z?: string; M?: string }) {
            setOrCreateSelect("electrolysis-solve-for", solveFor, "electrolysis", ["mass", "current", "time"]);
            setOrCreateInput("electrolysis-m", values.m ?? "1", "electrolysis");
            setOrCreateInput("electrolysis-I", values.I ?? "1", "electrolysis");
            setOrCreateInput("electrolysis-t", values.t ?? "1", "electrolysis");
            setOrCreateInput("electrolysis-z", values.z ?? "1", "electrolysis");
            setOrCreateInput("electrolysis-M", values.M ?? "1", "electrolysis");
        }

        it("should solve for mass: I=1A, t=96500s, z=1, M=63.5 → m≈63.5g", () => {
            setupElectrolysisInputs("mass", { I: "1", t: "96500", z: "1", M: "63.5" });
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            const expectedMass = (1 * 96500) / (FARADAY * 1) * 63.5;
            expect(html).toContain(expectedMass.toFixed(3));
        });

        it("should solve for current: m=63.5, t=96500, z=1, M=63.5 → I≈1A", () => {
            setupElectrolysisInputs("current", { m: "63.5", t: "96500", z: "1", M: "63.5" });
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            const expectedCurrent = (63.5 / 63.5) * FARADAY * 1 / 96500;
            expect(html).toContain(expectedCurrent.toFixed(3));
        });

        it("should solve for time: m=63.5, I=1, z=1, M=63.5 → t≈96500s", () => {
            setupElectrolysisInputs("time", { m: "63.5", I: "1", z: "1", M: "63.5" });
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            const expectedTime = (63.5 / 63.5) * FARADAY * 1 / 1;
            expect(html).toContain(expectedTime.toFixed(3));
        });

        it("should show error when I <= 0 for mass solve", () => {
            setupElectrolysisInputs("mass", { I: "0", t: "96500", z: "1", M: "63.5" });
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("Please enter valid positive numbers");
        });

        it("should show error when t <= 0 for mass solve", () => {
            setupElectrolysisInputs("mass", { I: "1", t: "-5", z: "1", M: "63.5" });
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("Please enter valid positive numbers");
        });

        it("should show error when z <= 0 for mass solve", () => {
            setupElectrolysisInputs("mass", { I: "1", t: "96500", z: "0", M: "63.5" });
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("Please enter valid positive numbers");
        });

        it("should show error when M <= 0 for mass solve", () => {
            setupElectrolysisInputs("mass", { I: "1", t: "96500", z: "1", M: "-10" });
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("Please enter valid positive numbers");
        });

        it("should show error when m <= 0 for current solve", () => {
            setupElectrolysisInputs("current", { m: "0", t: "96500", z: "1", M: "63.5" });
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("Please enter valid positive numbers");
        });

        it("should show error when m <= 0 for time solve", () => {
            setupElectrolysisInputs("time", { m: "-5", I: "1", z: "1", M: "63.5" });
            calculateElectrolysis();
            const html = getResultHTML("electrolysis-result");
            expect(html).toContain("Please enter valid positive numbers");
        });
    });
});
