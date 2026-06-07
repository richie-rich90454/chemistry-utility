package ptable

import (
	"os"
	"sync"
)

// Service provides periodic table data
type Service struct {
	data []byte
	err  error
	mu   sync.RWMutex
}

// New creates a new Service by loading data from the given path
func New(dataPath string) *Service {
	s := &Service{}
	s.data, s.err = os.ReadFile(dataPath)
	return s
}

// GetData returns the periodic table JSON data as a string
func (s *Service) GetData() (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.err != nil {
		return "", s.err
	}
	return string(s.data), nil
}

// LoadData reloads the periodic table data from the given path
func (s *Service) LoadData(dataPath string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data, s.err = os.ReadFile(dataPath)
	return s.err
}
