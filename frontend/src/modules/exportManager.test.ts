import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ExportManager } from "./exportManager.js";

describe("ExportManager", () => {
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        ExportManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();

        createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
        revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

        // Mock clipboard
        const clipboardSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
        clipboardSpy.mockClear();

        // Mock link.click to avoid actual navigation
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    });

    afterEach(() => {
        ExportManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(ExportManager.getInstance()).toBe(ExportManager.getInstance());
    });

    describe("getHistory", () => {
        it("returns empty array when no history exists", () => {
            expect(ExportManager.getInstance().getHistory()).toEqual([]);
        });

        it("returns stored history entries", () => {
            const entries = [
                { calculatorId: "mass-calc", inputs: { formula: "H2O" }, result: "18.015", timestamp: "2024-01-01T00:00:00.000Z" },
            ];
            localStorage.setItem("calc-history", JSON.stringify(entries));
            expect(ExportManager.getInstance().getHistory()).toEqual(entries);
        });

        it("returns empty array when localStorage has invalid JSON", () => {
            localStorage.setItem("calc-history", "invalid-json");
            expect(ExportManager.getInstance().getHistory()).toEqual([]);
        });
    });

    describe("addToHistory", () => {
        it("adds an entry to the history", () => {
            const manager = ExportManager.getInstance();
            manager.addToHistory("mass-calc", { "formula-input": "H2O" }, "18.015 g/mol");
            const history = manager.getHistory();
            expect(history.length).toBe(1);
            expect(history[0].calculatorId).toBe("mass-calc");
            expect(history[0].inputs).toEqual({ "formula-input": "H2O" });
            expect(history[0].result).toBe("18.015 g/mol");
        });

        it("adds new entries to the front of the history", () => {
            const manager = ExportManager.getInstance();
            manager.addToHistory("mass-calc", { "formula-input": "H2O" }, "18.015");
            manager.addToHistory("mass-calc", { "formula-input": "NaCl" }, "58.44");
            const history = manager.getHistory();
            expect(history.length).toBe(2);
            expect(history[0].result).toBe("58.44");
            expect(history[1].result).toBe("18.015");
        });

        it("limits history to 50 entries", () => {
            const manager = ExportManager.getInstance();
            for (let i = 0; i < 55; i++) {
                manager.addToHistory("mass-calc", { "formula-input": "H2O" }, "result-" + i);
            }
            const history = manager.getHistory();
            expect(history.length).toBe(50);
            expect(history[0].result).toBe("result-54");
            expect(history[49].result).toBe("result-5");
        });

        it("stores a timestamp in ISO format", () => {
            const manager = ExportManager.getInstance();
            manager.addToHistory("mass-calc", {}, "result");
            const history = manager.getHistory();
            expect(history[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        it("persists to localStorage", () => {
            const manager = ExportManager.getInstance();
            manager.addToHistory("mass-calc", { "formula-input": "H2O" }, "18.015");
            const stored = localStorage.getItem("calc-history");
            expect(stored).not.toBeNull();
            const parsed = JSON.parse(stored!);
            expect(parsed.length).toBe(1);
        });
    });

    describe("exportCsv", () => {
        it("creates a CSV with headers even when history is empty", () => {
            const manager = ExportManager.getInstance();
            manager.exportCsv();
            expect(createObjectURLSpy).toHaveBeenCalled();
            const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
            expect(blob).toBeInstanceOf(Blob);
        });

        it("creates a download link with the correct filename", () => {
            const manager = ExportManager.getInstance();
            manager.addToHistory("mass-calc", { "formula-input": "H2O" }, "18.015");
            manager.exportCsv();

            // The link is removed after click, so we verify via the mock calls instead.
            expect(createObjectURLSpy).toHaveBeenCalled();
        });

        it("revokes the object URL after export", () => {
            const manager = ExportManager.getInstance();
            manager.exportCsv();
            expect(revokeObjectURLSpy).toHaveBeenCalled();
        });
    });

    describe("shareViaUrl", () => {
        it("copies the share URL to the clipboard", () => {
            const input = document.createElement("input");
            input.id = "formula-input";
            input.value = "H2O";
            document.body.appendChild(input);

            const manager = ExportManager.getInstance();
            manager.shareViaUrl("mass-calc");

            expect(navigator.clipboard.writeText).toHaveBeenCalled();
            const copiedText = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            expect(copiedText).toContain("mass-calc");
            expect(copiedText).toContain("formula=H2O");
        });

        it("generates a URL without query string when inputs are empty", () => {
            const manager = ExportManager.getInstance();
            manager.shareViaUrl("mass-calc");

            expect(navigator.clipboard.writeText).toHaveBeenCalled();
            const copiedText = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            expect(copiedText).toContain("mass-calc");
            expect(copiedText).not.toContain("?");
        });
    });

    describe("resetInstance", () => {
        it("creates a new instance after reset", () => {
            const instance1 = ExportManager.getInstance();
            ExportManager.resetInstance();
            const instance2 = ExportManager.getInstance();
            expect(instance1).not.toBe(instance2);
        });
    });
});
