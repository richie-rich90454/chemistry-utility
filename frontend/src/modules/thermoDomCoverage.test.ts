// @vitest-environment jsdom
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {
    calculateGibbsFreeEnergy,
    calculateHessLaw,
    calculateEntropy,
    calculateHeatCapacity,
    calculateBondEnthalpy,
    calculateBornHaberCycle,
} from "./thermodynamicsCalculators.js";
import {setOrCreateInput, setOrCreateSelect, getResultHTML} from "../test/helpers.js";

function setupSections(): void {
    document.body.innerHTML = "";
    for (const [sec, res] of [
        ["gibbs-free-energy", "gibbs-result"],
        ["hess-law", "hess-result"],
        ["entropy-change", "entropy-result"],
        ["heat-capacity", "heat-capacity-result"],
        ["bond-enthalpy", "bond-enthalpy-result"],
        ["born-haber", "born-haber-result"],
    ] as Array<[string, string]>) {
        const div = document.createElement("div");
        div.id = sec;
        const r = document.createElement("div");
        r.id = res;
        div.appendChild(r);
        document.body.appendChild(div);
    }
}

describe("thermoDomCoverage: Gibbs DOM", () => {
    beforeEach(setupSections);
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects missing and negative T", () => {
        setOrCreateInput("gibbs-deltaH", "", "gibbs-free-energy");
        setOrCreateInput("gibbs-deltaS", "200", "gibbs-free-energy");
        setOrCreateInput("gibbs-T", "298", "gibbs-free-energy");
        calculateGibbsFreeEnergy();
        expect(getResultHTML("gibbs-result")).toContain("Error");
        setOrCreateInput("gibbs-deltaH", "-100", "gibbs-free-energy");
        setOrCreateInput("gibbs-deltaS", "200", "gibbs-free-energy");
        setOrCreateInput("gibbs-T", "-1", "gibbs-free-energy");
        calculateGibbsFreeEnergy();
        expect(getResultHTML("gibbs-result")).toContain("Error");
        setOrCreateInput("gibbs-deltaH", "100", "gibbs-free-energy");
        setOrCreateInput("gibbs-deltaS", "-200", "gibbs-free-energy");
        setOrCreateInput("gibbs-T", "298", "gibbs-free-energy");
        calculateGibbsFreeEnergy();
        expect(getResultHTML("gibbs-result")).toContain("Non-spontaneous");
        setOrCreateInput("gibbs-deltaH", "-100", "gibbs-free-energy");
        setOrCreateInput("gibbs-deltaS", "-100", "gibbs-free-energy");
        setOrCreateInput("gibbs-T", "1000", "gibbs-free-energy");
        calculateGibbsFreeEnergy();
        expect(getResultHTML("gibbs-result")).toContain("Equilibrium");
    });
});

describe("thermoDomCoverage: Hess DOM", () => {
    beforeEach(setupSections);
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects empty and bad steps", () => {
        setOrCreateInput("hess-steps", "", "hess-law", "text");
        calculateHessLaw();
        expect(getResultHTML("hess-result")).toContain("Error");
        setOrCreateInput("hess-steps", "abc", "hess-law", "text");
        calculateHessLaw();
        expect(getResultHTML("hess-result")).toContain("Error");
        setOrCreateInput("hess-steps", "1,2,3,4,5,6,7,8,9,10,11", "hess-law", "text");
        calculateHessLaw();
        expect(getResultHTML("hess-result")).toContain("Error");
        setOrCreateInput("hess-steps", "10,abc", "hess-law", "text");
        calculateHessLaw();
        expect(getResultHTML("hess-result")).toContain("Error");
    });
});

describe("thermoDomCoverage: Entropy DOM", () => {
    beforeEach(setupSections);
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects bad inputs", () => {
        setOrCreateInput("entropy-products", "", "entropy-change", "text");
        setOrCreateInput("entropy-reactants", "50", "entropy-change", "text");
        calculateEntropy();
        expect(getResultHTML("entropy-result")).toContain("Error");
        setOrCreateInput("entropy-products", "abc", "entropy-change", "text");
        setOrCreateInput("entropy-reactants", "50", "entropy-change", "text");
        calculateEntropy();
        expect(getResultHTML("entropy-result")).toContain("Error");
        setOrCreateInput("entropy-products", "100", "entropy-change", "text");
        setOrCreateInput("entropy-reactants", "", "entropy-change", "text");
        calculateEntropy();
        expect(getResultHTML("entropy-result")).toContain("Error");
        setOrCreateInput("entropy-products", "100", "entropy-change", "text");
        setOrCreateInput("entropy-reactants", "abc", "entropy-change", "text");
        calculateEntropy();
        expect(getResultHTML("entropy-result")).toContain("Error");
    });
});

