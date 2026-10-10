package calculators

import (
	"encoding/json"
	"math"
	"testing"
)

func TestGetFloat_Types(t *testing.T) {
	for _, v := range []interface{}{
		float64(1.5), float32(1.5), int(2), int8(3), int16(4), int32(5), int64(6),
		uint(7), uint8(8), uint16(9), uint32(10), uint64(11), json.Number("12.5"),
	} {
		if got, err := getFloat(CalculationInput{"x": v}, "x"); err != nil || got <= 0 {
			t.Errorf("getFloat(%T) = %v, %v", v, got, err)
		}
	}
	for _, bad := range []CalculationInput{
		{},
		{"x": "nope"},
		{"x": math.NaN()},
		{"x": math.Inf(1)},
		{"x": math.Inf(-1)},
		{"x": json.Number("bogus")},
		{"x": nil},
		{"x": true},
	} {
		if _, err := getFloat(bad, "x"); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestGetString_Types(t *testing.T) {
	if got, err := getString(CalculationInput{"s": "hi"}, "s"); err != nil || got != "hi" {
		t.Errorf("getString = %q, %v", got, err)
	}
	for _, bad := range []CalculationInput{{}, {"s": 42}} {
		if _, err := getString(bad, "s"); err == nil {
			t.Errorf("expected error for %+v", bad)
		}
	}
	if got := getStringWithDefault(CalculationInput{"s": "a"}, "s", "d"); got != "a" {
		t.Errorf("default kept = %q", got)
	}
	if got := getStringWithDefault(CalculationInput{}, "s", "d"); got != "d" {
		t.Errorf("default used = %q", got)
	}
	if got := getStringWithDefault(CalculationInput{"s": 42}, "s", "d"); got != "d" {
		t.Errorf("non-string default = %q", got)
	}
}

func TestGetFloatWithDefault_Types(t *testing.T) {
	if got := getFloatWithDefault(CalculationInput{}, "x", 3.0); got != 3.0 {
		t.Errorf("missing = %v", got)
	}
	if got := getFloatWithDefault(CalculationInput{"x": 1.5}, "x", 3.0); got != 1.5 {
		t.Errorf("float = %v", got)
	}
	if got := getFloatWithDefault(CalculationInput{"x": 2}, "x", 3.0); got != 2.0 {
		t.Errorf("int = %v", got)
	}
	if got := getFloatWithDefault(CalculationInput{"x": int64(4)}, "x", 3.0); got != 4.0 {
		t.Errorf("int64 = %v", got)
	}
	if got := getFloatWithDefault(CalculationInput{"x": "s"}, "x", 3.0); got != 3.0 {
		t.Errorf("bad type = %v", got)
	}
	if got := getFloatWithDefault(CalculationInput{"x": math.NaN()}, "x", 3.0); got != 3.0 {
		t.Errorf("NaN = %v", got)
	}
	if got := getFloatWithDefault(CalculationInput{"x": math.Inf(1)}, "x", 3.0); got != 3.0 {
		t.Errorf("Inf = %v", got)
	}
}

func TestToFloat64_AllKinds(t *testing.T) {
	for _, v := range []interface{}{
		float64(1), float32(1), int(1), int8(1), int16(1), int32(1), int64(1),
		uint(1), uint8(1), uint16(1), uint32(1), uint64(1), json.Number("2.5"),
	} {
		if got, ok := toFloat64(v); !ok || got <= 0 {
			t.Errorf("toFloat64(%T) = %v, %v", v, got, ok)
		}
	}
	for _, v := range []interface{}{"s", nil, true, json.Number("bogus"), []int{1}} {
		if _, ok := toFloat64(v); ok {
			t.Errorf("expected false for %T", v)
		}
	}
}

func TestToFloat64Slice_AllKinds(t *testing.T) {
	if _, ok := toFloat64Slice([]float64{1.0, 2.0}); !ok {
		t.Error("[]float64 failed")
	}
	if _, ok := toFloat64Slice([]float64{1.0, math.NaN()}); ok {
		t.Error("NaN slice should fail")
	}
	if _, ok := toFloat64Slice([]float64{1.0, math.Inf(-1)}); ok {
		t.Error("Inf slice should fail")
	}
	if got, ok := toFloat64Slice([]interface{}{1.0, 2}); !ok || len(got) != 2 {
		t.Error("[]interface{} failed")
	}
	if _, ok := toFloat64Slice([]interface{}{1.0, "x"}); ok {
		t.Error("bad element should fail")
	}
	if _, ok := toFloat64Slice([]interface{}{1.0, math.NaN()}); ok {
		t.Error("NaN element should fail")
	}
	if _, ok := toFloat64Slice("nope"); ok {
		t.Error("string should fail")
	}
	if _, ok := toFloat64Slice([]int{1, 2}); ok {
		t.Error("[]int should fail")
	}
}

func TestToFloat64Map_AllKinds(t *testing.T) {
	if _, ok := toFloat64Map(map[string]float64{"a": 1.0}); !ok {
		t.Error("map[string]float64 failed")
	}
	if got, ok := toFloat64Map(map[string]int{"a": 2}); !ok || got["a"] != 2.0 {
		t.Error("map[string]int failed")
	}
	if got, ok := toFloat64Map(map[string]interface{}{"a": 1.0}); !ok || got["a"] != 1.0 {
		t.Error("map[string]interface{} failed")
	}
	if _, ok := toFloat64Map(map[string]interface{}{"a": "x"}); ok {
		t.Error("bad value should fail")
	}
	if _, ok := toFloat64Map(map[string]string{"a": "x"}); ok {
		t.Error("wrong map type should fail")
	}
	if _, ok := toFloat64Map("nope"); ok {
		t.Error("string should fail")
	}
}
