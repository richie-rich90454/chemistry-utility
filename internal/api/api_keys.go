package api

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"chemistry-utility/internal/auth"
	"chemistry-utility/internal/db"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type createAPIKeyRequest struct {
	Name string `json:"name" binding:"required"`
}

type apiKeyResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Key       string    `json:"key,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// createAPIKey creates a new API key for the authenticated user.
func (a *API) createAPIKey(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == uuid.Nil {
		WriteUnauthorized(c, "invalid user context")
		return
	}

	var req createAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	rawKey := fmt.Sprintf("cu_%s", uuid.New().String())
	hash := sha256.Sum256([]byte(rawKey))
	keyHash := hex.EncodeToString(hash[:])

	apiKey := &db.APIKey{
		UserID:     userID,
		Name:       req.Name,
		KeyHash:    keyHash,
		LastUsedAt: time.Now(),
	}
	if err := a.apiKeyStore.Create(c.Request.Context(), apiKey); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusCreated, apiKeyResponse{
		ID:        apiKey.ID,
		Name:      apiKey.Name,
		Key:       rawKey,
		CreatedAt: apiKey.CreatedAt,
	})
}

// listAPIKeys returns the authenticated user's API keys.
func (a *API) listAPIKeys(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == uuid.Nil {
		WriteUnauthorized(c, "invalid user context")
		return
	}

	keys, err := a.apiKeyStore.GetByUserID(c.Request.Context(), userID)
	if err != nil {
		WriteError(c, err)
		return
	}

	var resp []apiKeyResponse
	for _, k := range keys {
		resp = append(resp, apiKeyResponse{
			ID:        k.ID,
			Name:      k.Name,
			CreatedAt: k.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"api_keys": resp,
	})
}

// deleteAPIKey deletes an API key by ID.
func (a *API) deleteAPIKey(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid api key id")
		return
	}

	if err := a.apiKeyStore.Delete(c.Request.Context(), id); err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
