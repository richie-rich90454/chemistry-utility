package calculators

import (
	"errors"
	"math"
	"strings"
)

func molality(inputs map[string]string) (CalcResult, error) {
	solveFor := inputs["molality-solve-for"]
	if solveFor == "" {
		solveFor = "molality"
	}
	soluteMass := optionalFloat(inputs, "molality-solute-mass")
	solventMass := optionalFloat(inputs, "molality-solvent-mass")
	molarMass := optionalFloat(inputs, "molality-molar-mass")
	molalityValue := optionalFloat(inputs, "molality-value")
	var result float64
	var formula string
	var unit string
	var extra string
	switch solveFor {
	case "molality":
		if anyNaN(soluteMass, solventMass, molarMass) {
			return CalcResult{}, errors.New("Missing or invalid inputs for molality-solute-mass, molality-solvent-mass, molality-molar-mass")
		}
		if molarMass <= 0 {
			return CalcResult{}, errors.New("Molar mass must be positive")
		}
		if solventMass <= 0 {
			return CalcResult{}, errors.New("Solvent mass must be positive")
		}
		if soluteMass < 0 {
			return CalcResult{}, errors.New("Solute mass cannot be negative")
		}
		moles := soluteMass / molarMass
		result = moles / (solventMass / 1000)
		formula = "m = (moles of solute)/(kg of solvent)"
		unit = "mol/kg"
		extra = "Moles of solute: " + formatFixed(moles, 4) + " mol; kg of solvent: " + formatFixed(solventMass/1000, 4) + " kg"
	case "solute-mass":
		if anyNaN(solventMass, molarMass, molalityValue) {
			return CalcResult{}, errors.New("Missing or invalid inputs for molality-solvent-mass, molality-molar-mass, molality-value")
		}
		if molarMass <= 0 {
			return CalcResult{}, errors.New("Molar mass must be positive")
		}
		if solventMass <= 0 {
			return CalcResult{}, errors.New("Solvent mass must be positive")
		}
		if molalityValue < 0 {
			return CalcResult{}, errors.New("Molality cannot be negative")
		}
		result = molalityValue * (solventMass / 1000) * molarMass
		formula = "solute mass = m * (kg of solvent) * molar mass"
		unit = "g"
		extra = "Moles of solute needed: " + formatFixed(molalityValue*(solventMass/1000), 4) + " mol"
	case "solvent-mass":
		if anyNaN(soluteMass, molarMass, molalityValue) {
			return CalcResult{}, errors.New("Missing or invalid inputs for molality-solute-mass, molality-molar-mass, molality-value")
		}
		if molarMass <= 0 {
			return CalcResult{}, errors.New("Molar mass must be positive")
		}
		if molalityValue <= 0 {
			return CalcResult{}, errors.New("Molality must be positive")
		}
		moles := soluteMass / molarMass
		result = (moles / molalityValue) * 1000
		formula = "solvent mass (g) = (moles of solute / m) * 1000"
		unit = "g"
		extra = "Moles of solute: " + formatFixed(moles, 4) + " mol"
	case "molar-mass":
		if anyNaN(soluteMass, solventMass, molalityValue) {
			return CalcResult{}, errors.New("Missing or invalid inputs for molality-solute-mass, molality-solvent-mass, molality-value")
		}
		if solventMass <= 0 {
			return CalcResult{}, errors.New("Solvent mass must be positive")
		}
		if molalityValue <= 0 {
			return CalcResult{}, errors.New("Molality must be positive")
		}
		result = soluteMass / (molalityValue * (solventMass / 1000))
		formula = "molar mass = (solute mass)/(m * kg of solvent)"
		unit = "g/mol"
		extra = "Moles of solute: " + formatFixed(molalityValue*(solventMass/1000), 4) + " mol"
	default:
		return CalcResult{}, errors.New("Invalid solve-for selection")
	}
	return CalcResult{
		Value:       formatFixed(result, 4) + " " + unit,
		Explanation: formula + " = " + formatFixed(result, 4) + " " + unit + "; " + extra,
		Metadata: CalcMetadata{
			"solveFor": solveFor,
			"formula":  formula,
			"result":   result,
			"unit":     unit,
		},
	}, nil
}

