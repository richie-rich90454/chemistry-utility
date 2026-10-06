import {describe, it, expect} from "vitest";
import {Fraction, EquationBalancer, parseEquation, balanceEquation, balanceIonic} from "./equationBalancer.js";

// White-box tests for private statics (accessed via cast). TypeScript
// `private` is compile-time only; these exercise real logic branches that
// public entry points cannot reach deterministically.
const EB = EquationBalancer as unknown as {
    lcm(a: number, b: number): number;
    gcd(a: number, b: number): number;
    parseFormulaToCounts(formula: string): Record<string, number>;
    legacyParseEquation(equation: string): { reactants: string[]; products: string[] };
    solveHomogeneous(matrix: Fraction[][], maxCoefficient?: number): Fraction[] | null;
    bruteForceBalance(matrix: Fraction[][], maxCoefficient?: number): Fraction[] | null;
    legacyBalanceEquation(equation: string, maxCoefficient?: number, explain?: boolean): string | object;
    legacyBalanceIonic(equation: string, maxCoefficient?: number): string;
    parseChargeSpec(spec: string): number;
    extractCharge(formula: string): { body: string; charge: number };
    stripLeadingCoefficient(term: string): string;
    parseFormulaWithCharge(formula: string): { counts: Record<string, number>; charge: number };
    countAtomInSide(side: Map<string, number>, element: string): number;
    countChargeInSide(side: Map<string, number>): number;
    balanceNonOHAtoms(state: { reactants: Map<string, number>; products: Map<string, number> }, maxCoefficient?: number): void;
    balanceOxygen(state: { reactants: Map<string, number>; products: Map<string, number> }): void;
    balanceHydrogenAcidic(state: { reactants: Map<string, number>; products: Map<string, number> }): void;
    balanceChargeWithElectrons(state: { reactants: Map<string, number>; products: Map<string, number> }): void;
    convertToBasic(state: { reactants: Map<string, number>; products: Map<string, number> }): void;
    cancelSpecies(state: { reactants: Map<string, number>; products: Map<string, number> }): void;
    getElectronCount(state: { reactants: Map<string, number>; products: Map<string, number> }): number;
    multiplyHalfReaction(state: { reactants: Map<string, number>; products: Map<string, number> }, factor: number): { reactants: Map<string, number>; products: Map<string, number> };
    combineHalfReactions(hr1: { reactants: Map<string, number>; products: Map<string, number> }, hr2: { reactants: Map<string, number>; products: Map<string, number> }): { reactants: Map<string, number>; products: Map<string, number> };
    formatHalfReaction(state: { reactants: Map<string, number>; products: Map<string, number> }): string;
    balanceHalfReaction(hr: { reactants: string[]; products: string[] }, maxCoefficient?: number): { reactants: Map<string, number>; products: Map<string, number> };
};

function fr(n: number, d: number = 1): Fraction{
    return new Fraction(n, d);
}

describe("white-box: lcm/gcd", function(){
    it("lcm handles zeros and common multiples", function(){
        expect(EB.lcm(0, 5)).toBe(0);
        expect(EB.lcm(5, 0)).toBe(0);
        expect(EB.lcm(4, 6)).toBe(12);
    });
    it("gcd handles zeros", function(){
        expect(EB.gcd(0, 5)).toBe(5);
        expect(EB.gcd(12, 8)).toBe(4);
    });
});

