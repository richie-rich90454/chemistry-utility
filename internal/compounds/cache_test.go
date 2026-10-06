package compounds

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"chemistry-utility/internal/db"

	_ "github.com/mattn/go-sqlite3"
)

const cacheTestSchema = `
	CREATE TABLE IF NOT EXISTS compounds (
		id TEXT PRIMARY KEY,
		name TEXT,
		formula TEXT,
		cas_number TEXT,
		smiles TEXT,
		inchi TEXT,
		molar_mass REAL,
		properties TEXT,
		source TEXT,
		created_at DATETIME,
		updated_at DATETIME
	)
`

func newCacheTestStore(t *testing.T) (*sql.DB, *db.CompoundStore) {
	t.Helper()
	sqlDB, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	t.Cleanup(func() { _ = sqlDB.Close() })
	if _, err := sqlDB.Exec(cacheTestSchema); err != nil {
		t.Fatalf("failed to create table: %v", err)
	}
	return sqlDB, &db.CompoundStore{DB: sqlDB, Driver: "sqlite3"}
}

// aspirinMockHandler serves canned aspirin data for every PUG-REST route,
// mirroring the catch-all style used in compounds_test.go.
func aspirinMockHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		w.Header().Set("Content-Type", "application/json")

		if strings.Contains(path, "/cids/JSON") {
			_ = json.NewEncoder(w).Encode(pubChemSearchResponse{
				IdentifierList: &struct {
					CID []int `json:"CID"`
				}{CID: []int{2244}},
			})
			return
		}

		if strings.Contains(path, "/property/") {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"PropertyTable": map[string]any{
					"Properties": []map[string]any{
						{
							"CID":              2244,
							"IUPACName":        "2-acetyloxybenzoic acid",
							"MolecularFormula": "C9H8O4",
							"MolecularWeight":  180.16,
							"IsomericSMILES":   "CC(=O)Oc1ccccc1C(=O)O",
							"InChI":            "InChI=1S/C9H8O4/c1-6(10)13-8-5-3-2-4-7(8)9(11)12/h2-5H,1H3,(H,11,12)",
						},
					},
				},
			})
			return
		}

		if strings.Contains(path, "/description/") {
			_ = json.NewEncoder(w).Encode(pubChemDescriptionResponse{
				InformationList: &struct {
					Information []pubChemInformation `json:"Information"`
				}{
					Information: []pubChemInformation{
						{
							CID:    2244,
							Title:  "Aspirin",
							SMILES: "CC(=O)Oc1ccccc1C(=O)O",
							InChI:  "InChI=1S/C9H8O4/c1-6(10)13-8-5-3-2-4-7(8)9(11)12/h2-5H,1H3,(H,11,12)",
						},
					},
				},
			})
			return
		}

		if strings.Contains(path, "/xrefs/CAS") {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"InformationList": map[string]any{
					"Information": []map[string]any{
						{"CID": 2244, "CAS": []string{"50-78-2"}},
					},
				},
			})
			return
		}

		w.WriteHeader(http.StatusNotFound)
	}
}

// newCacheTestClient wires a PubChemClient at a mock server with a fast
// rate limiter so cache fallback tests stay quick.
func newCacheTestClient(t *testing.T, handler http.HandlerFunc) *PubChemClient {
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

func TestCacheSearchNilReceivers(t *testing.T) {
	ctx := context.Background()

	var nilCache *CompoundCache
	if _, err := nilCache.Search(ctx, "aspirin", "name"); err == nil {
		t.Error("expected error for nil cache, got nil")
	}

	pubchem := NewPubChemClient()
	defer pubchem.Stop()
	if _, err := NewCompoundCache(nil, pubchem).Search(ctx, "aspirin", "name"); err == nil {
		t.Error("expected error for nil store, got nil")
	}

	_, store := newCacheTestStore(t)
	if _, err := NewCompoundCache(store, nil).Search(ctx, "aspirin", "name"); err == nil {
		t.Error("expected error for nil pubchem client, got nil")
	}
}

func TestCacheSearchCancelledContext(t *testing.T) {
	_, store := newCacheTestStore(t)
	pubchem := newCacheTestClient(t, aspirinMockHandler())
	cache := NewCompoundCache(store, pubchem)

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := cache.Search(ctx, "aspirin", "name"); err == nil {
		t.Error("expected error for cancelled context, got nil")
	}
}

func TestCacheSearchLocalHitSkipsPubChem(t *testing.T) {
	_, store := newCacheTestStore(t)
	ctx := context.Background()

	local := &db.Compound{
		Name:      "Caffeine",
		Formula:   "C8H10N4O2",
		CASNumber: "58-08-2",
		SMILES:    "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
		Source:    "local",
	}
	if err := store.Create(ctx, local); err != nil {
		t.Fatalf("failed to seed local compound: %v", err)
	}

	pubchem := newCacheTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		t.Error("PubChem should not be contacted on a local hit")
		w.WriteHeader(http.StatusInternalServerError)
	})
	cache := NewCompoundCache(store, pubchem)

	results, err := cache.Search(ctx, "Caffeine", "name")
	if err != nil {
		t.Fatalf("cache Search returned error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 local result, got %d", len(results))
	}
	if results[0].Name != "Caffeine" || results[0].Source != "local" {
		t.Errorf("expected local Caffeine, got %+v", results[0])
	}
}

