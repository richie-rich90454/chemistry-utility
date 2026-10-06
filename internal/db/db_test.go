package db

import (
	"path/filepath"
	"testing"
	"testing/fstest"
	"time"
)

func goodMigrationsFS() fstest.MapFS {
	return fstest.MapFS{
		"migrations/1_init.up.sql": {Data: []byte(`CREATE TABLE IF NOT EXISTS migration_probe (id TEXT PRIMARY KEY);`)},
	}
}

func badMigrationsFS() fstest.MapFS {
	return fstest.MapFS{
		"migrations/1_broken.up.sql": {Data: []byte(`CREATE TABL IF NOT EXISTS broken (id TEXT;`)},
	}
}

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()
	if cfg.Driver != "sqlite3" {
		t.Errorf("expected driver sqlite3, got %q", cfg.Driver)
	}
	if cfg.DSN != "chemistry.db" {
		t.Errorf("expected DSN chemistry.db, got %q", cfg.DSN)
	}
	if cfg.MaxOpenConns != 25 {
		t.Errorf("expected MaxOpenConns 25, got %d", cfg.MaxOpenConns)
	}
	if cfg.MaxIdleConns != 5 {
		t.Errorf("expected MaxIdleConns 5, got %d", cfg.MaxIdleConns)
	}
	if cfg.ConnMaxLifetime != 5*time.Minute {
		t.Errorf("expected ConnMaxLifetime 5m, got %v", cfg.ConnMaxLifetime)
	}
}

func TestWithBusyTimeout(t *testing.T) {
	cases := []struct {
		name   string
		driver string
		dsn    string
		want   string
	}{
		{"sqlite file appends question-mark param", "sqlite3", "app.db", "app.db?_busy_timeout=5000"},
		{"sqlite existing params appends ampersand param", "sqlite3", "app.db?cache=shared", "app.db?cache=shared&_busy_timeout=5000"},
		{"sqlite memory untouched", "sqlite3", ":memory:", ":memory:"},
		{"sqlite memory with params untouched", "sqlite3", ":memory:?cache=shared", ":memory:?cache=shared"},
		{"sqlite existing timeout untouched", "sqlite3", "app.db?_busy_timeout=1000", "app.db?_busy_timeout=1000"},
		{"postgres untouched", "postgres", "host=db user=u password=p", "host=db user=u password=p"},
		{"other driver untouched", "mysql", "app.db", "app.db"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := withBusyTimeout(tc.driver, tc.dsn); got != tc.want {
				t.Errorf("expected %q, got %q", tc.want, got)
			}
		})
	}
}

func TestNewInvalidDriver(t *testing.T) {
	if _, err := New(Config{Driver: "no-such-driver", DSN: "x"}); err == nil {
		t.Error("expected error for unknown driver, got nil")
	}
}

func TestNewPingFailure(t *testing.T) {
	dsn := filepath.Join(t.TempDir(), "missing-dir", "app.db")
	cfg := DefaultConfig()
	cfg.DSN = dsn
	cfg.Migrations = goodMigrationsFS()
	if _, err := New(cfg); err == nil {
		t.Error("expected ping error for unwritable path, got nil")
	}
}

func TestNewMigrationSourceFailure(t *testing.T) {
	// Migrations == nil falls back to file://migrations, which does not
	// exist under internal/db.
	cfg := DefaultConfig()
	cfg.DSN = filepath.Join(t.TempDir(), "app.db")
	cfg.Migrations = nil
	if _, err := New(cfg); err == nil {
		t.Error("expected migration source error, got nil")
	}
}

func TestNewMigrationApplyFailure(t *testing.T) {
	cfg := DefaultConfig()
	cfg.DSN = filepath.Join(t.TempDir(), "app.db")
	cfg.Migrations = badMigrationsFS()
	if _, err := New(cfg); err == nil {
		t.Error("expected migration apply error, got nil")
	}
}

func TestNewSuccessAbsolutePath(t *testing.T) {
	cfg := DefaultConfig()
	cfg.DSN = filepath.Join(t.TempDir(), "app.db")
	cfg.Migrations = goodMigrationsFS()
	database, err := New(cfg)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	defer database.Close()
	var name string
	err = database.QueryRow(`SELECT name FROM sqlite_master WHERE type='table' AND name='migration_probe'`).Scan(&name)
	if err != nil {
		t.Fatalf("expected migration_probe table, got %v", err)
	}
	if name != "migration_probe" {
		t.Errorf("expected migration_probe, got %q", name)
	}
}

func TestNewSuccessRelativePath(t *testing.T) {
	t.Chdir(t.TempDir())
	cfg := DefaultConfig()
	cfg.DSN = "relative.db"
	cfg.Migrations = goodMigrationsFS()
	database, err := New(cfg)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	defer database.Close()
	if err := database.Ping(); err != nil {
		t.Fatalf("expected ping success, got %v", err)
	}
}

func TestRunMigrationsUnsupportedDriver(t *testing.T) {
	if err := runMigrations(nil, Config{Driver: "oracle", DSN: "x"}); err == nil {
		t.Error("expected unsupported driver error, got nil")
	}
}

func TestRunMigrationsBadSource(t *testing.T) {
	cfg := Config{Driver: "sqlite3", DSN: "app.db", Migrations: fstest.MapFS{}}
	if err := runMigrations(nil, cfg); err == nil {
		t.Error("expected embedded source error, got nil")
	}
}

func TestRunMigrationsBadDatabaseURL(t *testing.T) {
	// DSN already containing "://" skips the sqlite rewrite, then the
	// migrate database registry rejects the unknown scheme.
	cfg := Config{Driver: "sqlite3", DSN: "wibble://example", Migrations: goodMigrationsFS()}
	if err := runMigrations(nil, cfg); err == nil {
		t.Error("expected database open error, got nil")
	}
}

func TestRunMigrationsPostgresDSNWithoutScheme(t *testing.T) {
	// Exercises the postgres migrateDriver case plus the Sprintf URL build.
	// Port 1 refuses fast so the failure is immediate, not a timeout.
	cfg := Config{Driver: "postgres", DSN: "localhost:1/db?sslmode=disable", Migrations: goodMigrationsFS()}
	if err := runMigrations(nil, cfg); err == nil {
		t.Error("expected postgres connection error, got nil")
	}
}

func TestRunMigrationsPostgresDSNWithScheme(t *testing.T) {
	// Exercises the skip-rewrite path (DSN already contains "://").
	cfg := Config{Driver: "postgres", DSN: "postgres://localhost:1/db?sslmode=disable", Migrations: goodMigrationsFS()}
	if err := runMigrations(nil, cfg); err == nil {
		t.Error("expected postgres connection error, got nil")
	}
}
