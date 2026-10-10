# Architecture

## Two engines, one contract

The calculator engine exists twice. The web build runs the TypeScript
implementation in `frontend/src/modules/calculators/`; the desktop build runs
the Go implementation in `core/calculators/`. Both are held to the same
behavior by the vectors in `conformance/`.

This split is deliberate. The website must be pure static with no Go runtime,
and the desktop app must be fully native with no web dependency. Sharing one
engine would force either WASM in the website or a server in the desktop app.

### The pure layer

`frontend/src/modules/calculators/` holds the calculator math. Rules:

- No DOM, no storage, no network. A lint rule enforces this; the directory is
  the contract boundary.
- Instantiating a calculator performs no I/O and holds no element references.
- Results are structured values, not formatted strings. The frontend formats
  numbers once, using the shared locale formatter, so the Go port never has
  to reimplement `Intl.NumberFormat`.

`PureCalculator` is the base class. Subclasses implement
`performCalculationPure`, which takes a plain input record and returns a
result. The base owns the plugin hook chain and error capture. Hooks and
history are injected sinks, so the default construction is inert.

### The DOM layer

`frontend/src/modules/dom/` holds everything that needs a browser: form
binding, chart rendering, default prefill, and the legacy per-calculator
entry points. Chart.js is imported lazily from here only.

### Conformance vectors

`conformance/*.json` records the inputs and expected outputs of every
calculator. `go test` and `vitest` both consume these files.

Regenerate after changing calculator behavior:

```
cd frontend && npx tsx scripts/generate-conformance.ts
git diff conformance/
```

A non-empty diff means behavior changed. That is fine when intended, but the
Go port must be updated in the same change.

## Build targets

| | Web | Desktop |
|---|---|---|
| Output | static files, no runtime | native binary, no server |
| Entry | `entry.web.tsx` (hydrate) | `entry.app.tsx` (render) |
| Engine | TypeScript | Go via Wails bindings |
| SEO, JSON-LD, sitemap, PWA | included | stripped |
| Files | `<input type=file>` and download | native dialogs |

Everything below the entry is shared. The two modes differ only in the head
markup, which is what keeps the UI pixel-identical.

## Where things live

```
conformance/          shared behavior vectors
core/                 Go module: calculators, periodic table, compounds, Wails bindings
frontend/src/
  modules/calculators/  pure math, no DOM
  modules/dom/          DOM access, chart bindings
  modules/              shared non-calculator utilities
  solid/                routes, components, stores
```
