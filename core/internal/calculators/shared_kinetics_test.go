package calculators

import (
	"math"
	"testing"
)

// Expected strings are the values the TypeScript originals in
// frontend/src/modules/calculators produce for the same inputs. The
// conformance vectors for these calculators only record error cases, so these
// cases are what pins the success paths, including the stoichiometry port and
// the integrated-rate-law series.

func TestPortedKineticsNuclearStoichiometry(t *testing.T) {
	cases := []struct {
		calc         string
		inputs       map[string]string
		value        string
		explanation  string
		errorMessage string
	}{
		{
			calc: "arrhenius", value: "344.8570 s\u207B\u00B9",
			explanation: "k = A\u00B7e^(-Ea/RT) = 344.8570 s\u207B\u00B9",
			inputs:      map[string]string{"arrhenius-solve-for": "k", "arrhenius-A": "1e10", "arrhenius-Ea": "50", "arrhenius-T": "350"},
		},
		{
			calc: "arrhenius", value: "69.0199 kJ/mol",
			explanation: "Ea = -RT\u00B7ln(k/A) = 69.0199 kJ/mol",
			inputs:      map[string]string{"arrhenius-solve-for": "Ea", "arrhenius-A": "1e10", "arrhenius-k": "0.5", "arrhenius-T": "350"},
		},
		{
			calc: "arrhenius", value: "253.5500 K",
			explanation: "T = -Ea/(R\u00B7ln(k/A)) = 253.5500 K",
			inputs:      map[string]string{"arrhenius-solve-for": "T", "arrhenius-A": "1e10", "arrhenius-Ea": "50", "arrhenius-k": "0.5"},
		},
		{
			calc: "arrhenius", value: "14498762.7352 s\u207B\u00B9",
			explanation: "A = k / e^(-Ea/RT) = 14498762.7352 s\u207B\u00B9",
			inputs:      map[string]string{"arrhenius-solve-for": "A", "arrhenius-Ea": "50", "arrhenius-T": "350", "arrhenius-k": "0.5"},
		},
		{
			calc: "rate-law", value: "rate = 1.2500[B]^3",
			explanation: "Order with respect to A: 0; Order with respect to B: 3; Rate constant k = 1.2500; Rate law: rate = 1.2500[B]^3; grid-search fit error = 0.000000",
			inputs:      map[string]string{"ratelaw-A1": "0.1", "ratelaw-B1": "0.2", "ratelaw-rate1": "0.01", "ratelaw-A2": "0.2", "ratelaw-B2": "0.4", "ratelaw-rate2": "0.08"},
		},
		{
			calc: "rate-law", value: "rate = 0.1000[A]",
			explanation: "Order with respect to A: 1; Order with respect to B: 0; Rate constant k = 0.1000; Rate law: rate = 0.1000[A]; Order n is underdetermined: B does not vary, so n is reported as 0 (not measurable from these experiments).",
			inputs:      map[string]string{"ratelaw-A1": "0.1", "ratelaw-B1": "0.2", "ratelaw-rate1": "0.01", "ratelaw-A2": "0.4", "ratelaw-B2": "0.2", "ratelaw-rate2": "0.04"},
		},
		{
			calc: "rate-law", value: "rate = 0.2500[B]^2",
			explanation: "Order with respect to A: 0; Order with respect to B: 2; Rate constant k = 0.2500; Rate law: rate = 0.2500[B]^2; Order m is underdetermined: A does not vary, so m is reported as 0 (not measurable from these experiments).",
			inputs:      map[string]string{"ratelaw-A1": "0.1", "ratelaw-B1": "0.2", "ratelaw-rate1": "0.01", "ratelaw-A2": "0.1", "ratelaw-B2": "0.6", "ratelaw-rate2": "0.09"},
		},
		{
			calc: "integrated-rate-law", value: "0.3679 M",
			explanation: "[A] = [A]\u2080\u00B7e^(-kt) = 0.3679 M",
			inputs:      map[string]string{"irl-solve-for": "concentration", "irl-order": "1", "irl-A0": "1", "irl-k": "0.01", "irl-t": "100"},
		},
		{
			calc: "integrated-rate-law", value: "60.0000 s",
			explanation: "t = ([A]\u2080 - [A]) / k = 60.0000 s",
			inputs:      map[string]string{"irl-solve-for": "time", "irl-order": "0", "irl-A0": "1", "irl-k": "0.01", "irl-A": "0.4"},
		},
		{
			calc: "integrated-rate-law", value: "150.0000 s",
			explanation: "t = (1/[A] - 1/[A]\u2080) / k = 150.0000 s",
			inputs:      map[string]string{"irl-solve-for": "time", "irl-order": "2", "irl-A0": "1", "irl-k": "0.01", "irl-A": "0.4"},
		},
		{
			calc: "integrated-rate-law", errorMessage: "Order must be 0, 1, or 2",
			inputs: map[string]string{"irl-solve-for": "concentration", "irl-order": "5", "irl-A0": "1", "irl-k": "0.01", "irl-t": "10"},
		},
		{
			calc: "reaction-order", value: "Best-fit reaction order: 1",
			explanation: "Best-fit reaction order: 1; R\u00B2 zero order: 0.920000; R\u00B2 first order: 1.000000; R\u00B2 second order: 0.920000; Rate constant k \u2248 0.069315 s\u207B\u00B9",
			inputs:      map[string]string{"reaction-order-data": "0,0.1\n10,0.05\n20,0.025\n30,0.0125"},
		},
		{
			calc: "reaction-order", value: "Best-fit reaction order: 1",
			explanation: "Best-fit reaction order: 1; R\u00B2 zero order: 0.964286; R\u00B2 first order: 1.000000; R\u00B2 second order: 0.964286; Rate constant k \u2248 0.069315 s\u207B\u00B9",
			inputs:      map[string]string{"reaction-order-data": "0,0.1;10,0.05;20,0.025"},
		},
		{
			calc: "collision-theory", value: "5421.254492 s\u207B\u00B9",
			explanation: "k = Z\u00B7p\u00B7e^(-Ea/RT) = 5421.254492 s\u207B\u00B9; Fraction of effective collisions (e^(-Ea/RT)): 0.000000",
			inputs:      map[string]string{"collision-solve-for": "k", "collision-Ea": "40", "collision-T": "300", "collision-Z": "1e11", "collision-p": "0.5"},
		},
		{
			calc: "collision-theory", value: "1844591508295.416000 s\u207B\u00B9",
			explanation: "Z = k / (p\u00B7e^(-Ea/RT)) = 1844591508295.416000 s\u207B\u00B9; Fraction of effective collisions (e^(-Ea/RT)): 0.000000",
			inputs:      map[string]string{"collision-solve-for": "Z", "collision-Ea": "40", "collision-T": "300", "collision-p": "0.5", "collision-k": "1e5"},
		},
		{
			calc: "collision-theory", value: "9.222958",
			explanation: "p = k / (Z\u00B7e^(-Ea/RT)) (warning: steric factor should lie in [0, 1]; check inputs) = 9.222958; Fraction of effective collisions (e^(-Ea/RT)): 0.000000",
			inputs:      map[string]string{"collision-solve-for": "p", "collision-Ea": "40", "collision-T": "300", "collision-Z": "1e11", "collision-k": "1e5"},
		},
		{
			calc: "half-life", value: "Remaining: 12.5000 (after 3000 units)",
			explanation: "Nt = N0 \u00D7 (0.5)^(t/t_half) = 12.5000",
			inputs:      map[string]string{"half-life-solve-for": "remaining", "initial-quantity": "100", "time-input": "3000", "half-life-input": "1000"},
		},
		{
			calc: "stoichiometry", value: "Moles of H2O: 4.00",
			explanation: "molesProduct = (molesReactant / reactant_coefficient) * product_coefficient = (4 / 2) * 2 = 4.00",
			inputs:      map[string]string{"equation": "2H2 + O2 -> 2H2O", "calculation-type": "product-from-reactant", "reactant-select": "H2", "reactant-moles": "4", "product-select": "H2O"},
		},
		{
			calc: "stoichiometry", value: "Moles of O2: 4.50",
			explanation: "molesReactant = (molesProduct / product_coefficient) * reactant_coefficient = (9 / 2) * 1 = 4.50",
			inputs:      map[string]string{"equation": "2H2 + O2 -> 2H2O", "calculation-type": "reactant-from-product", "product-select": "H2O", "product-moles": "9", "reactant-select": "O2"},
		},
		{
			calc: "stoichiometry", value: "Limiting reactant: N2; Moles of NH3: 2.00",
			explanation: "minRatio = min(moles_i / coeff_i) = 1.0000 (limiting: N2); molesProduct = minRatio * product_coefficient = 1.0000 * 2 = 2.00",
			inputs:      map[string]string{"equation": "N2 + 3H2 -> 2NH3", "calculation-type": "limiting-reactant", "moles-N2": "1", "moles-H2": "6", "product-select": "NH3"},
		},
		{
			calc: "stoichiometry", value: "Moles of H2O: 3.00",
			explanation: "molesProduct = (molesReactant / reactant_coefficient) * product_coefficient = (3 / 1) * 1 = 3.00",
			inputs:      map[string]string{"equation": "H\u2082 + O\u2082 \u2192 H\u2082O", "calculation-type": "product-from-reactant", "reactant-select": "H2", "reactant-moles": "3", "product-select": "H2O"},
		},
		{
			calc: "stoichiometry", errorMessage: "Invalid calculation type",
			inputs: map[string]string{"equation": "H2 + O2 -> H2O", "calculation-type": "nope"},
		},
		{
			calc: "stoichiometry", errorMessage: "Invalid equation format: missing \"->\"",
			inputs: map[string]string{"equation": "H2 + O2", "calculation-type": "product-from-reactant"},
		},
		{
			calc: "stoichiometry", errorMessage: "Selected compound not found",
			inputs: map[string]string{"equation": "H2 + O2 -> H2O", "calculation-type": "product-from-reactant", "reactant-select": "CO2", "reactant-moles": "1", "product-select": "H2O"},
		},
		{
			calc: "stoichiometry", errorMessage: "Invalid moles for H2",
			inputs: map[string]string{"equation": "H2 + O2 -> H2O", "calculation-type": "limiting-reactant", "moles-H2": "", "product-select": "H2O"},
		},
		// The vector files for these calculators record only error cases, so
		// the exact messages are pinned here instead.
		{
			calc: "arrhenius", errorMessage: "Invalid solveFor value",
			inputs: map[string]string{"arrhenius-A": "1e10", "arrhenius-Ea": "50000", "arrhenius-T": "350"},
		},
		{
			calc: "collision-theory", errorMessage: "Invalid solveFor value",
			inputs: map[string]string{"collision-T": "300", "collision-Ea": "40000"},
		},
		{
			calc: "integrated-rate-law", errorMessage: "Invalid solveFor value",
			inputs: map[string]string{"irl-order": "first", "irl-A0": "1", "irl-t": "100", "irl-k": "0.01"},
		},
		{
			calc:         "rate-law",
			errorMessage: "Missing or invalid inputs for ratelaw-A1, ratelaw-B1, ratelaw-rate1, ratelaw-A2, ratelaw-B2, ratelaw-rate2",
			inputs:       map[string]string{"rate-k": "0.5", "rate-A": "0.1", "rate-B": "0.2", "rate-order-A": "1", "rate-order-B": "2"},
		},
		{
			calc:         "reaction-order",
			errorMessage: "Invalid data format. Use t1,c1;t2,c2;... or one pair per line",
			inputs:       map[string]string{"reaction-order-data": "0.1 0.055\n1 0.02"},
		},
		{
			calc:         "half-life",
			errorMessage: "Remaining quantity must be less than initial quantity (decay only decreases quantity)",
			inputs:       map[string]string{"half-life-solve-for": "time", "initial-quantity": "100", "time-input": "3000", "half-life-input": "1000", "remaining-quantity": "150"},
		},
	}

	registry := NewRegistry()
	for _, c := range cases {
		fn, ok := registry.Get(c.calc)
		if !ok {
			t.Fatalf("%s is not registered", c.calc)
		}
		got, err := fn(c.inputs)
		if c.errorMessage != "" {
			if err == nil || err.Error() != c.errorMessage {
				t.Errorf("%s %v: error\n  got:  %v\n  want: %s", c.calc, c.inputs, err, c.errorMessage)
			}
			continue
		}
		if err != nil {
			t.Errorf("%s %v: unexpected error: %v", c.calc, c.inputs, err)
			continue
		}
		if got.Value != c.value {
			t.Errorf("%s %v: value\n  got:  %q\n  want: %q", c.calc, c.inputs, got.Value, c.value)
		}
		if got.Explanation != c.explanation {
			t.Errorf("%s %v: explanation\n  got:  %q\n  want: %q", c.calc, c.inputs, got.Explanation, c.explanation)
		}
	}
}

