import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { calculateDilution, calculateMassPercent, calculateMixing } from "./solutionCalculators.js";
import { predictBondType } from "./bondPredictor.js";
import { parseBalancedEquation, parseTerm, calculateStoichiometry } from "./stoichiometryCalculator.js";
import { createContainer, createInput, createSelect, createResultDiv, cleanupDOM, getResultHTML } from "../test/helpers.js";
import type { ChemicalElement } from "../types.js";

const testElements: ChemicalElement[] = [
	{ symbol: "Na", name: "Sodium", atomicMass: 22.990, atomicNumber: 11, type: "alkali metal", electronegativity: 0.93, valenceElectrons: 1, totalElectrons: 11, group: 1, period: 3 },
	{ symbol: "Cl", name: "Chlorine", atomicMass: 35.453, atomicNumber: 17, type: "non-metal", electronegativity: 3.16, valenceElectrons: 7, totalElectrons: 17, group: 17, period: 3 },
	{ symbol: "Fe", name: "Iron", atomicMass: 55.845, atomicNumber: 26, type: "transition metal", electronegativity: 1.83, valenceElectrons: 2, totalElectrons: 26, group: 8, period: 4 },
	{ symbol: "La", name: "Lanthanum", atomicMass: 138.905, atomicNumber: 57, type: "lanthanide", electronegativity: 1.10, valenceElectrons: 2, totalElectrons: 57, group: 3, period: 6 },
	{ symbol: "U", name: "Uranium", atomicMass: 238.029, atomicNumber: 92, type: "actinide", electronegativity: 1.38, valenceElectrons: 2, totalElectrons: 92, group: 3, period: 7 },
	{ symbol: "Si", name: "Silicon", atomicMass: 28.086, atomicNumber: 14, type: "metalloid", electronegativity: 1.90, valenceElectrons: 4, totalElectrons: 14, group: 14, period: 3 },
	{ symbol: "O", name: "Oxygen", atomicMass: 15.999, atomicNumber: 8, type: "non-metal", electronegativity: 3.44, valenceElectrons: 6, totalElectrons: 8, group: 16, period: 2 },
	{ symbol: "C", name: "Carbon", atomicMass: 12.011, atomicNumber: 6, type: "non-metal", electronegativity: 2.55, valenceElectrons: 4, totalElectrons: 6, group: 14, period: 2 },
	{ symbol: "H", name: "Hydrogen", atomicMass: 1.008, atomicNumber: 1, type: "non-metal", electronegativity: 2.20, valenceElectrons: 1, totalElectrons: 1, group: 1, period: 1 },
	{ symbol: "He", name: "Helium", atomicMass: 4.003, atomicNumber: 2, type: "non-metal", electronegativity: null, valenceElectrons: 2, totalElectrons: 2, group: 18, period: 1 },
];

