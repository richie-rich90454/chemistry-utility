package calculators

import (
	"math"
	"testing"
)

// The conformance vectors cover the happy paths. These cases pin the parser
// branches the vectors never reach: unknown elements, malformed formulas, and
// formulas whose only difference from a known one is a charge suffix.
func TestMolarMassParser(t *testing.T) {
	elements := map[string]float64{
		"H": 1.008, "O": 15.9994, "C": 12.0107, "N": 14.0067, "S": 32.065,
	}

	masses := []struct {
		formula string
		want    float64
	}{
		{"H2O", 18.0154},
		{"H2O^2-", 18.0154},
		{" H2 O ", 18.0154},
		{"H2O·H2O", 36.0308},
		{"2(H2O)", 36.0308},
		{"(H2O)2", 36.0308},
		{"H2O{O}2", 50.0142},
	}
	for _, c := range masses {
		got, err := molarMassOf(c.formula, elements)
		if err != nil {
			t.Errorf("molarMassOf(%q) unexpected error: %v", c.formula, err)
			continue
		}
		if math.Abs(got-c.want) > 1e-9 {
			t.Errorf("molarMassOf(%q) = %v, want %v", c.formula, got, c.want)
		}
	}

	failures := []struct {
		formula string
		want    string
	}{
		{"", "Empty formula"},
		{"   ", "Empty formula"},
		{"H2X", "Element not found: X"},
		{"h2o", "Invalid character: h"},
		{"(H2O", "Unmatched \"(\""},
		{"H2O)", "Unmatched \")\""},
	}
	for _, c := range failures {
		_, err := molarMassOf(c.formula, elements)
		if err == nil {
			t.Errorf("molarMassOf(%q) expected error %q, got nil", c.formula, c.want)
			continue
		}
		if err.Error() != c.want {
			t.Errorf("molarMassOf(%q) error = %q, want %q", c.formula, err.Error(), c.want)
		}
	}
}
