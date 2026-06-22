import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mockElements } from "../test/elementsData";
import type { ChemicalElement } from "../types";

// Mock all calculator module imports — these intercept both static and dynamic import()
vi.mock("./formulaParser", () => ({
	calculateMolarMass: vi.fn(),
}));

vi.mock("./equationBalancer", () => ({
	balanceEquation: vi.fn(),
}));

vi.mock("./stoichiometryCalculator", () => ({
	getCalculationType: vi.fn(),
	calculateStoichiometry: vi.fn(),
}));

vi.mock("./solutionCalculators", () => ({
	calculateDilution: vi.fn(),
	calculateMassPercent: vi.fn(),
	calculateMixing: vi.fn(),
}));

vi.mock("./gasLawCalculators", () => ({
	calculateIdealGasLaw: vi.fn(),
	calculateCombinedGasLaw: vi.fn(),
	calculateVanDerWaals: vi.fn(),
	calculateHalfLife: vi.fn(),
}));

vi.mock("./electrochemistryCalculators", () => ({
	calculateCellPotential: vi.fn(),
	calculateNernst: vi.fn(),
	calculateElectrolysis: vi.fn(),
}));

vi.mock("./bondPredictor", () => ({
	predictBondType: vi.fn(),
}));

vi.mock("./urlStateManager", () => ({
	UrlStateManager: {
		getInstance: vi.fn(() => ({
			readInputsFromDom: vi.fn(() => ({})),
			updateUrl: vi.fn(),
			restoreState: vi.fn(() => null),
			serializeState: vi.fn(() => ""),
			fillInputs: vi.fn(),
			updateUrlImmediate: vi.fn(),
			clearState: vi.fn(),
			getInputIds: vi.fn(() => []),
		})),
		resetInstance: vi.fn(),
	},
}));

import { initializeEventListeners } from "./eventListeners";
import { calculateMolarMass } from "./formulaParser";
import { balanceEquation } from "./equationBalancer";
import { getCalculationType, calculateStoichiometry } from "./stoichiometryCalculator";
import { calculateDilution, calculateMassPercent, calculateMixing } from "./solutionCalculators";
import {
	calculateIdealGasLaw,
	calculateCombinedGasLaw,
	calculateVanDerWaals,
	calculateHalfLife,
} from "./gasLawCalculators";
import { calculateCellPotential, calculateNernst, calculateElectrolysis } from "./electrochemistryCalculators";
import { predictBondType } from "./bondPredictor";

/**
 * Flushes all pending microtasks (resolved Promises) so that
 * dynamic-import `.then()` callbacks have executed before assertions.
 */
async function flushPromises(): Promise<void> {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	});
}

/**
 * Set up all DOM elements required by initializeEventListeners
 */
