import { describe, it, expect, beforeEach, vi } from "vitest";
import { CalculatorFactory } from "./calculatorFactory.js";
import { DilutionCalculator, MassPercentCalculator, MixingCalculator } from "./solutionCalculators.js";
import { IdealGasLawCalculator, CombinedGasLawCalculator, VanDerWaalsCalculator, HalfLifeCalculator } from "./gasLawCalculators.js";
import { CellPotentialCalculator, NernstCalculator, ElectrolysisCalculator } from "./electrochemistryCalculators.js";
import { BondTypePredictor } from "./bondPredictor.js";
import { StoichiometryCalculator } from "./stoichiometryCalculator.js";

describe("CalculatorFactory", () => {
    let factory: CalculatorFactory;

    beforeEach(() => {
        document.body.innerHTML = "";
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});
        factory = new CalculatorFactory([]);
    });

    it("returns a DilutionCalculator for the 'dilution' id", () => {
        const calc = factory.create("dilution");
        expect(calc).toBeInstanceOf(DilutionCalculator);
    });

    it("returns a MassPercentCalculator for the 'mass-percent' id", () => {
        const calc = factory.create("mass-percent");
        expect(calc).toBeInstanceOf(MassPercentCalculator);
    });

    it("returns a MixingCalculator for the 'mixing' id", () => {
        const calc = factory.create("mixing");
        expect(calc).toBeInstanceOf(MixingCalculator);
    });

    it("returns an IdealGasLawCalculator for the 'ideal-gas' id", () => {
        const calc = factory.create("ideal-gas");
        expect(calc).toBeInstanceOf(IdealGasLawCalculator);
    });

    it("returns a CombinedGasLawCalculator for the 'combined-gas' id", () => {
        const calc = factory.create("combined-gas");
        expect(calc).toBeInstanceOf(CombinedGasLawCalculator);
    });

    it("returns a VanDerWaalsCalculator for the 'vdw' id", () => {
        const calc = factory.create("vdw");
        expect(calc).toBeInstanceOf(VanDerWaalsCalculator);
    });

    it("returns a HalfLifeCalculator for the 'half-life' id", () => {
        const calc = factory.create("half-life");
        expect(calc).toBeInstanceOf(HalfLifeCalculator);
    });

    it("returns a CellPotentialCalculator for the 'cell-potential' id", () => {
        const calc = factory.create("cell-potential");
        expect(calc).toBeInstanceOf(CellPotentialCalculator);
    });

    it("returns a NernstCalculator for the 'nernst' id", () => {
        const calc = factory.create("nernst");
        expect(calc).toBeInstanceOf(NernstCalculator);
    });

    it("returns an ElectrolysisCalculator for the 'electrolysis' id", () => {
        const calc = factory.create("electrolysis");
        expect(calc).toBeInstanceOf(ElectrolysisCalculator);
    });

    it("returns a BondTypePredictor for the 'bond-type' id", () => {
        const calc = factory.create("bond-type");
        expect(calc).toBeInstanceOf(BondTypePredictor);
    });

    it("returns a StoichiometryCalculator for the 'stoichiometry' id", () => {
        const calc = factory.create("stoichiometry");
        expect(calc).toBeInstanceOf(StoichiometryCalculator);
    });

    it("returns undefined for an unknown calculator id", () => {
        expect(factory.create("unknown")).toBeUndefined();
    });

    it("returns undefined for an empty string id", () => {
        expect(factory.create("")).toBeUndefined();
    });

    it("returns a new instance on each call", () => {
        const calc1 = factory.create("dilution");
        const calc2 = factory.create("dilution");
        expect(calc1).not.toBe(calc2);
    });

    it("passes elements data to the BondTypePredictor", () => {
        const elementsData = [
            { symbol: "H", name: "Hydrogen", atomicMass: 1.008, atomicNumber: 1, valenceElectrons: 1, totalElectrons: 1, group: 1, period: 1, type: "nonmetal" },
        ];
        const factoryWithElements = new CalculatorFactory(elementsData);
        const calc = factoryWithElements.create("bond-type");
        expect(calc).toBeInstanceOf(BondTypePredictor);
    });

    it("creates calculators for all known ids in a loop", () => {
        const ids = [
            "dilution", "mass-percent", "mixing",
            "ideal-gas", "combined-gas", "vdw", "half-life",
            "cell-potential", "nernst", "electrolysis",
            "bond-type", "stoichiometry",
        ];
        for (const id of ids) {
            const calc = factory.create(id);
            expect(calc).toBeDefined();
        }
    });
});

describe("CalculatorFactory - calculatePure support", () => {
    let factory: CalculatorFactory;

    beforeEach(() => {
        document.body.innerHTML = "";
        factory = new CalculatorFactory([]);
    });

    it("creates calculators that expose calculatePure for the 'dilution' id", () => {
        const calc = factory.create("dilution");
        expect(calc).toBeDefined();
        expect(typeof calc!.calculatePure).toBe("function");
    });

    it("creates calculators that expose calculatePure for the 'ideal-gas' id", () => {
        const calc = factory.create("ideal-gas");
        expect(calc).toBeDefined();
        expect(typeof calc!.calculatePure).toBe("function");
    });

    it("creates calculators that expose calculatePure for the 'bond-type' id", () => {
        const calc = factory.create("bond-type");
        expect(calc).toBeDefined();
        expect(typeof calc!.calculatePure).toBe("function");
    });

    it("creates calculators that expose calculatePure for every known id", () => {
        const ids = [
            "dilution", "mass-percent", "mixing",
            "ideal-gas", "combined-gas", "vdw", "half-life",
            "cell-potential", "nernst", "electrolysis",
            "bond-type", "stoichiometry",
        ];
        for (const id of ids) {
            const calc = factory.create(id);
            expect(calc).toBeDefined();
            expect(typeof calc!.calculatePure).toBe("function");
        }
    });
});
