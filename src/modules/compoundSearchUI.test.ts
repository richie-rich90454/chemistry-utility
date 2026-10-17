import {describe, it, expect} from "vitest";
import {searchCompounds, fetchCompoundDetail, buildFormulaSegments} from "./compoundSearchUI.js";

describe("compoundSearchUI", function (): void {
    describe("searchCompounds", function (): void {
        it("finds a compound by name, case-insensitively", async function (): Promise<void> {
            let results = await searchCompounds("water", "name");
            expect(results.length).toBeGreaterThanOrEqual(1);
            expect(results[0].id).toBe("water");
            expect(results[0].formula).toBe("H2O");
        });

        it("computes molar mass from the formula", async function (): Promise<void> {
            let results = await searchCompounds("H2O", "formula");
            expect(results[0].molarMass).toBeCloseTo(18.015, 2);
        });

        it("finds a compound by formula", async function (): Promise<void> {
            let results = await searchCompounds("C6H12O6", "formula");
            expect(results.map(function (r): string { return r.id; })).toContain("glucose");
        });

        it("finds a compound by CAS number", async function (): Promise<void> {
            let results = await searchCompounds("7732-18-5", "cas");
            expect(results.map(function (r): string { return r.id; })).toEqual(["water"]);
        });

        it("finds a compound by SMILES", async function (): Promise<void> {
            let results = await searchCompounds("c1ccccc1", "smiles");
            expect(results.map(function (r): string { return r.id; })).toContain("benzene");
        });

        it("does not match another field when a type is given", async function (): Promise<void> {
            expect(await searchCompounds("7732-18-5", "name")).toEqual([]);
        });

        it("returns every match for a broad query", async function (): Promise<void> {
            let results = await searchCompounds("acid", "name");
            expect(results.length).toBeGreaterThan(1);
        });

        it("returns an empty list for a blank query", async function (): Promise<void> {
            expect(await searchCompounds("   ", "name")).toEqual([]);
        });

        it("returns an empty list when nothing matches", async function (): Promise<void> {
            expect(await searchCompounds("unobtainium", "name")).toEqual([]);
        });
    });

    describe("fetchCompoundDetail", function (): void {
        it("returns the full record for a known id", async function (): Promise<void> {
            let detail = await fetchCompoundDetail("water");
            expect(detail.name).toBe("Water");
            expect(detail.inchi).toBe("InChI=1S/H2O/h1H2");
            expect(detail.molarMass).toBeCloseTo(18.015, 2);
            expect(detail.properties).toEqual({});
            expect(detail.source).toBe("Bundled dataset");
        });

        it("rejects for an unknown id", async function (): Promise<void> {
            await expect(fetchCompoundDetail("nope")).rejects.toThrow("Compound not found: nope");
        });
    });

    describe("buildFormulaSegments", function (): void {
        it("marks digits as subscripts", function (): void {
            expect(buildFormulaSegments("H2SO4")).toEqual([
                {"text": "H", "isSubscript": false},
                {"text": "2", "isSubscript": true},
                {"text": "SO", "isSubscript": false},
                {"text": "4", "isSubscript": true}
            ]);
        });

        it("returns a single text segment for a formula with no digits", function (): void {
            expect(buildFormulaSegments("NaCl")).toEqual([{"text": "NaCl", "isSubscript": false}]);
        });

        it("groups consecutive digits", function (): void {
            expect(buildFormulaSegments("C12")).toEqual([
                {"text": "C", "isSubscript": false},
                {"text": "1", "isSubscript": true},
                {"text": "2", "isSubscript": true}
            ]);
        });

        it("returns an empty list for an empty formula", function (): void {
            expect(buildFormulaSegments("")).toEqual([]);
        });
    });
});
