import { vi } from "vitest";

// Mock IntersectionObserver
class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: MockIntersectionObserver,
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
    value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(""),
    },
    writable: true,
});

// Mock scrollY
Object.defineProperty(window, "scrollY", { value: 0, writable: true });

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock history.pushState
window.history.pushState = vi.fn();

// Mock gsap (required by appNavigationStrategy transitively imported via navigationManager)
vi.mock("gsap", () => ({
    default: { to: vi.fn(), from: vi.fn(), fromTo: vi.fn(), set: vi.fn() },
}));
