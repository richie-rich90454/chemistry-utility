package compounds

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"
)

// newRetryTestClient wires a PubChemClient at the given handler with a fast
// rate limiter so retry tests stay quick.
func newRetryTestClient(t *testing.T, handler http.Handler) *PubChemClient {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	client := NewPubChemClient()
	t.Cleanup(client.Stop)
	client.rateTicker.Stop()
	client.rateTicker = time.NewTicker(time.Millisecond)
	client.baseURL = server.URL
	client.httpClient = server.Client()
	return client
}

// flakyRoundTripper fails the first `failures` requests with a transport
// error, then delegates to `next`.
type flakyRoundTripper struct {
	mu       sync.Mutex
	calls    int
	failures int
	next     http.RoundTripper
}

func (f *flakyRoundTripper) RoundTrip(r *http.Request) (*http.Response, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.calls++
	if f.calls <= f.failures {
		return nil, errors.New("simulated transport failure")
	}
	return f.next.RoundTrip(r)
}

func (f *flakyRoundTripper) count() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.calls
}

func newFlakyClient(t *testing.T, serverURL string, failures int) (*PubChemClient, *flakyRoundTripper) {
	t.Helper()
	client := NewPubChemClient()
	t.Cleanup(client.Stop)
	client.rateTicker.Stop()
	client.rateTicker = time.NewTicker(time.Millisecond)
	client.baseURL = serverURL
	flaky := &flakyRoundTripper{failures: failures, next: http.DefaultTransport}
	client.httpClient = &http.Client{Transport: flaky}
	return client, flaky
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

// --- waitForRate / doGet core paths ---

func TestWaitForRateCancelledContext(t *testing.T) {
	client := NewPubChemClient()
	defer client.Stop()
	client.rateTicker.Stop() // no ticks: the ctx.Done branch is deterministic

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	done := make(chan struct{})
	go func() {
		defer close(done)
		client.waitForRate(ctx)
	}()
	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("waitForRate did not return for cancelled context")
	}
}

func TestDoGetCancelledContext(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("no request should execute with a cancelled context")
	}))
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := client.doGet(ctx, client.baseURL+"/compound/name/x/cids/JSON"); !errors.Is(err, context.Canceled) {
		t.Errorf("expected context.Canceled, got %v", err)
	}
}

func TestDoGetInvalidURL(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	if _, err := client.doGet(context.Background(), "://invalid-url"); err == nil {
		t.Error("expected request-creation error, got nil")
	} else if !strings.Contains(err.Error(), "creating request") {
		t.Errorf("expected creating-request error, got %v", err)
	}
}

func TestDoGetTransportErrorThenSuccess(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]any{"ok": true})
	}))
	defer server.Close()

	client, flaky := newFlakyClient(t, server.URL, 1)
	resp, err := client.doGet(context.Background(), server.URL+"/compound/name/x/cids/JSON")
	if err != nil {
		t.Fatalf("doGet returned error: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
	if got := flaky.count(); got != 2 {
		t.Errorf("expected 2 attempts, got %d", got)
	}
}

func TestDoGetTransportErrorExhausted(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	defer server.Close()

	client, flaky := newFlakyClient(t, server.URL, 100)
	if _, err := client.doGet(context.Background(), server.URL+"/x"); err == nil {
		t.Error("expected exhausted-transport error, got nil")
	} else if !strings.Contains(err.Error(), "executing request") {
		t.Errorf("expected executing-request error, got %v", err)
	}
	if got := flaky.count(); got != maxRetries+1 {
		t.Errorf("expected %d attempts, got %d", maxRetries+1, got)
	}
}

func TestDoGetTransportErrorContextCancel(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	defer server.Close()

	client, _ := newFlakyClient(t, server.URL, 100)
	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		time.Sleep(100 * time.Millisecond)
		cancel()
	}()
	if _, err := client.doGet(ctx, server.URL+"/x"); !errors.Is(err, context.Canceled) {
		t.Errorf("expected context.Canceled, got %v", err)
	}
}

