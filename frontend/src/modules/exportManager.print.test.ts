import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ExportManager } from "./exportManager.js";

describe("ExportManager print/PDF export", () => {
    beforeEach(() => {
        ExportManager.resetInstance();
        document.head.innerHTML = "";
        document.body.innerHTML = "";
        localStorage.clear();
    });

    afterEach(() => {
        ExportManager.resetInstance();
        document.head.innerHTML = "";
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("buildPrintDocument renders history entries as a printable document", () => {
        const manager = ExportManager.getInstance();
        manager.addToHistory("mass-calc", { "formula-input": "H2O" }, "18.015 g/mol");
        const html = manager.buildPrintDocument();
        expect(html).toContain("<!DOCTYPE html>");
        expect(html).toContain("mass-calc");
        expect(html).toContain("18.015 g/mol");
        expect(html).toContain("@media print");
    });

    it("buildPrintDocument shows an empty state with no history", () => {
        const html = ExportManager.getInstance().buildPrintDocument();
        expect(html).toContain("No calculations recorded.");
    });

    it("exportPdf prints the dedicated print view when popups are allowed", () => {
        const manager = ExportManager.getInstance();
        manager.addToHistory("mass-calc", { "formula-input": "H2O" }, "18.015 g/mol");
        const popupPrint = vi.fn();
        const popup = {
            document: { write: vi.fn(), close: vi.fn() },
            focus: vi.fn(),
            print: popupPrint
        };
        vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
        manager.exportPdf();
        expect(popupPrint).toHaveBeenCalledTimes(1);
        expect(document.getElementById("export-print-styles")).not.toBeNull();
    });

    it("exportPdf falls back to window.print when the popup is blocked", () => {
        const manager = ExportManager.getInstance();
        vi.spyOn(window, "open").mockReturnValue(null);
        const printSpy = vi.fn();
        Object.defineProperty(window, "print", { value: printSpy, writable: true, configurable: true });
        manager.exportPdf();
        expect(printSpy).toHaveBeenCalledTimes(1);
    });

    it("exportPdf falls back to window.print when the popup has no print function", () => {
        const manager = ExportManager.getInstance();
        const popup = {
            document: { write: vi.fn(), close: vi.fn() },
            focus: vi.fn()
        };
        vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
        const printSpy = vi.fn();
        Object.defineProperty(window, "print", { value: printSpy, writable: true, configurable: true });
        manager.exportPdf();
        expect(printSpy).toHaveBeenCalledTimes(1);
    });
});
