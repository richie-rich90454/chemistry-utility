import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ChemicalElement } from "../../types.js";

const mockState = vi.hoisted(function (): { override: ChemicalElement[] | null } {
    return { "override": null };
});

vi.mock("./elementData.js", async function () {
    const actual = await vi.importActual<typeof import("./elementData.js")>("./elementData.js");
    return {
        "loadElements": function (): ChemicalElement[] {
            if (mockState.override !== null) {
                return mockState.override;
            }
            return actual.loadElements();
        }
    };
});

import {
    photoelectronSpectroscopy,
    empiricalFormula,
    massSpectrometry,
    calorimetry,
    gibbsEquilibrium,
    molality,
    beerLambert,
    serialDilution,
    leChatelier
} from "./advanced.js";

function meta(result: { metadata?: Record<string, unknown> }): Record<string, unknown> {
    return result.metadata ?? {};
}

describe("advanced calculator branches", function (): void {
    beforeEach(function (): void {
        mockState.override = null;
    });
    afterEach(function (): void {
        mockState.override = null;
    });

    describe("photoelectronSpectroscopy", function (): void {
        it("skips empty comma-separated peak entries", function (): void {
            let result = photoelectronSpectroscopy({ "pes-peaks": "1.312," });
            expect(meta(result).atomicNumber).toBe(1);
        });

        it("rejects input with no usable peak", function (): void {
            expect(function (): void {
                photoelectronSpectroscopy({ "pes-peaks": "," });
            }).toThrow("Enter at least one PES peak position");
        });

        it("rejects when the element table has no matching element", function (): void {
            mockState.override = [];
            expect(function (): void {
                photoelectronSpectroscopy({ "pes-peaks": "1.312" });
            }).toThrow("No element matches this spectrum");
        });
    });

    describe("empiricalFormula", function (): void {
        it("skips empty comma-separated composition entries", function (): void {
            let result = empiricalFormula({ "ef-composition": "C:40,,H:6.71,O:53.29" });
            expect(meta(result).empiricalFormula).toBe("CH2O");
        });

        it("rejects input with no usable element entry", function (): void {
            expect(function (): void {
                empiricalFormula({ "ef-composition": ", ," });
            }).toThrow("Enter at least one element:percent pair");
        });

        it("treats a blank element symbol as an unknown element", function (): void {
            expect(function (): void {
                empiricalFormula({ "ef-composition": ":40,H:60" });
            }).toThrow("Element not found");
        });

        it("clamps a molar-mass multiplier below one and warns when it is inexact", function (): void {
            let result = empiricalFormula({ "ef-composition": "H:11.19,O:88.81", "ef-molar-mass": "0.1" });
            expect(meta(result).multiplier).toBe(1);
            expect(result.explanation).toMatch(/Warning: the molar mass does not divide evenly/);
        });

        it("omits the subscript for a molecular count of one", function (): void {
            let result = empiricalFormula({ "ef-composition": "H:11.19,O:88.81", "ef-molar-mass": "18.0154" });
            expect(meta(result).molecularFormula).toBe("H2O");
            expect(result.explanation).not.toMatch(/Warning/);
        });
    });

    describe("massSpectrometry", function (): void {
        it("skips empty isotope entries", function (): void {
            let result = massSpectrometry({ "ms-isotopes": "35,0.75;;37,0.25" });
            expect((meta(result).isotopes as number[]).length).toBe(2);
        });

        it("rejects input with no usable isotope entry", function (): void {
            expect(function (): void {
                massSpectrometry({ "ms-isotopes": ";" });
            }).toThrow("Enter at least one isotope");
        });

        it("rejects when the element table is empty", function (): void {
            mockState.override = [];
            expect(function (): void {
                massSpectrometry({ "ms-isotopes": "35,1" });
            }).toThrow("Element data is unavailable");
        });

        it("tracks the most abundant isotope when it is not listed first", function (): void {
            let result = massSpectrometry({ "ms-isotopes": "35,0.2;37,0.8" });
            expect(meta(result).mostAbundantMass).toBe(37);
        });
    });

    describe("calorimetry", function (): void {
        it("defaults to solving for heat", function (): void {
            let result = calorimetry({ "calor-mass": "10", "calor-specific-heat": "2", "calor-delta-t": "3" });
            expect(meta(result).result).toBe(60);
        });

        it("rejects a non-positive mass when solving for heat", function (): void {
            expect(function (): void {
                calorimetry({ "calor-mass": "0", "calor-specific-heat": "2", "calor-delta-t": "3" });
            }).toThrow("Mass must be positive");
        });

        it("rejects missing inputs when solving for mass", function (): void {
            expect(function (): void {
                calorimetry({ "calor-solve-for": "m", "calor-specific-heat": "2" });
            }).toThrow("Missing or invalid inputs for calor-specific-heat");
        });

        it("rejects a non-positive specific heat when solving for mass", function (): void {
            expect(function (): void {
                calorimetry({ "calor-solve-for": "m", "calor-specific-heat": "0", "calor-delta-t": "1", "calor-heat": "10" });
            }).toThrow("Specific heat must be positive");
        });

        it("rejects a non-positive solved mass", function (): void {
            expect(function (): void {
                calorimetry({ "calor-solve-for": "m", "calor-specific-heat": "2", "calor-delta-t": "1", "calor-heat": "-5" });
            }).toThrow("Solved mass is not positive");
        });

        it("rejects missing inputs when solving for specific heat", function (): void {
            expect(function (): void {
                calorimetry({ "calor-solve-for": "c", "calor-mass": "10" });
            }).toThrow("Missing or invalid inputs for calor-mass, calor-delta-t, calor-heat");
        });

        it("rejects a non-positive mass when solving for specific heat", function (): void {
            expect(function (): void {
                calorimetry({ "calor-solve-for": "c", "calor-mass": "0", "calor-delta-t": "1", "calor-heat": "10" });
            }).toThrow("Mass must be positive");
        });

        it("rejects a zero temperature change when solving for specific heat", function (): void {
            expect(function (): void {
                calorimetry({ "calor-solve-for": "c", "calor-mass": "10", "calor-delta-t": "0", "calor-heat": "10" });
            }).toThrow("Temperature change cannot be zero");
        });

        it("rejects a non-positive solved specific heat", function (): void {
            expect(function (): void {
                calorimetry({ "calor-solve-for": "c", "calor-mass": "10", "calor-delta-t": "1", "calor-heat": "-5" });
            }).toThrow("Solved specific heat is not positive");
        });

        it("rejects missing inputs when solving for temperature change", function (): void {
            expect(function (): void {
                calorimetry({ "calor-solve-for": "deltaT", "calor-mass": "10" });
            }).toThrow("Missing or invalid inputs for calor-mass, calor-specific-heat, calor-heat");
        });

        it("rejects a non-positive mass when solving for temperature change", function (): void {
            expect(function (): void {
                calorimetry({ "calor-solve-for": "deltaT", "calor-mass": "0", "calor-specific-heat": "2", "calor-heat": "10" });
            }).toThrow("Mass must be positive");
        });

        it("rejects a non-positive specific heat when solving for temperature change", function (): void {
            expect(function (): void {
                calorimetry({ "calor-solve-for": "deltaT", "calor-mass": "10", "calor-specific-heat": "0", "calor-heat": "10" });
            }).toThrow("Specific heat must be positive");
        });

        it("explains a zero heat exchange", function (): void {
            let result = calorimetry({ "calor-mass": "10", "calor-specific-heat": "2", "calor-delta-t": "0" });
            expect(result.explanation).toMatch(/no net heat was exchanged/);
        });
    });

    describe("gibbsEquilibrium", function (): void {
        it("defaults to solving for K", function (): void {
            let result = gibbsEquilibrium({ "geq-delta-g": "0" });
            expect(meta(result).result).toBe(1);
        });

        it("rejects a non-positive temperature when solving for delta G", function (): void {
            expect(function (): void {
                gibbsEquilibrium({ "geq-solve-for": "delta-g", "geq-k": "10", "geq-temperature": "0" });
            }).toThrow("Temperature must be positive");
        });
    });

    describe("molality", function (): void {
        it("defaults to solving for molality", function (): void {
            let result = molality({ "molality-solute-mass": "10", "molality-solvent-mass": "100", "molality-molar-mass": "10" });
            expect(meta(result).result).toBe(10);
        });

        it("rejects a non-positive solvent mass when solving for molality", function (): void {
            expect(function (): void {
                molality({ "molality-solute-mass": "10", "molality-solvent-mass": "0", "molality-molar-mass": "10" });
            }).toThrow("Solvent mass must be positive");
        });

        it("rejects missing inputs when solving for solute mass", function (): void {
            expect(function (): void {
                molality({ "molality-solve-for": "solute-mass", "molality-solvent-mass": "100" });
            }).toThrow("Missing or invalid inputs for molality-solvent-mass, molality-molar-mass, molality-value");
        });

        it("rejects a non-positive molar mass when solving for solute mass", function (): void {
            expect(function (): void {
                molality({ "molality-solve-for": "solute-mass", "molality-solvent-mass": "100", "molality-molar-mass": "0", "molality-value": "1" });
            }).toThrow("Molar mass must be positive");
        });

        it("rejects a non-positive solvent mass when solving for solute mass", function (): void {
            expect(function (): void {
                molality({ "molality-solve-for": "solute-mass", "molality-solvent-mass": "0", "molality-molar-mass": "10", "molality-value": "1" });
            }).toThrow("Solvent mass must be positive");
        });

        it("rejects a negative molality when solving for solute mass", function (): void {
            expect(function (): void {
                molality({ "molality-solve-for": "solute-mass", "molality-solvent-mass": "100", "molality-molar-mass": "10", "molality-value": "-1" });
            }).toThrow("Molality cannot be negative");
        });

        it("rejects missing inputs when solving for solvent mass", function (): void {
            expect(function (): void {
                molality({ "molality-solve-for": "solvent-mass", "molality-solute-mass": "10" });
            }).toThrow("Missing or invalid inputs for molality-solute-mass, molality-molar-mass, molality-value");
        });

        it("rejects a non-positive molar mass when solving for solvent mass", function (): void {
            expect(function (): void {
                molality({ "molality-solve-for": "solvent-mass", "molality-solute-mass": "10", "molality-molar-mass": "0", "molality-value": "1" });
            }).toThrow("Molar mass must be positive");
        });

        it("rejects missing inputs when solving for molar mass", function (): void {
            expect(function (): void {
                molality({ "molality-solve-for": "molar-mass", "molality-solute-mass": "10" });
            }).toThrow("Missing or invalid inputs for molality-solute-mass, molality-solvent-mass, molality-value");
        });

        it("rejects a non-positive solvent mass when solving for molar mass", function (): void {
            expect(function (): void {
                molality({ "molality-solve-for": "molar-mass", "molality-solute-mass": "10", "molality-solvent-mass": "0", "molality-value": "1" });
            }).toThrow("Solvent mass must be positive");
        });

        it("rejects a non-positive molality when solving for molar mass", function (): void {
            expect(function (): void {
                molality({ "molality-solve-for": "molar-mass", "molality-solute-mass": "10", "molality-solvent-mass": "100", "molality-value": "0" });
            }).toThrow("Molality must be positive");
        });
    });

    describe("beerLambert", function (): void {
        it("defaults to solving for absorbance", function (): void {
            let result = beerLambert({ "bl-absorptivity": "1", "bl-path-length": "1", "bl-concentration": "2" });
            expect(meta(result).result).toBe(2);
        });

        it("rejects a negative absorptivity when solving for absorbance", function (): void {
            expect(function (): void {
                beerLambert({ "bl-absorptivity": "-1", "bl-path-length": "1", "bl-concentration": "1" });
            }).toThrow("Absorptivity cannot be negative");
        });

        it("rejects a negative path length when solving for absorbance", function (): void {
            expect(function (): void {
                beerLambert({ "bl-absorptivity": "1", "bl-path-length": "-1", "bl-concentration": "1" });
            }).toThrow("Path length cannot be negative");
        });

        it("rejects a negative concentration when solving for absorbance", function (): void {
            expect(function (): void {
                beerLambert({ "bl-absorptivity": "1", "bl-path-length": "1", "bl-concentration": "-1" });
            }).toThrow("Concentration cannot be negative");
        });

        it("rejects missing inputs when solving for absorptivity", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "absorptivity", "bl-absorbance": "1" });
            }).toThrow("Missing or invalid inputs for bl-absorbance, bl-path-length, bl-concentration");
        });

        it("rejects a negative absorbance when solving for absorptivity", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "absorptivity", "bl-absorbance": "-1", "bl-path-length": "1", "bl-concentration": "1" });
            }).toThrow("Absorbance cannot be negative");
        });

        it("rejects a non-positive path length when solving for absorptivity", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "absorptivity", "bl-absorbance": "1", "bl-path-length": "0", "bl-concentration": "1" });
            }).toThrow("Path length must be positive");
        });

        it("rejects missing inputs when solving for path length", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "path-length", "bl-absorbance": "1" });
            }).toThrow("Missing or invalid inputs for bl-absorbance, bl-absorptivity, bl-concentration");
        });

        it("rejects a negative absorbance when solving for path length", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "path-length", "bl-absorbance": "-1", "bl-absorptivity": "1", "bl-concentration": "1" });
            }).toThrow("Absorbance cannot be negative");
        });

        it("rejects a non-positive absorptivity when solving for path length", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "path-length", "bl-absorbance": "1", "bl-absorptivity": "0", "bl-concentration": "1" });
            }).toThrow("Absorptivity must be positive");
        });

        it("rejects a non-positive concentration when solving for path length", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "path-length", "bl-absorbance": "1", "bl-absorptivity": "1", "bl-concentration": "0" });
            }).toThrow("Concentration must be positive");
        });

        it("rejects missing inputs when solving for concentration", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "concentration", "bl-absorbance": "1" });
            }).toThrow("Missing or invalid inputs for bl-absorbance, bl-absorptivity, bl-path-length");
        });

        it("rejects a negative absorbance when solving for concentration", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "concentration", "bl-absorbance": "-1", "bl-absorptivity": "1", "bl-path-length": "1" });
            }).toThrow("Absorbance cannot be negative");
        });

        it("rejects a non-positive absorptivity when solving for concentration", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "concentration", "bl-absorbance": "1", "bl-absorptivity": "0", "bl-path-length": "1" });
            }).toThrow("Absorptivity must be positive");
        });

        it("rejects a non-positive path length when solving for concentration", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "concentration", "bl-absorbance": "1", "bl-absorptivity": "1", "bl-path-length": "0" });
            }).toThrow("Path length must be positive");
        });

        it("rejects missing absorbance when solving for transmittance", function (): void {
            expect(function (): void {
                beerLambert({ "bl-solve-for": "transmittance" });
            }).toThrow("Missing or invalid input for bl-absorbance");
        });
    });

    describe("serialDilution", function (): void {
        it("rejects a missing dilution factor", function (): void {
            expect(function (): void {
                serialDilution({ "sd-initial-concentration": "1", "sd-steps": "1" });
            }).toThrow("Missing or invalid input for sd-dilution-factor");
        });

        it("formats a fractional factor and total dilution", function (): void {
            let result = serialDilution({ "sd-initial-concentration": "2", "sd-dilution-factor": "1.5", "sd-steps": "2" });
            expect(meta(result).totalDilutionFactor).toBe(2.25);
            expect(result.explanation).toMatch(/Each step dilutes the sample 1\.5000-fold/);
        });
    });

    describe("leChatelier", function (): void {
        it("shifts away from products when pressure drops and reactants are on the other side", function (): void {
            let result = leChatelier({
                "lc-reaction-type": "exothermic",
                "lc-stress-type": "pressure",
                "lc-change": "decrease",
                "lc-side": "products"
            });
            expect(meta(result).shift).toBe("left");
        });
    });
});
