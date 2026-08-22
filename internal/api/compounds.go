package api

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// searchCompounds searches compounds by query string.
func (a *API) searchCompounds(c *gin.Context) {
	if !a.requireDB(c) {
		return
	}
	q := c.Query("q")
	if q == "" {
		WriteValidation(c, "missing search query parameter 'q'")
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit < 1 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	// Optional search-type filter: name, formula, cas, or smiles.
	field := c.Query("type")

	compounds, err := a.compoundStore.Search(c.Request.Context(), q, field, limit, offset)
	if err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"compounds": compounds,
		"query":     q,
	})
}

// getCompound returns a compound by ID.
func (a *API) getCompound(c *gin.Context) {
	if !a.requireDB(c) {
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid compound id")
		return
	}

	compound, err := a.compoundStore.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			WriteNotFound(c, "compound not found")
			return
		}
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, compound)
}
