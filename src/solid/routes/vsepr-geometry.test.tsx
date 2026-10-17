import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {VseprGeometry} from "./vsepr-geometry";

afterEach(function (): void {
    cleanup();
});

describe("VseprGeometry route", function (): void {
    it("renders the card with the AXE inputs", function (): void {
        let result = render(function () { return <VseprGeometry />; });
        expect(result.getByLabelText("Central atom element symbol")).toBeTruthy();
        expect(result.getByLabelText("Number of bonded atoms")).toBeTruthy();
        expect(result.getByLabelText("Number of lone pairs")).toBeTruthy();
        expect(result.getByText("Determine Geometry")).toBeTruthy();
    });

    it("determines the geometry and clears the result", async function (): Promise<void> {
        let result = render(function () { return <VseprGeometry />; });
        let central = result.getByLabelText("Central atom element symbol") as HTMLInputElement;
        central.value = "O";
        fireEvent.input(central);
        let bonded = result.getByLabelText("Number of bonded atoms") as HTMLInputElement;
        bonded.value = "2";
        fireEvent.input(bonded);
        let lonePairs = result.getByLabelText("Number of lone pairs") as HTMLInputElement;
        lonePairs.value = "2";
        fireEvent.input(lonePairs);
        fireEvent.click(result.getByText("Determine Geometry"));
        await result.findByText(/Ideal bond angle: 104\.5 degrees/);
        fireEvent.click(result.getByText("Clear"));
        expect(result.container.textContent).not.toMatch(/Ideal bond angle: 104\.5 degrees/);
    });
});
