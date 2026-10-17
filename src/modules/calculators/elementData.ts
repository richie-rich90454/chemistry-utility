import type { ChemicalElement } from "../../types.js";
import ptable from "../../../public/ptable.json";

let table: ChemicalElement[] | null = null;

/**
 * The periodic-table data the pure calculators that reason about elements
 * need. It is loaded lazily once and cached for the process, mirroring the
 * sync.Once element load in core/: every engine sees the same table, and no
 * caller has to thread it through a pure calculator.
 */
export function loadElements(): ChemicalElement[] {
    if (table === null) {
        table = ptable as ChemicalElement[];
    }
    return table;
}
