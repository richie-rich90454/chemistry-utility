package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// searchCompounds searches compounds by query string.
func (a *API) searchCompounds(c *gin.Context) {
	if !a.requireDB(c) {
		return
	}
	q := c.Query("q")
	if q == "" {
		WriteValidation(c, "missing search query parameter 'q'")
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit < 1 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	// Optional search-type filter: name, formula, cas, or smiles.
	field := c.Query("type")

	compounds, err := a.compoundStore.Search(c.Request.Context(), q, field, limit, offset)
	if err != nil {
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"compounds": compounds,
		"query":     q,
	})
}

// getCompound returns a compound by ID.
func (a *API) getCompound(c *gin.Context) {
	if !a.requireDB(c) {
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		WriteValidation(c, "invalid compound id")
		return
	}

	compound, err := a.compoundStore.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			WriteNotFound(c, "compound not found")
			return
		}
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, compound)
}

// pubchemBaseURL is the PUG-REST root used by the stateless compound lookup.
// It is a variable (not a constant) so tests can point it at a mock server.
var pubchemBaseURL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"

// pubchemHTTPClient bounds each upstream call; per-request contexts add a
// tighter overall deadline on top.
var pubchemHTTPClient = &http.Client{Timeout: 10 * time.Second}

// lookupRate* serializes PubChem upstream calls to at most one per interval
// (default 200ms, i.e. 5 req/s, matching PubChem's usage guidance).
var (
	lookupRateMu       sync.Mutex
	lookupRateLast     time.Time
	lookupRateInterval = 200 * time.Millisecond
)

func waitLookupRate() {
	lookupRateMu.Lock()
	defer lookupRateMu.Unlock()
	if wait := lookupRateInterval - time.Since(lookupRateLast); wait > 0 {
		time.Sleep(wait)
	}
	lookupRateLast = time.Now()
}

// errUpstreamRateLimited marks a 429 from PubChem so the handler can relay
// the status instead of collapsing it into a generic 500.
var errUpstreamRateLimited = errors.New("pubchem rate limit exceeded")

// lookupCompound mirrors the db.Compound JSON shape (PascalCase keys) so the
// stateless web lookup and the desktop DB search return identical envelopes.
type lookupCompound struct {
	ID         string    `json:"ID"`
	Name       string    `json:"Name"`
	Formula    string    `json:"Formula"`
	CASNumber  string    `json:"CASNumber"`
	SMILES     string    `json:"SMILES"`
	InChI      string    `json:"InChI"`
	MolarMass  float64   `json:"MolarMass"`
	Properties string    `json:"Properties"`
	Source     string    `json:"Source"`
	CreatedAt  time.Time `json:"CreatedAt"`
	UpdatedAt  time.Time `json:"UpdatedAt"`
}

// lookupNamespace maps the public search-type filter to a PUG-REST namespace.
// isCAS reports the xref/RN/ route used for CAS registry numbers.
func lookupNamespace(searchType string) (namespace string, isCAS bool, ok bool) {
	switch searchType {
	case "", "name":
		return "name", false, true
	case "formula":
		return "formula", false, true
	case "smiles":
		return "smiles", false, true
	case "cas":
		return "xref", true, true
	default:
		return "", false, false
	}
}

