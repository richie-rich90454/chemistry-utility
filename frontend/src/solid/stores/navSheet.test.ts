import {describe, it, expect, beforeEach} from "vitest";
import {useNavSheet, reset} from "./navSheet";
describe("useNavSheet", function (): void {
    beforeEach(function (): void {
        reset();
    });
    it("initial state is closed", function (): void {
        let store = useNavSheet();
        expect(store.isOpen()).toBe(false);
    });
    it("open() sets isOpen true", function (): void {
        let store = useNavSheet();
        store.open();
        expect(store.isOpen()).toBe(true);
    });
    it("close() sets isOpen false", function (): void {
        let store = useNavSheet();
        store.open();
        store.close();
        expect(store.isOpen()).toBe(false);
    });
    it("toggle() flips isOpen", function (): void {
        let store = useNavSheet();
        expect(store.isOpen()).toBe(false);
        store.toggle();
        expect(store.isOpen()).toBe(true);
        store.toggle();
        expect(store.isOpen()).toBe(false);
    });
    it("shares state across multiple useNavSheet calls (singleton)", function (): void {
        let storeA = useNavSheet();
        let storeB = useNavSheet();
        storeA.open();
        expect(storeB.isOpen()).toBe(true);
        storeB.close();
        expect(storeA.isOpen()).toBe(false);
    });
    it("reset() closes the sheet", function (): void {
        let store = useNavSheet();
        store.open();
        reset();
        expect(store.isOpen()).toBe(false);
    });
});
