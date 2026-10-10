package calculators

import (
	"math"
	"strconv"
	"strings"
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
	text := toFixedString(value, decimals)
	// Intl re-parses the toFixed text and prints the shortest decimal that
	// reads back as the same double, padded out to the requested fraction
	// digits. That is why 456778611111111.125 renders as
	// "456778611111111.1000" instead of exposing the exact binary digits.
	reparsed, err := strconv.ParseFloat(text, 64)
	if err != nil {
		return normalizeNegativeZero(text)
	}
	shortest := strconv.FormatFloat(reparsed, 'f', -1, 64)
	if decimals > 0 {
		shortest = padToDecimals(shortest, decimals)
	}
	return normalizeNegativeZero(shortest)
}

// toFixedString reproduces Number.prototype.toFixed: round the exact value
// half away from zero. math.Round does that while value*10^decimals stays
// exactly representable; past 2^53 the scaled value loses precision, so the
// direct conversion rounds the true binary value instead.
func toFixedString(value float64, decimals int) string {
	pow := math.Pow(10, float64(decimals))
	scaled := value * pow
	if math.Abs(scaled) < (1 << 53) {
		return strconv.FormatFloat(math.Round(scaled)/pow, 'f', decimals, 64)
	}
	return strconv.FormatFloat(value, 'f', decimals, 64)
}

// padToDecimals pads a shortest-form decimal to exactly decimals fraction
// digits, rounding instead if it somehow carries more.
func padToDecimals(shortest string, decimals int) string {
	dot := strings.IndexByte(shortest, '.')
	if dot < 0 {
		return shortest + "." + strings.Repeat("0", decimals)
	}
	frac := shortest[dot+1:]
	if len(frac) == decimals {
		return shortest
	}
	if len(frac) > decimals {
		value, err := strconv.ParseFloat(shortest, 64)
		if err != nil {
			return shortest
		}
		return strconv.FormatFloat(value, 'f', decimals, 64)
	}
	return shortest + strings.Repeat("0", decimals-len(frac))
}

// normalizeNegativeZero drops the sign a toFixed text would not print.
func normalizeNegativeZero(text string) string {
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

// jsNumber renders a float the way JavaScript renders it inside string
// concatenation, which is what the TypeScript calculators rely on when a raw
// number is interpolated into a value or explanation.
func jsNumber(value float64) string {
	switch {
	case math.IsNaN(value):
		return "NaN"
	case math.IsInf(value, 1):
		return "Infinity"
	case math.IsInf(value, -1):
		return "-Infinity"
	}
	if math.Abs(value) >= 1e21 || (value != 0 && math.Abs(value) < 1e-6) {
		return strconv.FormatFloat(value, 'g', -1, 64)
	}
	return strconv.FormatFloat(value, 'f', -1, 64)
}
