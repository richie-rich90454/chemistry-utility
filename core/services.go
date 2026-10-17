package main

import (
	"context"
	"errors"
	"os"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"chemistry-utility/core/internal/calculators"
	"chemistry-utility/core/internal/ptable"
)

// errCancelled is returned when the user dismisses a file dialog without
// choosing a file. The runtime signals a cancel as an empty path with a nil
// error, so it has to be detected by the caller.
var errCancelled = errors.New("file dialog cancelled")

// errNoFileContext guards every dialog call: the runtime fatals on a nil
// context, so the service refuses instead of crashing the app.
var errNoFileContext = errors.New("file service is not running: no application context")

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

// FileService exposes the native file dialogs to the frontend.
//
// The web build reads and writes files through an <input type="file"> and
// a Blob download. The desktop build has no such element plumbing: this
// service opens the real OS dialog, reads or writes the chosen path, and
// hands the text straight to the frontend, so a route never branches on
// the platform.
type FileService struct {
	ctx context.Context
}

// NewFileService creates a file service. The context is attached by
// App.startup once the Wails runtime is running.
func NewFileService() *FileService {
	return &FileService{}
}

// OpenFile shows the native open dialog and returns the chosen file's
// contents. filters is a comma-separated list of extensions or patterns
// (".csv" or "*.csv"); an empty string accepts every file. Returns
// errCancelled when the dialog is dismissed.
func (s *FileService) OpenFile(title string, filters string) (string, error) {
	if s.ctx == nil {
		return "", errNoFileContext
	}
	path, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title:   title,
		Filters: parseFileFilters(filters),
	})
	if err != nil {
		return "", err
	}
	if err := requireSelectedFile(path); err != nil {
		return "", err
	}
	return readTextFile(path)
}

// SaveFile shows the native save dialog and writes data to the chosen
// path, returning that path. Returns errCancelled when the dialog is
// dismissed.
func (s *FileService) SaveFile(defaultName string, data string) (string, error) {
	if s.ctx == nil {
		return "", errNoFileContext
	}
	path, err := runtime.SaveFileDialog(s.ctx, runtime.SaveDialogOptions{
		Title:           "Save file",
		DefaultFilename: defaultName,
	})
	if err != nil {
		return "", err
	}
	if err := requireSelectedFile(path); err != nil {
		return "", err
	}
	if err := writeTextFile(path, data); err != nil {
		return "", err
	}
	return path, nil
}

// requireSelectedFile turns the empty path a cancelled dialog returns
// into errCancelled.
func requireSelectedFile(path string) error {
	if strings.TrimSpace(path) == "" {
		return errCancelled
	}
	return nil
}

// parseFileFilters converts a comma-separated extension list into the
// runtime's FileFilter shape. Patterns are normalised to "*.ext" so both
// ".csv" and "*.csv" spellings work, matching what the web adapter sends
// in its input[accept] attribute.
func parseFileFilters(filters string) []runtime.FileFilter {
	var patterns []string
	for _, raw := range strings.Split(filters, ",") {
		token := strings.TrimSpace(raw)
		if token == "" {
			continue
		}
		if !strings.HasPrefix(token, "*.") {
			token = "*." + strings.TrimPrefix(token, ".")
		}
		patterns = append(patterns, token)
	}
	if len(patterns) == 0 {
		return nil
	}
	return []runtime.FileFilter{{DisplayName: "Files", Pattern: strings.Join(patterns, ";")}}
}

func readTextFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func writeTextFile(path string, data string) error {
	return os.WriteFile(path, []byte(data), 0o600)
}
