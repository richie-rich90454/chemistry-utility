package ptable

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

// validPayload builds a minimal but valid 118-element table payload:
// unique Z 1-118 with the required keys and in-range values.
func validPayload(t *testing.T) string {
	t.Helper()
	elements := make([]map[string]interface{}, 0, 118)
	for z := 1; z <= 118; z++ {
		period := (z-1)/18 + 1
		if period > 7 {
			period = 7
		}
		elements = append(elements, map[string]interface{}{
			"atomicNumber": z,
			"symbol":       "E",
			"name":         "Element",
			"atomicMass":   1.0,
			"period":       period,
		})
	}
	raw, err := json.Marshal(elements)
	if err != nil {
		t.Fatal(err)
	}
	return string(raw)
}

func TestGetData(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "chemutil-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	ptableJSON := validPayload(t)
	err = os.WriteFile(filepath.Join(tmpDir, "ptable.json"), []byte(ptableJSON), 0644)
	if err != nil {
		t.Fatal(err)
	}

	svc := New(filepath.Join(tmpDir, "ptable.json"))
	data, err := svc.GetData()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if data != ptableJSON {
		t.Errorf("expected %s, got %s", ptableJSON, data)
	}
}

func TestMissingFile(t *testing.T) {
	svc := New("/nonexistent/path/ptable.json")
	_, err := svc.GetData()
	if err == nil {
		t.Error("expected error for missing file, got nil")
	}
}

func TestTruncatedTableRejected(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "chemutil-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	truncated := `[{"atomicNumber":1,"symbol":"H","name":"Hydrogen","atomicMass":1.008,"period":1}]`
	err = os.WriteFile(filepath.Join(tmpDir, "ptable.json"), []byte(truncated), 0644)
	if err != nil {
		t.Fatal(err)
	}

	svc := New(filepath.Join(tmpDir, "ptable.json"))
	if _, err := svc.GetData(); err == nil {
		t.Error("expected error for truncated table, got nil")
	}
}

func TestLoadData(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "chemutil-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	// Start with missing file
	svc := New("/nonexistent/path/ptable.json")
	_, err = svc.GetData()
	if err == nil {
		t.Error("expected error for missing file")
	}

	// Create the file and reload
	ptableJSON := validPayload(t)
	err = os.WriteFile(filepath.Join(tmpDir, "ptable.json"), []byte(ptableJSON), 0644)
	if err != nil {
		t.Fatal(err)
	}

	err = svc.LoadData(filepath.Join(tmpDir, "ptable.json"))
	if err != nil {
		t.Fatalf("expected no error on reload, got %v", err)
	}

	data, err := svc.GetData()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if data != ptableJSON {
		t.Errorf("expected %s, got %s", ptableJSON, data)
	}
}

func decodeValid(t *testing.T) []map[string]interface{} {
	t.Helper()
	var elements []map[string]interface{}
	if err := json.Unmarshal([]byte(validPayload(t)), &elements); err != nil {
		t.Fatal(err)
	}
	return elements
}

func encodeElements(t *testing.T, elements []map[string]interface{}) string {
	t.Helper()
	raw, err := json.Marshal(elements)
	if err != nil {
		t.Fatal(err)
	}
	return string(raw)
}

func withElement(t *testing.T, index int, key string, value interface{}) string {
	t.Helper()
	elements := decodeValid(t)
	elements[index][key] = value
	return encodeElements(t, elements)
}

func withoutElementKey(t *testing.T, index int, key string) string {
	t.Helper()
	elements := decodeValid(t)
	delete(elements[index], key)
	return encodeElements(t, elements)
}

func TestNewFromBytesValid(t *testing.T) {
	want := validPayload(t)
	svc := NewFromBytes([]byte(want))
	got, err := svc.GetData()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if got != want {
		t.Errorf("expected %s, got %s", want, got)
	}
}

func TestNewInvalidContent(t *testing.T) {
	path := filepath.Join(t.TempDir(), "ptable.json")
	if err := os.WriteFile(path, []byte("{invalid"), 0644); err != nil {
		t.Fatal(err)
	}
	svc := New(path)
	if _, err := svc.GetData(); err == nil {
		t.Error("expected error for invalid content, got nil")
	}
}

