package calculators

import (
	"context"
	"errors"
	"fmt"
	"math"
)

// Arrhenius calculates the rate constant using the Arrhenius equation:
// k = A·e^(-Ea/RT)
// Input keys: "A" (pre-exponential factor), "Ea" (activation energy in J/mol),
// "T" (temperature in K), "solveFor" (optional: "k", "Ea", "T", "A").
func Arrhenius(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solveFor := getStringWithDefault(input, "solveFor", "k")

	var result float64
	var unit string

	switch solveFor {
	case "k":
		A, err := getFloat(input, "A")
		if err != nil {
			return CalculationResult{}, err
		}
		Ea, err := getFloat(input, "Ea")
		if err != nil {
			return CalculationResult{}, err
		}
		T, err := getFloat(input, "T")
		if err != nil {
			return CalculationResult{}, err
		}
		if T <= 0 {
			return CalculationResult{}, errors.New("temperature must be positive")
		}
		result = A * math.Exp(-Ea/(RSI*T))
		unit = "s⁻¹"
	case "Ea":
		A, err := getFloat(input, "A")
		if err != nil {
			return CalculationResult{}, err
		}
		k, err := getFloat(input, "k")
		if err != nil {
			return CalculationResult{}, err
		}
		T, err := getFloat(input, "T")
		if err != nil {
			return CalculationResult{}, err
		}
		if T <= 0 || A <= 0 || k <= 0 {
			return CalculationResult{}, errors.New("T, A, and k must be positive")
		}
		result = -RSI * T * math.Log(k/A)
		unit = "J/mol"
	case "T":
		A, err := getFloat(input, "A")
		if err != nil {
			return CalculationResult{}, err
		}
		k, err := getFloat(input, "k")
		if err != nil {
			return CalculationResult{}, err
		}
		Ea, err := getFloat(input, "Ea")
		if err != nil {
			return CalculationResult{}, err
		}
		if k <= 0 || A <= 0 || k >= A {
			return CalculationResult{}, errors.New("k must be positive and less than A")
		}
		result = -Ea / (RSI * math.Log(k/A))
		unit = "K"
	case "A":
		k, err := getFloat(input, "k")
		if err != nil {
			return CalculationResult{}, err
		}
		Ea, err := getFloat(input, "Ea")
		if err != nil {
			return CalculationResult{}, err
		}
		T, err := getFloat(input, "T")
		if err != nil {
			return CalculationResult{}, err
		}
		if T <= 0 {
			return CalculationResult{}, errors.New("temperature must be positive")
		}
		result = k / math.Exp(-Ea/(RSI*T))
		unit = "s⁻¹"
	default:
		return CalculationResult{}, fmt.Errorf("invalid solveFor: %s", solveFor)
	}

	return CalculationResult{
		Value: result,
		Unit:  unit,
		Steps: []string{
			fmt.Sprintf("Arrhenius equation: k = A·e^(-Ea/RT), solving for %s", solveFor),
		},
		Metadata: map[string]interface{}{"solveFor": solveFor},
	}, nil
}

// RateLaw calculates the rate of reaction: rate = k[A]^m[B]^n.
// Input keys: "k", "concentrations" (slice of float64), "orders" (slice of float64).
func RateLaw(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	k, err := getFloat(input, "k")
	if err != nil {
		return CalculationResult{}, err
	}
	if k < 0 {
		return CalculationResult{}, errors.New("rate constant k cannot be negative")
	}

	concVal, ok := input["concentrations"]
	if !ok {
		return CalculationResult{}, errors.New("missing required input: concentrations")
	}
	orderVal, ok := input["orders"]
	if !ok {
		return CalculationResult{}, errors.New("missing required input: orders")
	}

	concentrations, ok := toFloat64Slice(concVal)
	if !ok {
		return CalculationResult{}, errors.New("concentrations must be a slice of float64")
	}
	orders, ok := toFloat64Slice(orderVal)
	if !ok {
		return CalculationResult{}, errors.New("orders must be a slice of float64")
	}
	if len(concentrations) != len(orders) {
		return CalculationResult{}, errors.New("concentrations and orders must have the same length")
	}

	rate := k
	steps := []string{"rate = k[A]^m[B]^n..."}
	steps = append(steps, fmt.Sprintf("k = %.6f", k))

	for i, conc := range concentrations {
		order := orders[i]
		if conc < 0 {
			return CalculationResult{}, errors.New("concentrations must be non-negative")
		}
		if conc == 0 && order < 0 {
			return CalculationResult{}, errors.New("zero concentration with negative order is undefined")
		}
		rate *= math.Pow(conc, order)
		steps = append(steps, fmt.Sprintf("[A%d] = %.4f, order = %.2f", i+1, conc, order))
	}

	if math.IsNaN(rate) || math.IsInf(rate, 0) {
		return CalculationResult{}, errors.New("rate calculation produced an invalid value; check concentrations and orders")
	}

	return CalculationResult{
		Value: rate,
		Unit:  "M/s",
		Steps: append(steps, fmt.Sprintf("rate = %.6f M/s", rate)),
	}, nil
}

