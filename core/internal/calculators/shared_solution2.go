package calculators

import (
	"errors"
	"math"
	"strconv"
)

// The calculators in this file are a direct port of the second half of
// frontend/src/modules/calculators/solution.ts. Input keys, validation
// order, error messages, and output strings are kept identical so the
// conformance vectors pass unchanged.

func bufferSolution(inputs map[string]string) (CalcResult, error) {
	pKa := optionalFloat(inputs, "buffer-pKa")
	ha := optionalFloat(inputs, "buffer-HA")
	aMinus := optionalFloat(inputs, "buffer-Aminus")
	ph := optionalFloat(inputs, "buffer-pH")
	solveFor := inputs["buffer-solve-for"]
	if solveFor == "" {
		solveFor = "pH"
	}

	var resultpH, resultpKa, resultRatio float64
	switch solveFor {
	case "pH":
		if anyNaN(pKa) {
			return CalcResult{}, errors.New("pKa is required")
		}
		if anyNaN(ha, aMinus) {
			return CalcResult{}, errors.New("[HA] and [A-] are required")
		}
		if ha <= 0 {
			return CalcResult{}, errors.New("[HA] must be positive")
		}
		if aMinus <= 0 {
			return CalcResult{}, errors.New("[A-] must be positive")
		}
		resultRatio = aMinus / ha
		resultpH = pKa + math.Log10(resultRatio)
		resultpKa = pKa
	case "pKa":
		if anyNaN(ph) {
			return CalcResult{}, errors.New("pH is required")
		}
		if anyNaN(ha, aMinus) {
			return CalcResult{}, errors.New("[HA] and [A-] are required")
		}
		if ha <= 0 {
			return CalcResult{}, errors.New("[HA] must be positive")
		}
		if aMinus <= 0 {
			return CalcResult{}, errors.New("[A-] must be positive")
		}
		resultRatio = aMinus / ha
		resultpKa = ph - math.Log10(resultRatio)
		resultpH = ph
	case "ratio":
		if anyNaN(pKa) {
			return CalcResult{}, errors.New("pKa is required")
		}
		if anyNaN(ph) {
			return CalcResult{}, errors.New("pH is required")
		}
		resultpH = ph
		resultpKa = pKa
		resultRatio = math.Pow(10, ph-pKa)
	default:
		return CalcResult{}, errors.New("Invalid solve-for selection")
	}

	bufferCapacity := "Poor (ratio outside 10:1)"
	if math.Abs(math.Log10(resultRatio)) <= 1 {
		bufferCapacity = "Good (ratio within 10:1)"
	}

	var value string
	switch solveFor {
	case "pH":
		value = "pH = " + formatFixed(resultpH, 4)
	case "pKa":
		value = "pKa = " + formatFixed(resultpKa, 4)
	default:
		value = "[A-]/[HA] = " + formatFixed(resultRatio, 4)
	}

	explanation := "pH = " + formatFixed(resultpH, 4) + "; "
	explanation += "pKa = " + formatFixed(resultpKa, 4) + "; "
	explanation += "[A-]/[HA] = " + formatFixed(resultRatio, 4) + "; "
	explanation += "Buffer Capacity: " + bufferCapacity

	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"pH":             resultpH,
			"pKa":            resultpKa,
			"ratio":          resultRatio,
			"bufferCapacity": bufferCapacity,
			"solveFor":       solveFor,
		},
	}, nil
}

func pKaPKb(inputs map[string]string) (CalcResult, error) {
	inputValue := optionalFloat(inputs, "pka-pkb-input-value")
	inputType := inputs["pka-pkb-input-type"]
	if inputType == "" {
		inputType = "Ka"
	}
	if anyNaN(inputValue) || inputValue <= 0 {
		return CalcResult{}, errors.New("Input value must be a positive number")
	}

	var ka, pKa, kb, pKb float64
	switch inputType {
	case "Ka":
		ka = inputValue
		pKa = -math.Log10(ka)
		pKb = 14 - pKa
		kb = math.Pow(10, -pKb)
	case "pKa":
		pKa = inputValue
		ka = math.Pow(10, -pKa)
		pKb = 14 - pKa
		kb = math.Pow(10, -pKb)
	case "Kb":
		kb = inputValue
		pKb = -math.Log10(kb)
		pKa = 14 - pKb
		ka = math.Pow(10, -pKa)
	case "pKb":
		pKb = inputValue
		kb = math.Pow(10, -pKb)
		pKa = 14 - pKb
		ka = math.Pow(10, -pKa)
	default:
		return CalcResult{}, errors.New("Invalid input type")
	}

	kw := ka * kb
	explanation := "Ka = " + formatFixed(ka, 6) + "; "
	explanation += "pKa = " + formatFixed(pKa, 4) + "; "
	explanation += "Kb = " + formatFixed(kb, 6) + "; "
	explanation += "pKb = " + formatFixed(pKb, 4) + "; "
	explanation += "Ka * Kb = Kw = " + formatFixed(kw/1e-14, 4) + " x 10^-14"

	return CalcResult{
		Value:       "pKa = " + formatFixed(pKa, 4) + "; pKb = " + formatFixed(pKb, 4),
		Explanation: explanation,
		Metadata: CalcMetadata{
			"Ka":         ka,
			"pKa":        pKa,
			"Kb":         kb,
			"pKb":        pKb,
			"Kw":         kw,
			"inputType":  inputType,
			"inputValue": inputValue,
		},
	}, nil
}

