package calculators

import (
	"context"
	"errors"
	"fmt"
	"math"
)

// Dilution solves C1*V1 = C2*V2 for any one variable.
// Input keys: "C1", "V1", "C2", "V2", "solveFor" (one of "C1","V1","C2","V2").
func Dilution(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solveFor, err := getString(input, "solveFor")
	if err != nil {
		return CalculationResult{}, err
	}

	var result float64
	var unit string
	var formula string

	switch solveFor {
	case "C1":
		V1, err := getFloat(input, "V1")
		if err != nil {
			return CalculationResult{}, err
		}
		C2, err := getFloat(input, "C2")
		if err != nil {
			return CalculationResult{}, err
		}
		V2, err := getFloat(input, "V2")
		if err != nil {
			return CalculationResult{}, err
		}
		if V1 == 0 {
			return CalculationResult{}, errors.New("V1 cannot be zero")
		}
		if V1 < 0 || C2 < 0 || V2 < 0 {
			return CalculationResult{}, errors.New("concentrations and volumes cannot be negative")
		}
		result = (C2 * V2) / V1
		formula = "C1 = (C2 * V2) / V1"
		unit = "M"
	case "V1":
		C1, err := getFloat(input, "C1")
		if err != nil {
			return CalculationResult{}, err
		}
		C2, err := getFloat(input, "C2")
		if err != nil {
			return CalculationResult{}, err
		}
		V2, err := getFloat(input, "V2")
		if err != nil {
			return CalculationResult{}, err
		}
		if C1 == 0 {
			return CalculationResult{}, errors.New("C1 cannot be zero")
		}
		if C1 < 0 || C2 < 0 || V2 < 0 {
			return CalculationResult{}, errors.New("concentrations and volumes cannot be negative")
		}
		result = (C2 * V2) / C1
		formula = "V1 = (C2 * V2) / C1"
		unit = "L"
	case "C2":
		C1, err := getFloat(input, "C1")
		if err != nil {
			return CalculationResult{}, err
		}
		V1, err := getFloat(input, "V1")
		if err != nil {
			return CalculationResult{}, err
		}
		V2, err := getFloat(input, "V2")
		if err != nil {
			return CalculationResult{}, err
		}
		if V2 == 0 {
			return CalculationResult{}, errors.New("V2 cannot be zero")
		}
		if C1 < 0 || V1 < 0 || V2 < 0 {
			return CalculationResult{}, errors.New("concentrations and volumes cannot be negative")
		}
		result = (C1 * V1) / V2
		formula = "C2 = (C1 * V1) / V2"
		unit = "M"
	case "V2":
		C1, err := getFloat(input, "C1")
		if err != nil {
			return CalculationResult{}, err
		}
		V1, err := getFloat(input, "V1")
		if err != nil {
			return CalculationResult{}, err
		}
		C2, err := getFloat(input, "C2")
		if err != nil {
			return CalculationResult{}, err
		}
		if C2 == 0 {
			return CalculationResult{}, errors.New("C2 cannot be zero")
		}
		if C1 < 0 || V1 < 0 || C2 < 0 {
			return CalculationResult{}, errors.New("concentrations and volumes cannot be negative")
		}
		result = (C1 * V1) / C2
		formula = "V2 = (C1 * V1) / C2"
		unit = "L"
	default:
		return CalculationResult{}, fmt.Errorf("invalid solveFor: %s", solveFor)
	}

	return CalculationResult{
		Value:    result,
		Unit:     unit,
		Steps:    []string{formula},
		Metadata: map[string]interface{}{"solveFor": solveFor},
	}, nil
}

// MassPercent calculates mass-based concentration (percent, ppm, or ppb).
// Input keys: "solute", "solution", "unit" (one of "percent", "ppm", "ppb").
func MassPercent(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solute, err := getFloat(input, "solute")
	if err != nil {
		return CalculationResult{}, err
	}
	solution, err := getFloat(input, "solution")
	if err != nil {
		return CalculationResult{}, err
	}
	if solution <= 0 {
		return CalculationResult{}, errors.New("solution mass must be positive")
	}
	if solute < 0 {
		return CalculationResult{}, errors.New("solute mass cannot be negative")
	}
	if solute > solution {
		return CalculationResult{}, errors.New("solute mass cannot exceed solution mass")
	}

	unitType := getStringWithDefault(input, "unit", "percent")
	ratio := solute / solution

	var result float64
	var unit string

	switch unitType {
	case "percent":
		result = ratio * 100
		unit = "%"
	case "ppm":
		result = ratio * 1e6
		unit = "ppm"
	case "ppb":
		result = ratio * 1e9
		unit = "ppb"
	default:
		return CalculationResult{}, fmt.Errorf("invalid unit: %s", unitType)
	}

	return CalculationResult{
		Value: result,
		Unit:  unit,
		Steps: []string{fmt.Sprintf("ratio = solute / solution = %.4f / %.4f = %.6f", solute, solution, ratio)},
	}, nil
}

