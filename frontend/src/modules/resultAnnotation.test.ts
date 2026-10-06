import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { ResultAnnotationManager } from "./resultAnnotation.js";

describe("ResultAnnotationManager", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        ResultAnnotationManager.resetInstance();
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        ResultAnnotationManager.resetInstance();
    });

    describe("getInstance", function () {
        it("should return same instance on subsequent calls", function () {
            let m1: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let m2: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            expect(m1).toBe(m2);
        });

        it("should return new instance after resetInstance", function () {
            let m1: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            ResultAnnotationManager.resetInstance();
            let m2: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            expect(m1).not.toBe(m2);
        });
    });

    describe("addAnnotationUI", function () {
        it("should add annotation input and star button below result", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-1");
            let ui: HTMLElement | null = result.querySelector(".annotation-ui");
            expect(ui).not.toBeNull();
            let input: HTMLElement | null = result.querySelector(".annotation-input");
            expect(input).not.toBeNull();
            let starBtn: HTMLElement | null = result.querySelector(".annotation-star-button");
            expect(starBtn).not.toBeNull();
            expect(manager.getTrackedCount()).toBe(1);
        });

        it("should not duplicate annotation UI for same element", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-1");
            manager.addAnnotationUI(result, "calc-1");
            let uis: NodeListOf<HTMLElement> = result.querySelectorAll(".annotation-ui");
            expect(uis.length).toBe(1);
            expect(manager.getTrackedCount()).toBe(1);
        });

        it("should store calculation id on the annotation container", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-42");
            let ui: HTMLElement = result.querySelector(".annotation-ui") as HTMLElement;
            expect(ui.getAttribute("data-calculation-id")).toBe("calc-42");
        });

        it("should restore starred state from localStorage when adding UI", function () {
            localStorage.setItem("chemutil_starred", JSON.stringify({ "calc-1": true }));
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-1");
            let starBtn: HTMLElement = result.querySelector(".annotation-star-button") as HTMLElement;
            expect(starBtn.getAttribute("aria-pressed")).toBe("true");
        });

        it("should restore annotation text from localStorage when adding UI", function () {
            localStorage.setItem("chemutil_annotations", JSON.stringify({ "calc-1": "saved note" }));
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-1");
            let input: HTMLInputElement = result.querySelector(".annotation-input") as HTMLInputElement;
            expect(input.value).toBe("saved note");
        });
    });

    describe("saveAnnotation", function () {
        it("should persist annotation to localStorage", async function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            await manager.saveAnnotation("calc-7", "my note");
            let raw: string | null = localStorage.getItem("chemutil_annotations");
            expect(raw).not.toBeNull();
            if (raw) {
                let parsed: Record<string, string> = JSON.parse(raw) as Record<string, string>;
                expect(parsed["calc-7"]).toBe("my note");
            }
        });

        it("should trigger save on annotation input blur", async function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-blur");
            let input: HTMLInputElement = result.querySelector(".annotation-input") as HTMLInputElement;
            input.value = "blur note";
            input.dispatchEvent(new Event("blur"));
            await new Promise(function (resolve: Function): void { setTimeout(resolve, 0); });
            let raw: string | null = localStorage.getItem("chemutil_annotations");
            expect(raw).not.toBeNull();
            if (raw) {
                let parsed: Record<string, string> = JSON.parse(raw) as Record<string, string>;
                expect(parsed["calc-blur"]).toBe("blur note");
            }
        });

        it("loadAnnotation returns persisted annotation", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            void manager.saveAnnotation("calc-x", "hello");
            expect(manager.loadAnnotation("calc-x")).toBe("hello");
        });

        it("loadAnnotation returns empty string when not present", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            expect(manager.loadAnnotation("missing")).toBe("");
        });
    });

    describe("toggleStar", function () {
        it("should toggle star state and persist to localStorage", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let first: boolean = manager.toggleStar("calc-9");
            expect(first).toBe(true);
            let second: boolean = manager.toggleStar("calc-9");
            expect(second).toBe(false);
            let raw: string | null = localStorage.getItem("chemutil_starred");
            expect(raw).not.toBeNull();
            if (raw) {
                let parsed: Record<string, boolean> = JSON.parse(raw) as Record<string, boolean>;
                expect(parsed["calc-9"]).toBe(false);
            }
        });

        it("isStarred reflects current localStorage state", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            expect(manager.isStarred("calc-9")).toBe(false);
            manager.toggleStar("calc-9");
            expect(manager.isStarred("calc-9")).toBe(true);
        });

        it("should update star button visual state on click", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-click");
            let starBtn: HTMLButtonElement = result.querySelector(".annotation-star-button") as HTMLButtonElement;
            expect(starBtn.getAttribute("aria-pressed")).toBe("false");
            starBtn.dispatchEvent(new Event("click"));
            expect(starBtn.getAttribute("aria-pressed")).toBe("true");
            starBtn.dispatchEvent(new Event("click"));
            expect(starBtn.getAttribute("aria-pressed")).toBe("false");
        });

        it("should rebuild a missing star icon on click", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-noicon");
            let starBtn: HTMLButtonElement = result.querySelector(".annotation-star-button") as HTMLButtonElement;
            starBtn.querySelector("svg")!.remove();
            starBtn.dispatchEvent(new Event("click"));
            expect(starBtn.getAttribute("aria-pressed")).toBe("true");
            expect(starBtn.querySelector("svg")).not.toBeNull();
        });

        it("should fall back to defaults for corrupt or scalar storage", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            localStorage.setItem("chemutil_annotations", "{bad json");
            expect(manager.loadAnnotation("calc-1")).toBe("");
            localStorage.setItem("chemutil_annotations", "5");
            expect(manager.loadAnnotation("calc-1")).toBe("");
            localStorage.setItem("chemutil_annotations", "null");
            expect(manager.loadAnnotation("calc-1")).toBe("");
            localStorage.setItem("chemutil_starred", "{bad json");
            expect(manager.isStarred("calc-1")).toBe(false);
            localStorage.setItem("chemutil_starred", "5");
            expect(manager.isStarred("calc-1")).toBe(false);
        });
    });

    describe("init", function () {
        it("should attach annotation UI to existing result elements with data-calculation-id", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let r1: HTMLElement = document.createElement("div");
            r1.className = "result";
            r1.setAttribute("data-calculation-id", "calc-a");
            let r2: HTMLElement = document.createElement("div");
            r2.className = "result";
            r2.setAttribute("data-calculation-id", "calc-b");
            let r3: HTMLElement = document.createElement("div");
            r3.className = "result";
            document.body.appendChild(r1);
            document.body.appendChild(r2);
            document.body.appendChild(r3);
            manager.init();
            expect(manager.getTrackedCount()).toBe(2);
        });

        it("should skip result elements with an empty calculation id", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let r1: HTMLElement = document.createElement("div");
            r1.className = "result";
            r1.setAttribute("data-calculation-id", "");
            document.body.appendChild(r1);
            manager.init();
            expect(manager.getTrackedCount()).toBe(0);
        });

        it("should be idempotent", function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            manager.init();
            manager.init();
            expect(manager.getTrackedCount()).toBe(0);
        });
    });
});
