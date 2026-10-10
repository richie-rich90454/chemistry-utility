package main

import (
	"context"

	"log/slog"

	"chemistry-utility/core/internal/ptable"
)

// App is the main Wails application struct.
type App struct {
	ctx         context.Context
	ptableSvc   *PTableService
	calculators *CalculatorService
	data        *DataService
}

// NewApp creates a new App instance.
func NewApp() *App {
	// Read from the embedded asset FS instead of a CWD-relative path, which
	// does not exist in a packaged desktop binary.
	data, err := assets.ReadFile("dist/ptable.json")
	if err != nil {
		slog.Warn("failed to read embedded ptable.json", "error", err)
	}
	table := ptable.NewFromBytes(data)
	return &App{
		ptableSvc:   &PTableService{svc: table},
		calculators: NewCalculatorService(),
		data:        NewDataService(table),
	}
}

// startup is called when the app starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// shutdown is called when the app closes.
func (a *App) shutdown(ctx context.Context) {}

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
