// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import {
    cmdBalance,
    cmdDilution,
    cmdIdealGas,
    cmdBoyle,
    cmdCharles,
    cmdPH,
    cmdHalfLife,
    cmdMolarMass,
    runCommand,
    parseNumber,
    loadPeriodicTable,
    printHelp,
    main,
} from "./index.js";
import { fileURLToPath } from "url";

const fsMocks = vi.hoisted(() => ({
    readImpl: null as null | ((path: string, encoding: string) => string),
}));

vi.mock("fs", async (importOriginal) => {
    const actual = await importOriginal<typeof import("fs")>();
    return {
        ...actual,
        readFileSync: (path: string, encoding: string): string => {
            if (fsMocks.readImpl !== null) {
                return fsMocks.readImpl(path, encoding);
            }
            return (actual.readFileSync as (p: string, e: string) => string)(path, encoding);
        },
    };
});

afterEach(() => {
    fsMocks.readImpl = null;
    vi.restoreAllMocks();
});

describe("CLI cmdBalance", () => {
    it("balances H2 + O2 -> H2O", () => {
        expect(cmdBalance(["H2", "+", "O2", "->", "H2O"])).toBe("2H2 + O2 -> 2H2O");
    });
    it("balances Fe2O3 + CO -> Fe + CO2", () => {
        expect(cmdBalance(["Fe2O3", "+", "CO", "->", "Fe", "+", "CO2"])).toBe("Fe2O3 + 3CO -> 2Fe + 3CO2");
    });
    it("throws for missing equation argument", () => {
        expect(() => cmdBalance([])).toThrow("equation argument");
    });
});

describe("CLI cmdMolarMass", () => {
    it("calculates molar mass of H2O", () => {
        let result = cmdMolarMass(["H2O"]);
        expect(result).toContain("18.015");
        expect(result).toContain("g/mol");
    });
    it("calculates molar mass of H2SO4", () => {
        let result = cmdMolarMass(["H2SO4"]);
        expect(result).toContain("98.078");
    });
    it("throws for missing formula", () => {
        expect(() => cmdMolarMass([])).toThrow("formula");
    });
});

describe("CLI cmdDilution", () => {
    it("solves for M2", () => {
        expect(cmdDilution(["2", "1", "0", "4", "M2"])).toBe("0.5000 M");
    });
    it("solves for V2", () => {
        expect(cmdDilution(["6", "100", "2", "0", "V2"])).toBe("300.0000 L");
    });
    it("throws for insufficient args", () => {
        expect(() => cmdDilution(["2", "1"])).toThrow("requires");
    });
});

describe("CLI cmdIdealGas", () => {
    it("solves for T with default R", () => {
        let result = cmdIdealGas(["1", "22.414", "1", "0", "T"]);
        expect(result).toContain("273.1");
        expect(result).toContain("K");
    });
    it("solves for P with SI units", () => {
        let result = cmdIdealGas(["0", "0.0224", "1", "273.15", "P", "8.314"]);
        expect(result).toContain("Pa");
    });
    it("throws for insufficient args", () => {
        expect(() => cmdIdealGas(["1", "2"])).toThrow("requires");
    });
});

describe("CLI cmdBoyle", () => {
    it("solves for P2", () => {
        expect(cmdBoyle(["2", "4", "0", "8", "P2"])).toBe("1.0000 atm");
    });
    it("solves for V2", () => {
        expect(cmdBoyle(["2", "4", "4", "0", "V2"])).toBe("2.0000 L");
    });
    it("throws for insufficient args", () => {
        expect(() => cmdBoyle(["2", "4"])).toThrow("requires");
    });
});

describe("CLI cmdCharles", () => {
    it("solves for V2", () => {
        expect(cmdCharles(["2", "200", "0", "300", "V2"])).toBe("3.0000 L");
    });
    it("solves for T2", () => {
        expect(cmdCharles(["2", "200", "3", "0", "T2"])).toBe("300.0000 K");
    });
    it("throws for insufficient args", () => {
        expect(() => cmdCharles(["2", "200"])).toThrow("requires");
    });
});

