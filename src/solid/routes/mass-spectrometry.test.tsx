import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {MassSpectrometry} from "./mass-spectrometry";

afterEach(function (): void {
    cleanup();
});

describe("MassSpectrometry route", function (): void {
    it("renders the card with the isotope input", function (): void {
        let result = render(function () { return <MassSpectrometry />; });
        expect(result.getByLabelText("Isotope masses and abundances")).toBeTruthy();
        expect(result.getByText("Calculate Average Atomic Mass")).toBeTruthy();
    });

    it("computes the average atomic mass and clears the result", async function (): Promise<void> {
        let result = render(function () { return <MassSpectrometry />; });
        let isotopes = result.getByLabelText("Isotope masses and abundances") as HTMLInputElement;
        isotopes.value = "34.9689,0.7576;36.9659,0.2424";
        fireEvent.input(isotopes);
        fireEvent.click(result.getByText("Calculate Average Atomic Mass"));
        await result.findByText(/Closest element: Chlorine \(Cl, Z = 17/);
        fireEvent.click(result.getByText("Clear"));
        expect(result.container.textContent).not.toMatch(/Closest element: Chlorine/);
    });
});
