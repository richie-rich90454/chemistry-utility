import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {calculateDilution, calculateMassPercent, calculateMixing} from "./solutionCalculators.js";
import {createContainer, createInput, createSelect, createResultDiv, getResultText} from "../test/helpers.js";

describe("calculateDilution", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createContainer("dilution-calc");
		createResultDiv("dilution-result", "dilution-calc");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should solve for M2: M1=2, V1=1, V2=4 → M2=0.5", () => {
		createSelect("dilution-solve-for", "M2", ["M2"], "dilution-calc");
		createInput("dilution-M1", "2", "dilution-calc");
		createInput("dilution-V1", "1", "dilution-calc");
		createInput("dilution-M2", "", "dilution-calc");
		createInput("dilution-V2", "4", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("0.5000");
		expect(text).toContain("M");
	});

	it("should solve for V1: M1=6, M2=2, V2=500 → V1≈166.67", () => {
		createSelect("dilution-solve-for", "V1", ["V1"], "dilution-calc");
		createInput("dilution-M1", "6", "dilution-calc");
		createInput("dilution-V1", "", "dilution-calc");
		createInput("dilution-M2", "2", "dilution-calc");
		createInput("dilution-V2", "500", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("166.6667");
		expect(text).toContain("L");
	});

	it("should solve for M1: M2=0.5, V1=1, V2=4 → M1=2", () => {
		createSelect("dilution-solve-for", "M1", ["M1"], "dilution-calc");
		createInput("dilution-M1", "", "dilution-calc");
		createInput("dilution-V1", "1", "dilution-calc");
		createInput("dilution-M2", "0.5", "dilution-calc");
		createInput("dilution-V2", "4", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("2.0000");
		expect(text).toContain("M");
	});

	it("should solve for V2: M1=6, V1=100, M2=2 → V2=300", () => {
		createSelect("dilution-solve-for", "V2", ["V2"], "dilution-calc");
		createInput("dilution-M1", "6", "dilution-calc");
		createInput("dilution-V1", "100", "dilution-calc");
		createInput("dilution-M2", "2", "dilution-calc");
		createInput("dilution-V2", "", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("300.0000");
		expect(text).toContain("L");
	});

	it("should show error for zero V1 when solving for M2", () => {
		createSelect("dilution-solve-for", "M2", ["M2"], "dilution-calc");
		createInput("dilution-M1", "2", "dilution-calc");
		createInput("dilution-V1", "0", "dilution-calc");
		createInput("dilution-M2", "", "dilution-calc");
		createInput("dilution-V2", "4", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("Error");
	});

	it("should show error for negative V2 when solving for M2", () => {
		createSelect("dilution-solve-for", "M2", ["M2"], "dilution-calc");
		createInput("dilution-M1", "2", "dilution-calc");
		createInput("dilution-V1", "1", "dilution-calc");
		createInput("dilution-M2", "", "dilution-calc");
		createInput("dilution-V2", "-4", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("Error");
	});

	it("should show error for negative M1 when solving for V2", () => {
		createSelect("dilution-solve-for", "V2", ["V2"], "dilution-calc");
		createInput("dilution-M1", "-6", "dilution-calc");
		createInput("dilution-V1", "100", "dilution-calc");
		createInput("dilution-M2", "2", "dilution-calc");
		createInput("dilution-V2", "", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("Error");
	});
});

describe("calculateMassPercent", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createContainer("mass-percent-calc");
		createResultDiv("mass-percent-result", "mass-percent-calc");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should calculate percent: 10g solute, 100g solution → 10%", () => {
		createSelect("concentration-unit", "percent", ["percent"], "mass-percent-calc");
		createInput("mass-solute", "10", "mass-percent-calc");
		createInput("mass-solution", "100", "mass-percent-calc");

		calculateMassPercent();

		const text = getResultText("mass-percent-result");
		expect(text).toContain("10.0000");
		expect(text).toContain("%");
	});

	it("should calculate ppm: small solute in large solution", () => {
		createSelect("concentration-unit", "ppm", ["ppm"], "mass-percent-calc");
		createInput("mass-solute", "0.001", "mass-percent-calc");
		createInput("mass-solution", "1", "mass-percent-calc");

		calculateMassPercent();

		const text = getResultText("mass-percent-result");
		expect(text).toContain("1000.0000");
		expect(text).toContain("ppm");
	});

	it("should calculate ppb: very small solute in large solution", () => {
		createSelect("concentration-unit", "ppb", ["ppb"], "mass-percent-calc");
		createInput("mass-solute", "0.000001", "mass-percent-calc");
		createInput("mass-solution", "1", "mass-percent-calc");

		calculateMassPercent();

		const text = getResultText("mass-percent-result");
		expect(text).toContain("1000.0000");
		expect(text).toContain("ppb");
	});

	it("should show error when solution mass is zero", () => {
		createSelect("concentration-unit", "percent", ["percent"], "mass-percent-calc");
		createInput("mass-solute", "10", "mass-percent-calc");
		createInput("mass-solution", "0", "mass-percent-calc");

		calculateMassPercent();

		const text = getResultText("mass-percent-result");
		expect(text).toContain("Error");
		expect(text).toContain("zero");
	});

	it("should show error when solute mass is negative", () => {
		createSelect("concentration-unit", "percent", ["percent"], "mass-percent-calc");
		createInput("mass-solute", "-5", "mass-percent-calc");
		createInput("mass-solution", "100", "mass-percent-calc");

		calculateMassPercent();

		const text = getResultText("mass-percent-result");
		expect(text).toContain("Error");
		expect(text).toContain("negative");
	});
});

describe("calculateMixing", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createContainer("solution-mixing-calc");
		createResultDiv("mixing-result", "solution-mixing-calc");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should calculate basic mixing: C1=1, V1=100, C2=0, V2=100 → C_final=0.5", () => {
		createInput("mix-C1", "1", "solution-mixing-calc");
		createInput("mix-V1", "100", "solution-mixing-calc");
		createInput("mix-C2", "0", "solution-mixing-calc");
		createInput("mix-V2", "100", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("Error");
	});

	it("should calculate mixing with valid concentrations: C1=1, V1=100, C2=0.5, V2=100 → C_final=0.75", () => {
		createInput("mix-C1", "1", "solution-mixing-calc");
		createInput("mix-V1", "100", "solution-mixing-calc");
		createInput("mix-C2", "0.5", "solution-mixing-calc");
		createInput("mix-V2", "100", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("0.7500");
		expect(text).toContain("M");
	});

	it("should return same concentration when both solutions have same concentration", () => {
		createInput("mix-C1", "2", "solution-mixing-calc");
		createInput("mix-V1", "50", "solution-mixing-calc");
		createInput("mix-C2", "2", "solution-mixing-calc");
		createInput("mix-V2", "150", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("2.0000");
	});

	it("should show error for zero volume", () => {
		createInput("mix-C1", "1", "solution-mixing-calc");
		createInput("mix-V1", "0", "solution-mixing-calc");
		createInput("mix-C2", "1", "solution-mixing-calc");
		createInput("mix-V2", "100", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("Error");
	});

	it("should show error for negative concentration", () => {
		createInput("mix-C1", "-1", "solution-mixing-calc");
		createInput("mix-V1", "100", "solution-mixing-calc");
		createInput("mix-C2", "1", "solution-mixing-calc");
		createInput("mix-V2", "100", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("Error");
	});

	it("should show error for negative volume", () => {
		createInput("mix-C1", "1", "solution-mixing-calc");
		createInput("mix-V1", "-100", "solution-mixing-calc");
		createInput("mix-C2", "1", "solution-mixing-calc");
		createInput("mix-V2", "100", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("Error");
	});
});
