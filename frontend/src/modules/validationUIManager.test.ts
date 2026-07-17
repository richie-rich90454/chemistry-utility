import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ValidationUIManager } from "./validationUIManager.js";

describe("ValidationUIManager", () => {
    let manager: ValidationUIManager;

    beforeEach(() => {
        ValidationUIManager.resetInstance();
        document.body.innerHTML = "";
        manager = ValidationUIManager.getInstance();
    });

    afterEach(() => {
        ValidationUIManager.resetInstance();
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(ValidationUIManager.getInstance()).toBe(ValidationUIManager.getInstance());
    });

    it("creates a new instance after resetInstance", () => {
        const first = ValidationUIManager.getInstance();
        ValidationUIManager.resetInstance();
        const second = ValidationUIManager.getInstance();
        expect(first).not.toBe(second);
    });

    describe("validateInput", () => {
        it("returns true and clears error for an empty optional text input", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.value = "";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(true);
            expect(input.classList.contains("input-error")).toBe(false);
        });

        it("returns false and shows error for an empty required text input", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.value = "";
            input.setAttribute("required", "");
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(false);
            expect(input.classList.contains("input-error")).toBe(true);
            const errorMsg = input.nextElementSibling;
            expect(errorMsg).not.toBeNull();
            expect(errorMsg!.textContent).toBe("This field is required");
        });

        it("returns false and shows error for an empty number input", () => {
            const input = document.createElement("input");
            input.type = "number";
            input.value = "";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(false);
            expect(input.classList.contains("input-error")).toBe(true);
            const errorMsg = input.nextElementSibling;
            expect(errorMsg).not.toBeNull();
            expect(errorMsg!.textContent).toBe("This field is required");
        });

        it("returns true for a valid number input", () => {
            const input = document.createElement("input");
            input.type = "number";
            input.value = "42";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(true);
            expect(input.classList.contains("input-valid")).toBe(true);
        });

        it("returns false for a non-parseable number input", () => {
            const input = document.createElement("input");
            input.type = "number";
            // jsdom clears invalid number values, so use setAttribute to
            // bypass the type coercion and then trigger validation.
            input.setAttribute("value", "abc");
            document.body.appendChild(input);
            // Force value via Object.defineProperty to bypass jsdom sanitization
            Object.defineProperty(input, "value", { value: "abc", writable: true, configurable: true });
            expect(manager.validateInput(input)).toBe(false);
            expect(input.classList.contains("input-error")).toBe(true);
            const errorMsg = input.nextElementSibling;
            expect(errorMsg!.textContent).toBe("Please enter a valid number");
        });

        it("returns false for a number input with only whitespace", () => {
            const input = document.createElement("input");
            input.type = "number";
            input.value = "   ";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(false);
        });

        it("returns true for a formula input with valid characters", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.id = "formula-input";
            input.value = "H2O";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(true);
            expect(input.classList.contains("input-valid")).toBe(true);
        });

        it("returns false for a formula input with invalid characters", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.id = "formula-input";
            input.value = "H2O@#$";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(false);
            expect(input.classList.contains("input-error")).toBe(true);
            const errorMsg = input.nextElementSibling;
            expect(errorMsg!.textContent).toBe("Formula contains invalid characters");
        });

        it("returns false for an equation input with > character (not in allowed set)", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.id = "equation-input";
            input.value = "H2+O2->H2O";
            document.body.appendChild(input);
            // ">" is not in the allowed regex [A-Za-z0-9\(\)\[\]\.\+\-]
            expect(manager.validateInput(input)).toBe(false);
            expect(input.classList.contains("input-error")).toBe(true);
        });

        it("returns true for a stoich-equation-input without > character", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.id = "stoich-equation-input";
            input.value = "2H2+O2";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(true);
        });

        it("returns true for an element1-input with valid characters", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.id = "element1-input";
            input.value = "Na";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(true);
        });

        it("returns true for an element2-input with valid characters", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.id = "element2-input";
            input.value = "Cl";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(true);
        });

        it("returns true for an element-input with valid characters", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.id = "element-input";
            input.value = "Fe";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(true);
        });

        it("returns true for a non-formula text input with any text", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.id = "other-input";
            input.value = "anything goes! @#$";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(true);
            expect(input.classList.contains("input-valid")).toBe(true);
        });

        it("returns true for a number input with a decimal value", () => {
            const input = document.createElement("input");
            input.type = "number";
            input.value = "3.14";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(true);
        });

        it("returns true for a number input with a negative value", () => {
            const input = document.createElement("input");
            input.type = "number";
            input.value = "-10";
            document.body.appendChild(input);
            expect(manager.validateInput(input)).toBe(true);
        });
    });

    describe("showError", () => {
        it("adds the input-error class and removes input-valid", () => {
            const input = document.createElement("input");
            input.classList.add("input-valid");
            document.body.appendChild(input);
            manager.showError(input, "custom error");
            expect(input.classList.contains("input-error")).toBe(true);
            expect(input.classList.contains("input-valid")).toBe(false);
        });

        it("inserts an error message span after the input", () => {
            const input = document.createElement("input");
            document.body.appendChild(input);
            manager.showError(input, "oops");
            const msg = input.nextElementSibling;
            expect(msg).not.toBeNull();
            expect(msg!.className).toBe("error-message");
            expect(msg!.textContent).toBe("oops");
            expect(msg!.getAttribute("role")).toBe("alert");
        });

        it("replaces an existing error message when showing a new one", () => {
            const input = document.createElement("input");
            document.body.appendChild(input);
            manager.showError(input, "first error");
            manager.showError(input, "second error");
            const msg = input.nextElementSibling;
            expect(msg!.textContent).toBe("second error");
            // Only one error-message span should exist
            const allMessages = document.querySelectorAll(".error-message");
            expect(allMessages.length).toBe(1);
        });
    });

    describe("clearError", () => {
        it("removes the input-error class", () => {
            const input = document.createElement("input");
            input.classList.add("input-error");
            document.body.appendChild(input);
            manager.clearError(input);
            expect(input.classList.contains("input-error")).toBe(false);
        });

        it("removes the error message span", () => {
            const input = document.createElement("input");
            document.body.appendChild(input);
            manager.showError(input, "err");
            manager.clearError(input);
            expect(input.nextElementSibling).toBeNull();
        });

        it("does not throw when there is no error message", () => {
            const input = document.createElement("input");
            document.body.appendChild(input);
            expect(() => manager.clearError(input)).not.toThrow();
        });
    });

    describe("showValid", () => {
        it("adds the input-valid class", () => {
            const input = document.createElement("input");
            document.body.appendChild(input);
            manager.showValid(input);
            expect(input.classList.contains("input-valid")).toBe(true);
        });

        it("removes the input-error class", () => {
            const input = document.createElement("input");
            input.classList.add("input-error");
            document.body.appendChild(input);
            manager.showValid(input);
            expect(input.classList.contains("input-error")).toBe(false);
        });

        it("removes any existing error message", () => {
            const input = document.createElement("input");
            document.body.appendChild(input);
            manager.showError(input, "err");
            manager.showValid(input);
            expect(input.nextElementSibling).toBeNull();
        });
    });

    describe("attachBlurValidators", () => {
        it("attaches blur listeners to number inputs within .main-groups", () => {
            const container = document.createElement("div");
            container.className = "main-groups";
            const input = document.createElement("input");
            input.type = "number";
            input.value = "";
            container.appendChild(input);
            document.body.appendChild(container);

            manager.attachBlurValidators();
            input.dispatchEvent(new Event("blur"));

            expect(input.classList.contains("input-error")).toBe(true);
        });

        it("attaches blur listeners to text inputs within .main-groups", () => {
            const container = document.createElement("div");
            container.className = "main-groups";
            const input = document.createElement("input");
            input.type = "text";
            input.value = "";
            container.appendChild(input);
            document.body.appendChild(container);

            manager.attachBlurValidators();
            input.dispatchEvent(new Event("blur"));

            // Empty optional text input is valid (clears errors, no error class)
            expect(input.classList.contains("input-error")).toBe(false);
        });

        it("does not attach listeners to inputs outside .main-groups", () => {
            const input = document.createElement("input");
            input.type = "number";
            input.value = "";
            document.body.appendChild(input);

            manager.attachBlurValidators();
            input.dispatchEvent(new Event("blur"));

            expect(input.classList.contains("input-error")).toBe(false);
        });

        it("clears error on focus", () => {
            const container = document.createElement("div");
            container.className = "main-groups";
            const input = document.createElement("input");
            input.type = "number";
            input.value = "";
            container.appendChild(input);
            document.body.appendChild(container);

            manager.attachBlurValidators();
            // First blur to show error
            input.dispatchEvent(new Event("blur"));
            expect(input.classList.contains("input-error")).toBe(true);
            // Then focus to clear error
            input.dispatchEvent(new Event("focus"));
            expect(input.classList.contains("input-error")).toBe(false);
            expect(input.classList.contains("input-valid")).toBe(false);
        });

        it("uses a custom root element when provided", () => {
            const root = document.createElement("div");
            const input = document.createElement("input");
            input.type = "number";
            input.value = "";
            root.appendChild(input);
            document.body.appendChild(root);

            manager.attachBlurValidators(root);
            input.dispatchEvent(new Event("blur"));

            // Input is not within .main-groups, but the root selector still
            // requires .main-groups ancestors so no validation occurs.
            expect(input.classList.contains("input-error")).toBe(false);
        });

        it("accepts the document as the default root", () => {
            const container = document.createElement("div");
            container.className = "main-groups";
            const input = document.createElement("input");
            input.type = "number";
            input.value = "abc";
            container.appendChild(input);
            document.body.appendChild(container);

            manager.attachBlurValidators();
            input.dispatchEvent(new Event("blur"));

            expect(input.classList.contains("input-error")).toBe(true);
        });
    });
});
