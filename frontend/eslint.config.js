import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import solid from "eslint-plugin-solid";

export default [
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
		},
	},
	{
		files: ["src/**/*.{tsx,jsx}"],
		...solid.configs["flat/typescript"],
		languageOptions: {
			parser: tsparser,
		},
	},
	{
		// The pure calculator layer is the contract boundary shared with the Go
		// implementation in core/. It must stay DOM-free so it runs under Node
		// in tests and under Go in the desktop build. DOM access belongs in
		// src/modules/dom/.
		files: ["src/modules/calculators/**/*.ts"],
		rules: {
			"no-restricted-globals": [
				"error",
				{
					"name": "document",
					"message": "The pure calculator layer must not touch the DOM. Put DOM access in src/modules/dom/.",
				},
				{
					"name": "window",
					"message": "The pure calculator layer must not touch the DOM. Put DOM access in src/modules/dom/.",
				},
				{
					"name": "localStorage",
					"message": "The pure calculator layer must be storage-free. Inject a HistorySink instead.",
				},
				{
					"name": "sessionStorage",
					"message": "The pure calculator layer must be storage-free. Inject a HistorySink instead.",
				},
				{
					"name": "fetch",
					"message": "The pure calculator layer must not perform I/O. Go performs any network access in the desktop build.",
				},
				{
					"name": "XMLHttpRequest",
					"message": "The pure calculator layer must not perform I/O. Go performs any network access in the desktop build.",
				},
			],
		},
	},
	{
		ignores: ["src/wailsjs/**", "dist/**", "build/**"],
	},
];
