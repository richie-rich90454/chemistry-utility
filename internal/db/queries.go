package db

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

func placeholder(driver string, query string) string {
	if driver == "postgres" {
		return query
	}
	idx := 1
	for {
		old := fmt.Sprintf("$%d", idx)
		if !strings.Contains(query, old) {
			break
		}
		query = strings.Replace(query, old, "?", 1)
		idx++
	}
	return query
}

type CompoundStore struct {
	DB     *sql.DB
	Driver string
}

func (s *CompoundStore) Create(ctx context.Context, c *Compound) error {
	c.ID = uuid.New()
	c.CreatedAt = time.Now()
	c.UpdatedAt = time.Now()
	query := placeholder(s.Driver, `INSERT INTO compounds (id, name, formula, cas_number, smiles, inchi, molar_mass, properties, source, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`)
	_, err := s.DB.ExecContext(ctx, query,
		c.ID, c.Name, c.Formula, c.CASNumber,
		c.SMILES, c.InChI, c.MolarMass, c.Properties,
		c.Source, c.CreatedAt, c.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create compound: %w", err)
	}
	return nil
}
func (s *CompoundStore) GetByID(ctx context.Context, id uuid.UUID) (*Compound, error) {
	query := placeholder(s.Driver, `SELECT id, name, formula, cas_number, smiles, inchi, molar_mass, properties, source, created_at, updated_at FROM compounds WHERE id = $1`)
	row := s.DB.QueryRowContext(ctx, query, id)
	var c Compound
	err := row.Scan(&c.ID, &c.Name, &c.Formula, &c.CASNumber,
		&c.SMILES, &c.InChI, &c.MolarMass, &c.Properties,
		&c.Source, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get compound by id: %w", err)
	}
	return &c, nil
}
func (s *CompoundStore) GetByFormula(ctx context.Context, formula string) ([]*Compound, error) {
	query := placeholder(s.Driver, `SELECT id, name, formula, cas_number, smiles, inchi, molar_mass, properties, source, created_at, updated_at FROM compounds WHERE formula = $1`)
	rows, err := s.DB.QueryContext(ctx, query, formula)
	if err != nil {
		return nil, fmt.Errorf("failed to get compounds by formula: %w", err)
	}
	defer rows.Close()
	var compounds []*Compound
	for rows.Next() {
		var c Compound
		if err := rows.Scan(&c.ID, &c.Name, &c.Formula, &c.CASNumber,
			&c.SMILES, &c.InChI, &c.MolarMass, &c.Properties,
			&c.Source, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan compound: %w", err)
		}
		compounds = append(compounds, &c)
	}
	return compounds, rows.Err()
}
func (s *CompoundStore) GetByCAS(ctx context.Context, casNumber string) (*Compound, error) {
	query := placeholder(s.Driver, `SELECT id, name, formula, cas_number, smiles, inchi, molar_mass, properties, source, created_at, updated_at FROM compounds WHERE cas_number = $1`)
	row := s.DB.QueryRowContext(ctx, query, casNumber)
	var c Compound
	err := row.Scan(&c.ID, &c.Name, &c.Formula, &c.CASNumber,
		&c.SMILES, &c.InChI, &c.MolarMass, &c.Properties,
		&c.Source, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get compound by CAS number: %w", err)
	}
	return &c, nil
}

// searchFields maps the public search-type values to compound columns.
// A whitelist (not string interpolation of user input) keeps this injection-safe.
var searchFields = map[string]string{
	"name":    "name",
	"formula": "formula",
	"cas":     "cas_number",
	"smiles":  "smiles",
}

