import { defineConfig } from "vitest/config";
import path from "path";
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
            include: ["src/modules/**/*.ts"],
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
                lines: 82,
                branches: 68,
                functions: 85,
                statements: 80,
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
