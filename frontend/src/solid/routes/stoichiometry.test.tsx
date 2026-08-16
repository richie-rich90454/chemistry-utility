import {render, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {Stoichiometry} from "./stoichiometry";
describe("Stoichiometry", function (): void {
    it("renders the card with equation input, calculation type selector, and buttons", function (): void {
        let result = render(function () { return <Stoichiometry />; });
        let input = result.getByLabelText("Balanced chemical equation") as HTMLInputElement;
        expect(input).toBeTruthy();
        let calcType = result.getByLabelText("Select stoichiometry calculation type") as HTMLSelectElement;
        expect(calcType).toBeTruthy();
        let button = result.getByText("Calculate");
        expect(button).toBeTruthy();
        let clearButton = result.getByText("Clear");
        expect(clearButton).toBeTruthy();
    });
    it("shows an error when Calculate is clicked with no equation", async function (): Promise<void> {
        let result = render(function () { return <Stoichiometry />; });
        fireEvent.click(result.getByText("Calculate"));
        let errorText = await result.findByText(/Enter a valid balanced equation/);
        expect(errorText).toBeTruthy();
    });
    it("shows dynamic inputs when a valid equation is entered in product-from-reactant mode", async function (): Promise<void> {
        let result = render(function () { return <Stoichiometry />; });
        let input = result.getByLabelText("Balanced chemical equation") as HTMLInputElement;
        input.value = "2H2 + O2 -> 2H2O";
        fireEvent.input(input);
        await waitFor(function (): void {
            expect(result.getByLabelText("Select reactant")).toBeTruthy();
        });
        expect(result.getByLabelText("Moles of reactant")).toBeTruthy();
        expect(result.getByLabelText("Select product")).toBeTruthy();
    });
    it("calculates product moles from reactant moles", async function (): Promise<void> {
        let result = render(function () { return <Stoichiometry />; });
        let input = result.getByLabelText("Balanced chemical equation") as HTMLInputElement;
        input.value = "2H2 + O2 -> 2H2O";
        fireEvent.input(input);
        await waitFor(function (): void {
            expect(result.getByLabelText("Moles of reactant")).toBeTruthy();
        });
        let molesInput = result.getByLabelText("Moles of reactant") as HTMLInputElement;
        molesInput.value = "4";
        fireEvent.input(molesInput);
        fireEvent.click(result.getByText("Calculate"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/molesProduct/);
        });
        expect(result.container.textContent).toMatch(/\(4 \/ 2\) \* 2 = 4\.00/);
    });
    it("switches to limiting-reactant mode and shows Moles of inputs for each reactant", async function (): Promise<void> {
        let result = render(function () { return <Stoichiometry />; });
        let input = result.getByLabelText("Balanced chemical equation") as HTMLInputElement;
        input.value = "2H2 + O2 -> 2H2O";
        fireEvent.input(input);
        let calcType = result.getByLabelText("Select stoichiometry calculation type") as HTMLSelectElement;
        calcType.value = "limiting-reactant";
        fireEvent.change(calcType);
        await waitFor(function (): void {
            expect(result.getByLabelText("Moles of H2")).toBeTruthy();
        });
        expect(result.getByLabelText("Moles of O2")).toBeTruthy();
        expect(result.getByLabelText("Select product to calculate")).toBeTruthy();
    });
    it("calculates limiting reactant and product yield", async function (): Promise<void> {
        let result = render(function () { return <Stoichiometry />; });
        let input = result.getByLabelText("Balanced chemical equation") as HTMLInputElement;
        input.value = "2H2 + O2 -> 2H2O";
        fireEvent.input(input);
        let calcType = result.getByLabelText("Select stoichiometry calculation type") as HTMLSelectElement;
        calcType.value = "limiting-reactant";
        fireEvent.change(calcType);
        await waitFor(function (): void {
            expect(result.getByLabelText("Moles of H2")).toBeTruthy();
        });
        let h2Input = result.getByLabelText("Moles of H2") as HTMLInputElement;
        h2Input.value = "4";
        fireEvent.input(h2Input);
        let o2Input = result.getByLabelText("Moles of O2") as HTMLInputElement;
        o2Input.value = "1";
        fireEvent.input(o2Input);
        fireEvent.click(result.getByText("Calculate"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/limiting: O2/);
        });
        expect(result.container.textContent).toMatch(/molesProduct/);
    });
    it("shows a load error for an invalid equation", async function (): Promise<void> {
        let result = render(function () { return <Stoichiometry />; });
        let input = result.getByLabelText("Balanced chemical equation") as HTMLInputElement;
        input.value = "invalid equation";
        fireEvent.input(input);
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Invalid equation/);
        });
    });
    it("switches to reactant-from-product mode and shows product moles input", async function (): Promise<void> {
        let result = render(function () { return <Stoichiometry />; });
        let input = result.getByLabelText("Balanced chemical equation") as HTMLInputElement;
        input.value = "2H2 + O2 -> 2H2O";
        fireEvent.input(input);
        let calcType = result.getByLabelText("Select stoichiometry calculation type") as HTMLSelectElement;
        calcType.value = "reactant-from-product";
        fireEvent.change(calcType);
        await waitFor(function (): void {
            expect(result.getByLabelText("Moles of product")).toBeTruthy();
        });
    });
    it("clears inputs and result when Clear is clicked", async function (): Promise<void> {
        let result = render(function () { return <Stoichiometry />; });
        let input = result.getByLabelText("Balanced chemical equation") as HTMLInputElement;
        input.value = "2H2 + O2 -> 2H2O";
        fireEvent.input(input);
        await waitFor(function (): void {
            expect(result.getByLabelText("Moles of reactant")).toBeTruthy();
        });
        let molesInput = result.getByLabelText("Moles of reactant") as HTMLInputElement;
        molesInput.value = "4";
        fireEvent.input(molesInput);
        fireEvent.click(result.getByText("Calculate"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/molesProduct/);
        });
        fireEvent.click(result.getByText("Clear"));
        expect(input.value).toBe("");
        expect(result.container.textContent).not.toMatch(/molesProduct/);
    });
});
