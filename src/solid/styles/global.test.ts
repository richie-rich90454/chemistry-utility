import {describe, it, expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

/**
 * Guards the contrast of the app-chrome colour tokens.
 *
 * The accent, its foreground, secondary text, and warning text all carry
 * meaning, so each is checked against WCAG AA (4.5:1) on the surface it is
 * used on. The values live in global.css, which is parsed here so a token
 * change cannot silently regress legibility.
 */

const CSS = readFileSync(join(process.cwd(), "src", "solid", "styles", "global.css"), "utf8");

function srgbToLinear(channel: number): number {
    let c: number = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
    let value: string = hex.replace("#", "");
    let channels: number[] = [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16)
    ];
    return 0.2126 * srgbToLinear(channels[0]) + 0.7152 * srgbToLinear(channels[1]) + 0.0722 * srgbToLinear(channels[2]);
}

function contrast(a: string, b: string): number {
    let la: number = luminance(a);
    let lb: number = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** The first declaration of `name` inside the first block matching `selector`. */
function token(selector: string, name: string): string {
    let block: RegExpMatchArray | null = CSS.match(new RegExp(selector + "\\s*\\{([\\s\\S]*?)\\}"));
    expect(block, "missing block " + selector).not.toBeNull();
    let declaration: RegExpMatchArray | null = (block as RegExpMatchArray)[1].match(new RegExp(name + ":\\s*(#[0-9A-Fa-f]{6})"));
    expect(declaration, "missing token " + name + " in " + selector).not.toBeNull();
    return (declaration as RegExpMatchArray)[1];
}

const AA = 4.5;

describe("app theme contrast", function (): void {
    it("light theme accent, secondary, and warning text clear AA", function (): void {
        let pane = token(":root", "--app-pane");
        let accent = token(":root", "--app-accent");
        let onAccent = token(":root", "--app-on-accent");
        expect(contrast(accent, onAccent)).toBeGreaterThanOrEqual(AA);
        expect(contrast(accent, pane)).toBeGreaterThanOrEqual(AA);
        expect(contrast(token(":root", "--app-text-secondary"), pane)).toBeGreaterThanOrEqual(AA);
        expect(contrast(token(":root", "--app-warning"), pane)).toBeGreaterThanOrEqual(AA);
    });

    it("dark theme accent, secondary, and warning text clear AA", function (): void {
        let pane = token("\\.dark", "--app-pane");
        let accent = token("\\.dark", "--app-accent");
        let onAccent = token("\\.dark", "--app-on-accent");
        expect(contrast(accent, onAccent)).toBeGreaterThanOrEqual(AA);
        expect(contrast(accent, pane)).toBeGreaterThanOrEqual(AA);
        expect(contrast(token("\\.dark", "--app-text-secondary"), pane)).toBeGreaterThanOrEqual(AA);
        expect(contrast(token("\\.dark", "--app-warning"), pane)).toBeGreaterThanOrEqual(AA);
    });

    it("amoled theme accent clears AA on its pane", function (): void {
        let pane = token("\\.amoled", "--app-pane");
        let accent = token("\\.amoled", "--app-accent");
        expect(contrast(accent, pane)).toBeGreaterThanOrEqual(AA);
        expect(contrast(accent, token("\\.amoled", "--app-on-accent"))).toBeGreaterThanOrEqual(AA);
    });
});
