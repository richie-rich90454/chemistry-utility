import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {CommonIonEffect} from "./common-ion";
afterEach(function (): void {
    cleanup();
});
describe("CommonIonEffect route", function (): void {
    it("renders the card with Ksp, common-ion inputs and salt-type select", function (): void {
        let result = render(function () { return <CommonIonEffect />; });
        let ksp = result.getByLabelText("Ksp value") as HTMLInputElement;
        let conc = result.getByLabelText("Common ion concentration") as HTMLInputElement;
        expect(ksp).toBeTruthy();
        expect(conc).toBeTruthy();
        let saltType = result.getByLabelText("Select salt type") as HTMLSelectElement;
        expect(saltType).toBeTruthy();
        expect(saltType.value).toBe("AB");
        expect(result.getByText("Calculate")).toBeTruthy();
        expect(result.getByText("Clear")).toBeTruthy();
    });
    it("calculates reduced solubility for Ksp=1.8e-10 with 0.1 M common ion", async function (): Promise<void> {
        let result = render(function () { return <CommonIonEffect />; });
        let ksp = result.getByLabelText("Ksp value") as HTMLInputElement;
        ksp.value = "0.00000000018";
        fireEvent.input(ksp);
        let conc = result.getByLabelText("Common ion concentration") as HTMLInputElement;
        conc.value = "0.1";
        fireEvent.input(conc);
        fireEvent.click(result.getByText("Calculate"));
        let text = await result.findByText(/Molar Solubility/);
        expect(text).toBeTruthy();
    });
    it("shows an error when Ksp is zero", async function (): Promise<void> {
        let result = render(function () { return <CommonIonEffect />; });
        let ksp = result.getByLabelText("Ksp value") as HTMLInputElement;
        ksp.value = "0";
        fireEvent.input(ksp);
        let conc = result.getByLabelText("Common ion concentration") as HTMLInputElement;
        conc.value = "0.1";
        fireEvent.input(conc);
        fireEvent.click(result.getByText("Calculate"));
        let errorText = await result.findByText(/Error/);
        expect(errorText).toBeTruthy();
    });
    it("clears the result when the Clear button is clicked", async function (): Promise<void> {
        let result = render(function () { return <CommonIonEffect />; });
        let ksp = result.getByLabelText("Ksp value") as HTMLInputElement;
        ksp.value = "0.00000000018";
        fireEvent.input(ksp);
        let conc = result.getByLabelText("Common ion concentration") as HTMLInputElement;
        conc.value = "0.1";
        fireEvent.input(conc);
        fireEvent.click(result.getByText("Calculate"));
        let text = await result.findByText(/Molar Solubility/);
        expect(text).toBeTruthy();
        fireEvent.click(result.getByText("Clear"));
        expect(ksp.value).toBe("");
        expect(result.container.textContent).not.toMatch(/Molar Solubility/);
    });
});
