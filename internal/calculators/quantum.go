package calculators

import (
	"context"
	"errors"
	"fmt"
	"math"
)

const (
	// Planck constant in J·s
	planck = 6.626e-34
	// Reduced Planck constant (ℏ) in J·s
	hbar = 1.055e-34
	// Speed of light in m/s
	speedOfLight = 2.998e8
	// Electron mass in kg
	electronMass = 9.109e-31
	// Elementary charge in C
	elementaryCharge = 1.602e-19
)

// QuantumNumbers validates a set of quantum numbers (n, l, ml, ms).
// Input keys: "n", "l", "ml", "ms".
func QuantumNumbers(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	n, err := getFloat(input, "n")
	if err != nil {
		return CalculationResult{}, err
	}
	l, err := getFloat(input, "l")
	if err != nil {
		return CalculationResult{}, err
	}
	ml, err := getFloat(input, "ml")
	if err != nil {
		return CalculationResult{}, err
	}
	ms, err := getFloat(input, "ms")
	if err != nil {
		return CalculationResult{}, err
	}

	var validationErrors []string

	if n != math.Floor(n) || n < 1 {
		validationErrors = append(validationErrors, "n must be a positive integer (1, 2, 3, ...)")
	}
	if l != math.Floor(l) || l < 0 || l >= n {
		validationErrors = append(validationErrors, "l must be an integer from 0 to n-1")
	}
	if ml != math.Floor(ml) || ml < -l || ml > l {
		validationErrors = append(validationErrors, "ml must be an integer from -l to +l")
	}
	if ms != 0.5 && ms != -0.5 {
		validationErrors = append(validationErrors, "ms must be +1/2 or -1/2")
	}

	valid := len(validationErrors) == 0
	shellNames := map[float64]string{1: "K", 2: "L", 3: "M", 4: "N", 5: "O", 6: "P", 7: "Q"}
	subshellNames := map[float64]string{0: "s", 1: "p", 2: "d", 3: "f"}

	shell := shellNames[n]
	subshell := subshellNames[l]

	steps := []string{
		fmt.Sprintf("n = %d (shell %s)", int(n), shell),
		fmt.Sprintf("l = %d (subshell %s)", int(l), subshell),
		fmt.Sprintf("ml = %d", int(ml)),
		fmt.Sprintf("ms = %+.1f", ms),
	}

	if valid {
		steps = append(steps, "Valid set of quantum numbers")
	} else {
		for _, e := range validationErrors {
			steps = append(steps, "ERROR: "+e)
		}
	}

	return CalculationResult{
		Value: 0,
		Unit:  "",
		Steps: steps,
		Metadata: map[string]interface{}{
			"valid":   valid,
			"n":       n,
			"l":       l,
			"ml":      ml,
			"ms":      ms,
			"shell":   shell,
			"subshell": subshell,
		},
	}, nil
}

// ElectronConfiguration generates the electron configuration from atomic number.
// Input keys: "atomicNumber".
func ElectronConfiguration(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	atomicNumber, err := getFloat(input, "atomicNumber")
	if err != nil {
		return CalculationResult{}, err
	}
	if atomicNumber < 1 || atomicNumber > 118 {
		return CalculationResult{}, errors.New("atomic number must be between 1 and 118")
	}
	z := int(atomicNumber)

	// Aufbau order: (n, l) pairs
	aufbauOrder := []struct{ n, l int }{
		{1, 0}, {2, 0}, {2, 1}, {3, 0}, {3, 1}, {4, 0}, {3, 2},
		{4, 1}, {5, 0}, {4, 2}, {5, 1}, {6, 0}, {4, 3}, {5, 2},
		{6, 1}, {7, 0}, {5, 3}, {6, 2}, {7, 1}, {8, 0},
	}

	subshellNames := map[int]string{0: "s", 1: "p", 2: "d", 3: "f"}
	maxElectrons := map[int]int{0: 2, 1: 6, 2: 10, 3: 14}

	// Aufbau exceptions: half- or fully-filled d subshells are lower in
	// energy, so one (or both for Pd) ns electron is promoted into (n-1)d.
	// 24 Cr, 29 Cu, 41 Nb, 42 Mo, 44 Ru, 45 Rh, 46 Pd, 47 Ag, 78 Pt, 79 Au.
	aufbauExceptions := map[int]bool{
		24: true, 29: true, 41: true, 42: true, 44: true,
		45: true, 46: true, 47: true, 78: true, 79: true,
	}

	type shell struct{ n, l, count int }
	var configShells []shell
	remaining := z

	for _, sub := range aufbauOrder {
		if remaining <= 0 {
			break
		}
		max := maxElectrons[sub.l]
		electrons := remaining
		if electrons > max {
			electrons = max
		}
		if electrons > 0 {
			configShells = append(configShells, shell{sub.n, sub.l, electrons})
			remaining -= electrons
		}
	}

	if aufbauExceptions[z] && len(configShells) >= 2 {
		// Move one electron from the outermost s shell into the d shell
		// just beneath it.
		sIdx := -1
		dIdx := -1
		for i := len(configShells) - 1; i >= 0; i-- {
			if sIdx == -1 && configShells[i].l == 0 {
				sIdx = i
			}
			if dIdx == -1 && configShells[i].l == 2 {
				dIdx = i
			}
			if sIdx != -1 && dIdx != -1 {
				break
			}
		}
		if sIdx != -1 && dIdx != -1 {
			configShells[sIdx].count--
			configShells[dIdx].count++
			if configShells[sIdx].count == 0 {
				configShells = append(configShells[:sIdx], configShells[sIdx+1:]...)
			}
		}
	}

	var config string
	for _, s := range configShells {
		config += fmt.Sprintf("%d%s%d ", s.n, subshellNames[s.l], s.count)
	}

	return CalculationResult{
		Value: 0,
		Unit:  "",
		Steps: []string{
			fmt.Sprintf("Atomic number: %d", z),
			fmt.Sprintf("Configuration: %s", config),
		},
		Metadata: map[string]interface{}{
			"atomicNumber":  z,
			"configuration": config,
		},
	}, nil
}

