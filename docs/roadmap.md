# Roadmap (proposal-level)

> Status: proposals only. Each phase lists entry criteria, scope fences, and
> acceptance checks so a future workstream can pick it up without re-scoping.

The website is the product: it is static, client-side, and complete on its
own. The Go wrapper in `core/` is optional and ports a subset of the
calculators for the desktop build.

## Phase proposal 1: mobile app

- **Goal:** a phone-friendly client that reuses the existing static site with
  offline-first calculation history.
- **Entry criteria:** the website build is installable as a PWA (already true
  for the web target); the print/PDF export path (`src/modules/exportPrintView.ts`)
  is factored so it can be shared.
- **Scope fences:** no native rewrite of the calculators — the app is a shell
  over the same static bundle. Push notifications and app-store billing are
  out of scope for v1.
- **Acceptance:** molar-mass, dilution, and balancer flows usable at 360px
  width with tap targets >= 44px; history survives process restart; release
  checklist covers both stores' privacy labels (no server-side user data by
  design).

## Phase proposal 2: plugin marketplace

- **Goal:** a curated directory where third-party calculator plugins can be
  published, reviewed, and installed into the desktop app.
- **Entry criteria:** plugin manifest format agreed; moderation queue
  resourced.
- **Scope fences:** the marketplace distributes plugin *metadata and review
  status* only — code execution stays in the existing sandboxed
  `pluginManager` runtime (`src/modules/pluginManager.ts`). No server-side code
  execution, no payments in v1.
- **Acceptance:** install/uninstall round-trip from directory to desktop app;
  revoked plugin is disabled within 24h; supply-chain notes (provenance,
  checksum) visible per listing.

## Phase proposal 3: expand the Go calculator coverage

- **Goal:** close the remaining gap between the TypeScript calculators and the
  Go ports, so fewer desktop calls fall back to the bundled TypeScript engine.
- **Entry criteria:** conformance vectors exist for the calculator to port.
- **Scope fences:** ports stay behavior-identical to the TypeScript
  implementation; the conformance suite is the only acceptance gate.
- **Acceptance:** `go test ./...` reports the ported calculator count rising
  and every vector passing; no route changes.

## Future work: Content-Security-Policy nonce migration

The static site ships a CSP that keeps `'unsafe-inline'` in `script-src` and
`style-src`, because the UI relies on inline handlers and `<style>` tags.
Migrating to nonces or hashes is future work: it requires touching every
inline handler in one coordinated change, then updating the CSP in the HTML
shell (`index.web.html`) and re-verifying both the web and the desktop builds
(the desktop app serves the same bundle under a different scheme).
