// @vitest-environment jsdom
import {describe, it, expect, afterEach} from "vitest";
import {
    GibbsFreeEnergyCalculator,
    HessLawCalculator,
    EntropyCalculator,
    HeatCapacityCalculator,
    BondEnthalpyCalculator,
    BornHaberCycleCalculator,
} from "./thermodynamicsCalculators.js";

function setup(id: string): void {
    document.body.innerHTML = "";
    const el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
}

describe("thermoCoverage: pure missing-key fallbacks", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("covers ?? fallbacks with empty input records", () => {
        setup("gibbs-result");
        expect(new GibbsFreeEnergyCalculator().calculatePure({}).explanation).toContain("Error");
        setup("hess-result");
        expect(new HessLawCalculator().calculatePure({}).explanation).toContain("Error");
        setup("entropy-result");
        expect(new EntropyCalculator().calculatePure({}).explanation).toContain("Error");
        setup("heat-capacity-result");
        expect(new HeatCapacityCalculator().calculatePure({}).explanation).toContain("Error");
        setup("bond-enthalpy-result");
        expect(new BondEnthalpyCalculator().calculatePure({}).explanation).toContain("Error");
        setup("born-haber-result");
        expect(new BornHaberCycleCalculator().calculatePure({}).explanation).toContain("Error");
    });
});

describe("thermoCoverage: Gibbs pure validation", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(H: string, S: string, T: string) {
        setup("gibbs-result");
        return new GibbsFreeEnergyCalculator().calculatePure({"gibbs-deltaH": H, "gibbs-deltaS": S, "gibbs-T": T});
    }

    it("computes spontaneity and rejects bad inputs", () => {
        expect(pure("-100", "200", "298").value).toContain("kJ");
        expect(pure("100", "-200", "298").value).toContain("Non-spontaneous");
        expect(pure("-100", "-100", "1000").value).toContain("Equilibrium");
        expect(pure("", "200", "298").explanation).toContain("Error");
        expect(pure("-100", "", "298").explanation).toContain("Error");
        expect(pure("-100", "200", "").explanation).toContain("Error");
        expect(pure("-100", "200", "-1").explanation).toContain("Error");
    });
});

describe("thermoCoverage: Hess pure validation", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(steps: string) {
        setup("hess-result");
        return new HessLawCalculator().calculatePure({"hess-steps": steps});
    }

    it("sums and rejects bad steps", () => {
        expect(pure("-100,50").value).toContain("-50");
        expect(pure("").explanation).toContain("Error");
        expect(pure("abc").explanation).toContain("Error");
        expect(pure("10,abc").explanation).toContain("Error");
        expect(pure("1,2,3,4,5,6,7,8,9,10,11").explanation).toContain("Error");
    });
});

describe("thermoCoverage: Entropy pure validation", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(products: string, reactants: string) {
        setup("entropy-result");
        return new EntropyCalculator().calculatePure({"entropy-products": products, "entropy-reactants": reactants});
    }

    it("computes and rejects bad inputs", () => {
        expect(pure("100,200", "50,60").value).not.toBe("");
        expect(pure("", "50").explanation).toContain("Error");
        expect(pure("100", "").explanation).toContain("Error");
        expect(pure("abc", "50").explanation).toContain("Error");
        expect(pure("100", "abc").explanation).toContain("Error");
    });
});

describe("thermoCoverage: HeatCapacity pure branches", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(solveFor: string, mass: string, c: string, ti: string, tf: string, q: string) {
        setup("heat-capacity-result");
        return new HeatCapacityCalculator().calculatePure({
            "heat-cap-solve-for": solveFor,
            "heat-cap-mass": mass,
            "heat-cap-specific-heat": c,
            "heat-cap-initial-temp": ti,
            "heat-cap-final-temp": tf,
            "heat-cap-heat": q,
        });
    }

    it("solves each variable and rejects bad solveFor", () => {
        expect(pure("q", "100", "4.18", "20", "30", "").value).not.toBe("");
        expect(pure("c", "100", "", "20", "30", "4180").value).not.toBe("");
        expect(pure("deltaT", "100", "4.18", "", "", "4180").value).not.toBe("");
        expect(pure("Tfinal", "100", "4.18", "20", "", "4180").value).not.toBe("");
        expect(pure("bogus", "100", "4.18", "20", "30", "").explanation).toContain("Error");
    });

    it("rejects missing and non-positive inputs", () => {
        expect(pure("q", "", "4.18", "20", "30", "").explanation).toContain("Error");
        expect(pure("q", "0", "4.18", "20", "30", "").explanation).toContain("Error");
        expect(pure("q", "100", "0", "20", "30", "").explanation).toContain("Error");
        expect(pure("c", "100", "", "20", "30", "").explanation).toContain("Error");
        expect(pure("c", "0", "", "20", "30", "4180").explanation).toContain("Error");
        expect(pure("c", "100", "", "20", "20", "4180").explanation).toContain("Error");
        expect(pure("deltaT", "", "4.18", "", "", "4180").explanation).toContain("Error");
        expect(pure("deltaT", "0", "4.18", "", "", "4180").explanation).toContain("Error");
        expect(pure("deltaT", "100", "0", "", "", "4180").explanation).toContain("Error");
        expect(pure("Tfinal", "", "4.18", "20", "", "4180").explanation).toContain("Error");
        expect(pure("Tfinal", "0", "4.18", "20", "", "4180").explanation).toContain("Error");
        expect(pure("Tfinal", "100", "0", "20", "", "4180").explanation).toContain("Error");
    });
});

describe("thermoCoverage: BondEnthalpy pure validation", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(broken: string, formed: string) {
        setup("bond-enthalpy-result");
        return new BondEnthalpyCalculator().calculatePure({"bond-enthalpy-broken": broken, "bond-enthalpy-formed": formed});
    }

    it("computes and rejects bad inputs", () => {
        expect(pure("O=O,H-H:2", "O-H:4").value).toContain("Exothermic");
        expect(pure("O-H:4", "O=O,H-H:2").value).toContain("Endothermic");
        expect(pure("O=O", "O=O").value).toContain("Thermoneutral");
        expect(pure("", "O-H:4").explanation).toContain("Error");
        expect(pure("O=O", "").explanation).toContain("Error");
        expect(pure("abc", "O-H:4").explanation).toContain("Error");
        expect(pure("O=O:abc", "O-H:4").explanation).toContain("Error");
        expect(pure("O=O:0", "O-H:4").explanation).toContain("Error");
        expect(pure("O=O:1.5", "O-H:4").explanation).toContain("Error");
        expect(pure("O=O,,H-H", "O-H:4").value).not.toBe("");
    });
});

describe("thermoCoverage: BornHaber pure validation", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(hf: string, sub: string, ie: string, diss: string, ea: string) {
        setup("born-haber-result");
        return new BornHaberCycleCalculator().calculatePure({
            "born-haber-dHf": hf,
            "born-haber-dHsub": sub,
            "born-haber-IE": ie,
            "born-haber-dHdiss": diss,
            "born-haber-EA": ea,
        });
    }

    it("computes and rejects bad inputs", () => {
        expect(pure("-411", "108", "496", "244", "-349").value).not.toBe("");
        expect(pure("", "108", "496", "244", "-349").explanation).toContain("Error");
        expect(pure("-411", "", "496", "244", "-349").explanation).toContain("Error");
    });
});
