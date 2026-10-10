package calculators

import (
	"errors"
	"math"
	"strconv"
	"strings"
)

// The calculators in this file are a direct port of
// frontend/src/modules/calculators/solution.ts. Input keys, validation order,
// error messages, and output strings are kept identical so the conformance
// vectors pass unchanged.

func dilution(inputs map[string]string) (CalcResult, error) {
	solveFor := inputs["dilution-solve-for"]
	m1, errM1 := requiredFloat(inputs, "dilution-M1")
	v1, errV1 := requiredFloat(inputs, "dilution-V1")
	m2, errM2 := requiredFloat(inputs, "dilution-M2")
	v2, errV2 := requiredFloat(inputs, "dilution-V2")

	var result float64
	var formula string
	var absent []string

	switch solveFor {
	case "M1":
		absent = absentKeys([]error{errV1, errM2, errV2}, "dilution-V1", "dilution-M2", "dilution-V2")
		if len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if v1 <= 0 {
			return CalcResult{}, errors.New("Initial volume must be positive")
		}
		if m2 <= 0 {
			return CalcResult{}, errors.New("Final molarity must be positive")
		}
		if v2 <= 0 {
			return CalcResult{}, errors.New("Final volume must be positive")
		}
		result = (m2 * v2) / v1
		formula = "M1 = (M2 * V2) / V1"
	case "V1":
		absent = absentKeys([]error{errM1, errM2, errV2}, "dilution-M1", "dilution-M2", "dilution-V2")
		if len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if m1 <= 0 {
			return CalcResult{}, errors.New("Initial molarity must be positive")
		}
		if m2 <= 0 {
			return CalcResult{}, errors.New("Final molarity must be positive")
		}
		if v2 <= 0 {
			return CalcResult{}, errors.New("Final volume must be positive")
		}
		result = (m2 * v2) / m1
		formula = "V1 = (M2 * V2) / M1"
	case "M2":
		absent = absentKeys([]error{errM1, errV1, errV2}, "dilution-M1", "dilution-V1", "dilution-V2")
		if len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if m1 <= 0 {
			return CalcResult{}, errors.New("Initial molarity must be positive")
		}
		if v1 <= 0 {
			return CalcResult{}, errors.New("Initial volume must be positive")
		}
		if v2 <= 0 {
			return CalcResult{}, errors.New("Final volume must be positive")
		}
		result = (m1 * v1) / v2
		formula = "M2 = (M1 * V1) / V2"
	case "V2":
		absent = absentKeys([]error{errM1, errV1, errM2}, "dilution-M1", "dilution-V1", "dilution-M2")
		if len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if m1 <= 0 {
			return CalcResult{}, errors.New("Initial molarity must be positive")
		}
		if v1 <= 0 {
			return CalcResult{}, errors.New("Initial volume must be positive")
		}
		if m2 <= 0 {
			return CalcResult{}, errors.New("Final molarity must be positive")
		}
		result = (m1 * v1) / m2
		formula = "V2 = (M1 * V1) / M2"
	default:
		return CalcResult{}, errors.New("Invalid calculation type")
	}

	unit := "L"
	if strings.HasPrefix(solveFor, "M") {
		unit = "M"
	}
	formatted := formatFixed(result, 4)
	return CalcResult{
		Value:       formatted + " " + unit,
		Explanation: formula + " = " + formatted + " " + unit,
		Metadata: CalcMetadata{
			"solveFor": solveFor,
			"result":   result,
			"unit":     unit,
			"formula":  formula,
		},
	}, nil
}

