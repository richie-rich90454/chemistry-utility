package api

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"
	"unsafe"

	"chemistry-utility/internal/calculators"
	dbstore "chemistry-utility/internal/db"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const coverageSchemaCompounds = `CREATE TABLE compounds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    formula TEXT NOT NULL,
    cas_number TEXT NOT NULL DEFAULT '',
    smiles TEXT NOT NULL DEFAULT '',
    inchi TEXT NOT NULL DEFAULT '',
    molar_mass REAL NOT NULL DEFAULT 0,
    properties TEXT NOT NULL DEFAULT '{}',
    source TEXT NOT NULL DEFAULT 'manual',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`

const coverageSchemaPlugins = `CREATE TABLE plugins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL DEFAULT '1.0.0',
    author TEXT NOT NULL DEFAULT '',
    manifest TEXT NOT NULL DEFAULT '{}',
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`

// newSQLiteAPI opens a file-backed sqlite database with the minimal schema
// the stores need, and builds an API through New (also covering its defaults).
func newSQLiteAPI(t *testing.T) (*API, *sql.DB) {
	t.Helper()
	sqlDB, err := sql.Open("sqlite3", filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = sqlDB.Close() })
	if _, err := sqlDB.Exec(coverageSchemaCompounds); err != nil {
		t.Fatal(err)
	}
	if _, err := sqlDB.Exec(coverageSchemaPlugins); err != nil {
		t.Fatal(err)
	}
	return New(sqlDB, "sqlite3", Config{}), sqlDB
}

// newClosedDBAPI returns an API whose database is already closed, so every
// store call fails and handlers take their WriteError paths. It uses an
// explicit config to exercise New with non-default values.
func newClosedDBAPI(t *testing.T) *API {
	t.Helper()
	sqlDB, err := sql.Open("sqlite3", filepath.Join(t.TempDir(), "closed.db"))
	if err != nil {
		t.Fatal(err)
	}
	_ = sqlDB.Close()
	return New(sqlDB, "sqlite3", Config{
		RateLimitPerMinute: 1000,
		CORSAllowedOrigins: []string{"https://example.com"},
	})
}

func seedCompound(t *testing.T, a *API, name, formula string) uuid.UUID {
	t.Helper()
	c := &dbstore.Compound{
		Name: name, Formula: formula, CASNumber: "64-17-5",
		SMILES: "CCO", InChI: "InChI=1S/C2H6O", MolarMass: 46.07,
		Properties: "{}", Source: "manual",
	}
	if err := a.compoundStore.Create(context.Background(), c); err != nil {
		t.Fatal(err)
	}
	return c.ID
}

