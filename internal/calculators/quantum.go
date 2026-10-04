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
	// Reduced Planck constant (ℏ) in J·s (CODATA 2018)
	hbar = 1.054571817e-34
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

	nValid := n == math.Floor(n) && n >= 1
	if !nValid {
		validationErrors = append(validationErrors, "n must be a positive integer (1, 2, 3, ...)")
	}
	// l can only be checked against n when n itself is a valid positive
	// integer; otherwise fall back to requiring a non-negative integer.
	lValid := l == math.Floor(l) && l >= 0 && (!nValid || l < n)
	if !lValid {
		if nValid {
			validationErrors = append(validationErrors, "l must be an integer from 0 to n-1")
		} else {
			validationErrors = append(validationErrors, "l must be a non-negative integer (n is invalid, so its range cannot be checked)")
		}
	}
	// ml can only be checked against l when l is a valid non-negative integer.
	mlValid := ml == math.Floor(ml)
	if lValid {
		mlValid = mlValid && ml >= -l && ml <= l
	}
	if !mlValid {
		if lValid {
			validationErrors = append(validationErrors, "ml must be an integer from -l to +l")
		} else {
			validationErrors = append(validationErrors, "ml must be an integer (l is invalid, so its range cannot be checked)")
		}
	}
	if ms != 0.5 && ms != -0.5 {
		validationErrors = append(validationErrors, "ms must be +1/2 or -1/2")
	}

	valid := len(validationErrors) == 0
	shellNames := map[float64]string{1: "K", 2: "L", 3: "M", 4: "N", 5: "O", 6: "P", 7: "Q"}
	subshellNames := map[float64]string{0: "s", 1: "p", 2: "d", 3: "f"}

	shell, ok := shellNames[n]
	if !ok {
		shell = fmt.Sprintf("n=%.0f", n)
	}
	subshell, ok := subshellNames[l]
	if !ok {
		subshell = fmt.Sprintf("l=%.0f", l)
	}

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
			"valid":    valid,
			"n":        n,
			"l":        l,
			"ml":       ml,
			"ms":       ms,
			"shell":    shell,
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
	if atomicNumber != math.Trunc(atomicNumber) {
		return CalculationResult{}, errors.New("atomic number must be an integer")
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

	// fBlockExceptions holds the established ground-state occupations for
	// the lanthanides/actinides where an (n-2)f/(n-1)d rearrangement beats
	// the naive Aufbau fill (experimental ground states, cf. the NIST
	// Atomic Spectra Database): La [Xe] 5d1 6s2, Ce [Xe] 4f1 5d1 6s2,
	// Gd [Xe] 4f7 5d1 6s2, Ac [Rn] 6d1 7s2, Th [Rn] 6d2 7s2,
	// Pa [Rn] 5f2 6d1 7s2, U [Rn] 5f3 6d1 7s2, Np [Rn] 5f4 6d1 7s2,
	// Cm [Rn] 5f7 6d1 7s2. Each entry maps an (n, l) subshell to its
	// correct occupation; every entry conserves the total electron count.
	fBlockExceptions := map[int]map[[2]int]int{
		57: {{6, 0}: 2, {4, 3}: 0, {5, 2}: 1},
		58: {{6, 0}: 2, {4, 3}: 1, {5, 2}: 1},
		64: {{6, 0}: 2, {4, 3}: 7, {5, 2}: 1},
		89: {{7, 0}: 2, {5, 3}: 0, {6, 2}: 1},
		90: {{7, 0}: 2, {5, 3}: 0, {6, 2}: 2},
		91: {{7, 0}: 2, {5, 3}: 2, {6, 2}: 1},
		92: {{7, 0}: 2, {5, 3}: 3, {6, 2}: 1},
		93: {{7, 0}: 2, {5, 3}: 4, {6, 2}: 1},
		96: {{7, 0}: 2, {5, 3}: 7, {6, 2}: 1},
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
		// Move electron(s) from the outermost s shell into the d shell just
		// beneath it. Pd's ground state is [Kr] 4d10, so both of its 5s
		// electrons are promoted.
		promoted := 1
		if z == 46 {
			promoted = 2
		}
		for p := 0; p < promoted; p++ {
			// Every entry in aufbauExceptions has both an outermost s
			// shell and a d shell beneath it (all with nonzero counts
			// on entry; only Pd's second promotion empties its 5s, at
			// which point the loop ends), so both indices always resolve.
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
			configShells[sIdx].count--
			configShells[dIdx].count++
			if configShells[sIdx].count == 0 {
				configShells = append(configShells[:sIdx], configShells[sIdx+1:]...)
			}
		}
	}

	if tail, ok := fBlockExceptions[z]; ok {
		counts := make(map[[2]int]int, len(configShells))
		for _, s := range configShells {
			counts[[2]int{s.n, s.l}] = s.count
		}
		for k, v := range tail {
			if v == 0 {
				delete(counts, k)
			} else {
				counts[k] = v
			}
		}
		var rebuilt []shell
		for _, sub := range aufbauOrder {
			if c, ok := counts[[2]int{sub.n, sub.l}]; ok && c > 0 {
				rebuilt = append(rebuilt, shell{sub.n, sub.l, c})
			}
		}
		configShells = rebuilt
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
// Input keys: "frequency" (Hz, must be positive), "workFunction" (must be
// non-negative, in J or eV), "unit" ("J" or "eV", default "eV").
// "solveFor" (optional: "KE", "frequency", "workFunction").
// A negative KE result means no electron emission (photon energy below the
// work function) and is reported with an explanatory step, not an error.
func PhotoelectricEffect(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	solveFor := getStringWithDefault(input, "solveFor", "KE")
	unit := getStringWithDefault(input, "unit", "eV")
	if unit != "eV" && unit != "J" {
		return CalculationResult{}, fmt.Errorf("invalid unit: %s (must be \"eV\" or \"J\")", unit)
	}

	var result float64
	var resultUnit string
	var steps []string

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
		if freq <= 0 {
			return CalculationResult{}, errors.New("frequency must be positive")
		}
		if phi < 0 {
			return CalculationResult{}, errors.New("work function cannot be negative")
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
		steps = []string{fmt.Sprintf("KE = hf - φ, solving for %s", solveFor)}
		if KE < 0 {
			steps = append(steps, "KE < 0: no electron emission (photon energy below the work function)")
		}
	case "frequency":
		KE, err := getFloat(input, "KE")
		if err != nil {
			return CalculationResult{}, err
		}
		phi, err := getFloat(input, "workFunction")
		if err != nil {
			return CalculationResult{}, err
		}
		if KE < 0 {
			return CalculationResult{}, errors.New("kinetic energy cannot be negative")
		}
		if phi < 0 {
			return CalculationResult{}, errors.New("work function cannot be negative")
		}
		keJ := KE
		workJ := phi
		if unit == "eV" {
			keJ = KE * elementaryCharge
			workJ = phi * elementaryCharge
		}
		result = (keJ + workJ) / planck
		resultUnit = "Hz"
		steps = []string{fmt.Sprintf("KE = hf - φ, solving for %s", solveFor)}
	case "workFunction":
		KE, err := getFloat(input, "KE")
		if err != nil {
			return CalculationResult{}, err
		}
		freq, err := getFloat(input, "frequency")
		if err != nil {
			return CalculationResult{}, err
		}
		if KE < 0 {
			return CalculationResult{}, errors.New("kinetic energy cannot be negative")
		}
		if freq <= 0 {
			return CalculationResult{}, errors.New("frequency must be positive")
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
		steps = []string{fmt.Sprintf("KE = hf - φ, solving for %s", solveFor)}
	default:
		return CalculationResult{}, fmt.Errorf("invalid solveFor: %s", solveFor)
	}

	return CalculationResult{
		Value: result,
		Unit:  resultUnit,
		Steps: steps,
	}, nil
}

// HeisenbergUncertainty calculates ΔxΔp ≥ ℏ/2.
// Input keys: "deltaP" with solveFor "minDeltaX", or "deltaX" with solveFor
// "minDeltaP".
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
