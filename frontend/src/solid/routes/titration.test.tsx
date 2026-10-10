import {render, fireEvent, cleanup, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, afterEach, beforeEach, vi} from "vitest";
import {ChartRenderer} from "../../modules/chartRenderer.js";
import {Titration} from "./titration";
afterEach(function (): void {
    cleanup();
});
describe("Titration route", function (): void {
    let renderLineChartSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        ChartRenderer.resetInstance();
        let instance = ChartRenderer.getInstance();
        renderLineChartSpy = vi.spyOn(Object.getPrototypeOf(instance), "renderLineChart").mockImplementation(function (): void { return; });
        vi.spyOn(Object.getPrototypeOf(instance), "destroyChart").mockImplementation(function (): void { return; });
    });
    afterEach(function (): void {
        ChartRenderer.resetInstance();
        vi.restoreAllMocks();
    });
    it("renders the card with titration inputs, acid-type select, and buttons", function (): void {
        let result = render(function () { return <Titration />; });
        let acidConc = result.getByLabelText("Acid concentration") as HTMLInputElement;
        let acidVol = result.getByLabelText("Acid volume") as HTMLInputElement;
        let baseConc = result.getByLabelText("Base concentration") as HTMLInputElement;
        let maxVol = result.getByLabelText("Maximum volume") as HTMLInputElement;
        let ka = result.getByLabelText("Ka value") as HTMLInputElement;
        expect(acidConc).toBeTruthy();
        expect(acidVol).toBeTruthy();
        expect(baseConc).toBeTruthy();
        expect(maxVol).toBeTruthy();
        expect(ka).toBeTruthy();
        let acidType = result.getByLabelText("Select acid type") as HTMLSelectElement;
        expect(acidType).toBeTruthy();
        expect(acidType.value).toBe("strong");
        expect(result.getByText("Calculate")).toBeTruthy();
        expect(result.getByText("Clear")).toBeTruthy();
    });
    it("calculates the equivalence point for strong acid and renders the chart", async function (): Promise<void> {
        let result = render(function () { return <Titration />; });
        let acidConc = result.getByLabelText("Acid concentration") as HTMLInputElement;
        acidConc.value = "0.1";
        fireEvent.input(acidConc);
        let acidVol = result.getByLabelText("Acid volume") as HTMLInputElement;
        acidVol.value = "25";
        fireEvent.input(acidVol);
        let baseConc = result.getByLabelText("Base concentration") as HTMLInputElement;
        baseConc.value = "0.1";
        fireEvent.input(baseConc);
        let maxVol = result.getByLabelText("Maximum volume") as HTMLInputElement;
        maxVol.value = "50";
        fireEvent.input(maxVol);
        fireEvent.click(result.getByText("Calculate"));
        let text = await result.findByText(/Equivalence Point/);
        expect(text).toBeTruthy();
        await waitFor(function (): void {
            expect(renderLineChartSpy).toHaveBeenCalled();
        });
    });
    it("shows an error when acid concentration is zero", async function (): Promise<void> {
        let result = render(function () { return <Titration />; });
        let acidConc = result.getByLabelText("Acid concentration") as HTMLInputElement;
        acidConc.value = "0";
        fireEvent.input(acidConc);
        let acidVol = result.getByLabelText("Acid volume") as HTMLInputElement;
        acidVol.value = "25";
        fireEvent.input(acidVol);
        let baseConc = result.getByLabelText("Base concentration") as HTMLInputElement;
        baseConc.value = "0.1";
        fireEvent.input(baseConc);
        let maxVol = result.getByLabelText("Maximum volume") as HTMLInputElement;
        maxVol.value = "50";
        fireEvent.input(maxVol);
        fireEvent.click(result.getByText("Calculate"));
        let errorText = await result.findByText(/Error/);
        expect(errorText).toBeTruthy();
        expect(renderLineChartSpy).not.toHaveBeenCalled();
    });
    it("clears the result and chart when the Clear button is clicked", async function (): Promise<void> {
        let result = render(function () { return <Titration />; });
        let acidConc = result.getByLabelText("Acid concentration") as HTMLInputElement;
        acidConc.value = "0.1";
        fireEvent.input(acidConc);
        let acidVol = result.getByLabelText("Acid volume") as HTMLInputElement;
        acidVol.value = "25";
        fireEvent.input(acidVol);
        let baseConc = result.getByLabelText("Base concentration") as HTMLInputElement;
        baseConc.value = "0.1";
        fireEvent.input(baseConc);
        let maxVol = result.getByLabelText("Maximum volume") as HTMLInputElement;
        maxVol.value = "50";
        fireEvent.input(maxVol);
        fireEvent.click(result.getByText("Calculate"));
        let text = await result.findByText(/Equivalence Point/);
        expect(text).toBeTruthy();
        fireEvent.click(result.getByText("Clear"));
        expect(acidConc.value).toBe("");
        expect(result.container.textContent).not.toMatch(/Equivalence Point/);
    });
});
