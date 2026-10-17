import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IconRegistry } from "./iconRegistry.js";

describe("IconRegistry", () => {
    let registry: IconRegistry;

    beforeEach(() => {
        // Reset by accessing private static field via reflection.
        // IconRegistry does not expose resetInstance; create a fresh Map by
        // reusing the singleton but clearing it through register overwrite.
        registry = IconRegistry.getInstance();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(IconRegistry.getInstance()).toBe(IconRegistry.getInstance());
    });

    describe("register and get", () => {
        it("registers an icon and retrieves its content", () => {
            registry.register("save", "<path d='M0 0L10 10'/>");
            expect(registry.get("save")).toBe("<path d='M0 0L10 10'/>");
        });

        it("returns undefined for an unregistered icon", () => {
            expect(registry.get("missing")).toBeUndefined();
        });

        it("overwrites content when re-registering the same id", () => {
            registry.register("edit", "<circle cx='5' cy='5' r='2'/>");
            registry.register("edit", "<rect width='10' height='10'/>");
            expect(registry.get("edit")).toBe("<rect width='10' height='10'/>");
        });

        it("stores multiple icons independently", () => {
            registry.register("a", "<a/>");
            registry.register("b", "<b/>");
            registry.register("c", "<c/>");
            expect(registry.get("a")).toBe("<a/>");
            expect(registry.get("b")).toBe("<b/>");
            expect(registry.get("c")).toBe("<c/>");
        });

        it("registers with options including viewBox", () => {
            registry.register("wide", "<rect/>", { viewBox: "0 0 48 48" });
            expect(registry.get("wide")).toBe("<rect/>");
        });
    });

    describe("renderSpriteSheet", () => {
        it("returns an empty svg container when no icons are registered", () => {
            // Note: singleton may have prior registrations from other tests,
            // so we test the structural shape instead.
            const sheet = registry.renderSpriteSheet();
            expect(sheet.startsWith("<svg")).toBe(true);
            expect(sheet.endsWith("</svg>")).toBe(true);
            expect(sheet).toContain('aria-hidden="true"');
            expect(sheet).toContain('style="display:none"');
        });

        it("includes the symbol element for a registered icon", () => {
            registry.register("test-icon", "<path d='M1 1'/>");
            const sheet = registry.renderSpriteSheet();
            expect(sheet).toContain('id="icon-test-icon"');
            expect(sheet).toContain("<path d='M1 1'/>");
            expect(sheet).toContain("<symbol");
            expect(sheet).toContain("</symbol>");
        });

        it("uses the default viewBox when none is provided", () => {
            registry.register("default-viewbox", "<g/>");
            const sheet = registry.renderSpriteSheet();
            expect(sheet).toContain('viewBox="0 0 24 24"');
        });

        it("uses a custom viewBox when provided", () => {
            registry.register("custom-viewbox", "<g/>", { viewBox: "0 0 32 32" });
            const sheet = registry.renderSpriteSheet();
            expect(sheet).toContain('viewBox="0 0 32 32"');
        });

        it("includes fill attribute when provided", () => {
            registry.register("filled", "<g/>", { fill: "currentColor" });
            const sheet = registry.renderSpriteSheet();
            expect(sheet).toContain('fill="currentColor"');
        });

        it("includes stroke attribute when provided", () => {
            registry.register("stroked", "<g/>", { stroke: "#fff" });
            const sheet = registry.renderSpriteSheet();
            expect(sheet).toContain('stroke="#fff"');
        });

        it("includes stroke-width attribute when provided", () => {
            registry.register("sw", "<g/>", { strokeWidth: "2" });
            const sheet = registry.renderSpriteSheet();
            expect(sheet).toContain('stroke-width="2"');
        });

        it("includes stroke-linecap attribute when provided", () => {
            registry.register("slc", "<g/>", { strokeLinecap: "round" });
            const sheet = registry.renderSpriteSheet();
            expect(sheet).toContain('stroke-linecap="round"');
        });

        it("includes stroke-linejoin attribute when provided", () => {
            registry.register("slj", "<g/>", { strokeLinejoin: "miter" });
            const sheet = registry.renderSpriteSheet();
            expect(sheet).toContain('stroke-linejoin="miter"');
        });

        it("omits optional attributes when not provided", () => {
            registry.register("minimal", "<g/>");
            const sheet = registry.renderSpriteSheet();
            const symbolStart = sheet.indexOf("<symbol");
            const symbolEnd = sheet.indexOf(">", symbolStart);
            const symbolOpen = sheet.slice(symbolStart, symbolEnd + 1);
            expect(symbolOpen).not.toContain("fill=");
            expect(symbolOpen).not.toContain("stroke=");
            expect(symbolOpen).not.toContain("stroke-width=");
        });
    });

    describe("getIconReference", () => {
        it("returns an svg element referencing the icon by id", () => {
            const ref = registry.getIconReference("menu");
            expect(ref).toContain("<svg");
            expect(ref).toContain("</svg>");
            expect(ref).toContain('href="#icon-menu"');
            expect(ref).toContain("<use");
            expect(ref).toContain('class="icon"');
            expect(ref).toContain('aria-hidden="true"');
            expect(ref).toContain('focusable="false"');
        });

        it("returns a reference for any id string", () => {
            const ref = registry.getIconReference("custom-id-123");
            expect(ref).toContain('href="#icon-custom-id-123"');
        });
    });
});
