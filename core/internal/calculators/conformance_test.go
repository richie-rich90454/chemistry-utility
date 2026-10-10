package calculators

import (
	"encoding/json"
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
	"dilution":        dilution,
	"mass-percent":    massPercent,
	"solution-mixing": solutionMixing,
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
		if got.Value != c.Expect.Value {
			return &caseError{file: name, id: c.ID,
				msg: "value mismatch\n  got:  " + got.Value + "\n  want: " + c.Expect.Value}
		}
		if c.Expect.Explanation != "" && got.Explanation != c.Expect.Explanation {
			return &caseError{file: name, id: c.ID,
				msg: "explanation mismatch\n  got:  " + got.Explanation + "\n  want: " + c.Expect.Explanation}
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
