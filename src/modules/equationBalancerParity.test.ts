import {describe, it, expect} from "vitest";
import {balanceEquation} from "./equationBalancer.js";
import {calculateMolarMass} from "./formulaParser.js";
import type {ChemicalElement} from "../types.js";

const parityElements: ChemicalElement[] = [
	{ symbol: "H", name: "Hydrogen", atomicMass: 1.008, atomicNumber: 1, valenceElectrons: 1, totalElectrons: 1, group: 1, period: 1, type: "nonmetal" },
	{ symbol: "O", name: "Oxygen", atomicMass: 15.999, atomicNumber: 8, valenceElectrons: 6, totalElectrons: 8, group: 16, period: 2, type: "nonmetal" },
	{ symbol: "C", name: "Carbon", atomicMass: 12.011, atomicNumber: 6, valenceElectrons: 4, totalElectrons: 6, group: 14, period: 2, type: "nonmetal" },
	{ symbol: "Na", name: "Sodium", atomicMass: 22.99, atomicNumber: 11, valenceElectrons: 1, totalElectrons: 11, group: 1, period: 3, type: "alkali metal" },
	{ symbol: "Cl", name: "Chlorine", atomicMass: 35.45, atomicNumber: 17, valenceElectrons: 7, totalElectrons: 17, group: 17, period: 3, type: "halogen" },
	{ symbol: "Cu", name: "Copper", atomicMass: 63.546, atomicNumber: 29, valenceElectrons: 1, totalElectrons: 29, group: 11, period: 4, type: "transition metal" },
	{ symbol: "S", name: "Sulfur", atomicMass: 32.06, atomicNumber: 16, valenceElectrons: 6, totalElectrons: 16, group: 16, period: 3, type: "nonmetal" },
	{ symbol: "Fe", name: "Iron", atomicMass: 55.845, atomicNumber: 26, valenceElectrons: 2, totalElectrons: 26, group: 8, period: 4, type: "transition metal" },
	{ symbol: "Ca", name: "Calcium", atomicMass: 40.078, atomicNumber: 20, valenceElectrons: 2, totalElectrons: 20, group: 2, period: 4, type: "alkaline earth metal" },
];

// Shared parity fixtures: same inputs asserted in Go (internal/calculators/parity_test.go).
// Web and desktop must never disagree on these.
describe("parity fixtures (frontend <-> Go)", ()=>{
	it("balances H2 + O2 -> H2O", ()=>{
		expect(balanceEquation("H2 + O2 -> H2O")).toBe("2H2 + O2 -> 2H2O");
	});
	it("balances spaceless H2+O2->H2O", ()=>{
		expect(balanceEquation("H2+O2->H2O")).toBe("2H2 + O2 -> 2H2O");
	});
	it("balances C3H8 + O2 -> CO2 + H2O", ()=>{
		expect(balanceEquation("C3H8 + O2 -> CO2 + H2O")).toBe("C3H8 + 5O2 -> 3CO2 + 4H2O");
	});
	it("balances hydrate CuSO4·5H2O -> CuSO4 + H2O", ()=>{
		expect(balanceEquation("CuSO4·5H2O -> CuSO4 + H2O")).toBe("CuSO4·5H2O -> CuSO4 + 5H2O");
	});
	it("balances hydrate CuSO4*5H2O -> CuSO4 + H2O", ()=>{
		expect(balanceEquation("CuSO4*5H2O -> CuSO4 + H2O")).toBe("CuSO4*5H2O -> CuSO4 + 5H2O");
	});
	it("balances hydrate CuSO4•5H2O -> CuSO4 + H2O (normalizes bullet to middle dot)", ()=>{
		expect(balanceEquation("CuSO4•5H2O -> CuSO4 + H2O")).toBe("CuSO4·5H2O -> CuSO4 + 5H2O");
	});
	it("balances unicode arrow H2 + O2 → H2O", ()=>{
		expect(balanceEquation("H2 + O2 → H2O")).toBe("2H2 + O2 -> 2H2O");
	});
	it("balances reversible arrow H2 + O2 ⇌ H2O", ()=>{
		expect(balanceEquation("H2 + O2 ⇌ H2O")).toBe("2H2 + O2 -> 2H2O");
	});
	it("balances reversible arrow H2 + O2 <=> H2O", ()=>{
		expect(balanceEquation("H2 + O2 <=> H2O")).toBe("2H2 + O2 -> 2H2O");
	});
	it("balances equals separator H2 + O2 = H2O", ()=>{
		expect(balanceEquation("H2 + O2 = H2O")).toBe("2H2 + O2 -> 2H2O");
	});
	it("balances ionic Fe2+ + Cl2 -> Fe3+ + Cl-", ()=>{
		expect(balanceEquation("Fe2+ + Cl2 -> Fe3+ + Cl-")).toBe("2Fe2+ + Cl2 -> 2Fe3+ + 2Cl-");
	});
	it("calculates molar mass H2O", ()=>{
		expect(calculateMolarMass("H2O", parityElements)).toBeCloseTo(18.015, 2);
	});
	it("calculates molar mass CuSO4·5H2O", ()=>{
		expect(calculateMolarMass("CuSO4·5H2O", parityElements)).toBeCloseTo(249.677, 2);
	});
	it("calculates molar mass CuSO4*5H2O", ()=>{
		expect(calculateMolarMass("CuSO4*5H2O", parityElements)).toBeCloseTo(249.677, 2);
	});
	it("calculates molar mass CuSO4•5H2O", ()=>{
		expect(calculateMolarMass("CuSO4•5H2O", parityElements)).toBeCloseTo(249.677, 2);
	});
});
