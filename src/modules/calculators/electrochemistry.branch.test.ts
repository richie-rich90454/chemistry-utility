import { describe, it, expect } from "vitest";
import { cellPotential, nernst, electrolysis } from "./electrochemistry.js";

describe("electrochemistry branches", function (): void {
    describe("cellPotential", function (): void {
        it("rejects missing potentials", function (): void {
            expect(function (): void {
                cellPotential({});
            }).toThrow("Please enter valid numbers for both potentials.");
        });
    });

    describe("nernst", function (): void {
        it("rejects missing and non-positive inputs", function (): void {
            expect(function (): void {
                nernst({ "E-standard": "0.34" });
            }).toThrow("Please enter valid positive numbers for all fields.");
        });

        it("rejects a fractional electron count", function (): void {
            expect(function (): void {
                nernst({ "E-standard": "0.34", "temperature": "298", "n-electrons": "2.5", "Q-reaction": "0.01" });
            }).toThrow("Number of electrons must be an integer");
        });
    });

    describe("electrolysis", function (): void {
        it("rejects a missing solve-for selection", function (): void {
            expect(function (): void {
                electrolysis({});
            }).toThrow("Invalid solve-for selection");
        });

        it("rejects missing inputs when solving for mass", function (): void {
            expect(function (): void {
                electrolysis({ "electrolysis-solve-for": "mass", "electrolysis-I": "2" });
            }).toThrow("Please enter valid positive numbers for I, t, z, and M.");
        });

        it("rejects a fractional charge when solving for mass", function (): void {
            expect(function (): void {
                electrolysis({
                    "electrolysis-solve-for": "mass",
                    "electrolysis-I": "2",
                    "electrolysis-t": "1800",
                    "electrolysis-z": "2.5",
                    "electrolysis-M": "63.5"
                });
            }).toThrow("Charge number z must be an integer");
        });

        it("rejects missing inputs when solving for current", function (): void {
            expect(function (): void {
                electrolysis({ "electrolysis-solve-for": "current", "electrolysis-t": "1800" });
            }).toThrow("Please enter valid positive numbers for m, t, z, and M.");
        });

        it("rejects a fractional charge when solving for current", function (): void {
            expect(function (): void {
                electrolysis({
                    "electrolysis-solve-for": "current",
                    "electrolysis-m": "10",
                    "electrolysis-t": "1800",
                    "electrolysis-z": "2.5",
                    "electrolysis-M": "63.5"
                });
            }).toThrow("Charge number z must be an integer");
        });

        it("rejects missing inputs when solving for time", function (): void {
            expect(function (): void {
                electrolysis({ "electrolysis-solve-for": "time", "electrolysis-I": "2" });
            }).toThrow("Please enter valid positive numbers for m, I, z, and M.");
        });

        it("rejects a fractional charge when solving for time", function (): void {
            expect(function (): void {
                electrolysis({
                    "electrolysis-solve-for": "time",
                    "electrolysis-m": "10",
                    "electrolysis-I": "2",
                    "electrolysis-z": "2.5",
                    "electrolysis-M": "63.5"
                });
            }).toThrow("Charge number z must be an integer");
        });
    });
});
