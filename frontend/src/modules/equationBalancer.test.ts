import {describe, it, expect} from "vitest";
import {balanceEquation, balanceIonic, BalanceResult} from "./equationBalancer";

function countAtomsInFormula(formula: string): Record<string, number>{
	const hydrateParts: string[] = formula.split(/[·*]/);
	if (hydrateParts.length > 1){
		const merged: Record<string, number> = {};
		for (const part of hydrateParts){
			const trimmed: string = part.trim();
			if (trimmed.length === 0) continue;
			const numMatch: RegExpMatchArray | null = trimmed.match(/^\d+/);
			const mult: number = numMatch !== null ? parseInt(numMatch[0], 10) : 1;
			const body: string = numMatch !== null ? trimmed.substring(numMatch[0].length) : trimmed;
			const partCounts: Record<string, number> = countAtomsInFormula(body);
			for (const el in partCounts){
				merged[el] = (merged[el] || 0) + partCounts[el] * mult;
			}
		}
		return merged;
	}
	const stack: Record<string, number>[] = [{}];
	let i: number = 0;
	while (i < formula.length){
		const ch: string = formula[i];
		if (ch === "(" || ch === "[" || ch === "{"){
			stack.push({});
			i++;
		}
		else if (ch === ")" || ch === "]" || ch === "}"){
			const top: Record<string, number> = stack.pop() as Record<string, number>;
			i++;
			const start: number = i;
			while (i < formula.length && /\d/.test(formula[i])) i++;
			const mul: number = parseInt(formula.substring(start, i), 10) || 1;
			for (const el in top){
				stack[stack.length - 1][el] = (stack[stack.length - 1][el] || 0) + top[el] * mul;
			}
		}
		else if (/[A-Z]/.test(ch)){
			const start: number = i; i++;
			while (i < formula.length && /[a-z]/.test(formula[i])) i++;
			const el: string = formula.substring(start, i);
			const ns: number = i;
			while (i < formula.length && /\d/.test(formula[i])) i++;
			const cnt: number = parseInt(formula.substring(ns, i), 10) || 1;
			stack[stack.length - 1][el] = (stack[stack.length - 1][el] || 0) + cnt;
		}
		else if (ch === "+" || ch === "-"){
			i++;
			while (i < formula.length && /\d/.test(formula[i])) i++;
		}
		else i++;
	}
	return stack[0];
}
function countAtomsInTerm(term: string): Record<string, number>{
	const m: RegExpMatchArray | null = term.match(/^(\d+)/);
	const coeff: number = m !== null ? parseInt(m[0], 10) : 1;
	const formula: string = m !== null ? term.substring(m[0].length) : term;
	const counts: Record<string, number> = countAtomsInFormula(formula);
	const result: Record<string, number> = {};
	for (const el in counts){
		result[el] = counts[el] * coeff;
	}
	return result;
}
function countAtomsInSide(side: string): Record<string, number>{
	const terms: string[] = side.split("+").map(t => t.trim()).filter(t => t.length > 0);
	const result: Record<string, number> = {};
	for (const term of terms){
		const counts: Record<string, number> = countAtomsInTerm(term);
		for (const el in counts){
			result[el] = (result[el] || 0) + counts[el];
		}
	}
	return result;
}
function expectBalanced(equation: string): void{
	const balanced: string = balanceEquation(equation) as string;
	const sides: string[] = balanced.split(/->|=/);
	expect(sides.length).toBe(2);
	const left: Record<string, number> = countAtomsInSide(sides[0]);
	const right: Record<string, number> = countAtomsInSide(sides[1]);
	const allKeys: Set<string> = new Set<string>([...Object.keys(left), ...Object.keys(right)]);
	for (const el of allKeys){
		expect(left[el] || 0).toBe(right[el] || 0);
	}
}
function expectBalancedMax(equation: string, maxCoefficient: number): void{
	const balanced: string = balanceEquation(equation, maxCoefficient) as string;
	const sides: string[] = balanced.split(/->|=/);
	expect(sides.length).toBe(2);
	const left: Record<string, number> = countAtomsInSide(sides[0]);
	const right: Record<string, number> = countAtomsInSide(sides[1]);
	const allKeys: Set<string> = new Set<string>([...Object.keys(left), ...Object.keys(right)]);
	for (const el of allKeys){
		expect(left[el] || 0).toBe(right[el] || 0);
	}
}

