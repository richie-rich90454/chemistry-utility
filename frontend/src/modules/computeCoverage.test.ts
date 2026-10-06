import {describe, it, expect} from "vitest";
import {
    computeDilution,
    computeIdealGasLaw,
    computeCombinedGasLaw,
    computeBoylesLaw,
    computeCharlesLaw,
    computeMassPercent,
    computeMixing,
    computePH,
    computeBufferPH,
    computeFirstOrderHalfLife,
} from "./compute.js";

describe("computeCoverage: dilution validation", () => {
    const base = {M1: 2, V1: 1, M2: 0.5, V2: 4};

    it("solves each variable", () => {
        expect(computeDilution(base, "M1")).toBeCloseTo(2, 6);
        expect(computeDilution(base, "V1")).toBeCloseTo(1, 6);
        expect(computeDilution(base, "M2")).toBeCloseTo(0.5, 6);
        expect(computeDilution(base, "V2")).toBeCloseTo(4, 6);
    });

    it("rejects non-positive inputs per branch and bad solveFor", () => {
        expect(() => computeDilution({...base, V1: 0}, "M1")).toThrow();
        expect(() => computeDilution({...base, M1: 0}, "V1")).toThrow();
        expect(() => computeDilution({...base, V2: 0}, "M2")).toThrow();
        expect(() => computeDilution({...base, M2: 0}, "V2")).toThrow();
        expect(() => computeDilution({...base, M1: 0}, "M2")).toThrow();
        expect(() => computeDilution({...base, M2: 0}, "M1")).toThrow();
        expect(() => computeDilution(base, "bogus" as never)).toThrow();
    });
});

describe("computeCoverage: ideal gas validation", () => {
    const base = {P: 101.325, V: 24.465, n: 1, T: 298, R: 8.314};

    it("solves each variable", () => {
        expect(computeIdealGasLaw(base, "P")).toBeCloseTo(101.325, 0);
        expect(computeIdealGasLaw(base, "V")).toBeCloseTo(24.465, 0);
        expect(computeIdealGasLaw(base, "n")).toBeCloseTo(1, 2);
        expect(computeIdealGasLaw(base, "T")).toBeCloseTo(298, 0);
    });

    it("rejects bad R and inputs per branch", () => {
        expect(() => computeIdealGasLaw({...base, R: 0}, "P")).toThrow();
        expect(() => computeIdealGasLaw({...base, V: 0}, "P")).toThrow();
        expect(() => computeIdealGasLaw({...base, P: 0}, "V")).toThrow();
        expect(() => computeIdealGasLaw({...base, n: 0}, "P")).toThrow();
        expect(() => computeIdealGasLaw({...base, T: 0}, "P")).toThrow();
        expect(() => computeIdealGasLaw({...base, P: 0}, "n")).toThrow();
        expect(() => computeIdealGasLaw({...base, V: 0}, "n")).toThrow();
        expect(() => computeIdealGasLaw({...base, T: 0}, "n")).toThrow();
        expect(() => computeIdealGasLaw({...base, P: 0}, "T")).toThrow();
        expect(() => computeIdealGasLaw({...base, V: 0}, "T")).toThrow();
        expect(() => computeIdealGasLaw({...base, n: 0}, "T")).toThrow();
        expect(() => computeIdealGasLaw({...base, n: 0}, "V")).toThrow();
        expect(() => computeIdealGasLaw({...base, T: 0}, "V")).toThrow();
        expect(() => computeIdealGasLaw(base, "bogus" as never)).toThrow();
    });
});

describe("computeCoverage: combined gas validation", () => {
    const base = {P1: 1, V1: 1, T1: 273, P2: 2, V2: 1, T2: 546};

    it("solves each variable", () => {
        expect(computeCombinedGasLaw(base, "P1")).toBeCloseTo(1, 6);
        expect(computeCombinedGasLaw(base, "V1")).toBeCloseTo(1, 6);
        expect(computeCombinedGasLaw(base, "T1")).toBeCloseTo(273, 6);
        expect(computeCombinedGasLaw(base, "P2")).toBeCloseTo(2, 6);
        expect(computeCombinedGasLaw(base, "V2")).toBeCloseTo(1, 6);
        expect(computeCombinedGasLaw(base, "T2")).toBeCloseTo(546, 6);
    });

    it("rejects non-positive inputs per branch and bad solveFor", () => {
        expect(() => computeCombinedGasLaw({...base, P1: 0}, "V1")).toThrow();
        expect(() => computeCombinedGasLaw({...base, V1: 0}, "P1")).toThrow();
        expect(() => computeCombinedGasLaw({...base, T1: 0}, "P1")).toThrow();
        expect(() => computeCombinedGasLaw({...base, P2: 0}, "P1")).toThrow();
        expect(() => computeCombinedGasLaw({...base, V2: 0}, "P1")).toThrow();
        expect(() => computeCombinedGasLaw({...base, T2: 0}, "P1")).toThrow();
        expect(() => computeCombinedGasLaw(base, "bogus" as never)).toThrow();
    });
});