func doRequest(router *gin.Engine, method, target string, body []byte, contentType string) *httptest.ResponseRecorder {
	var reader *bytes.Reader
	if body == nil {
		reader = bytes.NewReader(nil)
	} else {
		reader = bytes.NewReader(body)
	}
	req := httptest.NewRequest(method, target, reader)
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

func TestNewAppliesDefaults(t *testing.T) {
	a := New(nil, "sqlite3", Config{})
	if a.cfg.RateLimitPerMinute != 100 {
		t.Errorf("default rate limit = %d, want 100", a.cfg.RateLimitPerMinute)
	}
	if len(a.cfg.CORSAllowedOrigins) != 1 || a.cfg.CORSAllowedOrigins[0] != "*" {
		t.Errorf("default CORS origins = %v, want [*]", a.cfg.CORSAllowedOrigins)
	}
	if a.compoundStore == nil || a.pluginStore == nil || a.calcRegistry == nil {
		t.Error("New must initialize all stores and the calculator registry")
	}

	explicit := New(nil, "sqlite3", Config{RateLimitPerMinute: 7, CORSAllowedOrigins: []string{"https://x.example"}})
	if explicit.cfg.RateLimitPerMinute != 7 {
		t.Errorf("explicit rate limit = %d, want 7", explicit.cfg.RateLimitPerMinute)
	}
	if len(explicit.cfg.CORSAllowedOrigins) != 1 {
		t.Errorf("explicit CORS origins overwritten: %v", explicit.cfg.CORSAllowedOrigins)
	}
}

func TestCORSSpecificOrigins(t *testing.T) {
	a := New(nil, "", Config{RateLimitPerMinute: 100, CORSAllowedOrigins: []string{"https://example.com"}})
	router := a.Router()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/calculators", nil)
	req.Header.Set("Origin", "https://example.com")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "https://example.com" {
		t.Errorf("matched origin header = %q, want echo", got)
	}
	if got := w.Header().Get("Vary"); got != "Origin" {
		t.Errorf("Vary = %q, want Origin", got)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/calculators", nil)
	req2.Header.Set("Origin", "https://evil.example")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	if got := w2.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("unlisted origin header = %q, want empty", got)
	}

	req3 := httptest.NewRequest(http.MethodOptions, "/api/v1/calculators", nil)
	req3.Header.Set("Origin", "https://example.com")
	w3 := httptest.NewRecorder()
	router.ServeHTTP(w3, req3)
	if w3.Code != http.StatusNoContent {
		t.Errorf("preflight status = %d, want 204", w3.Code)
	}
	if got := w3.Header().Get("Access-Control-Allow-Origin"); got != "https://example.com" {
		t.Errorf("preflight origin header = %q, want echo", got)
	}
}

// TestRateLimitSweepPrunesExpiredEntries covers the once-per-minute prune
// loop. lastSweep is a closure variable set at middleware creation, so the
// only way to reach the sweep is a real wall-clock wait past one minute.
func TestRateLimitSweepPrunesExpiredEntries(t *testing.T) {
	a := newTestAPI()
	r := gin.New()
	r.Use(a.RateLimitMiddleware(1))
	r.GET("/ping", func(c *gin.Context) { c.String(http.StatusOK, "pong") })

	serve := func() int {
		req := httptest.NewRequest(http.MethodGet, "/ping", nil)
		req.RemoteAddr = "192.0.2.99:1234"
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w.Code
	}
	if code := serve(); code != http.StatusOK {
		t.Fatalf("first request status = %d, want 200", code)
	}
	time.Sleep(61 * time.Second)
	if code := serve(); code != http.StatusOK {
		t.Errorf("post-window request status = %d, want 200 with a fresh window", code)
	}
}

func TestRateLimitDefaultAndIncrement(t *testing.T) {
	a := newTestAPI()
	r := gin.New()
	r.Use(a.RateLimitMiddleware(0))
	r.GET("/ping", func(c *gin.Context) { c.String(http.StatusOK, "pong") })
	for i := 0; i < 3; i++ {
		req := httptest.NewRequest(http.MethodGet, "/ping", nil)
		req.RemoteAddr = "192.0.2.44:1234"
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("request %d status = %d, want 200", i, w.Code)
		}
	}
}

func TestWriteErrorHelpers(t *testing.T) {
	cases := []struct {
		name   string
		fn     func(c *gin.Context, detail string)
		status int
	}{
		{"unauthorized", WriteUnauthorized, http.StatusUnauthorized},
		{"forbidden", WriteForbidden, http.StatusForbidden},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/plugins", nil)
			tc.fn(c, "test detail")
			if w.Code != tc.status {
				t.Errorf("status = %d, want %d", w.Code, tc.status)
			}
		})
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/plugins", nil)
	WriteError(c, errors.New("boom"))
	if w.Code != http.StatusInternalServerError {
		t.Errorf("WriteError status = %d, want 500", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/problem+json" {
		t.Errorf("WriteError Content-Type = %q", ct)
	}
	if strings.Contains(w.Body.String(), "boom") {
		t.Error("WriteError must not leak the internal error message")
	}
}

