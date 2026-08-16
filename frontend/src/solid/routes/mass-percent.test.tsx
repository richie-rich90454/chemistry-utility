import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {MassPercent} from "./mass-percent";
afterEach(function (): void {
    cleanup();
});
describe("MassPercent route", function (): void {
    it("renders the card with solute and solution inputs, unit select, and buttons", function (): void {
        let result = render(function () { return <MassPercent />; });
        let solute = result.getByLabelText("Mass of solute") as HTMLInputElement;
        let solution = result.getByLabelText("Mass of solution") as HTMLInputElement;
        expect(solute).toBeTruthy();
        expect(solution).toBeTruthy();
        let unit = result.getByLabelText("Select concentration unit") as HTMLSelectElement;
        expect(unit).toBeTruthy();
        expect(unit.value).toBe("percent");
        expect(result.getByText("Calculate")).toBeTruthy();
        expect(result.getByText("Clear")).toBeTruthy();
    });
    it("calculates 10 percent for 10 g solute in 100 g solution", async function (): Promise<void> {
        let result = render(function () { return <MassPercent />; });
        let solute = result.getByLabelText("Mass of solute") as HTMLInputElement;
        solute.value = "10";
        fireEvent.input(solute);
        let solution = result.getByLabelText("Mass of solution") as HTMLInputElement;
        solution.value = "100";
        fireEvent.input(solution);
        fireEvent.click(result.getByText("Calculate"));
        let text = await result.findByText(/10\.0000/);
        expect(text).toBeTruthy();
        expect(result.container.textContent).toMatch(/%/);
    });
    it("shows an error when the solution mass is zero", async function (): Promise<void> {
        let result = render(function () { return <MassPercent />; });
        let solute = result.getByLabelText("Mass of solute") as HTMLInputElement;
        solute.value = "10";
        fireEvent.input(solute);
        let solution = result.getByLabelText("Mass of solution") as HTMLInputElement;
        solution.value = "0";
        fireEvent.input(solution);
        fireEvent.click(result.getByText("Calculate"));
        let errorText = await result.findByText(/Error/);
        expect(errorText).toBeTruthy();
    });
    it("clears the result when the Clear button is clicked", async function (): Promise<void> {
        let result = render(function () { return <MassPercent />; });
        let solute = result.getByLabelText("Mass of solute") as HTMLInputElement;
        solute.value = "10";
        fireEvent.input(solute);
        let solution = result.getByLabelText("Mass of solution") as HTMLInputElement;
        solution.value = "100";
        fireEvent.input(solution);
        fireEvent.click(result.getByText("Calculate"));
        let text = await result.findByText(/10\.0000/);
        expect(text).toBeTruthy();
        fireEvent.click(result.getByText("Clear"));
        expect(solute.value).toBe("");
        expect(result.container.textContent).not.toMatch(/10\.0000/);
    });
});
