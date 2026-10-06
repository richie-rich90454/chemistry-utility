package main

import (
	"context"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestNewApp(t *testing.T) {
	a := NewApp()
	if a == nil {
		t.Fatal("NewApp returned nil")
	}
	if a.ptableSvc == nil {
		t.Fatal("NewApp left ptableSvc nil")
	}
	if a.GetAPIURL() != "" {
		t.Errorf("fresh app apiURL = %q, want empty before startup", a.GetAPIURL())
	}
}

func TestGetPTableDataFromEmbeddedAssets(t *testing.T) {
	a := NewApp()
	data, err := a.ptableSvc.GetPTableData()
	if err != nil {
		t.Fatalf("GetPTableData: %v", err)
	}
	if len(data) == 0 {
		t.Error("GetPTableData returned empty payload")
	}
}

func TestPTableServiceLoadDataError(t *testing.T) {
	a := NewApp()
	if err := a.ptableSvc.LoadData(filepath.Join(t.TempDir(), "does-not-exist.json")); err == nil {
		t.Error("LoadData of a missing file must fail")
	}
	if _, err := a.ptableSvc.GetPTableData(); err == nil {
		t.Error("GetPTableData after failed LoadData must surface the error")
	}
}

func TestDefaultDBPath(t *testing.T) {
	t.Setenv("APPDATA", t.TempDir())
	got := defaultDBPath()
	if !strings.HasSuffix(got, filepath.Join("chemistry-utility", "chemistry.db")) {
		t.Errorf("defaultDBPath = %q, want chemistry-utility/chemistry.db suffix", got)
	}
	if st, err := os.Stat(filepath.Dir(got)); err != nil || !st.IsDir() {
		t.Errorf("defaultDBPath did not create its dir: %v", err)
	}
}

func TestDefaultDBPathNoUserConfigDir(t *testing.T) {
	old, had := os.LookupEnv("APPDATA")
	_ = os.Unsetenv("APPDATA")
	t.Cleanup(func() {
		if had {
			_ = os.Setenv("APPDATA", old)
		}
	})
	got := defaultDBPath()
	if !strings.HasSuffix(got, "chemistry.db") {
		t.Errorf("defaultDBPath without APPDATA = %q, want chemistry.db suffix", got)
	}
}

func TestDefaultDBPathMkdirFails(t *testing.T) {
	blocker := filepath.Join(t.TempDir(), "blocker")
	if err := os.WriteFile(blocker, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Setenv("APPDATA", blocker)
	got := defaultDBPath()
	if !strings.HasSuffix(got, "chemistry.db") {
		t.Errorf("defaultDBPath = %q, want chemistry.db suffix despite mkdir failure", got)
	}
}

func waitForHealth(t *testing.T, baseURL string) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for {
		resp, err := http.Get(baseURL + "/api/healthz")
		if err == nil {
			_ = resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return
			}
		}
		if time.Now().After(deadline) {
			t.Fatalf("API server at %s never became healthy", baseURL)
		}
		time.Sleep(20 * time.Millisecond)
	}
}

func TestStartupAndShutdown(t *testing.T) {
	t.Setenv("DB_DRIVER", "sqlite3")
	t.Setenv("DB_DSN", filepath.Join(t.TempDir(), "desktop.db"))
	t.Setenv("DESKTOP_CORS_EXTRA_ORIGINS", "http://localhost:1420, ,http://127.0.0.1:1420")

	a := NewApp()
	a.startup(context.Background())
	if a.GetAPIURL() == "" {
		t.Fatal("startup left apiURL empty")
	}
	if !strings.HasPrefix(a.GetAPIURL(), "http://127.0.0.1:") {
		t.Errorf("apiURL = %q, want loopback URL", a.GetAPIURL())
	}
	if a.apiServer == nil || a.db == nil {
		t.Fatal("startup did not retain apiServer/db")
	}
	waitForHealth(t, a.GetAPIURL())

	a.shutdown(context.Background())
	// A second shutdown surfaces the Shutdown-after-close error path.
	a.shutdown(context.Background())
}

func TestStartAPIServerDefaults(t *testing.T) {
	t.Setenv("APPDATA", t.TempDir())
	t.Setenv("DB_DRIVER", "")
	t.Setenv("DB_DSN", "")
	t.Setenv("DESKTOP_CORS_EXTRA_ORIGINS", "")

	a := NewApp()
	a.startAPIServer()
	if a.GetAPIURL() == "" {
		t.Fatal("startAPIServer with default env left apiURL empty")
	}
	waitForHealth(t, a.GetAPIURL())
	a.shutdown(context.Background())
}

func TestStartAPIServerDBError(t *testing.T) {
	t.Setenv("DB_DRIVER", "bogus-driver-for-test")
	t.Setenv("DB_DSN", filepath.Join(t.TempDir(), "never.db"))

	a := NewApp()
	a.startAPIServer()
	if a.GetAPIURL() != "" {
		t.Errorf("apiURL = %q, want empty when the database cannot open", a.GetAPIURL())
	}
	if a.apiServer != nil || a.db != nil {
		t.Error("failed start must not retain apiServer/db")
	}
	// Shutdown with nothing running must be a safe no-op.
	a.shutdown(context.Background())
}

func TestShutdownWithStuckRequest(t *testing.T) {
	t.Setenv("DB_DRIVER", "sqlite3")
	t.Setenv("DB_DSN", filepath.Join(t.TempDir(), "stuck.db"))

	a := NewApp()
	a.startAPIServer()
	if a.GetAPIURL() == "" {
		t.Fatal("startAPIServer left apiURL empty")
	}
	// Hold a half-open request (headers never terminate) so the server
	// cannot go idle and Shutdown's 3s budget expires with an error.
	conn, err := net.Dial("tcp", strings.TrimPrefix(a.GetAPIURL(), "http://"))
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	if _, err := conn.Write([]byte("GET /api/healthz HTTP/1.1\r\nHost: x\r\n")); err != nil {
		t.Fatal(err)
	}
	a.shutdown(context.Background())
}
