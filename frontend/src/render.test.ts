import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("render.ts", () => {
    let domContentLoadedCallbacks: Array<() => void>;

    beforeEach(() => {
        document.body.innerHTML = "";
        domContentLoadedCallbacks = [];
        vi.resetModules();

        // Capture DOMContentLoaded callbacks so we can trigger them manually
        const originalAddEventListener = document.addEventListener.bind(document);
        vi.spyOn(document, "addEventListener").mockImplementation((type: string, listener: EventListenerOrEventListenerObject) => {
            if (type === "DOMContentLoaded" && typeof listener === "function") {
                domContentLoadedCallbacks.push(listener as () => void);
            }
            return originalAddEventListener(type, listener);
        });
    });

    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    async function initRender(): Promise<void> {
        const sidebarHeader = document.createElement("div");
        sidebarHeader.className = "sidebar-header";
        sidebarHeader.innerHTML = "<h1>Chemistry Utility</h1>";
        document.body.appendChild(sidebarHeader);

        const sidebarNav = document.createElement("nav");
        sidebarNav.className = "sidebar-nav";
        const link1 = document.createElement("a");
        link1.href = "/section-1";
        link1.textContent = "Section 1";
        const link2 = document.createElement("a");
        link2.href = "/section-2";
        link2.textContent = "Section 2";
        sidebarNav.appendChild(link1);
        sidebarNav.appendChild(link2);
        document.body.appendChild(sidebarNav);

        const section1 = document.createElement("div");
        section1.className = "main-groups";
        section1.id = "section-1";
        document.body.appendChild(section1);

        const section2 = document.createElement("div");
        section2.className = "main-groups";
        section2.id = "section-2";
        document.body.appendChild(section2);

        const scrollTopBtn = document.createElement("button");
        scrollTopBtn.id = "scroll-top";
        document.body.appendChild(scrollTopBtn);

        // @ts-expect-error render.ts is a side-effect script with no exports
        await import("./render");

        // Trigger the captured DOMContentLoaded callbacks
        domContentLoadedCallbacks.forEach(cb => cb());
    }

    describe("sidebar navigation", () => {
        it("clicking sidebar link calls scrollTo and pushState", async () => {
            await initRender();

            const link = document.querySelector('.sidebar-nav a[href="/section-1"]') as HTMLAnchorElement;
            link.click();

            expect(window.scrollTo).toHaveBeenCalled();
            expect(window.history.pushState).toHaveBeenCalled();
        });

        it("clicking link with non-existent target does not crash", async () => {
            await initRender();

            const link = document.querySelector('.sidebar-nav a[href="/section-1"]') as HTMLAnchorElement;
            link.setAttribute("href", "/nonexistent");
            expect(() => link.click()).not.toThrow();
        });
    });

    describe("scroll behavior", () => {
        it("at top of page, first section link is active", async () => {
            await initRender();

            // Force scrollY to 0 and ensure scrollHeight is large so bottom-of-page condition is false
            Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
            Object.defineProperty(document.documentElement, "scrollHeight", { value: 5000, configurable: true });
            Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
            window.dispatchEvent(new Event("scroll"));

            const link1 = document.querySelector('.sidebar-nav a[href="/section-1"]') as HTMLAnchorElement;
            expect(link1.classList.contains("active")).toBe(true);
        });

        it("at bottom of page, last section link is active", async () => {
            await initRender();

            Object.defineProperty(window, "scrollY", { value: 10000, writable: true, configurable: true });
            Object.defineProperty(document.documentElement, "scrollHeight", { value: 10000, configurable: true });
            Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
            window.dispatchEvent(new Event("scroll"));

            const link2 = document.querySelector('.sidebar-nav a[href="/section-2"]') as HTMLAnchorElement;
            expect(link2.classList.contains("active")).toBe(true);
        });

        it("empty sections array does not crash", async () => {
            document.body.innerHTML = "";
            const sidebarHeader = document.createElement("div");
            sidebarHeader.className = "sidebar-header";
            document.body.appendChild(sidebarHeader);
            const sidebarNav = document.createElement("nav");
            sidebarNav.className = "sidebar-nav";
            document.body.appendChild(sidebarNav);
            const scrollTopBtn = document.createElement("button");
            scrollTopBtn.id = "scroll-top";
            document.body.appendChild(scrollTopBtn);

            // @ts-expect-error render.ts is a side-effect script with no exports
        await import("./render");
            domContentLoadedCallbacks.forEach(cb => cb());

            expect(() => window.dispatchEvent(new Event("scroll"))).not.toThrow();
        });
    });

    describe("scroll-to-top button", () => {
        it("button exists and is initially not visible", async () => {
            await initRender();

            const btn = document.getElementById("scroll-top")!;
            expect(btn).toBeTruthy();
            expect(btn.classList.contains("visible")).toBe(false);
        });

        it("after scrolling past 400px, button gets visible class", async () => {
            await initRender();

            Object.defineProperty(window, "scrollY", { value: 500, writable: true, configurable: true });
            window.dispatchEvent(new Event("scroll"));

            const btn = document.getElementById("scroll-top")!;
            expect(btn.classList.contains("visible")).toBe(true);
        });

        it("below 400px, button does not have visible class", async () => {
            await initRender();

            Object.defineProperty(window, "scrollY", { value: 100, writable: true, configurable: true });
            window.dispatchEvent(new Event("scroll"));

            const btn = document.getElementById("scroll-top")!;
            expect(btn.classList.contains("visible")).toBe(false);
        });

        it("clicking button scrolls to top", async () => {
            await initRender();

            const btn = document.getElementById("scroll-top")!;
            btn.click();

            expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
        });
    });
});
