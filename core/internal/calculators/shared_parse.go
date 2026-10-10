package calculators

import (
	"math"
	"strconv"
	"strings"
)

// Input-parsing helpers shared by the ported calculators. They reproduce the
// behaviour of the JavaScript side, where every input field is read with
// parseFloat up front and a blank or unparsable field becomes NaN, which each
// calculator then reports in its own error message.

// optionalFloat mirrors the frontend's readNumber: an absent or unparsable
// value becomes NaN.
func optionalFloat(inputs map[string]string, key string) float64 {
	raw, ok := inputs[key]
	if !ok {
		return math.NaN()
	}
	return parseNumber(raw)
}

// parseNumber reads the longest numeric prefix of raw and reports failure as
// NaN, which is what the web engine's parseFloat gives a field it cannot read.
func parseNumber(raw string) float64 {
	value, ok := jsParseFloat(raw)
	if !ok {
		return math.NaN()
	}
	return value
}

// isNaNf is spelled out where several comparisons share one branch.
func isNaNf(value float64) bool {
	return math.IsNaN(value)
}

// jsParseFloat mimics JavaScript's parseFloat: the longest numeric prefix
// wins, and anything without one reports false.
func jsParseFloat(raw string) (float64, bool) {
	trimmed := strings.TrimSpace(raw)
	end := 0
	seenDigit := false
	if trimmed != "" && (trimmed[0] == '+' || trimmed[0] == '-') {
		end = 1
	}
	for end < len(trimmed) {
		ch := trimmed[end]
		if ch >= '0' && ch <= '9' {
			seenDigit = true
			end++
			continue
		}
		if ch == '.' {
			end++
			continue
		}
		if (ch == 'e' || ch == 'E') && seenDigit {
			next := end + 1
			if next < len(trimmed) && (trimmed[next] == '+' || trimmed[next] == '-') {
				next++
			}
			if next < len(trimmed) && trimmed[next] >= '0' && trimmed[next] <= '9' {
				for next < len(trimmed) && trimmed[next] >= '0' && trimmed[next] <= '9' {
					next++
				}
				end = next
			}
			break
		}
		break
	}
	candidate := trimmed[:end]
	if !seenDigit {
		return 0, false
	}
	value, err := strconv.ParseFloat(candidate, 64)
	if err != nil {
		return 0, false
	}
	return value, true
}

func anyNaN(values ...float64) bool {
	for _, v := range values {
		if math.IsNaN(v) {
			return true
		}
	}
	return false
}

// optionalInt mirrors parseInt(text, 10), which yields NaN when the text does
// not start with an integer.
func optionalInt(inputs map[string]string, key string) float64 {
	s := strings.TrimSpace(inputs[key])
	i := 0
	if i < len(s) && (s[i] == '+' || s[i] == '-') {
		i++
	}
	digits := i
	for i < len(s) && s[i] >= '0' && s[i] <= '9' {
		i++
	}
	if i == digits {
		return math.NaN()
	}
	value, err := strconv.ParseFloat(s[:i], 64)
	if err != nil {
		return math.NaN()
	}
	return value
}
