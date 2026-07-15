package calculators

import (
	"context"
	"errors"
	"fmt"
)

// GibbsFreeEnergy calculates ΔG = ΔH - TΔS.
// Input keys: "deltaH", "deltaS", "T".
func GibbsFreeEnergy(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	deltaH, err := getFloat(input, "deltaH")
	if err != nil {
		return CalculationResult{}, err
	}
	deltaS, err := getFloat(input, "deltaS")
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

	// Convert ΔS from J/(mol·K) to kJ/(mol·K) if needed
	// Convention: deltaS is in J/(mol·K), deltaH in kJ/mol
	deltaG := deltaH - T*(deltaS/1000.0)

	return CalculationResult{
		Value: deltaG,
		Unit:  "kJ/mol",
		Steps: []string{
			"ΔG = ΔH - TΔS",
			fmt.Sprintf("ΔG = %.4f kJ/mol - %.4f K × (%.4f J/(mol·K) / 1000)", deltaH, T, deltaS),
			fmt.Sprintf("ΔG = %.4f kJ/mol", deltaG),
		},
		Breakdown: []BreakdownItem{
			{Label: "ΔH", Value: deltaH, Unit: "kJ/mol"},
			{Label: "TΔS", Value: T * (deltaS / 1000.0), Unit: "kJ/mol"},
			{Label: "ΔG", Value: deltaG, Unit: "kJ/mol"},
		},
		Metadata: map[string]interface{}{
			"deltaH": deltaH,
			"deltaS": deltaS,
			"T":      T,
		},
	}, nil
}

// HessLaw calculates the total ΔH from a sum of reaction enthalpies.
// Input keys: "deltaHValues" (a slice of float64 values).
func HessLaw(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	v, ok := input["deltaHValues"]
	if !ok {
		return CalculationResult{}, errors.New("missing required input: deltaHValues")
	}

	values, ok := v.([]float64)
	if !ok {
		return CalculationResult{}, errors.New("deltaHValues must be a slice of float64")
	}

	var total float64
	steps := make([]string, len(values)+1)
	steps[0] = "Hess's Law: ΔH°total = Σ ΔH°reactions"

	for i, dh := range values {
		total += dh
		steps[i+1] = fmt.Sprintf("ΔH°%d = %.4f kJ/mol", i+1, dh)
	}

	return CalculationResult{
		Value: total,
		Unit:  "kJ/mol",
		Steps: append(steps, fmt.Sprintf("ΔH°total = %.4f kJ/mol", total)),
		Metadata: map[string]interface{}{
			"deltaHValues": values,
		},
	}, nil
}

// Entropy calculates ΔS = ΣS°products - ΣS°reactants.
// Input keys: "SProducts" (slice of float64), "SReactants" (slice of float64).
func Entropy(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	sp, ok := input["SProducts"]
	if !ok {
		return CalculationResult{}, errors.New("missing required input: SProducts")
	}
	sr, ok := input["SReactants"]
	if !ok {
		return CalculationResult{}, errors.New("missing required input: SReactants")
	}

	sProducts, ok := sp.([]float64)
	if !ok {
		return CalculationResult{}, errors.New("SProducts must be a slice of float64")
	}
	sReactants, ok := sr.([]float64)
	if !ok {
		return CalculationResult{}, errors.New("SReactants must be a slice of float64")
	}

	var sumProducts, sumReactants float64
	for _, s := range sProducts {
		sumProducts += s
	}
	for _, s := range sReactants {
		sumReactants += s
	}
	deltaS := sumProducts - sumReactants

	return CalculationResult{
		Value: deltaS,
		Unit:  "J/(mol·K)",
		Steps: []string{
			fmt.Sprintf("ΣS°products = %.4f J/(mol·K)", sumProducts),
			fmt.Sprintf("ΣS°reactants = %.4f J/(mol·K)", sumReactants),
			fmt.Sprintf("ΔS = %.4f - %.4f = %.4f J/(mol·K)", sumProducts, sumReactants, deltaS),
		},
	}, nil
}

// HeatCapacity calculates q = mcΔT.
// Input keys: "m" (mass), "c" (specific heat), "deltaT" (temperature change),
// "solveFor" (optional: "q", "m", "c", "deltaT", default "q").
func HeatCapacity(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solveFor := getStringWithDefault(input, "solveFor", "q")

	var result float64
	var unit string

	switch solveFor {
	case "q":
		m, err := getFloat(input, "m")
		if err != nil {
			return CalculationResult{}, err
		}
		c, err := getFloat(input, "c")
		if err != nil {
			return CalculationResult{}, err
		}
		deltaT, err := getFloat(input, "deltaT")
		if err != nil {
			return CalculationResult{}, err
		}
		result = m * c * deltaT
		unit = "J"
	case "m":
		q, err := getFloat(input, "q")
		if err != nil {
			return CalculationResult{}, err
		}
		c, err := getFloat(input, "c")
		if err != nil {
			return CalculationResult{}, err
		}
		deltaT, err := getFloat(input, "deltaT")
		if err != nil {
			return CalculationResult{}, err
		}
		if c == 0 || deltaT == 0 {
			return CalculationResult{}, errors.New("c and deltaT cannot be zero")
		}
		result = q / (c * deltaT)
		unit = "g"
	case "c":
		q, err := getFloat(input, "q")
		if err != nil {
			return CalculationResult{}, err
		}
		m, err := getFloat(input, "m")
		if err != nil {
			return CalculationResult{}, err
		}
		deltaT, err := getFloat(input, "deltaT")
		if err != nil {
			return CalculationResult{}, err
		}
		if m == 0 || deltaT == 0 {
			return CalculationResult{}, errors.New("m and deltaT cannot be zero")
		}
		result = q / (m * deltaT)
		unit = "J/(g·K)"
	case "deltaT":
		q, err := getFloat(input, "q")
		if err != nil {
			return CalculationResult{}, err
		}
		m, err := getFloat(input, "m")
		if err != nil {
			return CalculationResult{}, err
		}
		c, err := getFloat(input, "c")
		if err != nil {
			return CalculationResult{}, err
		}
		if m == 0 || c == 0 {
			return CalculationResult{}, errors.New("m and c cannot be zero")
		}
		result = q / (m * c)
		unit = "K"
	default:
		return CalculationResult{}, fmt.Errorf("invalid solveFor: %s", solveFor)
	}

	return CalculationResult{
		Value: result,
		Unit:  unit,
		Steps: []string{fmt.Sprintf("q = mcΔT, solving for %s", solveFor)},
	}, nil
}