func ksp(inputs map[string]string) (CalcResult, error) {
	kspVal := optionalFloat(inputs, "ksp-value")
	solubility := optionalFloat(inputs, "ksp-molar-solubility")
	saltType := inputs["ksp-salt-type"]
	if saltType == "" {
		saltType = "AB"
	}
	solveFor := inputs["ksp-solve-for"]
	if solveFor == "" {
		solveFor = "Ksp"
	}

	stoichA, stoichB, err := saltStoich(saltType)
	if err != nil {
		return CalcResult{}, err
	}

	var resultKsp, resultS, concA, concB float64
	switch solveFor {
	case "Ksp":
		if anyNaN(solubility) || solubility <= 0 {
			return CalcResult{}, errors.New("Molar solubility must be positive")
		}
		resultS = solubility
		concA = stoichA * resultS
		concB = stoichB * resultS
		resultKsp = math.Pow(concA, stoichA) * math.Pow(concB, stoichB)
	case "solubility":
		if anyNaN(kspVal) || kspVal <= 0 {
			return CalcResult{}, errors.New("Ksp must be positive")
		}
		resultKsp = kspVal
		exponent := stoichA + stoichB
		coeff := math.Pow(stoichA, stoichA) * math.Pow(stoichB, stoichB)
		resultS = math.Pow(resultKsp/coeff, 1/exponent)
		concA = stoichA * resultS
		concB = stoichB * resultS
	default:
		return CalcResult{}, errors.New("Invalid solve-for selection")
	}

	explanation := "Ksp = " + formatFixed(resultKsp, 6) + "; "
	explanation += "Molar Solubility (s) = " + formatFixed(resultS, 6) + " M; "
	explanation += "[A] = " + formatFixed(concA, 6) + " M; "
	explanation += "[B] = " + formatFixed(concB, 6) + " M"

	return CalcResult{
		Value:       "Ksp = " + formatFixed(resultKsp, 6) + "; s = " + formatFixed(resultS, 6) + " M",
		Explanation: explanation,
		Metadata: CalcMetadata{
			"Ksp":        resultKsp,
			"solubility": resultS,
			"concA":      concA,
			"concB":      concB,
			"stoichA":    stoichA,
			"stoichB":    stoichB,
			"saltType":   saltType,
			"solveFor":   solveFor,
		},
	}, nil
}

func saltStoich(saltType string) (float64, float64, error) {
	switch saltType {
	case "AB":
		return 1, 1, nil
	case "AB2":
		return 1, 2, nil
	case "A2B":
		return 2, 1, nil
	case "AB3":
		return 1, 3, nil
	case "A3B":
		return 3, 1, nil
	default:
		return 0, 0, errors.New("Invalid salt type")
	}
}

