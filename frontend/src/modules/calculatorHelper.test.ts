import { describe, it, expect } from "vitest";
import { groupByCategory, calculatorIdToRoute } from "./calculatorHelper.js";
import type { CalculatorInfo } from "./navigationManager.js";

function makeInfo(id: string, category: string): CalculatorInfo {
    return { id, name: id, category, icon: "x", description: "d" };
}

describe("groupByCategory", () => {
    it("returns empty array for empty input", () => {
        expect(groupByCategory([])).toEqual([]);
    });

    it("groups a single calculator into one group", () => {
        const result = groupByCategory([makeInfo("a", "General")]);
        expect(result).toEqual([{ category: "General", items: [makeInfo("a", "General")] }]);
    });

    it("groups consecutive calculators with the same category together", () => {
        const input = [makeInfo("a", "General"), makeInfo("b", "General")];
        const result = groupByCategory(input);
        expect(result.length).toBe(1);
        expect(result[0].category).toBe("General");
        expect(result[0].items.map((c) => c.id)).toEqual(["a", "b"]);
    });

    it("starts a new group when the category changes", () => {
        const input = [makeInfo("a", "General"), makeInfo("b", "Solutions"), makeInfo("c", "Solutions")];
        const result = groupByCategory(input);
        expect(result.length).toBe(2);
        expect(result[0].category).toBe("General");
        expect(result[0].items.map((c) => c.id)).toEqual(["a"]);
        expect(result[1].category).toBe("Solutions");
        expect(result[1].items.map((c) => c.id)).toEqual(["b", "c"]);
    });

    it("creates separate groups when the same category reappears non-consecutively", () => {
        const input = [makeInfo("a", "General"), makeInfo("b", "Solutions"), makeInfo("c", "General")];
        const result = groupByCategory(input);
        expect(result.length).toBe(3);
        expect(result.map((g) => g.category)).toEqual(["General", "Solutions", "General"]);
    });
});

describe("calculatorIdToRoute", () => {
    it("prefixes the id with a slash", () => {
        expect(calculatorIdToRoute("gas-laws")).toBe("/gas-laws");
    });

    it("handles empty id", () => {
        expect(calculatorIdToRoute("")).toBe("/");
    });
});
