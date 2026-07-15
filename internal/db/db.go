package db
import (
	"database/sql"
	"fmt"
	"time"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)
type Config struct {
	Driver          string
	DSN             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
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
func New(cfg Config) (*sql.DB, error) {
	db, err := sql.Open(cfg.Driver, cfg.DSN)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	if err := runMigrations(db, cfg.Driver); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}
	return db, nil
}
func runMigrations(db *sql.DB, driver string) error {
	var migrateDriver string
	switch driver {
	case "sqlite3":
		migrateDriver = "sqlite3"
	case "postgres":
		migrateDriver = "postgres"
	default:
		return fmt.Errorf("unsupported driver for migrations: %s", driver)
	}
	m, err := migrate.New(
		"file://migrations",
		fmt.Sprintf("%s://", migrateDriver),
	)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to apply migrations: %w", err)
	}
	return nil
}