func colligativeProperties(inputs map[string]string) (CalcResult, error) {
	soluteMass := optionalFloat(inputs, "collig-solute-mass")
	molarMass := optionalFloat(inputs, "collig-molar-mass")
	solventMass := optionalFloat(inputs, "collig-solvent-mass")
	i := optionalFloat(inputs, "collig-vanthoff")
	kb := optionalFloat(inputs, "collig-Kb")
	kf := optionalFloat(inputs, "collig-Kf")
	solventBp := optionalFloat(inputs, "collig-solvent-bp")
	solventFp := optionalFloat(inputs, "collig-solvent-fp")
	pSolvent := optionalFloat(inputs, "collig-Psolvent")

	if anyNaN(soluteMass, molarMass, solventMass, i) {
		return CalcResult{}, missingInputsError([]string{"collig-solute-mass", "collig-molar-mass", "collig-solvent-mass", "collig-vanthoff"})
	}
	if soluteMass <= 0 {
		return CalcResult{}, errors.New("Solute mass must be positive")
	}
	if molarMass <= 0 {
		return CalcResult{}, errors.New("Molar mass must be positive")
	}
	if solventMass <= 0 {
		return CalcResult{}, errors.New("Solvent mass must be positive")
	}
	if i < 1 {
		return CalcResult{}, errors.New("Van't Hoff factor must be >= 1")
	}

	density := optionalFloat(inputs, "collig-density")
	if anyNaN(density) {
		density = 1
	}
	if density <= 0 {
		return CalcResult{}, errors.New("Solution density must be positive")
	}
	osmoticTemp := optionalFloat(inputs, "collig-temp")
	if anyNaN(osmoticTemp) {
		osmoticTemp = 298.15
	}
	if osmoticTemp <= 0 {
		return CalcResult{}, errors.New("Temperature must be positive (Kelvin)")
	}

	molesSolute := soluteMass / molarMass
	molality := molesSolute / (solventMass / 1000)
	explanation := "Molality (m) = " + formatFixed(molality, 4) + " mol/kg"
	metadata := CalcMetadata{
		"molality":    molality,
		"molesSolute": molesSolute,
		"i":           i,
	}
	if !anyNaN(kb) && kb > 0 && !anyNaN(solventBp) {
		deltaTb := kb * molality * i
		newBp := solventBp + deltaTb
		explanation += "; Delta Tb = " + formatFixed(deltaTb, 4) + " C; New Boiling Point = " + formatFixed(newBp, 4) + " C"
		metadata["deltaTb"] = deltaTb
		metadata["newBp"] = newBp
	}
	if !anyNaN(kf) && kf > 0 && !anyNaN(solventFp) {
		deltaTf := kf * molality * i
		newFp := solventFp - deltaTf
		explanation += "; Delta Tf = " + formatFixed(deltaTf, 4) + " C; New Freezing Point = " + formatFixed(newFp, 4) + " C"
		metadata["deltaTf"] = deltaTf
		metadata["newFp"] = newFp
	}

	solventMM := optionalFloat(inputs, "collig-solvent-molar-mass")
	if anyNaN(solventMM) {
		solventMM = 18.015
	}
	if solventMM <= 0 {
		return CalcResult{}, errors.New("Solvent molar mass must be positive")
	}
	molesSolvent := (solventMass / 1000) / (solventMM / 1000)
	xSolute := molesSolute / (molesSolute + molesSolvent)
	solutionVolumeL := (solventMass / 1000) / density
	molarity := molesSolute / solutionVolumeL
	osmoticPressure := molarity * 0.08206 * osmoticTemp * i
	explanation += "; Molarity = " + formatFixed(molarity, 4) + " mol/L (density " + formatFixed(density, 4) + " g/mL)"
	explanation += "; Osmotic Pressure = " + formatFixed(osmoticPressure, 4) + " atm (at " + formatFixed(osmoticTemp, 2) + " K)"
	metadata["osmoticPressure"] = osmoticPressure
	metadata["xSolute"] = xSolute
	metadata["molarity"] = molarity
	metadata["density"] = density
	metadata["osmoticTemp"] = osmoticTemp
	if !anyNaN(pSolvent) && pSolvent > 0 {
		deltaP := xSolute * pSolvent
		explanation += "; Delta P = " + formatFixed(deltaP, 4) + " atm; New Vapor Pressure = " + formatFixed(pSolvent-deltaP, 4) + " atm"
		metadata["deltaP"] = deltaP
		metadata["newVaporPressure"] = pSolvent - deltaP
	}

	return CalcResult{
		Value:       "Molality = " + formatFixed(molality, 4) + " mol/kg; Osmotic Pressure = " + formatFixed(osmoticPressure, 4) + " atm",
		Explanation: explanation,
		Metadata:    metadata,
	}, nil
}

