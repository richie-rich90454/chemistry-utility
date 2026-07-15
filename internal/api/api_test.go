package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"chemistry-utility/internal/auth"
	"chemistry-utility/internal/calculators"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// newTestAPI creates an API instance for testing without a real database.
// Since we can't open a real DB in unit tests, we test the router setup
// and handler wiring. Integration tests requiring a DB should use testcontainers.
func newTestAPI() *API {
	cfg := Config{
		JWTSecret:          "test-secret-key-for-testing-only",
		RateLimitPerMinute: 100,
		CORSAllowedOrigins: []string{"*"},
	}
	jwtCfg := auth.DefaultJWTConfig(cfg.JWTSecret)
	calcRegistry := calculators.NewRegistry()

	return &API{
		cfg:          cfg,
		jwtCfg:       jwtCfg,
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

// TestProtectedEndpointWithoutAuth tests that protected endpoints return 401 without auth.
func TestProtectedEndpointWithoutAuth(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/users/me", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", w.Code)
	}
}

// TestCalculationsEndpointWithoutAuth tests that calculation history requires auth.
func TestCalculationsEndpointWithoutAuth(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/calculations", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", w.Code)
	}
}

// TestRBACRestriction tests that a student role cannot access admin endpoints.
func TestRBACRestriction(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	// Generate a token with student role
	userID := uuid.New()
	tokens, err := auth.GenerateTokenPair(userID, "student", a.jwtCfg)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	// Try to access admin-only analytics endpoint
	req := httptest.NewRequest(http.MethodGet, "/api/v1/analytics/overview", nil)
	req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected status 403, got %d", w.Code)
	}

	// Try to access admin-only plugins endpoint
	req = httptest.NewRequest(http.MethodGet, "/api/v1/plugins", nil)
	req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)
	w = httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected status 403 for plugins, got %d", w.Code)
	}
}

// TestAdminCanAccessAdminEndpoints tests that admin role can access admin endpoints.
func TestAdminCanAccessAdminEndpoints(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	userID := uuid.New()
	tokens, err := auth.GenerateTokenPair(userID, "admin", a.jwtCfg)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	// Note: this will fail at the DB layer since we have no real DB,
	// but it should not return 403 (forbidden) - it should get past RBAC.
	req := httptest.NewRequest(http.MethodGet, "/api/v1/analytics/overview", nil)
	req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// Should not be 403 (forbidden) - could be 500 due to no DB
	if w.Code == http.StatusForbidden {
		t.Error("admin should not be forbidden from analytics endpoint")
	}
}

// TestAPIKeyEndpointStudentForbidden tests that student role cannot access API key endpoints.
func TestAPIKeyEndpointStudentForbidden(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	userID := uuid.New()
	tokens, err := auth.GenerateTokenPair(userID, "student", a.jwtCfg)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/api-keys", nil)
	req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected status 403, got %d", w.Code)
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
