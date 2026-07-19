import {render, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {ThemeManager} from "../../modules/themeManager.js";
import {ThemeToggle} from "./ThemeToggle";

describe("ThemeToggle", function (): void {
    let matchMediaSpy: ReturnType<typeof vi.spyOn>;
    let toggleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(function (): void {
        document.documentElement.classList.remove("dark", "light", "amoled");
        localStorage.clear();
        matchMediaSpy = vi.spyOn(window, "matchMedia").mockReturnValue({
            matches: false,
            media: "(prefers-color-scheme: dark)",
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList);
        let manager = ThemeManager.getInstance();
        manager.setTheme("light");
        toggleSpy = vi.spyOn(Object.getPrototypeOf(manager), "toggle");
    });

    afterEach(function (): void {
        document.documentElement.classList.remove("dark", "light", "amoled");
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("renders a button whose aria-label mentions mode", function (): void {
        let result = render(function () { return <ThemeToggle />; });
        let button = result.getByRole("button");
        expect(button.getAttribute("aria-label")).toContain("mode");
    });

    it("calls ThemeManager.toggle on click", function (): void {
        let result = render(function () { return <ThemeToggle />; });
        let button = result.getByRole("button");
        fireEvent.click(button);
        expect(toggleSpy).toHaveBeenCalled();
    });
});