func titrationCurve(inputs map[string]string) (CalcResult, error) {
	acidConc := optionalFloat(inputs, "titration-acid-conc")
	acidVol := optionalFloat(inputs, "titration-acid-vol")
	baseConc := optionalFloat(inputs, "titration-base-conc")
	maxVol := optionalFloat(inputs, "titration-max-vol")
	acidType := inputs["titration-acid-type"]
	if acidType == "" {
		acidType = "strong"
	}

	var ka float64
	if acidType == "weak" {
		ka = optionalFloat(inputs, "titration-Ka")
		if anyNaN(ka) || ka <= 0 {
			return CalcResult{}, errors.New("Ka is required for weak acid")
		}
	} else {
		ka = 1e7
	}

	if anyNaN(acidConc, acidVol, baseConc, maxVol) {
		return CalcResult{}, missingInputsError([]string{"titration-acid-conc", "titration-acid-vol", "titration-base-conc", "titration-max-vol"})
	}
	if acidConc <= 0 {
		return CalcResult{}, errors.New("Acid concentration must be positive")
	}
	if acidVol <= 0 {
		return CalcResult{}, errors.New("Acid volume must be positive")
	}
	if baseConc <= 0 {
		return CalcResult{}, errors.New("Base concentration must be positive")
	}
	if maxVol <= 0 {
		return CalcResult{}, errors.New("Max volume must be positive")
	}

	equivVol := (acidConc * acidVol) / baseConc
	halfEquivVol := equivVol / 2
	steps := 50
	stepSize := maxVol / float64(steps)

	chart := make([]ChartData, 0, steps+1)
	for step := 0; step <= steps; step++ {
		vb := float64(step) * stepSize
		var ph float64
		totalAcid := acidConc * acidVol
		addedBase := baseConc * vb
		totalVolume := acidVol + vb
		switch {
		case vb == 0:
			if acidType == "strong" {
				ph = -math.Log10(acidConc)
			} else {
				ph = -math.Log10((-ka + math.Sqrt(ka*ka+4*ka*acidConc)) / 2)
			}
		case math.Abs(vb-equivVol) <= stepSize/2:
			totalVolumeEq := acidVol + equivVol
			if acidType == "strong" {
				ph = 7
			} else {
				concA := totalAcid / totalVolumeEq
				kb := 1e-14 / ka
				concOH := (-kb + math.Sqrt(kb*kb+4*kb*concA)) / 2
				ph = 14 + math.Log10(concOH)
			}
		case vb < equivVol:
			remainingAcid := totalAcid - addedBase
			formedBase := addedBase
			if acidType == "strong" {
				concH := remainingAcid / totalVolume
				ph = -math.Log10(concH)
			} else {
				concHA := remainingAcid / totalVolume
				concA := formedBase / totalVolume
				ph = -math.Log10(ka) + math.Log10(concA/concHA)
			}
		default:
			excessBase := addedBase - totalAcid
			concOH := excessBase / totalVolume
			ph = 14 + math.Log10(concOH)
		}
		if ph < 0 {
			ph = 0
		}
		if ph > 14 {
			ph = 14
		}
		chart = append(chart, ChartData{"volume": vb, "pH": ph})
	}

	explanation := "Equivalence Point: " + formatFixed(equivVol, 2) + " mL"
	if acidType == "weak" {
		explanation += "; Half-Equivalence Point: " + formatFixed(halfEquivVol, 2) + " mL (pH = pKa = " + formatFixed(-math.Log10(ka), 4) + ")"
	}
	explanation += "; Data Points: " + strconv.Itoa(len(chart))

	return CalcResult{
		Value:       "Equivalence Point: " + formatFixed(equivVol, 2) + " mL",
		Explanation: explanation,
		ChartData:   chart,
		Metadata: CalcMetadata{
			"equivalenceVolume":     equivVol,
			"halfEquivalenceVolume": halfEquivVol,
			"acidType":              acidType,
			"Ka":                    ka,
			"dataPointCount":        len(chart),
		},
	}, nil
}

func jsInt(n int) string {
	return strconv.Itoa(n)
}

func saltGcd(a, b float64) float64 {
	a = math.Abs(a)
	b = math.Abs(b)
	for b != 0 {
		t := math.Mod(a, b)
		a = b
		b = t
	}
	if a == 0 {
		return 1
	}
	return a
}

func saltStoichiometry(zplus, zminus float64) (float64, float64) {
	a := math.Abs(math.Round(zplus))
	b := math.Abs(math.Round(zminus))
	g := saltGcd(a, b)
	return b / g, a / g
}

