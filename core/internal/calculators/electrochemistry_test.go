package calculators

import (
	"context"
	"testing"
)

func TestCellPotential_Errors(t *testing.T) {
	ctx := context.Background()
	for _, bad := range []CalculationInput{
		{"E2": 1.0},
		{"E1": 1.0},
	} {
		if _, err := CellPotential(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestNernst_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := Nernst(ctx, CalculationInput{"E_standard": 1.10, "T": 298.15, "n": 2.0, "Q": 1.0})
	if err != nil || got.Unit != "V" {
		t.Fatalf("nernst = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"T": 298.15, "n": 2.0, "Q": 1.0},
		{"E_standard": 1.10, "n": 2.0, "Q": 1.0},
		{"E_standard": 1.10, "T": 298.15, "Q": 1.0},
		{"E_standard": 1.10, "T": 298.15, "n": 2.0},
		{"E_standard": 1.10, "T": 0.0, "n": 2.0, "Q": 1.0},
		{"E_standard": 1.10, "T": 298.15, "n": 0.0, "Q": 1.0},
		{"E_standard": 1.10, "T": 298.15, "n": 1.5, "Q": 1.0},
		{"E_standard": 1.10, "T": 298.15, "n": 2.0, "Q": 0.0},
	} {
		if _, err := Nernst(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestElectrolysis_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := Electrolysis(ctx, CalculationInput{"I": 1.0, "t": 965.0, "z": 1.0, "M": 63.546, "solveFor": "mass"})
	if err != nil || got.Unit != "g" {
		t.Fatalf("mass = %+v, %v", got, err)
	}
	if _, err := Electrolysis(ctx, CalculationInput{"I": 1.0, "t": 965.0, "z": 1.0, "M": 63.546}); err != nil {
		t.Fatalf("default solveFor: %v", err)
	}
	got, err = Electrolysis(ctx, CalculationInput{"m": 0.635, "t": 965.0, "z": 1.0, "M": 63.546, "solveFor": "current"})
	if err != nil || got.Unit != "A" {
		t.Fatalf("current = %+v, %v", got, err)
	}
	got, err = Electrolysis(ctx, CalculationInput{"m": 0.635, "I": 1.0, "z": 1.0, "M": 63.546, "solveFor": "time"})
	if err != nil || got.Unit != "s" {
		t.Fatalf("time = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"solveFor": "bogus"},
		{"I": 0.0, "t": 965.0, "z": 1.0, "M": 63.546, "solveFor": "mass"},
		{"I": 1.0, "t": 965.0, "z": 0.0, "M": 63.546, "solveFor": "mass"},
		{"I": 1.0, "t": 965.0, "z": 1.5, "M": 63.546, "solveFor": "mass"},
		{"I": 1.0, "t": 965.0, "z": 1.0, "M": 0.0, "solveFor": "mass"},
		{"I": 1.0, "t": 965.0, "z": 1.0, "solveFor": "mass"},
		{"m": 0.0, "t": 965.0, "z": 1.0, "M": 63.546, "solveFor": "current"},
		{"m": 0.635, "t": 965.0, "z": 1.5, "M": 63.546, "solveFor": "current"},
		{"m": 0.635, "t": 0.0, "z": 1.0, "M": 63.546, "solveFor": "current"},
		{"m": 0.635, "I": 0.0, "z": 1.0, "M": 63.546, "solveFor": "time"},
		{"m": 0.635, "I": 1.0, "z": 1.5, "M": 63.546, "solveFor": "time"},
		{"m": 0.635, "I": 1.0, "z": 1.0, "M": 0.0, "solveFor": "time"},
	} {
		if _, err := Electrolysis(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}
