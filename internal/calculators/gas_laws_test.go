package calculators

import (
	"context"
	"testing"
)

func TestIdealGasLaw_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := IdealGasLaw(ctx, CalculationInput{"V": 22.4, "n": 1.0, "T": 273.15, "solveFor": "P"})
	if err != nil || got.Unit != "atm" {
		t.Fatalf("P = %+v, %v", got, err)
	}
	got, err = IdealGasLaw(ctx, CalculationInput{"V": 0.0224, "n": 1.0, "T": 273.15, "solveFor": "P", "units": "SI"})
	if err != nil || got.Unit != "Pa" {
		t.Fatalf("SI P = %+v, %v", got, err)
	}
	got, err = IdealGasLaw(ctx, CalculationInput{"P": 1.0, "n": 1.0, "T": 273.15, "solveFor": "V"})
	if err != nil || got.Unit != "L" {
		t.Fatalf("V = %+v, %v", got, err)
	}
	got, err = IdealGasLaw(ctx, CalculationInput{"P": 101325.0, "n": 1.0, "T": 273.15, "solveFor": "V", "units": "SI"})
	if err != nil || got.Unit != "m³" {
		t.Fatalf("SI V = %+v, %v", got, err)
	}
	got, err = IdealGasLaw(ctx, CalculationInput{"P": 1.0, "V": 22.4, "T": 273.15, "solveFor": "n"})
	if err != nil || got.Unit != "mol" {
		t.Fatalf("n = %+v, %v", got, err)
	}
	got, err = IdealGasLaw(ctx, CalculationInput{"P": 1.0, "V": 22.4, "n": 1.0, "solveFor": "T"})
	if err != nil || got.Unit != "K" {
		t.Fatalf("T = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"solveFor": "bogus"},
		{},
		{"V": 1.0, "n": 1.0, "T": 273.15, "solveFor": "P", "units": "bogus"},
		{"V": 0.0, "n": 1.0, "T": 273.15, "solveFor": "P"},
		{"V": -1.0, "n": 1.0, "T": 273.15, "solveFor": "P"},
		{"V": 1.0, "n": -1.0, "T": 273.15, "solveFor": "P"},
		{"V": 1.0, "n": 1.0, "T": 0.0, "solveFor": "P"},
		{"P": 0.0, "n": 1.0, "T": 273.15, "solveFor": "V"},
		{"P": -1.0, "n": 1.0, "T": 273.15, "solveFor": "V"},
		{"P": 1.0, "n": 1.0, "T": -5.0, "solveFor": "V"},
		{"P": 1.0, "V": 1.0, "T": 0.0, "solveFor": "n"},
		{"P": -1.0, "V": 1.0, "T": 273.15, "solveFor": "n"},
		{"P": 1.0, "V": -1.0, "T": 273.15, "solveFor": "n"},
		{"P": 1.0, "V": 1.0, "n": 0.0, "solveFor": "T"},
		{"P": 1.0, "V": 1.0, "n": -1.0, "solveFor": "T"},
		{"P": -1.0, "V": 1.0, "n": 1.0, "solveFor": "T"},
		{"P": 1.0, "V": 1.0, "n": 1.0},
	} {
		if _, err := IdealGasLaw(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestCombinedGasLaw_AllBranches(t *testing.T) {
	ctx := context.Background()
	valid := CalculationInput{"P1": 1.0, "V1": 1.0, "T1": 273.15, "P2": 2.0, "V2": 1.0, "T2": 273.15}
	for _, s := range []string{"P1", "V1", "T1", "P2", "V2", "T2"} {
		in := CalculationInput{}
		for k, v := range valid {
			in[k] = v
		}
		in["solveFor"] = s
		got, err := CombinedGasLaw(ctx, in)
		if err != nil {
			t.Errorf("solveFor %s: %v", s, err)
			continue
		}
		if got.Value <= 0 {
			t.Errorf("solveFor %s: value = %v", s, got.Value)
		}
	}
	if _, err := CombinedGasLaw(ctx, CalculationInput{"solveFor": "bogus"}); err == nil {
		t.Error("expected error for bad solveFor")
	}
	if _, err := CombinedGasLaw(ctx, CalculationInput{}); err == nil {
		t.Error("expected error for missing solveFor")
	}
	// Absolute-temperature and negativity guards per branch.
	negT := CalculationInput{"P1": 1.0, "V1": 1.0, "T1": -5.0, "P2": 1.0, "V2": 1.0, "T2": 273.15, "solveFor": "P1"}
	if _, err := CombinedGasLaw(ctx, negT); err == nil {
		t.Error("expected error for negative T1")
	}
	negT2 := CalculationInput{"P1": 1.0, "V1": 1.0, "T1": 273.15, "P2": 1.0, "V2": 1.0, "T2": 0.0, "solveFor": "T1"}
	if _, err := CombinedGasLaw(ctx, negT2); err == nil {
		t.Error("expected error for zero T2")
	}
	negP := CalculationInput{"P1": 1.0, "V1": 1.0, "T1": 273.15, "P2": -1.0, "V2": 1.0, "T2": 273.15, "solveFor": "V2"}
	if _, err := CombinedGasLaw(ctx, negP); err == nil {
		t.Error("expected error for negative P2")
	}
	zeroDiv := CalculationInput{"P1": 1.0, "V1": 0.0, "T1": 273.15, "P2": 1.0, "V2": 1.0, "T2": 273.15, "solveFor": "P1"}
	if _, err := CombinedGasLaw(ctx, zeroDiv); err == nil {
		t.Error("expected error for zero V1")
	}
}

func TestVanDerWaals_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := VanDerWaals(ctx, CalculationInput{"V": 22.4, "n": 1.0, "T": 273.15, "a": 3.59, "b": 0.0427})
	if err != nil || got.Unit != "atm" {
		t.Fatalf("vdW = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"V": 0.0, "n": 1.0, "T": 273.15, "a": 1.0, "b": 0.01},
		{"V": 1.0, "n": 0.0, "T": 273.15, "a": 1.0, "b": 0.01},
		{"V": 1.0, "n": 1.0, "T": 0.0, "a": 1.0, "b": 0.01},
		{"V": 1.0, "n": 1.0, "T": 273.15, "a": -1.0, "b": 0.01},
		{"V": 1.0, "n": 1.0, "T": 273.15, "a": 1.0, "b": -0.01},
		{"V": 0.001, "n": 10.0, "T": 273.15, "a": 1.0, "b": 0.01},
		{"V": 1.0, "n": 1.0, "T": 273.15, "a": 1.0},
	} {
		if _, err := VanDerWaals(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}