func massPercent(inputs map[string]string) (CalcResult, error) {
	solute, err := requiredFloat(inputs, "mass-solute")
	if err != nil {
		return CalcResult{}, err
	}
	solution, err := requiredFloat(inputs, "mass-solution")
	if err != nil {
		return CalcResult{}, err
	}
	unit := inputs["concentration-unit"]
	if unit == "" {
		unit = "percent"
	}
	if solution == 0 {
		return CalcResult{}, errors.New("Solution mass cannot be zero")
	}
	if solute < 0 {
		return CalcResult{}, errors.New("Solute mass cannot be negative")
	}
	ratio := solute / solution
	var result float64
	var unitText string
	switch unit {
	case "percent":
		result = ratio * 100
		unitText = "%"
	case "ppm":
		result = ratio * 1000000
		unitText = "ppm"
	case "ppb":
		result = ratio * 1000000000
		unitText = "ppb"
	default:
		return CalcResult{}, errors.New("Invalid unit")
	}
	formatted := formatFixed(result, 4)
	return CalcResult{
		Value:       formatted + " " + unitText,
		Explanation: "Concentration: " + formatted + " " + unitText,
		Metadata: CalcMetadata{
			"concentration": result,
			"unit":          unitText,
			"ratio":         ratio,
			"solute":        solute,
			"solution":      solution,
		},
	}, nil
}

func solutionMixing(inputs map[string]string) (CalcResult, error) {
	c1, err := requiredFloat(inputs, "mix-C1")
	if err != nil {
		return CalcResult{}, missingInputsError([]string{"mix-C1", "mix-V1", "mix-C2", "mix-V2"})
	}
	v1, err := requiredFloat(inputs, "mix-V1")
	if err != nil {
		return CalcResult{}, missingInputsError([]string{"mix-C1", "mix-V1", "mix-C2", "mix-V2"})
	}
	c2, err := requiredFloat(inputs, "mix-C2")
	if err != nil {
		return CalcResult{}, missingInputsError([]string{"mix-C1", "mix-V1", "mix-C2", "mix-V2"})
	}
	v2, err := requiredFloat(inputs, "mix-V2")
	if err != nil {
		return CalcResult{}, missingInputsError([]string{"mix-C1", "mix-V1", "mix-C2", "mix-V2"})
	}
	if c1 <= 0 {
		return CalcResult{}, errors.New("First solution concentration must be positive")
	}
	if c2 <= 0 {
		return CalcResult{}, errors.New("Second solution concentration must be positive")
	}
	if v1 <= 0 {
		return CalcResult{}, errors.New("First solution volume must be positive")
	}
	if v2 <= 0 {
		return CalcResult{}, errors.New("Second solution volume must be positive")
	}
	totalMoles := (c1 * v1) + (c2 * v2)
	totalVolume := v1 + v2
	finalConcentration := totalMoles / totalVolume
	fcFormatted := formatFixed(finalConcentration, 4)
	tvFormatted := formatFixed(totalVolume, 4)
	return CalcResult{
		Value:       fcFormatted + " M",
		Explanation: "Final Concentration: " + fcFormatted + " M; Total Volume: " + tvFormatted + " L",
		Metadata: CalcMetadata{
			"finalConcentration": finalConcentration,
			"totalVolume":        totalVolume,
			"totalMoles":         totalMoles,
		},
	}, nil
}

func requiredFloat(inputs map[string]string, key string) (float64, error) {
	raw, ok := inputs[key]
	if !ok {
		return 0, missingInput{key: key}
	}
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return 0, missingInput{key: key}
	}
	value, err := strconv.ParseFloat(trimmed, 64)
	if err != nil {
		return 0, missingInput{key: key}
	}
	if math.IsNaN(value) || math.IsInf(value, 0) {
		return 0, missingInput{key: key}
	}
	return value, nil
}

type missingInput struct {
	key string
}

func (m missingInput) Error() string {
	return "missing required input: " + m.key
}

// absentKeys returns the names of the keys whose parse errors are non-nil,
// preserving order. An empty slice means every input was supplied.
func absentKeys(errs []error, names ...string) []string {
	var absent []string
	for i, err := range errs {
		if err != nil {
			absent = append(absent, names[i])
		}
	}
	return absent
}

// missingInputsError renders the combined message the web engine emits when
// several inputs are absent, so both engines error identically.
func missingInputsError(absent []string) error {
	return errors.New("Missing or invalid inputs for " + strings.Join(absent, ", "))
}
