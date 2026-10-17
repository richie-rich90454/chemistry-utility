import { describe, it, expect } from "vitest";
import { TranslationManager, NumberFormatter, LocaleDetector } from "./index.js";

describe("i18n index re-exports", () => {
    it("exposes TranslationManager", () => {
        expect(typeof TranslationManager).toBe("function");
    });

    it("exposes NumberFormatter", () => {
        expect(typeof NumberFormatter).toBe("function");
    });

    it("exposes LocaleDetector", () => {
        expect(typeof LocaleDetector).toBe("function");
    });
});
