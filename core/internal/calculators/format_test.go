package calculators

import (
	"math"
	"testing"
)

func TestFormatFixedMatchesToFixed(t *testing.T) {
	cases := []struct {
		value    float64
		decimals int
		want     string
	}{
		{2, 4, "2.0000"},
		{0.4, 4, "0.4000"},
		{1.0000, 4, "1.0000"},
		{18.015, 3, "18.015"},
		{22.4, 4, "22.4000"},
		{1e-10, 4, "0.0000"},
		{-0.00001, 4, "0.0000"},
		{0, 4, "0.0000"},
		{-2.5, 4, "-2.5000"},
		{1.23456, 2, "1.23"},
		{1.23556, 4, "1.2356"},
		{1234.5678, 0, "1235"},
	}
	for _, c := range cases {
		if got := formatFixed(c.value, c.decimals); got != c.want {
			t.Errorf("formatFixed(%v, %d) = %q, want %q", c.value, c.decimals, got, c.want)
		}
	}
}

func TestFormatFixedSpecialValues(t *testing.T) {
	if got := formatFixed(math.Inf(1), 4); got != "+Inf" {
		t.Errorf("formatFixed(+Inf, 4) = %q, want %q", got, "+Inf")
	}
	if got := formatFixed(math.NaN(), 4); got != "NaN" {
		t.Errorf("formatFixed(NaN, 4) = %q, want %q", got, "NaN")
	}
}
