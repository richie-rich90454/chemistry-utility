package calculators

import (
	"strings"
	"testing"
)

// Success paths for the thermodynamics, quantum, and electrochemistry ports.
// The conformance vectors cover the error paths; these pin the branches the
// vectors do not reach, especially the electron-configuration ordering and
// the bond-list parser.

func TestPortedThermodynamicsQuantumElectrochemistry(t *testing.T) {
	cases := []struct {
		name      string
		calc      string
		inputs    map[string]string
		wantValue string
		wantIn    []string
		wantErr   string
	}{
		{
			name: "gibbs spontaneous", calc: "gibbs-free-energy",
			inputs:    map[string]string{"gibbs-deltaH": "-100", "gibbs-deltaS": "200", "gibbs-T": "298"},
			wantValue: "dG = -159.6000 kJ/mol; Process: Spontaneous",
		},
		{
			name: "gibbs equilibrium", calc: "gibbs-free-energy",
			inputs:    map[string]string{"gibbs-deltaH": "-100", "gibbs-deltaS": "-100", "gibbs-T": "1000"},
			wantValue: "dG = 0.0000 kJ/mol; Process: Equilibrium",
		},
		{
			name: "hess sums steps", calc: "hess-law",
			inputs:    map[string]string{"hess-steps": "-100,50,-200"},
			wantValue: "Total dH = -250.0000 kJ/mol",
		},
		{
			name: "hess needs two values", calc: "hess-law",
			inputs:  map[string]string{"hess-steps": "100"},
			wantErr: "At least 2 enthalpy values are required",
		},
		{
			name: "entropy difference of sums", calc: "entropy",
			inputs:    map[string]string{"entropy-products": "200,150", "entropy-reactants": "100,50"},
			wantValue: "dS = 200.0000 J/(mol*K)",
		},
		{
			name: "heat capacity final temperature", calc: "heat-capacity",
			inputs: map[string]string{"heat-cap-solve-for": "Tfinal", "heat-cap-mass": "100",
				"heat-cap-specific-heat": "4.184", "heat-cap-initial-temp": "25", "heat-cap-heat": "20920"},
			wantValue: "Final Temperature: 75.0000 K",
		},
		{
			name: "heat capacity zero deltaT", calc: "heat-capacity",
			inputs: map[string]string{"heat-cap-solve-for": "c", "heat-cap-mass": "100",
				"heat-cap-initial-temp": "25", "heat-cap-final-temp": "25", "heat-cap-heat": "20920"},
			wantErr: "Temperature change cannot be zero",
		},
		{
			name: "bond enthalpy with counts", calc: "bond-enthalpy",
			inputs: map[string]string{"bond-enthalpy-broken": "O=O,H-H:2", "bond-enthalpy-formed": "O-H:4"},
			wantIn: []string{"-485.0000", "Exothermic"},
		},
		{
			name: "bond enthalpy skips empty entries", calc: "bond-enthalpy",
			inputs:    map[string]string{"bond-enthalpy-broken": "C-H,,", "bond-enthalpy-formed": "C-H"},
			wantValue: "Estimated dH = 0.0000 kJ/mol; Process: Thermoneutral",
		},
		{
			name: "bond enthalpy rejects fractional count", calc: "bond-enthalpy",
			inputs:  map[string]string{"bond-enthalpy-broken": "C-H:1.5", "bond-enthalpy-formed": "C-H"},
			wantErr: "Bond count must be a positive integer for bond C-H in broken bonds",
		},
		{
			name: "quantum numbers valid", calc: "quantum-numbers",
			inputs: map[string]string{"qn-n": "2", "qn-l": "1", "qn-ml": "0", "qn-ms": "0.5"},
			wantIn: []string{"Valid quantum numbers", "l = 1 (subshell p)", "Max electrons in 2p subshell: 6"},
		},
		{
			name: "quantum numbers collects every error", calc: "quantum-numbers",
			inputs: map[string]string{"qn-n": "2", "qn-l": "2", "qn-ml": "0", "qn-ms": "0.5"},
			wantIn: []string{"Invalid quantum numbers", "l must be an integer from 0 to n-1"},
		},
		{
			name: "electron configuration iron", calc: "electron-configuration",
			inputs:    map[string]string{"ec-atomic-number": "26"},
			wantValue: "1s2 2s2 2p6 3s2 3p6 4s2 3d6",
			wantIn:    []string{"Noble gas notation: [Ar] 4s2 3d6", "Valence electrons: 8"},
		},
		{
			name: "electron configuration chromium exception", calc: "electron-configuration",
			inputs:    map[string]string{"ec-atomic-number": "24"},
			wantValue: "1s2 2s2 2p6 3s2 3p6 3d5 4s1",
			wantIn:    []string{"[Ar] 3d5 4s1"},
		},
		{
			name: "electron configuration palladium fills 4d", calc: "electron-configuration",
			inputs:    map[string]string{"ec-atomic-number": "46"},
			wantValue: "1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10",
		},
		{
			name: "rydberg lyman", calc: "rydberg",
			inputs: map[string]string{"rydberg-n1": "1", "rydberg-n2": "2"},
			wantIn: []string{"Lyman (UV)", "121.54 nm", "Transition: n = 2 → n = 1"},
		},
		{
			name: "de broglie default unit", calc: "debroglie-wavelength",
			inputs:    map[string]string{"db-mass": "9.109e-31", "db-velocity": "2e6"},
			wantValue: "0.3637 nm",
		},
		{
			name: "de broglie rejects unknown unit", calc: "debroglie-wavelength",
			inputs:  map[string]string{"db-mass": "9.11e-31", "db-velocity": "1e6", "db-mass-unit": "bogus"},
			wantErr: "Invalid mass unit",
		},
		{
			name: "photoelectric no emission below work function", calc: "photoelectric-effect",
			inputs:    map[string]string{"pe-solve-for": "KE", "pe-frequency": "1e15", "pe-work-function": "4.5"},
			wantValue: "No electron emission",
		},
		{
			name: "photoelectric solves from wavelength", calc: "photoelectric-effect",
			inputs:    map[string]string{"pe-solve-for": "KE", "pe-wavelength": "400", "pe-work-function": "2.3"},
			wantValue: "0.8000 eV",
		},
		{
			name: "heisenberg minimum delta x", calc: "heisenberg-uncertainty",
			inputs: map[string]string{"heis-solve-for": "min-delta-x", "heis-delta-p": "1e-24", "heis-mass": "9.11e-31"},
			wantIn: []string{"Δv corresponding to Δp"},
		},
		{
			name: "heisenberg minimum delta p", calc: "heisenberg-uncertainty",
			inputs:    map[string]string{"heis-solve-for": "min-delta-p", "heis-delta-x": "1e-10"},
			wantValue: "0.0000 kg·m/s",
		},
		{
			name: "cell potential picks the cathode", calc: "cell-potential",
			inputs: map[string]string{"E1": "0.80", "E2": "-0.34"},
			wantIn: []string{"E_cell = 1.140 V", "Anode E = -0.340 V"},
		},
		{
			name: "nernst interpolates Q", calc: "nernst",
			inputs:    map[string]string{"E-standard": "0.34", "temperature": "298", "n-electrons": "2", "Q-reaction": "0.01"},
			wantValue: "E = 0.399 V",
			wantIn:    []string{"(2477.5720/(2.000 * 96485))*ln(0.01)"},
		},
		{
			name: "nernst rejects fractional electron count", calc: "nernst",
			inputs:  map[string]string{"E-standard": "0.34", "temperature": "298", "n-electrons": "2.5", "Q-reaction": "0.01"},
			wantErr: "Number of electrons must be an integer",
		},
		{
			name: "electrolysis solves for mass", calc: "electrolysis",
			inputs: map[string]string{"electrolysis-solve-for": "mass", "electrolysis-I": "2",
				"electrolysis-t": "1800", "electrolysis-z": "2", "electrolysis-M": "63.5"},
			wantIn: []string{"n = (I*t)/(F*z) = 0.018656 mol; m = n*M = 1.185 g"},
		},
		{
			name: "electrolysis rejects fractional charge", calc: "electrolysis",
			inputs: map[string]string{"electrolysis-solve-for": "current", "electrolysis-m": "1",
				"electrolysis-t": "100", "electrolysis-z": "2.5", "electrolysis-M": "63.5"},
			wantErr: "Charge number z must be an integer",
		},
	}

	registry := NewRegistry()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			fn, ok := registry.Get(c.calc)
			if !ok {
				t.Fatalf("%s is not registered", c.calc)
			}
			got, err := fn(c.inputs)
			if c.wantErr != "" {
				if err == nil || err.Error() != c.wantErr {
					t.Fatalf("error = %v, want %q", err, c.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if c.wantValue != "" && got.Value != c.wantValue {
				t.Errorf("value = %q, want %q", got.Value, c.wantValue)
			}
			for _, want := range c.wantIn {
				if !strings.Contains(got.Value, want) && !strings.Contains(got.Explanation, want) {
					t.Errorf("neither value nor explanation mentions %q\n  value = %q\n  explanation = %q",
						want, got.Value, got.Explanation)
				}
			}
		})
	}
}

// The web engine's formatting round-trips through toFixed and Intl, so a
// double whose exact digits run past the requested precision prints its
// shortest form padded out instead.
func TestFormatFixedMatchesIntlRoundTrip(t *testing.T) {
	cases := []struct {
		value    float64
		decimals int
		want     string
	}{
		{456778611111111.1, 4, "456778611111111.1000"},
		{1e-40, 4, "0.0000"},
		{-0.00001, 4, "0.0000"},
		{0.4, 4, "0.4000"},
		{-70.2, 4, "-70.2000"},
		{656.3354603463993, 2, "656.34"},
		{1234.5678, 0, "1235"},
	}
	for _, c := range cases {
		if got := formatFixed(c.value, c.decimals); got != c.want {
			t.Errorf("formatFixed(%v, %d) = %q, want %q", c.value, c.decimals, got, c.want)
		}
	}
}