func TestBuildConcentrationTimeSeries(t *testing.T) {
	series := buildConcentrationTimeSeries(1, 1, 0.01, 100)
	if len(series) != seriesSteps+1 {
		t.Fatalf("series length = %d, want %d", len(series), seriesSteps+1)
	}
	if series[0]["time"] != 0 || series[0]["concentration"] != 1 {
		t.Errorf("series[0] = %v, want time 0 and concentration 1", series[0])
	}
	last := series[len(series)-1]
	if math.Abs(last["time"]-100) > 1e-9 {
		t.Errorf("last time = %v, want 100", last["time"])
	}
	if math.Abs(last["concentration"]-0.36787944117144233) > 1e-12 {
		t.Errorf("last concentration = %v, want 0.36787944117144233", last["concentration"])
	}
	for i := 1; i < len(series); i++ {
		if series[i]["concentration"] >= series[i-1]["concentration"] {
			t.Fatalf("series is not decreasing at %d", i)
		}
	}
	// A non-finite span falls back to the default window.
	fallback := buildConcentrationTimeSeries(0, 1, 0.1, math.NaN())
	if len(fallback) != seriesSteps+1 || fallback[len(fallback)-1]["time"] != seriesDefaultEndTime {
		t.Errorf("fallback series ends at %v, want %v", fallback[len(fallback)-1]["time"], seriesDefaultEndTime)
	}
}

