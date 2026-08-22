package db

import (
	"database/sql"
	"fmt"
	"io/fs"
	"path/filepath"
	"strings"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	"github.com/golang-migrate/migrate/v4/source"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
)

type Config struct {
	Driver          string
	DSN             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	// Migrations embeds the SQL migration files (a filesystem rooted at the
	// directory that contains the "migrations" subfolder). When nil, the
	// CWD-relative "file://migrations" source is used.
	Migrations fs.FS
}

func DefaultConfig() Config {
	return Config{
		Driver:          "sqlite3",
		DSN:             "chemistry.db",
		MaxOpenConns:    25,
		MaxIdleConns:    5,
		ConnMaxLifetime: 5 * time.Minute,
	}
}

// withBusyTimeout adds SQLite's busy_timeout so concurrent writes on the
// app pool wait instead of failing with SQLITE_BUSY.
func withBusyTimeout(driver, dsn string) string {
	if driver != "sqlite3" || strings.HasPrefix(dsn, ":memory:") || strings.Contains(dsn, "busy_timeout") {
		return dsn
	}
	sep := "?"
	if strings.Contains(dsn, "?") {
		sep = "&"
	}
	return dsn + sep + "_busy_timeout=5000"
}
func New(cfg Config) (*sql.DB, error) {
	db, err := sql.Open(cfg.Driver, withBusyTimeout(cfg.Driver, cfg.DSN))
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	// Release the connection pool if setup fails after Open.
	defer func() {
		if err != nil {
			db.Close()
		}
	}()
	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	err = runMigrations(db, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}
	return db, nil
}
func runMigrations(db *sql.DB, cfg Config) error {
	var migrateDriver string
	switch cfg.Driver {
	case "sqlite3":
		migrateDriver = "sqlite3"
	case "postgres":
		migrateDriver = "postgres"
	default:
		return fmt.Errorf("unsupported driver for migrations: %s", cfg.Driver)
	}
	// Pass the configured DSN through so migrations apply to the same
	// database the app uses, not a fresh empty connection. The migrate
	// sqlite3 driver strips "sqlite3://" from the URL, so the DSN must be
	// encoded in a form that round-trips through net/url: "./relative.db"
	// for relative paths and "/C:/abs/path.db" for absolute Windows paths.
	migrateURL := cfg.DSN
	if !strings.Contains(migrateURL, "://") {
		if migrateDriver == "sqlite3" {
			dsn := filepath.ToSlash(cfg.DSN)
			if filepath.IsAbs(cfg.DSN) {
				dsn = "/" + dsn
			} else {
				dsn = "./" + dsn
			}
			migrateURL = "sqlite3://" + dsn
		} else {
			migrateURL = fmt.Sprintf("%s://%s", migrateDriver, cfg.DSN)
		}
	}
	var m *migrate.Migrate
	var err error
	if cfg.Migrations != nil {
		var src source.Driver
		src, err = iofs.New(cfg.Migrations, "migrations")
		if err != nil {
			return fmt.Errorf("failed to create embedded migration source: %w", err)
		}
		var dbDriver database.Driver
		dbDriver, err = database.Open(migrateURL)
		if err != nil {
			return fmt.Errorf("failed to open migration database: %w", err)
		}
		m, err = migrate.NewWithInstance("iofs", src, migrateDriver, dbDriver)
	} else {
		m, err = migrate.New("file://migrations", migrateURL)
	}
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to apply migrations: %w", err)
	}
	return nil
}
