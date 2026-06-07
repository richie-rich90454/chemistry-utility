package main

import "context"

// App is the main Wails application struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App instance
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// shutdown is called when the app closes
func (a *App) shutdown(ctx context.Context) {
	// Cleanup resources
}
