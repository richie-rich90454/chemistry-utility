package calculators

import (
	"errors"
	"math"
	"regexp"
	"strings"
)

func gcdInt(a, b int) int {
	a = absInt(a)
	b = absInt(b)
	for b != 0 {
		t := a % b
		a = b
		b = t
	}
	if a == 0 {
		return 1
	}
	return a
}

func lcmInt(a, b int) int {
	if a == 0 || b == 0 {
		return 1
	}
	return a / gcdInt(a, b) * b
}

func absInt(a int) int {
	if a < 0 {
		return -a
	}
	return a
}

func simplifyRatio(value float64) [2]float64 {
	bestNum := math.Round(value)
	bestDen := 1.0
	bestErr := math.Abs(value - bestNum)
	for den := 2.0; den <= 6; den++ {
		num := math.Round(value * den)
		err := math.Abs(value*den-num) / den
		if err < bestErr {
			bestErr = err
			bestNum = num
			bestDen = den
		}
	}
	return [2]float64{bestNum, bestDen}
}

func empiricalFormula(inputs map[string]string) (CalcResult, error) {
	raw := inputs["ef-composition"]
	if strings.TrimSpace(raw) == "" {
		return CalcResult{}, errors.New("Enter the percent composition as element:percent pairs, e.g. C:40,H:6.71,O:53.29")
	}
	var symbols []string
	var percents []float64
	var masses []float64
	for _, entryRaw := range strings.Split(raw, ",") {
		entry := strings.TrimSpace(entryRaw)
		if entry == "" {
			continue
		}
		colon := strings.Index(entry, ":")
		if colon < 0 {
			return CalcResult{}, errors.New("Invalid composition entry: " + entry + ". Use element:percent pairs like C:40,H:6.71,O:53.29")
		}
		rawSymbol := strings.TrimSpace(entry[:colon])
		percentText := strings.TrimSpace(entry[colon+1:])
		percent := parseNumber(percentText)
		if math.IsNaN(percent) {
			return CalcResult{}, errors.New("Invalid percent in entry: " + entry)
		}
		if percent < 0 {
			return CalcResult{}, errors.New("Percentages cannot be negative")
		}
		symbol := ""
		if len(rawSymbol) > 0 {
			symbol = strings.ToUpper(rawSymbol[:1]) + strings.ToLower(rawSymbol[1:])
		}
		element, ok := findElementBySymbol(symbol)
		if !ok {
			return CalcResult{}, errors.New("Element not found: " + rawSymbol)
		}
		for _, existing := range symbols {
			if existing == symbol {
				return CalcResult{}, errors.New("Duplicate element in composition: " + symbol)
			}
		}
		symbols = append(symbols, symbol)
		percents = append(percents, percent)
		masses = append(masses, element.AtomicMass)
	}
	if len(symbols) < 1 {
		return CalcResult{}, errors.New("Enter at least one element:percent pair, e.g. C:40,H:6.71,O:53.29")
	}
	totalPercent := 0.0
	for _, p := range percents {
		totalPercent += p
	}
	if totalPercent < 95 || totalPercent > 105 {
		return CalcResult{}, errors.New("Percentages must sum to approximately 100% (got " + formatFixed(totalPercent, 4) + "%)")
	}
	for i, p := range percents {
		if p == 0 {
			return CalcResult{}, errors.New("Each element must have a positive percent (got 0% for " + symbols[i] + ")")
		}
	}
	var moles []float64
	minMoles := math.Inf(1)
	for i := range symbols {
		elementMoles := percents[i] / masses[i]
		moles = append(moles, elementMoles)
		if elementMoles < minMoles {
			minMoles = elementMoles
		}
	}
	var numerators, denominators []float64
	for i := range moles {
		frac := simplifyRatio(moles[i] / minMoles)
		numerators = append(numerators, frac[0])
		denominators = append(denominators, frac[1])
	}
	common := 1
	for _, d := range denominators {
		common = lcmInt(common, int(d))
	}
	counts := make([]int, len(numerators))
	for i := range numerators {
		counts[i] = int(numerators[i]) * (common / int(denominators[i]))
	}
	commonDivisor := 0
	for _, c := range counts {
		commonDivisor = gcdInt(commonDivisor, c)
	}
	if commonDivisor > 1 {
		for i := range counts {
			counts[i] = counts[i] / commonDivisor
		}
	}
	empirical := ""
	empiricalMass := 0.0
	ratioText := ""
	ratioLabel := ""
	for i := range symbols {
		if counts[i] > 0 {
			if counts[i] > 1 {
				empirical += symbols[i] + jsNumber(float64(counts[i]))
			} else {
				empirical += symbols[i]
			}
		}
		empiricalMass += float64(counts[i]) * masses[i]
		if i > 0 {
			ratioText += ":"
			ratioLabel += ":"
		}
		ratioText += jsNumber(float64(counts[i]))
		ratioLabel += symbols[i]
	}
	value := "Empirical formula: " + empirical
	explanation := "Percent to moles: "
	for i := range symbols {
		if i > 0 {
			explanation += ", "
		}
		explanation += symbols[i] + " " + formatFixed(percents[i], 4) + "% / " + formatFixed(masses[i], 4) + " g/mol = " + formatFixed(moles[i], 4) + " mol"
	}
	explanation += "; Simplest ratio " + ratioLabel + " = " + ratioText
	explanation += "; Empirical formula: " + empirical + "; Empirical formula mass: " + formatFixed(empiricalMass, 4) + " g/mol"
	metadata := CalcMetadata{
		"empiricalFormula":     empirical,
		"empiricalFormulaMass": empiricalMass,
		"symbols":              symbols,
		"counts":               counts,
		"moles":                moles,
	}
	molarMass := optionalFloat(inputs, "ef-molar-mass")
	if !math.IsNaN(molarMass) {
		if molarMass <= 0 {
			return CalcResult{}, errors.New("Molar mass must be positive")
		}
		multiplier := molarMass / empiricalMass
		rounded := math.Round(multiplier)
		if rounded < 1 {
			rounded = 1
		}
		if math.Abs(multiplier-rounded) > 0.05 {
			explanation += "; Warning: the molar mass does not divide evenly by the empirical formula mass (multiplier " + formatFixed(multiplier, 4) + " rounds to " + jsNumber(rounded) + ")"
		}
		molecular := ""
		for i := range symbols {
			molecularCount := counts[i] * int(rounded)
			if molecularCount > 0 {
				if molecularCount > 1 {
					molecular += symbols[i] + jsNumber(float64(molecularCount))
				} else {
					molecular += symbols[i]
				}
			}
		}
		value += "; Molecular formula: " + molecular
		explanation += "; Molar mass: " + formatFixed(molarMass, 4) + " g/mol; Multiplier: " + jsNumber(rounded) + "; Molecular formula: " + molecular
		metadata["molecularFormula"] = molecular
		metadata["molarMass"] = molarMass
		metadata["multiplier"] = rounded
	}
	return CalcResult{Value: value, Explanation: explanation, Metadata: metadata}, nil
}

