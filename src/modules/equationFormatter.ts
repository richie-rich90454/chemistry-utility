/**
 * Equation formatting and parsing utilities — parsing chemical equation
 * strings into structured term arrays.
 * Pure TypeScript, no JSX or SolidJS imports.
 */

import { normalizeArrows } from "fast-balance";

export interface EquationTerm {
    coefficient: string;
    formula: string;
}

export function parseSide(side: string): EquationTerm[] {
    // Accept both spaced ("H2 + O2") and spaceless ("H2+O2") terms. A "+"
    // is a separator only when followed by a term start (uppercase letter,
    // digit, or opening bracket), so ionic charges ("Fe2+", "Cl-") survive.
    let parts: string[] = [];
    let current: string = "";
    for (let i = 0; i < side.length; i++) {
        let ch: string = side[i];
        if (ch === "+") {
            let j: number = i + 1;
            let next: string = j < side.length ? side[j] : "";
            if (next >= "A" && next <= "Z") {
                parts.push(current);
                current = "";
                continue;
            }
            if (next >= "0" && next <= "9") {
                parts.push(current);
                current = "";
                continue;
            }
            if (next === "(" || next === "[") {
                parts.push(current);
                current = "";
                continue;
            }
        }
        current = current + ch;
    }
    parts.push(current);
    let terms = parts.map(function (p: string): string { return p.trim(); }).filter(function (p: string): boolean { return p !== ""; });
    let result: EquationTerm[] = [];
    for (let i = 0; i < terms.length; i++) {
        let term = terms[i];
        let match = term.match(/^(\d+)\s+(.+)$/);
        if (match !== null) {
            result.push({ coefficient: match[1], formula: match[2] });
        } else {
            result.push({ coefficient: "", formula: term.trim() });
        }
    }
    return result;
}

export function parseBalancedEquation(equation: string): { reactants: EquationTerm[]; products: EquationTerm[] } {
    let normalized = normalizeArrows(equation);
    let sides = normalized.split(" -> ");
    if (sides.length !== 2) {
        sides = normalized.split("->");
    }
    if (sides.length !== 2) {
        sides = normalized.split(" = ");
    }
    if (sides.length !== 2) {
        sides = normalized.split("=");
    }
    if (sides.length !== 2) {
        return { reactants: [{ coefficient: "", formula: equation }], products: [] };
    }
    return { reactants: parseSide(sides[0]), products: parseSide(sides[1]) };
}

/**
 * Sanitize a chemical formula for use as a DOM element id.
 */
export function sanitizeId(formula: string): string {
    let safe: string = formula.replace(/[^A-Za-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return safe === "" ? "formula" : safe;
}
