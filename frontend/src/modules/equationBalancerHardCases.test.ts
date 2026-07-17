import {describe, it, expect} from "vitest";
import {balanceEquation, balanceIonic} from "./equationBalancer.js";
describe("combustion reactions", function(){
    it("balances methane combustion", function(){
        expect(balanceEquation("CH4 + O2 -> CO2 + H2O")).toBe("CH4 + 2O2 -> CO2 + 2H2O");
    });
    it("balances ethane combustion", function(){
        expect(balanceEquation("C2H6 + O2 -> CO2 + H2O")).toBe("2C2H6 + 7O2 -> 4CO2 + 6H2O");
    });
    it("balances propane combustion", function(){
        expect(balanceEquation("C3H8 + O2 -> CO2 + H2O")).toBe("C3H8 + 5O2 -> 3CO2 + 4H2O");
    });
    it("balances butane combustion", function(){
        expect(balanceEquation("C4H10 + O2 -> CO2 + H2O")).toBe("2C4H10 + 13O2 -> 8CO2 + 10H2O");
    });
    it("balances octane combustion", function(){
        expect(balanceEquation("C8H18 + O2 -> CO2 + H2O")).toBe("2C8H18 + 25O2 -> 16CO2 + 18H2O");
    });
    it("balances glucose combustion", function(){
        expect(balanceEquation("C6H12O6 + O2 -> CO2 + H2O")).toBe("C6H12O6 + 6O2 -> 6CO2 + 6H2O");
    });
    it("balances ethanol combustion", function(){
        expect(balanceEquation("C2H5OH + O2 -> CO2 + H2O")).toBe("C2H5OH + 3O2 -> 2CO2 + 3H2O");
    });
    it("balances benzene combustion", function(){
        expect(balanceEquation("C6H6 + O2 -> CO2 + H2O")).toBe("2C6H6 + 15O2 -> 12CO2 + 6H2O");
    });
    it("balances methanol combustion", function(){
        expect(balanceEquation("CH3OH + O2 -> CO2 + H2O")).toBe("2CH3OH + 3O2 -> 2CO2 + 4H2O");
    });
    it("balances hydrogen combustion", function(){
        expect(balanceEquation("H2 + O2 -> H2O")).toBe("2H2 + O2 -> 2H2O");
    });
});
describe("redox reactions", function(){
    it("balances permanganate with iron(II) in acid", function(){
        expect(balanceIonic("MnO4- + Fe2+ + H+ -> Mn2+ + Fe3+ + H2O")).toBe("MnO4- + 5Fe2+ + 8H+ -> Mn2+ + 5Fe3+ + 4H2O");
    });
    it("balances dichromate with iron(II) in acid", function(){
        expect(balanceIonic("Cr2O7^2- + Fe2+ + H+ -> Cr3+ + Fe3+ + H2O")).toBe("Cr2O7^2- + 6Fe2+ + 14H+ -> 2Cr3+ + 6Fe3+ + 7H2O");
    });
    it("balances halogen displacement chlorine and iodide", function(){
        expect(balanceIonic("Cl2 + I- -> Cl- + I2")).toBe("Cl2 + 2I- -> 2Cl- + I2");
    });
    it("balances hydrogen peroxide with permanganate", function(){
        expect(balanceIonic("H2O2 + MnO4- + H+ -> O2 + Mn2+ + H2O")).toBe("5H2O2 + 2MnO4- + 6H+ -> 5O2 + 2Mn2+ + 8H2O");
    });
    it("balances zinc with copper(II)", function(){
        expect(balanceIonic("Zn + Cu2+ -> Zn2+ + Cu")).toBe("Zn + Cu2+ -> Zn2+ + Cu");
    });
    it("balances iron with copper(II)", function(){
        expect(balanceIonic("Fe + Cu2+ -> Fe2+ + Cu")).toBe("Fe + Cu2+ -> Fe2+ + Cu");
    });
    it("balances magnesium with hydrochloric acid", function(){
        expect(balanceIonic("Mg + H+ -> Mg2+ + H2")).toBe("Mg + 2H+ -> Mg2+ + H2");
    });
    it("balances tin with silver", function(){
        expect(balanceIonic("Sn + Ag+ -> Sn2+ + Ag")).toBe("Sn + 2Ag+ -> Sn2+ + 2Ag");
    });
    it("balances aluminum with copper(II)", function(){
        expect(balanceIonic("Al + Cu2+ -> Al3+ + Cu")).toBe("2Al + 3Cu2+ -> 2Al3+ + 3Cu");
    });
    it("balances magnesium with zinc", function(){
        expect(balanceIonic("Mg + Zn2+ -> Mg2+ + Zn")).toBe("Mg + Zn2+ -> Mg2+ + Zn");
    });
});
describe("hydrate decomposition reactions", function(){
    it("balances copper(II) sulfate pentahydrate decomposition", function(){
        expect(balanceEquation("CuSO4·5H2O -> CuSO4 + H2O")).toBe("CuSO4·5H2O -> CuSO4 + 5H2O");
    });
    it("balances magnesium sulfate heptahydrate decomposition", function(){
        expect(balanceEquation("MgSO4·7H2O -> MgSO4 + H2O")).toBe("MgSO4·7H2O -> MgSO4 + 7H2O");
    });
    it("balances sodium carbonate decahydrate decomposition", function(){
        expect(balanceEquation("Na2CO3·10H2O -> Na2CO3 + H2O")).toBe("Na2CO3·10H2O -> Na2CO3 + 10H2O");
    });
    it("balances calcium chloride hexahydrate decomposition", function(){
        expect(balanceEquation("CaCl2·6H2O -> CaCl2 + H2O")).toBe("CaCl2·6H2O -> CaCl2 + 6H2O");
    });
    it("balances iron(II) sulfate heptahydrate decomposition", function(){
        expect(balanceEquation("FeSO4·7H2O -> FeSO4 + H2O")).toBe("FeSO4·7H2O -> FeSO4 + 7H2O");
    });
    it("balances barium chloride dihydrate decomposition", function(){
        expect(balanceEquation("BaCl2·2H2O -> BaCl2 + H2O")).toBe("BaCl2·2H2O -> BaCl2 + 2H2O");
    });
    it("balances sodium sulfate decahydrate decomposition", function(){
        expect(balanceEquation("Na2SO4·10H2O -> Na2SO4 + H2O")).toBe("Na2SO4·10H2O -> Na2SO4 + 10H2O");
    });
    it("balances potassium aluminum sulfate dodecahydrate decomposition", function(){
        expect(balanceEquation("KAl(SO4)2·12H2O -> KAl(SO4)2 + H2O")).toBe("KAl(SO4)2·12H2O -> KAl(SO4)2 + 12H2O");
    });
    it("balances cobalt(II) chloride hexahydrate decomposition", function(){
        expect(balanceEquation("CoCl2·6H2O -> CoCl2 + H2O")).toBe("CoCl2·6H2O -> CoCl2 + 6H2O");
    });
    it("balances nickel sulfate heptahydrate decomposition with asterisk notation", function(){
        expect(balanceEquation("NiSO4*7H2O -> NiSO4 + H2O")).toBe("NiSO4*7H2O -> NiSO4 + 7H2O");
    });
});
describe("polyatomic ion reactions", function(){
    it("balances sodium hydroxide with hydrochloric acid", function(){
        expect(balanceEquation("NaOH + HCl -> NaCl + H2O")).toBe("NaOH + HCl -> NaCl + H2O");
    });
    it("balances calcium hydroxide with hydrochloric acid", function(){
        expect(balanceEquation("Ca(OH)2 + HCl -> CaCl2 + H2O")).toBe("Ca(OH)2 + 2HCl -> CaCl2 + 2H2O");
    });
    it("balances sodium carbonate with hydrochloric acid", function(){
        expect(balanceEquation("Na2CO3 + HCl -> NaCl + H2O + CO2")).toBe("Na2CO3 + 2HCl -> 2NaCl + H2O + CO2");
    });
    it("balances ammonium chloride with sodium hydroxide", function(){
        expect(balanceEquation("NH4Cl + NaOH -> NaCl + H2O + NH3")).toBe("NH4Cl + NaOH -> NaCl + H2O + NH3");
    });
    it("balances silver nitrate with sodium chloride", function(){
        expect(balanceEquation("AgNO3 + NaCl -> AgCl + NaNO3")).toBe("AgNO3 + NaCl -> AgCl + NaNO3");
    });
    it("balances barium chloride with sodium sulfate", function(){
        expect(balanceEquation("BaCl2 + Na2SO4 -> BaSO4 + NaCl")).toBe("BaCl2 + Na2SO4 -> BaSO4 + 2NaCl");
    });
    it("balances potassium hydroxide with nitric acid", function(){
        expect(balanceEquation("KOH + HNO3 -> KNO3 + H2O")).toBe("KOH + HNO3 -> KNO3 + H2O");
    });
    it("balances aluminum sulfate with barium chloride", function(){
        expect(balanceEquation("Al2(SO4)3 + BaCl2 -> AlCl3 + BaSO4")).toBe("Al2(SO4)3 + 3BaCl2 -> 2AlCl3 + 3BaSO4");
    });
    it("balances ammonium sulfate with sodium hydroxide", function(){
        expect(balanceEquation("(NH4)2SO4 + NaOH -> Na2SO4 + H2O + NH3")).toBe("(NH4)2SO4 + 2NaOH -> Na2SO4 + 2H2O + 2NH3");
    });
    it("balances potassium permanganate with hydrochloric acid", function(){
        expect(balanceEquation("KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2")).toBe("2KMnO4 + 16HCl -> 2KCl + 2MnCl2 + 8H2O + 5Cl2");
    });
});
describe("organic substitution and addition reactions", function(){
    it("balances methane chlorination", function(){
        expect(balanceEquation("CH4 + Cl2 -> CH3Cl + HCl")).toBe("CH4 + Cl2 -> CH3Cl + HCl");
    });
    it("balances ethene hydrogenation", function(){
        expect(balanceEquation("C2H4 + H2 -> C2H6")).toBe("C2H4 + H2 -> C2H6");
    });
    it("balances ethene bromine addition", function(){
        expect(balanceEquation("C2H4 + Br2 -> C2H4Br2")).toBe("C2H4 + Br2 -> C2H4Br2");
    });
    it("balances ethyne hydrogenation to ethane", function(){
        expect(balanceEquation("C2H2 + H2 -> C2H6")).toBe("C2H2 + 2H2 -> C2H6");
    });
    it("balances propene bromine addition", function(){
        expect(balanceEquation("C3H6 + Br2 -> C3H6Br2")).toBe("C3H6 + Br2 -> C3H6Br2");
    });
    it("balances ethene with hydrogen chloride", function(){
        expect(balanceEquation("C2H4 + HCl -> C2H5Cl")).toBe("C2H4 + HCl -> C2H5Cl");
    });
    it("balances ethane chlorination", function(){
        expect(balanceEquation("C2H6 + Cl2 -> C2H5Cl + HCl")).toBe("C2H6 + Cl2 -> C2H5Cl + HCl");
    });
    it("balances propane chlorination", function(){
        expect(balanceEquation("C3H8 + Cl2 -> C3H7Cl + HCl")).toBe("C3H8 + Cl2 -> C3H7Cl + HCl");
    });
    it("balances ethene hydration", function(){
        expect(balanceEquation("C2H4 + H2O -> C2H5OH")).toBe("C2H4 + H2O -> C2H5OH");
    });
    it("balances ethanol with sodium", function(){
        expect(balanceEquation("C2H5OH + Na -> C2H5ONa + H2")).toBe("2C2H5OH + 2Na -> 2C2H5ONa + H2");
    });
});