func TestDoGetTooManyRequestsThenSuccess(t *testing.T) {
	var mu sync.Mutex
	hits := 0
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		hits++
		n := hits
		mu.Unlock()
		if n == 1 {
			w.Header().Set("Retry-After", "0")
			w.WriteHeader(http.StatusTooManyRequests)
			return
		}
		writeJSON(w, map[string]any{"ok": true})
	}))

	resp, err := client.doGet(context.Background(), client.baseURL+"/x")
	if err != nil {
		t.Fatalf("doGet returned error: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200 after retry, got %d", resp.StatusCode)
	}
	mu.Lock()
	defer mu.Unlock()
	if hits != 2 {
		t.Errorf("expected 2 attempts, got %d", hits)
	}
}

func TestDoGetTooManyRequestsExhausted(t *testing.T) {
	var mu sync.Mutex
	hits := 0
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		hits++
		mu.Unlock()
		w.Header().Set("Retry-After", "0") // keep exhausted retries fast
		w.WriteHeader(http.StatusTooManyRequests)
	}))

	_, err := client.doGet(context.Background(), client.baseURL+"/x")
	if err == nil {
		t.Fatal("expected exhausted-429 error, got nil")
	}
	if !strings.Contains(err.Error(), "unexpected status code 429") {
		t.Errorf("expected 429 status error, got %v", err)
	}
	mu.Lock()
	defer mu.Unlock()
	if hits != maxRetries+1 {
		t.Errorf("expected %d attempts, got %d", maxRetries+1, hits)
	}
}

func TestDoGetServerErrorThenSuccess(t *testing.T) {
	var mu sync.Mutex
	hits := 0
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		hits++
		n := hits
		mu.Unlock()
		if n == 1 {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		writeJSON(w, map[string]any{"ok": true})
	}))

	resp, err := client.doGet(context.Background(), client.baseURL+"/x")
	if err != nil {
		t.Fatalf("doGet returned error: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200 after 500 retry, got %d", resp.StatusCode)
	}
}

func TestDoGetCancelDuringRetrySleep(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests) // no Retry-After: backs off ~500ms
	}))
	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		time.Sleep(100 * time.Millisecond)
		cancel()
	}()
	if _, err := client.doGet(ctx, client.baseURL+"/x"); !errors.Is(err, context.Canceled) {
		t.Errorf("expected context.Canceled, got %v", err)
	}
}

// --- backoffDelay / retryAfterDelay / sleepOrDone ---

func TestBackoffDelay(t *testing.T) {
	if d := backoffDelay(nil, 0); d < 500*time.Millisecond || d >= 750*time.Millisecond {
		t.Errorf("attempt 0 without header: got %v, want [500ms,750ms)", d)
	}

	noHeader := &http.Response{Header: http.Header{}}
	if d := backoffDelay(noHeader, 0); d < 500*time.Millisecond || d >= 750*time.Millisecond {
		t.Errorf("response without Retry-After: got %v, want [500ms,750ms)", d)
	}

	withHeader := &http.Response{Header: http.Header{"Retry-After": []string{"2"}}}
	if d := backoffDelay(withHeader, 0); d != 2*time.Second {
		t.Errorf("Retry-After header should win: got %v, want 2s", d)
	}

	// Exponential growth overflows the cap and is clamped.
	if d := backoffDelay(nil, 10); d != maxRetryDelay {
		t.Errorf("large attempt should clamp to %v, got %v", maxRetryDelay, d)
	}
}

func TestRetryAfterDelay(t *testing.T) {
	header := func(v string) *http.Response {
		if v == "" {
			return &http.Response{Header: http.Header{}}
		}
		return &http.Response{Header: http.Header{"Retry-After": []string{v}}}
	}

	if _, ok := retryAfterDelay(header("")); ok {
		t.Error("missing header should report false")
	}
	if d, ok := retryAfterDelay(header("0")); !ok || d != 0 {
		t.Errorf("Retry-After 0: got (%v,%v), want (0,true)", d, ok)
	}
	if d, ok := retryAfterDelay(header("2")); !ok || d != 2*time.Second {
		t.Errorf("Retry-After 2: got (%v,%v), want (2s,true)", d, ok)
	}
	if d, ok := retryAfterDelay(header("  3  ")); !ok || d != 3*time.Second {
		t.Errorf("padded Retry-After should be trimmed: got (%v,%v)", d, ok)
	}
	if d, ok := retryAfterDelay(header("-5")); !ok || d != 0 {
		t.Errorf("negative Retry-After should clamp to 0: got (%v,%v)", d, ok)
	}
	if d, ok := retryAfterDelay(header("99999")); !ok || d != maxRetryDelay {
		t.Errorf("huge Retry-After should clamp to %v: got (%v,%v)", maxRetryDelay, d, ok)
	}

	future := time.Now().Add(5 * time.Second).UTC().Format(http.TimeFormat)
	if d, ok := retryAfterDelay(header(future)); !ok || d <= 4*time.Second || d > 5*time.Second {
		t.Errorf("near-future date: got (%v,%v), want (~5s,true)", d, ok)
	}
	farFuture := time.Now().Add(time.Hour).UTC().Format(http.TimeFormat)
	if d, ok := retryAfterDelay(header(farFuture)); !ok || d != maxRetryDelay {
		t.Errorf("far-future date should clamp to %v: got (%v,%v)", maxRetryDelay, d, ok)
	}
	past := time.Now().Add(-time.Hour).UTC().Format(http.TimeFormat)
	if d, ok := retryAfterDelay(header(past)); !ok || d != 0 {
		t.Errorf("past date should clamp to 0: got (%v,%v)", d, ok)
	}
	if _, ok := retryAfterDelay(header("not-a-date")); ok {
		t.Error("garbage Retry-After should report false")
	}
}

