package calculators

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

// A single conformance case, mirroring the JSON shape in conformance/.
type vecCase struct {
	ID     string                 `json:"id"`
	Inputs map[string]interface{} `json:"inputs"`
	Expect CalcResultJSON         `json:"expect"`
	// Numeric carries the number-only contract some vectors record instead
	// of the calc-result value/explanation pair (molar-mass). The bare
	// number is compared against the metadata the ported calculator
	// returns under the same key.
	Numeric map[string]float64 `json:"-"`
}

// vecFileNumeric re-reads each expect object as raw JSON so the number-only
// keys survive; the CalculatorResult shape above drops everything it does
// not model.
type vecFileNumeric struct {
	Cases []struct {
		Expect map[string]interface{} `json:"expect"`
	} `json:"cases"`
}

// CalcResultJSON is the wire shape the vectors record. It mirrors the
// TypeScript CalculatorResult, where value and explanation are strings and
// chartData plus metadata are optional.
type CalcResultJSON struct {
	Value       string                   `json:"value"`
	Explanation string                   `json:"explanation"`
	ChartData   []map[string]interface{} `json:"chartData"`
	Metadata    map[string]interface{}   `json:"metadata"`
}

type vecFile struct {
	Calculator string    `json:"calculator"`
	Contract   string    `json:"contract"`
	Cases      []vecCase `json:"cases"`
}

// calcFunc is the shape the ported calculators must expose to be conformance
// tested: pure string in, shared result out, error for invalid input. It is
// declared in registry.go alongside the Registry that dispatches on it.

// ported lists every calculator that has been ported to the shared contract.
// Calculators absent from this map are skipped, so the suite grows as the
// port lands instead of failing on not-yet-ported calculators.
var ported = map[string]calcFunc{
	"dilution":               dilution,
	"mass-percent":           massPercent,
	"solution-mixing":        solutionMixing,
	"buffer-solution":        bufferSolution,
	"pka-pkb":                pKaPKb,
	"ksp":                    ksp,
	"colligative-properties": colligativeProperties,
	"titration-curve":        titrationCurve,
	"debye-huckel":           debyeHuckel,
	"common-ion":             commonIonEffect,
	"bond-type":              bondType,
	"hess-law":               hessLaw,
	"arrhenius":              arrhenius,
	"collision-theory":       collisionTheory,
	"half-life":              halfLife,
	"integrated-rate-law":    integratedRateLaw,
	"rate-law":               rateLaw,
	"reaction-order":         reactionOrder,
	"stoichiometry":          stoichiometry,
	"ideal-gas":              idealGas,
	"combined-gas":           combinedGas,
	"van-der-waals":          vanDerWaals,
	"molar-mass":             molarMass,
	"gibbs-free-energy":      gibbsFreeEnergy,
	"entropy":                entropy,
	"heat-capacity":          heatCapacity,
	"bond-enthalpy":          bondEnthalpy,
	"quantum-numbers":        quantumNumbers,
	"electron-configuration": electronConfiguration,
	"rydberg":                rydberg,
	"debroglie-wavelength":   deBroglie,
	"photoelectric-effect":   photoelectric,
	"heisenberg-uncertainty": heisenberg,
	"cell-potential":         cellPotential,
	"nernst":                 nernst,
	"electrolysis":           electrolysis,
	"born-haber":             bornHaber,
}

func conformanceDir(t *testing.T) string {
	t.Helper()
	candidates := []string{
		filepath.Join("..", "..", "..", "conformance"),
		filepath.Join("..", "..", "conformance"),
	}
	for _, c := range candidates {
		if info, err := os.Stat(c); err == nil && info.IsDir() {
			abs, err := filepath.Abs(c)
			if err != nil {
				t.Fatalf("resolve conformance dir: %v", err)
			}
			return abs
		}
	}
	t.Skip("conformance directory not found")
	return ""
}

func TestConformance(t *testing.T) {
	dir := conformanceDir(t)
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatalf("read conformance dir: %v", err)
	}
	portedCount := 0
	vectorCount := 0
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
			continue
		}
		path := filepath.Join(dir, entry.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("read %s: %v", entry.Name(), err)
		}
		var vf vecFile
		if err := json.Unmarshal(data, &vf); err != nil {
			t.Fatalf("parse %s: %v", entry.Name(), err)
		}
		if err := readNumericExpects(data, &vf); err != nil {
			t.Fatalf("parse %s numerics: %v", entry.Name(), err)
		}
		fn, ok := ported[vf.Calculator]
		if !ok {
			continue
		}
		portedCount++
		if err := compareResults(t, entry.Name(), vf, fn); err != nil {
			t.Fatal(err)
		}
		vectorCount += len(vf.Cases)
	}
	if portedCount == 0 {
		t.Skip("no calculators ported to the shared contract yet")
	}
	t.Logf("verified %d cases across %d ported calculators", vectorCount, portedCount)
}

