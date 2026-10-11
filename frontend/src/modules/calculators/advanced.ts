import { NumberFormatter } from "../i18n/numberFormatter.js";
import { loadElements } from "./elementData.js";
import type { ChemicalElement } from "../../types.js";
import type { CalculatorResult } from "./pureCalculator.js";

const GAS_CONSTANT = 8.314;
const DEFAULT_TEMPERATURE = 298.15;
const PES_TOLERANCE = 0.25;
const MAX_DILUTION_STEPS = 10;

interface PesPattern {
    atomicNumber: number;
    energies: number[];
}

// ponytail: reference peak positions (MJ/mol) for H through Ca, in descending
// binding-energy order, one entry per occupied subshell. Widen the table for
// heavier elements. Matching allows 25% per-peak slack.
const PES_PATTERNS: PesPattern[] = [
    { atomicNumber: 1, energies: [1.312] },
    { atomicNumber: 2, energies: [2.372] },
    { atomicNumber: 3, energies: [5.278, 0.520] },
    { atomicNumber: 4, energies: [10.710, 0.899] },
    { atomicNumber: 5, energies: [18.139, 1.351, 0.801] },
    { atomicNumber: 6, energies: [27.424, 1.871, 1.086] },
    { atomicNumber: 7, energies: [39.548, 2.466, 1.402] },
    { atomicNumber: 8, energies: [52.403, 2.748, 1.314] },
    { atomicNumber: 9, energies: [67.231, 3.651, 1.798] },
    { atomicNumber: 10, energies: [83.964, 4.676, 2.090] },
    { atomicNumber: 11, energies: [103.320, 6.106, 2.957, 0.496] },
    { atomicNumber: 12, energies: [125.721, 7.476, 3.887, 0.738] },
    { atomicNumber: 13, energies: [150.423, 9.021, 5.024, 1.025, 0.578] },
    { atomicNumber: 14, energies: [177.436, 10.653, 6.259, 1.311, 0.786] },
    { atomicNumber: 15, energies: [207.006, 12.423, 7.584, 1.567, 1.012] },
    { atomicNumber: 16, energies: [238.512, 14.244, 9.057, 1.949, 1.000] },
    { atomicNumber: 17, energies: [272.331, 16.157, 10.853, 2.369, 1.255] },
    { atomicNumber: 18, energies: [309.039, 18.127, 12.824, 2.822, 1.526] },
    { atomicNumber: 19, energies: [347.500, 20.300, 14.900, 3.339, 2.266, 0.419] },
    { atomicNumber: 20, energies: [389.600, 22.700, 16.800, 3.792, 2.693, 0.605] }
];

const PES_SUBSHELL_ORDER: string[] = ["1s", "2s", "2p", "3s", "3p", "4s"];
const PES_SUBSHELL_CAPACITY: Record<string, number> = { "s": 2, "p": 6 };

interface VseprRow {
    electronGeometry: string;
    molecularGeometry: string;
    bondAngle: string;
    hybridization: string;
    polarity: string;
    angleNote: string;
}

const VSEPR_TABLE: Record<string, VseprRow> = {
    "AX1": { electronGeometry: "linear", molecularGeometry: "linear", bondAngle: "180", hybridization: "sp", polarity: "nonpolar", angleNote: "" },
    "AX2": { electronGeometry: "linear", molecularGeometry: "linear", bondAngle: "180", hybridization: "sp", polarity: "nonpolar", angleNote: "" },
    "AX2E": { electronGeometry: "trigonal planar", molecularGeometry: "bent", bondAngle: "120", hybridization: "sp2", polarity: "polar", angleNote: "The lone pair compresses the angle below the ideal 120 degrees." },
    "AX2E2": { electronGeometry: "tetrahedral", molecularGeometry: "bent", bondAngle: "104.5", hybridization: "sp3", polarity: "polar", angleNote: "Two lone pairs compress the angle from the ideal 109.5 degrees to about 104.5 degrees." },
    "AX3": { electronGeometry: "trigonal planar", molecularGeometry: "trigonal planar", bondAngle: "120", hybridization: "sp2", polarity: "nonpolar", angleNote: "" },
    "AX3E": { electronGeometry: "tetrahedral", molecularGeometry: "trigonal pyramidal", bondAngle: "107", hybridization: "sp3", polarity: "polar", angleNote: "The lone pair compresses the angle below the ideal 109.5 degrees." },
    "AX3E2": { electronGeometry: "trigonal bipyramidal", molecularGeometry: "T-shaped", bondAngle: "90", hybridization: "sp3d", polarity: "polar", angleNote: "" },
    "AX4": { electronGeometry: "tetrahedral", molecularGeometry: "tetrahedral", bondAngle: "109.5", hybridization: "sp3", polarity: "nonpolar", angleNote: "" },
    "AX4E": { electronGeometry: "trigonal bipyramidal", molecularGeometry: "seesaw", bondAngle: "120/90", hybridization: "sp3d", polarity: "polar", angleNote: "" },
    "AX4E2": { electronGeometry: "octahedral", molecularGeometry: "square planar", bondAngle: "90", hybridization: "sp3d2", polarity: "nonpolar", angleNote: "" },
    "AX5": { electronGeometry: "trigonal bipyramidal", molecularGeometry: "trigonal bipyramidal", bondAngle: "120/90", hybridization: "sp3d", polarity: "nonpolar", angleNote: "" },
    "AX5E": { electronGeometry: "octahedral", molecularGeometry: "square pyramidal", bondAngle: "90", hybridization: "sp3d", polarity: "polar", angleNote: "" },
    "AX6": { electronGeometry: "octahedral", molecularGeometry: "octahedral", bondAngle: "90", hybridization: "sp3d2", polarity: "nonpolar", angleNote: "" }
};

function readNumber(inputs: Record<string, string>, key: string): number {
    return parseFloat(inputs[key] ?? "");
}

