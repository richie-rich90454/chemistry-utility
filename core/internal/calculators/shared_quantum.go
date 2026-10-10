package calculators

import (
	"errors"
	"math"
	"strconv"
	"strings"
)

// Port of frontend/src/modules/calculators/quantum.ts. Input keys, validation
// order, error messages, and output strings are kept identical so the
// conformance vectors pass unchanged.

const (
	planck           = 6.626e-34
	hbar             = 1.055e-34
	speedOfLight     = 2.998e8
	rydbergConstant  = 1.097e7
	elementaryCharge = 1.602e-19
	amuToKg          = 1.661e-27
)

func quantumNumbers(inputs map[string]string) (CalcResult, error) {
	n := optionalFloat(inputs, "qn-n")
	l := optionalFloat(inputs, "qn-l")
	ml := optionalFloat(inputs, "qn-ml")
	ms := optionalFloat(inputs, "qn-ms")
	if anyNaN(n, l, ml, ms) {
		return CalcResult{}, missingInputsError([]string{"qn-n", "qn-l", "qn-ml", "qn-ms"})
	}

	errs := []string{}
	if n != math.Trunc(n) || n < 1 {
		errs = append(errs, "n must be a positive integer (1, 2, 3, ...)")
	}
	if l != math.Trunc(l) || l < 0 || l >= n {
		errs = append(errs, "l must be an integer from 0 to n-1")
	}
	if ml != math.Trunc(ml) || ml < -l || ml > l {
		errs = append(errs, "ml must be an integer from -l to +l")
	}
	if ms != 0.5 && ms != -0.5 {
		errs = append(errs, "ms must be +1/2 or -1/2")
	}
	valid := len(errs) == 0

	shellNames := map[float64]string{1: "K", 2: "L", 3: "M", 4: "N", 5: "O", 6: "P", 7: "Q"}
	subshellNames := map[float64]string{0: "s", 1: "p", 2: "d", 3: "f"}
	// The lookup keyed on the raw value, which is blank unless it is one of
	// the whole numbers the tables name.
	shell := ""
	if n == math.Trunc(n) {
		shell = shellNames[n]
	}
	subshell := ""
	if l == math.Trunc(l) {
		subshell = subshellNames[l]
	}
	orbitalDesignation := strconv.FormatInt(int64(math.Round(n)), 10) + subshell
	maxElectrons := 2 * (2*int(math.Round(l)) + 1)

	value := "Invalid quantum numbers"
	if valid {
		value = "Valid quantum numbers"
	}
	explanation := "n = " + strconv.FormatInt(int64(math.Round(n)), 10) + " (shell " + shell + "); "
	explanation += "l = " + strconv.FormatInt(int64(math.Round(l)), 10) + " (subshell " + subshell + "); "
	explanation += "ml = " + strconv.FormatInt(int64(math.Round(ml)), 10) + "; "
	msText := "-1/2"
	if ms > 0 {
		msText = "+1/2"
	}
	explanation += "ms = " + msText + "; "
	if valid {
		explanation += "Orbital designation: " + orbitalDesignation + "; "
		explanation += "Max electrons in " + orbitalDesignation + " subshell: " + strconv.Itoa(maxElectrons)
	} else {
		explanation += "Errors: " + strings.Join(errs, "; ")
	}
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"valid":              valid,
			"n":                  math.Round(n),
			"l":                  math.Round(l),
			"ml":                 math.Round(ml),
			"ms":                 ms,
			"shell":              shell,
			"subshell":           subshell,
			"orbitalDesignation": orbitalDesignation,
			"maxElectrons":       maxElectrons,
			"errors":             errs,
		},
	}, nil
}

// Aufbau fill order as [n, l] pairs.
var aufbauOrder = [][2]int{
	{1, 0}, {2, 0}, {2, 1}, {3, 0}, {3, 1}, {4, 0}, {3, 2},
	{4, 1}, {5, 0}, {4, 2}, {5, 1}, {6, 0}, {4, 3}, {5, 2},
	{6, 1}, {7, 0}, {5, 3}, {6, 2}, {7, 1},
}

var subshellNames = map[int]string{0: "s", 1: "p", 2: "d", 3: "f"}

var maxElectronsByL = map[int]int{0: 2, 1: 6, 2: 10, 3: 14}

var nobleGases = map[int]string{2: "He", 10: "Ne", 18: "Ar", 36: "Kr", 54: "Xe", 86: "Rn"}

