package compounds

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
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

// waitForRate blocks until a rate-limiter tick is available.
func (c *PubChemClient) waitForRate() {
	<-c.rateTicker.C
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
	u := fmt.Sprintf("%s/%s/%s/%s/cids/JSON", c.baseURL, domain, namespace, url.PathEscape(query))
	cids, err := c.doSearchRequest(ctx, u)
	if err != nil {
		return nil, err
	}
	return cids, nil
}

func (c *PubChemClient) doSearchRequest(ctx context.Context, rawURL string) ([]int, error) {
	c.waitForRate()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
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

	c.waitForRate()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("creating property request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing property request: %w", err)
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

	c.waitForRate()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("creating description request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing description request: %w", err)
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

	c.waitForRate()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("creating CAS request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing CAS request: %w", err)
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
