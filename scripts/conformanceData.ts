import {ChemicalElement} from "../src/types.js";
import {readFileSync} from "node:fs";
import {join} from "node:path";

let cached: ChemicalElement[] | null = null;

export function elementsToDataset(): ChemicalElement[] {
    if (cached !== null) {
        return cached;
    }
    let raw = readFileSync(join(process.cwd(), "public", "ptable.json"), "utf8");
    cached = JSON.parse(raw) as ChemicalElement[];
    return cached;
}
