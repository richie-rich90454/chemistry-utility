import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {ScrollTopButton} from "./ScrollTopButton";

describe("ScrollTopButton", function (): void {
    let scrollToSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(function (): void {
        Object.defineProperty(window, "scrollY", {value: 0, writable: true, configurable: true});
        scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(function (): void {});
    });

    afterEach(function (): void {
        vi.restoreAllMocks();
        Object.defineProperty(window, "scrollY", {value: 0, writable: true, configurable: true});
    });

    it("does not render the button when scrollY is at 0", function (): void {
        let result = render(function () { return <ScrollTopButton />; });
        let button = result.queryByRole("button", {name: "Scroll to top"});
        expect(button).toBeNull();
    });

    it("renders the button after scrolling past 200px", function (): void {
        let result = render(function () { return <ScrollTopButton />; });
        Object.defineProperty(window, "scrollY", {value: 300, writable: true, configurable: true});
        window.dispatchEvent(new Event("scroll"));
        let button = result.getByRole("button", {name: "Scroll to top"});
        expect(button).toBeTruthy();
    });

    it("hides the button when scrolling back below threshold", function (): void {
        let result = render(function () { return <ScrollTopButton />; });
        Object.defineProperty(window, "scrollY", {value: 300, writable: true, configurable: true});
        window.dispatchEvent(new Event("scroll"));
        expect(result.getByRole("button", {name: "Scroll to top"})).toBeTruthy();
        Object.defineProperty(window, "scrollY", {value: 100, writable: true, configurable: true});
        window.dispatchEvent(new Event("scroll"));
        let button = result.queryByRole("button", {name: "Scroll to top"});
        expect(button).toBeNull();
    });

    it("calls window.scrollTo with smooth behavior on click", function (): void {
        let result = render(function () { return <ScrollTopButton />; });
        Object.defineProperty(window, "scrollY", {value: 300, writable: true, configurable: true});
        window.dispatchEvent(new Event("scroll"));
        let button = result.getByRole("button", {name: "Scroll to top"});
        fireEvent.click(button);
        expect(scrollToSpy).toHaveBeenCalled();
        expect(scrollToSpy).toHaveBeenCalledWith({top: 0, behavior: "smooth"});
    });

    it("removes the scroll listener on cleanup", function (): void {
        let removeSpy = vi.spyOn(window, "removeEventListener");
        render(function () { return <ScrollTopButton />; });
        cleanup();
        expect(removeSpy).toHaveBeenCalled();
        let calledWithScroll = false;
        let calls = removeSpy.mock.calls;
        let i: number;
        for (i = 0; i < calls.length; i++) {
            if (calls[i][0] === "scroll") {
                calledWithScroll = true;
            }
        }
        expect(calledWithScroll).toBe(true);
    });
});