function readText(inputs: Record<string, string>, key: string): string {
    return inputs[key] ?? "";
}

function formatter(): NumberFormatter {
    return NumberFormatter.createFromCurrentLocale();
}

function formatExponential(value: number): string {
    return value.toExponential(4);
}

function formatConcentration(value: number): string {
    if (value !== 0 && Math.abs(value) < 1e-4) {
        return formatExponential(value);
    }
    return formatter().format(value, 4);
}

function findElementBySymbol(symbol: string): ChemicalElement | null {
    let elements: ChemicalElement[] = loadElements();
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].symbol === symbol) {
            return elements[i];
        }
    }
    return null;
}

function findElementByAtomicNumber(atomicNumber: number): ChemicalElement | null {
    let elements: ChemicalElement[] = loadElements();
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].atomicNumber === atomicNumber) {
            return elements[i];
        }
    }
    return null;
}

function gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        let t = a % b;
        a = b;
        b = t;
    }
    return a === 0 ? 1 : a;
}

function lcm(a: number, b: number): number {
    if (a === 0 || b === 0) {
        return 1;
    }
    return a / gcd(a, b) * b;
}

function simplifyRatio(value: number): number[] {
    let bestNum = Math.round(value);
    let bestDen = 1;
    let bestErr = Math.abs(value - bestNum);
    for (let den = 2; den <= 6; den++) {
        let num = Math.round(value * den);
        let err = Math.abs(value * den - num) / den;
        if (err < bestErr) {
            bestErr = err;
            bestNum = num;
            bestDen = den;
        }
    }
    return [bestNum, bestDen];
}

interface ConfigResult {
    config: string;
    parts: { label: string; electrons: number }[];
    valenceShell: number;
    valenceElectrons: number;
}

// ponytail: the reference table stops at Ca (Z = 20), so the Aufbau order is
// just 1s 2s 2p 3s 3p 4s and the transition-metal exceptions never apply.
function buildConfig(atomicNumber: number): ConfigResult {
    let aufbau: string[] = ["1s", "2s", "2p", "3s", "3p", "4s"];
    let remaining = atomicNumber;
    let parts: { label: string; electrons: number }[] = [];
    for (let i = 0; i < aufbau.length && remaining > 0; i++) {
        let label = aufbau[i];
        let electrons = Math.min(PES_SUBSHELL_CAPACITY[label.charAt(1)], remaining);
        parts.push({ label: label, electrons: electrons });
        remaining -= electrons;
    }
    let config = "";
    for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
            config += " ";
        }
        config += parts[i].label + String(parts[i].electrons);
    }
    let valenceShell = parseInt(parts[parts.length - 1].label.charAt(0), 10);
    let valenceElectrons = 0;
    for (let i = 0; i < parts.length; i++) {
        if (parseInt(parts[i].label.charAt(0), 10) === valenceShell) {
            valenceElectrons += parts[i].electrons;
        }
    }
    return { config: config, parts: parts, valenceShell: valenceShell, valenceElectrons: valenceElectrons };
}

export function photoelectronSpectroscopy(inputs: Record<string, string>): CalculatorResult {
    let raw = readText(inputs, "pes-peaks");
    if (raw.trim() === "") {
        throw new Error("Enter PES peak positions in MJ/mol as a comma-separated list, e.g. 1.407, 2.446, 36.847");
    }
    let peaks: number[] = [];
    let parts = raw.split(",");
    for (let i = 0; i < parts.length; i++) {
        let entry = parts[i].trim();
        if (entry === "") {
            continue;
        }
        let value = parseFloat(entry);
        if (isNaN(value)) {
            throw new Error("Invalid peak value: " + entry);
        }
        if (value <= 0) {
            throw new Error("Peak positions must be positive numbers");
        }
        peaks.push(value);
    }
    if (peaks.length < 1) {
        throw new Error("Enter at least one PES peak position in MJ/mol");
    }
    if (peaks.length > PES_SUBSHELL_ORDER.length) {
        throw new Error("Too many peaks: this PES tool covers hydrogen through calcium (Z = 20), whose spectra have at most " + String(PES_SUBSHELL_ORDER.length) + " peaks");
    }
    peaks.sort(function (a: number, b: number): number { return b - a; });
    let bestZ = 0;
    let bestDeviation = Infinity;
    for (let i = 0; i < PES_PATTERNS.length; i++) {
        let pattern = PES_PATTERNS[i];
        if (pattern.energies.length !== peaks.length) {
            continue;
        }
        let deviation = 0;
        for (let j = 0; j < peaks.length; j++) {
            let d = Math.abs(peaks[j] - pattern.energies[j]) / pattern.energies[j];
            if (d > deviation) {
                deviation = d;
            }
        }
        if (deviation < bestDeviation) {
            bestDeviation = deviation;
            bestZ = pattern.atomicNumber;
        }
    }
    if (bestZ === 0 || bestDeviation > PES_TOLERANCE) {
        throw new Error("No element matches this spectrum: check the peak positions (MJ/mol) and try again");
    }
    let element = findElementByAtomicNumber(bestZ);
    if (element === null) {
        throw new Error("No element matches this spectrum: check the peak positions (MJ/mol) and try again");
    }
    let built = buildConfig(bestZ);
    let nf = formatter();
    let peakList = "";
    for (let i = 0; i < peaks.length; i++) {
        if (i > 0) {
            peakList += ", ";
        }
        peakList += nf.format(peaks[i], 4);
    }
    let subshellList = "";
    for (let i = 0; i < peaks.length; i++) {
        if (i > 0) {
            subshellList += ", ";
        }
        let electrons = 0;
        for (let j = 0; j < built.parts.length; j++) {
            if (built.parts[j].label === PES_SUBSHELL_ORDER[i]) {
                electrons = built.parts[j].electrons;
            }
        }
        subshellList += PES_SUBSHELL_ORDER[i] + String(electrons) + " at " + nf.format(peaks[i], 4) + " MJ/mol";
    }
    let explanation = "Peaks in MJ/mol (largest binding energy first): " + peakList + "; " +
        "Closest reference pattern: " + element.name + " (" + element.symbol + ", Z = " + String(bestZ) + "), largest peak deviation " + nf.format(bestDeviation * 100, 4) + "%; " +
        "Subshells: " + subshellList + "; " +
        "Electron configuration: " + built.config + "; " +
        "Valence electrons: " + String(built.valenceElectrons) + " (outer shell n = " + String(built.valenceShell) + ")";
    return {
        value: element.name + " (" + element.symbol + ", Z = " + String(bestZ) + "): " + built.config,
        explanation: explanation,
        metadata: {
            element: element.name,
            symbol: element.symbol,
            atomicNumber: bestZ,
            electronConfiguration: built.config,
            valenceElectrons: built.valenceElectrons,
            valenceShell: built.valenceShell,
            totalElectrons: bestZ,
            peaks: peaks,
            maxDeviation: bestDeviation
        }
    };
}

