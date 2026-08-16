import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DataPortabilityManager, ChemutilArchiveValidator } from "./dataPortabilityManager.js";
import { ExportManager } from "./exportManager.js";
import { InputPersistence } from "./inputPersistence.js";
import { PluginManager } from "./pluginManager.js";

describe("DataPortabilityManager", () => {
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        DataPortabilityManager.resetInstance();
        ExportManager.resetInstance();
        InputPersistence.resetInstance();
        PluginManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
        revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(function (): void {});
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (): void {});
    });

    afterEach(() => {
        DataPortabilityManager.resetInstance();
        ExportManager.resetInstance();
        InputPersistence.resetInstance();
        PluginManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    describe("getInstance", () => {
        it("returns the same singleton instance", () => {
            expect(DataPortabilityManager.getInstance()).toBe(DataPortabilityManager.getInstance());
        });

        it("returns a new instance after resetInstance", () => {
            let first = DataPortabilityManager.getInstance();
            DataPortabilityManager.resetInstance();
            let second = DataPortabilityManager.getInstance();
            expect(first).not.toBe(second);
        });
    });

    describe("export", () => {
        it("returns an archive with version 1", () => {
            let archive = DataPortabilityManager.getInstance().export();
            expect(archive.version).toBe(1);
        });

        it("returns an archive with exportedAt as ISO timestamp", () => {
            let archive = DataPortabilityManager.getInstance().export();
            expect(archive.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        it("includes calculation history from ExportManager", () => {
            ExportManager.getInstance().addToHistory("mass-calc", { "formula-input": "H2O" }, "18.015");
            let archive = DataPortabilityManager.getInstance().export();
            expect(archive.history.length).toBe(1);
            expect(archive.history[0].calculatorId).toBe("mass-calc");
        });

        it("includes the current theme name", () => {
            localStorage.setItem("theme", "dark");
            let archive = DataPortabilityManager.getInstance().export();
            expect(archive.theme).toBe("dark");
        });

        it("defaults theme to light when no theme is stored", () => {
            let archive = DataPortabilityManager.getInstance().export();
            expect(archive.theme).toBe("light");
        });

        it("includes autoDarkMode flag", () => {
            localStorage.setItem("auto-dark-mode", "true");
            let archive = DataPortabilityManager.getInstance().export();
            expect(archive.autoDarkMode).toBe(true);
        });

        it("includes saved calculator inputs", () => {
            InputPersistence.getInstance().save("gas-laws", { "ideal-P": "1", "ideal-V": "22.4" });
            let archive = DataPortabilityManager.getInstance().export();
            expect(archive.inputs["gas-laws"]).toEqual({ "ideal-P": "1", "ideal-V": "22.4" });
        });

        it("includes experiment logs when present", () => {
            let logs = [{ id: "log-1", title: "Test Log", createdAt: "2024-01-01T00:00:00.000Z" }];
            localStorage.setItem("chemutil_experiment_logs", JSON.stringify(logs));
            let archive = DataPortabilityManager.getInstance().export();
            expect(archive.logs.length).toBe(1);
            expect((archive.logs[0] as { id: string }).id).toBe("log-1");
        });

        it("includes plugin enabled states", () => {
            let pluginState = { "crystal-structure": { enabled: true } };
            localStorage.setItem("chem-utility-plugin-states", JSON.stringify(pluginState));
            let archive = DataPortabilityManager.getInstance().export();
            expect(archive.plugins).toEqual(pluginState);
        });
    });

    describe("import", () => {
        it("writes history into ExportManager localStorage", () => {
            let archive = {
                version: 1,
                exportedAt: "2024-01-01T00:00:00.000Z",
                history: [{ calculatorId: "mass-calc", inputs: { "formula-input": "H2O" }, result: "18.015", timestamp: "2024-01-01T00:00:00.000Z" }],
                theme: "dark",
                autoDarkMode: false,
                inputs: {},
                logs: [],
                plugins: {}
            };
            DataPortabilityManager.getInstance().import(archive);
            let stored = localStorage.getItem("calc-history");
            expect(stored).not.toBeNull();
            let parsed = JSON.parse(stored as string);
            expect(parsed.length).toBe(1);
            expect(parsed[0].calculatorId).toBe("mass-calc");
        });

        it("writes theme to localStorage", () => {
            let archive = {
                version: 1,
                exportedAt: "2024-01-01T00:00:00.000Z",
                history: [],
                theme: "amoled",
                autoDarkMode: false,
                inputs: {},
                logs: [],
                plugins: {}
            };
            DataPortabilityManager.getInstance().import(archive);
            expect(localStorage.getItem("theme")).toBe("amoled");
        });

        it("writes autoDarkMode to localStorage", () => {
            let archive = {
                version: 1,
                exportedAt: "2024-01-01T00:00:00.000Z",
                history: [],
                theme: "light",
                autoDarkMode: true,
                inputs: {},
                logs: [],
                plugins: {}
            };
            DataPortabilityManager.getInstance().import(archive);
            expect(localStorage.getItem("auto-dark-mode")).toBe("true");
        });

        it("writes saved calculator inputs to localStorage", () => {
            let archive = {
                version: 1,
                exportedAt: "2024-01-01T00:00:00.000Z",
                history: [],
                theme: "light",
                autoDarkMode: false,
                inputs: { "gas-laws": { "ideal-P": "2" } },
                logs: [],
                plugins: {}
            };
            DataPortabilityManager.getInstance().import(archive);
            let stored = localStorage.getItem("calc-inputs-gas-laws");
            expect(stored).not.toBeNull();
            let parsed = JSON.parse(stored as string);
            expect(parsed["ideal-P"]).toBe("2");
        });

        it("writes experiment logs to localStorage", () => {
            let logs = [{ id: "log-2", title: "Imported", createdAt: "2024-01-02T00:00:00.000Z" }];
            let archive = {
                version: 1,
                exportedAt: "2024-01-01T00:00:00.000Z",
                history: [],
                theme: "light",
                autoDarkMode: false,
                inputs: {},
                logs: logs,
                plugins: {}
            };
            DataPortabilityManager.getInstance().import(archive);
            let stored = localStorage.getItem("chemutil_experiment_logs");
            expect(stored).not.toBeNull();
            let parsed = JSON.parse(stored as string);
            expect(parsed.length).toBe(1);
            expect(parsed[0].id).toBe("log-2");
        });

        it("writes plugin states to localStorage", () => {
            let archive = {
                version: 1,
                exportedAt: "2024-01-01T00:00:00.000Z",
                history: [],
                theme: "light",
                autoDarkMode: false,
                inputs: {},
                logs: [],
                plugins: { "crystal-structure": { enabled: true } }
            };
            DataPortabilityManager.getInstance().import(archive);
            let stored = localStorage.getItem("chem-utility-plugin-states");
            expect(stored).not.toBeNull();
            let parsed = JSON.parse(stored as string);
            expect(parsed["crystal-structure"].enabled).toBe(true);
        });

        it("throws ValidationError for invalid archive schema", () => {
            let badArchive = { version: "not-a-number", history: [] };
            expect(function (): void {
                DataPortabilityManager.getInstance().import(badArchive as never);
            }).toThrow(/invalid archive/i);
        });
    });

    describe("round-trip", () => {
        it("export then import preserves history", () => {
            let manager = DataPortabilityManager.getInstance();
            ExportManager.getInstance().addToHistory("mass-calc", { "formula-input": "NaCl" }, "58.44");
            let archive = manager.export();
            ExportManager.resetInstance();
            localStorage.removeItem("calc-history");
            manager.import(archive);
            let stored = localStorage.getItem("calc-history");
            expect(stored).not.toBeNull();
            let parsed = JSON.parse(stored as string);
            expect(parsed[0].calculatorId).toBe("mass-calc");
            expect(parsed[0].result).toBe("58.44");
        });
    });

    describe("exportToFile", () => {
        it("creates a download link with .chemutil extension", () => {
            DataPortabilityManager.getInstance().exportToFile();
            expect(createObjectURLSpy).toHaveBeenCalled();
            let blob = createObjectURLSpy.mock.calls[0][0] as Blob;
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe("application/json");
        });

        it("revokes the object URL after download", () => {
            DataPortabilityManager.getInstance().exportToFile();
            expect(revokeObjectURLSpy).toHaveBeenCalled();
        });
    });

    describe("importFromFile", () => {
        it("imports a valid JSON File", async () => {
            let archive = {
                version: 1,
                exportedAt: "2024-01-01T00:00:00.000Z",
                history: [],
                theme: "dark",
                autoDarkMode: false,
                inputs: {},
                logs: [],
                plugins: {}
            };
            let file = new File([JSON.stringify(archive)], "backup.chemutil", { type: "application/json" });
            await DataPortabilityManager.getInstance().importFromFile(file);
            expect(localStorage.getItem("theme")).toBe("dark");
        });

        it("throws for a File with invalid JSON", async () => {
            let file = new File(["not json", "garbage"], "bad.chemutil", { type: "application/json" });
            await expect(DataPortabilityManager.getInstance().importFromFile(file)).rejects.toThrow(/json/i);
        });

        it("throws for a File with valid JSON but invalid schema", async () => {
            let file = new File([JSON.stringify({ version: 99, noHistory: true })], "bad.chemutil", { type: "application/json" });
            await expect(DataPortabilityManager.getInstance().importFromFile(file)).rejects.toThrow(/invalid archive/i);
        });
    });
});

describe("ChemutilArchiveValidator", () => {
    it("returns true for a valid archive", () => {
        let archive = {
            version: 1,
            exportedAt: "2024-01-01T00:00:00.000Z",
            history: [],
            theme: "light",
            autoDarkMode: false,
            inputs: {},
            logs: [],
            plugins: {}
        };
        expect(ChemutilArchiveValidator.isValid(archive)).toBe(true);
    });

    it("returns false when version is missing", () => {
        expect(ChemutilArchiveValidator.isValid({ history: [] })).toBe(false);
    });

    it("returns false when version is not a number", () => {
        expect(ChemutilArchiveValidator.isValid({ version: "1", history: [] })).toBe(false);
    });

    it("returns false when history is not an array", () => {
        let archive = { version: 1, exportedAt: "x", history: "not-array", theme: "light", autoDarkMode: false, inputs: {}, logs: [], plugins: {} };
        expect(ChemutilArchiveValidator.isValid(archive)).toBe(false);
    });

    it("returns false when theme is not a string", () => {
        let archive = { version: 1, exportedAt: "x", history: [], theme: 42, autoDarkMode: false, inputs: {}, logs: [], plugins: {} };
        expect(ChemutilArchiveValidator.isValid(archive)).toBe(false);
    });

    it("returns false when autoDarkMode is not a boolean", () => {
        let archive = { version: 1, exportedAt: "x", history: [], theme: "light", autoDarkMode: "yes", inputs: {}, logs: [], plugins: {} };
        expect(ChemutilArchiveValidator.isValid(archive)).toBe(false);
    });

    it("returns false when inputs is not an object", () => {
        let archive = { version: 1, exportedAt: "x", history: [], theme: "light", autoDarkMode: false, inputs: [], logs: [], plugins: {} };
        expect(ChemutilArchiveValidator.isValid(archive)).toBe(false);
    });

    it("returns false when logs is not an array", () => {
        let archive = { version: 1, exportedAt: "x", history: [], theme: "light", autoDarkMode: false, inputs: {}, logs: "nope", plugins: {} };
        expect(ChemutilArchiveValidator.isValid(archive)).toBe(false);
    });

    it("returns false when plugins is not an object", () => {
        let archive = { version: 1, exportedAt: "x", history: [], theme: "light", autoDarkMode: false, inputs: {}, logs: [], plugins: [] };
        expect(ChemutilArchiveValidator.isValid(archive)).toBe(false);
    });

    it("returns false for null input", () => {
        expect(ChemutilArchiveValidator.isValid(null)).toBe(false);
    });

    it("returns false for non-object input", () => {
        expect(ChemutilArchiveValidator.isValid("string")).toBe(false);
    });
});
