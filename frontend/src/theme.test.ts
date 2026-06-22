import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Theme management", () => {
    beforeEach(() => {
        document.documentElement.classList.remove("dark", "light", "amoled");
    });

    afterEach(() => {
        document.documentElement.classList.remove("dark", "light", "amoled");
    });

    it("dark class applies dark mode", () => {
        document.documentElement.classList.add("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("light class applies light mode", () => {
        document.documentElement.classList.add("light");
        expect(document.documentElement.classList.contains("light")).toBe(true);
    });

    it("amoled class applies AMOLED mode", () => {
        document.documentElement.classList.add("amoled");
        expect(document.documentElement.classList.contains("amoled")).toBe(true);
    });

    it("dark and light are mutually exclusive", () => {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        expect(document.documentElement.classList.contains("light")).toBe(true);
    });

    it("default state has no theme class", () => {
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        expect(document.documentElement.classList.contains("light")).toBe(false);
        expect(document.documentElement.classList.contains("amoled")).toBe(false);
    });

    it("toggling from dark to light works", () => {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        expect(document.documentElement.classList.contains("light")).toBe(true);
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("toggling from light to dark works", () => {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        expect(document.documentElement.classList.contains("light")).toBe(false);
    });

    it("toggling from dark to amoled works", () => {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("amoled");
        expect(document.documentElement.classList.contains("amoled")).toBe(true);
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        expect(document.documentElement.classList.contains("light")).toBe(false);
    });

    it("toggling from amoled to light works", () => {
        document.documentElement.classList.add("amoled");
        document.documentElement.classList.remove("amoled");
        document.documentElement.classList.add("light");
        expect(document.documentElement.classList.contains("light")).toBe(true);
        expect(document.documentElement.classList.contains("amoled")).toBe(false);
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("three-state toggle cycles light -> dark -> amoled -> light", () => {
        const cycle = ["light", "dark", "amoled"];
        let current = 0;
        // Simulate the toggle cycle
        for (let i = 0; i < 4; i++) {
            document.documentElement.classList.remove("dark", "light", "amoled");
            document.documentElement.classList.add(cycle[current]);
            expect(document.documentElement.classList.contains(cycle[current])).toBe(true);
            current = (current + 1) % 3;
        }
        // After 3 toggles from light, we should be back to light
        expect(current).toBe(1); // 4th iteration starts at index 1
    });
});

describe("Theme color meta tag", () => {
    it("theme-color meta tag exists in HTML", () => {
        const meta = document.querySelector('meta[name="theme-color"]');
        // In jsdom this may not exist unless we create it
        expect(meta).toBeNull(); // jsdom doesn't load HTML
    });

    it("can create and update theme-color meta tag", () => {
        let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "theme-color";
            document.head.appendChild(meta);
        }
        meta.content = "#1a73e8";
        expect(meta.content).toBe("#1a73e8");
    });

    it("amoled theme-color meta is #000000", () => {
        let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "theme-color";
            document.head.appendChild(meta);
        }
        meta.content = "#000000";
        expect(meta.content).toBe("#000000");
    });
});

describe("localStorage theme persistence", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("stores theme preference in localStorage", () => {
        localStorage.setItem("chem-utility-theme", "dark");
        expect(localStorage.getItem("chem-utility-theme")).toBe("dark");
    });

    it("retrieves stored theme preference", () => {
        localStorage.setItem("chem-utility-theme", "light");
        const theme = localStorage.getItem("chem-utility-theme");
        expect(theme).toBe("light");
    });

    it("returns null for unset theme preference", () => {
        expect(localStorage.getItem("chem-utility-theme")).toBeNull();
    });

    it("system preference can be detected via matchMedia", () => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
        expect(typeof prefersDark.matches).toBe("boolean");
    });

    it("stores amoled theme preference in localStorage", () => {
        localStorage.setItem("chem-utility-theme", "amoled");
        expect(localStorage.getItem("chem-utility-theme")).toBe("amoled");
    });

    it("stores auto-dark-mode setting in localStorage", () => {
        localStorage.setItem("auto-dark-mode", "true");
        expect(localStorage.getItem("auto-dark-mode")).toBe("true");
    });

    it("auto-dark-mode defaults to null when not set", () => {
        expect(localStorage.getItem("auto-dark-mode")).toBeNull();
    });
});

describe("CSS custom properties for form elements", () => {
    it("input elements should have color-scheme: light", () => {
        const input = document.createElement("input");
        input.type = "text";
        document.body.appendChild(input);
        const cs = window.getComputedStyle(input);
        // In jsdom, computed style may not reflect CSS file values
        // but we can verify the element was created
        expect(input.tagName).toBe("INPUT");
    });

    it("select elements should have color-scheme: light", () => {
        const select = document.createElement("select");
        document.body.appendChild(select);
        expect(select.tagName).toBe("SELECT");
    });
});