func debyeHuckel(inputs map[string]string) (CalcResult, error) {
	zplus := optionalFloat(inputs, "dh-zplus")
	zminus := optionalFloat(inputs, "dh-zminus")
	concentration := optionalFloat(inputs, "dh-concentration")
	ionSize := optionalFloat(inputs, "dh-ion-size")
	if anyNaN(zplus, zminus, concentration, ionSize) {
		return CalcResult{}, missingInputsError([]string{"dh-zplus", "dh-zminus", "dh-concentration", "dh-ion-size"})
	}
	if zplus == 0 || zminus == 0 {
		return CalcResult{}, errors.New("Ion charges cannot be zero")
	}
	if zplus != math.Trunc(zplus) || zminus != math.Trunc(zminus) {
		return CalcResult{}, errors.New("Ion charges must be integers")
	}
	if concentration <= 0 {
		return CalcResult{}, errors.New("Concentration must be positive")
	}
	if ionSize <= 0 {
		return CalcResult{}, errors.New("Ion size parameter must be positive")
	}

	nuPlus, nuMinus := saltStoichiometry(zplus, zminus)
	ionicStrength := 0.5 * concentration * (nuPlus*zplus*zplus + nuMinus*zminus*zminus)
	sqrtI := math.Sqrt(ionicStrength)
	absProduct := math.Abs(zplus * zminus)
	logGamma := -0.509 * absProduct * sqrtI / (1 + 3.28*ionSize*sqrtI)
	gamma := math.Pow(10, logGamma)
	nuTotal := nuPlus + nuMinus
	meanMolality := concentration * math.Pow(math.Pow(nuPlus, nuPlus)*math.Pow(nuMinus, nuMinus), 1/nuTotal)
	meanActivity := gamma * meanMolality

	explanation := "Ionic Strength (I) = " + formatFixed(ionicStrength, 6) + " M; "
	explanation += "log(gamma) = " + formatFixed(logGamma, 6) + "; "
	explanation += "gamma = " + formatFixed(gamma, 6) + "; "
	explanation += "Mean Activity = " + formatFixed(meanActivity, 6) + "; "
	explanation += "salt stoichiometry M" + jsNumber(nuPlus) + "X" + jsNumber(nuMinus) + " from charge neutrality (concentration is the salt concentration)"

	return CalcResult{
		Value:       "I = " + formatFixed(ionicStrength, 6) + " M; gamma = " + formatFixed(gamma, 6),
		Explanation: explanation,
		Metadata: CalcMetadata{
			"ionicStrength": ionicStrength,
			"logGamma":      logGamma,
			"gamma":         gamma,
			"meanActivity":  meanActivity,
			"meanMolality":  meanMolality,
			"nuPlus":        nuPlus,
			"nuMinus":       nuMinus,
			"zplus":         zplus,
			"zminus":        zminus,
			"concentration": concentration,
			"ionSize":       ionSize,
		},
	}, nil
}

func commonIonEffect(inputs map[string]string) (CalcResult, error) {
	kspVal := optionalFloat(inputs, "common-ion-Ksp")
	commonIonConc := optionalFloat(inputs, "common-ion-concentration")
	saltType := inputs["common-ion-salt-type"]
	if saltType == "" {
		saltType = "AB"
	}
	if anyNaN(kspVal, commonIonConc) {
		return CalcResult{}, missingInputsError([]string{"common-ion-Ksp", "common-ion-concentration"})
	}
	if kspVal <= 0 {
		return CalcResult{}, errors.New("Ksp must be positive")
	}
	if commonIonConc <= 0 {
		return CalcResult{}, errors.New("Common ion concentration must be positive")
	}

	stoichA, stoichB, err := saltStoich(saltType)
	if err != nil {
		return CalcResult{}, err
	}

	s := math.Pow(kspVal/math.Pow(commonIonConc, stoichB), 1/stoichA) / stoichA
	concA := stoichA * s
	concB := stoichB*s + commonIonConc
	exponent := stoichA + stoichB
	coeff := math.Pow(stoichA, stoichA) * math.Pow(stoichB, stoichB)
	solubilityWithout := math.Pow(kspVal/coeff, 1/exponent)

	explanation := "Molar Solubility (with common ion) = " + formatFixed(s, 6) + " M; "
	explanation += "Molar Solubility (without common ion) = " + formatFixed(solubilityWithout, 6) + " M; "
	explanation += "[A] = " + formatFixed(concA, 6) + " M; "
	explanation += "[B] = " + formatFixed(concB, 6) + " M; "
	explanation += "Solubility Ratio = " + formatFixed(s/solubilityWithout, 6)
	approxValid := (stoichB*s)/commonIonConc <= 0.05
	if !approxValid {
		explanation += "; WARNING: dissolved B exceeds 5% of the common ion concentration, so the s << C approximation may be inaccurate"
	}

	return CalcResult{
		Value:       "s (with common ion) = " + formatFixed(s, 6) + " M; s (without) = " + formatFixed(solubilityWithout, 6) + " M",
		Explanation: explanation,
		Metadata: CalcMetadata{
			"solubilityWithCommonIon":    s,
			"solubilityWithoutCommonIon": solubilityWithout,
			"concA":                      concA,
			"concB":                      concB,
			"solubilityRatio":            s / solubilityWithout,
			"saltType":                   saltType,
			"stoichA":                    stoichA,
			"stoichB":                    stoichB,
			"approxValid":                approxValid,
		},
	}, nil
}
