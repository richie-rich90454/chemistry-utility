package calculators

import (
	"context"
	"math"
	"testing"
)

func approxEqual(a, b, tolerance float64) bool {
	return math.Abs(a-b) < tolerance
}

func TestMolarMass_H2O(t *testing.T) {
	ctx := context.Background()
	result, err := CalculateMolarMass(ctx, CalculationInput{"formula": "H2O"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 18.015, 0.01) {
		t.Errorf("H2O molar mass = %.3f, want ~18.015 g/mol", result.Value)
	}
	if result.Unit != "g/mol" {
		t.Errorf("unit = %s, want g/mol", result.Unit)
	}
	if len(result.Breakdown) != 2 {
		t.Errorf("expected 2 breakdown items (H and O), got %d", len(result.Breakdown))
	}
}

func TestMolarMass_NaCl(t *testing.T) {
	ctx := context.Background()
	result, err := CalculateMolarMass(ctx, CalculationInput{"formula": "NaCl"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 58.44, 0.02) {
		t.Errorf("NaCl molar mass = %.3f, want ~58.44 g/mol", result.Value)
	}
}

func TestMolarMass_Al2SO43(t *testing.T) {
	ctx := context.Background()
	result, err := CalculateMolarMass(ctx, CalculationInput{"formula": "Al2(SO4)3"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 342.15, 0.15) {
		t.Errorf("Al2(SO4)3 molar mass = %.3f, want ~342.15 g/mol", result.Value)
	}
}

func TestEquationBalancing_H2O(t *testing.T) {
	balanced, err := BalanceEquation("H2 + O2 -> H2O", 4000)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := "2H2 + O2 -> 2H2O"
	if balanced != expected {
		t.Errorf("balanced = %s, want %s", balanced, expected)
	}
}

func TestEquationBalancing_C3H8(t *testing.T) {
	balanced, err := BalanceEquation("C3H8 + O2 -> CO2 + H2O", 4000)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := "C3H8 + 5O2 -> 3CO2 + 4H2O"
	if balanced != expected {
		t.Errorf("balanced = %s, want %s", balanced, expected)
	}
}

func TestIdealGasLaw_SolveForN(t *testing.T) {
	ctx := context.Background()
	result, err := IdealGasLaw(ctx, CalculationInput{
		"P":        1.0,
		"V":        22.4,
		"T":        273.15,
		"solveFor": "n",
		"units":    "atm-L",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 1.0, 0.01) {
		t.Errorf("n = %.4f, want ~1.0 mol", result.Value)
	}
	if result.Unit != "mol" {
		t.Errorf("unit = %s, want mol", result.Unit)
	}
}

func TestDilution_SolveForV2(t *testing.T) {
	ctx := context.Background()
	result, err := Dilution(ctx, CalculationInput{
		"C1":       6.0,
		"V1":       50.0,
		"C2":       3.0,
		"solveFor": "V2",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 100.0, 0.01) {
		t.Errorf("V2 = %.4f, want 100.0", result.Value)
	}
}

func TestGibbsFreeEnergy(t *testing.T) {
	ctx := context.Background()
	result, err := GibbsFreeEnergy(ctx, CalculationInput{
		"deltaH": -92.4,
		"deltaS": -198.8,
		"T":      298.15,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// ΔG = -92.4 - 298.15 * (-198.8/1000) = -92.4 + 59.27 = -33.13
	if !approxEqual(result.Value, -33.15, 0.1) {
		t.Errorf("ΔG = %.4f, want ~-33.15 kJ/mol", result.Value)
	}
}

func TestArrhenius(t *testing.T) {
	ctx := context.Background()
	result, err := Arrhenius(ctx, CalculationInput{
		"A":        1e13,
		"Ea":       75000.0,
		"T":        298.0,
		"solveFor": "k",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// k = 1e13 * exp(-75000 / (8.314 * 298))
	expected := 1e13 * math.Exp(-75000.0/(8.314*298.0))
	if !approxEqual(result.Value, expected, expected*0.001) {
		t.Errorf("k = %.6e, want %.6e", result.Value, expected)
	}
}

func TestBufferSolution(t *testing.T) {
	ctx := context.Background()
	result, err := BufferSolution(ctx, CalculationInput{
		"pKa": 4.76,
		"HA":  0.1,
		"A":   0.2,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 5.06, 0.01) {
		t.Errorf("pH = %.4f, want ~5.06", result.Value)
	}
}

func TestHalfLife_Remaining(t *testing.T) {
	ctx := context.Background()
	result, err := HalfLife(ctx, CalculationInput{
		"N0":       100.0,
		"t":        10.0,
		"halfLife": 5.0,
		"solveFor": "remaining",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 25.0, 0.01) {
		t.Errorf("N = %.4f, want 25.0", result.Value)
	}
}

func TestCellPotential(t *testing.T) {
	ctx := context.Background()
	result, err := CellPotential(ctx, CalculationInput{
		"E1": 0.34,
		"E2": -0.76,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 1.10, 0.01) {
		t.Errorf("E°cell = %.4f, want ~1.10 V", result.Value)
	}
}

func TestBondType_NaCl(t *testing.T) {
	ctx := context.Background()
	result, err := BondType(ctx, CalculationInput{
		"element1": "Na",
		"element2": "Cl",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	bondType := result.Metadata["bondType"].(string)
	if bondType != "Ionic" {
		t.Errorf("Na-Cl bond type = %s, want Ionic", bondType)
	}
}

func TestBondType_H2(t *testing.T) {
	ctx := context.Background()
	result, err := BondType(ctx, CalculationInput{
		"element1": "H",
		"element2": "H",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	bondType := result.Metadata["bondType"].(string)
	if bondType != "Nonpolar Covalent" {
		t.Errorf("H-H bond type = %s, want Nonpolar Covalent", bondType)
	}
}

func TestRegistry(t *testing.T) {
	r := NewRegistry()
	list := r.List()
	if len(list) != 31 {
		t.Errorf("expected 31 calculator types, got %d", len(list))
	}
	_, ok := r.Get("molar-mass")
	if !ok {
		t.Error("expected molar-mass to be registered")
	}
	_, ok = r.Get("heisenberg-uncertainty")
	if !ok {
		t.Error("expected heisenberg-uncertainty to be registered")
	}
	_, ok = r.Get("nonexistent")
	if ok {
		t.Error("expected nonexistent to not be registered")
	}
}

func TestCombinedGasLaw(t *testing.T) {
	ctx := context.Background()
	result, err := CombinedGasLaw(ctx, CalculationInput{
		"P1":       1.0,
		"V1":       1.0,
		"T1":       273.15,
		"P2":       2.0,
		"T2":       273.15,
		"solveFor": "V2",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 0.5, 0.001) {
		t.Errorf("V2 = %.4f, want 0.5", result.Value)
	}
}

func TestHeatCapacity(t *testing.T) {
	ctx := context.Background()
	result, err := HeatCapacity(ctx, CalculationInput{
		"m":        100.0,
		"c":        4.184,
		"deltaT":   10.0,
		"solveFor": "q",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 4184.0, 0.1) {
		t.Errorf("q = %.4f, want 4184.0 J", result.Value)
	}
}

func TestNernstEquation(t *testing.T) {
	ctx := context.Background()
	result, err := Nernst(ctx, CalculationInput{
		"E_standard": 1.10,
		"T":          298.15,
		"n":          2.0,
		"Q":          1.0,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 1.10, 0.01) {
		t.Errorf("E = %.4f, want 1.10 V (when Q=1)", result.Value)
	}
}

func TestMassPercent(t *testing.T) {
	ctx := context.Background()
	result, err := MassPercent(ctx, CalculationInput{
		"solute":   10.0,
		"solution": 100.0,
		"unit":     "percent",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(result.Value, 10.0, 0.01) {
		t.Errorf("mass percent = %.4f, want 10.0%%", result.Value)
	}
}

func TestElectrolysis(t *testing.T) {
	ctx := context.Background()
	result, err := Electrolysis(ctx, CalculationInput{
		"I":        1.0,
		"t":        965.0,
		"z":        1.0,
		"M":        63.546,
		"solveFor": "mass",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// moles = (1 * 965) / (96485 * 1) ≈ 0.01, mass ≈ 0.01 * 63.546 ≈ 0.635
	expected := (1.0 * 965.0) / (96485.0 * 1.0) * 63.546
	if !approxEqual(result.Value, expected, 0.01) {
		t.Errorf("mass = %.4f, want %.4f g", result.Value, expected)
	}
}