func TestCacheSearchFallbackByType(t *testing.T) {
	cases := []struct {
		name       string
		query      string
		searchType string
	}{
		{"formula", "C9H8O4", "formula"},
		{"smiles", "CC(=O)Oc1ccccc1C(=O)O", "smiles"},
		{"cas", "50-78-2", "cas"},
		{"default", "aspirin", "bogus-type"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, store := newCacheTestStore(t)
			pubchem := newCacheTestClient(t, aspirinMockHandler())
			cache := NewCompoundCache(store, pubchem)

			results, err := cache.Search(context.Background(), tc.query, tc.searchType)
			if err != nil {
				t.Fatalf("cache Search(%q) returned error: %v", tc.searchType, err)
			}
			if len(results) == 0 {
				t.Fatalf("expected results for search type %q, got none", tc.searchType)
			}
			if results[0].Formula != "C9H8O4" {
				t.Errorf("expected formula C9H8O4, got %s", results[0].Formula)
			}
			if results[0].Source != "pubchem" {
				t.Errorf("expected source pubchem, got %s", results[0].Source)
			}
		})
	}
}

func TestCacheSearchPubChemError(t *testing.T) {
	_, store := newCacheTestStore(t)
	pubchem := newCacheTestClient(t, aspirinMockHandler())
	cache := NewCompoundCache(store, pubchem)

	// Empty query matches nothing locally (LIKE '%%' on an empty table)
	// and fails PubChem validation, surfacing the wrapped pubchem error.
	if _, err := cache.Search(context.Background(), "", "name"); err == nil {
		t.Error("expected pubchem search error for empty query, got nil")
	} else if !strings.Contains(err.Error(), "pubchem search") {
		t.Errorf("expected wrapped pubchem search error, got %v", err)
	}
}

func TestCacheSearchSkipsAlreadyCached(t *testing.T) {
	sqlDB, store := newCacheTestStore(t)
	ctx := context.Background()

	// Seed exactly what the mock PubChem server returns so isCached hits.
	seed := &db.Compound{
		Name:      "2-acetyloxybenzoic acid",
		Formula:   "C9H8O4",
		CASNumber: "50-78-2",
		Source:    "pubchem",
	}
	if err := store.Create(ctx, seed); err != nil {
		t.Fatalf("failed to seed compound: %v", err)
	}

	pubchem := newCacheTestClient(t, aspirinMockHandler())
	cache := NewCompoundCache(store, pubchem)

	// "aspirin" does not LIKE-match the IUPAC name, forcing PubChem fallback.
	results, err := cache.Search(ctx, "aspirin", "name")
	if err != nil {
		t.Fatalf("cache Search returned error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}

	var count int
	if err := sqlDB.QueryRow(`SELECT COUNT(*) FROM compounds`).Scan(&count); err != nil {
		t.Fatalf("count query failed: %v", err)
	}
	if count != 1 {
		t.Errorf("expected no duplicate insert, row count = %d, want 1", count)
	}
}

func TestCacheSearchUncachedFormulaMismatchInserts(t *testing.T) {
	sqlDB, store := newCacheTestStore(t)
	ctx := context.Background()

	// Same formula as PubChem will return, but a different name/source so
	// isCached iterates without matching and returns false.
	seed := &db.Compound{
		Name:    "Different Name",
		Formula: "C9H8O4",
		Source:  "local",
	}
	if err := store.Create(ctx, seed); err != nil {
		t.Fatalf("failed to seed compound: %v", err)
	}

	pubchem := newCacheTestClient(t, aspirinMockHandler())
	cache := NewCompoundCache(store, pubchem)

	results, err := cache.Search(ctx, "aspirin", "name")
	if err != nil {
		t.Fatalf("cache Search returned error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}

	var count int
	if err := sqlDB.QueryRow(`SELECT COUNT(*) FROM compounds`).Scan(&count); err != nil {
		t.Fatalf("count query failed: %v", err)
	}
	if count != 2 {
		t.Errorf("expected PubChem result to be inserted, row count = %d, want 2", count)
	}
}

func TestCacheSearchClosedDBIsBestEffort(t *testing.T) {
	sqlDB, store := newCacheTestStore(t)
	pubchem := newCacheTestClient(t, aspirinMockHandler())
	cache := NewCompoundCache(store, pubchem)

	// Close the DB: local Search fails (falls through to PubChem),
	// isCached reports false, and the cache insert fails silently.
	// The search itself must still succeed.
	_ = sqlDB.Close()

	results, err := cache.Search(context.Background(), "aspirin", "name")
	if err != nil {
		t.Fatalf("cache Search with closed DB returned error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result despite closed DB, got %d", len(results))
	}
	if results[0].Formula != "C9H8O4" {
		t.Errorf("expected formula C9H8O4, got %s", results[0].Formula)
	}
}
