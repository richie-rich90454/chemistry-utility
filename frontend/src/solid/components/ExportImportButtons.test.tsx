import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
const mocks = vi.hoisted(function () {
    return {
        "mockStatus": vi.fn(),
        "mockError": vi.fn(),
        "mockExportData": vi.fn(),
        "mockImportData": vi.fn(),
        "mockImportArchive": vi.fn()
    };
});
vi.mock("../stores/dataPortability", function () {
    return {
        "useDataPortability": function (): {
            "status": () => string;
            "error": () => string;
            "exportData": () => Promise<void>;
            "importData": (jsonString: string) => void;
            "importArchive": () => Promise<void>;
        } {
            return {
                "status": mocks.mockStatus,
                "error": mocks.mockError,
                "exportData": mocks.mockExportData,
                "importData": mocks.mockImportData,
                "importArchive": mocks.mockImportArchive
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
        mocks.mockImportArchive.mockReset();
        mocks.mockStatus.mockReturnValue("");
        mocks.mockError.mockReturnValue("");
        mocks.mockExportData.mockResolvedValue(undefined);
        mocks.mockImportArchive.mockResolvedValue(undefined);
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
    it("calls exportData when Export Data is clicked", function (): void {
        let result = renderButtons();
        let button = result.getByRole("button", {"name": "Export Data"});
        fireEvent.click(button);
        expect(mocks.mockExportData).toHaveBeenCalled();
    });
    it("calls importArchive when Import Data is clicked", function (): void {
        let result = renderButtons();
        let importButton = result.getByRole("button", {"name": "Import Data"});
        fireEvent.click(importButton);
        expect(mocks.mockImportArchive).toHaveBeenCalled();
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
});
