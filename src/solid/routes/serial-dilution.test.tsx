import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {SerialDilution} from "./serial-dilution";

afterEach(function (): void {
    cleanup();
});

describe("SerialDilution route", function (): void {
    it("renders the card with the serial dilution inputs", function (): void {
        let result = render(function () { return <SerialDilution />; });
        expect(result.getByLabelText("Initial concentration in molarity")).toBeTruthy();
        expect(result.getByLabelText("Dilution factor per step")).toBeTruthy();
        expect(result.getByLabelText("Number of dilution steps")).toBeTruthy();
    });

    it("computes the final concentration and clears the result", async function (): Promise<void> {
        let result = render(function () { return <SerialDilution />; });
        let initial = result.getByLabelText("Initial concentration in molarity") as HTMLInputElement;
        initial.value = "1";
        fireEvent.input(initial);
        let factor = result.getByLabelText("Dilution factor per step") as HTMLInputElement;
        factor.value = "10";
        fireEvent.input(factor);
        let steps = result.getByLabelText("Number of dilution steps") as HTMLInputElement;
        steps.value = "3";
        fireEvent.input(steps);
        fireEvent.click(result.getByText("Calculate"));
        await result.findByText(/Total dilution factor: 1000/);
        fireEvent.click(result.getByText("Clear"));
        expect(result.container.textContent).not.toMatch(/Total dilution factor: 1000/);
    });
});