func beerLambert(inputs map[string]string) (CalcResult, error) {
	solveFor := inputs["bl-solve-for"]
	if solveFor == "" {
		solveFor = "absorbance"
	}
	absorbance := optionalFloat(inputs, "bl-absorbance")
	absorptivity := optionalFloat(inputs, "bl-absorptivity")
	pathLength := optionalFloat(inputs, "bl-path-length")
	concentration := optionalFloat(inputs, "bl-concentration")
	var result float64
	var formula string
	var unit string
	var label string
	switch solveFor {
	case "absorbance":
		if anyNaN(absorptivity, pathLength, concentration) {
			return CalcResult{}, errors.New("Missing or invalid inputs for bl-absorptivity, bl-path-length, bl-concentration")
		}
		if absorptivity < 0 {
			return CalcResult{}, errors.New("Absorptivity cannot be negative")
		}
		if pathLength < 0 {
			return CalcResult{}, errors.New("Path length cannot be negative")
		}
		if concentration < 0 {
			return CalcResult{}, errors.New("Concentration cannot be negative")
		}
		result = absorptivity * pathLength * concentration
		formula = "A = epsilon*b*c"
		unit = ""
		label = "Absorbance"
	case "absorptivity":
		if anyNaN(absorbance, pathLength, concentration) {
			return CalcResult{}, errors.New("Missing or invalid inputs for bl-absorbance, bl-path-length, bl-concentration")
		}
		if absorbance < 0 {
			return CalcResult{}, errors.New("Absorbance cannot be negative")
		}
		if pathLength <= 0 {
			return CalcResult{}, errors.New("Path length must be positive")
		}
		if concentration <= 0 {
			return CalcResult{}, errors.New("Concentration must be positive")
		}
		result = absorbance / (pathLength * concentration)
		formula = "epsilon = A/(b*c)"
		unit = "L/(mol*cm)"
		label = "Absorptivity"
	case "path-length":
		if anyNaN(absorbance, absorptivity, concentration) {
			return CalcResult{}, errors.New("Missing or invalid inputs for bl-absorbance, bl-absorptivity, bl-concentration")
		}
		if absorbance < 0 {
			return CalcResult{}, errors.New("Absorbance cannot be negative")
		}
		if absorptivity <= 0 {
			return CalcResult{}, errors.New("Absorptivity must be positive")
		}
		if concentration <= 0 {
			return CalcResult{}, errors.New("Concentration must be positive")
		}
		result = absorbance / (absorptivity * concentration)
		formula = "b = A/(epsilon*c)"
		unit = "cm"
		label = "Path length"
	case "concentration":
		if anyNaN(absorbance, absorptivity, pathLength) {
			return CalcResult{}, errors.New("Missing or invalid inputs for bl-absorbance, bl-absorptivity, bl-path-length")
		}
		if absorbance < 0 {
			return CalcResult{}, errors.New("Absorbance cannot be negative")
		}
		if absorptivity <= 0 {
			return CalcResult{}, errors.New("Absorptivity must be positive")
		}
		if pathLength <= 0 {
			return CalcResult{}, errors.New("Path length must be positive")
		}
		result = absorbance / (absorptivity * pathLength)
		formula = "c = A/(epsilon*b)"
		unit = "mol/L"
		label = "Concentration"
	case "transmittance":
		if math.IsNaN(absorbance) {
			return CalcResult{}, errors.New("Missing or invalid input for bl-absorbance")
		}
		if absorbance < 0 {
			return CalcResult{}, errors.New("Absorbance cannot be negative")
		}
		result = 100 * math.Pow(10, -absorbance)
		formula = "%T = 100*10^(-A)"
		unit = "%"
		label = "Transmittance"
	default:
		return CalcResult{}, errors.New("Invalid solve-for selection")
	}
	resultText := formatFixed(result, 4)
	valueText := label + ": " + resultText
	if unit != "" {
		valueText += " " + unit
	}
	explanation := formula + " = " + resultText
	if unit != "" {
		explanation += " " + unit
	}
	if solveFor == "absorbance" {
		explanation += "; Transmittance %T = 100*10^(-A) = " + formatFixed(100*math.Pow(10, -result), 4) + " %"
	}
	if solveFor == "transmittance" {
		explanation = "A = " + formatFixed(absorbance, 4) + "; " + explanation
	}
	return CalcResult{
		Value:       valueText,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"solveFor": solveFor,
			"formula":  formula,
			"result":   result,
			"unit":     unit,
		},
	}, nil
}

