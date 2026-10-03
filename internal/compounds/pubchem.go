package compounds

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"chemistry-utility/internal/db"

	"github.com/google/uuid"
)

const defaultBaseURL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"

// PubChemClient is a client for the PubChem PUG REST API.
type PubChemClient struct {
	httpClient *http.Client
	baseURL    string
	rateTicker *time.Ticker
}

// NewPubChemClient creates a new PubChemClient with default settings
// and a rate limiter of 5 requests per second.
func NewPubChemClient() *PubChemClient {
	return &PubChemClient{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		baseURL:    defaultBaseURL,
		rateTicker: time.NewTicker(200 * time.Millisecond), // 5 req/s
	}
}

// waitForRate blocks until a rate-limiter tick is available or ctx is done.
func (c *PubChemClient) waitForRate(ctx context.Context) {
	select {
	case <-c.rateTicker.C:
	case <-ctx.Done():
	}
}

// maxRetries bounds transient-error retries for every PubChem request.
// Only 429 and 5xx responses (plus transport errors) are retried.
const maxRetries = 3

// maxRetryDelay caps any single retry sleep so a large Retry-After value
// cannot stall a request indefinitely. Cancellation is always honored.
const maxRetryDelay = 30 * time.Second

// doGet performs a rate-limited GET with bounded retries, and is the only
// path that executes PubChem HTTP requests. Retryable failures (429 and
// 5xx) are retried up to maxRetries with exponential backoff plus jitter,
// honoring the server's Retry-After header when present. All other
// statuses are returned to the caller for handling (e.g. 404 means "no
// match" for identifier searches). The caller owns the response body.
func (c *PubChemClient) doGet(ctx context.Context, rawURL string) (*http.Response, error) {
	c.waitForRate(ctx)
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	var lastErr error
	for attempt := 0; ; attempt++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
		if err != nil {
			return nil, fmt.Errorf("creating request: %w", err)
		}
		resp, err := c.httpClient.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("executing request: %w", err)
			if attempt >= maxRetries || !sleepOrDone(ctx, backoffDelay(nil, attempt)) {
				if ctx.Err() != nil {
					return nil, ctx.Err()
				}
				return nil, lastErr
			}
			continue
		}
		if resp.StatusCode != http.StatusTooManyRequests && resp.StatusCode < 500 {
			return resp, nil
		}
		delay := backoffDelay(resp, attempt)
		_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 4<<10))
		resp.Body.Close()
		lastErr = fmt.Errorf("unexpected status code %d from %s", resp.StatusCode, rawURL)
		if attempt >= maxRetries || !sleepOrDone(ctx, delay) {
			if ctx.Err() != nil {
				return nil, ctx.Err()
			}
			return nil, lastErr
		}
	}
}

// backoffDelay computes how long to wait before the next attempt:
// exponential backoff (500ms * 2^attempt) plus up to 250ms of jitter. When
// the failed response carried a Retry-After header, that value wins.
func backoffDelay(resp *http.Response, attempt int) time.Duration {
	if resp != nil {
		if d, ok := retryAfterDelay(resp); ok {
			return d
		}
	}
	d := (500 * time.Millisecond) << attempt
	d += time.Duration(rand.Int63n(int64(250 * time.Millisecond)))
	if d > maxRetryDelay {
		d = maxRetryDelay
	}
	return d
}

// retryAfterDelay parses a Retry-After header (delay seconds or HTTP
// date) into a bounded duration.
func retryAfterDelay(resp *http.Response) (time.Duration, bool) {
	v := strings.TrimSpace(resp.Header.Get("Retry-After"))
	if v == "" {
		return 0, false
	}
	if secs, err := strconv.Atoi(v); err == nil {
		if secs < 0 {
			secs = 0
		}
		return min(time.Duration(secs)*time.Second, maxRetryDelay), true
	}
	if t, err := http.ParseTime(v); err == nil {
		d := time.Until(t)
		if d < 0 {
			d = 0
		}
		return min(d, maxRetryDelay), true
	}
	return 0, false
}

// sleepOrDone waits for d (which may be zero) and reports whether the
// context is still alive afterwards.
func sleepOrDone(ctx context.Context, d time.Duration) bool {
	if d <= 0 {
		return ctx.Err() == nil
	}
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-t.C:
		return true
	}
}

// Stop releases the rate-limiter ticker.
func (c *PubChemClient) Stop() {
	c.rateTicker.Stop()
}

// --- PubChem JSON response types ---

type pubChemSearchResponse struct {
	IdentifierList *struct {
		CID []int `json:"CID"`
	} `json:"IdentifierList"`
}

