package calculators

import (
	"context"
	"testing"
)

func TestQuantumNumbers_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := QuantumNumbers(ctx, CalculationInput{"n": 2.0, "l": 1.0, "ml": 0.0, "ms": 0.5})
	if err != nil {
		t.Fatalf("valid: %v", err)
	}
	if got.Metadata["valid"] != true {
		t.Errorf("expected valid, got %+v", got.Metadata)
	}
	if got.Metadata["shell"] != "L" || got.Metadata["subshell"] != "p" {
		t.Errorf("shell/subshell = %+v", got.Metadata)
	}
	// Invalid n with valid-looking l/ml exercises the fallback messages.
	got, err = QuantumNumbers(ctx, CalculationInput{"n": 0.0, "l": 5.0, "ml": 9.0, "ms": 1.0})
	if err != nil {
		t.Fatalf("invalid set still returns result: %v", err)
	}
	if got.Metadata["valid"] != false {
		t.Errorf("expected invalid, got %+v", got.Metadata)
	}
	// Out-of-range shell/subshell names (n=8, l=4) hit the fallback labels.
	got, err = QuantumNumbers(ctx, CalculationInput{"n": 8.0, "l": 4.0, "ml": 0.0, "ms": 0.5})
	if err != nil {
		t.Fatalf("n=8: %v", err)
	}
	// Invalid n degrades the l/ml checks to standalone-integer validation.
	got, err = QuantumNumbers(ctx, CalculationInput{"n": 0.0, "l": -1.0, "ml": 0.5, "ms": 0.5})
	if err != nil {
		t.Fatalf("bad n/l: %v", err)
	}
	if got.Metadata["valid"] != false {
		t.Errorf("expected invalid, got %+v", got.Metadata)
	}
	got, err = QuantumNumbers(ctx, CalculationInput{"n": 0.0, "l": -1.0, "ml": 9.5, "ms": 0.5})
	if err != nil {
		t.Fatalf("bad n/l/ml: %v", err)
	}
	if got.Metadata["valid"] != false {
		t.Errorf("expected invalid, got %+v", got.Metadata)
	}
	for _, bad := range []CalculationInput{
		{"n": 1.5, "l": 0.0, "ml": 0.0, "ms": 0.5},
		{"n": 2.0, "l": 2.0, "ml": 0.0, "ms": 0.5},
		{"n": 2.0, "l": 1.0, "ml": 2.0, "ms": 0.5},
		{"n": 2.0, "l": 1.0, "ml": 0.0, "ms": 1.0},
	} {
		// Invalid sets are reported via valid:false, not as errors.
		got, err := QuantumNumbers(ctx, bad)
		if err != nil {
			t.Errorf("unexpected error for %+v: %v", bad, err)
			continue
		}
		if got.Metadata["valid"] != false {
			t.Errorf("expected valid=false for %+v", bad)
		}
	}
	for _, bad := range []CalculationInput{
		{"l": 0.0, "ml": 0.0, "ms": 0.5},
		{"n": 1.0, "ml": 0.0, "ms": 0.5},
		{"n": 1.0, "l": 0.0, "ms": 0.5},
		{"n": 1.0, "l": 0.0, "ml": 0.0},
	} {
		if _, err := QuantumNumbers(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestElectronConfiguration_AllBranches(t *testing.T) {
	ctx := context.Background()
	for _, z := range []float64{1, 6, 24, 26, 29, 46, 47, 57, 58, 64, 78, 79, 89, 90, 92, 96, 118} {
		got, err := ElectronConfiguration(ctx, CalculationInput{"atomicNumber": z})
		if err != nil {
			t.Errorf("Z=%v: %v", z, err)
			continue
		}
		if got.Metadata["atomicNumber"] != int(z) {
			t.Errorf("Z=%v metadata = %+v", z, got.Metadata)
		}
	}
	for _, bad := range []CalculationInput{
		{},
		{"atomicNumber": 0.0},
		{"atomicNumber": 119.0},
		{"atomicNumber": 24.5},
	} {
		if _, err := ElectronConfiguration(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestDeBroglie_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := DeBroglieWavelength(ctx, CalculationInput{"m": 9.11e-31, "v": 1e6})
	if err != nil || got.Unit != "m" {
		t.Fatalf("deBroglie = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{},
		{"m": 0.0, "v": 1.0},
		{"m": -1.0, "v": 1.0},
		{"m": 1.0, "v": 0.0},
		{"m": 1.0, "v": -2.0},
		{"m": 1.0},
	} {
		if _, err := DeBroglieWavelength(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestPhotoelectric_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := PhotoelectricEffect(ctx, CalculationInput{"solveFor": "KE", "frequency": 1e15, "workFunction": 2.0, "unit": "eV"})
	if err != nil {
		t.Fatalf("KE eV: %v", err)
	}
	if _, err := PhotoelectricEffect(ctx, CalculationInput{"solveFor": "KE", "frequency": 1e15, "workFunction": 1e-19, "unit": "J"}); err != nil {
		t.Fatalf("KE J: %v", err)
	}
	// Below-threshold frequency still returns a result with a no-emission note.
	got, err = PhotoelectricEffect(ctx, CalculationInput{"solveFor": "KE", "frequency": 1e12, "workFunction": 4.0})
	if err != nil {
		t.Fatalf("sub-threshold: %v", err)
	}
	if _, err := PhotoelectricEffect(ctx, CalculationInput{"solveFor": "frequency", "KE": 1.0, "workFunction": 2.0}); err != nil {
		t.Fatalf("frequency: %v", err)
	}
	if _, err := PhotoelectricEffect(ctx, CalculationInput{"solveFor": "frequency", "KE": 1.0, "workFunction": 1e-19, "unit": "J"}); err != nil {
		t.Fatalf("frequency J: %v", err)
	}
	if _, err := PhotoelectricEffect(ctx, CalculationInput{"solveFor": "workFunction", "KE": 1.0, "frequency": 1e15}); err != nil {
		t.Fatalf("workFunction eV: %v", err)
	}
	if _, err := PhotoelectricEffect(ctx, CalculationInput{"solveFor": "workFunction", "KE": 1e-19, "frequency": 1e15, "unit": "J"}); err != nil {
		t.Fatalf("workFunction J: %v", err)
	}
	_ = got
	for _, bad := range []CalculationInput{
		{"solveFor": "bogus"},
		{"solveFor": "KE", "frequency": 1e15, "workFunction": 2.0, "unit": "bogus"},
		{"solveFor": "KE", "frequency": 0.0, "workFunction": 2.0},
		{"solveFor": "KE", "frequency": -1.0, "workFunction": 2.0},
		{"solveFor": "KE", "frequency": 1e15, "workFunction": -1.0},
		{"solveFor": "KE", "frequency": 1e15},
		{"solveFor": "KE", "workFunction": 2.0},
		{"solveFor": "frequency", "KE": -1.0, "workFunction": 2.0},
		{"solveFor": "frequency", "KE": 1.0, "workFunction": -1.0},
		{"solveFor": "frequency", "KE": 1.0},
		{"solveFor": "workFunction", "KE": -1.0, "frequency": 1e15},
		{"solveFor": "workFunction", "KE": 1.0, "frequency": 0.0},
		{"solveFor": "workFunction", "KE": 1.0},
		{"solveFor": "KE"},
	} {
		if _, err := PhotoelectricEffect(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestHeisenberg_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := HeisenbergUncertainty(ctx, CalculationInput{"solveFor": "minDeltaX", "deltaP": 1e-24})
	if err != nil || got.Unit != "m" {
		t.Fatalf("minDeltaX = %+v, %v", got, err)
	}
	got, err = HeisenbergUncertainty(ctx, CalculationInput{"solveFor": "minDeltaP", "deltaX": 1e-10})
	if err != nil || got.Unit != "kg·m/s" {
		t.Fatalf("minDeltaP = %+v, %v", got, err)
	}
	if _, err := HeisenbergUncertainty(ctx, CalculationInput{}); err == nil {
		t.Error("expected error for default solveFor without deltaP")
	}
	for _, bad := range []CalculationInput{
		{"solveFor": "bogus"},
		{"solveFor": "minDeltaX", "deltaP": 0.0},
		{"solveFor": "minDeltaX", "deltaP": -1.0},
		{"solveFor": "minDeltaX"},
		{"solveFor": "minDeltaP", "deltaX": 0.0},
		{"solveFor": "minDeltaP", "deltaX": -1.0},
		{"solveFor": "minDeltaP"},
	} {
		if _, err := HeisenbergUncertainty(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}