describe("Solution Calculators", () => {
	afterEach(() => {
		cleanupDOM();
	});

	it("calculates M1 even when current M1 input is negative (dilution)", () => {
		createContainer("dilution-calc");
		createInput("dilution-M1", "-5", "dilution-calc");
		createInput("dilution-V1", "2", "dilution-calc");
		createInput("dilution-M2", "3", "dilution-calc");
		createInput("dilution-V2", "4", "dilution-calc");
		createSelect("dilution-solve-for", "M1", ["M1", "V1", "M2", "V2"], "dilution-calc");
		createResultDiv("dilution-result", "dilution-calc");

		calculateDilution();

		const html = getResultHTML("dilution-result");
		expect(html).toContain("6.0000 M");
	});

	it("throws error when V1 is zero and solving for V2 (dilution)", () => {
		createContainer("dilution-calc");
		createInput("dilution-M1", "1", "dilution-calc");
		createInput("dilution-V1", "0", "dilution-calc");
		createInput("dilution-M2", "1", "dilution-calc");
		createInput("dilution-V2", "1", "dilution-calc");
		createSelect("dilution-solve-for", "V2", ["M1", "V1", "M2", "V2"], "dilution-calc");
		createResultDiv("dilution-result", "dilution-calc");

		calculateDilution();

		const html = getResultHTML("dilution-result");
		expect(html).toContain("Initial volume must be positive");
	});

	it("returns over 100% when solute mass exceeds solution mass (massPercent)", () => {
		createContainer("mass-percent-calc");
		createInput("mass-solute", "150", "mass-percent-calc");
		createInput("mass-solution", "100", "mass-percent-calc");
		createSelect("concentration-unit", "percent", ["percent", "ppm", "ppb"], "mass-percent-calc");
		createResultDiv("mass-percent-result", "mass-percent-calc");

		calculateMassPercent();

		const html = getResultHTML("mass-percent-result");
		expect(html).toContain("150.0000 %");
	});

	it("throws error when solution mass is zero (massPercent)", () => {
		createContainer("mass-percent-calc");
		createInput("mass-solute", "10", "mass-percent-calc");
		createInput("mass-solution", "0", "mass-percent-calc");
		createSelect("concentration-unit", "percent", ["percent", "ppm", "ppb"], "mass-percent-calc");
		createResultDiv("mass-percent-result", "mass-percent-calc");

		calculateMassPercent();

		const html = getResultHTML("mass-percent-result");
		expect(html).toContain("Solution mass cannot be zero");
	});

	it("throws error when solute mass is negative (massPercent)", () => {
		createContainer("mass-percent-calc");
		createInput("mass-solute", "-5", "mass-percent-calc");
		createInput("mass-solution", "100", "mass-percent-calc");
		createSelect("concentration-unit", "percent", ["percent", "ppm", "ppb"], "mass-percent-calc");
		createResultDiv("mass-percent-result", "mass-percent-calc");

		calculateMassPercent();

		const html = getResultHTML("mass-percent-result");
		expect(html).toContain("Solute mass cannot be negative");
	});

	it("returns equal concentration when both solutions have same concentration (mixing)", () => {
		createContainer("solution-mixing-calc");
		createInput("mix-C1", "5", "solution-mixing-calc");
		createInput("mix-V1", "2", "solution-mixing-calc");
		createInput("mix-C2", "5", "solution-mixing-calc");
		createInput("mix-V2", "3", "solution-mixing-calc");
		createResultDiv("mixing-result", "solution-mixing-calc");

		calculateMixing();

		const html = getResultHTML("mixing-result");
		expect(html).toContain("5.0000 M");
	});

	it("throws error when first solution concentration is zero (mixing)", () => {
		createContainer("solution-mixing-calc");
		createInput("mix-C1", "0", "solution-mixing-calc");
		createInput("mix-V1", "1", "solution-mixing-calc");
		createInput("mix-C2", "1", "solution-mixing-calc");
		createInput("mix-V2", "1", "solution-mixing-calc");
		createResultDiv("mixing-result", "solution-mixing-calc");

		calculateMixing();

		const html = getResultHTML("mixing-result");
		expect(html).toContain("First solution concentration must be positive");
	});

	it("handles very large concentration and volume values (mixing)", () => {
		createContainer("solution-mixing-calc");
		createInput("mix-C1", "1e10", "solution-mixing-calc");
		createInput("mix-V1", "1e10", "solution-mixing-calc");
		createInput("mix-C2", "1e10", "solution-mixing-calc");
		createInput("mix-V2", "1e10", "solution-mixing-calc");
		createResultDiv("mixing-result", "solution-mixing-calc");

		calculateMixing();

		const html = getResultHTML("mixing-result");
		expect(html).toContain("10000000000.0000 M");
	});
});

