import {describe, it, expect} from "vitest";
import {clampSidebarWidth, sidebarMaxWidth, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH} from "./sidebarResize.js";

describe("sidebarMaxWidth", function (): void {
    it("never drops below the minimum on a tiny viewport", function (): void {
        expect(sidebarMaxWidth(100)).toBe(SIDEBAR_MIN_WIDTH);
    });

    it("never exceeds the absolute maximum on a huge viewport", function (): void {
        expect(sidebarMaxWidth(4000)).toBe(SIDEBAR_MAX_WIDTH);
    });

    it("scales with the viewport in the middle range", function (): void {
        expect(sidebarMaxWidth(700)).toBe(280);
    });

    it("treats a zero-width viewport as the minimum", function (): void {
        expect(sidebarMaxWidth(0)).toBe(SIDEBAR_MIN_WIDTH);
    });
});

describe("clampSidebarWidth", function (): void {
    it("returns the minimum for a non-finite width", function (): void {
        expect(clampSidebarWidth(Number.NaN, 1280)).toBe(SIDEBAR_MIN_WIDTH);
        expect(clampSidebarWidth(Number.POSITIVE_INFINITY, 1280)).toBe(SIDEBAR_MIN_WIDTH);
    });

    it("raises a width below the minimum", function (): void {
        expect(clampSidebarWidth(120, 1280)).toBe(SIDEBAR_MIN_WIDTH);
    });

    it("caps a width above the viewport maximum", function (): void {
        expect(clampSidebarWidth(900, 700)).toBe(280);
    });

    it("rounds a width inside the range", function (): void {
        expect(clampSidebarWidth(260.6, 1280)).toBe(261);
    });

    it("keeps an in-range integer untouched", function (): void {
        expect(clampSidebarWidth(320, 1280)).toBe(320);
    });
});
