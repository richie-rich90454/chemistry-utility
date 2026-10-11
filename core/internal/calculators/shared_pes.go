package calculators

import (
	"errors"
	"math"
	"sort"
	"strings"
)

// The calculators in this file are a direct port of
// frontend/src/modules/calculators/advanced.ts. Input keys, validation order,
// error messages, and output strings are kept identical so the conformance
// vectors pass unchanged.

const pesTolerance = 0.25

var pesSubshellOrder = []string{"1s", "2s", "2p", "3s", "3p", "4s"}

type pesPattern struct {
	atomicNumber int
	energies     []float64
}

// ponytail: reference peak positions (MJ/mol) for H through Ca, in descending
// binding-energy order, one entry per occupied subshell. Matching allows 25%
// per-peak slack.
var pesPatterns = []pesPattern{
	{atomicNumber: 1, energies: []float64{1.312}},
	{atomicNumber: 2, energies: []float64{2.372}},
	{atomicNumber: 3, energies: []float64{5.278, 0.520}},
	{atomicNumber: 4, energies: []float64{10.710, 0.899}},
	{atomicNumber: 5, energies: []float64{18.139, 1.351, 0.801}},
	{atomicNumber: 6, energies: []float64{27.424, 1.871, 1.086}},
	{atomicNumber: 7, energies: []float64{39.548, 2.466, 1.402}},
	{atomicNumber: 8, energies: []float64{52.403, 2.748, 1.314}},
	{atomicNumber: 9, energies: []float64{67.231, 3.651, 1.798}},
	{atomicNumber: 10, energies: []float64{83.964, 4.676, 2.090}},
	{atomicNumber: 11, energies: []float64{103.320, 6.106, 2.957, 0.496}},
	{atomicNumber: 12, energies: []float64{125.721, 7.476, 3.887, 0.738}},
	{atomicNumber: 13, energies: []float64{150.423, 9.021, 5.024, 1.025, 0.578}},
	{atomicNumber: 14, energies: []float64{177.436, 10.653, 6.259, 1.311, 0.786}},
	{atomicNumber: 15, energies: []float64{207.006, 12.423, 7.584, 1.567, 1.012}},
	{atomicNumber: 16, energies: []float64{238.512, 14.244, 9.057, 1.949, 1.000}},
	{atomicNumber: 17, energies: []float64{272.331, 16.157, 10.853, 2.369, 1.255}},
	{atomicNumber: 18, energies: []float64{309.039, 18.127, 12.824, 2.822, 1.526}},
	{atomicNumber: 19, energies: []float64{347.500, 20.300, 14.900, 3.339, 2.266, 0.419}},
	{atomicNumber: 20, energies: []float64{389.600, 22.700, 16.800, 3.792, 2.693, 0.605}},
}

type pesSubshellPart struct {
	label     string
	electrons int
}

type pesConfig struct {
	config           string
	parts            []pesSubshellPart
	valenceShell     int
	valenceElectrons int
}

// ponytail: the reference table stops at Ca (Z = 20), so the Aufbau order is
// just 1s 2s 2p 3s 3p 4s and the transition-metal exceptions never apply.
func buildPesConfig(atomicNumber int) pesConfig {
	aufbau := []string{"1s", "2s", "2p", "3s", "3p", "4s"}
	capacity := map[byte]int{'s': 2, 'p': 6}
	remaining := atomicNumber
	var parts []pesSubshellPart
	for i := 0; i < len(aufbau) && remaining > 0; i++ {
		label := aufbau[i]
		electrons := capacity[label[1]]
		if electrons > remaining {
			electrons = remaining
		}
		parts = append(parts, pesSubshellPart{label: label, electrons: electrons})
		remaining -= electrons
	}
	config := ""
	for i, part := range parts {
		if i > 0 {
			config += " "
		}
		config += part.label + jsNumber(float64(part.electrons))
	}
	valenceShell := int(parts[len(parts)-1].label[0] - '0')
	valenceElectrons := 0
	for _, part := range parts {
		if int(part.label[0]-'0') == valenceShell {
			valenceElectrons += part.electrons
		}
	}
	return pesConfig{config: config, parts: parts, valenceShell: valenceShell, valenceElectrons: valenceElectrons}
}

