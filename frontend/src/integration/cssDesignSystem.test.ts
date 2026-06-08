import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const cssContent = fs.readFileSync(path.resolve(__dirname, "../../src/style.css"), "utf-8");

function getRootVars(css: string): Set<string> {
    const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
    if (!rootMatch) return new Set();
    const vars = new Set<string>();
    const varMatches = rootMatch[1].matchAll(/--([a-zA-Z0-9-]+)/g);
    for (const m of varMatches) vars.add(m[1]);
    return vars;
}

function getDarkVars(css: string): Set<string> {
    const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);
    if (!darkMatch) return new Set();
    const vars = new Set<string>();
    const varMatches = darkMatch[1].matchAll(/--([a-zA-Z0-9-]+)/g);
    for (const m of varMatches) vars.add(m[1]);
    return vars;
}

function getVarValue(css: string, block: string, varName: string): string | undefined {
    const regex = new RegExp(`--${varName}\\s*:\\s*([^;]+)`, "g");
    const match = regex.exec(block);
    return match ? match[1].trim() : undefined;
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

describe("CSS Design System", () => {
    const rootVars = getRootVars(cssContent);
    const darkVars = getDarkVars(cssContent);
    const rootBlock = extractBlock(":root", cssContent);
    const darkBlock = extractBlock(".dark", cssContent);

    it("All MD3 primary color tokens defined in :root", () => {
        const primaryTokens = [
            "md-primary",
            "md-on-primary",
            "md-primary-container",
            "md-on-primary-container",
        ];
        for (const token of primaryTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 secondary color tokens defined", () => {
        const secondaryTokens = [
            "md-secondary",
            "md-on-secondary",
            "md-secondary-container",
            "md-on-secondary-container",
        ];
        for (const token of secondaryTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 tertiary color tokens defined", () => {
        const tertiaryTokens = [
            "md-tertiary",
            "md-on-tertiary",
            "md-tertiary-container",
            "md-on-tertiary-container",
        ];
        for (const token of tertiaryTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 error color tokens defined", () => {
        const errorTokens = [
            "md-error",
            "md-on-error",
            "md-error-container",
            "md-on-error-container",
        ];
        for (const token of errorTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 success color tokens defined", () => {
        const successTokens = [
            "md-success",
            "md-on-success",
            "md-success-container",
            "md-on-success-container",
        ];
        for (const token of successTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 warning color tokens defined", () => {
        const warningTokens = [
            "md-warning",
            "md-on-warning",
            "md-warning-container",
            "md-on-warning-container",
        ];
        for (const token of warningTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 surface tokens defined", () => {
        const surfaceTokens = [
            "md-surface",
            "md-surface-dim",
            "md-surface-bright",
            "md-surface-container-lowest",
            "md-surface-container-low",
            "md-surface-container",
            "md-surface-container-high",
            "md-surface-container-highest",
            "md-on-surface",
            "md-on-surface-variant",
            "md-surface-variant",
            "md-inverse-surface",
            "md-inverse-on-surface",
        ];
        for (const token of surfaceTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 outline tokens defined", () => {
        const outlineTokens = ["md-outline", "md-outline-variant"];
        for (const token of outlineTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 shape tokens defined", () => {
        const shapeTokens = [
            "md-shape-xs",
            "md-shape-sm",
            "md-shape-md",
            "md-shape-lg",
            "md-shape-xl",
            "md-shape-full",
        ];
        for (const token of shapeTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 spacing tokens defined", () => {
        const spacingTokens = [
            "md-space-1",
            "md-space-2",
            "md-space-3",
            "md-space-4",
            "md-space-5",
            "md-space-6",
            "md-space-8",
            "md-space-10",
            "md-space-12",
        ];
        for (const token of spacingTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 motion tokens defined", () => {
        const motionTokens = [
            "md-motion-easing-standard",
            "md-motion-easing-emphasized-decelerate",
            "md-motion-easing-emphasized-accelerate",
            "md-motion-easing-decelerated",
            "md-motion-easing-accelerated",
            "md-motion-duration-short1",
            "md-motion-duration-short2",
            "md-motion-duration-short3",
            "md-motion-duration-short4",
            "md-motion-duration-medium1",
            "md-motion-duration-medium2",
            "md-motion-duration-medium3",
            "md-motion-duration-medium4",
            "md-motion-duration-long1",
            "md-motion-duration-long2",
        ];
        for (const token of motionTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 elevation tokens defined", () => {
        const elevationTokens = [
            "md-elevation-1",
            "md-elevation-2",
            "md-elevation-3",
            "md-elevation-4",
            "md-elevation-5",
        ];
        for (const token of elevationTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 state layer tokens defined", () => {
        const stateTokens = [
            "md-state-hover",
            "md-state-focus",
            "md-state-pressed",
            "md-state-dragged",
        ];
        for (const token of stateTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("All MD3 input tokens defined", () => {
        const inputTokens = [
            "md-input-bg",
            "md-input-text",
            "md-input-border",
            "md-input-placeholder",
            "md-input-focus-border",
            "md-input-hover-border",
        ];
        for (const token of inputTokens) {
            expect(rootVars.has(token), `Missing --${token} in :root`).toBe(true);
        }
    });

    it("Dark theme overrides all color tokens", () => {
        const colorTokens = [
            "md-primary",
            "md-on-primary",
            "md-primary-container",
            "md-on-primary-container",
            "md-secondary",
            "md-on-secondary",
            "md-secondary-container",
            "md-on-secondary-container",
            "md-tertiary",
            "md-on-tertiary",
            "md-tertiary-container",
            "md-on-tertiary-container",
            "md-error",
            "md-on-error",
            "md-error-container",
            "md-on-error-container",
            "md-success",
            "md-on-success",
            "md-success-container",
            "md-on-success-container",
            "md-warning",
            "md-on-warning",
            "md-warning-container",
            "md-on-warning-container",
            "md-surface",
            "md-on-surface",
            "md-outline",
            "md-outline-variant",
        ];
        for (const token of colorTokens) {
            expect(darkVars.has(token), `Missing --${token} in .dark`).toBe(true);
        }
    });

    it("Dark theme has different surface values than light theme", () => {
        const surfaceTokens = [
            "md-surface",
            "md-surface-dim",
            "md-surface-bright",
            "md-surface-container",
        ];
        for (const token of surfaceTokens) {
            const lightVal = getVarValue(cssContent, rootBlock, token);
            const darkVal = getVarValue(cssContent, darkBlock, token);
            expect(lightVal).toBeDefined();
            expect(darkVal).toBeDefined();
            expect(darkVal, `--${token} should differ between light and dark`).not.toBe(lightVal);
        }
    });

    it("Dark theme has different outline values than light theme", () => {
        const outlineTokens = ["md-outline", "md-outline-variant"];
        for (const token of outlineTokens) {
            const lightVal = getVarValue(cssContent, rootBlock, token);
            const darkVal = getVarValue(cssContent, darkBlock, token);
            expect(lightVal).toBeDefined();
            expect(darkVal).toBeDefined();
            expect(darkVal, `--${token} should differ between light and dark`).not.toBe(lightVal);
        }
    });

    it("No duplicate CSS variable definitions in :root", () => {
        const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
        expect(rootMatch).toBeTruthy();
        const rootBody = rootMatch![1];
        const seen = new Map<string, number>();
        const varRegex = /--([a-zA-Z0-9-]+)\s*:/g;
        let match;
        while ((match = varRegex.exec(rootBody)) !== null) {
            const name = match[1];
            const count = seen.get(name) ?? 0;
            seen.set(name, count + 1);
        }
        const duplicates = [...seen.entries()].filter(([, count]) => count > 1);
        expect(duplicates, `Duplicate variables in :root: ${duplicates.map(([n]) => n).join(", ")}`).toHaveLength(0);
    });

    it("All used CSS variables in the file are defined in :root", () => {
        const usageRegex = /var\(--([a-zA-Z0-9-]+)\)/g;
        const usedVars = new Set<string>();
        let match;
        while ((match = usageRegex.exec(cssContent)) !== null) {
            usedVars.add(match[1]);
        }
        const missing = [...usedVars].filter(v => !rootVars.has(v));
        expect(missing, `Variables used but not defined in :root: ${missing.join(", ")}`).toHaveLength(0);
    });

    it("--md-scrim token is defined in both light and dark themes", () => {
        expect(rootVars.has("md-scrim"), "Missing --md-scrim in :root").toBe(true);
        expect(darkVars.has("md-scrim"), "Missing --md-scrim in .dark").toBe(true);

        const lightScrim = getVarValue(cssContent, rootBlock, "md-scrim");
        const darkScrim = getVarValue(cssContent, darkBlock, "md-scrim");
        expect(lightScrim).toBeDefined();
        expect(darkScrim).toBeDefined();
    });

    it("Dark theme overrides all input tokens", () => {
        const inputTokens = [
            "md-input-bg",
            "md-input-text",
            "md-input-border",
            "md-input-placeholder",
            "md-input-focus-border",
            "md-input-hover-border",
        ];
        for (const token of inputTokens) {
            expect(darkVars.has(token), `Missing --${token} in .dark`).toBe(true);
        }
    });

    it("Dark theme input background differs from light theme", () => {
        const lightVal = getVarValue(cssContent, rootBlock, "md-input-bg");
        const darkVal = getVarValue(cssContent, darkBlock, "md-input-bg");
        expect(lightVal).toBeDefined();
        expect(darkVal).toBeDefined();
        expect(darkVal).not.toBe(lightVal);
    });

    it("Dark theme input text differs from light theme", () => {
        const lightVal = getVarValue(cssContent, rootBlock, "md-input-text");
        const darkVal = getVarValue(cssContent, darkBlock, "md-input-text");
        expect(lightVal).toBeDefined();
        expect(darkVal).toBeDefined();
        expect(darkVal).not.toBe(lightVal);
    });

    it("CSS file contains color-scheme: light for form elements", () => {
        expect(cssContent).toContain("color-scheme");
        expect(cssContent).toContain("light");
    });

    it("CSS file contains !important for input background", () => {
        expect(cssContent).toContain("--md-input-bg");
        expect(cssContent).toContain("!important");
    });

    it("No duplicate CSS variable definitions in .dark", () => {
        const darkMatch = cssContent.match(/\.dark\s*\{([^}]+)\}/);
        expect(darkMatch).toBeTruthy();
        const darkBody = darkMatch![1];
        const seen = new Map<string, number>();
        const varRegex = /--([a-zA-Z0-9-]+)\s*:/g;
        let match;
        while ((match = varRegex.exec(darkBody)) !== null) {
            const name = match[1];
            const count = seen.get(name) ?? 0;
            seen.set(name, count + 1);
        }
        const duplicates = [...seen.entries()].filter(([, count]) => count > 1);
        expect(duplicates, `Duplicate variables in .dark: ${duplicates.map(([n]) => n).join(", ")}`).toHaveLength(0);
    });

    it("Dark theme has different primary color than light theme", () => {
        const lightVal = getVarValue(cssContent, rootBlock, "md-primary");
        const darkVal = getVarValue(cssContent, darkBlock, "md-primary");
        expect(lightVal).toBeDefined();
        expect(darkVal).toBeDefined();
        expect(darkVal).not.toBe(lightVal);
    });

    it("All shape tokens use valid CSS border-radius values", () => {
        const shapeTokens = ["md-shape-xs", "md-shape-sm", "md-shape-md", "md-shape-lg", "md-shape-xl", "md-shape-full"];
        for (const token of shapeTokens) {
            const val = getVarValue(cssContent, rootBlock, token);
            expect(val).toBeDefined();
            expect(val!.length).toBeGreaterThan(0);
        }
    });
});
