package calculators

import (
	"context"
	"errors"
	"fmt"
	"math"
)

const (
	// RAtmL is the gas constant in L·atm/(mol·K).
	RAtmL = 0.08206
	// RSI is the gas constant in J/(mol·K).
	RSI = 8.314
)

// IdealGasLaw solves PV = nRT for any one variable.
// Input keys: "P", "V", "n", "T", "solveFor" (one of "P","V","n","T"),
// "units" (optional: "atm-L" or "SI", default "atm-L").
func IdealGasLaw(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solveFor, err := getString(input, "solveFor")
	if err != nil {
		return CalculationResult{}, err
	}
	units := getStringWithDefault(input, "units", "atm-L")

	R := RAtmL
	if units == "SI" {
		R = RSI
	}

	var result float64
	var unit string
	var formula string

	switch solveFor {
	case "P":
		V, err := getFloat(input, "V")
		if err != nil {
			return CalculationResult{}, err
		}
		n, err := getFloat(input, "n")
		if err != nil {
			return CalculationResult{}, err
		}
		T, err := getFloat(input, "T")
		if err != nil {
			return CalculationResult{}, err
		}
		if V == 0 {
			return CalculationResult{}, errors.New("volume cannot be zero")
		}
		result = (n * R * T) / V
		formula = "P = (nRT) / V"
		if units == "atm-L" {
			unit = "atm"
		} else {
			unit = "Pa"
		}
	case "V":
		P, err := getFloat(input, "P")
		if err != nil {
			return CalculationResult{}, err
		}
		n, err := getFloat(input, "n")
		if err != nil {
			return CalculationResult{}, err
		}
		T, err := getFloat(input, "T")
		if err != nil {
			return CalculationResult{}, err
		}
		if P == 0 {
			return CalculationResult{}, errors.New("pressure cannot be zero")
		}
		result = (n * R * T) / P
		formula = "V = (nRT) / P"
		if units == "atm-L" {
			unit = "L"
		} else {
			unit = "m³"
		}
	case "n":
		P, err := getFloat(input, "P")
		if err != nil {
			return CalculationResult{}, err
		}
		V, err := getFloat(input, "V")
		if err != nil {
			return CalculationResult{}, err
		}
		T, err := getFloat(input, "T")
		if err != nil {
			return CalculationResult{}, err
		}
		if T == 0 {
			return CalculationResult{}, errors.New("temperature cannot be zero")
		}
		result = (P * V) / (R * T)
		formula = "n = (PV) / (RT)"
		unit = "mol"
	case "T":
		P, err := getFloat(input, "P")
		if err != nil {
			return CalculationResult{}, err
		}
		V, err := getFloat(input, "V")
		if err != nil {
			return CalculationResult{}, err
		}
		n, err := getFloat(input, "n")
		if err != nil {
			return CalculationResult{}, err
		}
		if n == 0 {
			return CalculationResult{}, errors.New("moles cannot be zero")
		}
		result = (P * V) / (n * R)
		formula = "T = (PV) / (nR)"
		unit = "K"
	default:
		return CalculationResult{}, fmt.Errorf("invalid solveFor value: %s", solveFor)
	}

	return CalculationResult{
		Value: result,
		Unit:  unit,
		Steps: []string{formula, fmt.Sprintf("R = %.5f", R)},
		Metadata: map[string]interface{}{
			"solveFor": solveFor,
			"units":    units,
		},
	}, nil
}

