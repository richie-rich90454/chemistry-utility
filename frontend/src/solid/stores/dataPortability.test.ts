import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {DataPortabilityManager} from "../../modules/dataPortabilityManager.js";
import {useDataPortability} from "./dataPortability";
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
describe("useDataPortability", function (): void {
    beforeEach(function (): void {
        DataPortabilityManager.resetInstance();
        localStorage.clear();
    });
    afterEach(function (): void {
        DataPortabilityManager.resetInstance();
        localStorage.clear();
        vi.restoreAllMocks();
    });
    it("initial status and error are empty", function (): void {
        let store = useDataPortability();
        expect(store.status()).toBe("");
        expect(store.error()).toBe("");
    });
    it("exportData calls manager.exportToFile and sets status", function (): void {
        let manager = DataPortabilityManager.getInstance();
        let spy = vi.spyOn(manager, "exportToFile").mockImplementation(function (): void {});
        let store = useDataPortability();
        store.exportData();
        expect(spy).toHaveBeenCalled();
        expect(store.status()).toBe("Data exported successfully");
        expect(store.error()).toBe("");
    });
    it("exportData sets error when manager.exportToFile throws", function (): void {
        let manager = DataPortabilityManager.getInstance();
        vi.spyOn(manager, "exportToFile").mockImplementation(function (): void {
            throw new Error("disk full");
        });
        let store = useDataPortability();
        store.exportData();
        expect(store.error()).toBe("Export failed: disk full");
        expect(store.status()).toBe("");
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
    it("shares state across multiple useDataPortability calls (singleton)", function (): void {
        let storeA = useDataPortability();
        let storeB = useDataPortability();
        let manager = DataPortabilityManager.getInstance();
        vi.spyOn(manager, "exportToFile").mockImplementation(function (): void {});
        storeA.exportData();
        expect(storeB.status()).toBe("Data exported successfully");
    });
});
