import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LocaleDetector } from "./localeDetector.js";

describe("LocaleDetector", () => {
    let originalLanguage: string;
    let originalLang: string;

    beforeEach(() => {
        document.body.innerHTML = "";
        // Clear localStorage for the 'locale' key.
        localStorage.removeItem("locale");
        originalLanguage = navigator.language;
        originalLang = document.documentElement.lang;
        document.documentElement.lang = "";
    });

    afterEach(() => {
        localStorage.removeItem("locale");
        Object.defineProperty(navigator, "language", {
            value: originalLanguage,
            configurable: true,
        });
        document.documentElement.lang = originalLang;
        vi.restoreAllMocks();
    });

    function setNavigatorLanguage(lang: string): void {
        Object.defineProperty(navigator, "language", {
            value: lang,
            configurable: true,
        });
    }

    it("returns the same singleton instance from getInstance", () => {
        expect(LocaleDetector.getInstance()).toBe(LocaleDetector.getInstance());
    });

    describe("normalize", () => {
        it("returns 'en' for an empty string", () => {
            expect(LocaleDetector.getInstance().normalize("")).toBe("en");
        });

        it("returns the locale lowercased when no dash is present", () => {
            expect(LocaleDetector.getInstance().normalize("EN")).toBe("en");
        });

        it("returns the locale lowercased for a single-segment code", () => {
            expect(LocaleDetector.getInstance().normalize("Fr")).toBe("fr");
        });

        it("strips the region after a dash", () => {
            expect(LocaleDetector.getInstance().normalize("en-US")).toBe("en");
        });

        it("strips the region after a dash (lowercase input)", () => {
            expect(LocaleDetector.getInstance().normalize("zh-cn")).toBe("zh");
        });

        it("strips the region after a dash (mixed case)", () => {
            expect(LocaleDetector.getInstance().normalize("De-DE")).toBe("de");
        });

        it("handles three-segment locale codes by taking the first segment", () => {
            expect(LocaleDetector.getInstance().normalize("zh-Hant-TW")).toBe("zh");
        });

        it("returns 'en' for a string with only a dash", () => {
            expect(LocaleDetector.getInstance().normalize("-")).toBe("");
        });

        it("preserves locales with no dash", () => {
            expect(LocaleDetector.getInstance().normalize("ja")).toBe("ja");
        });
    });

    describe("detect", () => {
        it("returns the stored locale from localStorage when present", () => {
            setNavigatorLanguage("fr");
            localStorage.setItem("locale", "de");
            expect(LocaleDetector.getInstance().detect()).toBe("de");
        });

        it("normalizes the stored locale from localStorage", () => {
            localStorage.setItem("locale", "ZH-CN");
            expect(LocaleDetector.getInstance().detect()).toBe("zh");
        });

        it("falls back to navigator.language when localStorage has no locale", () => {
            setNavigatorLanguage("fr-FR");
            expect(LocaleDetector.getInstance().detect()).toBe("fr");
        });

        it("normalizes navigator.language", () => {
            setNavigatorLanguage("en-GB");
            expect(LocaleDetector.getInstance().detect()).toBe("en");
        });

        it("falls back to document.documentElement.lang when navigator.language is empty", () => {
            setNavigatorLanguage("");
            document.documentElement.lang = "ja";
            expect(LocaleDetector.getInstance().detect()).toBe("ja");
        });

        it("normalizes document.documentElement.lang", () => {
            setNavigatorLanguage("");
            document.documentElement.lang = "ES-MX";
            expect(LocaleDetector.getInstance().detect()).toBe("es");
        });

        it("returns 'en' default when no source is available", () => {
            setNavigatorLanguage("");
            document.documentElement.lang = "";
            expect(LocaleDetector.getInstance().detect()).toBe("en");
        });

        it("prefers localStorage over navigator.language", () => {
            setNavigatorLanguage("fr");
            localStorage.setItem("locale", "ja");
            expect(LocaleDetector.getInstance().detect()).toBe("ja");
        });

        it("prefers navigator.language over document.documentElement.lang", () => {
            setNavigatorLanguage("de");
            document.documentElement.lang = "fr";
            expect(LocaleDetector.getInstance().detect()).toBe("de");
        });
    });
});
