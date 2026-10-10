package calculators

import (
	"errors"
	"math"
	"strconv"
	"strings"
)

// Port of frontend/src/modules/calculators/thermodynamics.ts. Input keys,
// validation order, error messages, and output strings are kept identical so
// the conformance vectors pass unchanged.

func gibbsFreeEnergy(inputs map[string]string) (CalcResult, error) {
	deltaH, err := requiredFloat(inputs, "gibbs-deltaH")
	if err != nil {
		return CalcResult{}, missingInputsError([]string{"gibbs-deltaH", "gibbs-deltaS", "gibbs-T"})
	}
	deltaS, err := requiredFloat(inputs, "gibbs-deltaS")
	if err != nil {
		return CalcResult{}, missingInputsError([]string{"gibbs-deltaH", "gibbs-deltaS", "gibbs-T"})
	}
	temperature, err := requiredFloat(inputs, "gibbs-T")
	if err != nil {
		return CalcResult{}, missingInputsError([]string{"gibbs-deltaH", "gibbs-deltaS", "gibbs-T"})
	}
	if temperature < 0 {
		return CalcResult{}, errors.New("Temperature cannot be negative")
	}
	deltaSkJ := deltaS / 1000
	deltaG := deltaH - temperature*deltaSkJ
	var spontaneity string
	switch {
	case deltaG < 0:
		spontaneity = "Spontaneous"
	case deltaG > 0:
		spontaneity = "Non-spontaneous"
	default:
		spontaneity = "Equilibrium"
	}
	value := "dG = " + formatFixed(deltaG, 4) + " kJ/mol; Process: " + spontaneity
	explanation := "dG = dH - T*dS = " + formatFixed(deltaH, 4) + " - " + formatFixed(temperature, 4) +
		" * " + formatFixed(deltaSkJ, 4) + " = " + formatFixed(deltaG, 4) + " kJ/mol; Process: " + spontaneity
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"deltaG":      deltaG,
			"deltaH":      deltaH,
			"deltaS":      deltaS,
			"deltaS_kJ":   deltaSkJ,
			"temperature": temperature,
			"spontaneity": spontaneity,
		},
	}, nil
}

func hessLaw(inputs map[string]string) (CalcResult, error) {
	raw, ok := inputs["hess-steps"]
	if !ok {
		raw = ""
	}
	rawValue := strings.TrimSpace(raw)
	if rawValue == "" {
		return CalcResult{}, errors.New("Please enter at least 2 enthalpy values separated by commas")
	}
	parts := strings.Split(rawValue, ",")
	if len(parts) < 2 {
		return CalcResult{}, errors.New("At least 2 enthalpy values are required")
	}
	if len(parts) > 10 {
		return CalcResult{}, errors.New("Maximum of 10 enthalpy values allowed")
	}
	steps := make([]float64, 0, len(parts))
	totalH := 0.0
	for i := range parts {
		parsed := parseNumber(parts[i])
		if math.IsNaN(parsed) {
			return CalcResult{}, errors.New("All values must be valid numbers")
		}
		totalH += parsed
		steps = append(steps, parsed)
	}
	value := "Total dH = " + formatFixed(totalH, 4) + " kJ/mol"
	explanation := "Sum of " + strconv.Itoa(len(parts)) + " enthalpy steps = " + formatFixed(totalH, 4) + " kJ/mol"
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"totalH":    totalH,
			"stepCount": len(parts),
			"steps":     steps,
		},
	}, nil
}

func entropy(inputs map[string]string) (CalcResult, error) {
	productsRaw, ok := inputs["entropy-products"]
	if !ok {
		productsRaw = ""
	}
	reactantsRaw, ok := inputs["entropy-reactants"]
	if !ok {
		reactantsRaw = ""
	}
	productsTrimmed := strings.TrimSpace(productsRaw)
	reactantsTrimmed := strings.TrimSpace(reactantsRaw)
	if productsTrimmed == "" || reactantsTrimmed == "" {
		return CalcResult{}, errors.New("Please enter entropy values for both products and reactants")
	}
	productParts := strings.Split(productsTrimmed, ",")
	reactantParts := strings.Split(reactantsTrimmed, ",")
	sumProducts := 0.0
	for i := range productParts {
		parsed := parseNumber(productParts[i])
		if math.IsNaN(parsed) {
			return CalcResult{}, errors.New("All product entropy values must be valid numbers")
		}
		sumProducts += parsed
	}
	sumReactants := 0.0
	for i := range reactantParts {
		parsed := parseNumber(reactantParts[i])
		if math.IsNaN(parsed) {
			return CalcResult{}, errors.New("All reactant entropy values must be valid numbers")
		}
		sumReactants += parsed
	}
	deltaS := sumProducts - sumReactants
	value := "dS = " + formatFixed(deltaS, 4) + " J/(mol*K)"
	explanation := "dS = S(products) - S(reactants) = " + formatFixed(sumProducts, 4) + " - " +
		formatFixed(sumReactants, 4) + " = " + formatFixed(deltaS, 4) + " J/(mol*K)"
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"deltaS":        deltaS,
			"sumProducts":   sumProducts,
			"sumReactants":  sumReactants,
			"productCount":  len(productParts),
			"reactantCount": len(reactantParts),
		},
	}, nil
}

