import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockPost = vi.fn();

vi.mock("./apiClient.js", function () {
    return {
        ApiClient: {
            getInstance: function () {
                return {
                    post: mockPost
                };
            }
        },
        ApiError: function (this: { status: number; type: string; detail: string; name: string; message: string }, status: number, type: string, detail: string) {
            this.status = status;
            this.type = type;
            this.detail = detail;
            this.name = "ApiError";
            this.message = detail;
        }
    };
});

import { BatchCalculator } from "./batchCalculator.js";

function makeFile(contents: string, name: string): File {
    return new File([contents], name, { "type": "text/csv" });
}

describe("BatchCalculator", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        BatchCalculator.resetInstance();
        mockPost.mockReset();
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        BatchCalculator.resetInstance();
        vi.restoreAllMocks();
    });

    describe("getInstance", function () {
        it("should return same instance on subsequent calls", function () {
            let a: BatchCalculator = BatchCalculator.getInstance();
            let b: BatchCalculator = BatchCalculator.getInstance();
            expect(a).toBe(b);
        });

        it("should return new instance after resetInstance", function () {
            let a: BatchCalculator = BatchCalculator.getInstance();
            BatchCalculator.resetInstance();
            let b: BatchCalculator = BatchCalculator.getInstance();
            expect(a).not.toBe(b);
        });
    });

    describe("getAllowedCalculators", function () {
        it("should return a list that includes molar-mass", function () {
            let list: string[] = BatchCalculator.getAllowedCalculators();
            expect(list.indexOf("molar-mass")).not.toBe(-1);
        });

        it("should return a list that includes dilution", function () {
            let list: string[] = BatchCalculator.getAllowedCalculators();
            expect(list.indexOf("dilution")).not.toBe(-1);
        });

        it("should return a fresh array each call (not the internal one)", function () {
            let a: string[] = BatchCalculator.getAllowedCalculators();
            let b: string[] = BatchCalculator.getAllowedCalculators();
            expect(a).not.toBe(b);
        });
    });

    describe("parseCsv", function () {
        it("should parse a basic CSV with header and rows", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let rows: string[][] = calc.parseCsv("formula\nH2O\nNaCl\n");
            expect(rows.length).toBe(3);
            expect(rows[0]).toEqual(["formula"]);
            expect(rows[1]).toEqual(["H2O"]);
            expect(rows[2]).toEqual(["NaCl"]);
        });

        it("should parse multiple columns separated by commas", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let rows: string[][] = calc.parseCsv("M1,V1\n1,2\n3,4");
            expect(rows[0]).toEqual(["M1", "V1"]);
            expect(rows[1]).toEqual(["1", "2"]);
            expect(rows[2]).toEqual(["3", "4"]);
        });

        it("should parse quoted fields containing commas", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let rows: string[][] = calc.parseCsv("name,note\n\"Water, H2O\",wet\n");
            expect(rows[1]).toEqual(["Water, H2O", "wet"]);
        });

        it("should parse quoted fields containing escaped quotes", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let rows: string[][] = calc.parseCsv("label\n\"She said \"\"hi\"\"\"\n");
            expect(rows[1]).toEqual(["She said \"hi\""]);
        });

        it("should handle CRLF line endings", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let rows: string[][] = calc.parseCsv("a,b\r\n1,2\r\n3,4\r\n");
            expect(rows.length).toBe(3);
            expect(rows[1]).toEqual(["1", "2"]);
            expect(rows[2]).toEqual(["3", "4"]);
        });

        it("should return empty array for empty input", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let rows: string[][] = calc.parseCsv("");
            expect(rows.length).toBe(0);
        });

        it("should handle a single trailing line without newline", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let rows: string[][] = calc.parseCsv("formula\nH2O");
            expect(rows.length).toBe(2);
            expect(rows[1]).toEqual(["H2O"]);
        });

        it("should keep empty fields between commas", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let rows: string[][] = calc.parseCsv("a,b,c\n1,,3");
            expect(rows[1]).toEqual(["1", "", "3"]);
        });
    });

    describe("toCsv", function () {
        it("should join rows with newlines and fields with commas", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let csv: string = calc.toCsv([["a", "b"], ["1", "2"]]);
            expect(csv).toBe("a,b\n1,2");
        });

        it("should quote fields containing commas", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let csv: string = calc.toCsv([["name", "note"], ["Water, H2O", "wet"]]);
            expect(csv).toBe("name,note\n\"Water, H2O\",wet");
        });

        it("should quote fields containing quotes and double the inner quotes", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let csv: string = calc.toCsv([["label"], ["She said \"hi\""]]);
            expect(csv).toBe("label\n\"She said \"\"hi\"\"\"");
        });

        it("should quote fields containing newlines", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let csv: string = calc.toCsv([["note"], ["line1\nline2"]]);
            expect(csv).toBe("note\n\"line1\nline2\"");
        });

        it("should produce empty string for empty rows", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let csv: string = calc.toCsv([]);
            expect(csv).toBe("");
        });
    });

    describe("validateCsv", function () {
        it("should accept valid molar-mass headers", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(calc.validateCsv(["formula"], "molar-mass")).toBe(true);
        });

        it("should reject molar-mass headers without formula", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(calc.validateCsv(["name"], "molar-mass")).toBe(false);
        });

        it("should reject empty header array", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(calc.validateCsv([], "molar-mass")).toBe(false);
        });

        it("should reject headers containing empty strings", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(calc.validateCsv(["formula", ""], "molar-mass")).toBe(false);
        });

        it("should reject headers containing only whitespace", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(calc.validateCsv(["formula", "   "], "molar-mass")).toBe(false);
        });

        it("should accept dilution headers when at least one required column is present", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(calc.validateCsv(["M1", "V1"], "dilution")).toBe(true);
        });

        it("should reject dilution headers when none of the required columns are present", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(calc.validateCsv(["foo", "bar"], "dilution")).toBe(false);
        });

        it("should accept any non-empty headers for calculator without required columns", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(calc.validateCsv(["entropy", "enthalpy"], "entropy")).toBe(true);
        });

        it("should accept bond-type headers when both element columns are present", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(calc.validateCsv(["element1", "element2"], "bond-type")).toBe(true);
        });

        it("should reject bond-type headers when only one element column is present", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(calc.validateCsv(["element1"], "bond-type")).toBe(false);
        });
    });

    describe("isAuthorized", function () {
        it("should always return true for local users", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(calc.isAuthorized()).toBe(true);
        });
    });

    describe("getResultFields", function () {
        it("should return molar_mass and unit for molar-mass calculator", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let fields: { key: string; label: string }[] = calc.getResultFields("molar-mass");
            expect(fields.length).toBe(2);
            expect(fields[0].key).toBe("Value");
            expect(fields[0].label).toBe("molar_mass");
            expect(fields[1].key).toBe("Unit");
            expect(fields[1].label).toBe("unit");
        });

        it("should return value and unit for non-molar-mass calculators", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let fields: { key: string; label: string }[] = calc.getResultFields("dilution");
            expect(fields.length).toBe(2);
            expect(fields[0].label).toBe("value");
            expect(fields[1].label).toBe("unit");
        });
    });

    describe("processFile", function () {
        it("should process a molar-mass CSV and produce results CSV", async function () {
            mockPost.mockResolvedValue({ "Value": 18.015, "Unit": "g/mol" });
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let file: File = makeFile("formula\nH2O\nNaCl\n", "input.csv");
            let result: { csvString: string; totalRows: number; successCount: number; errorCount: number } = await calc.processFile(file, "molar-mass");
            expect(result.totalRows).toBe(2);
            expect(result.successCount).toBe(2);
            expect(result.errorCount).toBe(0);
            let lines: string[] = result.csvString.split("\n");
            expect(lines[0]).toBe("formula,molar_mass,unit,status");
            expect(lines[1]).toBe("H2O,18.015,g/mol,ok");
            expect(lines[2]).toBe("NaCl,18.015,g/mol,ok");
            expect(mockPost).toHaveBeenCalledTimes(2);
            expect(mockPost.mock.calls[0][0]).toBe("/api/v1/calculators/molar-mass");
        });

        it("should send request body with formula as string", async function () {
            mockPost.mockResolvedValue({ "Value": 18.015, "Unit": "g/mol" });
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let file: File = makeFile("formula\nH2O\n", "input.csv");
            await calc.processFile(file, "molar-mass");
            let body: Record<string, unknown> = mockPost.mock.calls[0][1] as Record<string, unknown>;
            expect(body["formula"]).toBe("H2O");
        });

        it("should coerce numeric cells to numbers in the request body", async function () {
            mockPost.mockResolvedValue({ "Value": 1, "Unit": "M" });
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let file: File = makeFile("M1,V1\n1.5,2\n", "input.csv");
            await calc.processFile(file, "dilution");
            let body: Record<string, unknown> = mockPost.mock.calls[0][1] as Record<string, unknown>;
            expect(body["M1"]).toBe(1.5);
            expect(typeof body["M1"]).toBe("number");
            expect(body["V1"]).toBe(2);
            expect(typeof body["V1"]).toBe("number");
        });

        it("should count errors when API rejects a row", async function () {
            mockPost.mockRejectedValueOnce(new Error("invalid formula"));
            mockPost.mockResolvedValueOnce({ "Value": 58.44, "Unit": "g/mol" });
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let file: File = makeFile("formula\nBAD\nNaCl\n", "input.csv");
            let result: { csvString: string; totalRows: number; successCount: number; errorCount: number } = await calc.processFile(file, "molar-mass");
            expect(result.successCount).toBe(1);
            expect(result.errorCount).toBe(1);
            let lines: string[] = result.csvString.split("\n");
            expect(lines[1]).toBe("BAD,,,invalid formula");
            expect(lines[2]).toBe("NaCl,58.44,g/mol,ok");
        });

        it("should throw on empty CSV file", async function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let file: File = makeFile("", "empty.csv");
            try {
                await calc.processFile(file, "molar-mass");
                expect.fail("Should have thrown on empty CSV");
            } catch (e) {
                expect((e as Error).message).toBe("CSV file is empty");
            }
        });

        it("should throw on invalid headers for molar-mass", async function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let file: File = makeFile("name\nH2O\n", "wrong.csv");
            try {
                await calc.processFile(file, "molar-mass");
                expect.fail("Should have thrown on invalid headers");
            } catch (e) {
                expect((e as Error).message).toContain("CSV headers are invalid");
            }
            expect(mockPost).not.toHaveBeenCalled();
        });

        it("should invoke progress callback for each row", async function () {
            mockPost.mockResolvedValue({ "Value": 1, "Unit": "g/mol" });
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let progress: { current: number; total: number }[] = [];
            calc.setProgressCallback(function (info: { current: number; total: number }): void {
                progress.push(info);
            });
            let file: File = makeFile("formula\nA\nB\nC\n", "input.csv");
            await calc.processFile(file, "molar-mass");
            expect(progress.length).toBe(3);
            expect(progress[0]).toEqual({ "current": 1, "total": 3 });
            expect(progress[2]).toEqual({ "current": 3, "total": 3 });
        });

        it("should store last results after processing", async function () {
            mockPost.mockResolvedValue({ "Value": 18.015, "Unit": "g/mol" });
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let file: File = makeFile("formula\nH2O\n", "input.csv");
            let result: { csvString: string } = await calc.processFile(file, "molar-mass");
            expect(calc.getLastResults()).toBe(result.csvString);
        });

        it("should preserve input columns in output", async function () {
            mockPost.mockResolvedValue({ "Value": 0.5, "Unit": "M" });
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let file: File = makeFile("M1,V1,M2,V2\n1,2,3,4\n", "input.csv");
            let result: { csvString: string } = await calc.processFile(file, "dilution");
            let lines: string[] = result.csvString.split("\n");
            expect(lines[0]).toBe("M1,V1,M2,V2,value,unit,status");
            expect(lines[1]).toBe("1,2,3,4,0.5,M,ok");
        });
    });

    describe("init", function () {
        it("should show authorized box and enable inputs after init", function () {
            document.body.innerHTML = "<div id=\"batch-authorized\"></div>" +
                "<div id=\"batch-unauthorized\"></div>" +
                "<input id=\"batch-file-input\" type=\"file\">" +
                "<button id=\"batch-process-btn\">Process</button>";
            let calc: BatchCalculator = BatchCalculator.getInstance();
            calc.init();
            let authorized: HTMLElement = document.getElementById("batch-authorized") as HTMLElement;
            let unauthorized: HTMLElement = document.getElementById("batch-unauthorized") as HTMLElement;
            let fileInput: HTMLInputElement = document.getElementById("batch-file-input") as HTMLInputElement;
            let processBtn: HTMLButtonElement = document.getElementById("batch-process-btn") as HTMLButtonElement;
            expect(authorized.style.display).toBe("block");
            expect(unauthorized.style.display).toBe("none");
            expect(fileInput.disabled).toBe(false);
            // Process button is enabled when authorized (no file required to enable)
            expect(processBtn.disabled).toBe(false);
        });

        it("should be idempotent (multiple calls do not re-initialize)", function () {
            let calc: BatchCalculator = BatchCalculator.getInstance();
            calc.init();
            calc.init();
            // No throw and instance remains valid
            expect(calc).toBe(BatchCalculator.getInstance());
        });

        it("should not throw when DOM elements are missing", function () {
            document.body.innerHTML = "";
            let calc: BatchCalculator = BatchCalculator.getInstance();
            expect(function (): void { calc.init(); }).not.toThrow();
        });
    });

    describe("downloadResults", function () {
        it("should create an anchor with the correct filename and trigger a click", function () {
            let urlSpy: ReturnType<typeof vi.fn> = vi.fn().mockReturnValue("blob:fake-url");
            let revokeSpy: ReturnType<typeof vi.fn> = vi.fn();
            vi.stubGlobal("URL", {
                "createObjectURL": urlSpy,
                "revokeObjectURL": revokeSpy
            });
            let calc: BatchCalculator = BatchCalculator.getInstance();
            let csv: string = "formula,molar_mass,unit,status\nH2O,18.015,g/mol,ok";
            let createdAnchors: HTMLAnchorElement[] = [];
            let originalCreate: (tag: string) => HTMLElement = document.createElement.bind(document);
            let clickSpy: ReturnType<typeof vi.fn> = vi.fn();
            vi.spyOn(document, "createElement").mockImplementation(function (tag: string): HTMLElement {
                let el: HTMLElement = originalCreate(tag);
                if (tag === "a") {
                    let anchor: HTMLAnchorElement = el as HTMLAnchorElement;
                    anchor.click = clickSpy as unknown as () => void;
                    createdAnchors.push(anchor);
                }
                return el;
            });
            calc.downloadResults(csv, "results.csv");
            expect(urlSpy).toHaveBeenCalledTimes(1);
            expect(createdAnchors.length).toBe(1);
            expect(createdAnchors[0].download).toBe("results.csv");
            expect(createdAnchors[0].href).toBe("blob:fake-url");
            expect(clickSpy).toHaveBeenCalledTimes(1);
            expect(revokeSpy).toHaveBeenCalledWith("blob:fake-url");
        });
    });
});
