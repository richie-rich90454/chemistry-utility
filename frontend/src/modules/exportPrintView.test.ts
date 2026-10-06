import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    buildHistoryPrintHtml,
    ensurePrintStyles,
    escapePrintHtml,
    openHistoryPrintView
} from "./exportPrintView.js";
import type { HistoryEntry } from "./exportManager.js";

function makeEntry(overrides?: Partial<HistoryEntry>): HistoryEntry {
    return {
        calculatorId: "mass-calc",
        inputs: { formula: "H2O" },
        result: "18.015 g/mol",
        timestamp: "2024-01-01T00:00:00.000Z",
        ...overrides
    };
}

describe("exportPrintView", () => {
    beforeEach(() => {
        document.head.innerHTML = "";
        document.body.innerHTML = "";
    });

    afterEach(() => {
        document.head.innerHTML = "";
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    describe("escapePrintHtml", () => {
        it("escapes markup-significant characters", () => {
            expect(escapePrintHtml("<b>&\"'</b>")).toBe("&lt;b&gt;&amp;&quot;&#39;&lt;/b&gt;");
        });

        it("leaves plain text untouched", () => {
            expect(escapePrintHtml("H2O 18.015")).toBe("H2O 18.015");
        });
    });

    describe("buildHistoryPrintHtml", () => {
        it("embeds history entries in a printable document", () => {
            const html = buildHistoryPrintHtml([makeEntry()]);
            expect(html).toContain("<!DOCTYPE html>");
            expect(html).toContain("mass-calc");
            expect(html).toContain("H2O");
            expect(html).toContain("18.015 g/mol");
            expect(html).toContain("2024-01-01T00:00:00.000Z");
            expect(html).toContain("@media print");
        });

        it("shows an empty-state row when history is empty", () => {
            const html = buildHistoryPrintHtml([]);
            expect(html).toContain("No calculations recorded.");
        });

        it("escapes entry content to prevent markup injection", () => {
            const html = buildHistoryPrintHtml([makeEntry({ result: "<script>alert(1)</script>" })]);
            expect(html).not.toContain("<script>alert(1)</script>");
            expect(html).toContain("&lt;script&gt;");
        });

        it("uses a custom title when provided", () => {
            const html = buildHistoryPrintHtml([], "Custom Title");
            expect(html).toContain("Custom Title");
        });
    });

    describe("ensurePrintStyles", () => {
        it("injects the print stylesheet once", () => {
            ensurePrintStyles();
            ensurePrintStyles();
            const styles = document.querySelectorAll("#export-print-styles");
            expect(styles.length).toBe(1);
            expect(styles[0].textContent).toContain("@media print");
        });
    });

    describe("openHistoryPrintView", () => {
        it("writes the print document into a new window", () => {
            const write = vi.fn();
            const close = vi.fn();
            const focus = vi.fn();
            const popup = { document: { write, close }, focus };
            vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
            const result = openHistoryPrintView([makeEntry()]);
            expect(result).toBe(popup);
            expect(write).toHaveBeenCalledTimes(1);
            expect(String(write.mock.calls[0][0])).toContain("mass-calc");
            expect(close).toHaveBeenCalled();
            expect(focus).toHaveBeenCalled();
        });

        it("returns null when the popup is blocked", () => {
            vi.spyOn(window, "open").mockReturnValue(null);
            expect(openHistoryPrintView([makeEntry()])).toBeNull();
        });

        it("returns null when window.open is unavailable", () => {
            const originalOpen: typeof window.open = window.open;
            Object.defineProperty(window, "open", { value: undefined, writable: true, configurable: true });
            try {
                expect(openHistoryPrintView([makeEntry()])).toBeNull();
            } finally {
                Object.defineProperty(window, "open", { value: originalOpen, writable: true, configurable: true });
            }
        });

        it("returns null when window.open throws", () => {
            vi.spyOn(window, "open").mockImplementation(() => {
                throw new Error("denied");
            });
            expect(openHistoryPrintView([makeEntry()])).toBeNull();
        });

        it("returns null when writing to the popup fails", () => {
            const popup = {
                document: {
                    write: () => {
                        throw new Error("closed");
                    },
                    close: vi.fn(),
                },
                focus: vi.fn(),
            };
            vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
            expect(openHistoryPrintView([makeEntry()])).toBeNull();
        });
    });
});
