package api

import (
	"net/http"
	"strconv"

	"chemistry-utility/internal/auth"
	"chemistry-utility/internal/db"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type annotateRequest struct {
	Annotation string `json:"annotation" binding:"required"`
}

// listCalculations returns the authenticated user's calculations with pagination.
func (a *API) listCalculations(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == uuid.Nil {
		WriteUnauthorized(c, "invalid user context")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	calcs, err := a.calcStore.GetByUserID(c.Request.Context(), userID, limit, offset)
	if err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"calculations": calcs,
		"page":         page,
		"limit":        limit,
	})
}

// getCalculation returns a specific calculation by ID.
func (a *API) getCalculation(c *gin.Context) {
	userID := auth.GetUserID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid calculation id")
		return
	}

	calc, err := a.calcStore.GetByID(c.Request.Context(), id)
	if err != nil {
		WriteNotFound(c, "calculation not found")
		return
	}

	if calc.UserID != userID && !isOwnerOrAdmin(c, calc.UserID) {
		WriteForbidden(c, "not authorized to view this calculation")
		return
	}

	c.JSON(http.StatusOK, calc)
}

// annotateCalculation adds an annotation to a calculation.
func (a *API) annotateCalculation(c *gin.Context) {
	userID := auth.GetUserID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid calculation id")
		return
	}

	calc, err := a.calcStore.GetByID(c.Request.Context(), id)
	if err != nil {
		WriteNotFound(c, "calculation not found")
		return
	}

	if calc.UserID != userID && !isOwnerOrAdmin(c, calc.UserID) {
		WriteForbidden(c, "not authorized to annotate this calculation")
		return
	}

	var req annotateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	if err := a.calcStore.UpdateAnnotation(c.Request.Context(), id, req.Annotation); err != nil {
		WriteError(c, err)
		return
	}

	calc.Annotation = req.Annotation
	c.JSON(http.StatusOK, calc)
}

// starCalculation toggles the star status on a calculation.
func (a *API) starCalculation(c *gin.Context) {
	userID := auth.GetUserID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid calculation id")
		return
	}

	calc, err := a.calcStore.GetByID(c.Request.Context(), id)
	if err != nil {
		WriteNotFound(c, "calculation not found")
		return
	}

	if calc.UserID != userID && !isOwnerOrAdmin(c, calc.UserID) {
		WriteForbidden(c, "not authorized to star this calculation")
		return
	}

	starred, err := a.calcStore.ToggleStar(c.Request.Context(), id)
	if err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"starred": starred})
}

// deleteCalculation deletes a calculation by ID.
func (a *API) deleteCalculation(c *gin.Context) {
	userID := auth.GetUserID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid calculation id")
		return
	}

	calc, err := a.calcStore.GetByID(c.Request.Context(), id)
	if err != nil {
		WriteNotFound(c, "calculation not found")
		return
	}

	if calc.UserID != userID && !isOwnerOrAdmin(c, calc.UserID) {
		WriteForbidden(c, "not authorized to delete this calculation")
		return
	}

	if err := a.calcStore.Delete(c.Request.Context(), id); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// saveCalculation persists a calculation result for the authenticated user.
func (a *API) saveCalculation(userID uuid.UUID, calcType string, inputs string, result string, workspaceID uuid.UUID) error {
	calc := &db.Calculation{
		UserID:         userID,
		CalculatorType: calcType,
		Inputs:         inputs,
		Result:         result,
		WorkspaceID:    workspaceID,
	}
	return a.calcStore.Create(nil, calc)
}
