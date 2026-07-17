import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {ScreenReaderAnnouncer} from "./screenReaderAnnouncer.js";
describe("ScreenReaderAnnouncer", function (): void {
    beforeEach(function (): void {
        ScreenReaderAnnouncer.resetInstance();
        document.body.innerHTML = "";
    });
    afterEach(function (): void {
        ScreenReaderAnnouncer.resetInstance();
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });
    describe("getInstance", function (): void {
        it("returns the same singleton instance on subsequent calls", function (): void {
            let a: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            let b: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            expect(a).toBe(b);
        });
        it("creates a new instance after resetInstance", function (): void {
            let first: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            ScreenReaderAnnouncer.resetInstance();
            let second: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            expect(first).not.toBe(second);
        });
    });
    describe("announce", function (): void {
        it("creates a live region in the DOM on first announce", function (): void {
            let announcer: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            announcer.announce("Test message");
            let region: HTMLElement | null = document.getElementById("sr-announce");
            expect(region).not.toBeNull();
            expect(region?.getAttribute("aria-live")).toBe("polite");
            expect(region?.getAttribute("aria-atomic")).toBe("true");
            expect(region?.getAttribute("role")).toBe("status");
            expect(region?.className).toBe("sr-only");
        });
        it("sets the text content after a timeout", function (): void {
            vi.useFakeTimers();
            let announcer: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            announcer.announce("Hello world");
            let region: HTMLElement = document.getElementById("sr-announce") as HTMLElement;
            expect(region.textContent).toBe("");
            vi.advanceTimersByTime(100);
            expect(region.textContent).toBe("Hello world");
            vi.useRealTimers();
        });
        it("uses assertive priority when specified", function (): void {
            let announcer: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            announcer.announce("Urgent message", "assertive");
            let region: HTMLElement = document.getElementById("sr-announce") as HTMLElement;
            expect(region.getAttribute("aria-live")).toBe("assertive");
        });
        it("uses polite priority by default", function (): void {
            let announcer: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            announcer.announce("Polite message");
            let region: HTMLElement = document.getElementById("sr-announce") as HTMLElement;
            expect(region.getAttribute("aria-live")).toBe("polite");
        });
        it("reuses existing live region on subsequent announces", function (): void {
            let announcer: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            announcer.announce("First message");
            let region1: HTMLElement = document.getElementById("sr-announce") as HTMLElement;
            announcer.announce("Second message");
            let region2: HTMLElement = document.getElementById("sr-announce") as HTMLElement;
            expect(region1).toBe(region2);
        });
        it("updates aria-live priority on existing region", function (): void {
            let announcer: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            announcer.announce("Polite message", "polite");
            announcer.announce("Assertive message", "assertive");
            let region: HTMLElement = document.getElementById("sr-announce") as HTMLElement;
            expect(region.getAttribute("aria-live")).toBe("assertive");
        });
        it("reuses an existing DOM element with the live region id", function (): void {
            let existing: HTMLElement = document.createElement("div");
            existing.id = "sr-announce";
            existing.setAttribute("aria-live", "polite");
            document.body.appendChild(existing);
            let announcer: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            announcer.announce("Reused region", "assertive");
            expect(existing.getAttribute("aria-live")).toBe("assertive");
            let regions: NodeListOf<HTMLElement> = document.querySelectorAll("#sr-announce");
            expect(regions.length).toBe(1);
        });
        it("sets sr-only CSS styles on the live region", function (): void {
            let announcer: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            announcer.announce("Styled message");
            let region: HTMLElement = document.getElementById("sr-announce") as HTMLElement;
            expect(region.style.position).toBe("absolute");
            expect(region.style.width).toBe("1px");
            expect(region.style.height).toBe("1px");
            expect(region.style.overflow).toBe("hidden");
            expect(region.style.border).toContain("0");
        });
        it("clears text content before setting new message", function (): void {
            vi.useFakeTimers();
            let announcer: ScreenReaderAnnouncer = ScreenReaderAnnouncer.getInstance();
            announcer.announce("First message");
            vi.advanceTimersByTime(100);
            announcer.announce("Second message");
            let region: HTMLElement = document.getElementById("sr-announce") as HTMLElement;
            expect(region.textContent).toBe("");
            vi.advanceTimersByTime(100);
            expect(region.textContent).toBe("Second message");
            vi.useRealTimers();
        });
    });
});