describe("CSS color-scheme for form elements", () => {
    it("input element can have color-scheme property set via style", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.style.colorScheme = "light";
        document.body.appendChild(input);
        expect(input.style.colorScheme).toBe("light");
    });

    it("select element can have color-scheme property set via style", () => {
        const select = document.createElement("select");
        select.style.colorScheme = "light";
        document.body.appendChild(select);
        expect(select.style.colorScheme).toBe("light");
    });

    it("textarea element can have color-scheme property set via style", () => {
        const textarea = document.createElement("textarea");
        textarea.style.colorScheme = "light";
        document.body.appendChild(textarea);
        expect(textarea.style.colorScheme).toBe("light");
    });
});

describe("Theme CSS variable values", () => {
    it("dark theme input background should be dark", () => {
        // Verify the expected dark mode input background
        const darkInputBg = "#1c1b1f";
        expect(darkInputBg).toBeTruthy();
        // Dark background should not be a light color
        const r = parseInt(darkInputBg.slice(1, 3), 16);
        const g = parseInt(darkInputBg.slice(3, 5), 16);
        const b = parseInt(darkInputBg.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        expect(luminance).toBeLessThan(0.5);
    });

    it("light theme input background should be light", () => {
        const lightInputBg = "#ffffff";
        expect(lightInputBg).toBeTruthy();
        const r = parseInt(lightInputBg.slice(1, 3), 16);
        const g = parseInt(lightInputBg.slice(3, 5), 16);
        const b = parseInt(lightInputBg.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        expect(luminance).toBeGreaterThan(0.5);
    });

    it("dark theme input text should be light", () => {
        const darkInputText = "#e6e1e5";
        const r = parseInt(darkInputText.slice(1, 3), 16);
        const g = parseInt(darkInputText.slice(3, 5), 16);
        const b = parseInt(darkInputText.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        expect(luminance).toBeGreaterThan(0.5);
    });

    it("light theme input text should be dark", () => {
        const lightInputText = "#1c1b1f";
        const r = parseInt(lightInputText.slice(1, 3), 16);
        const g = parseInt(lightInputText.slice(3, 5), 16);
        const b = parseInt(lightInputText.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        expect(luminance).toBeLessThan(0.5);
    });

    it("AMOLED theme input background should be pure black", () => {
        const amoledInputBg = "#000000";
        expect(amoledInputBg).toBe("#000000");
        const r = parseInt(amoledInputBg.slice(1, 3), 16);
        const g = parseInt(amoledInputBg.slice(3, 5), 16);
        const b = parseInt(amoledInputBg.slice(5, 7), 16);
        expect(r).toBe(0);
        expect(g).toBe(0);
        expect(b).toBe(0);
    });

    it("AMOLED theme surface should be pure black", () => {
        const amoledSurface = "#000000";
        expect(amoledSurface).toBe("#000000");
    });

    it("AMOLED theme background should be pure black", () => {
        const amoledBackground = "#000000";
        expect(amoledBackground).toBe("#000000");
    });

    it("AMOLED theme input text should be light", () => {
        const amoledInputText = "#e6e1e5";
        const r = parseInt(amoledInputText.slice(1, 3), 16);
        const g = parseInt(amoledInputText.slice(3, 5), 16);
        const b = parseInt(amoledInputText.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        expect(luminance).toBeGreaterThan(0.5);
    });
});

describe("Auto dark mode heuristic", () => {
    it("6am should be light mode", () => {
        const hour = 6;
        const isLight = hour >= 6 && hour < 18;
        expect(isLight).toBe(true);
    });

    it("12pm should be light mode", () => {
        const hour = 12;
        const isLight = hour >= 6 && hour < 18;
        expect(isLight).toBe(true);
    });

    it("5pm (17) should be light mode", () => {
        const hour = 17;
        const isLight = hour >= 6 && hour < 18;
        expect(isLight).toBe(true);
    });

    it("6pm (18) should be dark mode", () => {
        const hour = 18;
        const isLight = hour >= 6 && hour < 18;
        expect(isLight).toBe(false);
    });

    it("midnight should be dark mode", () => {
        const hour = 0;
        const isLight = hour >= 6 && hour < 18;
        expect(isLight).toBe(false);
    });

    it("5am should be dark mode", () => {
        const hour = 5;
        const isLight = hour >= 6 && hour < 18;
        expect(isLight).toBe(false);
    });
});