func TestCompareChartData(t *testing.T) {
	want := []map[string]interface{}{
		{"time": float64(0), "concentration": float64(1)},
		{"time": float64(3.3333333333333335), "concentration": float64(0.9672161004820059)},
	}
	// The last bit of each double differs, which the epsilon has to absorb.
	got := []ChartData{
		{"time": 0, "concentration": 1},
		{"time": 3.333333333333334, "concentration": 0.9672161004820059},
	}
	if err := compareChartData("f.json", "case", want, got); err != nil {
		t.Fatalf("expected equality within epsilon, got %v", err)
	}
	if err := compareChartData("f.json", "case", want, got[:1]); err == nil {
		t.Error("expected a point-count mismatch to fail")
	}
	dropped := []map[string]interface{}{{"time": float64(0), "concentration": float64(1)}}
	if err := compareChartData("f.json", "case", dropped, []ChartData{{"time": 0}}); err == nil {
		t.Error("expected a missing-field mismatch to fail")
	}
	if err := compareChartData("f.json", "case", nil, got); err != nil {
		t.Errorf("a vector without chartData must be skipped, got %v", err)
	}
}

func TestParseBalancedEquationPort(t *testing.T) {
	parsed, err := parseBalancedEquation("2 H2 + O2 = 2H2O")
	if err != nil {
		t.Fatalf("parseBalancedEquation: %v", err)
	}
	if len(parsed.reactants) != 2 || len(parsed.products) != 1 {
		t.Fatalf("term counts = %d/%d, want 2/1", len(parsed.reactants), len(parsed.products))
	}
	if parsed.reactants[0].formula != "H2" || parsed.reactants[0].coefficient != 2 {
		t.Errorf("first reactant = %+v, want H2 with coefficient 2", parsed.reactants[0])
	}
	if parsed.reactants[1].formula != "O2" || parsed.reactants[1].coefficient != 1 {
		t.Errorf("second reactant = %+v, want O2 with coefficient 1", parsed.reactants[1])
	}

	term, err := parseTerm("3H2O")
	if err != nil {
		t.Fatalf("parseTerm: %v", err)
	}
	if term.formula != "H2O" || term.coefficient != 3 {
		t.Errorf("parseTerm = %+v, want H2O with coefficient 3", term)
	}

	if got := sanitizeId("Ca(OH)2"); got != "Ca-OH-2" {
		t.Errorf("sanitizeId = %q, want %q", got, "Ca-OH-2")
	}
}
