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
        const rootVars = extractVariables(extractBlock(":root", css));
        const darkVars = extractVariables(extractBlock(".dark", css));

        // Only compare color/surface/elevation/state variables (not shape/spacing/motion which are theme-independent)
        const isThemeVar = (v: string) =>
            v.startsWith("md-primary") || v.startsWith("md-on-primary") ||
            v.startsWith("md-secondary") || v.startsWith("md-on-secondary") ||
            v.startsWith("md-tertiary") || v.startsWith("md-on-tertiary") ||
            v.startsWith("md-error") || v.startsWith("md-on-error") ||
            v.startsWith("md-success") || v.startsWith("md-on-success") ||
            v.startsWith("md-warning") || v.startsWith("md-on-warning") ||
            v.startsWith("md-surface") || v.startsWith("md-on-surface") ||
            v.startsWith("md-inverse") || v.startsWith("md-outline") ||
            v.startsWith("md-background") || v.startsWith("md-on-background") ||
            v.startsWith("md-scrim") || v.startsWith("md-elevation") ||
            v.startsWith("md-state-");

        const rootThemeVars = [...rootVars].filter(isThemeVar);
        const darkThemeVars = [...darkVars].filter(isThemeVar);

        const rootOnly = rootThemeVars.filter(v => !darkVars.has(v));
        const darkOnly = darkThemeVars.filter(v => !rootVars.has(v));

        expect(rootOnly).toEqual([]);
        expect(darkOnly).toEqual([]);
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

        // Check color variables (MD3 naming)
        expect(rootVars.has("md-primary")).toBe(true);
        expect(rootVars.has("md-error")).toBe(true);
        expect(rootVars.has("md-success")).toBe(true);

        // Check spacing variables (MD3 naming)
        expect(rootVars.has("md-space-2")).toBe(true);
        expect(rootVars.has("md-space-4")).toBe(true);

        // Check radius variables (MD3 naming)
        expect(rootVars.has("md-shape-sm")).toBe(true);
        expect(rootVars.has("md-shape-lg")).toBe(true);

        // Check shadow/elevation variables (MD3 naming)
        expect(rootVars.has("md-elevation-1")).toBe(true);
        expect(rootVars.has("md-elevation-2")).toBe(true);

        // Check motion variables (MD3 naming)
        expect(rootVars.has("md-motion-duration-short4")).toBe(true);
        expect(rootVars.has("md-motion-duration-medium2")).toBe(true);
    });
});
