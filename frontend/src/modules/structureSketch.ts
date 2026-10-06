/**
 * Hand-rolled structure-sketch model for the Molecular Viewer.
 * Zero dependencies: atoms/bonds are plain data rendered as an SVG
 * overlay by the route, and {@link sketchToSmiles} emits a SMILES string
 * into the existing SmilesDrawer viewer. Branching beyond a single chain
 * is a documented limitation (only consecutive-atom bonds are emitted);
 * full 2D editing is future work.
 */

export interface SketchAtom {
	id: number;
	element: string;
	x: number;
	y: number;
}

export interface SketchBond {
	from: number;
	to: number;
	order: 1 | 2 | 3;
}

export interface SketchState {
	atoms: SketchAtom[];
	bonds: SketchBond[];
	nextId: number;
}

/** Element palette offered by the sketch pad. */
export const SKETCH_PALETTE: string[] = ["C", "H", "O", "N", "S", "P", "F", "Cl", "Br", "I"];

/** Organic-subset symbols that may appear bare in SMILES output. */
const ORGANIC_SUBSET: string[] = ["B", "C", "N", "O", "P", "S", "F", "Cl", "Br", "I", "H"];

const BOND_SYMBOLS: Record<number, string> = {
	1: "-",
	2: "=",
	3: "#"
};

/** Creates an empty sketch. */
export function createSketch(): SketchState {
	return { atoms: [], bonds: [], nextId: 1 };
}

/** Removes all atoms and bonds, resetting id allocation. */
export function clearSketch(sketch: SketchState): void {
	sketch.atoms = [];
	sketch.bonds = [];
	sketch.nextId = 1;
}

/**
 * Appends an atom to the sketch. Throws on invalid element symbols.
 */
export function addSketchAtom(sketch: SketchState, element: string, x: number, y: number): SketchAtom {
	let trimmed = (element || "").trim();
	if (/^[A-Z][a-z]?$/.test(trimmed) === false) {
		throw new Error("Invalid element symbol: " + element);
	}
	let atom: SketchAtom = { id: sketch.nextId, element: trimmed, x: x, y: y };
	sketch.nextId += 1;
	sketch.atoms.push(atom);
	return atom;
}

/**
 * Connects two atoms by id. Throws when an id is unknown, when both ids
 * are equal, when the bond already exists, or when the order is invalid.
 */
export function connectSketchAtoms(sketch: SketchState, from: number, to: number, order?: 1 | 2 | 3): SketchBond {
	let bondOrder: 1 | 2 | 3 = order !== undefined ? order : 1;
	if (bondOrder !== 1 && bondOrder !== 2 && bondOrder !== 3) {
		throw new Error("Invalid bond order: " + String(order));
	}
	if (from === to) {
		throw new Error("Cannot bond an atom to itself");
	}
	let ids: Record<number, boolean> = {};
	for (let i = 0; i < sketch.atoms.length; i++) {
		ids[sketch.atoms[i].id] = true;
	}
	if (ids[from] !== true || ids[to] !== true) {
		throw new Error("Unknown atom id in bond");
	}
	for (let i = 0; i < sketch.bonds.length; i++) {
		let existing = sketch.bonds[i];
		if ((existing.from === from && existing.to === to) || (existing.from === to && existing.to === from)) {
			throw new Error("Bond already exists");
		}
	}
	let bond: SketchBond = { from: from, to: to, order: bondOrder };
	sketch.bonds.push(bond);
	return bond;
}

/** Removes the most recently added atom (and its bonds). No-op when empty. */
export function undoLastSketchAtom(sketch: SketchState): void {
	let removed = sketch.atoms.pop();
	if (removed === undefined) {
		return;
	}
	sketch.bonds = sketch.bonds.filter(function (bond: SketchBond): boolean {
		return bond.from !== removed.id && bond.to !== removed.id;
	});
}

function findBondBetween(sketch: SketchState, a: number, b: number): SketchBond | null {
	for (let i = 0; i < sketch.bonds.length; i++) {
		let bond = sketch.bonds[i];
		if ((bond.from === a && bond.to === b) || (bond.from === b && bond.to === a)) {
			return bond;
		}
	}
	return null;
}

function formatSketchSymbol(element: string): string {
	for (let i = 0; i < ORGANIC_SUBSET.length; i++) {
		if (ORGANIC_SUBSET[i] === element) {
			return element;
		}
	}
	return "[" + element + "]";
}

/**
 * Emits a SMILES string for the sketch: atoms in insertion order joined
 * by their bond symbols (`-`, `=`, `#`); atoms without a connecting bond
 * are separated with `.` (disconnected fragment). Returns "" for an
 * empty sketch. Non-chain (branch/cycle) bonds beyond consecutive atoms
 * are not represented.
 */
export function sketchToSmiles(sketch: SketchState): string {
	if (sketch.atoms.length === 0) {
		return "";
	}
	let parts: string[] = [formatSketchSymbol(sketch.atoms[0].element)];
	for (let i = 1; i < sketch.atoms.length; i++) {
		let bond = findBondBetween(sketch, sketch.atoms[i - 1].id, sketch.atoms[i].id);
		parts.push(bond !== null ? BOND_SYMBOLS[bond.order] : ".");
		parts.push(formatSketchSymbol(sketch.atoms[i].element));
	}
	return parts.join("");
}

/**
 * Derives the empirical formula (Hill order: C, then H, then
 * alphabetical) for molar-mass prefill from the sketched atoms.
 * Returns "" for an empty sketch.
 */
export function sketchToFormula(sketch: SketchState): string {
	if (sketch.atoms.length === 0) {
		return "";
	}
	let counts: Record<string, number> = {};
	for (let i = 0; i < sketch.atoms.length; i++) {
		let element = sketch.atoms[i].element;
		counts[element] = (counts[element] || 0) + 1;
	}
	let symbols = Object.keys(counts);
	let ordered: string[] = [];
	if (counts["C"] !== undefined) {
		ordered.push("C");
	}
	if (counts["H"] !== undefined) {
		ordered.push("H");
	}
	let rest = symbols.filter(function (symbol: string): boolean {
		return symbol !== "C" && symbol !== "H";
	}).sort();
	for (let i = 0; i < rest.length; i++) {
		ordered.push(rest[i]);
	}
	let formula = "";
	for (let i = 0; i < ordered.length; i++) {
		formula += ordered[i];
		if (counts[ordered[i]] > 1) {
			formula += String(counts[ordered[i]]);
		}
	}
	return formula;
}

/**
 * Builds a molar-mass calculator URL prefilled with `formula`.
 * Returns the bare base path when the formula is empty.
 */
export function buildMolarMassPrefillUrl(formula: string, base?: string): string {
	let basePath = base !== undefined && base.length > 0 ? base : "/molar-mass";
	let trimmed = (formula || "").trim();
	if (trimmed.length === 0) {
		return basePath;
	}
	return basePath + "?formula=" + encodeURIComponent(trimmed);
}

/** Builds a molar-mass prefill URL directly from a sketch. */
export function sketchToMolarMassUrl(sketch: SketchState, base?: string): string {
	return buildMolarMassPrefillUrl(sketchToFormula(sketch), base);
}
