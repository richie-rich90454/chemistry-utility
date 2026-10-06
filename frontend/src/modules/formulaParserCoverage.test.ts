import {describe, it, expect} from "vitest";
import {calculateMolarMass, formatFormula, parseElement, parseNumber, FormulaParser} from "./formulaParser.js";
import {ChemicalElement} from "../types";

const testElements: ChemicalElement[] = [
    {symbol: "H", name: "Hydrogen", atomicMass: 1.008, atomicNumber: 1, valenceElectrons: 1, totalElectrons: 1, group: 1, period: 1, type: "nonmetal"},
    {symbol: "O", name: "Oxygen", atomicMass: 15.999, atomicNumber: 8, valenceElectrons: 6, totalElectrons: 8, group: 16, period: 2, type: "nonmetal"},
    {symbol: "Cu", name: "Copper", atomicMass: 63.546, atomicNumber: 29, valenceElectrons: 1, totalElectrons: 29, group: 11, period: 4, type: "transition metal"},
    {symbol: "S", name: "Sulfur", atomicMass: 32.06, atomicNumber: 16, valenceElectrons: 6, totalElectrons: 16, group: 16, period: 3, type: "nonmetal"},
    {symbol: "Ca", name: "Calcium", atomicMass: 40.078, atomicNumber: 20, valenceElectrons: 2, totalElectrons: 20, group: 2, period: 4, type: "alkaline earth metal"},
    {symbol: "Al", name: "Aluminium", atomicMass: 26.982, atomicNumber: 13, valenceElectrons: 3, totalElectrons: 13, group: 13, period: 3, type: "post-transition metal"},
    {symbol: "C", name: "Carbon", atomicMass: 12.011, atomicNumber: 6, valenceElectrons: 4, totalElectrons: 6, group: 14, period: 2, type: "nonmetal"},
    {symbol: "Fe", name: "Iron", atomicMass: 55.845, atomicNumber: 26, valenceElectrons: 2, totalElectrons: 26, group: 8, period: 4, type: "transition metal"},
];

describe("formulaParserCoverage: caret and empty", () => {
    it("strips caret notation and rejects empty", () => {
        expect(calculateMolarMass("Fe^2+", testElements)).toBeCloseTo(55.845, 2);
        expect(() => calculateMolarMass("", testElements)).toThrow("Empty formula");
        expect(() => calculateMolarMass("   ", testElements)).toThrow("Empty formula");
    });
});

describe("formulaParserCoverage: hydrates", () => {
    it("handles dot hydrates with multipliers and empty parts", () => {
        expect(calculateMolarMass("CuSO4·5H2O", testElements)).toBeGreaterThan(200);
        expect(calculateMolarMass("CuSO4*5H2O", testElements)).toBeGreaterThan(200);
        expect(calculateMolarMass("2H2O·CuSO4", testElements)).toBeGreaterThan(150);
        expect(calculateMolarMass("H2O··CuSO4", testElements)).toBeGreaterThan(150);
        expect(calculateMolarMass("CuSO4·2", testElements)).toBeCloseTo(159.61, 1);
    });
});

describe("formulaParserCoverage: brackets and errors", () => {
    it("rejects unmatched brackets", () => {
        expect(() => calculateMolarMass("H2(O", testElements)).toThrow("Unmatched");
        expect(() => calculateMolarMass("H2)O", testElements)).toThrow("Unmatched");
        expect(() => calculateMolarMass("(H2", testElements)).toThrow("Unmatched");
        expect(() => calculateMolarMass("Xx2", testElements)).toThrow();
    });

    it("handles subgroups with multipliers", () => {
        expect(calculateMolarMass("Ca(OH)2", testElements)).toBeCloseTo(74.09, 1);
        expect(calculateMolarMass("Al2(SO4)3", testElements)).toBeGreaterThan(300);
    });
});