export function empiricalFormula(inputs: Record<string, string>): CalculatorResult {
    let raw = readText(inputs, "ef-composition");
    if (raw.trim() === "") {
        throw new Error("Enter the percent composition as element:percent pairs, e.g. C:40,H:6.71,O:53.29");
    }
    let entries = raw.split(",");
    let symbols: string[] = [];
    let percents: number[] = [];
    let masses: number[] = [];
    for (let i = 0; i < entries.length; i++) {
        let entry = entries[i].trim();
        if (entry === "") {
            continue;
        }
        let colon = entry.indexOf(":");
        if (colon < 0) {
            throw new Error("Invalid composition entry: " + entry + ". Use element:percent pairs like C:40,H:6.71,O:53.29");
        }
        let rawSymbol = entry.substring(0, colon).trim();
        let percentText = entry.substring(colon + 1).trim();
        let percent = parseFloat(percentText);
        if (isNaN(percent)) {
            throw new Error("Invalid percent in entry: " + entry);
        }
        if (percent < 0) {
            throw new Error("Percentages cannot be negative");
        }
        let symbol = rawSymbol.length > 0 ? rawSymbol.charAt(0).toUpperCase() + rawSymbol.slice(1).toLowerCase() : "";
        let element = findElementBySymbol(symbol);
        if (element === null) {
            throw new Error("Element not found: " + rawSymbol);
        }
        for (let j = 0; j < symbols.length; j++) {
            if (symbols[j] === symbol) {
                throw new Error("Duplicate element in composition: " + symbol);
            }
        }
        symbols.push(symbol);
        percents.push(percent);
        masses.push(element.atomicMass);
    }
    if (symbols.length < 1) {
        throw new Error("Enter at least one element:percent pair, e.g. C:40,H:6.71,O:53.29");
    }
    let nf = formatter();
    let totalPercent = 0;
    for (let i = 0; i < percents.length; i++) {
        totalPercent += percents[i];
    }
    if (totalPercent < 95 || totalPercent > 105) {
        throw new Error("Percentages must sum to approximately 100% (got " + nf.format(totalPercent, 4) + "%)");
    }
    for (let i = 0; i < percents.length; i++) {
        if (percents[i] === 0) {
            throw new Error("Each element must have a positive percent (got 0% for " + symbols[i] + ")");
        }
    }
    let moles: number[] = [];
    let minMoles = Infinity;
    for (let i = 0; i < symbols.length; i++) {
        let elementMoles = percents[i] / masses[i];
        moles.push(elementMoles);
        if (elementMoles < minMoles) {
            minMoles = elementMoles;
        }
    }
    let numerators: number[] = [];
    let denominators: number[] = [];
    for (let i = 0; i < moles.length; i++) {
        let frac = simplifyRatio(moles[i] / minMoles);
        numerators.push(frac[0]);
        denominators.push(frac[1]);
    }
    let common = 1;
    for (let i = 0; i < denominators.length; i++) {
        common = lcm(common, denominators[i]);
    }
    let counts: number[] = [];
    for (let i = 0; i < numerators.length; i++) {
        counts.push(numerators[i] * (common / denominators[i]));
    }
    let commonDivisor = 0;
    for (let i = 0; i < counts.length; i++) {
        commonDivisor = gcd(commonDivisor, counts[i]);
    }
    if (commonDivisor > 1) {
        for (let i = 0; i < counts.length; i++) {
            counts[i] = counts[i] / commonDivisor;
        }
    }
    let empirical = "";
    let empiricalMass = 0;
    let ratioText = "";
    let ratioLabel = "";
    for (let i = 0; i < symbols.length; i++) {
        if (counts[i] > 0) {
            empirical += symbols[i] + (counts[i] > 1 ? String(counts[i]) : "");
        }
        empiricalMass += counts[i] * masses[i];
        if (i > 0) {
            ratioText += ":";
            ratioLabel += ":";
        }
        ratioText += String(counts[i]);
        ratioLabel += symbols[i];
    }
    let value = "Empirical formula: " + empirical;
    let explanation = "Percent to moles: ";
    for (let i = 0; i < symbols.length; i++) {
        if (i > 0) {
            explanation += ", ";
        }
        explanation += symbols[i] + " " + nf.format(percents[i], 4) + "% / " + nf.format(masses[i], 4) + " g/mol = " + nf.format(moles[i], 4) + " mol";
    }
    explanation += "; Simplest ratio " + ratioLabel + " = " + ratioText;
    explanation += "; Empirical formula: " + empirical + "; Empirical formula mass: " + nf.format(empiricalMass, 4) + " g/mol";
    let metadata: Record<string, unknown> = {
        empiricalFormula: empirical,
        empiricalFormulaMass: empiricalMass,
        symbols: symbols,
        counts: counts,
        moles: moles
    };
    let molarMass = readNumber(inputs, "ef-molar-mass");
    if (!isNaN(molarMass)) {
        if (molarMass <= 0) {
            throw new Error("Molar mass must be positive");
        }
        let multiplier = molarMass / empiricalMass;
        let rounded = Math.round(multiplier);
        if (rounded < 1) {
            rounded = 1;
        }
        if (Math.abs(multiplier - rounded) > 0.05) {
            explanation += "; Warning: the molar mass does not divide evenly by the empirical formula mass (multiplier " + nf.format(multiplier, 4) + " rounds to " + String(rounded) + ")";
        }
        let molecular = "";
        for (let i = 0; i < symbols.length; i++) {
            let molecularCount = counts[i] * rounded;
            if (molecularCount > 0) {
                molecular += symbols[i] + (molecularCount > 1 ? String(molecularCount) : "");
            }
        }
        value += "; Molecular formula: " + molecular;
        explanation += "; Molar mass: " + nf.format(molarMass, 4) + " g/mol; Multiplier: " + String(rounded) + "; Molecular formula: " + molecular;
        metadata.molecularFormula = molecular;
        metadata.molarMass = molarMass;
        metadata.multiplier = rounded;
    }
    return { value: value, explanation: explanation, metadata: metadata };
}