function setupFullDOM(): void {
	document.body.innerHTML = "";

	// Element lookup
	createElement("input", { id: "element-input" });
	createElement("div", { id: "element-info" });

	// Molar mass
	createElement("input", { id: "formula-input" });
	createElement("div", { id: "mass-result" });

	// Equation balancer
	createElement("input", { id: "equation-input" });
	createElement("button", { id: "balance-button" });
	createElement("div", { id: "balance-result" });

	// Stoichiometry
	createElement("input", { id: "stoich-equation-input" });
	createElement("select", { id: "calculation-type" });
	createElement("button", { id: "calculate-stoich-button" });
	createElement("div", { id: "stoichiometry-result" });

	// Solution calculators
	createElement("button", { id: "calculate-dilution" });
	createElement("button", { id: "calculate-mass-percent" });
	createElement("button", { id: "calculate-mixing" });

	// Ideal gas law
	createElement("button", { id: "calculate-ideal" });
	const rUnitsSelect = createElement("select", { id: "ideal-R-units" }) as HTMLSelectElement;
	rUnitsSelect.innerHTML = '<option value="atm-L">atm-L</option><option value="SI">SI</option>';
	createElement("input", { id: "ideal-P" });
	createElement("input", { id: "ideal-V" });

	// Combined gas law
	createElement("button", { id: "calculate-combined" });

	// Van der Waals
	createElement("button", { id: "calculate-vdw" });

	// Half-life
	createElement("button", { id: "calculate-half-life" });
	const hlSelect = createElement("select", { id: "half-life-solve-for" }) as HTMLSelectElement;
	hlSelect.innerHTML = '<option value="remaining">remaining</option><option value="time">time</option><option value="half-life">half-life</option>';
	createElement("div", { id: "remaining-quantity-group" });

	// Electrochemistry
	createElement("button", { id: "calculate-cell-potential" });
	createElement("button", { id: "calculate-nernst" });
	createElement("button", { id: "calculate-electrolysis" });

	// Bond predictor
	createElement("button", { id: "calculate-bond-type" });
	createElement("div", { id: "bond-result" });

	// Enter key inputs - dilution
	for (const id of ["dilution-M1", "dilution-V1", "dilution-M2", "dilution-V2"]) {
		createElement("input", { id });
	}
	// Mass percent
	for (const id of ["mass-solute", "mass-solution"]) {
		createElement("input", { id });
	}
	// Mixing
	for (const id of ["mix-C1", "mix-V1", "mix-C2", "mix-V2"]) {
		createElement("input", { id });
	}
	// Ideal gas (ideal-P and ideal-V already created)
	for (const id of ["ideal-n", "ideal-T"]) {
		createElement("input", { id });
	}
	// Combined gas
	for (const id of ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"]) {
		createElement("input", { id });
	}
	// Van der Waals
	for (const id of ["vdw-V", "vdw-n", "vdw-T", "vdw-a", "vdw-b"]) {
		createElement("input", { id });
	}
	// Cell potential
	for (const id of ["E1", "E2"]) {
		createElement("input", { id });
	}
	// Nernst
	for (const id of ["E-standard", "temperature", "n-electrons", "Q-reaction"]) {
		createElement("input", { id });
	}
	// Electrolysis
	for (const id of ["electrolysis-m", "electrolysis-I", "electrolysis-t", "electrolysis-z", "electrolysis-M"]) {
		createElement("input", { id });
	}
	// Bond predictor inputs
	for (const id of ["element1-input", "element2-input"]) {
		createElement("input", { id });
	}
}

function createElement(tag: string, attrs: Record<string, string>): HTMLElement {
	const el = document.createElement(tag);
	for (const [key, val] of Object.entries(attrs)) {
		el.setAttribute(key, val);
	}
	document.body.appendChild(el);
	return el;
}

function simulateKeyup(elementId: string, key = "a"): void {
	const el = document.getElementById(elementId) as HTMLInputElement;
	el.dispatchEvent(new KeyboardEvent("keyup", { key }));
}

function simulateClick(elementId: string): void {
	const el = document.getElementById(elementId) as HTMLElement;
	el.click();
}

function simulateSelectChange(elementId: string, value: string): void {
	const el = document.getElementById(elementId) as HTMLSelectElement;
	el.value = value;
	el.dispatchEvent(new Event("change"));
}

