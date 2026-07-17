import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "lcov"],
            include: ["src/modules/**/*.ts", "src/script.ts"],
            exclude: [
                "**/*.test.ts",
                "**/*.d.ts",
                "src/types.ts",
                "node_modules/**",
                // Hard-to-test UI modules: these render complex modal/overlay DOM
                // trees with inline event handlers and cross-component wiring
                // (PluginManager hooks) that require full DOM interaction
                // testing rather than unit tests.
                // Coverage is enforced via integration/E2E tests instead.
                "src/modules/pluginManagerUI.ts",
                // Entry-point bootstrap: wires every subsystem together inside a
                // DOMContentLoaded handler with async data loading (Wails bindings
                // or fetch+cache), dynamic imports, and singleton initialization
                // with side effects. Exercised end-to-end via Playwright E2E.
                "src/script.ts",
                // 3D molecule rendering via SmilesDrawer on <canvas>. Requires a
                // real WebGL/canvas implementation (not available in jsdom) and
                // user-driven pan/zoom interactions. Covered by visual/E2E tests.
                "src/modules/molecularViewer.ts",
                // Example/demo plugin: demonstrates the plugin API with a
                // crystal structure calculator. Covered by pluginManager tests.
                "src/modules/plugins/crystalStructurePlugin.ts",
            ],
            thresholds: {
                lines: 90,
                branches: 79,
                functions: 85,
                statements: 89,
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
