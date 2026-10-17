import {describe, it, expect} from "vitest";
import {levenshteinDistance, fuzzyMatch} from "./fuzzySearch";
describe("levenshteinDistance", function (): void {
    it("returns 0 for identical strings", function (): void {
        expect(levenshteinDistance("molar", "molar")).toBe(0);
    });
    it("returns 1 for single-char insertion", function (): void {
        expect(levenshteinDistance("molar", "molarr")).toBe(1);
    });
    it("returns 1 for single-char deletion", function (): void {
        expect(levenshteinDistance("molar", "mola")).toBe(1);
    });
    it("returns 1 for single-char substitution", function (): void {
        expect(levenshteinDistance("molar", "molas")).toBe(1);
    });
    it("is case-sensitive (Molar vs molar is distance 1)", function (): void {
        expect(levenshteinDistance("Molar", "molar")).toBe(1);
    });
    it("is case-sensitive (MOLAR vs molar is distance 5)", function (): void {
        expect(levenshteinDistance("MOLAR", "molar")).toBe(5);
    });
    it("returns the length of the non-empty string when one input is empty", function (): void {
        expect(levenshteinDistance("", "abc")).toBe(3);
        expect(levenshteinDistance("abc", "")).toBe(3);
    });
    it("returns 0 for two empty strings", function (): void {
        expect(levenshteinDistance("", "")).toBe(0);
    });
    it("computes distance for a multi-char typo", function (): void {
        expect(levenshteinDistance("kitten", "sitting")).toBe(3);
    });
});
describe("fuzzyMatch", function (): void {
    it("matches exact substring (same case)", function (): void {
        expect(fuzzyMatch("Molar", "Molar Mass")).toBe(true);
    });
    it("matches on a close typo (molor matches molar)", function (): void {
        expect(fuzzyMatch("molor", "molar")).toBe(true);
    });
    it("matches a word within multi-word text", function (): void {
        expect(fuzzyMatch("Mass", "Molar Mass")).toBe(true);
    });
    it("matches a typo of a word in multi-word text", function (): void {
        expect(fuzzyMatch("Msss", "Molar Mass")).toBe(true);
    });
    it("matches despite a single-char case difference within threshold", function (): void {
        expect(fuzzyMatch("molar", "Molar Mass")).toBe(true);
    });
    it("returns false when case differences exceed the threshold", function (): void {
        expect(fuzzyMatch("MOLAR", "molar")).toBe(false);
    });
    it("returns false when query is far from every word", function (): void {
        expect(fuzzyMatch("xyz123", "Molar Mass")).toBe(false);
    });
    it("returns true when query is empty (substring of any text)", function (): void {
        expect(fuzzyMatch("", "Molar Mass")).toBe(true);
    });
    it("matches a short typo of a short word", function (): void {
        expect(fuzzyMatch("Gat", "Gas")).toBe(true);
    });
});