export function massSpectrometry(inputs: Record<string, string>): CalculatorResult {
    let raw = readText(inputs, "ms-isotopes");
    if (raw.trim() === "") {
        throw new Error("Enter isotope data as mass,abundance pairs separated by semicolons, e.g. 34.97,0.7576;36.97,0.2424");
    }
    let entries = raw.split(/[;\n]+/);
    let isotopes: { mass: number; abundance: number }[] = [];
    let totalAbundance = 0;
    for (let i = 0; i < entries.length; i++) {
        let entry = entries[i].trim();
        if (entry === "") {
            continue;
        }
        let parts = entry.split(",");
        if (parts.length !== 2) {
            throw new Error("Invalid isotope entry: " + entry + ". Use mass,abundance pairs like 34.97,0.7576;36.97,0.2424");
        }
        let mass = parseFloat(parts[0]);
        let abundance = parseFloat(parts[1]);
        if (isNaN(mass) || isNaN(abundance)) {
            throw new Error("Invalid number in data: " + entry);
        }
        if (mass <= 0) {
            throw new Error("Isotope masses must be positive");
        }
        if (abundance < 0) {
            throw new Error("Abundances cannot be negative");
        }
        isotopes.push({ mass: mass, abundance: abundance });
        totalAbundance += abundance;
    }
    if (isotopes.length < 1) {
        throw new Error("Enter at least one isotope as mass,abundance");
    }
    if (totalAbundance <= 0) {
        throw new Error("Abundances must sum to a positive total");
    }
    let weightedSum = 0;
    for (let i = 0; i < isotopes.length; i++) {
        weightedSum += isotopes[i].mass * isotopes[i].abundance;
    }
    let averageMass = weightedSum / totalAbundance;
    let closest: ChemicalElement | null = null;
    let closestDelta = Infinity;
    let elements: ChemicalElement[] = loadElements();
    for (let i = 0; i < elements.length; i++) {
        let delta = Math.abs(elements[i].atomicMass - averageMass);
        if (delta < closestDelta) {
            closestDelta = delta;
            closest = elements[i];
        }
    }
    if (closest === null) {
        throw new Error("Element data is unavailable, so no element could be identified");
    }
    let mostAbundant = isotopes[0];
    for (let i = 1; i < isotopes.length; i++) {
        if (isotopes[i].abundance > mostAbundant.abundance) {
            mostAbundant = isotopes[i];
        }
    }
    let nf = formatter();
    let isotopeText = "";
    for (let i = 0; i < isotopes.length; i++) {
        if (i > 0) {
            isotopeText += "; ";
        }
        isotopeText += nf.format(isotopes[i].mass, 4) + " u at " + nf.format(isotopes[i].abundance, 4);
    }
    let explanation = "Isotopes: " + isotopeText + "; " +
        "Total abundance: " + nf.format(totalAbundance, 4) + "; " +
        "Average atomic mass = sum(mass * abundance) / total abundance = " + nf.format(averageMass, 4) + " u; " +
        "Closest element: " + closest.name + " (" + closest.symbol + ", Z = " + String(closest.atomicNumber) + ", table atomic mass " + nf.format(closest.atomicMass, 4) + " u); " +
        "Most abundant isotope: " + nf.format(mostAbundant.mass, 4) + " u";
    return {
        value: "Average atomic mass: " + nf.format(averageMass, 4) + " u (closest element: " + closest.name + ", " + closest.symbol + ")",
        explanation: explanation,
        metadata: {
            averageMass: averageMass,
            element: closest.name,
            symbol: closest.symbol,
            atomicNumber: closest.atomicNumber,
            mostAbundantMass: mostAbundant.mass,
            totalAbundance: totalAbundance,
            isotopes: isotopes
        }
    };
}

