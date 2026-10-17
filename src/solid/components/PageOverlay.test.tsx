import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {PageOverlay} from "./PageOverlay";

describe("PageOverlay", function (): void {
    beforeEach(function (): void {
        vi.useFakeTimers();
    });

    afterEach(function (): void {
        vi.useRealTimers();
    });

    it("renders the overlay initially", function (): void {
        let result = render(function () { return <PageOverlay />; });
        let overlay = result.container.querySelector("div");
        expect(overlay).not.toBeNull();
    });

    it("applies the loaded class after 300ms", function (): void {
        let result = render(function () { return <PageOverlay />; });
        vi.advanceTimersByTime(300);
        let overlay = result.container.querySelector("div");
        expect(overlay).not.toBeNull();
        expect(overlay!.className).toContain("loaded");
    });

    it("removes the overlay after 800ms", function (): void {
        let result = render(function () { return <PageOverlay />; });
        vi.advanceTimersByTime(800);
        let overlay = result.container.querySelector("div");
        expect(overlay).toBeNull();
    });
});
