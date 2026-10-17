import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {BeerLambert} from "./beer-lambert";

afterEach(function (): void {
    cleanup();
});

describe("BeerLambert route", function (): void {
    it("renders the card with the Beer-Lambert inputs and solve-for select", function (): void {
        let result = render(function () { return <BeerLambert />; });
        expect(result.getByLabelText("Absorbance")).toBeTruthy();
        expect(result.getByLabelText("Molar absorptivity")).toBeTruthy();
        expect(result.getByLabelText("Path length in centimeters")).toBeTruthy();
        expect(result.getByLabelText("Concentration in moles per liter")).toBeTruthy();
        expect((result.getByLabelText("Select Beer-Lambert parameter to solve for") as HTMLSelectElement).value).toBe("absorbance");
    });

    it("solves for absorbance and clears the result", async function (): Promise<void> {
        let result = render(function () { return <BeerLambert />; });
        let absorptivity = result.getByLabelText("Molar absorptivity") as HTMLInputElement;
        absorptivity.value = "6239.5";
        fireEvent.input(absorptivity);
        let path = result.getByLabelText("Path length in centimeters") as HTMLInputElement;
        path.value = "1";
        fireEvent.input(path);
        let concentration = result.getByLabelText("Concentration in moles per liter") as HTMLInputElement;
        concentration.value = "0.0001";
        fireEvent.input(concentration);
        fireEvent.click(result.getByText("Calculate"));
        await result.findByText(/23\.7711 %/);
        fireEvent.click(result.getByText("Clear"));
        expect(result.container.textContent).not.toMatch(/23\.7711 %/);
    });
});
