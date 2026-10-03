import { describe, it, expect, vi } from "vitest";
import { useEquationBalancer, splitSpecies, speciesFromTerms } from "./useEquationBalancer";
import { balance as fastBalance } from "fast-balance";

vi.mock("fast-balance", async (importOriginal) => {
    const original = await importOriginal<typeof import("fast-balance")>();
    return {
        ...original,
        balance: (equation: string, options?: unknown) => {
            if (equation === "__boom__") {
                throw "boom";
            }
            return (original.balance as (eq: string, opts?: unknown) => unknown)(equation, options as never);
        },
    };
});

describe("splitSpecies/speciesFromTerms", () => {
    it("parses leading digits as the coefficient", () => {
        expect(splitSpecies("2H2")).toEqual({ coefficient: 2, formula: "H2" });
        expect(splitSpecies("12 Fe2+")).toEqual({ coefficient: 12, formula: " Fe2+" });
    });

    it("defaults to coefficient 1 without leading digits", () => {
        expect(splitSpecies("H2")).toEqual({ coefficient: 1, formula: "H2" });
        expect(splitSpecies("")).toEqual({ coefficient: 1, formula: "" });
    });

    it("maps term lists element-wise", () => {
        expect(speciesFromTerms(["2H2", "O2"])).toEqual([
            { coefficient: 2, formula: "H2" },
            { coefficient: 1, formula: "O2" },
        ]);
        expect(speciesFromTerms([])).toEqual([]);
    });
});

describe("useEquationBalancer", () => {
    it("starts empty and not loading", () => {
        const hook = useEquationBalancer();
        expect(hook.equation()).toBe("");
        expect(hook.medium()).toBe("acidic");
        expect(hook.result()).toBeNull();
        expect(hook.error()).toBe("");
        expect(hook.isLoading()).toBe(false);
    });

    it("setEquation and setMedium update signals", () => {
        const hook = useEquationBalancer();
        hook.setEquation("H2 + O2 -> H2O");
        expect(hook.equation()).toBe("H2 + O2 -> H2O");
        hook.setMedium("basic");
        expect(hook.medium()).toBe("basic");
    });

    it("balance reports an error for empty equation", () => {
        const hook = useEquationBalancer();
        hook.setEquation("   ");
        hook.balance();
        expect(hook.error()).toBe("Please enter a chemical equation");
        expect(hook.result()).toBeNull();
    });

    it("balance balances a simple equation", () => {
        const hook = useEquationBalancer();
        hook.setEquation("H2 + O2 -> H2O");
        hook.balance();
        expect(hook.error()).toBe("");
        const res = hook.result();
        expect(res).not.toBeNull();
        expect(res!.equation.length).toBeGreaterThan(0);
        expect(res!.reactants.length).toBeGreaterThan(0);
        expect(res!.isLoading).toBeUndefined();
        expect(hook.isLoading()).toBe(false);
    });

    it("balance handles redox equations with medium in the method", () => {
        const hook = useEquationBalancer();
        hook.setMedium("basic");
        hook.setEquation("MnO4- -> Mn2+ || Fe2+ -> Fe3+");
        hook.balance();
        expect(hook.error()).toBe("");
        const res = hook.result();
        expect(res).not.toBeNull();
        expect(res!.explanation.method).toContain("basic");
        expect(res!.reactants.length).toBeGreaterThan(0);
        expect(hook.isLoading()).toBe(false);
    });

    it("balance handles redox equations in acidic medium", () => {
        const hook = useEquationBalancer();
        hook.setMedium("acidic");
        hook.setEquation("MnO4- -> Mn2+ || Fe2+ -> Fe3+");
        hook.balance();
        expect(hook.error()).toBe("");
        expect(hook.result()!.explanation.method).toContain("acidic");
    });

    it("balance surfaces errors for invalid equations", () => {
        const hook = useEquationBalancer();
        hook.setEquation("not a chemical equation !!!");
        hook.balance();
        if (hook.result() === null) {
            expect(hook.error().length).toBeGreaterThan(0);
        }
        expect(hook.isLoading()).toBe(false);
    });

    it("clear resets all state", () => {
        const hook = useEquationBalancer();
        hook.setEquation("H2 + O2 -> H2O");
        hook.balance();
        hook.clear();
        expect(hook.equation()).toBe("");
        expect(hook.result()).toBeNull();
        expect(hook.error()).toBe("");
        expect(hook.isLoading()).toBe(false);
    });

    it("balance surfaces non-Error throws as strings", () => {
        const hook = useEquationBalancer();
        hook.setEquation("__boom__");
        hook.balance();
        expect(hook.error()).toBe("boom");
        expect(hook.result()).toBeNull();
        expect(hook.isLoading()).toBe(false);
        void fastBalance;
    });

    it("assigns coefficients of at least 1 to every species", () => {
        const hook = useEquationBalancer();
        hook.setEquation("H2 + O2 -> H2O");
        hook.balance();
        const res = hook.result();
        expect(res).not.toBeNull();
        for (const s of [...res!.reactants, ...res!.products]) {
            expect(s.coefficient).toBeGreaterThanOrEqual(1);
            expect(s.formula.length).toBeGreaterThan(0);
        }
    });
});
