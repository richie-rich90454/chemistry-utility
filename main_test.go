package main

import(
	"os"
	"path/filepath"
	"testing"
)

func TestPTableServiceGetPTableData(t *testing.T){
	tmpDir, err:=os.MkdirTemp("", "chemutil-test")
	if err!=nil{
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	ptableJSON:=`[{"atomicNumber":1,"symbol":"H","name":"Hydrogen"}]`
	err=os.WriteFile(filepath.Join(tmpDir, "ptable.json"), []byte(ptableJSON), 0644)
	if err!=nil{
		t.Fatal(err)
	}

	svc:=NewPTableService(filepath.Join(tmpDir, "ptable.json"))
	data, err:=svc.GetPTableData()
	if err!=nil{
		t.Fatalf("expected no error, got %v", err)
	}
	if data!=ptableJSON{
		t.Errorf("expected %s, got %s", ptableJSON, data)
	}
}

func TestPTableServiceMissingFile(t *testing.T){
	svc:=NewPTableService("/nonexistent/path/ptable.json")
	_, err:=svc.GetPTableData()
	if err==nil{
		t.Error("expected error for missing file, got nil")
	}
}

func TestPTableServiceLoadData(t *testing.T){
	tmpDir, err:=os.MkdirTemp("", "chemutil-test")
	if err!=nil{
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	// Start with missing file
	svc:=NewPTableService("/nonexistent/path/ptable.json")
	_, err=svc.GetPTableData()
	if err==nil{
		t.Error("expected error for missing file")
	}

	// Create the file and reload
	ptableJSON:=`[{"atomicNumber":2,"symbol":"He","name":"Helium"}]`
	err=os.WriteFile(filepath.Join(tmpDir, "ptable.json"), []byte(ptableJSON), 0644)
	if err!=nil{
		t.Fatal(err)
	}

	err=svc.LoadData(filepath.Join(tmpDir, "ptable.json"))
	if err!=nil{
		t.Fatalf("expected no error on reload, got %v", err)
	}

	data, err:=svc.GetPTableData()
	if err!=nil{
		t.Fatalf("expected no error, got %v", err)
	}
	if data!=ptableJSON{
		t.Errorf("expected %s, got %s", ptableJSON, data)
	}
}

func TestNewApp(t *testing.T){
	app:=NewApp()
	if app==nil{
		t.Fatal("expected non-nil app")
	}
	if app.ptableSvc==nil{
		t.Fatal("expected non-nil ptableSvc")
	}
}
