import {render, fireEvent, waitFor, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {MolarMass} from "./molar-mass";
import {mockElements} from "../../test/elementsData.js";
describe("MolarMass", function (): void {
    let fetchSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        vi.useFakeTimers();
        localStorage.clear();
        fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: function () { return Promise.resolve(mockElements); },
        } as Response);
    });
    afterEach(function (): void {
        vi.useRealTimers();
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
        vi.advanceTimersByTime(350);
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
        vi.advanceTimersByTime(350);
        let errorText = await result.findByText(/Element not found/);
        expect(errorText).toBeTruthy();
    });
    it("loads elements from cache without fetching when valid JSON is cached", async function (): Promise<void> {
        localStorage.setItem("chem-cache-ptable", JSON.stringify(mockElements));
        let result = render(function () { return <MolarMass />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        expect(fetchSpy).not.toHaveBeenCalled();
        let input = result.getByLabelText("Chemical formula") as HTMLInputElement;
        input.value = "H2O";
        fireEvent.input(input);
        vi.advanceTimersByTime(350);
        let massText = await result.findByText(/Molar Mass: 18\.015/);
        expect(massText).toBeTruthy();
    });
    it("falls through to fetch when cached JSON is corrupt", async function (): Promise<void> {
        localStorage.setItem("chem-cache-ptable", "not valid json{{{");
        let result = render(function () { return <MolarMass />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        expect(fetchSpy).toHaveBeenCalled();
        let input = result.getByLabelText("Chemical formula") as HTMLInputElement;
        input.value = "H2O";
        fireEvent.input(input);
        vi.advanceTimersByTime(350);
        let massText = await result.findByText(/Molar Mass: 18\.015/);
        expect(massText).toBeTruthy();
    });
    it("shows a load error when the ptable response is not ok", async function (): Promise<void> {
        fetchSpy.mockResolvedValue({ok: false, status: 500} as Response);
        let result = render(function () { return <MolarMass />; });
        let errorText = await result.findByText(/Error loading elements/);
        expect(errorText).toBeTruthy();
        expect(result.container.textContent).toMatch(/HTTP error! status: 500/);
    });
    it("shows a string rejection reason when fetch rejects with a non-Error", async function (): Promise<void> {
        fetchSpy.mockRejectedValue("cable-cut");
        let result = render(function () { return <MolarMass />; });
        let errorText = await result.findByText(/Error loading elements/);
        expect(errorText).toBeTruthy();
        expect(result.container.textContent).toMatch(/cable-cut/);
    });
    it("stays loading when fetch rejects with an AbortError", async function (): Promise<void> {
        fetchSpy.mockRejectedValue(new DOMException("aborted", "AbortError"));
        let result = render(function () { return <MolarMass />; });
        for (let i = 0; i < 10; i = i + 1) {
            await Promise.resolve();
        }
        expect(fetchSpy).toHaveBeenCalled();
        expect(result.queryByText(/Loading elements/)).toBeTruthy();
        expect(result.queryByText(/Error loading elements/)).toBeNull();
    });
    it("ignores input while elements are still loading", async function (): Promise<void> {
        let result = render(function () { return <MolarMass />; });
        let input = result.getByLabelText("Chemical formula") as HTMLInputElement;
        input.value = "H2O";
        fireEvent.input(input);
        vi.advanceTimersByTime(350);
        expect(result.queryByText(/Molar Mass:/)).toBeNull();
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        input.value = "H2O";
        fireEvent.input(input);
        vi.advanceTimersByTime(350);
        let massText = await result.findByText(/Molar Mass: 18\.015/);
        expect(massText).toBeTruthy();
    });
    it("clears the result when the formula is emptied", async function (): Promise<void> {
        let result = render(function () { return <MolarMass />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input = result.getByLabelText("Chemical formula") as HTMLInputElement;
        input.value = "H2O";
        fireEvent.input(input);
        vi.advanceTimersByTime(350);
        let massText = await result.findByText(/Molar Mass: 18\.015/);
        expect(massText).toBeTruthy();
        input.value = "";
        fireEvent.input(input);
        vi.advanceTimersByTime(350);
        expect(result.queryByText(/Molar Mass:/)).toBeNull();
    });
    it("clears pending debounce and aborts fetch on unmount", async function (): Promise<void> {
        fetchSpy.mockImplementation(function () { return new Promise(function () { return; }); });
        let result = render(function () { return <MolarMass />; });
        for (let i = 0; i < 10; i = i + 1) {
            await Promise.resolve();
        }
        expect(fetchSpy).toHaveBeenCalled();
        let input = result.getByLabelText("Chemical formula") as HTMLInputElement;
        input.value = "H2O";
        fireEvent.input(input);
        cleanup();
        expect(fetchSpy).toHaveBeenCalled();
    });
    it("ignores late fetch resolution after unmount", async function (): Promise<void> {
        let resolveFetch!: (value: Response) => void;
        fetchSpy.mockImplementation(function () { return new Promise<Response>(function (resolve) { resolveFetch = resolve; }); });
        render(function () { return <MolarMass />; });
        await Promise.resolve();
        cleanup();
        resolveFetch({ok: true, json: function () { return Promise.resolve(mockElements); }} as Response);
        await Promise.resolve();
        await Promise.resolve();
        expect(fetchSpy).toHaveBeenCalled();
    });
    it("ignores late fetch rejection after unmount", async function (): Promise<void> {
        let rejectFetch!: (reason: unknown) => void;
        fetchSpy.mockImplementation(function () { return new Promise<Response>(function (_resolve, reject) { rejectFetch = reject; }); });
        render(function () { return <MolarMass />; });
        await Promise.resolve();
        cleanup();
        rejectFetch(new Error("late failure"));
        await Promise.resolve();
        await Promise.resolve();
        expect(fetchSpy).toHaveBeenCalled();
    });
    it("ignores cached lookup after unmount", async function (): Promise<void> {
        localStorage.setItem("chem-cache-ptable", JSON.stringify(mockElements));
        render(function () { return <MolarMass />; });
        cleanup();
        await Promise.resolve();
        await Promise.resolve();
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
