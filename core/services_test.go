package main

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func TestCalculateReturnsSharedContract(t *testing.T) {
	svc := NewCalculatorService()

	result, err := svc.Calculate("dilution", map[string]string{
		"dilution-M1":        "6",
		"dilution-V1":        "1",
		"dilution-M2":        "3",
		"dilution-V2":        "",
		"dilution-solve-for": "V2",
	})
	if err != nil {
		t.Fatalf("Calculate returned an unexpected error: %v", err)
	}
	if result.Value != "2.0000 L" {
		t.Errorf("value = %q, want %q", result.Value, "2.0000 L")
	}
	if result.Explanation != "V2 = (M1 * V1) / M2 = 2.0000 L" {
		t.Errorf("explanation = %q", result.Explanation)
	}
}

func TestCalculateSurfacesValidationErrors(t *testing.T) {
	svc := NewCalculatorService()

	_, err := svc.Calculate("dilution", map[string]string{
		"dilution-M1":        "",
		"dilution-V1":        "1",
		"dilution-M2":        "",
		"dilution-V2":        "2",
		"dilution-solve-for": "V2",
	})
	if err == nil {
		t.Fatal("expected an error for missing inputs")
	}
	want := "Missing or invalid inputs for dilution-M1, dilution-M2"
	if err.Error() != want {
		t.Errorf("error = %q, want %q", err.Error(), want)
	}
}

func TestCalculateRejectsUnknownCalculator(t *testing.T) {
	svc := NewCalculatorService()

	_, err := svc.Calculate("no-such-calculator", map[string]string{})
	if err == nil {
		t.Fatal("expected an error for an unknown calculator id")
	}
	var unknown *unknownCalculatorError
	if !errors.As(err, &unknown) {
		t.Fatalf("error type = %T, want *unknownCalculatorError", err)
	}
	if !strings.HasPrefix(err.Error(), "unknown calculator: no-such-calculator") {
		t.Errorf("error = %q", err.Error())
	}
}

func TestListCalculatorsReturnsEveryRegisteredID(t *testing.T) {
	svc := NewCalculatorService()

	list := svc.ListCalculators()
	if len(list) == 0 {
		t.Fatal("expected a non-empty calculator list")
	}
	seen := map[string]bool{}
	for _, id := range list {
		seen[id] = true
	}
	for _, id := range []string{"dilution", "molar-mass", "ideal-gas", "stoichiometry", "bond-type"} {
		if !seen[id] {
			t.Errorf("calculator %q missing from the list", id)
		}
	}
}

func TestBatchCalculateRunsEveryRow(t *testing.T) {
	svc := NewCalculatorService()

	results, err := svc.BatchCalculate("dilution", []map[string]string{
		{"dilution-M1": "6", "dilution-V1": "1", "dilution-M2": "3", "dilution-solve-for": "V2"},
		{"dilution-M1": "1", "dilution-V1": "2", "dilution-M2": "4", "dilution-solve-for": "V2"},
		{"dilution-M1": "", "dilution-V1": "1", "dilution-M2": "", "dilution-V2": "2", "dilution-solve-for": "V2"},
	})
	if err != nil {
		t.Fatalf("BatchCalculate returned an unexpected error: %v", err)
	}
	if len(results) != 3 {
		t.Fatalf("got %d results, want 3", len(results))
	}
	if results[0].Value != "2.0000 L" {
		t.Errorf("row 0 value = %q", results[0].Value)
	}
	if results[1].Value != "0.5000 L" {
		t.Errorf("row 1 value = %q", results[1].Value)
	}
	if !strings.HasPrefix(results[2].Explanation, "Error: ") {
		t.Errorf("row 2 should record an error, got %q", results[2].Explanation)
	}
}

func TestBatchCalculateRejectsUnknownCalculator(t *testing.T) {
	svc := NewCalculatorService()

	_, err := svc.BatchCalculate("no-such-calculator", []map[string]string{{}})
	if err == nil {
		t.Fatal("expected an error for an unknown calculator id")
	}
	if _, ok := err.(*unknownCalculatorError); !ok {
		t.Fatalf("error type = %T, want *unknownCalculatorError", err)
	}
}