const maxDilutionSteps = 10

func formatConcentration(value float64) string {
	if value != 0 && math.Abs(value) < 1e-4 {
		return jsExponential(value)
	}
	return formatFixed(value, 4)
}

func serialDilution(inputs map[string]string) (CalcResult, error) {
	initial := optionalFloat(inputs, "sd-initial-concentration")
	if math.IsNaN(initial) {
		return CalcResult{}, errors.New("Missing or invalid input for sd-initial-concentration")
	}
	if initial < 0 {
		return CalcResult{}, errors.New("Initial concentration cannot be negative")
	}
	factor := optionalFloat(inputs, "sd-dilution-factor")
	if math.IsNaN(factor) {
		return CalcResult{}, errors.New("Missing or invalid input for sd-dilution-factor")
	}
	if factor <= 1 {
		return CalcResult{}, errors.New("Dilution factor must be greater than 1")
	}
	steps := optionalFloat(inputs, "sd-steps")
	if math.IsNaN(steps) || steps != math.Floor(steps) || steps < 1 || steps > maxDilutionSteps {
		return CalcResult{}, errors.New("Dilution steps must be a whole number between 1 and " + jsNumber(float64(maxDilutionSteps)))
	}
	concentrations := []float64{initial}
	current := initial
	for i := 0.0; i < steps; i++ {
		current = current / factor
		concentrations = append(concentrations, current)
	}
	totalDilution := math.Pow(factor, steps)
	series := ""
	for i := range concentrations {
		if i > 0 {
			series += "; "
		}
		series += "C" + jsNumber(float64(i)) + " = " + formatConcentration(concentrations[i]) + " M"
	}
	dilutionText := jsNumber(totalDilution)
	if totalDilution != math.Trunc(totalDilution) {
		dilutionText = formatFixed(totalDilution, 4)
	}
	factorText := jsNumber(factor)
	if factor != math.Trunc(factor) {
		factorText = formatFixed(factor, 4)
	}
	explanation := series + "; " +
		"Total dilution factor: " + dilutionText + "; " +
		"Each step dilutes the sample " + factorText + "-fold"
	return CalcResult{
		Value:       "Final concentration: " + formatConcentration(concentrations[int(steps)]) + " M (total dilution " + dilutionText + "x)",
		Explanation: explanation,
		Metadata: CalcMetadata{
			"initialConcentration": initial,
			"dilutionFactor":       factor,
			"steps":                steps,
			"finalConcentration":   concentrations[int(steps)],
			"totalDilutionFactor":  totalDilution,
			"concentrations":       concentrations,
		},
	}, nil
}

