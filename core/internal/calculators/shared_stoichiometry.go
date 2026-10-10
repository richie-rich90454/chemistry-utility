package calculators

import (
	"errors"
	"math"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"
)

// The calculators in this file are a direct port of
// frontend/src/modules/calculators/stoichiometry.ts, including its equation
// parsing, which in turn relies on the arrow normalization from the
// fast-balance package. Input keys, validation order, error messages, and
// output strings are kept identical so the conformance vectors pass
// unchanged.

type stochTerm struct {
	formula     string
	coefficient int
}

type stochEquation struct {
	reactants []stochTerm
	products  []stochTerm
}

var (
	// Arrow shapes recognized by fast-balance's normalizeArrows.
	arrowChars       = regexp.MustCompile(`[→⇒⇌↔⇋⇀⇁]|<=>|<->|--+>|=>|==`)
	arrowAfterGap    = regexp.MustCompile(`->\[([^\]]*)\]`)
	arrowBeforeGap   = regexp.MustCompile(`\[([^\]]*)\]->`)
	arrowWord        = regexp.MustCompile(`-{1,}[^\s()[\]]*[^\s()[\]]->`)
	conditionArrow   = regexp.MustCompile(`->\s*(?:Δ|delta|heat|hv|hν|light|catalyst|cat)\b`)
	dashToArrow      = regexp.MustCompile(`[-=]{1,}>`)
	upDownArrow      = regexp.MustCompile(`[↑↓]`)
	bracketGroup     = regexp.MustCompile(`[()[\]]`)
	equationSplitter = regexp.MustCompile(`->|=`)
	termPattern      = regexp.MustCompile(`^(\d+)?(.+)$`)
	whitespace       = regexp.MustCompile(`\s+`)
	idUnsafe         = regexp.MustCompile(`[^A-Za-z0-9_-]`)
	idDashes         = regexp.MustCompile(`-+`)
)

const (
	subscriptDigits = "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089"
	superscriptPows = "\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079"
)

// normalizeText folds the Unicode forms fast-balance accepts into the plain
// ASCII the equation parser expects.
func normalizeText(input string) string {
	var out strings.Builder
	inPower := false
	for _, r := range input {
		if i := runeIndexOf(subscriptDigits, r); i >= 0 {
			out.WriteString(strconv.Itoa(i))
			inPower = false
			continue
		}
		if i := runeIndexOf(superscriptPows, r); i >= 0 {
			if !inPower {
				out.WriteByte('^')
				inPower = true
			}
			out.WriteString(strconv.Itoa(i))
			continue
		}
		switch r {
		case '\u207A':
			out.WriteByte('+')
		case '\u207B', '\u2212', '\u2013', '\u2010', '\u2011', '\u2014':
			out.WriteByte('-')
		case '\u00B7', '\u2022', '\u2219', '\u22C5', '\uFF0A':
			out.WriteByte('\u00B7')
		default:
			out.WriteRune(r)
		}
		inPower = false
	}
	return out.String()
}

// runeIndexOf is String.indexOf for single runes: it reports the rune
// position, not the byte offset IndexRune returns.
func runeIndexOf(s string, r rune) int {
	byteAt := strings.IndexRune(s, r)
	if byteAt < 0 {
		return -1
	}
	return utf8.RuneCountInString(s[:byteAt])
}

// normalizeArrows is a direct port of fast-balance's normalizeArrows, which
// every equation passes through before parsing.
func normalizeArrows(input string) string {
	s := normalizeText(input)
	s = arrowChars.ReplaceAllString(s, "->")
	s = arrowAfterGap.ReplaceAllStringFunc(s, func(m string) string {
		inner := m[3 : len(m)-1]
		if bracketGroup.MatchString(inner) {
			return m
		}
		return "->"
	})
	s = arrowBeforeGap.ReplaceAllStringFunc(s, func(m string) string {
		inner := m[1 : len(m)-2]
		if bracketGroup.MatchString(inner) {
			return m
		}
		return "->"
	})
	s = arrowWord.ReplaceAllString(s, "->")
	s = strings.ReplaceAll(s, "=", "->")
	s = conditionArrow.ReplaceAllString(s, "->")
	s = dashToArrow.ReplaceAllString(s, "->")
	return upDownArrow.ReplaceAllString(s, "")
}

// parseTerm parses one term ("2H2O") into a plain record.
func parseTerm(term string) (stochTerm, error) {
	match := termPattern.FindStringSubmatch(term)
	if match == nil {
		return stochTerm{}, errors.New("Invalid term: " + term)
	}
	coefficient := 1
	if match[1] != "" {
		parsed, err := strconv.Atoi(match[1])
		if err != nil {
			return stochTerm{}, errors.New("Invalid term: " + term)
		}
		coefficient = parsed
	}
	return stochTerm{formula: match[2], coefficient: coefficient}, nil
}

// parseBalancedEquation parses a balanced equation into plain reactant and
// product records.
func parseBalancedEquation(equation string) (stochEquation, error) {
	normalized := normalizeArrows(equation)
	cleaned := whitespace.ReplaceAllString(normalized, "")
	parts := equationSplitter.Split(cleaned, -1)
	if len(parts) != 2 {
		return stochEquation{}, errors.New("Invalid equation format: missing \"->\"")
	}
	var parsed stochEquation
	for _, term := range strings.Split(parts[0], "+") {
		t, err := parseTerm(term)
		if err != nil {
			return stochEquation{}, err
		}
		parsed.reactants = append(parsed.reactants, t)
	}
	for _, term := range strings.Split(parts[1], "+") {
		t, err := parseTerm(term)
		if err != nil {
			return stochEquation{}, err
		}
		parsed.products = append(parsed.products, t)
	}
	return parsed, nil
}

