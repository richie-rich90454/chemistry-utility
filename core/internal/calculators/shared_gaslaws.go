package calculators

import (
	"errors"
	"math"
	"strings"
)

// The calculators in this file are a direct port of
// frontend/src/modules/calculators/gasLaws.ts. Input keys, validation order,
// error messages, and output strings are kept identical so the conformance
// vectors pass unchanged.

const (
	rAtmL = 0.08206
	rSI   = 8.314
	vdwR  = 0.08206
)

func resolveVolumeUnit(raw string, units string) (string, error) {
	volUnit := raw
	if volUnit == "" {
		if units == "SI" {
			volUnit = "m³"
		} else {
			volUnit = "L"
		}
	}
	if volUnit != "L" && volUnit != "m³" {
		return "", errors.New("Volume unit must be \"L\" or \"m³\"")
	}
	return volUnit, nil
}

func toLitres(v float64, volUnit string) float64 {
	if volUnit == "m³" {
		return v * 1000
	}
	return v
}

func toCubicMetres(v float64, volUnit string) float64 {
	if volUnit == "L" {
		return v / 1000
	}
	return v
}

func idealGas(inputs map[string]string) (CalcResult, error) {
	solveFor := inputs["ideal-solve-for"]
	units := inputs["ideal-R-units"]
	r := rSI
	if units == "atm-L" {
		r = rAtmL
	}
	volUnit, err := resolveVolumeUnit(inputs["ideal-volume-unit"], units)
	if err != nil {
		return CalcResult{}, err
	}
	p, errP := requiredFloat(inputs, "ideal-P")
	v, errV := requiredFloat(inputs, "ideal-V")
	n, errN := requiredFloat(inputs, "ideal-n")
	temperature, errT := requiredFloat(inputs, "ideal-T")

	var result float64
	var formula string

	switch solveFor {
	case "P":
		if absent := absentKeys([]error{errV, errN, errT}, "ideal-V", "ideal-n", "ideal-T"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		vCalc := toCubicMetres(v, volUnit)
		if units == "atm-L" {
			vCalc = toLitres(v, volUnit)
		}
		if vCalc == 0 {
			return CalcResult{}, errors.New("Volume cannot be zero")
		}
		result = (n * r * temperature) / vCalc
		formula = "P=(nRT)/V"
	case "V":
		if absent := absentKeys([]error{errP, errN, errT}, "ideal-P", "ideal-n", "ideal-T"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if p == 0 {
			return CalcResult{}, errors.New("Pressure cannot be zero")
		}
		vCalc := (n * r * temperature) / p
		switch {
		case units == "atm-L" && volUnit == "m³":
			result = vCalc / 1000
		case units == "atm-L":
			result = vCalc
		case volUnit == "L":
			result = vCalc * 1000
		default:
			result = vCalc
		}
		formula = "V=(nRT)/P"
	case "n":
		if absent := absentKeys([]error{errP, errV, errT}, "ideal-P", "ideal-V", "ideal-T"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if temperature == 0 {
			return CalcResult{}, errors.New("Temperature cannot be zero")
		}
		vCalc := toCubicMetres(v, volUnit)
		if units == "atm-L" {
			vCalc = toLitres(v, volUnit)
		}
		result = (p * vCalc) / (r * temperature)
		formula = "n=(PV)/(RT)"
	case "T":
		if absent := absentKeys([]error{errP, errV, errN}, "ideal-P", "ideal-V", "ideal-n"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if n == 0 {
			return CalcResult{}, errors.New("Moles cannot be zero")
		}
		vCalc := toCubicMetres(v, volUnit)
		if units == "atm-L" {
			vCalc = toLitres(v, volUnit)
		}
		result = (p * vCalc) / (n * r)
		formula = "T=(PV)/(nR)"
	default:
		return CalcResult{}, errors.New("Invalid solveFor")
	}

	unit := "K"
	switch solveFor {
	case "P":
		unit = "atm"
		if units != "atm-L" {
			unit = "Pa"
		}
	case "V":
		unit = volUnit
	case "n":
		unit = "mol"
	}

	formatted := formatFixed(result, 4)
	return CalcResult{
		Value:       formatted + " " + unit,
		Explanation: formula + " = " + formatted + " " + unit,
		Metadata: CalcMetadata{
			"volumeUnit": volUnit,
			"units":      units,
		},
	}, nil
}

func combinedGas(inputs map[string]string) (CalcResult, error) {
	solveFor := inputs["combined-solve-for"]
	p1, errP1 := requiredFloat(inputs, "combined-P1")
	v1, errV1 := requiredFloat(inputs, "combined-V1")
	t1, errT1 := requiredFloat(inputs, "combined-T1")
	p2, errP2 := requiredFloat(inputs, "combined-P2")
	v2, errV2 := requiredFloat(inputs, "combined-V2")
	t2, errT2 := requiredFloat(inputs, "combined-T2")

	var result float64
	var formula string

	switch solveFor {
	case "P1":
		if absent := absentKeys([]error{errV1, errT1, errP2, errV2, errT2}, "combined-V1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if v1 == 0 || t2 == 0 {
			return CalcResult{}, errors.New("V1 and T2 cannot be zero")
		}
		result = (p2 * v2 * t1) / (v1 * t2)
		formula = "P<sub>1</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(V<sub>1</sub> T<sub>2</sub>)"
	case "V1":
		if absent := absentKeys([]error{errP1, errT1, errP2, errV2, errT2}, "combined-P1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if p1 == 0 || t2 == 0 {
			return CalcResult{}, errors.New("P1 and T2 cannot be zero")
		}
		result = (p2 * v2 * t1) / (p1 * t2)
		formula = "V<sub>1</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(P<sub>1</sub> T<sub>2</sub>)"
	case "T1":
		if absent := absentKeys([]error{errP1, errV1, errP2, errV2, errT2}, "combined-P1", "combined-V1", "combined-P2", "combined-V2", "combined-T2"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if p2 == 0 || v2 == 0 {
			return CalcResult{}, errors.New("P2 and V2 cannot be zero")
		}
		result = (p1 * v1 * t2) / (p2 * v2)
		formula = "T<sub>1</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(P<sub>2</sub> V<sub>2</sub>)"
	case "P2":
		if absent := absentKeys([]error{errP1, errV1, errT1, errV2, errT2}, "combined-P1", "combined-V1", "combined-T1", "combined-V2", "combined-T2"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if v2 == 0 || t1 == 0 {
			return CalcResult{}, errors.New("V2 and T1 cannot be zero")
		}
		result = (p1 * v1 * t2) / (v2 * t1)
		formula = "P<sub>2</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(V<sub>2</sub> T<sub>1</sub>)"
	case "V2":
		if absent := absentKeys([]error{errP1, errV1, errT1, errP2, errT2}, "combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-T2"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if p2 == 0 || t1 == 0 {
			return CalcResult{}, errors.New("P2 and T1 cannot be zero")
		}
		result = (p1 * v1 * t2) / (p2 * t1)
		formula = "V<sub>2</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(P<sub>2</sub> T<sub>1</sub>)"
	case "T2":
		if absent := absentKeys([]error{errP1, errV1, errT1, errP2, errV2}, "combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-V2"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if p1 == 0 || v1 == 0 {
			return CalcResult{}, errors.New("P1 and V1 cannot be zero")
		}
		result = (p2 * v2 * t1) / (p1 * v1)
		formula = "T<sub>2</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(P<sub>1</sub> V<sub>1</sub>)"
	default:
		return CalcResult{}, errors.New("Invalid solveFor")
	}

	unit := "K"
	if strings.Contains(solveFor, "P") {
		unit = "pressure units"
	} else if strings.Contains(solveFor, "V") {
		unit = "volume units"
	}

	formatted := formatFixed(result, 4)
	return CalcResult{
		Value:       formatted + " " + unit,
		Explanation: formula + " = " + formatted + " " + unit,
	}, nil
}

func vanDerWaals(inputs map[string]string) (CalcResult, error) {
	v, errV := requiredFloat(inputs, "vdw-V")
	n, errN := requiredFloat(inputs, "vdw-n")
	temperature, errT := requiredFloat(inputs, "vdw-T")
	a, errA := requiredFloat(inputs, "vdw-a")
	b, errB := requiredFloat(inputs, "vdw-b")
	if absent := absentKeys([]error{errV, errN, errT, errA, errB}, "vdw-V", "vdw-n", "vdw-T", "vdw-a", "vdw-b"); len(absent) > 0 {
		return CalcResult{}, missingInputsError(absent)
	}
	if v <= 0 {
		return CalcResult{}, errors.New("Volume must be positive")
	}
	if n <= 0 {
		return CalcResult{}, errors.New("Moles must be positive")
	}
	if temperature <= 0 {
		return CalcResult{}, errors.New("Temperature must be positive (Kelvin)")
	}
	if a < 0 || b < 0 {
		return CalcResult{}, errors.New("Van der Waals constants a and b cannot be negative")
	}
	if v-n*b <= 0 {
		return CalcResult{}, errors.New("Volume is too small for the given amount of gas (V must be greater than n*b)")
	}
	pressure := (n*vdwR*temperature)/(v-n*b) - a*math.Pow(n/v, 2)
	formatted := formatFixed(pressure, 4)
	return CalcResult{
		Value:       "P=" + formatted + " atm",
		Explanation: "P=(nRT)/(V-nb) - a(n/V)² = " + formatted + " atm (R = 0.08206 L·atm/(mol·K))",
	}, nil
}

func halfLife(inputs map[string]string) (CalcResult, error) {
	solveFor := inputs["half-life-solve-for"]
	n0, errN0 := requiredFloat(inputs, "initial-quantity")
	t, errT := requiredFloat(inputs, "time-input")
	tHalf, errHalf := requiredFloat(inputs, "half-life-input")
	nt, errNt := requiredFloat(inputs, "remaining-quantity")

	switch solveFor {
	case "remaining":
		if absent := absentKeys([]error{errN0, errT, errHalf}, "initial-quantity", "time-input", "half-life-input"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if tHalf <= 0 {
			return CalcResult{}, errors.New("Half-life must be positive")
		}
		if n0 <= 0 {
			return CalcResult{}, errors.New("Initial quantity must be positive")
		}
		if t < 0 {
			return CalcResult{}, errors.New("Time cannot be negative")
		}
		result := n0 * math.Pow(0.5, t/tHalf)
		formatted := formatFixed(result, 4)
		return CalcResult{
			Value:       "Remaining: " + formatted + " (after " + jsNumber(t) + " units)",
			Explanation: "Nt = N0 × (0.5)^(t/t_half) = " + formatted,
		}, nil
	case "time":
		if absent := absentKeys([]error{errN0, errHalf, errNt}, "initial-quantity", "half-life-input", "remaining-quantity"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if tHalf <= 0 {
			return CalcResult{}, errors.New("Half-life must be positive")
		}
		if n0 <= 0 {
			return CalcResult{}, errors.New("Initial quantity must be positive")
		}
		if nt <= 0 {
			return CalcResult{}, errors.New("Remaining quantity must be positive")
		}
		if nt >= n0 {
			return CalcResult{}, errors.New("Remaining quantity must be less than initial quantity (decay only decreases quantity)")
		}
		result := (math.Log(nt/n0) / math.Log(0.5)) * tHalf
		formatted := formatFixed(result, 4)
		return CalcResult{
			Value:       "Time needed: " + formatted + " units",
			Explanation: "t = (ln(Nt/N0) / ln(0.5)) × t_half = " + formatted + " units",
		}, nil
	case "half-life":
		if absent := absentKeys([]error{errN0, errT, errNt}, "initial-quantity", "time-input", "remaining-quantity"); len(absent) > 0 {
			return CalcResult{}, missingInputsError(absent)
		}
		if n0 <= 0 {
			return CalcResult{}, errors.New("Initial quantity must be positive")
		}
		if nt <= 0 {
			return CalcResult{}, errors.New("Remaining quantity must be positive")
		}
		if nt >= n0 {
			return CalcResult{}, errors.New("Remaining quantity must be less than initial quantity")
		}
		if t <= 0 {
			return CalcResult{}, errors.New("Time must be positive")
		}
		result := t / (math.Log(nt/n0) / math.Log(0.5))
		formatted := formatFixed(result, 4)
		return CalcResult{
			Value:       "Half-life: " + formatted + " units",
			Explanation: "t_half = t / (ln(Nt/N0) / ln(0.5)) = " + formatted + " units",
		}, nil
	default:
		return CalcResult{}, errors.New("Invalid solve-for selection")
	}
}