function parseChargeSpec(spec: string): number{
	let idx: number = 0;
	let numStr: string = "";
	while (idx < spec.length && /\d/.test(spec[idx])){
		numStr += spec[idx];
		idx++;
	}
	if (idx < spec.length && (spec[idx] === "+" || spec[idx] === "-")){
		const sign: number = spec[idx] === "+" ? 1 : -1;
		const mag: number = numStr.length > 0 ? parseInt(numStr, 10) : 1;
		return sign * mag;
	}
	return 0;
}
function extractChargeFromFormula(formula: string): number{
	const caretIdx: number = formula.indexOf("^");
	if (caretIdx !== -1){
		return parseChargeSpec(formula.substring(caretIdx + 1));
	}
	const len: number = formula.length;
	if (len === 0) return 0;
	const last: string = formula[len - 1];
	if (last !== "+" && last !== "-") return 0;
	const sign: number = last === "+" ? 1 : -1;
	let j: number = len - 2;
	while (j >= 0 && /\d/.test(formula[j])) j--;
	const digitsStart: number = j + 1;
	const digits: string = formula.substring(digitsStart, len - 1);
	if (digits.length === 0) return sign;
	const charBefore: string = digitsStart > 0 ? formula[digitsStart - 1] : "";
	const precededByLetter: boolean = digitsStart > 0 && /[A-Za-z]/.test(charBefore);
	if (precededByLetter){
		const body: string = formula.substring(0, digitsStart);
		let uppercaseCount: number = 0;
		for (let k: number = 0; k < body.length; k++){
			if (/[A-Z]/.test(body[k])) uppercaseCount++;
		}
		if (uppercaseCount <= 1) return sign * parseInt(digits, 10);
		return sign;
	}
	const precededByCloseBracket: boolean = digitsStart > 0 && (charBefore === ")" || charBefore === "]" || charBefore === "}");
	if (precededByCloseBracket) return sign;
	return sign * parseInt(digits, 10);
}
function stripChargeFromFormula(formula: string): string{
	const caretIdx: number = formula.indexOf("^");
	if (caretIdx !== -1){
		return formula.substring(0, caretIdx);
	}
	const len: number = formula.length;
	if (len === 0) return formula;
	const last: string = formula[len - 1];
	if (last !== "+" && last !== "-") return formula;
	let j: number = len - 2;
	while (j >= 0 && /\d/.test(formula[j])) j--;
	const digitsStart: number = j + 1;
	const digits: string = formula.substring(digitsStart, len - 1);
	if (digits.length === 0) return formula.substring(0, len - 1);
	const charBefore: string = digitsStart > 0 ? formula[digitsStart - 1] : "";
	const precededByLetter: boolean = digitsStart > 0 && /[A-Za-z]/.test(charBefore);
	if (precededByLetter){
		const body: string = formula.substring(0, digitsStart);
		let uppercaseCount: number = 0;
		for (let k: number = 0; k < body.length; k++){
			if (/[A-Z]/.test(body[k])) uppercaseCount++;
		}
		if (uppercaseCount <= 1) return body;
		return formula.substring(0, len - 1);
	}
	const precededByCloseBracket: boolean = digitsStart > 0 && (charBefore === ")" || charBefore === "]" || charBefore === "}");
	if (precededByCloseBracket) return formula.substring(0, len - 1);
	return formula.substring(0, digitsStart);
}
function countAtomsInFormulaIonic(formula: string): Record<string, number>{
	const body: string = stripChargeFromFormula(formula);
	return countAtomsInFormula(body);
}
function expectIonicBalanced(equation: string): void{
	const balanced: string = balanceIonic(equation);
	const sides: string[] = balanced.split(/->|=/);
	expect(sides.length).toBe(2);
	const leftTerms: string[] = sides[0].trim().split(/\s+\+\s+/).map(t => t.trim()).filter(t => t.length > 0);
	const rightTerms: string[] = sides[1].trim().split(/\s+\+\s+/).map(t => t.trim()).filter(t => t.length > 0);
	const leftAtoms: Record<string, number> = {};
	const rightAtoms: Record<string, number> = {};
	let leftCharge: number = 0;
	let rightCharge: number = 0;
	for (const term of leftTerms){
		const m: RegExpMatchArray | null = term.match(/^(\d+)/);
		const coeff: number = m !== null ? parseInt(m[0], 10) : 1;
		const formula: string = m !== null ? term.substring(m[0].length) : term;
		const counts: Record<string, number> = countAtomsInFormulaIonic(formula);
		for (const el in counts){
			leftAtoms[el] = (leftAtoms[el] || 0) + counts[el] * coeff;
		}
		leftCharge += extractChargeFromFormula(formula) * coeff;
	}
	for (const term of rightTerms){
		const m: RegExpMatchArray | null = term.match(/^(\d+)/);
		const coeff: number = m !== null ? parseInt(m[0], 10) : 1;
		const formula: string = m !== null ? term.substring(m[0].length) : term;
		const counts: Record<string, number> = countAtomsInFormulaIonic(formula);
		for (const el in counts){
			rightAtoms[el] = (rightAtoms[el] || 0) + counts[el] * coeff;
		}
		rightCharge += extractChargeFromFormula(formula) * coeff;
	}
	const allKeys: Set<string> = new Set<string>([...Object.keys(leftAtoms), ...Object.keys(rightAtoms)]);
	for (const el of allKeys){
		expect(leftAtoms[el] || 0).toBe(rightAtoms[el] || 0);
	}
	expect(leftCharge).toBe(rightCharge);
}