// SolutionMixing calculates the final concentration when mixing two solutions.
// Input keys: "C1", "V1", "C2", "V2".
func SolutionMixing(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	C1, err := getFloat(input, "C1")
	if err != nil {
		return CalculationResult{}, err
	}
	V1, err := getFloat(input, "V1")
	if err != nil {
		return CalculationResult{}, err
	}
	C2, err := getFloat(input, "C2")
	if err != nil {
		return CalculationResult{}, err
	}
	V2, err := getFloat(input, "V2")
	if err != nil {
		return CalculationResult{}, err
	}
	if V1 <= 0 || V2 <= 0 {
		return CalculationResult{}, errors.New("volumes must be positive")
	}
	if C1 < 0 || C2 < 0 {
		return CalculationResult{}, errors.New("concentrations cannot be negative")
	}

	totalMoles := C1*V1 + C2*V2
	totalVolume := V1 + V2
	finalConcentration := totalMoles / totalVolume

	return CalculationResult{
		Value: finalConcentration,
		Unit:  "M",
		Breakdown: []BreakdownItem{
			{Label: "total moles", Value: totalMoles, Unit: "mol"},
			{Label: "total volume", Value: totalVolume, Unit: "L"},
			{Label: "final concentration", Value: finalConcentration, Unit: "M"},
		},
		Steps: []string{
			fmt.Sprintf("total moles = C1*V1 + C2*V2 = %.4f*%.4f + %.4f*%.4f = %.4f", C1, V1, C2, V2, totalMoles),
			fmt.Sprintf("total volume = V1 + V2 = %.4f + %.4f = %.4f", V1, V2, totalVolume),
			fmt.Sprintf("final concentration = %.4f / %.4f = %.4f M", totalMoles, totalVolume, finalConcentration),
		},
	}, nil
}

// BufferSolution uses the Henderson-Hasselbalch equation:
// pH = pKa + log([A-]/[HA])
// Input keys: "pKa", "HA" (acid concentration), "A" (conjugate base concentration).
func BufferSolution(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	pKa, err := getFloat(input, "pKa")
	if err != nil {
		return CalculationResult{}, err
	}
	HA, err := getFloat(input, "HA")
	if err != nil {
		return CalculationResult{}, err
	}
	A, err := getFloat(input, "A")
	if err != nil {
		return CalculationResult{}, err
	}
	if HA <= 0 || A <= 0 {
		return CalculationResult{}, errors.New("concentrations must be positive")
	}

	pH := pKa + math.Log10(A/HA)

	return CalculationResult{
		Value: pH,
		Unit:  "",
		Steps: []string{
			"pH = pKa + log([A⁻]/[HA])",
			fmt.Sprintf("pH = %.4f + log(%.4f/%.4f) = %.4f", pKa, A, HA, pH),
		},
		Metadata: map[string]interface{}{"pKa": pKa, "HA": HA, "A": A},
	}, nil
}

// PKaPKb performs pKa/pKb conversions: pKa + pKb = pKw.
// Input keys: "pKa" or "pKb", "pKw" (optional, defaults to 14).
// "solveFor": "pKa" or "pKb".
func PKaPKb(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solveFor := getStringWithDefault(input, "solveFor", "pKb")
	pKw := getFloatWithDefault(input, "pKw", 14.0)

	var result float64
	var unit string

	switch solveFor {
	case "pKb":
		pKa, err := getFloat(input, "pKa")
		if err != nil {
			return CalculationResult{}, err
		}
		result = pKw - pKa
		unit = ""
	case "pKa":
		pKb, err := getFloat(input, "pKb")
		if err != nil {
			return CalculationResult{}, err
		}
		result = pKw - pKb
		unit = ""
	default:
		return CalculationResult{}, fmt.Errorf("invalid solveFor: %s", solveFor)
	}

	return CalculationResult{
		Value: result,
		Unit:  unit,
		Steps: []string{fmt.Sprintf("pKa + pKb = pKw = %.1f", pKw)},
	}, nil
}

