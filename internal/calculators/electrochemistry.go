package calculators

import (
	"context"
	"errors"
	"fmt"
	"math"
)

const (
	// Faraday is Faraday's constant in C/mol.
	Faraday = 96485.0
)

// CellPotential calculates E°cell = E°cathode - E°anode.
// Input keys: "E1", "E2". The higher potential is the cathode.
func CellPotential(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	E1, err := getFloat(input, "E1")
	if err != nil {
		return CalculationResult{}, err
	}
	E2, err := getFloat(input, "E2")
	if err != nil {
		return CalculationResult{}, err
	}

	Ecathode := math.Max(E1, E2)
	Eanode := math.Min(E1, E2)
	Ecell := Ecathode - Eanode

	return CalculationResult{
		Value: Ecell,
		Unit:  "V",
		Steps: []string{
			fmt.Sprintf("E°cathode = %.4f V (higher potential)", Ecathode),
			fmt.Sprintf("E°anode = %.4f V (lower potential)", Eanode),
			fmt.Sprintf("E°cell = E°cathode - E°anode = %.4f - %.4f = %.4f V", Ecathode, Eanode, Ecell),
		},
		Metadata: map[string]interface{}{
			"Ecathode": Ecathode,
			"Eanode":   Eanode,
		},
	}, nil
}

// Nernst calculates the cell potential under non-standard conditions:
// E = E° - (RT/nF)ln(Q)
// Input keys: "E_standard", "T", "n", "Q".
func Nernst(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	Estd, err := getFloat(input, "E_standard")
	if err != nil {
		return CalculationResult{}, err
	}
	T, err := getFloat(input, "T")
	if err != nil {
		return CalculationResult{}, err
	}
	n, err := getFloat(input, "n")
	if err != nil {
		return CalculationResult{}, err
	}
	Q, err := getFloat(input, "Q")
	if err != nil {
		return CalculationResult{}, err
	}
	if T <= 0 {
		return CalculationResult{}, errors.New("temperature must be positive")
	}
	if n <= 0 {
		return CalculationResult{}, errors.New("number of electrons must be positive")
	}
	if n != math.Trunc(n) {
		return CalculationResult{}, errors.New("number of electrons must be an integer")
	}
	if Q <= 0 {
		return CalculationResult{}, errors.New("reaction quotient Q must be positive")
	}

	E := Estd - (RSI*T)/(n*Faraday)*math.Log(Q)

	return CalculationResult{
		Value: E,
		Unit:  "V",
		Steps: []string{
			"E = E° - (RT/nF)ln(Q)",
			fmt.Sprintf("E = %.4f - (%.4f × %.4f / (%.4f × %.0f)) × ln(%.4f)", Estd, RSI, T, n, Faraday, Q),
			fmt.Sprintf("E = %.4f V", E),
		},
	}, nil
}

// Electrolysis solves Faraday's law: m = (I × t × M) / (z × F).
// Input keys: "m" (mass), "I" (current), "t" (time), "z" (charge number),
// "M" (molar mass), "solveFor" ("mass", "current", "time").
func Electrolysis(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solveFor := getStringWithDefault(input, "solveFor", "mass")

	var result float64
	var unit string

	switch solveFor {
	case "mass":
		I, err := getFloat(input, "I")
		if err != nil {
			return CalculationResult{}, err
		}
		t, err := getFloat(input, "t")
		if err != nil {
			return CalculationResult{}, err
		}
		z, err := getFloat(input, "z")
		if err != nil {
			return CalculationResult{}, err
		}
		M, err := getFloat(input, "M")
		if err != nil {
			return CalculationResult{}, err
		}
		if I <= 0 || t <= 0 || z <= 0 || M <= 0 {
			return CalculationResult{}, errors.New("I, t, z, and M must be positive")
		}
		if z != math.Trunc(z) {
			return CalculationResult{}, errors.New("charge number z must be an integer")
		}
		moles := (I * t) / (Faraday * z)
		result = moles * M
		unit = "g"
	case "current":
		m, err := getFloat(input, "m")
		if err != nil {
			return CalculationResult{}, err
		}
		t, err := getFloat(input, "t")
		if err != nil {
			return CalculationResult{}, err
		}
		z, err := getFloat(input, "z")
		if err != nil {
			return CalculationResult{}, err
		}
		M, err := getFloat(input, "M")
		if err != nil {
			return CalculationResult{}, err
		}
		if m <= 0 || t <= 0 || z <= 0 || M <= 0 {
			return CalculationResult{}, errors.New("m, t, z, and M must be positive")
		}
		if z != math.Trunc(z) {
			return CalculationResult{}, errors.New("charge number z must be an integer")
		}
		moles := m / M
		result = (moles * Faraday * z) / t
		unit = "A"
	case "time":
		m, err := getFloat(input, "m")
		if err != nil {
			return CalculationResult{}, err
		}
		I, err := getFloat(input, "I")
		if err != nil {
			return CalculationResult{}, err
		}
		z, err := getFloat(input, "z")
		if err != nil {
			return CalculationResult{}, err
		}
		M, err := getFloat(input, "M")
		if err != nil {
			return CalculationResult{}, err
		}
		if m <= 0 || I <= 0 || z <= 0 || M <= 0 {
			return CalculationResult{}, errors.New("m, I, z, and M must be positive")
		}
		if z != math.Trunc(z) {
			return CalculationResult{}, errors.New("charge number z must be an integer")
		}
		moles := m / M
		result = (moles * Faraday * z) / I
		unit = "s"
	default:
		return CalculationResult{}, fmt.Errorf("invalid solveFor: %s", solveFor)
	}

	return CalculationResult{
		Value:    result,
		Unit:     unit,
		Steps:    []string{"Faraday's law: m = (I × t × M) / (z × F)"},
		Metadata: map[string]interface{}{"solveFor": solveFor},
	}, nil
}