// Known exceptions to the Aufbau principle.
var electronConfigurationExceptions = map[int][][3]int{
	24: {{3, 2, 5}, {4, 0, 1}},
	29: {{3, 2, 10}, {4, 0, 1}},
	41: {{4, 2, 4}, {5, 0, 1}},
	42: {{4, 2, 5}, {5, 0, 1}},
	44: {{4, 2, 7}, {5, 0, 1}},
	45: {{4, 2, 8}, {5, 0, 1}},
	46: {{4, 2, 10}, {5, 0, 0}},
	47: {{4, 2, 10}, {5, 0, 1}},
	78: {{5, 2, 9}, {6, 0, 1}},
	79: {{5, 2, 10}, {6, 0, 1}},
}

// compareSubshellParts orders subshell strings like "2s2" by (n, l).
func compareSubshellParts(a, b string) int {
	na := int(a[0] - '0')
	nb := int(b[0] - '0')
	if na != nb {
		return na - nb
	}
	order := map[byte]int{'s': 0, 'p': 1, 'd': 2, 'f': 3}
	return order[a[1]] - order[b[1]]
}

func sortSubshellParts(parts []string) {
	for i := 1; i < len(parts); i++ {
		for j := i; j > 0 && compareSubshellParts(parts[j-1], parts[j]) > 0; j-- {
			parts[j-1], parts[j] = parts[j], parts[j-1]
		}
	}
}

func subshellPart(n, l, electrons int) string {
	return strconv.Itoa(n) + subshellNames[l] + strconv.Itoa(electrons)
}

func buildConfiguration(z int) string {
	if exception, ok := electronConfigurationExceptions[z]; ok {
		return buildFromException(exception, z)
	}
	parts := []string{}
	remaining := z
	for i := 0; i < len(aufbauOrder) && remaining > 0; i++ {
		n, l := aufbauOrder[i][0], aufbauOrder[i][1]
		electrons := remaining
		if electrons > maxElectronsByL[l] {
			electrons = maxElectronsByL[l]
		}
		parts = append(parts, subshellPart(n, l, electrons))
		remaining -= electrons
	}
	return strings.Join(parts, " ")
}

func buildFromException(exception [][3]int, z int) string {
	parts := []string{}
	inException := map[[2]int]bool{}
	exceptionElectrons := 0
	for _, entry := range exception {
		inException[[2]int{entry[0], entry[1]}] = true
		exceptionElectrons += entry[2]
	}
	usedElectrons := 0
	for _, pair := range aufbauOrder {
		n, l := pair[0], pair[1]
		if inException[[2]int{n, l}] {
			continue
		}
		electrons := maxElectronsByL[l]
		if usedElectrons+electrons > z-exceptionElectrons {
			electrons = z - exceptionElectrons - usedElectrons
		}
		if electrons > 0 {
			parts = append(parts, subshellPart(n, l, electrons))
			usedElectrons += electrons
		}
	}
	sortSubshellParts(parts)

	exceptionParts := []string{}
	for _, entry := range exception {
		if entry[2] > 0 {
			exceptionParts = append(exceptionParts, subshellPart(entry[0], entry[1], entry[2]))
		}
	}
	sortSubshellParts(exceptionParts)
	parts = append(parts, exceptionParts...)
	sortSubshellParts(parts)
	return strings.Join(parts, " ")
}

func buildNobleGasNotation(z int) string {
	nobleGasZ := 0
	nobleGasSymbol := ""
	for _, key := range []int{2, 10, 18, 36, 54, 86} {
		if key < z {
			nobleGasZ = key
			nobleGasSymbol = nobleGases[key]
		}
	}
	if nobleGasZ == 0 {
		return buildConfiguration(z)
	}
	fullConfig := buildConfiguration(z)
	coreConfig := buildConfiguration(nobleGasZ)
	remaining := fullConfig
	if strings.HasPrefix(fullConfig, coreConfig) {
		remaining = strings.TrimSpace(fullConfig[len(coreConfig):])
	}
	if exception, ok := electronConfigurationExceptions[z]; ok {
		parts := []string{}
		for _, entry := range exception {
			if entry[2] > 0 {
				parts = append(parts, subshellPart(entry[0], entry[1], entry[2]))
			}
		}
		sortSubshellParts(parts)
		remaining = strings.Join(parts, " ")
	}
	if remaining == "" {
		return "[" + nobleGasSymbol + "]"
	}
	return "[" + nobleGasSymbol + "] " + remaining
}

