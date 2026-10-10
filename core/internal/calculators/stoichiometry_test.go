package calculators

import (
	"context"
	"testing"
)

func TestStoichiometry_ProductFromReactant(t *testing.T) {
	ctx := context.Background()
	got, err := Stoichiometry(ctx, CalculationInput{
		"equation": "2H2 + O2 -> 2H2O", "mode": "product-from-reactant",
		"reactantFormula": "H2", "productFormula": "H2O", "moles": 4.0,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(got.Value, 4.0, 1e-9) || got.Unit != "mol" {
		t.Errorf("value = %+v", got)
	}
	// Decimal coefficients.
	got, err = Stoichiometry(ctx, CalculationInput{
		"equation": "0.5H2 + 0.25O2 -> 0.5H2O", "mode": "product-from-reactant",
		"reactantFormula": "H2", "productFormula": "H2O", "moles": 1.0,
	})
	if err != nil || !approxEqual(got.Value, 1.0, 1e-9) {
		t.Errorf("decimal = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"mode": "product-from-reactant", "reactantFormula": "H2", "productFormula": "H2O", "moles": 1.0},
		{"mode": "product-from-reactant", "reactantFormula": "H2", "productFormula": "H2O", "moles": 1.0},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "product-from-reactant", "productFormula": "H2O", "moles": 1.0},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "product-from-reactant", "reactantFormula": "H2", "moles": 1.0},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "product-from-reactant", "reactantFormula": "H2", "productFormula": "H2O"},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "product-from-reactant", "reactantFormula": "H2", "productFormula": "H2O", "moles": 0.0},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "product-from-reactant", "reactantFormula": "H2", "productFormula": "H2O", "moles": -1.0},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "product-from-reactant", "reactantFormula": "N2", "productFormula": "H2O", "moles": 1.0},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "product-from-reactant", "reactantFormula": "H2", "productFormula": "CO2", "moles": 1.0},
		{"equation": "-> H2O", "mode": "product-from-reactant", "reactantFormula": "H2", "productFormula": "H2O", "moles": 1.0},
		{"equation": "0H2 + O2 -> H2O", "mode": "product-from-reactant", "reactantFormula": "H2", "productFormula": "H2O", "moles": 1.0},
		{"equation": "H2 + O2 -> 0H2O", "mode": "product-from-reactant", "reactantFormula": "H2", "productFormula": "H2O", "moles": 1.0},
	} {
		if _, err := Stoichiometry(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestStoichiometry_ReactantFromProduct(t *testing.T) {
	ctx := context.Background()
	got, err := Stoichiometry(ctx, CalculationInput{
		"equation": "2H2 + O2 -> 2H2O", "mode": "reactant-from-product",
		"productFormula": "H2O", "reactantFormula": "O2", "moles": 2.0,
	})
	if err != nil || !approxEqual(got.Value, 1.0, 1e-9) {
		t.Fatalf("reactant = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"equation": "2H2 + O2 -> 2H2O", "mode": "reactant-from-product", "reactantFormula": "O2", "moles": 1.0},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "reactant-from-product", "productFormula": "H2O", "moles": 1.0},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "reactant-from-product", "productFormula": "H2O", "reactantFormula": "O2"},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "reactant-from-product", "productFormula": "H2O", "reactantFormula": "O2", "moles": -1.0},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "reactant-from-product", "productFormula": "CO2", "reactantFormula": "O2", "moles": 1.0},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "reactant-from-product", "productFormula": "H2O", "reactantFormula": "N2", "moles": 1.0},
	} {
		if _, err := Stoichiometry(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestStoichiometry_LimitingReactant(t *testing.T) {
	ctx := context.Background()
	got, err := Stoichiometry(ctx, CalculationInput{
		"equation": "2H2 + O2 -> 2H2O", "mode": "limiting-reactant",
		"reactantMoles": map[string]float64{"H2": 3.0, "O2": 1.0},
		"targetProduct": "H2O",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !approxEqual(got.Value, 2.0, 1e-9) {
		t.Errorf("limiting = %+v", got)
	}
	if got.Metadata["limitingReactant"] != "O2" {
		t.Errorf("limiting reactant = %+v", got.Metadata)
	}
	// JSON-decoded map shape.
	got, err = Stoichiometry(ctx, CalculationInput{
		"equation": "2H2 + O2 -> 2H2O", "mode": "limiting-reactant",
		"reactantMoles": map[string]interface{}{"H2": 3.0, "O2": 1.0},
		"targetProduct": "H2O",
	})
	if err != nil {
		t.Fatalf("interface map: %v", err)
	}
	for _, bad := range []CalculationInput{
		{"equation": "2H2 + O2 -> 2H2O", "mode": "limiting-reactant", "targetProduct": "H2O"},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "limiting-reactant", "reactantMoles": "nope", "targetProduct": "H2O"},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "limiting-reactant", "reactantMoles": map[string]int{"H2": 3}, "targetProduct": "H2O"},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "limiting-reactant", "reactantMoles": map[string]float64{"H2": 3.0, "O2": 1.0}},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "limiting-reactant", "reactantMoles": map[string]float64{"H2": 3.0, "O2": 1.0}, "targetProduct": "CO2"},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "limiting-reactant", "reactantMoles": map[string]float64{"H2": 3.0}, "targetProduct": "H2O"},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "limiting-reactant", "reactantMoles": map[string]float64{"H2": 0.0, "O2": 1.0}, "targetProduct": "H2O"},
		{"equation": "-> H2O", "mode": "limiting-reactant", "reactantMoles": map[string]float64{}, "targetProduct": "H2O"},
		{"equation": "2H2 + O2 -> 2H2O", "mode": "bogus"},
		{"equation": "H2 + O2", "mode": "product-from-reactant", "reactantFormula": "H2", "productFormula": "H2O", "moles": 1.0},
	} {
		if _, err := Stoichiometry(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestParseStoichTerm_EdgeCases(t *testing.T) {
	if got := parseStoichTerm(""); got.Coefficient != 1.0 {
		t.Errorf("empty term = %+v", got)
	}
	// 400-digit coefficient overflows float64 -> falls back to 1.
	long := ""
	for i := 0; i < 400; i++ {
		long += "9"
	}
	if got := parseStoichTerm(long + "H2"); got.Coefficient != 1.0 || got.Formula != "H2" {
		t.Errorf("overflow term = %+v", got)
	}
	if got := parseStoichTerm("2H2O"); got.Coefficient != 2.0 || got.Formula != "H2O" {
		t.Errorf("normal term = %+v", got)
	}
	if _, _, err := parseStoichEquation("H2 + O2"); err == nil {
		t.Error("expected error for arrow-less equation")
	}
}
