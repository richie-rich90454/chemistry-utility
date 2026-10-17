import {describe, it, expect} from "vitest";
import {balanceEquation, balanceIonic} from "./equationBalancer.js";

describe("empty and whitespace formulas", function(){
    it("throws for empty reactant side (-> H2)", function(){
        expect(function(){balanceEquation("-> H2");}).toThrow();
    });
    it("throws for empty product side (H2 ->)", function(){
        expect(function(){balanceEquation("H2 ->");}).toThrow();
    });
    it("throws for whitespace-only reactant side", function(){
        expect(function(){balanceEquation("   -> H2");}).toThrow();
    });
    it("throws for empty formula on both sides", function(){
        expect(function(){balanceEquation("->");}).toThrow();
    });
});

describe("single element formulas", function(){
    it("balances Fe -> Fe", function(){
        expect(balanceEquation("Fe -> Fe")).toBe("Fe -> Fe");
    });
    it("balances Na -> Na", function(){
        expect(balanceEquation("Na -> Na")).toBe("Na -> Na");
    });
    it("balances U -> U (single letter symbol)", function(){
        expect(balanceEquation("U -> U")).toBe("U -> U");
    });
});

describe("subscript of 1", function(){
    it("balances H1 + O1 -> H1O1 (explicit subscript 1)", function(){
        expect(balanceEquation("H1 + O1 -> H1O1")).toBe("H1 + O1 -> H1O1");
    });
    it("balances Fe1 -> Fe1", function(){
        expect(balanceEquation("Fe1 -> Fe1")).toBe("Fe1 -> Fe1");
    });
    it("treats H1 same as H in balancing", function(){
        var withOne = balanceEquation("H1 + O1 -> H1O1") as string;
        var without = balanceEquation("H + O -> HO") as string;
        var a = withOne.split(" -> ")[0];
        var b = without.split(" -> ")[0];
        expect(a.replace(/1/g, "")).toBe(b);
    });
});

describe("nested parentheses", function(){
    it("balances Ca3(PO4)2 + H2SO4 -> CaSO4 + H3PO4", function(){
        expect(balanceEquation("Ca3(PO4)2 + H2SO4 -> CaSO4 + H3PO4")).toBe("Ca3(PO4)2 + 3H2SO4 -> 3CaSO4 + 2H3PO4");
    });
    it("balances K4[Fe(CN)6] with mixed bracket types (already in main suite)", function(){
        expect(balanceEquation("K4[Fe(CN)6] + H2SO4 + H2O -> K2SO4 + FeSO4 + (NH4)2SO4 + CO"))
            .toBe("K4[Fe(CN)6] + 6H2SO4 + 6H2O -> 2K2SO4 + FeSO4 + 3(NH4)2SO4 + 6CO");
    });
});

describe("bracket types are interchangeable", function(){
    it("parses Ca[OH]2 with correct coefficients", function(){
        expect(balanceEquation("Ca[OH]2 + HCl -> CaCl2 + H2O")).toBe("Ca[OH]2 + 2HCl -> CaCl2 + 2H2O");
    });
    it("parses Ca{OH}2 with correct coefficients", function(){
        expect(balanceEquation("Ca{OH}2 + HCl -> CaCl2 + H2O")).toBe("Ca{OH}2 + 2HCl -> CaCl2 + 2H2O");
    });
    it("produces same coefficients as Ca(OH)2 for square brackets", function(){
        var bracket = balanceEquation("Ca[OH]2 + HCl -> CaCl2 + H2O") as string;
        var paren = balanceEquation("Ca(OH)2 + HCl -> CaCl2 + H2O") as string;
        var bracketTail = bracket.substring(bracket.indexOf(" + "));
        var parenTail = paren.substring(paren.indexOf(" + "));
        expect(bracketTail).toBe(parenTail);
    });
    it("produces same coefficients as Ca(OH)2 for curly braces", function(){
        var brace = balanceEquation("Ca{OH}2 + HCl -> CaCl2 + H2O") as string;
        var paren = balanceEquation("Ca(OH)2 + HCl -> CaCl2 + H2O") as string;
        var braceTail = brace.substring(brace.indexOf(" + "));
        var parenTail = paren.substring(paren.indexOf(" + "));
        expect(braceTail).toBe(parenTail);
    });
});

describe("multiple hydrate parts", function(){
    it("balances CuSO4·5H2O·NaCl -> CuSO4 + NaCl + H2O", function(){
        expect(balanceEquation("CuSO4·5H2O·NaCl -> CuSO4 + NaCl + H2O")).toBe("CuSO4·5H2O·NaCl -> CuSO4 + NaCl + 5H2O");
    });
    it("balances CuSO4·5H2O (single hydrate part already tested)", function(){
        expect(balanceEquation("CuSO4·5H2O -> CuSO4 + H2O")).toBe("CuSO4·5H2O -> CuSO4 + 5H2O");
    });
});

describe("asterisk hydrate notation", function(){
    it("balances MgSO4*7H2O -> MgSO4 + H2O", function(){
        expect(balanceEquation("MgSO4*7H2O -> MgSO4 + H2O")).toBe("MgSO4*7H2O -> MgSO4 + 7H2O");
    });
    it("balances NiSO4*7H2O (asterisk variant of dot notation)", function(){
        expect(balanceEquation("NiSO4*7H2O -> NiSO4 + H2O")).toBe("NiSO4*7H2O -> NiSO4 + 7H2O");
    });
});

