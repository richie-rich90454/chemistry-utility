package main

import (
	"strings"

	"chemistry-utility/core/internal/calculators"
	"chemistry-utility/core/internal/ptable"
)

// CalculatorService is the native calculation surface for the desktop app.
//
// It replaces the loopback HTTP API the app used to run in-process. The
// frontend calls these methods directly through Wails bindings, so there is
// no server, no port, and no database: the same calculator code the website
// runs in TypeScript runs here in Go.
type CalculatorService struct {
	registry *calculators.Registry
}

// NewCalculatorService creates a service over the ported calculator registry.
func NewCalculatorService() *CalculatorService {
	return &CalculatorService{registry: calculators.NewRegistry()}
}

// Calculate runs one calculator and returns the shared-contract result.
//
// The result shape matches the web engine exactly: a display value, the
// worked explanation, optional chart series, and machine-readable metadata.
// Invalid input returns an error whose message is the same string the web
// engine shows.
func (s *CalculatorService) Calculate(calculatorID string, inputs map[string]string) (calculators.CalcResult, error) {
	fn, ok := s.registry.Get(calculatorID)
	if !ok {
		return calculators.CalcResult{}, newUnknownCalculatorError(calculatorID, s.registry.List())
	}
	return fn(inputs)
}

// ListCalculators returns every available calculator identifier.
func (s *CalculatorService) ListCalculators() []string {
	return s.registry.List()
}

// BatchCalculate runs one calculator over many input rows in a single call.
//
// The web build makes one request per row because it is bound to the HTTP
// shape. Calling into Go removes that round trip entirely, which is where
// the desktop app gets its throughput on large CSVs.
func (s *CalculatorService) BatchCalculate(calculatorID string, rows []map[string]string) ([]calculators.CalcResult, error) {
	fn, ok := s.registry.Get(calculatorID)
	if !ok {
		return nil, newUnknownCalculatorError(calculatorID, s.registry.List())
	}
	results := make([]calculators.CalcResult, 0, len(rows))
	for _, row := range rows {
		result, err := fn(row)
		if err != nil {
			results = append(results, calculators.CalcResult{Explanation: "Error: " + err.Error()})
			continue
		}
		results = append(results, result)
	}
	return results, nil
}

func newUnknownCalculatorError(id string, available []string) error {
	return &unknownCalculatorError{id: id, available: available}
}

type unknownCalculatorError struct {
	id        string
	available []string
}

func (e *unknownCalculatorError) Error() string {
	return "unknown calculator: " + e.id + " (available: " + strings.Join(e.available, ", ") + ")"
}

// DataService serves the periodic table to the frontend.
//
// The web build fetches the JSON file over HTTP. The desktop build has the
// same data compiled in, so the frontend calls this instead and works with
// no network at all.
type DataService struct {
	ptable *ptable.Service
}

// NewDataService creates a data service over the periodic table service.
func NewDataService(pt *ptable.Service) *DataService {
	return &DataService{ptable: pt}
}

// GetPTableData returns the periodic table JSON.
func (s *DataService) GetPTableData() (string, error) {
	return s.ptable.GetData()
}
