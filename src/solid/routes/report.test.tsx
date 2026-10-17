import {render, cleanup, fireEvent} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import type {HistoryEntry} from "../../modules/exportManager.js";
const mocks = vi.hoisted(function () {
    return {
        "mockGetHistory": vi.fn()
    };
});
vi.mock("../../modules/exportManager.js", function () {
    return {
        "ExportManager": {
            "getInstance": function () {
                return {"getHistory": mocks.mockGetHistory};
            }
        }
    };
});
import {LabReport} from "./report";
function makeEntry(overrides?: {"calculatorId"?: string; "inputs"?: Record<string, string>; "result"?: string; "explanation"?: string; "timestamp"?: string}): HistoryEntry {
    let base: HistoryEntry = {
        "calculatorId": "molar-mass",
        "inputs": {"formula-input": "H2O"},
        "result": "Molar Mass: 18.015 g/mol",
        "timestamp": "2026-07-20T10:30:00.000Z"
    };
    let keys = Object.keys(overrides ?? {});
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = (overrides as Record<string, unknown>)[key];
        if (value !== undefined) {
            (base as unknown as Record<string, unknown>)[key] = value;
        }
    }
    return base;
}
describe("LabReport", function (): void {
    beforeEach(function (): void {
        mocks.mockGetHistory.mockReset();
        mocks.mockGetHistory.mockReturnValue([]);
    });
    afterEach(function (): void {
        cleanup();
        document.body.classList.remove("printing-report");
        vi.restoreAllMocks();
    });
    it("renders the report heading and a print button", function (): void {
        let result = render(function (): JSX.Element { return <LabReport />; });
        expect(result.getByRole("heading", {"level": 1, "name": "Lab Report"})).toBeTruthy();
        expect(result.getByRole("button", {"name": "Print report"})).toBeTruthy();
    });
    it("marks the document for the print stylesheet while mounted", function (): void {
        render(function (): JSX.Element { return <LabReport />; });
        expect(document.body.classList.contains("printing-report")).toBe(true);
        cleanup();
        expect(document.body.classList.contains("printing-report")).toBe(false);
    });
    it("prints through the browser dialog when the button is clicked", function (): void {
        let printSpy = vi.fn();
        Object.defineProperty(window, "print", {"value": printSpy, "writable": true, "configurable": true});
        let result = render(function (): JSX.Element { return <LabReport />; });
        fireEvent.click(result.getByRole("button", {"name": "Print report"}));
        expect(printSpy).toHaveBeenCalledTimes(1);
    });
    it("shows an empty state with no history", function (): void {
        let result = render(function (): JSX.Element { return <LabReport />; });
        expect(result.getByText("No calculations recorded yet.")).toBeTruthy();
    });
    it("renders a section per history entry", function (): void {
        mocks.mockGetHistory.mockReturnValue([makeEntry({})]);
        let result = render(function (): JSX.Element { return <LabReport />; });
        let report = result.container.querySelector(".lab-report") as HTMLElement;
        expect(report).not.toBeNull();
        expect(report.querySelectorAll(".lab-entry").length).toBe(1);
        expect(report.textContent).toContain("H2O");
        expect(report.textContent).toContain("formula-input");
        expect(report.textContent).toContain("Molar Mass: 18.015 g/mol");
        expect(report.textContent).toContain("Result:");
    });
    it("renders the worked steps when the entry carries an explanation", function (): void {
        mocks.mockGetHistory.mockReturnValue([makeEntry({"explanation": "V2 = (M1 * V1) / M2"})]);
        let result = render(function (): JSX.Element { return <LabReport />; });
        let report = result.container.querySelector(".lab-report") as HTMLElement;
        expect(report.querySelector(".lab-steps")).not.toBeNull();
        expect(report.textContent).toContain("V2 = (M1 * V1) / M2");
    });
    it("omits the worked steps when the entry has no explanation", function (): void {
        mocks.mockGetHistory.mockReturnValue([makeEntry({})]);
        let result = render(function (): JSX.Element { return <LabReport />; });
        let report = result.container.querySelector(".lab-report") as HTMLElement;
        expect(report.querySelector(".lab-steps")).toBeNull();
    });
});