describe("caret charge notation (ionic)", function(){
    it("balances Cr2O7^2- + Fe2+ + H+ -> Cr3+ + Fe3+ + H2O", function(){
        expect(balanceIonic("Cr2O7^2- + Fe2+ + H+ -> Cr3+ + Fe3+ + H2O")).toBe("Cr2O7^2- + 6Fe2+ + 14H+ -> 2Cr3+ + 6Fe3+ + 7H2O");
    });
    it("balances Ba2+ + SO4^2- -> BaSO4 (caret on anion)", function(){
        expect(balanceIonic("Ba2+ + SO4^2- -> BaSO4")).toBe("Ba2+ + SO4^2- -> BaSO4");
    });
    it("balances Ca2+ + PO4^3- -> Ca3(PO4)2 (caret with multi-digit charge)", function(){
        expect(balanceIonic("Ca2+ + PO4^3- -> Ca3(PO4)2")).toBe("3Ca2+ + 2PO4^3- -> Ca3(PO4)2");
    });
});

describe("large subscripts", function(){
    it("balances C100H200 + O2 -> CO2 + H2O", function(){
        expect(balanceEquation("C100H200 + O2 -> CO2 + H2O")).toBe("C100H200 + 150O2 -> 100CO2 + 100H2O");
    });
    it("balances C1000H2000 + O2 -> CO2 + H2O", function(){
        expect(balanceEquation("C1000H2000 + O2 -> CO2 + H2O")).toBe("C1000H2000 + 1500O2 -> 1000CO2 + 1000H2O");
    });
});

describe("no subscript after parentheses (implied 1)", function(){
    it("balances Fe(OH) -> Fe + O + H", function(){
        expect(balanceEquation("Fe(OH) -> Fe + O + H")).toBe("Fe(OH) -> Fe + O + H");
    });
    it("balances Ca(OH) -> Ca + O + H", function(){
        expect(balanceEquation("Ca(OH) -> Ca + O + H")).toBe("Ca(OH) -> Ca + O + H");
    });
});

describe("mixed case in element symbols", function(){
    it("balances NaCl -> Na + Cl (valid mixed case)", function(){
        expect(balanceEquation("NaCl -> Na + Cl")).toBe("NaCl -> Na + Cl");
    });
    it("balances Fe2O3 + CO -> Fe + CO2 (valid mixed case)", function(){
        expect(balanceEquation("Fe2O3 + CO -> Fe + CO2")).toBe("Fe2O3 + 3CO -> 2Fe + 3CO2");
    });
    it("throws for lowercase element symbols (nacl is invalid)", function(){
        // Lowercase element symbols are not valid chemical notation; the parser
        // only starts an element token at an uppercase letter, so "nacl" parses
        // as an empty formula and balancing fails.
        expect(function(){balanceEquation("nacl -> na + cl");}).toThrow();
    });
    it("throws for all-lowercase reactant", function(){
        expect(function(){balanceEquation("h2 + o2 -> h2o");}).toThrow();
    });
});

describe("unknown elements (accepted for balancing purposes)", function(){
    // The parser does not validate against the periodic table. Unknown
    // element tokens such as Xx or Yy are treated as distinct keys and
    // balanced like any real element. This is intentional: it lets the
    // algebraic balancer work without a chemical database, while the
    // caller remains responsible for validating element symbols.
    it("balances Xx2 + Yy3 -> Xx2Yy3", function(){
        expect(balanceEquation("Xx2 + Yy3 -> Xx2Yy3")).toBe("Xx2 + Yy3 -> Xx2Yy3");
    });
    it("balances Aa2Bb3 -> Aa2Bb3 (unknown elements on both sides)", function(){
        expect(balanceEquation("Aa2Bb3 -> Aa2Bb3")).toBe("Aa2Bb3 -> Aa2Bb3");
    });
});

describe("whitespace in formulas", function(){
    it("balances H2 + O2 -> H2O with extra surrounding spaces", function(){
        expect(balanceEquation("  H2 + O2 -> H2O  ")).toBe("2H2 + O2 -> 2H2O");
    });
    it("balances H2 + O2 -> H2O with extra inter-term spaces", function(){
        expect(balanceEquation("H2   +   O2  ->  H2O")).toBe("2H2 + O2 -> 2H2O");
    });
});

describe("complex polyatomic with nested parentheses", function(){
    it("balances K4Fe(CN)6 -> K + Fe + C + N", function(){
        expect(balanceEquation("K4Fe(CN)6 -> K + Fe + C + N")).toBe("K4Fe(CN)6 -> 4K + Fe + 6C + 6N");
    });
    it("balances Al2(SO4)3 + NaOH -> Al(OH)3 + Na2SO4", function(){
        expect(balanceEquation("Al2(SO4)3 + NaOH -> Al(OH)3 + Na2SO4")).toBe("Al2(SO4)3 + 6NaOH -> 2Al(OH)3 + 3Na2SO4");
    });
});
