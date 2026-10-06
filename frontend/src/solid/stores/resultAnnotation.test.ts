import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {ResultAnnotationManager} from "../../modules/resultAnnotation.js";
import {useResultAnnotation} from "./resultAnnotation";
describe("useResultAnnotation", function (): void {
    beforeEach(function (): void {
        localStorage.clear();
        ResultAnnotationManager.resetInstance();
        let store = useResultAnnotation();
        store.loadAnnotation("__reset__");
    });
    afterEach(function (): void {
        localStorage.clear();
        ResultAnnotationManager.resetInstance();
    });
    it("initial state has empty note and unset favorite", function (): void {
        let store = useResultAnnotation();
        expect(store.currentNote()).toBe("");
        expect(store.currentFavorite()).toBe(false);
    });
    it("loadAnnotation sets currentNote from persisted annotation", function (): void {
        let manager = ResultAnnotationManager.getInstance();
        void manager.saveAnnotation("id1", "hello note");
        let store = useResultAnnotation();
        store.loadAnnotation("id1");
        expect(store.currentNote()).toBe("hello note");
    });
    it("loadAnnotation sets currentFavorite when result is starred", function (): void {
        localStorage.setItem("chemutil_starred", JSON.stringify({"id1": true}));
        let store = useResultAnnotation();
        store.loadAnnotation("id1");
        expect(store.currentFavorite()).toBe(true);
    });
    it("loadAnnotation sets currentFavorite to false when result is not starred", function (): void {
        let store = useResultAnnotation();
        store.loadAnnotation("unstarred-id");
        expect(store.currentFavorite()).toBe(false);
    });
    it("saveAnnotation persists note and updates currentNote signal", async function (): Promise<void> {
        let store = useResultAnnotation();
        await store.saveAnnotation("id2", "persisted note", false);
        expect(store.currentNote()).toBe("persisted note");
        let manager = ResultAnnotationManager.getInstance();
        expect(manager.loadAnnotation("id2")).toBe("persisted note");
    });
    it("saveAnnotation with favorite true stars the result and updates currentFavorite signal", async function (): Promise<void> {
        let store = useResultAnnotation();
        await store.saveAnnotation("id3", "note", true);
        expect(store.currentFavorite()).toBe(true);
        let manager = ResultAnnotationManager.getInstance();
        expect(manager.isStarred("id3")).toBe(true);
    });
    it("saveAnnotation with favorite false when already starred unstars the result", async function (): Promise<void> {
        let store = useResultAnnotation();
        store.toggleFavorite("id4");
        expect(store.currentFavorite()).toBe(true);
        await store.saveAnnotation("id4", "note", false);
        expect(store.currentFavorite()).toBe(false);
        let manager = ResultAnnotationManager.getInstance();
        expect(manager.isStarred("id4")).toBe(false);
    });
    it("toggleFavorite updates currentFavorite signal and returns new state", function (): void {
        let store = useResultAnnotation();
        expect(store.currentFavorite()).toBe(false);
        let next: boolean = store.toggleFavorite("id5");
        expect(next).toBe(true);
        expect(store.currentFavorite()).toBe(true);
        let nextAgain: boolean = store.toggleFavorite("id5");
        expect(nextAgain).toBe(false);
        expect(store.currentFavorite()).toBe(false);
    });
    it("removeAnnotation clears currentNote and currentFavorite signals", async function (): Promise<void> {
        let store = useResultAnnotation();
        await store.saveAnnotation("id6", "to be removed", true);
        expect(store.currentNote()).toBe("to be removed");
        expect(store.currentFavorite()).toBe(true);
        store.removeAnnotation("id6");
        expect(store.currentNote()).toBe("");
        expect(store.currentFavorite()).toBe(false);
    });
    it("removeAnnotation on unstarred id clears signals without toggling star", function (): void {
        let store = useResultAnnotation();
        store.removeAnnotation("never-starred-id");
        expect(store.currentNote()).toBe("");
        expect(store.currentFavorite()).toBe(false);
        let manager = ResultAnnotationManager.getInstance();
        expect(manager.isStarred("never-starred-id")).toBe(false);
    });
    it("shares state across multiple useResultAnnotation calls (singleton)", function (): void {
        let storeA = useResultAnnotation();
        let storeB = useResultAnnotation();
        storeA.toggleFavorite("id7");
        expect(storeB.currentFavorite()).toBe(true);
        storeB.loadAnnotation("__other__");
        expect(storeA.currentFavorite()).toBe(false);
    });
});
