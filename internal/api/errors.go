package api

import (
	"fmt"

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

// WriteProblem writes an RFC 7807 Problem Details JSON response.
func WriteProblem(c *gin.Context, status int, title, detail string) {
	problem := ProblemDetail{
		Type:     fmt.Sprintf("https://chemistry-utility.dev/errors/%d", status),
		Title:    title,
		Status:   status,
		Detail:   detail,
		Instance: c.Request.URL.Path,
	}
	c.JSON(status, problem)
}

// WriteError writes a 500 Internal Server Error response.
func WriteError(c *gin.Context, err error) {
	WriteProblem(c, 500, "Internal Server Error", err.Error())
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