func TestSleepOrDone(t *testing.T) {
	if !sleepOrDone(context.Background(), 0) {
		t.Error("zero delay with live context should be true")
	}
	if !sleepOrDone(context.Background(), -time.Second) {
		t.Error("negative delay with live context should be true")
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if sleepOrDone(ctx, 0) {
		t.Error("zero delay with cancelled context should be false")
	}
	if !sleepOrDone(context.Background(), 2*time.Millisecond) {
		t.Error("short delay with live context should be true")
	}

	ctx2, cancel2 := context.WithCancel(context.Background())
	go func() {
		time.Sleep(50 * time.Millisecond)
		cancel2()
	}()
	if sleepOrDone(ctx2, 10*time.Second) {
		t.Error("cancelled sleep should be false")
	}
}

// --- search entry points: validation, truncation, status mapping ---

func TestSearchEmptyQueryValidation(t *testing.T) {
	var mu sync.Mutex
	hits := 0
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		hits++
		mu.Unlock()
		w.WriteHeader(http.StatusNotFound)
	}))
	ctx := context.Background()
	if _, err := client.SearchByName(ctx, ""); err == nil {
		t.Error("SearchByName(\"\") should fail")
	}
	if _, err := client.SearchByName(ctx, "   "); err == nil {
		t.Error("SearchByName(\"   \") should fail")
	}
	if _, err := client.SearchByFormula(ctx, ""); err == nil {
		t.Error("SearchByFormula(\"\") should fail")
	}
	if _, err := client.SearchBySMILES(ctx, ""); err == nil {
		t.Error("SearchBySMILES(\"\") should fail")
	}
	mu.Lock()
	got := hits
	mu.Unlock()
	if got != 0 {
		t.Errorf("empty name/formula/smiles queries must not hit the network, got %d requests", got)
	}

	// SearchByCAS prefixes the query ("RN/"+cas), so SearchByCAS("") still
	// queries "RN/" and a 404 maps to an empty result set.
	results, err := client.SearchByCAS(ctx, "")
	if err != nil {
		t.Fatalf("SearchByCAS(\"\") against 404 should return empty, got: %v", err)
	}
	if len(results) != 0 {
		t.Errorf("expected 0 results, got %d", len(results))
	}

	// A malformed search payload exercises the SearchByCAS error wrapper.
	broken := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("{invalid json"))
	}))
	if _, err := broken.SearchByCAS(ctx, "50-78-2"); err == nil {
		t.Error("SearchByCAS with malformed payload should fail")
	} else if !strings.Contains(err.Error(), "search by CAS") {
		t.Errorf("expected search-by-CAS wrapper, got %v", err)
	}
}

