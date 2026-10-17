import { describe, it, expect, afterEach, vi } from "vitest";
import { getBindings } from "./wailsBindings.js";

describe("getBindings", function (): void {
    afterEach(function (): void {
        vi.unstubAllGlobals();
        delete (window as unknown as { go?: unknown }).go;
    });

    it("returns null when the window has no go namespace", function (): void {
        delete (window as unknown as { go?: unknown }).go;
        expect(getBindings()).toBeNull();
    });

    it("wraps the go namespace when it is present", function (): void {
        let go = {
            "main": {
                "CalculatorService": {},
                "DataService": {},
                "FileService": {}
            }
        };
        (window as unknown as { go?: unknown }).go = go;
        expect(getBindings()).toEqual({ "go": go });
    });

    it("returns null when there is no window", function (): void {
        vi.stubGlobal("window", undefined);
        expect(getBindings()).toBeNull();
    });
});
