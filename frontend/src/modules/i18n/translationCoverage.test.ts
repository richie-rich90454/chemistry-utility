// @vitest-environment jsdom
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {TranslationManager} from "./translationManager.js";

describe("translationCoverage: empty placeholder key", () => {
    beforeEach(() => {
        TranslationManager.resetInstance();
        document.body.innerHTML = "";
    });
    afterEach(() => {
        TranslationManager.resetInstance();
        document.body.innerHTML = "";
    });

    it("skips placeholder elements with an empty key", () => {
        const tm = TranslationManager.getInstance();
        tm.loadCatalog("en", {"placeholder.search": "Search..."});
        const input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("data-i18n-placeholder", "");
        input.placeholder = "Original";
        document.body.appendChild(input);
        tm.applyTranslations();
        expect(input.placeholder).toBe("Original");
    });
});
