import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {GibbsEquilibrium} from "./gibbs-equilibrium";

afterEach(function (): void {
    cleanup();
});

describe("GibbsEquilibrium route", function (): void {
    it("renders the card with the Gibbs inputs and solve-for select", function (): void {
        let result = render(function () { return <GibbsEquilibrium />; });
        expect(result.getByLabelText("Standard Gibbs free energy change in kilojoules per mole")).toBeTruthy();
        expect(result.getByLabelText("Equilibrium constant")).toBeTruthy();
        expect(result.getByLabelText("Temperature in Kelvin")).toBeTruthy();
        expect((result.getByLabelText("Select whether to solve for K or Delta G") as HTMLSelectElement).value).toBe("K");
    });

    it("solves for K and clears the result", async function (): Promise<void> {
        let result = render(function () { return <GibbsEquilibrium />; });
        let deltaG = result.getByLabelText("Standard Gibbs free energy change in kilojoules per mole") as HTMLInputElement;
        deltaG.value = "46.5";
        fireEvent.input(deltaG);
        let temperature = result.getByLabelText("Temperature in Kelvin") as HTMLInputElement;
        temperature.value = "298.15";
        fireEvent.input(temperature);
        fireEvent.click(result.getByText("Calculate"));
        await result.findByText(/7\.1302e-9/);
        fireEvent.click(result.getByText("Clear"));
        expect(result.container.textContent).not.toMatch(/7\.1302e-9/);
    });
});
