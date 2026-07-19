import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {PKaPKb} from "./pka-pkb";
afterEach(function (): void {
    cleanup();
});
describe("PKaPKb route", function (): void {
    it("renders the card with input value field and input type select", function (): void {
        let result = render(function () { return <PKaPKb />; });
        let value = result.getByLabelText("Input value") as HTMLInputElement;
        expect(value).toBeTruthy();
        let type = result.getByLabelText("Select input type") as HTMLSelectElement;
        expect(type).toBeTruthy();
        expect(type.value).toBe("Ka");
        expect(result.getByText("Calculate")).toBeTruthy();
        expect(result.getByText("Clear")).toBeTruthy();
    });
    it("calculates pKa=5.0000 from Ka=1e-5", async function (): Promise<void> {
        let result = render(function () { return <PKaPKb />; });
        let value = result.getByLabelText("Input value") as HTMLInputElement;
        value.value = "0.00001";
        fireEvent.input(value);
        fireEvent.click(result.getByText("Calculate"));
        let text = await result.findByText(/5\.0000/);
        expect(text).toBeTruthy();
    });
    it("shows an error when the input value is zero", async function (): Promise<void> {
        let result = render(function () { return <PKaPKb />; });
        let value = result.getByLabelText("Input value") as HTMLInputElement;
        value.value = "0";
        fireEvent.input(value);
        fireEvent.click(result.getByText("Calculate"));
        let errorText = await result.findByText(/Error/);
        expect(errorText).toBeTruthy();
    });
    it("clears the result when the Clear button is clicked", async function (): Promise<void> {
        let result = render(function () { return <PKaPKb />; });
        let value = result.getByLabelText("Input value") as HTMLInputElement;
        value.value = "0.00001";
        fireEvent.input(value);
        fireEvent.click(result.getByText("Calculate"));
        let text = await result.findByText(/5\.0000/);
        expect(text).toBeTruthy();
        fireEvent.click(result.getByText("Clear"));
        expect(value.value).toBe("");
        expect(result.container.textContent).not.toMatch(/5\.0000/);
    });
});
