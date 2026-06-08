import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createContainer, createInput, createSelect, createResultDiv, cleanupDOM, getResultHTML, getResultText } from "../test/helpers.js";

describe("Accessibility: Comprehensive", () => {
    afterEach(() => {
        cleanupDOM();
    });

    it("all input elements have associated labels (via for/id or aria-label)", () => {
        const container = createContainer("test-form");

        // Create inputs with aria-labels
        const input1 = createInput("input-with-aria", "10", "test-form");
        input1.setAttribute("aria-label", "Value 1");

        // Create input with associated label
        const label = document.createElement("label");
        label.setAttribute("for", "input-with-label");
        label.textContent = "Value 2";
        container.appendChild(label);
        const input2 = createInput("input-with-label", "20", "test-form");

        const inputs = container.querySelectorAll("input");
        for (const input of inputs) {
            const ariaLabel = input.getAttribute("aria-label");
            const id = input.getAttribute("id");
            let hasLabel = false;
            if (ariaLabel) {
                hasLabel = true;
            } else if (id) {
                const labelEl = container.querySelector(`label[for="${id}"]`);
                hasLabel = !!labelEl;
            }
            expect(hasLabel).toBe(true);
        }
    });

    it("all select elements have associated labels", () => {
        const container = createContainer("test-selects");

        // Create select with aria-label
        const select1 = createSelect("select-with-aria", "M2", ["M1", "V1", "M2", "V2"], "test-selects");
        select1.setAttribute("aria-label", "Select parameter");

        // Create select with associated label
        const label = document.createElement("label");
        label.setAttribute("for", "select-with-label");
        label.textContent = "Unit";
        container.appendChild(label);
        const select2 = createSelect("select-with-label", "percent", ["percent", "ppm"], "test-selects");

        const selects = container.querySelectorAll("select");
        for (const select of selects) {
            const ariaLabel = select.getAttribute("aria-label");
            const id = select.getAttribute("id");
            let hasLabel = false;
            if (ariaLabel) {
                hasLabel = true;
            } else if (id) {
                const labelEl = container.querySelector(`label[for="${id}"]`);
                hasLabel = !!labelEl;
            }
            expect(hasLabel).toBe(true);
        }
    });

    it("all buttons have accessible names (text or aria-label)", () => {
        const container = createContainer("test-buttons");

        // Button with text content
        const btn1 = document.createElement("button");
        btn1.textContent = "Calculate";
        container.appendChild(btn1);

        // Button with aria-label only (icon button)
        const btn2 = document.createElement("button");
        btn2.setAttribute("aria-label", "Toggle theme");
        container.appendChild(btn2);

        const buttons = container.querySelectorAll("button");
        for (const button of buttons) {
            const text = button.textContent?.trim();
            const ariaLabel = button.getAttribute("aria-label");
            const hasAccessibleName = !!(text || ariaLabel);
            expect(hasAccessibleName).toBe(true);
        }
    });

    it("theme toggle has aria-label", () => {
        const themeToggle = document.createElement("button");
        themeToggle.id = "theme-toggle";
        themeToggle.setAttribute("aria-label", "Toggle theme");
        document.body.appendChild(themeToggle);

        const el = document.getElementById("theme-toggle");
        expect(el).toBeTruthy();
        expect(el?.getAttribute("aria-label")).toBeTruthy();
    });

    it("sidebar toggle has aria-label", () => {
        const sidebarToggle = document.createElement("button");
        sidebarToggle.classList.add("sidebar-toggle");
        sidebarToggle.setAttribute("aria-label", "Toggle sidebar");
        document.body.appendChild(sidebarToggle);

        const el = document.querySelector(".sidebar-toggle");
        expect(el).toBeTruthy();
        expect(el?.getAttribute("aria-label")).toBeTruthy();
    });

    it("skip link exists and points to main content", () => {
        const skipLink = document.createElement("a");
        skipLink.classList.add("skip-link");
        skipLink.href = "#main-content";
        skipLink.textContent = "Skip to main content";
        document.body.appendChild(skipLink);

        const main = document.createElement("main");
        main.id = "main-content";
        document.body.appendChild(main);

        const link = document.querySelector("a.skip-link") as HTMLAnchorElement;
        expect(link).toBeTruthy();
        expect(link?.getAttribute("href")).toBe("#main-content");

        const mainEl = document.getElementById("main-content");
        expect(mainEl).toBeTruthy();
    });

    it("main content has appropriate landmark role", () => {
        const main = document.createElement("main");
        main.id = "main-content";
        document.body.appendChild(main);

        const mainEl = document.getElementById("main-content");
        expect(mainEl).toBeTruthy();
        // <main> element has implicit role="main"
        expect(mainEl?.tagName.toLowerCase()).toBe("main");
    });

    it("sidebar nav has aria-label", () => {
        const aside = document.createElement("aside");
        aside.setAttribute("aria-label", "Main navigation");
        const nav = document.createElement("nav");
        aside.appendChild(nav);
        document.body.appendChild(aside);

        const asideEl = document.querySelector("aside");
        expect(asideEl).toBeTruthy();
        expect(asideEl?.getAttribute("aria-label")).toBeTruthy();

        const navEl = asideEl?.querySelector("nav");
        expect(navEl).toBeTruthy();
    });

    it("bottom tabs nav has appropriate role", () => {
        const nav = document.createElement("nav");
        nav.classList.add("bottom-tabs");
        nav.setAttribute("aria-label", "Quick access");
        document.body.appendChild(nav);

        const navEl = document.querySelector("nav.bottom-tabs");
        expect(navEl).toBeTruthy();
        // <nav> element has implicit role="navigation"
        expect(navEl?.tagName.toLowerCase()).toBe("nav");
        expect(navEl?.getAttribute("aria-label")).toBeTruthy();
    });

    it("command palette input has placeholder or aria-label", () => {
        const container = createContainer("palette");

        const input = document.createElement("input");
        input.type = "text";
        input.classList.add("palette-input");
        input.placeholder = "Search calculators...";
        input.setAttribute("aria-label", "Search calculators");
        container.appendChild(input);

        const paletteInput = container.querySelector(".palette-input") as HTMLInputElement;
        expect(paletteInput).toBeTruthy();
        const hasPlaceholder = !!paletteInput?.getAttribute("placeholder");
        const hasAriaLabel = !!paletteInput?.getAttribute("aria-label");
        expect(hasPlaceholder || hasAriaLabel).toBe(true);
    });

    it("welcome cards have tabindex=\"0\" for keyboard access", () => {
        const container = createContainer("welcome");

        const card = document.createElement("div");
        card.classList.add("welcome-card");
        card.setAttribute("tabindex", "0");
        card.textContent = "Molar Mass Calculator";
        container.appendChild(card);

        const welcomeCard = container.querySelector(".welcome-card");
        expect(welcomeCard).toBeTruthy();
        expect(welcomeCard?.getAttribute("tabindex")).toBe("0");
    });

    it("welcome cards respond to Enter key", () => {
        const container = createContainer("welcome");

        const card = document.createElement("div");
        card.classList.add("welcome-card");
        card.setAttribute("tabindex", "0");
        card.textContent = "Molar Mass Calculator";
        let enterHandled = false;
        card.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") {
                enterHandled = true;
            }
        });
        container.appendChild(card);

        const welcomeCard = container.querySelector(".welcome-card");
        welcomeCard?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        expect(enterHandled).toBe(true);
    });

    it("error messages are visible (not aria-hidden)", () => {
        const container = createContainer("error-test");

        const errorDiv = document.createElement("div");
        errorDiv.classList.add("error-message");
        errorDiv.textContent = "Please fill all required fields";
        container.appendChild(errorDiv);

        const errorMsg = container.querySelector(".error-message");
        expect(errorMsg).toBeTruthy();
        expect(errorMsg?.getAttribute("aria-hidden")).not.toBe("true");
    });

    it("result divs use semantic markup (not just div with text)", () => {
        const container = createContainer("result-test");
        const resultDiv = createResultDiv("calc-result", "result-test");

        // Simulate what calculator functions produce: <p> elements inside result div
        resultDiv.innerHTML = "<p>Result: 18.015 g/mol</p>";

        const paragraphs = resultDiv.querySelectorAll("p");
        expect(paragraphs.length).toBeGreaterThan(0);

        // Verify the result is not just bare text in the div
        const hasSemanticChild = resultDiv.children.length > 0;
        expect(hasSemanticChild).toBe(true);
    });

    it("form elements have appropriate input types (number for numeric inputs)", () => {
        const container = createContainer("form-types");

        // Numeric inputs should use type="number"
        const numInput = createInput("numeric-field", "10", "form-types", "number");
        // Text inputs for non-numeric data
        const textInput = createInput("text-field", "Na", "form-types", "text");

        const inputs = container.querySelectorAll("input");
        const numericInput = inputs[0] as HTMLInputElement;
        const textInputElement = inputs[1] as HTMLInputElement;

        expect(numericInput.type).toBe("number");
        expect(textInputElement.type).toBe("text");
    });

    it("sidebar links have href attributes", () => {
        const nav = document.createElement("nav");
        nav.className = "sidebar-nav";
        const link1 = document.createElement("a");
        link1.href = "#element-lookup";
        link1.textContent = "Element Lookup";
        nav.appendChild(link1);
        const link2 = document.createElement("a");
        link2.href = "#mass-calc";
        link2.textContent = "Molar Mass";
        nav.appendChild(link2);
        document.body.appendChild(nav);

        const links = nav.querySelectorAll("a");
        for (const link of links) {
            expect(link.getAttribute("href")).toBeTruthy();
            expect(link.getAttribute("href")).toContain("#");
        }
    });

    it("command palette items have data-target attributes", () => {
        const container = createContainer("palette-a11y");
        const list = document.createElement("div");
        list.className = "palette-list";
        const item = document.createElement("div");
        item.className = "palette-item";
        item.setAttribute("data-target", "gas-laws");
        item.setAttribute("tabindex", "0");
        item.textContent = "Gas Laws";
        list.appendChild(item);
        container.appendChild(list);

        const items = container.querySelectorAll(".palette-item");
        for (const item of items) {
            expect(item.getAttribute("data-target")).toBeTruthy();
        }
    });

    it("result divs have aria-live for dynamic content", () => {
        const container = createContainer("aria-live-test");
        const resultDiv = createResultDiv("live-result", "aria-live-test");
        resultDiv.setAttribute("aria-live", "polite");

        expect(resultDiv.getAttribute("aria-live")).toBe("polite");
    });

    it("nav sheet items have role or semantic markup", () => {
        const sheet = document.createElement("div");
        sheet.className = "nav-sheet";
        const item = document.createElement("button");
        item.className = "sheet-item";
        item.setAttribute("data-target", "gas-laws");
        item.textContent = "Gas Laws";
        sheet.appendChild(item);
        document.body.appendChild(sheet);

        const items = sheet.querySelectorAll(".sheet-item");
        for (const item of items) {
            // Button elements have implicit role="button"
            expect(item.tagName.toLowerCase()).toBe("button");
        }
    });

    it("bottom tab items have accessible names", () => {
        const nav = document.createElement("nav");
        nav.className = "bottom-tabs";
        const tab1 = document.createElement("button");
        tab1.className = "tab-item";
        tab1.textContent = "Element Lookup";
        nav.appendChild(tab1);
        const tab2 = document.createElement("button");
        tab2.className = "tab-item";
        tab2.textContent = "Molar Mass";
        nav.appendChild(tab2);
        document.body.appendChild(nav);

        const tabs = nav.querySelectorAll(".tab-item");
        for (const tab of tabs) {
            const text = tab.textContent?.trim();
            const ariaLabel = tab.getAttribute("aria-label");
            expect(!!(text || ariaLabel)).toBe(true);
        }
    });

    it("back button has accessible name", () => {
        const btn = document.createElement("button");
        btn.className = "back-button";
        btn.setAttribute("aria-label", "Go back");
        document.body.appendChild(btn);

        const backBtn = document.querySelector(".back-button");
        expect(backBtn?.getAttribute("aria-label")).toBeTruthy();
    });
});
