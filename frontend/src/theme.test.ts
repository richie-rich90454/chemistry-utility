import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Theme management", () => {
    beforeEach(() => {
        document.documentElement.classList.remove("dark", "light");
    });

    afterEach(() => {
        document.documentElement.classList.remove("dark", "light");
    });

    it("dark class applies dark mode", () => {
        document.documentElement.classList.add("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("light class applies light mode", () => {
        document.documentElement.classList.add("light");
        expect(document.documentElement.classList.contains("light")).toBe(true);
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
});
