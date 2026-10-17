import {describe, it, expect} from "vitest";
import {buildLabEntryHtml, buildLabReportHtml, formatReportTimestamp} from "./labReport.js";
import type {HistoryEntry} from "./exportManager.js";
function makeEntry(overrides?: Partial<HistoryEntry>): HistoryEntry {
    let base: HistoryEntry = {
        "calculatorId": "dilution",
        "inputs": {"dilution-M1": "6", "dilution-V1": "1"},
        "result": "2.0000 L",
        "timestamp": "2026-07-20T10:30:00.000Z"
    };
    let keys = Object.keys(overrides ?? {});
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i] as keyof HistoryEntry;
        let value = (overrides as Partial<HistoryEntry>)[key];
        if (value !== undefined) {
            (base[key] as string) = value as string;
        }
    }
    return base;
}
describe("labReport", function (): void {
    describe("formatReportTimestamp", function (): void {
        it("formats a valid ISO timestamp as a local date-time", function (): void {
            expect(formatReportTimestamp(new Date(2026, 6, 20, 9, 5).toISOString())).toBe("2026-07-20 09:05");
        });
        it("pads single digit hours and minutes", function (): void {
            expect(formatReportTimestamp(new Date(2026, 0, 2, 3, 7).toISOString())).toBe("2026-01-02 03:07");
        });
        it("returns the input unchanged for an invalid date", function (): void {
            expect(formatReportTimestamp("not-a-date")).toBe("not-a-date");
        });
    });
    describe("buildLabEntryHtml", function (): void {
        it("renders the formula as the section heading when one is present", function (): void {
            let html = buildLabEntryHtml(makeEntry({"calculatorId": "molar-mass", "inputs": {"formula-input": "H2O"}}), 1);
            expect(html).toContain("<h2>H2O</h2>");
        });
        it("falls back to the calculator id and position", function (): void {
            let html = buildLabEntryHtml(makeEntry({}), 3);
            expect(html).toContain("<h2>dilution (3)</h2>");
        });
        it("renders every input as a definition pair", function (): void {
            let html = buildLabEntryHtml(makeEntry({}), 1);
            expect(html).toContain("<dt>dilution-M1</dt><dd>6</dd>");
            expect(html).toContain("<dt>dilution-V1</dt><dd>1</dd>");
        });
        it("renders the worked steps when an explanation exists", function (): void {
            let html = buildLabEntryHtml(makeEntry({"explanation": "V2 = M1V1/M2"}), 1);
            expect(html).toContain("lab-steps");
            expect(html).toContain("V2 = M1V1/M2");
        });
        it("omits the worked steps without an explanation", function (): void {
            expect(buildLabEntryHtml(makeEntry({}), 1)).not.toContain("lab-steps");
        });
        it("renders the result and a readable timestamp", function (): void {
            let html = buildLabEntryHtml(makeEntry({"timestamp": new Date(2026, 6, 20, 10, 30).toISOString()}), 1);
            expect(html).toContain("Result: 2.0000 L");
            expect(html).toContain("2026-07-20 10:30");
        });
        it("escapes markup in every interpolated value", function (): void {
            let html = buildLabEntryHtml(makeEntry({
                "calculatorId": "x",
                "inputs": {"formula": "<img src=x onerror=alert(1)>"},
                "result": "</p><script>alert(2)</script>",
                "explanation": "\"quoted\" & 'apostrophe'"
            }), 1);
            expect(html).not.toContain("<img");
            expect(html).not.toContain("<script>");
            expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
            expect(html).toContain("&amp;");
            expect(html).toContain("&quot;quoted&quot;");
        });
    });
    describe("buildLabReportHtml", function (): void {
        it("renders one section per entry with its stylesheet", function (): void {
            let html = buildLabReportHtml([makeEntry({}), makeEntry({})]);
            expect(html.match(/class="lab-entry"/g)?.length).toBe(2);
            expect(html).toContain("<style>");
            expect(html).toContain("page-break-inside:avoid");
        });
        it("renders an empty state with no entries", function (): void {
            let html = buildLabReportHtml([]);
            expect(html).toContain("No calculations recorded.");
            expect(html).not.toContain("class=\"lab-entry\"");
        });
    });
});
