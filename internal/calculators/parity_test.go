package calculators

import (
	"context"
	"testing"
)

// Shared parity fixtures: same inputs asserted in frontend
// (frontend/src/modules/equationBalancerParity.test.ts).
// Web and desktop must never disagree on these.
func TestParityBalanceEquations(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"H2 + O2 -> H2O", "2H2 + O2 -> 2H2O"},
		{"H2+O2->H2O", "2H2 + O2 -> 2H2O"},
		{"C3H8 + O2 -> CO2 + H2O", "C3H8 + 5O2 -> 3CO2 + 4H2O"},
		{"CuSO4·5H2O -> CuSO4 + H2O", "CuSO4·5H2O -> CuSO4 + 5H2O"},
		{"CuSO4*5H2O -> CuSO4 + H2O", "CuSO4*5H2O -> CuSO4 + 5H2O"},
		{"CuSO4•5H2O -> CuSO4 + H2O", "CuSO4·5H2O -> CuSO4 + 5H2O"},
		{"H2 + O2 → H2O", "2H2 + O2 -> 2H2O"},
		{"H2 + O2 ⇌ H2O", "2H2 + O2 -> 2H2O"},
		{"H2 + O2 <=> H2O", "2H2 + O2 -> 2H2O"},
		{"H2 + O2 = H2O", "2H2 + O2 -> 2H2O"},
		{"Fe2+ + Cl2 -> Fe3+ + Cl-", "2Fe2+ + Cl2 -> 2Fe3+ + 2Cl-"},
	}
	for _, tc := range cases {
		got, err := BalanceEquation(tc.input, 4000)
		if err != nil {
			t.Errorf("BalanceEquation(%q) error: %v", tc.input, err)
			continue
		}
		if got != tc.expected {
			t.Errorf("BalanceEquation(%q) = %q, want %q", tc.input, got, tc.expected)
		}
	}
}

func TestParityMolarMasses(t *testing.T) {
	ctx := context.Background()
	cases := []struct {
		formula  string
		expected float64
	}{
		{"H2O", 18.015},
		{"CuSO4·5H2O", 249.677},
		{"CuSO4*5H2O", 249.677},
		{"CuSO4•5H2O", 249.677},
	}
	for _, tc := range cases {
		res, err := CalculateMolarMass(ctx, CalculationInput{"formula": tc.formula})
		if err != nil {
			t.Errorf("CalculateMolarMass(%q) error: %v", tc.formula, err)
			continue
		}
		if diff := res.Value - tc.expected; diff < -0.01 || diff > 0.01 {
			t.Errorf("CalculateMolarMass(%q) = %.4f, want ~%.3f", tc.formula, res.Value, tc.expected)
		}
	}
}
