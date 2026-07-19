import {ChemicalElement} from "../types.js";

/**
 * Looks up a chemical element by symbol, name, or atomic number.
 *
 * Matching is case-insensitive and trims surrounding whitespace from the
 * query. The first matching element in the provided list is returned. If the
 * query is empty (or whitespace-only) or no element matches, returns null.
 *
 * @param query - Element symbol (e.g. "H"), name (e.g. "Hydrogen"), or atomic number (e.g. "1")
 * @param elements - List of chemical elements to search
 * @returns The matching element, or null if none found
 */
export function lookupElement(query: string, elements: ChemicalElement[]): ChemicalElement | null {
	let trimmed = query.trim().toLowerCase();
	if (trimmed === "") {
		return null;
	}
	for (let i = 0; i < elements.length; i++) {
		let el = elements[i];
		if (
			el.symbol.toLowerCase() === trimmed ||
			el.name.toLowerCase() === trimmed ||
			String(el.atomicNumber) === trimmed
		) {
			return el;
		}
	}
	return null;
}