// readNumericExpects copies every number-valued key of each case's expect
// object into Numeric. Vectors on the calc-result contract carry only
// strings there, so they end up with no numeric expectations and compare
// exactly as before.
func readNumericExpects(data []byte, vf *vecFile) error {
	var numeric vecFileNumeric
	if err := json.Unmarshal(data, &numeric); err != nil {
		return err
	}
	for i := range vf.Cases {
		if i >= len(numeric.Cases) {
			break
		}
		for key, raw := range numeric.Cases[i].Expect {
			value, ok := raw.(float64)
			if !ok {
				continue
			}
			if vf.Cases[i].Numeric == nil {
				vf.Cases[i].Numeric = map[string]float64{}
			}
			vf.Cases[i].Numeric[key] = value
		}
	}
	return nil
}

// compareNumeric compares a number-only contract against the metadata the
// ported calculator returns under the same key.
func compareNumeric(name string, c vecCase, got CalcResult) error {
	for key, want := range c.Numeric {
		gotValue, ok := got.Metadata[key].(float64)
		if !ok {
			return &caseError{file: name, id: c.ID,
				msg: "metadata " + key + " missing or not numeric"}
		}
		if gotValue != want {
			return &caseError{file: name, id: c.ID,
				msg: "metadata " + key + " mismatch\n  got:  " +
					strconv.FormatFloat(gotValue, 'g', -1, 64) +
					"\n  want: " + strconv.FormatFloat(want, 'g', -1, 64)}
		}
	}
	return nil
}

func compareResults(t *testing.T, name string, vf vecFile, fn calcFunc) error {
	t.Helper()
	for _, c := range vf.Cases {
		inputs := map[string]string{}
		for k, v := range c.Inputs {
			switch typed := v.(type) {
			case string:
				inputs[k] = typed
			case float64:
				inputs[k] = strconv.FormatFloat(typed, 'f', -1, 64)
			case bool:
				inputs[k] = strconv.FormatBool(typed)
			case nil:
				inputs[k] = ""
			default:
				blob, _ := json.Marshal(typed)
				inputs[k] = string(blob)
			}
		}
		got, err := fn(inputs)
		if isErrorCase(c.Expect) {
			if err != nil {
				continue
			}
			if got.Value == "" && strings.HasPrefix(got.Explanation, "Error: ") {
				continue
			}
			return &caseError{file: name, id: c.ID,
				msg: "expected an error result\n  got:   value=" + got.Value + " explanation=" + got.Explanation}
		}
		if err != nil {
			return &caseError{file: name, id: c.ID,
				msg: "unexpected error\n  got:  " + err.Error() + "\n  want: " + c.Expect.Value}
		}
		if c.Numeric != nil {
			return compareNumeric(name, c, got)
		}
		if got.Value != c.Expect.Value {
			return &caseError{file: name, id: c.ID,
				msg: "value mismatch\n  got:  " + got.Value + "\n  want: " + c.Expect.Value}
		}
		if c.Expect.Explanation != "" && got.Explanation != c.Expect.Explanation {
			return &caseError{file: name, id: c.ID,
				msg: "explanation mismatch\n  got:  " + got.Explanation + "\n  want: " + c.Expect.Explanation}
		}
		if err := compareChartData(name, c.ID, c.Expect.ChartData, got.ChartData); err != nil {
			return err
		}
	}
	return nil
}

// compareChartData checks the series the web engine plots. Vector cases that
// record no chartData are skipped; the rest must match in point count, in
// field set per point, and in order. Values compare with a tiny epsilon
// because both engines round chart samples through toFixed before they reach
// the comparison, so the last bit of the float is not meaningful.
func compareChartData(name, id string, want []map[string]interface{}, got []ChartData) error {
	if want == nil {
		return nil
	}
	const epsilon = 1e-9
	if len(want) != len(got) {
		return &caseError{file: name, id: id,
			msg: fmt.Sprintf("chartData length mismatch\n  got:  %d points\n  want: %d points", len(got), len(want))}
	}
	for i, wantPoint := range want {
		gotPoint := got[i]
		if len(wantPoint) != len(gotPoint) {
			return &caseError{file: name, id: id,
				msg: fmt.Sprintf("chartData[%d] field count mismatch\n  got:  %d fields\n  want: %d fields", i, len(gotPoint), len(wantPoint))}
		}
		for field, wantRaw := range wantPoint {
			gotValue, ok := gotPoint[field]
			if !ok {
				return &caseError{file: name, id: id,
					msg: fmt.Sprintf("chartData[%d] is missing field %q", i, field)}
			}
			wantValue, ok := wantRaw.(float64)
			if !ok {
				return &caseError{file: name, id: id,
					msg: fmt.Sprintf("chartData[%d].%s is not a number", i, field)}
			}
			if math.Abs(wantValue-gotValue) > epsilon {
				return &caseError{file: name, id: id,
					msg: fmt.Sprintf("chartData[%d].%s mismatch\n  got:  %v\n  want: %v", i, field, gotValue, wantValue)}
			}
		}
	}
	return nil
}

// isErrorCase reports whether a vector case records a failed run. The web
// engine surfaces failures as an empty value plus an "Error: …" explanation,
// so both engines are compared on the same axis.
func isErrorCase(expect CalcResultJSON) bool {
	return expect.Value == "" && strings.HasPrefix(expect.Explanation, "Error: ")
}

type caseError struct {
	file string
	id   string
	msg  string
}

func (e *caseError) Error() string {
	return e.file + " [" + e.id + "]: " + e.msg
}
