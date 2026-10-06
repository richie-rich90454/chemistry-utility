import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockGet = vi.fn();

vi.mock("./apiClient.js", function () {
    return {
        ApiClient: {
            getInstance: function () {
                return {
                    get: mockGet
                };
            }
        },
        ApiError: function (this: { status: number; type: string; detail: string; name: string; message: string }, status: number, type: string, detail: string) {
            this.status = status;
            this.type = type;
            this.detail = detail;
            this.name = "ApiError";
            this.message = detail;
        }
    };
});

vi.mock("./navigationManager.js", function () {
    return {
        NavigationManager: {
            getInstance: function () {
                return {
                    navigate: vi.fn()
                };
            }
        }
    };
});

import { CompoundSearchUI, searchCompounds, fetchCompoundDetail, clearLookupDetailCache } from "./compoundSearchUI.js";
import { RuntimeDetector } from "./runtimeDetector.js";

function makeCompound(): Record<string, unknown> {
    return {
        "id": "c1",
        "name": "Water",
        "formula": "H2O",
        "molarMass": 18.015,
        "casNumber": "7732-18-5",
        "smiles": "O"
    };
}

describe("compoundCoverage pure", function () {
    beforeEach(function () {
        mockGet.mockReset();
        CompoundSearchUI.resetInstance();
        clearLookupDetailCache();
    });

    afterEach(function () {
        vi.restoreAllMocks();
        CompoundSearchUI.resetInstance();
        clearLookupDetailCache();
    });

    it("should omit type param when type is empty", async function () {
        mockGet.mockResolvedValue({ "compounds": [], "query": "water" });
        let results = await searchCompounds("water", "");
        expect(mockGet).toHaveBeenCalledWith("/api/v1/compounds?q=water");
        expect(results.length).toBe(0);
    });

    it("should default missing lookup fields on web", async function () {
        let getSpy = vi.spyOn(RuntimeDetector.prototype, "isWebMode", "get").mockReturnValue(true);
        try {
            mockGet.mockResolvedValue({ "compounds": [makeCompound()], "query": "water" });
            await searchCompounds("water", "name");
            mockGet.mockClear();
            let detail = await fetchCompoundDetail("c1");
            expect(detail.inchi).toBe("");
            expect(detail.properties).toEqual({});
            expect(detail.source).toBe("");
            expect(mockGet).not.toHaveBeenCalled();
        } finally {
            getSpy.mockRestore();
        }
    });

    it("should default non-string lookup fields on web", async function () {
        let getSpy = vi.spyOn(RuntimeDetector.prototype, "isWebMode", "get").mockReturnValue(true);
        try {
            let payload: Record<string, unknown> = makeCompound();
            payload["inchi"] = 123 as unknown as string;
            payload["properties"] = "not-an-object" as unknown as Record<string, string>;
            payload["source"] = 456 as unknown as string;
            mockGet.mockResolvedValue({ "compounds": [payload], "query": "water" });
            await searchCompounds("water", "name");
            mockGet.mockClear();
            let detail = await fetchCompoundDetail("c1");
            expect(detail.inchi).toBe("");
            expect(detail.properties).toEqual({});
            expect(detail.source).toBe("");
        } finally {
            getSpy.mockRestore();
        }
    });
});
