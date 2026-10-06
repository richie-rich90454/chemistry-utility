import {render, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {BondType} from "./bond-type";
import {mockElements} from "../../test/elementsData.js";
describe("BondType", function (): void {
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
    it("renders the card with two element inputs and Predict Bond Type button", async function (): Promise<void> {
        let result = render(function () { return <BondType />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input1 = result.getByLabelText("First element symbol") as HTMLInputElement;
        expect(input1).toBeTruthy();
        let input2 = result.getByLabelText("Second element symbol") as HTMLInputElement;
        expect(input2).toBeTruthy();
        let button = result.getByText("Predict Bond Type");
        expect(button).toBeTruthy();
        let clearButton = result.getByText("Clear");
        expect(clearButton).toBeTruthy();
    });
    it("shows loading message before elements are fetched", async function (): Promise<void> {
        let result = render(function () { return <BondType />; });
        expect(result.queryByText(/Loading elements/)).toBeTruthy();
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
    });
    it("predicts ionic bond for Na and Cl", async function (): Promise<void> {
        let result = render(function () { return <BondType />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input1 = result.getByLabelText("First element symbol") as HTMLInputElement;
        input1.value = "Na";
        fireEvent.input(input1);
        let input2 = result.getByLabelText("Second element symbol") as HTMLInputElement;
        input2.value = "Cl";
        fireEvent.input(input2);
        fireEvent.click(result.getByText("Predict Bond Type"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Ionic/);
        });
        expect(result.container.textContent).toMatch(/Na/);
        expect(result.container.textContent).toMatch(/Cl/);
    });
    it("predicts polar covalent bond for H and O", async function (): Promise<void> {
        let result = render(function () { return <BondType />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input1 = result.getByLabelText("First element symbol") as HTMLInputElement;
        input1.value = "H";
        fireEvent.input(input1);
        let input2 = result.getByLabelText("Second element symbol") as HTMLInputElement;
        input2.value = "O";
        fireEvent.input(input2);
        fireEvent.click(result.getByText("Predict Bond Type"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Polar Covalent/);
        });
    });
    it("predicts metallic bond for Fe and Cu", async function (): Promise<void> {
        let result = render(function () { return <BondType />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input1 = result.getByLabelText("First element symbol") as HTMLInputElement;
        input1.value = "Fe";
        fireEvent.input(input1);
        let input2 = result.getByLabelText("Second element symbol") as HTMLInputElement;
        input2.value = "Cu";
        fireEvent.input(input2);
        fireEvent.click(result.getByText("Predict Bond Type"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Metallic/);
        });
    });
    it("shows error for an unknown element symbol", async function (): Promise<void> {
        let result = render(function () { return <BondType />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input1 = result.getByLabelText("First element symbol") as HTMLInputElement;
        input1.value = "Xx";
        fireEvent.input(input1);
        let input2 = result.getByLabelText("Second element symbol") as HTMLInputElement;
        input2.value = "Cl";
        fireEvent.input(input2);
        fireEvent.click(result.getByText("Predict Bond Type"));
        let errorText = await result.findByText(/One or both elements not found/);
        expect(errorText).toBeTruthy();
    });
    it("clears inputs and result when Clear is clicked", async function (): Promise<void> {
        let result = render(function () { return <BondType />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let input1 = result.getByLabelText("First element symbol") as HTMLInputElement;
        input1.value = "Na";
        fireEvent.input(input1);
        let input2 = result.getByLabelText("Second element symbol") as HTMLInputElement;
        input2.value = "Cl";
        fireEvent.input(input2);
        fireEvent.click(result.getByText("Predict Bond Type"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Ionic/);
        });
        fireEvent.click(result.getByText("Clear"));
        expect(input1.value).toBe("");
        expect(input2.value).toBe("");
        expect(result.container.textContent).not.toMatch(/isMetal1/);
    });
    it("loads elements from cache without fetching", async function (): Promise<void> {
        localStorage.setItem("chem-cache-ptable", JSON.stringify(mockElements));
        let result = render(function () { return <BondType />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        expect(fetchSpy).not.toHaveBeenCalled();
        let input1 = result.getByLabelText("First element symbol") as HTMLInputElement;
        input1.value = "Na";
        fireEvent.input(input1);
        let input2 = result.getByLabelText("Second element symbol") as HTMLInputElement;
        input2.value = "Cl";
        fireEvent.input(input2);
        fireEvent.click(result.getByText("Predict Bond Type"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Ionic/);
        });
    });
    it("falls back to fetch when the cache is corrupt", async function (): Promise<void> {
        localStorage.setItem("chem-cache-ptable", "%%not-json%%");
        let result = render(function () { return <BondType />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        expect(fetchSpy).toHaveBeenCalled();
        let input1 = result.getByLabelText("First element symbol") as HTMLInputElement;
        input1.value = "H";
        fireEvent.input(input1);
        let input2 = result.getByLabelText("Second element symbol") as HTMLInputElement;
        input2.value = "O";
        fireEvent.input(input2);
        fireEvent.click(result.getByText("Predict Bond Type"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Polar Covalent/);
        });
    });
    it("shows a load error when the fetch response is not ok", async function (): Promise<void> {
        fetchSpy.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: function () { return Promise.resolve([]); },
        } as Response);
        let result = render(function () { return <BondType />; });
        let errorText = await result.findByText(/Error loading elements: HTTP error! status: 500/);
        expect(errorText).toBeTruthy();
    });
    it("shows a load error when the fetch fails", async function (): Promise<void> {
        fetchSpy.mockRejectedValueOnce(new Error("network down"));
        let result = render(function () { return <BondType />; });
        let errorText = await result.findByText(/Error loading elements: network down/);
        expect(errorText).toBeTruthy();
    });
    it("shows a load error message for non-Error fetch failures", async function (): Promise<void> {
        fetchSpy.mockRejectedValueOnce("string failure");
        let result = render(function () { return <BondType />; });
        let errorText = await result.findByText(/Error loading elements: string failure/);
        expect(errorText).toBeTruthy();
    });
    it("shows an error when predicting after elements fail to load", async function (): Promise<void> {
        fetchSpy.mockRejectedValueOnce(new Error("network down"));
        let result = render(function () { return <BondType />; });
        await result.findByText(/Error loading elements: network down/);
        let input1 = result.getByLabelText("First element symbol") as HTMLInputElement;
        input1.value = "Na";
        fireEvent.input(input1);
        let input2 = result.getByLabelText("Second element symbol") as HTMLInputElement;
        input2.value = "Cl";
        fireEvent.input(input2);
        fireEvent.click(result.getByText("Predict Bond Type"));
        let errorText = await result.findByText("Elements data not loaded yet");
        expect(errorText).toBeTruthy();
    });
});
