package api

import (
	"net/http"

	apispec "chemistry-utility/api"

	"github.com/gin-gonic/gin"
)

// swaggerUIHTML is the HTML page that loads Swagger UI from the CDN and
// points it at the locally served openapi.yaml spec. Keeping it inline
// avoids an extra static-file dependency.
const swaggerUIHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chemistry Utility API - Swagger UI</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
    <script>
        window.onload = function() {
            window.ui = SwaggerUIBundle({
                url: './openapi.yaml',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
                plugins: [SwaggerUIBundle.plugins.DownloadUrl],
                layout: 'StandaloneLayout',
                docExpansion: 'list',
                filter: true,
                showExtensions: true,
                showCommonExtensions: true
            });
        };
    </script>
</body>
</html>`

// ServeDocs returns an HTML page hosting Swagger UI, which loads the
// OpenAPI spec served at /api/docs/openapi.yaml.
func ServeDocs(c *gin.Context) {
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(swaggerUIHTML))
}

// ServeSpec returns the embedded OpenAPI 3.1 YAML specification.
func ServeSpec(c *gin.Context) {
	c.Data(http.StatusOK, "application/yaml", apispec.OpenAPISpec)
}
