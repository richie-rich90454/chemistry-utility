import {render, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {EquationBalancerRoute} from "./equation-balancer";
describe("EquationBalancer", function (): void {
    it("renders the card with input and medium selector", function (): void {
        let result = render(function () { return <EquationBalancerRoute />; });
        let input = result.getByLabelText("Chemical equation") as HTMLInputElement;
        expect(input).toBeTruthy();
        let medium = result.getByLabelText("Redox medium") as HTMLSelectElement;
        expect(medium).toBeTruthy();
    });
    it("balances H2 + O2 = H2O into 2H2 + O2 -> 2H2O", async function (): Promise<void> {
        let result = render(function () { return <EquationBalancerRoute />; });
        vi.useFakeTimers();
        let input = result.getByLabelText("Chemical equation") as HTMLInputElement;
        input.value = "H2 + O2 = H2O";
        fireEvent.input(input);
        await vi.advanceTimersByTimeAsync(600);
        vi.useRealTimers();
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/2H2/);
        });
        expect(result.container.textContent).toMatch(/2H2O/);
        expect(result.container.textContent).toMatch(/Balanced Equation/);
    });
    it("renders stoichiometric coefficients inside a dedicated chip", async function (): Promise<void> {
        let result = render(function () { return <EquationBalancerRoute />; });
        vi.useFakeTimers();
        let input = result.getByLabelText("Chemical equation") as HTMLInputElement;
        input.value = "H2 + O2 = H2O";
        fireEvent.input(input);
        await vi.advanceTimersByTimeAsync(600);
        vi.useRealTimers();
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/2H2/);
        });
        let chips = result.container.querySelectorAll("[class*=\"coefficient\"]");
        expect(chips.length).toBeGreaterThanOrEqual(2);
        let firstText = (chips[0].textContent || "").trim();
        expect(firstText).toBe("2");
    });
    it("shows an error when the input is empty", async function (): Promise<void> {
        let result = render(function () { return <EquationBalancerRoute />; });
        vi.useFakeTimers();
        let input = result.getByLabelText("Chemical equation") as HTMLInputElement;
        input.value = "";
        fireEvent.input(input);
        await vi.advanceTimersByTimeAsync(600);
        vi.useRealTimers();
        expect(result.container.textContent).not.toMatch(/Balanced Equation|2H2O/);
    });
    it("shows an error for an unbalanceable equation", async function (): Promise<void> {
        let result = render(function () { return <EquationBalancerRoute />; });
        vi.useFakeTimers();
        let input = result.getByLabelText("Chemical equation") as HTMLInputElement;
        input.value = "H2 + O2 -> H2O + C";
        fireEvent.input(input);
        await vi.advanceTimersByTimeAsync(600);
        vi.useRealTimers();
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Unbalanceable/);
        });
        expect(result.container.textContent).not.toMatch(/Balanced Equation/);
    });
    it("shows error for unsupported || redox separator", async function (): Promise<void> {
        let result = render(function () { return <EquationBalancerRoute />; });
        vi.useFakeTimers();
        let input = result.getByLabelText("Chemical equation") as HTMLInputElement;
        input.value = "MnO4- -> Mn2+ || Fe2+ -> Fe3+";
        fireEvent.input(input);
        await vi.advanceTimersByTimeAsync(600);
        vi.useRealTimers();
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/MnO4-|Invalid|arrow/);
        });
    });
    it("triggers balance on Enter key", async function (): Promise<void> {
        let result = render(function () { return <EquationBalancerRoute />; });
        vi.useFakeTimers();
        let input = result.getByLabelText("Chemical equation") as HTMLInputElement;
        input.value = "H2 + O2 = H2O";
        fireEvent.input(input);
        await vi.advanceTimersByTimeAsync(600);
        vi.useRealTimers();
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/2H2O/);
        });
    });
    it("clears input and result when the Clear button is clicked", async function (): Promise<void> {
        let result = render(function () { return <EquationBalancerRoute />; });
        vi.useFakeTimers();
        let input = result.getByLabelText("Chemical equation") as HTMLInputElement;
        input.value = "H2 + O2 = H2O";
        fireEvent.input(input);
        await vi.advanceTimersByTimeAsync(600);
        vi.useRealTimers();
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/2H2O/);
        });
        // Clear by setting input to empty
        vi.useFakeTimers();
        input.value = "";
        fireEvent.input(input);
        await vi.advanceTimersByTimeAsync(600);
        vi.useRealTimers();
        expect(input.value).toBe("");
        expect(result.container.textContent).not.toMatch(/2H2O/);
    });
});
