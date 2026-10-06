package api

import (
	"context"
	"net/http"
	"time"

	"chemistry-utility/internal/calculators"

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

	// Bound request body to 1 MiB to cap slice allocation (deltaHValues,
	// SProducts, ...) and equation-string length reaching the balancer.
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20)
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		WriteValidation(c, "invalid JSON body: "+err.Error())
		return
	}
	if input == nil {
		input = map[string]interface{}{}
	}

	// Bound calculator execution: calculators generally ignore
	// cancellation, so run in a goroutine and select on a ~10s timeout. A
	// hung calculator reports 503 instead of holding the request (and its
	// rate-limit slot) open indefinitely.
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()
	type outcome struct {
		result calculators.CalculationResult
		err    error
	}
	ch := make(chan outcome, 1)
	go func() {
		res, err := calcFn(ctx, input)
		ch <- outcome{res, err}
	}()
	select {
	case <-ctx.Done():
		if c.Request.Context().Err() != nil {
			// Client went away; nothing to write back to.
			return
		}
		WriteProblem(c, http.StatusServiceUnavailable, "Service Unavailable", "calculation timed out; please retry with smaller inputs")
		return
	case o := <-ch:
		if o.err != nil {
			WriteValidation(c, "calculation error: "+o.err.Error())
			return
		}
		c.JSON(200, o.result)
		return
	}
}
