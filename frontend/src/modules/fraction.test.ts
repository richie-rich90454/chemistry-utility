import { describe, it, expect } from "vitest";
import { balanceEquation, parseEquation } from "./equationBalancer.js";

describe("parseEquation", () => {
	it("should parse equation with ->", () => {
		const result = parseEquation("H2 + O2 -> H2O");
		expect(result.reactants).toEqual(["H2", "O2"]);
		expect(result.products).toEqual(["H2O"]);
	});

	it("should parse equation with =", () => {
		const result = parseEquation("H2 + O2 = H2O");
		expect(result.reactants).toEqual(["H2", "O2"]);
		expect(result.products).toEqual(["H2O"]);
	});

	it("should handle extra whitespace", () => {
		const result = parseEquation("  H2  +  O2  ->  H2O  ");
		expect(result.reactants).toEqual(["H2", "O2"]);
		expect(result.products).toEqual(["H2O"]);
	});

	it("should parse single reactant and single product", () => {
		const result = parseEquation("H2O -> H2 + O2");
		expect(result.reactants).toEqual(["H2O"]);
		expect(result.products).toEqual(["H2", "O2"]);
	});

	it("should parse multiple reactants and products", () => {
		const result = parseEquation("Na + H2O -> NaOH + H2");
		expect(result.reactants).toEqual(["Na", "H2O"]);
		expect(result.products).toEqual(["NaOH", "H2"]);
	});

	it("should throw for missing separator", () => {
		expect(() => parseEquation("H2 + O2 H2O")).toThrow("Invalid format");
	});

	it("should return empty reactants for empty reactant side", () => {
		const result = parseEquation(" -> H2O");
		expect(result.reactants).toEqual([]);
		expect(result.products).toEqual(["H2O"]);
	});

	it("should return empty products for empty product side", () => {
		const result = parseEquation("H2 + O2 -> ");
		expect(result.reactants).toEqual(["H2", "O2"]);
		expect(result.products).toEqual([]);
	});
});

describe("balanceEquation", () => {
	it("should balance simple synthesis (2H2 + O2 -> 2H2O)", () => {
		expect(balanceEquation("H2 + O2 -> H2O")).toBe("2H2 + O2 -> 2H2O");
	});

	it("should balance combustion (CH4 + 2O2 -> CO2 + 2H2O)", () => {
		expect(balanceEquation("CH4 + O2 -> CO2 + H2O")).toBe("CH4 + 2O2 -> CO2 + 2H2O");
	});

	it("should balance with nested parentheses", () => {
		expect(balanceEquation("Mg(OH)2 + HCl -> MgCl2 + H2O")).toBe("Mg(OH)2 + 2HCl -> MgCl2 + 2H2O");
	});

	it("should balance with = separator", () => {
		expect(balanceEquation("H2 + O2 = H2O")).toBe("2H2 + O2 -> 2H2O");
	});

	it("should throw for impossible equation", () => {
		expect(() => balanceEquation("H2 -> He")).toThrow();
	});

	it("should throw for invalid format", () => {
		expect(() => balanceEquation("H2 O2 H2O")).toThrow("Invalid format");
	});

	it("should balance ionic equation with charge notation", () => {
		expect(balanceEquation("Fe + Cu2+ -> Fe2+ + Cu")).toBe("2Fe + Cu2+ -> Fe2+ + 2Cu");
	});

	it("should balance large molecule (C6H12O6)", () => {
		expect(balanceEquation("C6H12O6 + O2 -> CO2 + H2O")).toBe("C6H12O6 + 6O2 -> 6CO2 + 6H2O");
	});

	it("should balance with brackets [ ]", () => {
		expect(balanceEquation("Al2[SO4]3 + NaOH -> Al[OH]3 + Na2SO4")).toBe("Al2[SO4]3 + 6NaOH -> 2Al[OH]3 + 3Na2SO4");
	});

	it("should balance with braces { }", () => {
		expect(balanceEquation("Al2{SO4}3 + NaOH -> Al{OH}3 + Na2SO4")).toBe("Al2{SO4}3 + 6NaOH -> 2Al{OH}3 + 3Na2SO4");
	});

	it("should balance single element reactants (N2 + H2 -> NH3)", () => {
		expect(balanceEquation("N2 + H2 -> NH3")).toBe("N2 + 3H2 -> 2NH3");
	});

	it("should respect maxCoefficient parameter", () => {
		expect(() => balanceEquation("N2 + H2 -> NH3", 2)).toThrow();
	});

	it("should balance Fe2O3 + CO -> Fe + CO2", () => {
		expect(balanceEquation("Fe2O3 + CO -> Fe + CO2")).toBe("Fe2O3 + 3CO -> 2Fe + 3CO2");
	});

	it("should balance propane combustion", () => {
		expect(balanceEquation("C3H8 + O2 -> CO2 + H2O")).toBe("C3H8 + 5O2 -> 3CO2 + 4H2O");
	});

	it("should balance Al + HCl -> AlCl3 + H2", () => {
		expect(balanceEquation("Al + HCl -> AlCl3 + H2")).toBe("2Al + 6HCl -> 2AlCl3 + 3H2");
	});

	it("should balance P4 + O2 -> P2O5", () => {
		expect(balanceEquation("P4 + O2 -> P2O5")).toBe("P4 + 5O2 -> 2P2O5");
	});
});