describe("CLI cmdPH", () => {
    it("calculates pH for [H+]=1e-7", () => {
        expect(cmdPH(["1e-7"])).toBe("7.0000");
    });
    it("calculates pH for [H+]=0.1", () => {
        expect(cmdPH(["0.1"])).toBe("1.0000");
    });
    it("throws for missing arg", () => {
        expect(() => cmdPH([])).toThrow("[H+]");
    });
});

describe("CLI cmdHalfLife", () => {
    it("calculates half-life for k=0.05", () => {
        let result = cmdHalfLife(["0.05"]);
        expect(result).toContain("13.86");
        expect(result).toContain("s");
    });
    it("throws for missing arg", () => {
        expect(() => cmdHalfLife([])).toThrow("k argument");
    });
});

describe("CLI parseNumber", () => {
    it("parses integer", () => {
        expect(parseNumber("42")).toBe(42);
    });
    it("parses decimal", () => {
        expect(parseNumber("3.14")).toBe(3.14);
    });
    it("parses scientific notation", () => {
        expect(parseNumber("1e-7")).toBe(1e-7);
    });
    it("throws for non-number", () => {
        expect(() => parseNumber("abc")).toThrow("Invalid number");
    });
});

describe("CLI runCommand", () => {
    it("dispatches balance command", () => {
        expect(runCommand("balance", ["H2", "+", "O2", "->", "H2O"])).toBe("2H2 + O2 -> 2H2O");
    });
    it("dispatches ph command", () => {
        expect(runCommand("ph", ["1e-7"])).toBe("7.0000");
    });
    it("dispatches molar-mass command", () => {
        expect(runCommand("molar-mass", ["H2O"])).toContain("g/mol");
    });
    it("dispatches dilution command", () => {
        expect(runCommand("dilution", ["2", "1", "0", "4", "M2"])).toBe("0.5000 M");
    });
    it("dispatches ideal-gas command", () => {
        expect(runCommand("ideal-gas", ["1", "22.414", "1", "0", "T"])).toContain("K");
    });
    it("dispatches boyle command", () => {
        expect(runCommand("boyle", ["2", "4", "0", "8", "P2"])).toBe("1.0000 atm");
    });
    it("dispatches charles command", () => {
        expect(runCommand("charles", ["2", "200", "0", "300", "V2"])).toBe("3.0000 L");
    });
    it("dispatches half-life command", () => {
        expect(runCommand("half-life", ["0.05"])).toContain("s");
    });
    it("throws for unknown command", () => {
        expect(() => runCommand("unknown", [])).toThrow("Unknown command");
    });
    it("returns empty string for help", () => {
        expect(runCommand("help", [])).toBe("");
    });
    it("returns empty string for --help and -h", () => {
        expect(runCommand("--help", [])).toBe("");
        expect(runCommand("-h", [])).toBe("");
    });
});

describe("CLI cmdIdealGas units", () => {
    it("solves for P with L-atm units by default", () => {
        expect(cmdIdealGas(["0", "22.414", "1", "273.15", "P"])).toContain("atm");
    });
    it("solves for V with L and m^3 units", () => {
        expect(cmdIdealGas(["1", "0", "1", "273.15", "V"])).toContain("L");
        expect(cmdIdealGas(["101325", "0", "1", "273.15", "V", "8.314"])).toContain("m^3");
    });
    it("solves for n in mol", () => {
        expect(cmdIdealGas(["1", "22.414", "0", "273.15", "n"])).toContain("mol");
    });
    it("solves for T in K", () => {
        expect(cmdIdealGas(["1", "22.414", "1", "0", "T"])).toContain("K");
    });
    it("accepts the full-precision SI constant", () => {
        expect(cmdIdealGas(["0", "0.0224", "1", "273.15", "P", "8.31446261815324"])).toContain("Pa");
    });
});

describe("CLI loadPeriodicTable", () => {
    it("returns the elements array from an object payload", () => {
        const elements = [{ symbol: "H", atomicNumber: 1 }];
        fsMocks.readImpl = () => JSON.stringify({ elements });
        expect(loadPeriodicTable()).toEqual(elements);
    });
    it("throws for payloads without element data", () => {
        fsMocks.readImpl = () => JSON.stringify({ foo: 1 });
        expect(() => loadPeriodicTable()).toThrow("Could not load periodic table");
    });
    it("propagates read failures", () => {
        fsMocks.readImpl = () => {
            throw new Error("ENOENT");
        };
        expect(() => loadPeriodicTable()).toThrow("ENOENT");
    });
});