describe("white-box: parseFormulaToCounts", function(){
    it("parses hydrates with multipliers", function(){
        expect(EB.parseFormulaToCounts("CuSO4·5H2O")).toEqual({Cu: 1, S: 1, O: 9, H: 10});
    });
    it("skips empty hydrate parts", function(){
        expect(EB.parseFormulaToCounts("CuSO4··H2O")).toEqual({Cu: 1, S: 1, O: 5, H: 2});
    });
    it("parses nested brackets and charges", function(){
        expect(EB.parseFormulaToCounts("Ca3(PO4)2")).toEqual({Ca: 3, P: 2, O: 8});
        // Legacy parser reads the subscript before the charge sign.
        expect(EB.parseFormulaToCounts("Fe2+")).toEqual({Fe: 2, _charge: 1});
        expect(EB.parseFormulaToCounts("Fe+")).toEqual({Fe: 1, _charge: 1});
        expect(EB.parseFormulaToCounts("SO4^2-")).toEqual({S: 1, O: 4, _charge: -2});
        expect(EB.parseFormulaToCounts("Cl-")).toEqual({Cl: 1, _charge: -1});
    });
    it("ignores stray leading coefficients", function(){
        expect(EB.parseFormulaToCounts("2H2")).toEqual({H: 2});
    });
    it("skips unknown characters leniently instead of throwing", function(){
        // The legacy fallback parser skips characters it does not
        // understand (spaces, dots, lowercase); strict validation lives
        // in the fast-balance primary path and the Go backend.
        expect(EB.parseFormulaToCounts("H2 O2")).toEqual({H: 2, O: 2});
        expect(EB.parseFormulaToCounts("H2.O2")).toEqual({H: 2, O: 2});
        expect(EB.parseFormulaToCounts("h2")).toEqual({});
    });
    it("drops unmatched opening brackets", function(){
        expect(EB.parseFormulaToCounts("(H2")).toEqual({});
    });
    it("applies bracket multipliers", function(){
        expect(EB.parseFormulaToCounts("Al2(SO4)3")).toEqual({Al: 2, S: 3, O: 12});
    });
});

describe("white-box: legacyParseEquation", function(){
    it("throws on empty sides", function(){
        expect(function(){ return EB.legacyParseEquation("->"); }).toThrow("Invalid format");
    });
    it("throws when arrows produce more than two sides", function(){
        expect(function(){ return EB.legacyParseEquation("{H2} -> {O2} -> {H2O}"); }).toThrow("Invalid format");
    });
    it("splits charge-aware terms", function(){
        let r = EB.legacyParseEquation("Fe2+ + Fe3+ -> Fe");
        expect(r.reactants).toEqual(["Fe2+", "Fe3+"]);
    });
});

describe("white-box: solveHomogeneous", function(){
    it("returns null for empty matrix", function(){
        expect(EB.solveHomogeneous([])).toBeNull();
    });
    it("returns null for zero-column matrix", function(){
        expect(EB.solveHomogeneous([[]])).toBeNull();
    });
    it("solves a determined system", function(){
        let sol = EB.solveHomogeneous([[fr(2), fr(-2)]]);
        expect(sol).not.toBeNull();
        expect(sol!.map(function(f){ return f.n; })).toEqual([1, 1]);
    });
    it("flips all-negative raw solutions", function(){
        let sol = EB.solveHomogeneous([[fr(-2), fr(2)]]);
        expect(sol).not.toBeNull();
        expect(sol!.map(function(f){ return f.n; })).toEqual([1, 1]);
    });
    it("searches multi-dimensional nullspace with pruning", function(){
        // 2x + 2y - z = 0: two free variables, deep dfs exercising the
        // headroom bound and the best-sum prune. Minimal solution [1,1,4].
        let sol = EB.solveHomogeneous([[fr(2), fr(2), fr(-1)]]);
        expect(sol).not.toBeNull();
        let vals = sol!.map(function(f){ return f.n; });
        expect(vals.every(function(v){ return v > 0; })).toBe(true);
        expect(2 * vals[0] + 2 * vals[1] - vals[2]).toBe(0);
    });
    it("returns null when only the trivial solution exists", function(){
        expect(EB.solveHomogeneous([[fr(1), fr(0)], [fr(0), fr(1)]])).toBeNull();
    });
});

describe("white-box: bruteForceBalance", function(){
    it("solves two-species systems", function(){
        let sol = EB.bruteForceBalance([[fr(2), fr(-2)]]);
        expect(sol).not.toBeNull();
        expect(sol!.map(function(f){ return f.n; })).toEqual([1, 1]);
    });
    it("solves three-species systems", function(){
        let sol = EB.bruteForceBalance([[fr(1), fr(1), fr(-1)]]);
        expect(sol).not.toBeNull();
        expect(sol!.map(function(f){ return f.n; })).toEqual([1, 1, 2]);
    });
    it("returns null when nothing fits", function(){
        expect(EB.bruteForceBalance([[fr(1), fr(0)], [fr(0), fr(1)]])).toBeNull();
    });
});

