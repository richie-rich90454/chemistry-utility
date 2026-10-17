import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {createSignal} from "solid-js";
import type {JSX} from "solid-js";
import {describe, it, expect, afterEach} from "vitest";
import {CalculatorForm} from "./CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "./CalculatorForm";
afterEach(function (): void {
    cleanup();
});
function fieldA(): CalculatorField {
    return {"id": "a", "label": "A", "placeholder": "Enter A", "ariaLabel": "A value"};
}
function fieldB(): CalculatorField {
    return {"id": "b", "label": "B", "placeholder": "Enter B", "ariaLabel": "B value"};
}
function kindSelect(): CalculatorSelect {
    return {
        "id": "kind",
        "label": "Kind",
        "ariaLabel": "Kind selector",
        "options": [
            {"value": "x", "label": "X"},
            {"value": "y", "label": "Y"}
        ]
    };
}
function modeSelect(): CalculatorSelect {
    return {
        "id": "mode",
        "label": "Mode",
        "ariaLabel": "Mode selector",
        "options": [
            {"value": "p", "label": "P"},
            {"value": "q", "label": "Q"}
        ]
    };
}
let externalSetFields: (fields: CalculatorField[]) => void = function (): void { return; };
let externalSetSelects: (selects: CalculatorSelect[]) => void = function (): void { return; };
let externalCaptured: Record<string, string> = {};
function DynamicHost(): JSX.Element {
    let [fields, setFields] = createSignal<CalculatorField[]>([fieldA()]);
    let [selects, setSelects] = createSignal<CalculatorSelect[]>([kindSelect()]);
    externalSetFields = setFields;
    externalSetSelects = setSelects;
    let [result] = createSignal("");
    let [error] = createSignal("");
    return (
        <CalculatorForm
            fields={fields()}
            selects={selects()}
            onCalculate={function (inputs: Record<string, string>): void { externalCaptured = inputs; }}
            result={result}
            error={error}
        />
    );
}
function renderDynamic(): ReturnType<typeof render> {
    externalCaptured = {};
    return render(function (): JSX.Element {
        return <DynamicHost />;
    });
}
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
    it("renders a custom calculate label when provided", function (): void {
        let [result] = createSignal("");
        let [error] = createSignal("");
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={[fieldA()]}
                    onCalculate={function (): void { return; }}
                    result={result}
                    error={error}
                    calculateLabel="Compute"
                />
            );
        });
        expect(rendered.getByText("Compute")).toBeTruthy();
    });
    it("renders an empty select when options are empty", function (): void {
        let [result] = createSignal("");
        let [error] = createSignal("");
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={[fieldA()]}
                    selects={[{"id": "empty", "label": "Empty", "ariaLabel": "Empty selector", "options": []}]}
                    onCalculate={function (): void { return; }}
                    result={result}
                    error={error}
                />
            );
        });
        let sel = rendered.getByLabelText("Empty selector") as HTMLSelectElement;
        expect(sel.value).toBe("");
    });
    it("uses the field type when provided", function (): void {
        let [result] = createSignal("");
        let [error] = createSignal("");
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={[{"id": "a", "label": "A", "placeholder": "Enter A", "ariaLabel": "A value", "type": "text"}]}
                    onCalculate={function (): void { return; }}
                    result={result}
                    error={error}
                />
            );
        });
        let a = rendered.getByLabelText("A value") as HTMLInputElement;
        expect(a.type).toBe("text");
    });
    it("renders the input group label when provided", function (): void {
        let [result] = createSignal("");
        let [error] = createSignal("");
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={[fieldA()]}
                    onCalculate={function (): void { return; }}
                    result={result}
                    error={error}
                    inputGroupLabel="Parameters"
                />
            );
        });
        expect(rendered.getByText("Parameters")).toBeTruthy();
    });
    it("clears inputs without onClear when Clear is clicked", function (): void {
        let [result] = createSignal("");
        let [error] = createSignal("");
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={[fieldA()]}
                    onCalculate={function (): void { return; }}
                    result={result}
                    error={error}
                />
            );
        });
        let a = rendered.getByLabelText("A value") as HTMLInputElement;
        fireEvent.input(a, {target: {value: "42"}});
        expect(a.value).toBe("42");
        fireEvent.click(rendered.getByText("Clear"));
        expect(a.value).toBe("");
    });
    it("does not calculate when a non-Enter key is pressed", function (): void {
        let [result] = createSignal("");
        let [error] = createSignal("");
        let calls: number = 0;
        let rendered = render(function () {
            return (
                <CalculatorForm
                    fields={[fieldA()]}
                    onCalculate={function (): void { calls = calls + 1; }}
                    result={result}
                    error={error}
                />
            );
        });
        let a = rendered.getByLabelText("A value") as HTMLInputElement;
        fireEvent.keyDown(a, {"key": "a"});
        expect(calls).toBe(0);
    });
    it("adds signals for fields and selects added after mount", async function (): Promise<void> {
        let rendered = renderDynamic();
        externalSetFields([fieldA(), fieldB()]);
        externalSetSelects([kindSelect(), modeSelect()]);
        await Promise.resolve();
        let b = rendered.getByLabelText("B value") as HTMLInputElement;
        fireEvent.input(b, {target: {value: "7"}});
        let mode = rendered.getByLabelText("Mode selector") as HTMLSelectElement;
        fireEvent.change(mode, {target: {value: "q"}});
        fireEvent.click(rendered.getByText("Calculate"));
        expect(externalCaptured["b"]).toBe("7");
        expect(externalCaptured["mode"]).toBe("q");
    });
    it("drops stale signals when fields and selects are removed", async function (): Promise<void> {
        let rendered = renderDynamic();
        externalSetFields([fieldA(), fieldB()]);
        externalSetSelects([kindSelect(), modeSelect()]);
        await Promise.resolve();
        expect(rendered.getByLabelText("B value")).toBeTruthy();
        externalSetFields([fieldB()]);
        externalSetSelects([modeSelect()]);
        await Promise.resolve();
        expect(rendered.queryByLabelText("A value")).toBeNull();
        expect(rendered.queryByLabelText("Kind selector")).toBeNull();
        fireEvent.click(rendered.getByText("Calculate"));
        expect("a" in externalCaptured).toBe(false);
        expect("kind" in externalCaptured).toBe(false);
        expect("b" in externalCaptured).toBe(true);
        expect("mode" in externalCaptured).toBe(true);
    });
    it("ignores input, select, and clear events before signal sync", async function (): Promise<void> {
        let rendered = renderDynamic();
        externalSetFields([fieldA(), fieldB()]);
        externalSetSelects([kindSelect(), modeSelect()]);
        let b = rendered.getByLabelText("B value") as HTMLInputElement;
        expect(b.value).toBe("");
        expect(function (): void {
            fireEvent.input(b, {target: {value: "7"}});
        }).not.toThrow();
        let mode = rendered.getByLabelText("Mode selector") as HTMLSelectElement;
        expect(function (): void {
            fireEvent.change(mode, {target: {value: "q"}});
        }).not.toThrow();
        expect(function (): void {
            fireEvent.click(rendered.getByText("Clear"));
        }).not.toThrow();
        await Promise.resolve();
        let synced = rendered.getByLabelText("B value") as HTMLInputElement;
        fireEvent.input(synced, {target: {value: "9"}});
        fireEvent.click(rendered.getByText("Calculate"));
        expect(externalCaptured["b"]).toBe("9");
    });
});
