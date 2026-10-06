package main

import (
	"context"
	"database/sql"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"log/slog"

	"chemistry-utility/internal/api"
	"chemistry-utility/internal/db"
	"chemistry-utility/internal/ptable"
)

// App is the main Wails application struct
type App struct {
	ctx       context.Context
	ptableSvc *PTableService
	apiServer *http.Server
	apiURL    string
	db        *sql.DB
}

// NewApp creates a new App instance
func NewApp() *App {
	// Read from the embedded asset FS instead of a CWD-relative path, which
	// does not exist in a packaged desktop binary.
	data, err := assets.ReadFile("frontend/dist/ptable.json")
	if err != nil {
		slog.Warn("failed to read embedded ptable.json", "error", err)
	}
	return &App{
		ptableSvc: &PTableService{svc: ptable.NewFromBytes(data)},
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.startAPIServer()
}

// shutdown is called when the app closes
func (a *App) shutdown(ctx context.Context) {
	if a.apiServer != nil {
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if err := a.apiServer.Shutdown(shutdownCtx); err != nil {
			slog.Warn("api server shutdown", "error", err)
		}
	}
	if a.db != nil {
		_ = a.db.Close()
	}
}

// GetAPIURL returns the local HTTP API base URL used by the frontend. Empty
// means the API server failed to start and the app runs without backend
// features (compound search, batch calculator).
func (a *App) GetAPIURL() string {
	return a.apiURL
}

// startAPIServer runs the same gin API the web server exposes (cmd/server)
// on a loopback port so the desktop frontend gets identical backend behavior.
func (a *App) startAPIServer() {
	driver := os.Getenv("DB_DRIVER")
	if driver == "" {
		driver = "sqlite3"
	}
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = defaultDBPath()
	}
	cfg := db.Config{
		Driver:          driver,
		DSN:             dsn,
		MaxOpenConns:    25,
		MaxIdleConns:    5,
		ConnMaxLifetime: 5 * time.Minute,
		Migrations:      migrationsFS,
	}
	database, err := db.New(cfg)
	if err != nil {
		slog.Warn("failed to open database", "error", err)
		return
	}
	a.db = database

	// Scope loopback CORS to the exact origins the Wails webview sends.
	// go.mod pins wails v2.14.0, whose asset-server start URLs are
	// "wails://wails/" on darwin/linux and "http://wails.localhost/" on
	// Windows (WebView2 cannot serve the custom scheme there); Wails'
	// own origin validator likewise allows scheme://host of the start
	// URL, so the webview Origin header is exactly one of the two below.
	// A "*" here would let any local page read the desktop API. Extra
	// origins (e.g. the vite dev server under `wails dev`) can be added
	// via DESKTOP_CORS_EXTRA_ORIGINS (comma-separated); the default is
	// locked down.
	origins := []string{"wails://wails", "http://wails.localhost"}
	if extra := os.Getenv("DESKTOP_CORS_EXTRA_ORIGINS"); extra != "" {
		for _, o := range strings.Split(extra, ",") {
			if o = strings.TrimSpace(o); o != "" {
				origins = append(origins, o)
			}
		}
	}
	apiInstance := api.New(database, driver, api.Config{
		RateLimitPerMinute: 100,
		CORSAllowedOrigins: origins,
	})

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		slog.Warn("failed to listen for api server", "error", err)
		return
	}
	a.apiURL = "http://" + ln.Addr().String()
	a.apiServer = &http.Server{Handler: apiInstance.Router()}
	go func() {
		if err := a.apiServer.Serve(ln); err != nil && err != http.ErrServerClosed {
			slog.Warn("api server error", "error", err)
		}
	}()
	slog.Info("desktop API listening", "url", a.apiURL)
}

func defaultDBPath() string {
	base, err := os.UserConfigDir()
	if err != nil {
		base = os.TempDir()
	}
	dir := filepath.Join(base, "chemistry-utility")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		slog.Warn("could not create app data dir", "dir", dir, "error", err)
	}
	return filepath.Join(dir, "chemistry.db")
}

// PTableService wraps ptable.Service for Wails bindings
type PTableService struct {
	svc *ptable.Service
}

// GetPTableData returns the periodic table JSON data
func (s *PTableService) GetPTableData() (string, error) {
	return s.svc.GetData()
}

// LoadData reloads the periodic table data from the given path
func (s *PTableService) LoadData(dataPath string) error {
	return s.svc.LoadData(dataPath)
}