const largeCoeffEquations: string[] = [
	"C8H18 + O2 -> CO2 + H2O",
	"C10H22 + O2 -> CO2 + H2O",
	"C12H22O11 + O2 -> CO2 + H2O",
	"C20H42 + O2 -> CO2 + H2O",
	"C7H16 + O2 -> CO2 + H2O",
	"C9H20 + O2 -> CO2 + H2O",
	"C11H24 + O2 -> CO2 + H2O",
	"C14H10 + O2 -> CO2 + H2O",
	"C6H6 + O2 -> CO2 + H2O",
	"C10H8 + O2 -> CO2 + H2O",
	"C12H26 + O2 -> CO2 + H2O",
	"C16H34 + O2 -> CO2 + H2O",
	"C2H2 + O2 -> CO2 + H2O",
	"C2H6 + O2 -> CO2 + H2O",
	"FeS2 + O2 -> Fe2O3 + SO2",
	"Fe + H2O -> Fe3O4 + H2",
	"Fe2O3 + CO -> Fe + CO2",
	"Fe3O4 + CO -> Fe + CO2"
];

const hydrateEquations: string[] = [
	"CuSO4·5H2O + BaCl2 -> BaSO4 + CuCl2 + H2O",
	"CuSO4*5H2O + BaCl2 -> BaSO4 + CuCl2 + H2O",
	"Na2CO3·10H2O + HCl -> NaCl + H2O + CO2",
	"CaCl2·6H2O + Na2CO3 -> CaCO3 + NaCl + H2O",
	"FeSO4·7H2O + NaOH -> Fe(OH)2 + Na2SO4 + H2O",
	"Na2B4O7·10H2O + HCl -> NaCl + H3BO3 + H2O",
	"CoCl2·6H2O + AgNO3 -> Co(NO3)2 + AgCl + H2O",
	"MgSO4·7H2O + BaCl2 -> BaSO4 + MgCl2 + H2O",
	"Ni(NO3)2·6H2O + NaOH -> Ni(OH)2 + NaNO3 + H2O",
	"Na2SO4·10H2O -> Na2SO4 + H2O",
	"CuSO4·5H2O -> CuSO4 + H2O",
	"BaCl2·2H2O + Na2SO4 -> BaSO4 + NaCl + H2O",
	"Na2CO3·10H2O -> Na2CO3 + H2O",
	"MgCl2·6H2O -> MgCl2 + H2O"
];

