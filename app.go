package main

import (
	"context"

	"chemistry-utility/internal/ptable"
)

// App is the main Wails application struct
type App struct {
	ctx       context.Context
	ptableSvc *PTableService
}

// NewApp creates a new App instance
func NewApp() *App {
	return &App{
		ptableSvc: &PTableService{svc: ptable.New("frontend/dist/ptable.json")},
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// shutdown is called when the app closes
func (a *App) shutdown(ctx context.Context) {
	// Cleanup resources
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
