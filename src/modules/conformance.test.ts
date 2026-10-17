import {describe, it, expect, afterEach} from "vitest";
import {readFileSync, readdirSync} from "node:fs";
import {join} from "node:path";
import {getEngine, resetEngine} from "./engine.js";

/**
 * Runs the shared conformance vectors through the TypeScript engine.
 *
 * `conformance/*.json` is the contract both engines are held to. The Go
 * wrapper consumes it in core/internal/calculators/conformance_test.go; this
 * test holds the website engine to the same vectors, so a divergence between
 * the two fails a test instead of shipping.
 */

interface VectorCase {
    id: string;
    inputs: Record<string, unknown>;
    expect: {
        value?: string;
        explanation?: string;
        chartData?: Array<Record<string, number>>;
        metadata?: Record<string, unknown>;
        [numericKey: string]: unknown;
    };
}

interface VectorFile {
    calculator: string;
    contract: string;
    cases: VectorCase[];
}

// The equation balancer is a separate code path (the heavy-calculation
// worker), not an engine calculator, so its vectors are exercised there.
const SKIP: string[] = ["equation-balance"];

const CONFORMANCE_DIR = join(import.meta.dirname, "..", "..", "conformance");

function loadVectors(): VectorFile[] {
    return readdirSync(CONFORMANCE_DIR)
        .filter(function (name: string): boolean { return name.endsWith(".json"); })
        .map(function (name: string): VectorFile {
            return JSON.parse(readFileSync(join(CONFORMANCE_DIR, name), "utf8")) as VectorFile;
        });
}

/** Mirrors the Go suite's input coercion: non-strings are stringified. */
function toStringInputs(raw: Record<string, unknown>): Record<string, string> {
    let inputs: Record<string, string> = {};
    let keys: string[] = Object.keys(raw);
    let i: number;
    for (i = 0; i < keys.length; i++) {
        let value: unknown = raw[keys[i]];
        if (typeof value === "string") {
            inputs[keys[i]] = value;
        } else if (value === null || value === undefined) {
            inputs[keys[i]] = "";
        } else if (typeof value === "number" || typeof value === "boolean") {
            inputs[keys[i]] = String(value);
        } else {
            inputs[keys[i]] = JSON.stringify(value);
        }
    }
    return inputs;
}

const vectors = loadVectors();

describe("conformance", function (): void {
    afterEach(function (): void {
        resetEngine();
    });

    let i: number;
    for (i = 0; i < vectors.length; i++) {
        let vector: VectorFile = vectors[i];
        if (SKIP.indexOf(vector.calculator) !== -1) {
            continue;
        }
        describe(vector.calculator, function (): void {
            let c: number;
            for (c = 0; c < vector.cases.length; c++) {
                let vectorCase: VectorCase = vector.cases[c];
                it(vectorCase.id, async function (): Promise<void> {
                    let result = await getEngine().calculate(vector.calculator, toStringInputs(vectorCase.inputs));
                    let expected: string = vectorCase.expect.value ?? "";
                    let expectedExplanation: string = typeof vectorCase.expect.explanation === "string"
                        ? vectorCase.expect.explanation
                        : "";
                    if (expected === "" && expectedExplanation.indexOf("Error: ") === 0) {
                        expect(expectedExplanation).toBe("Error: " + (result.explanation ?? "").replace(/^Error: /, ""));
                        expect(result.value).toBe("");
                        return;
                    }
                    let numericKeys: string[] = Object.keys(vectorCase.expect).filter(function (key: string): boolean {
                        return key !== "value" && key !== "explanation" && key !== "chartData" && key !== "metadata";
                    });
                    // Numeric contract (molar-mass): the vector records the
                    // metadata number rather than the formatted value.
                    if (numericKeys.length > 0) {
                        let metadata = (result.metadata ?? {}) as Record<string, unknown>;
                        let k: number;
                        for (k = 0; k < numericKeys.length; k++) {
                            expect(metadata[numericKeys[k]]).toBe(vectorCase.expect[numericKeys[k]]);
                        }
                        return;
                    }
                    expect(result.value).toBe(expected);
                    if (expectedExplanation !== "") {
                        expect(result.explanation).toBe(expectedExplanation);
                    }
                    if (vectorCase.expect.chartData !== undefined) {
                        let want = vectorCase.expect.chartData;
                        let got = ((result.chartData ?? []) as Array<Record<string, number>>);
                        expect(got.length).toBe(want.length);
                        let p: number;
                        for (p = 0; p < want.length; p++) {
                            let fields: string[] = Object.keys(want[p]);
                            let f: number;
                            for (f = 0; f < fields.length; f++) {
                                expect(got[p][fields[f]]).toBeCloseTo(want[p][fields[f]], 9);
                            }
                        }
                    }
                });
            }
        });
    }
});