// lookupCompounds proxies PubChem PUG-REST for compound search. It is
// stateless by design: it performs no database reads or writes, so it works
// on the anonymous web build (which has no database) and retains nothing —
// results are fetched upstream per request and never stored.
func (a *API) lookupCompounds(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if q == "" {
		WriteValidation(c, "missing search query parameter 'q'")
		return
	}
	namespace, isCAS, ok := lookupNamespace(strings.ToLower(strings.TrimSpace(c.DefaultQuery("type", "name"))))
	if !ok {
		WriteValidation(c, "invalid search type: must be one of name, formula, cas, smiles")
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 10 {
		limit = 10
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
	defer cancel()

	compounds, err := fetchPubChemLookup(ctx, namespace, isCAS, q, limit)
	if err != nil {
		if errors.Is(err, errUpstreamRateLimited) {
			WriteProblem(c, http.StatusTooManyRequests, "Too Many Requests", "upstream compound lookup rate limit exceeded, please retry shortly")
			return
		}
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(ctx.Err(), context.DeadlineExceeded) {
			WriteProblem(c, http.StatusGatewayTimeout, "Gateway Timeout", "upstream compound lookup timed out, please retry")
			return
		}
		WriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"compounds": compounds,
		"query":     q,
	})
}

// fetchPubChemLookup runs the two-step PUG-REST flow (identifier search, then
// property fetch) and returns compounds shaped like db.Compound records.
// A PubChem 404 on the identifier step means "no matches", not an error.
func fetchPubChemLookup(ctx context.Context, namespace string, isCAS bool, query string, limit int) ([]lookupCompound, error) {
	var escaped string
	var identifierURL string
	if isCAS {
		// "RN/<cas>" needs a literal slash for the /compound/xref/RN/{cas}/
		// route, so escape each segment separately.
		parts := strings.Split(query, "/")
		for i, p := range parts {
			parts[i] = url.PathEscape(p)
		}
		escaped = strings.Join(parts, "/")
		identifierURL = fmt.Sprintf("%s/compound/xref/RN/%s/cids/JSON", pubchemBaseURL, escaped)
	} else {
		escaped = url.PathEscape(query)
		identifierURL = fmt.Sprintf("%s/compound/%s/%s/cids/JSON", pubchemBaseURL, namespace, escaped)
	}

	cids, status, err := getPubChemCIDs(ctx, identifierURL)
	if err != nil {
		return nil, err
	}
	if status == http.StatusNotFound || len(cids) == 0 {
		return []lookupCompound{}, nil
	}
	if len(cids) > limit {
		cids = cids[:limit]
	}

	props, err := getPubChemProperties(ctx, cids)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	compounds := make([]lookupCompound, 0, len(cids))
	for _, cid := range cids {
		p, ok := props[cid]
		if !ok || (p.name == "" && p.formula == "" && p.smiles == "" && p.inchi == "") {
			continue
		}
		compounds = append(compounds, lookupCompound{
			ID:         fmt.Sprintf("pubchem:%d", cid),
			Name:       p.name,
			Formula:    p.formula,
			CASNumber:  p.cas,
			SMILES:     p.smiles,
			InChI:      p.inchi,
			MolarMass:  p.molarMass,
			Properties: "",
			Source:     "pubchem",
			CreatedAt:  now,
			UpdatedAt:  now,
		})
	}
	return compounds, nil
}

// getPubChemCIDs performs one rate-limited upstream GET and parses the CID list.
func getPubChemCIDs(ctx context.Context, rawURL string) ([]int, int, error) {
	waitLookupRate()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, 0, fmt.Errorf("creating lookup request: %w", err)
	}
	resp, err := pubchemHTTPClient.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("executing lookup request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, http.StatusNotFound, nil
	}
	if resp.StatusCode == http.StatusTooManyRequests {
		return nil, resp.StatusCode, errUpstreamRateLimited
	}
	if resp.StatusCode != http.StatusOK {
		return nil, resp.StatusCode, fmt.Errorf("unexpected status code %d from compound lookup", resp.StatusCode)
	}

	var result struct {
		IdentifierList *struct {
			CID []int `json:"CID"`
		} `json:"IdentifierList"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, resp.StatusCode, fmt.Errorf("decoding lookup response: %w", err)
	}
	if result.IdentifierList == nil {
		return nil, resp.StatusCode, nil
	}
	return result.IdentifierList.CID, resp.StatusCode, nil
}

type pubChemProps struct {
	name      string
	formula   string
	molarMass float64
	smiles    string
	inchi     string
	cas       string
}

// getPubChemProperties fetches display properties for the given CIDs.
func getPubChemProperties(ctx context.Context, cids []int) (map[int]pubChemProps, error) {
	cidStrs := make([]string, len(cids))
	for i, cid := range cids {
		cidStrs[i] = strconv.Itoa(cid)
	}
	rawURL := fmt.Sprintf("%s/compound/cid/%s/property/IUPACName,MolecularFormula,MolecularWeight,IsomericSMILES,InChI/JSON",
		pubchemBaseURL, strings.Join(cidStrs, ","))

	waitLookupRate()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, fmt.Errorf("creating property request: %w", err)
	}
	resp, err := pubchemHTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing property request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		return nil, errUpstreamRateLimited
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code %d from property request", resp.StatusCode)
	}

	var result struct {
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
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decoding property response: %w", err)
	}

	props := make(map[int]pubChemProps, len(cids))
	if result.PropertyTable != nil {
		for _, p := range result.PropertyTable.Properties {
			props[p.CID] = pubChemProps{
				name:      p.IUPACName,
				formula:   p.MolecularFormula,
				molarMass: p.MolecularWeight,
				smiles:    p.IsomericSMILES,
				inchi:     p.InChI,
			}
		}
	}
	return props, nil
}