// Ksp calculates solubility product.
// Input keys: "Ksp" (to find molar solubility) or "molarSolubility",
// "mode" ("ksp-to-solubility" or "solubility-to-ksp"),
// "cationCount" and "anionCount" (stoichiometry, default 1 and 1).
// For salt A_aB_b: Ksp = (a·s)^a · (b·s)^b, so s = (Ksp / (a^a·b^b))^(1/(a+b)).
func Ksp(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	mode := getStringWithDefault(input, "mode", "ksp-to-solubility")
	a := getFloatWithDefault(input, "cationCount", 1.0)
	b := getFloatWithDefault(input, "anionCount", 1.0)
	if a <= 0 || b <= 0 {
		return CalculationResult{}, errors.New("stoichiometric coefficients must be positive")
	}
	if a != math.Trunc(a) || b != math.Trunc(b) {
		return CalculationResult{}, errors.New("stoichiometric coefficients must be integers")
	}
	ionCount := a + b

	switch mode {
	case "ksp-to-solubility":
		ksp, err := getFloat(input, "Ksp")
		if err != nil {
			return CalculationResult{}, err
		}
		if ksp <= 0 {
			return CalculationResult{}, errors.New("Ksp must be positive")
		}
		coeff := math.Pow(a, a) * math.Pow(b, b)
		s := math.Pow(ksp/coeff, 1.0/ionCount)
		return CalculationResult{
			Value: s,
			Unit:  "M",
			Steps: []string{fmt.Sprintf("s = (Ksp / (a^a × b^b))^(1/(a+b)) = (%.4g / (%.0f^%.0f × %.0f^%.0f))^(1/%.0f)", ksp, a, a, b, b, ionCount)},
		}, nil
	case "solubility-to-ksp":
		s, err := getFloat(input, "molarSolubility")
		if err != nil {
			return CalculationResult{}, err
		}
		if s <= 0 {
			return CalculationResult{}, errors.New("molar solubility must be positive")
		}
		ksp := math.Pow(a*s, a) * math.Pow(b*s, b)
		return CalculationResult{
			Value: ksp,
			Unit:  "",
			Steps: []string{fmt.Sprintf("Ksp = (a × s)^a × (b × s)^b = (%.4g × %.4g)^%.0f × (%.4g × %.4g)^%.0f", a, s, a, b, s, b)},
		}, nil
	default:
		return CalculationResult{}, fmt.Errorf("invalid mode: %s", mode)
	}
}

// ColligativeProperties calculates boiling point elevation, freezing point depression,
// or osmotic pressure.
// Input keys: "mode" ("boiling", "freezing", "osmotic"),
// "Kb"/"Kf", "m" (molality), "i" (van't Hoff factor),
// "T" (temperature for osmotic), "M" (molarity for osmotic).
func ColligativeProperties(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	mode := getStringWithDefault(input, "mode", "boiling")
	i := getFloatWithDefault(input, "i", 1.0)
	if i <= 0 {
		return CalculationResult{}, errors.New("van't Hoff factor i must be positive")
	}

	switch mode {
	case "boiling":
		Kb, err := getFloat(input, "Kb")
		if err != nil {
			return CalculationResult{}, err
		}
		m, err := getFloat(input, "m")
		if err != nil {
			return CalculationResult{}, err
		}
		if Kb <= 0 {
			return CalculationResult{}, errors.New("Kb must be positive")
		}
		if m < 0 {
			return CalculationResult{}, errors.New("molality cannot be negative")
		}
		deltaTb := i * Kb * m
		return CalculationResult{
			Value: deltaTb,
			Unit:  "°C",
			Steps: []string{fmt.Sprintf("ΔTb = i × Kb × m = %.4f × %.4f × %.4f = %.4f", i, Kb, m, deltaTb)},
		}, nil
	case "freezing":
		Kf, err := getFloat(input, "Kf")
		if err != nil {
			return CalculationResult{}, err
		}
		m, err := getFloat(input, "m")
		if err != nil {
			return CalculationResult{}, err
		}
		if Kf <= 0 {
			return CalculationResult{}, errors.New("Kf must be positive")
		}
		if m < 0 {
			return CalculationResult{}, errors.New("molality cannot be negative")
		}
		deltaTf := i * Kf * m
		return CalculationResult{
			Value: deltaTf,
			Unit:  "°C",
			Steps: []string{fmt.Sprintf("ΔTf = i × Kf × m = %.4f × %.4f × %.4f = %.4f", i, Kf, m, deltaTf)},
		}, nil
	case "osmotic":
		M, err := getFloat(input, "M")
		if err != nil {
			return CalculationResult{}, err
		}
		T, err := getFloat(input, "T")
		if err != nil {
			return CalculationResult{}, err
		}
		if M < 0 {
			return CalculationResult{}, errors.New("molarity cannot be negative")
		}
		if T <= 0 {
			return CalculationResult{}, errors.New("temperature must be positive (Kelvin)")
		}
		// M is in mol/L: mol/L × J/(mol·K) × K = J/L = kPa.
		pi := i * M * RSI * T
		return CalculationResult{
			Value: pi,
			Unit:  "kPa",
			Steps: []string{fmt.Sprintf("π = iMRT = %.4f × %.4f mol/L × %.4f × %.4f = %.4f kPa", i, M, RSI, T, pi)},
		}, nil
	default:
		return CalculationResult{}, fmt.Errorf("invalid mode: %s", mode)
	}
}

