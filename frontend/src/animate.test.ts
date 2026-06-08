import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("gsap", () => ({
    default: {
        to: vi.fn(),
        from: vi.fn(),
        fromTo: vi.fn(),
        set: vi.fn(),
        registerPlugin: vi.fn(),
    },
}));
vi.mock("gsap/ScrollTrigger", () => ({
    ScrollTrigger: { create: vi.fn() },
}));

describe("animate.ts", () => {
    let domContentLoadedCallbacks: Array<() => void>;

    beforeEach(() => {
        document.body.innerHTML = "";
        domContentLoadedCallbacks = [];
        vi.resetModules();
        vi.clearAllMocks();

        // Ensure matchMedia returns false for prefers-reduced-motion by default
        vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

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

    async function loadAnimate(): Promise<void> {
        await import("./animate");
    }

    function fireDOMContentLoaded(): void {
        for (const cb of domContentLoadedCallbacks) {
            cb();
        }
    }

    function setupFullDOM(): void {
        document.body.innerHTML = `
            <div class="sidebar-header">
                <div class="header-top">
                    <div class="logo-icon"></div>
                    <h1>Chemistry Utility</h1>
                </div>
            </div>
            <button class="theme-toggle"></button>
            <nav class="sidebar-nav">
                <a href="#">Nav 1</a>
                <a href="#">Nav 2</a>
                <a href="#">Nav 3</a>
            </nav>
            <div class="sidebar-footer"></div>
            <div class="main-groups card">
                <input type="text" />
                <div class="result"></div>
                <button class="primary-button">Go</button>
            </div>
            <div class="welcome-card">Welcome</div>
            <div id="scroll-top"></div>
            <div id="stoich-inputs"></div>
        `;
    }

    it("DOMContentLoaded triggers animation setup (GSAP.from called)", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        expect(gsap.from).toHaveBeenCalled();
    });

    it("Logo icon exists and gets animated", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const logoIcon = document.querySelector(".logo-icon") as HTMLElement;
        expect(logoIcon).toBeTruthy();
        expect(gsap.from).toHaveBeenCalledWith(logoIcon, expect.objectContaining({
            scale: 0,
            duration: 0.4,
        }));
    });

    it("Sidebar title exists and gets animated", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const sidebarTitle = document.querySelector(".sidebar-header h1") as HTMLElement;
        expect(sidebarTitle).toBeTruthy();
        expect(gsap.from).toHaveBeenCalledWith(sidebarTitle, expect.objectContaining({
            opacity: 0,
            x: -10,
            duration: 0.35,
        }));
    });

    it("Theme toggle exists and gets animated", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const themeToggle = document.querySelector(".theme-toggle") as HTMLElement;
        expect(themeToggle).toBeTruthy();
        expect(gsap.from).toHaveBeenCalledWith(themeToggle, expect.objectContaining({
            opacity: 0,
            scale: 0.5,
            duration: 0.3,
        }));
    });

    it("Sidebar nav items exist and get animated with stagger", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const navItems = document.querySelectorAll(".sidebar-nav a");
        expect(navItems.length).toBe(3);
        expect(gsap.from).toHaveBeenCalledWith(navItems, expect.objectContaining({
            opacity: 0,
            x: -12,
            stagger: 0.03,
        }));
    });

    it("Primary buttons get mousedown/mouseup/mouseleave handlers", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const btn = document.querySelector(".primary-button") as HTMLElement;
        expect(btn).toBeTruthy();

        btn.dispatchEvent(new MouseEvent("mousedown"));
        expect(gsap.to).toHaveBeenCalledWith(btn, expect.objectContaining({ scale: 0.96 }));

        btn.dispatchEvent(new MouseEvent("mouseup"));
        expect(gsap.to).toHaveBeenCalledWith(btn, expect.objectContaining({ scale: 1, ease: "elastic.out(1, 0.5)" }));

        btn.dispatchEvent(new MouseEvent("mouseleave"));
        expect(gsap.to).toHaveBeenCalledWith(btn, expect.objectContaining({ scale: 1, ease: "power2.out", clearProps: "scale" }));
    });

    it("Theme toggle gets click handler for spin animation", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const themeToggle = document.querySelector(".theme-toggle") as HTMLElement;

        themeToggle.dispatchEvent(new MouseEvent("click"));
        expect(gsap.to).toHaveBeenCalledWith(themeToggle, expect.objectContaining({
            rotation: "+=360",
            duration: 0.5,
            ease: "power2.inOut",
        }));
    });

    it("Result MutationObserver fires when result content changes", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const result = document.querySelector(".result") as HTMLElement;

        result.textContent = "42.0";
        // MutationObserver is async; wait a tick
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(gsap.fromTo).toHaveBeenCalledWith(result, expect.objectContaining({ opacity: 0, y: 4 }), expect.objectContaining({
            opacity: 1,
            y: 0,
            duration: 0.2,
        }));
    });

    it("Error class MutationObserver fires when .error added to input", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const input = document.querySelector("input") as HTMLElement;

        input.classList.add("error");
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(gsap.fromTo).toHaveBeenCalledWith(input, expect.objectContaining({ x: -4 }), expect.objectContaining({
            x: 0,
            duration: 0.4,
            ease: "elastic.out(1, 0.3)",
        }));
    });

    it("Welcome card gets mouseenter/mouseleave handlers", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const card = document.querySelector(".welcome-card") as HTMLElement;
        expect(card).toBeTruthy();

        card.dispatchEvent(new MouseEvent("mouseenter"));
        expect(gsap.to).toHaveBeenCalledWith(card, expect.objectContaining({ y: -4, duration: 0.15 }));

        card.dispatchEvent(new MouseEvent("mouseleave"));
        expect(gsap.to).toHaveBeenCalledWith(card, expect.objectContaining({ y: 0, duration: 0.2, clearProps: "y" }));
    });

    it("prefers-reduced-motion skips all animations", async () => {
        // Override the default matchMedia mock to return true for reduced motion
        vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
            matches: query === "(prefers-reduced-motion: reduce)",
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        expect(gsap.from).not.toHaveBeenCalled();
        expect(gsap.to).not.toHaveBeenCalled();
        expect(gsap.fromTo).not.toHaveBeenCalled();
    });

    it("Button ripple effect creates span element on click", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const btn = document.querySelector(".primary-button") as HTMLElement;
        btn.style.position = "relative";

        const clickEvent = new MouseEvent("click", {
            clientX: 50,
            clientY: 50,
            bubbles: true,
        });
        btn.getBoundingClientRect = vi.fn().mockReturnValue({
            top: 0, left: 0, right: 100, bottom: 40, width: 100, height: 40,
        } as DOMRect);

        btn.dispatchEvent(clickEvent);

        const ripple = btn.querySelector("span");
        expect(ripple).toBeTruthy();
        expect(ripple!.style.position).toBe("absolute");
        expect(ripple!.style.borderRadius).toBe("50%");
    });

    it("View observer fires when view-active class is added", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const card = document.querySelector(".main-groups.card") as HTMLElement;

        card.classList.add("view-active");
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(gsap.fromTo).toHaveBeenCalled();
    });

    it("Scroll-top button observer fires when visible class is added", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const scrollTopBtn = document.getElementById("scroll-top") as HTMLElement;

        scrollTopBtn.classList.add("visible");
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(gsap.fromTo).toHaveBeenCalledWith(scrollTopBtn, expect.objectContaining({ scale: 0.5, opacity: 0 }), expect.objectContaining({
            scale: 1,
            opacity: 1,
            duration: 0.25,
            ease: "back.out(2)",
        }));
    });

    it("Stoichiometry inputs observer fires when children are added", async () => {
        setupFullDOM();
        await loadAnimate();
        fireDOMContentLoaded();

        const gsap = (await import("gsap")).default;
        const stoichInputs = document.getElementById("stoich-inputs") as HTMLElement;

        const newInput = document.createElement("input");
        newInput.type = "text";
        stoichInputs.appendChild(newInput);

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(gsap.fromTo).toHaveBeenCalled();
    });
});