func heatCapacity(inputs map[string]string) (CalcResult, error) {
	solveFor, ok := inputs["heat-cap-solve-for"]
	if !ok {
		solveFor = ""
	}
	// The web engine parses every numeric field up front, so a blank or
	// unparsable field reads as NaN and each branch reports its own key list.
	mass := optionalFloat(inputs, "heat-cap-mass")
	c := optionalFloat(inputs, "heat-cap-specific-heat")
	tInitial := optionalFloat(inputs, "heat-cap-initial-temp")
	tFinal := optionalFloat(inputs, "heat-cap-final-temp")
	q := optionalFloat(inputs, "heat-cap-heat")

	switch solveFor {
	case "q":
		if anyNaN(mass, c, tInitial, tFinal) {
			return CalcResult{}, missingInputsError([]string{
				"heat-cap-mass", "heat-cap-specific-heat", "heat-cap-initial-temp", "heat-cap-final-temp"})
		}
		if mass <= 0 {
			return CalcResult{}, errors.New("Mass must be positive")
		}
		if c <= 0 {
			return CalcResult{}, errors.New("Specific heat must be positive")
		}
		deltaT := tFinal - tInitial
		result := mass * c * deltaT
		value := "Heat: " + formatFixed(result, 4) + " J"
		explanation := "q = m*c*dT = " + formatFixed(mass, 4) + " * " + formatFixed(c, 4) + " * " +
			formatFixed(deltaT, 4) + " = " + formatFixed(result, 4) + " J"
		return CalcResult{
			Value:       value,
			Explanation: explanation,
			Metadata: CalcMetadata{
				"q": result, "mass": mass, "c": c, "deltaT": deltaT, "solveFor": solveFor,
			},
		}, nil
	case "c":
		if anyNaN(mass, tInitial, tFinal, q) {
			return CalcResult{}, missingInputsError([]string{
				"heat-cap-mass", "heat-cap-initial-temp", "heat-cap-final-temp", "heat-cap-heat"})
		}
		if mass <= 0 {
			return CalcResult{}, errors.New("Mass must be positive")
		}
		deltaT := tFinal - tInitial
		if deltaT == 0 {
			return CalcResult{}, errors.New("Temperature change cannot be zero")
		}
		result := q / (mass * deltaT)
		value := "Specific Heat: " + formatFixed(result, 4) + " J/(g*K)"
		explanation := "c = q/(m*dT) = " + formatFixed(q, 4) + " / (" + formatFixed(mass, 4) + " * " +
			formatFixed(deltaT, 4) + ") = " + formatFixed(result, 4) + " J/(g*K)"
		return CalcResult{
			Value:       value,
			Explanation: explanation,
			Metadata: CalcMetadata{
				"c": result, "mass": mass, "q": q, "deltaT": deltaT, "solveFor": solveFor,
			},
		}, nil
	case "deltaT":
		if anyNaN(mass, c, q) {
			return CalcResult{}, missingInputsError([]string{
				"heat-cap-mass", "heat-cap-specific-heat", "heat-cap-heat"})
		}
		if mass <= 0 {
			return CalcResult{}, errors.New("Mass must be positive")
		}
		if c <= 0 {
			return CalcResult{}, errors.New("Specific heat must be positive")
		}
		result := q / (mass * c)
		value := "Temperature Change: " + formatFixed(result, 4) + " K"
		explanation := "dT = q/(m*c) = " + formatFixed(q, 4) + " / (" + formatFixed(mass, 4) + " * " +
			formatFixed(c, 4) + ") = " + formatFixed(result, 4) + " K"
		return CalcResult{
			Value:       value,
			Explanation: explanation,
			Metadata: CalcMetadata{
				"deltaT": result, "mass": mass, "c": c, "q": q, "solveFor": solveFor,
			},
		}, nil
	case "Tfinal":
		if anyNaN(mass, c, tInitial, q) {
			return CalcResult{}, missingInputsError([]string{
				"heat-cap-mass", "heat-cap-specific-heat", "heat-cap-initial-temp", "heat-cap-heat"})
		}
		if mass <= 0 {
			return CalcResult{}, errors.New("Mass must be positive")
		}
		if c <= 0 {
			return CalcResult{}, errors.New("Specific heat must be positive")
		}
		deltaT := q / (mass * c)
		result := tInitial + deltaT
		value := "Final Temperature: " + formatFixed(result, 4) + " K"
		explanation := "T_final = T_initial + q/(m*c) = " + formatFixed(tInitial, 4) + " + " +
			formatFixed(deltaT, 4) + " = " + formatFixed(result, 4) + " K"
		return CalcResult{
			Value:       value,
			Explanation: explanation,
			Metadata: CalcMetadata{
				"Tfinal": result, "Tinitial": tInitial, "deltaT": deltaT,
				"mass": mass, "c": c, "q": q, "solveFor": solveFor,
			},
		}, nil
	default:
		return CalcResult{}, errors.New("Invalid solve-for selection")
	}
}