describe("eventListeners", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		setupFullDOM();
		initializeEventListeners(mockElements);
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	describe("element lookup", () => {
		it("finds element by symbol and displays info", () => {
			const input = document.getElementById("element-input") as HTMLInputElement;
			input.value = "H";
			simulateKeyup("element-input");

			const info = document.getElementById("element-info")!;
			expect(info.innerHTML).toContain("Symbol:");
			expect(info.innerHTML).toContain("H");
			expect(info.innerHTML).toContain("Name:");
			expect(info.innerHTML).toContain("Hydrogen");
			expect(info.classList.contains("show")).toBe(true);
		});

		it("finds element by name", () => {
			const input = document.getElementById("element-input") as HTMLInputElement;
			input.value = "Sodium";
			simulateKeyup("element-input");

			const info = document.getElementById("element-info")!;
			expect(info.innerHTML).toContain("Na");
			expect(info.innerHTML).toContain("Sodium");
		});

		it("finds element case-insensitively", () => {
			const input = document.getElementById("element-input") as HTMLInputElement;
			input.value = "na";
			simulateKeyup("element-input");

			const info = document.getElementById("element-info")!;
			expect(info.innerHTML).toContain("Na");
		});

		it("shows 'Element not found' for unknown element", () => {
			const input = document.getElementById("element-input") as HTMLInputElement;
			input.value = "Xx";
			simulateKeyup("element-input");

			const info = document.getElementById("element-info")!;
			expect(info.innerHTML).toContain("Element not found");
			expect(input.classList.contains("error")).toBe(true);
		});

		it("removes error class on new lookup", () => {
			const input = document.getElementById("element-input") as HTMLInputElement;
			input.classList.add("error");
			input.value = "H";
			simulateKeyup("element-input");

			expect(input.classList.contains("error")).toBe(false);
		});

		it("escapes HTML characters in element data (XSS prevention)", () => {
			const xssElements: ChemicalElement[] = [
				{
					atomicNumber: 999,
					symbol: '<script>alert("xss")</script>',
					name: "TestElement",
					atomicMass: 1,
					type: "metal",
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

			// Re-init with XSS data
			setupFullDOM();
			initializeEventListeners(xssElements);

			const input = document.getElementById("element-input") as HTMLInputElement;
			input.value = '<script>alert("xss")</script>';
			simulateKeyup("element-input");

			const info = document.getElementById("element-info")!;
			// The script tags should be escaped, not executed
			expect(info.innerHTML).not.toContain("<script>");
			expect(info.innerHTML).toContain("&lt;script&gt;");
		});

		it("shows N/A for null electronegativity", () => {
			// Create element with null EN since mock Ca has EN=1.00
			const elementsWithNullEN: ChemicalElement[] = [
				{
					...mockElements[0], // H
					symbol: "Zz",
					name: "TestNull",
					electronegativity: null,
					electronAffinity: null,
					atomicRadius: null,
					ionizationEnergy: null,
				},
			];

			setupFullDOM();
			initializeEventListeners(elementsWithNullEN);

			const input = document.getElementById("element-input") as HTMLInputElement;
			input.value = "Zz";
			simulateKeyup("element-input");

			const info = document.getElementById("element-info")!;
			expect(info.innerHTML).toContain("N/A");
		});
	});

	describe("molar mass calculation", () => {
		it("displays molar mass for valid formula", () => {
			vi.mocked(calculateMolarMass).mockReturnValue(18.015);

			const input = document.getElementById("formula-input") as HTMLInputElement;
			input.value = "H2O";
			simulateKeyup("formula-input");

			const result = document.getElementById("mass-result")!;
			expect(result.innerHTML).toContain("18.02");
			expect(result.classList.contains("show")).toBe(true);
		});

		it("shows error for empty formula", () => {
			const input = document.getElementById("formula-input") as HTMLInputElement;
			input.value = "";
			simulateKeyup("formula-input");

			const result = document.getElementById("mass-result")!;
			expect(result.innerHTML).toContain("Please enter a chemical formula");
			expect(input.classList.contains("error")).toBe(true);
		});

		it("shows error for invalid formula", () => {
			vi.mocked(calculateMolarMass).mockImplementation(() => {
				throw new Error("Unknown element: Xx");
			});

			const input = document.getElementById("formula-input") as HTMLInputElement;
			input.value = "Xx2";
			simulateKeyup("formula-input");

			const result = document.getElementById("mass-result")!;
			expect(result.innerHTML).toContain("Unknown element: Xx");
			expect(input.classList.contains("error")).toBe(true);
		});

		it("removes error class on new input", () => {
			const input = document.getElementById("formula-input") as HTMLInputElement;
			input.classList.add("error");
			vi.mocked(calculateMolarMass).mockReturnValue(18.015);
			input.value = "H2O";
			simulateKeyup("formula-input");

			expect(input.classList.contains("error")).toBe(false);
		});
	});

	describe("equation balancing", () => {
		it("displays balanced equation for valid input", () => {
			vi.mocked(balanceEquation).mockReturnValue("2H2 + O2 -> 2H2O");

			const input = document.getElementById("equation-input") as HTMLInputElement;
			input.value = "H2 + O2 -> H2O";
			simulateClick("balance-button");

			const result = document.getElementById("balance-result")!;
			// innerHTML escapes > to &gt;
			expect(result.innerHTML).toContain("Balanced Equation:");
			expect(result.textContent).toContain("2H2 + O2 -> 2H2O");
		});

		it("shows error for empty equation", () => {
			const input = document.getElementById("equation-input") as HTMLInputElement;
			input.value = "";
			simulateClick("balance-button");

			const result = document.getElementById("balance-result")!;
			expect(result.innerHTML).toContain("Please enter a chemical equation");
			expect(input.classList.contains("error")).toBe(true);
		});

		it("shows error for invalid equation", () => {
			vi.mocked(balanceEquation).mockImplementation(() => {
				throw new Error("Cannot balance equation");
			});

			const input = document.getElementById("equation-input") as HTMLInputElement;
			input.value = "invalid";
			simulateClick("balance-button");

			const result = document.getElementById("balance-result")!;
			expect(result.innerHTML).toContain("Cannot balance equation");
			expect(input.classList.contains("error")).toBe(true);
		});
	});

	describe("calculator button wiring", () => {
		it("clicking calculate-dilution calls calculateDilution", async () => {
			simulateClick("calculate-dilution");
			await flushPromises();
			expect(calculateDilution).toHaveBeenCalled();
		});

		it("clicking calculate-mass-percent calls calculateMassPercent", async () => {
			simulateClick("calculate-mass-percent");
			await flushPromises();
			expect(calculateMassPercent).toHaveBeenCalled();
		});

		it("clicking calculate-mixing calls calculateMixing", async () => {
			simulateClick("calculate-mixing");
			await flushPromises();
			expect(calculateMixing).toHaveBeenCalled();
		});

		it("clicking calculate-ideal calls calculateIdealGasLaw", async () => {
			simulateClick("calculate-ideal");
			await flushPromises();
			expect(calculateIdealGasLaw).toHaveBeenCalled();
		});

		it("clicking calculate-combined calls calculateCombinedGasLaw", async () => {
			simulateClick("calculate-combined");
			await flushPromises();
			expect(calculateCombinedGasLaw).toHaveBeenCalled();
		});

		it("clicking calculate-vdw calls calculateVanDerWaals", async () => {
			simulateClick("calculate-vdw");
			await flushPromises();
			expect(calculateVanDerWaals).toHaveBeenCalled();
		});

		it("clicking calculate-half-life calls calculateHalfLife", async () => {
			simulateClick("calculate-half-life");
			await flushPromises();
			expect(calculateHalfLife).toHaveBeenCalled();
		});

		it("clicking calculate-cell-potential calls calculateCellPotential", async () => {
			simulateClick("calculate-cell-potential");
			await flushPromises();
			expect(calculateCellPotential).toHaveBeenCalled();
		});

		it("clicking calculate-nernst calls calculateNernst", async () => {
			simulateClick("calculate-nernst");
			await flushPromises();
			expect(calculateNernst).toHaveBeenCalled();
		});

		it("clicking calculate-electrolysis calls calculateElectrolysis", async () => {
			simulateClick("calculate-electrolysis");
			await flushPromises();
			expect(calculateElectrolysis).toHaveBeenCalled();
		});

		it("clicking calculate-bond-type calls predictBondType", async () => {
			simulateClick("calculate-bond-type");
			await flushPromises();
			expect(predictBondType).toHaveBeenCalledWith(mockElements);
		});

		it("stoichiometry button catches errors and displays in result", async () => {
			vi.mocked(calculateStoichiometry).mockImplementation(() => {
				throw new Error("Invalid equation");
			});

			const input = document.getElementById("stoich-equation-input") as HTMLInputElement;
			input.value = "bad";
			simulateClick("calculate-stoich-button");
			await flushPromises();

			const result = document.getElementById("stoichiometry-result")!;
			expect(result.textContent).toContain("Invalid equation");
		});

		it("bond type button catches errors and displays in result", async () => {
			vi.mocked(predictBondType).mockImplementation(() => {
				throw new Error("Element not found");
			});

			simulateClick("calculate-bond-type");
			await flushPromises();

			const result = document.getElementById("bond-result")!;
			expect(result.textContent).toContain("Element not found");
		});
	});

	describe("select change handlers", () => {
		it("selecting atm-L sets placeholders for atm and L", () => {
			simulateSelectChange("ideal-R-units", "atm-L");

			const p = document.getElementById("ideal-P") as HTMLInputElement;
			const v = document.getElementById("ideal-V") as HTMLInputElement;
			expect(p.getAttribute("placeholder")).toBe("P (atm)");
			expect(v.getAttribute("placeholder")).toBe("V (L)");
		});

		it("selecting SI sets placeholders for Pa and m3", () => {
			simulateSelectChange("ideal-R-units", "SI");

			const p = document.getElementById("ideal-P") as HTMLInputElement;
			const v = document.getElementById("ideal-V") as HTMLInputElement;
			expect(p.getAttribute("placeholder")).toBe("P (Pa)");
			expect(v.getAttribute("placeholder")).toContain("m");
		});

		it("half-life solve-for 'time' shows remaining-quantity-group", () => {
			simulateSelectChange("half-life-solve-for", "time");

			const group = document.getElementById("remaining-quantity-group")!;
			expect(group.style.display).toBe("block");
		});

		it("half-life solve-for 'half-life' shows remaining-quantity-group", () => {
			simulateSelectChange("half-life-solve-for", "half-life");

			const group = document.getElementById("remaining-quantity-group")!;
			expect(group.style.display).toBe("block");
		});

		it("half-life solve-for other value hides remaining-quantity-group", () => {
			const group = document.getElementById("remaining-quantity-group")!;
			group.style.display = "block";

			simulateSelectChange("half-life-solve-for", "remaining");

			expect(group.style.display).toBe("none");
		});

		it("calculation-type change calls getCalculationType when equation is not empty", async () => {
			const input = document.getElementById("stoich-equation-input") as HTMLInputElement;
			input.value = "H2 + O2 -> H2O";

			simulateSelectChange("calculation-type", "product-from-reactant");
			await flushPromises();

			expect(getCalculationType).toHaveBeenCalledWith("H2 + O2 -> H2O");
		});

		it("calculation-type change does not call getCalculationType when equation is empty", async () => {
			const input = document.getElementById("stoich-equation-input") as HTMLInputElement;
			input.value = "";

			simulateSelectChange("calculation-type", "product-from-reactant");
			await flushPromises();

			expect(getCalculationType).not.toHaveBeenCalled();
		});
	});

	describe("Enter key support", () => {
		function simulateEnterKey(elementId: string): void {
			const el = document.getElementById(elementId) as HTMLInputElement;
			el.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
		}

		function simulateNonEnterKey(elementId: string): void {
			const el = document.getElementById(elementId) as HTMLInputElement;
			el.dispatchEvent(new KeyboardEvent("keyup", { key: "Tab" }));
		}

		it("Enter key on dilution input triggers calculateDilution", async () => {
			simulateEnterKey("dilution-M1");
			await flushPromises();
			expect(calculateDilution).toHaveBeenCalled();
		});

		it("Enter key on ideal gas input triggers calculateIdealGasLaw", async () => {
			simulateEnterKey("ideal-P");
			await flushPromises();
			expect(calculateIdealGasLaw).toHaveBeenCalled();
		});

		it("Enter key on bond predictor input triggers predictBondType", async () => {
			simulateEnterKey("element1-input");
			await flushPromises();
			expect(predictBondType).toHaveBeenCalledWith(mockElements);
		});

		it("non-Enter key does not trigger handler", async () => {
			simulateNonEnterKey("dilution-M1");
			await flushPromises();
			expect(calculateDilution).not.toHaveBeenCalled();
		});

		it("Enter key on electrolysis input triggers calculateElectrolysis", async () => {
			simulateEnterKey("electrolysis-m");
			await flushPromises();
			expect(calculateElectrolysis).toHaveBeenCalled();
		});

		it("Enter key on Nernst input triggers calculateNernst", async () => {
			simulateEnterKey("E-standard");
			await flushPromises();
			expect(calculateNernst).toHaveBeenCalled();
		});

		it("Enter key on combined gas input triggers calculateCombinedGasLaw", async () => {
			simulateEnterKey("combined-P1");
			await flushPromises();
			expect(calculateCombinedGasLaw).toHaveBeenCalled();
		});

		it("Enter key on Van der Waals input triggers calculateVanDerWaals", async () => {
			simulateEnterKey("vdw-V");
			await flushPromises();
			expect(calculateVanDerWaals).toHaveBeenCalled();
		});

		it("Enter key on cell potential input triggers calculateCellPotential", async () => {
			simulateEnterKey("E1");
			await flushPromises();
			expect(calculateCellPotential).toHaveBeenCalled();
		});

		it("Enter key on mass percent input triggers calculateMassPercent", async () => {
			simulateEnterKey("mass-solute");
			await flushPromises();
			expect(calculateMassPercent).toHaveBeenCalled();
		});

		it("Enter key on mixing input triggers calculateMixing", async () => {
			simulateEnterKey("mix-C1");
			await flushPromises();
			expect(calculateMixing).toHaveBeenCalled();
		});
	});
});
