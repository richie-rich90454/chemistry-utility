import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {createSignal} from "solid-js";
import {describe, it, expect, afterEach} from "vitest";
import {CalculatorForm} from "./CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "./CalculatorForm";
afterEach(function (): void {
    cleanup();
});
describe("CalculatorForm", function (): void {
    it("renders a labelled input for each field config", function (): void {
        let fields: CalculatorField[] = [
            {"id": "a", "label": "A", "placeholder": "Enter A", "ariaLabel": "A value"},
            {"id": "b", "label": "B", "placeholder": "Enter B", "ariaLabel": "B value"}
        ];
        let [result, setResult] = createSignal("");
        let [error, setError] = createSignal("");
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={fields}
                    onCalculate={function (): void { return; }}
                    result={result}
                    error={error}
                />
            );
        });
        let a = rendered.getByLabelText("A value") as HTMLInputElement;
        let b = rendered.getByLabelText("B value") as HTMLInputElement;
        expect(a).toBeTruthy();
        expect(b).toBeTruthy();
        expect(rendered.getByText("Calculate")).toBeTruthy();
        expect(rendered.getByText("Clear")).toBeTruthy();
        void setResult;
        void setError;
    });
    it("renders selects with their option values", function (): void {
        let fields: CalculatorField[] = [
            {"id": "a", "label": "A", "placeholder": "Enter A", "ariaLabel": "A value"}
        ];
        let selects: CalculatorSelect[] = [{
            "id": "kind",
            "label": "Kind",
            "ariaLabel": "Kind selector",
            "options": [
                {"value": "x", "label": "X"},
                {"value": "y", "label": "Y"}
            ]
        }];
        let [result] = createSignal("");
        let [error] = createSignal("");
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={fields}
                    selects={selects}
                    onCalculate={function (): void { return; }}
                    result={result}
                    error={error}
                />
            );
        });
        let sel = rendered.getByLabelText("Kind selector") as HTMLSelectElement;
        expect(sel).toBeTruthy();
        expect(sel.value).toBe("x");
    });
    it("invokes onCalculate with current field and select values", function (): void {
        let fields: CalculatorField[] = [
            {"id": "a", "label": "A", "placeholder": "Enter A", "ariaLabel": "A value"},
            {"id": "b", "label": "B", "placeholder": "Enter B", "ariaLabel": "B value"}
        ];
        let selects: CalculatorSelect[] = [{
            "id": "kind",
            "label": "Kind",
            "ariaLabel": "Kind selector",
            "options": [
                {"value": "x", "label": "X"},
                {"value": "y", "label": "Y"}
            ],
            "defaultValue": "y"
        }];
        let [result] = createSignal("");
        let [error] = createSignal("");
        let captured: Record<string, string> = {};
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={fields}
                    selects={selects}
                    onCalculate={function (inputs: Record<string, string>): void { captured = inputs; }}
                    result={result}
                    error={error}
                />
            );
        });
        let a = rendered.getByLabelText("A value") as HTMLInputElement;
        a.value = "12";
        fireEvent.input(a);
        let b = rendered.getByLabelText("B value") as HTMLInputElement;
        b.value = "30";
        fireEvent.input(b);
        fireEvent.click(rendered.getByText("Calculate"));
        expect(captured["a"]).toBe("12");
        expect(captured["b"]).toBe("30");
        expect(captured["kind"]).toBe("y");
    });
    it("invokes onCalculate when Enter is pressed inside an input", function (): void {
        let fields: CalculatorField[] = [
            {"id": "a", "label": "A", "placeholder": "Enter A", "ariaLabel": "A value"}
        ];
        let [result] = createSignal("");
        let [error] = createSignal("");
        let calls: number = 0;
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={fields}
                    onCalculate={function (): void { calls = calls + 1; }}
                    result={result}
                    error={error}
                />
            );
        });
        let a = rendered.getByLabelText("A value") as HTMLInputElement;
        fireEvent.keyDown(a, {"key": "Enter"});
        expect(calls).toBe(1);
    });
    it("clears inputs and resets selects when Clear is clicked", function (): void {
        let fields: CalculatorField[] = [
            {"id": "a", "label": "A", "placeholder": "Enter A", "ariaLabel": "A value"}
        ];
        let selects: CalculatorSelect[] = [{
            "id": "kind",
            "label": "Kind",
            "ariaLabel": "Kind selector",
            "options": [
                {"value": "x", "label": "X"},
                {"value": "y", "label": "Y"}
            ],
            "defaultValue": "y"
        }];
        let [result] = createSignal("");
        let [error] = createSignal("");
        let cleared: boolean = false;
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={fields}
                    selects={selects}
                    onCalculate={function (): void { return; }}
                    onClear={function (): void { cleared = true; }}
                    result={result}
                    error={error}
                />
            );
        });
        let a = rendered.getByLabelText("A value") as HTMLInputElement;
        a.value = "42";
        fireEvent.input(a);
        let sel = rendered.getByLabelText("Kind selector") as HTMLSelectElement;
        sel.value = "x";
        fireEvent.change(sel);
        fireEvent.click(rendered.getByText("Clear"));
        expect(a.value).toBe("");
        expect(sel.value).toBe("y");
        expect(cleared).toBe(true);
    });
    it("renders the result text when result signal is non-empty", function (): void {
        let fields: CalculatorField[] = [
            {"id": "a", "label": "A", "placeholder": "Enter A", "ariaLabel": "A value"}
        ];
        let [result, setResult] = createSignal("");
        let [error] = createSignal("");
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={fields}
                    onCalculate={function (): void { return; }}
                    result={result}
                    error={error}
                />
            );
        });
        setResult("Answer: 42");
        let text = rendered.getByText(/Answer: 42/);
        expect(text).toBeTruthy();
    });
    it("renders the error text when error signal is non-empty", function (): void {
        let fields: CalculatorField[] = [
            {"id": "a", "label": "A", "placeholder": "Enter A", "ariaLabel": "A value"}
        ];
        let [result] = createSignal("");
        let [error, setError] = createSignal("");
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={fields}
                    onCalculate={function (): void { return; }}
                    result={result}
                    error={error}
                />
            );
        });
        setError("Bad input");
        let text = rendered.getByText(/Bad input/);
        expect(text).toBeTruthy();
    });
    it("renders children when provided", function (): void {
        let fields: CalculatorField[] = [
            {"id": "a", "label": "A", "placeholder": "Enter A", "ariaLabel": "A value"}
        ];
        let [result] = createSignal("");
        let [error] = createSignal("");
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={fields}
                    onCalculate={function (): void { return; }}
                    result={result}
                    error={error}
                >
                    <div data-testid="child">Chart goes here</div>
                </CalculatorForm>
            );
        });
        let child = rendered.getByTestId("child");
        expect(child).toBeTruthy();
    });
});
