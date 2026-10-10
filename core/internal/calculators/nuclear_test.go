package calculators

import (
	"context"
	"testing"
)

func TestHalfLife_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := HalfLife(ctx, CalculationInput{"N0": 100.0, "t": -5.0, "halfLife": 5.0, "solveFor": "remaining"})
	if err == nil {
		t.Errorf("expected error for negative t, got %+v", got)
	}
	got, err = HalfLife(ctx, CalculationInput{"N0": 100.0, "t": 10.0, "halfLife": 5.0, "solveFor": "remaining"})
	if err != nil || !approxEqual(got.Value, 25.0, 1e-9) {
		t.Fatalf("remaining = %+v, %v", got, err)
	}
	if _, err := HalfLife(ctx, CalculationInput{"N0": 100.0, "t": 10.0, "halfLife": 5.0}); err != nil {
		t.Fatalf("default solveFor: %v", err)
	}
	got, err = HalfLife(ctx, CalculationInput{"N0": 100.0, "halfLife": 5.0, "Nt": 25.0, "solveFor": "time"})
	if err != nil || !approxEqual(got.Value, 10.0, 1e-9) {
		t.Fatalf("time = %+v, %v", got, err)
	}
	got, err = HalfLife(ctx, CalculationInput{"N0": 100.0, "t": 10.0, "Nt": 25.0, "solveFor": "halfLife"})
	if err != nil || !approxEqual(got.Value, 5.0, 1e-9) {
		t.Fatalf("halfLife = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"solveFor": "bogus"},
		{"N0": 0.0, "t": 10.0, "halfLife": 5.0, "solveFor": "remaining"},
		{"N0": 100.0, "t": 10.0, "halfLife": 0.0, "solveFor": "remaining"},
		{"N0": 100.0, "t": 10.0, "solveFor": "remaining"},
		{"N0": 0.0, "halfLife": 5.0, "Nt": 25.0, "solveFor": "time"},
		{"N0": 100.0, "halfLife": 0.0, "Nt": 25.0, "solveFor": "time"},
		{"N0": 100.0, "halfLife": 5.0, "Nt": 0.0, "solveFor": "time"},
		{"N0": 100.0, "halfLife": 5.0, "Nt": 100.0, "solveFor": "time"},
		{"N0": 100.0, "halfLife": 5.0, "Nt": 150.0, "solveFor": "time"},
		{"N0": 0.0, "t": 10.0, "Nt": 25.0, "solveFor": "halfLife"},
		{"N0": 100.0, "t": 10.0, "Nt": 0.0, "solveFor": "halfLife"},
		{"N0": 100.0, "t": 10.0, "Nt": 100.0, "solveFor": "halfLife"},
		{"N0": 100.0, "t": 0.0, "Nt": 25.0, "solveFor": "halfLife"},
		{"N0": 100.0, "t": -5.0, "Nt": 25.0, "solveFor": "halfLife"},
		{"N0": 100.0, "halfLife": 5.0, "solveFor": "time"},
	} {
		if _, err := HalfLife(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}
