import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {createRoot} from "solid-js";
import {NavigationManager} from "../../modules/navigationManager.js";
import {useNavigation} from "./navigation";

describe("useNavigation", function (): void {
    beforeEach(function (): void {
        NavigationManager.resetInstance();
        localStorage.clear();
    });

    afterEach(function (): void {
        NavigationManager.resetInstance();
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("initial currentRoute matches manager.getActiveViewId", function (): void {
        let manager = NavigationManager.getInstance();
        manager.setActiveViewId("mass-calc");
        createRoot(function (): void {
            let store = useNavigation();
            expect(store.currentRoute()).toBe("mass-calc");
        });
    });

    it("initial currentRoute is empty string when manager has no active view", function (): void {
        NavigationManager.getInstance().setActiveViewId(null);
        createRoot(function (): void {
            let store = useNavigation();
            expect(store.currentRoute()).toBe("");
        });
    });

    it("setCurrentRoute updates the signal and the manager", function (): void {
        let manager = NavigationManager.getInstance();
        createRoot(function (): void {
            let store = useNavigation();
            store.setCurrentRoute("balancing");
            expect(store.currentRoute()).toBe("balancing");
        });
        expect(manager.getActiveViewId()).toBe("balancing");
    });

    it("toggleFavorite updates favorites signal and manager state", function (): void {
        createRoot(function (): void {
            let store = useNavigation();
            expect(store.isFavorite("mass-calc")).toBe(false);
            store.toggleFavorite("mass-calc");
            expect(store.isFavorite("mass-calc")).toBe(true);
            expect(store.favorites()).toContain("mass-calc");
        });
    });

    it("syncs currentRoute through listener on manager navigation events", function (): void {
        let manager = NavigationManager.getInstance();
        createRoot(function (): void {
            let store = useNavigation();
            manager.setActiveViewId("balancing");
            expect(store.currentRoute()).toBe("balancing");
            manager.setActiveViewId(null);
            expect(store.currentRoute()).toBe("");
        });
    });

    it("does not subscribe outside a reactive owner (no leak)", function (): void {
        let manager = NavigationManager.getInstance();
        manager.setActiveViewId("mass-calc");
        let store = useNavigation();
        expect(store.currentRoute()).toBe("mass-calc");
        manager.setActiveViewId("balancing");
        expect(store.currentRoute()).toBe("mass-calc");
    });

    it("unsubscribes on cleanup so later navigations do not update", function (): void {
        let manager = NavigationManager.getInstance();
        let spy = vi.spyOn(manager, "unsubscribe");
        let captured: ReturnType<typeof useNavigation> | null = null;
        createRoot(function (dispose: () => void): void {
            captured = useNavigation();
            dispose();
        });
        expect(spy).toHaveBeenCalled();
        expect(captured !== null).toBe(true);
        let before: string = captured!.currentRoute();
        manager.setActiveViewId("balancing");
        expect(captured!.currentRoute()).toBe(before);
    });
});
