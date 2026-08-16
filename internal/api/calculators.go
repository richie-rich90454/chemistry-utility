package api

import (
	"github.com/gin-gonic/gin"
)

// listCalculators returns all available calculator types.
func (a *API) listCalculators(c *gin.Context) {
	types := a.calcRegistry.List()
	c.JSON(200, gin.H{
		"calculators": types,
	})
}

// runCalculator executes a calculator by type with the provided inputs.
func (a *API) runCalculator(c *gin.Context) {
	calcType := c.Param("type")

	calcFn, exists := a.calcRegistry.Get(calcType)
	if !exists {
		WriteNotFound(c, "calculator type not found: "+calcType)
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		WriteValidation(c, "invalid JSON body: "+err.Error())
		return
	}

	result, err := calcFn(c.Request.Context(), input)
	if err != nil {
		WriteValidation(c, "calculation error: "+err.Error())
		return
	}

	c.JSON(200, result)
}