// Search returns compounds matching term. field restricts the search to one
// column ("name", "formula", "cas", "smiles"); any other value searches all.
func (s *CompoundStore) Search(ctx context.Context, term, field string, limit, offset int) ([]*Compound, error) {
	if limit < 0 {
		limit = 0
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	const columns = `id, name, formula, cas_number, smiles, inchi, molar_mass, properties, source, created_at, updated_at`
	var query string
	var args []interface{}
	escapeLike := func(s string) string {
		return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
	}
	if s.Driver == "sqlite3" {
		// FTS5 requires the mattn/go-sqlite3 driver to be compiled with the
		// sqlite_fts5 tag, which CI and Makefile builds don't set. Use a
		// portable LIKE search instead so fresh databases work everywhere.
		escaped := escapeLike(term)
		pattern := "%" + escaped + "%"
		if col, ok := searchFields[field]; ok {
			query = `SELECT ` + columns + ` FROM compounds WHERE ` + col + ` LIKE ? ESCAPE '\' ORDER BY name LIMIT ? OFFSET ?`
			args = []interface{}{pattern, limit, offset}
		} else {
			query = `SELECT ` + columns + ` FROM compounds WHERE name LIKE ? ESCAPE '\' OR formula LIKE ? ESCAPE '\' OR cas_number LIKE ? ESCAPE '\' OR smiles LIKE ? ESCAPE '\' ORDER BY name LIMIT ? OFFSET ?`
			args = []interface{}{pattern, pattern, pattern, pattern, limit, offset}
		}
	} else {
		if col, ok := searchFields[field]; ok {
			escaped := escapeLike(term)
			pattern := "%" + escaped + "%"
			// ESCAPE '\' matches the sqlite branch so '%'/'_' are literal
			// on both drivers.
			query = `SELECT ` + columns + ` FROM compounds WHERE ` + col + ` ILIKE $1 ESCAPE '\' ORDER BY name LIMIT $2 OFFSET $3`
			args = []interface{}{pattern, limit, offset}
		} else {
			// plainto_tsquery tolerates arbitrary user input (no tsquery
			// metacharacter syntax errors) and ANDs the terms.
			query = `SELECT ` + columns + ` FROM compounds WHERE to_tsvector('english', name || ' ' || formula || ' ' || cas_number) @@ plainto_tsquery('english', $1) ORDER BY created_at DESC LIMIT $2 OFFSET $3`
			args = []interface{}{term, limit, offset}
		}
	}
	rows, err := s.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to search compounds: %w", err)
	}
	defer rows.Close()
	var compounds []*Compound
	for rows.Next() {
		var c Compound
		if err := rows.Scan(&c.ID, &c.Name, &c.Formula, &c.CASNumber,
			&c.SMILES, &c.InChI, &c.MolarMass, &c.Properties,
			&c.Source, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan compound: %w", err)
		}
		compounds = append(compounds, &c)
	}
	return compounds, rows.Err()
}
func (s *CompoundStore) Delete(ctx context.Context, id uuid.UUID) error {
	query := placeholder(s.Driver, `DELETE FROM compounds WHERE id = $1`)
	_, err := s.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete compound: %w", err)
	}
	return nil
}
func (s *CompoundStore) List(ctx context.Context, limit, offset int) ([]*Compound, error) {
	if limit < 0 {
		limit = 0
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	query := placeholder(s.Driver, `SELECT id, name, formula, cas_number, smiles, inchi, molar_mass, properties, source, created_at, updated_at FROM compounds ORDER BY created_at DESC LIMIT $1 OFFSET $2`)
	rows, err := s.DB.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list compounds: %w", err)
	}
	defer rows.Close()
	var compounds []*Compound
	for rows.Next() {
		var c Compound
		if err := rows.Scan(&c.ID, &c.Name, &c.Formula, &c.CASNumber,
			&c.SMILES, &c.InChI, &c.MolarMass, &c.Properties,
			&c.Source, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan compound: %w", err)
		}
		compounds = append(compounds, &c)
	}
	return compounds, rows.Err()
}

type PluginStore struct {
	DB     *sql.DB
	Driver string
}

func (s *PluginStore) Create(ctx context.Context, p *Plugin) error {
	p.ID = uuid.New()
	p.CreatedAt = time.Now()
	query := placeholder(s.Driver, `INSERT INTO plugins (id, name, version, author, manifest, enabled, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`)
	_, err := s.DB.ExecContext(ctx, query,
		p.ID, p.Name, p.Version, p.Author,
		p.Manifest, p.Enabled, p.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create plugin: %w", err)
	}
	return nil
}
func (s *PluginStore) GetByID(ctx context.Context, id uuid.UUID) (*Plugin, error) {
	query := placeholder(s.Driver, `SELECT id, name, version, author, manifest, enabled, created_at FROM plugins WHERE id = $1`)
	row := s.DB.QueryRowContext(ctx, query, id)
	var p Plugin
	err := row.Scan(&p.ID, &p.Name, &p.Version, &p.Author, &p.Manifest, &p.Enabled, &p.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get plugin by id: %w", err)
	}
	return &p, nil
}
func (s *PluginStore) List(ctx context.Context) ([]*Plugin, error) {
	query := placeholder(s.Driver, `SELECT id, name, version, author, manifest, enabled, created_at FROM plugins ORDER BY created_at DESC`)
	rows, err := s.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list plugins: %w", err)
	}
	defer rows.Close()
	var plugins []*Plugin
	for rows.Next() {
		var p Plugin
		if err := rows.Scan(&p.ID, &p.Name, &p.Version, &p.Author, &p.Manifest, &p.Enabled, &p.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan plugin: %w", err)
		}
		plugins = append(plugins, &p)
	}
	return plugins, rows.Err()
}
func (s *PluginStore) UpdateEnabled(ctx context.Context, id uuid.UUID, enabled bool) error {
	query := placeholder(s.Driver, `UPDATE plugins SET enabled = $1 WHERE id = $2`)
	_, err := s.DB.ExecContext(ctx, query, enabled, id)
	if err != nil {
		return fmt.Errorf("failed to update plugin enabled state: %w", err)
	}
	return nil
}
func (s *PluginStore) Delete(ctx context.Context, id uuid.UUID) error {
	query := placeholder(s.Driver, `DELETE FROM plugins WHERE id = $1`)
	_, err := s.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete plugin: %w", err)
	}
	return nil
}
