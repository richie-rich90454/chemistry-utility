# Chemistry Utility API — Developer Guide

This guide documents the Chemistry Utility REST API: endpoints, rate limiting,
errors, pagination, calculator inputs, compound search, and plugin storage.
For the full machine-readable contract, see the
[OpenAPI 3.1 specification](../api/openapi.yaml) or browse it interactively at
`/api/docs` (Swagger UI) once the server is running.

The API is **public and anonymous**: there is no authentication, no user
accounts, and no server-side history. Two deployment targets exist:

- **Web server** (`cmd/server`): runs without any database. Calculator
  endpoints work; database-backed features (compound search, plugins) respond
  `501 Not Implemented`.
- **Desktop app** (Wails): starts the same API in-process on a random loopback
  port (exposed to the frontend via the `App.GetAPIURL` binding) backed by a
  local SQLite (or PostgreSQL) database. Compound search and plugin storage
  work there.

## Table of Contents
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Errors (RFC 7807)](#errors-rfc-7807)
- [Pagination](#pagination)
- [Calculators](#calculators)
- [Compounds](#compounds)
- [Plugins](#plugins)
- [Example API Calls](#example-api-calls)
- [Interactive Documentation](#interactive-documentation)

---

## Base URL

All versioned API endpoints live under `/api/v1`. Documentation endpoints live
under `/api/docs` (no version prefix).

| Environment | Base URL |
| --- | --- |
| Local development | `http://localhost:6005/api/v1` |
| Desktop app | `http://127.0.0.1:<random port>/api/v1` (per-run port via Wails binding) |
| Production | Your deployment of `cmd/server`; default port is `6005` |

The default local server port is `6005` (overridable via the `PORT` env var).

---

## Authentication

None. The API is anonymous by design — calculations never touch a database and
no user data is stored server-side.

---

## Rate Limiting

Rate limiting is applied per client IP with a fixed one-minute window on all
`/api/v1` routes.

| Scope | Default limit |
| --- | --- |
| All `/api/v1` routes | 100 requests/minute |

The limit is configurable:

- Web server: `RATE_LIMIT_PER_MINUTE` env var (defaults to `100`).
- Programmatic: `Config.RateLimitPerMinute`.

When the limit is exceeded, the server responds with `429 Too Many Requests`
and a plain JSON body (not Problem Details):

```json
{ "error": "rate limit exceeded" }
```

Client IP resolution ignores spoofable `X-Forwarded-For` headers unless the
proxy's CIDR is listed in the `TRUSTED_PROXIES` env var (web server only).

---

## Errors (RFC 7807)

Error responses from API handlers use **RFC 7807 Problem Details** with the
`application/problem+json` media type. The shape is:

```json
{
  "type": "https://chemistry-utility.dev/errors/400",
  "title": "Bad Request",
  "status": 400,
  "detail": "missing search query parameter 'q'",
  "instance": "/api/v1/compounds"
}
```

| Field | Meaning |
| --- | --- |
| `type` | URI identifying the problem type (per status code). |
| `title` | Short human-readable summary. |
| `status` | HTTP status code. |
| `detail` | Specific explanation of this occurrence. |
| `instance` | Request path that produced the error. |

Common status codes returned by the API:

| Status | Title | When |
| --- | --- | --- |
| 400 | Bad Request | Validation failure, malformed JSON, calculation error, invalid UUID. |
| 404 | Not Found | Unknown calculator type or resource id. |
| 429 | Too Many Requests | Rate limit exceeded (plain JSON shape, see above). |
| 500 | Internal Server Error | Unexpected server failure (generic detail; full error logged server-side only). |
| 501 | Not Implemented | Database-backed feature requested from the anonymous web build. |

### Validation (400) cases

All cases below return RFC 7807 Problem Details (`application/problem+json`,
`type: https://chemistry-utility.dev/errors/400`) with a `detail` string.
Behavioral notes (body cap, clamping) apply to every request.

- **Request body.** `POST /calculators/{type}` accepts at most 1 MiB
  (`http.MaxBytesReader`); larger or malformed JSON returns 400
  `invalid JSON body: ...`. A JSON `null` body is treated as `{}` and
  then validated per calculator. Unknown `{type}` is 404, not 400.
- **Missing vs. invalid inputs.** Every calculator reports
  `calculation error: missing required input: <key>` when a required key
  is absent (e.g. `formula` for `molar-mass`, `equation` for
  `equation-balance`/`stoichiometry`, `solveFor` for `dilution`/`ideal-gas`,
  `concentrations`/`orders` for `rate-law`, `deltaHValues` for `hess-law`,
  `SProducts`/`SReactants` for `entropy`). Wrong types and out-of-range
  enums report `calculation error: invalid <key>: <value>` — e.g.
  `invalid solveFor`, `invalid mode`, `invalid unit`/`invalid units`.
- **Formula and equation syntax.** `molar-mass` rejects unknown elements
  (`Element not found: <symbol>`), illegal characters
  (`Invalid character: <ch>`), and unbalanced brackets (`Unmatched ...` /
  `Empty formula`). `equation-balance` rejects inputs without exactly one
  `->`/`=` separator (`invalid equation format: expected exactly one
  '->' or '='`), illegal formula characters, and unsolvable systems
  (`Could not balance` / `Could not balance ionic equation`); redox mode
  additionally requires the `||` half-reaction separator.
- **Compounds.** `GET /compounds` without `q` returns 400
  `missing search query parameter 'q'`. `limit`/`offset` never 400:
  out-of-range `limit` is clamped to 20, negative `offset` to 0.
  `GET /compounds/{id}` with a non-UUID returns 400 `invalid compound id`;
  a well-formed but unknown UUID returns 404 `compound not found`.
- **Plugins.** `POST /plugins` returns 400 with the binding error when
  `name`, `version`, or `author` is missing. Enable/disable/delete with a
  non-UUID returns 400 `invalid plugin id`; store errors (including unknown
  ids) surface as 500 via `WriteError`, never 400.

---

## Pagination

Only compound search paginates, using offset-based (`limit` + `offset`)
parameters:

| Parameter | Default | Range |
| --- | --- | --- |
| `limit` | 20 | 1–100 (clamped to 20 if out of range) |
| `offset` | 0 | ≥ 0 |

Example:
```
GET /api/v1/compounds?q=water&limit=10&offset=20
```

---

## Calculators

Calculators are public, rate-limited endpoints that accept a JSON object of
inputs and return a `CalculationResult`.

### List available calculators

`GET /calculators` returns the sorted list of registered calculator type IDs:

```bash
curl http://localhost:6005/api/v1/calculators
```

```json
{
  "calculators": [
    "arrhenius",
    "bond-type",
    "buffer-solution",
    "cell-potential",
    "colligative-properties",
    "combined-gas",
    "debroglie-wavelength",
    "dilution",
    "electron-configuration",
    "electrolysis",
    "entropy",
    "equation-balance",
    "gibbs-free-energy",
    "half-life",
    "heat-capacity",
    "heisenberg-uncertainty",
    "ideal-gas",
    "integrated-rate-law",
    "ksp",
    "mass-percent",
    "molar-mass",
    "nernst",
    "photoelectric-effect",
    "pka-pkb",
    "quantum-numbers",
    "rate-law",
    "solution-mixing",
    "stoichiometry",
    "titration-curve",
    "van-der-waals"
  ]
}
```

### Run a calculator

`POST /calculators/{type}` accepts a JSON object whose shape depends on the
calculator. The response is a `CalculationResult`:

```json
{
  "Value": 18.015,
  "Unit": "g/mol",
  "Breakdown": [
    { "Label": "H", "Value": 2.016, "Unit": "g/mol" },
    { "Label": "O", "Value": 15.999, "Unit": "g/mol" }
  ],
  "Steps": [
    "H: 1.0080 g/mol × 2.0 = 2.0160 g/mol",
    "O: 15.9990 g/mol × 1.0 = 15.9990 g/mol"
  ],
  "Metadata": { "formula": "H2O" }
}
```

### Calculator types and input schemas

The table below lists every registered calculator type and the input keys it
accepts. Required keys are marked; all others are optional with documented
defaults. Numeric inputs accept JSON numbers (integers or floats).

| Type | Input keys | Notes |
| --- | --- | --- |
| `molar-mass` | `formula` (string, **required**) | e.g. `"H2O"`, `"Ca(OH)2"`. |
| `equation-balance` | `equation` (string, **required**) | e.g. `"H2 + O2 -> H2O"`. Accepts ion charges like `"Fe2+ + Fe3+"`. |
| `stoichiometry` | `equation` (**required**), `mode` (`"product-from-reactant"` default, `"reactant-from-product"`, `"limiting-reactant"`), plus mode-specific keys. | |
| `dilution` | `C1`, `V1`, `C2`, `V2`, `solveFor` (one of `C1`/`V1`/`C2`/`V2`, **required**). | |
| `mass-percent` | `solute`, `solution`, `unit` (`"percent"` default, `"ppm"`, `"ppb"`). | |
| `solution-mixing` | `C1`, `V1`, `C2`, `V2`. | Mixes two solutions. |
| `ideal-gas` | `P`, `V`, `n`, `T`, `solveFor` (one of `P`/`V`/`n`/`T`, **required**), `units` (`"atm-L"` default or `"SI"`). | PV = nRT. |
| `combined-gas` | `P1`, `V1`, `T1`, `P2`, `V2`, `T2`, `solveFor` (**required**). | |
| `van-der-waals` | `V`, `n`, `T`, `a`, `b`. | |
| `half-life` | `N0` (initial quantity), `t` (time), `halfLife` (t½), `Nt` (remaining quantity), `solveFor` (`"remaining"` default, `"time"`, or `"halfLife"`). | Decay decreases quantity: `Nt < N0`. |
| `cell-potential` | `E1`, `E2`. | Higher potential is the cathode. |
| `nernst` | `E_standard`, `T`, `n`, `Q`. | |
| `electrolysis` | `m` (mass), `I` (current), `t` (time), `z` (charge number), `M` (molar mass), `solveFor` (default `"mass"`). | |
| `bond-type` | `element1` (symbol), `element2` (symbol). | |
| `gibbs-free-energy` | `deltaH` (kJ/mol), `deltaS` (J/(mol·K)), `T` (K). | ΔG = ΔH − TΔS. |
| `hess-law` | `deltaHValues` (array of float64). | |
| `entropy` | `SProducts` (array of float64), `SReactants` (array of float64). | ΔS = ΣS(products) − ΣS(reactants). |
| `heat-capacity` | `m` (mass), `c` (specific heat), `deltaT` (temperature change), `q`, `solveFor` (default `"q"`). | q = mcΔT. |
| `arrhenius` | `A` (pre-exponential factor), `Ea` (activation energy in J/mol), `T`, `k`, `solveFor` (default `"k"`; also `"Ea"`, `"T"`, `"A"`). | |
| `rate-law` | `k`, `concentrations` (array of float64), `orders` (array of float64). | |
| `integrated-rate-law` | `order` (integer 0, 1, or 2), `k`, `initialConcentration`, `time` or `concentration`, `solveFor` (`"concentration"` default, or `"time"`). | |
| `buffer-solution` | `pKa`, `HA` (acid concentration), `A` (conjugate base concentration). | Henderson–Hasselbalch. |
| `pka-pkb` | `pKa` or `pKb`, `pKw` (optional, defaults to 14), `solveFor` (default `"pKb"`). | |
| `ksp` | `mode` (`"ksp-to-solubility"` default, `"solubility-to-ksp"`), `Ksp` or `molarSolubility`, `cationCount` (default 1), `anionCount` (default 1). | |
| `colligative-properties` | `mode` (`"boiling"` default, `"freezing"`, `"osmotic"`), plus mode-specific keys: `Kb`/`m`, `Kf`/`m`, or `M`/`T`/`i`. | |
| `titration-curve` | `analyteConcentration`, `analyteVolume`, `titrantConcentration`, `mode`, `numPoints` (default 50), `pKa` (weak-acid modes). | |
| `quantum-numbers` | `n`, `l`, `ml`, `ms`. | |
| `electron-configuration` | `atomicNumber`. | Full Aufbau configuration with known exceptions (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, Pt, Au). |
| `debroglie-wavelength` | `m` (mass in kg), `v` (velocity in m/s). | |
| `photoelectric-effect` | `frequency` (Hz), `workFunction` (in J or eV), `solveFor` (default `"KE"`), `unit` (default `"eV"`). | |
| `heisenberg-uncertainty` | `deltaX` (or `deltaP`), `solveFor` (`"deltaX"`, `"deltaP"`, `"minDeltaX"`, `"minDeltaP"`). | |

If a required input is missing or has the wrong type, the API returns a 400
Problem Details response with a message like `"missing required input: formula"`.

---

## Compounds

Compound search queries the local compound table (populated by the desktop
app's PubChem-backed cache). On the anonymous web build these endpoints
respond `501 Not Implemented`.

### Search compounds

`GET /compounds?q=<term>` searches by name, formula, CAS number, and SMILES.

| Parameter | Meaning |
| --- | --- |
| `q` (**required**) | Free-text search term. |
| `type` | Optional filter: `name`, `formula`, `cas`, or `smiles`. Any other value searches all fields. |
| `limit` / `offset` | See [Pagination](#pagination). |

Response:

```json
{
  "compounds": [
    {
      "ID": "...",
      "Name": "Water",
      "Formula": "H2O",
      "CASNumber": "7732-18-5",
      "SMILES": "O",
      "InChI": "...",
      "MolarMass": 18.015,
      "Properties": "{}",
      "Source": "pubchem",
      "CreatedAt": "...",
      "UpdatedAt": "..."
    }
  ],
  "query": "water"
}
```

### Get a compound by ID

`GET /compounds/{id}` returns the full compound object (404 if unknown;
400 for an invalid UUID).

---

## Plugins

Plugin registration is persisted in the desktop app's local database. On the
anonymous web build these endpoints respond `501 Not Implemented`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/plugins` | List all plugins. |
| `POST` | `/plugins` | Create a plugin. Body: `{"name","version","author","manifest"}` (first three required); created disabled. Returns 201. |
| `PATCH` | `/plugins/{id}/enable` | Enable the plugin. |
| `PATCH` | `/plugins/{id}/disable` | Disable the plugin. |
| `DELETE` | `/plugins/{id}` | Delete the plugin. Returns 204. |

Note: these HTTP endpoints manage plugin *records* in the database. The
frontend plugin runtime (`frontend/src/modules/pluginManager.ts`) manages
locally installed plugins in browser storage and does not use this API.

---

## Example API Calls

### Run the molar-mass calculator (public)

```bash
curl -X POST http://localhost:6005/api/v1/calculators/molar-mass \
  -H "Content-Type: application/json" \
  -d '{"formula":"H2O"}'
```

### Run the ideal-gas calculator (public)

```bash
curl -X POST http://localhost:6005/api/v1/calculators/ideal-gas \
  -H "Content-Type: application/json" \
  -d '{"solveFor":"P","V":22.4,"n":1,"T":273.15,"units":"atm-L"}'
```

### Balance an equation with ionic species (public)

```bash
curl -X POST http://localhost:6005/api/v1/calculators/equation-balance \
  -H "Content-Type: application/json" \
  -d '{"equation":"Fe2+ + MnO4- + H+ -> Fe3+ + Mn2+ + H2O"}'
```

### Search compounds (desktop build)

```bash
curl "http://localhost:6005/api/v1/compounds?q=water&type=name&limit=10&offset=0"
```

### Register a plugin record (desktop build)

```bash
curl -X POST http://localhost:6005/api/v1/plugins \
  -H "Content-Type: application/json" \
  -d '{"name":"my-plugin","version":"1.0.0","author":"Alice","manifest":"{}"}'
```

---

## Interactive Documentation

Once the server is running, browse to:

- **Swagger UI**: `http://localhost:6005/api/docs` — interactive UI for
  exploring and trying endpoints, powered by the served spec.
- **OpenAPI YAML**: `http://localhost:6005/api/docs/openapi.yaml` — the raw
  OpenAPI 3.1 specification, suitable for code generation and tooling.

The spec is also available as a source file at
[`api/openapi.yaml`](../api/openapi.yaml).