func findStochTerm(terms []stochTerm, formula string) (stochTerm, bool) {
	for _, t := range terms {
		if t.formula == formula {
			return t, true
		}
	}
	return stochTerm{}, false
}

// sanitizeId makes a chemical formula safe to use as a DOM element id, which
// is also how the per-species "moles-&lt;formula&gt;" inputs are keyed.
func sanitizeId(formula string) string {
	safe := idDashes.ReplaceAllString(idUnsafe.ReplaceAllString(formula, "-"), "-")
	safe = strings.Trim(safe, "-")
	if safe == "" {
		return "formula"
	}
	return safe
}

func stoichiometry(inputs map[string]string) (CalcResult, error) {
	equation := inputs["equation"]
	calculationType := inputs["calculation-type"]
	parsed, err := parseBalancedEquation(equation)
	if err != nil {
		return CalcResult{}, err
	}
	reactants := parsed.reactants
	products := parsed.products

	switch calculationType {
	case "product-from-reactant":
		reactantFormula := inputs["reactant-select"]
		molesReactant := optionalFloat(inputs, "reactant-moles")
		productFormula := inputs["product-select"]
		if math.IsNaN(molesReactant) || molesReactant <= 0 {
			return CalcResult{}, errors.New("Invalid moles input")
		}
		reactant, okReactant := findStochTerm(reactants, reactantFormula)
		product, okProduct := findStochTerm(products, productFormula)
		if !okReactant || !okProduct {
			return CalcResult{}, errors.New("Selected compound not found")
		}
		molesProduct := (molesReactant / float64(reactant.coefficient)) * float64(product.coefficient)
		formatted := formatFixed(molesProduct, 2)
		return CalcResult{
			Value: "Moles of " + productFormula + ": " + formatted,
			Explanation: "molesProduct = (molesReactant / reactant_coefficient) * product_coefficient = (" +
				jsNumber(molesReactant) + " / " + strconv.Itoa(reactant.coefficient) + ") * " +
				strconv.Itoa(product.coefficient) + " = " + formatted,
			Metadata: CalcMetadata{
				"calculationType": calculationType,
				"reactant":        reactantFormula,
				"product":         productFormula,
				"molesReactant":   molesReactant,
				"molesProduct":    molesProduct,
			},
		}, nil

	case "reactant-from-product":
		productFormula := inputs["product-select"]
		molesProduct := optionalFloat(inputs, "product-moles")
		reactantFormula := inputs["reactant-select"]
		if math.IsNaN(molesProduct) || molesProduct <= 0 {
			return CalcResult{}, errors.New("Invalid moles input")
		}
		product, okProduct := findStochTerm(products, productFormula)
		reactant, okReactant := findStochTerm(reactants, reactantFormula)
		if !okProduct || !okReactant {
			return CalcResult{}, errors.New("Selected compound not found")
		}
		molesReactant := (molesProduct / float64(product.coefficient)) * float64(reactant.coefficient)
		formatted := formatFixed(molesReactant, 2)
		return CalcResult{
			Value: "Moles of " + reactantFormula + ": " + formatted,
			Explanation: "molesReactant = (molesProduct / product_coefficient) * reactant_coefficient = (" +
				jsNumber(molesProduct) + " / " + strconv.Itoa(product.coefficient) + ") * " +
				strconv.Itoa(reactant.coefficient) + " = " + formatted,
			Metadata: CalcMetadata{
				"calculationType": calculationType,
				"reactant":        reactantFormula,
				"product":         productFormula,
				"molesReactant":   molesReactant,
				"molesProduct":    molesProduct,
			},
		}, nil

	case "limiting-reactant":
		reactantMoles := map[string]float64{}
		for _, reactant := range reactants {
			moles := optionalFloat(inputs, "moles-"+sanitizeId(reactant.formula))
			if math.IsNaN(moles) || moles <= 0 {
				return CalcResult{}, errors.New("Invalid moles for " + reactant.formula)
			}
			reactantMoles[reactant.formula] = moles
		}
		productFormula := inputs["product-select"]
		product, okProduct := findStochTerm(products, productFormula)
		if !okProduct {
			return CalcResult{}, errors.New("Selected product not found")
		}
		minRatio := math.Inf(1)
		limitingReactant := ""
		for _, reactant := range reactants {
			ratio := reactantMoles[reactant.formula] / float64(reactant.coefficient)
			if ratio < minRatio {
				minRatio = ratio
				limitingReactant = reactant.formula
			}
		}
		molesProduct := minRatio * float64(product.coefficient)
		formattedRatio := formatFixed(minRatio, 4)
		formattedProduct := formatFixed(molesProduct, 2)
		return CalcResult{
			Value: "Limiting reactant: " + limitingReactant + "; Moles of " + productFormula + ": " + formattedProduct,
			Explanation: "minRatio = min(moles_i / coeff_i) = " + formattedRatio + " (limiting: " + limitingReactant + "); " +
				"molesProduct = minRatio * product_coefficient = " + formattedRatio + " * " +
				strconv.Itoa(product.coefficient) + " = " + formattedProduct,
			Metadata: CalcMetadata{
				"calculationType":  calculationType,
				"limitingReactant": limitingReactant,
				"product":          productFormula,
				"reactantMoles":    reactantMoles,
				"minRatio":         minRatio,
				"molesProduct":     molesProduct,
			},
		}, nil

	default:
		return CalcResult{}, errors.New("Invalid calculation type")
	}
}
