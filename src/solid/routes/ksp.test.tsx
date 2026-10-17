import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {Ksp} from "./ksp";
afterEach(function (): void {
    cleanup();
});
describe("Ksp route", function (): void {
    it("renders the card with Ksp, molar solubility inputs and solve-for, salt-type selects", function (): void {
        let result = render(function () { return <Ksp />; });
        let ksp = result.getByLabelText("Ksp value") as HTMLInputElement;
        let solubility = result.getByLabelText("Molar solubility") as HTMLInputElement;
        expect(ksp).toBeTruthy();
        expect(solubility).toBeTruthy();
        let solveFor = result.getByLabelText("Select Ksp parameter to solve for") as HTMLSelectElement;
        expect(solveFor).toBeTruthy();
        expect(solveFor.value).toBe("Ksp");
        let saltType = result.getByLabelText("Select salt type") as HTMLSelectElement;
        expect(saltType).toBeTruthy();
        expect(saltType.value).toBe("AB");
        expect(result.getByText("Calculate")).toBeTruthy();
        expect(result.getByText("Clear")).toBeTruthy();
    });
    it("solves for Ksp given molar solubility=0.01 and salt type AB and displays 0.0001", async function (): Promise<void> {
        let result = render(function () { return <Ksp />; });
        let solubility = result.getByLabelText("Molar solubility") as HTMLInputElement;
        solubility.value = "0.01";
        fireEvent.input(solubility);
        fireEvent.click(result.getByText("Calculate"));
        let text = await result.findByText(/0\.0001/);
        expect(text).toBeTruthy();
    });
    it("shows an error when molar solubility is zero while solving for Ksp", async function (): Promise<void> {
        let result = render(function () { return <Ksp />; });
        let solubility = result.getByLabelText("Molar solubility") as HTMLInputElement;
        solubility.value = "0";
        fireEvent.input(solubility);
        fireEvent.click(result.getByText("Calculate"));
        let errorText = await result.findByText(/Error/);
        expect(errorText).toBeTruthy();
    });
    it("clears the result when the Clear button is clicked", async function (): Promise<void> {
        let result = render(function () { return <Ksp />; });
        let solubility = result.getByLabelText("Molar solubility") as HTMLInputElement;
        solubility.value = "0.01";
        fireEvent.input(solubility);
        fireEvent.click(result.getByText("Calculate"));
        let text = await result.findByText(/0\.0001/);
        expect(text).toBeTruthy();
        fireEvent.click(result.getByText("Clear"));
        expect(solubility.value).toBe("");
        expect(result.container.textContent).not.toMatch(/0\.0001/);
    });
});
