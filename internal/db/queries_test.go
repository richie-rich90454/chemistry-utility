package db

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"io"
	"testing"
	"time"

	"github.com/google/uuid"
)

const compoundTestSchema = `CREATE TABLE compounds (
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
);`

const pluginTestSchema = `CREATE TABLE plugins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL DEFAULT '1.0.0',
    author TEXT NOT NULL DEFAULT '',
    manifest TEXT NOT NULL DEFAULT '{}',
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);`

func openSQLiteTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	// :memory: databases are per-connection; pin the pool to one connection.
	db.SetMaxOpenConns(1)
	t.Cleanup(func() { db.Close() })
	if _, err := db.Exec(compoundTestSchema); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(pluginTestSchema); err != nil {
		t.Fatal(err)
	}
	return db
}

func seedCompound(t *testing.T, s *CompoundStore, name, formula, cas, smiles string) *Compound {
	t.Helper()
	c := &Compound{Name: name, Formula: formula, CASNumber: cas, SMILES: smiles, MolarMass: 1.0, Source: "manual"}
	if err := s.Create(context.Background(), c); err != nil {
		t.Fatal(err)
	}
	return c
}

// insertBadCompoundRow stores a row whose molar_mass cannot scan into a
// float64, to exercise scan-error returns.
func insertBadCompoundRow(t *testing.T, db *sql.DB, id, name, formula, cas string) {
	t.Helper()
	_, err := db.Exec(`INSERT INTO compounds (id, name, formula, cas_number, smiles, inchi, molar_mass, properties, source, created_at, updated_at)
		VALUES (?, ?, ?, ?, '', '', 'not-a-float', '{}', 'manual', '2026-10-03 00:00:00', '2026-10-03 00:00:00')`,
		id, name, formula, cas)
	if err != nil {
		t.Fatal(err)
	}
}

func TestPlaceholder(t *testing.T) {
	cases := []struct {
		name   string
		driver string
		query  string
		want   string
	}{
		{
			name:   "postgres passthrough",
			driver: "postgres",
			query:  `SELECT * FROM compounds WHERE id = $1 AND name = $2`,
			want:   `SELECT * FROM compounds WHERE id = $1 AND name = $2`,
		},
		{
			name:   "sqlite single",
			driver: "sqlite3",
			query:  `SELECT * FROM compounds WHERE id = $1`,
			want:   `SELECT * FROM compounds WHERE id = ?`,
		},
		{
			name:   "sqlite multi-digit sequential",
			driver: "sqlite3",
			query:  `VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			want:   `VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		},
		{
			name:   "sqlite no placeholders",
			driver: "sqlite3",
			query:  `SELECT * FROM plugins ORDER BY created_at DESC`,
			want:   `SELECT * FROM plugins ORDER BY created_at DESC`,
		},
		{
			name:   "sqlite non-sequential untouched",
			driver: "sqlite3",
			query:  `LIMIT $2 OFFSET $3`,
			want:   `LIMIT $2 OFFSET $3`,
		},
		{
			name:   "other driver replaces",
			driver: "mysql",
			query:  `WHERE id = $1`,
			want:   `WHERE id = ?`,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := placeholder(tc.driver, tc.query); got != tc.want {
				t.Errorf("expected %q, got %q", tc.want, got)
			}
		})
	}
}

