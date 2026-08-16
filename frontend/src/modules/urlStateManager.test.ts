import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { UrlStateManager } from "./urlStateManager.js";

describe("UrlStateManager", () => {
    let replaceStateSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        UrlStateManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        replaceStateSpy = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
        vi.spyOn(window, "setTimeout").mockImplementation((cb: TimerHandler) => {
            if (typeof cb === "function") {
                cb();
            }
            return 1 as unknown as ReturnType<typeof setTimeout>;
        });
        vi.spyOn(window, "clearTimeout").mockImplementation(() => {});
    });

    afterEach(() => {
        UrlStateManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(UrlStateManager.getInstance()).toBe(UrlStateManager.getInstance());
    });

    describe("serializeState", () => {
        it("returns empty string for an unknown calculator id", () => {
            const manager = UrlStateManager.getInstance();
            expect(manager.serializeState("unknown", { "a": "1" })).toBe("");
        });

        it("serializes inputs for mass-calc", () => {
            const manager = UrlStateManager.getInstance();
            const result = manager.serializeState("mass-calc", { "formula-input": "H2O" });
            expect(result).toBe("formula=H2O");
        });

        it("skips empty values", () => {
            const manager = UrlStateManager.getInstance();
            const result = manager.serializeState("mass-calc", { "formula-input": "" });
            expect(result).toBe("");
        });

        it("serializes multiple inputs for dilution-calc", () => {
            const manager = UrlStateManager.getInstance();
            const result = manager.serializeState("dilution-calc", {
                "dilution-solve-for": "M1",
                "dilution-M1": "",
                "dilution-V1": "1",
                "dilution-M2": "2",
                "dilution-V2": "3",
            });
            expect(result).toContain("solve=M1");
            expect(result).toContain("V1=1");
            expect(result).toContain("M2=2");
            expect(result).toContain("V2=3");
            expect(result).not.toContain("M1=");
        });

        it("returns empty string when all values are empty", () => {
            const manager = UrlStateManager.getInstance();
            const result = manager.serializeState("mass-calc", { "formula-input": "" });
            expect(result).toBe("");
        });

        it("ignores input ids that are not in the param mapping", () => {
            const manager = UrlStateManager.getInstance();
            const result = manager.serializeState("mass-calc", { "formula-input": "H2O", "unknown-input": "x" });
            expect(result).toBe("formula=H2O");
        });
    });

    describe("restoreState", () => {
        it("returns null for an unknown calculator id", () => {
            const manager = UrlStateManager.getInstance();
            expect(manager.restoreState("unknown")).toBeNull();
        });

        it("returns null when no URL params match", () => {
            const manager = UrlStateManager.getInstance();
            window.location.search = "";
            expect(manager.restoreState("mass-calc")).toBeNull();
        });

        it("restores state from URL params", () => {
            const manager = UrlStateManager.getInstance();
            // jsdom allows setting location.search
            const original = window.location.href;
            try {
                Object.defineProperty(window, "location", {
                    value: { search: "?formula=NaCl", pathname: "/", href: "/?formula=NaCl" },
                    writable: true,
                });
                const result = manager.restoreState("mass-calc");
                expect(result).toEqual({ "formula-input": "NaCl" });
            } finally {
                Object.defineProperty(window, "location", { value: { href: original }, writable: true });
            }
        });

        it("returns null when URL has no matching params for the calculator", () => {
            const manager = UrlStateManager.getInstance();
            const original = window.location.href;
            try {
                Object.defineProperty(window, "location", {
                    value: { search: "?unknown=1", pathname: "/", href: "/?unknown=1" },
                    writable: true,
                });
                expect(manager.restoreState("mass-calc")).toBeNull();
            } finally {
                Object.defineProperty(window, "location", { value: { href: original }, writable: true });
            }
        });
    });

    describe("updateUrl and updateUrlImmediate", () => {
        it("updateUrl calls replaceState with the serialized URL", () => {
            const manager = UrlStateManager.getInstance();
            manager.updateUrl("mass-calc", { "formula-input": "H2O" });
            expect(replaceStateSpy).toHaveBeenCalled();
            const args = replaceStateSpy.mock.calls[0];
            expect(args[2]).toContain("mass-calc");
            expect(args[2]).toContain("formula=H2O");
        });

        it("updateUrlImmediate calls replaceState without debouncing", () => {
            const manager = UrlStateManager.getInstance();
            manager.updateUrlImmediate("mass-calc", { "formula-input": "H2O" });
            expect(replaceStateSpy).toHaveBeenCalled();
            const args = replaceStateSpy.mock.calls[0];
            expect(args[2]).toContain("formula=H2O");
        });

        it("updateUrl does not include query string when inputs are empty", () => {
            const manager = UrlStateManager.getInstance();
            manager.updateUrlImmediate("mass-calc", { "formula-input": "" });
            expect(replaceStateSpy).toHaveBeenCalled();
            const args = replaceStateSpy.mock.calls[0];
            expect(args[2]).toBe("/mass-calc");
        });
    });

    describe("clearState", () => {
        it("removes search params from the URL", () => {
            const manager = UrlStateManager.getInstance();
            manager.clearState();
            expect(replaceStateSpy).toHaveBeenCalled();
        });
    });

    describe("readInputsFromDom", () => {
        it("returns empty object for an unknown calculator id", () => {
            const manager = UrlStateManager.getInstance();
            expect(manager.readInputsFromDom("unknown")).toEqual({});
        });

        it("reads input values from the DOM", () => {
            const input = document.createElement("input");
            input.id = "formula-input";
            input.value = "H2O";
            document.body.appendChild(input);

            const manager = UrlStateManager.getInstance();
            const result = manager.readInputsFromDom("mass-calc");
            expect(result["formula-input"]).toBe("H2O");
        });

        it("skips inputs that do not exist in the DOM", () => {
            const manager = UrlStateManager.getInstance();
            const result = manager.readInputsFromDom("mass-calc");
            expect(result).toEqual({});
        });

        it("reads multiple inputs from the DOM", () => {
            const input1 = document.createElement("input");
            input1.id = "dilution-V1";
            input1.value = "1";
            const input2 = document.createElement("input");
            input2.id = "dilution-M2";
            input2.value = "2";
            document.body.appendChild(input1);
            document.body.appendChild(input2);

            const manager = UrlStateManager.getInstance();
            const result = manager.readInputsFromDom("dilution-calc");
            expect(result["dilution-V1"]).toBe("1");
            expect(result["dilution-M2"]).toBe("2");
        });

        it("reads select element values", () => {
            const select = document.createElement("select");
            select.id = "dilution-solve-for";
            const option = document.createElement("option");
            option.value = "M1";
            option.selected = true;
            select.appendChild(option);
            document.body.appendChild(select);

            const manager = UrlStateManager.getInstance();
            const result = manager.readInputsFromDom("dilution-calc");
            expect(result["dilution-solve-for"]).toBe("M1");
        });
    });

    describe("fillInputs", () => {
        it("fills input elements with values and dispatches input events", () => {
            const input = document.createElement("input");
            input.id = "formula-input";
            document.body.appendChild(input);

            const manager = UrlStateManager.getInstance();
            manager.fillInputs("mass-calc", { "formula-input": "NaCl" });
            expect(input.value).toBe("NaCl");
        });

        it("dispatches change event for select elements", () => {
            const select = document.createElement("select");
            select.id = "dilution-solve-for";
            const option1 = document.createElement("option");
            option1.value = "M1";
            const option2 = document.createElement("option");
            option2.value = "V1";
            select.appendChild(option1);
            select.appendChild(option2);
            document.body.appendChild(select);

            const manager = UrlStateManager.getInstance();
            manager.fillInputs("dilution-calc", { "dilution-solve-for": "V1" });
            expect(select.value).toBe("V1");
        });

        it("does not crash for non-existent elements", () => {
            const manager = UrlStateManager.getInstance();
            expect(() => manager.fillInputs("mass-calc", { "nonexistent": "x" })).not.toThrow();
        });
    });

    describe("getInputIds", () => {
        it("returns input ids for a known calculator", () => {
            const manager = UrlStateManager.getInstance();
            const ids = manager.getInputIds("mass-calc");
            expect(ids).toContain("formula-input");
        });

        it("returns empty array for an unknown calculator", () => {
            const manager = UrlStateManager.getInstance();
            expect(manager.getInputIds("unknown")).toEqual([]);
        });

        it("returns multiple input ids for dilution-calc", () => {
            const manager = UrlStateManager.getInstance();
            const ids = manager.getInputIds("dilution-calc");
            expect(ids.length).toBeGreaterThan(1);
            expect(ids).toContain("dilution-M1");
            expect(ids).toContain("dilution-solve-for");
        });
    });

    describe("resetInstance", () => {
        it("creates a new instance after reset", () => {
            const instance1 = UrlStateManager.getInstance();
            UrlStateManager.resetInstance();
            const instance2 = UrlStateManager.getInstance();
            expect(instance1).not.toBe(instance2);
        });
    });
});