// IntegratedRateLaw calculates concentration or time for zero, first, or second order reactions.
// Input keys: "order" (0, 1, or 2), "k", "initialConcentration",
// "time" (optional), "concentration" (optional), "solveFor" ("concentration" or "time").
func IntegratedRateLaw(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	order, err := getFloat(input, "order")
	if err != nil {
		return CalculationResult{}, err
	}
	k, err := getFloat(input, "k")
	if err != nil {
		return CalculationResult{}, err
	}
	C0, err := getFloat(input, "initialConcentration")
	if err != nil {
		return CalculationResult{}, err
	}
	if k < 0 {
		return CalculationResult{}, errors.New("rate constant cannot be negative")
	}
	if C0 <= 0 {
		return CalculationResult{}, errors.New("initial concentration must be positive")
	}
	if order != math.Trunc(order) {
		return CalculationResult{}, errors.New("reaction order must be an integer (0, 1, or 2)")
	}

	solveFor := getStringWithDefault(input, "solveFor", "concentration")
	if solveFor != "concentration" && solveFor != "time" {
		return CalculationResult{}, fmt.Errorf("invalid solveFor: %s (must be \"concentration\" or \"time\")", solveFor)
	}

	var result float64
	var unit string
	var formula string

	switch int(order) {
	case 0: // [A] = [A]₀ - kt
		switch solveFor {
		case "concentration":
			t, err := getFloat(input, "time")
			if err != nil {
				return CalculationResult{}, err
			}
			if t < 0 {
				return CalculationResult{}, errors.New("time cannot be negative")
			}
			result = C0 - k*t
			if result < 0 {
				return CalculationResult{}, errors.New("reaction is complete before the given time (concentration would be negative)")
			}
			formula = "[A] = [A]₀ - kt"
			unit = "M"
		case "time":
			C, err := getFloat(input, "concentration")
			if err != nil {
				return CalculationResult{}, err
			}
			if C < 0 || C > C0 {
				return CalculationResult{}, errors.New("concentration must be between 0 and the initial concentration")
			}
			if k == 0 {
				return CalculationResult{}, errors.New("rate constant cannot be zero for solving time")
			}
			result = (C0 - C) / k
			formula = "t = ([A]₀ - [A]) / k"
			unit = "s"
		}
	case 1: // ln[A] = ln[A]₀ - kt  →  [A] = [A]₀·e^(-kt)
		switch solveFor {
		case "concentration":
			t, err := getFloat(input, "time")
			if err != nil {
				return CalculationResult{}, err
			}
			if t < 0 {
				return CalculationResult{}, errors.New("time cannot be negative")
			}
			result = C0 * math.Exp(-k*t)
			formula = "[A] = [A]₀·e^(-kt)"
			unit = "M"
		case "time":
			C, err := getFloat(input, "concentration")
			if err != nil {
				return CalculationResult{}, err
			}
			if C <= 0 || C > C0 {
				return CalculationResult{}, errors.New("concentration must be positive and not exceed the initial concentration")
			}
			if k == 0 {
				return CalculationResult{}, errors.New("rate constant cannot be zero for solving time")
			}
			result = math.Log(C0/C) / k
			formula = "t = ln([A]₀/[A]) / k"
			unit = "s"
		}
	case 2: // 1/[A] = 1/[A]₀ + kt  →  [A] = [A]₀/(1 + k·[A]₀·t)
		switch solveFor {
		case "concentration":
			t, err := getFloat(input, "time")
			if err != nil {
				return CalculationResult{}, err
			}
			if t < 0 {
				return CalculationResult{}, errors.New("time cannot be negative")
			}
			result = C0 / (1 + k*C0*t)
			formula = "[A] = [A]₀ / (1 + k[A]₀t)"
			unit = "M"
		case "time":
			C, err := getFloat(input, "concentration")
			if err != nil {
				return CalculationResult{}, err
			}
			if C <= 0 || C > C0 {
				return CalculationResult{}, errors.New("concentration must be positive and not exceed the initial concentration")
			}
			if k == 0 || C0 == 0 {
				return CalculationResult{}, errors.New("concentrations must be positive and k non-zero")
			}
			result = (1/C - 1/C0) / k
			formula = "t = (1/[A] - 1/[A]₀) / k"
			unit = "s"
		}
	default:
		return CalculationResult{}, fmt.Errorf("unsupported reaction order: %d (must be 0, 1, or 2)", int(order))
	}

	return CalculationResult{
		Value: result,
		Unit:  unit,
		Steps: []string{fmt.Sprintf("Integrated rate law (order %d): %s", int(order), formula)},
		Metadata: map[string]interface{}{
			"order":    int(order),
			"solveFor": solveFor,
		},
	}, nil
}