func TestCompoundCreateAndGet(t *testing.T) {
	db := openSQLiteTestDB(t)
	s := &CompoundStore{DB: db, Driver: "sqlite3"}
	ctx := context.Background()

	created := seedCompound(t, s, "Aspirin", "C9H8O4", "50-78-2", "CC(=O)O")
	if created.ID == uuid.Nil {
		t.Error("expected non-zero ID after create")
	}

	got, err := s.GetByID(ctx, created.ID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if got.Name != "Aspirin" || got.Formula != "C9H8O4" || got.CASNumber != "50-78-2" || got.SMILES != "CC(=O)O" {
		t.Errorf("roundtrip mismatch: %+v", got)
	}

	if _, err := s.GetByID(ctx, uuid.New()); err == nil {
		t.Error("expected error for unknown id, got nil")
	}

	byCAS, err := s.GetByCAS(ctx, "50-78-2")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if byCAS.ID != created.ID {
		t.Errorf("expected id %v, got %v", created.ID, byCAS.ID)
	}
	if _, err := s.GetByCAS(ctx, "00-00-0"); err == nil {
		t.Error("expected error for unknown CAS, got nil")
	}
}

func TestCompoundGetByFormula(t *testing.T) {
	db := openSQLiteTestDB(t)
	s := &CompoundStore{DB: db, Driver: "sqlite3"}
	ctx := context.Background()

	seedCompound(t, s, "Ethanol", "C2H6O", "64-17-5", "CCO")
	seedCompound(t, s, "Dimethyl ether", "C2H6O", "115-10-6", "COC")
	seedCompound(t, s, "Water", "H2O", "7732-18-5", "O")

	got, err := s.GetByFormula(ctx, "C2H6O")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("expected 2 compounds, got %d", len(got))
	}

	empty, err := s.GetByFormula(ctx, "Nope")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(empty) != 0 {
		t.Errorf("expected 0 compounds, got %d", len(empty))
	}
}

func TestCompoundList(t *testing.T) {
	db := openSQLiteTestDB(t)
	s := &CompoundStore{DB: db, Driver: "sqlite3"}
	ctx := context.Background()

	seedCompound(t, s, "A", "H2", "1-1-1", "H")
	seedCompound(t, s, "B", "O2", "2-2-2", "O")
	seedCompound(t, s, "C", "N2", "3-3-3", "N")

	cases := []struct {
		name      string
		limit     int
		offset    int
		wantCount int
	}{
		{"all", 10, 0, 3},
		{"first page", 2, 0, 2},
		{"second page", 10, 2, 1},
		{"negative limit clamps to zero", -1, 0, 0},
		{"huge limit caps at 100", 500, 0, 3},
		{"negative offset clamps to zero", 10, -5, 3},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := s.List(ctx, tc.limit, tc.offset)
			if err != nil {
				t.Fatalf("expected no error, got %v", err)
			}
			if len(got) != tc.wantCount {
				t.Errorf("expected %d compounds, got %d", tc.wantCount, len(got))
			}
		})
	}
}

func TestCompoundSearchSQLite(t *testing.T) {
	db := openSQLiteTestDB(t)
	s := &CompoundStore{DB: db, Driver: "sqlite3"}
	ctx := context.Background()

	seedCompound(t, s, "Aspirin", "C9H8O4", "50-78-2", "CC(=O)Oc1ccccc1")
	seedCompound(t, s, "Caffeine", "C8H10N4O2", "58-08-2", "Cn1c(=O)n(C)")

	cases := []struct {
		name      string
		term      string
		field     string
		limit     int
		offset    int
		wantNames []string
	}{
		{"by name", "spir", "name", 10, 0, []string{"Aspirin"}},
		{"by formula", "C8H10", "formula", 10, 0, []string{"Caffeine"}},
		{"by cas", "58-08", "cas", 10, 0, []string{"Caffeine"}},
		{"by smiles", "Cn1", "smiles", 10, 0, []string{"Caffeine"}},
		{"all columns", "Aspirin", "", 10, 0, []string{"Aspirin"}},
		{"unknown field searches all", "Caffeine", "bogus", 10, 0, []string{"Caffeine"}},
		{"no match", "zzz-no-such-compound", "", 10, 0, nil},
		{"huge limit caps", "Aspirin", "", 500, 0, []string{"Aspirin"}},
		{"negative limit clamps to zero", "Aspirin", "", -1, 0, nil},
		{"negative offset clamps to zero", "Aspirin", "", 10, -5, []string{"Aspirin"}},
		{"literal percent", "100%", "", 10, 0, nil},
		{"literal underscore", "a_b", "", 10, 0, nil},
		{"literal backslash", `a\b`, "", 10, 0, nil},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := s.Search(ctx, tc.term, tc.field, tc.limit, tc.offset)
			if err != nil {
				t.Fatalf("expected no error, got %v", err)
			}
			if len(got) != len(tc.wantNames) {
				t.Fatalf("expected %d results, got %d", len(tc.wantNames), len(got))
			}
			for i, want := range tc.wantNames {
				if got[i].Name != want {
					t.Errorf("expected result %d name %q, got %q", i, want, got[i].Name)
				}
			}
		})
	}
}

