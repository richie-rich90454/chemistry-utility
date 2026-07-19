import {render, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {MolarMass} from "./molar-mass";
import {mockElements} from "../../test/elementsData.js";
describe("MolarMass", function (): void {
    let fetchSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        localStorage.clear();
        fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: function () { return Promise.resolve(mockElements); },
        } as Response);
    });
    afterEach(function (): void {
        fetchSpy.mockRestore();
    });
    it("calculates molar mass for H2O", async function (): Promise<void> {
        let result = render(function () { return <MolarMass />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input = result.getByLabelText("Chemical formula") as HTMLInputElement;
        input.value = "H2O";
        fireEvent.input(input);
        let button = result.getByText("Calculate");
        fireEvent.click(button);
        let massText = await result.findByText(/Molar Mass: 18\.015/);
        expect(massText).toBeTruthy();
    });
    it("shows error for invalid formula Xyz123", async function (): Promise<void> {
        let result = render(function () { return <MolarMass />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input = result.getByLabelText("Chemical formula") as HTMLInputElement;
        input.value = "Xyz123";
        fireEvent.input(input);
        let button = result.getByText("Calculate");
        fireEvent.click(button);
        let errorText = await result.findByText(/Element not found/);
        expect(errorText).toBeTruthy();
    });
});
