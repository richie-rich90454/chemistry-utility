package main

import (
	"errors"
	"strings"
	"testing"
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