describe("thermoDomCoverage: HeatCapacity DOM", () => {
    beforeEach(setupSections);
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects bad solveFor and inputs", () => {
        setOrCreateSelect("heat-cap-solve-for", "bogus", "heat-capacity", ["q", "c", "deltaT", "Tfinal", "bogus"]);
        setOrCreateInput("heat-cap-mass", "100", "heat-capacity");
        setOrCreateInput("heat-cap-specific-heat", "4.18", "heat-capacity");
        setOrCreateInput("heat-cap-initial-temp", "20", "heat-capacity");
        setOrCreateInput("heat-cap-final-temp", "30", "heat-capacity");
        setOrCreateInput("heat-cap-heat", "", "heat-capacity");
        calculateHeatCapacity();
        expect(getResultHTML("heat-capacity-result")).toContain("Error");
        setOrCreateSelect("heat-cap-solve-for", "q", "heat-capacity", ["q", "c", "deltaT", "Tfinal", "bogus"]);
        setOrCreateInput("heat-cap-mass", "0", "heat-capacity");
        calculateHeatCapacity();
        expect(getResultHTML("heat-capacity-result")).toContain("Error");
        setOrCreateSelect("heat-cap-solve-for", "c", "heat-capacity", ["q", "c", "deltaT", "Tfinal", "bogus"]);
        setOrCreateInput("heat-cap-mass", "100", "heat-capacity");
        setOrCreateInput("heat-cap-specific-heat", "", "heat-capacity");
        setOrCreateInput("heat-cap-initial-temp", "20", "heat-capacity");
        setOrCreateInput("heat-cap-final-temp", "20", "heat-capacity");
        setOrCreateInput("heat-cap-heat", "4180", "heat-capacity");
        calculateHeatCapacity();
        expect(getResultHTML("heat-capacity-result")).toContain("Error");
        setOrCreateSelect("heat-cap-solve-for", "c", "heat-capacity", ["q", "c", "deltaT", "Tfinal", "bogus"]);
        setOrCreateInput("heat-cap-mass", "0", "heat-capacity");
        setOrCreateInput("heat-cap-specific-heat", "", "heat-capacity");
        setOrCreateInput("heat-cap-initial-temp", "20", "heat-capacity");
        setOrCreateInput("heat-cap-final-temp", "30", "heat-capacity");
        setOrCreateInput("heat-cap-heat", "4180", "heat-capacity");
        calculateHeatCapacity();
        expect(getResultHTML("heat-capacity-result")).toContain("Error");
        setOrCreateSelect("heat-cap-solve-for", "Tfinal", "heat-capacity", ["q", "c", "deltaT", "Tfinal", "bogus"]);
        setOrCreateInput("heat-cap-mass", "100", "heat-capacity");
        setOrCreateInput("heat-cap-specific-heat", "0", "heat-capacity");
        setOrCreateInput("heat-cap-initial-temp", "20", "heat-capacity");
        setOrCreateInput("heat-cap-heat", "4180", "heat-capacity");
        calculateHeatCapacity();
        expect(getResultHTML("heat-capacity-result")).toContain("Error");
        setOrCreateSelect("heat-cap-solve-for", "Tfinal", "heat-capacity", ["q", "c", "deltaT", "Tfinal", "bogus"]);
        setOrCreateInput("heat-cap-mass", "0", "heat-capacity");
        setOrCreateInput("heat-cap-specific-heat", "4.18", "heat-capacity");
        setOrCreateInput("heat-cap-initial-temp", "20", "heat-capacity");
        setOrCreateInput("heat-cap-heat", "4180", "heat-capacity");
        calculateHeatCapacity();
        expect(getResultHTML("heat-capacity-result")).toContain("Error");
        setOrCreateSelect("heat-cap-solve-for", "deltaT", "heat-capacity", ["q", "c", "deltaT", "Tfinal", "bogus"]);
        setOrCreateInput("heat-cap-mass", "100", "heat-capacity");
        setOrCreateInput("heat-cap-specific-heat", "4.18", "heat-capacity");
        setOrCreateInput("heat-cap-initial-temp", "", "heat-capacity");
        setOrCreateInput("heat-cap-final-temp", "", "heat-capacity");
        setOrCreateInput("heat-cap-heat", "4180", "heat-capacity");
        calculateHeatCapacity();
        expect(getResultHTML("heat-capacity-result")).toContain("10");
        setOrCreateSelect("heat-cap-solve-for", "deltaT", "heat-capacity", ["q", "c", "deltaT", "Tfinal", "bogus"]);
        setOrCreateInput("heat-cap-mass", "100", "heat-capacity");
        setOrCreateInput("heat-cap-specific-heat", "0", "heat-capacity");
        setOrCreateInput("heat-cap-heat", "4180", "heat-capacity");
        calculateHeatCapacity();
        expect(getResultHTML("heat-capacity-result")).toContain("Error");
    });
});

describe("thermoDomCoverage: BondEnthalpy DOM", () => {
    beforeEach(setupSections);
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects bad inputs", () => {
        setOrCreateInput("bond-enthalpy-broken", "", "bond-enthalpy", "text");
        setOrCreateInput("bond-enthalpy-formed", "O-H:4", "bond-enthalpy", "text");
        calculateBondEnthalpy();
        expect(getResultHTML("bond-enthalpy-result")).toContain("Error");
        setOrCreateInput("bond-enthalpy-broken", "abc", "bond-enthalpy", "text");
        calculateBondEnthalpy();
        expect(getResultHTML("bond-enthalpy-result")).toContain("Error");
    });
});

describe("thermoDomCoverage: BornHaber DOM", () => {
    beforeEach(setupSections);
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects missing inputs", () => {
        setOrCreateInput("born-haber-dHf", "", "born-haber");
        setOrCreateInput("born-haber-dHsub", "108", "born-haber");
        setOrCreateInput("born-haber-IE", "496", "born-haber");
        setOrCreateInput("born-haber-dHdiss", "244", "born-haber");
        setOrCreateInput("born-haber-EA", "-349", "born-haber");
        calculateBornHaberCycle();
        expect(getResultHTML("born-haber-result")).toContain("Error");
    });
});
