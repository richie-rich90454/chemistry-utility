import { describe, it, expect, vi, afterEach } from "vitest";
import { useUnitConverter } from "./useUnitConverter";
import { UnitConverter } from "../../modules/unitConverter.js";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useUnitConverter", () => {
    it("initializes from the first category and units", () => {
        const hook = useUnitConverter();
        const cats = UnitConverter.getCategories();
        expect(hook.categories()).toEqual(cats);
        expect(hook.category()).toBe(cats[0]);
        const units = UnitConverter.getUnitsForCategory(cats[0]);
        expect(hook.unitsForCategory(cats[0])).toEqual(units);
    });

    it("setCategory updates from/to units and clears result", () => {
        const hook = useUnitConverter();
        const cats = UnitConverter.getCategories();
        const other = cats.length > 1 ? cats[1] : cats[0];
        hook.setValue("5");
        hook.setCategory(other);
        const units = UnitConverter.getUnitsForCategory(other);
        expect(hook.category()).toBe(other);
        if (units.length === 0) {
            expect(hook.result()).toBeNull();
        } else {
            expect(hook.fromUnit()).toBe(units[0]);
        }
    });

    it("setCategory with unknown category clears units and result", () => {
        const hook = useUnitConverter();
        hook.setCategory("__missing__");
        expect(hook.fromUnit()).toBe("");
        expect(hook.toUnit()).toBe("");
        expect(hook.result()).toBeNull();
        expect(hook.error()).toBe("");
    });

    it("setCategory with a single-unit category uses it for both ends", () => {
        vi.spyOn(UnitConverter, "getUnitsForCategory").mockReturnValue(["only"]);
        const hook = useUnitConverter();
        hook.setCategory("mock-cat");
        expect(hook.fromUnit()).toBe("only");
        expect(hook.toUnit()).toBe("only");
    });

    it("initializes with a single-unit first category", () => {
        vi.spyOn(UnitConverter, "getCategories").mockReturnValue(["mock-cat"]);
        vi.spyOn(UnitConverter, "getUnitsForCategory").mockReturnValue(["only"]);
        const hook = useUnitConverter();
        expect(hook.category()).toBe("mock-cat");
        expect(hook.fromUnit()).toBe("only");
        expect(hook.toUnit()).toBe("only");
    });

    it("convert reports an error for empty value", () => {
        const hook = useUnitConverter();
        hook.setValue("   ");
        hook.convert();
        expect(hook.error()).toBe("Please enter a numeric value");
        expect(hook.result()).toBeNull();
    });

    it("convert reports an error for non-numeric value", () => {
        const hook = useUnitConverter();
        hook.setValue("abc");
        hook.convert();
        expect(hook.error()).toBe("Please enter a valid numeric value");
        expect(hook.result()).toBeNull();
    });

    it("convert produces a single-target result", () => {
        const hook = useUnitConverter();
        const cat = hook.category();
        const units = UnitConverter.getUnitsForCategory(cat);
        hook.setValue("1");
        hook.convert();
        expect(hook.error()).toBe("");
        const res = hook.result();
        expect(res).not.toBeNull();
        expect(res!.isTable).toBe(false);
        expect(res!.targetValue.length).toBeGreaterThan(0);
        void units;
    });

    it("convert to all builds a table", () => {
        const hook = useUnitConverter();
        hook.setValue("1");
        hook.setToUnit("all");
        hook.convert();
        expect(hook.error()).toBe("");
        const res = hook.result();
        expect(res).not.toBeNull();
        expect(res!.isTable).toBe(true);
        expect(res!.rows.length).toBeGreaterThan(0);
    });

    it("convert surfaces converter errors", () => {
        const hook = useUnitConverter();
        hook.setValue("1");
        hook.setToUnit("__bad_unit__");
        hook.convert();
        expect(hook.error().length).toBeGreaterThan(0);
        expect(hook.result()).toBeNull();
    });

    it("convert surfaces non-Error throws as strings", () => {
        vi.spyOn(UnitConverter, "convert").mockImplementation(() => {
            throw "boom";
        });
        const hook = useUnitConverter();
        hook.setValue("1");
        hook.convert();
        expect(hook.error()).toBe("boom");
        expect(hook.result()).toBeNull();
    });

    it("setFromUnit/setToUnit/setValue update signals and clear resets", () => {
        const hook = useUnitConverter();
        hook.setFromUnit("x");
        expect(hook.fromUnit()).toBe("x");
        hook.setToUnit("y");
        expect(hook.toUnit()).toBe("y");
        hook.setValue("3");
        expect(hook.value()).toBe("3");
        hook.clear();
        expect(hook.value()).toBe("");
        expect(hook.result()).toBeNull();
        expect(hook.error()).toBe("");
    });
});
