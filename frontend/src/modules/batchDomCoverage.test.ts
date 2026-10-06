// @vitest-environment jsdom
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {BatchCalculator} from "./batchCalculator.js";

function setupBatchDom(opts: { file?: boolean; processBtn?: boolean; downloadBtn?: boolean; calcSelect?: boolean; errorBox?: boolean; progressContainer?: boolean; progressBar?: boolean; progressText?: boolean; previewContainer?: boolean; previewTable?: boolean } = {}): void {
    document.body.innerHTML = "";
    const o = Object.assign({file: true, processBtn: true, downloadBtn: true, calcSelect: true, errorBox: true, progressContainer: true, progressBar: true, progressText: true, previewContainer: true, previewTable: true}, opts);
    if (o.file) {
        const f = document.createElement("input");
        f.id = "batch-file-input";
        f.type = "file";
        document.body.appendChild(f);
    }
    if (o.processBtn) {
        const b = document.createElement("button");
        b.id = "batch-process-btn";
        document.body.appendChild(b);
    }
    if (o.downloadBtn) {
        const b = document.createElement("button");
        b.id = "batch-download-btn";
        document.body.appendChild(b);
    }
    if (o.calcSelect) {
        const s = document.createElement("select");
        s.id = "batch-calculator-type";
        const opt = document.createElement("option");
        opt.value = "molar-mass";
        s.appendChild(opt);
        s.value = "molar-mass";
        document.body.appendChild(s);
    }
    if (o.errorBox) {
        const e = document.createElement("div");
        e.id = "batch-error";
        document.body.appendChild(e);
    }
    if (o.progressContainer) {
        const p = document.createElement("div");
        p.id = "batch-progress-container";
        document.body.appendChild(p);
    }
    if (o.progressBar) {
        const b = document.createElement("progress");
        b.id = "batch-progress-bar";
        document.body.appendChild(b);
    }
    if (o.progressText) {
        const t = document.createElement("div");
        t.id = "batch-progress-text";
        document.body.appendChild(t);
    }
    if (o.previewContainer) {
        const c = document.createElement("div");
        c.id = "batch-preview-container";
        document.body.appendChild(c);
    }
    if (o.previewTable) {
        const t = document.createElement("div");
        t.id = "batch-preview-table";
        document.body.appendChild(t);
    }
    const auth = document.createElement("div");
    auth.id = "batch-authorized";
    document.body.appendChild(auth);
    const unauth = document.createElement("div");
    unauth.id = "batch-unauthorized";
    document.body.appendChild(unauth);
}

describe("batchDomCoverage: init and destroy", () => {
    beforeEach(() => {
        BatchCalculator.resetInstance();
    });
    afterEach(() => {
        BatchCalculator.resetInstance();
        document.body.innerHTML = "";
    });

    it("inits twice safely and destroys without elements", () => {
        setupBatchDom();
        const calc = BatchCalculator.getInstance();
        calc.init();
        calc.init();
        expect((calc as unknown as Record<string, unknown>)["initialized"]).toBe(true);
        const fileInput = document.getElementById("batch-file-input") as HTMLInputElement;
        const file = new File(["a,b\n1,2"], "test.csv", {type: "text/csv"});
        Object.defineProperty(fileInput, "files", {value: [file], configurable: true});
        (document.getElementById("batch-file-input") as HTMLInputElement).dispatchEvent(new Event("change", {bubbles: true}));
        (document.getElementById("batch-process-btn") as HTMLButtonElement).click();
        (document.getElementById("batch-download-btn") as HTMLButtonElement).click();
        calc.destroy();
        expect((calc as unknown as Record<string, unknown>)["initialized"]).toBe(false);
        calc.init();
        calc.destroy();
        document.body.innerHTML = "";
        calc.init();
        calc.destroy();
    });

    it("updates button state with and without files", () => {
        setupBatchDom();
        const calc = BatchCalculator.getInstance() as unknown as Record<string, () => void>;
        calc["updateProcessButtonState"]();
        expect((document.getElementById("batch-process-btn") as HTMLButtonElement).disabled).toBe(true);
        const fileInput = document.getElementById("batch-file-input") as HTMLInputElement;
        const file = new File(["a,b\n1,2"], "test.csv", {type: "text/csv"});
        Object.defineProperty(fileInput, "files", {value: [file], configurable: true});
        calc["updateProcessButtonState"]();
        expect((document.getElementById("batch-process-btn") as HTMLButtonElement).disabled).toBe(false);
        document.body.innerHTML = "";
        calc["updateProcessButtonState"]();
    });
});

