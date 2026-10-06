import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DataCache } from "./dataCache.js";

describe("DataCache", () => {
    beforeEach(() => {
        DataCache.resetInstance();
        localStorage.clear();
    });

    afterEach(() => {
        DataCache.resetInstance();
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(DataCache.getInstance()).toBe(DataCache.getInstance());
    });

    it("creates a new instance after resetInstance", () => {
        const first = DataCache.getInstance();
        DataCache.resetInstance();
        const second = DataCache.getInstance();
        expect(first).not.toBe(second);
    });

    describe("get", () => {
        it("returns null when the key does not exist", async () => {
            const result = await DataCache.getInstance().get("missing-key");
            expect(result).toBeNull();
        });

        it("returns the stored value when the key exists", async () => {
            localStorage.setItem("chem-cache-my-key", "my-value");
            const result = await DataCache.getInstance().get("my-key");
            expect(result).toBe("my-value");
        });

        it("returns the stored value for an object serialized as JSON", async () => {
            localStorage.setItem("chem-cache-data", JSON.stringify({ a: 1 }));
            const result = await DataCache.getInstance().get("data");
            expect(result).toBe(JSON.stringify({ a: 1 }));
        });

        it("returns null when localStorage.getItem throws", async () => {
            const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
                throw new Error("quota");
            });
            const result = await DataCache.getInstance().get("any-key");
            expect(result).toBeNull();
            spy.mockRestore();
        });
    });

    describe("set", () => {
        it("stores a value under the prefixed key", async () => {
            await DataCache.getInstance().set("foo", "bar");
            expect(localStorage.getItem("chem-cache-foo")).toBe("bar");
        });

        it("overwrites an existing value", async () => {
            await DataCache.getInstance().set("foo", "first");
            await DataCache.getInstance().set("foo", "second");
            expect(localStorage.getItem("chem-cache-foo")).toBe("second");
        });

        it("does not throw when localStorage.setItem throws", async () => {
            const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
                throw new Error("QuotaExceededError");
            });
            await expect(DataCache.getInstance().set("k", "v")).resolves.toBeUndefined();
            spy.mockRestore();
        });
    });

    describe("has", () => {
        it("returns false when the key does not exist", async () => {
            const result = await DataCache.getInstance().has("missing");
            expect(result).toBe(false);
        });

        it("returns true when the key exists", async () => {
            localStorage.setItem("chem-cache-exists", "value");
            const result = await DataCache.getInstance().has("exists");
            expect(result).toBe(true);
        });

        it("returns false when localStorage.getItem throws", async () => {
            const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
                throw new Error("unavailable");
            });
            const result = await DataCache.getInstance().has("any");
            expect(result).toBe(false);
            spy.mockRestore();
        });
    });

    it("integrates set/get/has together", async () => {
        const cache = DataCache.getInstance();
        expect(await cache.has("integration")).toBe(false);
        await cache.set("integration", "value");
        expect(await cache.has("integration")).toBe(true);
        expect(await cache.get("integration")).toBe("value");
    });

    describe("remove", () => {
        it("deletes a stored value", async () => {
            const cache = DataCache.getInstance();
            await cache.set("temp", "value");
            await cache.remove("temp");
            expect(await cache.has("temp")).toBe(false);
        });

        it("does not throw when localStorage.removeItem throws", async () => {
            const spy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
                throw new Error("unavailable");
            });
            await expect(DataCache.getInstance().remove("k")).resolves.toBeUndefined();
            spy.mockRestore();
        });
    });

    describe("getPtable", () => {
        it("returns null when no ptable entry is cached", async () => {
            expect(await DataCache.getInstance().getPtable()).toBeNull();
        });

        it("returns the parsed array when the shape is valid", async () => {
            const elements = [{ symbol: "H", atomicNumber: 1 }, { symbol: "He", atomicNumber: 2 }];
            localStorage.setItem("chem-cache-ptable", JSON.stringify(elements));
            expect(await DataCache.getInstance().getPtable()).toEqual(elements);
        });

        it("returns null and clears corrupt JSON", async () => {
            localStorage.setItem("chem-cache-ptable", "{not-json");
            expect(await DataCache.getInstance().getPtable()).toBeNull();
            expect(localStorage.getItem("chem-cache-ptable")).toBeNull();
        });

        it("returns null and clears a non-array payload", async () => {
            localStorage.setItem("chem-cache-ptable", JSON.stringify({ elements: [] }));
            expect(await DataCache.getInstance().getPtable()).toBeNull();
            expect(localStorage.getItem("chem-cache-ptable")).toBeNull();
        });

        it("returns null and clears entries with a bad element shape", async () => {
            localStorage.setItem("chem-cache-ptable", JSON.stringify([{ symbol: "H" }, { symbol: 1, atomicNumber: "x" }]));
            expect(await DataCache.getInstance().getPtable()).toBeNull();
            expect(localStorage.getItem("chem-cache-ptable")).toBeNull();
        });

        it("returns null and clears non-object entries", async () => {
            localStorage.setItem("chem-cache-ptable", JSON.stringify([42]));
            expect(await DataCache.getInstance().getPtable()).toBeNull();
            expect(localStorage.getItem("chem-cache-ptable")).toBeNull();
        });

        it("returns null and clears null entries", async () => {
            localStorage.setItem("chem-cache-ptable", JSON.stringify([null]));
            expect(await DataCache.getInstance().getPtable()).toBeNull();
            expect(localStorage.getItem("chem-cache-ptable")).toBeNull();
        });

        it("returns null when localStorage.getItem throws", async () => {
            const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
                throw new Error("unavailable");
            });
            expect(await DataCache.getInstance().getPtable()).toBeNull();
            spy.mockRestore();
        });
    });
});
