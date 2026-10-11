package calculators

import (
	"errors"
	"math"
	"strings"
)

type vseprRow struct {
	electronGeometry  string
	molecularGeometry string
	bondAngle         string
	hybridization     string
	polarity          string
	angleNote         string
}

var vseprTable = map[string]vseprRow{
	"AX1":   {"linear", "linear", "180", "sp", "nonpolar", ""},
	"AX2":   {"linear", "linear", "180", "sp", "nonpolar", ""},
	"AX2E":  {"trigonal planar", "bent", "120", "sp2", "polar", "The lone pair compresses the angle below the ideal 120 degrees."},
	"AX2E2": {"tetrahedral", "bent", "104.5", "sp3", "polar", "Two lone pairs compress the angle from the ideal 109.5 degrees to about 104.5 degrees."},
	"AX3":   {"trigonal planar", "trigonal planar", "120", "sp2", "nonpolar", ""},
	"AX3E":  {"tetrahedral", "trigonal pyramidal", "107", "sp3", "polar", "The lone pair compresses the angle below the ideal 109.5 degrees."},
	"AX3E2": {"trigonal bipyramidal", "T-shaped", "90", "sp3d", "polar", ""},
	"AX4":   {"tetrahedral", "tetrahedral", "109.5", "sp3", "nonpolar", ""},
	"AX4E":  {"trigonal bipyramidal", "seesaw", "120/90", "sp3d", "polar", ""},
	"AX4E2": {"octahedral", "square planar", "90", "sp3d2", "nonpolar", ""},
	"AX5":   {"trigonal bipyramidal", "trigonal bipyramidal", "120/90", "sp3d", "nonpolar", ""},
	"AX5E":  {"octahedral", "square pyramidal", "90", "sp3d", "polar", ""},
	"AX6":   {"octahedral", "octahedral", "90", "sp3d2", "nonpolar", ""},
}

func vseprGeometry(inputs map[string]string) (CalcResult, error) {
	central := strings.TrimSpace(inputs["vsepr-central"])
	if central == "" {
		return CalcResult{}, errors.New("Central atom is required")
	}
	bondedRaw := optionalFloat(inputs, "vsepr-bonded")
	loneRaw := optionalFloat(inputs, "vsepr-lone-pairs")
	if math.IsNaN(bondedRaw) || bondedRaw < 0 || bondedRaw != math.Floor(bondedRaw) {
		return CalcResult{}, errors.New("Bonded atoms must be a non-negative whole number")
	}
	if math.IsNaN(loneRaw) || loneRaw < 0 || loneRaw != math.Floor(loneRaw) {
		return CalcResult{}, errors.New("Lone pairs must be a non-negative whole number")
	}
	if bondedRaw == 0 && loneRaw == 0 {
		return CalcResult{}, errors.New("A central atom needs at least one bonded atom or one lone pair")
	}
	symbol := strings.ToUpper(central[:1]) + strings.ToLower(central[1:])
	element, ok := findElementBySymbol(symbol)
	if !ok {
		return CalcResult{}, errors.New("Element not found: " + central)
	}
	steric := bondedRaw + loneRaw
	if steric > 6 {
		return CalcResult{}, errors.New("Steric number " + jsNumber(steric) + " is not supported; this calculator covers steric numbers 1 through 6")
	}
	axe := "AX" + jsNumber(bondedRaw)
	if loneRaw > 0 {
		axe += "E"
		if loneRaw > 1 {
			axe += jsNumber(loneRaw)
		}
	}
	row, found := vseprTable[axe]
	if !found {
		return CalcResult{}, errors.New("Unsupported AXE combination: " + axe)
	}
	explanation := "Central atom: " + element.Name + " (" + element.Symbol + "); " +
		"Bonded atoms: " + jsNumber(bondedRaw) + "; " +
		"Lone pairs: " + jsNumber(loneRaw) + "; " +
		"Steric number: " + jsNumber(steric) + "; " +
		"Electron-pair geometry: " + row.electronGeometry + "; " +
		"Molecular geometry: " + row.molecularGeometry + "; " +
		"Ideal bond angle: " + row.bondAngle + " degrees; " +
		"Hybridization: " + row.hybridization + "; " +
		"Polarity: " + row.polarity
	if row.angleNote != "" {
		explanation += "; " + row.angleNote
	}
	if row.polarity == "nonpolar" {
		explanation += "; Nonpolar assumes identical substituents, so the bond dipoles cancel; different substituents can make a symmetric geometry polar"
	}
	return CalcResult{
		Value:       row.molecularGeometry + " (" + axe + "), bond angle " + row.bondAngle + " degrees, " + row.hybridization + ", " + row.polarity,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"centralAtom":       symbol,
			"elementName":       element.Name,
			"bonded":            bondedRaw,
			"lonePairs":         loneRaw,
			"stericNumber":      steric,
			"axe":               axe,
			"electronGeometry":  row.electronGeometry,
			"molecularGeometry": row.molecularGeometry,
			"bondAngle":         row.bondAngle,
			"hybridization":     row.hybridization,
			"polarity":          row.polarity,
		},
	}, nil
}
