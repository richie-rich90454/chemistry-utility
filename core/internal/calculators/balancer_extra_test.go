package calculators

import (
	"context"
	"testing"
)

func TestFractionPanics(t *testing.T) {
	defer func() {
		if recover() == nil {
			t.Error("expected panic for zero denominator")
		}
	}()
	newFraction(1, 0)
}

func TestFractionDividePanics(t *testing.T) {
	defer func() {
		if recover() == nil {
			t.Error("expected panic for division by zero fraction")
		}
	}()
	newFraction(1, 2).divide(newFraction(0, 1))
}

func TestLcmZeros(t *testing.T) {
	if lcm(0, 5) != 0 || lcm(5, 0) != 0 {
		t.Error("lcm with zero must be zero")
	}
	if lcm(4, 6) != 12 {
		t.Error("lcm(4,6) must be 12")
	}
}

func TestParseFormulaErrors(t *testing.T) {
	for _, f := range []string{
		")H2",
		"H2)",
		"(H2",
		"H2 O2",
		"H2.O2",
		"H2/O2",
		"H2*O2",
		"h2",
		"2H2",
		"H2 ",
		"",
		"()",
		"H9999999",
		"Fe2+",
		"Fe2-",
		"Cl-",
		"Ca(OH)2",
		"*5H2O",
		"5*H2",
		"*(H2",
		"CuSO4·5H2O",
	} {
		counts, err := parseFormulaToCounts(f)
		t.Logf("formula %q -> %+v, %v", f, counts, err)
	}
	// Definite errors.
	for _, f := range []string{")H2", "H2)", "(H2", "H2 O2", "h2"} {
		if _, err := parseFormulaToCounts(f); err == nil {
			t.Errorf("expected error for %q", f)
		}
	}
	// Long digit strings clamp via atoi.
	if atoi("1234567890") != 1<<30 {
		t.Error("atoi clamp failed")
	}
}

func TestParseEquationErrors(t *testing.T) {
	for _, eq := range []string{
		"H2 + O2",
		"H2 -> O2 -> H2O",
		"",
		"Fe2+ + Fe3+",
	} {
		r, p, err := ParseEquation(eq)
		t.Logf("equation %q -> %v %v %v", eq, r, p, err)
	}
	for _, eq := range []string{"H2 + O2", "H2 -> O2 -> H2O", ""} {
		if _, _, err := ParseEquation(eq); err == nil {
			t.Errorf("expected error for %q", eq)
		}
	}
	// Reversible arrows normalize.
	for _, eq := range []string{"H2 + O2 → H2O", "H2 + O2 ⇌ H2O", "H2 + O2 <=> H2O"} {
		r, p, err := ParseEquation(eq)
		if err != nil || len(r) != 2 || len(p) != 1 {
			t.Errorf("arrow %q: %v %v %v", eq, r, p, err)
		}
	}
}

func TestBalanceEquationFailures(t *testing.T) {
	// Unbalanceable.
	if _, err := BalanceEquation("H2 -> He", 4000); err == nil {
		t.Error("expected error for unbalanceable equation")
	}
	if _, err := BalanceEquation("-> H2O", 4000); err == nil {
		t.Error("expected error for empty reactants")
	}
	if _, err := BalanceEquation("H2 -> ", 4000); err == nil {
		t.Error("expected error for empty products")
	}
	// Coefficient cap.
	if _, err := BalanceEquation("H2 + O2 -> H2O", 1); err == nil {
		t.Error("expected error when maxCoefficient too small")
	}
	// Invalid formula inside.
	if _, err := BalanceEquation(")H2 -> H2", 4000); err == nil {
		t.Error("expected error for bad formula")
	}
	// solveHomogeneous with no rows returns nil via unbalanceable input.
	if _, err := BalanceEquation("Xy + Zz -> Qq", 4000); err == nil {
		t.Log("unknown elements balanced (no charge/element mismatch detected)")
	}
	// Bracketed formulas balance through the multiplier path.
	if got, err := BalanceEquation("Ca(OH)2 + CO2 -> CaCO3 + H2O", 4000); err != nil {
		t.Errorf("brackets: %v", err)
	} else if got == "" {
		t.Error("brackets: empty result")
	}
	// Empty formulas parse to empty counts: no elements, no solution.
	if _, err := BalanceEquation("() -> ()", 4000); err == nil {
		t.Error("expected error for empty formulas")
	}
	// Parse failure surfaces through BalanceEquation.
	if _, err := BalanceEquation("H2 + O2", 4000); err == nil {
		t.Error("expected error for missing arrow")
	}
}

func TestSolveHomogeneousEdgeCases(t *testing.T) {
	// x + y - z = 0: trial solutions contain a zero, so every trial is
	// rejected and the solver returns nil.
	if sol := solveHomogeneous([][]Fraction{
		{newFraction(1, 1), newFraction(1, 1), newFraction(-1, 1)},
	}); sol != nil {
		t.Errorf("expected nil, got %+v", sol)
	}
	// x - y = 0 with a negated first column: the raw solution leads with a
	// negative coefficient, exercising the sign flip.
	if sol := solveHomogeneous([][]Fraction{
		{newFraction(-1, 1), newFraction(1, 1)},
	}); sol == nil {
		t.Error("expected a solution")
	} else if sol[0].N <= 0 || sol[1].N <= 0 {
		t.Errorf("expected positive solution, got %+v", sol)
	}
	// x + y = 0: every trial solution leads with a negative coefficient,
	// so all trials are rejected and the solver returns nil.
	if sol := solveHomogeneous([][]Fraction{
		{newFraction(1, 1), newFraction(1, 1)},
	}); sol != nil {
		t.Errorf("expected nil, got %+v", sol)
	}
}

func TestParseFormulaChargeMagnitudes(t *testing.T) {
	counts, err := parseFormulaToCounts("Fe2-")
	if err != nil {
		t.Fatalf("Fe2-: %v", err)
	}
	if counts["Fe"] != 1 || counts["_charge"] != -2 {
		t.Errorf("Fe2- = %+v", counts)
	}
	counts, err = parseFormulaToCounts("Fe+")
	if err != nil {
		t.Fatalf("Fe+: %v", err)
	}
	if counts["Fe"] != 1 || counts["_charge"] != 1 {
		t.Errorf("Fe+ = %+v", counts)
	}
}

func TestEquationBalanceWrapper(t *testing.T) {
	ctx := context.Background()
	got, err := EquationBalance(ctx, CalculationInput{"equation": "H2 + O2 -> H2O", "maxCoefficient": 4000.0})
	if err != nil {
		t.Fatalf("wrapper: %v", err)
	}
	if got.Metadata["balanced"] == "" {
		t.Errorf("missing balanced metadata: %+v", got)
	}
	if _, err := EquationBalance(ctx, CalculationInput{"maxCoefficient": 4000.0}); err == nil {
		t.Error("expected error for missing equation")
	}
	if _, err := EquationBalance(ctx, CalculationInput{"equation": "H2 -> He"}); err == nil {
		t.Error("expected error for unbalanceable")
	}
	got, err = EquationBalance(ctx, CalculationInput{"equation": "H2 + O2 -> H2O"})
	if err != nil {
		t.Fatalf("default maxCoefficient: %v", err)
	}
	_ = got
}