func buildOrbitalDiagram(z int) string {
	config := buildConfiguration(z)
	parts := strings.Split(config, " ")
	lines := []string{}
	for _, part := range parts {
		if len(part) < 2 {
			continue
		}
		n := string(part[0])
		l := string(part[1])
		electronCount, err := strconv.Atoi(part[2:])
		if err != nil {
			continue
		}
		orbitalCount := map[string]int{"s": 1, "p": 3, "d": 5, "f": 7}
		numOrbitals := orbitalCount[l]
		orbitals := []string{}
		for j := 0; j < numOrbitals; j++ {
			up := j < electronCount
			down := (j + numOrbitals) < electronCount
			switch {
			case up && down:
				orbitals = append(orbitals, "↑↓")
			case up:
				orbitals = append(orbitals, "↑ ")
			default:
				orbitals = append(orbitals, "  ")
			}
		}
		lines = append(lines, n+l+": "+strings.Join(orbitals, " | "))
	}
	return strings.Join(lines, "\n")
}

func countValenceElectrons(z int) int {
	config := buildConfiguration(z)
	parts := strings.Split(config, " ")
	valence := 0
	maxN := 0
	for _, part := range parts {
		n := int(part[0] - '0')
		if n > maxN {
			maxN = n
		}
	}
	hasPAtMaxN := false
	hasDAtMaxN := false
	for _, part := range parts {
		n := int(part[0] - '0')
		if n == maxN && part[1] == 'p' {
			hasPAtMaxN = true
		}
		if n == maxN && part[1] == 'd' {
			hasDAtMaxN = true
		}
	}
	dIsOutermostShell := hasPAtMaxN && hasDAtMaxN
	for _, part := range parts {
		n := int(part[0] - '0')
		l := part[1]
		electronCount, err := strconv.Atoi(part[2:])
		if err != nil {
			continue
		}
		switch {
		case n == maxN:
			if dIsOutermostShell {
				if l == 'd' {
					valence += electronCount
				}
			} else {
				valence += electronCount
			}
		case l == 'd' && n == maxN-1 && electronCount < 10:
			valence += electronCount
		case l == 'f' && n == maxN-2 && electronCount < 14:
			valence += electronCount
		}
	}
	return valence
}

func electronConfiguration(inputs map[string]string) (CalcResult, error) {
	zRaw := optionalFloat(inputs, "ec-atomic-number")
	if math.IsNaN(zRaw) {
		return CalcResult{}, errors.New("Missing or invalid input for ec-atomic-number")
	}
	atomicNumber := int(math.Round(zRaw))
	if atomicNumber < 1 || atomicNumber > 118 {
		return CalcResult{}, errors.New("Atomic number must be between 1 and 118")
	}
	config := buildConfiguration(atomicNumber)
	nobleGasNotation := buildNobleGasNotation(atomicNumber)
	orbitalDiagram := buildOrbitalDiagram(atomicNumber)
	valenceElectrons := countValenceElectrons(atomicNumber)
	explanation := "Atomic number: " + strconv.Itoa(atomicNumber) + "; "
	explanation += "Full configuration: " + config + "; "
	explanation += "Noble gas notation: " + nobleGasNotation + "; "
	explanation += "Valence electrons: " + strconv.Itoa(valenceElectrons) + "; "
	explanation += "Orbital diagram:\n" + orbitalDiagram
	return CalcResult{
		Value:       config,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"atomicNumber":     atomicNumber,
			"fullConfig":       config,
			"nobleGasNotation": nobleGasNotation,
			"valenceElectrons": valenceElectrons,
			"orbitalDiagram":   orbitalDiagram,
		},
	}, nil
}

func getSeriesName(n1 int) string {
	switch n1 {
	case 1:
		return "Lyman (UV)"
	case 2:
		return "Balmer (Visible)"
	case 3:
		return "Paschen (IR)"
	case 4:
		return "Brackett (IR)"
	case 5:
		return "Pfund (IR)"
	}
	return "Unknown series"
}

