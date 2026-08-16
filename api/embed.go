// Package apispec embeds the OpenAPI specification so it can be served
// by the API without reading from disk at runtime.
package apispec

import _ "embed"

// OpenAPISpec is the raw OpenAPI 3.1 YAML served at /api/docs/openapi.yaml.
//
//go:embed openapi.yaml
var OpenAPISpec []byte
