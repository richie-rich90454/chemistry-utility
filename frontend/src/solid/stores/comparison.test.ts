import {describe, it, expect, beforeEach} from "vitest";
import {ComparisonManager} from "../../modules/comparisonManager.js";
import {useComparison} from "./comparison";
describe("useComparison", function (): void {
    beforeEach(function (): void {
        ComparisonManager.resetInstance();
        let store = useComparison();
        store.clearComparison();
    });
    it("initial state has empty items and closed modal", function (): void {
        let store = useComparison();
        expect(store.items()).toEqual([]);
        expect(store.isModalOpen()).toBe(false);
    });
    it("addToComparison syncs items signal", function (): void {
        let store = useComparison();
        let added: boolean = store.addToComparison("c1", {"value": 1});
        expect(added).toBe(true);
        expect(store.items().length).toBe(1);
        expect(store.items()[0].calculationId).toBe("c1");
    });
    it("addToComparison returns true when updating existing item", function (): void {
        let store = useComparison();
        store.addToComparison("c1", {"value": 1});
        let added: boolean = store.addToComparison("c1", {"value": 2});
        expect(added).toBe(true);
        expect(store.items().length).toBe(1);
        expect(store.items()[0].data).toEqual({"value": 2});
    });
    it("addToComparison returns false when 2 items already present", function (): void {
        let store = useComparison();
        store.addToComparison("c1", {"value": 1});
        store.addToComparison("c2", {"value": 2});
        let added: boolean = store.addToComparison("c3", {"value": 3});
        expect(added).toBe(false);
        expect(store.items().length).toBe(2);
    });
    it("addToComparison does not auto-open modal at 1 item", function (): void {
        let store = useComparison();
        store.addToComparison("c1", {"value": 1});
        expect(store.isModalOpen()).toBe(false);
    });
    it("addToComparison auto-opens modal at 2 items", function (): void {
        let store = useComparison();
        store.addToComparison("c1", {"value": 1});
        store.addToComparison("c2", {"value": 2});
        expect(store.isModalOpen()).toBe(true);
    });
    it("removeFromComparison syncs items signal", function (): void {
        let store = useComparison();
        store.addToComparison("c1", {"value": 1});
        store.addToComparison("c2", {"value": 2});
        store.removeFromComparison("c1");
        expect(store.items().length).toBe(1);
        expect(store.items()[0].calculationId).toBe("c2");
    });
    it("removeFromComparison on missing id leaves items unchanged", function (): void {
        let store = useComparison();
        store.addToComparison("c1", {"value": 1});
        store.removeFromComparison("missing");
        expect(store.items().length).toBe(1);
    });
    it("clearComparison resets items and closes modal", function (): void {
        let store = useComparison();
        store.addToComparison("c1", {"value": 1});
        store.addToComparison("c2", {"value": 2});
        store.clearComparison();
        expect(store.items()).toEqual([]);
        expect(store.isModalOpen()).toBe(false);
    });
    it("openModal sets isModalOpen to true", function (): void {
        let store = useComparison();
        store.openModal();
        expect(store.isModalOpen()).toBe(true);
    });
    it("closeModal sets isModalOpen to false", function (): void {
        let store = useComparison();
        store.openModal();
        store.closeModal();
        expect(store.isModalOpen()).toBe(false);
    });
    it("shares state across multiple useComparison calls (singleton)", function (): void {
        let storeA = useComparison();
        let storeB = useComparison();
        storeA.addToComparison("c1", {"value": 1});
        expect(storeB.items().length).toBe(1);
        storeB.openModal();
        expect(storeA.isModalOpen()).toBe(true);
    });
});