export function vseprGeometry(inputs: Record<string, string>): CalculatorResult {
    let central = readText(inputs, "vsepr-central").trim();
    if (central === "") {
        throw new Error("Central atom is required");
    }
    let bondedRaw = readNumber(inputs, "vsepr-bonded");
    let loneRaw = readNumber(inputs, "vsepr-lone-pairs");
    if (isNaN(bondedRaw) || bondedRaw < 0 || bondedRaw !== Math.floor(bondedRaw)) {
        throw new Error("Bonded atoms must be a non-negative whole number");
    }
    if (isNaN(loneRaw) || loneRaw < 0 || loneRaw !== Math.floor(loneRaw)) {
        throw new Error("Lone pairs must be a non-negative whole number");
    }
    if (bondedRaw === 0 && loneRaw === 0) {
        throw new Error("A central atom needs at least one bonded atom or one lone pair");
    }
    let symbol = central.charAt(0).toUpperCase() + central.slice(1).toLowerCase();
    let element = findElementBySymbol(symbol);
    if (element === null) {
        throw new Error("Element not found: " + central);
    }
    let steric = bondedRaw + loneRaw;
    if (steric > 6) {
        throw new Error("Steric number " + String(steric) + " is not supported; this calculator covers steric numbers 1 through 6");
    }
    let axe = "AX" + String(bondedRaw);
    if (loneRaw > 0) {
        axe += "E";
        if (loneRaw > 1) {
            axe += String(loneRaw);
        }
    }
    let row = VSEPR_TABLE[axe];
    if (row === undefined) {
        throw new Error("Unsupported AXE combination: " + axe);
    }
    let explanation = "Central atom: " + element.name + " (" + element.symbol + "); " +
        "Bonded atoms: " + String(bondedRaw) + "; " +
        "Lone pairs: " + String(loneRaw) + "; " +
        "Steric number: " + String(steric) + "; " +
        "Electron-pair geometry: " + row.electronGeometry + "; " +
        "Molecular geometry: " + row.molecularGeometry + "; " +
        "Ideal bond angle: " + row.bondAngle + " degrees; " +
        "Hybridization: " + row.hybridization + "; " +
        "Polarity: " + row.polarity;
    if (row.angleNote !== "") {
        explanation += "; " + row.angleNote;
    }
    if (row.polarity === "nonpolar") {
        explanation += "; Nonpolar assumes identical substituents, so the bond dipoles cancel; different substituents can make a symmetric geometry polar";
    }
    return {
        value: row.molecularGeometry + " (" + axe + "), bond angle " + row.bondAngle + " degrees, " + row.hybridization + ", " + row.polarity,
        explanation: explanation,
        metadata: {
            centralAtom: symbol,
            elementName: element.name,
            bonded: bondedRaw,
            lonePairs: loneRaw,
            stericNumber: steric,
            axe: axe,
            electronGeometry: row.electronGeometry,
            molecularGeometry: row.molecularGeometry,
            bondAngle: row.bondAngle,
            hybridization: row.hybridization,
            polarity: row.polarity
        }
    };
}

export function calorimetry(inputs: Record<string, string>): CalculatorResult {
    let solveFor = readText(inputs, "calor-solve-for") || "q";
    let mass = readNumber(inputs, "calor-mass");
    let specificHeat = readNumber(inputs, "calor-specific-heat");
    let deltaT = readNumber(inputs, "calor-delta-t");
    let heat = readNumber(inputs, "calor-heat");
    let result: number;
    let formula: string;
    let unit: string;
    if (solveFor === "q") {
        if (isNaN(mass) || isNaN(specificHeat) || isNaN(deltaT)) {
            throw new Error("Missing or invalid inputs for calor-mass, calor-specific-heat, calor-delta-t");
        }
        if (mass <= 0) {
            throw new Error("Mass must be positive");
        }
        if (specificHeat <= 0) {
            throw new Error("Specific heat must be positive");
        }
        result = mass * specificHeat * deltaT;
        formula = "q = m*c*dT";
        unit = "J";
    } else if (solveFor === "m") {
        if (isNaN(specificHeat) || isNaN(deltaT) || isNaN(heat)) {
            throw new Error("Missing or invalid inputs for calor-specific-heat, calor-delta-t, calor-heat");
        }
        if (specificHeat <= 0) {
            throw new Error("Specific heat must be positive");
        }
        if (deltaT === 0) {
            throw new Error("Temperature change cannot be zero");
        }
        result = heat / (specificHeat * deltaT);
        formula = "m = q/(c*dT)";
        unit = "g";
        if (result <= 0) {
            throw new Error("Solved mass is not positive; check the heat and temperature inputs");
        }
    } else if (solveFor === "c") {
        if (isNaN(mass) || isNaN(deltaT) || isNaN(heat)) {
            throw new Error("Missing or invalid inputs for calor-mass, calor-delta-t, calor-heat");
        }
        if (mass <= 0) {
            throw new Error("Mass must be positive");
        }
        if (deltaT === 0) {
            throw new Error("Temperature change cannot be zero");
        }
        result = heat / (mass * deltaT);
        formula = "c = q/(m*dT)";
        unit = "J/(g*C)";
        if (result <= 0) {
            throw new Error("Solved specific heat is not positive; check the heat and temperature inputs");
        }
    } else if (solveFor === "deltaT") {
        if (isNaN(mass) || isNaN(specificHeat) || isNaN(heat)) {
            throw new Error("Missing or invalid inputs for calor-mass, calor-specific-heat, calor-heat");
        }
        if (mass <= 0) {
            throw new Error("Mass must be positive");
        }
        if (specificHeat <= 0) {
            throw new Error("Specific heat must be positive");
        }
        result = heat / (mass * specificHeat);
        formula = "dT = q/(m*c)";
        unit = "C";
    } else {
        throw new Error("Invalid solve-for selection");
    }
    let nf = formatter();
    let formatted = nf.format(result, 4);
    let explanation = formula + " = " + formatted + " " + unit;
    if (solveFor === "q") {
        if (result > 0) {
            explanation += "; q is positive, so the surroundings absorbed heat and the reaction is endothermic";
        } else if (result < 0) {
            explanation += "; q is negative, so the reaction released heat and is exothermic";
        } else {
            explanation += "; q is zero, so no net heat was exchanged";
        }
    }
    return {
        value: formatted + " " + unit,
        explanation: explanation,
        metadata: { solveFor: solveFor, formula: formula, result: result, unit: unit }
    };
}