func TestCompoundDelete(t *testing.T) {
	db := openSQLiteTestDB(t)
	s := &CompoundStore{DB: db, Driver: "sqlite3"}
	ctx := context.Background()

	created := seedCompound(t, s, "Aspirin", "C9H8O4", "50-78-2", "CC(=O)O")
	if err := s.Delete(ctx, created.ID); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if _, err := s.GetByID(ctx, created.ID); err == nil {
		t.Error("expected error after delete, got nil")
	}
}

func closedTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	if err := db.Close(); err != nil {
		t.Fatal(err)
	}
	return db
}

func TestCompoundStoreQueryErrors(t *testing.T) {
	db := closedTestDB(t)
	s := &CompoundStore{DB: db, Driver: "sqlite3"}
	ctx := context.Background()
	id := uuid.New()

	if err := s.Create(ctx, &Compound{Name: "x"}); err == nil {
		t.Error("expected create error, got nil")
	}
	if _, err := s.GetByID(ctx, id); err == nil {
		t.Error("expected GetByID error, got nil")
	}
	if _, err := s.GetByFormula(ctx, "H2O"); err == nil {
		t.Error("expected GetByFormula error, got nil")
	}
	if _, err := s.GetByCAS(ctx, "00-00-0"); err == nil {
		t.Error("expected GetByCAS error, got nil")
	}
	if _, err := s.Search(ctx, "x", "", 10, 0); err == nil {
		t.Error("expected Search error, got nil")
	}
	if _, err := s.List(ctx, 10, 0); err == nil {
		t.Error("expected List error, got nil")
	}
	if err := s.Delete(ctx, id); err == nil {
		t.Error("expected Delete error, got nil")
	}
}

func TestCompoundStoreScanErrors(t *testing.T) {
	ctx := context.Background()

	t.Run("GetByID", func(t *testing.T) {
		db := openSQLiteTestDB(t)
		id := uuid.New().String()
		insertBadCompoundRow(t, db, id, "Bad", "C1", "9-9-9")
		s := &CompoundStore{DB: db, Driver: "sqlite3"}
		parsed, _ := uuid.Parse(id)
		if _, err := s.GetByID(ctx, parsed); err == nil {
			t.Error("expected scan error, got nil")
		}
	})

	t.Run("GetByFormula", func(t *testing.T) {
		db := openSQLiteTestDB(t)
		insertBadCompoundRow(t, db, uuid.New().String(), "Bad", "ZZZ", "9-9-9")
		s := &CompoundStore{DB: db, Driver: "sqlite3"}
		if _, err := s.GetByFormula(ctx, "ZZZ"); err == nil {
			t.Error("expected scan error, got nil")
		}
	})

	t.Run("GetByCAS", func(t *testing.T) {
		db := openSQLiteTestDB(t)
		insertBadCompoundRow(t, db, uuid.New().String(), "Bad", "C1", "BAD-CAS-1")
		s := &CompoundStore{DB: db, Driver: "sqlite3"}
		if _, err := s.GetByCAS(ctx, "BAD-CAS-1"); err == nil {
			t.Error("expected scan error, got nil")
		}
	})

	t.Run("Search", func(t *testing.T) {
		db := openSQLiteTestDB(t)
		insertBadCompoundRow(t, db, uuid.New().String(), "BadSearchMarker", "C1", "9-9-9")
		s := &CompoundStore{DB: db, Driver: "sqlite3"}
		if _, err := s.Search(ctx, "BadSearchMarker", "", 10, 0); err == nil {
			t.Error("expected scan error, got nil")
		}
	})

	t.Run("List", func(t *testing.T) {
		db := openSQLiteTestDB(t)
		insertBadCompoundRow(t, db, uuid.New().String(), "Bad", "C1", "9-9-9")
		s := &CompoundStore{DB: db, Driver: "sqlite3"}
		if _, err := s.List(ctx, 10, 0); err == nil {
			t.Error("expected scan error, got nil")
		}
	})
}

