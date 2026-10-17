import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {NumberFormatter} from "./numberFormatter.js";
import {TranslationManager} from "./translationManager.js";
describe("NumberFormatter", function (): void {
    describe("constructor", function (): void {
        it("creates a formatter with the given locale and default decimals", function (): void {
            let formatter: NumberFormatter = new NumberFormatter("en-US", 2);
            expect(formatter.format(1234.567)).toContain("1234.57");
        });
        it("uses default decimals of 4 when not specified", function (): void {
            let formatter: NumberFormatter = new NumberFormatter("en-US");
            expect(formatter.format(1.23456789)).toContain("1.2346");
        });
    });
    describe("format", function (): void {
        let formatter: NumberFormatter;
        beforeEach(function (): void {
            formatter = new NumberFormatter("en-US", 4);
        });
        it("formats a positive number with the specified decimals", function (): void {
            expect(formatter.format(42.123456789, 2)).toContain("42.12");
        });
        it("formats zero", function (): void {
            expect(formatter.format(0)).toContain("0");
        });
        it("formats a negative number", function (): void {
            expect(formatter.format(-5.5, 2)).toContain("-5.5");
        });
        it("uses the default decimals when decimals argument is omitted", function (): void {
            let result: string = formatter.format(3.14159265);
            expect(result).toContain("3.1416");
        });
        it("returns toFixed for Infinity", function (): void {
            let result: string = formatter.format(Infinity, 4);
            expect(result).toBe("Infinity");
        });
        it("returns toFixed for -Infinity", function (): void {
            let result: string = formatter.format(-Infinity, 4);
            expect(result).toBe("-Infinity");
        });
        it("returns toFixed for NaN", function (): void {
            let result: string = formatter.format(NaN, 4);
            expect(result).toBe("NaN");
        });
        it("formats with locale-aware decimal separator for German locale", function (): void {
            let germanFormatter: NumberFormatter = new NumberFormatter("de-DE", 2);
            let result: string = germanFormatter.format(1234.5, 2);
            expect(result).toContain("1234");
            expect(result).toContain("50");
        });
        it("formats with useGrouping disabled", function (): void {
            let result: string = formatter.format(1234567.89, 2);
            expect(result).not.toContain(",");
        });
        it("handles very small numbers", function (): void {
            let result: string = formatter.format(0.0001, 6);
            expect(parseFloat(result)).toBeCloseTo(0.0001, 6);
        });
    });
    describe("formatScientific", function (): void {
        it("formats a large number in scientific notation", function (): void {
            let formatter: NumberFormatter = new NumberFormatter("en-US", 4);
            let result: string = formatter.formatScientific(123456789);
            expect(result).toMatch(/[eE]/);
            expect(result).toContain("8");
        });
        it("formats a small number in scientific notation", function (): void {
            let formatter: NumberFormatter = new NumberFormatter("en-US", 4);
            let result: string = formatter.formatScientific(0.000012345);
            expect(result).toMatch(/[eE]-/);
        });
        it("formats zero in scientific notation", function (): void {
            let formatter: NumberFormatter = new NumberFormatter("en-US", 4);
            let result: string = formatter.formatScientific(0);
            expect(result).toContain("0");
        });
    });
    describe("createFromCurrentLocale", function (): void {
        beforeEach(function (): void {
            TranslationManager.resetInstance();
        });
        afterEach(function (): void {
            TranslationManager.resetInstance();
        });
        it("creates a formatter using the locale from TranslationManager", function (): void {
            let tm: TranslationManager = TranslationManager.getInstance();
            tm.setLocale("fr-FR");
            let formatter: NumberFormatter = NumberFormatter.createFromCurrentLocale();
            expect(formatter).toBeInstanceOf(NumberFormatter);
            let result: string = formatter.format(1234.5, 2);
            expect(result).toContain("1234");
        });
        it("creates a formatter with default locale when TranslationManager has default", function (): void {
            let formatter: NumberFormatter = NumberFormatter.createFromCurrentLocale();
            expect(formatter).toBeInstanceOf(NumberFormatter);
            expect(formatter.format(42)).toContain("42");
        });
    });
});