func rydberg(inputs map[string]string) (CalcResult, error) {
	n1 := optionalFloat(inputs, "rydberg-n1")
	n2 := optionalFloat(inputs, "rydberg-n2")
	if math.IsNaN(n1) || math.IsNaN(n2) {
		return CalcResult{}, missingInputsError([]string{"rydberg-n1", "rydberg-n2"})
	}
	if n1 != math.Trunc(n1) || n1 < 1 {
		return CalcResult{}, errors.New("n1 must be a positive integer")
	}
	if n2 != math.Trunc(n2) || n2 < 1 {
		return CalcResult{}, errors.New("n2 must be a positive integer")
	}
	if n2 <= n1 {
		return CalcResult{}, errors.New("n2 must be greater than n1")
	}
	invLambda := rydbergConstant * (1/(n1*n1) - 1/(n2*n2))
	lambdaM := 1 / invLambda
	lambdaNm := lambdaM * 1e9
	frequency := speedOfLight / lambdaM
	energyJ := planck * frequency
	energyEv := energyJ / elementaryCharge
	seriesName := getSeriesName(int(math.Round(n1)))
	value := formatFixed(lambdaNm, 2) + " nm"
	explanation := "Spectral series: " + seriesName + " (n₁ = " + strconv.Itoa(int(math.Round(n1))) + "); "
	explanation += "Transition: n = " + strconv.Itoa(int(math.Round(n2))) + " → n = " + strconv.Itoa(int(math.Round(n1))) + "; "
	explanation += "Wavelength: " + formatFixed(lambdaNm, 2) + " nm; "
	explanation += "Frequency: " + formatFixed(frequency, 4) + " Hz; "
	explanation += "Energy: " + formatFixed(energyEv, 4) + " eV"
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"n1": math.Round(n1), "n2": math.Round(n2),
			"wavelengthNm": lambdaNm, "frequencyHz": frequency, "energyEv": energyEv,
			"seriesName": seriesName,
		},
	}, nil
}

func deBroglie(inputs map[string]string) (CalcResult, error) {
	massRaw := optionalFloat(inputs, "db-mass")
	velocity := optionalFloat(inputs, "db-velocity")
	// The web engine falls back to kg only when the field is absent; an empty
	// value stays empty and fails the unit switch below.
	massUnit := "kg"
	if raw, present := inputs["db-mass-unit"]; present {
		massUnit = raw
	}
	if math.IsNaN(massRaw) || math.IsNaN(velocity) {
		return CalcResult{}, missingInputsError([]string{"db-mass", "db-velocity"})
	}
	if massRaw <= 0 {
		return CalcResult{}, errors.New("Mass must be positive")
	}
	if velocity <= 0 {
		return CalcResult{}, errors.New("Velocity must be positive")
	}
	massKg := massRaw
	switch massUnit {
	case "amu":
		massKg = massRaw * amuToKg
	case "g":
		massKg = massRaw / 1000
	case "kg":
	default:
		return CalcResult{}, errors.New("Invalid mass unit")
	}
	lambdaM := planck / (massKg * velocity)
	var lambdaDisplay float64
	var unit string
	switch {
	case lambdaM < 1e-12:
		lambdaDisplay = lambdaM * 1e12
		unit = "pm"
	case lambdaM < 1e-6:
		lambdaDisplay = lambdaM * 1e9
		unit = "nm"
	case lambdaM < 1e-3:
		lambdaDisplay = lambdaM * 1e6
		unit = "µm"
	default:
		lambdaDisplay = lambdaM
		unit = "m"
	}
	value := formatFixed(lambdaDisplay, 4) + " " + unit
	explanation := "λ = h / (m·v); "
	if massUnit == "amu" {
		explanation += "Mass: " + formatFixed(massRaw, 4) + " amu = " + formatFixed(massKg, 4) + " kg; "
	}
	explanation += "De Broglie wavelength: " + formatFixed(lambdaDisplay, 4) + " " + unit + "; "
	explanation += "Wavelength in meters: " + formatFixed(lambdaM, 4) + " m"
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"wavelengthM": lambdaM, "wavelengthDisplay": lambdaDisplay, "unit": unit,
			"massKg": massKg, "massRaw": massRaw, "massUnit": massUnit, "velocity": velocity,
		},
	}, nil
}

