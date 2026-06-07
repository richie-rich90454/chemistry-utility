import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the module imports that script.ts uses
vi.mock("./modules/uiHandlers.js", () => ({
    initializeUIHandlers: vi.fn(),
}));

vi.mock("./modules/eventListeners.js", () => ({
    initializeEventListeners: vi.fn(),
}));

describe("script.ts", () => {
    let domContentLoadedCallbacks: Array<() => void>;

    beforeEach(() => {
        document.body.innerHTML = "";
        domContentLoadedCallbacks = [];
        vi.resetModules();

        // Mock localStorage
        const store: Record<string, string> = {};
        vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => store[key] ?? null);
        vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => { store[key] = value; });

        // Capture DOMContentLoaded callbacks
        const originalAddEventListener = document.addEventListener.bind(document);
        vi.spyOn(document, "addEventListener").mockImplementation((type: string, listener: EventListenerOrEventListenerObject) => {
            if (type === "DOMContentLoaded" && typeof listener === "function") {
                domContentLoadedCallbacks.push(listener as () => void);
            }
            return originalAddEventListener(type, listener);
        });

        // Mock fetch to return a resolved promise by default
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        }));
    });

    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    async function initScript(): Promise<void> {
        // Create required DOM elements
        const themeToggle = document.createElement("button");
        themeToggle.id = "theme-toggle";
        document.body.appendChild(themeToggle);

        const elementInfo = document.createElement("div");
        elementInfo.id = "element-info";
        document.body.appendChild(elementInfo);

        // Add a .result element for copy-to-clipboard
        const result = document.createElement("div");
        result.className = "result";
        result.textContent = "Test result content";
        document.body.appendChild(result);

        await import("./script");

        // Trigger the captured DOMContentLoaded callbacks
        domContentLoadedCallbacks.forEach(cb => cb());
    }

    describe("theme application", () => {
        it("stored dark theme adds .dark class and removes .light", async () => {
            vi.mocked(Storage.prototype.getItem).mockReturnValue("dark");
            document.documentElement.classList.add("light");

            await initScript();

            expect(document.documentElement.classList.contains("dark")).toBe(true);
            expect(document.documentElement.classList.contains("light")).toBe(false);
        });

        it("stored light theme adds .light class and removes .dark", async () => {
            vi.mocked(Storage.prototype.getItem).mockReturnValue("light");
            document.documentElement.classList.add("dark");

            await initScript();

            expect(document.documentElement.classList.contains("light")).toBe(true);
            expect(document.documentElement.classList.contains("dark")).toBe(false);
        });

        it("system theme with prefers-dark adds .dark class", async () => {
            vi.mocked(Storage.prototype.getItem).mockReturnValue(null);
            vi.mocked(window.matchMedia).mockReturnValue({
                matches: true,
                media: "(prefers-color-scheme: dark)",
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            });

            await initScript();

            expect(document.documentElement.classList.contains("dark")).toBe(true);
        });
    });

    describe("theme toggle", () => {
        it("clicking theme-toggle when dark switches to light and saves to localStorage", async () => {
            await initScript();

            // Set initial state to dark
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");

            const toggle = document.getElementById("theme-toggle")!;
            toggle.click();

            expect(document.documentElement.classList.contains("light")).toBe(true);
            expect(document.documentElement.classList.contains("dark")).toBe(false);
            expect(Storage.prototype.setItem).toHaveBeenCalledWith("theme", "light");
        });

        it("clicking theme-toggle when light switches to dark and saves to localStorage", async () => {
            await initScript();

            // Set initial state to light
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");

            const toggle = document.getElementById("theme-toggle")!;
            toggle.click();

            expect(document.documentElement.classList.contains("dark")).toBe(true);
            expect(document.documentElement.classList.contains("light")).toBe(false);
            expect(Storage.prototype.setItem).toHaveBeenCalledWith("theme", "dark");
        });
    });

    describe("updateThemeIcon", () => {
        it("dark theme shows sun SVG icon", async () => {
            vi.mocked(Storage.prototype.getItem).mockReturnValue("dark");
            await initScript();

            const toggle = document.getElementById("theme-toggle")!;
            // In dark mode, the icon should be a sun SVG
            expect(toggle.innerHTML).toContain("svg");
            expect(toggle.innerHTML).toContain("M12 7c"); // sun path
        });

        it("light theme shows moon SVG icon", async () => {
            vi.mocked(Storage.prototype.getItem).mockReturnValue("light");
            await initScript();

            const toggle = document.getElementById("theme-toggle")!;
            expect(toggle.innerHTML).toContain("svg");
            expect(toggle.innerHTML).toContain("M12 3a9"); // moon path
        });
    });

    describe("copy-to-clipboard", () => {
        it("clicking copy button calls navigator.clipboard.writeText", async () => {
            await initScript();

            const copyBtn = document.querySelector(".copy-button") as HTMLButtonElement;
            expect(copyBtn).toBeTruthy();
            copyBtn.click();

            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });

        it("copy button text excludes the copy button's own text", async () => {
            await initScript();

            const copyBtn = document.querySelector(".copy-button") as HTMLButtonElement;
            copyBtn.click();

            const writtenText = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
            expect(writtenText).toContain("Test result content");
        });

        it("on success, copy button gets 'copied' class temporarily", async () => {
            await initScript();

            const copyBtn = document.querySelector(".copy-button") as HTMLButtonElement;
            copyBtn.click();

            // Wait for the clipboard promise to resolve
            await vi.waitFor(() => {
                expect(copyBtn.classList.contains("copied")).toBe(true);
            });

            // Wait for the timeout to clear the class
            await new Promise(resolve => setTimeout(resolve, 2100));
            expect(copyBtn.classList.contains("copied")).toBe(false);
        });

        it("on failure, copy button color changes temporarily", async () => {
            vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error("Not allowed"));

            await initScript();

            const copyBtn = document.querySelector(".copy-button") as HTMLButtonElement;
            copyBtn.click();

            // Wait for the clipboard promise to reject
            await vi.waitFor(() => {
                expect(copyBtn.style.color).toBe("var(--error)");
            });

            // Wait for the timeout to clear the color
            await new Promise(resolve => setTimeout(resolve, 2100));
            expect(copyBtn.style.color).toBe("");
        });
    });

    describe("fetch and initialization", () => {
        it("calls initializeUIHandlers on DOMContentLoaded", async () => {
            const { initializeUIHandlers } = await import("./modules/uiHandlers.js");
            await initScript();

            expect(initializeUIHandlers).toHaveBeenCalled();
        });

        it("fetches /api/ptable and calls initializeEventListeners with data", async () => {
            const { initializeEventListeners } = await import("./modules/eventListeners.js");
            const mockData = [{ symbol: "H", name: "Hydrogen" }];
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            await initScript();

            await vi.waitFor(() => {
                expect(initializeEventListeners).toHaveBeenCalledWith(mockData);
            });
        });

        it("shows error when fetch fails", async () => {
            vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

            await initScript();

            await vi.waitFor(() => {
                const elementInfo = document.getElementById("element-info")!;
                expect(elementInfo.innerHTML).toContain("Error loading element data table");
            });
        });

        it("shows error when response is not ok", async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: false,
                status: 500,
            } as Response);

            await initScript();

            await vi.waitFor(() => {
                const elementInfo = document.getElementById("element-info")!;
                expect(elementInfo.innerHTML).toContain("Error loading element data table");
            });
        });
    });
});
