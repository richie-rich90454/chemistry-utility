package calculators

import (
	"context"
	"math"
	"testing"
)

func TestDilution_AllBranches(t *testing.T) {
	ctx := context.Background()
	cases := []struct {
		name    string
		input   CalculationInput
		want    float64
		wantErr bool
	}{
		{"C1", CalculationInput{"V1": 1.0, "C2": 2.0, "V2": 1.0, "solveFor": "C1"}, 2.0, false},
		{"V1", CalculationInput{"C1": 2.0, "C2": 1.0, "V2": 1.0, "solveFor": "V1"}, 0.5, false},
		{"C2", CalculationInput{"C1": 2.0, "V1": 1.0, "V2": 1.0, "solveFor": "C2"}, 2.0, false},
		{"V2", CalculationInput{"C1": 6.0, "V1": 50.0, "C2": 3.0, "solveFor": "V2"}, 100.0, false},
		{"badSolveFor", CalculationInput{"solveFor": "CX"}, 0, true},
		{"missingSolveFor", CalculationInput{}, 0, true},
		{"zeroV1", CalculationInput{"V1": 0.0, "C2": 1.0, "V2": 1.0, "solveFor": "C1"}, 0, true},
		{"zeroC1", CalculationInput{"C1": 0.0, "C2": 1.0, "V2": 1.0, "solveFor": "V1"}, 0, true},
		{"zeroV2", CalculationInput{"C1": 1.0, "V1": 1.0, "V2": 0.0, "solveFor": "C2"}, 0, true},
		{"zeroC2", CalculationInput{"C1": 1.0, "V1": 1.0, "C2": 0.0, "solveFor": "V2"}, 0, true},
		{"negV1", CalculationInput{"V1": -1.0, "C2": 1.0, "V2": 1.0, "solveFor": "C1"}, 0, true},
		{"negC2V1", CalculationInput{"C1": -1.0, "C2": 1.0, "V2": 1.0, "solveFor": "V1"}, 0, true},
		{"negC1", CalculationInput{"C1": 1.0, "V1": -1.0, "V2": 1.0, "solveFor": "C2"}, 0, true},
		{"negV2", CalculationInput{"C1": 1.0, "V1": 1.0, "C2": -1.0, "solveFor": "V2"}, 0, true},
		{"nanInput", CalculationInput{"V1": math.NaN(), "C2": 1.0, "V2": 1.0, "solveFor": "C1"}, 0, true},
		{"infInput", CalculationInput{"V1": math.Inf(1), "C2": 1.0, "V2": 1.0, "solveFor": "C1"}, 0, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := Dilution(ctx, tc.input)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("expected error, got %+v", got)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !approxEqual(got.Value, tc.want, 1e-9) {
				t.Errorf("value = %v, want %v", got.Value, tc.want)
			}
		})
	}
}