const complexEquations: string[] = [
	"NH3 + O2 -> NO + H2O",
	"NH3 + O2 -> N2 + H2O",
	"NO2 + H2O -> HNO3 + NO",
	"KClO3 -> KCl + O2",
	"H2O2 -> H2O + O2",
	"KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2",
	"K2Cr2O7 + HCl -> KCl + CrCl3 + H2O + Cl2",
	"Cu + HNO3 -> Cu(NO3)2 + NO + H2O",
	"Cu + HNO3 -> Cu(NO3)2 + NO2 + H2O",
	"Zn + HNO3 -> Zn(NO3)2 + NH4NO3 + H2O",
	"KMnO4 + FeSO4 + H2SO4 -> MnSO4 + Fe2(SO4)3 + K2SO4 + H2O",
	"PbO + NH3 -> N2 + Pb + H2O",
	"Al + HCl -> AlCl3 + H2",
	"Al + NaOH + H2O -> NaAlO2 + H2",
	"Ca3(PO4)2 + H2SO4 -> CaSO4 + H3PO4",
	"NaOH + H2SO4 -> Na2SO4 + H2O",
	"NaOH + HCl -> NaCl + H2O",
	"BaCl2 + Na2SO4 -> BaSO4 + NaCl",
	"AgNO3 + NaCl -> AgCl + NaNO3",
	"Pb(NO3)2 + KI -> PbI2 + KNO3",
	"FeCl3 + NaOH -> Fe(OH)3 + NaCl",
	"AlCl3 + NaOH -> Al(OH)3 + NaCl",
	"Al2(SO4)3 + NaOH -> Al(OH)3 + Na2SO4",
	"Fe2(SO4)3 + BaCl2 -> FeCl3 + BaSO4",
	"Na3PO4 + CaCl2 -> Ca3(PO4)2 + NaCl",
	"(NH4)2SO4 + NaOH -> Na2SO4 + NH3 + H2O",
	"NH4Cl + NaOH -> NaCl + NH3 + H2O",
	"C3H8 + O2 -> CO + H2O",
	"C2H5OH + O2 -> CO2 + H2O",
	"CH3OH + O2 -> CO2 + H2O",
	"NaHCO3 + HCl -> NaCl + H2O + CO2",
	"CaCO3 + HCl -> CaCl2 + H2O + CO2",
	"CaCO3 -> CaO + CO2",
	"MgCO3 -> MgO + CO2",
	"NH4NO3 -> N2O + H2O",
	"NH4NO3 -> N2 + O2 + H2O",
	"KNO3 -> KNO2 + O2",
	"Ag2O -> Ag + O2",
	"HgO -> Hg + O2",
	"NaCl + H2SO4 -> Na2SO4 + HCl",
	"Fe + CuSO4 -> FeSO4 + Cu",
	"Zn + CuSO4 -> ZnSO4 + Cu",
	"Mg + HCl -> MgCl2 + H2",
	"Zn + HCl -> ZnCl2 + H2",
	"Fe + HCl -> FeCl2 + H2",
	"Fe + H2SO4 -> FeSO4 + H2",
	"Al + Fe2O3 -> Al2O3 + Fe",
	"Al + Fe3O4 -> Al2O3 + Fe",
	"Fe3O4 + H2 -> Fe + H2O",
	"Fe2O3 + C -> Fe + CO",
	"Fe3O4 + CO -> Fe + CO2",
	"Mg + CO2 -> MgO + C",
	"Na2O + H2O -> NaOH",
	"CaO + H2O -> Ca(OH)2",
	"SO2 + H2O -> H2SO3",
	"SO3 + H2O -> H2SO4",
	"P2O5 + H2O -> H3PO4",
	"N2O5 + H2O -> HNO3",
	"CO2 + H2O -> H2CO3",
	"Na2O2 + H2O -> NaOH + O2",
	"K2O + H2O -> KOH",
	"Li2O + H2O -> LiOH",
	"NaCl + AgNO3 -> AgCl + NaNO3"
];

const prevFailingEquations: string[] = [
	"C2000H4002 + O2 -> CO2 + H2O",
	"C2100H4202 + O2 -> CO2 + H2O",
	"C2200H4402 + O2 -> CO2 + H2O",
	"C2300H4602 + O2 -> CO2 + H2O",
	"C2400H4802 + O2 -> CO2 + H2O",
	"C2500H5002 + O2 -> CO2 + H2O",
	"C2600H5202 + O2 -> CO2 + H2O",
	"C2700H5402 + O2 -> CO2 + H2O",
	"C2800H5602 + O2 -> CO2 + H2O",
	"C2900H5802 + O2 -> CO2 + H2O",
	"C3000H6002 + O2 -> CO2 + H2O",
	"C3100H6202 + O2 -> CO2 + H2O",
	"C3200H6402 + O2 -> CO2 + H2O",
	"C3300H6602 + O2 -> CO2 + H2O",
	"C2000H4002 + O2 -> CO + H2O",
	"C2500H5002 + O2 -> CO + H2O",
	"C3000H6002 + O2 -> CO + H2O",
	"C3500H7002 + O2 -> CO + H2O",
	"C4500 + O2 -> CO2",
	"C5000 + O2 -> CO2",
	"C8000 + O2 -> CO2",
	"C10000 + O2 -> CO2"
];

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
	it("should handle simple ionic equations (charge-conserving via fast-balance)", ()=>{
		// The balancer conserves both atoms and charge (fast-balance).
		// Ag+ + Cu -> Ag + Cu2+ balances as 2Ag+ + Cu -> 2Ag + Cu2+
		// (2 Ag, 1 Cu, charge 2+ each side).
		expect(balanceEquation("Ag+ + Cu -> Ag + Cu2+")).toBe("2Ag+ + Cu -> 2Ag + Cu2+");
	});
	it("should balance complex ionic equations with charge conservation", ()=>{
		expect(balanceEquation("Fe2+ + Cl2 -> Fe3+ + Cl-")).toBe("2Fe2+ + Cl2 -> 2Fe3+ + 2Cl-");
	});
	it("should throw error for impossible equations", ()=>{
		expect(()=>balanceEquation("H2 + O2 -> H2O + C")).toThrow();
		expect(()=>balanceEquation("H2 + O2")).toThrow();
	});
	it("should handle the = sign as a separator", ()=>{
		expect(balanceEquation("H2 + O2 = H2O")).toBe("2H2 + O2 -> 2H2O");
	});
});

