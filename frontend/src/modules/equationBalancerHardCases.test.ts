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
        // Note: balanceIonic finds the minimum-sum atom-and-charge balanced solution.
        // The standard redox textbook answer is 5H2O2 + 2MnO4- + 6H+ -> 5O2 + 2Mn2+ + 8H2O,
        // which requires the half-reaction method (balanceRedox, Task 2.4) to produce.
        // Both solutions are valid nullspace vectors; this one has the smaller coefficient sum.
        expect(balanceIonic("H2O2 + MnO4- + H+ -> O2 + Mn2+ + H2O")).toBe("H2O2 + 2MnO4- + 6H+ -> 3O2 + 2Mn2+ + 4H2O");
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
describe("industrial process reactions", function(){
    it("balances Haber process", function(){
        expect(balanceEquation("N2 + H2 -> NH3")).toBe("N2 + 3H2 -> 2NH3");
    });
    it("balances Contact process step 1", function(){
        expect(balanceEquation("SO2 + O2 -> SO3")).toBe("2SO2 + O2 -> 2SO3");
    });
    it("balances Contact process step 2", function(){
        expect(balanceEquation("SO3 + H2O -> H2SO4")).toBe("SO3 + H2O -> H2SO4");
    });
    it("balances Ostwald process step 1", function(){
        expect(balanceEquation("NH3 + O2 -> NO + H2O")).toBe("4NH3 + 5O2 -> 4NO + 6H2O");
    });
    it("balances Ostwald process step 2", function(){
        expect(balanceEquation("NO + O2 -> NO2")).toBe("2NO + O2 -> 2NO2");
    });
    it("balances Ostwald process step 3", function(){
        expect(balanceEquation("NO2 + H2O -> HNO3 + NO")).toBe("3NO2 + H2O -> 2HNO3 + NO");
    });
    it("balances lime kiln decomposition", function(){
        expect(balanceEquation("CaCO3 -> CaO + CO2")).toBe("CaCO3 -> CaO + CO2");
    });
    it("balances slaked lime formation", function(){
        expect(balanceEquation("CaO + H2O -> Ca(OH)2")).toBe("CaO + H2O -> Ca(OH)2");
    });
    it("balances water gas shift reaction", function(){
        expect(balanceEquation("CO + H2O -> CO2 + H2")).toBe("CO + H2O -> CO2 + H2");
    });
    it("balances producer gas formation", function(){
        expect(balanceEquation("C + O2 -> CO")).toBe("2C + O2 -> 2CO");
    });
    it("balances water gas production", function(){
        expect(balanceEquation("C + H2O -> CO + H2")).toBe("C + H2O -> CO + H2");
    });
    it("balances BOS process carbon removal", function(){
        expect(balanceEquation("C + O2 -> CO2")).toBe("C + O2 -> CO2");
    });
    it("balances BOS process carbon monoxide formation", function(){
        expect(balanceEquation("C + O2 -> CO")).toBe("2C + O2 -> 2CO");
    });
    it("balances silicon dioxide reduction", function(){
        expect(balanceEquation("SiO2 + C -> Si + CO")).toBe("SiO2 + 2C -> Si + 2CO");
    });
    it("balances phosphorus production in electric furnace", function(){
        expect(balanceEquation("Ca3(PO4)2 + SiO2 + C -> CaSiO3 + P4 + CO")).toBe("2Ca3(PO4)2 + 6SiO2 + 10C -> 6CaSiO3 + P4 + 10CO");
    });
    it("balances chlor-alkali process", function(){
        expect(balanceEquation("NaCl + H2O -> NaOH + H2 + Cl2")).toBe("2NaCl + 2H2O -> 2NaOH + H2 + Cl2");
    });
    it("balances Solvay process step 1", function(){
        expect(balanceEquation("NaCl + NH3 + CO2 + H2O -> NaHCO3 + NH4Cl")).toBe("NaCl + NH3 + CO2 + H2O -> NaHCO3 + NH4Cl");
    });
    it("balances Solvay process step 2 calcination", function(){
        expect(balanceEquation("NaHCO3 -> Na2CO3 + H2O + CO2")).toBe("2NaHCO3 -> Na2CO3 + H2O + CO2");
    });
    it("balances bleaching powder formation", function(){
        expect(balanceEquation("Ca(OH)2 + Cl2 -> Ca(OCl)2 + CaCl2 + H2O")).toBe("2Ca(OH)2 + 2Cl2 -> Ca(OCl)2 + CaCl2 + 2H2O");
    });
    it("balances catalytic ammonia oxidation", function(){
        expect(balanceEquation("NH3 + O2 -> N2 + H2O")).toBe("4NH3 + 3O2 -> 2N2 + 6H2O");
    });
    it("balances hydrogen chloride synthesis", function(){
        expect(balanceEquation("H2 + Cl2 -> HCl")).toBe("H2 + Cl2 -> 2HCl");
    });
    it("balances sulfur combustion", function(){
        expect(balanceEquation("S + O2 -> SO2")).toBe("S + O2 -> SO2");
    });
    it("balances hematite reduction in blast furnace", function(){
        expect(balanceEquation("Fe2O3 + CO -> Fe + CO2")).toBe("Fe2O3 + 3CO -> 2Fe + 3CO2");
    });
    it("balances magnetite reduction in blast furnace", function(){
        expect(balanceEquation("Fe3O4 + CO -> Fe + CO2")).toBe("Fe3O4 + 4CO -> 3Fe + 4CO2");
    });
    it("balances zinc smelting", function(){
        expect(balanceEquation("ZnO + C -> Zn + CO")).toBe("ZnO + C -> Zn + CO");
    });
    it("balances aluminum smelting", function(){
        expect(balanceEquation("Al2O3 + C -> Al + CO")).toBe("Al2O3 + 3C -> 2Al + 3CO");
    });
    it("balances copper smelting", function(){
        expect(balanceEquation("CuO + C -> Cu + CO")).toBe("CuO + C -> Cu + CO");
    });
    it("balances tin smelting", function(){
        expect(balanceEquation("SnO2 + C -> Sn + CO")).toBe("SnO2 + 2C -> Sn + 2CO");
    });
    it("balances lead smelting galena roasting", function(){
        expect(balanceEquation("PbS + O2 -> PbO + SO2")).toBe("2PbS + 3O2 -> 2PbO + 2SO2");
    });
    it("balances mercury smelting cinnabar roasting", function(){
        expect(balanceEquation("HgS + O2 -> Hg + SO2")).toBe("HgS + O2 -> Hg + SO2");
    });
    it("balances magnesium production Pidgeon process", function(){
        expect(balanceEquation("MgCO3 -> MgO + CO2")).toBe("MgCO3 -> MgO + CO2");
    });
    it("balances sodium production Downs cell", function(){
        expect(balanceEquation("NaCl -> Na + Cl2")).toBe("2NaCl -> 2Na + Cl2");
    });
    it("balances calcium carbide production", function(){
        expect(balanceEquation("CaO + C -> CaC2 + CO")).toBe("CaO + 3C -> CaC2 + CO");
    });
    it("balances acetylene from calcium carbide", function(){
        expect(balanceEquation("CaC2 + H2O -> Ca(OH)2 + C2H2")).toBe("CaC2 + 2H2O -> Ca(OH)2 + C2H2");
    });
    it("balances esterification of ethanol with acetic acid", function(){
        expect(balanceEquation("C2H5OH + CH3COOH -> CH3COOC2H5 + H2O")).toBe("C2H5OH + CH3COOH -> CH3COOC2H5 + H2O");
    });
    it("balances saponification of ethyl acetate", function(){
        expect(balanceEquation("CH3COOC2H5 + NaOH -> CH3COONa + C2H5OH")).toBe("CH3COOC2H5 + NaOH -> CH3COONa + C2H5OH");
    });
    it("balances neutralization of strong acid and strong base", function(){
        expect(balanceEquation("HCl + NaOH -> NaCl + H2O")).toBe("HCl + NaOH -> NaCl + H2O");
    });
    it("balances neutralization of sulfuric acid with sodium hydroxide", function(){
        expect(balanceEquation("H2SO4 + NaOH -> Na2SO4 + H2O")).toBe("H2SO4 + 2NaOH -> Na2SO4 + 2H2O");
    });
    it("balances neutralization of phosphoric acid with sodium hydroxide", function(){
        expect(balanceEquation("H3PO4 + NaOH -> Na3PO4 + H2O")).toBe("H3PO4 + 3NaOH -> Na3PO4 + 3H2O");
    });
    it("balances ammonia with hydrochloric acid", function(){
        expect(balanceEquation("NH3 + HCl -> NH4Cl")).toBe("NH3 + HCl -> NH4Cl");
    });
    it("balances carbon dioxide with sodium hydroxide forming carbonate", function(){
        expect(balanceEquation("CO2 + NaOH -> Na2CO3 + H2O")).toBe("CO2 + 2NaOH -> Na2CO3 + H2O");
    });
    it("balances carbon dioxide with sodium hydroxide forming bicarbonate", function(){
        expect(balanceEquation("CO2 + NaOH -> NaHCO3")).toBe("CO2 + NaOH -> NaHCO3");
    });
    it("balances sulfur dioxide with sodium hydroxide", function(){
        expect(balanceEquation("SO2 + NaOH -> Na2SO3 + H2O")).toBe("SO2 + 2NaOH -> Na2SO3 + H2O");
    });
    it("balances Claus process", function(){
        expect(balanceEquation("H2S + SO2 -> S + H2O")).toBe("2H2S + SO2 -> 3S + 2H2O");
    });
    it("balances nitric acid with ammonia", function(){
        expect(balanceEquation("HNO3 + NH3 -> NH4NO3")).toBe("HNO3 + NH3 -> NH4NO3");
    });
    it("balances potassium chlorate decomposition", function(){
        expect(balanceEquation("KClO3 -> KCl + O2")).toBe("2KClO3 -> 2KCl + 3O2");
    });
    it("balances hydrogen peroxide decomposition", function(){
        expect(balanceEquation("H2O2 -> H2O + O2")).toBe("2H2O2 -> 2H2O + O2");
    });
    it("balances sodium carbonate with hydrochloric acid", function(){
        expect(balanceEquation("Na2CO3 + HCl -> NaCl + H2O + CO2")).toBe("Na2CO3 + 2HCl -> 2NaCl + H2O + CO2");
    });
    it("balances potassium permanganate with hydrochloric acid", function(){
        expect(balanceEquation("KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2")).toBe("2KMnO4 + 16HCl -> 2KCl + 2MnCl2 + 8H2O + 5Cl2");
    });
    it("balances baking soda with vinegar", function(){
        expect(balanceEquation("NaHCO3 + CH3COOH -> CH3COONa + H2O + CO2")).toBe("NaHCO3 + CH3COOH -> CH3COONa + H2O + CO2");
    });
});
describe("metallurgy reactions", function(){
    it("balances roasting of iron pyrite", function(){
        expect(balanceEquation("FeS2 + O2 -> Fe2O3 + SO2")).toBe("4FeS2 + 11O2 -> 2Fe2O3 + 8SO2");
    });
    it("balances roasting of zinc blende", function(){
        expect(balanceEquation("ZnS + O2 -> ZnO + SO2")).toBe("2ZnS + 3O2 -> 2ZnO + 2SO2");
    });
    it("balances roasting of copper pyrites", function(){
        expect(balanceEquation("CuFeS2 + O2 -> Cu2S + Fe2O3 + SO2")).toBe("4CuFeS2 + 9O2 -> 2Cu2S + 2Fe2O3 + 6SO2");
    });
    it("balances roasting of cinnabar", function(){
        expect(balanceEquation("HgS + O2 -> Hg + SO2")).toBe("HgS + O2 -> Hg + SO2");
    });
    it("balances roasting of galena", function(){
        expect(balanceEquation("PbS + O2 -> PbO + SO2")).toBe("2PbS + 3O2 -> 2PbO + 2SO2");
    });
    it("balances reduction of hematite with carbon", function(){
        expect(balanceEquation("Fe2O3 + C -> Fe + CO")).toBe("Fe2O3 + 3C -> 2Fe + 3CO");
    });
    it("balances reduction of hematite with carbon monoxide", function(){
        expect(balanceEquation("Fe2O3 + CO -> Fe + CO2")).toBe("Fe2O3 + 3CO -> 2Fe + 3CO2");
    });
    it("balances reduction of magnetite with hydrogen", function(){
        expect(balanceEquation("Fe3O4 + H2 -> Fe + H2O")).toBe("Fe3O4 + 4H2 -> 3Fe + 4H2O");
    });
    it("balances reduction of magnetite with carbon", function(){
        expect(balanceEquation("Fe3O4 + C -> Fe + CO")).toBe("Fe3O4 + 4C -> 3Fe + 4CO");
    });
    it("balances reduction of copper oxide with hydrogen", function(){
        expect(balanceEquation("CuO + H2 -> Cu + H2O")).toBe("CuO + H2 -> Cu + H2O");
    });
    it("balances reduction of tin oxide with hydrogen", function(){
        expect(balanceEquation("SnO2 + H2 -> Sn + H2O")).toBe("SnO2 + 2H2 -> Sn + 2H2O");
    });
    it("balances reduction of lead oxide with hydrogen", function(){
        expect(balanceEquation("PbO + H2 -> Pb + H2O")).toBe("PbO + H2 -> Pb + H2O");
    });
    it("balances reduction of zinc oxide with carbon monoxide", function(){
        expect(balanceEquation("ZnO + CO -> Zn + CO2")).toBe("ZnO + CO -> Zn + CO2");
    });
    it("balances reduction of iron oxide with aluminum (thermite)", function(){
        expect(balanceEquation("Fe2O3 + Al -> Fe + Al2O3")).toBe("Fe2O3 + 2Al -> 2Fe + Al2O3");
    });
    it("balances reduction of chromium oxide with aluminum (Goldschmidt)", function(){
        expect(balanceEquation("Cr2O3 + Al -> Cr + Al2O3")).toBe("Cr2O3 + 2Al -> 2Cr + Al2O3");
    });
    it("balances reduction of manganese oxide with aluminum", function(){
        expect(balanceEquation("MnO2 + Al -> Mn + Al2O3")).toBe("3MnO2 + 4Al -> 3Mn + 2Al2O3");
    });
    it("balances reduction of copper oxide with carbon", function(){
        expect(balanceEquation("CuO + C -> Cu + CO")).toBe("CuO + C -> Cu + CO");
    });
    it("balances reduction of nickel oxide with carbon", function(){
        expect(balanceEquation("NiO + C -> Ni + CO")).toBe("NiO + C -> Ni + CO");
    });
    it("balances reduction of cobalt oxide with carbon", function(){
        expect(balanceEquation("CoO + C -> Co + CO")).toBe("CoO + C -> Co + CO");
    });
    it("balances reduction of tin oxide with carbon", function(){
        expect(balanceEquation("SnO2 + C -> Sn + CO")).toBe("SnO2 + 2C -> Sn + 2CO");
    });
    it("balances reduction of lead oxide with carbon", function(){
        expect(balanceEquation("PbO + C -> Pb + CO")).toBe("PbO + C -> Pb + CO");
    });
    it("balances Bayer process bauxite digestion", function(){
        expect(balanceEquation("Al2O3 + NaOH + H2O -> NaAlO2 + H2O")).toBe("Al2O3 + 2NaOH + H2O -> 2NaAlO2 + 2H2O");
    });
    it("balances leaching of gold with cyanide (simplified)", function(){
        expect(balanceEquation("Au + NaCN + H2O + O2 -> NaAu(CN)2 + NaOH")).toBe("4Au + 8NaCN + 2H2O + O2 -> 4NaAu(CN)2 + 4NaOH");
    });
    it("balances leaching of silver with cyanide", function(){
        expect(balanceEquation("Ag + NaCN + H2O + O2 -> NaAg(CN)2 + NaOH")).toBe("4Ag + 8NaCN + 2H2O + O2 -> 4NaAg(CN)2 + 4NaOH");
    });
    it("balances slag formation in blast furnace", function(){
        expect(balanceEquation("CaCO3 + SiO2 -> CaSiO3 + CO2")).toBe("CaCO3 + SiO2 -> CaSiO3 + CO2");
    });
    it("balances double decomposition slag formation", function(){
        expect(balanceEquation("MgCO3 + SiO2 -> MgSiO3 + CO2")).toBe("MgCO3 + SiO2 -> MgSiO3 + CO2");
    });
    it("balances thermite welding of iron", function(){
        expect(balanceEquation("Fe2O3 + Al -> Fe + Al2O3")).toBe("Fe2O3 + 2Al -> 2Fe + Al2O3");
    });
    it("balances thermite with chromium oxide", function(){
        expect(balanceEquation("Cr2O3 + Al -> Cr + Al2O3")).toBe("Cr2O3 + 2Al -> 2Cr + Al2O3");
    });
    it("balances thermite with manganese dioxide", function(){
        expect(balanceEquation("MnO2 + Al -> Mn + Al2O3")).toBe("3MnO2 + 4Al -> 3Mn + 2Al2O3");
    });
    it("balances pickling of steel with hydrochloric acid", function(){
        expect(balanceEquation("Fe2O3 + HCl -> FeCl3 + H2O")).toBe("Fe2O3 + 6HCl -> 2FeCl3 + 3H2O");
    });
    it("balances pickling of steel with sulfuric acid", function(){
        expect(balanceEquation("Fe2O3 + H2SO4 -> Fe2(SO4)3 + H2O")).toBe("Fe2O3 + 3H2SO4 -> Fe2(SO4)3 + 3H2O");
    });
    it("balances rusting of iron (simplified)", function(){
        expect(balanceEquation("Fe + O2 + H2O -> Fe(OH)3")).toBe("4Fe + 3O2 + 6H2O -> 4Fe(OH)3");
    });
    it("balances rusting of iron forming iron oxide", function(){
        expect(balanceEquation("Fe + O2 -> Fe2O3")).toBe("4Fe + 3O2 -> 2Fe2O3");
    });
    it("balances passivation of aluminum", function(){
        expect(balanceEquation("Al + O2 -> Al2O3")).toBe("4Al + 3O2 -> 2Al2O3");
    });
    it("balances passivation of chromium", function(){
        expect(balanceEquation("Cr + O2 -> Cr2O3")).toBe("4Cr + 3O2 -> 2Cr2O3");
    });
    it("balances formation of mill scale on steel", function(){
        expect(balanceEquation("Fe + O2 -> Fe3O4")).toBe("3Fe + 2O2 -> Fe3O4");
    });
    it("balances desulfurization with calcium oxide", function(){
        expect(balanceEquation("CaO + FeS -> CaS + FeO")).toBe("CaO + FeS -> CaS + FeO");
    });
    it("balances dephosphorization in steelmaking", function(){
        expect(balanceEquation("P + FeO + CaO -> CaO·P2O5 + Fe")).toBe("2P + 5FeO + CaO -> CaO·P2O5 + 5Fe");
    });
    it("balances decarburization of steel", function(){
        expect(balanceEquation("Fe3C + O2 -> Fe + CO")).toBe("2Fe3C + O2 -> 6Fe + 2CO");
    });
    it("balances manganese removal in steelmaking", function(){
        expect(balanceEquation("Mn + O2 -> MnO")).toBe("2Mn + O2 -> 2MnO");
    });
    it("balances silicon removal in steelmaking", function(){
        expect(balanceEquation("Si + O2 -> SiO2")).toBe("Si + O2 -> SiO2");
    });
    it("balances chromium oxidation in steelmaking", function(){
        expect(balanceEquation("Cr + O2 -> Cr2O3")).toBe("4Cr + 3O2 -> 2Cr2O3");
    });
    it("balances vanadium oxidation in steelmaking", function(){
        expect(balanceEquation("V + O2 -> V2O5")).toBe("4V + 5O2 -> 2V2O5");
    });
    it("balances titanium reduction by Kroll process", function(){
        expect(balanceEquation("TiCl4 + Mg -> Ti + MgCl2")).toBe("TiCl4 + 2Mg -> Ti + 2MgCl2");
    });
    it("balances titanium reduction by Hunter process", function(){
        expect(balanceEquation("TiCl4 + Na -> Ti + NaCl")).toBe("TiCl4 + 4Na -> Ti + 4NaCl");
    });
    it("balances zinc roasting and leaching", function(){
        expect(balanceEquation("ZnS + O2 -> ZnO + SO2")).toBe("2ZnS + 3O2 -> 2ZnO + 2SO2");
    });
    it("balances manganese dioxide leaching with hydrochloric acid", function(){
        expect(balanceEquation("MnO2 + HCl -> MnCl2 + H2O + Cl2")).toBe("MnO2 + 4HCl -> MnCl2 + 2H2O + Cl2");
    });
    it("balances nickel carbonyl formation (Mond process)", function(){
        expect(balanceEquation("Ni + CO -> Ni(CO)4")).toBe("Ni + 4CO -> Ni(CO)4");
    });
    it("balances nickel carbonyl decomposition (Mond process)", function(){
        expect(balanceEquation("Ni(CO)4 -> Ni + CO")).toBe("Ni(CO)4 -> Ni + 4CO");
    });
});
describe("organic synthesis reactions", function(){
    it("balances Williamson ether synthesis diethyl ether", function(){
        expect(balanceEquation("C2H5Br + C2H5ONa -> C2H5OC2H5 + NaBr")).toBe("C2H5Br + C2H5ONa -> C2H5OC2H5 + NaBr");
    });
    it("balances Friedel-Crafts alkylation benzene with methyl chloride", function(){
        expect(balanceEquation("C6H6 + CH3Cl -> C6H5CH3 + HCl")).toBe("C6H6 + CH3Cl -> C6H5CH3 + HCl");
    });
    it("balances Friedel-Crafts acylation benzene with acetyl chloride", function(){
        expect(balanceEquation("C6H6 + CH3COCl -> C6H5COCH3 + HCl")).toBe("C6H6 + CH3COCl -> C6H5COCH3 + HCl");
    });
    it("balances nitration of benzene", function(){
        expect(balanceEquation("C6H6 + HNO3 -> C6H5NO2 + H2O")).toBe("C6H6 + HNO3 -> C6H5NO2 + H2O");
    });
    it("balances sulfonation of benzene", function(){
        expect(balanceEquation("C6H6 + H2SO4 -> C6H5SO3H + H2O")).toBe("C6H6 + H2SO4 -> C6H5SO3H + H2O");
    });
    it("balances halogenation of benzene", function(){
        expect(balanceEquation("C6H6 + Br2 -> C6H5Br + HBr")).toBe("C6H6 + Br2 -> C6H5Br + HBr");
    });
    it("balances Diels-Alder butadiene with ethene", function(){
        expect(balanceEquation("C4H6 + C2H4 -> C6H10")).toBe("C4H6 + C2H4 -> C6H10");
    });
    it("balances Diels-Alder butadiene with maleic anhydride", function(){
        expect(balanceEquation("C4H6 + C4H2O3 -> C8H8O3")).toBe("C4H6 + C4H2O3 -> C8H8O3");
    });
    it("balances aldol condensation acetaldehyde", function(){
        expect(balanceEquation("CH3CHO -> CH3CH(OH)CH2CHO")).toBe("2CH3CHO -> CH3CH(OH)CH2CHO");
    });
    it("balances Cannizzaro reaction formaldehyde", function(){
        expect(balanceEquation("HCHO + NaOH -> CH3OH + HCOONa")).toBe("2HCHO + NaOH -> CH3OH + HCOONa");
    });
    it("balances Grignard reaction methylmagnesium bromide with formaldehyde", function(){
        expect(balanceEquation("CH3MgBr + HCHO + H2O -> CH3CH2OH + MgBrOH")).toBe("CH3MgBr + HCHO + H2O -> CH3CH2OH + MgBrOH");
    });
    it("balances Grignard reaction with acetaldehyde", function(){
        expect(balanceEquation("CH3MgBr + CH3CHO + H2O -> CH3CH(OH)CH3 + MgBrOH")).toBe("CH3MgBr + CH3CHO + H2O -> CH3CH(OH)CH3 + MgBrOH");
    });
    it("balances esterification methanol with acetic acid", function(){
        expect(balanceEquation("CH3OH + CH3COOH -> CH3COOCH3 + H2O")).toBe("CH3OH + CH3COOH -> CH3COOCH3 + H2O");
    });
    it("balances esterification propanol with butyric acid", function(){
        expect(balanceEquation("C3H7OH + C3H7COOH -> C3H7COOC3H7 + H2O")).toBe("C3H7OH + C3H7COOH -> C3H7COOC3H7 + H2O");
    });
    it("balances saponification of methyl acetate", function(){
        expect(balanceEquation("CH3COOCH3 + NaOH -> CH3COONa + CH3OH")).toBe("CH3COOCH3 + NaOH -> CH3COONa + CH3OH");
    });
    it("balances amide formation acetic acid with ammonia", function(){
        expect(balanceEquation("CH3COOH + NH3 -> CH3CONH2 + H2O")).toBe("CH3COOH + NH3 -> CH3CONH2 + H2O");
    });
    it("balances Hofmann rearrangement acetamide", function(){
        expect(balanceEquation("CH3CONH2 + Br2 + NaOH -> CH3NH2 + NaBr + Na2CO3 + H2O")).toBe("CH3CONH2 + Br2 + 4NaOH -> CH3NH2 + 2NaBr + Na2CO3 + 2H2O");
    });
    it("balances diazotization of aniline", function(){
        expect(balanceEquation("C6H5NH2 + HCl + NaNO2 -> C6H5N2Cl + NaCl + H2O")).toBe("C6H5NH2 + 2HCl + NaNO2 -> C6H5N2Cl + NaCl + 2H2O");
    });
    it("balances Beckmann rearrangement cyclohexanone oxime to caprolactam", function(){
        expect(balanceEquation("C6H11NO -> C6H11NO")).toBe("C6H11NO -> C6H11NO");
    });
    it("balances oxidation of ethanol to acetaldehyde", function(){
        expect(balanceEquation("C2H5OH + O2 -> CH3CHO + H2O")).toBe("2C2H5OH + O2 -> 2CH3CHO + 2H2O");
    });
    it("balances oxidation of acetaldehyde to acetic acid", function(){
        expect(balanceEquation("CH3CHO + O2 -> CH3COOH")).toBe("2CH3CHO + O2 -> 2CH3COOH");
    });
    it("balances oxidation of secondary alcohol to ketone", function(){
        expect(balanceEquation("C3H7OH + O2 -> CH3COCH3 + H2O")).toBe("2C3H7OH + O2 -> 2CH3COCH3 + 2H2O");
    });
    it("balances reduction of aldehyde to alcohol with hydrogen", function(){
        expect(balanceEquation("CH3CHO + H2 -> C2H5OH")).toBe("CH3CHO + H2 -> C2H5OH");
    });
    it("balances reduction of ketone to alcohol with hydrogen", function(){
        expect(balanceEquation("CH3COCH3 + H2 -> C3H7OH")).toBe("CH3COCH3 + H2 -> C3H7OH");
    });
    it("balances reduction of nitrobenzene to aniline", function(){
        expect(balanceEquation("C6H5NO2 + Fe + HCl -> C6H5NH2 + FeCl2 + H2O")).toBe("C6H5NO2 + 3Fe + 6HCl -> C6H5NH2 + 3FeCl2 + 2H2O");
    });
    it("balances reduction of nitrobenzene with zinc and acid", function(){
        expect(balanceEquation("C6H5NO2 + Zn + HCl -> C6H5NH2 + ZnCl2 + H2O")).toBe("C6H5NO2 + 3Zn + 6HCl -> C6H5NH2 + 3ZnCl2 + 2H2O");
    });
    it("balances dehydration of ethanol to ethene", function(){
        expect(balanceEquation("C2H5OH -> C2H4 + H2O")).toBe("C2H5OH -> C2H4 + H2O");
    });
    it("balances dehydration of propanol to propene", function(){
        expect(balanceEquation("C3H7OH -> C3H6 + H2O")).toBe("C3H7OH -> C3H6 + H2O");
    });
    it("balances hydration of propene to propanol", function(){
        expect(balanceEquation("C3H6 + H2O -> C3H7OH")).toBe("C3H6 + H2O -> C3H7OH");
    });
    it("balances polymerization of ethene to polyethylene (dimer)", function(){
        expect(balanceEquation("C2H4 -> C4H8")).toBe("2C2H4 -> C4H8");
    });
    it("balances cracking of decane to octane and ethene", function(){
        expect(balanceEquation("C10H22 -> C8H18 + C2H4")).toBe("C10H22 -> C8H18 + C2H4");
    });
    it("balances cracking of hexane to butane and ethene", function(){
        expect(balanceEquation("C6H14 -> C4H10 + C2H4")).toBe("C6H14 -> C4H10 + C2H4");
    });
    it("balances reforming of hexane to cyclohexane", function(){
        expect(balanceEquation("C6H14 -> C6H12 + H2")).toBe("C6H14 -> C6H12 + H2");
    });
    it("balances dehydrogenation of cyclohexane to benzene", function(){
        expect(balanceEquation("C6H12 -> C6H6 + H2")).toBe("C6H12 -> C6H6 + 3H2");
    });
    it("balances halogenation of methane to methyl chloride", function(){
        expect(balanceEquation("CH4 + Cl2 -> CH3Cl + HCl")).toBe("CH4 + Cl2 -> CH3Cl + HCl");
    });
    it("balances complete chlorination of methane", function(){
        expect(balanceEquation("CH4 + Cl2 -> CCl4 + HCl")).toBe("CH4 + 4Cl2 -> CCl4 + 4HCl");
    });
    it("balances bromination of propane to 1-bromopropane", function(){
        expect(balanceEquation("C3H8 + Br2 -> C3H7Br + HBr")).toBe("C3H8 + Br2 -> C3H7Br + HBr");
    });
    it("balances iodination of methane", function(){
        expect(balanceEquation("CH4 + I2 -> CH3I + HI")).toBe("CH4 + I2 -> CH3I + HI");
    });
    it("balances addition of HBr to ethene", function(){
        expect(balanceEquation("C2H4 + HBr -> C2H5Br")).toBe("C2H4 + HBr -> C2H5Br");
    });
    it("balances addition of HCl to propene", function(){
        expect(balanceEquation("C3H6 + HCl -> C3H7Cl")).toBe("C3H6 + HCl -> C3H7Cl");
    });
    it("balances addition of bromine to propene", function(){
        expect(balanceEquation("C3H6 + Br2 -> C3H6Br2")).toBe("C3H6 + Br2 -> C3H6Br2");
    });
    it("balances addition of chlorine to ethyne", function(){
        expect(balanceEquation("C2H2 + Cl2 -> C2H2Cl2")).toBe("C2H2 + Cl2 -> C2H2Cl2");
    });
    it("balances complete hydrogenation of ethyne to ethane", function(){
        expect(balanceEquation("C2H2 + H2 -> C2H6")).toBe("C2H2 + 2H2 -> C2H6");
    });
    it("balances hydroformylation of ethene (oxo process)", function(){
        expect(balanceEquation("C2H4 + CO + H2 -> C3H6O")).toBe("C2H4 + CO + H2 -> C3H6O");
    });
    it("balances Kolbe-Schmitt synthesis of salicylic acid", function(){
        expect(balanceEquation("C6H5ONa + CO2 -> C6H4(OH)COONa")).toBe("C6H5ONa + CO2 -> C6H4(OH)COONa");
    });
    it("balances decarboxylation of salicylic acid to phenol", function(){
        expect(balanceEquation("C6H4(OH)COOH -> C6H5OH + CO2")).toBe("C6H4(OH)COOH -> C6H5OH + CO2");
    });
    it("balances pinacol rearrangement", function(){
        expect(balanceEquation("C6H14O2 -> C6H12O + H2O")).toBe("C6H14O2 -> C6H12O + H2O");
    });
    it("balances benzaldehyde with HCN cyanohydrin formation", function(){
        expect(balanceEquation("C6H5CHO + HCN -> C6H5CH(OH)CN")).toBe("C6H5CHO + HCN -> C6H5CH(OH)CN");
    });
    it("balances benzoin condensation", function(){
        expect(balanceEquation("C6H5CHO -> C6H5CH(OH)COC6H5")).toBe("2C6H5CHO -> C6H5CH(OH)COC6H5");
    });
});
describe("inorganic complexation reactions", function(){
    it("balances formation of tetraamminecopper(II) complex", function(){
        expect(balanceEquation("CuSO4 + NH3 -> [Cu(NH3)4]SO4")).toBe("CuSO4 + 4NH3 -> [Cu(NH3)4]SO4");
    });
    it("balances formation of tetracyanonickelate(II)", function(){
        expect(balanceEquation("NiCl2 + KCN -> K2[Ni(CN)4] + KCl")).toBe("NiCl2 + 4KCN -> K2[Ni(CN)4] + 2KCl");
    });
    it("balances formation of hexacyanoferrate(II)", function(){
        expect(balanceEquation("FeCl2 + KCN -> K4[Fe(CN)6] + KCl")).toBe("FeCl2 + 6KCN -> K4[Fe(CN)6] + 2KCl");
    });
    it("balances formation of hexacyanoferrate(III)", function(){
        expect(balanceEquation("FeCl3 + KCN -> K3[Fe(CN)6] + KCl")).toBe("FeCl3 + 6KCN -> K3[Fe(CN)6] + 3KCl");
    });
    it("balances formation of diamminesilver(I)", function(){
        expect(balanceEquation("AgNO3 + NH3 -> [Ag(NH3)2]NO3")).toBe("AgNO3 + 2NH3 -> [Ag(NH3)2]NO3");
    });
    it("balances formation of tetracyanocuprate(I)", function(){
        expect(balanceEquation("CuCN + KCN -> K3[Cu(CN)4]")).toBe("CuCN + 3KCN -> K3[Cu(CN)4]");
    });
    it("balances formation of tetracyanocadmate(II)", function(){
        expect(balanceEquation("CdCl2 + KCN -> K2[Cd(CN)4] + KCl")).toBe("CdCl2 + 4KCN -> K2[Cd(CN)4] + 2KCl");
    });
    it("balances formation of tetracyanozincate(II)", function(){
        expect(balanceEquation("ZnCl2 + KCN -> K2[Zn(CN)4] + KCl")).toBe("ZnCl2 + 4KCN -> K2[Zn(CN)4] + 2KCl");
    });
    it("balances formation of hexaaquachromium(III) chloride", function(){
        expect(balanceEquation("CrCl3 + H2O -> [Cr(H2O)6]Cl3")).toBe("CrCl3 + 6H2O -> [Cr(H2O)6]Cl3");
    });
    it("balances dissolution of silver chloride in ammonia", function(){
        expect(balanceEquation("AgCl + NH3 -> [Ag(NH3)2]Cl")).toBe("AgCl + 2NH3 -> [Ag(NH3)2]Cl");
    });
    it("balances dissolution of silver chloride in cyanide", function(){
        expect(balanceEquation("AgCl + NaCN -> Na[Ag(CN)2] + NaCl")).toBe("AgCl + 2NaCN -> Na[Ag(CN)2] + NaCl");
    });
    it("balances dissolution of silver chloride in thiosulfate", function(){
        expect(balanceEquation("AgCl + Na2S2O3 -> Na[Ag(S2O3)] + NaCl")).toBe("AgCl + Na2S2O3 -> Na[Ag(S2O3)] + NaCl");
    });
    it("balances precipitation of silver chloride", function(){
        expect(balanceEquation("AgNO3 + NaCl -> AgCl + NaNO3")).toBe("AgNO3 + NaCl -> AgCl + NaNO3");
    });
    it("balances precipitation of barium sulfate", function(){
        expect(balanceEquation("BaCl2 + Na2SO4 -> BaSO4 + NaCl")).toBe("BaCl2 + Na2SO4 -> BaSO4 + 2NaCl");
    });
    it("balances precipitation of lead iodide", function(){
        expect(balanceEquation("Pb(NO3)2 + KI -> PbI2 + KNO3")).toBe("Pb(NO3)2 + 2KI -> PbI2 + 2KNO3");
    });
    it("balances precipitation of calcium oxalate", function(){
        expect(balanceEquation("CaCl2 + Na2C2O4 -> CaC2O4 + NaCl")).toBe("CaCl2 + Na2C2O4 -> CaC2O4 + 2NaCl");
    });
    it("balances precipitation of magnesium hydroxide", function(){
        expect(balanceEquation("MgCl2 + NaOH -> Mg(OH)2 + NaCl")).toBe("MgCl2 + 2NaOH -> Mg(OH)2 + 2NaCl");
    });
    it("balances precipitation of iron(III) hydroxide", function(){
        expect(balanceEquation("FeCl3 + NaOH -> Fe(OH)3 + NaCl")).toBe("FeCl3 + 3NaOH -> Fe(OH)3 + 3NaCl");
    });
    it("balances precipitation of aluminum hydroxide", function(){
        expect(balanceEquation("AlCl3 + NaOH -> Al(OH)3 + NaCl")).toBe("AlCl3 + 3NaOH -> Al(OH)3 + 3NaCl");
    });
    it("balances amphoteric dissolution of aluminum hydroxide in acid", function(){
        expect(balanceEquation("Al(OH)3 + HCl -> AlCl3 + H2O")).toBe("Al(OH)3 + 3HCl -> AlCl3 + 3H2O");
    });
    it("balances amphoteric dissolution of aluminum hydroxide in base", function(){
        expect(balanceEquation("Al(OH)3 + NaOH -> NaAlO2 + H2O")).toBe("Al(OH)3 + NaOH -> NaAlO2 + 2H2O");
    });
    it("balances amphoteric dissolution of zinc hydroxide in acid", function(){
        expect(balanceEquation("Zn(OH)2 + HCl -> ZnCl2 + H2O")).toBe("Zn(OH)2 + 2HCl -> ZnCl2 + 2H2O");
    });
    it("balances amphoteric dissolution of zinc hydroxide in base", function(){
        expect(balanceEquation("Zn(OH)2 + NaOH -> Na2ZnO2 + H2O")).toBe("Zn(OH)2 + 2NaOH -> Na2ZnO2 + 2H2O");
    });
    it("balances amphoteric dissolution of lead hydroxide in base", function(){
        expect(balanceEquation("Pb(OH)2 + NaOH -> Na2PbO2 + H2O")).toBe("Pb(OH)2 + 2NaOH -> Na2PbO2 + 2H2O");
    });
    it("balances formation of mercury(II) iodide complex", function(){
        expect(balanceEquation("HgI2 + KI -> K2[HgI4]")).toBe("HgI2 + 2KI -> K2[HgI4]");
    });
    it("balances formation of silver thiosulfate complex in photography", function(){
        expect(balanceEquation("AgBr + Na2S2O3 -> Na[Ag(S2O3)] + NaBr")).toBe("AgBr + Na2S2O3 -> Na[Ag(S2O3)] + NaBr");
    });
    it("balances hard water precipitation with soap (simplified)", function(){
        expect(balanceEquation("CaCl2 + C17H35COONa -> Ca(C17H35COO)2 + NaCl")).toBe("CaCl2 + 2C17H35COONa -> Ca(C17H35COO)2 + 2NaCl");
    });
    it("balances water softening with washing soda", function(){
        expect(balanceEquation("CaSO4 + Na2CO3 -> CaCO3 + Na2SO4")).toBe("CaSO4 + Na2CO3 -> CaCO3 + Na2SO4");
    });
    it("balances ion exchange softening (simplified)", function(){
        expect(balanceEquation("CaCl2 + NaR -> CaR2 + NaCl")).toBe("CaCl2 + 2NaR -> CaR2 + 2NaCl");
    });
    it("balances Prussian blue formation", function(){
        expect(balanceEquation("FeCl3 + K4[Fe(CN)6] -> Fe4[Fe(CN)6]3 + KCl")).toBe("4FeCl3 + 3K4[Fe(CN)6] -> Fe4[Fe(CN)6]3 + 12KCl");
    });
    it("balances turnbulls blue formation", function(){
        expect(balanceEquation("FeCl2 + K3[Fe(CN)6] -> Fe3[Fe(CN)6]2 + KCl")).toBe("3FeCl2 + 2K3[Fe(CN)6] -> Fe3[Fe(CN)6]2 + 6KCl");
    });
    it("balances bromine water test for phenol (tribromophenol)", function(){
        expect(balanceEquation("C6H6O + Br2 -> C6H3Br3O + HBr")).toBe("C6H6O + 3Br2 -> C6H3Br3O + 3HBr");
    });
    it("balances bromine water test for aniline", function(){
        expect(balanceEquation("C6H7N + Br2 -> C6H3Br3NH2 + HBr")).toBe("2C6H7N + 5Br2 -> 2C6H3Br3NH2 + 4HBr");
    });
    it("balances silver mirror test (Tollens reagent with formaldehyde)", function(){
        expect(balanceEquation("HCHO + Ag2O -> HCOOH + Ag")).toBe("HCHO + Ag2O -> HCOOH + 2Ag");
    });
    it("balances Fehlings test with glucose (simplified)", function(){
        expect(balanceEquation("C6H12O6 + Cu(OH)2 -> C6H12O7 + Cu2O + H2O")).toBe("C6H12O6 + 2Cu(OH)2 -> C6H12O7 + Cu2O + 2H2O");
    });
    it("balances iodoform test for ethanol", function(){
        expect(balanceEquation("C2H5OH + I2 + NaOH -> CHI3 + HCOONa + NaI + H2O")).toBe("C2H5OH + 4I2 + 6NaOH -> CHI3 + HCOONa + 5NaI + 5H2O");
    });
    it("balances iodoform test for acetone", function(){
        expect(balanceEquation("CH3COCH3 + I2 + NaOH -> CHI3 + CH3COONa + NaI + H2O")).toBe("CH3COCH3 + 3I2 + 4NaOH -> CHI3 + CH3COONa + 3NaI + 3H2O");
    });
    it("balances lucas test with zinc chloride", function(){
        expect(balanceEquation("C3H7OH + HCl -> C3H7Cl + H2O")).toBe("C3H7OH + HCl -> C3H7Cl + H2O");
    });
    it("balances bicarbonate test for carboxylic acid", function(){
        expect(balanceEquation("CH3COOH + NaHCO3 -> CH3COONa + H2O + CO2")).toBe("CH3COOH + NaHCO3 -> CH3COONa + H2O + CO2");
    });
    it("balances sodium fusion test (Lassaigne) for nitrogen", function(){
        expect(balanceEquation("Na + C + N2 -> NaCN")).toBe("2Na + 2C + N2 -> 2NaCN");
    });
    it("balances sulfate test with barium chloride", function(){
        expect(balanceEquation("Na2SO4 + BaCl2 -> BaSO4 + NaCl")).toBe("Na2SO4 + BaCl2 -> BaSO4 + 2NaCl");
    });
    it("balances chloride test with silver nitrate", function(){
        expect(balanceEquation("NaCl + AgNO3 -> AgCl + NaNO3")).toBe("NaCl + AgNO3 -> AgCl + NaNO3");
    });
    it("balances nitrate test with copper and sulfuric acid", function(){
        expect(balanceEquation("NaNO3 + Cu + H2SO4 -> NO + CuSO4 + Na2SO4 + H2O")).toBe("2NaNO3 + 3Cu + 4H2SO4 -> 2NO + 3CuSO4 + Na2SO4 + 4H2O");
    });
    it("balances chromyl chloride test for chloride", function(){
        expect(balanceEquation("KCl + K2Cr2O7 + H2SO4 -> CrO2Cl2 + K2SO4 + H2O")).toBe("4KCl + K2Cr2O7 + 3H2SO4 -> 2CrO2Cl2 + 3K2SO4 + 3H2O");
    });
    it("balances ammonia detection with Nessler reagent (simplified)", function(){
        expect(balanceEquation("NH3 + K2HgI4 + KOH -> HgO·Hg(NH2)I + KI + H2O")).toBe("NH3 + 2K2HgI4 + 3KOH -> HgO·Hg(NH2)I + 7KI + 2H2O");
    });
    it("balances carbonate test with acid", function(){
        expect(balanceEquation("Na2CO3 + HCl -> NaCl + H2O + CO2")).toBe("Na2CO3 + 2HCl -> 2NaCl + H2O + CO2");
    });
});
describe("procedurally generated reactions", function(){
    it("procedural case 1: Ag2O with HNO3", function(){
        expect(balanceEquation("Ag2O + HNO3 -> AgNO3 + H2O")).toBe("Ag2O + 2HNO3 -> 2AgNO3 + H2O");
    });
    it("procedural case 2: Ag2O with HBr", function(){
        expect(balanceEquation("Ag2O + HBr -> AgBr + H2O")).toBe("Ag2O + 2HBr -> 2AgBr + H2O");
    });
    it("procedural case 3: Mg(NO3)2 with NaCl", function(){
        expect(balanceEquation("Mg(NO3)2 + NaCl -> NaNO3 + MgCl2")).toBe("Mg(NO3)2 + 2NaCl -> 2NaNO3 + MgCl2");
    });
    it("procedural case 4: Mg(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Mg(NO3)2 + K2SO4 -> KNO3 + MgSO4")).toBe("Mg(NO3)2 + K2SO4 -> 2KNO3 + MgSO4");
    });
    it("procedural case 5: Zn(NO2)2 with HI", function(){
        expect(balanceEquation("Zn(NO2)2 + HI -> ZnI2 + HNO2")).toBe("Zn(NO2)2 + 2HI -> ZnI2 + 2HNO2");
    });
    it("procedural case 6: MgC2O4 with HI", function(){
        expect(balanceEquation("MgC2O4 + HI -> MgI2 + H2C2O4")).toBe("MgC2O4 + 2HI -> MgI2 + H2C2O4");
    });
    it("procedural case 7: Ca with HF", function(){
        expect(balanceEquation("Ca + HF -> CaF2 + H2")).toBe("Ca + 2HF -> CaF2 + H2");
    });
    it("procedural case 8: Cs2S with HBr", function(){
        expect(balanceEquation("Cs2S + HBr -> CsBr + H2S")).toBe("Cs2S + 2HBr -> 2CsBr + H2S");
    });
    it("procedural case 9: Al(OH)3 with HF", function(){
        expect(balanceEquation("Al(OH)3 + HF -> AlF3 + H2O")).toBe("Al(OH)3 + 3HF -> AlF3 + 3H2O");
    });
    it("procedural case 10: Br2 with CaBr2", function(){
        expect(balanceEquation("Br2 + CaBr2 -> CaBr2 + Br22")).toBe("11Br2 + CaBr2 -> CaBr2 + Br22");
    });
    it("procedural case 11: Cu(OH)2 with H2S", function(){
        expect(balanceEquation("Cu(OH)2 + H2S -> CuS + H2O")).toBe("Cu(OH)2 + H2S -> CuS + 2H2O");
    });
    it("procedural case 12: Co(OH)2 with H2CO3", function(){
        expect(balanceEquation("Co(OH)2 + H2CO3 -> CoCO3 + H2O")).toBe("Co(OH)2 + H2CO3 -> CoCO3 + 2H2O");
    });
    it("procedural case 13: CuS with HCl", function(){
        expect(balanceEquation("CuS + HCl -> CuCl2 + H2S")).toBe("CuS + 2HCl -> CuCl2 + H2S");
    });
    it("procedural case 14: CaO with HBr", function(){
        expect(balanceEquation("CaO + HBr -> CaBr2 + H2O")).toBe("CaO + 2HBr -> CaBr2 + H2O");
    });
    it("procedural case 15: Li2O with HF", function(){
        expect(balanceEquation("Li2O + HF -> LiF + H2O")).toBe("Li2O + 2HF -> 2LiF + H2O");
    });
    it("procedural case 16: CuO with HCl", function(){
        expect(balanceEquation("CuO + HCl -> CuCl2 + H2O")).toBe("CuO + 2HCl -> CuCl2 + H2O");
    });
    it("procedural case 17: Ca(NO3)2 with LiCl", function(){
        expect(balanceEquation("Ca(NO3)2 + LiCl -> LiNO3 + CaCl2")).toBe("Ca(NO3)2 + 2LiCl -> 2LiNO3 + CaCl2");
    });
    it("procedural case 18: MnCl2 with Fe2(SO4)3", function(){
        expect(balanceEquation("MnCl2 + Fe2(SO4)3 -> Mn2(SO4)3 + FeCl2")).toBe("2MnCl2 + Fe2(SO4)3 -> Mn2(SO4)3 + 2FeCl2");
    });
    it("procedural case 19: Ba(OH)2 with HI", function(){
        expect(balanceEquation("Ba(OH)2 + HI -> BaI2 + H2O")).toBe("Ba(OH)2 + 2HI -> BaI2 + 2H2O");
    });
    it("procedural case 20: Ni(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Ni(NO3)2 + Na2SO4 -> NaNO3 + NiSO4")).toBe("Ni(NO3)2 + Na2SO4 -> 2NaNO3 + NiSO4");
    });
    it("procedural case 21: K with H3PO4", function(){
        expect(balanceEquation("K + H3PO4 -> K(PO4)3 + H2")).toBe("2K + 6H3PO4 -> 2K(PO4)3 + 9H2");
    });
    it("procedural case 22: Zn(NO2)2 with HF", function(){
        expect(balanceEquation("Zn(NO2)2 + HF -> ZnF2 + HNO2")).toBe("Zn(NO2)2 + 2HF -> ZnF2 + 2HNO2");
    });
    it("procedural case 23: CoS with HI", function(){
        expect(balanceEquation("CoS + HI -> CoI2 + H2S")).toBe("CoS + 2HI -> CoI2 + H2S");
    });
    it("procedural case 24: Sn with HF", function(){
        expect(balanceEquation("Sn + HF -> SnF2 + H2")).toBe("Sn + 2HF -> SnF2 + H2");
    });
    it("procedural case 25: NiCO3 with H3PO4", function(){
        expect(balanceEquation("NiCO3 + H3PO4 -> Ni3(PO4)2 + H2O + CO2")).toBe("3NiCO3 + 2H3PO4 -> Ni3(PO4)2 + 3H2O + 3CO2");
    });
    it("procedural case 26: Ca(OH)2 with HCl", function(){
        expect(balanceEquation("Ca(OH)2 + HCl -> CaCl2 + H2O")).toBe("Ca(OH)2 + 2HCl -> CaCl2 + 2H2O");
    });
    it("procedural case 27: Ni(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Ni(NO3)2 + Rb2SO4 -> RbNO3 + NiSO4")).toBe("Ni(NO3)2 + Rb2SO4 -> 2RbNO3 + NiSO4");
    });
    it("procedural case 28: Ni(OH)2 with H3PO4", function(){
        expect(balanceEquation("Ni(OH)2 + H3PO4 -> Ni3(PO4)2 + H2O")).toBe("3Ni(OH)2 + 2H3PO4 -> Ni3(PO4)2 + 6H2O");
    });
    it("procedural case 29: SrO with HF", function(){
        expect(balanceEquation("SrO + HF -> SrF2 + H2O")).toBe("SrO + 2HF -> SrF2 + H2O");
    });
    it("procedural case 30: Sn(NO3)2 with AgCl", function(){
        expect(balanceEquation("Sn(NO3)2 + AgCl -> AgNO3 + SnCl2")).toBe("Sn(NO3)2 + 2AgCl -> 2AgNO3 + SnCl2");
    });
    it("procedural case 31: Ni with H3PO4", function(){
        expect(balanceEquation("Ni + H3PO4 -> Ni3(PO4)2 + H2")).toBe("3Ni + 2H3PO4 -> Ni3(PO4)2 + 3H2");
    });
    it("procedural case 32: decomposition of sodium bicarbonate", function(){
        expect(balanceEquation("NaHCO3 -> Na2CO3 + H2O + CO2")).toBe("2NaHCO3 -> Na2CO3 + H2O + CO2");
    });
    it("procedural case 33: AlCl3 with K2SO4", function(){
        expect(balanceEquation("AlCl3 + K2SO4 -> Al2(2SO4)3 + KCl")).toBe("2AlCl3 + 3K2SO4 -> Al2(2SO4)3 + 6KCl");
    });
    it("procedural case 34: CoO with HBr", function(){
        expect(balanceEquation("CoO + HBr -> CoBr2 + H2O")).toBe("CoO + 2HBr -> CoBr2 + H2O");
    });
    it("procedural case 35: Cu(OH)2 with H2SO4", function(){
        expect(balanceEquation("Cu(OH)2 + H2SO4 -> CuSO4 + H2O")).toBe("Cu(OH)2 + H2SO4 -> CuSO4 + 2H2O");
    });
    it("procedural case 36: Li2C2O4 with HCl", function(){
        expect(balanceEquation("Li2C2O4 + HCl -> LiCl + H2C2O4")).toBe("Li2C2O4 + 2HCl -> 2LiCl + H2C2O4");
    });
    it("procedural case 37: complete combustion of C6H5OH", function(){
        expect(balanceEquation("C6H5OH + O2 -> CO2 + H2O")).toBe("C6H5OH + 7O2 -> 6CO2 + 3H2O");
    });
    it("procedural case 38: decomposition of mercury oxide", function(){
        expect(balanceEquation("HgO -> Hg + O2")).toBe("2HgO -> 2Hg + O2");
    });
    it("procedural case 39: Ag2S with HNO3", function(){
        expect(balanceEquation("Ag2S + HNO3 -> AgNO3 + H2S")).toBe("Ag2S + 2HNO3 -> 2AgNO3 + H2S");
    });
    it("procedural case 40: K2S with HI", function(){
        expect(balanceEquation("K2S + HI -> KI + H2S")).toBe("K2S + 2HI -> 2KI + H2S");
    });
    it("procedural case 41: Al2O3 with H2S", function(){
        expect(balanceEquation("Al2O3 + H2S -> Al2(S)3 + H2O")).toBe("Al2O3 + 3H2S -> Al2(S)3 + 3H2O");
    });
    it("procedural case 42: MnC2O4 with HCl", function(){
        expect(balanceEquation("MnC2O4 + HCl -> MnCl2 + H2C2O4")).toBe("MnC2O4 + 2HCl -> MnCl2 + H2C2O4");
    });
    it("procedural case 43: synthesis of nitrogen dioxide", function(){
        expect(balanceEquation("NO + O2 -> NO2")).toBe("2NO + O2 -> 2NO2");
    });
    it("procedural case 44: MnO with HBr", function(){
        expect(balanceEquation("MnO + HBr -> MnBr2 + H2O")).toBe("MnO + 2HBr -> MnBr2 + H2O");
    });
    it("procedural case 45: synthesis of sulfur trioxide", function(){
        expect(balanceEquation("SO2 + O2 -> SO3")).toBe("2SO2 + O2 -> 2SO3");
    });
    it("procedural case 46: complete combustion of C7H16", function(){
        expect(balanceEquation("C7H16 + O2 -> CO2 + H2O")).toBe("C7H16 + 11O2 -> 7CO2 + 8H2O");
    });
    it("procedural case 47: CrCl3 with PbSO4", function(){
        expect(balanceEquation("CrCl3 + PbSO4 -> Cr2(SO4)3 + PbCl2")).toBe("2CrCl3 + 3PbSO4 -> Cr2(SO4)3 + 3PbCl2");
    });
    it("procedural case 48: FeCl3 with Cr2(SO4)3", function(){
        expect(balanceEquation("FeCl3 + Cr2(SO4)3 -> Fe2(SO4)3 + CrCl3")).toBe("2FeCl3 + Cr2(SO4)3 -> Fe2(SO4)3 + 2CrCl3");
    });
    it("procedural case 49: SrC2O4 with HI", function(){
        expect(balanceEquation("SrC2O4 + HI -> SrI2 + H2C2O4")).toBe("SrC2O4 + 2HI -> SrI2 + H2C2O4");
    });
    it("procedural case 50: Cu with HI", function(){
        expect(balanceEquation("Cu + HI -> CuI2 + H2")).toBe("Cu + 2HI -> CuI2 + H2");
    });
    it("procedural case 51: Br2 with CaI2", function(){
        expect(balanceEquation("Br2 + CaI2 -> CaBr2 + I22")).toBe("11Br2 + 11CaI2 -> 11CaBr2 + I22");
    });
    it("procedural case 52: MgCO3 with HI", function(){
        expect(balanceEquation("MgCO3 + HI -> MgI2 + H2O + CO2")).toBe("MgCO3 + 2HI -> MgI2 + H2O + CO2");
    });
    it("procedural case 53: Cl2 with NaBr", function(){
        expect(balanceEquation("Cl2 + NaBr -> NaCl + Br2")).toBe("Cl2 + 2NaBr -> 2NaCl + Br2");
    });
    it("procedural case 54: K2S with AgNO3", function(){
        expect(balanceEquation("K2S + AgNO3 -> Ag2S + KNO3")).toBe("K2S + 2AgNO3 -> Ag2S + 2KNO3");
    });
    it("procedural case 55: Pb(OH)2 with H3PO4", function(){
        expect(balanceEquation("Pb(OH)2 + H3PO4 -> Pb3(PO4)2 + H2O")).toBe("3Pb(OH)2 + 2H3PO4 -> Pb3(PO4)2 + 6H2O");
    });
    it("procedural case 56: Al2(C2O4)3 with HCl", function(){
        expect(balanceEquation("Al2(C2O4)3 + HCl -> AlCl3 + H2C2O4")).toBe("Al2(C2O4)3 + 6HCl -> 2AlCl3 + 3H2C2O4");
    });
    it("procedural case 57: Fe(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Fe(NO3)2 + K2SO4 -> KNO3 + FeSO4")).toBe("Fe(NO3)2 + K2SO4 -> 2KNO3 + FeSO4");
    });
    it("procedural case 58: Pb(NO2)2 with HF", function(){
        expect(balanceEquation("Pb(NO2)2 + HF -> PbF2 + HNO2")).toBe("Pb(NO2)2 + 2HF -> PbF2 + 2HNO2");
    });
    it("procedural case 59: Sr with HBr", function(){
        expect(balanceEquation("Sr + HBr -> SrBr2 + H2")).toBe("Sr + 2HBr -> SrBr2 + H2");
    });
    it("procedural case 60: MgCO3 with HCl", function(){
        expect(balanceEquation("MgCO3 + HCl -> MgCl2 + H2O + CO2")).toBe("MgCO3 + 2HCl -> MgCl2 + H2O + CO2");
    });
    it("procedural case 61: complete combustion of C3H7OH", function(){
        expect(balanceEquation("C3H7OH + O2 -> CO2 + H2O")).toBe("2C3H7OH + 9O2 -> 6CO2 + 8H2O");
    });
    it("procedural case 62: Al2O3 with H2CO3", function(){
        expect(balanceEquation("Al2O3 + H2CO3 -> Al2(CO3)3 + H2O")).toBe("Al2O3 + 3H2CO3 -> Al2(CO3)3 + 3H2O");
    });
    it("procedural case 63: Cr with HF", function(){
        expect(balanceEquation("Cr + HF -> CrF3 + H2")).toBe("2Cr + 6HF -> 2CrF3 + 3H2");
    });
    it("procedural case 64: decomposition of potassium chlorate", function(){
        expect(balanceEquation("KClO3 -> KCl + O2")).toBe("2KClO3 -> 2KCl + 3O2");
    });
    it("procedural case 65: Co(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Co(NO3)2 + Ag2SO4 -> AgNO3 + CoSO4")).toBe("Co(NO3)2 + Ag2SO4 -> 2AgNO3 + CoSO4");
    });
    it("procedural case 66: Rb2S with HF", function(){
        expect(balanceEquation("Rb2S + HF -> RbF + H2S")).toBe("Rb2S + 2HF -> 2RbF + H2S");
    });
    it("procedural case 67: Mn(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Mn(NO3)2 + Na2SO4 -> NaNO3 + MnSO4")).toBe("Mn(NO3)2 + Na2SO4 -> 2NaNO3 + MnSO4");
    });
    it("procedural case 68: Ca(OH)2 with HBr", function(){
        expect(balanceEquation("Ca(OH)2 + HBr -> CaBr2 + H2O")).toBe("Ca(OH)2 + 2HBr -> CaBr2 + 2H2O");
    });
    it("procedural case 69: SnO with HCl", function(){
        expect(balanceEquation("SnO + HCl -> SnCl2 + H2O")).toBe("SnO + 2HCl -> SnCl2 + H2O");
    });
    it("procedural case 70: Pb(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Pb(NO3)2 + Ag2SO4 -> AgNO3 + PbSO4")).toBe("Pb(NO3)2 + Ag2SO4 -> 2AgNO3 + PbSO4");
    });
    it("procedural case 71: FeC2O4 with HF", function(){
        expect(balanceEquation("FeC2O4 + HF -> FeF2 + H2C2O4")).toBe("FeC2O4 + 2HF -> FeF2 + H2C2O4");
    });
    it("procedural case 72: BaO with HBr", function(){
        expect(balanceEquation("BaO + HBr -> BaBr2 + H2O")).toBe("BaO + 2HBr -> BaBr2 + H2O");
    });
    it("procedural case 73: Rb2C2O4 with HCl", function(){
        expect(balanceEquation("Rb2C2O4 + HCl -> RbCl + H2C2O4")).toBe("Rb2C2O4 + 2HCl -> 2RbCl + H2C2O4");
    });
    it("procedural case 74: F2 with MgI2", function(){
        expect(balanceEquation("F2 + MgI2 -> MgF2 + I22")).toBe("11F2 + 11MgI2 -> 11MgF2 + I22");
    });
    it("procedural case 75: Pb with HBr", function(){
        expect(balanceEquation("Pb + HBr -> PbBr2 + H2")).toBe("Pb + 2HBr -> PbBr2 + H2");
    });
    it("procedural case 76: Sn(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Sn(NO3)2 + Na2SO4 -> NaNO3 + SnSO4")).toBe("Sn(NO3)2 + Na2SO4 -> 2NaNO3 + SnSO4");
    });
    it("procedural case 77: Sr(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Sr(NO3)2 + Li2SO4 -> LiNO3 + SrSO4")).toBe("Sr(NO3)2 + Li2SO4 -> 2LiNO3 + SrSO4");
    });
    it("procedural case 78: Zn(OH)2 with H3PO4", function(){
        expect(balanceEquation("Zn(OH)2 + H3PO4 -> Zn3(PO4)2 + H2O")).toBe("3Zn(OH)2 + 2H3PO4 -> Zn3(PO4)2 + 6H2O");
    });
    it("procedural case 79: CuC2O4 with HI", function(){
        expect(balanceEquation("CuC2O4 + HI -> CuI2 + H2C2O4")).toBe("CuC2O4 + 2HI -> CuI2 + H2C2O4");
    });
    it("procedural case 80: MnS with HF", function(){
        expect(balanceEquation("MnS + HF -> MnF2 + H2S")).toBe("MnS + 2HF -> MnF2 + H2S");
    });
    it("procedural case 81: Cs with H3PO4", function(){
        expect(balanceEquation("Cs + H3PO4 -> Cs(PO4)3 + H2")).toBe("2Cs + 6H3PO4 -> 2Cs(PO4)3 + 9H2");
    });
    it("procedural case 82: Zn(NO3)2 with RbCl", function(){
        expect(balanceEquation("Zn(NO3)2 + RbCl -> RbNO3 + ZnCl2")).toBe("Zn(NO3)2 + 2RbCl -> 2RbNO3 + ZnCl2");
    });
    it("procedural case 83: AlCl3 with Na2SO4", function(){
        expect(balanceEquation("AlCl3 + Na2SO4 -> Al2(2SO4)3 + NaCl")).toBe("2AlCl3 + 3Na2SO4 -> Al2(2SO4)3 + 6NaCl");
    });
    it("procedural case 84: Ag with HBr", function(){
        expect(balanceEquation("Ag + HBr -> AgBr + H2")).toBe("2Ag + 2HBr -> 2AgBr + H2");
    });
    it("procedural case 85: SrCO3 with HF", function(){
        expect(balanceEquation("SrCO3 + HF -> SrF2 + H2O + CO2")).toBe("SrCO3 + 2HF -> SrF2 + H2O + CO2");
    });
    it("procedural case 86: complete combustion of C4H9OH", function(){
        expect(balanceEquation("C4H9OH + O2 -> CO2 + H2O")).toBe("C4H9OH + 6O2 -> 4CO2 + 5H2O");
    });
    it("procedural case 87: Li2S with HBr", function(){
        expect(balanceEquation("Li2S + HBr -> LiBr + H2S")).toBe("Li2S + 2HBr -> 2LiBr + H2S");
    });
    it("procedural case 88: Ca(OH)2 with HF", function(){
        expect(balanceEquation("Ca(OH)2 + HF -> CaF2 + H2O")).toBe("Ca(OH)2 + 2HF -> CaF2 + 2H2O");
    });
    it("procedural case 89: Zn with H3PO4", function(){
        expect(balanceEquation("Zn + H3PO4 -> Zn3(PO4)2 + H2")).toBe("3Zn + 2H3PO4 -> Zn3(PO4)2 + 3H2");
    });
    it("procedural case 90: Al(OH)3 with HBr", function(){
        expect(balanceEquation("Al(OH)3 + HBr -> AlBr3 + H2O")).toBe("Al(OH)3 + 3HBr -> AlBr3 + 3H2O");
    });
    it("procedural case 91: complete combustion of C2H6", function(){
        expect(balanceEquation("C2H6 + O2 -> CO2 + H2O")).toBe("2C2H6 + 7O2 -> 4CO2 + 6H2O");
    });
    it("procedural case 92: AlCl3 with BaSO4", function(){
        expect(balanceEquation("AlCl3 + BaSO4 -> Al2(SO4)3 + BaCl2")).toBe("2AlCl3 + 3BaSO4 -> Al2(SO4)3 + 3BaCl2");
    });
    it("procedural case 93: Rb2S with HCl", function(){
        expect(balanceEquation("Rb2S + HCl -> RbCl + H2S")).toBe("Rb2S + 2HCl -> 2RbCl + H2S");
    });
    it("procedural case 94: Fe(NO2)2 with HF", function(){
        expect(balanceEquation("Fe(NO2)2 + HF -> FeF2 + HNO2")).toBe("Fe(NO2)2 + 2HF -> FeF2 + 2HNO2");
    });
    it("procedural case 95: AlCl3 with Li2SO4", function(){
        expect(balanceEquation("AlCl3 + Li2SO4 -> Al2(2SO4)3 + LiCl")).toBe("2AlCl3 + 3Li2SO4 -> Al2(2SO4)3 + 6LiCl");
    });
    it("procedural case 96: CoO with HF", function(){
        expect(balanceEquation("CoO + HF -> CoF2 + H2O")).toBe("CoO + 2HF -> CoF2 + H2O");
    });
    it("procedural case 97: Co(OH)2 with HCl", function(){
        expect(balanceEquation("Co(OH)2 + HCl -> CoCl2 + H2O")).toBe("Co(OH)2 + 2HCl -> CoCl2 + 2H2O");
    });
    it("procedural case 98: Sn(NO2)2 with HF", function(){
        expect(balanceEquation("Sn(NO2)2 + HF -> SnF2 + HNO2")).toBe("Sn(NO2)2 + 2HF -> SnF2 + 2HNO2");
    });
    it("procedural case 99: Ba(OH)2 with HF", function(){
        expect(balanceEquation("Ba(OH)2 + HF -> BaF2 + H2O")).toBe("Ba(OH)2 + 2HF -> BaF2 + 2H2O");
    });
    it("procedural case 100: Cr with H2SO4", function(){
        expect(balanceEquation("Cr + H2SO4 -> Cr2(SO4)3 + H2")).toBe("2Cr + 3H2SO4 -> Cr2(SO4)3 + 3H2");
    });
    it("procedural case 101: Ba(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Ba(NO3)2 + Li2SO4 -> LiNO3 + BaSO4")).toBe("Ba(NO3)2 + Li2SO4 -> 2LiNO3 + BaSO4");
    });
    it("procedural case 102: Zn(NO3)2 with LiCl", function(){
        expect(balanceEquation("Zn(NO3)2 + LiCl -> LiNO3 + ZnCl2")).toBe("Zn(NO3)2 + 2LiCl -> 2LiNO3 + ZnCl2");
    });
    it("procedural case 103: Cu(NO2)2 with HBr", function(){
        expect(balanceEquation("Cu(NO2)2 + HBr -> CuBr2 + HNO2")).toBe("Cu(NO2)2 + 2HBr -> CuBr2 + 2HNO2");
    });
    it("procedural case 104: Zn with HBr", function(){
        expect(balanceEquation("Zn + HBr -> ZnBr2 + H2")).toBe("Zn + 2HBr -> ZnBr2 + H2");
    });
    it("procedural case 105: Cr(OH)3 with H3PO4", function(){
        expect(balanceEquation("Cr(OH)3 + H3PO4 -> CrPO4 + H2O")).toBe("Cr(OH)3 + H3PO4 -> CrPO4 + 3H2O");
    });
    it("procedural case 106: Cs with HC2H3O2", function(){
        expect(balanceEquation("Cs + HC2H3O2 -> CsC2H3O2 + H2")).toBe("2Cs + 2HC2H3O2 -> 2CsC2H3O2 + H2");
    });
    it("procedural case 107: Cu(NO3)2 with RbCl", function(){
        expect(balanceEquation("Cu(NO3)2 + RbCl -> RbNO3 + CuCl2")).toBe("Cu(NO3)2 + 2RbCl -> 2RbNO3 + CuCl2");
    });
    it("procedural case 108: I2 with MgBr2", function(){
        expect(balanceEquation("I2 + MgBr2 -> MgI2 + Br22")).toBe("11I2 + 11MgBr2 -> 11MgI2 + Br22");
    });
    it("procedural case 109: CaS with HF", function(){
        expect(balanceEquation("CaS + HF -> CaF2 + H2S")).toBe("CaS + 2HF -> CaF2 + H2S");
    });
    it("procedural case 110: decomposition of potassium nitrate", function(){
        expect(balanceEquation("KNO3 -> KNO2 + O2")).toBe("2KNO3 -> 2KNO2 + O2");
    });
    it("procedural case 111: Mg(OH)2 with HBr", function(){
        expect(balanceEquation("Mg(OH)2 + HBr -> MgBr2 + H2O")).toBe("Mg(OH)2 + 2HBr -> MgBr2 + 2H2O");
    });
    it("procedural case 112: Ca(OH)2 with HI", function(){
        expect(balanceEquation("Ca(OH)2 + HI -> CaI2 + H2O")).toBe("Ca(OH)2 + 2HI -> CaI2 + 2H2O");
    });
    it("procedural case 113: Ni(NO3)2 with KCl", function(){
        expect(balanceEquation("Ni(NO3)2 + KCl -> KNO3 + NiCl2")).toBe("Ni(NO3)2 + 2KCl -> 2KNO3 + NiCl2");
    });
    it("procedural case 114: I2 with AlBr3", function(){
        expect(balanceEquation("I2 + AlBr3 -> AlI3 + Br32")).toBe("48I2 + 32AlBr3 -> 32AlI3 + 3Br32");
    });
    it("procedural case 115: Co(OH)2 with HBr", function(){
        expect(balanceEquation("Co(OH)2 + HBr -> CoBr2 + H2O")).toBe("Co(OH)2 + 2HBr -> CoBr2 + 2H2O");
    });
    it("procedural case 116: Sr(NO2)2 with HCl", function(){
        expect(balanceEquation("Sr(NO2)2 + HCl -> SrCl2 + HNO2")).toBe("Sr(NO2)2 + 2HCl -> SrCl2 + 2HNO2");
    });
    it("procedural case 117: complete combustion of C2H2", function(){
        expect(balanceEquation("C2H2 + O2 -> CO2 + H2O")).toBe("2C2H2 + 5O2 -> 4CO2 + 2H2O");
    });
    it("procedural case 118: SnC2O4 with HF", function(){
        expect(balanceEquation("SnC2O4 + HF -> SnF2 + H2C2O4")).toBe("SnC2O4 + 2HF -> SnF2 + H2C2O4");
    });
    it("procedural case 119: CaCO3 with HI", function(){
        expect(balanceEquation("CaCO3 + HI -> CaI2 + H2O + CO2")).toBe("CaCO3 + 2HI -> CaI2 + H2O + CO2");
    });
    it("procedural case 120: ZnCl2 with Fe2(SO4)3", function(){
        expect(balanceEquation("ZnCl2 + Fe2(SO4)3 -> Zn2(SO4)3 + FeCl2")).toBe("2ZnCl2 + Fe2(SO4)3 -> Zn2(SO4)3 + 2FeCl2");
    });
    it("procedural case 121: Pb(OH)2 with HBr", function(){
        expect(balanceEquation("Pb(OH)2 + HBr -> PbBr2 + H2O")).toBe("Pb(OH)2 + 2HBr -> PbBr2 + 2H2O");
    });
    it("procedural case 122: Cr(OH)3 with H2SO4", function(){
        expect(balanceEquation("Cr(OH)3 + H2SO4 -> Cr2(SO4)3 + H2O")).toBe("2Cr(OH)3 + 3H2SO4 -> Cr2(SO4)3 + 6H2O");
    });
    it("procedural case 123: Ba(OH)2 with H2SO4", function(){
        expect(balanceEquation("Ba(OH)2 + H2SO4 -> BaSO4 + H2O")).toBe("Ba(OH)2 + H2SO4 -> BaSO4 + 2H2O");
    });
    it("procedural case 124: Mg(OH)2 with HF", function(){
        expect(balanceEquation("Mg(OH)2 + HF -> MgF2 + H2O")).toBe("Mg(OH)2 + 2HF -> MgF2 + 2H2O");
    });
    it("procedural case 125: Cs with HBr", function(){
        expect(balanceEquation("Cs + HBr -> CsBr + H2")).toBe("2Cs + 2HBr -> 2CsBr + H2");
    });
    it("procedural case 126: Cs with H2S", function(){
        expect(balanceEquation("Cs + H2S -> Cs(S)2 + H2")).toBe("Cs + 2H2S -> Cs(S)2 + 2H2");
    });
    it("procedural case 127: PbO with HCl", function(){
        expect(balanceEquation("PbO + HCl -> PbCl2 + H2O")).toBe("PbO + 2HCl -> PbCl2 + H2O");
    });
    it("procedural case 128: CoC2O4 with HBr", function(){
        expect(balanceEquation("CoC2O4 + HBr -> CoBr2 + H2C2O4")).toBe("CoC2O4 + 2HBr -> CoBr2 + H2C2O4");
    });
    it("procedural case 129: Cu(NO2)2 with HI", function(){
        expect(balanceEquation("Cu(NO2)2 + HI -> CuI2 + HNO2")).toBe("Cu(NO2)2 + 2HI -> CuI2 + 2HNO2");
    });
    it("procedural case 130: PbS with HCl", function(){
        expect(balanceEquation("PbS + HCl -> PbCl2 + H2S")).toBe("PbS + 2HCl -> PbCl2 + H2S");
    });
    it("procedural case 131: Fe(NO3)2 with NaCl", function(){
        expect(balanceEquation("Fe(NO3)2 + NaCl -> NaNO3 + FeCl2")).toBe("Fe(NO3)2 + 2NaCl -> 2NaNO3 + FeCl2");
    });
    it("procedural case 132: AlCl3 with NiSO4", function(){
        expect(balanceEquation("AlCl3 + NiSO4 -> Al2(SO4)3 + NiCl2")).toBe("2AlCl3 + 3NiSO4 -> Al2(SO4)3 + 3NiCl2");
    });
    it("procedural case 133: Na2S with HI", function(){
        expect(balanceEquation("Na2S + HI -> NaI + H2S")).toBe("Na2S + 2HI -> 2NaI + H2S");
    });
    it("procedural case 134: Al(NO3)3 with KCl", function(){
        expect(balanceEquation("Al(NO3)3 + KCl -> KNO3 + AlCl3")).toBe("Al(NO3)3 + 3KCl -> 3KNO3 + AlCl3");
    });
    it("procedural case 135: Sr(NO2)2 with HBr", function(){
        expect(balanceEquation("Sr(NO2)2 + HBr -> SrBr2 + HNO2")).toBe("Sr(NO2)2 + 2HBr -> SrBr2 + 2HNO2");
    });
    it("procedural case 136: Sn(NO2)2 with HBr", function(){
        expect(balanceEquation("Sn(NO2)2 + HBr -> SnBr2 + HNO2")).toBe("Sn(NO2)2 + 2HBr -> SnBr2 + 2HNO2");
    });
    it("procedural case 137: Rb2C2O4 with HNO3", function(){
        expect(balanceEquation("Rb2C2O4 + HNO3 -> RbNO3 + H2C2O4")).toBe("Rb2C2O4 + 2HNO3 -> 2RbNO3 + H2C2O4");
    });
    it("procedural case 138: K2CO3 with AgNO3", function(){
        expect(balanceEquation("K2CO3 + AgNO3 -> Ag2CO3 + KNO3")).toBe("K2CO3 + 2AgNO3 -> Ag2CO3 + 2KNO3");
    });
    it("procedural case 139: Fe(OH)2 with H2SO4", function(){
        expect(balanceEquation("Fe(OH)2 + H2SO4 -> FeSO4 + H2O")).toBe("Fe(OH)2 + H2SO4 -> FeSO4 + 2H2O");
    });
    it("procedural case 140: PbO with HF", function(){
        expect(balanceEquation("PbO + HF -> PbF2 + H2O")).toBe("PbO + 2HF -> PbF2 + H2O");
    });
    it("procedural case 141: Ba(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Ba(NO2)2 + H2SO4 -> BaSO4 + HNO2")).toBe("Ba(NO2)2 + H2SO4 -> BaSO4 + 2HNO2");
    });
    it("procedural case 142: FeCO3 with HF", function(){
        expect(balanceEquation("FeCO3 + HF -> FeF2 + H2O + CO2")).toBe("FeCO3 + 2HF -> FeF2 + H2O + CO2");
    });
    it("procedural case 143: ZnC2O4 with HI", function(){
        expect(balanceEquation("ZnC2O4 + HI -> ZnI2 + H2C2O4")).toBe("ZnC2O4 + 2HI -> ZnI2 + H2C2O4");
    });
    it("procedural case 144: Sn(OH)2 with HBr", function(){
        expect(balanceEquation("Sn(OH)2 + HBr -> SnBr2 + H2O")).toBe("Sn(OH)2 + 2HBr -> SnBr2 + 2H2O");
    });
    it("procedural case 145: Cr(NO2)3 with H2SO4", function(){
        expect(balanceEquation("Cr(NO2)3 + H2SO4 -> Cr2(SO4)3 + HNO2")).toBe("2Cr(NO2)3 + 3H2SO4 -> Cr2(SO4)3 + 6HNO2");
    });
    it("procedural case 146: CaCO3 with HF", function(){
        expect(balanceEquation("CaCO3 + HF -> CaF2 + H2O + CO2")).toBe("CaCO3 + 2HF -> CaF2 + H2O + CO2");
    });
    it("procedural case 147: Cl2 with NaI", function(){
        expect(balanceEquation("Cl2 + NaI -> NaCl + I2")).toBe("Cl2 + 2NaI -> 2NaCl + I2");
    });
    it("procedural case 148: BaCO3 with HCl", function(){
        expect(balanceEquation("BaCO3 + HCl -> BaCl2 + H2O + CO2")).toBe("BaCO3 + 2HCl -> BaCl2 + H2O + CO2");
    });
    it("procedural case 149: NiCO3 with HBr", function(){
        expect(balanceEquation("NiCO3 + HBr -> NiBr2 + H2O + CO2")).toBe("NiCO3 + 2HBr -> NiBr2 + H2O + CO2");
    });
    it("procedural case 150: Pb(NO2)2 with HCl", function(){
        expect(balanceEquation("Pb(NO2)2 + HCl -> PbCl2 + HNO2")).toBe("Pb(NO2)2 + 2HCl -> PbCl2 + 2HNO2");
    });
    it("procedural case 151: CrCl3 with K2SO4", function(){
        expect(balanceEquation("CrCl3 + K2SO4 -> Cr2(2SO4)3 + KCl")).toBe("2CrCl3 + 3K2SO4 -> Cr2(2SO4)3 + 6KCl");
    });
    it("procedural case 152: Pb with HI", function(){
        expect(balanceEquation("Pb + HI -> PbI2 + H2")).toBe("Pb + 2HI -> PbI2 + H2");
    });
    it("procedural case 153: Cr(NO3)3 with Ag2SO4", function(){
        expect(balanceEquation("Cr(NO3)3 + Ag2SO4 -> AgNO3 + Cr2(SO4)3")).toBe("2Cr(NO3)3 + 3Ag2SO4 -> 6AgNO3 + Cr2(SO4)3");
    });
    it("procedural case 154: ZnCO3 with HBr", function(){
        expect(balanceEquation("ZnCO3 + HBr -> ZnBr2 + H2O + CO2")).toBe("ZnCO3 + 2HBr -> ZnBr2 + H2O + CO2");
    });
    it("procedural case 155: MnS with HI", function(){
        expect(balanceEquation("MnS + HI -> MnI2 + H2S")).toBe("MnS + 2HI -> MnI2 + H2S");
    });
    it("procedural case 156: Co(NO2)2 with HBr", function(){
        expect(balanceEquation("Co(NO2)2 + HBr -> CoBr2 + HNO2")).toBe("Co(NO2)2 + 2HBr -> CoBr2 + 2HNO2");
    });
    it("procedural case 157: K2C2O4 with HI", function(){
        expect(balanceEquation("K2C2O4 + HI -> KI + H2C2O4")).toBe("K2C2O4 + 2HI -> 2KI + H2C2O4");
    });
    it("procedural case 158: F2 with MgCl2", function(){
        expect(balanceEquation("F2 + MgCl2 -> MgF2 + Cl22")).toBe("11F2 + 11MgCl2 -> 11MgF2 + Cl22");
    });
    it("procedural case 159: BaO with H3PO4", function(){
        expect(balanceEquation("BaO + H3PO4 -> Ba3(PO4)2 + H2O")).toBe("3BaO + 2H3PO4 -> Ba3(PO4)2 + 3H2O");
    });
    it("procedural case 160: synthesis of hydrogen chloride", function(){
        expect(balanceEquation("H2 + Cl2 -> HCl")).toBe("H2 + Cl2 -> 2HCl");
    });
    it("procedural case 161: complete combustion of C6H14", function(){
        expect(balanceEquation("C6H14 + O2 -> CO2 + H2O")).toBe("2C6H14 + 19O2 -> 12CO2 + 14H2O");
    });
    it("procedural case 162: Fe(NO3)2 with RbCl", function(){
        expect(balanceEquation("Fe(NO3)2 + RbCl -> RbNO3 + FeCl2")).toBe("Fe(NO3)2 + 2RbCl -> 2RbNO3 + FeCl2");
    });
    it("procedural case 163: Al2S3 with H2SO4", function(){
        expect(balanceEquation("Al2S3 + H2SO4 -> Al2(SO4)3 + H2S")).toBe("Al2S3 + 3H2SO4 -> Al2(SO4)3 + 3H2S");
    });
    it("procedural case 164: Al2O3 with HI", function(){
        expect(balanceEquation("Al2O3 + HI -> AlI3 + H2O")).toBe("Al2O3 + 6HI -> 2AlI3 + 3H2O");
    });
    it("procedural case 165: CoC2O4 with HI", function(){
        expect(balanceEquation("CoC2O4 + HI -> CoI2 + H2C2O4")).toBe("CoC2O4 + 2HI -> CoI2 + H2C2O4");
    });
    it("procedural case 166: Sn(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Sn(NO3)2 + Ag2SO4 -> AgNO3 + SnSO4")).toBe("Sn(NO3)2 + Ag2SO4 -> 2AgNO3 + SnSO4");
    });
    it("procedural case 167: Co(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Co(NO3)2 + K2SO4 -> KNO3 + CoSO4")).toBe("Co(NO3)2 + K2SO4 -> 2KNO3 + CoSO4");
    });
    it("procedural case 168: CrCl3 with MgSO4", function(){
        expect(balanceEquation("CrCl3 + MgSO4 -> Cr2(SO4)3 + MgCl2")).toBe("2CrCl3 + 3MgSO4 -> Cr2(SO4)3 + 3MgCl2");
    });
    it("procedural case 169: complete combustion of C2H5OH", function(){
        expect(balanceEquation("C2H5OH + O2 -> CO2 + H2O")).toBe("C2H5OH + 3O2 -> 2CO2 + 3H2O");
    });
    it("procedural case 170: Co(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Co(NO3)2 + Na2SO4 -> NaNO3 + CoSO4")).toBe("Co(NO3)2 + Na2SO4 -> 2NaNO3 + CoSO4");
    });
    it("procedural case 171: Cr(OH)3 with HI", function(){
        expect(balanceEquation("Cr(OH)3 + HI -> CrI3 + H2O")).toBe("Cr(OH)3 + 3HI -> CrI3 + 3H2O");
    });
    it("procedural case 172: Sr(OH)2 with HBr", function(){
        expect(balanceEquation("Sr(OH)2 + HBr -> SrBr2 + H2O")).toBe("Sr(OH)2 + 2HBr -> SrBr2 + 2H2O");
    });
    it("procedural case 173: CuO with HBr", function(){
        expect(balanceEquation("CuO + HBr -> CuBr2 + H2O")).toBe("CuO + 2HBr -> CuBr2 + H2O");
    });
    it("procedural case 174: Ag2S with HI", function(){
        expect(balanceEquation("Ag2S + HI -> AgI + H2S")).toBe("Ag2S + 2HI -> 2AgI + H2S");
    });
    it("procedural case 175: ZnO with HCl", function(){
        expect(balanceEquation("ZnO + HCl -> ZnCl2 + H2O")).toBe("ZnO + 2HCl -> ZnCl2 + H2O");
    });
    it("procedural case 176: Br2 with AlI3", function(){
        expect(balanceEquation("Br2 + AlI3 -> AlBr3 + I32")).toBe("48Br2 + 32AlI3 -> 32AlBr3 + 3I32");
    });
    it("procedural case 177: Cl2 with MgBr2", function(){
        expect(balanceEquation("Cl2 + MgBr2 -> MgCl2 + Br22")).toBe("11Cl2 + 11MgBr2 -> 11MgCl2 + Br22");
    });
    it("procedural case 178: Ca(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Ca(NO3)2 + Ag2SO4 -> AgNO3 + CaSO4")).toBe("Ca(NO3)2 + Ag2SO4 -> 2AgNO3 + CaSO4");
    });
    it("procedural case 179: Rb with HNO3", function(){
        expect(balanceEquation("Rb + HNO3 -> RbNO3 + H2")).toBe("2Rb + 2HNO3 -> 2RbNO3 + H2");
    });
    it("procedural case 180: Br2 with MgF2", function(){
        expect(balanceEquation("Br2 + MgF2 -> MgBr2 + F22")).toBe("11Br2 + 11MgF2 -> 11MgBr2 + F22");
    });
    it("procedural case 181: Sr(OH)2 with H2CO3", function(){
        expect(balanceEquation("Sr(OH)2 + H2CO3 -> SrCO3 + H2O")).toBe("Sr(OH)2 + H2CO3 -> SrCO3 + 2H2O");
    });
    it("procedural case 182: Ag2S with HCl", function(){
        expect(balanceEquation("Ag2S + HCl -> AgCl + H2S")).toBe("Ag2S + 2HCl -> 2AgCl + H2S");
    });
    it("procedural case 183: Al2(C2O4)3 with H2SO4", function(){
        expect(balanceEquation("Al2(C2O4)3 + H2SO4 -> Al2(SO4)3 + H2C2O4")).toBe("Al2(C2O4)3 + 3H2SO4 -> Al2(SO4)3 + 3H2C2O4");
    });
    it("procedural case 184: Ni with HI", function(){
        expect(balanceEquation("Ni + HI -> NiI2 + H2")).toBe("Ni + 2HI -> NiI2 + H2");
    });
    it("procedural case 185: Mn(NO3)2 with LiCl", function(){
        expect(balanceEquation("Mn(NO3)2 + LiCl -> LiNO3 + MnCl2")).toBe("Mn(NO3)2 + 2LiCl -> 2LiNO3 + MnCl2");
    });
    it("procedural case 186: Na2C2O4 with HI", function(){
        expect(balanceEquation("Na2C2O4 + HI -> NaI + H2C2O4")).toBe("Na2C2O4 + 2HI -> 2NaI + H2C2O4");
    });
    it("procedural case 187: Cu(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Cu(NO3)2 + Na2SO4 -> NaNO3 + CuSO4")).toBe("Cu(NO3)2 + Na2SO4 -> 2NaNO3 + CuSO4");
    });
    it("procedural case 188: SrC2O4 with HCl", function(){
        expect(balanceEquation("SrC2O4 + HCl -> SrCl2 + H2C2O4")).toBe("SrC2O4 + 2HCl -> SrCl2 + H2C2O4");
    });
    it("procedural case 189: Cu(OH)2 with H3PO4", function(){
        expect(balanceEquation("Cu(OH)2 + H3PO4 -> Cu3(PO4)2 + H2O")).toBe("3Cu(OH)2 + 2H3PO4 -> Cu3(PO4)2 + 6H2O");
    });
    it("procedural case 190: PbO with HI", function(){
        expect(balanceEquation("PbO + HI -> PbI2 + H2O")).toBe("PbO + 2HI -> PbI2 + H2O");
    });
    it("procedural case 191: Cs2CO3 with HC2H3O2", function(){
        expect(balanceEquation("Cs2CO3 + HC2H3O2 -> CsC2H3O2 + H2O + CO2")).toBe("Cs2CO3 + 2HC2H3O2 -> 2CsC2H3O2 + H2O + CO2");
    });
    it("procedural case 192: Al(NO2)3 with HI", function(){
        expect(balanceEquation("Al(NO2)3 + HI -> AlI3 + HNO2")).toBe("Al(NO2)3 + 3HI -> AlI3 + 3HNO2");
    });
    it("procedural case 193: K with H2S", function(){
        expect(balanceEquation("K + H2S -> K(S)2 + H2")).toBe("K + 2H2S -> K(S)2 + 2H2");
    });
    it("procedural case 194: CrCl3 with SnSO4", function(){
        expect(balanceEquation("CrCl3 + SnSO4 -> Cr2(SO4)3 + SnCl2")).toBe("2CrCl3 + 3SnSO4 -> Cr2(SO4)3 + 3SnCl2");
    });
    it("procedural case 195: Rb with H3PO4", function(){
        expect(balanceEquation("Rb + H3PO4 -> Rb(PO4)3 + H2")).toBe("2Rb + 6H3PO4 -> 2Rb(PO4)3 + 9H2");
    });
    it("procedural case 196: complete combustion of C6H12O6", function(){
        expect(balanceEquation("C6H12O6 + O2 -> CO2 + H2O")).toBe("C6H12O6 + 6O2 -> 6CO2 + 6H2O");
    });
    it("procedural case 197: Li2C2O4 with HBr", function(){
        expect(balanceEquation("Li2C2O4 + HBr -> LiBr + H2C2O4")).toBe("Li2C2O4 + 2HBr -> 2LiBr + H2C2O4");
    });
    it("procedural case 198: Cu(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Cu(NO3)2 + Rb2SO4 -> RbNO3 + CuSO4")).toBe("Cu(NO3)2 + Rb2SO4 -> 2RbNO3 + CuSO4");
    });
    it("procedural case 199: Co(NO3)2 with NaCl", function(){
        expect(balanceEquation("Co(NO3)2 + NaCl -> NaNO3 + CoCl2")).toBe("Co(NO3)2 + 2NaCl -> 2NaNO3 + CoCl2");
    });
    it("procedural case 200: synthesis of hydrogen bromide", function(){
        expect(balanceEquation("H2 + Br2 -> HBr")).toBe("H2 + Br2 -> 2HBr");
    });
    it("procedural case 201: Mg(OH)2 with H2SO4", function(){
        expect(balanceEquation("Mg(OH)2 + H2SO4 -> MgSO4 + H2O")).toBe("Mg(OH)2 + H2SO4 -> MgSO4 + 2H2O");
    });
    it("procedural case 202: Rb2CO3 with HF", function(){
        expect(balanceEquation("Rb2CO3 + HF -> RbF + H2O + CO2")).toBe("Rb2CO3 + 2HF -> 2RbF + H2O + CO2");
    });
    it("procedural case 203: Cr2S3 with HI", function(){
        expect(balanceEquation("Cr2S3 + HI -> CrI3 + H2S")).toBe("Cr2S3 + 6HI -> 2CrI3 + 3H2S");
    });
    it("procedural case 204: BaC2O4 with HF", function(){
        expect(balanceEquation("BaC2O4 + HF -> BaF2 + H2C2O4")).toBe("BaC2O4 + 2HF -> BaF2 + H2C2O4");
    });
    it("procedural case 205: Rb with HC2H3O2", function(){
        expect(balanceEquation("Rb + HC2H3O2 -> RbC2H3O2 + H2")).toBe("2Rb + 2HC2H3O2 -> 2RbC2H3O2 + H2");
    });
    it("procedural case 206: Al(NO3)3 with K2SO4", function(){
        expect(balanceEquation("Al(NO3)3 + K2SO4 -> KNO3 + Al2(SO4)3")).toBe("2Al(NO3)3 + 3K2SO4 -> 6KNO3 + Al2(SO4)3");
    });
    it("procedural case 207: Mg(NO3)2 with RbCl", function(){
        expect(balanceEquation("Mg(NO3)2 + RbCl -> RbNO3 + MgCl2")).toBe("Mg(NO3)2 + 2RbCl -> 2RbNO3 + MgCl2");
    });
    it("procedural case 208: complete combustion of CH4", function(){
        expect(balanceEquation("CH4 + O2 -> CO2 + H2O")).toBe("CH4 + 2O2 -> CO2 + 2H2O");
    });
    it("procedural case 209: PbCO3 with HI", function(){
        expect(balanceEquation("PbCO3 + HI -> PbI2 + H2O + CO2")).toBe("PbCO3 + 2HI -> PbI2 + H2O + CO2");
    });
    it("procedural case 210: Ba(NO2)2 with HCl", function(){
        expect(balanceEquation("Ba(NO2)2 + HCl -> BaCl2 + HNO2")).toBe("Ba(NO2)2 + 2HCl -> BaCl2 + 2HNO2");
    });
    it("procedural case 211: SrO with HBr", function(){
        expect(balanceEquation("SrO + HBr -> SrBr2 + H2O")).toBe("SrO + 2HBr -> SrBr2 + H2O");
    });
    it("procedural case 212: MgCO3 with HBr", function(){
        expect(balanceEquation("MgCO3 + HBr -> MgBr2 + H2O + CO2")).toBe("MgCO3 + 2HBr -> MgBr2 + H2O + CO2");
    });
    it("procedural case 213: complete combustion of C3H8", function(){
        expect(balanceEquation("C3H8 + O2 -> CO2 + H2O")).toBe("C3H8 + 5O2 -> 3CO2 + 4H2O");
    });
    it("procedural case 214: Co(OH)2 with H2SO4", function(){
        expect(balanceEquation("Co(OH)2 + H2SO4 -> CoSO4 + H2O")).toBe("Co(OH)2 + H2SO4 -> CoSO4 + 2H2O");
    });
    it("procedural case 215: Ni(NO3)2 with NaCl", function(){
        expect(balanceEquation("Ni(NO3)2 + NaCl -> NaNO3 + NiCl2")).toBe("Ni(NO3)2 + 2NaCl -> 2NaNO3 + NiCl2");
    });
    it("procedural case 216: Rb with H2CO3", function(){
        expect(balanceEquation("Rb + H2CO3 -> Rb(CO3)2 + H2")).toBe("Rb + 2H2CO3 -> Rb(CO3)2 + 2H2");
    });
    it("procedural case 217: Cr2S3 with HBr", function(){
        expect(balanceEquation("Cr2S3 + HBr -> CrBr3 + H2S")).toBe("Cr2S3 + 6HBr -> 2CrBr3 + 3H2S");
    });
    it("procedural case 218: Zn(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Zn(NO3)2 + Na2SO4 -> NaNO3 + ZnSO4")).toBe("Zn(NO3)2 + Na2SO4 -> 2NaNO3 + ZnSO4");
    });
    it("procedural case 219: Cr with HBr", function(){
        expect(balanceEquation("Cr + HBr -> CrBr3 + H2")).toBe("2Cr + 6HBr -> 2CrBr3 + 3H2");
    });
    it("procedural case 220: CaS with HCl", function(){
        expect(balanceEquation("CaS + HCl -> CaCl2 + H2S")).toBe("CaS + 2HCl -> CaCl2 + H2S");
    });
    it("procedural case 221: SnS with HI", function(){
        expect(balanceEquation("SnS + HI -> SnI2 + H2S")).toBe("SnS + 2HI -> SnI2 + H2S");
    });
    it("procedural case 222: PbC2O4 with HBr", function(){
        expect(balanceEquation("PbC2O4 + HBr -> PbBr2 + H2C2O4")).toBe("PbC2O4 + 2HBr -> PbBr2 + H2C2O4");
    });
    it("procedural case 223: Cs2S with HCl", function(){
        expect(balanceEquation("Cs2S + HCl -> CsCl + H2S")).toBe("Cs2S + 2HCl -> 2CsCl + H2S");
    });
    it("procedural case 224: K with HNO3", function(){
        expect(balanceEquation("K + HNO3 -> KNO3 + H2")).toBe("2K + 2HNO3 -> 2KNO3 + H2");
    });
    it("procedural case 225: Br2 with AlCl3", function(){
        expect(balanceEquation("Br2 + AlCl3 -> AlBr3 + Cl32")).toBe("48Br2 + 32AlCl3 -> 32AlBr3 + 3Cl32");
    });
    it("procedural case 226: Cl2 with CaI2", function(){
        expect(balanceEquation("Cl2 + CaI2 -> CaCl2 + I22")).toBe("11Cl2 + 11CaI2 -> 11CaCl2 + I22");
    });
    it("procedural case 227: AlCl3 with CaSO4", function(){
        expect(balanceEquation("AlCl3 + CaSO4 -> Al2(SO4)3 + CaCl2")).toBe("2AlCl3 + 3CaSO4 -> Al2(SO4)3 + 3CaCl2");
    });
    it("procedural case 228: Cu with HBr", function(){
        expect(balanceEquation("Cu + HBr -> CuBr2 + H2")).toBe("Cu + 2HBr -> CuBr2 + H2");
    });
    it("procedural case 229: MnCO3 with HBr", function(){
        expect(balanceEquation("MnCO3 + HBr -> MnBr2 + H2O + CO2")).toBe("MnCO3 + 2HBr -> MnBr2 + H2O + CO2");
    });
    it("procedural case 230: SrS with HBr", function(){
        expect(balanceEquation("SrS + HBr -> SrBr2 + H2S")).toBe("SrS + 2HBr -> SrBr2 + H2S");
    });
    it("procedural case 231: Cl2 with AlF3", function(){
        expect(balanceEquation("Cl2 + AlF3 -> AlCl3 + F32")).toBe("48Cl2 + 32AlF3 -> 32AlCl3 + 3F32");
    });
    it("procedural case 232: CoCO3 with HF", function(){
        expect(balanceEquation("CoCO3 + HF -> CoF2 + H2O + CO2")).toBe("CoCO3 + 2HF -> CoF2 + H2O + CO2");
    });
    it("procedural case 233: synthesis of magnesium oxide", function(){
        expect(balanceEquation("Mg + O2 -> MgO")).toBe("2Mg + O2 -> 2MgO");
    });
    it("procedural case 234: Cl2 with CaF2", function(){
        expect(balanceEquation("Cl2 + CaF2 -> CaCl2 + F22")).toBe("11Cl2 + 11CaF2 -> 11CaCl2 + F22");
    });
    it("procedural case 235: Li with H3PO4", function(){
        expect(balanceEquation("Li + H3PO4 -> Li(PO4)3 + H2")).toBe("2Li + 6H3PO4 -> 2Li(PO4)3 + 9H2");
    });
    it("procedural case 236: PbCO3 with HBr", function(){
        expect(balanceEquation("PbCO3 + HBr -> PbBr2 + H2O + CO2")).toBe("PbCO3 + 2HBr -> PbBr2 + H2O + CO2");
    });
    it("procedural case 237: BaC2O4 with HCl", function(){
        expect(balanceEquation("BaC2O4 + HCl -> BaCl2 + H2C2O4")).toBe("BaC2O4 + 2HCl -> BaCl2 + H2C2O4");
    });
    it("procedural case 238: F2 with AlCl3", function(){
        expect(balanceEquation("F2 + AlCl3 -> AlF3 + Cl32")).toBe("48F2 + 32AlCl3 -> 32AlF3 + 3Cl32");
    });
    it("procedural case 239: Zn(OH)2 with HBr", function(){
        expect(balanceEquation("Zn(OH)2 + HBr -> ZnBr2 + H2O")).toBe("Zn(OH)2 + 2HBr -> ZnBr2 + 2H2O");
    });
    it("procedural case 240: Pb(NO2)2 with HI", function(){
        expect(balanceEquation("Pb(NO2)2 + HI -> PbI2 + HNO2")).toBe("Pb(NO2)2 + 2HI -> PbI2 + 2HNO2");
    });
    it("procedural case 241: Cu(NO2)2 with HF", function(){
        expect(balanceEquation("Cu(NO2)2 + HF -> CuF2 + HNO2")).toBe("Cu(NO2)2 + 2HF -> CuF2 + 2HNO2");
    });
    it("procedural case 242: Ba(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Ba(NO3)2 + Ag2SO4 -> AgNO3 + BaSO4")).toBe("Ba(NO3)2 + Ag2SO4 -> 2AgNO3 + BaSO4");
    });
    it("procedural case 243: Al2(C2O4)3 with HBr", function(){
        expect(balanceEquation("Al2(C2O4)3 + HBr -> AlBr3 + H2C2O4")).toBe("Al2(C2O4)3 + 6HBr -> 2AlBr3 + 3H2C2O4");
    });
    it("procedural case 244: Zn(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Zn(NO2)2 + H2SO4 -> ZnSO4 + HNO2")).toBe("Zn(NO2)2 + H2SO4 -> ZnSO4 + 2HNO2");
    });
    it("procedural case 245: Ag2CO3 with HC2H3O2", function(){
        expect(balanceEquation("Ag2CO3 + HC2H3O2 -> AgC2H3O2 + H2O + CO2")).toBe("Ag2CO3 + 2HC2H3O2 -> 2AgC2H3O2 + H2O + CO2");
    });
    it("procedural case 246: Cr(OH)3 with HBr", function(){
        expect(balanceEquation("Cr(OH)3 + HBr -> CrBr3 + H2O")).toBe("Cr(OH)3 + 3HBr -> CrBr3 + 3H2O");
    });
    it("procedural case 247: Ba(OH)2 with H3PO4", function(){
        expect(balanceEquation("Ba(OH)2 + H3PO4 -> Ba3(PO4)2 + H2O")).toBe("3Ba(OH)2 + 2H3PO4 -> Ba3(PO4)2 + 6H2O");
    });
    it("procedural case 248: Pb(NO3)2 with AgCl", function(){
        expect(balanceEquation("Pb(NO3)2 + AgCl -> AgNO3 + PbCl2")).toBe("Pb(NO3)2 + 2AgCl -> 2AgNO3 + PbCl2");
    });
    it("procedural case 249: Al(NO3)3 with Rb2SO4", function(){
        expect(balanceEquation("Al(NO3)3 + Rb2SO4 -> RbNO3 + Al2(SO4)3")).toBe("2Al(NO3)3 + 3Rb2SO4 -> 6RbNO3 + Al2(SO4)3");
    });
    it("procedural case 250: Na2CO3 with HNO3", function(){
        expect(balanceEquation("Na2CO3 + HNO3 -> NaNO3 + H2O + CO2")).toBe("Na2CO3 + 2HNO3 -> 2NaNO3 + H2O + CO2");
    });
    it("procedural case 251: I2 with NaF", function(){
        expect(balanceEquation("I2 + NaF -> NaI + F2")).toBe("I2 + 2NaF -> 2NaI + F2");
    });
    it("procedural case 252: complete combustion of C6H6", function(){
        expect(balanceEquation("C6H6 + O2 -> CO2 + H2O")).toBe("2C6H6 + 15O2 -> 12CO2 + 6H2O");
    });
    it("procedural case 253: Cu with H3PO4", function(){
        expect(balanceEquation("Cu + H3PO4 -> Cu3(PO4)2 + H2")).toBe("3Cu + 2H3PO4 -> Cu3(PO4)2 + 3H2");
    });
    it("procedural case 254: Co(OH)2 with HI", function(){
        expect(balanceEquation("Co(OH)2 + HI -> CoI2 + H2O")).toBe("Co(OH)2 + 2HI -> CoI2 + 2H2O");
    });
    it("procedural case 255: Br2 with KF", function(){
        expect(balanceEquation("Br2 + KF -> KBr + F2")).toBe("Br2 + 2KF -> 2KBr + F2");
    });
    it("procedural case 256: CoS with HF", function(){
        expect(balanceEquation("CoS + HF -> CoF2 + H2S")).toBe("CoS + 2HF -> CoF2 + H2S");
    });
    it("procedural case 257: Al2(C2O4)3 with HI", function(){
        expect(balanceEquation("Al2(C2O4)3 + HI -> AlI3 + H2C2O4")).toBe("Al2(C2O4)3 + 6HI -> 2AlI3 + 3H2C2O4");
    });
    it("procedural case 258: CoS with HCl", function(){
        expect(balanceEquation("CoS + HCl -> CoCl2 + H2S")).toBe("CoS + 2HCl -> CoCl2 + H2S");
    });
    it("procedural case 259: Al(NO3)3 with NaCl", function(){
        expect(balanceEquation("Al(NO3)3 + NaCl -> NaNO3 + AlCl3")).toBe("Al(NO3)3 + 3NaCl -> 3NaNO3 + AlCl3");
    });
    it("procedural case 260: Li with HI", function(){
        expect(balanceEquation("Li + HI -> LiI + H2")).toBe("2Li + 2HI -> 2LiI + H2");
    });
    it("procedural case 261: MgCO3 with HF", function(){
        expect(balanceEquation("MgCO3 + HF -> MgF2 + H2O + CO2")).toBe("MgCO3 + 2HF -> MgF2 + H2O + CO2");
    });
    it("procedural case 262: Ni with HCl", function(){
        expect(balanceEquation("Ni + HCl -> NiCl2 + H2")).toBe("Ni + 2HCl -> NiCl2 + H2");
    });
    it("procedural case 263: Cr2S3 with H2SO4", function(){
        expect(balanceEquation("Cr2S3 + H2SO4 -> Cr2(SO4)3 + H2S")).toBe("Cr2S3 + 3H2SO4 -> Cr2(SO4)3 + 3H2S");
    });
    it("procedural case 264: Sr(NO3)2 with RbCl", function(){
        expect(balanceEquation("Sr(NO3)2 + RbCl -> RbNO3 + SrCl2")).toBe("Sr(NO3)2 + 2RbCl -> 2RbNO3 + SrCl2");
    });
    it("procedural case 265: Sr(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Sr(NO3)2 + Ag2SO4 -> AgNO3 + SrSO4")).toBe("Sr(NO3)2 + Ag2SO4 -> 2AgNO3 + SrSO4");
    });
    it("procedural case 266: Na2S with AgNO3", function(){
        expect(balanceEquation("Na2S + AgNO3 -> Ag2S + NaNO3")).toBe("Na2S + 2AgNO3 -> Ag2S + 2NaNO3");
    });
    it("procedural case 267: Fe(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Fe(NO3)2 + Ag2SO4 -> AgNO3 + FeSO4")).toBe("Fe(NO3)2 + Ag2SO4 -> 2AgNO3 + FeSO4");
    });
    it("procedural case 268: Al(OH)3 with H2SO4", function(){
        expect(balanceEquation("Al(OH)3 + H2SO4 -> Al2(SO4)3 + H2O")).toBe("2Al(OH)3 + 3H2SO4 -> Al2(SO4)3 + 6H2O");
    });
    it("procedural case 269: K with H2SO4", function(){
        expect(balanceEquation("K + H2SO4 -> K(SO4)2 + H2")).toBe("K + 2H2SO4 -> K(SO4)2 + 2H2");
    });
    it("procedural case 270: Na2O with HI", function(){
        expect(balanceEquation("Na2O + HI -> NaI + H2O")).toBe("Na2O + 2HI -> 2NaI + H2O");
    });
    it("procedural case 271: PbS with HI", function(){
        expect(balanceEquation("PbS + HI -> PbI2 + H2S")).toBe("PbS + 2HI -> PbI2 + H2S");
    });
    it("procedural case 272: ZnO with HBr", function(){
        expect(balanceEquation("ZnO + HBr -> ZnBr2 + H2O")).toBe("ZnO + 2HBr -> ZnBr2 + H2O");
    });
    it("procedural case 273: Li with H2SO4", function(){
        expect(balanceEquation("Li + H2SO4 -> Li(SO4)2 + H2")).toBe("Li + 2H2SO4 -> Li(SO4)2 + 2H2");
    });
    it("procedural case 274: Cr(NO2)3 with HBr", function(){
        expect(balanceEquation("Cr(NO2)3 + HBr -> CrBr3 + HNO2")).toBe("Cr(NO2)3 + 3HBr -> CrBr3 + 3HNO2");
    });
    it("procedural case 275: CoC2O4 with HCl", function(){
        expect(balanceEquation("CoC2O4 + HCl -> CoCl2 + H2C2O4")).toBe("CoC2O4 + 2HCl -> CoCl2 + H2C2O4");
    });
    it("procedural case 276: Ag2CO3 with HNO3", function(){
        expect(balanceEquation("Ag2CO3 + HNO3 -> AgNO3 + H2O + CO2")).toBe("Ag2CO3 + 2HNO3 -> 2AgNO3 + H2O + CO2");
    });
    it("procedural case 277: Fe with H3PO4", function(){
        expect(balanceEquation("Fe + H3PO4 -> Fe3(PO4)2 + H2")).toBe("3Fe + 2H3PO4 -> Fe3(PO4)2 + 3H2");
    });
    it("procedural case 278: Al with HI", function(){
        expect(balanceEquation("Al + HI -> AlI3 + H2")).toBe("2Al + 6HI -> 2AlI3 + 3H2");
    });
    it("procedural case 279: F2 with CaBr2", function(){
        expect(balanceEquation("F2 + CaBr2 -> CaF2 + Br22")).toBe("11F2 + 11CaBr2 -> 11CaF2 + Br22");
    });
    it("procedural case 280: I2 with KF", function(){
        expect(balanceEquation("I2 + KF -> KI + F2")).toBe("I2 + 2KF -> 2KI + F2");
    });
    it("procedural case 281: complete combustion of C4H10", function(){
        expect(balanceEquation("C4H10 + O2 -> CO2 + H2O")).toBe("2C4H10 + 13O2 -> 8CO2 + 10H2O");
    });
    it("procedural case 282: AlCl3 with FeSO4", function(){
        expect(balanceEquation("AlCl3 + FeSO4 -> Al2(SO4)3 + FeCl2")).toBe("2AlCl3 + 3FeSO4 -> Al2(SO4)3 + 3FeCl2");
    });
    it("procedural case 283: NiO with HI", function(){
        expect(balanceEquation("NiO + HI -> NiI2 + H2O")).toBe("NiO + 2HI -> NiI2 + H2O");
    });
    it("procedural case 284: Li with HC2H3O2", function(){
        expect(balanceEquation("Li + HC2H3O2 -> LiC2H3O2 + H2")).toBe("2Li + 2HC2H3O2 -> 2LiC2H3O2 + H2");
    });
    it("procedural case 285: CoCO3 with HCl", function(){
        expect(balanceEquation("CoCO3 + HCl -> CoCl2 + H2O + CO2")).toBe("CoCO3 + 2HCl -> CoCl2 + H2O + CO2");
    });
    it("procedural case 286: Cu(OH)2 with HI", function(){
        expect(balanceEquation("Cu(OH)2 + HI -> CuI2 + H2O")).toBe("Cu(OH)2 + 2HI -> CuI2 + 2H2O");
    });
    it("procedural case 287: CaCO3 with H3PO4", function(){
        expect(balanceEquation("CaCO3 + H3PO4 -> Ca3(PO4)2 + H2O + CO2")).toBe("3CaCO3 + 2H3PO4 -> Ca3(PO4)2 + 3H2O + 3CO2");
    });
    it("procedural case 288: Ag2CO3 with HI", function(){
        expect(balanceEquation("Ag2CO3 + HI -> AgI + H2O + CO2")).toBe("Ag2CO3 + 2HI -> 2AgI + H2O + CO2");
    });
    it("procedural case 289: Mn(OH)2 with HCl", function(){
        expect(balanceEquation("Mn(OH)2 + HCl -> MnCl2 + H2O")).toBe("Mn(OH)2 + 2HCl -> MnCl2 + 2H2O");
    });
    it("procedural case 290: Cl2 with AlCl3", function(){
        expect(balanceEquation("Cl2 + AlCl3 -> AlCl3 + Cl32")).toBe("16Cl2 + AlCl3 -> AlCl3 + Cl32");
    });
    it("procedural case 291: Na2O with HF", function(){
        expect(balanceEquation("Na2O + HF -> NaF + H2O")).toBe("Na2O + 2HF -> 2NaF + H2O");
    });
    it("procedural case 292: Cs2C2O4 with HNO3", function(){
        expect(balanceEquation("Cs2C2O4 + HNO3 -> CsNO3 + H2C2O4")).toBe("Cs2C2O4 + 2HNO3 -> 2CsNO3 + H2C2O4");
    });
    it("procedural case 293: Cs2C2O4 with HI", function(){
        expect(balanceEquation("Cs2C2O4 + HI -> CsI + H2C2O4")).toBe("Cs2C2O4 + 2HI -> 2CsI + H2C2O4");
    });
    it("procedural case 294: AlCl3 with Rb2SO4", function(){
        expect(balanceEquation("AlCl3 + Rb2SO4 -> Al2(2SO4)3 + RbCl")).toBe("2AlCl3 + 3Rb2SO4 -> Al2(2SO4)3 + 6RbCl");
    });
    it("procedural case 295: MgCl2 with Fe2(SO4)3", function(){
        expect(balanceEquation("MgCl2 + Fe2(SO4)3 -> Mg2(SO4)3 + FeCl2")).toBe("2MgCl2 + Fe2(SO4)3 -> Mg2(SO4)3 + 2FeCl2");
    });
    it("procedural case 296: I2 with AlI3", function(){
        expect(balanceEquation("I2 + AlI3 -> AlI3 + I32")).toBe("16I2 + AlI3 -> AlI3 + I32");
    });
    it("procedural case 297: K2CO3 with HF", function(){
        expect(balanceEquation("K2CO3 + HF -> KF + H2O + CO2")).toBe("K2CO3 + 2HF -> 2KF + H2O + CO2");
    });
    it("procedural case 298: Al(NO2)3 with HF", function(){
        expect(balanceEquation("Al(NO2)3 + HF -> AlF3 + HNO2")).toBe("Al(NO2)3 + 3HF -> AlF3 + 3HNO2");
    });
    it("procedural case 299: Co(NO2)2 with HF", function(){
        expect(balanceEquation("Co(NO2)2 + HF -> CoF2 + HNO2")).toBe("Co(NO2)2 + 2HF -> CoF2 + 2HNO2");
    });
    it("procedural case 300: Cu(OH)2 with HF", function(){
        expect(balanceEquation("Cu(OH)2 + HF -> CuF2 + H2O")).toBe("Cu(OH)2 + 2HF -> CuF2 + 2H2O");
    });
    it("procedural case 301: Li2O with HBr", function(){
        expect(balanceEquation("Li2O + HBr -> LiBr + H2O")).toBe("Li2O + 2HBr -> 2LiBr + H2O");
    });
    it("procedural case 302: Ni(NO3)2 with AgCl", function(){
        expect(balanceEquation("Ni(NO3)2 + AgCl -> AgNO3 + NiCl2")).toBe("Ni(NO3)2 + 2AgCl -> 2AgNO3 + NiCl2");
    });
    it("procedural case 303: Ba(NO2)2 with HF", function(){
        expect(balanceEquation("Ba(NO2)2 + HF -> BaF2 + HNO2")).toBe("Ba(NO2)2 + 2HF -> BaF2 + 2HNO2");
    });
    it("procedural case 304: complete combustion of HCOOH", function(){
        expect(balanceEquation("HCOOH + O2 -> CO2 + H2O")).toBe("2HCOOH + O2 -> 2CO2 + 2H2O");
    });
    it("procedural case 305: Li2S with HCl", function(){
        expect(balanceEquation("Li2S + HCl -> LiCl + H2S")).toBe("Li2S + 2HCl -> 2LiCl + H2S");
    });
    it("procedural case 306: PbC2O4 with HF", function(){
        expect(balanceEquation("PbC2O4 + HF -> PbF2 + H2C2O4")).toBe("PbC2O4 + 2HF -> PbF2 + H2C2O4");
    });
    it("procedural case 307: ZnS with HCl", function(){
        expect(balanceEquation("ZnS + HCl -> ZnCl2 + H2S")).toBe("ZnS + 2HCl -> ZnCl2 + H2S");
    });
    it("procedural case 308: Ba(NO3)2 with AgCl", function(){
        expect(balanceEquation("Ba(NO3)2 + AgCl -> AgNO3 + BaCl2")).toBe("Ba(NO3)2 + 2AgCl -> 2AgNO3 + BaCl2");
    });
    it("procedural case 309: Mg(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Mg(NO3)2 + Na2SO4 -> NaNO3 + MgSO4")).toBe("Mg(NO3)2 + Na2SO4 -> 2NaNO3 + MgSO4");
    });
    it("procedural case 310: ZnC2O4 with HBr", function(){
        expect(balanceEquation("ZnC2O4 + HBr -> ZnBr2 + H2C2O4")).toBe("ZnC2O4 + 2HBr -> ZnBr2 + H2C2O4");
    });
    it("procedural case 311: Cl2 with CaCl2", function(){
        expect(balanceEquation("Cl2 + CaCl2 -> CaCl2 + Cl22")).toBe("11Cl2 + CaCl2 -> CaCl2 + Cl22");
    });
    it("procedural case 312: Ag2C2O4 with HCl", function(){
        expect(balanceEquation("Ag2C2O4 + HCl -> AgCl + H2C2O4")).toBe("Ag2C2O4 + 2HCl -> 2AgCl + H2C2O4");
    });
    it("procedural case 313: Sn(OH)2 with HCl", function(){
        expect(balanceEquation("Sn(OH)2 + HCl -> SnCl2 + H2O")).toBe("Sn(OH)2 + 2HCl -> SnCl2 + 2H2O");
    });
    it("procedural case 314: Na with HI", function(){
        expect(balanceEquation("Na + HI -> NaI + H2")).toBe("2Na + 2HI -> 2NaI + H2");
    });
    it("procedural case 315: Co with HI", function(){
        expect(balanceEquation("Co + HI -> CoI2 + H2")).toBe("Co + 2HI -> CoI2 + H2");
    });
    it("procedural case 316: Cr(NO2)3 with HCl", function(){
        expect(balanceEquation("Cr(NO2)3 + HCl -> CrCl3 + HNO2")).toBe("Cr(NO2)3 + 3HCl -> CrCl3 + 3HNO2");
    });
    it("procedural case 317: SnO with HBr", function(){
        expect(balanceEquation("SnO + HBr -> SnBr2 + H2O")).toBe("SnO + 2HBr -> SnBr2 + H2O");
    });
    it("procedural case 318: Sn with HCl", function(){
        expect(balanceEquation("Sn + HCl -> SnCl2 + H2")).toBe("Sn + 2HCl -> SnCl2 + H2");
    });
    it("procedural case 319: Ni(OH)2 with H2SO4", function(){
        expect(balanceEquation("Ni(OH)2 + H2SO4 -> NiSO4 + H2O")).toBe("Ni(OH)2 + H2SO4 -> NiSO4 + 2H2O");
    });
    it("procedural case 320: Li2C2O4 with HF", function(){
        expect(balanceEquation("Li2C2O4 + HF -> LiF + H2C2O4")).toBe("Li2C2O4 + 2HF -> 2LiF + H2C2O4");
    });
    it("procedural case 321: I2 with AlF3", function(){
        expect(balanceEquation("I2 + AlF3 -> AlI3 + F32")).toBe("48I2 + 32AlF3 -> 32AlI3 + 3F32");
    });
    it("procedural case 322: Cr with H2S", function(){
        expect(balanceEquation("Cr + H2S -> Cr2(S)3 + H2")).toBe("2Cr + 3H2S -> Cr2(S)3 + 3H2");
    });
    it("procedural case 323: NiCO3 with HF", function(){
        expect(balanceEquation("NiCO3 + HF -> NiF2 + H2O + CO2")).toBe("NiCO3 + 2HF -> NiF2 + H2O + CO2");
    });
    it("procedural case 324: CuO with HF", function(){
        expect(balanceEquation("CuO + HF -> CuF2 + H2O")).toBe("CuO + 2HF -> CuF2 + H2O");
    });
    it("procedural case 325: F2 with AlI3", function(){
        expect(balanceEquation("F2 + AlI3 -> AlF3 + I32")).toBe("48F2 + 32AlI3 -> 32AlF3 + 3I32");
    });
    it("procedural case 326: FeS with HI", function(){
        expect(balanceEquation("FeS + HI -> FeI2 + H2S")).toBe("FeS + 2HI -> FeI2 + H2S");
    });
    it("procedural case 327: Zn(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Zn(NO3)2 + Li2SO4 -> LiNO3 + ZnSO4")).toBe("Zn(NO3)2 + Li2SO4 -> 2LiNO3 + ZnSO4");
    });
    it("procedural case 328: Br2 with CaCl2", function(){
        expect(balanceEquation("Br2 + CaCl2 -> CaBr2 + Cl22")).toBe("11Br2 + 11CaCl2 -> 11CaBr2 + Cl22");
    });
    it("procedural case 329: Fe(OH)2 with HBr", function(){
        expect(balanceEquation("Fe(OH)2 + HBr -> FeBr2 + H2O")).toBe("Fe(OH)2 + 2HBr -> FeBr2 + 2H2O");
    });
    it("procedural case 330: CrCl3 with FeSO4", function(){
        expect(balanceEquation("CrCl3 + FeSO4 -> Cr2(SO4)3 + FeCl2")).toBe("2CrCl3 + 3FeSO4 -> Cr2(SO4)3 + 3FeCl2");
    });
    it("procedural case 331: MnO with H3PO4", function(){
        expect(balanceEquation("MnO + H3PO4 -> Mn3(PO4)2 + H2O")).toBe("3MnO + 2H3PO4 -> Mn3(PO4)2 + 3H2O");
    });
    it("procedural case 332: Cr2S3 with HCl", function(){
        expect(balanceEquation("Cr2S3 + HCl -> CrCl3 + H2S")).toBe("Cr2S3 + 6HCl -> 2CrCl3 + 3H2S");
    });
    it("procedural case 333: Zn(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Zn(NO3)2 + K2SO4 -> KNO3 + ZnSO4")).toBe("Zn(NO3)2 + K2SO4 -> 2KNO3 + ZnSO4");
    });
    it("procedural case 334: K2CO3 with HBr", function(){
        expect(balanceEquation("K2CO3 + HBr -> KBr + H2O + CO2")).toBe("K2CO3 + 2HBr -> 2KBr + H2O + CO2");
    });
    it("procedural case 335: Br2 with CaF2", function(){
        expect(balanceEquation("Br2 + CaF2 -> CaBr2 + F22")).toBe("11Br2 + 11CaF2 -> 11CaBr2 + F22");
    });
    it("procedural case 336: Cr with H3PO4", function(){
        expect(balanceEquation("Cr + H3PO4 -> CrPO4 + H2")).toBe("2Cr + 2H3PO4 -> 2CrPO4 + 3H2");
    });
    it("procedural case 337: Al2S3 with HCl", function(){
        expect(balanceEquation("Al2S3 + HCl -> AlCl3 + H2S")).toBe("Al2S3 + 6HCl -> 2AlCl3 + 3H2S");
    });
    it("procedural case 338: FeC2O4 with HCl", function(){
        expect(balanceEquation("FeC2O4 + HCl -> FeCl2 + H2C2O4")).toBe("FeC2O4 + 2HCl -> FeCl2 + H2C2O4");
    });
    it("procedural case 339: Rb with HI", function(){
        expect(balanceEquation("Rb + HI -> RbI + H2")).toBe("2Rb + 2HI -> 2RbI + H2");
    });
    it("procedural case 340: Ni(OH)2 with HF", function(){
        expect(balanceEquation("Ni(OH)2 + HF -> NiF2 + H2O")).toBe("Ni(OH)2 + 2HF -> NiF2 + 2H2O");
    });
    it("procedural case 341: CoCO3 with HBr", function(){
        expect(balanceEquation("CoCO3 + HBr -> CoBr2 + H2O + CO2")).toBe("CoCO3 + 2HBr -> CoBr2 + H2O + CO2");
    });
    it("procedural case 342: Ni(NO2)2 with HBr", function(){
        expect(balanceEquation("Ni(NO2)2 + HBr -> NiBr2 + HNO2")).toBe("Ni(NO2)2 + 2HBr -> NiBr2 + 2HNO2");
    });
    it("procedural case 343: ZnS with HBr", function(){
        expect(balanceEquation("ZnS + HBr -> ZnBr2 + H2S")).toBe("ZnS + 2HBr -> ZnBr2 + H2S");
    });
    it("procedural case 344: Na with H3PO4", function(){
        expect(balanceEquation("Na + H3PO4 -> Na(PO4)3 + H2")).toBe("2Na + 6H3PO4 -> 2Na(PO4)3 + 9H2");
    });
    it("procedural case 345: Ni(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Ni(NO2)2 + H2SO4 -> NiSO4 + HNO2")).toBe("Ni(NO2)2 + H2SO4 -> NiSO4 + 2HNO2");
    });
    it("procedural case 346: SrO with HI", function(){
        expect(balanceEquation("SrO + HI -> SrI2 + H2O")).toBe("SrO + 2HI -> SrI2 + H2O");
    });
    it("procedural case 347: Ag with HCl", function(){
        expect(balanceEquation("Ag + HCl -> AgCl + H2")).toBe("2Ag + 2HCl -> 2AgCl + H2");
    });
    it("procedural case 348: Zn(NO2)2 with HBr", function(){
        expect(balanceEquation("Zn(NO2)2 + HBr -> ZnBr2 + HNO2")).toBe("Zn(NO2)2 + 2HBr -> ZnBr2 + 2HNO2");
    });
    it("procedural case 349: Zn(OH)2 with H2SO4", function(){
        expect(balanceEquation("Zn(OH)2 + H2SO4 -> ZnSO4 + H2O")).toBe("Zn(OH)2 + H2SO4 -> ZnSO4 + 2H2O");
    });
    it("procedural case 350: Ni(NO2)2 with HI", function(){
        expect(balanceEquation("Ni(NO2)2 + HI -> NiI2 + HNO2")).toBe("Ni(NO2)2 + 2HI -> NiI2 + 2HNO2");
    });
    it("procedural case 351: ZnS with HF", function(){
        expect(balanceEquation("ZnS + HF -> ZnF2 + H2S")).toBe("ZnS + 2HF -> ZnF2 + H2S");
    });
    it("procedural case 352: Zn(OH)2 with H2S", function(){
        expect(balanceEquation("Zn(OH)2 + H2S -> ZnS + H2O")).toBe("Zn(OH)2 + H2S -> ZnS + 2H2O");
    });
    it("procedural case 353: NiC2O4 with HBr", function(){
        expect(balanceEquation("NiC2O4 + HBr -> NiBr2 + H2C2O4")).toBe("NiC2O4 + 2HBr -> NiBr2 + H2C2O4");
    });
    it("procedural case 354: Na2C2O4 with HF", function(){
        expect(balanceEquation("Na2C2O4 + HF -> NaF + H2C2O4")).toBe("Na2C2O4 + 2HF -> 2NaF + H2C2O4");
    });
    it("procedural case 355: CuCO3 with HI", function(){
        expect(balanceEquation("CuCO3 + HI -> CuI2 + H2O + CO2")).toBe("CuCO3 + 2HI -> CuI2 + H2O + CO2");
    });
    it("procedural case 356: MgCO3 with H3PO4", function(){
        expect(balanceEquation("MgCO3 + H3PO4 -> Mg3(PO4)2 + H2O + CO2")).toBe("3MgCO3 + 2H3PO4 -> Mg3(PO4)2 + 3H2O + 3CO2");
    });
    it("procedural case 357: CrCl3 with CoSO4", function(){
        expect(balanceEquation("CrCl3 + CoSO4 -> Cr2(SO4)3 + CoCl2")).toBe("2CrCl3 + 3CoSO4 -> Cr2(SO4)3 + 3CoCl2");
    });
    it("procedural case 358: Al(OH)3 with H2S", function(){
        expect(balanceEquation("Al(OH)3 + H2S -> Al2(S)3 + H2O")).toBe("2Al(OH)3 + 3H2S -> Al2(S)3 + 6H2O");
    });
    it("procedural case 359: Cu(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Cu(NO2)2 + H2SO4 -> CuSO4 + HNO2")).toBe("Cu(NO2)2 + H2SO4 -> CuSO4 + 2HNO2");
    });
    it("procedural case 360: MnCO3 with HF", function(){
        expect(balanceEquation("MnCO3 + HF -> MnF2 + H2O + CO2")).toBe("MnCO3 + 2HF -> MnF2 + H2O + CO2");
    });
    it("procedural case 361: Zn with HF", function(){
        expect(balanceEquation("Zn + HF -> ZnF2 + H2")).toBe("Zn + 2HF -> ZnF2 + H2");
    });
    it("procedural case 362: Zn(NO3)2 with NaCl", function(){
        expect(balanceEquation("Zn(NO3)2 + NaCl -> NaNO3 + ZnCl2")).toBe("Zn(NO3)2 + 2NaCl -> 2NaNO3 + ZnCl2");
    });
    it("procedural case 363: NiO with HF", function(){
        expect(balanceEquation("NiO + HF -> NiF2 + H2O")).toBe("NiO + 2HF -> NiF2 + H2O");
    });
    it("procedural case 364: Fe(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Fe(NO3)2 + Na2SO4 -> NaNO3 + FeSO4")).toBe("Fe(NO3)2 + Na2SO4 -> 2NaNO3 + FeSO4");
    });
    it("procedural case 365: Ni with HF", function(){
        expect(balanceEquation("Ni + HF -> NiF2 + H2")).toBe("Ni + 2HF -> NiF2 + H2");
    });
    it("procedural case 366: PbC2O4 with HCl", function(){
        expect(balanceEquation("PbC2O4 + HCl -> PbCl2 + H2C2O4")).toBe("PbC2O4 + 2HCl -> PbCl2 + H2C2O4");
    });
    it("procedural case 367: Na2S with HF", function(){
        expect(balanceEquation("Na2S + HF -> NaF + H2S")).toBe("Na2S + 2HF -> 2NaF + H2S");
    });
    it("procedural case 368: Al(NO3)3 with Li2SO4", function(){
        expect(balanceEquation("Al(NO3)3 + Li2SO4 -> LiNO3 + Al2(SO4)3")).toBe("2Al(NO3)3 + 3Li2SO4 -> 6LiNO3 + Al2(SO4)3");
    });
    it("procedural case 369: PbO with HBr", function(){
        expect(balanceEquation("PbO + HBr -> PbBr2 + H2O")).toBe("PbO + 2HBr -> PbBr2 + H2O");
    });
    it("procedural case 370: SrO with HCl", function(){
        expect(balanceEquation("SrO + HCl -> SrCl2 + H2O")).toBe("SrO + 2HCl -> SrCl2 + H2O");
    });
    it("procedural case 371: Ca(OH)2 with H2S", function(){
        expect(balanceEquation("Ca(OH)2 + H2S -> CaS + H2O")).toBe("Ca(OH)2 + H2S -> CaS + 2H2O");
    });
    it("procedural case 372: BaC2O4 with HBr", function(){
        expect(balanceEquation("BaC2O4 + HBr -> BaBr2 + H2C2O4")).toBe("BaC2O4 + 2HBr -> BaBr2 + H2C2O4");
    });
    it("procedural case 373: Fe(OH)2 with H2S", function(){
        expect(balanceEquation("Fe(OH)2 + H2S -> FeS + H2O")).toBe("Fe(OH)2 + H2S -> FeS + 2H2O");
    });
    it("procedural case 374: Ag2C2O4 with HNO3", function(){
        expect(balanceEquation("Ag2C2O4 + HNO3 -> AgNO3 + H2C2O4")).toBe("Ag2C2O4 + 2HNO3 -> 2AgNO3 + H2C2O4");
    });
    it("procedural case 375: Sn(NO2)2 with HI", function(){
        expect(balanceEquation("Sn(NO2)2 + HI -> SnI2 + HNO2")).toBe("Sn(NO2)2 + 2HI -> SnI2 + 2HNO2");
    });
    it("procedural case 376: K3PO4 with AgNO3", function(){
        expect(balanceEquation("K3PO4 + AgNO3 -> Ag3PO4 + KNO3")).toBe("K3PO4 + 3AgNO3 -> Ag3PO4 + 3KNO3");
    });
    it("procedural case 377: CuS with HBr", function(){
        expect(balanceEquation("CuS + HBr -> CuBr2 + H2S")).toBe("CuS + 2HBr -> CuBr2 + H2S");
    });
    it("procedural case 378: K2O with HBr", function(){
        expect(balanceEquation("K2O + HBr -> KBr + H2O")).toBe("K2O + 2HBr -> 2KBr + H2O");
    });
    it("procedural case 379: CrCl3 with ZnSO4", function(){
        expect(balanceEquation("CrCl3 + ZnSO4 -> Cr2(SO4)3 + ZnCl2")).toBe("2CrCl3 + 3ZnSO4 -> Cr2(SO4)3 + 3ZnCl2");
    });
    it("procedural case 380: Ca(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Ca(NO3)2 + Li2SO4 -> LiNO3 + CaSO4")).toBe("Ca(NO3)2 + Li2SO4 -> 2LiNO3 + CaSO4");
    });
    it("procedural case 381: Al2S3 with HBr", function(){
        expect(balanceEquation("Al2S3 + HBr -> AlBr3 + H2S")).toBe("Al2S3 + 6HBr -> 2AlBr3 + 3H2S");
    });
    it("procedural case 382: Rb2CO3 with HBr", function(){
        expect(balanceEquation("Rb2CO3 + HBr -> RbBr + H2O + CO2")).toBe("Rb2CO3 + 2HBr -> 2RbBr + H2O + CO2");
    });
    it("procedural case 383: Fe(NO3)2 with AgCl", function(){
        expect(balanceEquation("Fe(NO3)2 + AgCl -> AgNO3 + FeCl2")).toBe("Fe(NO3)2 + 2AgCl -> 2AgNO3 + FeCl2");
    });
    it("procedural case 384: BaCO3 with H3PO4", function(){
        expect(balanceEquation("BaCO3 + H3PO4 -> Ba3(PO4)2 + H2O + CO2")).toBe("3BaCO3 + 2H3PO4 -> Ba3(PO4)2 + 3H2O + 3CO2");
    });
    it("procedural case 385: Al(OH)3 with HI", function(){
        expect(balanceEquation("Al(OH)3 + HI -> AlI3 + H2O")).toBe("Al(OH)3 + 3HI -> AlI3 + 3H2O");
    });
    it("procedural case 386: Zn(OH)2 with HF", function(){
        expect(balanceEquation("Zn(OH)2 + HF -> ZnF2 + H2O")).toBe("Zn(OH)2 + 2HF -> ZnF2 + 2H2O");
    });
    it("procedural case 387: Ni(OH)2 with HCl", function(){
        expect(balanceEquation("Ni(OH)2 + HCl -> NiCl2 + H2O")).toBe("Ni(OH)2 + 2HCl -> NiCl2 + 2H2O");
    });
    it("procedural case 388: Li2C2O4 with HI", function(){
        expect(balanceEquation("Li2C2O4 + HI -> LiI + H2C2O4")).toBe("Li2C2O4 + 2HI -> 2LiI + H2C2O4");
    });
    it("procedural case 389: Ba(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Ba(NO3)2 + Rb2SO4 -> RbNO3 + BaSO4")).toBe("Ba(NO3)2 + Rb2SO4 -> 2RbNO3 + BaSO4");
    });
    it("procedural case 390: CaO with HCl", function(){
        expect(balanceEquation("CaO + HCl -> CaCl2 + H2O")).toBe("CaO + 2HCl -> CaCl2 + H2O");
    });
    it("procedural case 391: Br2 with KCl", function(){
        expect(balanceEquation("Br2 + KCl -> KBr + Cl2")).toBe("Br2 + 2KCl -> 2KBr + Cl2");
    });
    it("procedural case 392: AlCl3 with PbSO4", function(){
        expect(balanceEquation("AlCl3 + PbSO4 -> Al2(SO4)3 + PbCl2")).toBe("2AlCl3 + 3PbSO4 -> Al2(SO4)3 + 3PbCl2");
    });
    it("procedural case 393: F2 with AlF3", function(){
        expect(balanceEquation("F2 + AlF3 -> AlF3 + F32")).toBe("16F2 + AlF3 -> AlF3 + F32");
    });
    it("procedural case 394: Al2O3 with HCl", function(){
        expect(balanceEquation("Al2O3 + HCl -> AlCl3 + H2O")).toBe("Al2O3 + 6HCl -> 2AlCl3 + 3H2O");
    });
    it("procedural case 395: Ag2O with HCl", function(){
        expect(balanceEquation("Ag2O + HCl -> AgCl + H2O")).toBe("Ag2O + 2HCl -> 2AgCl + H2O");
    });
    it("procedural case 396: Fe(OH)2 with HF", function(){
        expect(balanceEquation("Fe(OH)2 + HF -> FeF2 + H2O")).toBe("Fe(OH)2 + 2HF -> FeF2 + 2H2O");
    });
    it("procedural case 397: Na with HNO3", function(){
        expect(balanceEquation("Na + HNO3 -> NaNO3 + H2")).toBe("2Na + 2HNO3 -> 2NaNO3 + H2");
    });
    it("procedural case 398: Li2CO3 with HF", function(){
        expect(balanceEquation("Li2CO3 + HF -> LiF + H2O + CO2")).toBe("Li2CO3 + 2HF -> 2LiF + H2O + CO2");
    });
    it("procedural case 399: Ag2CO3 with HBr", function(){
        expect(balanceEquation("Ag2CO3 + HBr -> AgBr + H2O + CO2")).toBe("Ag2CO3 + 2HBr -> 2AgBr + H2O + CO2");
    });
    it("procedural case 400: Ca(OH)2 with H2CO3", function(){
        expect(balanceEquation("Ca(OH)2 + H2CO3 -> CaCO3 + H2O")).toBe("Ca(OH)2 + H2CO3 -> CaCO3 + 2H2O");
    });
    it("procedural case 401: Mg with HBr", function(){
        expect(balanceEquation("Mg + HBr -> MgBr2 + H2")).toBe("Mg + 2HBr -> MgBr2 + H2");
    });
    it("procedural case 402: AlCl3 with SnSO4", function(){
        expect(balanceEquation("AlCl3 + SnSO4 -> Al2(SO4)3 + SnCl2")).toBe("2AlCl3 + 3SnSO4 -> Al2(SO4)3 + 3SnCl2");
    });
    it("procedural case 403: K with HF", function(){
        expect(balanceEquation("K + HF -> KF + H2")).toBe("2K + 2HF -> 2KF + H2");
    });
    it("procedural case 404: I2 with NaBr", function(){
        expect(balanceEquation("I2 + NaBr -> NaI + Br2")).toBe("I2 + 2NaBr -> 2NaI + Br2");
    });
    it("procedural case 405: F2 with CaF2", function(){
        expect(balanceEquation("F2 + CaF2 -> CaF2 + F22")).toBe("11F2 + CaF2 -> CaF2 + F22");
    });
    it("procedural case 406: Pb with HCl", function(){
        expect(balanceEquation("Pb + HCl -> PbCl2 + H2")).toBe("Pb + 2HCl -> PbCl2 + H2");
    });
    it("procedural case 407: CoO with H3PO4", function(){
        expect(balanceEquation("CoO + H3PO4 -> Co3(PO4)2 + H2O")).toBe("3CoO + 2H3PO4 -> Co3(PO4)2 + 3H2O");
    });
    it("procedural case 408: Rb2CO3 with HC2H3O2", function(){
        expect(balanceEquation("Rb2CO3 + HC2H3O2 -> RbC2H3O2 + H2O + CO2")).toBe("Rb2CO3 + 2HC2H3O2 -> 2RbC2H3O2 + H2O + CO2");
    });
    it("procedural case 409: Ba(NO3)2 with RbCl", function(){
        expect(balanceEquation("Ba(NO3)2 + RbCl -> RbNO3 + BaCl2")).toBe("Ba(NO3)2 + 2RbCl -> 2RbNO3 + BaCl2");
    });
    it("procedural case 410: Mg with HF", function(){
        expect(balanceEquation("Mg + HF -> MgF2 + H2")).toBe("Mg + 2HF -> MgF2 + H2");
    });
    it("procedural case 411: SrC2O4 with HF", function(){
        expect(balanceEquation("SrC2O4 + HF -> SrF2 + H2C2O4")).toBe("SrC2O4 + 2HF -> SrF2 + H2C2O4");
    });
    it("procedural case 412: CaC2O4 with HBr", function(){
        expect(balanceEquation("CaC2O4 + HBr -> CaBr2 + H2C2O4")).toBe("CaC2O4 + 2HBr -> CaBr2 + H2C2O4");
    });
    it("procedural case 413: MgO with HF", function(){
        expect(balanceEquation("MgO + HF -> MgF2 + H2O")).toBe("MgO + 2HF -> MgF2 + H2O");
    });
    it("procedural case 414: K2SO4 with AgNO3", function(){
        expect(balanceEquation("K2SO4 + AgNO3 -> Ag2SO4 + KNO3")).toBe("K2SO4 + 2AgNO3 -> Ag2SO4 + 2KNO3");
    });
    it("procedural case 415: Mg(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Mg(NO2)2 + H2SO4 -> MgSO4 + HNO2")).toBe("Mg(NO2)2 + H2SO4 -> MgSO4 + 2HNO2");
    });
    it("procedural case 416: F2 with AlBr3", function(){
        expect(balanceEquation("F2 + AlBr3 -> AlF3 + Br32")).toBe("48F2 + 32AlBr3 -> 32AlF3 + 3Br32");
    });
    it("procedural case 417: Ni(NO3)2 with RbCl", function(){
        expect(balanceEquation("Ni(NO3)2 + RbCl -> RbNO3 + NiCl2")).toBe("Ni(NO3)2 + 2RbCl -> 2RbNO3 + NiCl2");
    });
    it("procedural case 418: Cr with HI", function(){
        expect(balanceEquation("Cr + HI -> CrI3 + H2")).toBe("2Cr + 6HI -> 2CrI3 + 3H2");
    });
    it("procedural case 419: Ca(NO2)2 with HF", function(){
        expect(balanceEquation("Ca(NO2)2 + HF -> CaF2 + HNO2")).toBe("Ca(NO2)2 + 2HF -> CaF2 + 2HNO2");
    });
    it("procedural case 420: ZnCO3 with HF", function(){
        expect(balanceEquation("ZnCO3 + HF -> ZnF2 + H2O + CO2")).toBe("ZnCO3 + 2HF -> ZnF2 + H2O + CO2");
    });
    it("procedural case 421: Ca(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Ca(NO3)2 + Na2SO4 -> NaNO3 + CaSO4")).toBe("Ca(NO3)2 + Na2SO4 -> 2NaNO3 + CaSO4");
    });
    it("procedural case 422: I2 with KBr", function(){
        expect(balanceEquation("I2 + KBr -> KI + Br2")).toBe("I2 + 2KBr -> 2KI + Br2");
    });
    it("procedural case 423: Fe(OH)2 with HCl", function(){
        expect(balanceEquation("Fe(OH)2 + HCl -> FeCl2 + H2O")).toBe("Fe(OH)2 + 2HCl -> FeCl2 + 2H2O");
    });
    it("procedural case 424: Zn(OH)2 with HI", function(){
        expect(balanceEquation("Zn(OH)2 + HI -> ZnI2 + H2O")).toBe("Zn(OH)2 + 2HI -> ZnI2 + 2H2O");
    });
    it("procedural case 425: Cr2O3 with HBr", function(){
        expect(balanceEquation("Cr2O3 + HBr -> CrBr3 + H2O")).toBe("Cr2O3 + 6HBr -> 2CrBr3 + 3H2O");
    });
    it("procedural case 426: Ag2CO3 with HF", function(){
        expect(balanceEquation("Ag2CO3 + HF -> AgF + H2O + CO2")).toBe("Ag2CO3 + 2HF -> 2AgF + H2O + CO2");
    });
    it("procedural case 427: BaS with HCl", function(){
        expect(balanceEquation("BaS + HCl -> BaCl2 + H2S")).toBe("BaS + 2HCl -> BaCl2 + H2S");
    });
    it("procedural case 428: Mn with HCl", function(){
        expect(balanceEquation("Mn + HCl -> MnCl2 + H2")).toBe("Mn + 2HCl -> MnCl2 + H2");
    });
    it("procedural case 429: Cr(NO2)3 with HF", function(){
        expect(balanceEquation("Cr(NO2)3 + HF -> CrF3 + HNO2")).toBe("Cr(NO2)3 + 3HF -> CrF3 + 3HNO2");
    });
    it("procedural case 430: Mg with H3PO4", function(){
        expect(balanceEquation("Mg + H3PO4 -> Mg3(PO4)2 + H2")).toBe("3Mg + 2H3PO4 -> Mg3(PO4)2 + 3H2");
    });
    it("procedural case 431: Pb(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Pb(NO3)2 + Li2SO4 -> LiNO3 + PbSO4")).toBe("Pb(NO3)2 + Li2SO4 -> 2LiNO3 + PbSO4");
    });
    it("procedural case 432: synthesis of hydrogen iodide", function(){
        expect(balanceEquation("H2 + I2 -> HI")).toBe("H2 + I2 -> 2HI");
    });
    it("procedural case 433: Sn(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Sn(NO3)2 + K2SO4 -> KNO3 + SnSO4")).toBe("Sn(NO3)2 + K2SO4 -> 2KNO3 + SnSO4");
    });
    it("procedural case 434: Cs2CO3 with HBr", function(){
        expect(balanceEquation("Cs2CO3 + HBr -> CsBr + H2O + CO2")).toBe("Cs2CO3 + 2HBr -> 2CsBr + H2O + CO2");
    });
    it("procedural case 435: CaC2O4 with HF", function(){
        expect(balanceEquation("CaC2O4 + HF -> CaF2 + H2C2O4")).toBe("CaC2O4 + 2HF -> CaF2 + H2C2O4");
    });
    it("procedural case 436: SrS with HCl", function(){
        expect(balanceEquation("SrS + HCl -> SrCl2 + H2S")).toBe("SrS + 2HCl -> SrCl2 + H2S");
    });
    it("procedural case 437: PbC2O4 with HI", function(){
        expect(balanceEquation("PbC2O4 + HI -> PbI2 + H2C2O4")).toBe("PbC2O4 + 2HI -> PbI2 + H2C2O4");
    });
    it("procedural case 438: Ca with H3PO4", function(){
        expect(balanceEquation("Ca + H3PO4 -> Ca3(PO4)2 + H2")).toBe("3Ca + 2H3PO4 -> Ca3(PO4)2 + 3H2");
    });
    it("procedural case 439: Fe(OH)2 with H3PO4", function(){
        expect(balanceEquation("Fe(OH)2 + H3PO4 -> Fe3(PO4)2 + H2O")).toBe("3Fe(OH)2 + 2H3PO4 -> Fe3(PO4)2 + 6H2O");
    });
    it("procedural case 440: Cr(NO3)3 with RbCl", function(){
        expect(balanceEquation("Cr(NO3)3 + RbCl -> RbNO3 + CrCl3")).toBe("Cr(NO3)3 + 3RbCl -> 3RbNO3 + CrCl3");
    });
    it("procedural case 441: CuS with HI", function(){
        expect(balanceEquation("CuS + HI -> CuI2 + H2S")).toBe("CuS + 2HI -> CuI2 + H2S");
    });
    it("procedural case 442: Li2C2O4 with HNO3", function(){
        expect(balanceEquation("Li2C2O4 + HNO3 -> LiNO3 + H2C2O4")).toBe("Li2C2O4 + 2HNO3 -> 2LiNO3 + H2C2O4");
    });
    it("procedural case 443: Cr2O3 with H3PO4", function(){
        expect(balanceEquation("Cr2O3 + H3PO4 -> CrPO4 + H2O")).toBe("Cr2O3 + 2H3PO4 -> 2CrPO4 + 3H2O");
    });
    it("procedural case 444: SnC2O4 with HBr", function(){
        expect(balanceEquation("SnC2O4 + HBr -> SnBr2 + H2C2O4")).toBe("SnC2O4 + 2HBr -> SnBr2 + H2C2O4");
    });
    it("procedural case 445: Mn(NO2)2 with HBr", function(){
        expect(balanceEquation("Mn(NO2)2 + HBr -> MnBr2 + HNO2")).toBe("Mn(NO2)2 + 2HBr -> MnBr2 + 2HNO2");
    });
    it("procedural case 446: Ca(NO3)2 with NaCl", function(){
        expect(balanceEquation("Ca(NO3)2 + NaCl -> NaNO3 + CaCl2")).toBe("Ca(NO3)2 + 2NaCl -> 2NaNO3 + CaCl2");
    });
    it("procedural case 447: SrS with HI", function(){
        expect(balanceEquation("SrS + HI -> SrI2 + H2S")).toBe("SrS + 2HI -> SrI2 + H2S");
    });
    it("procedural case 448: I2 with NaCl", function(){
        expect(balanceEquation("I2 + NaCl -> NaI + Cl2")).toBe("I2 + 2NaCl -> 2NaI + Cl2");
    });
    it("procedural case 449: MnCO3 with HI", function(){
        expect(balanceEquation("MnCO3 + HI -> MnI2 + H2O + CO2")).toBe("MnCO3 + 2HI -> MnI2 + H2O + CO2");
    });
    it("procedural case 450: ZnC2O4 with HCl", function(){
        expect(balanceEquation("ZnC2O4 + HCl -> ZnCl2 + H2C2O4")).toBe("ZnC2O4 + 2HCl -> ZnCl2 + H2C2O4");
    });
    it("procedural case 451: Ba(NO2)2 with HI", function(){
        expect(balanceEquation("Ba(NO2)2 + HI -> BaI2 + HNO2")).toBe("Ba(NO2)2 + 2HI -> BaI2 + 2HNO2");
    });
    it("procedural case 452: Ni(NO2)2 with HF", function(){
        expect(balanceEquation("Ni(NO2)2 + HF -> NiF2 + HNO2")).toBe("Ni(NO2)2 + 2HF -> NiF2 + 2HNO2");
    });
    it("procedural case 453: SrCl2 with Fe2(SO4)3", function(){
        expect(balanceEquation("SrCl2 + Fe2(SO4)3 -> Sr2(SO4)3 + FeCl2")).toBe("2SrCl2 + Fe2(SO4)3 -> Sr2(SO4)3 + 2FeCl2");
    });
    it("procedural case 454: K with H2CO3", function(){
        expect(balanceEquation("K + H2CO3 -> K(CO3)2 + H2")).toBe("K + 2H2CO3 -> K(CO3)2 + 2H2");
    });
    it("procedural case 455: SrO with H3PO4", function(){
        expect(balanceEquation("SrO + H3PO4 -> Sr3(PO4)2 + H2O")).toBe("3SrO + 2H3PO4 -> Sr3(PO4)2 + 3H2O");
    });
    it("procedural case 456: Cr2(C2O4)3 with HI", function(){
        expect(balanceEquation("Cr2(C2O4)3 + HI -> CrI3 + H2C2O4")).toBe("Cr2(C2O4)3 + 6HI -> 2CrI3 + 3H2C2O4");
    });
    it("procedural case 457: Mn(NO3)2 with RbCl", function(){
        expect(balanceEquation("Mn(NO3)2 + RbCl -> RbNO3 + MnCl2")).toBe("Mn(NO3)2 + 2RbCl -> 2RbNO3 + MnCl2");
    });
    it("procedural case 458: Cu(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Cu(NO3)2 + Li2SO4 -> LiNO3 + CuSO4")).toBe("Cu(NO3)2 + Li2SO4 -> 2LiNO3 + CuSO4");
    });
    it("procedural case 459: Mg(OH)2 with H2CO3", function(){
        expect(balanceEquation("Mg(OH)2 + H2CO3 -> MgCO3 + H2O")).toBe("Mg(OH)2 + H2CO3 -> MgCO3 + 2H2O");
    });
    it("procedural case 460: MnC2O4 with HI", function(){
        expect(balanceEquation("MnC2O4 + HI -> MnI2 + H2C2O4")).toBe("MnC2O4 + 2HI -> MnI2 + H2C2O4");
    });
    it("procedural case 461: Cl2 with MgI2", function(){
        expect(balanceEquation("Cl2 + MgI2 -> MgCl2 + I22")).toBe("11Cl2 + 11MgI2 -> 11MgCl2 + I22");
    });
    it("procedural case 462: Ag2O with HC2H3O2", function(){
        expect(balanceEquation("Ag2O + HC2H3O2 -> AgC2H3O2 + H2O")).toBe("Ag2O + 2HC2H3O2 -> 2AgC2H3O2 + H2O");
    });
    it("procedural case 463: Na with H2S", function(){
        expect(balanceEquation("Na + H2S -> Na(S)2 + H2")).toBe("Na + 2H2S -> Na(S)2 + 2H2");
    });
    it("procedural case 464: Li2O with HC2H3O2", function(){
        expect(balanceEquation("Li2O + HC2H3O2 -> LiC2H3O2 + H2O")).toBe("Li2O + 2HC2H3O2 -> 2LiC2H3O2 + H2O");
    });
    it("procedural case 465: F2 with CaCl2", function(){
        expect(balanceEquation("F2 + CaCl2 -> CaF2 + Cl22")).toBe("11F2 + 11CaCl2 -> 11CaF2 + Cl22");
    });
    it("procedural case 466: F2 with KI", function(){
        expect(balanceEquation("F2 + KI -> KF + I2")).toBe("F2 + 2KI -> 2KF + I2");
    });
    it("procedural case 467: Pb(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Pb(NO2)2 + H2SO4 -> PbSO4 + HNO2")).toBe("Pb(NO2)2 + H2SO4 -> PbSO4 + 2HNO2");
    });
    it("procedural case 468: BaCl2 with Fe2(SO4)3", function(){
        expect(balanceEquation("BaCl2 + Fe2(SO4)3 -> Ba2(SO4)3 + FeCl2")).toBe("2BaCl2 + Fe2(SO4)3 -> Ba2(SO4)3 + 2FeCl2");
    });
    it("procedural case 469: Li with H2CO3", function(){
        expect(balanceEquation("Li + H2CO3 -> Li(CO3)2 + H2")).toBe("Li + 2H2CO3 -> Li(CO3)2 + 2H2");
    });
    it("procedural case 470: Sn(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Sn(NO3)2 + Li2SO4 -> LiNO3 + SnSO4")).toBe("Sn(NO3)2 + Li2SO4 -> 2LiNO3 + SnSO4");
    });
    it("procedural case 471: Fe with HCl", function(){
        expect(balanceEquation("Fe + HCl -> FeCl2 + H2")).toBe("Fe + 2HCl -> FeCl2 + H2");
    });
    it("procedural case 472: Ni(NO3)2 with LiCl", function(){
        expect(balanceEquation("Ni(NO3)2 + LiCl -> LiNO3 + NiCl2")).toBe("Ni(NO3)2 + 2LiCl -> 2LiNO3 + NiCl2");
    });
    it("procedural case 473: FeCO3 with HCl", function(){
        expect(balanceEquation("FeCO3 + HCl -> FeCl2 + H2O + CO2")).toBe("FeCO3 + 2HCl -> FeCl2 + H2O + CO2");
    });
    it("procedural case 474: MgS with HI", function(){
        expect(balanceEquation("MgS + HI -> MgI2 + H2S")).toBe("MgS + 2HI -> MgI2 + H2S");
    });
    it("procedural case 475: Rb with HCl", function(){
        expect(balanceEquation("Rb + HCl -> RbCl + H2")).toBe("2Rb + 2HCl -> 2RbCl + H2");
    });
    it("procedural case 476: Mn(NO2)2 with HI", function(){
        expect(balanceEquation("Mn(NO2)2 + HI -> MnI2 + HNO2")).toBe("Mn(NO2)2 + 2HI -> MnI2 + 2HNO2");
    });
    it("procedural case 477: Ca with HCl", function(){
        expect(balanceEquation("Ca + HCl -> CaCl2 + H2")).toBe("Ca + 2HCl -> CaCl2 + H2");
    });
    it("procedural case 478: Mg(OH)2 with H3PO4", function(){
        expect(balanceEquation("Mg(OH)2 + H3PO4 -> Mg3(PO4)2 + H2O")).toBe("3Mg(OH)2 + 2H3PO4 -> Mg3(PO4)2 + 6H2O");
    });
    it("procedural case 479: Pb(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Pb(NO3)2 + Na2SO4 -> NaNO3 + PbSO4")).toBe("Pb(NO3)2 + Na2SO4 -> 2NaNO3 + PbSO4");
    });
    it("procedural case 480: Sr with HF", function(){
        expect(balanceEquation("Sr + HF -> SrF2 + H2")).toBe("Sr + 2HF -> SrF2 + H2");
    });
    it("procedural case 481: Li2CO3 with HI", function(){
        expect(balanceEquation("Li2CO3 + HI -> LiI + H2O + CO2")).toBe("Li2CO3 + 2HI -> 2LiI + H2O + CO2");
    });
    it("procedural case 482: Br2 with NaF", function(){
        expect(balanceEquation("Br2 + NaF -> NaBr + F2")).toBe("Br2 + 2NaF -> 2NaBr + F2");
    });
    it("procedural case 483: Na with HC2H3O2", function(){
        expect(balanceEquation("Na + HC2H3O2 -> NaC2H3O2 + H2")).toBe("2Na + 2HC2H3O2 -> 2NaC2H3O2 + H2");
    });
    it("procedural case 484: Mg(NO2)2 with HF", function(){
        expect(balanceEquation("Mg(NO2)2 + HF -> MgF2 + HNO2")).toBe("Mg(NO2)2 + 2HF -> MgF2 + 2HNO2");
    });
    it("procedural case 485: CuCO3 with H3PO4", function(){
        expect(balanceEquation("CuCO3 + H3PO4 -> Cu3(PO4)2 + H2O + CO2")).toBe("3CuCO3 + 2H3PO4 -> Cu3(PO4)2 + 3H2O + 3CO2");
    });
    it("procedural case 486: Al2O3 with H3PO4", function(){
        expect(balanceEquation("Al2O3 + H3PO4 -> AlPO4 + H2O")).toBe("Al2O3 + 2H3PO4 -> 2AlPO4 + 3H2O");
    });
    it("procedural case 487: AlCl3 with SrSO4", function(){
        expect(balanceEquation("AlCl3 + SrSO4 -> Al2(SO4)3 + SrCl2")).toBe("2AlCl3 + 3SrSO4 -> Al2(SO4)3 + 3SrCl2");
    });
    it("procedural case 488: Zn(NO2)2 with HCl", function(){
        expect(balanceEquation("Zn(NO2)2 + HCl -> ZnCl2 + HNO2")).toBe("Zn(NO2)2 + 2HCl -> ZnCl2 + 2HNO2");
    });
    it("procedural case 489: CaS with HBr", function(){
        expect(balanceEquation("CaS + HBr -> CaBr2 + H2S")).toBe("CaS + 2HBr -> CaBr2 + H2S");
    });
    it("procedural case 490: Na2CO3 with AgNO3", function(){
        expect(balanceEquation("Na2CO3 + AgNO3 -> Ag2CO3 + NaNO3")).toBe("Na2CO3 + 2AgNO3 -> Ag2CO3 + 2NaNO3");
    });
    it("procedural case 491: Cr(NO3)3 with AgCl", function(){
        expect(balanceEquation("Cr(NO3)3 + AgCl -> AgNO3 + CrCl3")).toBe("Cr(NO3)3 + 3AgCl -> 3AgNO3 + CrCl3");
    });
    it("procedural case 492: F2 with NaBr", function(){
        expect(balanceEquation("F2 + NaBr -> NaF + Br2")).toBe("F2 + 2NaBr -> 2NaF + Br2");
    });
    it("procedural case 493: K2CO3 with HI", function(){
        expect(balanceEquation("K2CO3 + HI -> KI + H2O + CO2")).toBe("K2CO3 + 2HI -> 2KI + H2O + CO2");
    });
    it("procedural case 494: Co(NO2)2 with HCl", function(){
        expect(balanceEquation("Co(NO2)2 + HCl -> CoCl2 + HNO2")).toBe("Co(NO2)2 + 2HCl -> CoCl2 + 2HNO2");
    });
    it("procedural case 495: ZnCO3 with HCl", function(){
        expect(balanceEquation("ZnCO3 + HCl -> ZnCl2 + H2O + CO2")).toBe("ZnCO3 + 2HCl -> ZnCl2 + H2O + CO2");
    });
    it("procedural case 496: K2O with HF", function(){
        expect(balanceEquation("K2O + HF -> KF + H2O")).toBe("K2O + 2HF -> 2KF + H2O");
    });
    it("procedural case 497: NiO with HBr", function(){
        expect(balanceEquation("NiO + HBr -> NiBr2 + H2O")).toBe("NiO + 2HBr -> NiBr2 + H2O");
    });
    it("procedural case 498: MgS with HCl", function(){
        expect(balanceEquation("MgS + HCl -> MgCl2 + H2S")).toBe("MgS + 2HCl -> MgCl2 + H2S");
    });
    it("procedural case 499: Al2S3 with HI", function(){
        expect(balanceEquation("Al2S3 + HI -> AlI3 + H2S")).toBe("Al2S3 + 6HI -> 2AlI3 + 3H2S");
    });
    it("procedural case 500: Cr(NO3)3 with Na2SO4", function(){
        expect(balanceEquation("Cr(NO3)3 + Na2SO4 -> NaNO3 + Cr2(SO4)3")).toBe("2Cr(NO3)3 + 3Na2SO4 -> 6NaNO3 + Cr2(SO4)3");
    });
    it("procedural case 501: NiO with H3PO4", function(){
        expect(balanceEquation("NiO + H3PO4 -> Ni3(PO4)2 + H2O")).toBe("3NiO + 2H3PO4 -> Ni3(PO4)2 + 3H2O");
    });
    it("procedural case 502: SnC2O4 with HI", function(){
        expect(balanceEquation("SnC2O4 + HI -> SnI2 + H2C2O4")).toBe("SnC2O4 + 2HI -> SnI2 + H2C2O4");
    });
    it("procedural case 503: MnCO3 with H3PO4", function(){
        expect(balanceEquation("MnCO3 + H3PO4 -> Mn3(PO4)2 + H2O + CO2")).toBe("3MnCO3 + 2H3PO4 -> Mn3(PO4)2 + 3H2O + 3CO2");
    });
    it("procedural case 504: Na2S with HBr", function(){
        expect(balanceEquation("Na2S + HBr -> NaBr + H2S")).toBe("Na2S + 2HBr -> 2NaBr + H2S");
    });
    it("procedural case 505: MnO with HCl", function(){
        expect(balanceEquation("MnO + HCl -> MnCl2 + H2O")).toBe("MnO + 2HCl -> MnCl2 + H2O");
    });
    it("procedural case 506: Fe(NO3)2 with LiCl", function(){
        expect(balanceEquation("Fe(NO3)2 + LiCl -> LiNO3 + FeCl2")).toBe("Fe(NO3)2 + 2LiCl -> 2LiNO3 + FeCl2");
    });
    it("procedural case 507: complete combustion of C4H8", function(){
        expect(balanceEquation("C4H8 + O2 -> CO2 + H2O")).toBe("C4H8 + 6O2 -> 4CO2 + 4H2O");
    });
    it("procedural case 508: AlCl3 with CoSO4", function(){
        expect(balanceEquation("AlCl3 + CoSO4 -> Al2(SO4)3 + CoCl2")).toBe("2AlCl3 + 3CoSO4 -> Al2(SO4)3 + 3CoCl2");
    });
    it("procedural case 509: Ag with HC2H3O2", function(){
        expect(balanceEquation("Ag + HC2H3O2 -> AgC2H3O2 + H2")).toBe("2Ag + 2HC2H3O2 -> 2AgC2H3O2 + H2");
    });
    it("procedural case 510: Ag2C2O4 with HI", function(){
        expect(balanceEquation("Ag2C2O4 + HI -> AgI + H2C2O4")).toBe("Ag2C2O4 + 2HI -> 2AgI + H2C2O4");
    });
    it("procedural case 511: Na2CO3 with HF", function(){
        expect(balanceEquation("Na2CO3 + HF -> NaF + H2O + CO2")).toBe("Na2CO3 + 2HF -> 2NaF + H2O + CO2");
    });
    it("procedural case 512: Na with HF", function(){
        expect(balanceEquation("Na + HF -> NaF + H2")).toBe("2Na + 2HF -> 2NaF + H2");
    });
    it("procedural case 513: FeS with HBr", function(){
        expect(balanceEquation("FeS + HBr -> FeBr2 + H2S")).toBe("FeS + 2HBr -> FeBr2 + H2S");
    });
    it("procedural case 514: MnC2O4 with HF", function(){
        expect(balanceEquation("MnC2O4 + HF -> MnF2 + H2C2O4")).toBe("MnC2O4 + 2HF -> MnF2 + H2C2O4");
    });
    it("procedural case 515: SrCO3 with H3PO4", function(){
        expect(balanceEquation("SrCO3 + H3PO4 -> Sr3(PO4)2 + H2O + CO2")).toBe("3SrCO3 + 2H3PO4 -> Sr3(PO4)2 + 3H2O + 3CO2");
    });
    it("procedural case 516: Sn with HI", function(){
        expect(balanceEquation("Sn + HI -> SnI2 + H2")).toBe("Sn + 2HI -> SnI2 + H2");
    });
    it("procedural case 517: SrCO3 with HCl", function(){
        expect(balanceEquation("SrCO3 + HCl -> SrCl2 + H2O + CO2")).toBe("SrCO3 + 2HCl -> SrCl2 + H2O + CO2");
    });
    it("procedural case 518: I2 with AlCl3", function(){
        expect(balanceEquation("I2 + AlCl3 -> AlI3 + Cl32")).toBe("48I2 + 32AlCl3 -> 32AlI3 + 3Cl32");
    });
    it("procedural case 519: Rb2CO3 with HI", function(){
        expect(balanceEquation("Rb2CO3 + HI -> RbI + H2O + CO2")).toBe("Rb2CO3 + 2HI -> 2RbI + H2O + CO2");
    });
    it("procedural case 520: Al(NO3)3 with RbCl", function(){
        expect(balanceEquation("Al(NO3)3 + RbCl -> RbNO3 + AlCl3")).toBe("Al(NO3)3 + 3RbCl -> 3RbNO3 + AlCl3");
    });
    it("procedural case 521: FeC2O4 with HI", function(){
        expect(balanceEquation("FeC2O4 + HI -> FeI2 + H2C2O4")).toBe("FeC2O4 + 2HI -> FeI2 + H2C2O4");
    });
    it("procedural case 522: Al with HCl", function(){
        expect(balanceEquation("Al + HCl -> AlCl3 + H2")).toBe("2Al + 6HCl -> 2AlCl3 + 3H2");
    });
    it("procedural case 523: Li2S with HI", function(){
        expect(balanceEquation("Li2S + HI -> LiI + H2S")).toBe("Li2S + 2HI -> 2LiI + H2S");
    });
    it("procedural case 524: Mn with HF", function(){
        expect(balanceEquation("Mn + HF -> MnF2 + H2")).toBe("Mn + 2HF -> MnF2 + H2");
    });
    it("procedural case 525: CaO with HF", function(){
        expect(balanceEquation("CaO + HF -> CaF2 + H2O")).toBe("CaO + 2HF -> CaF2 + H2O");
    });
    it("procedural case 526: Na2CO3 with HC2H3O2", function(){
        expect(balanceEquation("Na2CO3 + HC2H3O2 -> NaC2H3O2 + H2O + CO2")).toBe("Na2CO3 + 2HC2H3O2 -> 2NaC2H3O2 + H2O + CO2");
    });
    it("procedural case 527: Fe(NO2)2 with HBr", function(){
        expect(balanceEquation("Fe(NO2)2 + HBr -> FeBr2 + HNO2")).toBe("Fe(NO2)2 + 2HBr -> FeBr2 + 2HNO2");
    });
    it("procedural case 528: Cu(OH)2 with HCl", function(){
        expect(balanceEquation("Cu(OH)2 + HCl -> CuCl2 + H2O")).toBe("Cu(OH)2 + 2HCl -> CuCl2 + 2H2O");
    });
    it("procedural case 529: F2 with NaCl", function(){
        expect(balanceEquation("F2 + NaCl -> NaF + Cl2")).toBe("F2 + 2NaCl -> 2NaF + Cl2");
    });
    it("procedural case 530: Mn(NO3)2 with AgCl", function(){
        expect(balanceEquation("Mn(NO3)2 + AgCl -> AgNO3 + MnCl2")).toBe("Mn(NO3)2 + 2AgCl -> 2AgNO3 + MnCl2");
    });
    it("procedural case 531: I2 with CaF2", function(){
        expect(balanceEquation("I2 + CaF2 -> CaI2 + F22")).toBe("11I2 + 11CaF2 -> 11CaI2 + F22");
    });
    it("procedural case 532: Sr(NO3)2 with NaCl", function(){
        expect(balanceEquation("Sr(NO3)2 + NaCl -> NaNO3 + SrCl2")).toBe("Sr(NO3)2 + 2NaCl -> 2NaNO3 + SrCl2");
    });
    it("procedural case 533: Cl2 with AlBr3", function(){
        expect(balanceEquation("Cl2 + AlBr3 -> AlCl3 + Br32")).toBe("48Cl2 + 32AlBr3 -> 32AlCl3 + 3Br32");
    });
    it("procedural case 534: K2CO3 with HNO3", function(){
        expect(balanceEquation("K2CO3 + HNO3 -> KNO3 + H2O + CO2")).toBe("K2CO3 + 2HNO3 -> 2KNO3 + H2O + CO2");
    });
    it("procedural case 535: Cu with HCl", function(){
        expect(balanceEquation("Cu + HCl -> CuCl2 + H2")).toBe("Cu + 2HCl -> CuCl2 + H2");
    });
    it("procedural case 536: Ba(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Ba(NO3)2 + K2SO4 -> KNO3 + BaSO4")).toBe("Ba(NO3)2 + K2SO4 -> 2KNO3 + BaSO4");
    });
    it("procedural case 537: Ni(OH)2 with H2S", function(){
        expect(balanceEquation("Ni(OH)2 + H2S -> NiS + H2O")).toBe("Ni(OH)2 + H2S -> NiS + 2H2O");
    });
    it("procedural case 538: FeO with H3PO4", function(){
        expect(balanceEquation("FeO + H3PO4 -> Fe3(PO4)2 + H2O")).toBe("3FeO + 2H3PO4 -> Fe3(PO4)2 + 3H2O");
    });
    it("procedural case 539: Zn(NO3)2 with KCl", function(){
        expect(balanceEquation("Zn(NO3)2 + KCl -> KNO3 + ZnCl2")).toBe("Zn(NO3)2 + 2KCl -> 2KNO3 + ZnCl2");
    });
    it("procedural case 540: Mg with HI", function(){
        expect(balanceEquation("Mg + HI -> MgI2 + H2")).toBe("Mg + 2HI -> MgI2 + H2");
    });
    it("procedural case 541: Cs2S with HF", function(){
        expect(balanceEquation("Cs2S + HF -> CsF + H2S")).toBe("Cs2S + 2HF -> 2CsF + H2S");
    });
    it("procedural case 542: NiS with HBr", function(){
        expect(balanceEquation("NiS + HBr -> NiBr2 + H2S")).toBe("NiS + 2HBr -> NiBr2 + H2S");
    });
    it("procedural case 543: AlCl3 with ZnSO4", function(){
        expect(balanceEquation("AlCl3 + ZnSO4 -> Al2(SO4)3 + ZnCl2")).toBe("2AlCl3 + 3ZnSO4 -> Al2(SO4)3 + 3ZnCl2");
    });
    it("procedural case 544: Cl2 with MgF2", function(){
        expect(balanceEquation("Cl2 + MgF2 -> MgCl2 + F22")).toBe("11Cl2 + 11MgF2 -> 11MgCl2 + F22");
    });
    it("procedural case 545: Rb with HF", function(){
        expect(balanceEquation("Rb + HF -> RbF + H2")).toBe("2Rb + 2HF -> 2RbF + H2");
    });
    it("procedural case 546: SrCO3 with HI", function(){
        expect(balanceEquation("SrCO3 + HI -> SrI2 + H2O + CO2")).toBe("SrCO3 + 2HI -> SrI2 + H2O + CO2");
    });
    it("procedural case 547: Cr2(C2O4)3 with HBr", function(){
        expect(balanceEquation("Cr2(C2O4)3 + HBr -> CrBr3 + H2C2O4")).toBe("Cr2(C2O4)3 + 6HBr -> 2CrBr3 + 3H2C2O4");
    });
    it("procedural case 548: CaC2O4 with HCl", function(){
        expect(balanceEquation("CaC2O4 + HCl -> CaCl2 + H2C2O4")).toBe("CaC2O4 + 2HCl -> CaCl2 + H2C2O4");
    });
    it("procedural case 549: Cl2 with NaF", function(){
        expect(balanceEquation("Cl2 + NaF -> NaCl + F2")).toBe("Cl2 + 2NaF -> 2NaCl + F2");
    });
    it("procedural case 550: CoO with HCl", function(){
        expect(balanceEquation("CoO + HCl -> CoCl2 + H2O")).toBe("CoO + 2HCl -> CoCl2 + H2O");
    });
    it("procedural case 551: Ba(NO2)2 with HBr", function(){
        expect(balanceEquation("Ba(NO2)2 + HBr -> BaBr2 + HNO2")).toBe("Ba(NO2)2 + 2HBr -> BaBr2 + 2HNO2");
    });
    it("procedural case 552: Na2S with HCl", function(){
        expect(balanceEquation("Na2S + HCl -> NaCl + H2S")).toBe("Na2S + 2HCl -> 2NaCl + H2S");
    });
    it("procedural case 553: CuC2O4 with HF", function(){
        expect(balanceEquation("CuC2O4 + HF -> CuF2 + H2C2O4")).toBe("CuC2O4 + 2HF -> CuF2 + H2C2O4");
    });
    it("procedural case 554: CuS with HF", function(){
        expect(balanceEquation("CuS + HF -> CuF2 + H2S")).toBe("CuS + 2HF -> CuF2 + H2S");
    });
    it("procedural case 555: Ni(OH)2 with HI", function(){
        expect(balanceEquation("Ni(OH)2 + HI -> NiI2 + H2O")).toBe("Ni(OH)2 + 2HI -> NiI2 + 2H2O");
    });
    it("procedural case 556: Cu with HF", function(){
        expect(balanceEquation("Cu + HF -> CuF2 + H2")).toBe("Cu + 2HF -> CuF2 + H2");
    });
    it("procedural case 557: Co(NO3)2 with LiCl", function(){
        expect(balanceEquation("Co(NO3)2 + LiCl -> LiNO3 + CoCl2")).toBe("Co(NO3)2 + 2LiCl -> 2LiNO3 + CoCl2");
    });
    it("procedural case 558: Cl2 with KBr", function(){
        expect(balanceEquation("Cl2 + KBr -> KCl + Br2")).toBe("Cl2 + 2KBr -> 2KCl + Br2");
    });
    it("procedural case 559: Al(OH)3 with H3PO4", function(){
        expect(balanceEquation("Al(OH)3 + H3PO4 -> AlPO4 + H2O")).toBe("Al(OH)3 + H3PO4 -> AlPO4 + 3H2O");
    });
    it("procedural case 560: Cs2C2O4 with HCl", function(){
        expect(balanceEquation("Cs2C2O4 + HCl -> CsCl + H2C2O4")).toBe("Cs2C2O4 + 2HCl -> 2CsCl + H2C2O4");
    });
    it("procedural case 561: CuCl2 with Fe2(SO4)3", function(){
        expect(balanceEquation("CuCl2 + Fe2(SO4)3 -> Cu2(SO4)3 + FeCl2")).toBe("2CuCl2 + Fe2(SO4)3 -> Cu2(SO4)3 + 2FeCl2");
    });
    it("procedural case 562: Fe(NO3)2 with KCl", function(){
        expect(balanceEquation("Fe(NO3)2 + KCl -> KNO3 + FeCl2")).toBe("Fe(NO3)2 + 2KCl -> 2KNO3 + FeCl2");
    });
    it("procedural case 563: Li with H2S", function(){
        expect(balanceEquation("Li + H2S -> Li(S)2 + H2")).toBe("Li + 2H2S -> Li(S)2 + 2H2");
    });
    it("procedural case 564: Cr(OH)3 with H2CO3", function(){
        expect(balanceEquation("Cr(OH)3 + H2CO3 -> Cr2(CO3)3 + H2O")).toBe("2Cr(OH)3 + 3H2CO3 -> Cr2(CO3)3 + 6H2O");
    });
    it("procedural case 565: CoC2O4 with HF", function(){
        expect(balanceEquation("CoC2O4 + HF -> CoF2 + H2C2O4")).toBe("CoC2O4 + 2HF -> CoF2 + H2C2O4");
    });
    it("procedural case 566: K2O with HC2H3O2", function(){
        expect(balanceEquation("K2O + HC2H3O2 -> KC2H3O2 + H2O")).toBe("K2O + 2HC2H3O2 -> 2KC2H3O2 + H2O");
    });
    it("procedural case 567: complete combustion of C10H22", function(){
        expect(balanceEquation("C10H22 + O2 -> CO2 + H2O")).toBe("2C10H22 + 31O2 -> 20CO2 + 22H2O");
    });
    it("procedural case 568: CrCl3 with SrSO4", function(){
        expect(balanceEquation("CrCl3 + SrSO4 -> Cr2(SO4)3 + SrCl2")).toBe("2CrCl3 + 3SrSO4 -> Cr2(SO4)3 + 3SrCl2");
    });
    it("procedural case 569: CoCO3 with HI", function(){
        expect(balanceEquation("CoCO3 + HI -> CoI2 + H2O + CO2")).toBe("CoCO3 + 2HI -> CoI2 + H2O + CO2");
    });
    it("procedural case 570: Sr(OH)2 with H3PO4", function(){
        expect(balanceEquation("Sr(OH)2 + H3PO4 -> Sr3(PO4)2 + H2O")).toBe("3Sr(OH)2 + 2H3PO4 -> Sr3(PO4)2 + 6H2O");
    });
    it("procedural case 571: Pb with H3PO4", function(){
        expect(balanceEquation("Pb + H3PO4 -> Pb3(PO4)2 + H2")).toBe("3Pb + 2H3PO4 -> Pb3(PO4)2 + 3H2");
    });
    it("procedural case 572: Ba(OH)2 with HCl", function(){
        expect(balanceEquation("Ba(OH)2 + HCl -> BaCl2 + H2O")).toBe("Ba(OH)2 + 2HCl -> BaCl2 + 2H2O");
    });
    it("procedural case 573: BaO with HF", function(){
        expect(balanceEquation("BaO + HF -> BaF2 + H2O")).toBe("BaO + 2HF -> BaF2 + H2O");
    });
    it("procedural case 574: Sn(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Sn(NO2)2 + H2SO4 -> SnSO4 + HNO2")).toBe("Sn(NO2)2 + H2SO4 -> SnSO4 + 2HNO2");
    });
    it("procedural case 575: I2 with CaI2", function(){
        expect(balanceEquation("I2 + CaI2 -> CaI2 + I22")).toBe("11I2 + CaI2 -> CaI2 + I22");
    });
    it("procedural case 576: Cl2 with MgCl2", function(){
        expect(balanceEquation("Cl2 + MgCl2 -> MgCl2 + Cl22")).toBe("11Cl2 + MgCl2 -> MgCl2 + Cl22");
    });
    it("procedural case 577: Pb(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Pb(NO3)2 + Rb2SO4 -> RbNO3 + PbSO4")).toBe("Pb(NO3)2 + Rb2SO4 -> 2RbNO3 + PbSO4");
    });
    it("procedural case 578: complete combustion of C2H4", function(){
        expect(balanceEquation("C2H4 + O2 -> CO2 + H2O")).toBe("C2H4 + 3O2 -> 2CO2 + 2H2O");
    });
    it("procedural case 579: Cs2C2O4 with HBr", function(){
        expect(balanceEquation("Cs2C2O4 + HBr -> CsBr + H2C2O4")).toBe("Cs2C2O4 + 2HBr -> 2CsBr + H2C2O4");
    });
    it("procedural case 580: Cu(OH)2 with H2CO3", function(){
        expect(balanceEquation("Cu(OH)2 + H2CO3 -> CuCO3 + H2O")).toBe("Cu(OH)2 + H2CO3 -> CuCO3 + 2H2O");
    });
    it("procedural case 581: Mg with HCl", function(){
        expect(balanceEquation("Mg + HCl -> MgCl2 + H2")).toBe("Mg + 2HCl -> MgCl2 + H2");
    });
    it("procedural case 582: FeO with HI", function(){
        expect(balanceEquation("FeO + HI -> FeI2 + H2O")).toBe("FeO + 2HI -> FeI2 + H2O");
    });
    it("procedural case 583: Cr2O3 with H2CO3", function(){
        expect(balanceEquation("Cr2O3 + H2CO3 -> Cr2(CO3)3 + H2O")).toBe("Cr2O3 + 3H2CO3 -> Cr2(CO3)3 + 3H2O");
    });
    it("procedural case 584: Na2CO3 with HBr", function(){
        expect(balanceEquation("Na2CO3 + HBr -> NaBr + H2O + CO2")).toBe("Na2CO3 + 2HBr -> 2NaBr + H2O + CO2");
    });
    it("procedural case 585: SrC2O4 with HBr", function(){
        expect(balanceEquation("SrC2O4 + HBr -> SrBr2 + H2C2O4")).toBe("SrC2O4 + 2HBr -> SrBr2 + H2C2O4");
    });
    it("procedural case 586: Al with HBr", function(){
        expect(balanceEquation("Al + HBr -> AlBr3 + H2")).toBe("2Al + 6HBr -> 2AlBr3 + 3H2");
    });
    it("procedural case 587: Li with HBr", function(){
        expect(balanceEquation("Li + HBr -> LiBr + H2")).toBe("2Li + 2HBr -> 2LiBr + H2");
    });
    it("procedural case 588: Fe(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Fe(NO2)2 + H2SO4 -> FeSO4 + HNO2")).toBe("Fe(NO2)2 + H2SO4 -> FeSO4 + 2HNO2");
    });
    it("procedural case 589: Co(OH)2 with H3PO4", function(){
        expect(balanceEquation("Co(OH)2 + H3PO4 -> Co3(PO4)2 + H2O")).toBe("3Co(OH)2 + 2H3PO4 -> Co3(PO4)2 + 6H2O");
    });
    it("procedural case 590: Ba(OH)2 with H2CO3", function(){
        expect(balanceEquation("Ba(OH)2 + H2CO3 -> BaCO3 + H2O")).toBe("Ba(OH)2 + H2CO3 -> BaCO3 + 2H2O");
    });
    it("procedural case 591: Ag2O with HI", function(){
        expect(balanceEquation("Ag2O + HI -> AgI + H2O")).toBe("Ag2O + 2HI -> 2AgI + H2O");
    });
    it("procedural case 592: Al(OH)3 with H2CO3", function(){
        expect(balanceEquation("Al(OH)3 + H2CO3 -> Al2(CO3)3 + H2O")).toBe("2Al(OH)3 + 3H2CO3 -> Al2(CO3)3 + 6H2O");
    });
    it("procedural case 593: NiO with HCl", function(){
        expect(balanceEquation("NiO + HCl -> NiCl2 + H2O")).toBe("NiO + 2HCl -> NiCl2 + H2O");
    });
    it("procedural case 594: K with HC2H3O2", function(){
        expect(balanceEquation("K + HC2H3O2 -> KC2H3O2 + H2")).toBe("2K + 2HC2H3O2 -> 2KC2H3O2 + H2");
    });
    it("procedural case 595: FeO with HBr", function(){
        expect(balanceEquation("FeO + HBr -> FeBr2 + H2O")).toBe("FeO + 2HBr -> FeBr2 + H2O");
    });
    it("procedural case 596: Sn(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Sn(NO3)2 + Rb2SO4 -> RbNO3 + SnSO4")).toBe("Sn(NO3)2 + Rb2SO4 -> 2RbNO3 + SnSO4");
    });
    it("procedural case 597: Pb(NO3)2 with NaCl", function(){
        expect(balanceEquation("Pb(NO3)2 + NaCl -> NaNO3 + PbCl2")).toBe("Pb(NO3)2 + 2NaCl -> 2NaNO3 + PbCl2");
    });
    it("procedural case 598: Zn with HCl", function(){
        expect(balanceEquation("Zn + HCl -> ZnCl2 + H2")).toBe("Zn + 2HCl -> ZnCl2 + H2");
    });
    it("procedural case 599: AlCl3 with Ag2SO4", function(){
        expect(balanceEquation("AlCl3 + Ag2SO4 -> Al2(2SO4)3 + AgCl")).toBe("2AlCl3 + 3Ag2SO4 -> Al2(2SO4)3 + 6AgCl");
    });
    it("procedural case 600: CuO with H3PO4", function(){
        expect(balanceEquation("CuO + H3PO4 -> Cu3(PO4)2 + H2O")).toBe("3CuO + 2H3PO4 -> Cu3(PO4)2 + 3H2O");
    });
    it("procedural case 601: Li2O with HCl", function(){
        expect(balanceEquation("Li2O + HCl -> LiCl + H2O")).toBe("Li2O + 2HCl -> 2LiCl + H2O");
    });
    it("procedural case 602: CrCl3 with BaSO4", function(){
        expect(balanceEquation("CrCl3 + BaSO4 -> Cr2(SO4)3 + BaCl2")).toBe("2CrCl3 + 3BaSO4 -> Cr2(SO4)3 + 3BaCl2");
    });
    it("procedural case 603: Sr with HCl", function(){
        expect(balanceEquation("Sr + HCl -> SrCl2 + H2")).toBe("Sr + 2HCl -> SrCl2 + H2");
    });
    it("procedural case 604: Cs with HI", function(){
        expect(balanceEquation("Cs + HI -> CsI + H2")).toBe("2Cs + 2HI -> 2CsI + H2");
    });
    it("procedural case 605: complete combustion of C6H5CH3", function(){
        expect(balanceEquation("C6H5CH3 + O2 -> CO2 + H2O")).toBe("C6H5CH3 + 9O2 -> 7CO2 + 4H2O");
    });
    it("procedural case 606: Fe with HI", function(){
        expect(balanceEquation("Fe + HI -> FeI2 + H2")).toBe("Fe + 2HI -> FeI2 + H2");
    });
    it("procedural case 607: NiS with HCl", function(){
        expect(balanceEquation("NiS + HCl -> NiCl2 + H2S")).toBe("NiS + 2HCl -> NiCl2 + H2S");
    });
    it("procedural case 608: Cr(NO3)3 with K2SO4", function(){
        expect(balanceEquation("Cr(NO3)3 + K2SO4 -> KNO3 + Cr2(SO4)3")).toBe("2Cr(NO3)3 + 3K2SO4 -> 6KNO3 + Cr2(SO4)3");
    });
    it("procedural case 609: Li2CO3 with HCl", function(){
        expect(balanceEquation("Li2CO3 + HCl -> LiCl + H2O + CO2")).toBe("Li2CO3 + 2HCl -> 2LiCl + H2O + CO2");
    });
    it("procedural case 610: Cs2CO3 with HI", function(){
        expect(balanceEquation("Cs2CO3 + HI -> CsI + H2O + CO2")).toBe("Cs2CO3 + 2HI -> 2CsI + H2O + CO2");
    });
    it("procedural case 611: Mg(NO2)2 with HI", function(){
        expect(balanceEquation("Mg(NO2)2 + HI -> MgI2 + HNO2")).toBe("Mg(NO2)2 + 2HI -> MgI2 + 2HNO2");
    });
    it("procedural case 612: Ag with H3PO4", function(){
        expect(balanceEquation("Ag + H3PO4 -> Ag(PO4)3 + H2")).toBe("2Ag + 6H3PO4 -> 2Ag(PO4)3 + 9H2");
    });
    it("procedural case 613: Ca(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Ca(NO2)2 + H2SO4 -> CaSO4 + HNO2")).toBe("Ca(NO2)2 + H2SO4 -> CaSO4 + 2HNO2");
    });
    it("procedural case 614: Ca(OH)2 with H2SO4", function(){
        expect(balanceEquation("Ca(OH)2 + H2SO4 -> CaSO4 + H2O")).toBe("Ca(OH)2 + H2SO4 -> CaSO4 + 2H2O");
    });
    it("procedural case 615: MgC2O4 with HCl", function(){
        expect(balanceEquation("MgC2O4 + HCl -> MgCl2 + H2C2O4")).toBe("MgC2O4 + 2HCl -> MgCl2 + H2C2O4");
    });
    it("procedural case 616: Na2O with HCl", function(){
        expect(balanceEquation("Na2O + HCl -> NaCl + H2O")).toBe("Na2O + 2HCl -> 2NaCl + H2O");
    });
    it("procedural case 617: Fe with HBr", function(){
        expect(balanceEquation("Fe + HBr -> FeBr2 + H2")).toBe("Fe + 2HBr -> FeBr2 + H2");
    });
    it("procedural case 618: Mn(NO3)2 with KCl", function(){
        expect(balanceEquation("Mn(NO3)2 + KCl -> KNO3 + MnCl2")).toBe("Mn(NO3)2 + 2KCl -> 2KNO3 + MnCl2");
    });
    it("procedural case 619: PbS with HBr", function(){
        expect(balanceEquation("PbS + HBr -> PbBr2 + H2S")).toBe("PbS + 2HBr -> PbBr2 + H2S");
    });
    it("procedural case 620: ZnS with HI", function(){
        expect(balanceEquation("ZnS + HI -> ZnI2 + H2S")).toBe("ZnS + 2HI -> ZnI2 + H2S");
    });
    it("procedural case 621: Na2CO3 with HCl", function(){
        expect(balanceEquation("Na2CO3 + HCl -> NaCl + H2O + CO2")).toBe("Na2CO3 + 2HCl -> 2NaCl + H2O + CO2");
    });
    it("procedural case 622: Pb(OH)2 with HCl", function(){
        expect(balanceEquation("Pb(OH)2 + HCl -> PbCl2 + H2O")).toBe("Pb(OH)2 + 2HCl -> PbCl2 + 2H2O");
    });
    it("procedural case 623: Al with H2CO3", function(){
        expect(balanceEquation("Al + H2CO3 -> Al2(CO3)3 + H2")).toBe("2Al + 3H2CO3 -> Al2(CO3)3 + 3H2");
    });
    it("procedural case 624: Sr(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Sr(NO2)2 + H2SO4 -> SrSO4 + HNO2")).toBe("Sr(NO2)2 + H2SO4 -> SrSO4 + 2HNO2");
    });
    it("procedural case 625: Cs with HNO3", function(){
        expect(balanceEquation("Cs + HNO3 -> CsNO3 + H2")).toBe("2Cs + 2HNO3 -> 2CsNO3 + H2");
    });
    it("procedural case 626: SnS with HBr", function(){
        expect(balanceEquation("SnS + HBr -> SnBr2 + H2S")).toBe("SnS + 2HBr -> SnBr2 + H2S");
    });
    it("procedural case 627: CuO with HI", function(){
        expect(balanceEquation("CuO + HI -> CuI2 + H2O")).toBe("CuO + 2HI -> CuI2 + H2O");
    });
    it("procedural case 628: Co(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Co(NO3)2 + Li2SO4 -> LiNO3 + CoSO4")).toBe("Co(NO3)2 + Li2SO4 -> 2LiNO3 + CoSO4");
    });
    it("procedural case 629: Cs2S with HNO3", function(){
        expect(balanceEquation("Cs2S + HNO3 -> CsNO3 + H2S")).toBe("Cs2S + 2HNO3 -> 2CsNO3 + H2S");
    });
    it("procedural case 630: Ag2C2O4 with HF", function(){
        expect(balanceEquation("Ag2C2O4 + HF -> AgF + H2C2O4")).toBe("Ag2C2O4 + 2HF -> 2AgF + H2C2O4");
    });
    it("procedural case 631: NiCO3 with HI", function(){
        expect(balanceEquation("NiCO3 + HI -> NiI2 + H2O + CO2")).toBe("NiCO3 + 2HI -> NiI2 + H2O + CO2");
    });
    it("procedural case 632: I2 with CaCl2", function(){
        expect(balanceEquation("I2 + CaCl2 -> CaI2 + Cl22")).toBe("11I2 + 11CaCl2 -> 11CaI2 + Cl22");
    });
    it("procedural case 633: K with HBr", function(){
        expect(balanceEquation("K + HBr -> KBr + H2")).toBe("2K + 2HBr -> 2KBr + H2");
    });
    it("procedural case 634: K2O with HI", function(){
        expect(balanceEquation("K2O + HI -> KI + H2O")).toBe("K2O + 2HI -> 2KI + H2O");
    });
    it("procedural case 635: synthesis of calcium oxide", function(){
        expect(balanceEquation("Ca + O2 -> CaO")).toBe("2Ca + O2 -> 2CaO");
    });
    it("procedural case 636: Rb2S with HBr", function(){
        expect(balanceEquation("Rb2S + HBr -> RbBr + H2S")).toBe("Rb2S + 2HBr -> 2RbBr + H2S");
    });
    it("procedural case 637: BaCO3 with HF", function(){
        expect(balanceEquation("BaCO3 + HF -> BaF2 + H2O + CO2")).toBe("BaCO3 + 2HF -> BaF2 + H2O + CO2");
    });
    it("procedural case 638: Al2S3 with HF", function(){
        expect(balanceEquation("Al2S3 + HF -> AlF3 + H2S")).toBe("Al2S3 + 6HF -> 2AlF3 + 3H2S");
    });
    it("procedural case 639: Ag2O with HF", function(){
        expect(balanceEquation("Ag2O + HF -> AgF + H2O")).toBe("Ag2O + 2HF -> 2AgF + H2O");
    });
    it("procedural case 640: Na2C2O4 with HNO3", function(){
        expect(balanceEquation("Na2C2O4 + HNO3 -> NaNO3 + H2C2O4")).toBe("Na2C2O4 + 2HNO3 -> 2NaNO3 + H2C2O4");
    });
    it("procedural case 641: Cu(NO3)2 with LiCl", function(){
        expect(balanceEquation("Cu(NO3)2 + LiCl -> LiNO3 + CuCl2")).toBe("Cu(NO3)2 + 2LiCl -> 2LiNO3 + CuCl2");
    });
    it("procedural case 642: MgC2O4 with HF", function(){
        expect(balanceEquation("MgC2O4 + HF -> MgF2 + H2C2O4")).toBe("MgC2O4 + 2HF -> MgF2 + H2C2O4");
    });
    it("procedural case 643: MnS with HBr", function(){
        expect(balanceEquation("MnS + HBr -> MnBr2 + H2S")).toBe("MnS + 2HBr -> MnBr2 + H2S");
    });
    it("procedural case 644: Pb(OH)2 with HI", function(){
        expect(balanceEquation("Pb(OH)2 + HI -> PbI2 + H2O")).toBe("Pb(OH)2 + 2HI -> PbI2 + 2H2O");
    });
    it("procedural case 645: Ca with HI", function(){
        expect(balanceEquation("Ca + HI -> CaI2 + H2")).toBe("Ca + 2HI -> CaI2 + H2");
    });
    it("procedural case 646: Mg(OH)2 with HI", function(){
        expect(balanceEquation("Mg(OH)2 + HI -> MgI2 + H2O")).toBe("Mg(OH)2 + 2HI -> MgI2 + 2H2O");
    });
    it("procedural case 647: Co(NO2)2 with HI", function(){
        expect(balanceEquation("Co(NO2)2 + HI -> CoI2 + HNO2")).toBe("Co(NO2)2 + 2HI -> CoI2 + 2HNO2");
    });
    it("procedural case 648: FeCO3 with HBr", function(){
        expect(balanceEquation("FeCO3 + HBr -> FeBr2 + H2O + CO2")).toBe("FeCO3 + 2HBr -> FeBr2 + H2O + CO2");
    });
    it("procedural case 649: CaCO3 with HCl", function(){
        expect(balanceEquation("CaCO3 + HCl -> CaCl2 + H2O + CO2")).toBe("CaCO3 + 2HCl -> CaCl2 + H2O + CO2");
    });
    it("procedural case 650: F2 with KBr", function(){
        expect(balanceEquation("F2 + KBr -> KF + Br2")).toBe("F2 + 2KBr -> 2KF + Br2");
    });
    it("procedural case 651: Na2CO3 with HI", function(){
        expect(balanceEquation("Na2CO3 + HI -> NaI + H2O + CO2")).toBe("Na2CO3 + 2HI -> 2NaI + H2O + CO2");
    });
    it("procedural case 652: Sr(NO3)2 with LiCl", function(){
        expect(balanceEquation("Sr(NO3)2 + LiCl -> LiNO3 + SrCl2")).toBe("Sr(NO3)2 + 2LiCl -> 2LiNO3 + SrCl2");
    });
    it("procedural case 653: BaS with HF", function(){
        expect(balanceEquation("BaS + HF -> BaF2 + H2S")).toBe("BaS + 2HF -> BaF2 + H2S");
    });
    it("procedural case 654: NiS with HF", function(){
        expect(balanceEquation("NiS + HF -> NiF2 + H2S")).toBe("NiS + 2HF -> NiF2 + H2S");
    });
    it("procedural case 655: complete combustion of C3H4", function(){
        expect(balanceEquation("C3H4 + O2 -> CO2 + H2O")).toBe("C3H4 + 4O2 -> 3CO2 + 2H2O");
    });
    it("procedural case 656: Cs2CO3 with HCl", function(){
        expect(balanceEquation("Cs2CO3 + HCl -> CsCl + H2O + CO2")).toBe("Cs2CO3 + 2HCl -> 2CsCl + H2O + CO2");
    });
    it("procedural case 657: Mn(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Mn(NO3)2 + Ag2SO4 -> AgNO3 + MnSO4")).toBe("Mn(NO3)2 + Ag2SO4 -> 2AgNO3 + MnSO4");
    });
    it("procedural case 658: Cr(NO3)3 with Li2SO4", function(){
        expect(balanceEquation("Cr(NO3)3 + Li2SO4 -> LiNO3 + Cr2(SO4)3")).toBe("2Cr(NO3)3 + 3Li2SO4 -> 6LiNO3 + Cr2(SO4)3");
    });
    it("procedural case 659: Ba with HI", function(){
        expect(balanceEquation("Ba + HI -> BaI2 + H2")).toBe("Ba + 2HI -> BaI2 + H2");
    });
    it("procedural case 660: Ni(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Ni(NO3)2 + Li2SO4 -> LiNO3 + NiSO4")).toBe("Ni(NO3)2 + Li2SO4 -> 2LiNO3 + NiSO4");
    });
    it("procedural case 661: CaS with HI", function(){
        expect(balanceEquation("CaS + HI -> CaI2 + H2S")).toBe("CaS + 2HI -> CaI2 + H2S");
    });
    it("procedural case 662: Rb with HBr", function(){
        expect(balanceEquation("Rb + HBr -> RbBr + H2")).toBe("2Rb + 2HBr -> 2RbBr + H2");
    });
    it("procedural case 663: Rb2C2O4 with HF", function(){
        expect(balanceEquation("Rb2C2O4 + HF -> RbF + H2C2O4")).toBe("Rb2C2O4 + 2HF -> 2RbF + H2C2O4");
    });
    it("procedural case 664: Sn with HBr", function(){
        expect(balanceEquation("Sn + HBr -> SnBr2 + H2")).toBe("Sn + 2HBr -> SnBr2 + H2");
    });
    it("procedural case 665: Na2S with HNO3", function(){
        expect(balanceEquation("Na2S + HNO3 -> NaNO3 + H2S")).toBe("Na2S + 2HNO3 -> 2NaNO3 + H2S");
    });
    it("procedural case 666: Al2O3 with H2SO4", function(){
        expect(balanceEquation("Al2O3 + H2SO4 -> Al2(SO4)3 + H2O")).toBe("Al2O3 + 3H2SO4 -> Al2(SO4)3 + 3H2O");
    });
    it("procedural case 667: AlCl3 with MnSO4", function(){
        expect(balanceEquation("AlCl3 + MnSO4 -> Al2(SO4)3 + MnCl2")).toBe("2AlCl3 + 3MnSO4 -> Al2(SO4)3 + 3MnCl2");
    });
    it("procedural case 668: Na with H2SO4", function(){
        expect(balanceEquation("Na + H2SO4 -> Na(SO4)2 + H2")).toBe("Na + 2H2SO4 -> Na(SO4)2 + 2H2");
    });
    it("procedural case 669: Al(NO2)3 with H2SO4", function(){
        expect(balanceEquation("Al(NO2)3 + H2SO4 -> Al2(SO4)3 + HNO2")).toBe("2Al(NO2)3 + 3H2SO4 -> Al2(SO4)3 + 6HNO2");
    });
    it("procedural case 670: Al(NO3)3 with Ag2SO4", function(){
        expect(balanceEquation("Al(NO3)3 + Ag2SO4 -> AgNO3 + Al2(SO4)3")).toBe("2Al(NO3)3 + 3Ag2SO4 -> 6AgNO3 + Al2(SO4)3");
    });
    it("procedural case 671: Cr(OH)3 with HF", function(){
        expect(balanceEquation("Cr(OH)3 + HF -> CrF3 + H2O")).toBe("Cr(OH)3 + 3HF -> CrF3 + 3H2O");
    });
    it("procedural case 672: K2S with HNO3", function(){
        expect(balanceEquation("K2S + HNO3 -> KNO3 + H2S")).toBe("K2S + 2HNO3 -> 2KNO3 + H2S");
    });
    it("procedural case 673: Rb2C2O4 with HI", function(){
        expect(balanceEquation("Rb2C2O4 + HI -> RbI + H2C2O4")).toBe("Rb2C2O4 + 2HI -> 2RbI + H2C2O4");
    });
    it("procedural case 674: Mn(OH)2 with HBr", function(){
        expect(balanceEquation("Mn(OH)2 + HBr -> MnBr2 + H2O")).toBe("Mn(OH)2 + 2HBr -> MnBr2 + 2H2O");
    });
    it("procedural case 675: Sr(OH)2 with H2S", function(){
        expect(balanceEquation("Sr(OH)2 + H2S -> SrS + H2O")).toBe("Sr(OH)2 + H2S -> SrS + 2H2O");
    });
    it("procedural case 676: Sr(NO2)2 with HI", function(){
        expect(balanceEquation("Sr(NO2)2 + HI -> SrI2 + HNO2")).toBe("Sr(NO2)2 + 2HI -> SrI2 + 2HNO2");
    });
    it("procedural case 677: Ca(NO3)2 with AgCl", function(){
        expect(balanceEquation("Ca(NO3)2 + AgCl -> AgNO3 + CaCl2")).toBe("Ca(NO3)2 + 2AgCl -> 2AgNO3 + CaCl2");
    });
    it("procedural case 678: CuC2O4 with HBr", function(){
        expect(balanceEquation("CuC2O4 + HBr -> CuBr2 + H2C2O4")).toBe("CuC2O4 + 2HBr -> CuBr2 + H2C2O4");
    });
    it("procedural case 679: CoO with HI", function(){
        expect(balanceEquation("CoO + HI -> CoI2 + H2O")).toBe("CoO + 2HI -> CoI2 + H2O");
    });
    it("procedural case 680: F2 with KCl", function(){
        expect(balanceEquation("F2 + KCl -> KF + Cl2")).toBe("F2 + 2KCl -> 2KF + Cl2");
    });
    it("procedural case 681: Ag2S with HBr", function(){
        expect(balanceEquation("Ag2S + HBr -> AgBr + H2S")).toBe("Ag2S + 2HBr -> 2AgBr + H2S");
    });
    it("procedural case 682: Br2 with NaCl", function(){
        expect(balanceEquation("Br2 + NaCl -> NaBr + Cl2")).toBe("Br2 + 2NaCl -> 2NaBr + Cl2");
    });
    it("procedural case 683: Sr(NO3)2 with AgCl", function(){
        expect(balanceEquation("Sr(NO3)2 + AgCl -> AgNO3 + SrCl2")).toBe("Sr(NO3)2 + 2AgCl -> 2AgNO3 + SrCl2");
    });
    it("procedural case 684: Sr(NO2)2 with HF", function(){
        expect(balanceEquation("Sr(NO2)2 + HF -> SrF2 + HNO2")).toBe("Sr(NO2)2 + 2HF -> SrF2 + 2HNO2");
    });
    it("procedural case 685: Sn(OH)2 with H2SO4", function(){
        expect(balanceEquation("Sn(OH)2 + H2SO4 -> SnSO4 + H2O")).toBe("Sn(OH)2 + H2SO4 -> SnSO4 + 2H2O");
    });
    it("procedural case 686: SnCl2 with Fe2(SO4)3", function(){
        expect(balanceEquation("SnCl2 + Fe2(SO4)3 -> Sn2(SO4)3 + FeCl2")).toBe("2SnCl2 + Fe2(SO4)3 -> Sn2(SO4)3 + 2FeCl2");
    });
    it("procedural case 687: Ba with HF", function(){
        expect(balanceEquation("Ba + HF -> BaF2 + H2")).toBe("Ba + 2HF -> BaF2 + H2");
    });
    it("procedural case 688: CuCO3 with HBr", function(){
        expect(balanceEquation("CuCO3 + HBr -> CuBr2 + H2O + CO2")).toBe("CuCO3 + 2HBr -> CuBr2 + H2O + CO2");
    });
    it("procedural case 689: K2S with HF", function(){
        expect(balanceEquation("K2S + HF -> KF + H2S")).toBe("K2S + 2HF -> 2KF + H2S");
    });
    it("procedural case 690: K2S with HCl", function(){
        expect(balanceEquation("K2S + HCl -> KCl + H2S")).toBe("K2S + 2HCl -> 2KCl + H2S");
    });
    it("procedural case 691: Ca with HBr", function(){
        expect(balanceEquation("Ca + HBr -> CaBr2 + H2")).toBe("Ca + 2HBr -> CaBr2 + H2");
    });
    it("procedural case 692: Mn(OH)2 with HI", function(){
        expect(balanceEquation("Mn(OH)2 + HI -> MnI2 + H2O")).toBe("Mn(OH)2 + 2HI -> MnI2 + 2H2O");
    });
    it("procedural case 693: complete combustion of C4H10O", function(){
        expect(balanceEquation("C4H10O + O2 -> CO2 + H2O")).toBe("C4H10O + 6O2 -> 4CO2 + 5H2O");
    });
    it("procedural case 694: Mn(OH)2 with H2CO3", function(){
        expect(balanceEquation("Mn(OH)2 + H2CO3 -> MnCO3 + H2O")).toBe("Mn(OH)2 + H2CO3 -> MnCO3 + 2H2O");
    });
    it("procedural case 695: Pb(OH)2 with H2SO4", function(){
        expect(balanceEquation("Pb(OH)2 + H2SO4 -> PbSO4 + H2O")).toBe("Pb(OH)2 + H2SO4 -> PbSO4 + 2H2O");
    });
    it("procedural case 696: synthesis of nitrogen monoxide", function(){
        expect(balanceEquation("N2 + O2 -> NO")).toBe("N2 + O2 -> 2NO");
    });
    it("procedural case 697: ZnO with HF", function(){
        expect(balanceEquation("ZnO + HF -> ZnF2 + H2O")).toBe("ZnO + 2HF -> ZnF2 + H2O");
    });
    it("procedural case 698: Mg(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Mg(NO3)2 + Rb2SO4 -> RbNO3 + MgSO4")).toBe("Mg(NO3)2 + Rb2SO4 -> 2RbNO3 + MgSO4");
    });
    it("procedural case 699: Mn(NO2)2 with HF", function(){
        expect(balanceEquation("Mn(NO2)2 + HF -> MnF2 + HNO2")).toBe("Mn(NO2)2 + 2HF -> MnF2 + 2HNO2");
    });
    it("procedural case 700: complete combustion of C12H22O11", function(){
        expect(balanceEquation("C12H22O11 + O2 -> CO2 + H2O")).toBe("C12H22O11 + 12O2 -> 12CO2 + 11H2O");
    });
    it("procedural case 701: complete combustion of C9H20", function(){
        expect(balanceEquation("C9H20 + O2 -> CO2 + H2O")).toBe("C9H20 + 14O2 -> 9CO2 + 10H2O");
    });
    it("procedural case 702: FeCO3 with H3PO4", function(){
        expect(balanceEquation("FeCO3 + H3PO4 -> Fe3(PO4)2 + H2O + CO2")).toBe("3FeCO3 + 2H3PO4 -> Fe3(PO4)2 + 3H2O + 3CO2");
    });
    it("procedural case 703: Cs with HF", function(){
        expect(balanceEquation("Cs + HF -> CsF + H2")).toBe("2Cs + 2HF -> 2CsF + H2");
    });
    it("procedural case 704: Fe(NO2)2 with HCl", function(){
        expect(balanceEquation("Fe(NO2)2 + HCl -> FeCl2 + HNO2")).toBe("Fe(NO2)2 + 2HCl -> FeCl2 + 2HNO2");
    });
    it("procedural case 705: Cu(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Cu(NO3)2 + Ag2SO4 -> AgNO3 + CuSO4")).toBe("Cu(NO3)2 + Ag2SO4 -> 2AgNO3 + CuSO4");
    });
    it("procedural case 706: K2O with HNO3", function(){
        expect(balanceEquation("K2O + HNO3 -> KNO3 + H2O")).toBe("K2O + 2HNO3 -> 2KNO3 + H2O");
    });
    it("procedural case 707: SnS with HF", function(){
        expect(balanceEquation("SnS + HF -> SnF2 + H2S")).toBe("SnS + 2HF -> SnF2 + H2S");
    });
    it("procedural case 708: Al with H2S", function(){
        expect(balanceEquation("Al + H2S -> Al2(S)3 + H2")).toBe("2Al + 3H2S -> Al2(S)3 + 3H2");
    });
    it("procedural case 709: Br2 with MgBr2", function(){
        expect(balanceEquation("Br2 + MgBr2 -> MgBr2 + Br22")).toBe("11Br2 + MgBr2 -> MgBr2 + Br22");
    });
    it("procedural case 710: Pb(OH)2 with HF", function(){
        expect(balanceEquation("Pb(OH)2 + HF -> PbF2 + H2O")).toBe("Pb(OH)2 + 2HF -> PbF2 + 2H2O");
    });
    it("procedural case 711: Ca(NO3)2 with KCl", function(){
        expect(balanceEquation("Ca(NO3)2 + KCl -> KNO3 + CaCl2")).toBe("Ca(NO3)2 + 2KCl -> 2KNO3 + CaCl2");
    });
    it("procedural case 712: Ni(NO2)2 with HCl", function(){
        expect(balanceEquation("Ni(NO2)2 + HCl -> NiCl2 + HNO2")).toBe("Ni(NO2)2 + 2HCl -> NiCl2 + 2HNO2");
    });
    it("procedural case 713: Rb2CO3 with HNO3", function(){
        expect(balanceEquation("Rb2CO3 + HNO3 -> RbNO3 + H2O + CO2")).toBe("Rb2CO3 + 2HNO3 -> 2RbNO3 + H2O + CO2");
    });
    it("procedural case 714: Sn(OH)2 with HI", function(){
        expect(balanceEquation("Sn(OH)2 + HI -> SnI2 + H2O")).toBe("Sn(OH)2 + 2HI -> SnI2 + 2H2O");
    });
    it("procedural case 715: Mn(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Mn(NO3)2 + K2SO4 -> KNO3 + MnSO4")).toBe("Mn(NO3)2 + K2SO4 -> 2KNO3 + MnSO4");
    });
    it("procedural case 716: CrCl3 with Ag2SO4", function(){
        expect(balanceEquation("CrCl3 + Ag2SO4 -> Cr2(2SO4)3 + AgCl")).toBe("2CrCl3 + 3Ag2SO4 -> Cr2(2SO4)3 + 6AgCl");
    });
    it("procedural case 717: Na with H2CO3", function(){
        expect(balanceEquation("Na + H2CO3 -> Na(CO3)2 + H2")).toBe("Na + 2H2CO3 -> Na(CO3)2 + 2H2");
    });
    it("procedural case 718: BaO with HCl", function(){
        expect(balanceEquation("BaO + HCl -> BaCl2 + H2O")).toBe("BaO + 2HCl -> BaCl2 + H2O");
    });
    it("procedural case 719: Ni(OH)2 with H2CO3", function(){
        expect(balanceEquation("Ni(OH)2 + H2CO3 -> NiCO3 + H2O")).toBe("Ni(OH)2 + H2CO3 -> NiCO3 + 2H2O");
    });
    it("procedural case 720: Sn(OH)2 with H2S", function(){
        expect(balanceEquation("Sn(OH)2 + H2S -> SnS + H2O")).toBe("Sn(OH)2 + H2S -> SnS + 2H2O");
    });
    it("procedural case 721: Li2CO3 with HC2H3O2", function(){
        expect(balanceEquation("Li2CO3 + HC2H3O2 -> LiC2H3O2 + H2O + CO2")).toBe("Li2CO3 + 2HC2H3O2 -> 2LiC2H3O2 + H2O + CO2");
    });
    it("procedural case 722: Pb(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Pb(NO3)2 + K2SO4 -> KNO3 + PbSO4")).toBe("Pb(NO3)2 + K2SO4 -> 2KNO3 + PbSO4");
    });
    it("procedural case 723: MnCO3 with HCl", function(){
        expect(balanceEquation("MnCO3 + HCl -> MnCl2 + H2O + CO2")).toBe("MnCO3 + 2HCl -> MnCl2 + H2O + CO2");
    });
    it("procedural case 724: CaO with HI", function(){
        expect(balanceEquation("CaO + HI -> CaI2 + H2O")).toBe("CaO + 2HI -> CaI2 + H2O");
    });
    it("procedural case 725: Cl2 with CaBr2", function(){
        expect(balanceEquation("Cl2 + CaBr2 -> CaCl2 + Br22")).toBe("11Cl2 + 11CaBr2 -> 11CaCl2 + Br22");
    });
    it("procedural case 726: F2 with MgF2", function(){
        expect(balanceEquation("F2 + MgF2 -> MgF2 + F22")).toBe("11F2 + MgF2 -> MgF2 + F22");
    });
    it("procedural case 727: Ag2CO3 with HCl", function(){
        expect(balanceEquation("Ag2CO3 + HCl -> AgCl + H2O + CO2")).toBe("Ag2CO3 + 2HCl -> 2AgCl + H2O + CO2");
    });
    it("procedural case 728: Cl2 with KF", function(){
        expect(balanceEquation("Cl2 + KF -> KCl + F2")).toBe("Cl2 + 2KF -> 2KCl + F2");
    });
    it("procedural case 729: Ba(NO3)2 with NaCl", function(){
        expect(balanceEquation("Ba(NO3)2 + NaCl -> NaNO3 + BaCl2")).toBe("Ba(NO3)2 + 2NaCl -> 2NaNO3 + BaCl2");
    });
    it("procedural case 730: NiCl2 with Fe2(SO4)3", function(){
        expect(balanceEquation("NiCl2 + Fe2(SO4)3 -> Ni2(SO4)3 + FeCl2")).toBe("2NiCl2 + Fe2(SO4)3 -> Ni2(SO4)3 + 2FeCl2");
    });
    it("procedural case 731: Na with HBr", function(){
        expect(balanceEquation("Na + HBr -> NaBr + H2")).toBe("2Na + 2HBr -> 2NaBr + H2");
    });
    it("procedural case 732: SnO with HF", function(){
        expect(balanceEquation("SnO + HF -> SnF2 + H2O")).toBe("SnO + 2HF -> SnF2 + H2O");
    });
    it("procedural case 733: Sn(OH)2 with H2CO3", function(){
        expect(balanceEquation("Sn(OH)2 + H2CO3 -> SnCO3 + H2O")).toBe("Sn(OH)2 + H2CO3 -> SnCO3 + 2H2O");
    });
    it("procedural case 734: Mn(OH)2 with H2S", function(){
        expect(balanceEquation("Mn(OH)2 + H2S -> MnS + H2O")).toBe("Mn(OH)2 + H2S -> MnS + 2H2O");
    });
    it("procedural case 735: Cr(OH)3 with HCl", function(){
        expect(balanceEquation("Cr(OH)3 + HCl -> CrCl3 + H2O")).toBe("Cr(OH)3 + 3HCl -> CrCl3 + 3H2O");
    });
    it("procedural case 736: Rb2S with HNO3", function(){
        expect(balanceEquation("Rb2S + HNO3 -> RbNO3 + H2S")).toBe("Rb2S + 2HNO3 -> 2RbNO3 + H2S");
    });
    it("procedural case 737: Rb with H2SO4", function(){
        expect(balanceEquation("Rb + H2SO4 -> Rb(SO4)2 + H2")).toBe("Rb + 2H2SO4 -> Rb(SO4)2 + 2H2");
    });
    it("procedural case 738: Sr(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Sr(NO3)2 + Rb2SO4 -> RbNO3 + SrSO4")).toBe("Sr(NO3)2 + Rb2SO4 -> 2RbNO3 + SrSO4");
    });
    it("procedural case 739: CrCl3 with Li2SO4", function(){
        expect(balanceEquation("CrCl3 + Li2SO4 -> Cr2(2SO4)3 + LiCl")).toBe("2CrCl3 + 3Li2SO4 -> Cr2(2SO4)3 + 6LiCl");
    });
    it("procedural case 740: Ca(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Ca(NO3)2 + Rb2SO4 -> RbNO3 + CaSO4")).toBe("Ca(NO3)2 + Rb2SO4 -> 2RbNO3 + CaSO4");
    });
    it("procedural case 741: Sn(NO3)2 with KCl", function(){
        expect(balanceEquation("Sn(NO3)2 + KCl -> KNO3 + SnCl2")).toBe("Sn(NO3)2 + 2KCl -> 2KNO3 + SnCl2");
    });
    it("procedural case 742: Pb(NO2)2 with HBr", function(){
        expect(balanceEquation("Pb(NO2)2 + HBr -> PbBr2 + HNO2")).toBe("Pb(NO2)2 + 2HBr -> PbBr2 + 2HNO2");
    });
    it("procedural case 743: PbCO3 with H3PO4", function(){
        expect(balanceEquation("PbCO3 + H3PO4 -> Pb3(PO4)2 + H2O + CO2")).toBe("3PbCO3 + 2H3PO4 -> Pb3(PO4)2 + 3H2O + 3CO2");
    });
    it("procedural case 744: complete combustion of CH3COOH", function(){
        expect(balanceEquation("CH3COOH + O2 -> CO2 + H2O")).toBe("CH3COOH + 2O2 -> 2CO2 + 2H2O");
    });
    it("procedural case 745: Ag with HI", function(){
        expect(balanceEquation("Ag + HI -> AgI + H2")).toBe("2Ag + 2HI -> 2AgI + H2");
    });
    it("procedural case 746: BaC2O4 with HI", function(){
        expect(balanceEquation("BaC2O4 + HI -> BaI2 + H2C2O4")).toBe("BaC2O4 + 2HI -> BaI2 + H2C2O4");
    });
    it("procedural case 747: Rb2S with HI", function(){
        expect(balanceEquation("Rb2S + HI -> RbI + H2S")).toBe("Rb2S + 2HI -> 2RbI + H2S");
    });
    it("procedural case 748: BaCO3 with HI", function(){
        expect(balanceEquation("BaCO3 + HI -> BaI2 + H2O + CO2")).toBe("BaCO3 + 2HI -> BaI2 + H2O + CO2");
    });
    it("procedural case 749: PbCO3 with HF", function(){
        expect(balanceEquation("PbCO3 + HF -> PbF2 + H2O + CO2")).toBe("PbCO3 + 2HF -> PbF2 + H2O + CO2");
    });
    it("procedural case 750: Sr(OH)2 with HCl", function(){
        expect(balanceEquation("Sr(OH)2 + HCl -> SrCl2 + H2O")).toBe("Sr(OH)2 + 2HCl -> SrCl2 + 2H2O");
    });
    it("procedural case 751: Li2O with HI", function(){
        expect(balanceEquation("Li2O + HI -> LiI + H2O")).toBe("Li2O + 2HI -> 2LiI + H2O");
    });
    it("procedural case 752: MgC2O4 with HBr", function(){
        expect(balanceEquation("MgC2O4 + HBr -> MgBr2 + H2C2O4")).toBe("MgC2O4 + 2HBr -> MgBr2 + H2C2O4");
    });
    it("procedural case 753: Co with H3PO4", function(){
        expect(balanceEquation("Co + H3PO4 -> Co3(PO4)2 + H2")).toBe("3Co + 2H3PO4 -> Co3(PO4)2 + 3H2");
    });
    it("procedural case 754: CuCO3 with HF", function(){
        expect(balanceEquation("CuCO3 + HF -> CuF2 + H2O + CO2")).toBe("CuCO3 + 2HF -> CuF2 + H2O + CO2");
    });
    it("procedural case 755: CrCl3 with CuSO4", function(){
        expect(balanceEquation("CrCl3 + CuSO4 -> Cr2(SO4)3 + CuCl2")).toBe("2CrCl3 + 3CuSO4 -> Cr2(SO4)3 + 3CuCl2");
    });
    it("procedural case 756: Cr2(C2O4)3 with HF", function(){
        expect(balanceEquation("Cr2(C2O4)3 + HF -> CrF3 + H2C2O4")).toBe("Cr2(C2O4)3 + 6HF -> 2CrF3 + 3H2C2O4");
    });
    it("procedural case 757: Na2SO4 with AgNO3", function(){
        expect(balanceEquation("Na2SO4 + AgNO3 -> Ag2SO4 + NaNO3")).toBe("Na2SO4 + 2AgNO3 -> Ag2SO4 + 2NaNO3");
    });
    it("procedural case 758: Cr2(C2O4)3 with HCl", function(){
        expect(balanceEquation("Cr2(C2O4)3 + HCl -> CrCl3 + H2C2O4")).toBe("Cr2(C2O4)3 + 6HCl -> 2CrCl3 + 3H2C2O4");
    });
    it("procedural case 759: CrCl3 with NiSO4", function(){
        expect(balanceEquation("CrCl3 + NiSO4 -> Cr2(SO4)3 + NiCl2")).toBe("2CrCl3 + 3NiSO4 -> Cr2(SO4)3 + 3NiCl2");
    });
    it("procedural case 760: Ba with H3PO4", function(){
        expect(balanceEquation("Ba + H3PO4 -> Ba3(PO4)2 + H2")).toBe("3Ba + 2H3PO4 -> Ba3(PO4)2 + 3H2");
    });
    it("procedural case 761: FeS with HF", function(){
        expect(balanceEquation("FeS + HF -> FeF2 + H2S")).toBe("FeS + 2HF -> FeF2 + H2S");
    });
    it("procedural case 762: Ba(OH)2 with H2S", function(){
        expect(balanceEquation("Ba(OH)2 + H2S -> BaS + H2O")).toBe("Ba(OH)2 + H2S -> BaS + 2H2O");
    });
    it("procedural case 763: Co(OH)2 with H2S", function(){
        expect(balanceEquation("Co(OH)2 + H2S -> CoS + H2O")).toBe("Co(OH)2 + H2S -> CoS + 2H2O");
    });
    it("procedural case 764: Li with HCl", function(){
        expect(balanceEquation("Li + HCl -> LiCl + H2")).toBe("2Li + 2HCl -> 2LiCl + H2");
    });
    it("procedural case 765: CrCl3 with MnSO4", function(){
        expect(balanceEquation("CrCl3 + MnSO4 -> Cr2(SO4)3 + MnCl2")).toBe("2CrCl3 + 3MnSO4 -> Cr2(SO4)3 + 3MnCl2");
    });
    it("procedural case 766: complete combustion of CH3OH", function(){
        expect(balanceEquation("CH3OH + O2 -> CO2 + H2O")).toBe("2CH3OH + 3O2 -> 2CO2 + 4H2O");
    });
    it("procedural case 767: Mn with HI", function(){
        expect(balanceEquation("Mn + HI -> MnI2 + H2")).toBe("Mn + 2HI -> MnI2 + H2");
    });
    it("procedural case 768: Mg(NO2)2 with HBr", function(){
        expect(balanceEquation("Mg(NO2)2 + HBr -> MgBr2 + HNO2")).toBe("Mg(NO2)2 + 2HBr -> MgBr2 + 2HNO2");
    });
    it("procedural case 769: Rb with H2S", function(){
        expect(balanceEquation("Rb + H2S -> Rb(S)2 + H2")).toBe("Rb + 2H2S -> Rb(S)2 + 2H2");
    });
    it("procedural case 770: Rb2CO3 with HCl", function(){
        expect(balanceEquation("Rb2CO3 + HCl -> RbCl + H2O + CO2")).toBe("Rb2CO3 + 2HCl -> 2RbCl + H2O + CO2");
    });
    it("procedural case 771: K with HCl", function(){
        expect(balanceEquation("K + HCl -> KCl + H2")).toBe("2K + 2HCl -> 2KCl + H2");
    });
    it("procedural case 772: Mg(NO3)2 with AgCl", function(){
        expect(balanceEquation("Mg(NO3)2 + AgCl -> AgNO3 + MgCl2")).toBe("Mg(NO3)2 + 2AgCl -> 2AgNO3 + MgCl2");
    });
    it("procedural case 773: Cr with H2CO3", function(){
        expect(balanceEquation("Cr + H2CO3 -> Cr2(CO3)3 + H2")).toBe("2Cr + 3H2CO3 -> Cr2(CO3)3 + 3H2");
    });
    it("procedural case 774: I2 with KCl", function(){
        expect(balanceEquation("I2 + KCl -> KI + Cl2")).toBe("I2 + 2KCl -> 2KI + Cl2");
    });
    it("procedural case 775: Pb(NO3)2 with KCl", function(){
        expect(balanceEquation("Pb(NO3)2 + KCl -> KNO3 + PbCl2")).toBe("Pb(NO3)2 + 2KCl -> 2KNO3 + PbCl2");
    });
    it("procedural case 776: synthesis of water", function(){
        expect(balanceEquation("H2 + O2 -> H2O")).toBe("2H2 + O2 -> 2H2O");
    });
    it("procedural case 777: Cs with H2CO3", function(){
        expect(balanceEquation("Cs + H2CO3 -> Cs(CO3)2 + H2")).toBe("Cs + 2H2CO3 -> Cs(CO3)2 + 2H2");
    });
    it("procedural case 778: Cr(NO2)3 with HI", function(){
        expect(balanceEquation("Cr(NO2)3 + HI -> CrI3 + HNO2")).toBe("Cr(NO2)3 + 3HI -> CrI3 + 3HNO2");
    });
    it("procedural case 779: AlCl3 with MgSO4", function(){
        expect(balanceEquation("AlCl3 + MgSO4 -> Al2(SO4)3 + MgCl2")).toBe("2AlCl3 + 3MgSO4 -> Al2(SO4)3 + 3MgCl2");
    });
    it("procedural case 780: Al2O3 with HBr", function(){
        expect(balanceEquation("Al2O3 + HBr -> AlBr3 + H2O")).toBe("Al2O3 + 6HBr -> 2AlBr3 + 3H2O");
    });
    it("procedural case 781: Sr(OH)2 with H2SO4", function(){
        expect(balanceEquation("Sr(OH)2 + H2SO4 -> SrSO4 + H2O")).toBe("Sr(OH)2 + H2SO4 -> SrSO4 + 2H2O");
    });
    it("procedural case 782: Na2O with HC2H3O2", function(){
        expect(balanceEquation("Na2O + HC2H3O2 -> NaC2H3O2 + H2O")).toBe("Na2O + 2HC2H3O2 -> 2NaC2H3O2 + H2O");
    });
    it("procedural case 783: Na3PO4 with AgNO3", function(){
        expect(balanceEquation("Na3PO4 + AgNO3 -> Ag3PO4 + NaNO3")).toBe("Na3PO4 + 3AgNO3 -> Ag3PO4 + 3NaNO3");
    });
    it("procedural case 784: Co with HCl", function(){
        expect(balanceEquation("Co + HCl -> CoCl2 + H2")).toBe("Co + 2HCl -> CoCl2 + H2");
    });
    it("procedural case 785: Ag with H2CO3", function(){
        expect(balanceEquation("Ag + H2CO3 -> Ag(CO3)2 + H2")).toBe("Ag + 2H2CO3 -> Ag(CO3)2 + 2H2");
    });
    it("procedural case 786: MgS with HF", function(){
        expect(balanceEquation("MgS + HF -> MgF2 + H2S")).toBe("MgS + 2HF -> MgF2 + H2S");
    });
    it("procedural case 787: Mn(OH)2 with HF", function(){
        expect(balanceEquation("Mn(OH)2 + HF -> MnF2 + H2O")).toBe("Mn(OH)2 + 2HF -> MnF2 + 2H2O");
    });
    it("procedural case 788: I2 with MgCl2", function(){
        expect(balanceEquation("I2 + MgCl2 -> MgI2 + Cl22")).toBe("11I2 + 11MgCl2 -> 11MgI2 + Cl22");
    });
    it("procedural case 789: CuCO3 with HCl", function(){
        expect(balanceEquation("CuCO3 + HCl -> CuCl2 + H2O + CO2")).toBe("CuCO3 + 2HCl -> CuCl2 + H2O + CO2");
    });
    it("procedural case 790: Pb(NO3)2 with LiCl", function(){
        expect(balanceEquation("Pb(NO3)2 + LiCl -> LiNO3 + PbCl2")).toBe("Pb(NO3)2 + 2LiCl -> 2LiNO3 + PbCl2");
    });
    it("procedural case 791: Ba(OH)2 with HBr", function(){
        expect(balanceEquation("Ba(OH)2 + HBr -> BaBr2 + H2O")).toBe("Ba(OH)2 + 2HBr -> BaBr2 + 2H2O");
    });
    it("procedural case 792: Cu(OH)2 with HBr", function(){
        expect(balanceEquation("Cu(OH)2 + HBr -> CuBr2 + H2O")).toBe("Cu(OH)2 + 2HBr -> CuBr2 + 2H2O");
    });
    it("procedural case 793: FeCl3 with Al2(SO4)3", function(){
        expect(balanceEquation("FeCl3 + Al2(SO4)3 -> Fe2(SO4)3 + AlCl3")).toBe("2FeCl3 + Al2(SO4)3 -> Fe2(SO4)3 + 2AlCl3");
    });
    it("procedural case 794: Mg(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Mg(NO3)2 + Li2SO4 -> LiNO3 + MgSO4")).toBe("Mg(NO3)2 + Li2SO4 -> 2LiNO3 + MgSO4");
    });
    it("procedural case 795: CrCl3 with CaSO4", function(){
        expect(balanceEquation("CrCl3 + CaSO4 -> Cr2(SO4)3 + CaCl2")).toBe("2CrCl3 + 3CaSO4 -> Cr2(SO4)3 + 3CaCl2");
    });
    it("procedural case 796: Fe(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Fe(NO3)2 + Rb2SO4 -> RbNO3 + FeSO4")).toBe("Fe(NO3)2 + Rb2SO4 -> 2RbNO3 + FeSO4");
    });
    it("procedural case 797: Cs2S with HI", function(){
        expect(balanceEquation("Cs2S + HI -> CsI + H2S")).toBe("Cs2S + 2HI -> 2CsI + H2S");
    });
    it("procedural case 798: Cr(NO3)3 with KCl", function(){
        expect(balanceEquation("Cr(NO3)3 + KCl -> KNO3 + CrCl3")).toBe("Cr(NO3)3 + 3KCl -> 3KNO3 + CrCl3");
    });
    it("procedural case 799: K2C2O4 with HBr", function(){
        expect(balanceEquation("K2C2O4 + HBr -> KBr + H2C2O4")).toBe("K2C2O4 + 2HBr -> 2KBr + H2C2O4");
    });
    it("procedural case 800: Co(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Co(NO2)2 + H2SO4 -> CoSO4 + HNO2")).toBe("Co(NO2)2 + H2SO4 -> CoSO4 + 2HNO2");
    });
    it("procedural case 801: Cu(NO3)2 with NaCl", function(){
        expect(balanceEquation("Cu(NO3)2 + NaCl -> NaNO3 + CuCl2")).toBe("Cu(NO3)2 + 2NaCl -> 2NaNO3 + CuCl2");
    });
    it("procedural case 802: Al with H3PO4", function(){
        expect(balanceEquation("Al + H3PO4 -> AlPO4 + H2")).toBe("2Al + 2H3PO4 -> 2AlPO4 + 3H2");
    });
    it("procedural case 803: BaS with HBr", function(){
        expect(balanceEquation("BaS + HBr -> BaBr2 + H2S")).toBe("BaS + 2HBr -> BaBr2 + H2S");
    });
    it("procedural case 804: Mn with H3PO4", function(){
        expect(balanceEquation("Mn + H3PO4 -> Mn3(PO4)2 + H2")).toBe("3Mn + 2H3PO4 -> Mn3(PO4)2 + 3H2");
    });
    it("procedural case 805: Li2O with HNO3", function(){
        expect(balanceEquation("Li2O + HNO3 -> LiNO3 + H2O")).toBe("Li2O + 2HNO3 -> 2LiNO3 + H2O");
    });
    it("procedural case 806: Co(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Co(NO3)2 + Rb2SO4 -> RbNO3 + CoSO4")).toBe("Co(NO3)2 + Rb2SO4 -> 2RbNO3 + CoSO4");
    });
    it("procedural case 807: MgO with H3PO4", function(){
        expect(balanceEquation("MgO + H3PO4 -> Mg3(PO4)2 + H2O")).toBe("3MgO + 2H3PO4 -> Mg3(PO4)2 + 3H2O");
    });
    it("procedural case 808: Mn(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Mn(NO3)2 + Rb2SO4 -> RbNO3 + MnSO4")).toBe("Mn(NO3)2 + Rb2SO4 -> 2RbNO3 + MnSO4");
    });
    it("procedural case 809: Mn with HBr", function(){
        expect(balanceEquation("Mn + HBr -> MnBr2 + H2")).toBe("Mn + 2HBr -> MnBr2 + H2");
    });
    it("procedural case 810: Ni with HBr", function(){
        expect(balanceEquation("Ni + HBr -> NiBr2 + H2")).toBe("Ni + 2HBr -> NiBr2 + H2");
    });
    it("procedural case 811: Fe(OH)2 with HI", function(){
        expect(balanceEquation("Fe(OH)2 + HI -> FeI2 + H2O")).toBe("Fe(OH)2 + 2HI -> FeI2 + 2H2O");
    });
    it("procedural case 812: SnO with HI", function(){
        expect(balanceEquation("SnO + HI -> SnI2 + H2O")).toBe("SnO + 2HI -> SnI2 + H2O");
    });
    it("procedural case 813: SrS with HF", function(){
        expect(balanceEquation("SrS + HF -> SrF2 + H2S")).toBe("SrS + 2HF -> SrF2 + H2S");
    });
    it("procedural case 814: Li2CO3 with HBr", function(){
        expect(balanceEquation("Li2CO3 + HBr -> LiBr + H2O + CO2")).toBe("Li2CO3 + 2HBr -> 2LiBr + H2O + CO2");
    });
    it("procedural case 815: Al(NO3)3 with Na2SO4", function(){
        expect(balanceEquation("Al(NO3)3 + Na2SO4 -> NaNO3 + Al2(SO4)3")).toBe("2Al(NO3)3 + 3Na2SO4 -> 6NaNO3 + Al2(SO4)3");
    });
    it("procedural case 816: FeO with HCl", function(){
        expect(balanceEquation("FeO + HCl -> FeCl2 + H2O")).toBe("FeO + 2HCl -> FeCl2 + H2O");
    });
    it("procedural case 817: Ag2C2O4 with HBr", function(){
        expect(balanceEquation("Ag2C2O4 + HBr -> AgBr + H2C2O4")).toBe("Ag2C2O4 + 2HBr -> 2AgBr + H2C2O4");
    });
    it("procedural case 818: Li with HF", function(){
        expect(balanceEquation("Li + HF -> LiF + H2")).toBe("2Li + 2HF -> 2LiF + H2");
    });
    it("procedural case 819: Ba(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Ba(NO3)2 + Na2SO4 -> NaNO3 + BaSO4")).toBe("Ba(NO3)2 + Na2SO4 -> 2NaNO3 + BaSO4");
    });
    it("procedural case 820: ZnC2O4 with HF", function(){
        expect(balanceEquation("ZnC2O4 + HF -> ZnF2 + H2C2O4")).toBe("ZnC2O4 + 2HF -> ZnF2 + H2C2O4");
    });
    it("procedural case 821: Mg(NO2)2 with HCl", function(){
        expect(balanceEquation("Mg(NO2)2 + HCl -> MgCl2 + HNO2")).toBe("Mg(NO2)2 + 2HCl -> MgCl2 + 2HNO2");
    });
    it("procedural case 822: BaS with HI", function(){
        expect(balanceEquation("BaS + HI -> BaI2 + H2S")).toBe("BaS + 2HI -> BaI2 + H2S");
    });
    it("procedural case 823: NiC2O4 with HI", function(){
        expect(balanceEquation("NiC2O4 + HI -> NiI2 + H2C2O4")).toBe("NiC2O4 + 2HI -> NiI2 + H2C2O4");
    });
    it("procedural case 824: Fe(NO2)2 with HI", function(){
        expect(balanceEquation("Fe(NO2)2 + HI -> FeI2 + HNO2")).toBe("Fe(NO2)2 + 2HI -> FeI2 + 2HNO2");
    });
    it("procedural case 825: Al with H2SO4", function(){
        expect(balanceEquation("Al + H2SO4 -> Al2(SO4)3 + H2")).toBe("2Al + 3H2SO4 -> Al2(SO4)3 + 3H2");
    });
    it("procedural case 826: Cs2CO3 with HF", function(){
        expect(balanceEquation("Cs2CO3 + HF -> CsF + H2O + CO2")).toBe("Cs2CO3 + 2HF -> 2CsF + H2O + CO2");
    });
    it("procedural case 827: Na2O with HNO3", function(){
        expect(balanceEquation("Na2O + HNO3 -> NaNO3 + H2O")).toBe("Na2O + 2HNO3 -> 2NaNO3 + H2O");
    });
    it("procedural case 828: Pb(NO3)2 with RbCl", function(){
        expect(balanceEquation("Pb(NO3)2 + RbCl -> RbNO3 + PbCl2")).toBe("Pb(NO3)2 + 2RbCl -> 2RbNO3 + PbCl2");
    });
    it("procedural case 829: Sn(NO3)2 with LiCl", function(){
        expect(balanceEquation("Sn(NO3)2 + LiCl -> LiNO3 + SnCl2")).toBe("Sn(NO3)2 + 2LiCl -> 2LiNO3 + SnCl2");
    });
    it("procedural case 830: Ba(NO3)2 with KCl", function(){
        expect(balanceEquation("Ba(NO3)2 + KCl -> KNO3 + BaCl2")).toBe("Ba(NO3)2 + 2KCl -> 2KNO3 + BaCl2");
    });
    it("procedural case 831: Ag with H2S", function(){
        expect(balanceEquation("Ag + H2S -> Ag(S)2 + H2")).toBe("Ag + 2H2S -> Ag(S)2 + 2H2");
    });
    it("procedural case 832: Zn with HI", function(){
        expect(balanceEquation("Zn + HI -> ZnI2 + H2")).toBe("Zn + 2HI -> ZnI2 + H2");
    });
    it("procedural case 833: PbCl2 with Fe2(SO4)3", function(){
        expect(balanceEquation("PbCl2 + Fe2(SO4)3 -> Pb2(SO4)3 + FeCl2")).toBe("2PbCl2 + Fe2(SO4)3 -> Pb2(SO4)3 + 2FeCl2");
    });
    it("procedural case 834: K with HI", function(){
        expect(balanceEquation("K + HI -> KI + H2")).toBe("2K + 2HI -> 2KI + H2");
    });
    it("procedural case 835: K2CO3 with HCl", function(){
        expect(balanceEquation("K2CO3 + HCl -> KCl + H2O + CO2")).toBe("K2CO3 + 2HCl -> 2KCl + H2O + CO2");
    });
    it("procedural case 836: Na with HCl", function(){
        expect(balanceEquation("Na + HCl -> NaCl + H2")).toBe("2Na + 2HCl -> 2NaCl + H2");
    });
    it("procedural case 837: Al(NO2)3 with HBr", function(){
        expect(balanceEquation("Al(NO2)3 + HBr -> AlBr3 + HNO2")).toBe("Al(NO2)3 + 3HBr -> AlBr3 + 3HNO2");
    });
    it("procedural case 838: Mn(OH)2 with H3PO4", function(){
        expect(balanceEquation("Mn(OH)2 + H3PO4 -> Mn3(PO4)2 + H2O")).toBe("3Mn(OH)2 + 2H3PO4 -> Mn3(PO4)2 + 6H2O");
    });
    it("procedural case 839: Mn(NO3)2 with NaCl", function(){
        expect(balanceEquation("Mn(NO3)2 + NaCl -> NaNO3 + MnCl2")).toBe("Mn(NO3)2 + 2NaCl -> 2NaNO3 + MnCl2");
    });
    it("procedural case 840: Pb(OH)2 with H2CO3", function(){
        expect(balanceEquation("Pb(OH)2 + H2CO3 -> PbCO3 + H2O")).toBe("Pb(OH)2 + H2CO3 -> PbCO3 + 2H2O");
    });
    it("procedural case 841: Cr2S3 with HF", function(){
        expect(balanceEquation("Cr2S3 + HF -> CrF3 + H2S")).toBe("Cr2S3 + 6HF -> 2CrF3 + 3H2S");
    });
    it("procedural case 842: Cu(NO2)2 with HCl", function(){
        expect(balanceEquation("Cu(NO2)2 + HCl -> CuCl2 + HNO2")).toBe("Cu(NO2)2 + 2HCl -> CuCl2 + 2HNO2");
    });
    it("procedural case 843: Fe with HF", function(){
        expect(balanceEquation("Fe + HF -> FeF2 + H2")).toBe("Fe + 2HF -> FeF2 + H2");
    });
    it("procedural case 844: Br2 with MgI2", function(){
        expect(balanceEquation("Br2 + MgI2 -> MgBr2 + I22")).toBe("11Br2 + 11MgI2 -> 11MgBr2 + I22");
    });
    it("procedural case 845: Br2 with MgCl2", function(){
        expect(balanceEquation("Br2 + MgCl2 -> MgBr2 + Cl22")).toBe("11Br2 + 11MgCl2 -> 11MgBr2 + Cl22");
    });
    it("procedural case 846: PbO with H3PO4", function(){
        expect(balanceEquation("PbO + H3PO4 -> Pb3(PO4)2 + H2O")).toBe("3PbO + 2H3PO4 -> Pb3(PO4)2 + 3H2O");
    });
    it("procedural case 847: Al2O3 with HF", function(){
        expect(balanceEquation("Al2O3 + HF -> AlF3 + H2O")).toBe("Al2O3 + 6HF -> 2AlF3 + 3H2O");
    });
    it("procedural case 848: CaO with H3PO4", function(){
        expect(balanceEquation("CaO + H3PO4 -> Ca3(PO4)2 + H2O")).toBe("3CaO + 2H3PO4 -> Ca3(PO4)2 + 3H2O");
    });
    it("procedural case 849: Fe(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Fe(NO3)2 + Li2SO4 -> LiNO3 + FeSO4")).toBe("Fe(NO3)2 + Li2SO4 -> 2LiNO3 + FeSO4");
    });
    it("procedural case 850: CaCO3 with HBr", function(){
        expect(balanceEquation("CaCO3 + HBr -> CaBr2 + H2O + CO2")).toBe("CaCO3 + 2HBr -> CaBr2 + H2O + CO2");
    });
    it("procedural case 851: Ni(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Ni(NO3)2 + Ag2SO4 -> AgNO3 + NiSO4")).toBe("Ni(NO3)2 + Ag2SO4 -> 2AgNO3 + NiSO4");
    });
    it("procedural case 852: complete combustion of C3H8O", function(){
        expect(balanceEquation("C3H8O + O2 -> CO2 + H2O")).toBe("2C3H8O + 9O2 -> 6CO2 + 8H2O");
    });
    it("procedural case 853: Pb with HF", function(){
        expect(balanceEquation("Pb + HF -> PbF2 + H2")).toBe("Pb + 2HF -> PbF2 + H2");
    });
    it("procedural case 854: complete combustion of C3H6", function(){
        expect(balanceEquation("C3H6 + O2 -> CO2 + H2O")).toBe("2C3H6 + 9O2 -> 6CO2 + 6H2O");
    });
    it("procedural case 855: MgO with HBr", function(){
        expect(balanceEquation("MgO + HBr -> MgBr2 + H2O")).toBe("MgO + 2HBr -> MgBr2 + H2O");
    });
    it("procedural case 856: Co with HF", function(){
        expect(balanceEquation("Co + HF -> CoF2 + H2")).toBe("Co + 2HF -> CoF2 + H2");
    });
    it("procedural case 857: Ba with HBr", function(){
        expect(balanceEquation("Ba + HBr -> BaBr2 + H2")).toBe("Ba + 2HBr -> BaBr2 + H2");
    });
    it("procedural case 858: SnO with H3PO4", function(){
        expect(balanceEquation("SnO + H3PO4 -> Sn3(PO4)2 + H2O")).toBe("3SnO + 2H3PO4 -> Sn3(PO4)2 + 3H2O");
    });
    it("procedural case 859: Pb(OH)2 with H2S", function(){
        expect(balanceEquation("Pb(OH)2 + H2S -> PbS + H2O")).toBe("Pb(OH)2 + H2S -> PbS + 2H2O");
    });
    it("procedural case 860: CuC2O4 with HCl", function(){
        expect(balanceEquation("CuC2O4 + HCl -> CuCl2 + H2C2O4")).toBe("CuC2O4 + 2HCl -> CuCl2 + H2C2O4");
    });
    it("procedural case 861: Cu(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Cu(NO3)2 + K2SO4 -> KNO3 + CuSO4")).toBe("Cu(NO3)2 + K2SO4 -> 2KNO3 + CuSO4");
    });
    it("procedural case 862: Ca(NO2)2 with HI", function(){
        expect(balanceEquation("Ca(NO2)2 + HI -> CaI2 + HNO2")).toBe("Ca(NO2)2 + 2HI -> CaI2 + 2HNO2");
    });
    it("procedural case 863: Cr(OH)3 with H2S", function(){
        expect(balanceEquation("Cr(OH)3 + H2S -> Cr2(S)3 + H2O")).toBe("2Cr(OH)3 + 3H2S -> Cr2(S)3 + 6H2O");
    });
    it("procedural case 864: Ag with H2SO4", function(){
        expect(balanceEquation("Ag + H2SO4 -> Ag(SO4)2 + H2")).toBe("Ag + 2H2SO4 -> Ag(SO4)2 + 2H2");
    });
    it("procedural case 865: Co(NO3)2 with RbCl", function(){
        expect(balanceEquation("Co(NO3)2 + RbCl -> RbNO3 + CoCl2")).toBe("Co(NO3)2 + 2RbCl -> 2RbNO3 + CoCl2");
    });
    it("procedural case 866: FeC2O4 with HBr", function(){
        expect(balanceEquation("FeC2O4 + HBr -> FeBr2 + H2C2O4")).toBe("FeC2O4 + 2HBr -> FeBr2 + H2C2O4");
    });
    it("procedural case 867: Cr(NO3)3 with NaCl", function(){
        expect(balanceEquation("Cr(NO3)3 + NaCl -> NaNO3 + CrCl3")).toBe("Cr(NO3)3 + 3NaCl -> 3NaNO3 + CrCl3");
    });
    it("procedural case 868: MnO with HI", function(){
        expect(balanceEquation("MnO + HI -> MnI2 + H2O")).toBe("MnO + 2HI -> MnI2 + H2O");
    });
    it("procedural case 869: Cr2O3 with H2SO4", function(){
        expect(balanceEquation("Cr2O3 + H2SO4 -> Cr2(SO4)3 + H2O")).toBe("Cr2O3 + 3H2SO4 -> Cr2(SO4)3 + 3H2O");
    });
    it("procedural case 870: Br2 with KI", function(){
        expect(balanceEquation("Br2 + KI -> KBr + I2")).toBe("Br2 + 2KI -> 2KBr + I2");
    });
    it("procedural case 871: Sn with H3PO4", function(){
        expect(balanceEquation("Sn + H3PO4 -> Sn3(PO4)2 + H2")).toBe("3Sn + 2H3PO4 -> Sn3(PO4)2 + 3H2");
    });
    it("procedural case 872: decomposition of sodium nitrate", function(){
        expect(balanceEquation("NaNO3 -> NaNO2 + O2")).toBe("2NaNO3 -> 2NaNO2 + O2");
    });
    it("procedural case 873: Al(NO3)3 with AgCl", function(){
        expect(balanceEquation("Al(NO3)3 + AgCl -> AgNO3 + AlCl3")).toBe("Al(NO3)3 + 3AgCl -> 3AgNO3 + AlCl3");
    });
    it("procedural case 874: Cr2O3 with HI", function(){
        expect(balanceEquation("Cr2O3 + HI -> CrI3 + H2O")).toBe("Cr2O3 + 6HI -> 2CrI3 + 3H2O");
    });
    it("procedural case 875: PbCO3 with HCl", function(){
        expect(balanceEquation("PbCO3 + HCl -> PbCl2 + H2O + CO2")).toBe("PbCO3 + 2HCl -> PbCl2 + H2O + CO2");
    });
    it("procedural case 876: Mg(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Mg(NO3)2 + Ag2SO4 -> AgNO3 + MgSO4")).toBe("Mg(NO3)2 + Ag2SO4 -> 2AgNO3 + MgSO4");
    });
    it("procedural case 877: Mn(NO2)2 with H2SO4", function(){
        expect(balanceEquation("Mn(NO2)2 + H2SO4 -> MnSO4 + HNO2")).toBe("Mn(NO2)2 + H2SO4 -> MnSO4 + 2HNO2");
    });
    it("procedural case 878: Cu(NO3)2 with AgCl", function(){
        expect(balanceEquation("Cu(NO3)2 + AgCl -> AgNO3 + CuCl2")).toBe("Cu(NO3)2 + 2AgCl -> 2AgNO3 + CuCl2");
    });
    it("procedural case 879: Ni(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Ni(NO3)2 + K2SO4 -> KNO3 + NiSO4")).toBe("Ni(NO3)2 + K2SO4 -> 2KNO3 + NiSO4");
    });
    it("procedural case 880: Ca(NO2)2 with HCl", function(){
        expect(balanceEquation("Ca(NO2)2 + HCl -> CaCl2 + HNO2")).toBe("Ca(NO2)2 + 2HCl -> CaCl2 + 2HNO2");
    });
    it("procedural case 881: F2 with NaI", function(){
        expect(balanceEquation("F2 + NaI -> NaF + I2")).toBe("F2 + 2NaI -> 2NaF + I2");
    });
    it("procedural case 882: AlCl3 with CuSO4", function(){
        expect(balanceEquation("AlCl3 + CuSO4 -> Al2(SO4)3 + CuCl2")).toBe("2AlCl3 + 3CuSO4 -> Al2(SO4)3 + 3CuCl2");
    });
    it("procedural case 883: Zn(NO3)2 with AgCl", function(){
        expect(balanceEquation("Zn(NO3)2 + AgCl -> AgNO3 + ZnCl2")).toBe("Zn(NO3)2 + 2AgCl -> 2AgNO3 + ZnCl2");
    });
    it("procedural case 884: Cs with HCl", function(){
        expect(balanceEquation("Cs + HCl -> CsCl + H2")).toBe("2Cs + 2HCl -> 2CsCl + H2");
    });
    it("procedural case 885: FeS with HCl", function(){
        expect(balanceEquation("FeS + HCl -> FeCl2 + H2S")).toBe("FeS + 2HCl -> FeCl2 + H2S");
    });
    it("procedural case 886: Zn(NO3)2 with Ag2SO4", function(){
        expect(balanceEquation("Zn(NO3)2 + Ag2SO4 -> AgNO3 + ZnSO4")).toBe("Zn(NO3)2 + Ag2SO4 -> 2AgNO3 + ZnSO4");
    });
    it("procedural case 887: SnC2O4 with HCl", function(){
        expect(balanceEquation("SnC2O4 + HCl -> SnCl2 + H2C2O4")).toBe("SnC2O4 + 2HCl -> SnCl2 + H2C2O4");
    });
    it("procedural case 888: Ag2S with HF", function(){
        expect(balanceEquation("Ag2S + HF -> AgF + H2S")).toBe("Ag2S + 2HF -> 2AgF + H2S");
    });
    it("procedural case 889: Ba(NO3)2 with LiCl", function(){
        expect(balanceEquation("Ba(NO3)2 + LiCl -> LiNO3 + BaCl2")).toBe("Ba(NO3)2 + 2LiCl -> 2LiNO3 + BaCl2");
    });
    it("procedural case 890: complete combustion of C5H10", function(){
        expect(balanceEquation("C5H10 + O2 -> CO2 + H2O")).toBe("2C5H10 + 15O2 -> 10CO2 + 10H2O");
    });
    it("procedural case 891: Sr with H3PO4", function(){
        expect(balanceEquation("Sr + H3PO4 -> Sr3(PO4)2 + H2")).toBe("3Sr + 2H3PO4 -> Sr3(PO4)2 + 3H2");
    });
    it("procedural case 892: Co(NO3)2 with AgCl", function(){
        expect(balanceEquation("Co(NO3)2 + AgCl -> AgNO3 + CoCl2")).toBe("Co(NO3)2 + 2AgCl -> 2AgNO3 + CoCl2");
    });
    it("procedural case 893: Ca(OH)2 with H3PO4", function(){
        expect(balanceEquation("Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O")).toBe("3Ca(OH)2 + 2H3PO4 -> Ca3(PO4)2 + 6H2O");
    });
    it("procedural case 894: CoCO3 with H3PO4", function(){
        expect(balanceEquation("CoCO3 + H3PO4 -> Co3(PO4)2 + H2O + CO2")).toBe("3CoCO3 + 2H3PO4 -> Co3(PO4)2 + 3H2O + 3CO2");
    });
    it("procedural case 895: I2 with MgI2", function(){
        expect(balanceEquation("I2 + MgI2 -> MgI2 + I22")).toBe("11I2 + MgI2 -> MgI2 + I22");
    });
    it("procedural case 896: Ag with HNO3", function(){
        expect(balanceEquation("Ag + HNO3 -> AgNO3 + H2")).toBe("2Ag + 2HNO3 -> 2AgNO3 + H2");
    });
    it("procedural case 897: MgO with HI", function(){
        expect(balanceEquation("MgO + HI -> MgI2 + H2O")).toBe("MgO + 2HI -> MgI2 + H2O");
    });
    it("procedural case 898: Cl2 with KI", function(){
        expect(balanceEquation("Cl2 + KI -> KCl + I2")).toBe("Cl2 + 2KI -> 2KCl + I2");
    });
    it("procedural case 899: Al(NO2)3 with HCl", function(){
        expect(balanceEquation("Al(NO2)3 + HCl -> AlCl3 + HNO2")).toBe("Al(NO2)3 + 3HCl -> AlCl3 + 3HNO2");
    });
    it("procedural case 900: complete combustion of C8H18", function(){
        expect(balanceEquation("C8H18 + O2 -> CO2 + H2O")).toBe("2C8H18 + 25O2 -> 16CO2 + 18H2O");
    });
    it("procedural case 901: Li2CO3 with HNO3", function(){
        expect(balanceEquation("Li2CO3 + HNO3 -> LiNO3 + H2O + CO2")).toBe("Li2CO3 + 2HNO3 -> 2LiNO3 + H2O + CO2");
    });
    it("procedural case 902: SnS with HCl", function(){
        expect(balanceEquation("SnS + HCl -> SnCl2 + H2S")).toBe("SnS + 2HCl -> SnCl2 + H2S");
    });
    it("procedural case 903: NiC2O4 with HCl", function(){
        expect(balanceEquation("NiC2O4 + HCl -> NiCl2 + H2C2O4")).toBe("NiC2O4 + 2HCl -> NiCl2 + H2C2O4");
    });
    it("procedural case 904: FeCO3 with HI", function(){
        expect(balanceEquation("FeCO3 + HI -> FeI2 + H2O + CO2")).toBe("FeCO3 + 2HI -> FeI2 + H2O + CO2");
    });
    it("procedural case 905: Mn(OH)2 with H2SO4", function(){
        expect(balanceEquation("Mn(OH)2 + H2SO4 -> MnSO4 + H2O")).toBe("Mn(OH)2 + H2SO4 -> MnSO4 + 2H2O");
    });
    it("procedural case 906: CaC2O4 with HI", function(){
        expect(balanceEquation("CaC2O4 + HI -> CaI2 + H2C2O4")).toBe("CaC2O4 + 2HI -> CaI2 + H2C2O4");
    });
    it("procedural case 907: Cr2O3 with HCl", function(){
        expect(balanceEquation("Cr2O3 + HCl -> CrCl3 + H2O")).toBe("Cr2O3 + 6HCl -> 2CrCl3 + 3H2O");
    });
    it("procedural case 908: Ca(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Ca(NO3)2 + K2SO4 -> KNO3 + CaSO4")).toBe("Ca(NO3)2 + K2SO4 -> 2KNO3 + CaSO4");
    });
    it("procedural case 909: I2 with CaBr2", function(){
        expect(balanceEquation("I2 + CaBr2 -> CaI2 + Br22")).toBe("11I2 + 11CaBr2 -> 11CaI2 + Br22");
    });
    it("procedural case 910: Al(OH)3 with HCl", function(){
        expect(balanceEquation("Al(OH)3 + HCl -> AlCl3 + H2O")).toBe("Al(OH)3 + 3HCl -> AlCl3 + 3H2O");
    });
    it("procedural case 911: Sn(OH)2 with H3PO4", function(){
        expect(balanceEquation("Sn(OH)2 + H3PO4 -> Sn3(PO4)2 + H2O")).toBe("3Sn(OH)2 + 2H3PO4 -> Sn3(PO4)2 + 6H2O");
    });
    it("procedural case 912: Sn(NO3)2 with NaCl", function(){
        expect(balanceEquation("Sn(NO3)2 + NaCl -> NaNO3 + SnCl2")).toBe("Sn(NO3)2 + 2NaCl -> 2NaNO3 + SnCl2");
    });
    it("procedural case 913: MnO with HF", function(){
        expect(balanceEquation("MnO + HF -> MnF2 + H2O")).toBe("MnO + 2HF -> MnF2 + H2O");
    });
    it("procedural case 914: Zn(OH)2 with H2CO3", function(){
        expect(balanceEquation("Zn(OH)2 + H2CO3 -> ZnCO3 + H2O")).toBe("Zn(OH)2 + H2CO3 -> ZnCO3 + 2H2O");
    });
    it("procedural case 915: ZnCO3 with HI", function(){
        expect(balanceEquation("ZnCO3 + HI -> ZnI2 + H2O + CO2")).toBe("ZnCO3 + 2HI -> ZnI2 + H2O + CO2");
    });
    it("procedural case 916: Cl2 with AlI3", function(){
        expect(balanceEquation("Cl2 + AlI3 -> AlCl3 + I32")).toBe("48Cl2 + 32AlI3 -> 32AlCl3 + 3I32");
    });
    it("procedural case 917: Li with HNO3", function(){
        expect(balanceEquation("Li + HNO3 -> LiNO3 + H2")).toBe("2Li + 2HNO3 -> 2LiNO3 + H2");
    });
    it("procedural case 918: Sn(OH)2 with HF", function(){
        expect(balanceEquation("Sn(OH)2 + HF -> SnF2 + H2O")).toBe("Sn(OH)2 + 2HF -> SnF2 + 2H2O");
    });
    it("procedural case 919: CoS with HBr", function(){
        expect(balanceEquation("CoS + HBr -> CoBr2 + H2S")).toBe("CoS + 2HBr -> CoBr2 + H2S");
    });
    it("procedural case 920: MgS with HBr", function(){
        expect(balanceEquation("MgS + HBr -> MgBr2 + H2S")).toBe("MgS + 2HBr -> MgBr2 + H2S");
    });
    it("procedural case 921: CrCl3 with Na2SO4", function(){
        expect(balanceEquation("CrCl3 + Na2SO4 -> Cr2(2SO4)3 + NaCl")).toBe("2CrCl3 + 3Na2SO4 -> Cr2(2SO4)3 + 6NaCl");
    });
    it("procedural case 922: Ba with HCl", function(){
        expect(balanceEquation("Ba + HCl -> BaCl2 + H2")).toBe("Ba + 2HCl -> BaCl2 + H2");
    });
    it("procedural case 923: Mg(NO3)2 with LiCl", function(){
        expect(balanceEquation("Mg(NO3)2 + LiCl -> LiNO3 + MgCl2")).toBe("Mg(NO3)2 + 2LiCl -> 2LiNO3 + MgCl2");
    });
    it("procedural case 924: CrCl3 with Rb2SO4", function(){
        expect(balanceEquation("CrCl3 + Rb2SO4 -> Cr2(2SO4)3 + RbCl")).toBe("2CrCl3 + 3Rb2SO4 -> Cr2(2SO4)3 + 6RbCl");
    });
    it("procedural case 925: MnC2O4 with HBr", function(){
        expect(balanceEquation("MnC2O4 + HBr -> MnBr2 + H2C2O4")).toBe("MnC2O4 + 2HBr -> MnBr2 + H2C2O4");
    });
    it("procedural case 926: F2 with CaI2", function(){
        expect(balanceEquation("F2 + CaI2 -> CaF2 + I22")).toBe("11F2 + 11CaI2 -> 11CaF2 + I22");
    });
    it("procedural case 927: Co(NO3)2 with KCl", function(){
        expect(balanceEquation("Co(NO3)2 + KCl -> KNO3 + CoCl2")).toBe("Co(NO3)2 + 2KCl -> 2KNO3 + CoCl2");
    });
    it("procedural case 928: Ca(NO3)2 with RbCl", function(){
        expect(balanceEquation("Ca(NO3)2 + RbCl -> RbNO3 + CaCl2")).toBe("Ca(NO3)2 + 2RbCl -> 2RbNO3 + CaCl2");
    });
    it("procedural case 929: complete combustion of C5H12", function(){
        expect(balanceEquation("C5H12 + O2 -> CO2 + H2O")).toBe("C5H12 + 8O2 -> 5CO2 + 6H2O");
    });
    it("procedural case 930: Ag with HF", function(){
        expect(balanceEquation("Ag + HF -> AgF + H2")).toBe("2Ag + 2HF -> 2AgF + H2");
    });
    it("procedural case 931: Co(OH)2 with HF", function(){
        expect(balanceEquation("Co(OH)2 + HF -> CoF2 + H2O")).toBe("Co(OH)2 + 2HF -> CoF2 + 2H2O");
    });
    it("procedural case 932: FeO with HF", function(){
        expect(balanceEquation("FeO + HF -> FeF2 + H2O")).toBe("FeO + 2HF -> FeF2 + H2O");
    });
    it("procedural case 933: Al2(C2O4)3 with HF", function(){
        expect(balanceEquation("Al2(C2O4)3 + HF -> AlF3 + H2C2O4")).toBe("Al2(C2O4)3 + 6HF -> 2AlF3 + 3H2C2O4");
    });
    it("procedural case 934: Sr(NO3)2 with Na2SO4", function(){
        expect(balanceEquation("Sr(NO3)2 + Na2SO4 -> NaNO3 + SrSO4")).toBe("Sr(NO3)2 + Na2SO4 -> 2NaNO3 + SrSO4");
    });
    it("procedural case 935: Na2C2O4 with HCl", function(){
        expect(balanceEquation("Na2C2O4 + HCl -> NaCl + H2C2O4")).toBe("Na2C2O4 + 2HCl -> 2NaCl + H2C2O4");
    });
    it("procedural case 936: Al with HF", function(){
        expect(balanceEquation("Al + HF -> AlF3 + H2")).toBe("2Al + 6HF -> 2AlF3 + 3H2");
    });
    it("procedural case 937: Cr2O3 with H2S", function(){
        expect(balanceEquation("Cr2O3 + H2S -> Cr2(S)3 + H2O")).toBe("Cr2O3 + 3H2S -> Cr2(S)3 + 3H2O");
    });
    it("procedural case 938: Zn(OH)2 with HCl", function(){
        expect(balanceEquation("Zn(OH)2 + HCl -> ZnCl2 + H2O")).toBe("Zn(OH)2 + 2HCl -> ZnCl2 + 2H2O");
    });
    it("procedural case 939: Cs2C2O4 with HF", function(){
        expect(balanceEquation("Cs2C2O4 + HF -> CsF + H2C2O4")).toBe("Cs2C2O4 + 2HF -> 2CsF + H2C2O4");
    });
    it("procedural case 940: Sr(OH)2 with HF", function(){
        expect(balanceEquation("Sr(OH)2 + HF -> SrF2 + H2O")).toBe("Sr(OH)2 + 2HF -> SrF2 + 2H2O");
    });
    it("procedural case 941: decomposition of hydrogen peroxide", function(){
        expect(balanceEquation("H2O2 -> H2O + O2")).toBe("2H2O2 -> 2H2O + O2");
    });
    it("procedural case 942: Sn(NO2)2 with HCl", function(){
        expect(balanceEquation("Sn(NO2)2 + HCl -> SnCl2 + HNO2")).toBe("Sn(NO2)2 + 2HCl -> SnCl2 + 2HNO2");
    });
    it("procedural case 943: Mg(NO3)2 with KCl", function(){
        expect(balanceEquation("Mg(NO3)2 + KCl -> KNO3 + MgCl2")).toBe("Mg(NO3)2 + 2KCl -> 2KNO3 + MgCl2");
    });
    it("procedural case 944: MnS with HCl", function(){
        expect(balanceEquation("MnS + HCl -> MnCl2 + H2S")).toBe("MnS + 2HCl -> MnCl2 + H2S");
    });
    it("procedural case 945: NiCO3 with HCl", function(){
        expect(balanceEquation("NiCO3 + HCl -> NiCl2 + H2O + CO2")).toBe("NiCO3 + 2HCl -> NiCl2 + H2O + CO2");
    });
    it("procedural case 946: Br2 with NaI", function(){
        expect(balanceEquation("Br2 + NaI -> NaBr + I2")).toBe("Br2 + 2NaI -> 2NaBr + I2");
    });
    it("procedural case 947: Br2 with AlF3", function(){
        expect(balanceEquation("Br2 + AlF3 -> AlBr3 + F32")).toBe("48Br2 + 32AlF3 -> 32AlBr3 + 3F32");
    });
    it("procedural case 948: MgO with HCl", function(){
        expect(balanceEquation("MgO + HCl -> MgCl2 + H2O")).toBe("MgO + 2HCl -> MgCl2 + H2O");
    });
    it("procedural case 949: Mn(NO2)2 with HCl", function(){
        expect(balanceEquation("Mn(NO2)2 + HCl -> MnCl2 + HNO2")).toBe("Mn(NO2)2 + 2HCl -> MnCl2 + 2HNO2");
    });
    it("procedural case 950: NiC2O4 with HF", function(){
        expect(balanceEquation("NiC2O4 + HF -> NiF2 + H2C2O4")).toBe("NiC2O4 + 2HF -> NiF2 + H2C2O4");
    });
    it("procedural case 951: K2O with HCl", function(){
        expect(balanceEquation("K2O + HCl -> KCl + H2O")).toBe("K2O + 2HCl -> 2KCl + H2O");
    });
    it("procedural case 952: PbS with HF", function(){
        expect(balanceEquation("PbS + HF -> PbF2 + H2S")).toBe("PbS + 2HF -> PbF2 + H2S");
    });
    it("procedural case 953: Sr(NO3)2 with KCl", function(){
        expect(balanceEquation("Sr(NO3)2 + KCl -> KNO3 + SrCl2")).toBe("Sr(NO3)2 + 2KCl -> 2KNO3 + SrCl2");
    });
    it("procedural case 954: Co with HBr", function(){
        expect(balanceEquation("Co + HBr -> CoBr2 + H2")).toBe("Co + 2HBr -> CoBr2 + H2");
    });
    it("procedural case 955: SrCO3 with HBr", function(){
        expect(balanceEquation("SrCO3 + HBr -> SrBr2 + H2O + CO2")).toBe("SrCO3 + 2HBr -> SrBr2 + H2O + CO2");
    });
    it("procedural case 956: BaCO3 with HBr", function(){
        expect(balanceEquation("BaCO3 + HBr -> BaBr2 + H2O + CO2")).toBe("BaCO3 + 2HBr -> BaBr2 + H2O + CO2");
    });
    it("procedural case 957: Ca(NO2)2 with HBr", function(){
        expect(balanceEquation("Ca(NO2)2 + HBr -> CaBr2 + HNO2")).toBe("Ca(NO2)2 + 2HBr -> CaBr2 + 2HNO2");
    });
    it("procedural case 958: K2S with HBr", function(){
        expect(balanceEquation("K2S + HBr -> KBr + H2S")).toBe("K2S + 2HBr -> 2KBr + H2S");
    });
    it("procedural case 959: Mn(NO3)2 with Li2SO4", function(){
        expect(balanceEquation("Mn(NO3)2 + Li2SO4 -> LiNO3 + MnSO4")).toBe("Mn(NO3)2 + Li2SO4 -> 2LiNO3 + MnSO4");
    });
    it("procedural case 960: K2C2O4 with HCl", function(){
        expect(balanceEquation("K2C2O4 + HCl -> KCl + H2C2O4")).toBe("K2C2O4 + 2HCl -> 2KCl + H2C2O4");
    });
    it("procedural case 961: K2C2O4 with HF", function(){
        expect(balanceEquation("K2C2O4 + HF -> KF + H2C2O4")).toBe("K2C2O4 + 2HF -> 2KF + H2C2O4");
    });
    it("procedural case 962: Cr with HCl", function(){
        expect(balanceEquation("Cr + HCl -> CrCl3 + H2")).toBe("2Cr + 6HCl -> 2CrCl3 + 3H2");
    });
    it("procedural case 963: K2C2O4 with HNO3", function(){
        expect(balanceEquation("K2C2O4 + HNO3 -> KNO3 + H2C2O4")).toBe("K2C2O4 + 2HNO3 -> 2KNO3 + H2C2O4");
    });
    it("procedural case 964: NiS with HI", function(){
        expect(balanceEquation("NiS + HI -> NiI2 + H2S")).toBe("NiS + 2HI -> NiI2 + H2S");
    });
    it("procedural case 965: Na2C2O4 with HBr", function(){
        expect(balanceEquation("Na2C2O4 + HBr -> NaBr + H2C2O4")).toBe("Na2C2O4 + 2HBr -> 2NaBr + H2C2O4");
    });
    it("procedural case 966: Ni(OH)2 with HBr", function(){
        expect(balanceEquation("Ni(OH)2 + HBr -> NiBr2 + H2O")).toBe("Ni(OH)2 + 2HBr -> NiBr2 + 2H2O");
    });
    it("procedural case 967: Sr(OH)2 with HI", function(){
        expect(balanceEquation("Sr(OH)2 + HI -> SrI2 + H2O")).toBe("Sr(OH)2 + 2HI -> SrI2 + 2H2O");
    });
    it("procedural case 968: Cs2CO3 with HNO3", function(){
        expect(balanceEquation("Cs2CO3 + HNO3 -> CsNO3 + H2O + CO2")).toBe("Cs2CO3 + 2HNO3 -> 2CsNO3 + H2O + CO2");
    });
    it("procedural case 969: ZnO with H3PO4", function(){
        expect(balanceEquation("ZnO + H3PO4 -> Zn3(PO4)2 + H2O")).toBe("3ZnO + 2H3PO4 -> Zn3(PO4)2 + 3H2O");
    });
    it("procedural case 970: Sr(NO3)2 with K2SO4", function(){
        expect(balanceEquation("Sr(NO3)2 + K2SO4 -> KNO3 + SrSO4")).toBe("Sr(NO3)2 + K2SO4 -> 2KNO3 + SrSO4");
    });
    it("procedural case 971: Li2S with HF", function(){
        expect(balanceEquation("Li2S + HF -> LiF + H2S")).toBe("Li2S + 2HF -> 2LiF + H2S");
    });
    it("procedural case 972: Cr2(C2O4)3 with H2SO4", function(){
        expect(balanceEquation("Cr2(C2O4)3 + H2SO4 -> Cr2(SO4)3 + H2C2O4")).toBe("Cr2(C2O4)3 + 3H2SO4 -> Cr2(SO4)3 + 3H2C2O4");
    });
    it("procedural case 973: Cs with H2SO4", function(){
        expect(balanceEquation("Cs + H2SO4 -> Cs(SO4)2 + H2")).toBe("Cs + 2H2SO4 -> Cs(SO4)2 + 2H2");
    });
    it("procedural case 974: Cu(NO3)2 with KCl", function(){
        expect(balanceEquation("Cu(NO3)2 + KCl -> KNO3 + CuCl2")).toBe("Cu(NO3)2 + 2KCl -> 2KNO3 + CuCl2");
    });
    it("procedural case 975: Fe(OH)2 with H2CO3", function(){
        expect(balanceEquation("Fe(OH)2 + H2CO3 -> FeCO3 + H2O")).toBe("Fe(OH)2 + H2CO3 -> FeCO3 + 2H2O");
    });
    it("procedural case 976: ZnCO3 with H3PO4", function(){
        expect(balanceEquation("ZnCO3 + H3PO4 -> Zn3(PO4)2 + H2O + CO2")).toBe("3ZnCO3 + 2H3PO4 -> Zn3(PO4)2 + 3H2O + 3CO2");
    });
    it("procedural case 977: Mg(OH)2 with HCl", function(){
        expect(balanceEquation("Mg(OH)2 + HCl -> MgCl2 + H2O")).toBe("Mg(OH)2 + 2HCl -> MgCl2 + 2H2O");
    });
    it("procedural case 978: Mg(OH)2 with H2S", function(){
        expect(balanceEquation("Mg(OH)2 + H2S -> MgS + H2O")).toBe("Mg(OH)2 + H2S -> MgS + 2H2O");
    });
    it("procedural case 979: CaCl2 with Fe2(SO4)3", function(){
        expect(balanceEquation("CaCl2 + Fe2(SO4)3 -> Ca2(SO4)3 + FeCl2")).toBe("2CaCl2 + Fe2(SO4)3 -> Ca2(SO4)3 + 2FeCl2");
    });
    it("procedural case 980: Br2 with AlBr3", function(){
        expect(balanceEquation("Br2 + AlBr3 -> AlBr3 + Br32")).toBe("16Br2 + AlBr3 -> AlBr3 + Br32");
    });
    it("procedural case 981: Rb2C2O4 with HBr", function(){
        expect(balanceEquation("Rb2C2O4 + HBr -> RbBr + H2C2O4")).toBe("Rb2C2O4 + 2HBr -> 2RbBr + H2C2O4");
    });
    it("procedural case 982: Sr with HI", function(){
        expect(balanceEquation("Sr + HI -> SrI2 + H2")).toBe("Sr + 2HI -> SrI2 + H2");
    });
    it("procedural case 983: Cr2O3 with HF", function(){
        expect(balanceEquation("Cr2O3 + HF -> CrF3 + H2O")).toBe("Cr2O3 + 6HF -> 2CrF3 + 3H2O");
    });
    it("procedural case 984: BaO with HI", function(){
        expect(balanceEquation("BaO + HI -> BaI2 + H2O")).toBe("BaO + 2HI -> BaI2 + H2O");
    });
    it("procedural case 985: Na2O with HBr", function(){
        expect(balanceEquation("Na2O + HBr -> NaBr + H2O")).toBe("Na2O + 2HBr -> 2NaBr + H2O");
    });
    it("procedural case 986: Cr(NO3)3 with LiCl", function(){
        expect(balanceEquation("Cr(NO3)3 + LiCl -> LiNO3 + CrCl3")).toBe("Cr(NO3)3 + 3LiCl -> 3LiNO3 + CrCl3");
    });
    it("procedural case 987: I2 with MgF2", function(){
        expect(balanceEquation("I2 + MgF2 -> MgI2 + F22")).toBe("11I2 + 11MgF2 -> 11MgI2 + F22");
    });
    it("procedural case 988: F2 with MgBr2", function(){
        expect(balanceEquation("F2 + MgBr2 -> MgF2 + Br22")).toBe("11F2 + 11MgBr2 -> 11MgF2 + Br22");
    });
    it("procedural case 989: ZnO with HI", function(){
        expect(balanceEquation("ZnO + HI -> ZnI2 + H2O")).toBe("ZnO + 2HI -> ZnI2 + H2O");
    });
    it("procedural case 990: Cr(NO3)3 with Rb2SO4", function(){
        expect(balanceEquation("Cr(NO3)3 + Rb2SO4 -> RbNO3 + Cr2(SO4)3")).toBe("2Cr(NO3)3 + 3Rb2SO4 -> 6RbNO3 + Cr2(SO4)3");
    });
    it("procedural case 991: K2CO3 with HC2H3O2", function(){
        expect(balanceEquation("K2CO3 + HC2H3O2 -> KC2H3O2 + H2O + CO2")).toBe("K2CO3 + 2HC2H3O2 -> 2KC2H3O2 + H2O + CO2");
    });
    it("procedural case 992: Sn(NO3)2 with RbCl", function(){
        expect(balanceEquation("Sn(NO3)2 + RbCl -> RbNO3 + SnCl2")).toBe("Sn(NO3)2 + 2RbCl -> 2RbNO3 + SnCl2");
    });
    it("procedural case 993: Zn(NO3)2 with Rb2SO4", function(){
        expect(balanceEquation("Zn(NO3)2 + Rb2SO4 -> RbNO3 + ZnSO4")).toBe("Zn(NO3)2 + Rb2SO4 -> 2RbNO3 + ZnSO4");
    });
    it("procedural case 994: Al(NO3)3 with LiCl", function(){
        expect(balanceEquation("Al(NO3)3 + LiCl -> LiNO3 + AlCl3")).toBe("Al(NO3)3 + 3LiCl -> 3LiNO3 + AlCl3");
    });
    it("procedural case 995: CoCl2 with Fe2(SO4)3", function(){
        expect(balanceEquation("CoCl2 + Fe2(SO4)3 -> Co2(SO4)3 + FeCl2")).toBe("2CoCl2 + Fe2(SO4)3 -> Co2(SO4)3 + 2FeCl2");
    });
    it("procedural case 996: Li2S with HNO3", function(){
        expect(balanceEquation("Li2S + HNO3 -> LiNO3 + H2S")).toBe("Li2S + 2HNO3 -> 2LiNO3 + H2S");
    });
});


