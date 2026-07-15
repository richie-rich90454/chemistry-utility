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
type UserStore struct {
	DB     *sql.DB
	Driver string
}
func (s *UserStore) Create(ctx context.Context, u *User) error {
	u.ID = uuid.New()
	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()
	query := placeholder(s.Driver, `INSERT INTO users (id, email, password_hash, name, role, email_verified, oauth_provider, oauth_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`)
	_, err := s.DB.ExecContext(ctx, query,
		u.ID, u.Email, u.PasswordHash, u.Name, u.Role,
		u.EmailVerified, u.OAuthProvider, u.OAuthID,
		u.CreatedAt, u.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}
func (s *UserStore) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	query := placeholder(s.Driver, `SELECT id, email, password_hash, name, role, email_verified, oauth_provider, oauth_id, created_at, updated_at FROM users WHERE id = $1`)
	row := s.DB.QueryRowContext(ctx, query, id)
	var u User
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role,
		&u.EmailVerified, &u.OAuthProvider, &u.OAuthID,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}
	return &u, nil
}
func (s *UserStore) GetByEmail(ctx context.Context, email string) (*User, error) {
	query := placeholder(s.Driver, `SELECT id, email, password_hash, name, role, email_verified, oauth_provider, oauth_id, created_at, updated_at FROM users WHERE email = $1`)
	row := s.DB.QueryRowContext(ctx, query, email)
	var u User
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role,
		&u.EmailVerified, &u.OAuthProvider, &u.OAuthID,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}
	return &u, nil
}
func (s *UserStore) Update(ctx context.Context, u *User) error {
	u.UpdatedAt = time.Now()
	query := placeholder(s.Driver, `UPDATE users SET email = $1, password_hash = $2, name = $3, role = $4, email_verified = $5, oauth_provider = $6, oauth_id = $7, updated_at = $8 WHERE id = $9`)
	_, err := s.DB.ExecContext(ctx, query,
		u.Email, u.PasswordHash, u.Name, u.Role,
		u.EmailVerified, u.OAuthProvider, u.OAuthID,
		u.UpdatedAt, u.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}
func (s *UserStore) Delete(ctx context.Context, id uuid.UUID) error {
	query := placeholder(s.Driver, `DELETE FROM users WHERE id = $1`)
	_, err := s.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}
func (s *UserStore) List(ctx context.Context, limit, offset int) ([]*User, error) {
	query := placeholder(s.Driver, `SELECT id, email, password_hash, name, role, email_verified, oauth_provider, oauth_id, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`)
	rows, err := s.DB.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()
	var users []*User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role,
			&u.EmailVerified, &u.OAuthProvider, &u.OAuthID,
			&u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, &u)
	}
	return users, rows.Err()
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
type WorkspaceStore struct {
	DB     *sql.DB
	Driver string
}
func (s *WorkspaceStore) Create(ctx context.Context, w *Workspace) error {
	w.ID = uuid.New()
	w.CreatedAt = time.Now()
	w.UpdatedAt = time.Now()
	query := placeholder(s.Driver, `INSERT INTO workspaces (id, name, description, owner_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`)
	_, err := s.DB.ExecContext(ctx, query,
		w.ID, w.Name, w.Description, w.OwnerID,
		w.CreatedAt, w.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create workspace: %w", err)
	}
	return nil
}
func (s *WorkspaceStore) GetByID(ctx context.Context, id uuid.UUID) (*Workspace, error) {
	query := placeholder(s.Driver, `SELECT id, name, description, owner_id, created_at, updated_at FROM workspaces WHERE id = $1`)
	row := s.DB.QueryRowContext(ctx, query, id)
	var w Workspace
	err := row.Scan(&w.ID, &w.Name, &w.Description, &w.OwnerID, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get workspace by id: %w", err)
	}
	return &w, nil
}
func (s *WorkspaceStore) GetByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*Workspace, error) {
	query := placeholder(s.Driver, `SELECT w.id, w.name, w.description, w.owner_id, w.created_at, w.updated_at FROM workspaces w JOIN workspace_members wm ON w.id = wm.workspace_id WHERE wm.user_id = $1 ORDER BY w.created_at DESC LIMIT $2 OFFSET $3`)
	rows, err := s.DB.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get workspaces by user id: %w", err)
	}
	defer rows.Close()
	var workspaces []*Workspace
	for rows.Next() {
		var w Workspace
		if err := rows.Scan(&w.ID, &w.Name, &w.Description, &w.OwnerID, &w.CreatedAt, &w.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan workspace: %w", err)
		}
		workspaces = append(workspaces, &w)
	}
	return workspaces, rows.Err()
}
func (s *WorkspaceStore) Update(ctx context.Context, w *Workspace) error {
	w.UpdatedAt = time.Now()
	query := placeholder(s.Driver, `UPDATE workspaces SET name = $1, description = $2, updated_at = $3 WHERE id = $4`)
	_, err := s.DB.ExecContext(ctx, query, w.Name, w.Description, w.UpdatedAt, w.ID)
	if err != nil {
		return fmt.Errorf("failed to update workspace: %w", err)
	}
	return nil
}
func (s *WorkspaceStore) Delete(ctx context.Context, id uuid.UUID) error {
	query := placeholder(s.Driver, `DELETE FROM workspaces WHERE id = $1`)
	_, err := s.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete workspace: %w", err)
	}
	return nil
}
func (s *WorkspaceStore) AddMember(ctx context.Context, wm *WorkspaceMember) error {
	wm.JoinedAt = time.Now()
	query := placeholder(s.Driver, `INSERT INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES ($1, $2, $3, $4)`)
	_, err := s.DB.ExecContext(ctx, query, wm.WorkspaceID, wm.UserID, wm.Role, wm.JoinedAt)
	if err != nil {
		return fmt.Errorf("failed to add workspace member: %w", err)
	}
	return nil
}
func (s *WorkspaceStore) RemoveMember(ctx context.Context, workspaceID, userID uuid.UUID) error {
	query := placeholder(s.Driver, `DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`)
	_, err := s.DB.ExecContext(ctx, query, workspaceID, userID)
	if err != nil {
		return fmt.Errorf("failed to remove workspace member: %w", err)
	}
	return nil
}
func (s *WorkspaceStore) GetMembers(ctx context.Context, workspaceID uuid.UUID) ([]*WorkspaceMember, error) {
	query := placeholder(s.Driver, `SELECT workspace_id, user_id, role, joined_at FROM workspace_members WHERE workspace_id = $1 ORDER BY joined_at ASC`)
	rows, err := s.DB.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get workspace members: %w", err)
	}
	defer rows.Close()
	var members []*WorkspaceMember
	for rows.Next() {
		var m WorkspaceMember
		if err := rows.Scan(&m.WorkspaceID, &m.UserID, &m.Role, &m.JoinedAt); err != nil {
			return nil, fmt.Errorf("failed to scan workspace member: %w", err)
		}
		members = append(members, &m)
	}
	return members, rows.Err()
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
		query = `SELECT id, name, formula, cas_number, smiles, inchi, molar_mass, properties, source, created_at, updated_at FROM compounds_fts WHERE compounds_fts MATCH ? ORDER BY rank LIMIT ? OFFSET ?`
		args = []interface{}{term, limit, offset}
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
type APIKeyStore struct {
	DB     *sql.DB
	Driver string
}
func (s *APIKeyStore) Create(ctx context.Context, a *APIKey) error {
	a.ID = uuid.New()
	a.CreatedAt = time.Now()
	query := placeholder(s.Driver, `INSERT INTO api_keys (id, user_id, name, key_hash, last_used_at, created_at) VALUES ($1, $2, $3, $4, $5, $6)`)
	_, err := s.DB.ExecContext(ctx, query,
		a.ID, a.UserID, a.Name, a.KeyHash,
		a.LastUsedAt, a.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create api key: %w", err)
	}
	return nil
}
func (s *APIKeyStore) GetByID(ctx context.Context, id uuid.UUID) (*APIKey, error) {
	query := placeholder(s.Driver, `SELECT id, user_id, name, key_hash, last_used_at, created_at FROM api_keys WHERE id = $1`)
	row := s.DB.QueryRowContext(ctx, query, id)
	var a APIKey
	err := row.Scan(&a.ID, &a.UserID, &a.Name, &a.KeyHash, &a.LastUsedAt, &a.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get api key by id: %w", err)
	}
	return &a, nil
}
func (s *APIKeyStore) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*APIKey, error) {
	query := placeholder(s.Driver, `SELECT id, user_id, name, key_hash, last_used_at, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`)
	rows, err := s.DB.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get api keys by user id: %w", err)
	}
	defer rows.Close()
	var keys []*APIKey
	for rows.Next() {
		var a APIKey
		if err := rows.Scan(&a.ID, &a.UserID, &a.Name, &a.KeyHash, &a.LastUsedAt, &a.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan api key: %w", err)
		}
		keys = append(keys, &a)
	}
	return keys, rows.Err()
}
func (s *APIKeyStore) GetByKeyHash(ctx context.Context, keyHash string) (*APIKey, error) {
	query := placeholder(s.Driver, `SELECT id, user_id, name, key_hash, last_used_at, created_at FROM api_keys WHERE key_hash = $1`)
	row := s.DB.QueryRowContext(ctx, query, keyHash)
	var a APIKey
	err := row.Scan(&a.ID, &a.UserID, &a.Name, &a.KeyHash, &a.LastUsedAt, &a.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get api key by hash: %w", err)
	}
	return &a, nil
}
func (s *APIKeyStore) UpdateLastUsed(ctx context.Context, id uuid.UUID) error {
	query := placeholder(s.Driver, `UPDATE api_keys SET last_used_at = $1 WHERE id = $2`)
	_, err := s.DB.ExecContext(ctx, query, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update api key last used: %w", err)
	}
	return nil
}
func (s *APIKeyStore) Delete(ctx context.Context, id uuid.UUID) error {
	query := placeholder(s.Driver, `DELETE FROM api_keys WHERE id = $1`)
	_, err := s.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete api key: %w", err)
	}
	return nil
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
type AnalyticsStore struct {
	DB     *sql.DB
	Driver string
}
func (s *AnalyticsStore) Create(ctx context.Context, e *AnalyticsEvent) error {
	e.ID = uuid.New()
	e.CreatedAt = time.Now()
	query := placeholder(s.Driver, `INSERT INTO analytics_events (id, user_id, event_type, event_data, created_at) VALUES ($1, $2, $3, $4, $5)`)
	_, err := s.DB.ExecContext(ctx, query,
		e.ID, e.UserID, e.EventType, e.EventData, e.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create analytics event: %w", err)
	}
	return nil
}
func (s *AnalyticsStore) GetByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*AnalyticsEvent, error) {
	query := placeholder(s.Driver, `SELECT id, user_id, event_type, event_data, created_at FROM analytics_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`)
	rows, err := s.DB.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get analytics events by user id: %w", err)
	}
	defer rows.Close()
	var events []*AnalyticsEvent
	for rows.Next() {
		var e AnalyticsEvent
		if err := rows.Scan(&e.ID, &e.UserID, &e.EventType, &e.EventData, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan analytics event: %w", err)
		}
		events = append(events, &e)
	}
	return events, rows.Err()
}
func (s *AnalyticsStore) GetByEventType(ctx context.Context, eventType string, limit, offset int) ([]*AnalyticsEvent, error) {
	query := placeholder(s.Driver, `SELECT id, user_id, event_type, event_data, created_at FROM analytics_events WHERE event_type = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`)
	rows, err := s.DB.QueryContext(ctx, query, eventType, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get analytics events by event type: %w", err)
	}
	defer rows.Close()
	var events []*AnalyticsEvent
	for rows.Next() {
		var e AnalyticsEvent
		if err := rows.Scan(&e.ID, &e.UserID, &e.EventType, &e.EventData, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan analytics event: %w", err)
		}
		events = append(events, &e)
	}
	return events, rows.Err()
}
func (s *AnalyticsStore) GetOverview(ctx context.Context) (map[string]int64, error) {
	stats := make(map[string]int64)
	var userCount, calcCount, workspaceCount, compoundCount int64
	query := placeholder(s.Driver, `SELECT COUNT(*) FROM users`)
	if err := s.DB.QueryRowContext(ctx, query).Scan(&userCount); err != nil {
		return nil, fmt.Errorf("failed to get user count: %w", err)
	}
	stats["users"] = userCount
	query = placeholder(s.Driver, `SELECT COUNT(*) FROM calculations`)
	if err := s.DB.QueryRowContext(ctx, query).Scan(&calcCount); err != nil {
		return nil, fmt.Errorf("failed to get calculation count: %w", err)
	}
	stats["calculations"] = calcCount
	query = placeholder(s.Driver, `SELECT COUNT(*) FROM workspaces`)
	if err := s.DB.QueryRowContext(ctx, query).Scan(&workspaceCount); err != nil {
		return nil, fmt.Errorf("failed to get workspace count: %w", err)
	}
	stats["workspaces"] = workspaceCount
	query = placeholder(s.Driver, `SELECT COUNT(*) FROM compounds`)
	if err := s.DB.QueryRowContext(ctx, query).Scan(&compoundCount); err != nil {
		return nil, fmt.Errorf("failed to get compound count: %w", err)
	}
	stats["compounds"] = compoundCount
	return stats, nil
}
func (s *AnalyticsStore) GetDAU(ctx context.Context, date time.Time) (int64, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)
	query := placeholder(s.Driver, `SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE created_at >= $1 AND created_at < $2`)
	var count int64
	err := s.DB.QueryRowContext(ctx, query, startOfDay, endOfDay).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get DAU: %w", err)
	}
	return count, nil
}
