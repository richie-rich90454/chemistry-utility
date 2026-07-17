import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    calculateGibbsFreeEnergy,
    calculateHessLaw,
    calculateEntropy,
    calculateHeatCapacity,
    calculateBondEnthalpy,
    calculateBornHaberCycle,
} from "./thermodynamicsCalculators.js";
import { setOrCreateInput, setOrCreateSelect, getResultHTML } from "../test/helpers.js";

describe("thermodynamicsCalculators", () => {
    beforeEach(() => {
        // Gibbs section
        const gibbsDiv = document.createElement("div");
        gibbsDiv.id = "gibbs-free-energy";
        const gibbsResult = document.createElement("div");
        gibbsResult.id = "gibbs-result";
        gibbsDiv.appendChild(gibbsResult);
        document.body.appendChild(gibbsDiv);

        // Hess section
        const hessDiv = document.createElement("div");
        hessDiv.id = "hess-law";
        const hessResult = document.createElement("div");
        hessResult.id = "hess-result";
        hessDiv.appendChild(hessResult);
        document.body.appendChild(hessDiv);

        // Entropy section
        const entropyDiv = document.createElement("div");
        entropyDiv.id = "entropy-change";
        const entropyResult = document.createElement("div");
        entropyResult.id = "entropy-result";
        entropyDiv.appendChild(entropyResult);
        document.body.appendChild(entropyDiv);

        // Heat capacity section
        const heatCapDiv = document.createElement("div");
        heatCapDiv.id = "heat-capacity";
        const heatCapResult = document.createElement("div");
        heatCapResult.id = "heat-capacity-result";
        heatCapDiv.appendChild(heatCapResult);
        document.body.appendChild(heatCapDiv);

        // Bond enthalpy section
        const bondDiv = document.createElement("div");
        bondDiv.id = "bond-enthalpy";
        const bondResult = document.createElement("div");
        bondResult.id = "bond-enthalpy-result";
        bondDiv.appendChild(bondResult);
        document.body.appendChild(bondDiv);

        // Born-Haber section
        const bornHaberDiv = document.createElement("div");
        bornHaberDiv.id = "born-haber";
        const bornHaberResult = document.createElement("div");
        bornHaberResult.id = "born-haber-result";
        bornHaberDiv.appendChild(bornHaberResult);
        document.body.appendChild(bornHaberDiv);
    });

    afterEach(() => {
        ["gibbs-free-energy", "hess-law", "entropy-change", "heat-capacity", "bond-enthalpy", "born-haber"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    });

    describe("GibbsFreeEnergyCalculator", () => {
        it("should calculate spontaneous reaction (negative ΔG)", () => {
            setOrCreateInput("gibbs-deltaH", "-100", "gibbs-free-energy");
            setOrCreateInput("gibbs-deltaS", "200", "gibbs-free-energy");
            setOrCreateInput("gibbs-T", "298", "gibbs-free-energy");
            calculateGibbsFreeEnergy();
            const html = getResultHTML("gibbs-result");
            // ΔG = -100 - 298 * 0.200 = -159.6
            expect(html).toContain("-159.6");
            expect(html).toContain("Spontaneous");
        });

        it("should calculate non-spontaneous reaction (positive ΔG)", () => {
            setOrCreateInput("gibbs-deltaH", "100", "gibbs-free-energy");
            setOrCreateInput("gibbs-deltaS", "-200", "gibbs-free-energy");
            setOrCreateInput("gibbs-T", "298", "gibbs-free-energy");
            calculateGibbsFreeEnergy();
            const html = getResultHTML("gibbs-result");
            // ΔG = 100 - 298 * (-0.200) = 100 + 59.6 = 159.6
            expect(html).toContain("159.6");
            expect(html).toContain("Non-spontaneous");
        });

        it("should calculate equilibrium (ΔG = 0)", () => {
            // ΔG = ΔH - TΔS = 0 → T = ΔH/ΔS
            // If ΔH = -100 and ΔS = -100, then T = 1000 gives ΔG = -100 - 1000*(-0.1) = -100 + 100 = 0
            setOrCreateInput("gibbs-deltaH", "-100", "gibbs-free-energy");
            setOrCreateInput("gibbs-deltaS", "-100", "gibbs-free-energy");
            setOrCreateInput("gibbs-T", "1000", "gibbs-free-energy");
            calculateGibbsFreeEnergy();
            const html = getResultHTML("gibbs-result");
            expect(html).toContain("Equilibrium");
        });

        it("should show error for missing inputs", () => {
            setOrCreateInput("gibbs-deltaH", "", "gibbs-free-energy");
            setOrCreateInput("gibbs-deltaS", "200", "gibbs-free-energy");
            setOrCreateInput("gibbs-T", "298", "gibbs-free-energy");
            calculateGibbsFreeEnergy();
            const html = getResultHTML("gibbs-result");
            expect(html).toContain("Error");
        });
    });

    describe("HessLawCalculator", () => {
        it("should sum 2 enthalpy values", () => {
            setOrCreateInput("hess-steps", "-100,50", "hess-law", "text");
            calculateHessLaw();
            const html = getResultHTML("hess-result");
            expect(html).toContain("-50");
        });

        it("should sum 3 enthalpy values", () => {
            setOrCreateInput("hess-steps", "-100,50,-200", "hess-law", "text");
            calculateHessLaw();
            const html = getResultHTML("hess-result");
            expect(html).toContain("-250");
        });

        it("should handle negative values", () => {
            setOrCreateInput("hess-steps", "-50,-75", "hess-law", "text");
            calculateHessLaw();
            const html = getResultHTML("hess-result");
            expect(html).toContain("-125");
        });

        it("should show error for single value", () => {
            setOrCreateInput("hess-steps", "100", "hess-law", "text");
            calculateHessLaw();
            const html = getResultHTML("hess-result");
            expect(html).toContain("At least 2");
        });

        it("should show error for empty input", () => {
            setOrCreateInput("hess-steps", "", "hess-law", "text");
            calculateHessLaw();
            const html = getResultHTML("hess-result");
            expect(html).toContain("Error");
        });
    });

    describe("EntropyCalculator", () => {
        it("should calculate positive ΔS", () => {
            setOrCreateInput("entropy-products", "200,150", "entropy-change", "text");
            setOrCreateInput("entropy-reactants", "100,50", "entropy-change", "text");
            calculateEntropy();
            const html = getResultHTML("entropy-result");
            // ΔS = (200+150) - (100+50) = 200
            expect(html).toContain("200");
        });

        it("should calculate negative ΔS", () => {
            setOrCreateInput("entropy-products", "50", "entropy-change", "text");
            setOrCreateInput("entropy-reactants", "200,150", "entropy-change", "text");
            calculateEntropy();
            const html = getResultHTML("entropy-result");
            // ΔS = 50 - (200+150) = -300
            expect(html).toContain("-300");
        });

        it("should show error for empty inputs", () => {
            setOrCreateInput("entropy-products", "", "entropy-change", "text");
            setOrCreateInput("entropy-reactants", "100", "entropy-change", "text");
            calculateEntropy();
            const html = getResultHTML("entropy-result");
            expect(html).toContain("Error");
        });
    });

    describe("HeatCapacityCalculator", () => {
        function setupHeatCapInputs(solveFor: string, values: {
            mass?: string; specificHeat?: string;
            initialTemp?: string; finalTemp?: string; heat?: string;
        }) {
            setOrCreateSelect("heat-cap-solve-for", solveFor, "heat-capacity", ["q", "c", "deltaT", "Tfinal"]);
            setOrCreateInput("heat-cap-mass", values.mass ?? "", "heat-capacity");
            setOrCreateInput("heat-cap-specific-heat", values.specificHeat ?? "", "heat-capacity");
            setOrCreateInput("heat-cap-initial-temp", values.initialTemp ?? "", "heat-capacity");
            setOrCreateInput("heat-cap-final-temp", values.finalTemp ?? "", "heat-capacity");
            setOrCreateInput("heat-cap-heat", values.heat ?? "", "heat-capacity");
        }

        it("should solve for q (heat)", () => {
            setupHeatCapInputs("q", { mass: "100", specificHeat: "4.184", initialTemp: "25", finalTemp: "75" });
            calculateHeatCapacity();
            const html = getResultHTML("heat-capacity-result");
            // q = 100 * 4.184 * (75-25) = 20920
            expect(html).toContain("20920");
        });

        it("should solve for c (specific heat)", () => {
            setupHeatCapInputs("c", { mass: "100", initialTemp: "25", finalTemp: "75", heat: "20920" });
            calculateHeatCapacity();
            const html = getResultHTML("heat-capacity-result");
            // c = 20920 / (100 * 50) = 4.184
            expect(html).toContain("4.184");
        });

        it("should solve for ΔT (temperature change)", () => {
            setupHeatCapInputs("deltaT", { mass: "100", specificHeat: "4.184", heat: "20920" });
            calculateHeatCapacity();
            const html = getResultHTML("heat-capacity-result");
            // ΔT = 20920 / (100 * 4.184) = 50
            expect(html).toContain("50");
        });

        it("should solve for final temperature", () => {
            setupHeatCapInputs("Tfinal", { mass: "100", specificHeat: "4.184", initialTemp: "25", heat: "20920" });
            calculateHeatCapacity();
            const html = getResultHTML("heat-capacity-result");
            // Tfinal = 25 + 20920/(100*4.184) = 25 + 50 = 75
            expect(html).toContain("75");
        });

        it("should show error for invalid solve-for selection", () => {
            setupHeatCapInputs("invalid", { mass: "100", specificHeat: "4.184", initialTemp: "25", finalTemp: "75" });
            calculateHeatCapacity();
            const html = getResultHTML("heat-capacity-result");
            expect(html).toContain("Error");
            expect(html).toContain("Invalid solve-for");
        });

        it("should show error when mass <= 0 solving for q", () => {
            setupHeatCapInputs("q", { mass: "0", specificHeat: "4.184", initialTemp: "25", finalTemp: "75" });
            calculateHeatCapacity();
            const html = getResultHTML("heat-capacity-result");
            expect(html).toContain("Error");
            expect(html).toContain("Mass must be positive");
        });

        it("should show error when specific heat <= 0 solving for q", () => {
            setupHeatCapInputs("q", { mass: "100", specificHeat: "0", initialTemp: "25", finalTemp: "75" });
            calculateHeatCapacity();
            const html = getResultHTML("heat-capacity-result");
            expect(html).toContain("Error");
            expect(html).toContain("Specific heat must be positive");
        });

        it("should show error when mass <= 0 solving for deltaT", () => {
            setupHeatCapInputs("deltaT", { mass: "0", specificHeat: "4.184", heat: "20920" });
            calculateHeatCapacity();
            const html = getResultHTML("heat-capacity-result");
            expect(html).toContain("Error");
            expect(html).toContain("Mass must be positive");
        });

        it("should show error when specific heat <= 0 solving for Tfinal", () => {
            setupHeatCapInputs("Tfinal", { mass: "100", specificHeat: "0", initialTemp: "25", heat: "20920" });
            calculateHeatCapacity();
            const html = getResultHTML("heat-capacity-result");
            expect(html).toContain("Error");
            expect(html).toContain("Specific heat must be positive");
        });
    });

    describe("BondEnthalpyCalculator", () => {
        it("should calculate exothermic reaction", () => {
            // Bonds broken: O=O (495), H-H:2 (436*2=872) → total = 1367
            // Bonds formed: O-H:4 (463*4=1852) → total = 1852
            // ΔH = 1367 - 1852 = -485 (exothermic)
            setOrCreateInput("bond-enthalpy-broken", "O=O,H-H:2", "bond-enthalpy", "text");
            setOrCreateInput("bond-enthalpy-formed", "O-H:4", "bond-enthalpy", "text");
            calculateBondEnthalpy();
            const html = getResultHTML("bond-enthalpy-result");
            expect(html).toContain("-485");
            expect(html).toContain("Exothermic");
        });

        it("should calculate endothermic reaction", () => {
            // Bonds broken: C-H:4 (413*4=1652), C-C (348) → total = 2000
            // Bonds formed: C=C (614), H-H:2 (436*2=872) → total = 1486
            // ΔH = 2000 - 1486 = 514 (endothermic)
            setOrCreateInput("bond-enthalpy-broken", "C-H:4,C-C", "bond-enthalpy", "text");
            setOrCreateInput("bond-enthalpy-formed", "C=C,H-H:2", "bond-enthalpy", "text");
            calculateBondEnthalpy();
            const html = getResultHTML("bond-enthalpy-result");
            expect(html).toContain("514");
            expect(html).toContain("Endothermic");
        });

        it("should calculate thermoneutral reaction when deltaH is zero", () => {
            // Bonds broken: C-H (413) → total = 413
            // Bonds formed: C-H (413) → total = 413
            // ΔH = 413 - 413 = 0 (thermoneutral)
            setOrCreateInput("bond-enthalpy-broken", "C-H", "bond-enthalpy", "text");
            setOrCreateInput("bond-enthalpy-formed", "C-H", "bond-enthalpy", "text");
            calculateBondEnthalpy();
            const html = getResultHTML("bond-enthalpy-result");
            expect(html).toContain("Thermoneutral");
        });

        it("should show error for unknown bond type", () => {
            setOrCreateInput("bond-enthalpy-broken", "X-Y", "bond-enthalpy", "text");
            setOrCreateInput("bond-enthalpy-formed", "C-H", "bond-enthalpy", "text");
            calculateBondEnthalpy();
            const html = getResultHTML("bond-enthalpy-result");
            expect(html).toContain("Unknown bond type");
        });

        it("should show error for empty inputs", () => {
            setOrCreateInput("bond-enthalpy-broken", "", "bond-enthalpy", "text");
            setOrCreateInput("bond-enthalpy-formed", "C-H", "bond-enthalpy", "text");
            calculateBondEnthalpy();
            const html = getResultHTML("bond-enthalpy-result");
            expect(html).toContain("Error");
        });

        it("should show error when only formed bonds input is empty", () => {
            setOrCreateInput("bond-enthalpy-broken", "C-H", "bond-enthalpy", "text");
            setOrCreateInput("bond-enthalpy-formed", "", "bond-enthalpy", "text");
            calculateBondEnthalpy();
            const html = getResultHTML("bond-enthalpy-result");
            expect(html).toContain("Error");
            expect(html).toContain("both broken and formed");
        });

        it("should show error for invalid count in bond entry", () => {
            setOrCreateInput("bond-enthalpy-broken", "C-H:abc", "bond-enthalpy", "text");
            setOrCreateInput("bond-enthalpy-formed", "C-H", "bond-enthalpy", "text");
            calculateBondEnthalpy();
            const html = getResultHTML("bond-enthalpy-result");
            expect(html).toContain("Error");
            expect(html).toContain("Invalid count");
        });

        it("should handle bond entry without explicit count (defaults to 1)", () => {
            // C-H without count defaults to 1, so broken = 413, formed = 413
            setOrCreateInput("bond-enthalpy-broken", "C-H", "bond-enthalpy", "text");
            setOrCreateInput("bond-enthalpy-formed", "C-H:1", "bond-enthalpy", "text");
            calculateBondEnthalpy();
            const html = getResultHTML("bond-enthalpy-result");
            expect(html).toContain("Thermoneutral");
        });

        it("should skip empty entries in bond list", () => {
            // Empty entries between commas should be skipped
            setOrCreateInput("bond-enthalpy-broken", "C-H,,", "bond-enthalpy", "text");
            setOrCreateInput("bond-enthalpy-formed", "C-H", "bond-enthalpy", "text");
            calculateBondEnthalpy();
            const html = getResultHTML("bond-enthalpy-result");
            expect(html).toContain("Thermoneutral");
        });
    });

    describe("BornHaberCycleCalculator", () => {
        it("should calculate NaCl lattice energy", () => {
            // NaCl: ΔHf=-411, ΔHsub=108, IE=496, ΔHdiss=244, EA=-349
            // U = -411 - 108 - 496 - 122 - (-349) = -788
            setOrCreateInput("born-haber-dHf", "-411", "born-haber");
            setOrCreateInput("born-haber-dHsub", "108", "born-haber");
            setOrCreateInput("born-haber-IE", "496", "born-haber");
            setOrCreateInput("born-haber-dHdiss", "244", "born-haber");
            setOrCreateInput("born-haber-EA", "-349", "born-haber");
            calculateBornHaberCycle();
            const html = getResultHTML("born-haber-result");
            // U = -411 - 108 - 496 - 122 - (-349) = -788
            expect(html).toContain("-788");
        });

        it("should show error for missing inputs", () => {
            setOrCreateInput("born-haber-dHf", "", "born-haber");
            setOrCreateInput("born-haber-dHsub", "108", "born-haber");
            setOrCreateInput("born-haber-IE", "496", "born-haber");
            setOrCreateInput("born-haber-dHdiss", "244", "born-haber");
            setOrCreateInput("born-haber-EA", "-349", "born-haber");
            calculateBornHaberCycle();
            const html = getResultHTML("born-haber-result");
            expect(html).toContain("Error");
        });
    });
});
