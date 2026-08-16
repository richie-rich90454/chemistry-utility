// @vitest-environment node
import { describe, it, expect } from "vitest";
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
    parseNumber
} from "./index.js";

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
});

describe("CLI cmdCharles", () => {
    it("solves for V2", () => {
        expect(cmdCharles(["2", "200", "0", "300", "V2"])).toBe("3.0000 L");
    });
    it("solves for T2", () => {
        expect(cmdCharles(["2", "200", "3", "0", "T2"])).toBe("300.0000 K");
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
    it("throws for unknown command", () => {
        expect(() => runCommand("unknown", [])).toThrow("Unknown command");
    });
    it("returns empty string for help", () => {
        expect(runCommand("help", [])).toBe("");
    });
});
