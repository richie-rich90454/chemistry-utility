#!/usr/bin/env node
/**
 * Chemistry Utility CLI — runs in Node without a browser or Wails runtime.
 * Provides command-line access to the pure compute modules.
 *
 * Usage:
 *   node --import tsx src/cli/index.ts <command> [args...]
 *
 * Commands:
 *   balance <equation>            Balance a chemical equation
 *   molar-mass <formula>          Calculate molar mass of a formula
 *   dilution <M1> <V1> <M2> <V2> <solveFor>  Solve dilution M1*V1=M2*V2
 *   ideal-gas <P> <V> <n> <T> <solveFor> [R]  Solve PV=nRT
 *   boyle <P1> <V1> <P2> <V2> <solveFor>  Solve P1*V1=P2*V2
 *   charles <V1> <T1> <V2> <T2> <solveFor>  Solve V1/T1=V2/T2
 *   ph <H+>                       Calculate pH from H+ concentration
 *   half-life <k>                 Calculate first-order half-life
 *   help                          Show this help message
 */

import { balanceEquation } from "../modules/equationBalancer.js";
import { calculateMolarMass } from "../modules/formulaParser.js";
import { computeDilution, computeIdealGasLaw, computeBoylesLaw, computeCharlesLaw, computePH, computeFirstOrderHalfLife } from "../modules/compute.js";
import { ChemicalElement } from "../types.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadPeriodicTable(): ChemicalElement[] {
    let ptablePath = join(__dirname, "..", "..", "public", "ptable.json");
    let raw = readFileSync(ptablePath, "utf-8");
    let data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.elements)) return data.elements;
    throw new Error("Could not load periodic table data");
}

export function printHelp(): void {
    console.log("Chemistry Utility CLI");
    console.log("");
    console.log("Commands:");
    console.log("  balance <equation>            Balance a chemical equation");
    console.log("    example: balance \"H2 + O2 -> H2O\"");
    console.log("  molar-mass <formula>          Calculate molar mass (g/mol)");
    console.log("    example: molar-mass \"H2SO4\"");
    console.log("  dilution <M1> <V1> <M2> <V2> <solveFor>");
    console.log("    solveFor: M1, V1, M2, or V2 (use 0 for unknown)");
    console.log("    example: dilution 2 1 0 4 M2  -> 0.5");
    console.log("  ideal-gas <P> <V> <n> <T> <solveFor> [R]");
    console.log("    R defaults to 0.08206 (atm-L); use 8.314 for SI");
    console.log("    example: ideal-gas 1 22.414 1 0 T  -> 273.15");
    console.log("  boyle <P1> <V1> <P2> <V2> <solveFor>");
    console.log("    example: boyle 2 4 0 8 P2  -> 1");
    console.log("  charles <V1> <T1> <V2> <T2> <solveFor>");
    console.log("    example: charles 2 200 0 300 V2  -> 3");
    console.log("  ph <H+>                        Calculate pH");
    console.log("    example: ph 1e-7  -> 7");
    console.log("  half-life <k>                  First-order half-life");
    console.log("    example: half-life 0.05  -> 13.86");
    console.log("  help                           Show this help");
}

export function parseNumber(s: string): number {
    let n = Number(s);
    if (isNaN(n)) {
        throw new Error("Invalid number: " + s);
    }
    return n;
}

export function cmdBalance(args: string[]): string {
    if (args.length < 1) {
        throw new Error("balance requires an equation argument");
    }
    let equation = args.join(" ");
    return balanceEquation(equation) as string;
}

export function cmdMolarMass(args: string[]): string {
    if (args.length < 1) {
        throw new Error("molar-mass requires a formula argument");
    }
    let formula = args[0];
    let elements = loadPeriodicTable();
    let mass = calculateMolarMass(formula, elements);
    return mass.toFixed(4) + " g/mol";
}

