import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {Calorimetry} from "./calorimetry";

afterEach(function (): void {
    cleanup();
});

describe("Calorimetry route", function (): void {
    it("renders the card with the calorimetry inputs and solve-for select", function (): void {
        let result = render(function () { return <Calorimetry />; });
        expect(result.getByLabelText("Mass in grams")).toBeTruthy();
        expect(result.getByLabelText("Specific heat")).toBeTruthy();
        expect(result.getByLabelText("Temperature change in Celsius")).toBeTruthy();
        expect(result.getByLabelText("Heat in joules")).toBeTruthy();
        expect((result.getByLabelText("Select calorimetry parameter to solve for") as HTMLSelectElement).value).toBe("q");
    });

    it("solves for heat and clears the result", async function (): Promise<void> {
        let result = render(function () { return <Calorimetry />; });
        let mass = result.getByLabelText("Mass in grams") as HTMLInputElement;
        mass.value = "100";
        fireEvent.input(mass);
        let c = result.getByLabelText("Specific heat") as HTMLInputElement;
        c.value = "4.184";
        fireEvent.input(c);
        let deltaT = result.getByLabelText("Temperature change in Celsius") as HTMLInputElement;
        deltaT.value = "50";
        fireEvent.input(deltaT);
        fireEvent.click(result.getByText("Calculate"));
        await result.findByText(/20920\.0000 J/);
        fireEvent.click(result.getByText("Clear"));
        expect(result.container.textContent).not.toMatch(/20920\.0000 J/);
    });
});
