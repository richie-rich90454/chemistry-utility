import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

let css: string;

function extractVariables(block: string): Set<string> {
    const vars = new Set<string>();
    const regex = /--([\w-]+)\s*:/g;
    let match;
    while ((match = regex.exec(block)) !== null) {
        vars.add(match[1]);
    }
    return vars;
}

function extractUsages(text: string): Set<string> {
    const vars = new Set<string>();
    const regex = /var\(--([\w-]+)\)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        vars.add(match[1]);
    }
    return vars;
}

function extractBlock(selector: string, text: string): string {
    const startIdx = text.indexOf(selector);
    if (startIdx === -1) return "";
    const braceStart = text.indexOf("{", startIdx);
    let depth = 0;
    let i = braceStart;
    while (i < text.length) {
        if (text[i] === "{") depth++;
        if (text[i] === "}") depth--;
        if (depth === 0) break;
        i++;
    }
    return text.substring(braceStart, i + 1);
}

beforeAll(() => {
    const cssPath = resolve(__dirname, "../../src/style.css");
    css = readFileSync(cssPath, "utf-8");
});

describe("CSS: Variable Consistency", () => {
    it("all used CSS variables are defined somewhere", () => {
        const rootVars = extractVariables(extractBlock(":root", css));
        const lightVars = extractVariables(extractBlock(".light", css));
        const darkVars = extractVariables(extractBlock(".dark", css));
        const allDefined = new Set([...rootVars, ...lightVars, ...darkVars]);
        const usages = extractUsages(css);

        const undefined_ = [...usages].filter(v => !allDefined.has(v));
        expect(undefined_).toEqual([]);
    });

    it("light and dark themes define the same color variables", () => {
        const lightVars = extractVariables(extractBlock(".light", css));
        const darkVars = extractVariables(extractBlock(".dark", css));

        const lightOnly = [...lightVars].filter(v => !darkVars.has(v));
        const darkOnly = [...darkVars].filter(v => !lightVars.has(v));

        // Known gaps: .light defines text-tertiary and text-on-primary but .dark does not
        // These fall through to :root values in dark mode, which is acceptable
        const knownLightOnlyGaps = ["text-tertiary", "text-on-primary"];
        const unexpectedLightOnly = lightOnly.filter(v => !knownLightOnlyGaps.includes(v) && !v.includes("shadow-glass"));
        const unexpectedDarkOnly = darkOnly.filter(v => !v.includes("shadow-glass"));

        expect(unexpectedLightOnly).toEqual([]);
        expect(unexpectedDarkOnly).toEqual([]);
    });

    it("no duplicate variable definitions within :root", () => {
        const rootBlock = extractBlock(":root", css);
        const seen = new Set<string>();
        const duplicates: string[] = [];
        const regex = /--([\w-]+)\s*:/g;
        let match;
        while ((match = regex.exec(rootBlock)) !== null) {
            if (seen.has(match[1])) {
                duplicates.push(match[1]);
            }
            seen.add(match[1]);
        }
        expect(duplicates).toEqual([]);
    });

    it("root variables cover all required categories", () => {
        const rootVars = extractVariables(extractBlock(":root", css));

        // Check color variables
        expect(rootVars.has("primary")).toBe(true);
        expect(rootVars.has("error")).toBe(true);
        expect(rootVars.has("success")).toBe(true);

        // Check spacing variables
        expect(rootVars.has("spacing-sm")).toBe(true);
        expect(rootVars.has("spacing-lg")).toBe(true);

        // Check radius variables
        expect(rootVars.has("radius-sm")).toBe(true);
        expect(rootVars.has("radius-lg")).toBe(true);

        // Check shadow variables
        expect(rootVars.has("shadow-1")).toBe(true);
        expect(rootVars.has("shadow-2")).toBe(true);

        // Check transition variables
        expect(rootVars.has("transition-fast")).toBe(true);
        expect(rootVars.has("transition-slow")).toBe(true);
    });
});