func photoelectric(inputs map[string]string) (CalcResult, error) {
	solveFor, ok := inputs["pe-solve-for"]
	if !ok {
		solveFor = ""
	}
	wavelengthNm := optionalFloat(inputs, "pe-wavelength")
	frequencyHz := optionalFloat(inputs, "pe-frequency")
	workFunctionEv := optionalFloat(inputs, "pe-work-function")
	keEv := optionalFloat(inputs, "pe-ke")

	switch solveFor {
	case "KE":
		freq := frequencyHz
		if math.IsNaN(freq) && !math.IsNaN(wavelengthNm) {
			if wavelengthNm <= 0 {
				return CalcResult{}, errors.New("Wavelength must be positive")
			}
			lambdaM := wavelengthNm * 1e-9
			freq = speedOfLight / lambdaM
		}
		if math.IsNaN(freq) {
			return CalcResult{}, errors.New("Please enter wavelength or frequency")
		}
		if freq <= 0 {
			return CalcResult{}, errors.New("Frequency must be positive")
		}
		if math.IsNaN(workFunctionEv) {
			return CalcResult{}, errors.New("Please enter the work function")
		}
		if workFunctionEv < 0 {
			return CalcResult{}, errors.New("Work function cannot be negative")
		}
		energyEv := (planck * freq) / elementaryCharge
		ke := energyEv - workFunctionEv
		thresholdFreq := (workFunctionEv * elementaryCharge) / planck
		thresholdWavelengthNm := (speedOfLight / thresholdFreq) * 1e9
		var value string
		explanation := "Photon energy: " + formatFixed(energyEv, 4) + " eV; "
		explanation += "Work function φ: " + formatFixed(workFunctionEv, 4) + " eV; "
		if ke < 0 {
			value = "No electron emission"
			explanation += "No electron emission (photon energy below work function); "
			explanation += "KE would be: " + formatFixed(ke, 4) + " eV (negative = no emission); "
		} else {
			value = formatFixed(ke, 4) + " eV"
			explanation += "Kinetic energy KE: " + formatFixed(ke, 4) + " eV; "
		}
		explanation += "Threshold frequency: " + formatFixed(thresholdFreq, 4) + " Hz; "
		explanation += "Threshold wavelength: " + formatFixed(thresholdWavelengthNm, 2) + " nm"
		return CalcResult{
			Value:       value,
			Explanation: explanation,
			Metadata: CalcMetadata{
				"photonEnergyEv": energyEv, "kineticEnergyEv": ke, "workFunctionEv": workFunctionEv,
				"thresholdFrequencyHz": thresholdFreq, "thresholdWavelengthNm": thresholdWavelengthNm,
				"emissionOccurred": ke >= 0,
			},
		}, nil
	case "threshold-frequency":
		if math.IsNaN(workFunctionEv) {
			return CalcResult{}, errors.New("Please enter the work function")
		}
		if workFunctionEv < 0 {
			return CalcResult{}, errors.New("Work function cannot be negative")
		}
		thresholdFreq := (workFunctionEv * elementaryCharge) / planck
		thresholdWavelengthNm := (speedOfLight / thresholdFreq) * 1e9
		value := formatFixed(thresholdFreq, 4) + " Hz"
		explanation := "Threshold frequency: " + formatFixed(thresholdFreq, 4) + " Hz; "
		explanation += "Threshold wavelength: " + formatFixed(thresholdWavelengthNm, 2) + " nm"
		return CalcResult{
			Value:       value,
			Explanation: explanation,
			Metadata: CalcMetadata{
				"thresholdFrequencyHz": thresholdFreq, "thresholdWavelengthNm": thresholdWavelengthNm,
				"workFunctionEv": workFunctionEv,
			},
		}, nil
	case "work-function":
		freq := frequencyHz
		if math.IsNaN(freq) && !math.IsNaN(wavelengthNm) {
			if wavelengthNm <= 0 {
				return CalcResult{}, errors.New("Wavelength must be positive")
			}
			lambdaM := wavelengthNm * 1e-9
			freq = speedOfLight / lambdaM
		}
		if math.IsNaN(freq) {
			return CalcResult{}, errors.New("Please enter wavelength or frequency")
		}
		if math.IsNaN(keEv) {
			return CalcResult{}, errors.New("Please enter the kinetic energy")
		}
		if keEv < 0 {
			return CalcResult{}, errors.New("Kinetic energy cannot be negative")
		}
		photonEnergyEv := (planck * freq) / elementaryCharge
		phi := photonEnergyEv - keEv
		value := formatFixed(phi, 4) + " eV"
		explanation := "Photon energy: " + formatFixed(photonEnergyEv, 4) + " eV; "
		explanation += "Work function φ: " + formatFixed(phi, 4) + " eV"
		return CalcResult{
			Value:       value,
			Explanation: explanation,
			Metadata: CalcMetadata{
				"photonEnergyEv": photonEnergyEv, "workFunctionEv": phi, "kineticEnergyEv": keEv,
			},
		}, nil
	case "wavelength":
		if math.IsNaN(keEv) {
			return CalcResult{}, errors.New("Please enter the kinetic energy")
		}
		if keEv < 0 {
			return CalcResult{}, errors.New("Kinetic energy cannot be negative")
		}
		if math.IsNaN(workFunctionEv) {
			return CalcResult{}, errors.New("Please enter the work function")
		}
		totalEnergyEv := keEv + workFunctionEv
		if totalEnergyEv <= 0 {
			return CalcResult{}, errors.New("Photon energy (KE + work function) must be positive")
		}
		totalEnergyJ := totalEnergyEv * elementaryCharge
		freq := totalEnergyJ / planck
		lambdaM := speedOfLight / freq
		lambdaNm := lambdaM * 1e9
		value := formatFixed(lambdaNm, 2) + " nm"
		explanation := "Total photon energy: " + formatFixed(totalEnergyEv, 4) + " eV; "
		explanation += "Required wavelength: " + formatFixed(lambdaNm, 2) + " nm; "
		explanation += "Required frequency: " + formatFixed(freq, 4) + " Hz"
		return CalcResult{
			Value:       value,
			Explanation: explanation,
			Metadata: CalcMetadata{
				"totalPhotonEnergyEv": totalEnergyEv, "wavelengthNm": lambdaNm, "frequencyHz": freq,
			},
		}, nil
	default:
		return CalcResult{}, errors.New("Invalid solve-for selection")
	}
}

