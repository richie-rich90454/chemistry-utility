# Developer Guide

This repository is **one npm project**: a static chemistry website built with
TypeScript, SolidJS, and Vite. Everything in `src/` compiles to plain files
with no server, no database, and no API.

`core/` is an optional **Go wrapper**: a Wails desktop shell that embeds the
built website and re-implements a subset of the calculators in Go. It is not
required to build, test, or run the website.

## Requirements

- **Node.js** 20.19+ (or 22.12+) with **npm**
- **Go** 1.25+ — only for the desktop wrapper
- **Wails v2 CLI** — only for the desktop wrapper

## Commands

All commands run from the repository root.

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server at http://localhost:5173 |
| `npm run build:web` | Production website build into `dist/` (prerenders all routes) |
| `npm run build:app` | Desktop-web build into `dist/` (no SEO/PWA assets) |
| `npm run preview` | Serve the built `dist/` locally |
| `npm test` | Vitest unit tests |
| `npm run test:coverage` | Unit tests with the coverage thresholds |
| `npm run test:e2e` | Playwright end-to-end tests against the built site |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `src/` |
| `npm run check-bundle-size` | Gzipped bundle budgets |
| `npm run cli` | Command-line interface (`src/cli/index.ts`) |
| `npm run conformance:generate` | Regenerate `conformance/*.json` |
| `npm run conformance:verify` | Regenerate and fail if the vectors moved |
| `npm run desktop:build` | Build the Wails desktop binary (Go wrapper) |
| `npm run desktop:dev` | Run the desktop app with hot reload |
| `npm run core:test` | Go tests for the wrapper |
| `npm run core:lint` | `golangci-lint` for the wrapper |

`npm run check` runs typecheck, lint, and tests together.

## Project layout

```
src/
  modules/calculators/   pure calculator math (no DOM, no storage, no network)
  modules/dom/           DOM, charts, platform adapters (web vs native)
  modules/               shared non-calculator utilities
  solid/                 routes, components, stores, entry points
  ssr/                   prerender entry used by scripts/prerender.mjs
  cli/                   command-line interface
  workers/               web workers for heavy calculation
public/                  static assets (fonts, icons, ptable.json, sw.js)
scripts/                 build, prerender, conformance, and quality scripts
conformance/             shared behavior vectors (JSON)
core/                    optional Go wrapper (Wails desktop shell)
```

## The engine seam

`src/modules/engine.ts` is the only file that knows which engine runs.

- The website uses the TypeScript calculators in `src/modules/calculators/`.
- The desktop app calls the Go registry in `core/internal/calculators/` over
  Wails bindings.
- If the Go registry does not implement a calculator id, the desktop engine
  falls back to the TypeScript calculator bundled in the app, so the desktop
  always exposes the full calculator set.

Every calculator is a plain function: an input record in, a structured result
out. The contract is:

```ts
interface CalculatorResult {
  value: string;                              // display value
  explanation?: string;                       // worked steps
  chartData?: unknown;                        // optional series
  metadata?: Record<string, unknown>;         // machine-readable detail
}
```

The frontend formats numbers once with the shared locale formatter, so the Go
port never has to reimplement `Intl.NumberFormat`.

## Adding a calculator

1. Add the pure function to `src/modules/calculators/`. Keep it DOM-free,
   storage-free, and network-free — a lint rule enforces this.
2. Register it in `WEB_CALCULATORS` in `src/modules/engine.ts`.
3. Add a route under `src/solid/routes/` and a loader in
   `src/solid/routeLoaders.ts`.
4. Add vectors in `scripts/generate-conformance.ts`, then run
   `npm run conformance:generate`.
5. (Optional) Port it to Go in `core/internal/calculators/` and register it in
   the `ported` map in `conformance_test.go`. If you skip this step the
   desktop app still works: the engine falls back to the TypeScript
   implementation.

## Conformance vectors

`conformance/*.json` records the inputs and expected outputs of every
calculator. Both `go test` and `vitest` consume these files, which is what
keeps the TypeScript and Go engines in agreement.

```
npm run conformance:generate
git diff conformance/     # non-empty means behavior changed
```

A non-empty diff is fine when intended, but the Go port must be updated in the
same change.

## Calculator input keys

There is no separate wire format: a calculator receives a `Record<string,string>`
whose keys are its own. Each calculator reads the keys it needs and ignores the
rest, so the authoritative list is the calculator itself.

- TypeScript: `src/modules/calculators/*.ts` (the `inputs["…"]` reads).
- A worked example per calculator: `conformance/<id>.json` (`cases[].inputs`).

The Go ports reuse the exact same keys; the conformance vectors are what keep
the two in step. When an input is missing or invalid, the calculator throws
(TypeScript) or returns an error (Go). The engine maps both to the same result
shape: `{ value: "", explanation: "Error: <message>" }`.

## The Go wrapper

`core/` is a single Go module (`chemistry-utility/core`):

```
core/
  main.go               Wails entry point; embeds core/dist
  app.go                app struct and the PTableService binding
  services.go           CalculatorService, DataService, FileService bindings
  internal/calculators/ the ported calculators and the registry
  internal/ptable/      periodic table service
  dist/                 the staged website build (git-ignored)
```

`npm run desktop:build` runs `wails build`, which runs the website build,
stages it into `core/dist` via `scripts/stage-dist.mjs`, and embeds it in the
binary. The `wails.json` `frontend:dir` points at the repository root, so
Wails uses the root `package.json`.

The wrapper never starts an HTTP server. The frontend calls bound Go methods
directly through the Wails runtime (`window.go`).

## Architecture notes

See [`docs/architecture.md`](architecture.md) for the engine seam, the build
targets, and the conformance contract.
