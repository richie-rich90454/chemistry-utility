import {describe, it, expect, beforeEach} from "vitest";
import {
    createContainer,
    createInput,
    createSelect,
    createResultDiv,
    setOrCreateInput,
    setOrCreateSelect,
    getResultHTML,
    setupCalculatorDOM,
    cleanupDOM,
    setInputValue,
    getResultText,
} from "./helpers";

describe("test helpers coverage", function (): void {
    beforeEach(function (): void {
        document.body.innerHTML = "";
    });

    it("createContainer appends div with id", function (): void {
        let div = createContainer("c1");
        expect(div.id).toBe("c1");
        expect(document.getElementById("c1")).toBe(div);
    });

    it("createInput creates number input with step any", function (): void {
        createContainer("p1");
        let input = createInput("i1", "3.14", "p1");
        expect(input.id).toBe("i1");
        expect(input.value).toBe("3.14");
        expect(input.type).toBe("number");
        expect(input.step).toBe("any");
    });

    it("createInput supports custom type", function (): void {
        createContainer("p2");
        let input = createInput("i2", "hello", "p2", "text");
        expect(input.type).toBe("text");
        expect(input.value).toBe("hello");
    });

    it("createSelect builds options and sets value", function (): void {
        createContainer("p3");
        let select = createSelect("s1", "b", ["a", "b", "c"], "p3");
        expect(select.value).toBe("b");
        expect(select.options.length).toBe(3);
    });

    it("createResultDiv appends div", function (): void {
        createContainer("p4");
        let div = createResultDiv("r1", "p4");
        expect(document.getElementById("r1")).toBe(div);
    });

    it("setOrCreateInput creates when missing and reuses when present", function (): void {
        createContainer("p5");
        let first = setOrCreateInput("si1", "1", "p5");
        expect(first.value).toBe("1");
        expect(first.step).toBe("any");
        let second = setOrCreateInput("si1", "2", "p5");
        expect(second).toBe(first);
        expect(second.value).toBe("2");
        second.classList.add("error");
        let third = setOrCreateInput("si1", "3", "p5");
        expect(third.classList.contains("error")).toBe(false);
    });

    it("setOrCreateInput supports non-number type without step", function (): void {
        createContainer("p6");
        let input = setOrCreateInput("si2", "hi", "p6", "text");
        expect(input.type).toBe("text");
        expect(input.step).not.toBe("any");
    });

    it("setOrCreateInput uses default type number", function (): void {
        createContainer("p6b");
        let input = setOrCreateInput("si2b", "5", "p6b");
        expect(input.type).toBe("number");
    });

    it("setOrCreateSelect creates with provided options and reuses", function (): void {
        createContainer("p7");
        let first = setOrCreateSelect("ss1", "b", "p7", ["a", "b"]);
        expect(first.value).toBe("b");
        let second = setOrCreateSelect("ss1", "a", "p7");
        expect(second).toBe(first);
        expect(second.value).toBe("a");
    });

    it("setOrCreateSelect defaults options to value when omitted", function (): void {
        createContainer("p7b");
        let sel = setOrCreateSelect("ss2", "only", "p7b");
        expect(sel.options.length).toBe(1);
        expect(sel.value).toBe("only");
    });

    it("getResultHTML returns innerHTML or empty", function (): void {
        createContainer("p8");
        let div = createResultDiv("r8", "p8");
        div.innerHTML = "<span>hi</span>";
        expect(getResultHTML("r8")).toBe("<span>hi</span>");
        expect(getResultHTML("missing-id")).toBe("");
    });

    it("setupCalculatorDOM creates result and inputs", function (): void {
        setupCalculatorDOM(["calc-a", "calc-b"], "calc-result");
        expect(document.getElementById("calc-result") !== null).toBe(true);
        expect((document.getElementById("calc-a") as HTMLInputElement).type).toBe("number");
        expect(document.getElementById("calc-b") !== null).toBe(true);
        cleanupDOM();
        expect(document.body.innerHTML).toBe("");
    });

    it("setInputValue sets value and dispatches, ignores missing", function (): void {
        createContainer("p9");
        createInput("sin1", "", "p9", "text");
        let fired = false;
        document.getElementById("sin1")!.addEventListener("input", function (): void {
            fired = true;
        });
        setInputValue("sin1", "hello");
        expect((document.getElementById("sin1") as HTMLInputElement).value).toBe("hello");
        expect(fired).toBe(true);
        expect(function (): void {
            setInputValue("does-not-exist", "x");
        }).not.toThrow();
    });

    it("getResultText trims or returns empty", function (): void {
        createContainer("p10");
        let div = createResultDiv("r10", "p10");
        div.textContent = "  hello  ";
        expect(getResultText("r10")).toBe("hello");
        expect(getResultText("missing")).toBe("");
        let empty = createResultDiv("r11", "p10");
        empty.textContent = "";
        expect(getResultText("r11")).toBe("");
    });
});
