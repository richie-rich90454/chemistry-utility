package api

import (
	"net/http"

	"chemistry-utility/internal/db"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type createPluginRequest struct {
	Name     string `json:"name" binding:"required"`
	Version  string `json:"version" binding:"required"`
	Author   string `json:"author" binding:"required"`
	Manifest string `json:"manifest"`
}

// listPlugins returns all plugins.
func (a *API) listPlugins(c *gin.Context) {
	if !a.requireDB(c) {
		return
	}
	plugins, err := a.pluginStore.List(c.Request.Context())
	if err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"plugins": plugins,
	})
}

// createPlugin creates a new plugin.
func (a *API) createPlugin(c *gin.Context) {
	if !a.requireDB(c) {
		return
	}
	var req createPluginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	plugin := &db.Plugin{
		Name:     req.Name,
		Version:  req.Version,
		Author:   req.Author,
		Manifest: req.Manifest,
		Enabled:  false,
	}
	if err := a.pluginStore.Create(c.Request.Context(), plugin); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusCreated, plugin)
}

// enablePlugin enables a plugin by ID.
func (a *API) enablePlugin(c *gin.Context) {
	if !a.requireDB(c) {
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid plugin id")
		return
	}

	if err := a.pluginStore.UpdateEnabled(c.Request.Context(), id, true); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"enabled": true})
}

// disablePlugin disables a plugin by ID.
func (a *API) disablePlugin(c *gin.Context) {
	if !a.requireDB(c) {
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid plugin id")
		return
	}

	if err := a.pluginStore.UpdateEnabled(c.Request.Context(), id, false); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"enabled": false})
}

// deletePlugin deletes a plugin by ID.
func (a *API) deletePlugin(c *gin.Context) {
	if !a.requireDB(c) {
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid plugin id")
		return
	}

	if err := a.pluginStore.Delete(c.Request.Context(), id); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
