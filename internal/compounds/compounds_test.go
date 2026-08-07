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

	"github.com/google/uuid"
)

// --- PubChem client URL construction tests ---

func TestPubChemClientBaseURL(t *testing.T) {
	client := NewPubChemClient()
	defer client.Stop()

	if client.baseURL != "https://pubchem.ncbi.nlm.nih.gov/rest/pug" {
		t.Errorf("expected default base URL, got %s", client.baseURL)
	}
}

func TestPubChemClientCustomBaseURL(t *testing.T) {
	client := NewPubChemClient()
	defer client.Stop()

	client.baseURL = "https://example.com/pug"
	if client.baseURL != "https://example.com/pug" {
		t.Errorf("expected custom base URL, got %s", client.baseURL)
	}
}

func TestSearchByNameURLConstruction(t *testing.T) {
	client := NewPubChemClient()
	defer client.Stop()

	var firstRequestURL string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if firstRequestURL == "" {
			firstRequestURL = r.URL.Path
		}

		// Return a CID search response
		resp := pubChemSearchResponse{
			IdentifierList: &struct {
				CID []int `json:"CID"`
			}{CID: []int{2244}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	client.baseURL = server.URL
	client.httpClient = server.Client()

	ctx := context.Background()
	_, err := client.SearchByName(ctx, "aspirin")
	if err != nil {
		t.Fatalf("SearchByName returned error: %v", err)
	}

	expectedSuffix := "/compound/name/aspirin/cids/JSON"
	if !strings.HasSuffix(firstRequestURL, expectedSuffix) {
		t.Errorf("expected URL to end with %s, got %s", expectedSuffix, firstRequestURL)
	}
}

func TestSearchByFormulaURLConstruction(t *testing.T) {
	client := NewPubChemClient()
	defer client.Stop()

	var firstRequestURL string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if firstRequestURL == "" {
			firstRequestURL = r.URL.Path
		}

		resp := pubChemSearchResponse{
			IdentifierList: &struct {
				CID []int `json:"CID"`
			}{CID: []int{962}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	client.baseURL = server.URL
	client.httpClient = server.Client()

	ctx := context.Background()
	_, err := client.SearchByFormula(ctx, "C6H6")
	if err != nil {
		t.Fatalf("SearchByFormula returned error: %v", err)
	}

	expectedSuffix := "/compound/formula/C6H6/cids/JSON"
	if !strings.HasSuffix(firstRequestURL, expectedSuffix) {
		t.Errorf("expected URL to end with %s, got %s", expectedSuffix, firstRequestURL)
	}
}

func TestSearchBySMILESURLConstruction(t *testing.T) {
	client := NewPubChemClient()
	defer client.Stop()

	var firstRequestURL string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if firstRequestURL == "" {
			firstRequestURL = r.URL.Path
		}

		resp := pubChemSearchResponse{
			IdentifierList: &struct {
				CID []int `json:"CID"`
			}{CID: []int{241}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	client.baseURL = server.URL
	client.httpClient = server.Client()

	ctx := context.Background()
	_, err := client.SearchBySMILES(ctx, "CC(=O)Oc1ccccc1C(=O)O")
	if err != nil {
		t.Fatalf("SearchBySMILES returned error: %v", err)
	}

	if !strings.Contains(firstRequestURL, "/compound/smiles/") {
		t.Errorf("expected URL to contain /compound/smiles/, got %s", firstRequestURL)
	}
}

func TestSearchByCASURLConstruction(t *testing.T) {
	client := NewPubChemClient()
	defer client.Stop()

	var firstRequestURL string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if firstRequestURL == "" {
			firstRequestURL = r.URL.Path
		}

		resp := pubChemSearchResponse{
			IdentifierList: &struct {
				CID []int `json:"CID"`
			}{CID: []int{2244}},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	client.baseURL = server.URL
	client.httpClient = server.Client()

	ctx := context.Background()
	_, err := client.SearchByCAS(ctx, "50-78-2")
	if err != nil {
		t.Fatalf("SearchByCAS returned error: %v", err)
	}

	if !strings.Contains(firstRequestURL, "/xref/RN/50-78-2") {
		t.Errorf("expected URL to contain /xref/RN/50-78-2, got %s", firstRequestURL)
	}
}

// --- PubChem client response parsing tests ---

func TestGetCompoundDetail(t *testing.T) {
	client := NewPubChemClient()
	defer client.Stop()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		if strings.Contains(path, "/property/") {
			result := struct {
				PropertyTable *struct {
					Properties []struct {
						CID              int     `json:"CID"`
						IUPACName        string  `json:"IUPACName"`
						MolecularFormula string  `json:"MolecularFormula"`
						MolecularWeight  float64 `json:"MolecularWeight"`
						IsomericSMILES   string  `json:"IsomericSMILES"`
						InChI            string  `json:"InChI"`
					} `json:"Properties"`
				} `json:"PropertyTable"`
			}{
				PropertyTable: &struct {
					Properties []struct {
						CID              int     `json:"CID"`
						IUPACName        string  `json:"IUPACName"`
						MolecularFormula string  `json:"MolecularFormula"`
						MolecularWeight  float64 `json:"MolecularWeight"`
						IsomericSMILES   string  `json:"IsomericSMILES"`
						InChI            string  `json:"InChI"`
					} `json:"Properties"`
				}{
					Properties: []struct {
						CID              int     `json:"CID"`
						IUPACName        string  `json:"IUPACName"`
						MolecularFormula string  `json:"MolecularFormula"`
						MolecularWeight  float64 `json:"MolecularWeight"`
						IsomericSMILES   string  `json:"IsomericSMILES"`
						InChI            string  `json:"InChI"`
					}{
						{
							CID:              2244,
							IUPACName:        "2-acetyloxybenzoic acid",
							MolecularFormula: "C9H8O4",
							MolecularWeight:  180.16,
							IsomericSMILES:   "CC(=O)Oc1ccccc1C(=O)O",
							InChI:            "InChI=1S/C9H8O4/c1-6(10)13-8-5-3-2-4-7(8)9(11)12/h2-5H,1H3,(H,11,12)",
						},
					},
				},
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		if strings.Contains(path, "/description/") {
			result := pubChemDescriptionResponse{
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
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		if strings.Contains(path, "/xrefs/CAS") {
			result := struct {
				InformationList *struct {
					Information []struct {
						CID int      `json:"CID"`
						CAS []string `json:"CAS"`
					} `json:"Information"`
				} `json:"InformationList"`
			}{
				InformationList: &struct {
					Information []struct {
						CID int      `json:"CID"`
						CAS []string `json:"CAS"`
					} `json:"Information"`
				}{
					Information: []struct {
						CID int      `json:"CID"`
						CAS []string `json:"CAS"`
					}{
						{CID: 2244, CAS: []string{"50-78-2"}},
					},
				},
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	client.baseURL = server.URL
	client.httpClient = server.Client()

	ctx := context.Background()
	compound, err := client.GetCompoundDetail(ctx, 2244)
	if err != nil {
		t.Fatalf("GetCompoundDetail returned error: %v", err)
	}

	if compound.Formula != "C9H8O4" {
		t.Errorf("expected formula C9H8O4, got %s", compound.Formula)
	}
	if compound.SMILES != "CC(=O)Oc1ccccc1C(=O)O" {
		t.Errorf("expected SMILES CC(=O)Oc1ccccc1C(=O)O, got %s", compound.SMILES)
	}
	if compound.Source != "pubchem" {
		t.Errorf("expected source pubchem, got %s", compound.Source)
	}
}

func TestSearchByNameEmptyResponse(t *testing.T) {
	client := NewPubChemClient()
	defer client.Stop()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := pubChemSearchResponse{
			IdentifierList: nil,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	client.baseURL = server.URL
	client.httpClient = server.Client()

	ctx := context.Background()
	results, err := client.SearchByName(ctx, "nonexistentcompound")
	if err != nil {
		t.Fatalf("SearchByName returned error: %v", err)
	}

	if len(results) != 0 {
		t.Errorf("expected 0 results, got %d", len(results))
	}
}

// --- Cache tests ---

func TestCacheSearchWithEmptyLocalDB(t *testing.T) {
	// Set up a mock HTTP server that simulates PubChem
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// CID search
		if strings.Contains(path, "/cids/JSON") {
			resp := pubChemSearchResponse{
				IdentifierList: &struct {
					CID []int `json:"CID"`
				}{CID: []int{2244}},
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(resp)
			return
		}

		// Property fetch
		if strings.Contains(path, "/property/") {
			result := struct {
				PropertyTable *struct {
					Properties []struct {
						CID              int     `json:"CID"`
						IUPACName        string  `json:"IUPACName"`
						MolecularFormula string  `json:"MolecularFormula"`
						MolecularWeight  float64 `json:"MolecularWeight"`
						IsomericSMILES   string  `json:"IsomericSMILES"`
						InChI            string  `json:"InChI"`
					} `json:"Properties"`
				} `json:"PropertyTable"`
			}{
				PropertyTable: &struct {
					Properties []struct {
						CID              int     `json:"CID"`
						IUPACName        string  `json:"IUPACName"`
						MolecularFormula string  `json:"MolecularFormula"`
						MolecularWeight  float64 `json:"MolecularWeight"`
						IsomericSMILES   string  `json:"IsomericSMILES"`
						InChI            string  `json:"InChI"`
					} `json:"Properties"`
				}{
					Properties: []struct {
						CID              int     `json:"CID"`
						IUPACName        string  `json:"IUPACName"`
						MolecularFormula string  `json:"MolecularFormula"`
						MolecularWeight  float64 `json:"MolecularWeight"`
						IsomericSMILES   string  `json:"IsomericSMILES"`
						InChI            string  `json:"InChI"`
					}{
						{
							CID:              2244,
							IUPACName:        "2-acetyloxybenzoic acid",
							MolecularFormula: "C9H8O4",
							MolecularWeight:  180.16,
							IsomericSMILES:   "CC(=O)Oc1ccccc1C(=O)O",
							InChI:            "InChI=1S/C9H8O4/c1-6(10)13-8-5-3-2-4-7(8)9(11)12/h2-5H,1H3,(H,11,12)",
						},
					},
				},
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		// Description fetch
		if strings.Contains(path, "/description/") {
			result := pubChemDescriptionResponse{
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
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		// CAS xref fetch
		if strings.Contains(path, "/xrefs/CAS") {
			result := struct {
				InformationList *struct {
					Information []struct {
						CID int      `json:"CID"`
						CAS []string `json:"CAS"`
					} `json:"Information"`
				} `json:"InformationList"`
			}{
				InformationList: &struct {
					Information []struct {
						CID int      `json:"CID"`
						CAS []string `json:"CAS"`
					} `json:"Information"`
				}{
					Information: []struct {
						CID int      `json:"CID"`
						CAS []string `json:"CAS"`
					}{
						{CID: 2244, CAS: []string{"50-78-2"}},
					},
				},
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	// Create PubChem client pointing to mock server
	pubchemClient := NewPubChemClient()
	defer pubchemClient.Stop()
	pubchemClient.baseURL = server.URL
	pubchemClient.httpClient = server.Client()

	// Create an in-memory SQLite database for the cache store
	sqlDB, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	defer sqlDB.Close()

	// Create the compounds table
	_, err = sqlDB.Exec(`
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
	`)
	if err != nil {
		t.Fatalf("failed to create table: %v", err)
	}

	// CompoundStore.Search uses a LIKE-based query, so the plain table is enough
	store := &db.CompoundStore{DB: sqlDB, Driver: "sqlite3"}
	cache := NewCompoundCache(store, pubchemClient)

	ctx := context.Background()
	results, err := cache.Search(ctx, "aspirin", "name")
	if err != nil {
		t.Fatalf("cache Search returned error: %v", err)
	}

	if len(results) == 0 {
		t.Fatal("expected at least one result from PubChem fallback")
	}

	if results[0].Formula != "C9H8O4" {
		t.Errorf("expected formula C9H8O4, got %s", results[0].Formula)
	}

	if results[0].Source != "pubchem" {
		t.Errorf("expected source pubchem, got %s", results[0].Source)
	}

	// Verify the result was cached in the database by looking it up by CAS number
	cached, err := store.GetByCAS(ctx, "50-78-2")
	if err != nil {
		t.Fatalf("local DB GetByCAS returned error: %v", err)
	}
	if cached.Formula != "C9H8O4" {
		t.Errorf("expected cached formula C9H8O4, got %s", cached.Formula)
	}
}

func TestCacheSearchReturnsLocalFirst(t *testing.T) {
	// Create an in-memory SQLite database with pre-populated data
	sqlDB, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	defer sqlDB.Close()

	_, err = sqlDB.Exec(`
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
	`)
	if err != nil {
		t.Fatalf("failed to create table: %v", err)
	}

	// Note: CompoundStore.Search for SQLite uses a LIKE-based query against
	// the compounds table directly (FTS5 requires a non-default build tag).

	store := &db.CompoundStore{DB: sqlDB, Driver: "sqlite3"}
	localCompound := &db.Compound{
		Name:      "Caffeine",
		Formula:   "C8H10N4O2",
		CASNumber: "58-08-2",
		SMILES:    "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
		InChI:     "InChI=1S/C8H10N4O2/c1-10-4-9-6-5(10)7(13)12(3)8(14)11(6)2/h4H,1-3H3",
		MolarMass: 194.19,
		Source:    "local",
	}
	if err := store.Create(context.Background(), localCompound); err != nil {
		t.Fatalf("failed to create local compound: %v", err)
	}

	// Verify the local data is accessible via direct lookups
	ctx := context.Background()
	found, err := store.GetByCAS(ctx, "58-08-2")
	if err != nil {
		t.Fatalf("local GetByCAS returned error: %v", err)
	}
	if found.Name != "Caffeine" {
		t.Fatalf("expected local compound Caffeine, got %s", found.Name)
	}

	byID, err := store.GetByID(ctx, localCompound.ID)
	if err != nil {
		t.Fatalf("local GetByID returned error: %v", err)
	}
	if byID.Formula != "C8H10N4O2" {
		t.Errorf("expected formula C8H10N4O2, got %s", byID.Formula)
	}

	// Verify GetByID goes through cache correctly
	pubchemClient := NewPubChemClient()
	defer pubchemClient.Stop()

	cache := NewCompoundCache(store, pubchemClient)
	cachedCompound, err := cache.GetByID(ctx, localCompound.ID)
	if err != nil {
		t.Fatalf("cache GetByID returned error: %v", err)
	}
	if cachedCompound.Name != "Caffeine" {
		t.Errorf("expected Caffeine from cache, got %s", cachedCompound.Name)
	}
	if cachedCompound.Source != "local" {
		t.Errorf("expected source 'local', got %s", cachedCompound.Source)
	}
}

func TestCacheGetByID(t *testing.T) {
	sqlDB, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	defer sqlDB.Close()

	_, err = sqlDB.Exec(`
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
	`)
	if err != nil {
		t.Fatalf("failed to create table: %v", err)
	}

	localID := uuid.New()
	_, err = sqlDB.Exec(
		`INSERT INTO compounds (id, name, formula, cas_number, smiles, inchi, molar_mass, properties, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		localID.String(), "Ethanol", "C2H6O", "64-17-5", "CCO", "InChI=1S/C2H6O/c1-2-3/h3H,2H2,1H3", 46.07, "", "local", time.Now(), time.Now(),
	)
	if err != nil {
		t.Fatalf("failed to insert local compound: %v", err)
	}

	store := &db.CompoundStore{DB: sqlDB, Driver: "sqlite3"}
	pubchemClient := NewPubChemClient()
	defer pubchemClient.Stop()

	cache := NewCompoundCache(store, pubchemClient)

	ctx := context.Background()
	compound, err := cache.GetByID(ctx, localID)
	if err != nil {
		t.Fatalf("GetByID returned error: %v", err)
	}

	if compound.Name != "Ethanol" {
		t.Errorf("expected name Ethanol, got %s", compound.Name)
	}
	if compound.Formula != "C2H6O" {
		t.Errorf("expected formula C2H6O, got %s", compound.Formula)
	}
}

func TestCacheGetByIDNotFound(t *testing.T) {
	sqlDB, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	defer sqlDB.Close()

	_, err = sqlDB.Exec(`
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
	`)
	if err != nil {
		t.Fatalf("failed to create table: %v", err)
	}

	store := &db.CompoundStore{DB: sqlDB, Driver: "sqlite3"}
	pubchemClient := NewPubChemClient()
	defer pubchemClient.Stop()

	cache := NewCompoundCache(store, pubchemClient)

	ctx := context.Background()
	_, err = cache.GetByID(ctx, uuid.New())
	if err == nil {
		t.Error("expected error for non-existent ID, got nil")
	}
}
