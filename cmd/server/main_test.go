package main

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// newTestDist creates a minimal dist directory fixture.
func newTestDist(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	if err := os.MkdirAll(filepath.Join(dir, "assets"), 0o755); err != nil {
		t.Fatal(err)
	}
	files := map[string]string{
		filepath.Join("index.html"):       "<!DOCTYPE html><html><body>app</body></html>",
		filepath.Join("ptable.json"):      `{"elements":[]}`,
		filepath.Join("sw.js"):            "// service worker",
		filepath.Join("assets", "app.js"): "// app",
	}
	for rel, content := range files {
		path := filepath.Join(dir, filepath.FromSlash(rel))
		if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

func newTestRouter(t *testing.T, distDir string, rpm int) *gin.Engine {
	t.Helper()
	t.Setenv("TRUSTED_PROXIES", "")
	return buildRouter(distDir, rpm)
}

func TestSecurityHeadersOnAPIRoutes(t *testing.T) {
	r := newTestRouter(t, newTestDist(t), 100)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/calculators", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	csp := w.Header().Get("Content-Security-Policy")
	if !strings.Contains(csp, "https://cdn.jsdelivr.net") {
		t.Errorf("CSP %q must allow cdn.jsdelivr.net (Swagger UI assets)", csp)
	}
	for header, want := range map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
		"Referrer-Policy":        "strict-origin-when-cross-origin",
	} {
		if got := w.Header().Get(header); got != want {
			t.Errorf("%s = %q, want %q", header, got, want)
		}
	}
}

func TestSwaggerDocsServedThroughWebRouter(t *testing.T) {
	r := newTestRouter(t, newTestDist(t), 100)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/docs", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("/api/docs status = %d, want 200", w.Code)
	}
	body := w.Body.String()
	if !strings.Contains(body, "cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js") {
		t.Error("/api/docs HTML must load Swagger UI bundle from jsdelivr")
	}

	w2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, "/api/docs/openapi.yaml", nil)
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("/api/docs/openapi.yaml status = %d, want 200", w2.Code)
	}
	ct := w2.Header().Get("Content-Type")
	if !strings.HasPrefix(ct, "application/yaml") {
		t.Errorf("spec Content-Type = %q, want application/yaml", ct)
	}
}

func TestCalculatorEndpointWorks(t *testing.T) {
	r := newTestRouter(t, newTestDist(t), 100)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculators/molar-mass", strings.NewReader(`{"formula":"H2O"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", w.Code, w.Body.String())
	}
	var result struct {
		Value float64 `json:"Value"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if result.Value < 18.01 || result.Value > 18.02 {
		t.Errorf("molar mass of H2O = %v, want ~18.015", result.Value)
	}
}

func TestDBBackedFeaturesReturn501ProblemJSON(t *testing.T) {
	r := newTestRouter(t, newTestDist(t), 100)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/compounds?q=water", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotImplemented {
		t.Fatalf("status = %d, want 501", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/problem+json" {
		t.Errorf("Content-Type = %q, want application/problem+json", ct)
	}
	var problem struct {
		Status int `json:"status"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &problem); err != nil {
		t.Fatalf("decode problem details: %v", err)
	}
	if problem.Status != 501 {
		t.Errorf("problem status = %d, want 501", problem.Status)
	}
}

func TestGzipCompressionApplied(t *testing.T) {
	r := newTestRouter(t, newTestDist(t), 100)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/calculators", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	r.ServeHTTP(w, req)

	if enc := w.Header().Get("Content-Encoding"); enc != "gzip" {
		t.Fatalf("Content-Encoding = %q, want gzip", enc)
	}
	zr, err := gzip.NewReader(w.Body)
	if err != nil {
		t.Fatalf("response body is not valid gzip: %v", err)
	}
	defer zr.Close()
	raw, err := io.ReadAll(zr)
	if err != nil {
		t.Fatalf("decompress body: %v", err)
	}
	if !strings.Contains(string(raw), "calculators") {
		t.Errorf("decompressed body missing payload: %q", string(raw))
	}
}

func TestCacheHeaders(t *testing.T) {
	distDir := newTestDist(t)
	r := newTestRouter(t, distDir, 100)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/assets/app.js", nil)
	r.ServeHTTP(w, req)
	if cc := w.Header().Get("Cache-Control"); cc != "public, max-age=31536000, immutable" {
		t.Errorf("/assets Cache-Control = %q", cc)
	}

	w2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, "/ptable.json", nil)
	r.ServeHTTP(w2, req2)
	if cc := w2.Header().Get("Cache-Control"); cc != "public, max-age=86400" {
		t.Errorf("/ptable.json Cache-Control = %q", cc)
	}
}