// TitrationCurve generates pH vs volume data points for a titration.
// Input keys: "analyteConcentration", "analyteVolume", "titrantConcentration",
// "pKa", "mode" ("strong-acid-strong-base", "weak-acid-strong-base"),
// "numPoints" (optional, default 50).
func TitrationCurve(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	ca, err := getFloat(input, "analyteConcentration")
	if err != nil {
		return CalculationResult{}, err
	}
	va, err := getFloat(input, "analyteVolume")
	if err != nil {
		return CalculationResult{}, err
	}
	ct, err := getFloat(input, "titrantConcentration")
	if err != nil {
		return CalculationResult{}, err
	}
	if ca <= 0 || va <= 0 || ct <= 0 {
		return CalculationResult{}, errors.New("concentrations and volume must be positive")
	}

	mode := getStringWithDefault(input, "mode", "strong-acid-strong-base")
	if mode != "strong-acid-strong-base" && mode != "weak-acid-strong-base" {
		return CalculationResult{}, fmt.Errorf("invalid mode: %s", mode)
	}
	numPoints := int(getFloatWithDefault(input, "numPoints", 50))
	if numPoints < 2 {
		return CalculationResult{}, errors.New("numPoints must be at least 2")
	}
	if numPoints > 5000 {
		numPoints = 5000
	}

	equivalenceVolume := ca * va / ct

	type dataPoint struct {
		Volume float64
		PH     float64
	}
	points := make([]dataPoint, 0, numPoints)

	if mode == "strong-acid-strong-base" {
		for i := 0; i <= numPoints; i++ {
			vb := equivalenceVolume * float64(i) / float64(numPoints) * 2
			var pH float64
			totalVol := va + vb
			if totalVol == 0 {
				continue
			}
			molesH := ca*va - ct*vb
			if molesH > 0 {
				pH = -math.Log10(molesH / totalVol)
			} else if molesH < 0 {
				molesOH := -molesH
				pOH := -math.Log10(molesOH / totalVol)
				pH = 14 - pOH
			} else {
				pH = 7.0
			}
			if pH < 0 {
				pH = 0
			}
			if pH > 14 {
				pH = 14
			}
			points = append(points, dataPoint{Volume: vb, PH: pH})
		}
	} else {
		pKa, err := getFloat(input, "pKa")
		if err != nil {
			return CalculationResult{}, err
		}
		for i := 0; i <= numPoints; i++ {
			vb := equivalenceVolume * float64(i) / float64(numPoints) * 2
			var pH float64
			totalVol := va + vb
			if totalVol == 0 {
				continue
			}
			fraction := ct * vb / (ca * va)
			if fraction <= 0.001 {
				pH = 0.5 * (pKa - math.Log10(ca))
			} else if fraction >= 0.999 && fraction <= 1.001 {
				// At equivalence all HA has become A⁻; pH of the weak base is
				// 7 + ½pKa + ½log10([A⁻]).
				pH = 0.5 * (14 + pKa + math.Log10(ca*va/totalVol))
			} else if fraction > 1.001 {
				excessOH := (ct*vb - ca*va) / totalVol
				pOH := -math.Log10(excessOH)
				pH = 14 - pOH
			} else {
				molesHA := ca*va - ct*vb
				molesA := ct * vb
				if molesHA <= 0 || molesA <= 0 {
					continue
				}
				pH = pKa + math.Log10(molesA/molesHA)
			}
			if pH < 0 {
				pH = 0
			}
			if pH > 14 {
				pH = 14
			}
			points = append(points, dataPoint{Volume: vb, PH: pH})
		}
	}

	curveData := make([]map[string]float64, len(points))
	for i, p := range points {
		curveData[i] = map[string]float64{"volume": p.Volume, "pH": p.PH}
	}

	return CalculationResult{
		Value: equivalenceVolume,
		Unit:  "L",
		Steps: []string{fmt.Sprintf("equivalence volume = %.4f L", equivalenceVolume)},
		Metadata: map[string]interface{}{
			"curve":             curveData,
			"equivalenceVolume": equivalenceVolume,
		},
	}, nil
}