describe("computeCoverage: Boyle and Charles validation", () => {
    it("solves Boyle each variable and rejects bad inputs", () => {
        const b = {P1: 1, V1: 2, P2: 2, V2: 1};
        expect(computeBoylesLaw(b, "P1")).toBeCloseTo(1, 6);
        expect(computeBoylesLaw(b, "V1")).toBeCloseTo(2, 6);
        expect(computeBoylesLaw(b, "P2")).toBeCloseTo(2, 6);
        expect(computeBoylesLaw(b, "V2")).toBeCloseTo(1, 6);
        expect(() => computeBoylesLaw({...b, P1: 0}, "V1")).toThrow();
        expect(() => computeBoylesLaw({...b, V1: 0}, "P1")).toThrow();
        expect(() => computeBoylesLaw({...b, P2: 0}, "P1")).toThrow();
        expect(() => computeBoylesLaw({...b, V2: 0}, "P1")).toThrow();
        expect(() => computeBoylesLaw(b, "bogus" as never)).toThrow();
    });

    it("solves Charles each variable and rejects bad inputs", () => {
        const c = {V1: 2, T1: 273, V2: 4, T2: 546};
        expect(computeCharlesLaw(c, "V1")).toBeCloseTo(2, 6);
        expect(computeCharlesLaw(c, "T1")).toBeCloseTo(273, 6);
        expect(computeCharlesLaw(c, "V2")).toBeCloseTo(4, 6);
        expect(computeCharlesLaw(c, "T2")).toBeCloseTo(546, 6);
        expect(() => computeCharlesLaw({...c, V1: 0}, "T1")).toThrow();
        expect(() => computeCharlesLaw({...c, T1: 0}, "V1")).toThrow();
        expect(() => computeCharlesLaw({...c, V2: 0}, "V1")).toThrow();
        expect(() => computeCharlesLaw({...c, T2: 0}, "V1")).toThrow();
        expect(() => computeCharlesLaw(c, "bogus" as never)).toThrow();
    });
});

describe("computeCoverage: mass, mixing, pH, buffer, half-life", () => {
    it("covers mass percent units and errors", () => {
        expect(computeMassPercent({soluteMass: 10, solutionMass: 100, unit: "percent"})).toBeCloseTo(10, 6);
        expect(computeMassPercent({soluteMass: 0.001, solutionMass: 1, unit: "ppm"})).toBeCloseTo(1000, 6);
        expect(computeMassPercent({soluteMass: 0.000001, solutionMass: 1, unit: "ppb"})).toBeCloseTo(1000, 6);
        expect(() => computeMassPercent({soluteMass: 10, solutionMass: 0, unit: "percent"})).toThrow();
        expect(() => computeMassPercent({soluteMass: -1, solutionMass: 100, unit: "percent"})).toThrow();
        expect(() => computeMassPercent({soluteMass: 10, solutionMass: 100, unit: "bogus" as never})).toThrow();
    });

    it("covers mixing validation", () => {
        expect(computeMixing({C1: 2, V1: 1, C2: 1, V2: 1}).finalConcentration).toBeCloseTo(1.5, 6);
        expect(() => computeMixing({C1: 0, V1: 1, C2: 1, V2: 1})).toThrow();
        expect(() => computeMixing({C1: 2, V1: 1, C2: 0, V2: 1})).toThrow();
        expect(() => computeMixing({C1: 2, V1: 0, C2: 1, V2: 1})).toThrow();
        expect(() => computeMixing({C1: 2, V1: 1, C2: 1, V2: 0})).toThrow();
    });

    it("covers pH, buffer, and half-life validation", () => {
        expect(computePH(1e-7)).toBeCloseTo(7, 6);
        expect(() => computePH(0)).toThrow();
        expect(computeBufferPH({pKa: 4.76, HA: 0.1, Aminus: 0.2})).toBeCloseTo(5.06, 2);
        expect(() => computeBufferPH({pKa: 4.76, HA: 0, Aminus: 0.2})).toThrow();
        expect(() => computeBufferPH({pKa: 4.76, HA: 0.1, Aminus: 0})).toThrow();
        expect(computeFirstOrderHalfLife(0.05)).toBeCloseTo(13.86, 2);
        expect(() => computeFirstOrderHalfLife(0)).toThrow();
    });
});
