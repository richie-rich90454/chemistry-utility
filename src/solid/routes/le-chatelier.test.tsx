import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {LeChatelier} from "./le-chatelier";

afterEach(function (): void {
    cleanup();
});

describe("LeChatelier route", function (): void {
    it("renders the card with the four stress selects", function (): void {
        let result = render(function () { return <LeChatelier />; });
        expect((result.getByLabelText("Select whether the forward reaction is exothermic or endothermic") as HTMLSelectElement).value).toBe("exothermic");
        expect((result.getByLabelText("Select the type of stress applied to the equilibrium") as HTMLSelectElement).value).toBe("temperature");
        expect((result.getByLabelText("Select the direction of the change") as HTMLSelectElement).value).toBe("increase");
        expect((result.getByLabelText("Select the affected side, or the side with fewer moles of gas") as HTMLSelectElement).value).toBe("reactants");
        expect(result.getByText("Predict Shift")).toBeTruthy();
    });

    it("predicts the shift and clears the result", async function (): Promise<void> {
        let result = render(function () { return <LeChatelier />; });
        fireEvent.click(result.getByText("Predict Shift"));
        await result.findByText(/Shift: left/);
        fireEvent.click(result.getByText("Clear"));
        expect(result.container.textContent).not.toMatch(/Shift: left/);
    });
});
