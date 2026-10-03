import { describe, it, expect } from "vitest";
import {
    SKETCH_PALETTE,
    addSketchAtom,
    buildMolarMassPrefillUrl,
    clearSketch,
    connectSketchAtoms,
    createSketch,
    sketchToFormula,
    sketchToMolarMassUrl,
    sketchToSmiles,
    undoLastSketchAtom
} from "./structureSketch.js";

describe("structureSketch", () => {
    describe("createSketch / addSketchAtom", () => {
        it("starts empty with ids from 1", () => {
            const sketch = createSketch();
            const atom = addSketchAtom(sketch, "C", 10, 20);
            expect(atom.id).toBe(1);
            expect(atom.element).toBe("C");
            expect(sketch.atoms.length).toBe(1);
        });

        it("rejects invalid element symbols", () => {
            const sketch = createSketch();
            expect(() => addSketchAtom(sketch, "Carbon", 0, 0)).toThrow();
            expect(() => addSketchAtom(sketch, "", 0, 0)).toThrow();
            expect(() => addSketchAtom(sketch, "c", 0, 0)).toThrow();
        });

        it("offers a non-empty element palette", () => {
            expect(SKETCH_PALETTE).toContain("C");
            expect(SKETCH_PALETTE).toContain("O");
        });
    });

    describe("connectSketchAtoms", () => {
        it("connects two atoms with a default single bond", () => {
            const sketch = createSketch();
            const a = addSketchAtom(sketch, "C", 0, 0);
            const b = addSketchAtom(sketch, "O", 40, 0);
            const bond = connectSketchAtoms(sketch, a.id, b.id);
            expect(bond.order).toBe(1);
            expect(sketch.bonds.length).toBe(1);
        });

        it("rejects self-bonds, unknown ids, duplicates, and bad orders", () => {
            const sketch = createSketch();
            const a = addSketchAtom(sketch, "C", 0, 0);
            const b = addSketchAtom(sketch, "O", 40, 0);
            expect(() => connectSketchAtoms(sketch, a.id, a.id)).toThrow();
            expect(() => connectSketchAtoms(sketch, a.id, 999)).toThrow();
            connectSketchAtoms(sketch, a.id, b.id);
            expect(() => connectSketchAtoms(sketch, b.id, a.id)).toThrow();
            expect(() => connectSketchAtoms(sketch, a.id, b.id, 4 as unknown as 1)).toThrow();
        });
    });

    describe("undoLastSketchAtom / clearSketch", () => {
        it("undo removes the atom and its bonds", () => {
            const sketch = createSketch();
            const a = addSketchAtom(sketch, "C", 0, 0);
            const b = addSketchAtom(sketch, "O", 40, 0);
            connectSketchAtoms(sketch, a.id, b.id);
            undoLastSketchAtom(sketch);
            expect(sketch.atoms.length).toBe(1);
            expect(sketch.bonds.length).toBe(0);
        });

        it("undo on an empty sketch is a no-op", () => {
            const sketch = createSketch();
            expect(() => undoLastSketchAtom(sketch)).not.toThrow();
        });

        it("clear empties the sketch and resets ids", () => {
            const sketch = createSketch();
            addSketchAtom(sketch, "C", 0, 0);
            clearSketch(sketch);
            expect(sketch.atoms.length).toBe(0);
            expect(sketch.bonds.length).toBe(0);
            expect(addSketchAtom(sketch, "O", 0, 0).id).toBe(1);
        });
    });

    describe("sketchToSmiles SMILES handoff", () => {
        it("returns empty string for an empty sketch", () => {
            expect(sketchToSmiles(createSketch())).toBe("");
        });

        it("emits a single atom", () => {
            const sketch = createSketch();
            addSketchAtom(sketch, "C", 0, 0);
            expect(sketchToSmiles(sketch)).toBe("C");
        });

        it("emits a bonded chain with bond symbols", () => {
            const sketch = createSketch();
            const c = addSketchAtom(sketch, "C", 0, 0);
            const o = addSketchAtom(sketch, "O", 40, 0);
            connectSketchAtoms(sketch, c.id, o.id, 1);
            expect(sketchToSmiles(sketch)).toBe("C-O");
        });

        it("emits double and triple bonds", () => {
            const sketch = createSketch();
            const c = addSketchAtom(sketch, "C", 0, 0);
            const o = addSketchAtom(sketch, "O", 40, 0);
            connectSketchAtoms(sketch, c.id, o.id, 2);
            expect(sketchToSmiles(sketch)).toBe("C=O");

            const sketch2 = createSketch();
            const n1 = addSketchAtom(sketch2, "N", 0, 0);
            const n2 = addSketchAtom(sketch2, "N", 40, 0);
            connectSketchAtoms(sketch2, n1.id, n2.id, 3);
            expect(sketchToSmiles(sketch2)).toBe("N#N");
        });

        it("separates unbonded atoms as disconnected fragments", () => {
            const sketch = createSketch();
            addSketchAtom(sketch, "C", 0, 0);
            addSketchAtom(sketch, "O", 40, 0);
            expect(sketchToSmiles(sketch)).toBe("C.O");
        });

        it("brackets non-organic symbols", () => {
            const sketch = createSketch();
            addSketchAtom(sketch, "Na", 0, 0);
            expect(sketchToSmiles(sketch)).toBe("[Na]");
        });
    });

    describe("molar-mass prefill", () => {
        it("derives a Hill-order formula from sketched atoms", () => {
            const sketch = createSketch();
            addSketchAtom(sketch, "O", 0, 0);
            addSketchAtom(sketch, "H", 10, 0);
            addSketchAtom(sketch, "H", 20, 0);
            addSketchAtom(sketch, "C", 30, 0);
            expect(sketchToFormula(sketch)).toBe("CH2O");
        });

        it("returns empty formula for an empty sketch", () => {
            expect(sketchToFormula(createSketch())).toBe("");
        });

        it("builds a prefill URL with encoded formula", () => {
            expect(buildMolarMassPrefillUrl("H2O")).toBe("/molar-mass?formula=H2O");
            expect(buildMolarMassPrefillUrl("")).toBe("/molar-mass");
            expect(buildMolarMassPrefillUrl("Fe2+")).toBe("/molar-mass?formula=Fe2%2B");
        });

        it("builds a prefill URL directly from a sketch", () => {
            const sketch = createSketch();
            addSketchAtom(sketch, "O", 0, 0);
            addSketchAtom(sketch, "H", 10, 0);
            addSketchAtom(sketch, "H", 20, 0);
            expect(sketchToMolarMassUrl(sketch)).toBe("/molar-mass?formula=H2O");
            expect(sketchToMolarMassUrl(createSketch())).toBe("/molar-mass");
        });
    });
});
