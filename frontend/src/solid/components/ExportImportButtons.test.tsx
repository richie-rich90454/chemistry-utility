import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
const mocks = vi.hoisted(function () {
    return {
        "mockStatus": vi.fn(),
        "mockError": vi.fn(),
        "mockExportData": vi.fn(),
        "mockImportData": vi.fn()
    };
});
vi.mock("../stores/dataPortability", function () {
    return {
        "useDataPortability": function (): {
            "status": () => string;
            "error": () => string;
            "exportData": () => void;
            "importData": (jsonString: string) => void;
        } {
            return {
                "status": mocks.mockStatus,
                "error": mocks.mockError,
                "exportData": mocks.mockExportData,
                "importData": mocks.mockImportData
            };
        }
    };
});
import {ExportImportButtons} from "./ExportImportButtons";
function renderButtons(): ReturnType<typeof render> {
    return render(function (): JSX.Element {
        return <ExportImportButtons />;
    });
}
describe("ExportImportButtons", function (): void {
    beforeEach(function (): void {
        mocks.mockStatus.mockReset();
        mocks.mockError.mockReset();
        mocks.mockExportData.mockReset();
        mocks.mockImportData.mockReset();
        mocks.mockStatus.mockReturnValue("");
        mocks.mockError.mockReturnValue("");
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("renders Export Data and Import Data buttons", function (): void {
        let result = renderButtons();
        expect(result.getByRole("button", {"name": "Export Data"})).toBeTruthy();
        expect(result.getByRole("button", {"name": "Import Data"})).toBeTruthy();
    });
    it("renders a hidden file input with json accept filter", function (): void {
        let result = renderButtons();
        let fileInput = result.container.querySelector('input[type="file"]') as HTMLInputElement;
        expect(fileInput).toBeTruthy();
        expect(fileInput.accept).toContain(".json");
    });
    it("calls exportData when Export Data is clicked", function (): void {
        let result = renderButtons();
        let button = result.getByRole("button", {"name": "Export Data"});
        fireEvent.click(button);
        expect(mocks.mockExportData).toHaveBeenCalled();
    });
    it("opens file picker when Import Data is clicked", function (): void {
        let result = renderButtons();
        let importButton = result.getByRole("button", {"name": "Import Data"});
        let fileInput = result.container.querySelector('input[type="file"]') as HTMLInputElement;
        let clickSpy = vi.spyOn(fileInput, "click");
        fireEvent.click(importButton);
        expect(clickSpy).toHaveBeenCalled();
    });
    it("displays success message when status is set", function (): void {
        mocks.mockStatus.mockReturnValue("Data imported successfully");
        let result = renderButtons();
        expect(result.getByText("Data imported successfully")).toBeTruthy();
        expect(result.getByRole("status")).toBeTruthy();
    });
    it("displays error message when error is set", function (): void {
        mocks.mockError.mockReturnValue("Import failed: Invalid JSON");
        let result = renderButtons();
        expect(result.getByText("Import failed: Invalid JSON")).toBeTruthy();
        expect(result.getByRole("alert")).toBeTruthy();
    });
    it("does not display status when empty", function (): void {
        mocks.mockStatus.mockReturnValue("");
        let result = renderButtons();
        expect(result.queryByRole("status")).toBeNull();
    });
    it("does not display error when empty", function (): void {
        mocks.mockError.mockReturnValue("");
        let result = renderButtons();
        expect(result.queryByRole("alert")).toBeNull();
    });
    it("calls importData with file text when a file is selected", async function (): Promise<void> {
        mocks.mockImportData.mockReturnValue(undefined);
        let result = renderButtons();
        let fileInput = result.container.querySelector('input[type="file"]') as HTMLInputElement;
        let file = new File(["{\"version\":1}"], "backup.chemutil", {"type": "application/json"});
        Object.defineProperty(fileInput, "files", {
            "value": [file],
            "configurable": true,
            "writable": false
        });
        fireEvent.change(fileInput);
        await vi.waitFor(function (): void {
            expect(mocks.mockImportData).toHaveBeenCalledWith("{\"version\":1}");
        });
    });
    it("does not call importData when no file is selected", function (): void {
        let result = renderButtons();
        let fileInput = result.container.querySelector('input[type="file"]') as HTMLInputElement;
        Object.defineProperty(fileInput, "files", {
            "value": [],
            "configurable": true,
            "writable": false
        });
        fireEvent.change(fileInput);
        expect(mocks.mockImportData).not.toHaveBeenCalled();
    });
    it("does not call importData when files is null", function (): void {
        let result = renderButtons();
        let fileInput = result.container.querySelector('input[type="file"]') as HTMLInputElement;
        Object.defineProperty(fileInput, "files", {
            "value": null,
            "configurable": true,
            "writable": false
        });
        fireEvent.change(fileInput);
        expect(mocks.mockImportData).not.toHaveBeenCalled();
    });
    it("logs an error when the file cannot be read", async function (): Promise<void> {
        let errSpy = vi.spyOn(window.console, "error").mockImplementation(function (): void { return; });
        let result = renderButtons();
        let fileInput = result.container.querySelector('input[type="file"]') as HTMLInputElement;
        let file = new File(["{}"], "backup.chemutil", {"type": "application/json"});
        vi.spyOn(file, "text").mockImplementation(function (): Promise<string> {
            return Promise.reject(new Error("read fail"));
        });
        Object.defineProperty(fileInput, "files", {
            "value": [file],
            "configurable": true,
            "writable": false
        });
        fireEvent.change(fileInput);
        await vi.waitFor(function (): void {
            expect(errSpy).toHaveBeenCalledWith("Failed to read import file: read fail");
        });
    });
    it("logs Unknown error when the rejection is not an Error", async function (): Promise<void> {
        let errSpy = vi.spyOn(window.console, "error").mockImplementation(function (): void { return; });
        let result = renderButtons();
        let fileInput = result.container.querySelector('input[type="file"]') as HTMLInputElement;
        let file = new File(["{}"], "backup.chemutil", {"type": "application/json"});
        vi.spyOn(file, "text").mockImplementation(function (): Promise<string> {
            return Promise.reject("boom");
        });
        Object.defineProperty(fileInput, "files", {
            "value": [file],
            "configurable": true,
            "writable": false
        });
        fireEvent.change(fileInput);
        await vi.waitFor(function (): void {
            expect(errSpy).toHaveBeenCalledWith("Failed to read import file: Unknown error");
        });
    });
});