func heisenberg(inputs map[string]string) (CalcResult, error) {
	solveFor, ok := inputs["heis-solve-for"]
	if !ok {
		solveFor = ""
	}
	deltaX := optionalFloat(inputs, "heis-delta-x")
	deltaP := optionalFloat(inputs, "heis-delta-p")
	mass := optionalFloat(inputs, "heis-mass")
	minProduct := hbar / 2.0

	switch solveFor {
	case "min-delta-x":
		if math.IsNaN(deltaP) {
			return CalcResult{}, errors.New("Please enter the uncertainty in momentum (Δp)")
		}
		if deltaP <= 0 {
			return CalcResult{}, errors.New("Δp must be positive")
		}
		minDeltaX := minProduct / deltaP
		value := formatFixed(minDeltaX, 4) + " m"
		explanation := "Δx·Δp ≥ ħ/2 = " + formatFixed(minProduct, 4) + " J·s; "
		explanation += "Minimum Δx: " + formatFixed(minDeltaX, 4) + " m"
		metadata := CalcMetadata{"minProduct": minProduct, "minDeltaX": minDeltaX, "deltaP": deltaP}
		if !math.IsNaN(mass) && mass > 0 {
			deltaV := deltaP / mass
			minDeltaV := minProduct / (minDeltaX * mass)
			explanation += "; Δv corresponding to Δp: " + formatFixed(deltaV, 4) + " m/s"
			explanation += "; Minimum Δv from Δx: " + formatFixed(minDeltaV, 4) + " m/s"
			metadata["deltaV"] = deltaV
			metadata["minDeltaV"] = minDeltaV
			metadata["mass"] = mass
		}
		return CalcResult{Value: value, Explanation: explanation, Metadata: metadata}, nil
	case "min-delta-p":
		if math.IsNaN(deltaX) {
			return CalcResult{}, errors.New("Please enter the uncertainty in position (Δx)")
		}
		if deltaX <= 0 {
			return CalcResult{}, errors.New("Δx must be positive")
		}
		minDeltaP := minProduct / deltaX
		value := formatFixed(minDeltaP, 4) + " kg·m/s"
		explanation := "Δx·Δp ≥ ħ/2 = " + formatFixed(minProduct, 4) + " J·s; "
		explanation += "Minimum Δp: " + formatFixed(minDeltaP, 4) + " kg·m/s"
		metadata := CalcMetadata{"minProduct": minProduct, "minDeltaP": minDeltaP, "deltaX": deltaX}
		if !math.IsNaN(mass) && mass > 0 {
			minDeltaV := minDeltaP / mass
			explanation += "; Minimum Δv: " + formatFixed(minDeltaV, 4) + " m/s"
			metadata["minDeltaV"] = minDeltaV
			metadata["mass"] = mass
		}
		return CalcResult{Value: value, Explanation: explanation, Metadata: metadata}, nil
	default:
		return CalcResult{}, errors.New("Invalid solve-for selection")
	}
}