type pubChemDescriptionResponse struct {
	InformationList *struct {
		Information []pubChemInformation `json:"Information"`
	} `json:"InformationList"`
}

type pubChemInformation struct {
	CID    int    `json:"CID"`
	Title  string `json:"Title"`
	SMILES string `json:"SMILES"`
	InChI  string `json:"InChI"`
}

// SearchByName searches PubChem by compound name and returns up to 10 results.
func (c *PubChemClient) SearchByName(ctx context.Context, name string) ([]db.Compound, error) {
	cids, err := c.searchIdentifiers(ctx, "compound", "name", name)
	if err != nil {
		return nil, fmt.Errorf("search by name: %w", err)
	}
	if len(cids) > 10 {
		cids = cids[:10]
	}
	return c.fetchCompounds(ctx, cids)
}

// SearchByFormula searches PubChem by molecular formula.
func (c *PubChemClient) SearchByFormula(ctx context.Context, formula string) ([]db.Compound, error) {
	cids, err := c.searchIdentifiers(ctx, "compound", "formula", formula)
	if err != nil {
		return nil, fmt.Errorf("search by formula: %w", err)
	}
	if len(cids) > 10 {
		cids = cids[:10]
	}
	return c.fetchCompounds(ctx, cids)
}

// SearchBySMILES searches PubChem by SMILES string.
func (c *PubChemClient) SearchBySMILES(ctx context.Context, smiles string) ([]db.Compound, error) {
	cids, err := c.searchIdentifiers(ctx, "compound", "smiles", smiles)
	if err != nil {
		return nil, fmt.Errorf("search by SMILES: %w", err)
	}
	if len(cids) > 10 {
		cids = cids[:10]
	}
	return c.fetchCompounds(ctx, cids)
}

// SearchByCAS searches PubChem by CAS registry number.
func (c *PubChemClient) SearchByCAS(ctx context.Context, cas string) ([]db.Compound, error) {
	cids, err := c.searchIdentifiers(ctx, "compound", "xref", "RN/"+cas)
	if err != nil {
		return nil, fmt.Errorf("search by CAS: %w", err)
	}
	if len(cids) > 10 {
		cids = cids[:10]
	}
	return c.fetchCompounds(ctx, cids)
}

// GetCompoundDetail retrieves full compound details by PubChem CID.
func (c *PubChemClient) GetCompoundDetail(ctx context.Context, cid int) (db.Compound, error) {
	compounds, err := c.fetchCompounds(ctx, []int{cid})
	if err != nil {
		return db.Compound{}, fmt.Errorf("get compound detail: %w", err)
	}
	if len(compounds) == 0 {
		return db.Compound{}, fmt.Errorf("compound with CID %d not found", cid)
	}
	return compounds[0], nil
}

// searchIdentifiers performs a PubChem identifier search and returns CIDs.
func (c *PubChemClient) searchIdentifiers(ctx context.Context, domain, namespace, query string) ([]int, error) {
	if strings.TrimSpace(query) == "" {
		return nil, fmt.Errorf("query must not be empty")
	}
	var escaped string
	if namespace == "xref" {
		// "RN/<cas>" needs a literal slash for PubChem's
		// /compound/xref/RN/{cas}/... route. Escape each segment
		// separately so the slash survives.
		parts := strings.Split(query, "/")
		for i, p := range parts {
			parts[i] = url.PathEscape(p)
		}
		escaped = strings.Join(parts, "/")
	} else {
		escaped = url.PathEscape(query)
	}
	u := fmt.Sprintf("%s/%s/%s/%s/cids/JSON", c.baseURL, domain, namespace, escaped)
	cids, err := c.doSearchRequest(ctx, u)
	if err != nil {
		return nil, err
	}
	return cids, nil
}

func (c *PubChemClient) doSearchRequest(ctx context.Context, rawURL string) ([]int, error) {
	resp, err := c.doGet(ctx, rawURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		// PubChem returns HTTP 404 with a Status body when a name/formula
		// is not found. That is an empty result set, not an error.
		return nil, nil
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code %d from %s", resp.StatusCode, rawURL)
	}

	var result pubChemSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decoding search response: %w", err)
	}

	if result.IdentifierList == nil || len(result.IdentifierList.CID) == 0 {
		return nil, nil
	}

	return result.IdentifierList.CID, nil
}