describe("Bond Predictor", () => {
	beforeEach(() => {
		createContainer("bond-type-predictor");
		createInput("element1-input", "", "bond-type-predictor", "text");
		createInput("element2-input", "", "bond-type-predictor", "text");
		createResultDiv("bond-type-result", "bond-type-predictor");
	});

	afterEach(() => {
		cleanupDOM();
	});

	it("predicts ionic bond for lanthanide + non-metal", () => {
		(document.getElementById("element1-input") as HTMLInputElement).value = "La";
		(document.getElementById("element2-input") as HTMLInputElement).value = "Cl";

		predictBondType(testElements);

		const html = getResultHTML("bond-type-result");
		expect(html).toContain("Ionic");
	});

	it("predicts metallic bond for actinide + actinide", () => {
		(document.getElementById("element1-input") as HTMLInputElement).value = "U";
		(document.getElementById("element2-input") as HTMLInputElement).value = "U";

		predictBondType(testElements);

		const html = getResultHTML("bond-type-result");
		expect(html).toContain("Metallic");
	});

	it("predicts polar covalent bond for metalloid + non-metal", () => {
		(document.getElementById("element1-input") as HTMLInputElement).value = "Si";
		(document.getElementById("element2-input") as HTMLInputElement).value = "O";

		predictBondType(testElements);

		const html = getResultHTML("bond-type-result");
		expect(html).toContain("Polar Covalent");
	});

	it("predicts metallic bond for transition metal + transition metal", () => {
		(document.getElementById("element1-input") as HTMLInputElement).value = "Fe";
		(document.getElementById("element2-input") as HTMLInputElement).value = "Fe";

		predictBondType(testElements);

		const html = getResultHTML("bond-type-result");
		expect(html).toContain("Metallic");
	});

	it("predicts nonpolar covalent bond for same element (deltaEN=0)", () => {
		(document.getElementById("element1-input") as HTMLInputElement).value = "C";
		(document.getElementById("element2-input") as HTMLInputElement).value = "C";

		predictBondType(testElements);

		const html = getResultHTML("bond-type-result");
		expect(html).toContain("Nonpolar Covalent");
	});

	it("shows not possible message for element with null electronegativity", () => {
		(document.getElementById("element1-input") as HTMLInputElement).value = "He";
		(document.getElementById("element2-input") as HTMLInputElement).value = "O";

		predictBondType(testElements);

		const html = getResultHTML("bond-type-result");
		expect(html).toContain("unavailable electronegativity data");
	});
});

describe("Stoichiometry", () => {
	afterEach(() => {
		cleanupDOM();
	});

	it("parses equation with spaces correctly", () => {
		const result = parseBalancedEquation("2 H2 + O2 -> 2 H2O");
		expect(result.reactants).toEqual([
			{ formula: "H2", coefficient: 2 },
			{ formula: "O2", coefficient: 1 },
		]);
		expect(result.products).toEqual([
			{ formula: "H2O", coefficient: 2 },
		]);
	});

	it("defaults coefficient to 1 when no coefficient is given", () => {
		const result = parseTerm("H2O");
		expect(result).toEqual({ formula: "H2O", coefficient: 1 });
	});

	it("parses multi-digit coefficient correctly", () => {
		const result = parseTerm("12H2O");
		expect(result).toEqual({ formula: "H2O", coefficient: 12 });
	});

	it("throws error for equation without separator", () => {
		expect(() => parseBalancedEquation("2H2 + O2")).toThrow(
			'Invalid equation format: missing "->"'
		);
	});

	it("calculates product moles from reactant with 2:1 ratio", () => {
		createContainer("stoich-calc");
		createSelect("calculation-type", "product-from-reactant", ["product-from-reactant", "reactant-from-product", "limiting-reactant"], "stoich-calc");
		createResultDiv("stoich-result", "stoich-calc");

		const reactantSelect = document.createElement("select");
		reactantSelect.id = "reactant-select";
		const rOpt = document.createElement("option");
		rOpt.value = "H2O";
		rOpt.textContent = "H2O";
		reactantSelect.appendChild(rOpt);
		document.getElementById("stoich-calc")!.appendChild(reactantSelect);

		createInput("reactant-moles", "4", "stoich-calc");

		const productSelect = document.createElement("select");
		productSelect.id = "product-select";
		const pOpt = document.createElement("option");
		pOpt.value = "O2";
		pOpt.textContent = "O2";
		productSelect.appendChild(pOpt);
		document.getElementById("stoich-calc")!.appendChild(productSelect);

		calculateStoichiometry("2H2O->2H2+O2");

		const html = getResultHTML("stoich-result");
		expect(html).toContain("2.00");
	});

	it("throws error when moles input is zero", () => {
		createContainer("stoich-calc");
		createSelect("calculation-type", "product-from-reactant", ["product-from-reactant", "reactant-from-product", "limiting-reactant"], "stoich-calc");
		createResultDiv("stoich-result", "stoich-calc");

		const reactantSelect = document.createElement("select");
		reactantSelect.id = "reactant-select";
		const rOpt = document.createElement("option");
		rOpt.value = "H2O";
		rOpt.textContent = "H2O";
		reactantSelect.appendChild(rOpt);
		document.getElementById("stoich-calc")!.appendChild(reactantSelect);

		createInput("reactant-moles", "0", "stoich-calc");

		const productSelect = document.createElement("select");
		productSelect.id = "product-select";
		const pOpt = document.createElement("option");
		pOpt.value = "O2";
		pOpt.textContent = "O2";
		productSelect.appendChild(pOpt);
		document.getElementById("stoich-calc")!.appendChild(productSelect);

		expect(() => calculateStoichiometry("2H2O->2H2+O2")).toThrow("Invalid moles input");
	});
});