func TestMolarMassMatchesReference(t *testing.T) {
	svc := NewCalculatorService()

	result, err := svc.Calculate("molar-mass", map[string]string{"formula": "H2O"})
	if err != nil {
		t.Fatalf("Calculate returned an unexpected error: %v", err)
	}
	if !strings.Contains(result.Value, "18.015") {
		t.Errorf("value = %q, want it to contain 18.015", result.Value)
	}
}

func TestOpenFileRejectsAMissingContext(t *testing.T) {
	svc := NewFileService()

	_, err := svc.OpenFile("Pick a CSV", ".csv")
	if err == nil {
		t.Fatal("expected an error when the Wails context is not attached")
	}
	if !errors.Is(err, errNoFileContext) {
		t.Errorf("error = %v, want errNoFileContext", err)
	}
}

func TestSaveFileRejectsAMissingContext(t *testing.T) {
	svc := NewFileService()

	_, err := svc.SaveFile("results.csv", "a,b\n1,2\n")
	if err == nil {
		t.Fatal("expected an error when the Wails context is not attached")
	}
	if !errors.Is(err, errNoFileContext) {
		t.Errorf("error = %v, want errNoFileContext", err)
	}
}

func TestRequireSelectedFileTreatsAnEmptyPathAsCancelled(t *testing.T) {
	if err := requireSelectedFile(""); !errors.Is(err, errCancelled) {
		t.Errorf("error = %v, want errCancelled", err)
	}
	if err := requireSelectedFile("   "); !errors.Is(err, errCancelled) {
		t.Errorf("error = %v, want errCancelled", err)
	}
	if err := requireSelectedFile("C:\\data\\input.csv"); err != nil {
		t.Errorf("error = %v, want nil", err)
	}
}

func TestParseFileFiltersNormalisesExtensionLists(t *testing.T) {
	cases := []struct {
		name    string
		filters string
		want    []runtime.FileFilter
	}{
		{"empty accepts everything", "", nil},
		{"blank tokens are dropped", " , ,", nil},
		{"dot extensions become patterns", ".csv", []runtime.FileFilter{{DisplayName: "Files", Pattern: "*.csv"}}},
		{"wildcards pass through", "*.csv", []runtime.FileFilter{{DisplayName: "Files", Pattern: "*.csv"}}},
		{
			"multiple extensions are joined with semicolons",
			".csv, .chemutil, *.json",
			[]runtime.FileFilter{{DisplayName: "Files", Pattern: "*.csv;*.chemutil;*.json"}},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := parseFileFilters(tc.filters)
			if len(got) != len(tc.want) {
				t.Fatalf("filters = %v, want %v", got, tc.want)
			}
			for i := range got {
				if got[i] != tc.want[i] {
					t.Errorf("filter %d = %+v, want %+v", i, got[i], tc.want[i])
				}
			}
		})
	}
}

func TestReadAndWriteTextFileRoundTrip(t *testing.T) {
	path := filepath.Join(t.TempDir(), "input.csv")
	contents := "formula,molar_mass\nH2O,18.015\n"

	if err := writeTextFile(path, contents); err != nil {
		t.Fatalf("writeTextFile returned an unexpected error: %v", err)
	}
	got, err := readTextFile(path)
	if err != nil {
		t.Fatalf("readTextFile returned an unexpected error: %v", err)
	}
	if got != contents {
		t.Errorf("contents = %q, want %q", got, contents)
	}
}

func TestReadTextFileSurfacesAMissingFile(t *testing.T) {
	_, err := readTextFile(filepath.Join(t.TempDir(), "absent.csv"))
	if err == nil {
		t.Fatal("expected an error for a missing file")
	}
	if !errors.Is(err, os.ErrNotExist) {
		t.Errorf("error = %v, want an fs.ErrNotExist", err)
	}
}
