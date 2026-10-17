import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {parseCsv, toCsv, processCsvText, downloadResults} from "./batchCalculator.js";
import {resetEngine} from "./engine.js";

describe("batchCalculator", function (): void {
    afterEach(function (): void {
        resetEngine();
        vi.restoreAllMocks();
    });

    describe("parseCsv", function (): void {
        it("parses simple comma-separated rows", function (): void {
            expect(parseCsv("M1,V1\n1,2\n3,4")).toEqual([["M1", "V1"], ["1", "2"], ["3", "4"]]);
        });

        it("keeps commas inside quoted fields", function (): void {
            expect(parseCsv("name,note\n\"Water, H2O\",wet\n")).toEqual([["name", "note"], ["Water, H2O", "wet"]]);
        });

        it("unescapes doubled quotes inside quoted fields", function (): void {
            expect(parseCsv("label\n\"She said \"\"hi\"\"\"\n")).toEqual([["label"], ["She said \"hi\""]]);
        });

        it("handles CRLF line endings", function (): void {
            expect(parseCsv("a,b\r\n1,2\r\n3,4\r\n")).toEqual([["a", "b"], ["1", "2"], ["3", "4"]]);
        });

        it("returns an empty array for empty input", function (): void {
            expect(parseCsv("")).toEqual([]);
        });

        it("emits a trailing partial row without a newline", function (): void {
            expect(parseCsv("formula\nH2O")).toEqual([["formula"], ["H2O"]]);
        });

        it("preserves empty fields", function (): void {
            expect(parseCsv("a,b,c\n1,,3")).toEqual([["a", "b", "c"], ["1", "", "3"]]);
        });
    });

    describe("toCsv", function (): void {
        it("joins rows with commas and lines with newlines", function (): void {
            expect(toCsv([["a", "b"], ["1", "2"]])).toBe("a,b\n1,2");
        });

        it("quotes fields containing commas", function (): void {
            expect(toCsv([["name", "note"], ["Water, H2O", "wet"]])).toBe("name,note\n\"Water, H2O\",wet");
        });

        it("doubles embedded quotes and wraps the field", function (): void {
            expect(toCsv([["label"], ["She said \"hi\""]])).toBe("label\n\"She said \"\"hi\"\"\"");
        });

        it("quotes fields containing newlines", function (): void {
            expect(toCsv([["note"], ["line1\nline2"]])).toBe("note\n\"line1\nline2\"");
        });

        it("returns an empty string for no rows", function (): void {
            expect(toCsv([])).toBe("");
        });

        it("never double-quotes a field that does not need it", function (): void {
            expect(toCsv([["a b"]])).toBe("a b");
        });

        it("serialises null and undefined fields as empty strings", function (): void {
            expect(toCsv([[null as unknown as string], [undefined as unknown as string]])).toBe("\n");
        });
    });

    describe("processCsvText", function (): void {
        it("runs the calculator for each row and appends value and status", async function (): Promise<void> {
            let result = await processCsvText("formula\nH2O\nNaCl\n", "molar-mass");
            expect(result.totalRows).toBe(2);
            expect(result.successCount).toBe(2);
            expect(result.errorCount).toBe(0);
            let rows = parseCsv(result.csvString);
            expect(rows[0]).toEqual(["formula", "value", "status"]);
            expect(rows[1][0]).toBe("H2O");
            expect(rows[1][1]).toMatch(/18\.0/);
            expect(rows[1][2]).toBe("ok");
        });

        it("reports progress per row when a callback is supplied", async function (): Promise<void> {
            let seen: number[] = [];
            await processCsvText("formula\nH2O\nNaCl\nKCl\n", "molar-mass", function (info): void {
                seen.push(info.current);
            });
            expect(seen).toEqual([1, 2, 3]);
        });

        it("records the error explanation in the status column", async function (): Promise<void> {
            let result = await processCsvText("formula\nBAD\nNaCl\n", "molar-mass");
            expect(result.totalRows).toBe(2);
            expect(result.successCount).toBe(1);
            expect(result.errorCount).toBe(1);
            let rows = parseCsv(result.csvString);
            expect(rows[1][2]).toMatch(/^Error/);
        });

        it("marks a row for an unknown calculator as an error", async function (): Promise<void> {
            let result = await processCsvText("formula\nH2O\n", "not-a-calculator");
            expect(result.errorCount).toBe(1);
            expect(result.successCount).toBe(0);
        });

        it("pads ragged rows to the header width", async function (): Promise<void> {
            let result = await processCsvText("dilution-solve-for,dilution-M1,dilution-V1,dilution-M2\nV2,6,1,3\nV2,6,1\n", "dilution");
            let rows = parseCsv(result.csvString);
            expect(rows[1].length).toBe(6);
            expect(rows[2].length).toBe(6);
            expect(rows[1][4]).not.toBe("");
            expect(rows[2][5]).toMatch(/^Error/);
        });

        it("throws when the CSV is empty", async function (): Promise<void> {
            await expect(processCsvText("", "molar-mass")).rejects.toThrow("CSV file is empty");
        });

        it("throws when a header cell is blank", async function (): Promise<void> {
            await expect(processCsvText("formula,\nH2O\n", "molar-mass")).rejects.toThrow("CSV header row must name");
        });

        it("captures a thrown engine error as the row status", async function (): Promise<void> {
            let client = await import("./engine.js");
            vi.spyOn(client, "getEngine").mockReturnValue({
                calculate: function (): Promise<{value: string}> {
                    return Promise.reject(new Error("engine exploded"));
                },
                listCalculators: function (): Promise<string[]> {
                    return Promise.resolve([]);
                },
                batchCalculate: function (): Promise<never[]> {
                    return Promise.resolve([]);
                }
            });
            let result = await processCsvText("formula\nH2O\n", "molar-mass");
            expect(result.errorCount).toBe(1);
            let rows = parseCsv(result.csvString);
            expect(rows[1][2]).toBe("engine exploded");
        });

        it("stringifies a non-Error engine rejection as the row status", async function (): Promise<void> {
            let client = await import("./engine.js");
            vi.spyOn(client, "getEngine").mockReturnValue({
                calculate: function (): Promise<{value: string}> {
                    return Promise.reject("plain failure");
                },
                listCalculators: function (): Promise<string[]> {
                    return Promise.resolve([]);
                },
                batchCalculate: function (): Promise<never[]> {
                    return Promise.resolve([]);
                }
            });
            let result = await processCsvText("formula\nH2O\n", "molar-mass");
            let rows = parseCsv(result.csvString);
            expect(rows[1][2]).toBe("plain failure");
        });

        it("treats a result with an empty value and no explanation as an error", async function (): Promise<void> {
            let client = await import("./engine.js");
            vi.spyOn(client, "getEngine").mockReturnValue({
                calculate: function (): Promise<{value: string; explanation?: string}> {
                    return Promise.resolve({value: ""});
                },
                listCalculators: function (): Promise<string[]> {
                    return Promise.resolve([]);
                },
                batchCalculate: function (): Promise<never[]> {
                    return Promise.resolve([]);
                }
            });
            let result = await processCsvText("formula\nH2O\n", "molar-mass");
            let rows = parseCsv(result.csvString);
            expect(rows[1][2]).toBe("Calculation failed");
        });
    });

    describe("downloadResults", function (): void {
        let clicked: HTMLAnchorElement[] = [];
        let realClick: () => void;
        beforeEach(function (): void {
            clicked = [];
            realClick = HTMLAnchorElement.prototype.click;
            HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement): void {
                clicked.push(this);
            };
        });
        afterEach(function (): void {
            HTMLAnchorElement.prototype.click = realClick;
        });

        it("triggers a download and removes the temporary anchor", function (): void {
            downloadResults("a,b\n1,2", "out.csv");
            expect(clicked.length).toBe(1);
            expect(clicked[0].download).toBe("out.csv");
            expect(document.querySelector("a")).toBeNull();
        });
    });
});
