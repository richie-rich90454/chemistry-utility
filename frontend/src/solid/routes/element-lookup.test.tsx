import {render, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {ElementLookup} from "./element-lookup";
import {mockElements} from "../../test/elementsData.js";
describe("ElementLookup", function (): void {
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
        vi.useRealTimers();
    });
    it("renders the card with input and look up button", async function (): Promise<void> {
        let result = render(function () { return <ElementLookup />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input = result.getByLabelText("Element symbol, name, or atomic number") as HTMLInputElement;
        expect(input).toBeTruthy();
        let button = result.getByText("Look Up");
        expect(button).toBeTruthy();
    });
    it("searches by symbol H and shows Hydrogen details", async function (): Promise<void> {
        let result = render(function () { return <ElementLookup />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input = result.getByLabelText("Element symbol, name, or atomic number") as HTMLInputElement;
        input.value = "H";
        fireEvent.input(input);
        let button = result.getByText("Look Up");
        fireEvent.click(button);
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Name: Hydrogen/);
        });
        expect(result.container.textContent).toMatch(/Symbol: H/);
        expect(result.container.textContent).toMatch(/Atomic Mass: 1\.008/);
        expect(result.container.textContent).toMatch(/Atomic Number: 1/);
    });
    it("searches by name oxygen and shows Oxygen details", async function (): Promise<void> {
        let result = render(function () { return <ElementLookup />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input = result.getByLabelText("Element symbol, name, or atomic number") as HTMLInputElement;
        input.value = "oxygen";
        fireEvent.input(input);
        let button = result.getByText("Look Up");
        fireEvent.click(button);
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Name: Oxygen/);
        });
        expect(result.container.textContent).toMatch(/Symbol: O/);
    });
    it("searches by atomic number 6 and shows Carbon details", async function (): Promise<void> {
        let result = render(function () { return <ElementLookup />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input = result.getByLabelText("Element symbol, name, or atomic number") as HTMLInputElement;
        input.value = "6";
        fireEvent.input(input);
        let button = result.getByText("Look Up");
        fireEvent.click(button);
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Name: Carbon/);
        });
        expect(result.container.textContent).toMatch(/Atomic Number: 6/);
        expect(result.container.textContent).toMatch(/Symbol: C/);
    });
    it("shows error for an invalid query Xyz", async function (): Promise<void> {
        let result = render(function () { return <ElementLookup />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input = result.getByLabelText("Element symbol, name, or atomic number") as HTMLInputElement;
        input.value = "Xyz";
        fireEvent.input(input);
        let button = result.getByText("Look Up");
        fireEvent.click(button);
        let errorText = await result.findByText(/Element not found/);
        expect(errorText).toBeTruthy();
    });
    it("shows prompt when searching with an empty query", async function (): Promise<void> {
        let result = render(function () { return <ElementLookup />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let button = result.getByText("Look Up");
        fireEvent.click(button);
        let promptText = await result.findByText(/Please enter/);
        expect(promptText).toBeTruthy();
    });
    it("triggers search on Enter key", async function (): Promise<void> {
        let result = render(function () { return <ElementLookup />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input = result.getByLabelText("Element symbol, name, or atomic number") as HTMLInputElement;
        input.value = "Fe";
        fireEvent.input(input);
        fireEvent.keyDown(input, {key: "Enter"});
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Name: Iron/);
        });
        expect(result.container.textContent).toMatch(/Symbol: Fe/);
    });
    it("shows loading message before elements are fetched", async function (): Promise<void> {
        let result = render(function () { return <ElementLookup />; });
        expect(result.queryByText(/Loading elements/)).toBeTruthy();
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
    });
});