export function gibbsEquilibrium(inputs: Record<string, string>): CalculatorResult {
    let solveFor = readText(inputs, "geq-solve-for") || "K";
    let deltaG = readNumber(inputs, "geq-delta-g");
    let equilibriumConstant = readNumber(inputs, "geq-k");
    let temperatureText = readText(inputs, "geq-temperature");
    let temperature = parseFloat(temperatureText);
    if (temperatureText.trim() === "") {
        temperature = DEFAULT_TEMPERATURE;
    }
    let result: number;
    let formula: string;
    let value: string;
    let explanation: string;
    if (solveFor === "K") {
        if (isNaN(deltaG)) {
            throw new Error("Missing or invalid input for geq-delta-g");
        }
        if (isNaN(temperature) || temperature <= 0) {
            throw new Error("Temperature must be positive (Kelvin)");
        }
        result = Math.exp((-deltaG * 1000) / (GAS_CONSTANT * temperature));
        formula = "K = e^(-Delta G/(R*T))";
        value = "K = " + formatExponential(result);
        let favored: string;
        if (result > 1) {
            favored = "products (K > 1)";
        } else if (result < 1) {
            favored = "reactants (K < 1)";
        } else {
            favored = "neither side (K = 1)";
        }
        explanation = "Delta G = " + formatter().format(deltaG, 4) + " kJ/mol at T = " + formatter().format(temperature, 4) + " K; " +
            formula + " = " + formatExponential(result) + "; " +
            "The equilibrium favors " + favored;
    } else if (solveFor === "delta-g") {
        if (isNaN(equilibriumConstant)) {
            throw new Error("Missing or invalid input for geq-k");
        }
        if (equilibriumConstant <= 0) {
            throw new Error("Equilibrium constant must be positive");
        }
        if (isNaN(temperature) || temperature <= 0) {
            throw new Error("Temperature must be positive (Kelvin)");
        }
        result = (-GAS_CONSTANT * temperature * Math.log(equilibriumConstant)) / 1000;
        formula = "Delta G = -R*T*ln(K)";
        value = "Delta G = " + formatter().format(result, 4) + " kJ/mol";
        explanation = "K = " + formatExponential(equilibriumConstant) + " at T = " + formatter().format(temperature, 4) + " K; " +
            formula + " = " + formatter().format(result, 4) + " kJ/mol; " +
            "The reaction is " + (result < 0 ? "spontaneous under standard conditions" : result > 0 ? "non-spontaneous under standard conditions" : "at equilibrium under standard conditions");
    } else {
        throw new Error("Invalid solve-for selection");
    }
    return {
        value: value,
        explanation: explanation,
        metadata: { solveFor: solveFor, formula: formula, result: result, temperature: temperature }
    };
}

