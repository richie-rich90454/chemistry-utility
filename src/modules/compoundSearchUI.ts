import compoundsData from "../../public/compounds.json";
import { molarMass } from "./calculators/molarMass.js";
import { loadElements } from "./calculators/elementData.js";

export interface CompoundResult {
    id: string;
    name: string;
    formula: string;
    molarMass: number;
    casNumber: string;
    smiles: string;
}

export interface CompoundDetail extends CompoundResult {
    inchi: string;
    properties: Record<string, string>;
    source: string;
}

export interface FormulaSegment {
    text: string;
    isSubscript: boolean;
}

interface CompoundRecord {
    id: string;
    name: string;
    formula: string;
    casNumber: string;
    smiles: string;
    inchi?: string;
}

/**
 * The bundled compound dataset. The website is static, so compound search
 * runs entirely in the browser over this file rather than against a server.
 * Molar mass is computed from the formula with the shared molar-mass
 * calculator, so it can never disagree with the calculator of the same name.
 */
const RECORDS: CompoundRecord[] = compoundsData as CompoundRecord[];

const SOURCE = "Bundled dataset";

function molarMassOf(formula: string): number {
    try {
        return Math.round(molarMass(formula, loadElements()) * 1000) / 1000;
    } catch {
        return 0;
    }
}

function toResult(record: CompoundRecord): CompoundResult {
    return {
        "id": record.id,
        "name": record.name,
        "formula": record.formula,
        "molarMass": molarMassOf(record.formula),
        "casNumber": record.casNumber,
        "smiles": record.smiles
    };
}

function matches(record: CompoundRecord, query: string, type: string): boolean {
    let formula: string = record.formula.toLowerCase();
    let name: string = record.name.toLowerCase();
    let smiles: string = record.smiles.toLowerCase();
    if (type === "formula") {
        return formula.indexOf(query) !== -1;
    }
    if (type === "cas") {
        return record.casNumber.indexOf(query) !== -1;
    }
    if (type === "smiles") {
        return smiles.indexOf(query) !== -1;
    }
    return name.indexOf(query) !== -1;
}

/**
 * Searches the bundled dataset by name, formula, CAS number, or SMILES.
 * The query is matched case-insensitively as a substring.
 */
export function searchCompounds(query: string, type: string): Promise<CompoundResult[]> {
    let normalized: string = query.trim().toLowerCase();
    if (normalized === "") {
        return Promise.resolve([]);
    }
    let results: CompoundResult[] = [];
    let i: number;
    for (i = 0; i < RECORDS.length; i++) {
        if (matches(RECORDS[i], normalized, type)) {
            results.push(toResult(RECORDS[i]));
        }
    }
    return Promise.resolve(results);
}

/** Returns the full record for a compound id, or rejects if it is unknown. */
export function fetchCompoundDetail(id: string): Promise<CompoundDetail> {
    let i: number;
    for (i = 0; i < RECORDS.length; i++) {
        if (RECORDS[i].id === id) {
            let record: CompoundRecord = RECORDS[i];
            let result: CompoundResult = toResult(record);
            return Promise.resolve({
                "id": result.id,
                "name": result.name,
                "formula": result.formula,
                "molarMass": result.molarMass,
                "casNumber": result.casNumber,
                "smiles": result.smiles,
                "inchi": record.inchi ?? "",
                "properties": {},
                "source": SOURCE
            });
        }
    }
    return Promise.reject(new Error("Compound not found: " + id));
}

/**
 * Splits a formula into text and subscript segments so a renderer can wrap the
 * digits in <sub> without parsing the formula itself.
 */
export function buildFormulaSegments(formula: string): FormulaSegment[] {
    let segments: FormulaSegment[] = [];
    let buffer: string = "";
    let i: number;
    for (i = 0; i < formula.length; i++) {
        let ch: string = formula.charAt(i);
        if (ch >= "0" && ch <= "9") {
            if (buffer.length > 0) {
                segments.push({"text": buffer, "isSubscript": false});
                buffer = "";
            }
            segments.push({"text": ch, "isSubscript": true});
        }
        else {
            buffer = buffer + ch;
        }
    }
    if (buffer.length > 0) {
        segments.push({"text": buffer, "isSubscript": false});
    }
    return segments;
}