func TestRateLimitNotBypassableViaForwardedFor(t *testing.T) {
	const limit = 3
	r := newTestRouter(t, newTestDist(t), limit)

	statuses := make([]int, 0, limit+3)
	for i := 0; i < limit+3; i++ {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/api/v1/calculators", nil)
		// Each request spoofs a unique client IP. With no trusted proxies,
		// these must be ignored: all requests share one bucket and the
		// limit still trips.
		req.Header.Set("X-Forwarded-For", "10.0."+strings.Repeat(".1.", 0)+"0."+itoa(i))
		r.ServeHTTP(w, req)
		statuses = append(statuses, w.Code)
	}
	for i, code := range statuses[:limit] {
		if code != http.StatusOK {
			t.Fatalf("request %d status = %d, want 200 within limit", i, code)
		}
	}
	for i, code := range statuses[limit:] {
		if code != http.StatusTooManyRequests {
			t.Errorf("spoofed request %d past limit status = %d, want 429", i, code)
		}
	}
}

func TestSPAFallbackAndAPI404(t *testing.T) {
	distDir := newTestDist(t)
	r := newTestRouter(t, distDir, 100)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/equation-balancer", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), "app</body>") {
		t.Errorf("SPA fallback status=%d body=%q", w.Code, w.Body.String())
	}

	w2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/does-not-exist", nil)
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusNotFound {
		t.Errorf("unknown API route status = %d, want 404", w2.Code)
	}
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	digits := ""
	for n > 0 {
		digits = string(rune('0'+n%10)) + digits
		n /= 10
	}
	return digits
}

func TestGzipResponseWriterWriteString(t *testing.T) {
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	rec := httptest.NewRecorder()
	ginCtx, _ := gin.CreateTestContext(rec)
	w := &gzipResponseWriter{Writer: gz, ResponseWriter: ginCtx.Writer}
	if _, err := w.WriteString("hello gzip"); err != nil {
		t.Fatalf("WriteString: %v", err)
	}
	if err := gz.Close(); err != nil {
		t.Fatalf("close gzip writer: %v", err)
	}
	zr, err := gzip.NewReader(&buf)
	if err != nil {
		t.Fatalf("payload is not valid gzip: %v", err)
	}
	defer zr.Close()
	raw, err := io.ReadAll(zr)
	if err != nil {
		t.Fatalf("decompress: %v", err)
	}
	if string(raw) != "hello gzip" {
		t.Errorf("round-trip = %q, want %q", raw, "hello gzip")
	}
}

func TestTrustedProxiesParsing(t *testing.T) {
	t.Setenv("TRUSTED_PROXIES", "10.0.0.0/8, , 192.168.0.0/16 ")
	got := trustedProxies()
	want := []string{"10.0.0.0/8", "192.168.0.0/16"}
	if len(got) != len(want) {
		t.Fatalf("trustedProxies() = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("trustedProxies() = %v, want %v", got, want)
		}
	}

	t.Setenv("TRUSTED_PROXIES", "")
	if got := trustedProxies(); got != nil {
		t.Errorf("empty TRUSTED_PROXIES = %v, want nil", got)
	}
}

func TestBuildRouterDeepAPIRoutes(t *testing.T) {
	r := newTestRouter(t, newTestDist(t), 100)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/plugins/123e4567-e89b-12d3-a456-426614174000/enable", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusNotImplemented {
		t.Errorf("3-segment plugin route status = %d, want 501 (no database)", w.Code)
	}

	w2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/plugins/123e4567-e89b-12d3-a456-426614174000/enable/extra", nil)
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusNotFound {
		t.Errorf("4-segment unknown route status = %d, want 404", w2.Code)
	}
}

func TestNoRouteUnknownAPIPath(t *testing.T) {
	r := newTestRouter(t, newTestDist(t), 100)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/unknown-path", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", w.Code)
	}
	var problem struct {
		Title  string `json:"title"`
		Detail string `json:"detail"`
		Status int    `json:"status"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &problem); err != nil {
		t.Fatalf("decode problem details: %v", err)
	}
	if problem.Detail != "API endpoint not found" || problem.Status != 404 {
		t.Errorf("problem = %+v, want API 404 details", problem)
	}
}

func TestNoRouteMissingIndex(t *testing.T) {
	r := newTestRouter(t, t.TempDir(), 100)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", w.Code)
	}
	if !strings.Contains(w.Body.String(), "index.html not found") {
		t.Errorf("body = %q, want missing-index hint", w.Body.String())
	}
}
