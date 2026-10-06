import {render, fireEvent, cleanup, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
const mocks = vi.hoisted(function () {
    return {
        "mockProcessCsvText": vi.fn(),
        "mockParseCsv": vi.fn(),
        "mockDownloadResults": vi.fn()
    };
});
vi.mock("../../modules/batchCalculator.js", function () {
    return {
        "BatchCalculator": {
            "getInstance": function () {
                return {
                    "processCsvText": mocks.mockProcessCsvText,
                    "parseCsv": mocks.mockParseCsv,
                    "downloadResults": mocks.mockDownloadResults
                };
            }
        }
    };
});
import {BatchCalc} from "./batch-calc";
function makeFile(contents: string, name: string): File {
    return new File([contents], name, {"type": "text/csv"});
}
function setFiles(input: HTMLInputElement, files: File[]): void {
    Object.defineProperty(input, "files", {
        "configurable": true,
        "value": files
    });
}
describe("BatchCalc", function (): void {
    beforeEach(function (): void {
        mocks.mockProcessCsvText.mockReset();
        mocks.mockParseCsv.mockReset();
        mocks.mockDownloadResults.mockReset();
        mocks.mockParseCsv.mockImplementation(function (text: string): string[][] {
            let rows: string[][] = [];
            let lines: string[] = text.split("\n");
            let i: number;
            for (i = 0; i < lines.length; i++) {
                if (lines[i] !== "") {
                    rows.push(lines[i].split(","));
                }
            }
            return rows;
        });
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("renders the card with calculator type select, file input, and process button", function (): void {
        let result = render(function () { return <BatchCalc />; });
        let typeSelect = result.getByLabelText("Select calculator type for batch processing") as HTMLSelectElement;
        expect(typeSelect).toBeTruthy();
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        expect(fileInput).toBeTruthy();
        let processButton = result.getByText("Process") as HTMLButtonElement;
        expect(processButton).toBeTruthy();
    });
    it("disables Process button when no file is selected", function (): void {
        let result = render(function () { return <BatchCalc />; });
        let processButton = result.getByText("Process") as HTMLButtonElement;
        expect(processButton.disabled).toBe(true);
    });
    it("enables Process button when a file is selected", function (): void {
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        let file: File = makeFile("formula\nH2O\n", "input.csv");
        setFiles(fileInput, [file]);
        fireEvent.change(fileInput);
        let processButton = result.getByText("Process") as HTMLButtonElement;
        expect(processButton.disabled).toBe(false);
    });
    it("calls processCsvText and renders preview table when Process is clicked with a file", async function (): Promise<void> {
        let csvResult: {"csvString": string; "totalRows": number; "successCount": number; "errorCount": number} = {
            "csvString": "formula,molar_mass,unit,status\nH2O,18.015,g/mol,ok",
            "totalRows": 1,
            "successCount": 1,
            "errorCount": 0
        };
        mocks.mockProcessCsvText.mockImplementation(function (_text: string, _type: string, onProgress: (info: {"current": number; "total": number}) => void): Promise<{"csvString": string; "totalRows": number; "successCount": number; "errorCount": number}> {
            onProgress({"current": 1, "total": 1});
            return Promise.resolve(csvResult);
        });
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        let file: File = makeFile("formula\nH2O\n", "input.csv");
        setFiles(fileInput, [file]);
        fireEvent.change(fileInput);
        fireEvent.click(result.getByText("Process"));
        await waitFor(function (): void {
            expect(mocks.mockProcessCsvText).toHaveBeenCalled();
        });
        let callArgs: unknown[] = mocks.mockProcessCsvText.mock.calls[0];
        expect(callArgs[0]).toBe("formula\nH2O\n");
        expect(callArgs[1]).toBe("molar-mass");
        await waitFor(function (): void {
            expect(result.getByText("Results Preview (first 10 rows)")).toBeTruthy();
        });
        expect(result.getByText("formula")).toBeTruthy();
        expect(result.getByText("H2O")).toBeTruthy();
        expect(result.getByText("18.015")).toBeTruthy();
        expect(result.getByText("ok")).toBeTruthy();
    });
    it("shows status message after processing completes", async function (): Promise<void> {
        let csvResult: {"csvString": string; "totalRows": number; "successCount": number; "errorCount": number} = {
            "csvString": "formula,molar_mass,unit,status\nH2O,18.015,g/mol,ok",
            "totalRows": 1,
            "successCount": 1,
            "errorCount": 0
        };
        mocks.mockProcessCsvText.mockResolvedValue(csvResult);
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        let file: File = makeFile("formula\nH2O\n", "input.csv");
        setFiles(fileInput, [file]);
        fireEvent.change(fileInput);
        fireEvent.click(result.getByText("Process"));
        await waitFor(function (): void {
            expect(result.getByText(/Processed 1 rows\. Success: 1, Errors: 0\./)).toBeTruthy();
        });
    });
    it("shows Download Results button after processing completes", async function (): Promise<void> {
        let csvResult: {"csvString": string; "totalRows": number; "successCount": number; "errorCount": number} = {
            "csvString": "formula,molar_mass,unit,status\nH2O,18.015,g/mol,ok",
            "totalRows": 1,
            "successCount": 1,
            "errorCount": 0
        };
        mocks.mockProcessCsvText.mockResolvedValue(csvResult);
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        let file: File = makeFile("formula\nH2O\n", "input.csv");
        setFiles(fileInput, [file]);
        fireEvent.change(fileInput);
        fireEvent.click(result.getByText("Process"));
        await waitFor(function (): void {
            expect(result.getByText("Download Results")).toBeTruthy();
        });
    });
    it("calls downloadResults when Download Results is clicked", async function (): Promise<void> {
        let csvResult: {"csvString": string; "totalRows": number; "successCount": number; "errorCount": number} = {
            "csvString": "formula,molar_mass,unit,status\nH2O,18.015,g/mol,ok",
            "totalRows": 1,
            "successCount": 1,
            "errorCount": 0
        };
        mocks.mockProcessCsvText.mockResolvedValue(csvResult);
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        let file: File = makeFile("formula\nH2O\n", "input.csv");
        setFiles(fileInput, [file]);
        fireEvent.change(fileInput);
        fireEvent.click(result.getByText("Process"));
        await waitFor(function (): void {
            expect(result.getByText("Download Results")).toBeTruthy();
        });
        fireEvent.click(result.getByText("Download Results"));
        expect(mocks.mockDownloadResults).toHaveBeenCalledWith("formula,molar_mass,unit,status\nH2O,18.015,g/mol,ok", "batch-results.csv");
    });
    it("handles processing error and displays message", async function (): Promise<void> {
        mocks.mockProcessCsvText.mockRejectedValue(new Error("CSV headers are invalid for calculator type: molar-mass"));
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        let file: File = makeFile("name\nH2O\n", "wrong.csv");
        setFiles(fileInput, [file]);
        fireEvent.change(fileInput);
        fireEvent.click(result.getByText("Process"));
        await waitFor(function (): void {
            expect(result.getByText(/CSV headers are invalid/)).toBeTruthy();
        });
    });
    it("shows progress bar during processing", async function (): Promise<void> {
        let resolveProcess: (val: {"csvString": string; "totalRows": number; "successCount": number; "errorCount": number}) => void = function (): void { return; };
        mocks.mockProcessCsvText.mockImplementation(function (_text: string, _type: string, onProgress: (info: {"current": number; "total": number}) => void): Promise<{"csvString": string; "totalRows": number; "successCount": number; "errorCount": number}> {
            onProgress({"current": 1, "total": 3});
            return new Promise(function (resolve: (val: {"csvString": string; "totalRows": number; "successCount": number; "errorCount": number}) => void): void {
                resolveProcess = resolve;
            });
        });
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        let file: File = makeFile("formula\nA\nB\nC\n", "input.csv");
        setFiles(fileInput, [file]);
        fireEvent.change(fileInput);
        fireEvent.click(result.getByText("Process"));
        await waitFor(function (): void {
            expect(result.getByText("1 / 3")).toBeTruthy();
        });
        let progressBar: HTMLProgressElement = result.container.querySelector("progress") as HTMLProgressElement;
        expect(progressBar).not.toBeNull();
        expect(progressBar.max).toBe(3);
        expect(progressBar.value).toBe(1);
        resolveProcess({"csvString": "formula,molar_mass,unit,status\nA,1,g/mol,ok\nB,1,g/mol,ok\nC,1,g/mol,ok", "totalRows": 3, "successCount": 3, "errorCount": 0});
        await waitFor(function (): void {
            expect(result.container.querySelector("progress")).toBeNull();
        });
    });
    it("clears inputs and results when Clear is clicked", async function (): Promise<void> {
        let csvResult: {"csvString": string; "totalRows": number; "successCount": number; "errorCount": number} = {
            "csvString": "formula,molar_mass,unit,status\nH2O,18.015,g/mol,ok",
            "totalRows": 1,
            "successCount": 1,
            "errorCount": 0
        };
        mocks.mockProcessCsvText.mockResolvedValue(csvResult);
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        let file: File = makeFile("formula\nH2O\n", "input.csv");
        setFiles(fileInput, [file]);
        fireEvent.change(fileInput);
        fireEvent.click(result.getByText("Process"));
        await waitFor(function (): void {
            expect(result.getByText("Download Results")).toBeTruthy();
        });
        fireEvent.click(result.getByText("Clear"));
        expect(result.queryByText("Download Results")).toBeNull();
        expect(result.queryByText("Results Preview")).toBeNull();
        let processButton = result.getByText("Process") as HTMLButtonElement;
        expect(processButton.disabled).toBe(true);
    });
    it("renders all calculator type options", function (): void {
        let result = render(function () { return <BatchCalc />; });
        let typeSelect = result.getByLabelText("Select calculator type for batch processing") as HTMLSelectElement;
        let options = typeSelect.options;
        expect(options.length).toBe(29);
        expect(options[0].value).toBe("molar-mass");
        expect(options[1].value).toBe("dilution");
    });
    it("passes the selected calculator type to processCsvText", async function (): Promise<void> {
        let csvResult: {"csvString": string; "totalRows": number; "successCount": number; "errorCount": number} = {
            "csvString": "input,result\n1,2",
            "totalRows": 1,
            "successCount": 1,
            "errorCount": 0
        };
        mocks.mockProcessCsvText.mockResolvedValue(csvResult);
        let result = render(function () { return <BatchCalc />; });
        let typeSelect = result.getByLabelText("Select calculator type for batch processing") as HTMLSelectElement;
        typeSelect.value = "solution-mixing";
        fireEvent.change(typeSelect);
        expect(typeSelect.value).toBe("solution-mixing");
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        setFiles(fileInput, [makeFile("input\n1\n", "input.csv")]);
        fireEvent.change(fileInput);
        fireEvent.click(result.getByText("Process"));
        await waitFor(function (): void {
            expect(mocks.mockProcessCsvText).toHaveBeenCalled();
        });
        let callArgs: unknown[] = mocks.mockProcessCsvText.mock.calls[0];
        expect(callArgs[1]).toBe("solution-mixing");
    });
    it("keeps Process disabled when the file selection is empty", function (): void {
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        fireEvent.change(fileInput);
        let processButton = result.getByText("Process") as HTMLButtonElement;
        expect(processButton.disabled).toBe(true);
    });
    it("clears the selected file when the file input has no files", function (): void {
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        setFiles(fileInput, [makeFile("formula\nH2O\n", "input.csv")]);
        fireEvent.change(fileInput);
        expect((result.getByText("Process") as HTMLButtonElement).disabled).toBe(false);
        Object.defineProperty(fileInput, "files", {
            "configurable": true,
            "value": null
        });
        fireEvent.change(fileInput);
        expect((result.getByText("Process") as HTMLButtonElement).disabled).toBe(true);
    });
    it("displays a non-Error processing failure message", async function (): Promise<void> {
        mocks.mockProcessCsvText.mockRejectedValue("plain string failure");
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        setFiles(fileInput, [makeFile("name\nH2O\n", "wrong.csv")]);
        fireEvent.change(fileInput);
        fireEvent.click(result.getByText("Process"));
        await waitFor(function (): void {
            expect(result.getByText(/plain string failure/)).toBeTruthy();
        });
    });
    it("renders no preview when the result CSV has no rows", async function (): Promise<void> {
        let csvResult: {"csvString": string; "totalRows": number; "successCount": number; "errorCount": number} = {
            "csvString": "",
            "totalRows": 0,
            "successCount": 0,
            "errorCount": 0
        };
        mocks.mockProcessCsvText.mockResolvedValue(csvResult);
        mocks.mockParseCsv.mockReturnValueOnce([]);
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        setFiles(fileInput, [makeFile("formula\nH2O\n", "input.csv")]);
        fireEvent.change(fileInput);
        fireEvent.click(result.getByText("Process"));
        await waitFor(function (): void {
            expect(result.getByText(/Processed 0 rows/)).toBeTruthy();
        });
        expect(result.queryByText("Results Preview (first 10 rows)")).toBeNull();
        expect(result.getByText("Download Results")).toBeTruthy();
    });
    it("ignores a stale Download click after results are cleared", async function (): Promise<void> {
        let csvResult: {"csvString": string; "totalRows": number; "successCount": number; "errorCount": number} = {
            "csvString": "formula,molar_mass,unit,status\nH2O,18.015,g/mol,ok",
            "totalRows": 1,
            "successCount": 1,
            "errorCount": 0
        };
        mocks.mockProcessCsvText.mockResolvedValue(csvResult);
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        setFiles(fileInput, [makeFile("formula\nH2O\n", "input.csv")]);
        fireEvent.change(fileInput);
        fireEvent.click(result.getByText("Process"));
        await waitFor(function (): void {
            expect(result.getByText("Download Results")).toBeTruthy();
        });
        let downloadButton = result.getByText("Download Results");
        fireEvent.click(result.getByText("Clear"));
        expect(result.queryByText("Download Results")).toBeNull();
        fireEvent.click(downloadButton);
        expect(mocks.mockDownloadResults).not.toHaveBeenCalled();
    });
    it("clears state even when the file input is missing from the DOM", function (): void {
        let result = render(function () { return <BatchCalc />; });
        let fileInput = result.getByLabelText("Choose CSV file") as HTMLInputElement;
        setFiles(fileInput, [makeFile("formula\nH2O\n", "input.csv")]);
        fireEvent.change(fileInput);
        let getByIdSpy = vi.spyOn(document, "getElementById").mockReturnValue(null);
        fireEvent.click(result.getByText("Clear"));
        getByIdSpy.mockRestore();
        expect((result.getByText("Process") as HTMLButtonElement).disabled).toBe(true);
    });
});
