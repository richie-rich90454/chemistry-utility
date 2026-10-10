package calculators

import (
	"errors"
	"math"
)

// Port of frontend/src/modules/calculators/electrochemistry.ts. Input keys,
// validation order, error messages, and output strings are kept identical so
// the conformance vectors pass unchanged.

func cellPotential(inputs map[string]string) (CalcResult, error) {
	e1, err := requiredFloat(inputs, "E1")
	if err != nil {
		return CalcResult{}, errors.New("Please enter valid numbers for both potentials.")
	}
	e2, err := requiredFloat(inputs, "E2")
	if err != nil {
		return CalcResult{}, errors.New("Please enter valid numbers for both potentials.")
	}
	eCathode := math.Max(e1, e2)
	eAnode := math.Min(e1, e2)
	eCell := eCathode - eAnode
	value := "E_cell = " + formatFixed(eCell, 3) + " V"
	explanation := "Cathode E = " + formatFixed(eCathode, 3) + " V; Anode E = " + formatFixed(eAnode, 3) +
		" V; E_cell = E_cathode - E_anode = " + formatFixed(eCell, 3) + " V"
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"E_cell": eCell, "E_cathode": eCathode, "E_anode": eAnode, "E1": e1, "E2": e2,
		},
	}, nil
}

func nernst(inputs map[string]string) (CalcResult, error) {
	keys := []string{"E-standard", "temperature", "n-electrons", "Q-reaction"}
	values := make([]float64, len(keys))
	for i, key := range keys {
		v, err := requiredFloat(inputs, key)
		if err != nil {
			return CalcResult{}, errors.New("Please enter valid positive numbers for all fields.")
		}
		values[i] = v
	}
	eStandard, temperature, nElectrons, q := values[0], values[1], values[2], values[3]
	if temperature <= 0 || nElectrons <= 0 || q <= 0 {
		return CalcResult{}, errors.New("Please enter valid positive numbers for all fields.")
	}
	if nElectrons != math.Trunc(nElectrons) {
		return CalcResult{}, errors.New("Number of electrons must be an integer")
	}
	gasConstant := 8.314
	faradayConstant := 96485.0
	e := eStandard - ((gasConstant*temperature)/(nElectrons*faradayConstant))*math.Log(q)
	value := "E = " + formatFixed(e, 3) + " V"
	explanation := "E = E_standard - (R*T/(n*F))*ln(Q) = " + formatFixed(eStandard, 3) + " - (" +
		formatFixed(gasConstant*temperature, 4) + "/(" + formatFixed(nElectrons, 3) + " * " +
		jsNumber(faradayConstant) + "))*ln(" + jsNumber(q) + ") = " + formatFixed(e, 3) + " V"
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"E": e, "E_standard": eStandard, "temperature": temperature,
			"n_electrons": nElectrons, "Q": q, "gasConstant": gasConstant, "faradayConstant": faradayConstant,
		},
	}, nil
}

func electrolysis(inputs map[string]string) (CalcResult, error) {
	solveFor, ok := inputs["electrolysis-solve-for"]
	if !ok {
		solveFor = ""
	}
	faradayConstant := 96485.0

	switch solveFor {
	case "mass":
		current, errI := requiredFloat(inputs, "electrolysis-I")
		time, errT := requiredFloat(inputs, "electrolysis-t")
		z, errZ := requiredFloat(inputs, "electrolysis-z")
		molarMass, errM := requiredFloat(inputs, "electrolysis-M")
		if errI != nil || errT != nil || errZ != nil || errM != nil ||
			current <= 0 || time <= 0 || z <= 0 || molarMass <= 0 {
			return CalcResult{}, errors.New("Please enter valid positive numbers for I, t, z, and M.")
		}
		if z != math.Trunc(z) {
			return CalcResult{}, errors.New("Charge number z must be an integer")
		}
		n := (current * time) / (faradayConstant * z)
		mass := n * molarMass
		value := "Mass deposited m = " + formatFixed(mass, 3) + " g"
		explanation := "n = (I*t)/(F*z) = " + formatFixed(n, 6) + " mol; m = n*M = " + formatFixed(mass, 3) + " g"
		return CalcResult{
			Value:       value,
			Explanation: explanation,
			Metadata: CalcMetadata{
				"mass": mass, "moles": n, "I": current, "t": time, "z": z, "M": molarMass, "solveFor": solveFor,
			},
		}, nil
	case "current":
		mass, errM := requiredFloat(inputs, "electrolysis-m")
		time, errT := requiredFloat(inputs, "electrolysis-t")
		z, errZ := requiredFloat(inputs, "electrolysis-z")
		molarMass, errMM := requiredFloat(inputs, "electrolysis-M")
		if errM != nil || errT != nil || errZ != nil || errMM != nil ||
			mass <= 0 || time <= 0 || z <= 0 || molarMass <= 0 {
			return CalcResult{}, errors.New("Please enter valid positive numbers for m, t, z, and M.")
		}
		if z != math.Trunc(z) {
			return CalcResult{}, errors.New("Charge number z must be an integer")
		}
		n := mass / molarMass
		current := (n * faradayConstant * z) / time
		value := "Current I = " + formatFixed(current, 3) + " A"
		explanation := "n = m/M = " + formatFixed(n, 6) + " mol; I = (n*F*z)/t = " + formatFixed(current, 3) + " A"
		return CalcResult{
			Value:       value,
			Explanation: explanation,
			Metadata: CalcMetadata{
				"current": current, "moles": n, "m": mass, "t": time, "z": z, "M": molarMass, "solveFor": solveFor,
			},
		}, nil
	case "time":
		mass, errM := requiredFloat(inputs, "electrolysis-m")
		current, errI := requiredFloat(inputs, "electrolysis-I")
		z, errZ := requiredFloat(inputs, "electrolysis-z")
		molarMass, errMM := requiredFloat(inputs, "electrolysis-M")
		if errM != nil || errI != nil || errZ != nil || errMM != nil ||
			mass <= 0 || current <= 0 || z <= 0 || molarMass <= 0 {
			return CalcResult{}, errors.New("Please enter valid positive numbers for m, I, z, and M.")
		}
		if z != math.Trunc(z) {
			return CalcResult{}, errors.New("Charge number z must be an integer")
		}
		n := mass / molarMass
		time := (n * faradayConstant * z) / current
		value := "Time t = " + formatFixed(time, 3) + " s"
		explanation := "n = m/M = " + formatFixed(n, 6) + " mol; t = (n*F*z)/I = " + formatFixed(time, 3) + " s"
		return CalcResult{
			Value:       value,
			Explanation: explanation,
			Metadata: CalcMetadata{
				"time": time, "moles": n, "m": mass, "I": current, "t": time, "z": z, "M": molarMass, "solveFor": solveFor,
			},
		}, nil
	default:
		return CalcResult{}, errors.New("Invalid solve-for selection")
	}
}
