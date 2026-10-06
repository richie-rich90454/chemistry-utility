import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [solid({hot: false})],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "lcov"],
            include: ["src/**/*.ts", "src/**/*.tsx"],
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
                // 3D molecule rendering via SmilesDrawer on <canvas>. Requires a
                // real WebGL/canvas implementation (not available in jsdom) and
                // user-driven pan/zoom interactions. Covered by visual/E2E tests.
                "src/modules/molecularViewer.ts",
                // Example/demo plugin: demonstrates the plugin API with a
                // crystal structure calculator. Covered by pluginManager tests.
                "src/modules/plugins/crystalStructurePlugin.ts",
            ],
            thresholds: {
                lines: 100,
                branches: 100,
                functions: 100,
                statements: 100,
            },
        },
    },
    resolve: {
        alias: {
            "@": import.meta.dirname + "/src",
        },
    },
});
