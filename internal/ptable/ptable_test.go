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
