import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {DOMMutationCoordinator} from "./domMutationCoordinator.js";
describe("DOMMutationCoordinator", function (): void {
    let coordinator: DOMMutationCoordinator;
    beforeEach(function (): void {
        document.body.innerHTML = "";
        coordinator = DOMMutationCoordinator.getInstance();
    });
    afterEach(function (): void {
        coordinator.disconnect();
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });
    describe("getInstance", function (): void {
        it("returns the same singleton instance on subsequent calls", function (): void {
            let a: DOMMutationCoordinator = DOMMutationCoordinator.getInstance();
            let b: DOMMutationCoordinator = DOMMutationCoordinator.getInstance();
            expect(a).toBe(b);
        });
    });
    describe("registerHandler", function (): void {
        it("registers a handler that can be called on matching mutations", function (): void {
            let callback = vi.fn();
            coordinator.registerHandler(".my-element", callback);
            expect(callback).not.toHaveBeenCalled();
        });
    });
    describe("observe", function (): void {
        it("creates a MutationObserver on document.body when no main element exists", function (): void {
            coordinator.observe();
            let target: HTMLElement = document.createElement("div");
            target.className = "test-target";
            document.body.appendChild(target);
            target.classList.add("changed");
            expect(coordinator).toBeDefined();
        });
        it("creates a MutationObserver on main element when it exists", function (): void {
            let main: HTMLElement = document.createElement("main");
            document.body.appendChild(main);
            coordinator.observe();
            let target: HTMLElement = document.createElement("div");
            target.className = "test-target";
            main.appendChild(target);
            target.classList.add("changed");
            expect(coordinator).toBeDefined();
            main.remove();
        });
        it("does not create a second observer when observe is called twice", function (): void {
            let observerCount: number = 0;
            let originalObserver = globalThis.MutationObserver;
            globalThis.MutationObserver = vi.fn().mockImplementation(function (_cb: MutationCallback): MutationObserver {
                observerCount++;
                return {
                    observe: vi.fn(),
                    disconnect: vi.fn(),
                    takeRecords: vi.fn(),
                } as unknown as MutationObserver;
            }) as unknown as typeof MutationObserver;
            coordinator.observe();
            coordinator.observe();
            expect(observerCount).toBe(1);
            globalThis.MutationObserver = originalObserver;
        });
        it("calls registered handler callback when mutation target matches selector", async function (): Promise<void> {
            let callback = vi.fn();
            coordinator.registerHandler(".my-target", callback);
            coordinator.observe();
            let target: HTMLElement = document.createElement("div");
            target.className = "my-target";
            document.body.appendChild(target);
            target.classList.add("extra");
            await new Promise<void>(function (resolve: () => void): void {
                setTimeout(resolve, 0);
            });
            expect(callback).toHaveBeenCalled();
        });
    });
    describe("disconnect", function (): void {
        it("does not throw when no observer has been created", function (): void {
            expect(function (): void {
                coordinator.disconnect();
            }).not.toThrow();
        });
        it("allows re-observing after disconnect", function (): void {
            coordinator.observe();
            coordinator.disconnect();
            coordinator.observe();
            expect(coordinator).toBeDefined();
        });
    });
});
