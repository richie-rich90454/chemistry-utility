package calculators

import (
	"context"
	"math"
	"testing"
)

func TestHessLaw_Extra(t *testing.T) {
	ctx := context.Background()
	got, err := HessLaw(ctx, CalculationInput{"deltaHValues": []float64{-100.0, 50.0, -25.5}})
	if err != nil || !approxEqual(got.Value, -75.5, 1e-9) || got.Unit != "kJ/mol" {
		t.Fatalf("hess = %+v, %v", got, err)
	}
	if _, err := HessLaw(ctx, CalculationInput{"deltaHValues": []interface{}{-100.0, 50.0}}); err != nil {
		t.Fatalf("json slice: %v", err)
	}
	for _, bad := range []CalculationInput{
		{},
		{"deltaHValues": []float64{}},
		{"deltaHValues": "nope"},
		{"deltaHValues": []interface{}{1.0, "x"}},
		{"deltaHValues": []float64{math.NaN()}},
	} {
		if _, err := HessLaw(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestEntropy_Extra(t *testing.T) {
	ctx := context.Background()
	got, err := Entropy(ctx, CalculationInput{
		"SProducts": []float64{100.0, 200.0}, "SReactants": []float64{150.0},
	})
	if err != nil || !approxEqual(got.Value, 150.0, 1e-9) || got.Unit != "J/(mol·K)" {
		t.Fatalf("entropy = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{},
		{"SProducts": []float64{1.0}},
		{"SProducts": []float64{1.0}, "SReactants": "nope"},
		{"SProducts": "nope", "SReactants": []float64{1.0}},
		{"SProducts": []float64{}, "SReactants": []float64{1.0}},
		{"SProducts": []float64{1.0}, "SReactants": []float64{}},
		{"SProducts": []float64{math.Inf(1)}, "SReactants": []float64{1.0}},
	} {
		if _, err := Entropy(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestHeatCapacity_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := HeatCapacity(ctx, CalculationInput{"m": 100.0, "c": 4.184, "deltaT": 10.0, "solveFor": "q"})
	if err != nil || got.Unit != "J" {
		t.Fatalf("q = %+v, %v", got, err)
	}
	if _, err := HeatCapacity(ctx, CalculationInput{"m": 100.0, "c": 4.184, "deltaT": 10.0}); err != nil {
		t.Fatalf("default solveFor: %v", err)
	}
	got, err = HeatCapacity(ctx, CalculationInput{"q": 4184.0, "c": 4.184, "deltaT": 10.0, "solveFor": "m"})
	if err != nil || !approxEqual(got.Value, 100.0, 1e-9) || got.Unit != "g" {
		t.Fatalf("m = %+v, %v", got, err)
	}
	got, err = HeatCapacity(ctx, CalculationInput{"q": 4184.0, "m": 100.0, "deltaT": 10.0, "solveFor": "c"})
	if err != nil || !approxEqual(got.Value, 4.184, 1e-9) || got.Unit != "J/(g·K)" {
		t.Fatalf("c = %+v, %v", got, err)
	}
	got, err = HeatCapacity(ctx, CalculationInput{"q": 4184.0, "m": 100.0, "c": 4.184, "solveFor": "deltaT"})
	if err != nil || !approxEqual(got.Value, 10.0, 1e-9) || got.Unit != "K" {
		t.Fatalf("deltaT = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"solveFor": "bogus"},
		{"m": 0.0, "c": 4.184, "deltaT": 10.0, "solveFor": "q"},
		{"m": -1.0, "c": 4.184, "deltaT": 10.0, "solveFor": "q"},
		{"m": 100.0, "c": 0.0, "deltaT": 10.0, "solveFor": "q"},
		{"m": 100.0, "c": 4.184, "deltaT": 10.0, "solveFor": "m"},
		{"q": 1.0, "c": 0.0, "deltaT": 10.0, "solveFor": "m"},
		{"q": 1.0, "c": 4.184, "deltaT": 0.0, "solveFor": "m"},
		{"q": 1.0, "m": 0.0, "deltaT": 10.0, "solveFor": "c"},
		{"q": 1.0, "m": 100.0, "deltaT": 0.0, "solveFor": "c"},
		{"q": 1.0, "m": 0.0, "c": 4.184, "solveFor": "deltaT"},
		{"q": 1.0, "m": 100.0, "c": 0.0, "solveFor": "deltaT"},
		{"m": 100.0, "c": 4.184, "solveFor": "q"},
	} {
		if _, err := HeatCapacity(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestGibbsFreeEnergy_Errors(t *testing.T) {
	ctx := context.Background()
	for _, bad := range []CalculationInput{
		{"deltaS": 1.0, "T": 298.0},
		{"deltaH": 1.0, "T": 298.0},
		{"deltaH": 1.0, "deltaS": 1.0},
		{"deltaH": 1.0, "deltaS": 1.0, "T": 0.0},
		{"deltaH": 1.0, "deltaS": 1.0, "T": -5.0},
	} {
		if _, err := GibbsFreeEnergy(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}
