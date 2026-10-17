import { describe, it, expect } from "vitest";
import {
    PhotoelectronSpectroscopyCalculator,
    EmpiricalFormulaCalculator,
    MassSpectrometryCalculator,
    VseprGeometryCalculator,
    CalorimetryCalculator,
    GibbsEquilibriumCalculator,
    MolalityCalculator,
    BeerLambertCalculator,
    SerialDilutionCalculator,
    LeChatelierCalculator
} from "./advancedCalculators.js";
import type { PureCalculator } from "./calculators/pureCalculator.js";

interface CalcCase {
    calculator: PureCalculator;
    id: string;
    inputs: Record<string, string>;
}

const CASES: CalcCase[] = [
    {
        calculator: new PhotoelectronSpectroscopyCalculator(),
        id: "photoelectron-spectroscopy",
        inputs: { "pes-peaks": "39.548, 2.466, 1.402" }
    },
    {
        calculator: new EmpiricalFormulaCalculator(),
        id: "empirical-formula",
        inputs: { "ef-composition": "C:40,H:6.71,O:53.29" }
    },
    {
        calculator: new MassSpectrometryCalculator(),
        id: "mass-spectrometry",
        inputs: { "ms-isotopes": "34.9689,0.7576;36.9659,0.2424" }
    },
    {
        calculator: new VseprGeometryCalculator(),
        id: "vsepr-geometry",
        inputs: { "vsepr-central": "O", "vsepr-bonded": "2", "vsepr-lone-pairs": "2" }
    },
    {
        calculator: new CalorimetryCalculator(),
        id: "calorimetry",
        inputs: { "calor-solve-for": "q", "calor-mass": "100", "calor-specific-heat": "4.184", "calor-delta-t": "50" }
    },
    {
        calculator: new GibbsEquilibriumCalculator(),
        id: "gibbs-equilibrium",
        inputs: { "geq-solve-for": "K", "geq-delta-g": "46.5", "geq-temperature": "298.15" }
    },
    {
        calculator: new MolalityCalculator(),
        id: "molality",
        inputs: { "molality-solve-for": "molality", "molality-solute-mass": "20", "molality-solvent-mass": "500", "molality-molar-mass": "39.997" }
    },
    {
        calculator: new BeerLambertCalculator(),
        id: "beer-lambert",
        inputs: { "bl-solve-for": "absorbance", "bl-absorptivity": "6239.5", "bl-path-length": "1", "bl-concentration": "0.0001" }
    },
    {
        calculator: new SerialDilutionCalculator(),
        id: "serial-dilution",
        inputs: { "sd-initial-concentration": "1", "sd-dilution-factor": "10", "sd-steps": "3" }
    },
    {
        calculator: new LeChatelierCalculator(),
        id: "le-chatelier",
        inputs: { "lc-reaction-type": "exothermic", "lc-stress-type": "temperature", "lc-change": "increase", "lc-side": "reactants" }
    }
];

describe("advancedCalculators", function () {
    it("reports each calculator id", function (): void {
        for (const entry of CASES) {
            expect(entry.calculator.id).toBe(entry.id);
        }
    });

    it("calculates valid inputs for every calculator", function (): void {
        for (const entry of CASES) {
            const result = entry.calculator.calculatePure(entry.inputs);
            expect(result.value).not.toBe("");
            expect(result.explanation ?? "").not.toContain("Error");
        }
    });

    it("returns an error result for empty inputs on every calculator", function (): void {
        for (const entry of CASES) {
            const result = entry.calculator.calculatePure({});
            expect(result.value).toBe("");
            expect(result.explanation).toContain("Error");
        }
    });
});
