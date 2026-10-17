// @vitest-environment jsdom
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {ComparisonManager} from "./comparisonManager.js";

function setupModal(): void {
    document.body.innerHTML = "";
    const modal = document.createElement("div");
    modal.id = "comparison-modal";
    const content = document.createElement("div");
    content.id = "comparison-content";
    modal.appendChild(content);
    const close = document.createElement("button");
    close.id = "comparison-close";
    modal.appendChild(close);
    document.body.appendChild(modal);
}

describe("comparisonCoverage: modal and items", () => {
    beforeEach(() => {
        ComparisonManager.resetInstance();
    });
    afterEach(() => {
        ComparisonManager.resetInstance();
        document.body.innerHTML = "";
    });

    it("shows without modal and with single item", () => {
        document.body.innerHTML = "";
        const m = ComparisonManager.getInstance();
        m.init();
        m.showComparison();
        setupModal();
        m.init();
        m.addToComparison("a", {Inputs: {x: 1}, Result: {y: 2}});
        m.showComparison();
        expect(document.getElementById("comparison-content")!.innerHTML).toContain("Calculation 1");
        m.addToComparison("b", {Inputs: {x: 9}, Result: {y: 2}});
        expect(document.getElementById("comparison-content")!.innerHTML).toContain("diff");
        m.clearComparison();
        m.addToComparison("a", {Inputs: {name: "foo"}, Result: {y: "2"}});
        m.addToComparison("b", {Inputs: {name: "bar"}, Result: {y: "2"}});
        expect(document.getElementById("comparison-content")!.innerHTML).toContain("diff");
    });

    it("removes items and exposes them", () => {
        setupModal();
        const m = ComparisonManager.getInstance();
        m.init();
        m.addToComparison("a", {Inputs: {x: 1}, Result: {y: 2}});
        m.addToComparison("b", {Inputs: {x: 9}, Result: {y: 2}});
        expect(m.getItems().length).toBe(2);
        expect(m.getCount()).toBe(2);
        m.removeFromComparison("a");
        expect(m.getCount()).toBe(1);
        m.removeFromComparison("missing");
        expect(m.getCount()).toBe(1);
        m.hideComparison();
        m.clearComparison();
        expect(m.getCount()).toBe(0);
        document.body.innerHTML = "";
        m.clearComparison();
        m.hideComparison();
        ComparisonManager.resetInstance();
        const fresh = ComparisonManager.getInstance();
        fresh.clearComparison();
        fresh.hideComparison();
        fresh.destroy();
        m.destroy();
        m.init();
    });
});

describe("comparisonCoverage: fields and values", () => {
    beforeEach(() => {
        ComparisonManager.resetInstance();
        setupModal();
    });
    afterEach(() => {
        ComparisonManager.resetInstance();
        document.body.innerHTML = "";
    });

    it("extracts fields from shapes", () => {
        const m = ComparisonManager.getInstance();
        m.init();
        expect(m.extractFields(null)).toEqual([]);
        expect(m.extractFields({Inputs: [1, 2], Result: {b: 2}}).length).toBeGreaterThan(0);
        expect(m.extractFields({Inputs: {a: 1}, Result: {b: 2}}).length).toBeGreaterThan(0);
        expect(m.extractFields({Inputs: '{"a":1}', Result: {b: 2}}).length).toBeGreaterThan(0);
        expect(m.extractFields({Inputs: '[1,2]', Result: {b: 2}}).length).toBeGreaterThan(0);
        expect(m.extractFields({Inputs: '{bad json', Result: {b: 2}}).length).toBeGreaterThan(0);
        expect(m.extractFields({Inputs: {a: null}, Result: {b: 2}}).length).toBeGreaterThan(0);
        expect(m.extractFields("str")).toEqual([]);
        expect(m.extractFields(42)).toEqual([]);
        const circular: Record<string, unknown> = {};
        circular["self"] = circular;
        expect(m.extractFields({Inputs: {a: circular}, Result: {b: 2}}).length).toBeGreaterThan(0);
    });

    it("merges keys and finds values", () => {
        const m = ComparisonManager.getInstance();
        m.init();
        expect(m.mergeKeys([{label: "a", value: "1", section: "s"}], [{label: "b", value: "2", section: "s"}])).toEqual(["a", "b"]);
        expect(m.mergeKeys([{label: "a", value: "1", section: "s"}], [{label: "a", value: "2", section: "s"}])).toEqual(["a"]);
        expect(m.mergeKeys([{label: "a", value: "1", section: "s"}, {label: "a", value: "2", section: "s"}], [{label: "b", value: "3", section: "s"}])).toEqual(["a", "b"]);
        expect(m.findValue([{label: "a", value: "1", section: "s"}], "missing")).toBe("");
        expect(m.findValue([{label: "a", value: "1", section: "s"}], "a")).toBe("1");
    });

    it("computes percentage differences", () => {
        const m = ComparisonManager.getInstance();
        m.init();
        expect(m.percentageDifference("10", "20")).toContain("%");
        expect(m.percentageDifference("abc", "20")).toBe("");
        expect(m.percentageDifference("10", "abc")).toBe("");
        expect(m.percentageDifference("0", "0")).toBe("0%");
    });
});
