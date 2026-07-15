package calculators

import (
	"context"
	"fmt"
)

// CalculationInput is a map of field name to value for calculator inputs.
type CalculationInput map[string]interface{}

// BreakdownItem represents a single contribution in a calculation breakdown.
type BreakdownItem struct {
	Label string
	Value float64
	Unit  string
}

// CalculationResult holds the output of a calculator function.
type CalculationResult struct {
	Value    float64
	Unit     string
	Breakdown []BreakdownItem
	Steps    []string
	Metadata map[string]interface{}
}

// CalculatorFunc is the signature for all calculator functions.
type CalculatorFunc func(ctx context.Context, input CalculationInput) (CalculationResult, error)

// getFloat extracts a float64 from the input map by key.
func getFloat(input CalculationInput, key string) (float64, error) {
	v, ok := input[key]
	if !ok {
		return 0, fmt.Errorf("missing required input: %s", key)
	}
	switch val := v.(type) {
	case float64:
		return val, nil
	case int:
		return float64(val), nil
	case int64:
		return float64(val), nil
	default:
		return 0, fmt.Errorf("invalid type for input %s: expected number", key)
	}
}

// getString extracts a string from the input map by key.
func getString(input CalculationInput, key string) (string, error) {
	v, ok := input[key]
	if !ok {
		return "", fmt.Errorf("missing required input: %s", key)
	}
	s, ok := v.(string)
	if !ok {
		return "", fmt.Errorf("invalid type for input %s: expected string", key)
	}
	return s, nil
}

// getFloatWithDefault extracts a float64 or returns a default value.
func getFloatWithDefault(input CalculationInput, key string, defaultVal float64) float64 {
	v, ok := input[key]
	if !ok {
		return defaultVal
	}
	switch val := v.(type) {
	case float64:
		return val
	case int:
		return float64(val)
	case int64:
		return float64(val)
	default:
		return defaultVal
	}
}