// CombinedGasLaw solves (P1*V1)/T1 = (P2*V2)/T2 for any one variable.
// Input keys: "P1", "V1", "T1", "P2", "V2", "T2", "solveFor".
func CombinedGasLaw(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solveFor, err := getString(input, "solveFor")
	if err != nil {
		return CalculationResult{}, err
	}

	var result float64
	var formula string
	var unit string

	switch solveFor {
	case "P1":
		V1, err := getFloat(input, "V1")
		if err != nil {
			return CalculationResult{}, err
		}
		T1, err := getFloat(input, "T1")
		if err != nil {
			return CalculationResult{}, err
		}
		P2, err := getFloat(input, "P2")
		if err != nil {
			return CalculationResult{}, err
		}
		V2, err := getFloat(input, "V2")
		if err != nil {
			return CalculationResult{}, err
		}
		T2, err := getFloat(input, "T2")
		if err != nil {
			return CalculationResult{}, err
		}
		if V1 == 0 || T2 == 0 {
			return CalculationResult{}, errors.New("division by zero: V1 and T2 must be non-zero")
		}
		result = (P2 * V2 * T1) / (V1 * T2)
		formula = "P1 = (P2 * V2 * T1) / (V1 * T2)"
		unit = "pressure units"
	case "V1":
		P1, err := getFloat(input, "P1")
		if err != nil {
			return CalculationResult{}, err
		}
		T1, err := getFloat(input, "T1")
		if err != nil {
			return CalculationResult{}, err
		}
		P2, err := getFloat(input, "P2")
		if err != nil {
			return CalculationResult{}, err
		}
		V2, err := getFloat(input, "V2")
		if err != nil {
			return CalculationResult{}, err
		}
		T2, err := getFloat(input, "T2")
		if err != nil {
			return CalculationResult{}, err
		}
		if P1 == 0 || T2 == 0 {
			return CalculationResult{}, errors.New("division by zero: P1 and T2 must be non-zero")
		}
		result = (P2 * V2 * T1) / (P1 * T2)
		formula = "V1 = (P2 * V2 * T1) / (P1 * T2)"
		unit = "volume units"
	case "T1":
		P1, err := getFloat(input, "P1")
		if err != nil {
			return CalculationResult{}, err
		}
		V1, err := getFloat(input, "V1")
		if err != nil {
			return CalculationResult{}, err
		}
		P2, err := getFloat(input, "P2")
		if err != nil {
			return CalculationResult{}, err
		}
		V2, err := getFloat(input, "V2")
		if err != nil {
			return CalculationResult{}, err
		}
		T2, err := getFloat(input, "T2")
		if err != nil {
			return CalculationResult{}, err
		}
		if P2 == 0 || V2 == 0 {
			return CalculationResult{}, errors.New("division by zero: P2 and V2 must be non-zero")
		}
		result = (P1 * V1 * T2) / (P2 * V2)
		formula = "T1 = (P1 * V1 * T2) / (P2 * V2)"
		unit = "K"
	case "P2":
		P1, err := getFloat(input, "P1")
		if err != nil {
			return CalculationResult{}, err
		}
		V1, err := getFloat(input, "V1")
		if err != nil {
			return CalculationResult{}, err
		}
		T1, err := getFloat(input, "T1")
		if err != nil {
			return CalculationResult{}, err
		}
		V2, err := getFloat(input, "V2")
		if err != nil {
			return CalculationResult{}, err
		}
		T2, err := getFloat(input, "T2")
		if err != nil {
			return CalculationResult{}, err
		}
		if V2 == 0 || T1 == 0 {
			return CalculationResult{}, errors.New("division by zero: V2 and T1 must be non-zero")
		}
		result = (P1 * V1 * T2) / (V2 * T1)
		formula = "P2 = (P1 * V1 * T2) / (V2 * T1)"
		unit = "pressure units"
	case "V2":
		P1, err := getFloat(input, "P1")
		if err != nil {
			return CalculationResult{}, err
		}
		V1, err := getFloat(input, "V1")
		if err != nil {
			return CalculationResult{}, err
		}
		T1, err := getFloat(input, "T1")
		if err != nil {
			return CalculationResult{}, err
		}
		P2, err := getFloat(input, "P2")
		if err != nil {
			return CalculationResult{}, err
		}
		T2, err := getFloat(input, "T2")
		if err != nil {
			return CalculationResult{}, err
		}
		if P2 == 0 || T1 == 0 {
			return CalculationResult{}, errors.New("division by zero: P2 and T1 must be non-zero")
		}
		result = (P1 * V1 * T2) / (P2 * T1)
		formula = "V2 = (P1 * V1 * T2) / (P2 * T1)"
		unit = "volume units"
	case "T2":
		P1, err := getFloat(input, "P1")
		if err != nil {
			return CalculationResult{}, err
		}
		V1, err := getFloat(input, "V1")
		if err != nil {
			return CalculationResult{}, err
		}
		T1, err := getFloat(input, "T1")
		if err != nil {
			return CalculationResult{}, err
		}
		P2, err := getFloat(input, "P2")
		if err != nil {
			return CalculationResult{}, err
		}
		V2, err := getFloat(input, "V2")
		if err != nil {
			return CalculationResult{}, err
		}
		if P1 == 0 || V1 == 0 {
			return CalculationResult{}, errors.New("division by zero: P1 and V1 must be non-zero")
		}
		result = (P2 * V2 * T1) / (P1 * V1)
		formula = "T2 = (P2 * V2 * T1) / (P1 * V1)"
		unit = "K"
	default:
		return CalculationResult{}, fmt.Errorf("invalid solveFor value: %s", solveFor)
	}

	return CalculationResult{
		Value: result,
		Unit:  unit,
		Steps: []string{formula},
		Metadata: map[string]interface{}{
			"solveFor": solveFor,
		},
	}, nil
}

// VanDerWaals calculates pressure using the Van der Waals equation:
// (P + an²/V²)(V - nb) = nRT
// Input keys: "V", "n", "T", "a", "b".
func VanDerWaals(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	V, err := getFloat(input, "V")
	if err != nil {
		return CalculationResult{}, err
	}
	n, err := getFloat(input, "n")
	if err != nil {
		return CalculationResult{}, err
	}
	T, err := getFloat(input, "T")
	if err != nil {
		return CalculationResult{}, err
	}
	a, err := getFloat(input, "a")
	if err != nil {
		return CalculationResult{}, err
	}
	b, err := getFloat(input, "b")
	if err != nil {
		return CalculationResult{}, err
	}

	if V <= 0 {
		return CalculationResult{}, errors.New("volume must be positive")
	}
	if V-n*b <= 0 {
		return CalculationResult{}, errors.New("volume is too small for the given amount of gas (V must be greater than n*b)")
	}

	P := (n*RAtmL*T)/(V-n*b) - a*math.Pow(n/V, 2)

	return CalculationResult{
		Value: P,
		Unit:  "atm",
		Steps: []string{
			"P = (nRT)/(V - nb) - a(n/V)2",
			fmt.Sprintf("P = (%.4f × %.5f × %.4f)/(%.4f - %.4f × %.4f) - %.4f × (%.4f/%.4f)2", n, RAtmL, T, V, n, b, a, n, V),
		},
		Metadata: map[string]interface{}{
			"V": V, "n": n, "T": T, "a": a, "b": b,
		},
	}, nil
}

// getStringWithDefault extracts a string or returns a default.
func getStringWithDefault(input CalculationInput, key string, defaultVal string) string {
	v, ok := input[key]
	if !ok {
		return defaultVal
	}
	s, ok := v.(string)
	if !ok {
		return defaultVal
	}
	return s
}
