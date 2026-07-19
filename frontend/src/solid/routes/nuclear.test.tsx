import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {NuclearChemistry} from "./nuclear";
afterEach(function (): void {
    cleanup();
});
describe("NuclearChemistry route", function (): void {
    it("renders the card with half-life inputs, solve-for select, and buttons", function (): void {
        let result = render(function () { return <NuclearChemistry />; });
        let initial = result.getByLabelText("Initial quantity") as HTMLInputElement;
        let time = result.getByLabelText("Time") as HTMLInputElement;
        let halfLife = result.getByLabelText("Half-life") as HTMLInputElement;
        let remaining = result.getByLabelText("Remaining quantity") as HTMLInputElement;
        expect(initial).toBeTruthy();
        expect(time).toBeTruthy();
        expect(halfLife).toBeTruthy();
        expect(remaining).toBeTruthy();
        let solveFor = result.getByLabelText("Select half-life parameter to solve for") as HTMLSelectElement;
        expect(solveFor).toBeTruthy();
        expect(solveFor.value).toBe("remaining");
        expect(result.getByRole("button", {"name": "Calculate"})).toBeTruthy();
        expect(result.getByRole("button", {"name": "Clear"})).toBeTruthy();
    });
    it("solves for remaining quantity given initial=100, time=10, half-life=5 and displays 25", async function (): Promise<void> {
        let result = render(function () { return <NuclearChemistry />; });
        let initial = result.getByLabelText("Initial quantity") as HTMLInputElement;
        initial.value = "100";
        fireEvent.input(initial);
        let time = result.getByLabelText("Time") as HTMLInputElement;
        time.value = "10";
        fireEvent.input(time);
        let halfLife = result.getByLabelText("Half-life") as HTMLInputElement;
        halfLife.value = "5";
        fireEvent.input(halfLife);
        fireEvent.click(result.getByRole("button", {"name": "Calculate"}));
        let text = await result.findByText(/25\.0000/);
        expect(text).toBeTruthy();
        expect(result.container.textContent).toMatch(/Remaining/);
    });
    it("shows an error when half-life is zero while solving for remaining", async function (): Promise<void> {
        let result = render(function () { return <NuclearChemistry />; });
        let initial = result.getByLabelText("Initial quantity") as HTMLInputElement;
        initial.value = "100";
        fireEvent.input(initial);
        let time = result.getByLabelText("Time") as HTMLInputElement;
        time.value = "10";
        fireEvent.input(time);
        let halfLife = result.getByLabelText("Half-life") as HTMLInputElement;
        halfLife.value = "0";
        fireEvent.input(halfLife);
        fireEvent.click(result.getByRole("button", {"name": "Calculate"}));
        let errorText = await result.findByText(/Error/);
        expect(errorText).toBeTruthy();
    });
    it("clears the result when the Clear button is clicked", async function (): Promise<void> {
        let result = render(function () { return <NuclearChemistry />; });
        let initial = result.getByLabelText("Initial quantity") as HTMLInputElement;
        initial.value = "100";
        fireEvent.input(initial);
        let time = result.getByLabelText("Time") as HTMLInputElement;
        time.value = "10";
        fireEvent.input(time);
        let halfLife = result.getByLabelText("Half-life") as HTMLInputElement;
        halfLife.value = "5";
        fireEvent.input(halfLife);
        fireEvent.click(result.getByRole("button", {"name": "Calculate"}));
        let text = await result.findByText(/25\.0000/);
        expect(text).toBeTruthy();
        fireEvent.click(result.getByRole("button", {"name": "Clear"}));
        expect(initial.value).toBe("");
        expect(result.container.textContent).not.toMatch(/25\.0000/);
    });
});

