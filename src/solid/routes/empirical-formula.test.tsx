import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {EmpiricalFormula} from "./empirical-formula";

afterEach(function (): void {
    cleanup();
});

describe("EmpiricalFormula route", function (): void {
    it("renders the card with the composition and molar-mass inputs", function (): void {
        let result = render(function () { return <EmpiricalFormula />; });
        expect(result.getByLabelText("Percent composition as element percent pairs")).toBeTruthy();
        expect(result.getByLabelText("Molar mass in grams per mole")).toBeTruthy();
        expect(result.getByText("Calculate Empirical Formula")).toBeTruthy();
    });

    it("computes the empirical formula and clears the result", async function (): Promise<void> {
        let result = render(function () { return <EmpiricalFormula />; });
        let composition = result.getByLabelText("Percent composition as element percent pairs") as HTMLInputElement;
        composition.value = "C:40,H:6.71,O:53.29";
        fireEvent.input(composition);
        fireEvent.click(result.getByText("Calculate Empirical Formula"));
        await result.findByText(/Empirical formula: CH2O/);
        fireEvent.click(result.getByText("Clear"));
        expect(result.container.textContent).not.toMatch(/Empirical formula: CH2O/);
    });
});
