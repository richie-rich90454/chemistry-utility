import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

let html: string;
let doc: Document;

beforeAll(() => {
    const htmlPath = resolve(__dirname, "../../index.html");
    html = readFileSync(htmlPath, "utf-8");
    const parser = new DOMParser();
    doc = parser.parseFromString(html, "text/html");
});

describe("Accessibility: HTML Structure", () => {
    it("has a skip link pointing to #main-content", () => {
        const skipLink = doc.querySelector("a.skip-link");
        expect(skipLink).toBeTruthy();
        expect(skipLink?.getAttribute("href")).toBe("#main-content");
    });

    it("has a theme toggle button with aria-label", () => {
        const toggle = doc.getElementById("theme-toggle");
        expect(toggle).toBeTruthy();
        expect(toggle?.getAttribute("aria-label")).toBeTruthy();
    });

    it("has a scroll-to-top button with aria-label", () => {
        const scrollTop = doc.getElementById("scroll-top");
        expect(scrollTop).toBeTruthy();
        expect(scrollTop?.getAttribute("aria-label")).toBeTruthy();
    });

    it("has a main element with id main-content", () => {
        const main = doc.getElementById("main-content");
        expect(main).toBeTruthy();
        expect(main?.tagName.toLowerCase()).toBe("main");
    });

    it("has a nav element inside an aside with aria-label", () => {
        const nav = doc.querySelector("nav");
        expect(nav).toBeTruthy();
        // The aria-label is on the parent aside, not the nav itself
        const aside = nav?.closest("aside");
        expect(aside?.getAttribute("aria-label")).toBeTruthy();
    });

    it("has html element with lang attribute", () => {
        const htmlEl = doc.querySelector("html");
        expect(htmlEl?.getAttribute("lang")).toBe("en");
    });

    it("all input elements have aria-label or associated label", () => {
        const inputs = doc.querySelectorAll("input");
        for (const input of inputs) {
            const ariaLabel = input.getAttribute("aria-label");
            const id = input.getAttribute("id");
            let hasLabel = false;
            if (ariaLabel) {
                hasLabel = true;
            } else if (id) {
                const label = doc.querySelector(`label[for="${id}"]`);
                hasLabel = !!label;
            }
            expect(hasLabel).toBe(true);
        }
    });

    it("all select elements have aria-label or associated label", () => {
        const selects = doc.querySelectorAll("select");
        for (const select of selects) {
            const ariaLabel = select.getAttribute("aria-label");
            const id = select.getAttribute("id");
            let hasLabel = false;
            if (ariaLabel) {
                hasLabel = true;
            } else if (id) {
                const label = doc.querySelector(`label[for="${id}"]`);
                hasLabel = !!label;
            }
            expect(hasLabel).toBe(true);
        }
    });

    it("all buttons have accessible names", () => {
        const buttons = doc.querySelectorAll("button");
        for (const button of buttons) {
            const text = button.textContent?.trim();
            const ariaLabel = button.getAttribute("aria-label");
            const hasAccessibleName = !!(text || ariaLabel);
            expect(hasAccessibleName).toBe(true);
        }
    });

    it("sections use h2 headings", () => {
        const sections = doc.querySelectorAll(".main-groups");
        expect(sections.length).toBeGreaterThan(0);
        for (const section of sections) {
            const h2 = section.querySelector("h2");
            expect(h2).toBeTruthy();
        }
    });

    it("subsections use h3 headings", () => {
        const subGroups = doc.querySelectorAll(".sub-group");
        for (const sub of subGroups) {
            const h3 = sub.querySelector("h3");
            expect(h3).toBeTruthy();
        }
    });
});
