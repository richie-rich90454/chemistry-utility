import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ThemeManager } from "./themeManager.js";

describe("ThemeManager", () => {
    let matchMediaSpy: ReturnType<typeof vi.spyOn>;
    let setIntervalSpy: ReturnType<typeof vi.spyOn>;
    let clearIntervalSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        document.documentElement.classList.remove("dark", "light", "amoled");
        document.body.innerHTML = "";
        document.querySelectorAll("meta[name='theme-color']").forEach(function (m: Element): void { m.remove(); });
        localStorage.clear();

        matchMediaSpy = vi.spyOn(window, "matchMedia").mockReturnValue({
            matches: false,
            media: "(prefers-color-scheme: dark)",
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList);

        setIntervalSpy = vi.spyOn(window, "setInterval").mockReturnValue(1 as unknown as ReturnType<typeof setInterval>);
        clearIntervalSpy = vi.spyOn(window, "clearInterval").mockImplementation(() => {});
    });

    afterEach(() => {
        document.documentElement.classList.remove("dark", "light", "amoled");
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(ThemeManager.getInstance()).toBe(ThemeManager.getInstance());
    });

    it("defaults to light theme before init", () => {
        expect(ThemeManager.getInstance().getTheme()).toBe("light");
    });

    it("toggle cycles light -> dark -> amoled -> light", () => {
        const tm = ThemeManager.getInstance();
        tm.setTheme("light");
        tm.toggle();
        expect(tm.getTheme()).toBe("dark");
        tm.toggle();
        expect(tm.getTheme()).toBe("amoled");
        tm.toggle();
        expect(tm.getTheme()).toBe("light");
    });

    it("toggle from dark goes to amoled", () => {
        const tm = ThemeManager.getInstance();
        tm.setTheme("dark");
        tm.toggle();
        expect(tm.getTheme()).toBe("amoled");
    });

    it("toggle from amoled goes to light", () => {
        const tm = ThemeManager.getInstance();
        tm.setTheme("amoled");
        tm.toggle();
        expect(tm.getTheme()).toBe("light");
    });

    it("setTheme sets the current theme", () => {
        const tm = ThemeManager.getInstance();
        tm.setTheme("dark");
        expect(tm.getTheme()).toBe("dark");
        tm.setTheme("amoled");
        expect(tm.getTheme()).toBe("amoled");
        tm.setTheme("light");
        expect(tm.getTheme()).toBe("light");
    });

    it("setTheme persists to localStorage", () => {
        const tm = ThemeManager.getInstance();
        tm.setTheme("dark");
        expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("toggle persists to localStorage", () => {
        const tm = ThemeManager.getInstance();
        tm.setTheme("light");
        tm.toggle();
        expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("applyTheme adds the dark class for dark theme", () => {
        const tm = ThemeManager.getInstance();
        tm.setTheme("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        expect(document.documentElement.classList.contains("light")).toBe(false);
        expect(document.documentElement.classList.contains("amoled")).toBe(false);
    });

    it("applyTheme adds the light class for light theme", () => {
        const tm = ThemeManager.getInstance();
        tm.setTheme("light");
        expect(document.documentElement.classList.contains("light")).toBe(true);
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("applyTheme adds the amoled class for amoled theme", () => {
        const tm = ThemeManager.getInstance();
        tm.setTheme("amoled");
        expect(document.documentElement.classList.contains("amoled")).toBe(true);
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        expect(document.documentElement.classList.contains("light")).toBe(false);
    });

    it("applyTheme removes previous theme classes when switching", () => {
        const tm = ThemeManager.getInstance();
        tm.setTheme("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        tm.setTheme("light");
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        expect(document.documentElement.classList.contains("light")).toBe(true);
    });

    it("setAutoDarkMode enables auto dark mode", () => {
        const tm = ThemeManager.getInstance();
        tm.setAutoDarkMode(true);
        expect(tm.isAutoDarkModeEnabled()).toBe(true);
        expect(localStorage.getItem("auto-dark-mode")).toBe("true");
    });

    it("setAutoDarkMode false disables auto dark mode", () => {
        const tm = ThemeManager.getInstance();
        tm.setAutoDarkMode(true);
        tm.setAutoDarkMode(false);
        expect(tm.isAutoDarkModeEnabled()).toBe(false);
        expect(localStorage.getItem("auto-dark-mode")).toBe("false");
    });

    it("setAutoDarkMode true sets an interval timer", () => {
        const tm = ThemeManager.getInstance();
        tm.setAutoDarkMode(true);
        expect(setIntervalSpy).toHaveBeenCalled();
    });

    it("setAutoDarkMode false clears the interval timer", () => {
        const tm = ThemeManager.getInstance();
        tm.setAutoDarkMode(true);
        tm.setAutoDarkMode(false);
        expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it("init reads the stored theme from localStorage", () => {
        localStorage.setItem("theme", "dark");
        const tm = ThemeManager.getInstance();
        tm.init();
        expect(tm.getTheme()).toBe("dark");
    });

    it("init defaults to light when no stored theme and system prefers light", () => {
        matchMediaSpy.mockReturnValue({
            matches: false,
            media: "(prefers-color-scheme: dark)",
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
            onchange: null,
        } as unknown as MediaQueryList);
        const tm = ThemeManager.getInstance();
        tm.init();
        expect(tm.getTheme()).toBe("light");
    });

    it("init defaults to dark when no stored theme and system prefers dark", () => {
        matchMediaSpy.mockReturnValue({
            matches: true,
            media: "(prefers-color-scheme: dark)",
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
            onchange: null,
        } as unknown as MediaQueryList);
        const tm = ThemeManager.getInstance();
        tm.init();
        expect(tm.getTheme()).toBe("dark");
    });

    it("init enables auto dark mode when stored as true", () => {
        localStorage.setItem("auto-dark-mode", "true");
        const tm = ThemeManager.getInstance();
        tm.init();
        expect(tm.isAutoDarkModeEnabled()).toBe(true);
    });

    it("subscribe registers a listener that is notified on theme change", () => {
        const tm = ThemeManager.getInstance();
        const listener = vi.fn();
        tm.subscribe(listener);
        tm.setTheme("dark");
        expect(listener).toHaveBeenCalledWith("dark");
    });

    it("subscribe does not register the same listener twice", () => {
        const tm = ThemeManager.getInstance();
        const listener = vi.fn();
        tm.subscribe(listener);
        tm.subscribe(listener);
        tm.setTheme("dark");
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("unsubscribe removes a previously registered listener", () => {
        const tm = ThemeManager.getInstance();
        const listener = vi.fn();
        tm.subscribe(listener);
        tm.unsubscribe(listener);
        tm.setTheme("dark");
        expect(listener).not.toHaveBeenCalled();
    });

    it("unsubscribe does nothing for a listener that was never registered", () => {
        const tm = ThemeManager.getInstance();
        const listener = vi.fn();
        expect(() => tm.unsubscribe(listener)).not.toThrow();
    });

    it("notifies all subscribed listeners", () => {
        const tm = ThemeManager.getInstance();
        const listener1 = vi.fn();
        const listener2 = vi.fn();
        tm.subscribe(listener1);
        tm.subscribe(listener2);
        tm.setTheme("amoled");
        expect(listener1).toHaveBeenCalledWith("amoled");
        expect(listener2).toHaveBeenCalledWith("amoled");
    });

    it("applyTheme updates the theme-color meta tag for dark", () => {
        const meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        document.head.appendChild(meta);
        const tm = ThemeManager.getInstance();
        tm.setTheme("dark");
        expect(meta.getAttribute("content")).toBe("#1a1a1a");
    });

    it("applyTheme updates the theme-color meta tag for amoled", () => {
        const meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        document.head.appendChild(meta);
        const tm = ThemeManager.getInstance();
        tm.setTheme("amoled");
        expect(meta.getAttribute("content")).toBe("#000000");
    });

    it("applyTheme updates the theme-color meta tag for light", () => {
        const meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        document.head.appendChild(meta);
        const tm = ThemeManager.getInstance();
        tm.setTheme("light");
        expect(meta.getAttribute("content")).toBe("#2d5a3d");
    });

    it("applyTheme does not crash when there is no theme-color meta tag", () => {
        const tm = ThemeManager.getInstance();
        expect(() => tm.setTheme("dark")).not.toThrow();
    });

    it("applyTheme updates the toggle button when present", () => {
        const toggle = document.createElement("button");
        toggle.id = "theme-toggle";
        document.body.appendChild(toggle);
        const tm = ThemeManager.getInstance();
        tm.setTheme("dark");
        expect(toggle.getAttribute("aria-pressed")).toBe("true");
        expect(toggle.getAttribute("aria-label")).toBe("Switch to light mode");
    });

    it("applyTheme sets aria-pressed false for light theme toggle", () => {
        const toggle = document.createElement("button");
        toggle.id = "theme-toggle";
        document.body.appendChild(toggle);
        const tm = ThemeManager.getInstance();
        tm.setTheme("light");
        expect(toggle.getAttribute("aria-pressed")).toBe("false");
        expect(toggle.getAttribute("aria-label")).toBe("Switch to dark mode");
    });

    it("applyTheme sets aria-pressed true for amoled theme toggle", () => {
        const toggle = document.createElement("button");
        toggle.id = "theme-toggle";
        document.body.appendChild(toggle);
        const tm = ThemeManager.getInstance();
        tm.setTheme("amoled");
        expect(toggle.getAttribute("aria-pressed")).toBe("true");
    });

    it("applyTheme does not crash when there is no toggle button", () => {
        const tm = ThemeManager.getInstance();
        expect(() => tm.setTheme("dark")).not.toThrow();
    });
});