// fetchCompounds retrieves detailed compound data for the given CIDs.
func (c *PubChemClient) fetchCompounds(ctx context.Context, cids []int) ([]db.Compound, error) {
	if len(cids) == 0 {
		return nil, nil
	}

	// Build CID list string (comma-separated)
	cidStrs := make([]string, len(cids))
	for i, cid := range cids {
		cidStrs[i] = fmt.Sprintf("%d", cid)
	}
	cidList := strings.Join(cidStrs, ",")

	// Fetch property data
	compounds, err := c.fetchProperties(ctx, cidList)
	if err != nil {
		return nil, err
	}

	// Fetch description data for names and identifiers
	descriptions, err := c.fetchDescriptions(ctx, cidList)
	if err != nil {
		// Don't fail entirely; descriptions are supplementary
		descriptions = nil
	}

	descMap := make(map[int]pubChemInformation)
	for _, info := range descriptions {
		descMap[info.CID] = info
	}

	// Merge: if property data is empty, use description data
	var results []db.Compound
	for _, cid := range cids {
		compound := db.Compound{
			ID:     uuid.New(),
			Source: "pubchem",
		}

		if pc, ok := compounds[cid]; ok {
			compound.Name = pc.Name
			compound.Formula = pc.Formula
			compound.MolarMass = pc.MolarMass
			compound.SMILES = pc.SMILES
			compound.InChI = pc.InChI
			compound.CASNumber = pc.CASNumber
		}

		if desc, ok := descMap[cid]; ok {
			if compound.Name == "" {
				compound.Name = desc.Title
			}
			if compound.SMILES == "" {
				compound.SMILES = desc.SMILES
			}
			if compound.InChI == "" {
				compound.InChI = desc.InChI
			}
		}

		compound.CreatedAt = time.Now()
		compound.UpdatedAt = time.Now()
		// Skip CIDs with no usable data rather than caching empty rows.
		if compound.Name == "" && compound.Formula == "" && compound.SMILES == "" && compound.InChI == "" {
			continue
		}
		results = append(results, compound)
	}

	return results, nil
}

type compoundProps struct {
	Name      string
	Formula   string
	MolarMass float64
	SMILES    string
	InChI     string
	CASNumber string
}

// fetchProperties retrieves IUPAC name, molecular formula, molar mass, SMILES, InChI, and CAS.
func (c *PubChemClient) fetchProperties(ctx context.Context, cidList string) (map[int]compoundProps, error) {
	u := fmt.Sprintf(
		"%s/compound/cid/%s/property/IUPACName,MolecularFormula,MolecularWeight,IsomericSMILES,InChI/JSON",
		c.baseURL, cidList,
	)

	resp, err := c.doGet(ctx, u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

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

	propsMap := make(map[int]compoundProps)
	if result.PropertyTable != nil {
		for _, p := range result.PropertyTable.Properties {
			propsMap[p.CID] = compoundProps{
				Name:      p.IUPACName,
				Formula:   p.MolecularFormula,
				MolarMass: p.MolecularWeight,
				SMILES:    p.IsomericSMILES,
				InChI:     p.InChI,
			}
		}
	}

	// Fetch CAS numbers separately (xref source)
	casMap, err := c.fetchCASNumbers(ctx, cidList)
	if err == nil {
		for cid, cas := range casMap {
			if p, ok := propsMap[cid]; ok {
				p.CASNumber = cas
				propsMap[cid] = p
			}
		}
	}

	return propsMap, nil
}

// fetchDescriptions retrieves title, SMILES, and InChI from the description endpoint.
func (c *PubChemClient) fetchDescriptions(ctx context.Context, cidList string) ([]pubChemInformation, error) {
	u := fmt.Sprintf("%s/compound/cid/%s/description/JSON", c.baseURL, cidList)

	resp, err := c.doGet(ctx, u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code %d from description request", resp.StatusCode)
	}

	var result pubChemDescriptionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decoding description response: %w", err)
	}

	if result.InformationList == nil {
		return nil, nil
	}

	return result.InformationList.Information, nil
}

// fetchCASNumbers retrieves CAS registry numbers via the xref endpoint.
func (c *PubChemClient) fetchCASNumbers(ctx context.Context, cidList string) (map[int]string, error) {
	u := fmt.Sprintf("%s/compound/cid/%s/xrefs/CAS/JSON", c.baseURL, cidList)

	resp, err := c.doGet(ctx, u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code %d from CAS request", resp.StatusCode)
	}

	var result struct {
		InformationList *struct {
			Information []struct {
				CID int      `json:"CID"`
				CAS []string `json:"CAS"`
			} `json:"Information"`
		} `json:"InformationList"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decoding CAS response: %w", err)
	}

	casMap := make(map[int]string)
	if result.InformationList != nil {
		for _, info := range result.InformationList.Information {
			if len(info.CAS) > 0 {
				casMap[info.CID] = info.CAS[0]
			}
		}
	}

	return casMap, nil
}
