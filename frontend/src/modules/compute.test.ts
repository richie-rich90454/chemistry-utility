import { describe, it, expect } from "vitest";
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
    computeFirstOrderHalfLife
} from "./compute.js";

describe("computeDilution", () => {
    it("solves for M2: M1=2, V1=1, V2=4 → M2=0.5", () => {
        expect(computeDilution({ M1: 2, V1: 1, M2: 0, V2: 4 }, "M2")).toBe(0.5);
    });
    it("solves for V1: M1=6, M2=2, V2=500 → V1≈166.67", () => {
        expect(computeDilution({ M1: 6, V1: 0, M2: 2, V2: 500 }, "V1")).toBeCloseTo(166.6667, 3);
    });
    it("solves for M1: M2=0.5, V1=1, V2=4 → M1=2", () => {
        expect(computeDilution({ M1: 0, V1: 1, M2: 0.5, V2: 4 }, "M1")).toBe(2);
    });
    it("solves for V2: M1=6, V1=100, M2=2 → V2=300", () => {
        expect(computeDilution({ M1: 6, V1: 100, M2: 2, V2: 0 }, "V2")).toBe(300);
    });
    it("throws for zero V1 when solving for M2", () => {
        expect(() => computeDilution({ M1: 2, V1: 0, M2: 0, V2: 4 }, "M2")).toThrow();
    });
    it("throws for negative V2 when solving for M2", () => {
        expect(() => computeDilution({ M1: 2, V1: 1, M2: 0, V2: -4 }, "M2")).toThrow();
    });
    it("throws for invalid solveFor", () => {
        expect(() => computeDilution({ M1: 2, V1: 1, M2: 0, V2: 4 }, "X" as any)).toThrow();
    });
});

describe("computeIdealGasLaw", () => {
    it("solves for P with atm-L units", () => {
        // P = nRT/V = 1 * 0.08206 * 273.15 / 22.4 ≈ 1.0
        let P = computeIdealGasLaw({ P: 0, V: 22.4, n: 1, T: 273.15, R: 0.08206 }, "P");
        expect(P).toBeCloseTo(1.0, 2);
    });
    it("solves for V with atm-L units", () => {
        let V = computeIdealGasLaw({ P: 1, V: 0, n: 1, T: 273.15, R: 0.08206 }, "V");
        expect(V).toBeCloseTo(22.4, 1);
    });
    it("solves for n with SI units", () => {
        // n = PV/(RT) = 101325 * 0.0224 / (8.314 * 273.15) ≈ 1.0
        let n = computeIdealGasLaw({ P: 101325, V: 0.0224, n: 0, T: 273.15, R: 8.314 }, "n");
        expect(n).toBeCloseTo(1.0, 1);
    });
    it("solves for T", () => {
        // T = PV/(nR) = 1*22.414/(1*0.08206) ≈ 273.15
        let T = computeIdealGasLaw({ P: 1, V: 22.414, n: 1, T: 0, R: 0.08206 }, "T");
        expect(T).toBeCloseTo(273.15, 1);
    });
    it("throws for non-positive R", () => {
        expect(() => computeIdealGasLaw({ P: 1, V: 22.4, n: 1, T: 0, R: 0 }, "T")).toThrow();
    });
    it("throws for zero V when solving for P", () => {
        expect(() => computeIdealGasLaw({ P: 0, V: 0, n: 1, T: 273, R: 0.08206 }, "P")).toThrow();
    });
});

describe("computeCombinedGasLaw", () => {
    it("solves for P2", () => {
        // P1*V1/T1 = P2*V2/T2 → P2 = P1*V1*T2/(T1*V2)
        // = 1*2*300/(200*3) = 1.0
        let P2 = computeCombinedGasLaw({ P1: 1, V1: 2, T1: 200, P2: 0, V2: 3, T2: 300 }, "P2");
        expect(P2).toBeCloseTo(1.0, 4);
    });
    it("solves for V2", () => {
        // V2 = P1*V1*T2/(T1*P2) = 1*2*300/(200*1) = 3.0
        let V2 = computeCombinedGasLaw({ P1: 1, V1: 2, T1: 200, P2: 1, V2: 0, T2: 300 }, "V2");
        expect(V2).toBeCloseTo(3.0, 4);
    });
    it("solves for T1", () => {
        // T1 = T2*P1*V1/(P2*V2) = 300*1*2/(1*3) = 200
        let T1 = computeCombinedGasLaw({ P1: 1, V1: 2, T1: 0, P2: 1, V2: 3, T2: 300 }, "T1");
        expect(T1).toBeCloseTo(200, 4);
    });
    it("throws for zero T1 when solving for P2", () => {
        expect(() => computeCombinedGasLaw({ P1: 1, V1: 2, T1: 0, P2: 0, V2: 3, T2: 300 }, "P2")).toThrow();
    });
});

describe("computeBoylesLaw", () => {
    it("solves for P2: P1=2, V1=4, V2=8 → P2=1", () => {
        expect(computeBoylesLaw({ P1: 2, V1: 4, P2: 0, V2: 8 }, "P2")).toBe(1);
    });
    it("solves for V2: P1=2, V1=4, P2=4 → V2=2", () => {
        expect(computeBoylesLaw({ P1: 2, V1: 4, P2: 4, V2: 0 }, "V2")).toBe(2);
    });
    it("throws for zero V1 when solving for P2", () => {
        expect(() => computeBoylesLaw({ P1: 2, V1: 0, P2: 0, V2: 8 }, "P2")).toThrow();
    });
});

