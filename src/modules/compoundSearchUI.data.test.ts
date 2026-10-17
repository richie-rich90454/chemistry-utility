import { describe, it, expect, vi } from "vitest";

const records = vi.hoisted(function () {
    return [
        {
            "id": "water",
            "name": "Water",
            "formula": "H2O",
            "casNumber": "7732-18-5",
            "smiles": "O"
        },
        {
            "id": "broken",
            "name": "Broken compound",
            "formula": "Xx2",
            "casNumber": "0000-00-0",
            "smiles": "X"
        }
    ];
});

vi.mock("../../public/compounds.json", function () {
    return { "default": records };
});

import { searchCompounds, fetchCompoundDetail } from "./compoundSearchUI.js";

describe("compoundSearchUI dataset edge cases", function (): void {
    it("falls back to a zero molar mass when a record formula cannot be parsed", async function (): Promise<void> {
        let results = await searchCompounds("broken", "name");
        expect(results.length).toBe(1);
        expect(results[0].molarMass).toBe(0);
    });

    it("defaults a missing InChI to an empty string", async function (): Promise<void> {
        let detail = await fetchCompoundDetail("water");
        expect(detail.inchi).toBe("");
    });
});
