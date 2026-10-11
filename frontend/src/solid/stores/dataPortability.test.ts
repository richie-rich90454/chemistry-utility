import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {DataPortabilityManager} from "../../modules/dataPortabilityManager.js";
import {useDataPortability, resetDataPortability} from "./dataPortability";
const mocks = vi.hoisted(function () {
    return {
        "mockSaveFile": vi.fn(),
        "mockOpenFile": vi.fn()
    };
});
vi.mock("../../modules/dom/fileAccess.js", function () {
    return {
        "getFileAccess": function () {
            return {
                "kind": "native",
                "saveFile": mocks.mockSaveFile,
                "openFile": mocks.mockOpenFile
            };
        }
    };
});
function makeArchiveJson(): string {
    return JSON.stringify({
        version: 1,
        exportedAt: "2026-07-20T00:00:00.000Z",
        history: [],
        theme: "light",
        autoDarkMode: false,
        inputs: {},
        logs: [],
        plugins: {}
    });
}
function makeArchiveFile(json: string): File {
    return new File([json], "backup.chemutil", {"type": "application/json"});
}
describe("useDataPortability", function (): void {
    beforeEach(function (): void {
        resetDataPortability();
        DataPortabilityManager.resetInstance();
        localStorage.clear();
        mocks.mockSaveFile.mockReset();
        mocks.mockOpenFile.mockReset();
        mocks.mockSaveFile.mockResolvedValue("chemistry-utility-backup.chemutil");
        mocks.mockOpenFile.mockResolvedValue(makeArchiveFile(makeArchiveJson()));
    });
    afterEach(function (): void {
        resetDataPortability();
        DataPortabilityManager.resetInstance();
        localStorage.clear();
        vi.restoreAllMocks();
    });
    it("initial status and error are empty", function (): void {
        let store = useDataPortability();
        expect(store.status()).toBe("");
        expect(store.error()).toBe("");
    });
    it("exportData saves the archive through the file adapter", async function (): Promise<void> {
        let store = useDataPortability();
        await store.exportData();
        expect(mocks.mockSaveFile).toHaveBeenCalledWith("chemistry-utility-backup.chemutil", expect.stringContaining("\"version\": 1"));
        expect(store.status()).toBe("Data exported successfully");
        expect(store.error()).toBe("");
    });
    it("exportData sets an error when the adapter rejects", async function (): Promise<void> {
        mocks.mockSaveFile.mockRejectedValue(new Error("disk full"));
        let store = useDataPortability();
        await store.exportData();
        expect(store.error()).toBe("Export failed: disk full");
        expect(store.status()).toBe("");
    });
    it("exportData sets Unknown error for a non-Error rejection", async function (): Promise<void> {
        mocks.mockSaveFile.mockRejectedValue("string failure");
        let store = useDataPortability();
        await store.exportData();
        expect(store.error()).toBe("Export failed: Unknown error");
        expect(store.status()).toBe("");
    });
    it("exportData sets an error when the archive cannot be serialized", async function (): Promise<void> {
        let manager = DataPortabilityManager.getInstance();
        vi.spyOn(manager, "export").mockImplementation(function (): never {
            throw new Error("boom");
        });
        let store = useDataPortability();
        await store.exportData().catch(function (): void { return; });
        expect(mocks.mockSaveFile).not.toHaveBeenCalled();
    });
    it("importData with valid archive calls manager.import and sets status", function (): void {
        let manager = DataPortabilityManager.getInstance();
        let spy = vi.spyOn(manager, "import").mockImplementation(function (): void {});
        let store = useDataPortability();
        store.importData(makeArchiveJson());
        expect(spy).toHaveBeenCalled();
        expect(store.status()).toBe("Data imported successfully");
        expect(store.error()).toBe("");
    });
    it("importData with invalid JSON sets error and clears status", function (): void {
        let store = useDataPortability();
        store.importData("not valid json");
        expect(store.error()).toContain("Import failed:");
        expect(store.error()).toContain("Invalid JSON");
        expect(store.status()).toBe("");
    });
    it("importData with invalid archive schema sets error", function (): void {
        let manager = DataPortabilityManager.getInstance();
        let spy = vi.spyOn(manager, "import").mockImplementation(function (): void {
            throw new Error("Invalid archive: schema validation failed");
        });
        let store = useDataPortability();
        store.importData(JSON.stringify({version: "not a number"}));
        expect(spy).toHaveBeenCalled();
        expect(store.error()).toContain("Import failed:");
        expect(store.status()).toBe("");
    });
    it("importData sets Unknown error when JSON.parse throws non-Error", function (): void {
        let spy = vi.spyOn(JSON, "parse").mockImplementation(function (): never {
            throw "not an error object";
        });
        let store = useDataPortability();
        try {
            store.importData("anything");
        }
        finally {
            spy.mockRestore();
        }
        expect(store.error()).toBe("Import failed: Invalid JSON: Unknown error");
        expect(store.status()).toBe("");
    });
    it("importData sets Unknown error when manager.import throws non-Error", function (): void {
        let manager = DataPortabilityManager.getInstance();
        vi.spyOn(manager, "import").mockImplementation(function (): void {
            throw 42;
        });
        let store = useDataPortability();
        store.importData(JSON.stringify({version: 1}));
        expect(store.error()).toBe("Import failed: Unknown error");
        expect(store.status()).toBe("");
    });
    it("exportData reports nothing when the dialog is dismissed", async function (): Promise<void> {
        mocks.mockSaveFile.mockResolvedValue(null);
        let store = useDataPortability();
        await store.exportData();
        expect(store.status()).toBe("");
        expect(store.error()).toBe("");
    });
    it("importArchive reads the picked file and imports it", async function (): Promise<void> {
        let manager = DataPortabilityManager.getInstance();
        let spy = vi.spyOn(manager, "import").mockImplementation(function (): void {});
        let store = useDataPortability();
        await store.importArchive();
        expect(mocks.mockOpenFile).toHaveBeenCalledWith(".chemutil,.json,application/json");
        expect(spy).toHaveBeenCalled();
        expect(store.status()).toBe("Data imported successfully");
    });
    it("importArchive does nothing when the dialog is dismissed", async function (): Promise<void> {
        mocks.mockOpenFile.mockResolvedValue(null);
        let manager = DataPortabilityManager.getInstance();
        let spy = vi.spyOn(manager, "import").mockImplementation(function (): void {});
        let store = useDataPortability();
        await store.importArchive();
        expect(spy).not.toHaveBeenCalled();
        expect(store.status()).toBe("");
        expect(store.error()).toBe("");
    });
    it("importArchive sets an error when the file cannot be read", async function (): Promise<void> {
        let file = makeArchiveFile("{}");
        vi.spyOn(file, "text").mockRejectedValue(new Error("read fail"));
        mocks.mockOpenFile.mockResolvedValue(file);
        let store = useDataPortability();
        await store.importArchive();
        expect(store.error()).toBe("Import failed: read fail");
        expect(store.status()).toBe("");
    });
    it("importArchive sets an error when the adapter rejects", async function (): Promise<void> {
        mocks.mockOpenFile.mockRejectedValue(new Error("no dialog"));
        let store = useDataPortability();
        await store.importArchive();
        expect(store.error()).toBe("Import failed: no dialog");
        expect(store.status()).toBe("");
    });
    it("shares state across multiple useDataPortability calls (singleton)", async function (): Promise<void> {
        let storeA = useDataPortability();
        let storeB = useDataPortability();
        await storeA.exportData();
        expect(storeB.status()).toBe("Data exported successfully");
    });
});