export function molality(inputs: Record<string, string>): CalculatorResult {
    let solveFor = readText(inputs, "molality-solve-for") || "molality";
    let soluteMass = readNumber(inputs, "molality-solute-mass");
    let solventMass = readNumber(inputs, "molality-solvent-mass");
    let molarMass = readNumber(inputs, "molality-molar-mass");
    let molalityValue = readNumber(inputs, "molality-value");
    let result: number;
    let formula: string;
    let unit: string;
    let extra: string;
    if (solveFor === "molality") {
        if (isNaN(soluteMass) || isNaN(solventMass) || isNaN(molarMass)) {
            throw new Error("Missing or invalid inputs for molality-solute-mass, molality-solvent-mass, molality-molar-mass");
        }
        if (molarMass <= 0) {
            throw new Error("Molar mass must be positive");
        }
        if (solventMass <= 0) {
            throw new Error("Solvent mass must be positive");
        }
        if (soluteMass < 0) {
            throw new Error("Solute mass cannot be negative");
        }
        let moles = soluteMass / molarMass;
        result = moles / (solventMass / 1000);
        formula = "m = (moles of solute)/(kg of solvent)";
        unit = "mol/kg";
        extra = "Moles of solute: " + formatter().format(moles, 4) + " mol; kg of solvent: " + formatter().format(solventMass / 1000, 4) + " kg";
    } else if (solveFor === "solute-mass") {
        if (isNaN(solventMass) || isNaN(molarMass) || isNaN(molalityValue)) {
            throw new Error("Missing or invalid inputs for molality-solvent-mass, molality-molar-mass, molality-value");
        }
        if (molarMass <= 0) {
            throw new Error("Molar mass must be positive");
        }
        if (solventMass <= 0) {
            throw new Error("Solvent mass must be positive");
        }
        if (molalityValue < 0) {
            throw new Error("Molality cannot be negative");
        }
        result = molalityValue * (solventMass / 1000) * molarMass;
        formula = "solute mass = m * (kg of solvent) * molar mass";
        unit = "g";
        extra = "Moles of solute needed: " + formatter().format(molalityValue * (solventMass / 1000), 4) + " mol";
    } else if (solveFor === "solvent-mass") {
        if (isNaN(soluteMass) || isNaN(molarMass) || isNaN(molalityValue)) {
            throw new Error("Missing or invalid inputs for molality-solute-mass, molality-molar-mass, molality-value");
        }
        if (molarMass <= 0) {
            throw new Error("Molar mass must be positive");
        }
        if (molalityValue <= 0) {
            throw new Error("Molality must be positive");
        }
        let moles = soluteMass / molarMass;
        result = (moles / molalityValue) * 1000;
        formula = "solvent mass (g) = (moles of solute / m) * 1000";
        unit = "g";
        extra = "Moles of solute: " + formatter().format(moles, 4) + " mol";
    } else if (solveFor === "molar-mass") {
        if (isNaN(soluteMass) || isNaN(solventMass) || isNaN(molalityValue)) {
            throw new Error("Missing or invalid inputs for molality-solute-mass, molality-solvent-mass, molality-value");
        }
        if (solventMass <= 0) {
            throw new Error("Solvent mass must be positive");
        }
        if (molalityValue <= 0) {
            throw new Error("Molality must be positive");
        }
        result = soluteMass / (molalityValue * (solventMass / 1000));
        formula = "molar mass = (solute mass)/(m * kg of solvent)";
        unit = "g/mol";
        extra = "Moles of solute: " + formatter().format(molalityValue * (solventMass / 1000), 4) + " mol";
    } else {
        throw new Error("Invalid solve-for selection");
    }
    let nf = formatter();
    return {
        value: nf.format(result, 4) + " " + unit,
        explanation: formula + " = " + nf.format(result, 4) + " " + unit + "; " + extra,
        metadata: { solveFor: solveFor, formula: formula, result: result, unit: unit }
    };
}
export function beerLambert(inputs: Record<string, string>): CalculatorResult {
    let solveFor = readText(inputs, "bl-solve-for") || "absorbance";
    let absorbance = readNumber(inputs, "bl-absorbance");
    let absorptivity = readNumber(inputs, "bl-absorptivity");
    let pathLength = readNumber(inputs, "bl-path-length");
    let concentration = readNumber(inputs, "bl-concentration");
    let result: number;
    let formula: string;
    let unit: string;
    let label: string;
    if (solveFor === "absorbance") {
        if (isNaN(absorptivity) || isNaN(pathLength) || isNaN(concentration)) {
            throw new Error("Missing or invalid inputs for bl-absorptivity, bl-path-length, bl-concentration");
        }
        if (absorptivity < 0) {
            throw new Error("Absorptivity cannot be negative");
        }
        if (pathLength < 0) {
            throw new Error("Path length cannot be negative");
        }
        if (concentration < 0) {
            throw new Error("Concentration cannot be negative");
        }
        result = absorptivity * pathLength * concentration;
        formula = "A = epsilon*b*c";
        unit = "";
        label = "Absorbance";
    } else if (solveFor === "absorptivity") {
        if (isNaN(absorbance) || isNaN(pathLength) || isNaN(concentration)) {
            throw new Error("Missing or invalid inputs for bl-absorbance, bl-path-length, bl-concentration");
        }
        if (absorbance < 0) {
            throw new Error("Absorbance cannot be negative");
        }
        if (pathLength <= 0) {
            throw new Error("Path length must be positive");
        }
        if (concentration <= 0) {
            throw new Error("Concentration must be positive");
        }
        result = absorbance / (pathLength * concentration);
        formula = "epsilon = A/(b*c)";
        unit = "L/(mol*cm)";
        label = "Absorptivity";
    } else if (solveFor === "path-length") {
        if (isNaN(absorbance) || isNaN(absorptivity) || isNaN(concentration)) {
            throw new Error("Missing or invalid inputs for bl-absorbance, bl-absorptivity, bl-concentration");
        }
        if (absorbance < 0) {
            throw new Error("Absorbance cannot be negative");
        }
        if (absorptivity <= 0) {
            throw new Error("Absorptivity must be positive");
        }
        if (concentration <= 0) {
            throw new Error("Concentration must be positive");
        }
        result = absorbance / (absorptivity * concentration);
        formula = "b = A/(epsilon*c)";
        unit = "cm";
        label = "Path length";
    } else if (solveFor === "concentration") {
        if (isNaN(absorbance) || isNaN(absorptivity) || isNaN(pathLength)) {
            throw new Error("Missing or invalid inputs for bl-absorbance, bl-absorptivity, bl-path-length");
        }
        if (absorbance < 0) {
            throw new Error("Absorbance cannot be negative");
        }
        if (absorptivity <= 0) {
            throw new Error("Absorptivity must be positive");
        }
        if (pathLength <= 0) {
            throw new Error("Path length must be positive");
        }
        result = absorbance / (absorptivity * pathLength);
        formula = "c = A/(epsilon*b)";
        unit = "mol/L";
        label = "Concentration";
    } else if (solveFor === "transmittance") {
        if (isNaN(absorbance)) {
            throw new Error("Missing or invalid input for bl-absorbance");
        }
        if (absorbance < 0) {
            throw new Error("Absorbance cannot be negative");
        }
        result = 100 * Math.pow(10, -absorbance);
        formula = "%T = 100*10^(-A)";
        unit = "%";
        label = "Transmittance";
    } else {
        throw new Error("Invalid solve-for selection");
    }
    let nf = formatter();
    let resultText = nf.format(result, 4);
    let valueText = label + ": " + resultText;
    if (unit !== "") {
        valueText += " " + unit;
    }
    let explanation = formula + " = " + resultText + (unit !== "" ? " " + unit : "");
    if (solveFor === "absorbance") {
        explanation += "; Transmittance %T = 100*10^(-A) = " + nf.format(100 * Math.pow(10, -result), 4) + " %";
    }
    if (solveFor === "transmittance") {
        explanation = "A = " + nf.format(absorbance, 4) + "; " + explanation;
    }
    return {
        value: valueText,
        explanation: explanation,
        metadata: { solveFor: solveFor, formula: formula, result: result, unit: unit }
    };
}

export function serialDilution(inputs: Record<string, string>): CalculatorResult {
    let initial = readNumber(inputs, "sd-initial-concentration");
    if (isNaN(initial)) {
        throw new Error("Missing or invalid input for sd-initial-concentration");
    }
    if (initial < 0) {
        throw new Error("Initial concentration cannot be negative");
    }
    let factor = readNumber(inputs, "sd-dilution-factor");
    if (isNaN(factor)) {
        throw new Error("Missing or invalid input for sd-dilution-factor");
    }
    if (factor <= 1) {
        throw new Error("Dilution factor must be greater than 1");
    }
    let steps = readNumber(inputs, "sd-steps");
    if (isNaN(steps) || steps !== Math.floor(steps) || steps < 1 || steps > MAX_DILUTION_STEPS) {
        throw new Error("Dilution steps must be a whole number between 1 and " + String(MAX_DILUTION_STEPS));
    }
    let concentrations: number[] = [initial];
    let current = initial;
    for (let i = 0; i < steps; i++) {
        current = current / factor;
        concentrations.push(current);
    }
    let totalDilution = Math.pow(factor, steps);
    let nf = formatter();
    let series = "";
    for (let i = 0; i < concentrations.length; i++) {
        if (i > 0) {
            series += "; ";
        }
        series += "C" + String(i) + " = " + formatConcentration(concentrations[i]) + " M";
    }
    let dilutionText: string;
    if (Number.isInteger(totalDilution)) {
        dilutionText = String(totalDilution);
    } else {
        dilutionText = nf.format(totalDilution, 4);
    }
    let factorText: string;
    if (Number.isInteger(factor)) {
        factorText = String(factor);
    } else {
        factorText = nf.format(factor, 4);
    }
    let explanation = series + "; " +
        "Total dilution factor: " + dilutionText + "; " +
        "Each step dilutes the sample " + factorText + "-fold";
    return {
        value: "Final concentration: " + formatConcentration(concentrations[steps]) + " M (total dilution " + dilutionText + "x)",
        explanation: explanation,
        metadata: {
            initialConcentration: initial,
            dilutionFactor: factor,
            steps: steps,
            finalConcentration: concentrations[steps],
            totalDilutionFactor: totalDilution,
            concentrations: concentrations
        }
    };
}

