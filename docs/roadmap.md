# Roadmap (proposal-level)

> Status: proposals only. WASM core, the mobile app, and the plugin
> marketplace are each multi-week efforts. Nothing below is implemented;
> each phase lists entry criteria, scope fences, and acceptance checks so a
> future workstream can pick it up without re-scoping.

## Phase proposal 1: WASM core

- **Goal:** compile the pure calculation kernels
  (`internal/calculators`, formula parser, equation balancer) to
  WebAssembly so the web frontend can compute offline without a server
  round-trip.
- **Entry criteria:** calculator registry boundary is dependency-free
  (no `database/sql`, no OS handles); `go vet` clean on the extracted
  package.
- **Scope fences:** WASM covers calculators only — compound search and
  plugin storage stay server/desktop-side. No new npm dependencies for
  the loader (use `WebAssembly.instantiateStreaming` + a hand-rolled
  glue shim).
- **Acceptance:** `wasm/` package builds with `GOOS=js GOARCH=wasm`;
  frontend timing budgets (see `frontend/src/modules/parserTiming.test.ts`)
  pass against the WASM path; E2E parity test balances 20 reference
  equations identically on both paths.

## Phase proposal 2: mobile app

- **Goal:** a phone-friendly client reusing the existing REST contract
  (`docs/developer-guide.md`) with offline-first calculation history.
- **Entry criteria:** REST validation behaviour (400 cases) frozen and
  documented; print/PDF export path (`exportPrintView.ts`) factored so it
  can be shared.
- **Scope fences:** no native rewrite of calculators — the app is a
  shell over the same API/WASM core. Push notifications and app-store
  billing are explicitly out of scope for v1.
- **Acceptance:** molar-mass, dilution, and balancer flows usable at
  360px width with tap targets >= 44px; history survives process restart;
  release checklist covers both stores' privacy labels (no server-side
  user data by design).

## Phase proposal 3: plugin marketplace

- **Goal:** a curated directory where third-party calculator plugins can
  be published, reviewed, and installed into the desktop app.
- **Entry criteria:** plugin record API (`/plugins`) stabilised; signed
  manifest format agreed; moderation queue resourced.
- **Scope fences:** marketplace distributes plugin *metadata + review
  status* only — code execution stays in the existing sandboxed
  `pluginManager` runtime. No server-side code execution, no payments
  in v1.
- **Acceptance:** install/uninstall round-trip from directory to desktop
  app; revoked plugin is disabled within 24h; supply-chain notes
  (provenance, checksum) visible per listing.

## Future work: Content-Security-Policy nonce migration

The server intentionally keeps `'unsafe-inline'` in `script-src` and
`style-src` (see `cmd/server/main.go:securityHeadersMiddleware`): the
static frontend relies on inline event handlers and `<style>` tags, and
the Swagger UI served at `/api/docs` loads from `cdn.jsdelivr.net`,
which the current policy allow-lists.

Migrating to nonces (or hashes) is future work because it requires
touching every inline handler and the docs shim in one coordinated
change — out of scope for the current container/docs/export/viewer
workstream. When it happens: generate a per-request nonce in
`securityHeadersMiddleware`, pass it to the HTML template and the
Swagger initializer, assert the absence of `'unsafe-inline'` in
`cmd/server/main_test.go`, and re-verify the desktop (Wails) build,
which serves the same bundle under a different scheme.
