/**
 * Equation formatting and parsing utilities — parsing chemical equation
 * strings into structured term arrays.
 * Pure TypeScript, no JSX or SolidJS imports.
 */

export interface EquationTerm {
    coefficient: string;
    formula: string;
}

export function parseSide(side: string): EquationTerm[] {
    let terms = side.split(" + ");
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
    let sides = equation.split(" -> ");
    if (sides.length !== 2) {
        sides = equation.split(" = ");
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
    return formula.replace(/[\(\)\[\]\{\}\,\s]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
