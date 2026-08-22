package api

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
)

// ProblemDetail represents an RFC 7807 Problem Details response.
type ProblemDetail struct {
	Type     string `json:"type"`
	Title    string `json:"title"`
	Status   int    `json:"status"`
	Detail   string `json:"detail"`
	Instance string `json:"instance"`
}

// WriteProblem writes an RFC 9457 (formerly RFC 7807) Problem Details response.
func WriteProblem(c *gin.Context, status int, title, detail string) {
	problem := ProblemDetail{
		Type:     fmt.Sprintf("https://chemistry-utility.dev/errors/%d", status),
		Title:    title,
		Status:   status,
		Detail:   detail,
		Instance: c.Request.URL.Path,
	}
	c.Header("Content-Type", "application/problem+json")
	c.JSON(status, problem)
}

// WriteError writes a 500 Internal Server Error response. The full error is
// logged server-side; clients receive only a generic detail so internal
// messages (DSNs, SQL text) never leak.
func WriteError(c *gin.Context, err error) {
	log.Printf("internal error on %s %s: %v", c.Request.Method, c.Request.URL.Path, err)
	WriteProblem(c, 500, "Internal Server Error", "An unexpected error occurred. Please try again later.")
}

// WriteValidation writes a 400 Bad Request validation error response.
func WriteValidation(c *gin.Context, detail string) {
	WriteProblem(c, 400, "Bad Request", detail)
}

// WriteUnauthorized writes a 401 Unauthorized error response.
func WriteUnauthorized(c *gin.Context, detail string) {
	WriteProblem(c, 401, "Unauthorized", detail)
}

// WriteForbidden writes a 403 Forbidden error response.
func WriteForbidden(c *gin.Context, detail string) {
	WriteProblem(c, 403, "Forbidden", detail)
}

// WriteNotFound writes a 404 Not Found error response.
func WriteNotFound(c *gin.Context, detail string) {
	WriteProblem(c, 404, "Not Found", detail)
}

// WriteNotImplemented writes a 501 Not Implemented response. Used for
// features disabled on the anonymous web build, which has no database.
func WriteNotImplemented(c *gin.Context, detail string) {
	WriteProblem(c, 501, "Not Implemented", detail)
}
