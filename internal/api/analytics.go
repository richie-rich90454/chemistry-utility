package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// analyticsOverview returns platform overview statistics.
func (a *API) analyticsOverview(c *gin.Context) {
	stats, err := a.analyticsStore.GetOverview(c.Request.Context())
	if err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"overview": stats,
	})
}

// analyticsUsage returns usage metrics including DAU.
func (a *API) analyticsUsage(c *gin.Context) {
	dau, err := a.analyticsStore.GetDAU(c.Request.Context(), time.Now())
	if err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"dau": dau,
	})
}
