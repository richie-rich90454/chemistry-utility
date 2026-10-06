import {describe, it, expect} from "vitest";
import {mockElements, findElement} from "./elementsData";

describe("elementsData coverage", function (): void {
    it("exposes mock elements", function (): void {
        expect(mockElements.length).toBeGreaterThan(0);
        expect(mockElements[0].symbol).toBe("H");
    });

    it("findElement matches case-insensitively", function (): void {
        expect(findElement("H")?.name).toBe("Hydrogen");
        expect(findElement("h")?.symbol).toBe("H");
        expect(findElement("FE")?.name).toBe("Iron");
    });

    it("findElement returns undefined for unknown symbol", function (): void {
        expect(findElement("Xx")).toBeUndefined();
    });
});