describe("computeCharlesLaw", () => {
    it("solves for V2: V1=2, T1=200, T2=300 → V2=3", () => {
        expect(computeCharlesLaw({ V1: 2, T1: 200, V2: 0, T2: 300 }, "V2")).toBe(3);
    });
    it("solves for T2: V1=2, T1=200, V2=3 → T2=300", () => {
        expect(computeCharlesLaw({ V1: 2, T1: 200, V2: 3, T2: 0 }, "T2")).toBe(300);
    });
    it("throws for zero T1 when solving for V2", () => {
        expect(() => computeCharlesLaw({ V1: 2, T1: 0, V2: 0, T2: 300 }, "V2")).toThrow();
    });
});

describe("computeMassPercent", () => {
    it("calculates percent: 10g solute in 200g solution = 5%", () => {
        expect(computeMassPercent({ soluteMass: 10, solutionMass: 200, unit: "percent" })).toBe(5);
    });
    it("calculates ppm: 1mg in 1kg = 1ppm (0.001/1000 * 1e6)", () => {
        expect(computeMassPercent({ soluteMass: 0.001, solutionMass: 1000, unit: "ppm" })).toBe(1);
    });
    it("calculates ppb: 1ug in 1kg = 1ppb (0.000001/1000 * 1e9)", () => {
        expect(computeMassPercent({ soluteMass: 0.000001, solutionMass: 1000, unit: "ppb" })).toBeCloseTo(1, 5);
    });
    it("throws for zero solution mass", () => {
        expect(() => computeMassPercent({ soluteMass: 10, solutionMass: 0, unit: "percent" })).toThrow();
    });
    it("throws for negative solute mass", () => {
        expect(() => computeMassPercent({ soluteMass: -5, solutionMass: 100, unit: "percent" })).toThrow();
    });
    it("throws for invalid unit", () => {
        expect(() => computeMassPercent({ soluteMass: 10, solutionMass: 100, unit: "x" as any })).toThrow();
    });
});

describe("computeMixing", () => {
    it("mixes two solutions of same concentration", () => {
        let result = computeMixing({ C1: 1, V1: 1, C2: 1, V2: 1 });
        expect(result.finalConcentration).toBe(1);
        expect(result.totalVolume).toBe(2);
    });
    it("mixes two solutions of different concentration", () => {
        // (1*1 + 2*1) / (1+1) = 1.5
        let result = computeMixing({ C1: 1, V1: 1, C2: 2, V2: 1 });
        expect(result.finalConcentration).toBe(1.5);
        expect(result.totalVolume).toBe(2);
    });
    it("throws for zero C1", () => {
        expect(() => computeMixing({ C1: 0, V1: 1, C2: 1, V2: 1 })).toThrow();
    });
    it("throws for negative V1", () => {
        expect(() => computeMixing({ C1: 1, V1: -1, C2: 1, V2: 1 })).toThrow();
    });
});

describe("computePH", () => {
    it("calculates pH for [H+]=1e-7 → pH=7", () => {
        expect(computePH(1e-7)).toBe(7);
    });
    it("calculates pH for [H+]=1e-1 → pH=1", () => {
        expect(computePH(0.1)).toBe(1);
    });
    it("calculates pH for [H+]=1 → pH=0", () => {
        expect(computePH(1)).toBeCloseTo(0, 5);
    });
    it("throws for zero [H+]", () => {
        expect(() => computePH(0)).toThrow();
    });
    it("throws for negative [H+]", () => {
        expect(() => computePH(-1e-7)).toThrow();
    });
});

describe("computeBufferPH", () => {
    it("pH = pKa when [A-]=[HA]", () => {
        expect(computeBufferPH({ pKa: 4.75, HA: 1, Aminus: 1 })).toBe(4.75);
    });
    it("pH = pKa + 1 when [A-]/[HA] = 10", () => {
        expect(computeBufferPH({ pKa: 4.75, HA: 1, Aminus: 10 })).toBeCloseTo(5.75, 5);
    });
    it("pH = pKa - 1 when [A-]/[HA] = 0.1", () => {
        expect(computeBufferPH({ pKa: 4.75, HA: 10, Aminus: 1 })).toBeCloseTo(3.75, 5);
    });
    it("throws for zero [HA]", () => {
        expect(() => computeBufferPH({ pKa: 4.75, HA: 0, Aminus: 1 })).toThrow();
    });
    it("throws for zero [A-]", () => {
        expect(() => computeBufferPH({ pKa: 4.75, HA: 1, Aminus: 0 })).toThrow();
    });
});

describe("computeFirstOrderHalfLife", () => {
    it("t1/2 = ln(2)/k for k=0.05 → ≈13.86", () => {
        expect(computeFirstOrderHalfLife(0.05)).toBeCloseTo(13.86, 2);
    });
    it("t1/2 for k=ln(2) → 1", () => {
        expect(computeFirstOrderHalfLife(Math.log(2))).toBeCloseTo(1, 5);
    });
    it("throws for zero k", () => {
        expect(() => computeFirstOrderHalfLife(0)).toThrow();
    });
    it("throws for negative k", () => {
        expect(() => computeFirstOrderHalfLife(-0.1)).toThrow();
    });
});
