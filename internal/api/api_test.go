package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"chemistry-utility/internal/calculators"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// newTestAPI creates an API instance for testing without a real database.
// Since we can't open a real DB in unit tests, we test the router setup
// and handler wiring. Integration tests requiring a DB should use testcontainers.
func newTestAPI() *API {
	cfg := Config{
		RateLimitPerMinute: 100,
		CORSAllowedOrigins: []string{"*"},
	}
	calcRegistry := calculators.NewRegistry()

	return &API{
		cfg:          cfg,
		calcRegistry: calcRegistry,
	}
}

// TestCalculatorEndpoint tests the molar mass calculator endpoint.
func TestCalculatorEndpoint(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	body, _ := json.Marshal(map[string]interface{}{
		"formula": "H2O",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculators/molar-mass", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if _, ok := result["Value"]; !ok {
		t.Error("response missing 'Value' field")
	}
}

// TestListCalculators tests the calculator listing endpoint.
func TestListCalculators(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/calculators", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	calcs, ok := result["calculators"]
	if !ok {
		t.Error("response missing 'calculators' field")
	}
	calcsList, ok := calcs.([]interface{})
	if !ok || len(calcsList) == 0 {
		t.Error("expected non-empty calculators list")
	}
}

// TestCalculatorNotFound tests requesting a non-existent calculator type.
func TestCalculatorNotFound(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	body, _ := json.Marshal(map[string]interface{}{})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculators/nonexistent", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", w.Code)
	}
}

// TestCORSHeaders tests that CORS headers are set correctly.
func TestCORSHeaders(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	req := httptest.NewRequest(http.MethodOptions, "/api/v1/calculators", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	allowOrigin := w.Header().Get("Access-Control-Allow-Origin")
	if allowOrigin != "*" {
		t.Errorf("expected Access-Control-Allow-Origin '*', got '%s'", allowOrigin)
	}
}

// TestInvalidCalculatorInput tests that invalid JSON body returns 400.
func TestInvalidCalculatorInput(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculators/molar-mass", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}
