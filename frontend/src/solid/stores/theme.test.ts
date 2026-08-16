import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {createRoot} from "solid-js";
import {ThemeManager} from "../../modules/themeManager.js";
import {useTheme} from "./theme";

describe("useTheme", function (): void {
    beforeEach(function (): void {
        document.documentElement.classList.remove("dark", "light", "amoled");
        localStorage.clear();
        vi.spyOn(window, "matchMedia").mockReturnValue({
            matches: false,
            media: "(prefers-color-scheme: dark)",
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList);
        ThemeManager.getInstance().setTheme("light");
    });

    afterEach(function (): void {
        document.documentElement.classList.remove("dark", "light", "amoled");
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("initial signal value matches manager theme", function (): void {
        let manager = ThemeManager.getInstance();
        manager.setTheme("dark");
        createRoot(function (): void {
            let store = useTheme();
            expect(store.theme()).toBe("dark");
        });
    });

    it("setTheme updates the signal via manager subscription", function (): void {
        createRoot(function (): void {
            let store = useTheme();
            store.setTheme("amoled");
            expect(store.theme()).toBe("amoled");
        });
    });

    it("toggle cycles the signal through dark then amoled", function (): void {
        createRoot(function (): void {
            let store = useTheme();
            store.toggle();
            expect(store.theme()).toBe("dark");
            store.toggle();
            expect(store.theme()).toBe("amoled");
        });
    });
});
