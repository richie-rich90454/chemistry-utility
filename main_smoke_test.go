package main

import (
	"os"
	"path/filepath"
	"testing"

	"chemistry-utility/internal/db"
)

// TestEmbeddedMigrationsSmoke verifies the desktop app's DB path: embedded
// migrations applied to a fresh sqlite file via the iofs source.
func TestEmbeddedMigrationsSmoke(t *testing.T) {
	dir, err := os.MkdirTemp("", "db-smoke")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)
	cfg := db.Config{
		Driver:          "sqlite3",
		DSN:             filepath.Join(dir, "test.db"),
		MaxOpenConns:    5,
		MaxIdleConns:    2,
		ConnMaxLifetime: 0,
		Migrations:      migrationsFS,
	}
	if _, err := db.New(cfg); err != nil {
		t.Fatalf("embedded migrations failed: %v", err)
	}
}