func TestMassPercent_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := MassPercent(ctx, CalculationInput{"solute": 10.0, "solution": 100.0, "unit": "percent"})
	if err != nil || !approxEqual(got.Value, 10.0, 1e-9) {
		t.Fatalf("percent = %+v, %v", got, err)
	}
	got, err = MassPercent(ctx, CalculationInput{"solute": 1.0, "solution": 1000.0, "unit": "ppm"})
	if err != nil || !approxEqual(got.Value, 1000.0, 1e-9) {
		t.Fatalf("ppm = %+v, %v", got, err)
	}
	got, err = MassPercent(ctx, CalculationInput{"solute": 1.0, "solution": 1e9, "unit": "ppb"})
	if err != nil || !approxEqual(got.Value, 1.0, 1e-9) {
		t.Fatalf("ppb = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"solute": 10.0, "solution": 100.0, "unit": "bogus"},
		{"solute": 10.0, "solution": 0.0},
		{"solute": 10.0, "solution": -5.0},
		{"solute": -1.0, "solution": 100.0},
		{"solute": 150.0, "solution": 100.0},
		{"solute": math.NaN(), "solution": 100.0},
		{"solution": 100.0},
		{"solute": 10.0},
	} {
		if _, err := MassPercent(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestSolutionMixing_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := SolutionMixing(ctx, CalculationInput{"C1": 2.0, "V1": 1.0, "C2": 0.0, "V2": 1.0})
	if err != nil || !approxEqual(got.Value, 1.0, 1e-9) {
		t.Fatalf("mixing = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"C1": 1.0, "V1": 0.0, "C2": 1.0, "V2": 1.0},
		{"C1": 1.0, "V1": 1.0, "C2": 1.0, "V2": -1.0},
		{"C1": -1.0, "V1": 1.0, "C2": 1.0, "V2": 1.0},
		{"C1": 1.0, "V1": 1.0, "C2": -1.0, "V2": 1.0},
		{"C1": 1.0, "V1": 1.0, "C2": 1.0},
	} {
		if _, err := SolutionMixing(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestBufferSolution_Errors(t *testing.T) {
	ctx := context.Background()
	for _, bad := range []CalculationInput{
		{"pKa": 4.76, "HA": 0.0, "A": 0.1},
		{"pKa": 4.76, "HA": 0.1, "A": -0.1},
		{"pKa": 4.76, "HA": 0.1},
		{"HA": 0.1, "A": 0.1},
	} {
		if _, err := BufferSolution(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestPKaPKb_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := PKaPKb(ctx, CalculationInput{"pKa": 4.76, "solveFor": "pKb"})
	if err != nil || !approxEqual(got.Value, 9.24, 1e-9) {
		t.Fatalf("pKb = %+v, %v", got, err)
	}
	got, err = PKaPKb(ctx, CalculationInput{"pKb": 9.24, "solveFor": "pKa"})
	if err != nil || !approxEqual(got.Value, 4.76, 1e-9) {
		t.Fatalf("pKa = %+v, %v", got, err)
	}
	got, err = PKaPKb(ctx, CalculationInput{"pKa": 4.76, "solveFor": "pKb", "pKw": 14.0})
	if err != nil {
		t.Fatalf("custom pKw: %v", err)
	}
	for _, bad := range []CalculationInput{
		{"solveFor": "bogus"},
		{"solveFor": "pKb"},
		{"solveFor": "pKa"},
	} {
		if _, err := PKaPKb(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestKsp_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := Ksp(ctx, CalculationInput{"mode": "ksp-to-solubility", "Ksp": 1.8e-10, "cationCount": 1.0, "anionCount": 1.0})
	if err != nil || got.Value <= 0 {
		t.Fatalf("ksp->s = %+v, %v", got, err)
	}
	got, err = Ksp(ctx, CalculationInput{"mode": "solubility-to-ksp", "molarSolubility": 1e-5, "cationCount": 1.0, "anionCount": 2.0})
	if err != nil || got.Value <= 0 {
		t.Fatalf("s->ksp = %+v, %v", got, err)
	}
	for _, bad := range []CalculationInput{
		{"mode": "bogus"},
		{"mode": "ksp-to-solubility"},
		{"mode": "ksp-to-solubility", "Ksp": 0.0},
		{"mode": "ksp-to-solubility", "Ksp": -1.0},
		{"mode": "ksp-to-solubility", "Ksp": 1e-10, "cationCount": 0.0},
		{"mode": "ksp-to-solubility", "Ksp": 1e-10, "anionCount": -1.0},
		{"mode": "ksp-to-solubility", "Ksp": 1e-10, "cationCount": 1.5},
		{"mode": "ksp-to-solubility", "Ksp": 1e-10, "anionCount": 1.5},
		{"mode": "solubility-to-ksp"},
		{"mode": "solubility-to-ksp", "molarSolubility": 0.0},
		{"mode": "solubility-to-ksp", "molarSolubility": -1.0},
	} {
		if _, err := Ksp(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestColligative_AllBranches(t *testing.T) {
	ctx := context.Background()
	got, err := ColligativeProperties(ctx, CalculationInput{"mode": "boiling", "Kb": 0.512, "m": 1.0, "i": 2.0})
	if err != nil || !approxEqual(got.Value, 1.024, 1e-9) {
		t.Fatalf("boiling = %+v, %v", got, err)
	}
	got, err = ColligativeProperties(ctx, CalculationInput{"mode": "freezing", "Kf": 1.86, "m": 1.0})
	if err != nil || !approxEqual(got.Value, 1.86, 1e-9) {
		t.Fatalf("freezing = %+v, %v", got, err)
	}
	got, err = ColligativeProperties(ctx, CalculationInput{"mode": "osmotic", "M": 1.0, "T": 298.15, "i": 1.0})
	if err != nil || got.Value <= 0 {
		t.Fatalf("osmotic = %+v, %v", got, err)
	}
	if got.Unit != "kPa" {
		t.Errorf("osmotic unit = %s", got.Unit)
	}
	for _, bad := range []CalculationInput{
		{"mode": "bogus"},
		{"mode": "boiling", "Kb": 0.512, "m": 1.0, "i": 0.0},
		{"mode": "boiling", "Kb": 0.0, "m": 1.0},
		{"mode": "boiling", "Kb": 0.512, "m": -1.0},
		{"mode": "freezing", "Kf": -1.0, "m": 1.0},
		{"mode": "freezing", "Kf": 1.86, "m": -1.0},
		{"mode": "osmotic", "M": -1.0, "T": 298.15},
		{"mode": "osmotic", "M": 1.0, "T": 0.0},
		{"mode": "osmotic", "M": 1.0},
		{"mode": "boiling", "m": 1.0},
		{"mode": "freezing", "m": 1.0},
	} {
		if _, err := ColligativeProperties(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestTitrationCurve_AllBranches(t *testing.T) {
	ctx := context.Background()
	base := CalculationInput{
		"analyteConcentration": 0.1, "analyteVolume": 0.05,
		"titrantConcentration": 0.1,
	}
	got, err := TitrationCurve(ctx, merge(base, CalculationInput{"mode": "strong-acid-strong-base", "numPoints": 10.0}))
	if err != nil {
		t.Fatalf("strong: %v", err)
	}
	if got.Unit != "L" {
		t.Errorf("unit = %s", got.Unit)
	}
	if _, ok := got.Metadata["curve"]; !ok {
		t.Error("missing curve metadata")
	}
	got, err = TitrationCurve(ctx, merge(base, CalculationInput{"mode": "weak-acid-strong-base", "pKa": 4.76, "numPoints": 10.0}))
	if err != nil {
		t.Fatalf("weak: %v", err)
	}
	// Default mode + default numPoints.
	if _, err := TitrationCurve(ctx, base); err != nil {
		t.Fatalf("defaults: %v", err)
	}
	for _, bad := range []CalculationInput{
		merge(base, CalculationInput{"mode": "bogus"}),
		merge(base, CalculationInput{"mode": "weak-acid-strong-base", "numPoints": 1.0}),
		merge(base, CalculationInput{"analyteConcentration": 0.0}),
		merge(base, CalculationInput{"analyteVolume": -1.0}),
		merge(base, CalculationInput{"titrantConcentration": 0.0}),
		merge(base, CalculationInput{"mode": "weak-acid-strong-base"}),
		{"analyteConcentration": 0.1},
	} {
		if _, err := TitrationCurve(ctx, bad); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func merge(a, b CalculationInput) CalculationInput {
	out := CalculationInput{}
	for k, v := range a {
		out[k] = v
	}
	for k, v := range b {
		out[k] = v
	}
	return out
}