func TestWaitLookupRateSleeps(t *testing.T) {
	old := lookupRateInterval
	lookupRateInterval = 25 * time.Millisecond
	defer func() { lookupRateInterval = old }()

	waitLookupRate()
	start := time.Now()
	waitLookupRate()
	if elapsed := time.Since(start); elapsed < 10*time.Millisecond {
		t.Errorf("second waitLookupRate took %v, want a ~25ms throttle sleep", elapsed)
	}
}

func TestLookupNamespaceBranches(t *testing.T) {
	cases := []struct {
		in        string
		namespace string
		isCAS     bool
		ok        bool
	}{
		{"", "name", false, true},
		{"name", "name", false, true},
		{"formula", "formula", false, true},
		{"smiles", "smiles", false, true},
		{"cas", "xref", true, true},
		{"bogus", "", false, false},
	}
	for _, tc := range cases {
		ns, isCAS, ok := lookupNamespace(tc.in)
		if ns != tc.namespace || isCAS != tc.isCAS || ok != tc.ok {
			t.Errorf("lookupNamespace(%q) = (%q,%v,%v), want (%q,%v,%v)",
				tc.in, ns, isCAS, ok, tc.namespace, tc.isCAS, tc.ok)
		}
	}
}

func TestSearchCompoundsSuccess(t *testing.T) {
	a, _ := newSQLiteAPI(t)
	seedCompound(t, a, "Ethanol", "C2H6O")
	seedCompound(t, a, "Water", "H2O")
	router := a.Router()

	w := doRequest(router, http.MethodGet, "/api/v1/compounds?q=water", nil, "")
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", w.Code, w.Body.String())
	}
	var result struct {
		Compounds []map[string]interface{} `json:"compounds"`
		Query     string                   `json:"query"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if result.Query != "water" || len(result.Compounds) != 1 {
		t.Errorf("query=%q compounds=%d, want water/1", result.Query, len(result.Compounds))
	}
}

func TestSearchCompoundsClampsAndField(t *testing.T) {
	a, _ := newSQLiteAPI(t)
	seedCompound(t, a, "Ethanol", "C2H6O")
	router := a.Router()

	for _, target := range []string{
		"/api/v1/compounds?q=etha&limit=999&offset=-5",
		"/api/v1/compounds?q=etha&limit=abc",
		"/api/v1/compounds?q=C2H6O&type=formula",
		"/api/v1/compounds?q=etha&type=bogus-field-falls-back-to-all",
	} {
		w := doRequest(router, http.MethodGet, target, nil, "")
		if w.Code != http.StatusOK {
			t.Errorf("GET %s status = %d, body = %s", target, w.Code, w.Body.String())
		}
	}
}

func TestSearchCompoundsMissingQuery(t *testing.T) {
	a, _ := newSQLiteAPI(t)
	router := a.Router()
	w := doRequest(router, http.MethodGet, "/api/v1/compounds", nil, "")
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestSearchCompoundsStoreError(t *testing.T) {
	router := newClosedDBAPI(t).Router()
	w := doRequest(router, http.MethodGet, "/api/v1/compounds?q=water", nil, "")
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500", w.Code)
	}
}

func TestGetCompoundSuccess(t *testing.T) {
	a, _ := newSQLiteAPI(t)
	id := seedCompound(t, a, "Ethanol", "C2H6O")
	router := a.Router()

	w := doRequest(router, http.MethodGet, "/api/v1/compounds/"+id.String(), nil, "")
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", w.Code, w.Body.String())
	}
	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if result["Name"] != "Ethanol" {
		t.Errorf("Name = %v, want Ethanol", result["Name"])
	}
}

func TestGetCompoundInvalidID(t *testing.T) {
	a, _ := newSQLiteAPI(t)
	router := a.Router()
	w := doRequest(router, http.MethodGet, "/api/v1/compounds/not-a-uuid", nil, "")
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestGetCompoundNotFound(t *testing.T) {
	a, _ := newSQLiteAPI(t)
	router := a.Router()
	w := doRequest(router, http.MethodGet, "/api/v1/compounds/"+uuid.NewString(), nil, "")
	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", w.Code)
	}
}

func TestGetCompoundStoreError(t *testing.T) {
	router := newClosedDBAPI(t).Router()
	w := doRequest(router, http.MethodGet, "/api/v1/compounds/"+uuid.NewString(), nil, "")
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500", w.Code)
	}
}

func TestGetCompoundRequiresDatabase(t *testing.T) {
	router := newTestAPI().Router()
	w := doRequest(router, http.MethodGet, "/api/v1/compounds/"+uuid.NewString(), nil, "")
	if w.Code != http.StatusNotImplemented {
		t.Errorf("status = %d, want 501", w.Code)
	}
}

func createPluginViaAPI(t *testing.T, router *gin.Engine, name string) (int, map[string]interface{}) {
	t.Helper()
	body, _ := json.Marshal(map[string]string{
		"name": name, "version": "1.0.0", "author": "tester", "manifest": "{}",
	})
	w := doRequest(router, http.MethodPost, "/api/v1/plugins", body, "application/json")
	var parsed map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &parsed)
	return w.Code, parsed
}

func TestPluginListAndCreate(t *testing.T) {
	a, _ := newSQLiteAPI(t)
	router := a.Router()

	w := doRequest(router, http.MethodGet, "/api/v1/plugins", nil, "")
	if w.Code != http.StatusOK {
		t.Fatalf("list status = %d", w.Code)
	}

	code, parsed := createPluginViaAPI(t, router, "acme-calcs")
	if code != http.StatusCreated {
		t.Fatalf("create status = %d, body = %v", code, parsed)
	}
	if parsed["Name"] != "acme-calcs" {
		t.Errorf("created Name = %v", parsed["Name"])
	}
	id, _ := parsed["ID"].(string)
	if id == "" {
		t.Fatal("created plugin missing ID")
	}

	w2 := doRequest(router, http.MethodGet, "/api/v1/plugins", nil, "")
	var listed struct {
		Plugins []map[string]interface{} `json:"plugins"`
	}
	if err := json.Unmarshal(w2.Body.Bytes(), &listed); err != nil {
		t.Fatal(err)
	}
	if len(listed.Plugins) != 1 {
		t.Errorf("listed %d plugins, want 1", len(listed.Plugins))
	}
}

func TestPluginCreateInvalidBody(t *testing.T) {
	a, _ := newSQLiteAPI(t)
	router := a.Router()
	w := doRequest(router, http.MethodPost, "/api/v1/plugins", []byte(`{"name":1}`), "application/json")
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestPluginCreateDuplicate(t *testing.T) {
	a, _ := newSQLiteAPI(t)
	router := a.Router()
	if code, _ := createPluginViaAPI(t, router, "dup"); code != http.StatusCreated {
		t.Fatalf("first create status = %d", code)
	}
	w := doRequest(router, http.MethodPost, "/api/v1/plugins",
		[]byte(`{"name":"dup","version":"1.0.0","author":"t"}`), "application/json")
	if w.Code != http.StatusInternalServerError {
		t.Errorf("duplicate create status = %d, want 500", w.Code)
	}
}

func TestPluginListStoreError(t *testing.T) {
	router := newClosedDBAPI(t).Router()
	w := doRequest(router, http.MethodGet, "/api/v1/plugins", nil, "")
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500", w.Code)
	}
}

func TestPluginCreateStoreError(t *testing.T) {
	router := newClosedDBAPI(t).Router()
	w := doRequest(router, http.MethodPost, "/api/v1/plugins",
		[]byte(`{"name":"x","version":"1.0.0","author":"t"}`), "application/json")
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500", w.Code)
	}
}

func TestPluginEnableDisableDelete(t *testing.T) {
	a, _ := newSQLiteAPI(t)
	router := a.Router()
	_, parsed := createPluginViaAPI(t, router, "toggle-me")
	id, _ := parsed["ID"].(string)
	if id == "" {
		t.Fatal("created plugin missing ID")
	}

	w := doRequest(router, http.MethodPatch, "/api/v1/plugins/"+id+"/enable", nil, "")
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), "true") {
		t.Errorf("enable status = %d, body = %s", w.Code, w.Body.String())
	}
	w = doRequest(router, http.MethodPatch, "/api/v1/plugins/"+id+"/disable", nil, "")
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), "false") {
		t.Errorf("disable status = %d, body = %s", w.Code, w.Body.String())
	}
	w = doRequest(router, http.MethodDelete, "/api/v1/plugins/"+id, nil, "")
	if w.Code != http.StatusNoContent {
		t.Errorf("delete status = %d, want 204", w.Code)
	}
}

func TestPluginEnableDisableDeleteInvalidID(t *testing.T) {
	a, _ := newSQLiteAPI(t)
	router := a.Router()
	for _, target := range []struct{ method, path string }{
		{http.MethodPatch, "/api/v1/plugins/nope/enable"},
		{http.MethodPatch, "/api/v1/plugins/nope/disable"},
		{http.MethodDelete, "/api/v1/plugins/nope"},
	} {
		w := doRequest(router, target.method, target.path, nil, "")
		if w.Code != http.StatusBadRequest {
			t.Errorf("%s %s status = %d, want 400", target.method, target.path, w.Code)
		}
	}
}

func TestPluginEnableDisableDeleteStoreError(t *testing.T) {
	router := newClosedDBAPI(t).Router()
	id := uuid.NewString()
	for _, target := range []struct{ method, path string }{
		{http.MethodPatch, "/api/v1/plugins/" + id + "/enable"},
		{http.MethodPatch, "/api/v1/plugins/" + id + "/disable"},
		{http.MethodDelete, "/api/v1/plugins/" + id},
	} {
		w := doRequest(router, target.method, target.path, nil, "")
		if w.Code != http.StatusInternalServerError {
			t.Errorf("%s %s status = %d, want 500", target.method, target.path, w.Code)
		}
	}
}

func TestPluginRoutesRequireDatabase(t *testing.T) {
	router := newTestAPI().Router()
	id := uuid.NewString()
	cases := []struct{ method, path string }{
		{http.MethodGet, "/api/v1/plugins"},
		{http.MethodPost, "/api/v1/plugins"},
		{http.MethodPatch, "/api/v1/plugins/" + id + "/enable"},
		{http.MethodPatch, "/api/v1/plugins/" + id + "/disable"},
		{http.MethodDelete, "/api/v1/plugins/" + id},
	}
	for _, tc := range cases {
		var body []byte
		if tc.method == http.MethodPost {
			body = []byte(`{"name":"x","version":"1.0.0","author":"t"}`)
		}
		w := doRequest(router, tc.method, tc.path, body, "application/json")
		if w.Code != http.StatusNotImplemented {
			t.Errorf("%s %s status = %d, want 501", tc.method, tc.path, w.Code)
		}
	}
}

func TestLookupCompoundsLimitClamp(t *testing.T) {
	restore := pointLookupAtMock(t, lookupMockHandler(t, http.StatusOK, lookupWaterCIDs, http.StatusOK, lookupWaterProps))
	defer restore()

	router := newTestAPI().Router()
	for _, target := range []string{
		"/api/v1/compounds/lookup?q=water&limit=0",
		"/api/v1/compounds/lookup?q=water&limit=999",
	} {
		w := doRequest(router, http.MethodGet, target, nil, "")
		if w.Code != http.StatusOK {
			t.Errorf("GET %s status = %d, body = %s", target, w.Code, w.Body.String())
		}
	}
}

func TestLookupCompoundsUpstreamError(t *testing.T) {
	restore := pointLookupAtMock(t, lookupMockHandler(t, http.StatusInternalServerError, `{"error":"boom"}`, http.StatusOK, `{}`))
	defer restore()

	router := newTestAPI().Router()
	w := doRequest(router, http.MethodGet, "/api/v1/compounds/lookup?q=water", nil, "")
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500", w.Code)
	}
}

func TestLookupCompoundsGatewayTimeout(t *testing.T) {
	oldInterval := lookupRateInterval
	lookupRateInterval = 0
	defer func() { lookupRateInterval = oldInterval }()

	a := newTestAPI()
	router := a.Router()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/compounds/lookup?q=water", nil)
	ctx, cancel := context.WithTimeout(req.Context(), time.Nanosecond)
	defer cancel()
	time.Sleep(5 * time.Millisecond)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req.WithContext(ctx))
	if w.Code != http.StatusGatewayTimeout {
		t.Errorf("status = %d, want 504", w.Code)
	}
}

const lookupThreeCIDs = `{"IdentifierList":{"CID":[11,22,33]}}`

const lookupThreeProps = `{"PropertyTable":{"Properties":[
	{"CID":11,"IUPACName":"one","MolecularFormula":"X","MolecularWeight":1.0,"IsomericSMILES":"X","InChI":"InChI=1"},
	{"CID":22,"IUPACName":"two","MolecularFormula":"Y","MolecularWeight":2.0,"IsomericSMILES":"Y","InChI":"InChI=2"},
	{"CID":33,"IUPACName":"three","MolecularFormula":"Z","MolecularWeight":3.0,"IsomericSMILES":"Z","InChI":"InChI=3"}
]}}`

func TestLookupCompoundsCASAndTruncation(t *testing.T) {
	restore := pointLookupAtMock(t, lookupMockHandler(t, http.StatusOK, lookupThreeCIDs, http.StatusOK, lookupThreeProps))
	defer restore()

	router := newTestAPI().Router()
	w := doRequest(router, http.MethodGet, "/api/v1/compounds/lookup?q=12%2F34&type=cas&limit=2", nil, "")
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", w.Code, w.Body.String())
	}
	var result struct {
		Compounds []map[string]interface{} `json:"compounds"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if len(result.Compounds) != 2 {
		t.Errorf("got %d compounds, want 2 after limit truncation", len(result.Compounds))
	}
}

