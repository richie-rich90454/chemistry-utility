import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock animationUtils before importing uiHandlers
vi.mock("./animationUtils.js", () => ({
    slideDown: vi.fn(),
    slideUp: vi.fn(),
}));

import { initializeUIHandlers } from "./uiHandlers";
import { slideDown, slideUp } from "./animationUtils.js";

const mockedSlideDown = vi.mocked(slideDown);
const mockedSlideUp = vi.mocked(slideUp);

describe("uiHandlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    function createSection(id: string, collapsed = false): HTMLElement {
        const section = document.createElement("div");
        section.className = "main-groups" + (collapsed ? " collapsed" : "");
        section.id = id;

        const h2 = document.createElement("h2");
        h2.textContent = id;
        section.appendChild(h2);

        const content = document.createElement("div");
        content.className = "content";
        content.textContent = "Content for " + id;
        section.appendChild(content);

        document.body.appendChild(section);
        return section;
    }

    function createClearButton(sectionId: string): { button: HTMLElement; section: HTMLElement } {
        const section = document.createElement("div");
        section.id = sectionId;
        document.body.appendChild(section);

        const input = document.createElement("input");
        input.id = "test-input";
        input.value = "some value";
        input.classList.add("error");
        section.appendChild(input);

        const select = document.createElement("select");
        select.id = "test-select";
        const opt1 = document.createElement("option");
        opt1.value = "";
        opt1.textContent = "Default";
        const opt2 = document.createElement("option");
        opt2.value = "val";
        opt2.textContent = "Value";
        select.appendChild(opt1);
        select.appendChild(opt2);
        select.selectedIndex = 1;
        section.appendChild(select);

        const result = document.createElement("div");
        result.className = "result show";
        result.innerHTML = "<p>Some result</p>";
        section.appendChild(result);

        const button = document.createElement("button");
        button.className = "clear-button";
        button.dataset.section = sectionId;
        document.body.appendChild(button);

        return { button, section };
    }

    describe("collapsible section toggle", () => {
        it("clicking expanded section h2 adds collapsed class and calls slideUp", () => {
            const section = createSection("sec1");
            initializeUIHandlers();

            const h2 = section.querySelector("h2")!;
            h2.click();

            expect(section.classList.contains("collapsed")).toBe(true);
            expect(mockedSlideUp).toHaveBeenCalled();
            expect(mockedSlideDown).not.toHaveBeenCalled();
        });

        it("clicking collapsed section h2 removes collapsed class and calls slideDown", () => {
            const section = createSection("sec2", true);
            initializeUIHandlers();

            const h2 = section.querySelector("h2")!;
            h2.click();

            expect(section.classList.contains("collapsed")).toBe(false);
            expect(mockedSlideDown).toHaveBeenCalled();
            expect(mockedSlideUp).not.toHaveBeenCalled();
        });

        it("multiple sections toggle independently", () => {
            const section1 = createSection("sec-a");
            const section2 = createSection("sec-b", true);
            initializeUIHandlers();

            section1.querySelector("h2")!.click();
            expect(section1.classList.contains("collapsed")).toBe(true);
            expect(section2.classList.contains("collapsed")).toBe(true);

            section2.querySelector("h2")!.click();
            expect(section1.classList.contains("collapsed")).toBe(true);
            expect(section2.classList.contains("collapsed")).toBe(false);
        });

        it("calls slideUp with correct duration (300ms) for each child", () => {
            const section = createSection("sec3");
            // Add another child element
            const extra = document.createElement("div");
            extra.className = "extra";
            section.appendChild(extra);

            initializeUIHandlers();
            section.querySelector("h2")!.click();

            // Should be called once for each non-h2 child (content + extra = 2)
            expect(mockedSlideUp).toHaveBeenCalledTimes(2);
            mockedSlideUp.mock.calls.forEach(call => {
                expect(call[1]).toBe(300);
            });
        });
    });

    describe("clear button", () => {
        it("clears input values and removes error class", () => {
            const { button } = createClearButton("clear-section-1");
            initializeUIHandlers();

            const input = document.getElementById("test-input") as HTMLInputElement;
            expect(input.value).toBe("some value");
            expect(input.classList.contains("error")).toBe(true);

            button.click();

            expect(input.value).toBe("");
            expect(input.classList.contains("error")).toBe(false);
        });

        it("resets select elements to index 0", () => {
            const { button } = createClearButton("clear-section-2");
            initializeUIHandlers();

            const select = document.getElementById("test-select") as HTMLSelectElement;
            expect(select.selectedIndex).toBe(1);

            button.click();

            expect(select.selectedIndex).toBe(0);
        });

        it("clears result innerHTML and removes show class", () => {
            const { button } = createClearButton("clear-section-3");
            initializeUIHandlers();

            const result = document.querySelector(".result") as HTMLElement;
            expect(result.innerHTML).not.toBe("");
            expect(result.classList.contains("show")).toBe(true);

            button.click();

            expect(result.innerHTML).toBe("");
            expect(result.classList.contains("show")).toBe(false);
        });

        it("does not crash when result element is missing", () => {
            const section = document.createElement("div");
            section.id = "no-result-section";
            const input = document.createElement("input");
            input.id = "nr-input";
            section.appendChild(input);
            document.body.appendChild(section);

            const button = document.createElement("button");
            button.className = "clear-button";
            button.dataset.section = "no-result-section";
            document.body.appendChild(button);

            expect(() => {
                initializeUIHandlers();
                button.click();
            }).not.toThrow();
        });
    });
});