func leChatelier(inputs map[string]string) (CalcResult, error) {
	reactionType := strings.TrimSpace(inputs["lc-reaction-type"])
	if reactionType != "exothermic" && reactionType != "endothermic" {
		return CalcResult{}, errors.New("Reaction type must be exothermic or endothermic")
	}
	stressType := strings.TrimSpace(inputs["lc-stress-type"])
	if stressType != "concentration" && stressType != "temperature" && stressType != "pressure" && stressType != "volume" && stressType != "catalyst" {
		return CalcResult{}, errors.New("Stress type must be concentration, temperature, pressure, volume, or catalyst")
	}
	change := strings.TrimSpace(inputs["lc-change"])
	if change != "increase" && change != "decrease" && change != "none" {
		return CalcResult{}, errors.New("Change must be increase, decrease, or none")
	}
	side := strings.TrimSpace(inputs["lc-side"])
	if side != "reactants" && side != "products" && side != "equal" {
		return CalcResult{}, errors.New("Side must be reactants, products, or equal")
	}
	exothermic := reactionType == "exothermic"
	shift := "no change"
	kEffect := "unchanged"
	var reasoning string
	if stressType == "catalyst" {
		reasoning = "A catalyst lowers the activation energy of the forward and reverse reactions equally, so it changes how fast equilibrium is reached but neither the position of equilibrium nor K"
	} else if change == "none" {
		reasoning = "No change was applied, so the equilibrium stays where it is"
	} else if stressType == "concentration" {
		if side != "reactants" && side != "products" {
			return CalcResult{}, errors.New("Side must be reactants or products for a concentration change")
		}
		if (change == "increase" && side == "reactants") || (change == "decrease" && side == "products") {
			shift = "right"
			if change == "increase" {
				reasoning = "Adding reactant makes Q smaller than K, so the forward reaction runs faster until Q = K again"
			} else {
				reasoning = "Removing product makes Q smaller than K, so the forward reaction runs faster until Q = K again"
			}
		} else {
			shift = "left"
			if change == "increase" {
				reasoning = "Adding product makes Q larger than K, so the reverse reaction runs faster until Q = K again"
			} else {
				reasoning = "Removing reactant makes Q larger than K, so the reverse reaction runs faster until Q = K again"
			}
		}
		reasoning += "; K is unchanged because the equilibrium constant depends only on temperature"
	} else if stressType == "temperature" {
		forwardEndothermic := !exothermic
		favorsEndothermic := change == "increase"
		if favorsEndothermic == forwardEndothermic {
			shift = "right"
		} else {
			shift = "left"
		}
		if (change == "increase") == forwardEndothermic {
			kEffect = "increases"
		} else {
			kEffect = "decreases"
		}
		if exothermic {
			if change == "increase" {
				reasoning = "Heat is a product of an exothermic forward reaction, so adding heat shifts the equilibrium left, toward reactants (the endothermic direction)"
			} else {
				reasoning = "Heat is a product of an exothermic forward reaction, so removing heat shifts the equilibrium right, toward products (the exothermic direction)"
			}
		} else {
			if change == "increase" {
				reasoning = "Heat is a reactant of an endothermic forward reaction, so adding heat shifts the equilibrium right, toward products (the endothermic direction)"
			} else {
				reasoning = "Heat is a reactant of an endothermic forward reaction, so removing heat shifts the equilibrium left, toward reactants (the exothermic direction)"
			}
		}
		reasoning += "; K " + kEffect + " with temperature"
	} else {
		if side == "equal" {
			reasoning = "Both sides hold the same number of moles of gas, so a pressure or volume change does not shift the equilibrium; K is unchanged"
		} else {
			pressureRises := false
			if stressType == "pressure" {
				pressureRises = change == "increase"
			} else {
				pressureRises = change == "decrease"
			}
			var target string
			if pressureRises {
				target = side
			} else if side == "reactants" {
				target = "products"
			} else {
				target = "reactants"
			}
			if target == "products" {
				shift = "right"
			} else {
				shift = "left"
			}
			if stressType == "pressure" {
				if change == "increase" {
					reasoning = "Compressing the gas raises the pressure, so the equilibrium shifts toward the side with fewer moles of gas (" + side + ") to oppose the change"
				} else {
					reasoning = "Expanding the gas lowers the pressure, so the equilibrium shifts toward the side with more moles of gas, away from " + side
				}
			} else {
				if change == "decrease" {
					reasoning = "Shrinking the volume raises the pressure, so the equilibrium shifts toward the side with fewer moles of gas (" + side + ") to oppose the change"
				} else {
					reasoning = "Growing the volume lowers the pressure, so the equilibrium shifts toward the side with more moles of gas, away from " + side
				}
			}
			reasoning += "; K is unchanged because the equilibrium constant depends only on temperature"
		}
	}
	value := "Shift: " + shift + "; K " + kEffect
	explanation := "Reaction: " + reactionType + "; " + reasoning + "; " + value + "."
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"reactionType":              reactionType,
			"stressType":                stressType,
			"change":                    change,
			"side":                      side,
			"shift":                     shift,
			"equilibriumConstantEffect": kEffect,
			"reasoning":                 reasoning,
		},
	}, nil
}