func TestPluginStoreCRUD(t *testing.T) {
	db := openSQLiteTestDB(t)
	s := &PluginStore{DB: db, Driver: "sqlite3"}
	ctx := context.Background()

	p := &Plugin{Name: "NMR", Version: "2.0.0", Author: "lab", Manifest: "{}", Enabled: true}
	if err := s.Create(ctx, p); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if p.ID == uuid.Nil {
		t.Error("expected non-zero ID after create")
	}

	got, err := s.GetByID(ctx, p.ID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if got.Name != "NMR" || got.Version != "2.0.0" || !got.Enabled {
		t.Errorf("roundtrip mismatch: %+v", got)
	}

	if _, err := s.GetByID(ctx, uuid.New()); err == nil {
		t.Error("expected error for unknown id, got nil")
	}

	listed, err := s.List(ctx)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(listed) != 1 {
		t.Fatalf("expected 1 plugin, got %d", len(listed))
	}

	if err := s.UpdateEnabled(ctx, p.ID, false); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	disabled, err := s.GetByID(ctx, p.ID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if disabled.Enabled {
		t.Error("expected plugin to be disabled")
	}

	if err := s.Delete(ctx, p.ID); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if _, err := s.GetByID(ctx, p.ID); err == nil {
		t.Error("expected error after delete, got nil")
	}
}

func TestPluginStoreQueryErrors(t *testing.T) {
	db := closedTestDB(t)
	s := &PluginStore{DB: db, Driver: "sqlite3"}
	ctx := context.Background()
	id := uuid.New()

	if err := s.Create(ctx, &Plugin{Name: "x"}); err == nil {
		t.Error("expected create error, got nil")
	}
	if _, err := s.GetByID(ctx, id); err == nil {
		t.Error("expected GetByID error, got nil")
	}
	if _, err := s.List(ctx); err == nil {
		t.Error("expected List error, got nil")
	}
	if err := s.UpdateEnabled(ctx, id, true); err == nil {
		t.Error("expected UpdateEnabled error, got nil")
	}
	if err := s.Delete(ctx, id); err == nil {
		t.Error("expected Delete error, got nil")
	}
}

func TestPluginStoreListScanError(t *testing.T) {
	db := openSQLiteTestDB(t)
	_, err := db.Exec(`INSERT INTO plugins (id, name, version, author, manifest, enabled, created_at)
		VALUES (?, 'Bad', '1.0.0', '', '{}', 'not-a-bool', '2026-10-03 00:00:00')`, uuid.New().String())
	if err != nil {
		t.Fatal(err)
	}
	s := &PluginStore{DB: db, Driver: "sqlite3"}
	if _, err := s.List(context.Background()); err == nil {
		t.Error("expected scan error, got nil")
	}
}

// fakePGDriver is a minimal database/sql driver that returns one canned
// compound row (or a forced error), letting the postgres Search branches run
// without a live server and without extra dependencies.
type fakePGStateT struct {
	failQuery bool
	badRow    bool
}

var fakePGState = &fakePGStateT{}

type fakePGDriver struct{}

func (d *fakePGDriver) Open(name string) (driver.Conn, error) { return &fakePGConn{}, nil }

type fakePGConn struct{}

func (c *fakePGConn) Prepare(query string) (driver.Stmt, error) {
	return nil, errors.New("fake-pg: prepare unsupported")
}

func (c *fakePGConn) Close() error { return nil }

func (c *fakePGConn) Begin() (driver.Tx, error) { return nil, errors.New("fake-pg: tx unsupported") }

func (c *fakePGConn) QueryContext(ctx context.Context, query string, args []driver.NamedValue) (driver.Rows, error) {
	if fakePGState.failQuery {
		return nil, errors.New("fake-pg: query failed")
	}
	return &fakePGRows{done: false}, nil
}

func (c *fakePGConn) ExecContext(ctx context.Context, query string, args []driver.NamedValue) (driver.Result, error) {
	return fakePGResult{}, nil
}

type fakePGResult struct{}

func (r fakePGResult) LastInsertId() (int64, error) { return 0, nil }
func (r fakePGResult) RowsAffected() (int64, error) { return 0, nil }

type fakePGRows struct{ done bool }

func (r *fakePGRows) Columns() []string {
	return []string{"id", "name", "formula", "cas_number", "smiles", "inchi", "molar_mass", "properties", "source", "created_at", "updated_at"}
}

func (r *fakePGRows) Close() error { return nil }

func (r *fakePGRows) Next(dest []driver.Value) error {
	if r.done {
		return io.EOF
	}
	r.done = true
	ts := time.Date(2026, time.October, 3, 0, 0, 0, 0, time.UTC)
	mass := driver.Value(float64(180.16))
	if fakePGState.badRow {
		mass = driver.Value("not-a-float")
	}
	dest[0] = "123e4567-e89b-12d3-a456-426614174000"
	dest[1] = "Fake"
	dest[2] = "F1"
	dest[3] = "00-00-1"
	dest[4] = "F"
	dest[5] = "InChI=1/F"
	dest[6] = mass
	dest[7] = "{}"
	dest[8] = "manual"
	dest[9] = ts
	dest[10] = ts
	return nil
}

func init() {
	sql.Register("fake-postgres", &fakePGDriver{})
}

func openFakePostgresStore() (*CompoundStore, *sql.DB) {
	db, err := sql.Open("fake-postgres", "")
	if err != nil {
		panic(err)
	}
	return &CompoundStore{DB: db, Driver: "postgres"}, db
}

func resetFakePGState(t *testing.T) {
	t.Helper()
	fakePGState.failQuery = false
	fakePGState.badRow = false
	t.Cleanup(func() {
		fakePGState.failQuery = false
		fakePGState.badRow = false
	})
}

func TestCompoundSearchPostgresFieldRestricted(t *testing.T) {
	resetFakePGState(t)
	s, db := openFakePostgresStore()
	defer db.Close()
	got, err := s.Search(context.Background(), "Fake", "name", 10, 0)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(got) != 1 || got[0].Name != "Fake" {
		t.Fatalf("expected one Fake result, got %+v", got)
	}
}

func TestCompoundSearchPostgresFullText(t *testing.T) {
	resetFakePGState(t)
	s, db := openFakePostgresStore()
	defer db.Close()
	got, err := s.Search(context.Background(), "Fake", "", -1, -2)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(got) != 1 {
		t.Fatalf("expected one result, got %d", len(got))
	}
}

func TestCompoundSearchPostgresQueryError(t *testing.T) {
	resetFakePGState(t)
	fakePGState.failQuery = true
	s, db := openFakePostgresStore()
	defer db.Close()
	if _, err := s.Search(context.Background(), "Fake", "", 10, 0); err == nil {
		t.Error("expected query error, got nil")
	}
}

func TestCompoundSearchPostgresScanError(t *testing.T) {
	resetFakePGState(t)
	fakePGState.badRow = true
	s, db := openFakePostgresStore()
	defer db.Close()
	if _, err := s.Search(context.Background(), "Fake", "", 10, 0); err == nil {
		t.Error("expected scan error, got nil")
	}
}

func TestSearchFieldsWhitelistComplete(t *testing.T) {
	// Locks the whitelist so a renamed column breaks this test loudly.
	for _, field := range []string{"name", "formula", "cas", "smiles"} {
		if _, ok := searchFields[field]; !ok {
			t.Errorf("expected search field %q in whitelist", field)
		}
	}
	if searchFields["cas"] != "cas_number" {
		t.Errorf("expected cas field to map to cas_number, got %q", searchFields["cas"])
	}
}
