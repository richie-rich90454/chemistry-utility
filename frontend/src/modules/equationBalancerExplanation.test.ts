import {describe, it, expect} from "vitest";
import {balanceEquation} from "./equationBalancer.js";
describe("balanceEquation explanation output", function(){
    it("returns BalanceResult when explain=true", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true);
        expect(typeof result).toBe("object");
        expect(result).not.toBeNull();
    });
    it("returns string when explain=false", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, false);
        expect(typeof result).toBe("string");
    });
    it("includes equation field in BalanceResult", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true) as any;
        expect(result.equation).toBe("2H2 + O2 -> 2H2O");
    });
    it("includes explanation object in BalanceResult", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true) as any;
        expect(result.explanation).toBeDefined();
        expect(typeof result.explanation).toBe("object");
    });
    it("explanation has method field as non-empty string", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true) as any;
        expect(typeof result.explanation.method).toBe("string");
        expect(result.explanation.method.length).toBeGreaterThan(0);
    });
    it("explanation has steps array with at least 4 entries", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true) as any;
        expect(Array.isArray(result.explanation.steps)).toBe(true);
        expect(result.explanation.steps.length).toBeGreaterThanOrEqual(4);
    });
    it("explanation has coefficients array matching species count", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true) as any;
        expect(Array.isArray(result.explanation.coefficients)).toBe(true);
        expect(result.explanation.coefficients).toEqual([2, 1, 2]);
    });
    it("first step mentions parsing", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true) as any;
        let firstStep=result.explanation.steps[0].toLowerCase();
        expect(firstStep.indexOf("pars")).toBeGreaterThanOrEqual(0);
    });
    it("step mentions reactant and product counts", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true) as any;
        let parsingStep=result.explanation.steps.find(function(s: string){
            return s.indexOf("reactant")!==-1;
        });
        expect(parsingStep).toBeDefined();
        expect(parsingStep).toContain("2");
        expect(parsingStep).toContain("1");
    });
    it("step mentions elements tracked", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true) as any;
        let elementStep=result.explanation.steps.find(function(s: string){
            return s.toLowerCase().indexOf("element")!==-1;
        });
        expect(elementStep).toBeDefined();
        expect(elementStep).toContain("H");
        expect(elementStep).toContain("O");
    });
    it("step mentions matrix construction", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true) as any;
        let matrixStep=result.explanation.steps.find(function(s: string){
            return s.toLowerCase().indexOf("matrix")!==-1;
        });
        expect(matrixStep).toBeDefined();
    });
    it("step mentions Gaussian elimination or nullspace", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true) as any;
        let solverStep=result.explanation.steps.find(function(s: string){
            let lower=s.toLowerCase();
            return lower.indexOf("gaussian")!==-1||lower.indexOf("nullspace")!==-1||lower.indexOf("backtracking")!==-1;
        });
        expect(solverStep).toBeDefined();
    });
    it("step mentions final coefficients", function(){
        let result=balanceEquation("H2 + O2 -> H2O", 10000, true) as any;
        let coeffStep=result.explanation.steps.find(function(s: string){
            return s.toLowerCase().indexOf("coefficient")!==-1;
        });
        expect(coeffStep).toBeDefined();
        expect(coeffStep).toContain("2");
    });
    it("explanation works for multi-element equation", function(){
        let result=balanceEquation("Fe2O3 + CO -> Fe + CO2", 10000, true) as any;
        expect(result.equation).toBe("Fe2O3 + 3CO -> 2Fe + 3CO2");
        expect(result.explanation.coefficients).toEqual([1, 3, 2, 3]);
        expect(result.explanation.steps.length).toBeGreaterThanOrEqual(4);
    });
    it("explanation works for hydrocarbon combustion", function(){
        let result=balanceEquation("C8H18 + O2 -> CO2 + H2O", 10000, true) as any;
        expect(result.equation).toBe("2C8H18 + 25O2 -> 16CO2 + 18H2O");
        expect(result.explanation.coefficients).toEqual([2, 25, 16, 18]);
    });
    it("explanation works for hydrate decomposition", function(){
        let result=balanceEquation("CuSO4·5H2O -> CuSO4 + H2O", 10000, true) as any;
        expect(result.equation).toBe("CuSO4·5H2O -> CuSO4 + 5H2O");
        expect(result.explanation.coefficients).toEqual([1, 1, 5]);
    });
    it("explanation works for complex equation with polyatomic ions", function(){
        let result=balanceEquation("Al2(SO4)3 + BaCl2 -> AlCl3 + BaSO4", 10000, true) as any;
        expect(result.equation).toBe("Al2(SO4)3 + 3BaCl2 -> 2AlCl3 + 3BaSO4");
        expect(result.explanation.coefficients).toEqual([1, 3, 2, 3]);
    });
    it("explanation works for already-balanced equation", function(){
        let result=balanceEquation("NaOH + HCl -> NaCl + H2O", 10000, true) as any;
        expect(result.equation).toBe("NaOH + HCl -> NaCl + H2O");
        expect(result.explanation.coefficients).toEqual([1, 1, 1, 1]);
    });
});
