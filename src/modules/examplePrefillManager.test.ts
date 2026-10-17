import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ExamplePrefillManager } from "./examplePrefillManager.js";

describe("ExamplePrefillManager", () => {
    beforeEach(() => {
        ExamplePrefillManager.resetInstance();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        ExamplePrefillManager.resetInstance();
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(ExamplePrefillManager.getInstance()).toBe(ExamplePrefillManager.getInstance());
    });

    it("creates a new instance after resetInstance", () => {
        const first = ExamplePrefillManager.getInstance();
        ExamplePrefillManager.resetInstance();
        const second = ExamplePrefillManager.getInstance();
        expect(first).not.toBe(second);
    });

    describe("fillInputs", () => {
        it("fills text inputs with the given values", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.id = "formula-input";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().fillInputs({ "formula-input": "H2O" });

            expect(input.value).toBe("H2O");
        });

        it("dispatches an input event for text inputs", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.id = "formula-input";
            document.body.appendChild(input);

            const handler = vi.fn();
            input.addEventListener("input", handler);

            ExamplePrefillManager.getInstance().fillInputs({ "formula-input": "H2O" });

            expect(handler).toHaveBeenCalled();
        });

        it("dispatches a change event for select elements", () => {
            const select = document.createElement("select");
            select.id = "dilution-solve-for";
            const opt1 = document.createElement("option");
            opt1.value = "V2";
            select.appendChild(opt1);
            document.body.appendChild(select);

            const handler = vi.fn();
            select.addEventListener("change", handler);

            ExamplePrefillManager.getInstance().fillInputs({ "dilution-solve-for": "V2" });

            expect(handler).toHaveBeenCalled();
            expect(select.value).toBe("V2");
        });

        it("ignores values for inputs that do not exist", () => {
            expect(() => {
                ExamplePrefillManager.getInstance().fillInputs({ "nonexistent": "value" });
            }).not.toThrow();
        });

        it("fills multiple inputs at once", () => {
            const input1 = document.createElement("input");
            input1.id = "mass-solute";
            input1.type = "text";
            const input2 = document.createElement("input");
            input2.id = "mass-solution";
            input2.type = "text";
            document.body.appendChild(input1);
            document.body.appendChild(input2);

            ExamplePrefillManager.getInstance().fillInputs({
                "mass-solute": "5",
                "mass-solution": "100"
            });

            expect(input1.value).toBe("5");
            expect(input2.value).toBe("100");
        });
    });

    describe("initialize", () => {
        function setupCard(cardId: string, detailsId?: string): { strong: HTMLElement; detail: HTMLDetailsElement } {
            const card = document.createElement("div");
            card.className = "main-groups card";
            card.id = cardId;
            let container: HTMLElement = card;
            if (detailsId) {
                const sub = document.createElement("div");
                sub.id = detailsId;
                card.appendChild(sub);
                container = sub;
            }
            const detail = document.createElement("details");
            detail.className = "example-details";
            const strong = document.createElement("strong");
            strong.textContent = "H2O";
            detail.appendChild(strong);
            container.appendChild(detail);
            document.body.appendChild(card);
            return { strong: strong, detail: detail };
        }

        it("attaches role=button to strong elements in example-details", () => {
            const { strong } = setupCard("mass-calc");
            ExamplePrefillManager.getInstance().initialize();
            expect(strong.getAttribute("role")).toBe("button");
        });

        it("attaches tabindex=0 to strong elements", () => {
            const { strong } = setupCard("mass-calc");
            ExamplePrefillManager.getInstance().initialize();
            expect(strong.getAttribute("tabindex")).toBe("0");
        });

        it("fills inputs when a strong element is clicked", () => {
            const { strong } = setupCard("mass-calc");
            const input = document.createElement("input");
            input.id = "formula-input";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("H2O");
        });

        it("prevents default on click", () => {
            const { strong } = setupCard("mass-calc");
            ExamplePrefillManager.getInstance().initialize();
            const event = new MouseEvent("click", { bubbles: true, cancelable: true });
            strong.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
        });

        it("fills inputs on Enter keydown", () => {
            const { strong } = setupCard("mass-calc");
            const input = document.createElement("input");
            input.id = "formula-input";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

            expect(input.value).toBe("H2O");
        });

        it("fills inputs on Space keydown", () => {
            const { strong } = setupCard("mass-calc");
            const input = document.createElement("input");
            input.id = "formula-input";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));

            expect(input.value).toBe("H2O");
        });

        it("does not fill on other keys", () => {
            const { strong } = setupCard("mass-calc");
            const input = document.createElement("input");
            input.id = "formula-input";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

            expect(input.value).toBe("");
        });

        it("uses the second example for the second strong element", () => {
            const card = document.createElement("div");
            card.className = "main-groups card";
            card.id = "mass-calc";
            const detail = document.createElement("details");
            detail.className = "example-details";
            const strong1 = document.createElement("strong");
            strong1.textContent = "H2O";
            const strong2 = document.createElement("strong");
            strong2.textContent = "C6H12O6";
            detail.appendChild(strong1);
            detail.appendChild(strong2);
            card.appendChild(detail);
            document.body.appendChild(card);

            const input = document.createElement("input");
            input.id = "formula-input";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong2.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("C6H12O6");
        });

        it("ignores details elements without a parent .main-groups.card", () => {
            const detail = document.createElement("details");
            detail.className = "example-details";
            const strong = document.createElement("strong");
            detail.appendChild(strong);
            document.body.appendChild(detail);

            ExamplePrefillManager.getInstance().initialize();
            expect(strong.getAttribute("role")).toBeNull();
        });

        it("handles gas-laws with van-der-waals sub-section", () => {
            const { strong } = setupCard("gas-laws", "van-der-waals");
            const input = document.createElement("input");
            input.id = "vdw-V";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("1");
        });

        it("handles gas-laws with combined-gas-law sub-section", () => {
            const { strong } = setupCard("gas-laws", "combined-gas-law");
            const input = document.createElement("input");
            input.id = "combined-P1";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("1");
        });

        it("handles gas-laws with ideal-gas-law sub-section", () => {
            const { strong } = setupCard("gas-laws", "ideal-gas-law");
            const input = document.createElement("input");
            input.id = "ideal-P";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("1");
        });

        it("handles electrochemistry with electrolysis sub-section", () => {
            const { strong } = setupCard("electrochemistry", "electrolysis");
            const input = document.createElement("input");
            input.id = "electrolysis-I";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("10");
        });

        it("handles electrochemistry with nernst-equation sub-section", () => {
            const { strong } = setupCard("electrochemistry", "nernst-equation");
            const input = document.createElement("input");
            input.id = "E-standard";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("1.10");
        });

        it("handles electrochemistry with cell-potential sub-section", () => {
            const { strong } = setupCard("electrochemistry", "cell-potential");
            const input = document.createElement("input");
            input.id = "E1";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("0.34");
        });

        it("handles element-lookup card directly", () => {
            const { strong } = setupCard("element-lookup");
            const input = document.createElement("input");
            input.id = "element-input";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("H");
        });

        it("handles balancing card directly", () => {
            const { strong } = setupCard("balancing");
            const input = document.createElement("input");
            input.id = "equation-input";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("H2+O2->H2O");
        });

        it("handles dilution-calc card directly", () => {
            const { strong } = setupCard("dilution-calc");
            const input = document.createElement("input");
            input.id = "dilution-M1";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("6");
        });

        it("handles mass-percent-calc card directly", () => {
            const { strong } = setupCard("mass-percent-calc");
            const input = document.createElement("input");
            input.id = "mass-solute";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("5");
        });

        it("handles solution-mixing-calc card directly", () => {
            const { strong } = setupCard("solution-mixing-calc");
            const input = document.createElement("input");
            input.id = "mix-C1";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("1");
        });

        it("handles nuclear-chemistry card directly", () => {
            const { strong } = setupCard("nuclear-chemistry");
            const input = document.createElement("input");
            input.id = "initial-quantity";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("100");
        });

        it("handles stoichiometry card directly", () => {
            const { strong } = setupCard("stoichiometry");
            const input = document.createElement("input");
            input.id = "stoich-equation-input";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("2H2+O2->2H2O");
        });

        it("ignores gas-laws details outside any sub-section", () => {
            const { strong } = setupCard("gas-laws");
            ExamplePrefillManager.getInstance().initialize();
            expect(strong.getAttribute("role")).toBeNull();
        });

        it("ignores electrochemistry details outside any sub-section", () => {
            const { strong } = setupCard("electrochemistry");
            ExamplePrefillManager.getInstance().initialize();
            expect(strong.getAttribute("role")).toBeNull();
        });

        it("handles bond-type-predictor card directly", () => {
            const { strong } = setupCard("bond-type-predictor");
            const input = document.createElement("input");
            input.id = "element1-input";
            input.type = "text";
            document.body.appendChild(input);

            ExamplePrefillManager.getInstance().initialize();
            strong.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(input.value).toBe("Na");
        });

        it("does nothing for an unknown card id", () => {
            const card = document.createElement("div");
            card.className = "main-groups card";
            card.id = "unknown-card";
            const detail = document.createElement("details");
            detail.className = "example-details";
            const strong = document.createElement("strong");
            detail.appendChild(strong);
            card.appendChild(detail);
            document.body.appendChild(card);

            ExamplePrefillManager.getInstance().initialize();
            // No role=button because findExampleSet returned null
            expect(strong.getAttribute("role")).toBeNull();
        });
    });
});
