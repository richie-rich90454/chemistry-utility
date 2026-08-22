package calculators

import (
	"context"
	"errors"
	"fmt"
	"unicode"
)

// atomicMasses contains the standard atomic weights for all 118 elements.
var atomicMasses = map[string]float64{
	"H": 1.008, "He": 4.0026, "Li": 6.941, "Be": 9.0122, "B": 10.81,
	"C": 12.011, "N": 14.007, "O": 15.999, "F": 18.998, "Ne": 20.180,
	"Na": 22.990, "Mg": 24.305, "Al": 26.982, "Si": 28.086, "P": 30.974,
	"S": 32.06, "Cl": 35.45, "Ar": 39.948, "K": 39.098, "Ca": 40.078,
	"Sc": 44.956, "Ti": 47.867, "V": 50.942, "Cr": 51.996, "Mn": 54.938,
	"Fe": 55.845, "Co": 58.933, "Ni": 58.693, "Cu": 63.546, "Zn": 65.38,
	"Ga": 69.723, "Ge": 72.630, "As": 74.922, "Se": 78.971, "Br": 79.904,
	"Kr": 83.798, "Rb": 85.468, "Sr": 87.62, "Y": 88.906, "Zr": 91.224,
	"Nb": 92.906, "Mo": 95.95, "Tc": 98.0, "Ru": 101.07, "Rh": 102.91,
	"Pd": 106.42, "Ag": 107.87, "Cd": 112.41, "In": 114.82, "Sn": 118.71,
	"Sb": 121.76, "Te": 127.60, "I": 126.90, "Xe": 131.29, "Cs": 132.91,
	"Ba": 137.33, "La": 138.91, "Ce": 140.12, "Pr": 140.91, "Nd": 144.24,
	"Pm": 145.0, "Sm": 150.36, "Eu": 151.96, "Gd": 157.25, "Tb": 158.93,
	"Dy": 162.50, "Ho": 164.93, "Er": 167.26, "Tm": 168.93, "Yb": 173.05,
	"Lu": 174.97, "Hf": 178.49, "Ta": 180.95, "W": 183.84, "Re": 186.21,
	"Os": 190.23, "Ir": 192.22, "Pt": 195.08, "Au": 196.97, "Hg": 200.59,
	"Tl": 204.38, "Pb": 207.2, "Bi": 208.98, "Po": 209.0, "At": 210.0,
	"Rn": 222.0, "Fr": 223.0, "Ra": 226.0, "Ac": 227.0, "Th": 232.04,
	"Pa": 231.04, "U": 238.03, "Np": 237.0, "Pu": 244.0, "Am": 243.0,
	"Cm": 247.0, "Bk": 247.0, "Cf": 251.0, "Es": 252.0, "Fm": 257.0,
	"Md": 258.0, "No": 259.0, "Lr": 262.0, "Rf": 267.0, "Db": 270.0,
	"Sg": 271.0, "Bh": 270.0, "Hs": 277.0, "Mt": 276.0, "Ds": 281.0,
	"Rg": 280.0, "Cn": 285.0, "Nh": 284.0, "Fl": 289.0, "Mc": 288.0,
	"Lv": 293.0, "Ts": 294.0, "Og": 294.0,
}

// parseElement parses an element symbol starting at the given index.
// Returns the symbol and the new index.
func parseElement(formula string, index int) (string, int, error) {
	if index >= len(formula) {
		return "", index, errors.New("unexpected end of formula")
	}
	currentChar := rune(formula[index])
	if !unicode.IsUpper(currentChar) {
		return "", index, fmt.Errorf("invalid element at position %d", index)
	}
	symbol := string(currentChar)
	index++
	if index < len(formula) {
		nextChar := rune(formula[index])
		if unicode.IsLower(nextChar) {
			symbol += string(nextChar)
			index++
		}
	}
	return symbol, index, nil
}

// parseNumber parses a subscript number starting at the given index.
// Returns the number and the new index. Returns 1 if no number is found.
// Subscripts longer than 6 digits are chemically meaningless and rejected
// rather than silently overflowing int arithmetic.
func parseNumber(formula string, index int) (int, int, error) {
	number := 0
	digits := 0
	for index < len(formula) && unicode.IsDigit(rune(formula[index])) {
		number = number*10 + int(formula[index]-'0')
		index++
		digits++
		if digits > 6 || number > 999999 {
			return 0, index, fmt.Errorf("subscript too large at position %d", index-digits)
		}
	}
	if number == 0 {
		number = 1
	}
	return number, index, nil
}

// elementCounts holds the count of each element in a formula.
type elementCounts map[string]float64

// parseFormulaWithCounts parses a chemical formula and returns element counts.
func parseFormulaWithCounts(formula string) (elementCounts, error) {
	counts := make(elementCounts)
	stack := []elementCounts{make(elementCounts)}
	i := 0

	for i < len(formula) {
		ch := rune(formula[i])
		if ch == '(' || ch == '[' || ch == '{' {
			stack = append(stack, make(elementCounts))
			i++
		} else if ch == ')' || ch == ']' || ch == '}' {
			if len(stack) < 2 {
				return nil, errors.New("unmatched closing bracket")
			}
			top := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			i++
			mul, newIndex, err := parseNumber(formula, i)
			if err != nil {
				return nil, err
			}
			i = newIndex
			for el, cnt := range top {
				stack[len(stack)-1][el] += cnt * float64(mul)
			}
		} else if unicode.IsUpper(ch) {
			symbol, newIndex, err := parseElement(formula, i)
			if err != nil {
				return nil, err
			}
			i = newIndex
			count, newIndex, err := parseNumber(formula, i)
			if err != nil {
				return nil, err
			}
			i = newIndex
			stack[len(stack)-1][symbol] += float64(count)
		} else {
			return nil, fmt.Errorf("invalid character in formula: %c", ch)
		}
	}

	if len(stack) != 1 {
		return nil, errors.New("unmatched opening bracket")
	}

	for el, cnt := range stack[0] {
		counts[el] = cnt
	}
	return counts, nil
}

// CalculateMolarMass parses a chemical formula and returns its molar mass
// with a breakdown of each element's contribution.
func CalculateMolarMass(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	formula, err := getString(input, "formula")
	if err != nil {
		return CalculationResult{}, err
	}

	counts, err := parseFormulaWithCounts(formula)
	if err != nil {
		return CalculationResult{}, err
	}

	var totalMass float64
	var breakdown []BreakdownItem
	var steps []string

	for symbol, count := range counts {
		mass, ok := atomicMasses[symbol]
		if !ok {
			return CalculationResult{}, fmt.Errorf("element not found: %s", symbol)
		}
		contribution := mass * count
		totalMass += contribution
		breakdown = append(breakdown, BreakdownItem{
			Label: symbol,
			Value: contribution,
			Unit:  "g/mol",
		})
		steps = append(steps, fmt.Sprintf("%s: %.4f g/mol × %.1f = %.4f g/mol", symbol, mass, count, contribution))
	}

	return CalculationResult{
		Value:     totalMass,
		Unit:      "g/mol",
		Breakdown: breakdown,
		Steps:     steps,
		Metadata:  map[string]interface{}{"formula": formula},
	}, nil
}
