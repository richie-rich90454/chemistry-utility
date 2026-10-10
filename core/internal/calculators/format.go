package calculators

import (
	"math"
	"strconv"
)

// CalcResult is the shared contract with the web engine. It mirrors the
// TypeScript CalculatorResult exactly, field for field, so the conformance
// vectors compare equal across both implementations.
//
// Value and Explanation are display strings. ChartData carries series data
// for the chart layer. Metadata holds machine-readable extras.
//
// Go never formats numbers through locale-aware machinery: the frontend
// formats once. Calculators here build strings with formatFixed at the same
// decimal count the TypeScript side uses, which is what keeps them equal.
type CalcResult struct {
	Value       string       `json:"value"`
	Explanation string       `json:"explanation,omitempty"`
	ChartData   []ChartData  `json:"chartData,omitempty"`
	Metadata    CalcMetadata `json:"metadata,omitempty"`
}

// ChartData is one series sample. The web engine emits named points, so the
// field set is open rather than x/y locked.
type ChartData map[string]float64

// CalcMetadata is a calculator's machine-readable extras, matching the
// TypeScript metadata record.
type CalcMetadata map[string]interface{}

// The web engine formats numbers with toFixed at a fixed decimal count, then
// passes the result through Intl.NumberFormat with the same fraction digits
// and grouping disabled. For the "en" locale the app ships, that reduces to
// toFixed, so the same is done here.
//
// Negative zero is normalized to positive zero because toFixed renders it
// without the sign.
func formatFixed(value float64, decimals int) string {
	if math.IsNaN(value) || math.IsInf(value, 0) {
		return strconv.FormatFloat(value, 'f', -1, 64)
	}
	rounded := value
	if decimals > 0 {
		pow := math.Pow(10, float64(decimals))
		rounded = math.Round(value*pow) / pow
	}
	text := strconv.FormatFloat(rounded, 'f', decimals, 64)
	if len(text) > 1 && text[0] == '-' && isZeroAfterSign(text) {
		return text[1:]
	}
	return text
}

func isZeroAfterSign(text string) bool {
	for i := 1; i < len(text); i++ {
		if text[i] != '0' && text[i] != '.' {
			return false
		}
	}
	return true
}
