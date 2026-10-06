package ptable

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

// Service provides periodic table data
type Service struct {
	data []byte
	err  error
	mu   sync.RWMutex
}

// New creates a new Service by loading data from the given path.
// The payload is validated (118 elements, required keys, numeric ranges)
// so a corrupt or truncated table fails fast instead of being served.
func New(dataPath string) *Service {
	s := &Service{}
	data, err := os.ReadFile(dataPath)
	if err != nil {
		s.err = err
		return s
	}
	s.data, s.err = data, validatePTable(data)
	return s
}

// NewFromBytes creates a Service from in-memory data (e.g. embedded assets).
// The payload is validated like New; invalid data surfaces via GetData.
func NewFromBytes(data []byte) *Service {
	s := &Service{}
	s.data, s.err = data, validatePTable(data)
	return s
}

// GetData returns the periodic table JSON data as a string
func (s *Service) GetData() (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.err != nil {
		return "", s.err
	}
	return string(s.data), nil
}

// LoadData reloads the periodic table data from the given path.
// Invalid payloads are rejected with a descriptive error and are not
// retained; the previous error state (if any) is replaced.
func (s *Service) LoadData(dataPath string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	data, err := os.ReadFile(dataPath)
	if err != nil {
		s.data, s.err = nil, err
		return err
	}
	if err := validatePTable(data); err != nil {
		s.data, s.err = nil, err
		return err
	}
	s.data, s.err = data, nil
	return nil
}

// ptableElement captures the fields the service validates. Pointers
// distinguish a missing/null key (nil) from a present zero value.
type ptableElement struct {
	Symbol            *string  `json:"symbol"`
	Name              *string  `json:"name"`
	AtomicNumber      *int     `json:"atomicNumber"`
	AtomicMass        *float64 `json:"atomicMass"`
	Period            *int     `json:"period"`
	Group             *int     `json:"group"`
	Electronegativity *float64 `json:"electronegativity"`
}

// validatePTable rejects malformed, incomplete, or out-of-range periodic
// table payloads: the top level must be an array of exactly 118 elements
// with unique atomic numbers 1-118, non-empty symbol/name, positive
// atomic mass, period 1-7, and — when present (f-block elements have no
// group; some elements have no electronegativity) — group 1-18 and
// electronegativity within 0-6.
func validatePTable(data []byte) error {
	var elements []ptableElement
	if err := json.Unmarshal(data, &elements); err != nil {
		return fmt.Errorf("ptable: invalid JSON: %w", err)
	}
	if len(elements) != 118 {
		return fmt.Errorf("ptable: expected 118 elements, got %d", len(elements))
	}
	seen := make(map[int]bool, 118)
	for i, e := range elements {
		where := fmt.Sprintf("ptable: element index %d", i)
		if e.Symbol == nil || *e.Symbol == "" {
			return fmt.Errorf("%s: missing required key %q", where, "symbol")
		}
		if e.Name == nil || *e.Name == "" {
			return fmt.Errorf("%s (%s): missing required key %q", where, *e.Symbol, "name")
		}
		if e.AtomicNumber == nil {
			return fmt.Errorf("%s (%s): missing required key %q", where, *e.Symbol, "atomicNumber")
		}
		z := *e.AtomicNumber
		if z < 1 || z > 118 {
			return fmt.Errorf("%s (%s): atomicNumber %d out of range 1-118", where, *e.Symbol, z)
		}
		if seen[z] {
			return fmt.Errorf("%s (%s): duplicate atomicNumber %d", where, *e.Symbol, z)
		}
		seen[z] = true
		if e.AtomicMass == nil {
			return fmt.Errorf("%s (%s): missing required key %q", where, *e.Symbol, "atomicMass")
		}
		if *e.AtomicMass <= 0 || *e.AtomicMass >= 1000 {
			return fmt.Errorf("%s (%s): atomicMass %v out of range (0, 1000)", where, *e.Symbol, *e.AtomicMass)
		}
		if e.Period == nil {
			return fmt.Errorf("%s (%s): missing required key %q", where, *e.Symbol, "period")
		}
		if *e.Period < 1 || *e.Period > 7 {
			return fmt.Errorf("%s (%s): period %d out of range 1-7", where, *e.Symbol, *e.Period)
		}
		if e.Group != nil && (*e.Group < 1 || *e.Group > 18) {
			return fmt.Errorf("%s (%s): group %d out of range 1-18", where, *e.Symbol, *e.Group)
		}
		if e.Electronegativity != nil && (*e.Electronegativity < 0 || *e.Electronegativity > 6) {
			return fmt.Errorf("%s (%s): electronegativity %v out of range 0-6", where, *e.Symbol, *e.Electronegativity)
		}
	}
	return nil
}
