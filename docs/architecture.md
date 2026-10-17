# Architecture

## One website, one optional native wrapper

The repository is a single npm project: the root is the website (TypeScript,
SolidJS, Vite). Everything in `src/` builds to a static site with no runtime.
The `core/` directory is an optional Go wrapper: a Wails desktop shell that
embeds the built website and re-implements a subset of the calculators in Go.

The calculator engine therefore exists twice for the calculators the desktop
wrapper ports. The website runs the TypeScript implementation in
`src/modules/calculators/`; the desktop app calls the Go implementation in
`core/internal/calculators/` through Wails bindings, and falls back to the
bundled TypeScript calculator for any id Go does not implement. Both are held
to the same behavior by the vectors in `conformance/`.

This split is deliberate. The website must be pure static with no Go runtime,
and the desktop app must be fully native with no web dependency for the
calculators it ports.

### The pure layer

`src/modules/calculators/` holds the calculator math. Rules:

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

`src/modules/dom/` holds everything that needs a browser: form binding, chart
rendering, default prefill, and the per-calculator entry points. Chart.js is
imported lazily from here only.

### The seam

`src/modules/engine.ts` is the only file that knows which engine runs.
`getEngine()` returns the Go-backed engine inside the Wails runtime and the
TypeScript engine everywhere else. A missing Go calculator is handled there
rather than in any route.

### Conformance vectors

`conformance/*.json` records the inputs and expected outputs of every
calculator. `go test` and `vitest` both consume these files.

Regenerate after changing calculator behavior:

```
npx tsx scripts/generate-conformance.ts
git diff conformance/
```

A non-empty diff means behavior changed. That is fine when intended, but the
Go port must be updated in the same change.

## Build targets

| | Web | Desktop |
|---|---|---|
| Output | static files, no runtime | native binary, no server |
| Entry | `entry.web.tsx` (hydrate) | `entry.app.tsx` (render) |
| Engine | TypeScript | Go via Wails bindings, TypeScript fallback |
| SEO, JSON-LD, sitemap, PWA | included | stripped |
| Files | `<input type=file>` and download | native dialogs |

Everything below the entry is shared. The two modes differ only in the head
markup, which is what keeps the UI pixel-identical.

## Where things live

```
src/                  website source (the npm project lives at the root)
  modules/calculators/  pure math, no DOM
  modules/dom/          DOM access, chart bindings, platform adapters
  modules/              shared non-calculator utilities
  solid/                routes, components, stores
conformance/          shared behavior vectors
core/                 optional Go wrapper: calculators, periodic table, Wails bindings
```