func TestValidatePTableRejections(t *testing.T) {
	cases := []struct {
		name    string
		payload func(t *testing.T) string
	}{
		{
			name:    "malformed JSON",
			payload: func(t *testing.T) string { return "{invalid" },
		},
		{
			name:    "non-array JSON",
			payload: func(t *testing.T) string { return `{"atomicNumber":1}` },
		},
		{
			name:    "empty array",
			payload: func(t *testing.T) string { return `[]` },
		},
		{
			name: "too few elements",
			payload: func(t *testing.T) string {
				return encodeElements(t, decodeValid(t)[:117])
			},
		},
		{
			name: "too many elements",
			payload: func(t *testing.T) string {
				elements := decodeValid(t)
				return encodeElements(t, append(elements, elements[0]))
			},
		},
		{
			name:    "missing symbol",
			payload: func(t *testing.T) string { return withoutElementKey(t, 0, "symbol") },
		},
		{
			name:    "empty symbol",
			payload: func(t *testing.T) string { return withElement(t, 0, "symbol", "") },
		},
		{
			name:    "missing name",
			payload: func(t *testing.T) string { return withoutElementKey(t, 3, "name") },
		},
		{
			name:    "empty name",
			payload: func(t *testing.T) string { return withElement(t, 3, "name", "") },
		},
		{
			name:    "missing atomicNumber",
			payload: func(t *testing.T) string { return withoutElementKey(t, 5, "atomicNumber") },
		},
		{
			name:    "atomicNumber zero",
			payload: func(t *testing.T) string { return withElement(t, 0, "atomicNumber", 0) },
		},
		{
			name:    "atomicNumber too large",
			payload: func(t *testing.T) string { return withElement(t, 0, "atomicNumber", 119) },
		},
		{
			name: "duplicate atomicNumber",
			payload: func(t *testing.T) string {
				return withElement(t, 1, "atomicNumber", 1)
			},
		},
		{
			name:    "missing atomicMass",
			payload: func(t *testing.T) string { return withoutElementKey(t, 7, "atomicMass") },
		},
		{
			name:    "atomicMass zero",
			payload: func(t *testing.T) string { return withElement(t, 7, "atomicMass", 0.0) },
		},
		{
			name:    "atomicMass negative",
			payload: func(t *testing.T) string { return withElement(t, 7, "atomicMass", -1.5) },
		},
		{
			name:    "atomicMass too large",
			payload: func(t *testing.T) string { return withElement(t, 7, "atomicMass", 1000.0) },
		},
		{
			name:    "missing period",
			payload: func(t *testing.T) string { return withoutElementKey(t, 9, "period") },
		},
		{
			name:    "period zero",
			payload: func(t *testing.T) string { return withElement(t, 9, "period", 0) },
		},
		{
			name:    "period too large",
			payload: func(t *testing.T) string { return withElement(t, 9, "period", 8) },
		},
		{
			name:    "group zero",
			payload: func(t *testing.T) string { return withElement(t, 11, "group", 0) },
		},
		{
			name:    "group too large",
			payload: func(t *testing.T) string { return withElement(t, 11, "group", 19) },
		},
		{
			name:    "electronegativity negative",
			payload: func(t *testing.T) string { return withElement(t, 13, "electronegativity", -0.1) },
		},
		{
			name:    "electronegativity too large",
			payload: func(t *testing.T) string { return withElement(t, 13, "electronegativity", 6.1) },
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			raw := tc.payload(t)
			if err := validatePTable([]byte(raw)); err == nil {
				t.Error("expected validatePTable error, got nil")
			}
			svc := NewFromBytes([]byte(raw))
			if _, err := svc.GetData(); err == nil {
				t.Error("expected GetData error, got nil")
			}
		})
	}
}

func TestValidatePTableOptionalFieldsAccepted(t *testing.T) {
	elements := decodeValid(t)
	for _, e := range elements {
		e["group"] = 1
		e["electronegativity"] = 2.5
	}
	payload := encodeElements(t, elements)
	if err := validatePTable([]byte(payload)); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	svc := NewFromBytes([]byte(payload))
	if _, err := svc.GetData(); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestLoadDataMissingFile(t *testing.T) {
	svc := NewFromBytes([]byte(validPayload(t)))
	if err := svc.LoadData(filepath.Join(t.TempDir(), "missing.json")); err == nil {
		t.Error("expected error for missing file, got nil")
	}
	if _, err := svc.GetData(); err == nil {
		t.Error("expected GetData error after failed reload, got nil")
	}
}

func TestLoadDataInvalidPayloadRejected(t *testing.T) {
	dir := t.TempDir()
	svc := NewFromBytes([]byte(validPayload(t)))

	bad := filepath.Join(dir, "bad.json")
	if err := os.WriteFile(bad, []byte(`[{"atomicNumber":1}]`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := svc.LoadData(bad); err == nil {
		t.Error("expected error for invalid payload, got nil")
	}
	if _, err := svc.GetData(); err == nil {
		t.Error("expected GetData error after rejected reload, got nil")
	}

	good := filepath.Join(dir, "good.json")
	want := validPayload(t)
	if err := os.WriteFile(good, []byte(want), 0644); err != nil {
		t.Fatal(err)
	}
	if err := svc.LoadData(good); err != nil {
		t.Fatalf("expected no error on reload, got %v", err)
	}
	got, err := svc.GetData()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if got != want {
		t.Errorf("expected %s, got %s", want, got)
	}
}
