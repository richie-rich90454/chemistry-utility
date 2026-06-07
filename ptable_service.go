package main

import (
	"os"
	"sync"
)

// PTableService provides periodic table data to the frontend via Wails bindings
type PTableService struct {
	data []byte
	err  error
	mu   sync.RWMutex
}

// NewPTableService creates a new PTableService by loading data from the given path
func NewPTableService(dataPath string) *PTableService {
	s := &PTableService{}
	s.data, s.err = os.ReadFile(dataPath)
	return s
}

// GetPTableData returns the periodic table JSON data as a string
// This method is automatically bound to the frontend via Wails bindings
func (s *PTableService) GetPTableData() (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.err != nil {
		return "", s.err
	}
	return string(s.data), nil
}

// LoadData reloads the periodic table data from the given path
func (s *PTableService) LoadData(dataPath string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data, s.err = os.ReadFile(dataPath)
	return s.err
}