// DeBroglieWavelength calculates λ = h/(mv).
// Input keys: "m" (mass in kg), "v" (velocity in m/s).
func DeBroglieWavelength(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	m, err := getFloat(input, "m")
	if err != nil {
		return CalculationResult{}, err
	}
	v, err := getFloat(input, "v")
	if err != nil {
		return CalculationResult{}, err
	}
	if m <= 0 {
		return CalculationResult{}, errors.New("mass must be positive")
	}
	if v <= 0 {
		return CalculationResult{}, errors.New("velocity must be positive")
	}

	wavelength := planck / (m * v)

	return CalculationResult{
		Value: wavelength,
		Unit:  "m",
		Steps: []string{
			"λ = h / (mv)",
			fmt.Sprintf("λ = %.4e J·s / (%.4e kg × %.4e m/s) = %.4e m", planck, m, v, wavelength),
		},
	}, nil
}

// PhotoelectricEffect calculates KE = hf - φ.
// Input keys: "frequency" (Hz), "workFunction" (in J or eV),
// "unit" (optional: "J" or "eV", default "eV").
// "solveFor" (optional: "KE", "frequency", "workFunction").
func PhotoelectricEffect(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solveFor := getStringWithDefault(input, "solveFor", "KE")
	unit := getStringWithDefault(input, "unit", "eV")

	var result float64
	var resultUnit string

	switch solveFor {
	case "KE":
		freq, err := getFloat(input, "frequency")
		if err != nil {
			return CalculationResult{}, err
		}
		phi, err := getFloat(input, "workFunction")
		if err != nil {
			return CalculationResult{}, err
		}
		workJ := phi
		if unit == "eV" {
			workJ = phi * elementaryCharge
		}
		KE := planck*freq - workJ
		if unit == "eV" {
			result = KE / elementaryCharge
		} else {
			result = KE
		}
		resultUnit = unit
	case "frequency":
		KE, err := getFloat(input, "KE")
		if err != nil {
			return CalculationResult{}, err
		}
		phi, err := getFloat(input, "workFunction")
		if err != nil {
			return CalculationResult{}, err
		}
		keJ := KE
		workJ := phi
		if unit == "eV" {
			keJ = KE * elementaryCharge
			workJ = phi * elementaryCharge
		}
		result = (keJ + workJ) / planck
		resultUnit = "Hz"
	case "workFunction":
		KE, err := getFloat(input, "KE")
		if err != nil {
			return CalculationResult{}, err
		}
		freq, err := getFloat(input, "frequency")
		if err != nil {
			return CalculationResult{}, err
		}
		keJ := KE
		if unit == "eV" {
			keJ = KE * elementaryCharge
		}
		workJ := planck*freq - keJ
		if unit == "eV" {
			result = workJ / elementaryCharge
		} else {
			result = workJ
		}
		resultUnit = unit
	default:
		return CalculationResult{}, fmt.Errorf("invalid solveFor: %s", solveFor)
	}

	return CalculationResult{
		Value: result,
		Unit:  resultUnit,
		Steps: []string{fmt.Sprintf("KE = hf - φ, solving for %s", solveFor)},
	}, nil
}

// HeisenbergUncertainty calculates ΔxΔp ≥ ℏ/2.
// Input keys: "deltaX" (or "deltaP"), "solveFor" ("deltaX" or "deltaP" or "minDeltaX" or "minDeltaP").
func HeisenbergUncertainty(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solveFor := getStringWithDefault(input, "solveFor", "minDeltaX")
	minProduct := hbar / 2.0

	var result float64
	var unit string

	switch solveFor {
	case "minDeltaX":
		deltaP, err := getFloat(input, "deltaP")
		if err != nil {
			return CalculationResult{}, err
		}
		if deltaP <= 0 {
			return CalculationResult{}, errors.New("Δp must be positive")
		}
		result = minProduct / deltaP
		unit = "m"
	case "minDeltaP":
		deltaX, err := getFloat(input, "deltaX")
		if err != nil {
			return CalculationResult{}, err
		}
		if deltaX <= 0 {
			return CalculationResult{}, errors.New("Δx must be positive")
		}
		result = minProduct / deltaX
		unit = "kg·m/s"
	default:
		return CalculationResult{}, fmt.Errorf("invalid solveFor: %s", solveFor)
	}

	return CalculationResult{
		Value: result,
		Unit:  unit,
		Steps: []string{
			fmt.Sprintf("ΔxΔp ≥ ℏ/2 = %.4e J·s", minProduct),
			fmt.Sprintf("Result: %.4e %s", result, unit),
		},
	}, nil
}
