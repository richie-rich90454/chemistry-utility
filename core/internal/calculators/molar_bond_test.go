package calculators

import (
	"context"
	"testing"
)

func TestMolarMass_ExtraBranches(t *testing.T) {
	ctx := context.Background()
	// Hydrate.
	got, err := CalculateMolarMass(ctx, CalculationInput{"formula": "CuSO4·5H2O"})
	if err != nil || got.Value <= 200 {
		t.Errorf("hydrate = %+v, %v", got, err)
	}
	// Whitespace is stripped before parsing.
	if _, err := CalculateMolarMass(ctx, CalculationInput{"formula": "H2 O"}); err != nil {
		t.Errorf("spaced formula: %v", err)
	}
	// Charge suffixes stripped for mass.
	got, err = CalculateMolarMass(ctx, CalculationInput{"formula": "Fe2+"})
	if err != nil {
		t.Errorf("Fe2+ mass: %v", err)
	} else if len(got.Breakdown) != 1 {
		t.Errorf("Fe2+ breakdown = %+v", got.Breakdown)
	}
	if _, err := CalculateMolarMass(ctx, CalculationInput{"formula": "Cl-"}); err != nil {
		t.Errorf("Cl- mass: %v", err)
	}
	// Multi-uppercase body with charge digits: sign stripped, digits kept.
	if _, err := CalculateMolarMass(ctx, CalculationInput{"formula": "NaCl2+"}); err != nil {
		t.Errorf("NaCl2+ mass: %v", err)
	}
	if _, err := CalculateMolarMass(ctx, CalculationInput{"formula": "SO4^2-"}); err != nil {
		t.Errorf("SO4^2- mass: %v", err)
	}
	// Caret with nothing after it.
	if _, err := CalculateMolarMass(ctx, CalculationInput{"formula": "H2O^"}); err != nil {
		t.Errorf("H2O^ mass: %v", err)
	}
	// Hydrate edge parts.
	for _, f := range []string{"CuSO4·", "·5H2O", "CuSO4••5H2O", "CaO·P2O5"} {
		got, err := CalculateMolarMass(ctx, CalculationInput{"formula": f})
		t.Logf("hydrate %q -> %v, %v", f, got.Value, err)
	}
	// Errors.
	for _, f := range []string{"", "Xy2", "H2)", "(H2", "h2", "H99999999", "H2*" + "(", "Fe2+2+"} {
		if _, err := CalculateMolarMass(ctx, CalculationInput{"formula": f}); err == nil {
			t.Errorf("expected error for %q", f)
		}
	}
	// Bracket-multiplier overflow and hydrate edge parts.
	for _, f := range []string{"(H2)99999999", "*(H2", "12-", "()"} {
		if _, err := CalculateMolarMass(ctx, CalculationInput{"formula": f}); err == nil {
			t.Errorf("expected error for %q", f)
		}
	}
	for _, f := range []string{"5*H2", "*H2"} {
		// Degenerate hydrate parts are skipped; the remainder still parses.
		if _, err := CalculateMolarMass(ctx, CalculationInput{"formula": f}); err != nil {
			t.Errorf("unexpected error for %q: %v", f, err)
		}
	}
	if _, err := CalculateMolarMass(ctx, CalculationInput{}); err == nil {
		t.Error("expected error for missing formula")
	}
	// parseElement / parseNumber edges.
	if _, _, err := parseElement("H2O", 99); err == nil {
		t.Error("expected error for OOB element parse")
	}
	if _, _, err := parseElement("2H", 0); err == nil {
		t.Error("expected error for lowercase start")
	}
	if _, _, err := parseNumber("H12345678", 1); err == nil {
		t.Error("expected error for huge subscript")
	}
	if n, _, err := parseNumber("H2O", 1); err != nil || n != 2 {
		t.Errorf("parseNumber = %d, %v", n, err)
	}
	if n, _, err := parseNumber("HO", 2); err != nil || n != 1 {
		t.Errorf("parseNumber default = %d, %v", n, err)
	}
}

func TestBondType_ExtraBranches(t *testing.T) {
	ctx := context.Background()
	// Metallic.
	got, err := BondType(ctx, CalculationInput{"element1": "Fe", "element2": "Cu"})
	if err != nil || got.Metadata["bondType"] != "Metallic" {
		t.Errorf("metallic = %+v, %v", got, err)
	}
	// Polar covalent: C-O ΔEN=0.89 lands in [0.4, 2.0).
	got, err = BondType(ctx, CalculationInput{"element1": "C", "element2": "O"})
	if err != nil || got.Metadata["bondType"] != "Polar Covalent" {
		t.Errorf("C-O = %+v, %v", got, err)
	}
	// H-F: large delta but both non-metals -> Polar Covalent under the 2.0 rule.
	got, err = BondType(ctx, CalculationInput{"element1": "H", "element2": "F"})
	if err != nil {
		t.Fatalf("H-F: %v", err)
	}
	t.Logf("H-F bond type = %v", got.Metadata["bondType"])
	// F-Si: ΔEN = 2.08 ≥ 2.0 between two non-metals -> Ionic.
	got, err = BondType(ctx, CalculationInput{"element1": "F", "element2": "Si"})
	if err != nil || got.Metadata["bondType"] != "Ionic" {
		t.Errorf("F-Si = %+v, %v", got, err)
	}
	// Noble gas without EN data.
	got, err = BondType(ctx, CalculationInput{"element1": "He", "element2": "O"})
	if err != nil || got.Metadata["bondType"] != "Unknown" {
		t.Errorf("He-O = %+v, %v", got, err)
	}
	// Lowercase normalization.
	if _, err := BondType(ctx, CalculationInput{"element1": "na", "element2": "cl"}); err != nil {
		t.Errorf("lowercase: %v", err)
	}
	for _, bad := range []CalculationInput{
		{"element1": "", "element2": "O"},
		{"element1": "H"},
		{"element2": "O"},
		{"element1": "Xy", "element2": "O"},
		{"element1": "H", "element2": "Zz"},
	} {
		if _, err := BondType(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}
