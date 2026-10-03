package calculators

import (
	"context"
	"testing"
)

// TestMissingKeys_AllCalculators deletes each required key in turn and
// expects an error, covering every getFloat/getString error branch.
func TestMissingKeys_AllCalculators(t *testing.T) {
	ctx := context.Background()
	dilutionBase := CalculationInput{"C1": 1.0, "V1": 1.0, "C2": 1.0, "solveFor": "V2"}
	for _, k := range []string{"C1", "V1", "C2", "solveFor"} {
		if _, err := Dilution(ctx, without(dilutionBase, k)); err == nil {
			t.Errorf("Dilution without %s: expected error", k)
		}
	}
	massBase := CalculationInput{"solute": 10.0, "solution": 100.0}
	for _, k := range []string{"solute", "solution"} {
		if _, err := MassPercent(ctx, without(massBase, k)); err == nil {
			t.Errorf("MassPercent without %s: expected error", k)
		}
	}
	mixBase := CalculationInput{"C1": 1.0, "V1": 1.0, "C2": 1.0, "V2": 1.0}
	for _, k := range []string{"C1", "V1", "C2", "V2"} {
		if _, err := SolutionMixing(ctx, without(mixBase, k)); err == nil {
			t.Errorf("SolutionMixing without %s: expected error", k)
		}
	}
	bufBase := CalculationInput{"pKa": 4.76, "HA": 0.1, "A": 0.1}
	for _, k := range []string{"pKa", "HA", "A"} {
		if _, err := BufferSolution(ctx, without(bufBase, k)); err == nil {
			t.Errorf("BufferSolution without %s: expected error", k)
		}
	}
	if _, err := PKaPKb(ctx, CalculationInput{"solveFor": "pKb"}); err == nil {
		t.Error("PKaPKb without pKa: expected error")
	}
	if _, err := PKaPKb(ctx, CalculationInput{"solveFor": "pKa"}); err == nil {
		t.Error("PKaPKb without pKb: expected error")
	}
	titBase := CalculationInput{
		"analyteConcentration": 0.1, "analyteVolume": 0.05,
		"titrantConcentration": 0.1, "mode": "strong-acid-strong-base", "numPoints": 10.0,
	}
	for _, k := range []string{"analyteConcentration", "analyteVolume", "titrantConcentration"} {
		if _, err := TitrationCurve(ctx, without(titBase, k)); err == nil {
			t.Errorf("TitrationCurve without %s: expected error", k)
		}
	}
	kspBase := CalculationInput{"mode": "ksp-to-solubility", "Ksp": 1e-10}
	if _, err := Ksp(ctx, without(kspBase, "Ksp")); err == nil {
		t.Error("Ksp without Ksp: expected error")
	}
	if _, err := Ksp(ctx, without(CalculationInput{"mode": "solubility-to-ksp", "molarSolubility": 1e-5}, "molarSolubility")); err == nil {
		t.Error("Ksp without molarSolubility: expected error")
	}
	arrBase := CalculationInput{"A": 1e13, "Ea": 75000.0, "T": 298.0, "solveFor": "k"}
	for _, k := range []string{"A", "Ea", "T"} {
		if _, err := Arrhenius(ctx, without(arrBase, k)); err == nil {
			t.Errorf("Arrhenius without %s: expected error", k)
		}
	}
	for _, tc := range []struct {
		solveFor string
		keys     []string
		base     CalculationInput
	}{
		{"Ea", []string{"A", "k", "T"}, CalculationInput{"A": 1e13, "k": 1e-3, "T": 298.0, "solveFor": "Ea"}},
		{"T", []string{"A", "k", "Ea"}, CalculationInput{"A": 1e13, "k": 1e-3, "Ea": 75000.0, "solveFor": "T"}},
		{"A", []string{"k", "Ea", "T"}, CalculationInput{"k": 1e-3, "Ea": 75000.0, "T": 298.0, "solveFor": "A"}},
	} {
		for _, k := range tc.keys {
			if _, err := Arrhenius(ctx, without(tc.base, k)); err == nil {
				t.Errorf("Arrhenius %s without %s: expected error", tc.solveFor, k)
			}
		}
	}
	rlBase := CalculationInput{"k": 0.5, "concentrations": []float64{1.0}, "orders": []float64{1.0}}
	for _, k := range []string{"k", "concentrations", "orders"} {
		if _, err := RateLaw(ctx, without(rlBase, k)); err == nil {
			t.Errorf("RateLaw without %s: expected error", k)
		}
	}
	if _, err := RateLaw(ctx, CalculationInput{
		"k": 1.0, "concentrations": []float64{1e308}, "orders": []float64{2.0},
	}); err == nil {
		t.Error("RateLaw overflow: expected error")
	}
	irlBase := CalculationInput{"order": 1.0, "k": 0.05, "initialConcentration": 1.0, "time": 1.0, "solveFor": "concentration"}
	for _, k := range []string{"order", "k", "initialConcentration", "time"} {
		if _, err := IntegratedRateLaw(ctx, without(irlBase, k)); err == nil {
			t.Errorf("IntegratedRateLaw without %s: expected error", k)
		}
	}
	irlTBase := CalculationInput{"order": 1.0, "k": 0.05, "initialConcentration": 1.0, "concentration": 0.5, "solveFor": "time"}
	for _, k := range []string{"order", "k", "initialConcentration", "concentration"} {
		if _, err := IntegratedRateLaw(ctx, without(irlTBase, k)); err == nil {
			t.Errorf("IntegratedRateLaw time without %s: expected error", k)
		}
	}
	gibbsBase := CalculationInput{"deltaH": 1.0, "deltaS": 1.0, "T": 298.0}
	for _, k := range []string{"deltaH", "deltaS", "T"} {
		if _, err := GibbsFreeEnergy(ctx, without(gibbsBase, k)); err == nil {
			t.Errorf("GibbsFreeEnergy without %s: expected error", k)
		}
	}
	hcBase := CalculationInput{"m": 1.0, "c": 1.0, "deltaT": 1.0, "solveFor": "q"}
	for _, k := range []string{"m", "c", "deltaT"} {
		if _, err := HeatCapacity(ctx, without(hcBase, k)); err == nil {
			t.Errorf("HeatCapacity without %s: expected error", k)
		}
	}
	if _, err := HeatCapacity(ctx, without(CalculationInput{"q": 1.0, "c": 1.0, "deltaT": 1.0, "solveFor": "m"}, "q")); err == nil {
		t.Error("HeatCapacity m without q: expected error")
	}
	if _, err := HeatCapacity(ctx, without(CalculationInput{"q": 1.0, "m": 1.0, "deltaT": 1.0, "solveFor": "c"}, "m")); err == nil {
		t.Error("HeatCapacity c without m: expected error")
	}
	if _, err := HeatCapacity(ctx, without(CalculationInput{"q": 1.0, "m": 1.0, "c": 1.0, "solveFor": "deltaT"}, "c")); err == nil {
		t.Error("HeatCapacity deltaT without c: expected error")
	}
	hlBase := CalculationInput{"N0": 100.0, "t": 10.0, "halfLife": 5.0, "solveFor": "remaining"}
	for _, k := range []string{"N0", "t", "halfLife"} {
		if _, err := HalfLife(ctx, without(hlBase, k)); err == nil {
			t.Errorf("HalfLife without %s: expected error", k)
		}
	}
	for _, tc := range []struct {
		solveFor string
		keys     []string
		base     CalculationInput
	}{
		{"time", []string{"N0", "halfLife", "Nt"}, CalculationInput{"N0": 100.0, "halfLife": 5.0, "Nt": 25.0, "solveFor": "time"}},
		{"halfLife", []string{"N0", "t", "Nt"}, CalculationInput{"N0": 100.0, "t": 10.0, "Nt": 25.0, "solveFor": "halfLife"}},
	} {
		for _, k := range tc.keys {
			if _, err := HalfLife(ctx, without(tc.base, k)); err == nil {
				t.Errorf("HalfLife %s without %s: expected error", tc.solveFor, k)
			}
		}
	}
	if _, err := HalfLife(ctx, without(CalculationInput{"N0": 100.0, "halfLife": 5.0, "Nt": 25.0, "solveFor": "time"}, "Nt")); err == nil {
		t.Error("HalfLife time without Nt: expected error")
	}
	cellBase := CalculationInput{"E1": 1.0, "E2": 0.0}
	for _, k := range []string{"E1", "E2"} {
		if _, err := CellPotential(ctx, without(cellBase, k)); err == nil {
			t.Errorf("CellPotential without %s: expected error", k)
		}
	}
	nernstBase := CalculationInput{"E_standard": 1.0, "T": 298.0, "n": 2.0, "Q": 1.0}
	for _, k := range []string{"E_standard", "T", "n", "Q"} {
		if _, err := Nernst(ctx, without(nernstBase, k)); err == nil {
			t.Errorf("Nernst without %s: expected error", k)
		}
	}
	elBase := CalculationInput{"I": 1.0, "t": 1.0, "z": 1.0, "M": 1.0, "solveFor": "mass"}
	for _, k := range []string{"I", "t", "z", "M"} {
		if _, err := Electrolysis(ctx, without(elBase, k)); err == nil {
			t.Errorf("Electrolysis without %s: expected error", k)
		}
	}
	elCBase := CalculationInput{"m": 1.0, "t": 1.0, "z": 1.0, "M": 1.0, "solveFor": "current"}
	if _, err := Electrolysis(ctx, without(elCBase, "m")); err == nil {
		t.Error("Electrolysis current without m: expected error")
	}
	elTBase := CalculationInput{"m": 1.0, "I": 1.0, "z": 1.0, "M": 1.0, "solveFor": "time"}
	for _, k := range []string{"m", "I"} {
		if _, err := Electrolysis(ctx, without(elTBase, k)); err == nil {
			t.Errorf("Electrolysis time without %s: expected error", k)
		}
	}
	qnBase := CalculationInput{"n": 2.0, "l": 1.0, "ml": 0.0, "ms": 0.5}
	for _, k := range []string{"n", "l", "ml", "ms"} {
		if _, err := QuantumNumbers(ctx, without(qnBase, k)); err == nil {
			t.Errorf("QuantumNumbers without %s: expected error", k)
		}
	}
	if _, err := ElectronConfiguration(ctx, CalculationInput{}); err == nil {
		t.Error("ElectronConfiguration without atomicNumber: expected error")
	}
	dbBase := CalculationInput{"m": 1.0, "v": 1.0}
	for _, k := range []string{"m", "v"} {
		if _, err := DeBroglieWavelength(ctx, without(dbBase, k)); err == nil {
			t.Errorf("DeBroglieWavelength without %s: expected error", k)
		}
	}
	peBase := CalculationInput{"solveFor": "KE", "frequency": 1e15, "workFunction": 2.0}
	if _, err := PhotoelectricEffect(ctx, without(peBase, "frequency")); err == nil {
		t.Error("PhotoelectricEffect KE without frequency: expected error")
	}
	if _, err := PhotoelectricEffect(ctx, without(peBase, "workFunction")); err == nil {
		t.Error("PhotoelectricEffect KE without workFunction: expected error")
	}
	peFBase := CalculationInput{"solveFor": "frequency", "KE": 1.0, "workFunction": 2.0}
	for _, k := range []string{"KE", "workFunction"} {
		if _, err := PhotoelectricEffect(ctx, without(peFBase, k)); err == nil {
			t.Errorf("PhotoelectricEffect frequency without %s: expected error", k)
		}
	}
	peWBase := CalculationInput{"solveFor": "workFunction", "KE": 1.0, "frequency": 1e15}
	for _, k := range []string{"KE", "frequency"} {
		if _, err := PhotoelectricEffect(ctx, without(peWBase, k)); err == nil {
			t.Errorf("PhotoelectricEffect workFunction without %s: expected error", k)
		}
	}
	if _, err := HeisenbergUncertainty(ctx, CalculationInput{"solveFor": "minDeltaX"}); err == nil {
		t.Error("HeisenbergUncertainty without deltaP: expected error")
	}
	if _, err := HeisenbergUncertainty(ctx, CalculationInput{"solveFor": "minDeltaP"}); err == nil {
		t.Error("HeisenbergUncertainty without deltaX: expected error")
	}
	if _, err := Stoichiometry(ctx, CalculationInput{"mode": "product-from-reactant"}); err == nil {
		t.Error("Stoichiometry without equation: expected error")
	}
	if _, err := CalculateMolarMass(ctx, CalculationInput{}); err == nil {
		t.Error("CalculateMolarMass without formula: expected error")
	}
	bondBase := CalculationInput{"element1": "H", "element2": "O"}
	for _, k := range []string{"element1", "element2"} {
		if _, err := BondType(ctx, without(bondBase, k)); err == nil {
			t.Errorf("BondType without %s: expected error", k)
		}
	}
	collBase := CalculationInput{"mode": "boiling", "Kb": 0.5, "m": 1.0}
	if _, err := ColligativeProperties(ctx, without(collBase, "Kb")); err == nil {
		t.Error("ColligativeProperties without Kb: expected error")
	}
	if _, err := ColligativeProperties(ctx, without(CalculationInput{"mode": "freezing", "Kf": 1.86, "m": 1.0}, "Kf")); err == nil {
		t.Error("ColligativeProperties without Kf: expected error")
	}
	if _, err := ColligativeProperties(ctx, without(CalculationInput{"mode": "osmotic", "M": 1.0, "T": 298.0}, "T")); err == nil {
		t.Error("ColligativeProperties without T: expected error")
	}
	// Colligative m missing in each mode.
	if _, err := ColligativeProperties(ctx, CalculationInput{"mode": "boiling", "Kb": 0.5}); err == nil {
		t.Error("ColligativeProperties boiling without m: expected error")
	}
	if _, err := ColligativeProperties(ctx, CalculationInput{"mode": "freezing", "Kf": 1.86}); err == nil {
		t.Error("ColligativeProperties freezing without m: expected error")
	}
	if _, err := ColligativeProperties(ctx, CalculationInput{"mode": "osmotic", "T": 298.0}); err == nil {
		t.Error("ColligativeProperties osmotic without M: expected error")
	}
}