func photoelectronSpectroscopy(inputs map[string]string) (CalcResult, error) {
	raw := inputs["pes-peaks"]
	if strings.TrimSpace(raw) == "" {
		return CalcResult{}, errors.New("Enter PES peak positions in MJ/mol as a comma-separated list, e.g. 1.407, 2.446, 36.847")
	}
	var peaks []float64
	for _, part := range strings.Split(raw, ",") {
		entry := strings.TrimSpace(part)
		if entry == "" {
			continue
		}
		value := parseNumber(entry)
		if math.IsNaN(value) {
			return CalcResult{}, errors.New("Invalid peak value: " + entry)
		}
		if value <= 0 {
			return CalcResult{}, errors.New("Peak positions must be positive numbers")
		}
		peaks = append(peaks, value)
	}
	if len(peaks) < 1 {
		return CalcResult{}, errors.New("Enter at least one PES peak position in MJ/mol")
	}
	if len(peaks) > len(pesSubshellOrder) {
		return CalcResult{}, errors.New("Too many peaks: this PES tool covers hydrogen through calcium (Z = 20), whose spectra have at most " + jsNumber(float64(len(pesSubshellOrder))) + " peaks")
	}
	sort.Slice(peaks, func(i, j int) bool { return peaks[i] > peaks[j] })
	bestZ := 0
	bestDeviation := math.Inf(1)
	for _, pattern := range pesPatterns {
		if len(pattern.energies) != len(peaks) {
			continue
		}
		deviation := 0.0
		for j := range peaks {
			d := math.Abs(peaks[j]-pattern.energies[j]) / pattern.energies[j]
			if d > deviation {
				deviation = d
			}
		}
		if deviation < bestDeviation {
			bestDeviation = deviation
			bestZ = pattern.atomicNumber
		}
	}
	if bestZ == 0 || bestDeviation > pesTolerance {
		return CalcResult{}, errors.New("No element matches this spectrum: check the peak positions (MJ/mol) and try again")
	}
	element, ok := findElementByAtomicNumber(bestZ)
	if !ok {
		return CalcResult{}, errors.New("No element matches this spectrum: check the peak positions (MJ/mol) and try again")
	}
	built := buildPesConfig(bestZ)
	peakList := ""
	for i := range peaks {
		if i > 0 {
			peakList += ", "
		}
		peakList += formatFixed(peaks[i], 4)
	}
	subshellList := ""
	for i := range peaks {
		if i > 0 {
			subshellList += ", "
		}
		electrons := 0
		for _, part := range built.parts {
			if part.label == pesSubshellOrder[i] {
				electrons = part.electrons
			}
		}
		subshellList += pesSubshellOrder[i] + jsNumber(float64(electrons)) + " at " + formatFixed(peaks[i], 4) + " MJ/mol"
	}
	explanation := "Peaks in MJ/mol (largest binding energy first): " + peakList + "; " +
		"Closest reference pattern: " + element.Name + " (" + element.Symbol + ", Z = " + jsNumber(float64(bestZ)) + "), largest peak deviation " + formatFixed(bestDeviation*100, 4) + "%; " +
		"Subshells: " + subshellList + "; " +
		"Electron configuration: " + built.config + "; " +
		"Valence electrons: " + jsNumber(float64(built.valenceElectrons)) + " (outer shell n = " + jsNumber(float64(built.valenceShell)) + ")"
	return CalcResult{
		Value:       element.Name + " (" + element.Symbol + ", Z = " + jsNumber(float64(bestZ)) + "): " + built.config,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"element":               element.Name,
			"symbol":                element.Symbol,
			"atomicNumber":          bestZ,
			"electronConfiguration": built.config,
			"valenceElectrons":      built.valenceElectrons,
			"valenceShell":          built.valenceShell,
			"totalElectrons":        bestZ,
			"peaks":                 peaks,
			"maxDeviation":          bestDeviation,
		},
	}, nil
}
