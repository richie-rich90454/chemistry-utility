import { describe, it, expect, beforeEach } from "vitest";
import { ResultDisplay } from "./resultDisplay.js";

describe("ResultDisplay", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const div = document.createElement("div");
        div.id = "res";
        document.body.appendChild(div);
    });

    it("showResult sets html and adds show class", () => {
        const display = new ResultDisplay("res");
        display.showResult("<p>42</p>");
        const el = document.getElementById("res")!;
        expect(el.innerHTML).toBe("<p>42</p>");
        expect(el.classList.contains("show")).toBe(true);
    });

    it("showError escapes the message", () => {
        const display = new ResultDisplay("res");
        display.showError("<script>alert(1)</script>");
        const el = document.getElementById("res")!;
        expect(el.innerHTML).toContain("Error:");
        expect(el.innerHTML).not.toContain("<script>");
        expect(el.classList.contains("show")).toBe(true);
    });

    it("showFormula renders formula, formatted result and escaped unit", () => {
        const display = new ResultDisplay("res");
        display.showFormula("H2O", 1234.56789, "<g>");
        const el = document.getElementById("res")!;
        expect(el.innerHTML).toContain("H2O");
        expect(el.innerHTML).toContain("Result:");
        expect(el.innerHTML).not.toContain("<g>");
        expect(el.classList.contains("show")).toBe(true);
    });

    it("clear empties html and removes show class", () => {
        const display = new ResultDisplay("res");
        display.showResult("x");
        display.clear();
        const el = document.getElementById("res")!;
        expect(el.innerHTML).toBe("");
        expect(el.classList.contains("show")).toBe(false);
    });

    it("show and hide toggle the show class", () => {
        const display = new ResultDisplay("res");
        display.show();
        expect(document.getElementById("res")!.classList.contains("show")).toBe(true);
        display.hide();
        expect(document.getElementById("res")!.classList.contains("show")).toBe(false);
    });

    it("getElement returns the underlying element", () => {
        const display = new ResultDisplay("res");
        expect(display.getElement()).toBe(document.getElementById("res"));
    });
});