describe("formulaParserCoverage: format and parse helpers", () => {
    it("formats and rejects bad formulas", () => {
        expect(formatFormula("H2O")).toContain("H");
        expect(formatFormula("H2O·\u00b7CuSO4")).toContain("H");
        expect(formatFormula("H2O!")).toContain("H");
        expect(formatFormula("CuSO4·2")).toContain("CuSO4");
        expect(() => formatFormula("")).toThrow("Bad formula");
        expect(() => formatFormula("·")).toThrow("Bad formula");
        expect(() => formatFormula("H2)O")).toThrow("Unmatched");
    });

    it("covers parseElement and parseNumber edges", () => {
        expect(parseElement("H2O", 0)).not.toBeNull();
        expect(() => parseElement("2H", 0)).toThrow();
        expect(parseNumber("abc", 0)[0]).toBe(1);
        expect(parseNumber("12abc", 0)[0]).toBe(12);
    });
});

describe("formulaParserCoverage: legacy whitebox", () => {
    const Cls = FormulaParser as unknown as Record<string, (...a: unknown[]) => unknown>;
    const els = [{symbol: "H", atomicMass: 1.008}, {symbol: "O", atomicMass: 15.999}, {symbol: "Cu", atomicMass: 63.546}, {symbol: "S", atomicMass: 32.06}, {symbol: "Ca", atomicMass: 40.078}, {symbol: "Fe", atomicMass: 55.845}] as unknown[];

    it("covers legacy fallbacks directly", () => {
        expect(Cls["legacyCalculateMolarMass"]("CuSO4·5H2O", els)).toBeGreaterThan(200);
        expect(Cls["legacyCalculateMolarMass"]("H2O··CuSO4", els)).toBeGreaterThan(100);
        expect(Cls["legacyCalculateMolarMass"]("CuSO4·2", els)).toBeGreaterThan(100);
        expect(Cls["legacyCalculateMolarMass"]("Ca(OH)2", els)).toBeGreaterThan(70);
        expect(Cls["legacyCalculateMolarMass"]("Fe^2+", els)).toBeCloseTo(55.845, 2);
        expect(() => Cls["legacyCalculateMolarMass"]("", els)).toThrow("Empty formula");
        expect(() => Cls["legacyCalculateMolarMass"]("Xx2", els)).toThrow();
        expect(() => Cls["legacyCalculateMolarMass"]("H2(O", els)).toThrow("Unmatched");
        expect(() => Cls["legacyCalculateMolarMass"]("H2)O", els)).toThrow("Unmatched");
        expect(() => (Cls["calculateMolarMassSingle"] as (f: string, e: unknown[]) => unknown)("H2(O", els)).toThrow("Unmatched");
        expect(() => (Cls["calculateMolarMassSingle"] as (f: string, e: unknown[]) => unknown)("H2)O", els)).toThrow("Unmatched");
        expect(() => (Cls["calculateMolarMassSingle"] as (f: string, e: unknown[]) => unknown)("(H2", els)).toThrow("Unmatched");
        expect(() => (Cls["calculateMolarMassSingle"] as (f: string, e: unknown[]) => unknown)("H2)", els)).toThrow("Unmatched");
        expect(() => (Cls["calculateMolarMassSingle"] as (f: string, e: unknown[]) => unknown)("H2[O", els)).toThrow("Unmatched");
        expect(() => (Cls["calculateMolarMassSingle"] as (f: string, e: unknown[]) => unknown)("H2]O", els)).toThrow("Unmatched");
        expect(() => (Cls["calculateMolarMassSingle"] as (f: string, e: unknown[]) => unknown)("H2{O", els)).toThrow("Unmatched");
        expect(() => (Cls["calculateMolarMassSingle"] as (f: string, e: unknown[]) => unknown)("H2}O", els)).toThrow("Unmatched");
        expect(() => (Cls["calculateMolarMassSingle"] as (f: string, e: unknown[]) => unknown)("H2(", els)).toThrow("Unmatched");
        expect(() => (Cls["calculateMolarMassSingle"] as (f: string, e: unknown[]) => unknown)("H2((O)", els)).toThrow("Unmatched");
        expect((Cls["calculateMolarMassSingle"] as (f: string, e: unknown[]) => unknown)("((H2))", els) as number).toBeGreaterThan(0);
    });
});
