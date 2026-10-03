package calculators

import (
	"context"
	"errors"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
)

// StoichTerm represents a term in a balanced equation with a coefficient and formula.
type StoichTerm struct {
	Formula     string
	Coefficient float64
}

// parseStoichTerm parses a term like "2H2O" into coefficient=2, formula="H2O".
// Supports integer and decimal coefficients ("0.5H2", "2.5H2O"); a missing
// coefficient defaults to 1.
func parseStoichTerm(term string) StoichTerm {
	term = strings.TrimSpace(term)
	re := regexp.MustCompile(`^(\d*\.?\d+)?(.+)$`)
	matches := re.FindStringSubmatch(term)
	if matches == nil {
		return StoichTerm{Formula: term, Coefficient: 1}
	}
	coeff := 1.0
	if matches[1] != "" {
		var err error
		coeff, err = strconv.ParseFloat(matches[1], 64)
		if err != nil || math.IsNaN(coeff) || math.IsInf(coeff, 0) {
			coeff = 1.0
		}
	}
	formula := strings.TrimSpace(matches[2])
	if formula == "" {
		formula = term
		coeff = 1.0
	}
	return StoichTerm{Formula: formula, Coefficient: coeff}
}

// parseStoichEquation parses a balanced equation into reactant and product terms.
// Uses the charge-aware term splitter from ParseEquation so ion equations
// like "Na+ + Cl- -> NaCl" parse correctly.
func parseStoichEquation(equation string) (reactants []StoichTerm, products []StoichTerm, err error) {
	reactantTerms, productTerms, err := ParseEquation(equation)
	if err != nil {
		return nil, nil, err
	}
	for _, term := range reactantTerms {
		reactants = append(reactants, parseStoichTerm(term))
	}
	for _, term := range productTerms {
		products = append(products, parseStoichTerm(term))
	}
	return reactants, products, nil
}

// Stoichiometry performs stoichiometric calculations.
// Input keys: "equation", "mode" ("product-from-reactant", "reactant-from-product", "limiting-reactant"),
// "reactantFormula" (for product-from-reactant mode),
// "productFormula" (for reactant-from-product mode),
// "moles" (moles of reactant or product depending on mode),
// "reactantMoles" (map for limiting reactant mode),
// "targetProduct" (product formula for limiting reactant).
func Stoichiometry(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	equation, err := getString(input, "equation")
	if err != nil {
		return CalculationResult{}, err
	}
	mode := getStringWithDefault(input, "mode", "product-from-reactant")

	reactants, products, err := parseStoichEquation(equation)
	if err != nil {
		return CalculationResult{}, err
	}
	if len(reactants) == 0 || len(products) == 0 {
		return CalculationResult{}, errors.New("equation must have at least one reactant and one product")
	}
	for _, r := range reactants {
		if r.Coefficient <= 0 || math.IsNaN(r.Coefficient) || math.IsInf(r.Coefficient, 0) {
			return CalculationResult{}, fmt.Errorf("invalid coefficient for reactant %s", r.Formula)
		}
	}
	for _, p := range products {
		if p.Coefficient <= 0 || math.IsNaN(p.Coefficient) || math.IsInf(p.Coefficient, 0) {
			return CalculationResult{}, fmt.Errorf("invalid coefficient for product %s", p.Formula)
		}
	}

	switch mode {
	case "product-from-reactant":
		reactantFormula, err := getString(input, "reactantFormula")
		if err != nil {
			return CalculationResult{}, err
		}
		productFormula, err := getString(input, "productFormula")
		if err != nil {
			return CalculationResult{}, err
		}
		moles, err := getFloat(input, "moles")
		if err != nil {
			return CalculationResult{}, err
		}
		if moles <= 0 {
			return CalculationResult{}, errors.New("moles must be positive")
		}

		var reactant *StoichTerm
		for i := range reactants {
			if reactants[i].Formula == reactantFormula {
				reactant = &reactants[i]
				break
			}
		}
		var product *StoichTerm
		for i := range products {
			if products[i].Formula == productFormula {
				product = &products[i]
				break
			}
		}
		if reactant == nil || product == nil {
			return CalculationResult{}, errors.New("selected compound not found in equation")
		}

		molesProduct := (moles / reactant.Coefficient) * product.Coefficient

		return CalculationResult{
			Value: molesProduct,
			Unit:  "mol",
			Steps: []string{
				fmt.Sprintf("moles of %s = (%.4f / %.4f) × %.4f = %.4f mol",
					productFormula, moles, reactant.Coefficient, product.Coefficient, molesProduct),
			},
		}, nil

	case "reactant-from-product":
		productFormula, err := getString(input, "productFormula")
		if err != nil {
			return CalculationResult{}, err
		}
		reactantFormula, err := getString(input, "reactantFormula")
		if err != nil {
			return CalculationResult{}, err
		}
		moles, err := getFloat(input, "moles")
		if err != nil {
			return CalculationResult{}, err
		}
		if moles <= 0 {
			return CalculationResult{}, errors.New("moles must be positive")
		}

		var product *StoichTerm
		for i := range products {
			if products[i].Formula == productFormula {
				product = &products[i]
				break
			}
		}
		var reactant *StoichTerm
		for i := range reactants {
			if reactants[i].Formula == reactantFormula {
				reactant = &reactants[i]
				break
			}
		}
		if product == nil || reactant == nil {
			return CalculationResult{}, errors.New("selected compound not found in equation")
		}

		molesReactant := (moles / product.Coefficient) * reactant.Coefficient

		return CalculationResult{
			Value: molesReactant,
			Unit:  "mol",
			Steps: []string{
				fmt.Sprintf("moles of %s = (%.4f / %.4f) × %.4f = %.4f mol",
					reactantFormula, moles, product.Coefficient, reactant.Coefficient, molesReactant),
			},
		}, nil

	case "limiting-reactant":
		reactantMolesVal, ok := input["reactantMoles"]
		if !ok {
			return CalculationResult{}, errors.New("missing required input: reactantMoles")
		}
		reactantMolesMap, ok := toFloat64Map(reactantMolesVal)
		if !ok {
			return CalculationResult{}, errors.New("reactantMoles must be a map[string]float64")
		}
		targetProduct, err := getString(input, "targetProduct")
		if err != nil {
			return CalculationResult{}, err
		}

		var product *StoichTerm
		for i := range products {
			if products[i].Formula == targetProduct {
				product = &products[i]
				break
			}
		}
		if product == nil {
			return CalculationResult{}, errors.New("target product not found in equation")
		}

		minRatio := math.Inf(1)
		var limitingReactant string

		for _, reactant := range reactants {
			moles, ok := reactantMolesMap[reactant.Formula]
			if !ok || moles <= 0 {
				return CalculationResult{}, fmt.Errorf("invalid moles for reactant %s", reactant.Formula)
			}
			ratio := moles / reactant.Coefficient
			if ratio < minRatio {
				minRatio = ratio
				limitingReactant = reactant.Formula
			}
		}

		molesProduct := minRatio * product.Coefficient

		return CalculationResult{
			Value: molesProduct,
			Unit:  "mol",
			Steps: []string{
				fmt.Sprintf("Limiting reactant: %s", limitingReactant),
				fmt.Sprintf("Moles of %s: %.4f mol", targetProduct, molesProduct),
			},
			Metadata: map[string]interface{}{
				"limitingReactant": limitingReactant,
			},
		}, nil

	default:
		return CalculationResult{}, fmt.Errorf("invalid mode: %s", mode)
	}
}
