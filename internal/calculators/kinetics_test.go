package calculators

import (
	"context"
	"testing"
)

func TestArrhenius_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := Arrhenius(ctx, CalculationInput{"A": 1e13, "Ea": 75000.0, "T": 298.0, "solveFor": "k"})
	if err != nil || got.Unit != "s⁻¹" {
		t.Fatalf("k = %+v, %v", got, err)
	}
	got, err = Arrhenius(ctx, CalculationInput{"A": 1e13, "Ea": 75000.0, "T": 298.0})
	if err != nil {
		t.Fatalf("default solveFor: %v", err)
	}
	got, err = Arrhenius(ctx, CalculationInput{"A": 1e13, "k": 1e-3, "T": 298.0, "solveFor": "Ea"})
	if err != nil || got.Unit != "J/mol" {
		t.Fatalf("Ea = %+v, %v", got, err)
	}
	got, err = Arrhenius(ctx, CalculationInput{"A": 1e13, "k": 1e-3, "Ea": 75000.0, "solveFor": "T"})
	if err != nil || got.Unit != "K" {
		t.Fatalf("T = %+v, %v", got, err)
	}
	got, err = Arrhenius(ctx, CalculationInput{"k": 1e-3, "Ea": 75000.0, "T": 298.0, "solveFor": "A"})
	if err != nil || got.Unit != "s⁻¹" {
		t.Fatalf("A = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"solveFor": "bogus"},
		{"A": 1e13, "Ea": 75000.0, "T": 0.0, "solveFor": "k"},
		{"A": 0.0, "Ea": 75000.0, "T": 298.0, "solveFor": "k"},
		{"A": 0.0, "Ea": 75000.0, "T": 298.0, "solveFor": "k"},
		{"A": 0.0, "k": 1e-3, "T": 298.0, "solveFor": "Ea"},
		{"A": 1e13, "k": 0.0, "T": 298.0, "solveFor": "Ea"},
		{"A": 1e13, "k": 1e-3, "T": 0.0, "solveFor": "Ea"},
		{"A": 0.0, "k": 1e-3, "Ea": 75000.0, "solveFor": "T"},
		{"A": 1e13, "k": 0.0, "Ea": 75000.0, "solveFor": "T"},
		{"A": 1e13, "k": 1e13, "Ea": 75000.0, "solveFor": "T"},
		{"A": 1e13, "k": 2e13, "Ea": 75000.0, "solveFor": "T"},
		{"k": 0.0, "Ea": 75000.0, "T": 298.0, "solveFor": "A"},
		{"k": 1e-3, "Ea": 75000.0, "T": 0.0, "solveFor": "A"},
		{"A": 1e13, "T": 298.0, "solveFor": "k"},
	} {
		if _, err := Arrhenius(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestRateLaw_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := RateLaw(ctx, CalculationInput{
		"k": 0.5, "concentrations": []float64{1.0, 2.0}, "orders": []float64{1.0, 1.0},
	})
	if err != nil || got.Unit != "M/s" {
		t.Fatalf("rate = %+v, %v", got, err)
	}
	if _, err := RateLaw(ctx, CalculationInput{
		"k": 0.5, "concentrations": []interface{}{1.0, 2.0}, "orders": []interface{}{1.0, 1.0},
	}); err != nil {
		t.Fatalf("json-decoded slices: %v", err)
	}
	for _, bad := range []CalculationInput{
		{"k": -1.0, "concentrations": []float64{1.0}, "orders": []float64{1.0}},
		{"k": 0.5},
		{"k": 0.5, "concentrations": []float64{1.0}},
		{"k": 0.5, "concentrations": "nope", "orders": []float64{1.0}},
		{"k": 0.5, "concentrations": []float64{1.0}, "orders": "nope"},
		{"k": 0.5, "concentrations": []float64{1.0, 2.0}, "orders": []float64{1.0}},
		{"k": 0.5, "concentrations": []float64{}, "orders": []float64{}},
		{"k": 0.5, "concentrations": []float64{-1.0}, "orders": []float64{1.0}},
		{"k": 0.5, "concentrations": []float64{0.0}, "orders": []float64{-1.0}},
		{"k": 0.5, "concentrations": []float64{0.0}, "orders": []float64{-100.0}},
	} {
		if _, err := RateLaw(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestIntegratedRateLaw_AllBranches(t *testing.T) {
	ctx := context.Background()
	// Order 0/1/2 x concentration/time = 6 happy paths.
	for _, order := range []float64{0, 1, 2} {
		got, err := IntegratedRateLaw(ctx, CalculationInput{
			"order": order, "k": 0.05, "initialConcentration": 1.0,
			"time": 10.0, "solveFor": "concentration",
		})
		if err != nil || got.Unit != "M" {
			t.Errorf("order %v conc: %+v, %v", order, got, err)
		}
		target := map[float64]float64{0: 0.5, 1: 0.5, 2: 0.5}[order]
		got, err = IntegratedRateLaw(ctx, CalculationInput{
			"order": order, "k": 0.05, "initialConcentration": 1.0,
			"concentration": target, "solveFor": "time",
		})
		if err != nil || got.Unit != "s" {
			t.Errorf("order %v time: %+v, %v", order, got, err)
		}
	}
	// Default solveFor.
	if _, err := IntegratedRateLaw(ctx, CalculationInput{
		"order": 1.0, "k": 0.05, "initialConcentration": 1.0, "time": 1.0,
	}); err != nil {
		t.Errorf("default solveFor: %v", err)
	}
	for _, bad := range []CalculationInput{
		{"order": 1.5, "k": 0.05, "initialConcentration": 1.0, "time": 1.0, "solveFor": "concentration"},
		{"order": 3.0, "k": 0.05, "initialConcentration": 1.0, "time": 1.0, "solveFor": "concentration"},
		{"order": -1.0, "k": 0.05, "initialConcentration": 1.0, "time": 1.0, "solveFor": "concentration"},
		{"order": 1.0, "k": -0.05, "initialConcentration": 1.0, "time": 1.0, "solveFor": "concentration"},
		{"order": 1.0, "k": 0.05, "initialConcentration": 0.0, "time": 1.0, "solveFor": "concentration"},
		{"order": 1.0, "k": 0.05, "initialConcentration": 1.0, "solveFor": "concentration"},
		{"order": 0.0, "k": 0.05, "initialConcentration": 1.0, "time": -1.0, "solveFor": "concentration"},
		{"order": 0.0, "k": 10.0, "initialConcentration": 1.0, "time": 10.0, "solveFor": "concentration"},
		{"order": 0.0, "k": 0.05, "initialConcentration": 1.0, "concentration": 5.0, "solveFor": "time"},
		{"order": 0.0, "k": 0.05, "initialConcentration": 1.0, "concentration": -1.0, "solveFor": "time"},
		{"order": 0.0, "k": 0.0, "initialConcentration": 1.0, "concentration": 0.5, "solveFor": "time"},
		{"order": 1.0, "k": 0.05, "initialConcentration": 1.0, "concentration": 0.0, "solveFor": "time"},
		{"order": 1.0, "k": 0.05, "initialConcentration": 1.0, "concentration": 5.0, "solveFor": "time"},
		{"order": 1.0, "k": 0.0, "initialConcentration": 1.0, "concentration": 0.5, "solveFor": "time"},
		{"order": 2.0, "k": 0.05, "initialConcentration": 1.0, "concentration": 0.0, "solveFor": "time"},
		{"order": 2.0, "k": 0.05, "initialConcentration": 1.0, "concentration": 5.0, "solveFor": "time"},
		{"order": 2.0, "k": 0.0, "initialConcentration": 1.0, "concentration": 0.5, "solveFor": "time"},
		{"order": 1.0, "k": 0.05, "initialConcentration": 1.0, "time": 1.0, "solveFor": "bogus"},
		{"k": 0.05, "initialConcentration": 1.0, "time": 1.0, "solveFor": "concentration"},
	} {
		if _, err := IntegratedRateLaw(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}
