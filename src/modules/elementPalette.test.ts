import {describe, it, expect} from "vitest";
import {categoryColors, CATEGORY_COLORS, FALLBACK_CATEGORY_COLORS} from "./elementPalette.js";

/** WCAG relative luminance. */
function luminance(hex: string): number {
    let value: string = hex.replace("#", "");
    let channels: number[] = [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16)
    ];
    let linear: number[] = channels.map(function (channel: number): number {
        let c: number = channel / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** WCAG contrast ratio between two hex colours. */
function contrast(a: string, b: string): number {
    let la: number = luminance(a);
    let lb: number = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const AA_MIN = 4.5;

describe("element category palette", function (): void {
    let entries: Array<[string, {background: string; foreground: string}]> = Object.entries(CATEGORY_COLORS);

    it("covers every category the periodic table renders", function (): void {
        expect(Object.keys(CATEGORY_COLORS).sort()).toEqual([
            "actinide",
            "alkali metal",
            "alkaline earth metal",
            "halogen",
            "lanthanide",
            "metalloid",
            "noble gas",
            "non-metal",
            "post-transition metal",
            "transition metal"
        ]);
    });

    it("meets WCAG AA contrast for every category", function (): void {
        let failures: string[] = [];
        let i: number;
        for (i = 0; i < entries.length; i++) {
            let ratio = contrast(entries[i][1].background, entries[i][1].foreground);
            if (ratio < AA_MIN) {
                failures.push(entries[i][0] + " " + ratio.toFixed(2));
            }
        }
        expect(failures).toEqual([]);
    });

    it("meets WCAG AA contrast for the neutral fallback", function (): void {
        expect(contrast(FALLBACK_CATEGORY_COLORS.background, FALLBACK_CATEGORY_COLORS.foreground)).toBeGreaterThanOrEqual(AA_MIN);
    });

    it("never reuses a background between categories", function (): void {
        let backgrounds: string[] = entries.map(function (entry: [string, {background: string}]): string {
            return entry[1].background;
        });
        expect(new Set(backgrounds).size).toBe(backgrounds.length);
    });

    it("resolves a known category to its palette entry", function (): void {
        expect(categoryColors("alkali metal")).toBe(CATEGORY_COLORS["alkali metal"]);
    });

    it("falls back to neutral colours for an unknown category", function (): void {
        expect(categoryColors("mystery")).toBe(FALLBACK_CATEGORY_COLORS);
    });
});
