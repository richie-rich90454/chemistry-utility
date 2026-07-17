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
});