type isotopeEntry struct {
	Mass      float64 `json:"mass"`
	Abundance float64 `json:"abundance"`
}

func massSpectrometry(inputs map[string]string) (CalcResult, error) {
	raw := inputs["ms-isotopes"]
	if strings.TrimSpace(raw) == "" {
		return CalcResult{}, errors.New("Enter isotope data as mass,abundance pairs separated by semicolons, e.g. 34.97,0.7576;36.97,0.2424")
	}
	var isotopes []isotopeEntry
	totalAbundance := 0.0
	for _, entryRaw := range regexp.MustCompile(`[;\n]+`).Split(raw, -1) {
		entry := strings.TrimSpace(entryRaw)
		if entry == "" {
			continue
		}
		parts := strings.Split(entry, ",")
		if len(parts) != 2 {
			return CalcResult{}, errors.New("Invalid isotope entry: " + entry + ". Use mass,abundance pairs like 34.97,0.7576;36.97,0.2424")
		}
		mass := parseNumber(strings.TrimSpace(parts[0]))
		abundance := parseNumber(strings.TrimSpace(parts[1]))
		if math.IsNaN(mass) || math.IsNaN(abundance) {
			return CalcResult{}, errors.New("Invalid number in data: " + entry)
		}
		if mass <= 0 {
			return CalcResult{}, errors.New("Isotope masses must be positive")
		}
		if abundance < 0 {
			return CalcResult{}, errors.New("Abundances cannot be negative")
		}
		isotopes = append(isotopes, isotopeEntry{Mass: mass, Abundance: abundance})
		totalAbundance += abundance
	}
	if len(isotopes) < 1 {
		return CalcResult{}, errors.New("Enter at least one isotope as mass,abundance")
	}
	if totalAbundance <= 0 {
		return CalcResult{}, errors.New("Abundances must sum to a positive total")
	}
	weightedSum := 0.0
	for _, iso := range isotopes {
		weightedSum += iso.Mass * iso.Abundance
	}
	averageMass := weightedSum / totalAbundance
	elements, err := loadElementData()
	if err != nil {
		return CalcResult{}, err
	}
	if len(elements) == 0 {
		return CalcResult{}, errors.New("Element data is unavailable, so no element could be identified")
	}
	closest := elements[0]
	closestDelta := math.Inf(1)
	for _, e := range elements {
		delta := math.Abs(e.AtomicMass - averageMass)
		if delta < closestDelta {
			closestDelta = delta
			closest = e
		}
	}
	mostAbundant := isotopes[0]
	for i := 1; i < len(isotopes); i++ {
		if isotopes[i].Abundance > mostAbundant.Abundance {
			mostAbundant = isotopes[i]
		}
	}
	isotopeText := ""
	for i, iso := range isotopes {
		if i > 0 {
			isotopeText += "; "
		}
		isotopeText += formatFixed(iso.Mass, 4) + " u at " + formatFixed(iso.Abundance, 4)
	}
	explanation := "Isotopes: " + isotopeText + "; " +
		"Total abundance: " + formatFixed(totalAbundance, 4) + "; " +
		"Average atomic mass = sum(mass * abundance) / total abundance = " + formatFixed(averageMass, 4) + " u; " +
		"Closest element: " + closest.Name + " (" + closest.Symbol + ", Z = " + jsNumber(float64(closest.AtomicNumber)) + ", table atomic mass " + formatFixed(closest.AtomicMass, 4) + " u); " +
		"Most abundant isotope: " + formatFixed(mostAbundant.Mass, 4) + " u"
	return CalcResult{
		Value:       "Average atomic mass: " + formatFixed(averageMass, 4) + " u (closest element: " + closest.Name + ", " + closest.Symbol + ")",
		Explanation: explanation,
		Metadata: CalcMetadata{
			"averageMass":      averageMass,
			"element":          closest.Name,
			"symbol":           closest.Symbol,
			"atomicNumber":     closest.AtomicNumber,
			"mostAbundantMass": mostAbundant.Mass,
			"totalAbundance":   totalAbundance,
			"isotopes":         isotopes,
		},
	}, nil
}