describe("white-box: legacy balance entry points", function(){
    it("legacyBalanceEquation balances and caps", function(){
        expect(EB.legacyBalanceEquation("H2 + O2 -> H2O")).toBe("2H2 + O2 -> 2H2O");
        expect(function(){ return EB.legacyBalanceEquation("H2 + O2 -> H2O", 1); }).toThrow("Could not balance");
        expect(function(){ return EB.legacyBalanceEquation("H2 -> He"); }).toThrow("Could not balance");
    });
    it("legacyBalanceIonic balances, caps, and rejects", function(){
        expect(EB.legacyBalanceIonic("Fe + Cu2+ -> Fe2+ + Cu")).toContain("Fe");
        expect(function(){ return EB.legacyBalanceIonic("H2 + O2 -> H2O", 1); }).toThrow("Could not balance ionic equation");
        expect(function(){ return EB.legacyBalanceIonic("H2 -> He"); }).toThrow("Could not balance ionic equation");
    });
});

describe("white-box: charge parsing", function(){
    it("parseChargeSpec covers all shapes", function(){
        expect(EB.parseChargeSpec("2+")).toBe(2);
        expect(EB.parseChargeSpec("2-")).toBe(-2);
        expect(EB.parseChargeSpec("+")).toBe(1);
        expect(EB.parseChargeSpec("-")).toBe(-1);
        expect(EB.parseChargeSpec("")).toBe(0);
        expect(EB.parseChargeSpec("abc")).toBe(0);
    });
    it("extractCharge covers caret, suffix, bracket, and bare forms", function(){
        expect(EB.extractCharge("SO4^2-")).toEqual({body: "SO4", charge: -2});
        expect(EB.extractCharge("Fe2+")).toEqual({body: "Fe", charge: 2});
        expect(EB.extractCharge("Fe+")).toEqual({body: "Fe", charge: 1});
        expect(EB.extractCharge("Cl-")).toEqual({body: "Cl", charge: -1});
        expect(EB.extractCharge("(OH)2-")).toEqual({body: "(OH)2", charge: -1});
        expect(EB.extractCharge("12-")).toEqual({body: "", charge: -12});
        expect(EB.extractCharge("H2O")).toEqual({body: "H2O", charge: 0});
        expect(EB.extractCharge("")).toEqual({body: "", charge: 0});
        expect(EB.extractCharge("NaCl2+")).toEqual({body: "NaCl2", charge: 1});
    });
    it("stripLeadingCoefficient strips or passes through", function(){
        expect(EB.stripLeadingCoefficient("2H2O")).toBe("H2O");
        expect(EB.stripLeadingCoefficient("H2O")).toBe("H2O");
    });
    it("parseFormulaWithCharge merges and resolves polyatomics", function(){
        expect(EB.parseFormulaWithCharge("Fe2+2+")).toEqual({counts: {Fe: 2}, charge: 3});
        expect(EB.parseFormulaWithCharge("SO4")).toEqual({counts: {S: 1, O: 4}, charge: -2});
        expect(EB.parseFormulaWithCharge("NaCl")).toEqual({counts: {Na: 1, Cl: 1}, charge: 0});
        expect(EB.parseFormulaWithCharge("Fe2+")).toEqual({counts: {Fe: 1}, charge: 2});
    });
});