func twelveCIDHandler() http.HandlerFunc {
	props := make([]map[string]any, 0, 12)
	infos := make([]pubChemInformation, 0, 12)
	casInfos := make([]map[string]any, 0, 12)
	for i := 1; i <= 12; i++ {
		props = append(props, map[string]any{
			"CID":              i,
			"IUPACName":        "Compound",
			"MolecularFormula": "C1H1",
			"MolecularWeight":  13.0,
			"IsomericSMILES":   "C",
			"InChI":            "InChI=1S/CH/h1H",
		})
		infos = append(infos, pubChemInformation{CID: i, Title: "Compound", SMILES: "C", InChI: "InChI=1S/CH/h1H"})
		casInfos = append(casInfos, map[string]any{"CID": i, "CAS": []string{}})
	}
	cids := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.Contains(path, "/cids/JSON"):
			writeJSON(w, map[string]any{"IdentifierList": map[string]any{"CID": cids}})
		case strings.Contains(path, "/property/"):
			writeJSON(w, map[string]any{"PropertyTable": map[string]any{"Properties": props}})
		case strings.Contains(path, "/description/"):
			writeJSON(w, pubChemDescriptionResponse{
				InformationList: &struct {
					Information []pubChemInformation `json:"Information"`
				}{Information: infos},
			})
		case strings.Contains(path, "/xrefs/CAS"):
			writeJSON(w, map[string]any{"InformationList": map[string]any{"Information": casInfos}})
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}
}

func TestSearchTruncatesToTen(t *testing.T) {
	client := newRetryTestClient(t, twelveCIDHandler())
	ctx := context.Background()

	results, err := client.SearchByName(ctx, "compound")
	if err != nil {
		t.Fatalf("SearchByName returned error: %v", err)
	}
	if len(results) != 10 {
		t.Errorf("SearchByName: expected 10 results, got %d", len(results))
	}
	if results, err := client.SearchByFormula(ctx, "C1H1"); err != nil {
		t.Fatalf("SearchByFormula returned error: %v", err)
	} else if len(results) != 10 {
		t.Errorf("SearchByFormula: expected 10 results, got %d", len(results))
	}
	if results, err := client.SearchBySMILES(ctx, "C"); err != nil {
		t.Fatalf("SearchBySMILES returned error: %v", err)
	} else if len(results) != 10 {
		t.Errorf("SearchBySMILES: expected 10 results, got %d", len(results))
	}
	if results, err := client.SearchByCAS(ctx, "00-00-0"); err != nil {
		t.Fatalf("SearchByCAS returned error: %v", err)
	} else if len(results) != 10 {
		t.Errorf("SearchByCAS: expected 10 results, got %d", len(results))
	}
}

func TestDoSearchRequestNotFoundEmpty(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	results, err := client.SearchByName(context.Background(), "nosuchcompound")
	if err != nil {
		t.Fatalf("404 should map to empty, got error: %v", err)
	}
	if len(results) != 0 {
		t.Errorf("expected 0 results for 404, got %d", len(results))
	}
}

func TestDoSearchRequestUnexpectedStatus(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
	}))
	if _, err := client.SearchByName(context.Background(), "x"); err == nil {
		t.Error("expected error for status 400, got nil")
	} else if !strings.Contains(err.Error(), "unexpected status code 400") {
		t.Errorf("expected 400 status error, got %v", err)
	}
}

func TestDoSearchRequestMalformedJSON(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte("{invalid json"))
	}))
	if _, err := client.SearchByName(context.Background(), "x"); err == nil {
		t.Error("expected decode error, got nil")
	} else if !strings.Contains(err.Error(), "decoding search response") {
		t.Errorf("expected decoding error, got %v", err)
	}
}

func TestSearchByNameServerError(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Retry-After", "0") // keep exhausted retries fast
		w.WriteHeader(http.StatusInternalServerError)
	}))
	if _, err := client.SearchByName(context.Background(), "x"); err == nil {
		t.Error("expected error for persistent 500, got nil")
	}
}

// --- fetchCompounds / GetCompoundDetail paths ---

func TestGetCompoundDetailPropertyError(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound) // property endpoint 404s
	}))
	if _, err := client.GetCompoundDetail(context.Background(), 2244); err == nil {
		t.Error("expected get-detail error, got nil")
	} else if !strings.Contains(err.Error(), "get compound detail") {
		t.Errorf("expected wrapped get-detail error, got %v", err)
	}
}

func TestGetCompoundDetailNotFound(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.Contains(path, "/property/"):
			// A property row with no usable data is skipped.
			writeJSON(w, map[string]any{
				"PropertyTable": map[string]any{"Properties": []map[string]any{{"CID": 999}}},
			})
		case strings.Contains(path, "/description/"):
			writeJSON(w, map[string]any{})
		case strings.Contains(path, "/xrefs/CAS"):
			writeJSON(w, map[string]any{"InformationList": map[string]any{"Information": []any{}}})
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	if _, err := client.GetCompoundDetail(context.Background(), 999); err == nil {
		t.Error("expected not-found error, got nil")
	} else if !strings.Contains(err.Error(), "not found") {
		t.Errorf("expected not-found error, got %v", err)
	}
}

