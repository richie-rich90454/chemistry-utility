package calculators

import (
	"context"
	"errors"
	"fmt"
	"math"
)

// HalfLife solves radioactive decay: N = N0·e^(-λt) or N = N0·(0.5)^(t/t½).
// Input keys: "N0" (initial quantity), "t" (time), "halfLife" (t½),
// "Nt" (remaining quantity), "solveFor" ("remaining", "time", "halfLife").
func HalfLife(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solveFor := getStringWithDefault(input, "solveFor", "remaining")

	var result float64
	var unit string

	switch solveFor {
	case "remaining":
		N0, err := getFloat(input, "N0")
		if err != nil {
			return CalculationResult{}, err
		}
		t, err := getFloat(input, "t")
		if err != nil {
			return CalculationResult{}, err
		}
		tHalf, err := getFloat(input, "halfLife")
		if err != nil {
			return CalculationResult{}, err
		}
		if tHalf <= 0 {
			return CalculationResult{}, errors.New("half-life must be positive")
		}
		if N0 <= 0 {
			return CalculationResult{}, errors.New("initial quantity must be positive")
		}
		result = N0 * math.Pow(0.5, t/tHalf)
		unit = ""
	case "time":
		N0, err := getFloat(input, "N0")
		if err != nil {
			return CalculationResult{}, err
		}
		tHalf, err := getFloat(input, "halfLife")
		if err != nil {
			return CalculationResult{}, err
		}
		Nt, err := getFloat(input, "Nt")
		if err != nil {
			return CalculationResult{}, err
		}
		if tHalf <= 0 {
			return CalculationResult{}, errors.New("half-life must be positive")
		}
		if N0 <= 0 {
			return CalculationResult{}, errors.New("initial quantity must be positive")
		}
		if Nt <= 0 {
			return CalculationResult{}, errors.New("remaining quantity must be positive")
		}
		result = (math.Log(Nt/N0) / math.Log(0.5)) * tHalf
		unit = ""
	case "halfLife":
		N0, err := getFloat(input, "N0")
		if err != nil {
			return CalculationResult{}, err
		}
		t, err := getFloat(input, "t")
		if err != nil {
			return CalculationResult{}, err
		}
		Nt, err := getFloat(input, "Nt")
		if err != nil {
			return CalculationResult{}, err
		}
		if N0 <= 0 {
			return CalculationResult{}, errors.New("initial quantity must be positive")
		}
		if Nt <= 0 {
			return CalculationResult{}, errors.New("remaining quantity must be positive")
		}
		result = t / (math.Log(Nt/N0) / math.Log(0.5))
		unit = ""
	default:
		return CalculationResult{}, fmt.Errorf("invalid solveFor: %s", solveFor)
	}

	return CalculationResult{
		Value: result,
		Unit:  unit,
		Steps: []string{
			fmt.Sprintf("N = N0 × (0.5)^(t/t½), solving for %s", solveFor),
			fmt.Sprintf("Result: %.6f", result),
		},
		Metadata: map[string]interface{}{"solveFor": solveFor},
	}, nil
}
