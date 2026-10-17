package calculators

import (
	"encoding/json"
	"errors"
	"sync"

	"chemistry-utility/core/internal/ptable"
)

// The element data the advanced calculators need: symbol, name, atomic mass,
// and atomic number, read from the same ptable.json the molar-mass port
// uses. ptablePaths is defined in shared_molarmass.go.

type elementInfo struct {
	Symbol       string
	Name         string
	AtomicMass   float64
	AtomicNumber int
}

var advancedElementTable struct {
	once sync.Once
	list []elementInfo
	err  error
}

func loadElementData() ([]elementInfo, error) {
	advancedElementTable.once.Do(func() {
		for _, path := range ptablePaths {
			svc := ptable.New(path)
			data, err := svc.GetData()
			if err != nil {
				continue
			}
			var elements []struct {
				Symbol       string  `json:"symbol"`
				Name         string  `json:"name"`
				AtomicMass   float64 `json:"atomicMass"`
				AtomicNumber int     `json:"atomicNumber"`
			}
			if err := json.Unmarshal([]byte(data), &elements); err != nil {
				advancedElementTable.err = errors.New("element data: invalid ptable.json: " + err.Error())
				return
			}
			list := make([]elementInfo, 0, len(elements))
			for _, e := range elements {
				list = append(list, elementInfo{Symbol: e.Symbol, Name: e.Name, AtomicMass: e.AtomicMass, AtomicNumber: e.AtomicNumber})
			}
			advancedElementTable.list = list
			return
		}
		advancedElementTable.err = errors.New("element data: ptable.json not found")
	})
	return advancedElementTable.list, advancedElementTable.err
}

func findElementBySymbol(symbol string) (elementInfo, bool) {
	elements, err := loadElementData()
	if err != nil {
		return elementInfo{}, false
	}
	for _, e := range elements {
		if e.Symbol == symbol {
			return e, true
		}
	}
	return elementInfo{}, false
}

func findElementByAtomicNumber(atomicNumber int) (elementInfo, bool) {
	elements, err := loadElementData()
	if err != nil {
		return elementInfo{}, false
	}
	for _, e := range elements {
		if e.AtomicNumber == atomicNumber {
			return e, true
		}
	}
	return elementInfo{}, false
}
