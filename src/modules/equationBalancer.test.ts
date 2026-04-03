import {describe, it, expect} from "vitest";
import {balanceEquation} from "./equationBalancer";

describe("Chemical Equation Balancer", ()=>{
	it("should balance simple synthesis reactions", ()=>{
		expect(balanceEquation("H2 + O2 -> H2O")).toBe("2H2 + O2 -> 2H2O");
		expect(balanceEquation("Al + O2 -> Al2O3")).toBe("4Al + 3O2 -> 2Al2O3");
	});
	it("should balance combustion reactions with large coefficients", ()=>{
		expect(balanceEquation("C3H8 + O2 -> CO2 + H2O")).toBe("C3H8 + 5O2 -> 3CO2 + 4H2O");
		expect(balanceEquation("C4H10 + O2 -> CO2 + H2O")).toBe("2C4H10 + 13O2 -> 8CO2 + 10H2O");
	});
	it("should handle nested parentheses and brackets", ()=>{
		expect(balanceEquation("Mg(OH)2 + HCl -> MgCl2 + H2O")).toBe("Mg(OH)2 + 2HCl -> MgCl2 + 2H2O");
		expect(balanceEquation("Ba(NO3)2 + Na3PO4 -> Ba3(PO4)2 + NaNO3")).toBe("3Ba(NO3)2 + 2Na3PO4 -> Ba3(PO4)2 + 6NaNO3");
		expect(balanceEquation("K4[Fe(CN)6] + H2SO4 + H2O -> K2SO4 + FeSO4 + (NH4)2SO4 + CO"))
			.toBe("K4[Fe(CN)6] + 6H2SO4 + 6H2O -> 2K2SO4 + FeSO4 + 3(NH4)2SO4 + 6CO");
	});
	it("should balance ionic equations and maintain charge conservation", ()=>{
		expect(balanceEquation("Fe2+ + Cl2 -> Fe3+ + Cl-")).toBe("2Fe2+ + Cl2 -> 2Fe3+ + 2Cl-");
		expect(balanceEquation("Ag+ + Cu -> Ag + Cu2+")).toBe("2Ag+ + Cu -> 2Ag + Cu2+");
		expect(balanceEquation("MnO4- + H+ + I- -> Mn2+ + H2O + I2"))
			.toBe("2MnO4- + 16H+ + 10I- -> 2Mn2+ + 8H2O + 5I2");
	});
	it("should throw error for impossible equations", ()=>{
		expect(()=>balanceEquation("H2 + O2 -> H2O + C")).toThrow();
		expect(()=>balanceEquation("H2 + O2")).toThrow();
	});
	it("should handle the = sign as a separator", ()=>{
		expect(balanceEquation("H2 + O2 = H2O")).toBe("2H2 + O2 -> 2H2O");
	});
});