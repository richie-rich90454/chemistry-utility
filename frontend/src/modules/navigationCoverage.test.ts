// @vitest-environment jsdom
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {NavigationManager} from "./navigationManager.js";

describe("navigationCoverage: unsubscribe branches", () => {
    beforeEach(() => {
        NavigationManager.resetInstance();
    });
    afterEach(() => {
        NavigationManager.resetInstance();
    });

    it("skips non-matching listeners before removing the target", () => {
        const m = NavigationManager.getInstance();
        const seen: Array<string | null> = [];
        const first = (id: string | null): void => { seen.push(id); };
        const second = (id: string | null): void => { seen.push(id); };
        m.subscribe(first);
        m.subscribe(second);
        m.unsubscribe(second);
        m.setActiveViewId("test-view");
        expect(seen).toContain("test-view");
        m.unsubscribe(first);
        m.unsubscribe(second);
    });
});