describe("CLI printHelp", () => {
    it("logs the usage text", () => {
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        printHelp();
        expect(logSpy).toHaveBeenCalledWith("Chemistry Utility CLI");
    });
});

describe("CLI main", () => {
    class ExitSignal {
        constructor(readonly code: number) {}
    }

    function runMain(argv: string[]): { exitCode: number | null; log: string[]; err: string[] } {
        const log: string[] = [];
        const err: string[] = [];
        let exitCode: number | null = null;
        // Simulate real process.exit termination: the mock throws so main
        // cannot fall through past exit() the way a no-op mock would allow.
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
            throw new ExitSignal(code ?? 0);
        }) as unknown as typeof process.exit);
        const logSpy = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
            log.push(args.join(" "));
        });
        const errSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
            err.push(args.join(" "));
        });
        const savedArgv = process.argv;
        process.argv = argv;
        try {
            main();
        } catch (e) {
            if (e instanceof ExitSignal) {
                exitCode = e.code;
            } else {
                throw e;
            }
        } finally {
            process.argv = savedArgv;
            exitSpy.mockRestore();
            logSpy.mockRestore();
            errSpy.mockRestore();
        }
        return { exitCode, log, err };
    }

    it("prints help and exits 0 with no args", () => {
        const result = runMain(["node", "cli"]);
        expect(result.exitCode).toBe(0);
        expect(result.log.join("\n")).toContain("Commands:");
    });

    it("prints the command output", () => {
        const result = runMain(["node", "cli", "ph", "1e-7"]);
        expect(result.log.join("\n")).toContain("7.0000");
        expect(result.exitCode).toBeNull();
    });

    it("prints only the help text for empty output", () => {
        const result = runMain(["node", "cli", "help"]);
        expect(result.log.join("\n")).toContain("Commands:");
        expect(result.err).toEqual([]);
        expect(result.exitCode).toBeNull();
    });

    it("reports errors and exits 1", () => {
        const result = runMain(["node", "cli", "nope"]);
        expect(result.exitCode).toBe(1);
        expect(result.err.join("\n")).toContain("Unknown command");
    });

    it("reports non-Error throws", () => {
        const err: string[] = [];
        let exitCode: number | null = null;
        vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
            throw new ExitSignal(code ?? 0);
        }) as unknown as typeof process.exit);
        vi.spyOn(console, "log").mockImplementation(() => {
            throw "boom";
        });
        vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
            err.push(args.join(" "));
        });
        const savedArgv = process.argv;
        process.argv = ["node", "cli", "ph", "1e-7"];
        try {
            main();
        } catch (e) {
            if (e instanceof ExitSignal) {
                exitCode = e.code;
            } else {
                throw e;
            }
        } finally {
            process.argv = savedArgv;
        }
        expect(exitCode).toBe(1);
        expect(err.join("\n")).toContain("boom");
    });
});

describe("CLI module guard", () => {
    class GuardExit {
        constructor(readonly code: number) {}
    }

    it("runs main when executed as the main module", async () => {
        const log: string[] = [];
        let exitCode: number | null = null;
        vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
            log.push(args.join(" "));
        });
        vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
            throw new GuardExit(code ?? 0);
        }) as unknown as typeof process.exit);
        const savedArgv = process.argv;
        process.argv = ["node", fileURLToPath(new URL("./index.ts", import.meta.url).toString())];
        try {
            vi.resetModules();
            await import("./index.js");
        } catch (e) {
            if (e instanceof GuardExit) {
                exitCode = e.code;
            } else {
                throw e;
            }
        } finally {
            process.argv = savedArgv;
            vi.restoreAllMocks();
            vi.resetModules();
        }
        expect(log.join("\n")).toContain("Commands:");
        expect(exitCode).toBe(0);
    });

    it("stays inert when imported without argv", async () => {
        const log: string[] = [];
        vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
            log.push(args.join(" "));
        });
        const savedArgv = process.argv;
        process.argv = ["node"];
        try {
            vi.resetModules();
            await import("./index.js");
        } finally {
            process.argv = savedArgv;
            vi.restoreAllMocks();
            vi.resetModules();
        }
        expect(log).toEqual([]);
    });
});
