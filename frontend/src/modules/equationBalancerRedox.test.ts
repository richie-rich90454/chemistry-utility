import {describe, it, expect} from "vitest";
import {balanceRedox} from "./equationBalancer.js";
describe("acidic redox balancing via half-reaction method", function(){
    it("balances hydrogen peroxide with permanganate", function(){
        expect(balanceRedox("H2O2 -> O2 || MnO4- -> Mn2+", "acidic")).toBe("5H2O2 + 2MnO4- + 6H+ -> 5O2 + 2Mn2+ + 8H2O");
    });
    it("balances permanganate with iron(II)", function(){
        expect(balanceRedox("MnO4- -> Mn2+ || Fe2+ -> Fe3+", "acidic")).toBe("MnO4- + 5Fe2+ + 8H+ -> Mn2+ + 5Fe3+ + 4H2O");
    });
    it("balances dichromate with iron(II)", function(){
        expect(balanceRedox("Cr2O7^2- -> Cr3+ || Fe2+ -> Fe3+", "acidic")).toBe("Cr2O7^2- + 6Fe2+ + 14H+ -> 2Cr3+ + 6Fe3+ + 7H2O");
    });
    it("balances halogen displacement chlorine and iodide", function(){
        expect(balanceRedox("Cl2 -> Cl- || I- -> I2", "acidic")).toBe("Cl2 + 2I- -> 2Cl- + I2");
    });
    it("balances zinc with copper(II)", function(){
        expect(balanceRedox("Zn -> Zn2+ || Cu2+ -> Cu", "acidic")).toBe("Zn + Cu2+ -> Zn2+ + Cu");
    });
    it("balances permanganate with oxalate", function(){
        expect(balanceRedox("MnO4- -> Mn2+ || C2O4^2- -> CO2", "acidic")).toBe("2MnO4- + 5C2O4^2- + 16H+ -> 2Mn2+ + 10CO2 + 8H2O");
    });
    it("balances nitrate with copper", function(){
        expect(balanceRedox("NO3- -> NO || Cu -> Cu2+", "acidic")).toBe("2NO3- + 3Cu + 8H+ -> 2NO + 3Cu2+ + 4H2O");
    });
    it("balances hydrogen sulfide with iron(III)", function(){
        expect(balanceRedox("H2S -> S || Fe3+ -> Fe2+", "acidic")).toBe("H2S + 2Fe3+ -> S + 2Fe2+ + 2H+");
    });
    it("balances sulfur dioxide with hydrogen sulfide comproportionation", function(){
        expect(balanceRedox("SO2 -> S || H2S -> S", "acidic")).toBe("SO2 + 2H2S -> 3S + 2H2O");
    });
    it("balances silver with copper", function(){
        expect(balanceRedox("Ag+ -> Ag || Cu -> Cu2+", "acidic")).toBe("2Ag+ + Cu -> 2Ag + Cu2+");
    });
    it("balances magnesium with hydrochloric acid", function(){
        expect(balanceRedox("Mg -> Mg2+ || H+ -> H2", "acidic")).toBe("Mg + 2H+ -> Mg2+ + H2");
    });
    it("balances aluminum with copper(II)", function(){
        expect(balanceRedox("Al -> Al3+ || Cu2+ -> Cu", "acidic")).toBe("2Al + 3Cu2+ -> 2Al3+ + 3Cu");
    });
    it("balances tin with silver", function(){
        expect(balanceRedox("Sn -> Sn2+ || Ag+ -> Ag", "acidic")).toBe("Sn + 2Ag+ -> Sn2+ + 2Ag");
    });
    it("balances iron with copper(II)", function(){
        expect(balanceRedox("Fe -> Fe2+ || Cu2+ -> Cu", "acidic")).toBe("Fe + Cu2+ -> Fe2+ + Cu");
    });
    it("balances dichromate with chloride", function(){
        expect(balanceRedox("Cr2O7^2- -> Cr3+ || Cl- -> Cl2", "acidic")).toBe("Cr2O7^2- + 6Cl- + 14H+ -> 2Cr3+ + 3Cl2 + 7H2O");
    });
});
describe("basic redox balancing via half-reaction method", function(){
    it("balances permanganate with iodide in base", function(){
        expect(balanceRedox("MnO4- -> MnO2 || I- -> I2", "basic")).toBe("2MnO4- + 6I- + 4H2O -> 2MnO2 + 3I2 + 8OH-");
    });
    it("balances aluminum with hydroxide producing aluminate and hydrogen", function(){
        expect(balanceRedox("Al -> AlO2- || H2O -> H2", "basic")).toBe("2Al + 2OH- + 2H2O -> 2AlO2- + 3H2");
    });
    it("balances chlorine with oxygen in base", function(){
        expect(balanceRedox("Cl2 -> Cl- || O2 -> OH-", "basic")).toBe("2Cl2 + O2 + 2H2O -> 4Cl- + 4OH-");
    });
    it("balances permanganate with sulfite in base", function(){
        expect(balanceRedox("MnO4- -> MnO4^2- || SO3^2- -> SO4^2-", "basic")).toBe("2MnO4- + SO3^2- + 2OH- -> 2MnO4^2- + SO4^2- + H2O");
    });
    it("balances zinc with water in base producing zincate and hydrogen", function(){
        expect(balanceRedox("Zn -> ZnO2^2- || H2O -> H2", "basic")).toBe("Zn + 2OH- -> ZnO2^2- + H2");
    });
    it("balances hypochlorite with iodide in base", function(){
        expect(balanceRedox("ClO- -> Cl- || I- -> I2", "basic")).toBe("ClO- + 2I- + H2O -> Cl- + I2 + 2OH-");
    });
    it("balances chromium(III) with chlorine in base", function(){
        expect(balanceRedox("Cr3+ -> CrO4^2- || Cl2 -> Cl-", "basic")).toBe("2Cr3+ + 3Cl2 + 16OH- -> 2CrO4^2- + 6Cl- + 8H2O");
    });
    it("balances manganese dioxide with aluminum in base", function(){
        expect(balanceRedox("MnO2 -> Mn2O3 || Al -> AlO2-", "basic")).toBe("6MnO2 + 2Al + 2OH- -> 3Mn2O3 + 2AlO2- + H2O");
    });
    it("balances sulfite with chlorine in base", function(){
        expect(balanceRedox("SO3^2- -> SO4^2- || Cl2 -> Cl-", "basic")).toBe("SO3^2- + Cl2 + 2OH- -> SO4^2- + 2Cl- + H2O");
    });
    it("balances cyanide with oxygen in base", function(){
        expect(balanceRedox("CN- -> CNO- || O2 -> OH-", "basic")).toBe("2CN- + O2 -> 2CNO-");
    });
});
