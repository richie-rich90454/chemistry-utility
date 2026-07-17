# Chemistry Utility API — Developer Guide

This guide explains how to integrate with the Chemistry Utility REST API: authentication,
rate limiting, errors, pagination, role-based access, calculators, and workspace
collaboration. For the full machine-readable contract, see the
[OpenAPI 3.1 specification](../api/openapi.yaml) or browse it interactively at
`/api/docs` (Swagger UI) once the server is running.

## Table of Contents
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Role-Based Access Control](#role-based-access-control)
- [Rate Limiting](#rate-limiting)
- [Errors (RFC 7807)](#errors-rfc-7807)
- [Pagination](#pagination)
- [Calculators](#calculators)
- [Workspaces & Collaboration](#workspaces--collaboration)
- [Example API Calls](#example-api-calls)
- [Interactive Documentation](#interactive-documentation)

---

## Base URL

All versioned API endpoints live under `/api/v1`. Documentation endpoints live
under `/api/docs` (no version prefix).

| Environment | Base URL |
| --- | --- |
| Local development | `http://localhost:6005/api/v1` |
| Production | `https://api.chemistry-utility.dev/api/v1` |

The default local server port is `6005` (overridable via the `PORT` env var).

---

## Authentication

The API uses JWT bearer tokens. There are three ways to obtain tokens:
email/password registration, email/password login, or OAuth (GitHub/Google).

### 1. Register a new account

`POST /auth/register` creates a user with the default `student` role and returns
the user profile plus a token pair.

```bash
curl -X POST http://localhost:6005/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"super-secret-123","name":"Alice Doe"}'
```

Response (201):
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "name": "Alice Doe",
    "role": "student",
    "email_verified": false,
    "created_at": "2026-07-17T10:00:00Z",
    "updated_at": "2026-07-17T10:00:00Z"
  },
  "tokens": {
    "AccessToken": "eyJhbGciOi...",
    "RefreshToken": "eyJhbGciOi...",
    "AccessExpiry": "2026-07-17T10:15:00Z",
    "RefreshExpiry": "2026-07-24T10:00:00Z"
  }
}
```

### 2. Log in with email and password

`POST /auth/login` validates credentials and returns a fresh token pair.

```bash
curl -X POST http://localhost:6005/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"super-secret-123"}'
```

### 3. Refresh access tokens

Access tokens are short-lived (15 minutes by default). When an access token
expires, exchange the refresh token for a new pair using `POST /auth/refresh`.
Refresh tokens live for 7 days by default.

```bash
curl -X POST http://localhost:6005/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh-token-from-login>"}'
```

### 4. OAuth login (GitHub / Google)

OAuth is a two-step redirect flow. The server exposes dedicated endpoints per
provider rather than a generic `{provider}` path:

1. `GET /auth/github` (or `/auth/google`) — redirects the user agent to the
   provider's authorization page. Returns `404` if the provider is not
   configured (no client ID set).
2. The provider redirects back to `GET /auth/github/callback` (or
   `/auth/google/callback`) with a `code` query parameter. The server exchanges
   the code, finds or creates the user, and returns an `AuthResponse` JSON
   body containing `user` and `tokens`.

Typical browser flow:
```
GET /api/v1/auth/github
  -> 302 https://github.com/login/oauth/authorize?client_id=...
  -> user authorizes
  -> 302 /api/v1/auth/github/callback?code=...
  -> 200 { "user": {...}, "tokens": {...} }
```

### Using the access token

Send the access token in the `Authorization` header as a bearer token:

```
Authorization: Bearer <access-token>
```

Endpoints marked as "authenticated" in the OpenAPI spec require this header.
Public endpoints (calculators, compound search) do not.

### Password reset

- `POST /auth/forgot-password` — submits an email and **always returns 200**
  to prevent email enumeration. A reset token is issued server-side (the
  delivery mechanism is environment-dependent).
- `POST /auth/reset-password` — submits the reset `token` and a new `password`
  (minimum 8 characters). Returns 200 on success or 400 for an invalid/expired
  token.

---

## Role-Based Access Control

Every authenticated user has a role that determines which endpoints they can
access. Roles are hierarchical in intent but enforced via an explicit
allow-list in `auth.RBACMiddleware`.

| Role | Capabilities |
| --- | --- |
| `student` (default) | Use calculators, manage own calculations and workspaces. |
| `researcher` | Student permissions **plus** API key management (`/api-keys`). |
| `educator` | Same as `researcher` (granted by admins). |
| `admin` | Full access: analytics, plugins, all user data, all workspaces. |

Route groups and their required roles:

| Route prefix | Required role |
| --- | --- |
| `/auth/*`, `/calculators/*`, `/compounds/*` | Public (no auth) |
| `/users/me`, `/calculations/*`, `/workspaces/*` | Any authenticated user |
| `/api-keys/*` | `researcher`, `educator`, or `admin` |
| `/analytics/*`, `/plugins/*` | `admin` only |

For per-resource access (e.g. viewing or deleting a single calculation),
ownership is checked in addition to authentication: only the owner of a
resource or an `admin` may read, modify, or delete it.

---

## Rate Limiting

Rate limiting is applied **per client IP** with a sliding one-minute window.

| Scope | Default limit |
| --- | --- |
| Public routes (`/calculators`, `/compounds`) | 100 requests/minute |
| Authenticated routes | Not rate-limited at the middleware level (effectively higher) |
| Auth routes (`/auth/*`) | Not rate-limited |

The public limit is configurable via `Config.RateLimitPerMinute` (defaults to
`100`). When the limit is exceeded, the server responds with `429 Too Many
Requests` and a JSON body:

```json
{ "error": "rate limit exceeded" }
```

Note: the 429 response from the rate-limit middleware is a plain `{"error":...}`
shape rather than the RFC 7807 Problem Details format used elsewhere — see
[Errors](#errors-rfc-7807).

---

## Errors (RFC 7807)

All error responses from API handlers use **RFC 7807 Problem Details** with the
`application/problem+json` media type. The shape is:

```json
{
  "type": "https://chemistry-utility.dev/errors/400",
  "title": "Bad Request",
  "status": 400,
  "detail": "missing required field: email",
  "instance": "/api/v1/auth/register"
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
| 400 | Bad Request | Validation failure, malformed JSON, invalid UUID. |
| 401 | Unauthorized | Missing/invalid/expired JWT, invalid credentials. |
| 403 | Forbidden | Authenticated but lacks role or ownership. |
| 404 | Not Found | Resource does not exist, or OAuth provider not configured. |
| 409 | Conflict | Email already registered. |
| 429 | Too Many Requests | Rate limit exceeded (plain JSON shape, see above). |
| 500 | Internal Server Error | Unexpected server failure. |

---

## Pagination

Two pagination styles are used in the API, depending on the endpoint. Both are
documented per-endpoint in the OpenAPI spec.

### Page-based (`page` + `limit`)

Used by `GET /calculations`:

| Parameter | Default | Range |
| --- | --- | --- |
| `page` | 1 | ≥ 1 |
| `limit` | 20 | 1–100 (clamped to 20 if out of range) |

The offset is computed server-side as `(page - 1) * limit`. The response
echoes `page` and `limit` alongside `calculations`.

Example:
```
GET /api/v1/calculations?page=2&limit=50
```

### Offset-based (`limit` + `offset`)

Used by `GET /compounds` (compound search):

| Parameter | Default | Range |
| --- | --- | --- |
| `limit` | 20 | 1–100 (clamped to 20 if out of range) |
| `offset` | 0 | ≥ 0 |

Example:
```
GET /api/v1/compounds?q=water&limit=10&offset=20
```

`GET /workspaces` and `GET /workspaces/{id}/calculations` return up to 100
items and do not currently expose pagination parameters.

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
| `equation-balance` | `equation` (string, **required**) | e.g. `"H2 + O2 -> H2O"`. |
| `stoichiometry` | `equation` (**required**), `mode` (`"product-from-reactant"`, `"reactant-from-product"`, `"limiting-reactant"`), plus mode-specific keys. | |
| `dilution` | `C1`, `V1`, `C2`, `V2`, `solveFor` (one of `C1`/`V1`/`C2`/`V2`, **required**). | |
| `mass-percent` | `solute`, `solution`, `unit` (`"percent"`, `"ppm"`, `"ppb"`). | |
| `solution-mixing` | `C1`, `V1`, `C2`, `V2`. | Mixes two solutions. |
| `ideal-gas` | `P`, `V`, `n`, `T`, `solveFor` (one of `P`/`V`/`n`/`T`, **required**), `units` (`"atm-L"` default or `"SI"`). | PV = nRT. |
| `combined-gas` | `P1`, `V1`, `T1`, `P2`, `V2`, `T2`, `solveFor` (**required**). | |
| `van-der-waals` | `V`, `n`, `T`, `a`, `b`. | |
| `half-life` | `N0` (initial quantity), `t` (time), `halfLife` (t½), `solveFor` (`"remaining"` default, or `"halfLife"`/`"elapsed"`/`"initial"`). | |
| `cell-potential` | `E1`, `E2`. | Higher potential is the cathode. |
| `nernst` | `E_standard`, `T`, `n`, `Q`. | |
| `electrolysis` | `m` (mass), `I` (current), `t` (time), `z` (charge number), `solveFor`. | |
| `bond-type` | `element1` (symbol), `element2` (symbol). | |
| `gibbs-free-energy` | `deltaH` (kJ/mol), `deltaS` (J/(mol·K)), `T` (K). | ΔG = ΔH − TΔS. |
| `hess-law` | `deltaHValues` (array of float64). | |
| `entropy` | `SProducts` (array of float64), `SReactants` (array of float64). | ΔS = ΣS(products) − ΣS(reactants). |
| `heat-capacity` | `m` (mass), `c` (specific heat), `deltaT` (temperature change), `solveFor` (default `"q"`). | q = mcΔT. |
| `arrhenius` | `A` (pre-exponential factor), `Ea` (activation energy in J/mol), `T`, `solveFor` (default `"k"`). | |
| `rate-law` | `k`, `concentrations` (array of float64), `orders` (array of float64). | |
| `integrated-rate-law` | `order` (0, 1, or 2), `k`, `initialConcentration`, `time`. | |
| `buffer-solution` | `pKa`, `HA` (acid concentration), `A` (conjugate base concentration). | Henderson–Hasselbalch. |
| `pka-pkb` | `pKa` or `pKb`, `pKw` (optional, defaults to 14), `solveFor` (default `"pKb"`). | |
| `ksp` | `Ksp` (to find molar solubility) or `molarSolubility` + `stoichiometry`. | |
| `colligative-properties` | `mode` (`"boiling"`, `"freezing"`, `"osmotic"`), plus mode-specific keys. | |
| `titration-curve` | `analyteConcentration`, `analyteVolume`, `titrantConcentration`, ... | |
| `quantum-numbers` | `n`, `l`, `ml`, `ms`. | |
| `electron-configuration` | `atomicNumber`. | |
| `debroglie-wavelength` | `m` (mass in kg), `v` (velocity in m/s). | |
| `photoelectric-effect` | `frequency` (Hz), `workFunction` (in J or eV), `solveFor` (default `"KE"`), `unit` (default `"eV"`). | |
| `heisenberg-uncertainty` | `deltaX` (or `deltaP`), `solveFor` (`"deltaX"`, `"deltaP"`, `"minDeltaX"`, `"minDeltaP"`). | |

If a required input is missing or has the wrong type, the API returns a 400
Problem Details response with a message like `"missing required input: formula"`.

---

## Workspaces & Collaboration

Workspaces let users group calculations together and share them with other
users. Every workspace has exactly one owner (the creator) and zero or more
members.

### Lifecycle

- `POST /workspaces` — create a workspace. The creator is automatically added
  as a member with the `owner` role.
- `GET /workspaces` — list workspaces the current user belongs to.
- `GET /workspaces/{id}` — fetch a workspace by ID.
- `PATCH /workspaces/{id}` — update name/description. **Owner or admin only.**
- `DELETE /workspaces/{id}` — delete a workspace. **Owner or admin only.**

### Members

- `POST /workspaces/{id}/members` — add a user as a member with a given role.
  Body: `{"user_id":"<uuid>","role":"member"}`. **Owner or admin only.**
- `DELETE /workspaces/{id}/members/{userId}` — remove a member.
  **Owner or admin only.**

### Workspace calculations

- `GET /workspaces/{id}/calculations` — list all calculations associated with
  the workspace (up to 100). Calculations are associated with a workspace via
  their `WorkspaceID` field when saved.

### Ownership model

Workspace mutations (update, delete, member add/remove) require the requesting
user to be the workspace owner or an `admin`. The check is performed in
`isOwnerOrAdmin` using the workspace's `OwnerID` field.

The same ownership model applies to calculations: only the calculation's owner
or an `admin` may view, annotate, star, or delete a calculation.

---

## Example API Calls

### Register and save a token

```bash
RESP=$(curl -s -X POST http://localhost:6005/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"super-secret-123","name":"Alice"}')
TOKEN=$(echo "$RESP" | jq -r '.tokens.AccessToken')
```

### Call an authenticated endpoint

```bash
curl http://localhost:6005/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

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

### Search compounds (public)

```bash
curl "http://localhost:6005/api/v1/compounds?q=water&limit=10&offset=0"
```

### List saved calculations (authenticated, paginated)

```bash
curl "http://localhost:6005/api/v1/calculations?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Annotate a calculation

```bash
curl -X POST http://localhost:6005/api/v1/calculations/<calc-id>/annotate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"annotation":"Lab result from 2026-07-17"}'
```

### Toggle star on a calculation

```bash
curl -X POST http://localhost:6005/api/v1/calculations/<calc-id>/star \
  -H "Authorization: Bearer $TOKEN"
```

### Create a workspace and add a member

```bash
WS=$(curl -s -X POST http://localhost:6005/api/v1/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Organic Lab","description":"Shared organic synthesis calcs"}')
WS_ID=$(echo "$WS" | jq -r '.ID')

curl -X POST "http://localhost:6005/api/v1/workspaces/$WS_ID/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<other-user-uuid>","role":"member"}'
```

### Create an API key (researcher+)

```bash
curl -X POST http://localhost:6005/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"CI pipeline key"}'
```

The raw key is returned only once in the response (field `key`); store it
securely. Subsequent `GET /api-keys` responses omit the raw key value.

---

## Interactive Documentation

Once the server is running, browse to:

- **Swagger UI**: `http://localhost:6005/api/docs` — interactive UI for
  exploring and trying endpoints, powered by the served spec.
- **OpenAPI YAML**: `http://localhost:6005/api/docs/openapi.yaml` — the raw
  OpenAPI 3.1 specification, suitable for code generation and tooling.

The spec is also available as a source file at
[`api/openapi.yaml`](../api/openapi.yaml).