describe("Large Coefficient Equations", ()=>{
	for (const eq of largeCoeffEquations){
		it("balances "+eq, ()=>{
			expectBalanced(eq);
		});
	}
});

describe("Hydrated Compound Equations", ()=>{
	for (const eq of hydrateEquations){
		it("balances "+eq, ()=>{
			expectBalanced(eq);
		});
	}
});

describe("Complex Equations", ()=>{
	for (const eq of complexEquations){
		it("balances "+eq, ()=>{
			expectBalanced(eq);
		});
	}
});

describe("Previously Failing Equations", ()=>{
	for (const eq of prevFailingEquations){
		it("balances with maxCoeff=10000: "+eq, ()=>{
			expectBalancedMax(eq, 10000);
		});
	}
});

describe("Step-by-step Explanation", ()=>{
	it("returns BalanceResult with equation and explanation when explain=true", ()=>{
		const result = balanceEquation("H2 + O2 -> H2O", 10000, true) as BalanceResult;
		expect(result.equation).toBe("2H2 + O2 -> 2H2O");
		expect(result.explanation).toBeDefined();
		expect(result.explanation.method).toBe("Gaussian elimination over rationals with backtracking search");
		expect(result.explanation.steps.length).toBeGreaterThan(0);
		expect(result.explanation.coefficients).toEqual([2, 1, 2]);
	});
	it("returns string when explain=false (default)", ()=>{
		const result = balanceEquation("H2 + O2 -> H2O");
		expect(typeof result).toBe("string");
		expect(result).toBe("2H2 + O2 -> 2H2O");
	});
	it("explanation steps describe the balancing process", ()=>{
		const result = balanceEquation("C3H8 + O2 -> CO2 + H2O", 10000, true) as BalanceResult;
		expect(result.explanation.steps.length).toBe(6);
		expect(result.explanation.steps[0]).toContain("Parsed");
		expect(result.explanation.steps[0]).toContain("reactants");
		expect(result.explanation.steps[1]).toContain("elements");
		expect(result.explanation.steps[2]).toContain("matrix");
		expect(result.explanation.steps[3]).toContain("Gaussian");
		expect(result.explanation.steps[4]).toContain("backtracking");
		expect(result.explanation.steps[5]).toContain("coefficients");
		expect(result.explanation.coefficients).toEqual([1, 5, 3, 4]);
	});
	it("explain works for equations with large coefficients", ()=>{
		const result = balanceEquation("C8H18 + O2 -> CO2 + H2O", 10000, true) as BalanceResult;
		expect(result.equation).toBe("2C8H18 + 25O2 -> 16CO2 + 18H2O");
		expect(result.explanation.coefficients).toEqual([2, 25, 16, 18]);
	});
	it("explain works for hydrate equations", ()=>{
		const result = balanceEquation("CuSO4·5H2O + BaCl2 -> BaSO4 + CuCl2 + H2O", 10000, true) as BalanceResult;
		expect(result.explanation.coefficients).toEqual([1, 1, 1, 1, 5]);
	});
});

describe("Ionic Equation Balancing (charge-conserving)", ()=>{
	it("balances Fe2+ + Cl2 -> Fe3+ + Cl- with charge conservation", ()=>{
		expectIonicBalanced("Fe2+ + Cl2 -> Fe3+ + Cl-");
	});
	it("balances H+ + OH- -> H2O", ()=>{
		expectIonicBalanced("H+ + OH- -> H2O");
	});
	it("balances Ag+ + Cl- -> AgCl", ()=>{
		expectIonicBalanced("Ag+ + Cl- -> AgCl");
	});
	it("balances Na+ + OH- + H+ + Cl- -> NaCl + H2O", ()=>{
		expectIonicBalanced("Na+ + OH- + H+ + Cl- -> NaCl + H2O");
	});
});