func TestFetchCompoundsDescriptionFallback(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.Contains(path, "/cids/JSON"):
			writeJSON(w, map[string]any{"IdentifierList": map[string]any{"CID": []int{7}}})
		case strings.Contains(path, "/property/"):
			// Name/SMILES/InChI empty; formula present so the CID is kept.
			writeJSON(w, map[string]any{
				"PropertyTable": map[string]any{"Properties": []map[string]any{
					{"CID": 7, "IUPACName": "", "MolecularFormula": "H2O", "MolecularWeight": 18.015, "IsomericSMILES": "", "InChI": ""},
				}},
			})
		case strings.Contains(path, "/description/"):
			writeJSON(w, pubChemDescriptionResponse{
				InformationList: &struct {
					Information []pubChemInformation `json:"Information"`
				}{Information: []pubChemInformation{
					{CID: 7, Title: "Water", SMILES: "O", InChI: "InChI=1S/H2O/h1H2"},
				}},
			})
		case strings.Contains(path, "/xrefs/CAS"):
			writeJSON(w, map[string]any{"InformationList": map[string]any{"Information": []any{}}})
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))

	compound, err := client.GetCompoundDetail(context.Background(), 7)
	if err != nil {
		t.Fatalf("GetCompoundDetail returned error: %v", err)
	}
	if compound.Name != "Water" {
		t.Errorf("expected description title Water, got %q", compound.Name)
	}
	if compound.SMILES != "O" {
		t.Errorf("expected description SMILES O, got %q", compound.SMILES)
	}
	if compound.InChI != "InChI=1S/H2O/h1H2" {
		t.Errorf("expected description InChI, got %q", compound.InChI)
	}
	if compound.Formula != "H2O" {
		t.Errorf("expected property formula H2O, got %q", compound.Formula)
	}
}

func TestFetchCompoundsDescriptionErrorTolerated(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.Contains(path, "/cids/JSON"):
			writeJSON(w, map[string]any{"IdentifierList": map[string]any{"CID": []int{2244}}})
		case strings.Contains(path, "/property/"):
			writeJSON(w, map[string]any{
				"PropertyTable": map[string]any{"Properties": []map[string]any{
					{"CID": 2244, "IUPACName": "2-acetyloxybenzoic acid", "MolecularFormula": "C9H8O4", "MolecularWeight": 180.16, "IsomericSMILES": "CCO", "InChI": "InChI=1S/x"},
				}},
			})
		case strings.Contains(path, "/description/"):
			w.WriteHeader(http.StatusNotFound) // supplementary: must not fail the search
		case strings.Contains(path, "/xrefs/CAS"):
			writeJSON(w, map[string]any{"InformationList": map[string]any{"Information": []any{}}})
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))

	results, err := client.SearchByName(context.Background(), "aspirin")
	if err != nil {
		t.Fatalf("description failure should be tolerated, got: %v", err)
	}
	if len(results) != 1 || results[0].Name != "2-acetyloxybenzoic acid" {
		t.Errorf("expected property-backed result, got %+v", results)
	}
}

func TestFetchCompoundsCASErrorTolerated(t *testing.T) {
	client := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.Contains(path, "/cids/JSON"):
			writeJSON(w, map[string]any{"IdentifierList": map[string]any{"CID": []int{2244}}})
		case strings.Contains(path, "/property/"):
			writeJSON(w, map[string]any{
				"PropertyTable": map[string]any{"Properties": []map[string]any{
					{"CID": 2244, "IUPACName": "2-acetyloxybenzoic acid", "MolecularFormula": "C9H8O4", "MolecularWeight": 180.16, "IsomericSMILES": "CCO", "InChI": "InChI=1S/x"},
				}},
			})
		case strings.Contains(path, "/description/"):
			writeJSON(w, pubChemDescriptionResponse{
				InformationList: &struct {
					Information []pubChemInformation `json:"Information"`
				}{Information: []pubChemInformation{
					{CID: 2244, Title: "Aspirin", SMILES: "CCO", InChI: "InChI=1S/x"},
				}},
			})
		case strings.Contains(path, "/xrefs/CAS"):
			w.WriteHeader(http.StatusNotFound) // CAS failure is swallowed
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))

	results, err := client.SearchByName(context.Background(), "aspirin")
	if err != nil {
		t.Fatalf("CAS failure should be tolerated, got: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].CASNumber != "" {
		t.Errorf("expected empty CAS number, got %q", results[0].CASNumber)
	}
}

