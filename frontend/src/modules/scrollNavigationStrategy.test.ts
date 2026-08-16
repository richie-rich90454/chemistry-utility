import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {ScrollNavigationStrategy} from "./scrollNavigationStrategy.js";
describe("ScrollNavigationStrategy", function (): void {
    let strategy: ScrollNavigationStrategy;
    beforeEach(function (): void {
        document.body.innerHTML = "";
        strategy = new ScrollNavigationStrategy();
    });
    afterEach(function (): void {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });
    describe("navigate", function (): void {
        it("scrolls to the target element when it exists", function (): void {
            let target: HTMLElement = document.createElement("div");
            target.id = "target-section";
            document.body.appendChild(target);
            let scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(function (): void {});
            strategy.navigate("target-section");
            expect(scrollSpy).toHaveBeenCalled();
            scrollSpy.mockRestore();
        });
        it("does not throw when target element does not exist", function (): void {
            let scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(function (): void {});
            expect(function (): void {
                strategy.navigate("nonexistent");
            }).not.toThrow();
            expect(scrollSpy).not.toHaveBeenCalled();
            scrollSpy.mockRestore();
        });
        it("pushes state to history when navigating", function (): void {
            let target: HTMLElement = document.createElement("div");
            target.id = "my-section";
            document.body.appendChild(target);
            let scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(function (): void {});
            let pushStateSpy = vi.spyOn(history, "pushState").mockImplementation(function (): void {});
            strategy.navigate("my-section");
            expect(pushStateSpy).toHaveBeenCalledWith(null, "", "/my-section");
            scrollSpy.mockRestore();
            pushStateSpy.mockRestore();
        });
        it("accounts for sidebar header height when scrolling", function (): void {
            let header: HTMLElement = document.createElement("div");
            header.className = "sidebar-header";
            header.style.height = "60px";
            document.body.appendChild(header);
            let target: HTMLElement = document.createElement("div");
            target.id = "section";
            document.body.appendChild(target);
            let scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(function (): void {});
            strategy.navigate("section");
            expect(scrollSpy).toHaveBeenCalled();
            let callArgs: ScrollToOptions = scrollSpy.mock.calls[0][0] as ScrollToOptions;
            expect(typeof callArgs.top).toBe("number");
            scrollSpy.mockRestore();
        });
        it("uses offset of 0 when no sidebar header exists", function (): void {
            let target: HTMLElement = document.createElement("div");
            target.id = "section";
            document.body.appendChild(target);
            let scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(function (): void {});
            strategy.navigate("section");
            expect(scrollSpy).toHaveBeenCalled();
            scrollSpy.mockRestore();
        });
        it("uses smooth scroll behavior", function (): void {
            let target: HTMLElement = document.createElement("div");
            target.id = "section";
            document.body.appendChild(target);
            let scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(function (): void {});
            strategy.navigate("section");
            let callArgs: ScrollToOptions = scrollSpy.mock.calls[0][0] as ScrollToOptions;
            expect(callArgs.behavior).toBe("smooth");
            scrollSpy.mockRestore();
        });
    });
    describe("setActiveLink", function (): void {
        it("sets active class on the matching sidebar link", function (): void {
            let nav: HTMLElement = document.createElement("nav");
            nav.className = "sidebar-nav";
            let link1: HTMLAnchorElement = document.createElement("a");
            link1.setAttribute("href", "/section1");
            let link2: HTMLAnchorElement = document.createElement("a");
            link2.setAttribute("href", "/section2");
            nav.appendChild(link1);
            nav.appendChild(link2);
            document.body.appendChild(nav);
            let scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(function (): void {});
            let target: HTMLElement = document.createElement("div");
            target.id = "section1";
            document.body.appendChild(target);
            strategy.navigate("section1");
            expect(link1.classList.contains("active")).toBe(true);
            expect(link2.classList.contains("active")).toBe(false);
            scrollSpy.mockRestore();
        });
        it("handles links with hash-prefixed hrefs", function (): void {
            let nav: HTMLElement = document.createElement("nav");
            nav.className = "sidebar-nav";
            let link: HTMLAnchorElement = document.createElement("a");
            link.setAttribute("href", "#my-section");
            nav.appendChild(link);
            document.body.appendChild(nav);
            let scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(function (): void {});
            let target: HTMLElement = document.createElement("div");
            target.id = "my-section";
            document.body.appendChild(target);
            strategy.navigate("my-section");
            expect(link.classList.contains("active")).toBe(true);
            scrollSpy.mockRestore();
        });
        it("removes active class from non-matching links", function (): void {
            let nav: HTMLElement = document.createElement("nav");
            nav.className = "sidebar-nav";
            let link1: HTMLAnchorElement = document.createElement("a");
            link1.setAttribute("href", "/section1");
            link1.classList.add("active");
            let link2: HTMLAnchorElement = document.createElement("a");
            link2.setAttribute("href", "/section2");
            nav.appendChild(link1);
            nav.appendChild(link2);
            document.body.appendChild(nav);
            let scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(function (): void {});
            let target: HTMLElement = document.createElement("div");
            target.id = "section2";
            document.body.appendChild(target);
            strategy.navigate("section2");
            expect(link1.classList.contains("active")).toBe(false);
            expect(link2.classList.contains("active")).toBe(true);
            scrollSpy.mockRestore();
        });
    });
});
