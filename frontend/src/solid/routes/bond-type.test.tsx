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
});