func TestLookupCompoundsPropertyError(t *testing.T) {
	restore := pointLookupAtMock(t, lookupMockHandler(t, http.StatusOK, lookupWaterCIDs, http.StatusInternalServerError, `{"error":"boom"}`))
	defer restore()

	router := newTestAPI().Router()
	w := doRequest(router, http.MethodGet, "/api/v1/compounds/lookup?q=water", nil, "")
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500", w.Code)
	}
}

const lookupPartialProps = `{"PropertyTable":{"Properties":[
	{"CID":22,"IUPACName":"two","MolecularFormula":"Y","MolecularWeight":2.0,"IsomericSMILES":"Y","InChI":"InChI=2"}
]}}`

func TestLookupCompoundsSkipsEmptyProps(t *testing.T) {
	restore := pointLookupAtMock(t, lookupMockHandler(t, http.StatusOK, `{"IdentifierList":{"CID":[11,22]}}`, http.StatusOK, lookupPartialProps))
	defer restore()

	router := newTestAPI().Router()
	w := doRequest(router, http.MethodGet, "/api/v1/compounds/lookup?q=mix", nil, "")
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", w.Code, w.Body.String())
	}
	var result struct {
		Compounds []map[string]interface{} `json:"compounds"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if len(result.Compounds) != 1 || result.Compounds[0]["ID"] != "pubchem:22" {
		t.Errorf("compounds = %v, want only pubchem:22", result.Compounds)
	}
}

func withNoLookupRate(t *testing.T) {
	t.Helper()
	old := lookupRateInterval
	lookupRateInterval = 0
	t.Cleanup(func() { lookupRateInterval = old })
}

func TestGetPubChemCIDsRequestError(t *testing.T) {
	withNoLookupRate(t)
	if _, _, err := getPubChemCIDs(context.Background(), "://bad-url"); err == nil {
		t.Error("expected error for malformed URL")
	}
}

func TestGetPubChemCIDsDoError(t *testing.T) {
	withNoLookupRate(t)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	defer srv.Close()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, _, err := getPubChemCIDs(ctx, srv.URL+"/compound/name/x/cids/JSON"); err == nil {
		t.Error("expected error for cancelled context")
	}
}

func TestGetPubChemCIDsUnexpectedStatus(t *testing.T) {
	withNoLookupRate(t)
	srv := httptest.NewServer(lookupMockHandler(t, http.StatusInternalServerError, `x`, http.StatusOK, `x`))
	defer srv.Close()
	oldBase := pubchemBaseURL
	pubchemBaseURL = srv.URL
	defer func() { pubchemBaseURL = oldBase }()
	if _, status, err := getPubChemCIDs(context.Background(), srv.URL+"/cids/JSON"); err == nil || status != http.StatusInternalServerError {
		t.Errorf("status=%d err=%v, want 500 + error", status, err)
	}
}

func TestGetPubChemCIDsDecodeError(t *testing.T) {
	withNoLookupRate(t)
	srv := httptest.NewServer(lookupMockHandler(t, http.StatusOK, `not-json{`, http.StatusOK, `x`))
	defer srv.Close()
	if _, _, err := getPubChemCIDs(context.Background(), srv.URL+"/cids/JSON"); err == nil {
		t.Error("expected decode error")
	}
}

func TestGetPubChemCIDsNilList(t *testing.T) {
	withNoLookupRate(t)
	srv := httptest.NewServer(lookupMockHandler(t, http.StatusOK, `{}`, http.StatusOK, `x`))
	defer srv.Close()
	cids, status, err := getPubChemCIDs(context.Background(), srv.URL+"/cids/JSON")
	if err != nil || status != http.StatusOK || len(cids) != 0 {
		t.Errorf("cids=%v status=%d err=%v, want empty/nil with no error", cids, status, err)
	}
}

func TestFetchPubChemLookupEmptyCIDs(t *testing.T) {
	withNoLookupRate(t)
	srv := httptest.NewServer(lookupMockHandler(t, http.StatusOK, `{"IdentifierList":{"CID":[]}}`, http.StatusOK, `{}`))
	defer srv.Close()
	oldBase := pubchemBaseURL
	pubchemBaseURL = srv.URL
	defer func() { pubchemBaseURL = oldBase }()
	got, err := fetchPubChemLookup(context.Background(), "name", false, "zzz", 10)
	if err != nil || len(got) != 0 {
		t.Errorf("got=%v err=%v, want empty slice", got, err)
	}
}

func TestGetPubChemPropertiesRequestError(t *testing.T) {
	withNoLookupRate(t)
	oldBase := pubchemBaseURL
	pubchemBaseURL = "://bad-base"
	defer func() { pubchemBaseURL = oldBase }()
	if _, err := getPubChemProperties(context.Background(), []int{1}); err == nil {
		t.Error("expected error for malformed base URL")
	}
}

func TestGetPubChemPropertiesDoError(t *testing.T) {
	withNoLookupRate(t)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	defer srv.Close()
	oldBase := pubchemBaseURL
	pubchemBaseURL = srv.URL
	defer func() { pubchemBaseURL = oldBase }()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := getPubChemProperties(ctx, []int{1}); err == nil {
		t.Error("expected error for cancelled context")
	}
}

func TestGetPubChemPropertiesRateLimited(t *testing.T) {
	withNoLookupRate(t)
	srv := httptest.NewServer(lookupMockHandler(t, http.StatusOK, lookupWaterCIDs, http.StatusTooManyRequests, `x`))
	defer srv.Close()
	oldBase := pubchemBaseURL
	pubchemBaseURL = srv.URL
	defer func() { pubchemBaseURL = oldBase }()
	if _, err := getPubChemProperties(context.Background(), []int{962}); !errors.Is(err, errUpstreamRateLimited) {
		t.Errorf("err = %v, want upstream rate limited", err)
	}
}

func TestGetPubChemPropertiesUnexpectedStatus(t *testing.T) {
	withNoLookupRate(t)
	srv := httptest.NewServer(lookupMockHandler(t, http.StatusOK, lookupWaterCIDs, http.StatusInternalServerError, `x`))
	defer srv.Close()
	oldBase := pubchemBaseURL
	pubchemBaseURL = srv.URL
	defer func() { pubchemBaseURL = oldBase }()
	if _, err := getPubChemProperties(context.Background(), []int{962}); err == nil {
		t.Error("expected error for 500 property response")
	}
}

func TestGetPubChemPropertiesDecodeError(t *testing.T) {
	withNoLookupRate(t)
	srv := httptest.NewServer(lookupMockHandler(t, http.StatusOK, lookupWaterCIDs, http.StatusOK, `not-json{`))
	defer srv.Close()
	oldBase := pubchemBaseURL
	pubchemBaseURL = srv.URL
	defer func() { pubchemBaseURL = oldBase }()
	if _, err := getPubChemProperties(context.Background(), []int{962}); err == nil {
		t.Error("expected decode error")
	}
}

func TestRunCalculatorNullBody(t *testing.T) {
	router := newTestAPI().Router()
	w := doRequest(router, http.MethodPost, "/api/v1/calculators/molar-mass", []byte("null"), "application/json")
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestRunCalculatorError(t *testing.T) {
	router := newTestAPI().Router()
	body, _ := json.Marshal(map[string]string{"formula": ""})
	w := doRequest(router, http.MethodPost, "/api/v1/calculators/molar-mass", body, "application/json")
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400, body = %s", w.Code, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), "calculation error") {
		t.Errorf("body missing 'calculation error': %s", w.Body.String())
	}
}

// injectCalc registers a test-only calculator by reaching the registry's
// private map with reflect+unsafe. Each caller passes a fresh registry, so
// no restore is needed.
func injectCalc(t *testing.T, reg *calculators.Registry, name string, fn calculators.CalculatorFunc) {
	t.Helper()
	field := reflect.ValueOf(reg).Elem().FieldByName("calculators")
	m := reflect.NewAt(field.Type(), unsafe.Pointer(field.UnsafeAddr())).Elem()
	m.SetMapIndex(reflect.ValueOf(name), reflect.ValueOf(fn))
}

func TestRunCalculatorClientGone(t *testing.T) {
	a := newTestAPI()
	injectCalc(t, a.calcRegistry, "blocker", func(ctx context.Context, input calculators.CalculationInput) (calculators.CalculationResult, error) {
		<-ctx.Done()
		select {}
	})
	router := a.Router()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	body, _ := json.Marshal(map[string]string{"formula": "H2O"})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculators/blocker", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	// The handler returns without writing; the recorder reports 200/empty.
	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want 200 (no write on client-gone path)", w.Code)
	}
}

func TestRunCalculatorTimeout(t *testing.T) {
	a := newTestAPI()
	injectCalc(t, a.calcRegistry, "sleeper", func(ctx context.Context, input calculators.CalculationInput) (calculators.CalculationResult, error) {
		<-ctx.Done()
		return calculators.CalculationResult{}, ctx.Err()
	})
	router := a.Router()

	body, _ := json.Marshal(map[string]string{"formula": "H2O"})
	w := doRequest(router, http.MethodPost, "/api/v1/calculators/sleeper", body, "application/json")
	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, want 503, body = %s", w.Code, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), "timed out") {
		t.Errorf("body missing timeout detail: %s", w.Body.String())
	}
}
