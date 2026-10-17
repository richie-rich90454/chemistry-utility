package calculators

import (
	"errors"
	"math"
	"strings"
)

const defaultTemperature = 298.15

func calorimetry(inputs map[string]string) (CalcResult, error) {
	solveFor := inputs["calor-solve-for"]
	if solveFor == "" {
		solveFor = "q"
	}
	mass := optionalFloat(inputs, "calor-mass")
	specificHeat := optionalFloat(inputs, "calor-specific-heat")
	deltaT := optionalFloat(inputs, "calor-delta-t")
	heat := optionalFloat(inputs, "calor-heat")
	var result float64
	var formula string
	var unit string
	switch solveFor {
	case "q":
		if anyNaN(mass, specificHeat, deltaT) {
			return CalcResult{}, errors.New("Missing or invalid inputs for calor-mass, calor-specific-heat, calor-delta-t")
		}
		if mass <= 0 {
			return CalcResult{}, errors.New("Mass must be positive")
		}
		if specificHeat <= 0 {
			return CalcResult{}, errors.New("Specific heat must be positive")
		}
		result = mass * specificHeat * deltaT
		formula = "q = m*c*dT"
		unit = "J"
	case "m":
		if anyNaN(specificHeat, deltaT, heat) {
			return CalcResult{}, errors.New("Missing or invalid inputs for calor-specific-heat, calor-delta-t, calor-heat")
		}
		if specificHeat <= 0 {
			return CalcResult{}, errors.New("Specific heat must be positive")
		}
		if deltaT == 0 {
			return CalcResult{}, errors.New("Temperature change cannot be zero")
		}
		result = heat / (specificHeat * deltaT)
		formula = "m = q/(c*dT)"
		unit = "g"
		if result <= 0 {
			return CalcResult{}, errors.New("Solved mass is not positive; check the heat and temperature inputs")
		}
	case "c":
		if anyNaN(mass, deltaT, heat) {
			return CalcResult{}, errors.New("Missing or invalid inputs for calor-mass, calor-delta-t, calor-heat")
		}
		if mass <= 0 {
			return CalcResult{}, errors.New("Mass must be positive")
		}
		if deltaT == 0 {
			return CalcResult{}, errors.New("Temperature change cannot be zero")
		}
		result = heat / (mass * deltaT)
		formula = "c = q/(m*dT)"
		unit = "J/(g*C)"
		if result <= 0 {
			return CalcResult{}, errors.New("Solved specific heat is not positive; check the heat and temperature inputs")
		}
	case "deltaT":
		if anyNaN(mass, specificHeat, heat) {
			return CalcResult{}, errors.New("Missing or invalid inputs for calor-mass, calor-specific-heat, calor-heat")
		}
		if mass <= 0 {
			return CalcResult{}, errors.New("Mass must be positive")
		}
		if specificHeat <= 0 {
			return CalcResult{}, errors.New("Specific heat must be positive")
		}
		result = heat / (mass * specificHeat)
		formula = "dT = q/(m*c)"
		unit = "C"
	default:
		return CalcResult{}, errors.New("Invalid solve-for selection")
	}
	formatted := formatFixed(result, 4)
	explanation := formula + " = " + formatted + " " + unit
	if solveFor == "q" {
		if result > 0 {
			explanation += "; q is positive, so the surroundings absorbed heat and the reaction is endothermic"
		} else if result < 0 {
			explanation += "; q is negative, so the reaction released heat and is exothermic"
		} else {
			explanation += "; q is zero, so no net heat was exchanged"
		}
	}
	return CalcResult{
		Value:       formatted + " " + unit,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"solveFor": solveFor,
			"formula":  formula,
			"result":   result,
			"unit":     unit,
		},
	}, nil
}

func gibbsEquilibrium(inputs map[string]string) (CalcResult, error) {
	solveFor := inputs["geq-solve-for"]
	if solveFor == "" {
		solveFor = "K"
	}
	deltaG := optionalFloat(inputs, "geq-delta-g")
	equilibriumConstant := optionalFloat(inputs, "geq-k")
	temperature := optionalFloat(inputs, "geq-temperature")
	if strings.TrimSpace(inputs["geq-temperature"]) == "" {
		temperature = defaultTemperature
	}
	var result float64
	var formula string
	var value string
	var explanation string
	switch solveFor {
	case "K":
		if math.IsNaN(deltaG) {
			return CalcResult{}, errors.New("Missing or invalid input for geq-delta-g")
		}
		if math.IsNaN(temperature) || temperature <= 0 {
			return CalcResult{}, errors.New("Temperature must be positive (Kelvin)")
		}
		result = math.Exp((-deltaG * 1000) / (gasConstant * temperature))
		formula = "K = e^(-Delta G/(R*T))"
		value = "K = " + jsExponential(result)
		explanation = "Delta G = " + formatFixed(deltaG, 4) + " kJ/mol at T = " + formatFixed(temperature, 4) + " K; " +
			formula + " = " + jsExponential(result) + "; " +
			"The equilibrium favors " + favoredSide(result)
	case "delta-g":
		if math.IsNaN(equilibriumConstant) {
			return CalcResult{}, errors.New("Missing or invalid input for geq-k")
		}
		if equilibriumConstant <= 0 {
			return CalcResult{}, errors.New("Equilibrium constant must be positive")
		}
		if math.IsNaN(temperature) || temperature <= 0 {
			return CalcResult{}, errors.New("Temperature must be positive (Kelvin)")
		}
		result = (-gasConstant * temperature * math.Log(equilibriumConstant)) / 1000
		formula = "Delta G = -R*T*ln(K)"
		value = "Delta G = " + formatFixed(result, 4) + " kJ/mol"
		spontaneity := "at equilibrium under standard conditions"
		if result < 0 {
			spontaneity = "spontaneous under standard conditions"
		} else if result > 0 {
			spontaneity = "non-spontaneous under standard conditions"
		}
		explanation = "K = " + jsExponential(equilibriumConstant) + " at T = " + formatFixed(temperature, 4) + " K; " +
			formula + " = " + formatFixed(result, 4) + " kJ/mol; " +
			"The reaction is " + spontaneity
	default:
		return CalcResult{}, errors.New("Invalid solve-for selection")
	}
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"solveFor":    solveFor,
			"formula":     formula,
			"result":      result,
			"temperature": temperature,
		},
	}, nil
}

func favoredSide(equilibriumConstant float64) string {
	if equilibriumConstant > 1 {
		return "products (K > 1)"
	}
	if equilibriumConstant < 1 {
		return "reactants (K < 1)"
	}
	return "neither side (K = 1)"
}
