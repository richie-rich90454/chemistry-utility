package compounds

import (
	"context"
	"fmt"

	"chemistry-utility/internal/db"

	"github.com/google/uuid"
)

// CompoundCache provides a caching layer that first checks the local
// database before falling back to the PubChem API.
type CompoundCache struct {
	store   *db.CompoundStore
	pubchem *PubChemClient
}

// NewCompoundCache creates a new CompoundCache with the given store and PubChem client.
func NewCompoundCache(store *db.CompoundStore, pubchem *PubChemClient) *CompoundCache {
	return &CompoundCache{
		store:   store,
		pubchem: pubchem,
	}
}

// Search searches for compounds first in the local database, then falls back
// to the PubChem API. Results from PubChem are cached in the local database
// with source="pubchem".
func (c *CompoundCache) Search(ctx context.Context, query string, searchType string) ([]db.Compound, error) {
	if c == nil || c.store == nil || c.pubchem == nil {
		return nil, fmt.Errorf("compound cache is not initialized")
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	// Try local DB first. If search fails (e.g., FTS not available),
	// fall through to PubChem rather than returning an error.
	localResults, err := c.store.Search(ctx, query, searchType, 10, 0)
	if err == nil && len(localResults) > 0 {
		results := make([]db.Compound, len(localResults))
		for i, r := range localResults {
			results[i] = *r
		}
		return results, nil
	}

	// Fall back to PubChem
	var remoteResults []db.Compound
	switch searchType {
	case "name":
		remoteResults, err = c.pubchem.SearchByName(ctx, query)
	case "formula":
		remoteResults, err = c.pubchem.SearchByFormula(ctx, query)
	case "smiles":
		remoteResults, err = c.pubchem.SearchBySMILES(ctx, query)
	case "cas":
		remoteResults, err = c.pubchem.SearchByCAS(ctx, query)
	default:
		remoteResults, err = c.pubchem.SearchByName(ctx, query)
	}

	if err != nil {
		return nil, fmt.Errorf("pubchem search: %w", err)
	}

	// Cache PubChem results in the local database, skipping rows already
	// present (same source, name, and formula) so repeated searches do not
	// insert duplicates.
	for i := range remoteResults {
		compound := &remoteResults[i]
		compound.Source = "pubchem"
		if c.isCached(ctx, compound) {
			continue
		}
		if saveErr := c.store.Create(ctx, compound); saveErr != nil {
			// Log the error but don't fail the search; caching is best-effort.
			// In production, replace with structured logging.
			_ = saveErr
		}
	}

	return remoteResults, nil
}

// isCached reports whether a compound with the same (source, name,
// formula) is already stored. Lookup failures return false so caching
// stays best-effort; the insert path is unchanged.
func (c *CompoundCache) isCached(ctx context.Context, compound *db.Compound) bool {
	existing, err := c.store.GetByFormula(ctx, compound.Formula)
	if err != nil {
		return false
	}
	for _, e := range existing {
		if e.Source == compound.Source && e.Name == compound.Name && e.Formula == compound.Formula {
			return true
		}
	}
	return false
}

// GetByID retrieves a compound from the local cache by its UUID.
func (c *CompoundCache) GetByID(ctx context.Context, id uuid.UUID) (db.Compound, error) {
	compound, err := c.store.GetByID(ctx, id)
	if err != nil {
		return db.Compound{}, fmt.Errorf("get by id: %w", err)
	}
	return *compound, nil
}
