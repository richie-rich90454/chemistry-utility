import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {Molality} from "./molality";

afterEach(function (): void {
    cleanup();
});

describe("Molality route", function (): void {
    it("renders the card with the molality inputs and solve-for select", function (): void {
        let result = render(function () { return <Molality />; });
        expect(result.getByLabelText("Solute mass in grams")).toBeTruthy();
        expect(result.getByLabelText("Solvent mass in grams")).toBeTruthy();
        expect(result.getByLabelText("Molar mass in grams per mole")).toBeTruthy();
        expect(result.getByLabelText("Molality in moles per kilogram")).toBeTruthy();
        expect((result.getByLabelText("Select molality parameter to solve for") as HTMLSelectElement).value).toBe("molality");
    });

    it("computes the molality and clears the result", async function (): Promise<void> {
        let result = render(function () { return <Molality />; });
        let solute = result.getByLabelText("Solute mass in grams") as HTMLInputElement;
        solute.value = "20";
        fireEvent.input(solute);
        let solvent = result.getByLabelText("Solvent mass in grams") as HTMLInputElement;
        solvent.value = "500";
        fireEvent.input(solvent);
        let molar = result.getByLabelText("Molar mass in grams per mole") as HTMLInputElement;
        molar.value = "39.997";
        fireEvent.input(molar);
        fireEvent.click(result.getByText("Calculate"));
        await result.findByText(/Moles of solute: 0\.5000 mol/);
        fireEvent.click(result.getByText("Clear"));
        expect(result.container.textContent).not.toMatch(/Moles of solute: 0\.5000 mol/);
    });
});
