package calculators

import (
	"encoding/json"
	"errors"
	"math"
	"strconv"
	"strings"
	"sync"

	"chemistry-utility/core/internal/ptable"
)

// bondType is a direct port of
// frontend/src/modules/calculators/bondType.ts. The periodic table
// dataset is loaded the same way shared_molarmass.go loads it, so both
// calculators agree on element properties.

type bondElement struct {
	Symbol            string   `json:"symbol"`
	Type              string   `json:"type"`
	Electronegativity *float64 `json:"electronegativity"`
}

var bondTable struct {
	once     sync.Once
	elements []bondElement
	err      error
}

func loadBondElements() ([]bondElement, error) {
	bondTable.once.Do(func() {
		for _, path := range ptablePaths {
			svc := ptable.New(path)
			data, err := svc.GetData()
			if err != nil {
				continue
			}
			var elements []bondElement
			if err := json.Unmarshal([]byte(data), &elements); err != nil {
				bondTable.err = errors.New("bond type: invalid ptable.json: " + err.Error())
				return
			}
			bondTable.elements = elements
			return
		}
		bondTable.err = errors.New("bond type: ptable.json not found")
	})
	return bondTable.elements, bondTable.err
}

func bondType(inputs map[string]string) (CalcResult, error) {
	elements, err := loadBondElements()
	if err != nil {
		return CalcResult{}, err
	}
	element1Value := strings.TrimSpace(inputs["element1-input"])
	element2Value := strings.TrimSpace(inputs["element2-input"])
	if element1Value == "" || element2Value == "" {
		return CalcResult{}, errors.New("Please enter both element symbols")
	}
	element1Value = capitalizeSymbol(element1Value)
	element2Value = capitalizeSymbol(element2Value)

	var element1, element2 *bondElement
	for i := range elements {
		currentElement := &elements[i]
		if currentElement.Symbol == element1Value {
			element1 = currentElement
		}
		if currentElement.Symbol == element2Value {
			element2 = currentElement
		}
		if element1 != nil && element2 != nil {
			break
		}
	}
	if element1 == nil || element2 == nil {
		return CalcResult{}, errors.New("One or both elements not found in periodic table")
	}

	if element1.Electronegativity == nil || element2.Electronegativity == nil {
		return CalcResult{
			Value:       "Bond prediction not possible due to unavailable electronegativity data",
			Explanation: "Element " + element1.Symbol + " or " + element2.Symbol + " has null electronegativity; cannot compute ΔEN.",
			Metadata: CalcMetadata{
				"element1": element1.Symbol,
				"element2": element2.Symbol,
				"en1":      nil,
				"en2":      nil,
			},
		}, nil
	}
	en1 := *element1.Electronegativity
	en2 := *element2.Electronegativity

	deltaENValue := math.Abs(en1 - en2)
	deltaEN := formatFixed(deltaENValue, 2)
	isMetal1 := isBondMetal(element1.Type)
	isMetal2 := isBondMetal(element2.Type)

	var bondKind string
	switch {
	case isMetal1 && isMetal2:
		bondKind = "Metallic"
	case isMetal1 != isMetal2 || deltaENValue >= 1.7:
		bondKind = "Ionic"
	case deltaENValue >= 0.4:
		bondKind = "Polar Covalent"
	default:
		bondKind = "Nonpolar Covalent"
	}

	value := element1.Symbol + " (" + jsNumber(en1) + ") and " + element2.Symbol + " (" + jsNumber(en2) + ") -> ΔEN=" + deltaEN + " -> " + bondKind + " bond"
	explanation := "ΔEN = |EN(" + element1.Symbol + ") - EN(" + element2.Symbol + ")| = |" + jsNumber(en1) + " - " + jsNumber(en2) + "| = " + deltaEN + "; isMetal1=" + strconv.FormatBool(isMetal1) + ", isMetal2=" + strconv.FormatBool(isMetal2) + " -> " + bondKind

	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"element1": element1.Symbol,
			"element2": element2.Symbol,
			"en1":      en1,
			"en2":      en2,
			"deltaEN":  deltaENValue,
			"bondType": bondKind,
			"isMetal1": isMetal1,
			"isMetal2": isMetal2,
		},
	}, nil
}

func capitalizeSymbol(symbol string) string {
	if symbol == "" {
		return ""
	}
	return strings.ToUpper(symbol[:1]) + strings.ToLower(symbol[1:])
}

func isBondMetal(elementType string) bool {
	lowered := strings.ToLower(elementType)
	return lowered == "lanthanide" || lowered == "actinide" ||
		(strings.Contains(lowered, "metal") && lowered != "metalloid" && lowered != "non-metal")
}