describe("batchDomCoverage: process and download", () => {
    beforeEach(() => {
        BatchCalculator.resetInstance();
    });
    afterEach(() => {
        BatchCalculator.resetInstance();
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("returns early without fileInput or calcSelect", async () => {
        setupBatchDom({file: false});
        const calc = BatchCalculator.getInstance() as unknown as Record<string, () => Promise<void>>;
        await calc["handleProcessClick"]();
        setupBatchDom({calcSelect: false});
        await calc["handleProcessClick"]();
    });

    it("shows error with no file, with and without errorBox", async () => {
        setupBatchDom();
        const calc = BatchCalculator.getInstance() as unknown as Record<string, () => Promise<void>>;
        await calc["handleProcessClick"]();
        expect(document.getElementById("batch-error")!.textContent).toContain("CSV");
        setupBatchDom({errorBox: false});
        await calc["handleProcessClick"]();
    });

    it("processes success and failure via mocked processFile", async () => {
        setupBatchDom();
        const calc = BatchCalculator.getInstance();
        const fileInput = document.getElementById("batch-file-input") as HTMLInputElement;
        const file = new File(["a,b\n1,2"], "test.csv", {type: "text/csv"});
        Object.defineProperty(fileInput, "files", {value: [file], configurable: true});
        const ok = vi.spyOn(calc as unknown as { processFile(file: File, type: string): Promise<{ csvString: string; totalRows: number; successCount: number; errorCount: number }> }, "processFile").mockResolvedValue({csvString: "a,b\n1,2", totalRows: 1, successCount: 1, errorCount: 0});
        await (calc as unknown as Record<string, () => Promise<void>>)["handleProcessClick"]();
        expect(document.getElementById("batch-error")!.textContent).toContain("1 rows");
        setupBatchDom({errorBox: false});
        const fileInput2 = document.getElementById("batch-file-input") as HTMLInputElement;
        Object.defineProperty(fileInput2, "files", {value: [file], configurable: true});
        ok.mockResolvedValue({csvString: "a,b\n1,2", totalRows: 1, successCount: 1, errorCount: 0});
        await (calc as unknown as Record<string, () => Promise<void>>)["handleProcessClick"]();
        ok.mockRejectedValueOnce(new Error("boom"));
        setupBatchDom();
        const fileInput3 = document.getElementById("batch-file-input") as HTMLInputElement;
        Object.defineProperty(fileInput3, "files", {value: [file], configurable: true});
        await (calc as unknown as Record<string, () => Promise<void>>)["handleProcessClick"]();
        expect(document.getElementById("batch-error")!.textContent).toContain("boom");
        ok.mockRejectedValueOnce("string-failure" as never);
        await (calc as unknown as Record<string, () => Promise<void>>)["handleProcessClick"]();
        expect(document.getElementById("batch-error")!.textContent).toContain("failed");
        setupBatchDom({errorBox: false});
        const fileInput5 = document.getElementById("batch-file-input") as HTMLInputElement;
        Object.defineProperty(fileInput5, "files", {value: [file], configurable: true});
        ok.mockRejectedValueOnce(new Error("absent-boom"));
        await (calc as unknown as Record<string, () => Promise<void>>)["handleProcessClick"]();
        setupBatchDom({errorBox: false});
        const fileInput4 = document.getElementById("batch-file-input") as HTMLInputElement;
        Object.defineProperty(fileInput4, "files", {value: [file], configurable: true});
        ok.mockResolvedValue({csvString: "a,b\n1,2", totalRows: 1, successCount: 1, errorCount: 0} as never);
        await (calc as unknown as Record<string, () => Promise<void>>)["handleProcessClick"]();
    });

    it("handles download with and without results", () => {
        setupBatchDom();
        const calc = BatchCalculator.getInstance() as unknown as Record<string, () => void>;
        calc["handleDownloadClick"]();
        (BatchCalculator.getInstance() as unknown as Record<string, unknown>)["lastResults"] = "a,b\n1,2";
        const dl = vi.spyOn(BatchCalculator.getInstance() as unknown as { downloadResults(csv: string, name: string): void }, "downloadResults").mockImplementation(() => undefined);
        calc["handleDownloadClick"]();
        expect(dl).toHaveBeenCalled();
    });

    it("toggles progress, bar, text, download, and preview", () => {
        setupBatchDom();
        const calc = BatchCalculator.getInstance() as unknown as Record<string, (a: unknown, b?: unknown) => void>;
        calc["showProgress"](true);
        expect((document.getElementById("batch-progress-container") as HTMLElement).style.display).toBe("block");
        calc["showProgress"](false);
        calc["setProgressValue"](1, 2);
        expect((document.getElementById("batch-progress-text") as HTMLElement).textContent).toContain("1 / 2");
        calc["showDownloadButton"](true);
        expect((document.getElementById("batch-download-btn") as HTMLElement).style.display).toBe("inline-block");
        calc["showDownloadButton"](false);
        calc["renderPreview"]("a,b\n1,2");
        expect(document.getElementById("batch-preview-table")!.innerHTML).toContain("table");
        calc["renderPreview"]("");
        document.body.innerHTML = "";
        calc["showProgress"](true);
        calc["setProgressValue"](1, 2);
        calc["showDownloadButton"](true);
        calc["renderPreview"]("a,b");
    });

    it("covers real processFile, downloadResults, and parseCsv edges", async () => {
        setupBatchDom();
        const calc = BatchCalculator.getInstance();
        const parsed = calc.parseCsv("a,b,\n1,,3\n");
        expect(parsed.length).toBe(2);
        expect(calc.parseCsv("")).toEqual([]);
        const file = new File(["formula\nH2O\nNaCl"], "test.csv", {type: "text/csv"});
        const res = await calc.processFile(file, "molar-mass");
        expect(res.totalRows).toBe(2);
        const urlMock = vi.fn(() => "blob:mock");
        (globalThis.URL as unknown as Record<string, unknown>)["createObjectURL"] = urlMock;
        const revokeMock = vi.fn();
        (globalThis.URL as unknown as Record<string, unknown>)["revokeObjectURL"] = revokeMock;
        calc.downloadResults("a,b\n1,2", "out.csv");
        expect(urlMock).toHaveBeenCalled();
        const anyCalc = calc as unknown as Record<string, (v: string) => string | number>;
        expect(anyCalc["escapeField"](null as unknown as string)).toBe("");
        expect(anyCalc["coerceValue"]("")).toBe("");
        expect(anyCalc["coerceValue"]("1e1000")).toBe("1e1000");
        const ragged = new File(["formula,extra\nH2O"], "ragged.csv", {type: "text/csv"});
        const res2 = await calc.processFile(ragged, "molar-mass");
        expect(res2.totalRows).toBe(1);
        const {ApiClient} = await import("./apiClient.js");
        const postMock = vi.spyOn(ApiClient.getInstance(), "post").mockResolvedValue({});
        const backendFile = new File(["formula\nH2O"], "backend.csv", {type: "text/csv"});
        const res3 = await calc.processFile(backendFile, "stoichiometry");
        expect(res3.totalRows).toBe(1);
        postMock.mockRejectedValueOnce("backend-string-failure" as never);
        const res4 = await calc.processFile(backendFile, "stoichiometry");
        expect(res4.errorCount).toBe(1);
        postMock.mockRestore();
    });
});
