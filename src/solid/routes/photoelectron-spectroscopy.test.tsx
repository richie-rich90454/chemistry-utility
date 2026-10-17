import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, afterEach} from "vitest";
import {PhotoelectronSpectroscopy} from "./photoelectron-spectroscopy";

afterEach(function (): void {
    cleanup();
});

describe("PhotoelectronSpectroscopy route", function (): void {
    it("renders the card with the peak input", function (): void {
        let result = render(function () { return <PhotoelectronSpectroscopy />; });
        expect(result.getByLabelText("PES peak positions in MJ/mol")).toBeTruthy();
        expect(result.getByText("Identify Element")).toBeTruthy();
    });

    it("identifies the element and clears the result", async function (): Promise<void> {
        let result = render(function () { return <PhotoelectronSpectroscopy />; });
        let peaks = result.getByLabelText("PES peak positions in MJ/mol") as HTMLInputElement;
        peaks.value = "39.548, 2.466, 1.402";
        fireEvent.input(peaks);
        fireEvent.click(result.getByText("Identify Element"));
        await result.findByText(/Nitrogen/);
        fireEvent.click(result.getByText("Clear"));
        expect(result.container.textContent).not.toMatch(/Nitrogen \(N, Z = 7\)/);
    });
});
