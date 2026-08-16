package main

import (
	"context"
	"database/sql"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"chemistry-utility/internal/api"
	"chemistry-utility/internal/db"
	"chemistry-utility/internal/ptable"
)

// App is the main Wails application struct
type App struct {
	ctx         context.Context
	ptableSvc   *PTableService
	apiServer   *http.Server
	apiURL      string
	db          *sql.DB
}

// NewApp creates a new App instance
func NewApp() *App {
	// Read from the embedded asset FS instead of a CWD-relative path, which
	// does not exist in a packaged desktop binary.
	data, err := assets.ReadFile("frontend/dist/ptable.json")
	if err != nil {
		log.Printf("warning: failed to read embedded ptable.json: %v", err)
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
			log.Printf("warning: api server shutdown: %v", err)
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
		log.Printf("warning: failed to open database: %v", err)
		return
	}
	a.db = database

	apiInstance := api.New(database, driver, api.Config{
		RateLimitPerMinute: 100,
		CORSAllowedOrigins: []string{"*"},
	})

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Printf("warning: failed to listen for api server: %v", err)
		return
	}
	a.apiURL = "http://" + ln.Addr().String()
	a.apiServer = &http.Server{Handler: apiInstance.Router()}
	go func() {
		if err := a.apiServer.Serve(ln); err != nil && err != http.ErrServerClosed {
			log.Printf("api server error: %v", err)
		}
	}()
	log.Printf("desktop API listening on %s", a.apiURL)
}

func defaultDBPath() string {
	base, err := os.UserConfigDir()
	if err != nil {
		base = os.TempDir()
	}
	dir := filepath.Join(base, "chemistry-utility")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		log.Printf("warning: could not create app data dir %s: %v", dir, err)
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
