package api

import (
	"net/http"

	"chemistry-utility/internal/auth"
	"chemistry-utility/internal/db"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type updateUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email" binding:"omitempty,email"`
}

// getCurrentUser returns the authenticated user's profile.
func (a *API) getCurrentUser(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == uuid.Nil {
		WriteUnauthorized(c, "invalid user context")
		return
	}

	user, err := a.userStore.GetByID(c.Request.Context(), userID)
	if err != nil {
		WriteNotFound(c, "user not found")
		return
	}

	c.JSON(http.StatusOK, auth.ToPublicUser(*user))
}

// updateCurrentUser updates the authenticated user's profile.
func (a *API) updateCurrentUser(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == uuid.Nil {
		WriteUnauthorized(c, "invalid user context")
		return
	}

	var req updateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	user, err := a.userStore.GetByID(c.Request.Context(), userID)
	if err != nil {
		WriteNotFound(c, "user not found")
		return
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Email != "" {
		user.Email = req.Email
	}

	if err := a.userStore.Update(c.Request.Context(), user); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, auth.ToPublicUser(*user))
}

// Helper: check ownership or admin role
func isOwnerOrAdmin(c *gin.Context, ownerID uuid.UUID) bool {
	userID := auth.GetUserID(c)
	role := auth.GetUserRole(c)
	return userID == ownerID || role == "admin"
}

// Helper: check if user has at least the given role level
func hasRoleLevel(role string, minRole string) bool {
	levels := map[string]int{
		"student":   1,
		"researcher": 2,
		"educator":  3,
		"admin":     4,
	}
	return levels[role] >= levels[minRole]
}

// Helper: get user from context, returning error response if not found
func (a *API) getAuthUser(c *gin.Context) (*db.User, bool) {
	userID := auth.GetUserID(c)
	if userID == uuid.Nil {
		WriteUnauthorized(c, "invalid user context")
		return nil, false
	}
	user, err := a.userStore.GetByID(c.Request.Context(), userID)
	if err != nil {
		WriteNotFound(c, "user not found")
		return nil, false
	}
	return user, true
}
