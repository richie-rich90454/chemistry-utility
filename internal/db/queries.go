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

type CalculationStore struct {
	DB     *sql.DB
	Driver string
}

func (s *CalculationStore) Create(ctx context.Context, c *Calculation) error {
	c.ID = uuid.New()
	c.CreatedAt = time.Now()
	query := placeholder(s.Driver, `INSERT INTO calculations (id, user_id, calculator_type, inputs, result, annotation, starred, workspace_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`)
	_, err := s.DB.ExecContext(ctx, query,
		c.ID, c.UserID, c.CalculatorType, c.Inputs,
		c.Result, c.Annotation, c.Starred, c.WorkspaceID,
		c.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create calculation: %w", err)
	}
	return nil
}
func (s *CalculationStore) GetByID(ctx context.Context, id uuid.UUID) (*Calculation, error) {
	query := placeholder(s.Driver, `SELECT id, user_id, calculator_type, inputs, result, annotation, starred, workspace_id, created_at FROM calculations WHERE id = $1`)
	row := s.DB.QueryRowContext(ctx, query, id)
	var c Calculation
	err := row.Scan(&c.ID, &c.UserID, &c.CalculatorType, &c.Inputs,
		&c.Result, &c.Annotation, &c.Starred, &c.WorkspaceID,
		&c.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get calculation by id: %w", err)
	}
	return &c, nil
}
func (s *CalculationStore) GetByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*Calculation, error) {
	query := placeholder(s.Driver, `SELECT id, user_id, calculator_type, inputs, result, annotation, starred, workspace_id, created_at FROM calculations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`)
	rows, err := s.DB.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get calculations by user id: %w", err)
	}
	defer rows.Close()
	var calcs []*Calculation
	for rows.Next() {
		var c Calculation
		if err := rows.Scan(&c.ID, &c.UserID, &c.CalculatorType, &c.Inputs,
			&c.Result, &c.Annotation, &c.Starred, &c.WorkspaceID,
			&c.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan calculation: %w", err)
		}
		calcs = append(calcs, &c)
	}
	return calcs, rows.Err()
}
func (s *CalculationStore) GetByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, limit, offset int) ([]*Calculation, error) {
	query := placeholder(s.Driver, `SELECT id, user_id, calculator_type, inputs, result, annotation, starred, workspace_id, created_at FROM calculations WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`)
	rows, err := s.DB.QueryContext(ctx, query, workspaceID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get calculations by workspace id: %w", err)
	}
	defer rows.Close()
	var calcs []*Calculation
	for rows.Next() {
		var c Calculation
		if err := rows.Scan(&c.ID, &c.UserID, &c.CalculatorType, &c.Inputs,
			&c.Result, &c.Annotation, &c.Starred, &c.WorkspaceID,
			&c.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan calculation: %w", err)
		}
		calcs = append(calcs, &c)
	}
	return calcs, rows.Err()
}
func (s *CalculationStore) UpdateAnnotation(ctx context.Context, id uuid.UUID, annotation string) error {
	query := placeholder(s.Driver, `UPDATE calculations SET annotation = $1 WHERE id = $2`)
	_, err := s.DB.ExecContext(ctx, query, annotation, id)
	if err != nil {
		return fmt.Errorf("failed to update calculation annotation: %w", err)
	}
	return nil
}
func (s *CalculationStore) ToggleStar(ctx context.Context, id uuid.UUID) (bool, error) {
	query := placeholder(s.Driver, `UPDATE calculations SET starred = NOT starred WHERE id = $1 RETURNING starred`)
	if s.Driver == "sqlite3" {
		getQuery := placeholder(s.Driver, `SELECT starred FROM calculations WHERE id = $1`)
		var current bool
		if err := s.DB.QueryRowContext(ctx, getQuery, id).Scan(&current); err != nil {
			return false, fmt.Errorf("failed to get calculation starred state: %w", err)
		}
		updateQuery := placeholder(s.Driver, `UPDATE calculations SET starred = $1 WHERE id = $2`)
		_, err := s.DB.ExecContext(ctx, updateQuery, !current, id)
		if err != nil {
			return false, fmt.Errorf("failed to toggle calculation star: %w", err)
		}
		return !current, nil
	}
	var starred bool
	err := s.DB.QueryRowContext(ctx, query, id).Scan(&starred)
	if err != nil {
		return false, fmt.Errorf("failed to toggle calculation star: %w", err)
	}
	return starred, nil
}
func (s *CalculationStore) Delete(ctx context.Context, id uuid.UUID) error {
	query := placeholder(s.Driver, `DELETE FROM calculations WHERE id = $1`)
	_, err := s.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete calculation: %w", err)
	}
	return nil
}
func (s *CalculationStore) List(ctx context.Context, limit, offset int) ([]*Calculation, error) {
	query := placeholder(s.Driver, `SELECT id, user_id, calculator_type, inputs, result, annotation, starred, workspace_id, created_at FROM calculations ORDER BY created_at DESC LIMIT $1 OFFSET $2`)
	rows, err := s.DB.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list calculations: %w", err)
	}
	defer rows.Close()
	var calcs []*Calculation
	for rows.Next() {
		var c Calculation
		if err := rows.Scan(&c.ID, &c.UserID, &c.CalculatorType, &c.Inputs,
			&c.Result, &c.Annotation, &c.Starred, &c.WorkspaceID,
			&c.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan calculation: %w", err)
		}
		calcs = append(calcs, &c)
	}
	return calcs, rows.Err()
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
func (s *CompoundStore) Search(ctx context.Context, term string, limit, offset int) ([]*Compound, error) {
	var query string
	var args []interface{}
	if s.Driver == "sqlite3" {
		// FTS5 requires the mattn/go-sqlite3 driver to be compiled with the
		// sqlite_fts5 tag, which CI and Makefile builds don't set. Use a
		// portable LIKE search instead so fresh databases work everywhere.
		escaped := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(term)
		pattern := "%" + escaped + "%"
		query = `SELECT id, name, formula, cas_number, smiles, inchi, molar_mass, properties, source, created_at, updated_at FROM compounds WHERE name LIKE ? ESCAPE '\' OR formula LIKE ? ESCAPE '\' OR cas_number LIKE ? ESCAPE '\' OR smiles LIKE ? ESCAPE '\' ORDER BY name LIMIT ? OFFSET ?`
		args = []interface{}{pattern, pattern, pattern, pattern, limit, offset}
	} else {
		query = `SELECT id, name, formula, cas_number, smiles, inchi, molar_mass, properties, source, created_at, updated_at FROM compounds WHERE to_tsvector('english', name || ' ' || formula || ' ' || cas_number) @@ to_tsquery($1) ORDER BY created_at DESC LIMIT $2 OFFSET $3`
		args = []interface{}{term, limit, offset}
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
