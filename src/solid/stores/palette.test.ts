import {describe, it, expect, beforeEach} from "vitest";
import {usePalette, reset} from "./palette";
describe("usePalette", function (): void {
    beforeEach(function (): void {
        reset();
    });
    it("initial state is closed with selectedIndex 0", function (): void {
        let store = usePalette();
        expect(store.isOpen()).toBe(false);
        expect(store.selectedIndex()).toBe(0);
    });
    it("open() sets isOpen true and resets selectedIndex to 0", function (): void {
        let store = usePalette();
        store.setSelectedIndex(5);
        store.open();
        expect(store.isOpen()).toBe(true);
        expect(store.selectedIndex()).toBe(0);
    });
    it("close() sets isOpen false", function (): void {
        let store = usePalette();
        store.open();
        store.close();
        expect(store.isOpen()).toBe(false);
    });
    it("toggle() flips isOpen", function (): void {
        let store = usePalette();
        expect(store.isOpen()).toBe(false);
        store.toggle();
        expect(store.isOpen()).toBe(true);
        store.toggle();
        expect(store.isOpen()).toBe(false);
    });
    it("moveSelection clamps to 0 when moving up from index 0", function (): void {
        let store = usePalette();
        store.moveSelection(-1, 5);
        expect(store.selectedIndex()).toBe(0);
    });
    it("moveSelection clamps to max-1 when moving down past the end", function (): void {
        let store = usePalette();
        store.moveSelection(1, 5);
        store.moveSelection(1, 5);
        store.moveSelection(1, 5);
        store.moveSelection(1, 5);
        store.moveSelection(1, 5);
        store.moveSelection(1, 5);
        expect(store.selectedIndex()).toBe(4);
    });
    it("moveSelection moves down by 1 within bounds", function (): void {
        let store = usePalette();
        store.moveSelection(1, 5);
        expect(store.selectedIndex()).toBe(1);
    });
    it("moveSelection moves up by 1 within bounds", function (): void {
        let store = usePalette();
        store.setSelectedIndex(3);
        store.moveSelection(-1, 5);
        expect(store.selectedIndex()).toBe(2);
    });
    it("moveSelection handles max of 0 by clamping to 0", function (): void {
        let store = usePalette();
        store.setSelectedIndex(3);
        store.moveSelection(1, 0);
        expect(store.selectedIndex()).toBe(0);
    });
    it("setSelectedIndex sets the index directly", function (): void {
        let store = usePalette();
        store.setSelectedIndex(7);
        expect(store.selectedIndex()).toBe(7);
    });
    it("shares state across multiple usePalette calls (singleton)", function (): void {
        let storeA = usePalette();
        let storeB = usePalette();
        storeA.open();
        expect(storeB.isOpen()).toBe(true);
        storeB.setSelectedIndex(2);
        expect(storeA.selectedIndex()).toBe(2);
    });
});
