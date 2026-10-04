import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, it, expect, afterEach } from "vitest";
import { BondEditor } from "./BondEditor";

afterEach(() => {
    cleanup();
});

function setup(props: Partial<Parameters<typeof BondEditor>[0]> = {}): {
    captured: Record<string, string>[];
    cleared: () => boolean;
    rendered: ReturnType<typeof render>;
} {
    const captured: Record<string, string>[] = [];
    let cleared = false;
    const [result, setResult] = createSignal(props.result?.() ?? "");
    const [error, setError] = createSignal(props.error?.() ?? "");
    void setResult;
    void setError;
    const rendered = render(() => (
        <BondEditor
            onCalculate={(inputs) => { captured.push(inputs); }}
            onClear={() => { cleared = true; }}
            result={result}
            error={error}
            calculateLabel={props.calculateLabel}
        />
    ));
    return { captured, cleared: () => cleared, rendered };
}

describe("BondEditor", () => {
    it("shows empty hints initially", () => {
        const { rendered } = setup();
        expect(rendered.getByText("No broken bonds added yet.")).toBeTruthy();
        expect(rendered.getByText("No formed bonds added yet.")).toBeTruthy();
    });

    it("adds a broken bond row", () => {
        const { rendered } = setup();
        fireEvent.click(rendered.getByLabelText("Add broken bond") as HTMLElement);
        expect(rendered.queryByText("No broken bonds added yet.")).toBeNull();
        expect(rendered.getAllByLabelText("Bonds broken bond type").length).toBe(1);
    });

    it("adds a formed bond row", () => {
        const { rendered } = setup();
        fireEvent.click(rendered.getByLabelText("Add formed bond") as HTMLElement);
        expect(rendered.queryByText("No formed bonds added yet.")).toBeNull();
    });

    it("removes broken and formed rows", () => {
        const { rendered } = setup();
        fireEvent.click(rendered.getByLabelText("Add broken bond") as HTMLElement);
        fireEvent.click(rendered.getByLabelText("Add formed bond") as HTMLElement);
        fireEvent.click(rendered.getByLabelText("Remove broken bond") as HTMLElement);
        expect(rendered.queryByLabelText("Bonds broken bond type")).toBeNull();
        fireEvent.click(rendered.getByLabelText("Remove formed bond") as HTMLElement);
        expect(rendered.getByText("No formed bonds added yet.")).toBeTruthy();
    });

    it("updates broken bond type and count", () => {
        const { rendered, captured } = setup();
        fireEvent.click(rendered.getByLabelText("Add broken bond") as HTMLElement);
        const select = rendered.getByLabelText("Bonds broken bond type") as HTMLSelectElement;
        select.value = "O-H";
        fireEvent.change(select);
        const count = rendered.getByLabelText("Bonds broken count") as HTMLInputElement;
        count.value = "2";
        fireEvent.input(count);
        fireEvent.click(rendered.getByText("Calculate"));
        expect(captured[0]["bond-enthalpy-broken"]).toBe("O-H:2");
    });

    it("updates formed bond type and count", () => {
        const { rendered, captured } = setup();
        fireEvent.click(rendered.getByLabelText("Add formed bond") as HTMLElement);
        const select = rendered.getByLabelText("Bonds formed bond type") as HTMLSelectElement;
        select.value = "H-H";
        fireEvent.change(select);
        const count = rendered.getByLabelText("Bonds formed count") as HTMLInputElement;
        count.value = "3";
        fireEvent.input(count);
        fireEvent.click(rendered.getByText("Calculate"));
        expect(captured[0]["bond-enthalpy-formed"]).toBe("H-H:3");
    });

    it("serializes count of 1 as bare bond type", () => {
        const { rendered, captured } = setup();
        fireEvent.click(rendered.getByLabelText("Add broken bond") as HTMLElement);
        fireEvent.click(rendered.getByText("Calculate"));
        expect(captured[0]["bond-enthalpy-broken"]).toBe("C-H");
    });

    it("skips non-positive and invalid counts", () => {
        const { rendered, captured } = setup();
        fireEvent.click(rendered.getByLabelText("Add broken bond") as HTMLElement);
        fireEvent.click(rendered.getByLabelText("Add broken bond") as HTMLElement);
        const counts = rendered.getAllByLabelText("Bonds broken count") as HTMLInputElement[];
        counts[0].value = "0";
        fireEvent.input(counts[0]);
        counts[1].value = "abc";
        fireEvent.input(counts[1]);
        fireEvent.click(rendered.getByText("Calculate"));
        expect(captured[0]["bond-enthalpy-broken"]).toBe("");
    });

    it("clear empties both lists and calls onClear", () => {
        const { rendered, cleared } = setup();
        fireEvent.click(rendered.getByLabelText("Add broken bond") as HTMLElement);
        fireEvent.click(rendered.getByText("Clear"));
        expect(rendered.getByText("No broken bonds added yet.")).toBeTruthy();
        expect(cleared()).toBe(true);
    });

    it("clear works without onClear handler", () => {
        const [result] = createSignal("");
        const [error] = createSignal("");
        const rendered = render(() => (
            <BondEditor onCalculate={() => {}} result={result} error={error} />
        ));
        fireEvent.click(rendered.getByLabelText("Add broken bond") as HTMLElement);
        fireEvent.click(rendered.getByText("Clear"));
        expect(rendered.getByText("No broken bonds added yet.")).toBeTruthy();
    });

    it("uses custom calculate label when provided", () => {
        const { rendered } = setup({ calculateLabel: "Compute" });
        expect(rendered.getByText("Compute")).toBeTruthy();
    });

    it("renders error and result text", () => {
        const [result] = createSignal("ΔH = -100");
        const [error] = createSignal("bad input");
        const rendered = render(() => (
            <BondEditor onCalculate={() => {}} result={result} error={error} />
        ));
        expect(rendered.getByText("bad input")).toBeTruthy();
        expect(rendered.getByText("ΔH = -100")).toBeTruthy();
    });

    it("hides error and result when empty", () => {
        const { rendered } = setup();
        expect(rendered.queryByText("bad input")).toBeNull();
    });
});
