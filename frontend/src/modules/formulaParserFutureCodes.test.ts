import {describe, it, expect, vi} from "vitest";

vi.mock("fast-balance", async (importOriginal) => {
    const real = await importOriginal() as Record<string, unknown>;
    const realParse = real["parseFormula"] as (s: string) => unknown;
    return {
        ...(real as object),
        parseFormula: (s: string) => {
            if (s === "H2O") throw new Error("boom");
            return (realParse as (a: string) => unknown)(s);
        },
    };
});

import {calculateMolarMass} from "./formulaParser.js";
import {ChemicalElement} from "../types";

const els: ChemicalElement[] = [
    {symbol: "H", name: "Hydrogen", atomicMass: 1.008, atomicNumber: 1, valenceElectrons: 1, totalElectrons: 1, group: 1, period: 1, type: "nonmetal"},
    {symbol: "O", name: "Oxygen", atomicMass: 15.999, atomicNumber: 8, valenceElectrons: 6, totalElectrons: 8, group: 16, period: 2, type: "nonmetal"},
];

describe("formulaParserFutureCodes: generic fallback", () => {
    it("falls back to legacy on generic errors", () => {
        expect(calculateMolarMass("H2O", els)).toBeCloseTo(18.015, 2);
    });
});