const ionicEquations: string[] = [
	"Fe2+ + Cl2 -> Fe3+ + Cl-",
	"Ag+ + Cl- -> AgCl",
	"Ba2+ + SO4^2- -> BaSO4",
	"Pb2+ + 2I- -> PbI2",
	"Ca2+ + CO3^2- -> CaCO3",
	"Al3+ + OH- -> Al(OH)3",
	"NH4+ + OH- -> NH3 + H2O",
	"H+ + OH- -> H2O",
	"Na+ + Cl- -> NaCl",
	"K+ + NO3- -> KNO3",
	"Cu2+ + S2- -> CuS",
	"Fe3+ + SCN- -> Fe(SCN)2+",
	"Zn2+ + OH- -> Zn(OH)2",
	"Mg2+ + OH- -> Mg(OH)2",
	"Ca2+ + PO4^3- -> Ca3(PO4)2"
];
const polyatomicEquations: string[] = [
	"NH4NO3 -> N2O + H2O",
	"NH4Cl + NaOH -> NH3 + H2O + NaCl",
	"AgNO3 + NaCl -> AgCl + NaNO3",
	"BaCl2 + Na2SO4 -> BaSO4 + NaCl",
	"K2Cr2O7 + FeSO4 + H2SO4 -> Cr2(SO4)3 + Fe2(SO4)3 + K2SO4 + H2O",
	"KMnO4 + HCl -> MnCl2 + Cl2 + KCl + H2O",
	"Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O",
	"Na2CO3 + HCl -> NaCl + H2O + CO2",
	"(NH4)2SO4 + BaCl2 -> BaSO4 + NH4Cl",
	"CH3COOH + NaOH -> CH3COONa + H2O"
];
describe("Ionic Equations", ()=>{
	for (const eq of ionicEquations){
		it("balances atoms and charge: "+eq, ()=>{
			expectIonicBalanced(eq);
		});
	}
});
describe("Polyatomic Ion Equations", ()=>{
	for (const eq of polyatomicEquations){
		it("balances: "+eq, ()=>{
			expectBalanced(eq);
		});
	}
});
describe("Ionic Equation Explicit Outputs", ()=>{
	it("balances Fe2+ + Cl2 -> Fe3+ + Cl- to 2Fe2+ + Cl2 -> 2Fe3+ + 2Cl-", ()=>{
		expect(balanceIonic("Fe2+ + Cl2 -> Fe3+ + Cl-")).toBe("2Fe2+ + Cl2 -> 2Fe3+ + 2Cl-");
	});
	it("balances Pb2+ + 2I- -> PbI2 to Pb2+ + 2I- -> PbI2", ()=>{
		expect(balanceIonic("Pb2+ + 2I- -> PbI2")).toBe("Pb2+ + 2I- -> PbI2");
	});
	it("balances Ca2+ + PO4^3- -> Ca3(PO4)2 to 3Ca2+ + 2PO4^3- -> Ca3(PO4)2", ()=>{
		expect(balanceIonic("Ca2+ + PO4^3- -> Ca3(PO4)2")).toBe("3Ca2+ + 2PO4^3- -> Ca3(PO4)2");
	});
	it("balances Al3+ + OH- -> Al(OH)3 to Al3+ + 3OH- -> Al(OH)3", ()=>{
		expect(balanceIonic("Al3+ + OH- -> Al(OH)3")).toBe("Al3+ + 3OH- -> Al(OH)3");
	});
	it("balances Fe3+ + SCN- -> Fe(SCN)2+ to Fe3+ + 2SCN- -> Fe(SCN)2+", ()=>{
		expect(balanceIonic("Fe3+ + SCN- -> Fe(SCN)2+")).toBe("Fe3+ + 2SCN- -> Fe(SCN)2+");
	});
	it("balances Zn2+ + OH- -> Zn(OH)2 to Zn2+ + 2OH- -> Zn(OH)2", ()=>{
		expect(balanceIonic("Zn2+ + OH- -> Zn(OH)2")).toBe("Zn2+ + 2OH- -> Zn(OH)2");
	});
});