// --- fetchProperties / fetchDescriptions / fetchCASNumbers error paths ---

func TestFetchPropertiesErrors(t *testing.T) {
	ctx := context.Background()

	exhausted := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Retry-After", "0")
		w.WriteHeader(http.StatusInternalServerError)
	}))
	if _, err := exhausted.fetchProperties(ctx, "2244"); err == nil {
		t.Error("expected doGet error for persistent 500, got nil")
	}

	notFound := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	if _, err := notFound.fetchProperties(ctx, "2244"); err == nil {
		t.Error("expected error for property 404, got nil")
	} else if !strings.Contains(err.Error(), "unexpected status code 404") {
		t.Errorf("expected 404 status error, got %v", err)
	}

	garbage := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("{invalid json"))
	}))
	if _, err := garbage.fetchProperties(ctx, "2244"); err == nil {
		t.Error("expected decode error, got nil")
	} else if !strings.Contains(err.Error(), "decoding property response") {
		t.Errorf("expected decoding error, got %v", err)
	}

	empty := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]any{})
	}))
	props, err := empty.fetchProperties(ctx, "2244")
	if err != nil {
		t.Fatalf("empty property table should succeed, got: %v", err)
	}
	if len(props) != 0 {
		t.Errorf("expected empty props map, got %v", props)
	}
}

func TestFetchDescriptionsErrors(t *testing.T) {
	ctx := context.Background()

	exhausted := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Retry-After", "0")
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	if _, err := exhausted.fetchDescriptions(ctx, "2244"); err == nil {
		t.Error("expected doGet error for persistent 503, got nil")
	}

	notFound := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	if _, err := notFound.fetchDescriptions(ctx, "2244"); err == nil {
		t.Error("expected error for description 404, got nil")
	} else if !strings.Contains(err.Error(), "unexpected status code 404") {
		t.Errorf("expected 404 status error, got %v", err)
	}

	garbage := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("{invalid json"))
	}))
	if _, err := garbage.fetchDescriptions(ctx, "2244"); err == nil {
		t.Error("expected decode error, got nil")
	} else if !strings.Contains(err.Error(), "decoding description response") {
		t.Errorf("expected decoding error, got %v", err)
	}

	empty := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]any{})
	}))
	infos, err := empty.fetchDescriptions(ctx, "2244")
	if err != nil {
		t.Fatalf("missing InformationList should succeed, got: %v", err)
	}
	if infos != nil {
		t.Errorf("expected nil infos, got %v", infos)
	}
}

func TestFetchCASNumbersErrors(t *testing.T) {
	ctx := context.Background()

	exhausted := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Retry-After", "0")
		w.WriteHeader(http.StatusBadGateway)
	}))
	if _, err := exhausted.fetchCASNumbers(ctx, "2244"); err == nil {
		t.Error("expected doGet error for persistent 502, got nil")
	}

	notFound := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	if _, err := notFound.fetchCASNumbers(ctx, "2244"); err == nil {
		t.Error("expected error for CAS 404, got nil")
	} else if !strings.Contains(err.Error(), "unexpected status code 404") {
		t.Errorf("expected 404 status error, got %v", err)
	}

	garbage := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("{invalid json"))
	}))
	if _, err := garbage.fetchCASNumbers(ctx, "2244"); err == nil {
		t.Error("expected decode error, got nil")
	} else if !strings.Contains(err.Error(), "decoding CAS response") {
		t.Errorf("expected decoding error, got %v", err)
	}

	noCAS := newRetryTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]any{
			"InformationList": map[string]any{"Information": []map[string]any{{"CID": 2244, "CAS": []string{}}}},
		})
	}))
	casMap, err := noCAS.fetchCASNumbers(ctx, "2244")
	if err != nil {
		t.Fatalf("empty CAS list should succeed, got: %v", err)
	}
	if len(casMap) != 0 {
		t.Errorf("expected empty CAS map, got %v", casMap)
	}
}
