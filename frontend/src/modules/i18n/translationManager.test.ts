import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TranslationManager } from "./translationManager.js";

describe("TranslationManager", () => {
    beforeEach(() => {
        TranslationManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
    });

    afterEach(() => {
        TranslationManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(TranslationManager.getInstance()).toBe(TranslationManager.getInstance());
    });

    describe("default state", () => {
        it("defaults to 'en' locale", () => {
            expect(TranslationManager.getInstance().getLocale()).toBe("en");
        });

        it("returns the key itself when no catalog is loaded", () => {
            expect(TranslationManager.getInstance().t("missing.key")).toBe("missing.key");
        });
    });

    describe("t (translation lookup)", () => {
        it("returns the translated value when the key exists", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "greeting": "Hello, World!" });
            expect(tm.t("greeting")).toBe("Hello, World!");
        });

        it("returns the key when the translation is missing", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "existing": "yes" });
            expect(tm.t("nonexistent")).toBe("nonexistent");
        });

        it("returns undefined value as key when catalog has undefined", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "missing": undefined as unknown as string });
            expect(tm.t("missing")).toBe("missing");
        });

        it("interpolates a single parameter", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "greeting": "Hello, {name}!" });
            expect(tm.t("greeting", { name: "Alice" })).toBe("Hello, Alice!");
        });

        it("interpolates multiple parameters", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "msg": "{greeting}, {name}! You have {count} messages." });
            const result = tm.t("msg", { greeting: "Hi", name: "Bob", count: "5" });
            expect(result).toBe("Hi, Bob! You have 5 messages.");
        });

        it("replaces multiple occurrences of the same parameter", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "repeat": "{x} and {x}" });
            expect(tm.t("repeat", { x: "Y" })).toBe("Y and Y");
        });

        it("returns the raw value when no params are provided", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "plain": "just text" });
            expect(tm.t("plain")).toBe("just text");
        });

        it("returns the raw value when params is empty object", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "with.placeholder": "value {x}" });
            expect(tm.t("with.placeholder", {})).toBe("value {x}");
        });

        it("leaves unreferenced placeholders when param is missing", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "msg": "Hello {name}, age {age}" });
            // Only 'name' is provided — {age} remains unreplaced
            const result = tm.t("msg", { name: "Zed" });
            expect(result).toBe("Hello Zed, age {age}");
        });
    });

    describe("setLocale", () => {
        it("changes the current locale", () => {
            const tm = TranslationManager.getInstance();
            tm.setLocale("fr");
            expect(tm.getLocale()).toBe("fr");
        });

        it("persists the locale to localStorage", () => {
            const tm = TranslationManager.getInstance();
            tm.setLocale("es");
            expect(localStorage.getItem("locale")).toBe("es");
        });

        it("switches the active catalog when one is loaded for the new locale", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "hello": "Hello" });
            tm.loadCatalog("fr", { "hello": "Bonjour" });
            tm.setLocale("fr");
            expect(tm.t("hello")).toBe("Bonjour");
        });

        it("keeps using the previous catalog when no catalog is loaded for the new locale", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "hello": "Hello" });
            tm.setLocale("de");
            // currentCatalog is not updated because no de catalog exists
            expect(tm.t("hello")).toBe("Hello");
        });

        it("does not throw when localStorage.setItem throws", () => {
            const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
                throw new Error("unavailable");
            });
            const tm = TranslationManager.getInstance();
            expect(() => tm.setLocale("ja")).not.toThrow();
            expect(tm.getLocale()).toBe("ja");
            spy.mockRestore();
        });
    });

    describe("loadCatalog", () => {
        it("loads a catalog without changing the current locale", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("fr", { "hello": "Bonjour" });
            expect(tm.getLocale()).toBe("en");
        });

        it("makes the catalog active when it matches the current locale", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "hello": "Hello" });
            expect(tm.t("hello")).toBe("Hello");
        });

        it("does not affect the active catalog when loaded for a non-current locale", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "hello": "Hello" });
            tm.loadCatalog("fr", { "hello": "Bonjour" });
            expect(tm.t("hello")).toBe("Hello");
        });

        it("replaces an existing catalog for the same locale", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "hello": "Hello" });
            tm.loadCatalog("en", { "hello": "Hi" });
            expect(tm.t("hello")).toBe("Hi");
        });
    });

    describe("applyTranslations", () => {
        it("translates elements with data-i18n attribute", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "title.home": "Home Page" });
            const el = document.createElement("h1");
            el.setAttribute("data-i18n", "title.home");
            el.textContent = "Old Text";
            document.body.appendChild(el);
            tm.applyTranslations();
            expect(el.textContent).toBe("Home Page");
        });

        it("does not modify elements when no translation is found", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", {});
            const el = document.createElement("h1");
            el.setAttribute("data-i18n", "missing.key");
            el.textContent = "Original";
            document.body.appendChild(el);
            tm.applyTranslations();
            expect(el.textContent).toBe("Original");
        });

        it("translates placeholder attributes with data-i18n-placeholder", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "placeholder.search": "Search..." });
            const input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("data-i18n-placeholder", "placeholder.search");
            input.placeholder = "Old";
            document.body.appendChild(input);
            tm.applyTranslations();
            expect(input.placeholder).toBe("Search...");
        });

        it("does not modify placeholder when translation is missing", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", {});
            const input = document.createElement("input");
            input.setAttribute("data-i18n-placeholder", "missing.placeholder");
            input.placeholder = "Original";
            document.body.appendChild(input);
            tm.applyTranslations();
            expect(input.placeholder).toBe("Original");
        });

        it("translates multiple elements at once", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "a": "AAA", "b": "BBB" });
            const el1 = document.createElement("span");
            el1.setAttribute("data-i18n", "a");
            const el2 = document.createElement("span");
            el2.setAttribute("data-i18n", "b");
            document.body.appendChild(el1);
            document.body.appendChild(el2);
            tm.applyTranslations();
            expect(el1.textContent).toBe("AAA");
            expect(el2.textContent).toBe("BBB");
        });

        it("ignores elements without data-i18n attributes", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "key": "value" });
            const el = document.createElement("div");
            el.textContent = "Untouched";
            document.body.appendChild(el);
            tm.applyTranslations();
            expect(el.textContent).toBe("Untouched");
        });

        it("handles elements with empty data-i18n attribute gracefully", () => {
            const tm = TranslationManager.getInstance();
            tm.loadCatalog("en", { "": "empty-key-value" });
            const el = document.createElement("div");
            el.setAttribute("data-i18n", "");
            el.textContent = "Original";
            document.body.appendChild(el);
            // The key is "" which matches the catalog entry — but the
            // implementation checks `if (key)` which is falsy for "".
            tm.applyTranslations();
            expect(el.textContent).toBe("Original");
        });
    });
});
