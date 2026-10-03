package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
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

// pointLookupAtMock redirects the PubChem upstream at a test server and
// disables the rate-limiter delay. It returns a restore function.
func pointLookupAtMock(t *testing.T, handler http.Handler) func() {
	t.Helper()
	oldBase, oldInterval := pubchemBaseURL, lookupRateInterval
	server := httptest.NewServer(handler)
	pubchemBaseURL = server.URL
	lookupRateInterval = 0
	return func() {
		server.Close()
		pubchemBaseURL = oldBase
		lookupRateInterval = oldInterval
	}
}

// lookupMockHandler serves canned PUG-REST responses for the two-step flow.
func lookupMockHandler(t *testing.T, cidsStatus int, cidsBody string, propStatus int, propBody string) http.Handler {
	t.Helper()
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case strings.HasSuffix(r.URL.Path, "/cids/JSON"):
			w.WriteHeader(cidsStatus)
			_, _ = w.Write([]byte(cidsBody))
		case strings.Contains(r.URL.Path, "/property/"):
			w.WriteHeader(propStatus)
			_, _ = w.Write([]byte(propBody))
		default:
			t.Errorf("unexpected upstream path: %s", r.URL.Path)
			http.NotFound(w, r)
		}
	})
}

const lookupWaterCIDs = `{"IdentifierList":{"CID":[962]}}`

const lookupWaterProps = `{"PropertyTable":{"Properties":[{"CID":962,"IUPACName":"water","MolecularFormula":"H2O","MolecularWeight":18.015,"IsomericSMILES":"O","InChI":"InChI=1S/H2O/h1H2"}]}}`

// TestLookupCompoundsSuccess tests the stateless lookup against a mock
// PubChem server. newTestAPI has a nil DB, proving no database is needed.
func TestLookupCompoundsSuccess(t *testing.T) {
	restore := pointLookupAtMock(t, lookupMockHandler(t, http.StatusOK, lookupWaterCIDs, http.StatusOK, lookupWaterProps))
	defer restore()

	a := newTestAPI()
	router := a.Router()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/compounds/lookup?q=water&type=name", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var result struct {
		Compounds []map[string]interface{} `json:"compounds"`
		Query     string                   `json:"query"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if result.Query != "water" {
		t.Errorf("expected query 'water', got '%s'", result.Query)
	}
	if len(result.Compounds) != 1 {
		t.Fatalf("expected 1 compound, got %d", len(result.Compounds))
	}
	got := result.Compounds[0]
	if got["ID"] != "pubchem:962" {
		t.Errorf("expected ID 'pubchem:962', got '%v'", got["ID"])
	}
	if got["Name"] != "water" {
		t.Errorf("expected Name 'water', got '%v'", got["Name"])
	}
	if got["Formula"] != "H2O" {
		t.Errorf("expected Formula 'H2O', got '%v'", got["Formula"])
	}
	if got["Source"] != "pubchem" {
		t.Errorf("expected Source 'pubchem', got '%v'", got["Source"])
	}
}

// TestLookupCompoundsEmpty tests that a PubChem 404 becomes a 200 with an
// empty compound list rather than an error.
func TestLookupCompoundsEmpty(t *testing.T) {
	restore := pointLookupAtMock(t, lookupMockHandler(t, http.StatusNotFound, `{"Status":{"Code":404}}`, http.StatusOK, `{}`))
	defer restore()

	a := newTestAPI()
	router := a.Router()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/compounds/lookup?q=zzz-not-a-compound", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var result struct {
		Compounds []map[string]interface{} `json:"compounds"`
		Query     string                   `json:"query"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if len(result.Compounds) != 0 {
		t.Errorf("expected 0 compounds, got %d", len(result.Compounds))
	}
}

// TestLookupCompoundsMissingQuery tests that a missing q returns 400.
func TestLookupCompoundsMissingQuery(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/compounds/lookup", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

// TestLookupCompoundsInvalidType tests that an unknown type returns 400.
func TestLookupCompoundsInvalidType(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/compounds/lookup?q=water&type=bogus", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

// TestLookupCompoundsUpstreamRateLimit tests that a PubChem 429 is relayed
// as a 429 instead of collapsing into a generic 500.
func TestLookupCompoundsUpstreamRateLimit(t *testing.T) {
	restore := pointLookupAtMock(t, lookupMockHandler(t, http.StatusTooManyRequests, `{"Status":{"Code":429}}`, http.StatusOK, `{}`))
	defer restore()

	a := newTestAPI()
	router := a.Router()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/compounds/lookup?q=water", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Errorf("expected status 429, got %d: %s", w.Code, w.Body.String())
	}
}

// TestDBSearchRequiresDatabase documents the contrast with the stateless
// lookup: the DB-backed search still 501s when no database is configured.
func TestDBSearchRequiresDatabase(t *testing.T) {
	a := newTestAPI()
	router := a.Router()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/compounds?q=water", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotImplemented {
		t.Errorf("expected status 501, got %d", w.Code)
	}
}
