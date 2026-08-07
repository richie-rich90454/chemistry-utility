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

// toFloat64 coerces JSON-decoded number values to float64.
func toFloat64(v interface{}) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case int:
		return float64(n), true
	case int64:
		return float64(n), true
	default:
		return 0, false
	}
}

// toFloat64Slice converts a JSON-decoded value into a []float64, handling both
// []float64 (from direct Go calls) and []interface{} (from JSON decoding).
func toFloat64Slice(v interface{}) ([]float64, bool) {
	switch s := v.(type) {
	case []float64:
		return s, true
	case []interface{}:
		out := make([]float64, len(s))
		for i, e := range s {
			f, ok := toFloat64(e)
			if !ok {
				return nil, false
			}
			out[i] = f
		}
		return out, true
	default:
		return nil, false
	}
}

// toFloat64Map converts a JSON-decoded value into a map[string]float64,
// handling both map[string]float64 and map[string]interface{}.
func toFloat64Map(v interface{}) (map[string]float64, bool) {
	switch m := v.(type) {
	case map[string]float64:
		return m, true
	case map[string]interface{}:
		out := make(map[string]float64, len(m))
		for k, e := range m {
			f, ok := toFloat64(e)
			if !ok {
				return nil, false
			}
			out[k] = f
		}
		return out, true
	default:
		return nil, false
	}
}