describe("white-box: error paths, explain mode, and redox helpers", function(){
    it("parseEquation falls back to legacy on unknown elements", function(){
        let r = parseEquation("Xy2 + O2 -> H2O");
        expect(r.reactants).toEqual(["Xy2", "O2"]);
        expect(r.products).toEqual(["H2O"]);
    });
    it("parseEquation reports empty sides", function(){
        expect(function(){ return parseEquation("->"); }).toThrow("Invalid format");
    });
    it("parseEquation rethrows non-balance errors", function(){
        expect(function(){ return parseEquation(null as unknown as string); }).toThrow();
    });
    it("balanceEquation rethrows non-balance errors", function(){
        expect(function(){ return balanceEquation(null as unknown as string); }).toThrow();
    });
    it("balanceIonic rethrows non-balance errors", function(){
        expect(function(){ return balanceIonic(null as unknown as string); }).toThrow();
    });
    it("balanceIonic falls back to legacy on unknown elements", function(){
        expect(function(){ return balanceIonic("Xy2 + O2 -> H2O"); }).toThrow("Could not balance ionic equation");
    });
    it("balanceIonic reports empty sides", function(){
        expect(function(){ return balanceIonic("-> H2O"); }).toThrow("Invalid format");
    });
    it("balanceIonic reports garbage input", function(){
        expect(function(){ return balanceIonic("H2 O2 H2O"); }).toThrow();
    });
    it("legacy cap applies to curly equations", function(){
        expect(function(){ return balanceEquation("Al2{SO4}3 + NaOH -> Al{OH}3 + Na2SO4", 1); }).toThrow("Could not balance");
        expect(function(){ return balanceIonic("Al2{SO4}3 + NaOH -> Al{OH}3 + Na2SO4", 1); }).toThrow("Could not balance ionic equation");
    });
    it("explain mode tracks charge and handles charge-only species", function(){
        let ionic = balanceEquation("Fe + Cu2+ -> Fe2+ + Cu", 10000, true);
        expect(typeof ionic).toBe("object");
        if (typeof ionic !== "string"){
            expect(ionic.explanation.steps.length).toBeGreaterThan(0);
        }
        let bare = balanceEquation("e- -> e-", 10000, true);
        expect(typeof bare === "string" || (typeof bare !== "string" && bare.explanation.steps.length > 0)).toBe(true);
    });
    it("balanceRedox validates separator and electron transfer", function(){
        expect(function(){ return EquationBalancer.balanceRedox("H2 + O2 -> H2O", "acidic"); }).toThrow("Invalid redox format");
        expect(function(){ return EquationBalancer.balanceRedox("H2 -> H2 || O2 -> O2", "acidic"); }).toThrow("Could not determine electron count");
    });
});
describe("white-box: redox helpers", function(){
    function state(pairs: Array<[string, number]>): { reactants: Map<string, number>; products: Map<string, number> }{
        return {reactants: new Map<string, number>(pairs), products: new Map<string, number>()};
    }
    it("countAtomInSide and countChargeInSide total correctly", function(){
        let s = state([["H2O", 2], ["O2", 1]]);
        expect(EB.countAtomInSide(s.reactants, "H")).toBe(4);
        expect(EB.countAtomInSide(s.reactants, "O")).toBe(4);
        expect(EB.countAtomInSide(s.reactants, "C")).toBe(0);
        let c = state([["Fe2+", 2], ["Cl-", 1]]);
        expect(EB.countChargeInSide(c.reactants)).toBe(3);
        expect(EB.countChargeInSide(c.products)).toBe(0);
    });
    it("balanceNonOHAtoms balances a missing element and no-ops otherwise", function(){
        // Only non-O/H elements are considered: pure H/O states are untouched.
        let untouched = {reactants: new Map<string, number>([["H2", 1]]), products: new Map<string, number>([["H2O", 1]])};
        EB.balanceNonOHAtoms(untouched, 10000);
        expect(untouched.reactants.get("O2")).toBe(undefined);
        // Unsolvable single-species matrix returns silently.
        let unsolvable = {reactants: new Map<string, number>([["X", 1]]), products: new Map<string, number>()};
        EB.balanceNonOHAtoms(unsolvable, 10000);
        expect(unsolvable.products.size).toBe(0);
        // Mn is balanced 1:1 through the solver.
        let s = {reactants: new Map<string, number>([["MnO4-", 1]]), products: new Map<string, number>([["Mn2+", 1]])};
        EB.balanceNonOHAtoms(s, 10000);
        expect(s.reactants.get("MnO4-")).toBe(1);
        expect(s.products.get("Mn2+")).toBe(1);
    });
    it("balanceOxygen adds water to the short side", function(){
        let needProduct = {reactants: new Map<string, number>([["O2", 1]]), products: new Map<string, number>()};
        EB.balanceOxygen(needProduct);
        expect(needProduct.products.get("H2O")).toBe(2);
        let needReactant = {reactants: new Map<string, number>(), products: new Map<string, number>([["O2", 1]])};
        EB.balanceOxygen(needReactant);
        expect(needReactant.reactants.get("H2O")).toBe(2);
        let balanced = {reactants: new Map<string, number>([["H2O", 1]]), products: new Map<string, number>([["H2O", 1]])};
        EB.balanceOxygen(balanced);
        expect(balanced.products.get("H2O")).toBe(1);
    });
    it("balanceHydrogenAcidic adds protons to the short side", function(){
        let needProduct = {reactants: new Map<string, number>([["H2", 1]]), products: new Map<string, number>()};
        EB.balanceHydrogenAcidic(needProduct);
        expect(needProduct.products.get("H+")).toBe(2);
        let needReactant = {reactants: new Map<string, number>(), products: new Map<string, number>([["H2", 1]])};
        EB.balanceHydrogenAcidic(needReactant);
        expect(needReactant.reactants.get("H+")).toBe(2);
        let balanced = {reactants: new Map<string, number>([["H+", 1]]), products: new Map<string, number>([["H+", 1]])};
        EB.balanceHydrogenAcidic(balanced);
        expect(balanced.products.get("H+")).toBe(1);
    });
    it("balanceChargeWithElectrons adds electrons to the short side", function(){
        let needReactant = {reactants: new Map<string, number>([["Fe2+", 1]]), products: new Map<string, number>([["Fe3+", 1]])};
        EB.balanceChargeWithElectrons(needReactant);
        expect(needReactant.products.get("e-")).toBe(1);
        let needProduct = {reactants: new Map<string, number>([["Fe3+", 1]]), products: new Map<string, number>([["Fe2+", 1]])};
        EB.balanceChargeWithElectrons(needProduct);
        expect(needProduct.reactants.get("e-")).toBe(1);
        let balanced = {reactants: new Map<string, number>([["Fe2+", 1]]), products: new Map<string, number>([["Fe2+", 1]])};
        EB.balanceChargeWithElectrons(balanced);
        expect(balanced.products.has("e-")).toBe(false);
    });
    it("convertToBasic swaps H+ for OH- and H2O", function(){
        let s = {reactants: new Map<string, number>([["H+", 2]]), products: new Map<string, number>([["H+", 1]])};
        EB.convertToBasic(s);
        expect(s.reactants.has("H+")).toBe(false);
        expect(s.products.has("H+")).toBe(false);
        expect(s.products.get("OH-")).toBe(2);
        expect(s.reactants.get("OH-")).toBe(1);
        expect(s.reactants.get("H2O")).toBe(2);
        expect(s.products.get("H2O")).toBe(1);
    });
    it("cancelSpecies removes common species", function(){
        let s = {reactants: new Map<string, number>([["H2O", 3], ["H2", 1]]), products: new Map<string, number>([["H2O", 1], ["O2", 1]])};
        EB.cancelSpecies(s);
        expect(s.reactants.get("H2O")).toBe(2);
        expect(s.products.has("H2O")).toBe(false);
        expect(s.products.get("O2")).toBe(1);
    });
    it("getElectronCount totals electron coefficients", function(){
        let s = {reactants: new Map<string, number>([["e-", 3], ["H+", 2]]), products: new Map<string, number>()};
        expect(EB.getElectronCount(s)).toBe(3);
    });
    it("multiplyHalfReaction scales coefficients", function(){
        let s = {reactants: new Map<string, number>([["H2", 1]]), products: new Map<string, number>([["H+", 2]])};
        let out = EB.multiplyHalfReaction(s, 3);
        expect(out.reactants.get("H2")).toBe(3);
        expect(out.products.get("H+")).toBe(6);
    });
    it("combineHalfReactions merges sides", function(){
        let a = {reactants: new Map<string, number>([["H2", 1]]), products: new Map<string, number>([["H+", 2]])};
        let b = {reactants: new Map<string, number>([["O2", 1]]), products: new Map<string, number>([["H2O", 2]])};
        let out = EB.combineHalfReactions(a, b);
        expect(out.reactants.get("H2")).toBe(1);
        expect(out.reactants.get("O2")).toBe(1);
        expect(out.products.get("H+")).toBe(2);
    });
    it("formatHalfReaction renders coefficients with H+/OH-/H2O last", function(){
        let s = {reactants: new Map<string, number>([["H2", 2], ["O2", 1]]), products: new Map<string, number>([["H2O", 2], ["H+", 1]])};
        expect(EB.formatHalfReaction(s)).toBe("2H2 + O2 -> H+ + 2H2O");
    });
    it("balanceHalfReaction balances atoms, oxygen, hydrogen, and charge", function(){
        let out = EB.balanceHalfReaction({reactants: ["MnO4-"], products: ["Mn2+"]}, 10000);
        expect(out.reactants.get("MnO4-")).toBe(1);
        expect(out.products.get("Mn2+")).toBe(1);
        expect(out.reactants.get("H+")).toBe(8);
        expect(out.reactants.get("H2O")).toBe(undefined);
        expect(out.products.get("H2O")).toBe(4);
    });
});
