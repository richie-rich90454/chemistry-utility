package calculators

import (
	"context"
	"fmt"
	"math"
	"strings"
)

// ElementData holds element information for bond type prediction.
type ElementData struct {
	Symbol          string
	Electronegativity float64
	Type            string
}

// elementDB contains element data for bond type prediction.
var elementDB = map[string]ElementData{
	"H":  {"H", 2.20, "non-metal"},
	"Li": {"Li", 0.98, "alkali-metal"},
	"Be": {"Be", 1.57, "alkaline-earth-metal"},
	"B":  {"B", 2.04, "metalloid"},
	"C":  {"C", 2.55, "non-metal"},
	"N":  {"N", 3.04, "non-metal"},
	"O":  {"O", 3.44, "non-metal"},
	"F":  {"F", 3.98, "non-metal"},
	"Na": {"Na", 0.93, "alkali-metal"},
	"Mg": {"Mg", 1.31, "alkaline-earth-metal"},
	"Al": {"Al", 1.61, "metal"},
	"Si": {"Si", 1.90, "metalloid"},
	"P":  {"P", 2.19, "non-metal"},
	"S":  {"S", 2.58, "non-metal"},
	"Cl": {"Cl", 3.16, "non-metal"},
	"K":  {"K", 0.82, "alkali-metal"},
	"Ca": {"Ca", 1.00, "alkaline-earth-metal"},
	"Sc": {"Sc", 1.36, "transition-metal"},
	"Ti": {"Ti", 1.54, "transition-metal"},
	"V":  {"V", 1.63, "transition-metal"},
	"Cr": {"Cr", 1.66, "transition-metal"},
	"Mn": {"Mn", 1.55, "transition-metal"},
	"Fe": {"Fe", 1.83, "transition-metal"},
	"Co": {"Co", 1.88, "transition-metal"},
	"Ni": {"Ni", 1.91, "transition-metal"},
	"Cu": {"Cu", 1.90, "transition-metal"},
	"Zn": {"Zn", 1.65, "transition-metal"},
	"Ga": {"Ga", 1.81, "metal"},
	"Ge": {"Ge", 2.01, "metalloid"},
	"As": {"As", 2.18, "metalloid"},
	"Se": {"Se", 2.55, "non-metal"},
	"Br": {"Br", 2.96, "non-metal"},
	"Rb": {"Rb", 0.82, "alkali-metal"},
	"Sr": {"Sr", 0.95, "alkaline-earth-metal"},
	"Ag": {"Ag", 1.93, "transition-metal"},
	"Cd": {"Cd", 1.69, "transition-metal"},
	"In": {"In", 1.78, "metal"},
	"Sn": {"Sn", 1.96, "metal"},
	"Sb": {"Sb", 2.05, "metalloid"},
	"Te": {"Te", 2.10, "metalloid"},
	"I":  {"I", 2.66, "non-metal"},
	"Cs": {"Cs", 0.79, "alkali-metal"},
	"Ba": {"Ba", 0.89, "alkaline-earth-metal"},
	"Au": {"Au", 2.54, "transition-metal"},
	"Hg": {"Hg", 2.00, "transition-metal"},
	"Tl": {"Tl", 1.62, "metal"},
	"Pb": {"Pb", 2.33, "metal"},
	"Bi": {"Bi", 2.02, "metal"},
	"Pt": {"Pt", 2.28, "transition-metal"},
	"Pd": {"Pd", 2.20, "transition-metal"},
}

// isMetal checks if an element type is a metal.
func isMetal(elementType string) bool {
	t := strings.ToLower(elementType)
	return t == "lanthanide" || t == "actinide" ||
		(strings.Contains(t, "metal") && t != "metalloid" && t != "non-metal")
}

// BondType predicts the type of chemical bond between two elements.
// Input keys: "element1" (symbol), "element2" (symbol).
func BondType(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	elem1Str, err := getString(input, "element1")
	if err != nil {
		return CalculationResult{}, err
	}
	elem2Str, err := getString(input, "element2")
	if err != nil {
		return CalculationResult{}, err
	}

	// Normalize: first letter uppercase, rest lowercase
	elem1Str = strings.ToUpper(string(elem1Str[0])) + strings.ToLower(elem1Str[1:])
	elem2Str = strings.ToUpper(string(elem2Str[0])) + strings.ToLower(elem2Str[1:])

	elem1, ok1 := elementDB[elem1Str]
	elem2, ok2 := elementDB[elem2Str]
	if !ok1 || !ok2 {
		return CalculationResult{}, fmt.Errorf("one or both elements not found: %s, %s", elem1Str, elem2Str)
	}

	deltaEN := math.Abs(elem1.Electronegativity - elem2.Electronegativity)
	isMetal1 := isMetal(elem1.Type)
	isMetal2 := isMetal(elem2.Type)

	var bondType string
	if isMetal1 && isMetal2 {
		bondType = "Metallic"
	} else if isMetal1 != isMetal2 || deltaEN >= 1.7 {
		bondType = "Ionic"
	} else if deltaEN >= 0.4 {
		bondType = "Polar Covalent"
	} else {
		bondType = "Nonpolar Covalent"
	}

	return CalculationResult{
		Value: deltaEN,
		Unit:  "",
		Steps: []string{
			fmt.Sprintf("%s (EN=%.2f) and %s (EN=%.2f)", elem1.Symbol, elem1.Electronegativity, elem2.Symbol, elem2.Electronegativity),
			fmt.Sprintf("ΔEN = %.2f", deltaEN),
			fmt.Sprintf("Bond type: %s", bondType),
		},
		Metadata: map[string]interface{}{
			"element1":      elem1.Symbol,
			"element2":      elem2.Symbol,
			"en1":           elem1.Electronegativity,
			"en2":           elem2.Electronegativity,
			"deltaEN":       deltaEN,
			"bondType":      bondType,
		},
	}, nil
}