export function cmdDilution(args: string[]): string {
    if (args.length < 5) {
        throw new Error("dilution requires M1 V1 M2 V2 solveFor");
    }
    let M1 = parseNumber(args[0]);
    let V1 = parseNumber(args[1]);
    let M2 = parseNumber(args[2]);
    let V2 = parseNumber(args[3]);
    let solveFor = args[4] as "M1" | "V1" | "M2" | "V2";
    let result = computeDilution({ M1, V1, M2, V2 }, solveFor);
    let unit = solveFor.startsWith("M") ? "M" : "L";
    return result.toFixed(4) + " " + unit;
}

export function cmdIdealGas(args: string[]): string {
    if (args.length < 5) {
        throw new Error("ideal-gas requires P V n T solveFor [R]");
    }
    let P = parseNumber(args[0]);
    let V = parseNumber(args[1]);
    let n = parseNumber(args[2]);
    let T = parseNumber(args[3]);
    let solveFor = args[4] as "P" | "V" | "n" | "T";
    let R = args.length >= 6 ? parseNumber(args[5]) : 0.08206;
    let result = computeIdealGasLaw({ P, V, n, T, R }, solveFor);
    let unit: string;
    if (solveFor === "P") unit = R === 8.314 ? "Pa" : "atm";
    else if (solveFor === "V") unit = R === 8.314 ? "m^3" : "L";
    else if (solveFor === "n") unit = "mol";
    else unit = "K";
    return result.toFixed(4) + " " + unit;
}

export function cmdBoyle(args: string[]): string {
    if (args.length < 5) {
        throw new Error("boyle requires P1 V1 P2 V2 solveFor");
    }
    let P1 = parseNumber(args[0]);
    let V1 = parseNumber(args[1]);
    let P2 = parseNumber(args[2]);
    let V2 = parseNumber(args[3]);
    let solveFor = args[4] as "P1" | "V1" | "P2" | "V2";
    let result = computeBoylesLaw({ P1, V1, P2, V2 }, solveFor);
    let unit = solveFor.startsWith("P") ? "atm" : "L";
    return result.toFixed(4) + " " + unit;
}

export function cmdCharles(args: string[]): string {
    if (args.length < 5) {
        throw new Error("charles requires V1 T1 V2 T2 solveFor");
    }
    let V1 = parseNumber(args[0]);
    let T1 = parseNumber(args[1]);
    let V2 = parseNumber(args[2]);
    let T2 = parseNumber(args[3]);
    let solveFor = args[4] as "V1" | "T1" | "V2" | "T2";
    let result = computeCharlesLaw({ V1, T1, V2, T2 }, solveFor);
    let unit = solveFor.startsWith("V") ? "L" : "K";
    return result.toFixed(4) + " " + unit;
}

export function cmdPH(args: string[]): string {
    if (args.length < 1) {
        throw new Error("ph requires [H+] argument");
    }
    let H = parseNumber(args[0]);
    let result = computePH(H);
    return result.toFixed(4);
}

export function cmdHalfLife(args: string[]): string {
    if (args.length < 1) {
        throw new Error("half-life requires k argument");
    }
    let k = parseNumber(args[0]);
    let result = computeFirstOrderHalfLife(k);
    return result.toFixed(4) + " s";
}

export function runCommand(command: string, rest: string[]): string {
    if (command === "help" || command === "--help" || command === "-h") {
        printHelp();
        return "";
    }
    if (command === "balance") return cmdBalance(rest);
    if (command === "molar-mass") return cmdMolarMass(rest);
    if (command === "dilution") return cmdDilution(rest);
    if (command === "ideal-gas") return cmdIdealGas(rest);
    if (command === "boyle") return cmdBoyle(rest);
    if (command === "charles") return cmdCharles(rest);
    if (command === "ph") return cmdPH(rest);
    if (command === "half-life") return cmdHalfLife(rest);
    throw new Error("Unknown command: " + command);
}

function main(): void {
    let args = process.argv.slice(2);
    if (args.length === 0) {
        printHelp();
        process.exit(0);
    }
    let command = args[0];
    let rest = args.slice(1);
    try {
        let output = runCommand(command, rest);
        if (output.length > 0) console.log(output);
    } catch (e) {
        let msg = e instanceof Error ? e.message : String(e);
        console.error("Error: " + msg);
        process.exit(1);
    }
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
    main();
}
