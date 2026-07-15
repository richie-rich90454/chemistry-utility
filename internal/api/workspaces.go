package api

import (
	"net/http"

	"chemistry-utility/internal/auth"
	"chemistry-utility/internal/db"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type createWorkspaceRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type updateWorkspaceRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type addMemberRequest struct {
	UserID string `json:"user_id" binding:"required"`
	Role   string `json:"role" binding:"required"`
}

// createWorkspace creates a new workspace.
func (a *API) createWorkspace(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == uuid.Nil {
		WriteUnauthorized(c, "invalid user context")
		return
	}

	var req createWorkspaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	workspace := &db.Workspace{
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     userID,
	}
	if err := a.workspaceStore.Create(c.Request.Context(), workspace); err != nil {
		WriteError(c, err)
		return
	}

	member := &db.WorkspaceMember{
		WorkspaceID: workspace.ID,
		UserID:      userID,
		Role:        "owner",
	}
	_ = a.workspaceStore.AddMember(c.Request.Context(), member)

	c.JSON(http.StatusCreated, workspace)
}

// listWorkspaces returns the authenticated user's workspaces.
func (a *API) listWorkspaces(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == uuid.Nil {
		WriteUnauthorized(c, "invalid user context")
		return
	}

	workspaces, err := a.workspaceStore.GetByUserID(c.Request.Context(), userID, 100, 0)
	if err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"workspaces": workspaces,
	})
}

// getWorkspace returns a specific workspace by ID.
func (a *API) getWorkspace(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid workspace id")
		return
	}

	workspace, err := a.workspaceStore.GetByID(c.Request.Context(), id)
	if err != nil {
		WriteNotFound(c, "workspace not found")
		return
	}

	c.JSON(http.StatusOK, workspace)
}

// updateWorkspace updates a workspace's name and description.
func (a *API) updateWorkspace(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid workspace id")
		return
	}

	workspace, err := a.workspaceStore.GetByID(c.Request.Context(), id)
	if err != nil {
		WriteNotFound(c, "workspace not found")
		return
	}

	if !isOwnerOrAdmin(c, workspace.OwnerID) {
		WriteForbidden(c, "only the owner or admin can update this workspace")
		return
	}

	var req updateWorkspaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	if req.Name != "" {
		workspace.Name = req.Name
	}
	if req.Description != "" {
		workspace.Description = req.Description
	}

	if err := a.workspaceStore.Update(c.Request.Context(), workspace); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, workspace)
}

// deleteWorkspace deletes a workspace (owner only).
func (a *API) deleteWorkspace(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid workspace id")
		return
	}

	workspace, err := a.workspaceStore.GetByID(c.Request.Context(), id)
	if err != nil {
		WriteNotFound(c, "workspace not found")
		return
	}

	if !isOwnerOrAdmin(c, workspace.OwnerID) {
		WriteForbidden(c, "only the owner or admin can delete this workspace")
		return
	}

	if err := a.workspaceStore.Delete(c.Request.Context(), id); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// addWorkspaceMember adds a member to a workspace.
func (a *API) addWorkspaceMember(c *gin.Context) {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid workspace id")
		return
	}

	workspace, err := a.workspaceStore.GetByID(c.Request.Context(), workspaceID)
	if err != nil {
		WriteNotFound(c, "workspace not found")
		return
	}

	if !isOwnerOrAdmin(c, workspace.OwnerID) {
		WriteForbidden(c, "only the owner or admin can add members")
		return
	}

	var req addMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	memberUserID, err := uuid.Parse(req.UserID)
	if err != nil {
		WriteValidation(c, "invalid user id")
		return
	}

	member := &db.WorkspaceMember{
		WorkspaceID: workspaceID,
		UserID:      memberUserID,
		Role:        req.Role,
	}
	if err := a.workspaceStore.AddMember(c.Request.Context(), member); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusCreated, member)
}

// removeWorkspaceMember removes a member from a workspace.
func (a *API) removeWorkspaceMember(c *gin.Context) {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid workspace id")
		return
	}

	workspace, err := a.workspaceStore.GetByID(c.Request.Context(), workspaceID)
	if err != nil {
		WriteNotFound(c, "workspace not found")
		return
	}

	if !isOwnerOrAdmin(c, workspace.OwnerID) {
		WriteForbidden(c, "only the owner or admin can remove members")
		return
	}

	memberUserID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		WriteValidation(c, "invalid user id")
		return
	}

	if err := a.workspaceStore.RemoveMember(c.Request.Context(), workspaceID, memberUserID); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// getWorkspaceCalculations returns all calculations in a workspace.
func (a *API) getWorkspaceCalculations(c *gin.Context) {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid workspace id")
		return
	}

	calcs, err := a.calcStore.GetByWorkspaceID(c.Request.Context(), workspaceID, 100, 0)
	if err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"calculations": calcs,
	})
}
