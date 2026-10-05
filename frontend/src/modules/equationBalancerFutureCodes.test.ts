import {describe, it, expect, vi} from "vitest";

vi.mock("fast-balance", async (importOriginal) => {
    const real = await importOriginal() as Record<string, unknown>;
    const RealBalanceError = real["BalanceError"] as new (code: string, message: string) => Error & { code: string };
    const realBalance = real["balance"] as (eq: string, opts?: unknown) => unknown;
    const realSplit = real["splitEquation"] as (eq: string) => unknown;
    const realNormalize = real["normalizeArrows"] as (s: string) => string;
    function isFutureMarker(s: string): boolean {
        return s.indexOf("__FUTURE__") !== -1;
    }
    return {
        ...(real as object),
        balance: (eq: string, opts?: unknown) => {
            if (isFutureMarker(eq)) throw new RealBalanceError("UNDERDETERMINED", "future code for coverage");
            return (realBalance as (a: string, b?: unknown) => unknown)(eq, opts);
        },
        splitEquation: (eq: string) => {
            if (isFutureMarker(eq)) throw new RealBalanceError("UNDERDETERMINED", "future code for coverage");
            return (realSplit as (a: string) => unknown)(eq);
        },
        normalizeArrows: realNormalize,
        BalanceError: RealBalanceError,
    };
});

import {EquationBalancer, balanceEquation, balanceIonic} from "./equationBalancer.js";

describe("balancerFutureCodes: defensive fallbacks", () => {
    it("parseEquation maps future codes to Invalid format", () => {
        expect(() => EquationBalancer.parseEquation("__FUTURE__")).toThrow("Invalid format");
    });

    it("balanceEquation maps future codes to Could not balance", () => {
        expect(() => balanceEquation("__FUTURE__")).toThrow("Could not balance");
    });

    it("balanceIonic maps future codes to Could not balance ionic", () => {
        expect(() => balanceIonic("__FUTURE__")).toThrow("Could not balance ionic equation");
    });
});