describe("Solution Calculators - additional edge cases", () => {
	beforeEach(() => {
		createContainer("dilution-calc");
		createInput("dilution-M1", "1", "dilution-calc");
		createInput("dilution-V1", "1", "dilution-calc");
		createInput("dilution-M2", "1", "dilution-calc");
		createInput("dilution-V2", "1", "dilution-calc");
		createSelect("dilution-solve-for", "V2", ["M1", "V1", "M2", "V2"], "dilution-calc");
		createResultDiv("dilution-result", "dilution-calc");

		createContainer("mass-percent-calc");
		createInput("mass-solute", "10", "mass-percent-calc");
		createInput("mass-solution", "100", "mass-percent-calc");
		createSelect("concentration-unit", "percent", ["percent", "ppm", "ppb"], "mass-percent-calc");
		createResultDiv("mass-percent-result", "mass-percent-calc");

		createContainer("solution-mixing-calc");
		createInput("mix-C1", "1", "solution-mixing-calc");
		createInput("mix-V1", "1", "solution-mixing-calc");
		createInput("mix-C2", "2", "solution-mixing-calc");
		createInput("mix-V2", "1", "solution-mixing-calc");
		createResultDiv("mixing-result", "solution-mixing-calc");
	});
	afterEach(() => { cleanupDOM(); });

	it("dilution with very small concentrations", () => {
		(document.getElementById("dilution-M1") as HTMLInputElement).value = "0.001";
		(document.getElementById("dilution-V1") as HTMLInputElement).value = "1";
		(document.getElementById("dilution-M2") as HTMLInputElement).value = "0.0001";
		(document.getElementById("dilution-V2") as HTMLInputElement).value = "10";
		(document.getElementById("dilution-solve-for") as HTMLSelectElement).value = "V2";
		calculateDilution();
		const html = getResultHTML("dilution-result");
		expect(html).toContain("Result:");
	});

	it("mass percent in ppb with trace amounts", () => {
		(document.getElementById("mass-solute") as HTMLInputElement).value = "0.001";
		(document.getElementById("mass-solution") as HTMLInputElement).value = "1000";
		(document.getElementById("concentration-unit") as HTMLSelectElement).value = "ppb";
		calculateMassPercent();
		const html = getResultHTML("mass-percent-result");
		expect(html).toContain("ppb");
	});

	it("mixing with same concentration returns same value", () => {
		(document.getElementById("mix-C1") as HTMLInputElement).value = "1.5";
		(document.getElementById("mix-V1") as HTMLInputElement).value = "2";
		(document.getElementById("mix-C2") as HTMLInputElement).value = "1.5";
		(document.getElementById("mix-V2") as HTMLInputElement).value = "3";
		calculateMixing();
		const html = getResultHTML("mixing-result");
		expect(html).toContain("1.5000 M");
	});
});