export function leChatelier(inputs: Record<string, string>): CalculatorResult {
    let reactionType = readText(inputs, "lc-reaction-type").trim();
    if (reactionType !== "exothermic" && reactionType !== "endothermic") {
        throw new Error("Reaction type must be exothermic or endothermic");
    }
    let stressType = readText(inputs, "lc-stress-type").trim();
    if (stressType !== "concentration" && stressType !== "temperature" && stressType !== "pressure" && stressType !== "volume" && stressType !== "catalyst") {
        throw new Error("Stress type must be concentration, temperature, pressure, volume, or catalyst");
    }
    let change = readText(inputs, "lc-change").trim();
    if (change !== "increase" && change !== "decrease" && change !== "none") {
        throw new Error("Change must be increase, decrease, or none");
    }
    let side = readText(inputs, "lc-side").trim();
    if (side !== "reactants" && side !== "products" && side !== "equal") {
        throw new Error("Side must be reactants, products, or equal");
    }
    let exothermic = reactionType === "exothermic";
    let shift = "no change";
    let kEffect = "unchanged";
    let reasoning: string;
    if (stressType === "catalyst") {
        reasoning = "A catalyst lowers the activation energy of the forward and reverse reactions equally, so it changes how fast equilibrium is reached but neither the position of equilibrium nor K";
    } else if (change === "none") {
        reasoning = "No change was applied, so the equilibrium stays where it is";
    } else if (stressType === "concentration") {
        if (side !== "reactants" && side !== "products") {
            throw new Error("Side must be reactants or products for a concentration change");
        }
        if ((change === "increase" && side === "reactants") || (change === "decrease" && side === "products")) {
            shift = "right";
            reasoning = change === "increase"
                ? "Adding reactant makes Q smaller than K, so the forward reaction runs faster until Q = K again"
                : "Removing product makes Q smaller than K, so the forward reaction runs faster until Q = K again";
        } else {
            shift = "left";
            reasoning = change === "increase"
                ? "Adding product makes Q larger than K, so the reverse reaction runs faster until Q = K again"
                : "Removing reactant makes Q larger than K, so the reverse reaction runs faster until Q = K again";
        }
        reasoning += "; K is unchanged because the equilibrium constant depends only on temperature";
    } else if (stressType === "temperature") {
        let forwardEndothermic = !exothermic;
        let favorsEndothermic = change === "increase";
        shift = favorsEndothermic === forwardEndothermic ? "right" : "left";
        kEffect = (change === "increase") === forwardEndothermic ? "increases" : "decreases";
        if (exothermic) {
            reasoning = change === "increase"
                ? "Heat is a product of an exothermic forward reaction, so adding heat shifts the equilibrium left, toward reactants (the endothermic direction)"
                : "Heat is a product of an exothermic forward reaction, so removing heat shifts the equilibrium right, toward products (the exothermic direction)";
        } else {
            reasoning = change === "increase"
                ? "Heat is a reactant of an endothermic forward reaction, so adding heat shifts the equilibrium right, toward products (the endothermic direction)"
                : "Heat is a reactant of an endothermic forward reaction, so removing heat shifts the equilibrium left, toward reactants (the exothermic direction)";
        }
        reasoning += "; K " + kEffect + " with temperature";
    } else {
        if (side === "equal") {
            reasoning = "Both sides hold the same number of moles of gas, so a pressure or volume change does not shift the equilibrium; K is unchanged";
        } else {
            let pressureRises = stressType === "pressure" ? change === "increase" : change === "decrease";
            let fewerSide = side;
            let target = pressureRises ? fewerSide : (side === "reactants" ? "products" : "reactants");
            shift = target === "products" ? "right" : "left";
            if (stressType === "pressure") {
                reasoning = change === "increase"
                    ? "Compressing the gas raises the pressure, so the equilibrium shifts toward the side with fewer moles of gas (" + fewerSide + ") to oppose the change"
                    : "Expanding the gas lowers the pressure, so the equilibrium shifts toward the side with more moles of gas, away from " + fewerSide;
            } else {
                reasoning = change === "decrease"
                    ? "Shrinking the volume raises the pressure, so the equilibrium shifts toward the side with fewer moles of gas (" + fewerSide + ") to oppose the change"
                    : "Growing the volume lowers the pressure, so the equilibrium shifts toward the side with more moles of gas, away from " + fewerSide;
            }
            reasoning += "; K is unchanged because the equilibrium constant depends only on temperature";
        }
    }
    let value = "Shift: " + shift + "; K " + kEffect;
    let explanation = "Reaction: " + reactionType + "; " + reasoning + "; " + value + ".";
    return {
        value: value,
        explanation: explanation,
        metadata: {
            reactionType: reactionType,
            stressType: stressType,
            change: change,
            side: side,
            shift: shift,
            equilibriumConstantEffect: kEffect,
            reasoning: reasoning
        }
    };
}