// bondEnergies mirrors the table in thermodynamics.ts. C≡C and N≡N use the
// triple-bond character the source uses.
var bondEnergies = map[string]float64{
	"C-H": 413,
	"C-C": 348,
	"C=C": 614,
	"C≡C": 839,
	"O-H": 463,
	"O=O": 495,
	"N≡N": 941,
	"C-O": 358,
	"C=O": 799,
	"H-H": 436,
}

// parseBondList sums "bondType:count" entries. A bare type counts once.
func parseBondList(raw, label string) (float64, error) {
	entries := strings.Split(raw, ",")
	total := 0.0
	for i := range entries {
		entry := strings.TrimSpace(entries[i])
		if entry == "" {
			continue
		}
		colonIndex := strings.Index(entry, ":")
		bondType := entry
		count := 1.0
		if colonIndex >= 0 {
			bondType = strings.TrimSpace(entry[:colonIndex])
			countStr := strings.TrimSpace(entry[colonIndex+1:])
			parsed := parseNumber(countStr)
			if math.IsNaN(parsed) {
				return 0, errors.New("Invalid count for bond " + bondType + " in " + label + " bonds")
			}
			if math.IsInf(parsed, 0) || parsed != math.Trunc(parsed) || parsed <= 0 {
				return 0, errors.New("Bond count must be a positive integer for bond " + bondType + " in " + label + " bonds")
			}
			count = parsed
		}
		energy, known := bondEnergies[bondType]
		if !known {
			return 0, errors.New("Unknown bond type: " + bondType + ". Supported: C-H, C-C, C=C, C≡C, O-H, O=O, N≡N, C-O, C=O, H-H")
		}
		total += energy * count
	}
	return total, nil
}

func bondEnthalpy(inputs map[string]string) (CalcResult, error) {
	brokenRaw, ok := inputs["bond-enthalpy-broken"]
	if !ok {
		brokenRaw = ""
	}
	formedRaw, ok := inputs["bond-enthalpy-formed"]
	if !ok {
		formedRaw = ""
	}
	brokenTrimmed := strings.TrimSpace(brokenRaw)
	formedTrimmed := strings.TrimSpace(formedRaw)
	if brokenTrimmed == "" || formedTrimmed == "" {
		return CalcResult{}, errors.New("Please enter bond information for both broken and formed bonds")
	}
	brokenEnergy, err := parseBondList(brokenTrimmed, "broken")
	if err != nil {
		return CalcResult{}, err
	}
	formedEnergy, err := parseBondList(formedTrimmed, "formed")
	if err != nil {
		return CalcResult{}, err
	}
	deltaH := brokenEnergy - formedEnergy
	var processType string
	switch {
	case deltaH < 0:
		processType = "Exothermic"
	case deltaH > 0:
		processType = "Endothermic"
	default:
		processType = "Thermoneutral"
	}
	value := "Estimated dH = " + formatFixed(deltaH, 4) + " kJ/mol; Process: " + processType
	explanation := "dH = bonds broken - bonds formed = " + formatFixed(brokenEnergy, 4) + " - " +
		formatFixed(formedEnergy, 4) + " = " + formatFixed(deltaH, 4) + " kJ/mol; Process: " + processType
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"deltaH":       deltaH,
			"brokenEnergy": brokenEnergy,
			"formedEnergy": formedEnergy,
			"processType":  processType,
		},
	}, nil
}

func bornHaber(inputs map[string]string) (CalcResult, error) {
	keys := []string{"born-haber-dHf", "born-haber-dHsub", "born-haber-IE", "born-haber-dHdiss", "born-haber-EA"}
	values := make([]float64, len(keys))
	for i, key := range keys {
		v, err := requiredFloat(inputs, key)
		if err != nil {
			return CalcResult{}, missingInputsError(keys)
		}
		values[i] = v
	}
	dHf, dHsub, ie, dHdiss, ea := values[0], values[1], values[2], values[3], values[4]
	u := dHf - dHsub - ie - (dHdiss / 2) - ea
	value := "Lattice Energy U = " + formatFixed(u, 4) + " kJ/mol"
	explanation := "U = dHf - dHsub - IE - dHdiss/2 - EA = " + formatFixed(dHf, 4) + " - " + formatFixed(dHsub, 4) +
		" - " + formatFixed(ie, 4) + " - " + formatFixed(dHdiss/2, 4) + " - " + formatFixed(ea, 4) +
		" = " + formatFixed(u, 4) + " kJ/mol (EA sign convention: energy released on electron attachment, negative when exothermic)"
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"U": u, "dHf": dHf, "dHsub": dHsub, "IE": ie, "dHdiss": dHdiss, "EA": ea,
		},
	}, nil
}
