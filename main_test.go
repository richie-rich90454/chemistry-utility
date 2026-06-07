package main

import(
	"io/ioutil"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func setupTestEnv(t *testing.T) (*fiber.App, func()){
	t.Helper()
	tmpDir, err:=ioutil.TempDir("", "chemutil-test")
	if err!=nil{
		t.Fatal(err)
	}
	distPath:=filepath.Join(tmpDir, "dist")
	err=os.MkdirAll(distPath, 0755)
	if err!=nil{
		t.Fatal(err)
	}
	ptableJSON:=[]byte(`[{"atomicNumber":1,"symbol":"H","name":"Hydrogen"}]`)
	err=os.WriteFile(filepath.Join(distPath, "ptable.json"), ptableJSON, 0644)
	if err!=nil{
		t.Fatal(err)
	}
	err=os.WriteFile(filepath.Join(distPath, "index.html"), []byte("<html><body>Test</body></html>"), 0644)
	if err!=nil{
		t.Fatal(err)
	}
	origPtableData:=ptableData
	origPtableErr:=ptableErr
	origHtmlCache:=htmlCache
	ptableData=ptableJSON
	ptableErr=nil
	htmlCache=map[string][]byte{
		"index.html": []byte("<html><body>Test</body></html>"),
	}
	app:=setupApp(distPath)
	cleanup:=func(){
		ptableData=origPtableData
		ptableErr=origPtableErr
		htmlCache=origHtmlCache
		os.RemoveAll(tmpDir)
	}
	return app, cleanup
}

func TestAPIPtableWithHeader(t *testing.T){
	app, cleanup:=setupTestEnv(t)
	defer cleanup()
	req:=httptest.NewRequest("GET", "/api/ptable", nil)
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	resp, err:=app.Test(req)
	if err!=nil{
		t.Fatal(err)
	}
	if resp.StatusCode!=200{
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
}

func TestAPIPtableWithoutHeader(t *testing.T){
	app, cleanup:=setupTestEnv(t)
	defer cleanup()
	req:=httptest.NewRequest("GET", "/api/ptable", nil)
	resp, err:=app.Test(req)
	if err!=nil{
		t.Fatal(err)
	}
	if resp.StatusCode!=403{
		t.Errorf("expected 403, got %d", resp.StatusCode)
	}
}

func TestPtableJSONBlocked(t *testing.T){
	app, cleanup:=setupTestEnv(t)
	defer cleanup()
	req:=httptest.NewRequest("GET", "/ptable.json", nil)
	resp, err:=app.Test(req)
	if err!=nil{
		t.Fatal(err)
	}
	if resp.StatusCode!=403{
		t.Errorf("expected 403, got %d", resp.StatusCode)
	}
}

func TestSPAFallback(t *testing.T){
	app, cleanup:=setupTestEnv(t)
	defer cleanup()
	req:=httptest.NewRequest("GET", "/some-unknown-route", nil)
	resp, err:=app.Test(req)
	if err!=nil{
		t.Fatal(err)
	}
	if resp.StatusCode!=200{
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
	ct:=resp.Header.Get("Content-Type")
	if ct!=""&&ct!="text/html"{
		t.Errorf("expected text/html content type, got %s", ct)
	}
}

func TestURLWithScheme(t *testing.T){
	app, cleanup:=setupTestEnv(t)
	defer cleanup()
	req:=httptest.NewRequest("GET", "http://evil.com://something", nil)
	resp, err:=app.Test(req)
	if err!=nil{
		t.Fatal(err)
	}
	if resp.StatusCode!=400{
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}
}

func TestNoXPoweredBy(t *testing.T){
	app, cleanup:=setupTestEnv(t)
	defer cleanup()
	req:=httptest.NewRequest("GET", "/api/ptable", nil)
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	resp, err:=app.Test(req)
	if err!=nil{
		t.Fatal(err)
	}
	poweredBy:=resp.Header.Get("X-Powered-By")
	if poweredBy!=""{
		t.Errorf("expected no X-Powered-By header, got %s", poweredBy)
	}
}
