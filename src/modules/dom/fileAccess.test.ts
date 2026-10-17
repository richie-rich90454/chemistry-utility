import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getFileAccess, resetFileAccess } from "./fileAccess.js";
import { getBindings } from "./wailsBindings.js";
import { RuntimeDetector } from "../runtimeDetector.js";

function stubBindings(open: unknown, save: unknown): void {
    Object.defineProperty(window, "go", {
        "configurable": true,
        "writable": true,
        "value": {
            "main": {
                "FileService": {
                    "OpenFile": vi.fn().mockResolvedValue(open),
                    "SaveFile": vi.fn().mockResolvedValue(save)
                }
            }
        }
    });
}

function setFiles(input: HTMLInputElement, files: File[] | null): void {
    Object.defineProperty(input, "files", {
        "configurable": true,
        "value": files
    });
}

describe("fileAccess", function (): void {
    beforeEach(function (): void {
        resetFileAccess();
        delete (window as unknown as { go?: unknown }).go;
        document.body.innerHTML = "";
    });
    afterEach(function (): void {
        resetFileAccess();
        delete (window as unknown as { go?: unknown }).go;
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("returns the web adapter in a plain browser", function (): void {
        expect(getFileAccess().kind).toBe("web");
    });

    it("returns the same adapter instance on repeated calls", function (): void {
        expect(getFileAccess()).toBe(getFileAccess());
    });

    it("returns the native adapter inside the Wails runtime", function (): void {
        stubBindings("a,b\n1,2", "/tmp/out.csv");
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        expect(getFileAccess().kind).toBe("native");
    });

    it("wraps the native dialog result in a File so consumers share one shape", async function (): Promise<void> {
        stubBindings("formula\nH2O\n", "/tmp/out.csv");
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        let picked = await getFileAccess().openFile(".csv");
        expect(picked).not.toBeNull();
        expect(await (picked as File).text()).toBe("formula\nH2O\n");
        expect((picked as File).name).toBe("file.csv");
        let bindings = getBindings();
        expect(bindings?.go.main.FileService.OpenFile).toHaveBeenCalledWith("Open file", ".csv");
    });

    it("derives a plain name when the accept list has no extension", async function (): Promise<void> {
        stubBindings("anything", "/tmp/out");
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        expect((await getFileAccess().openFile("") as File).name).toBe("file");
    });

    it("returns null when the native open dialog fails", async function (): Promise<void> {
        let open = vi.fn().mockRejectedValue(new Error("cancelled"));
        Object.defineProperty(window, "go", {
            "configurable": true,
            "writable": true,
            "value": { "main": { "FileService": { "OpenFile": open, "SaveFile": vi.fn() } } }
        });
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        expect(await getFileAccess().openFile(".csv")).toBeNull();
    });

    it("writes through the native save dialog and returns the chosen path", async function (): Promise<void> {
        stubBindings("", "/home/user/out.csv");
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        expect(await getFileAccess().saveFile("out.csv", "a,b\n")).toBe("/home/user/out.csv");
    });

    it("returns null when the native save dialog fails", async function (): Promise<void> {
        let save = vi.fn().mockRejectedValue(new Error("cancelled"));
        Object.defineProperty(window, "go", {
            "configurable": true,
            "writable": true,
            "value": { "main": { "FileService": { "OpenFile": vi.fn(), "SaveFile": save } } }
        });
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        expect(await getFileAccess().saveFile("out.csv", "a,b\n")).toBeNull();
    });

    it("returns the picked file on the web build", async function (): Promise<void> {
        let access = getFileAccess();
        let clicks: HTMLInputElement[] = [];
        let realClick = HTMLInputElement.prototype.click;
        HTMLInputElement.prototype.click = function (this: HTMLInputElement): void {
            clicks.push(this);
        };
        try {
            let pending = access.openFile(".csv,.json");
            await Promise.resolve();
            expect(clicks.length).toBe(1);
            let input = document.querySelector("input[type=file]") as HTMLInputElement;
            expect(input.accept).toBe(".csv,.json");
            setFiles(input, [new File(["formula\nH2O\n"], "in.csv", { "type": "text/csv" })]);
            input.dispatchEvent(new Event("change"));
            let picked = await pending;
            expect(await (picked as File).text()).toBe("formula\nH2O\n");
            // The temporary picker is removed once it settles.
            expect(document.querySelector("input[type=file]")).toBeNull();
        } finally {
            HTMLInputElement.prototype.click = realClick;
        }
    });

    it("resolves null on the web build when the picker is dismissed", async function (): Promise<void> {
        let access = getFileAccess();
        let realClick = HTMLInputElement.prototype.click;
        HTMLInputElement.prototype.click = function (): void { /* no dialog in jsdom */ };
        try {
            let pending = access.openFile(".csv");
            await Promise.resolve();
            let input = document.querySelector("input[type=file]") as HTMLInputElement;
            setFiles(input, []);
            window.dispatchEvent(new Event("focus"));
            expect(await pending).toBeNull();
        } finally {
            HTMLInputElement.prototype.click = realClick;
        }
    });

    it("keeps waiting when focus arrives before a file is chosen", async function (): Promise<void> {
        let access = getFileAccess();
        let realClick = HTMLInputElement.prototype.click;
        HTMLInputElement.prototype.click = function (): void { /* no dialog in jsdom */ };
        try {
            let pending = access.openFile(".csv");
            await Promise.resolve();
            let input = document.querySelector("input[type=file]") as HTMLInputElement;
            setFiles(input, [new File(["a"], "a.csv")]);
            window.dispatchEvent(new Event("focus"));
            input.dispatchEvent(new Event("change"));
            expect((await pending as File).name).toBe("a.csv");
        } finally {
            HTMLInputElement.prototype.click = realClick;
        }
    });

    it("resolves null when the change event carries no file and ignores a second settle", async function (): Promise<void> {
        let access = getFileAccess();
        let realClick = HTMLInputElement.prototype.click;
        HTMLInputElement.prototype.click = function (): void { /* no dialog in jsdom */ };
        try {
            let pending = access.openFile(".csv");
            await Promise.resolve();
            let input = document.querySelector("input[type=file]") as HTMLInputElement;
            setFiles(input, []);
            input.dispatchEvent(new Event("change"));
            input.dispatchEvent(new Event("change"));
            expect(await pending).toBeNull();
        } finally {
            HTMLInputElement.prototype.click = realClick;
        }
    });

    it("downloads a blob on the web build and echoes the file name", async function (): Promise<void> {
        let clicked: HTMLAnchorElement[] = [];
        let realClick = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement): void {
            clicked.push(this);
        };
        try {
            expect(await getFileAccess().saveFile("results.csv", "a,b\n1,2\n")).toBe("results.csv");
            expect(clicked.length).toBe(1);
            expect(clicked[0].download).toBe("results.csv");
            expect(document.querySelector("a")).toBeNull();
        } finally {
            HTMLAnchorElement.prototype.click = realClick;
        }
    });
});
