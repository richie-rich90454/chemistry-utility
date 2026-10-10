package calculators

import (
	"errors"
	"math"
	"regexp"
	"strings"
)

// The calculators in this file are a direct port of
// frontend/src/modules/calculators/kinetics.ts. Input keys, validation order,
// error messages, and output strings are kept identical so the conformance
// vectors pass unchanged.

const (
	gasConstant          = 8.314
	seriesSteps          = 30
	seriesDefaultEndTime = 10
)

var orderGrid = []float64{0, 0.5, 1, 1.5, 2, 2.5, 3}

type dataPoint struct {
	t float64
	c float64
}

func arrhenius(inputs map[string]string) (CalcResult, error) {
	solveFor := inputs["arrhenius-solve-for"]
	a := optionalFloat(inputs, "arrhenius-A")
	ea := optionalFloat(inputs, "arrhenius-Ea")
	t := optionalFloat(inputs, "arrhenius-T")
	k := optionalFloat(inputs, "arrhenius-k")
	eaJ := ea * 1000

	var result float64
	var unit string
	var formula string
	switch solveFor {
	case "k":
		if anyNaN(a, ea, t) {
			return CalcResult{}, errors.New("Missing or invalid inputs for arrhenius-A, arrhenius-Ea, arrhenius-T")
		}
		if t <= 0 {
			return CalcResult{}, errors.New("Temperature must be positive")
		}
		if a <= 0 {
			return CalcResult{}, errors.New("Frequency factor A must be positive")
		}
		result = a * math.Exp(-eaJ/(gasConstant*t))
		unit = "s\u207B\u00B9"
		formula = "k = A\u00B7e^(-Ea/RT)"
	case "Ea":
		if anyNaN(a, t, k) {
			return CalcResult{}, errors.New("Missing or invalid inputs for arrhenius-A, arrhenius-T, arrhenius-k")
		}
		if t <= 0 {
			return CalcResult{}, errors.New("Temperature must be positive")
		}
		if a <= 0 {
			return CalcResult{}, errors.New("Frequency factor A must be positive")
		}
		if k <= 0 {
			return CalcResult{}, errors.New("Rate constant k must be positive")
		}
		result = (-gasConstant * t * math.Log(k/a)) / 1000
		unit = "kJ/mol"
		formula = "Ea = -RT\u00B7ln(k/A)"
	case "T":
		if anyNaN(a, ea, k) {
			return CalcResult{}, errors.New("Missing or invalid inputs for arrhenius-A, arrhenius-Ea, arrhenius-k")
		}
		if a <= 0 {
			return CalcResult{}, errors.New("Frequency factor A must be positive")
		}
		if k <= 0 {
			return CalcResult{}, errors.New("Rate constant k must be positive")
		}
		if k >= a {
			return CalcResult{}, errors.New("k must be less than A for a valid temperature")
		}
		result = -eaJ / (gasConstant * math.Log(k/a))
		unit = "K"
		formula = "T = -Ea/(R\u00B7ln(k/A))"
	case "A":
		if anyNaN(ea, t, k) {
			return CalcResult{}, errors.New("Missing or invalid inputs for arrhenius-Ea, arrhenius-T, arrhenius-k")
		}
		if t <= 0 {
			return CalcResult{}, errors.New("Temperature must be positive")
		}
		if k <= 0 {
			return CalcResult{}, errors.New("Rate constant k must be positive")
		}
		result = k / math.Exp(-eaJ/(gasConstant*t))
		unit = "s\u207B\u00B9"
		formula = "A = k / e^(-Ea/RT)"
	default:
		return CalcResult{}, errors.New("Invalid solveFor value")
	}

	formatted := formatFixed(result, 4)
	return CalcResult{
		Value:       formatted + " " + unit,
		Explanation: formula + " = " + formatted + " " + unit,
		Metadata: CalcMetadata{
			"formula": formula,
			"result":  result,
			"unit":    unit,
		},
	}, nil
}

func rateLaw(inputs map[string]string) (CalcResult, error) {
	a1 := optionalFloat(inputs, "ratelaw-A1")
	b1 := optionalFloat(inputs, "ratelaw-B1")
	rate1 := optionalFloat(inputs, "ratelaw-rate1")
	a2 := optionalFloat(inputs, "ratelaw-A2")
	b2 := optionalFloat(inputs, "ratelaw-B2")
	rate2 := optionalFloat(inputs, "ratelaw-rate2")
	if anyNaN(a1, b1, rate1, a2, b2, rate2) {
		return CalcResult{}, errors.New("Missing or invalid inputs for ratelaw-A1, ratelaw-B1, ratelaw-rate1, ratelaw-A2, ratelaw-B2, ratelaw-rate2")
	}
	if a1 <= 0 || a2 <= 0 {
		return CalcResult{}, errors.New("Concentrations of A must be positive")
	}
	if b1 <= 0 || b2 <= 0 {
		return CalcResult{}, errors.New("Concentrations of B must be positive")
	}
	if rate1 <= 0 || rate2 <= 0 {
		return CalcResult{}, errors.New("Rates must be positive")
	}

	var m float64
	var n float64
	orderNote := ""
	fitError := math.NaN()
	if math.Abs(b1-b2) < 1e-10 {
		if math.Abs(a1-a2) < 1e-10 {
			return CalcResult{}, errors.New("Experiments must differ in at least one concentration")
		}
		m = math.Round((math.Log(rate2/rate1)/math.Log(a2/a1))*100) / 100
		n = 0
		orderNote = "Order n is underdetermined: B does not vary, so n is reported as 0 (not measurable from these experiments)."
	} else if math.Abs(a1-a2) < 1e-10 {
		n = math.Round((math.Log(rate2/rate1)/math.Log(b2/b1))*100) / 100
		m = 0
		orderNote = "Order m is underdetermined: A does not vary, so m is reported as 0 (not measurable from these experiments)."
	} else {
		bestM := 0.0
		bestN := 0.0
		bestError := math.Inf(1)
		rateRatio := rate2 / rate1
		aRatio := a2 / a1
		bRatio := b2 / b1
		for _, mi := range orderGrid {
			for _, ni := range orderGrid {
				err := math.Abs(math.Pow(aRatio, mi)*math.Pow(bRatio, ni) - rateRatio)
				if err < bestError {
					bestError = err
					bestM = mi
					bestN = ni
				}
			}
		}
		m = bestM
		n = bestN
		fitError = bestError
	}

	k := rate1 / (math.Pow(a1, m) * math.Pow(b1, n))
	expression := "rate = " + formatFixed(k, 4)
	if m != 0 {
		if m == 1 {
			expression += "[A]"
		} else {
			expression += "[A]^" + jsNumber(m)
		}
	}
	if n != 0 {
		if n == 1 {
			expression += "[B]"
		} else {
			expression += "[B]^" + jsNumber(n)
		}
	}
	kFormatted := formatFixed(k, 4)
	explanation := "Order with respect to A: " + jsNumber(m) + "; Order with respect to B: " + jsNumber(n) +
		"; Rate constant k = " + kFormatted + "; Rate law: " + expression
	if orderNote != "" {
		explanation += "; " + orderNote
	}
	if !math.IsNaN(fitError) {
		explanation += "; grid-search fit error = " + formatFixed(fitError, 6)
	}

	metadata := CalcMetadata{"orderA": m, "orderB": n, "k": k, "rateLaw": expression, "underdeterminedNote": orderNote}
	if !math.IsNaN(fitError) {
		metadata["fitError"] = fitError
	}
	return CalcResult{
		Value:       expression,
		Explanation: explanation,
		Metadata:    metadata,
	}, nil
}

func integratedRateLaw(inputs map[string]string) (CalcResult, error) {
	solveFor := inputs["irl-solve-for"]
	order := optionalInt(inputs, "irl-order")
	a0 := optionalFloat(inputs, "irl-A0")
	k := optionalFloat(inputs, "irl-k")
	t := optionalFloat(inputs, "irl-t")
	a := optionalFloat(inputs, "irl-A")

	var result float64
	var unit string
	var formula string
	switch solveFor {
	case "concentration":
		if anyNaN(a0, k, t) {
			return CalcResult{}, errors.New("Missing or invalid inputs for irl-A0, irl-k, irl-t")
		}
		if a0 <= 0 {
			return CalcResult{}, errors.New("Initial concentration must be positive")
		}
		if k < 0 {
			return CalcResult{}, errors.New("Rate constant cannot be negative")
		}
		if t < 0 {
			return CalcResult{}, errors.New("Time cannot be negative")
		}
		switch {
		case order == 0:
			result = math.Max(0, a0-k*t)
			formula = "[A] = [A]\u2080 - kt"
		case order == 1:
			result = a0 * math.Exp(-k*t)
			formula = "[A] = [A]\u2080\u00B7e^(-kt)"
		case order == 2:
			result = a0 / (1 + k*a0*t)
			formula = "[A] = [A]\u2080 / (1 + k[A]\u2080t)"
		default:
			return CalcResult{}, errors.New("Order must be 0, 1, or 2")
		}
		unit = "M"
	case "time":
		if anyNaN(a0, k, a) {
			return CalcResult{}, errors.New("Missing or invalid inputs for irl-A0, irl-k, irl-A")
		}
		if a0 <= 0 {
			return CalcResult{}, errors.New("Initial concentration must be positive")
		}
		if k <= 0 {
			return CalcResult{}, errors.New("Rate constant must be positive for solving time")
		}
		if a <= 0 {
			return CalcResult{}, errors.New("Concentration must be positive")
		}
		switch {
		case order == 0:
			if a >= a0 {
				return CalcResult{}, errors.New("Concentration must be less than initial concentration for zero order")
			}
			result = (a0 - a) / k
			formula = "t = ([A]\u2080 - [A]) / k"
		case order == 1:
			if a >= a0 {
				return CalcResult{}, errors.New("Concentration must be less than initial concentration for first order")
			}
			result = math.Log(a0/a) / k
			formula = "t = ln([A]\u2080/[A]) / k"
		case order == 2:
			if a >= a0 {
				return CalcResult{}, errors.New("Concentration must be less than initial concentration for second order")
			}
			result = (1/a - 1/a0) / k
			formula = "t = (1/[A] - 1/[A]\u2080) / k"
		default:
			return CalcResult{}, errors.New("Order must be 0, 1, or 2")
		}
		unit = "s"
	default:
		return CalcResult{}, errors.New("Invalid solveFor value")
	}

	formatted := formatFixed(result, 4)
	endTime := t
	if solveFor == "time" {
		endTime = result
	}
	return CalcResult{
		Value:       formatted + " " + unit,
		Explanation: formula + " = " + formatted + " " + unit,
		ChartData:   buildConcentrationTimeSeries(order, a0, k, endTime),
		Metadata: CalcMetadata{
			"formula": formula,
			"result":  result,
			"unit":    unit,
		},
	}, nil
}

func buildConcentrationTimeSeries(order, a0, k, endTime float64) []ChartData {
	if endTime <= 0 || math.IsInf(endTime, 0) || math.IsNaN(endTime) {
		endTime = seriesDefaultEndTime
	}
	stepSize := endTime / seriesSteps
	points := make([]ChartData, 0, seriesSteps+1)
	for i := 0; i <= seriesSteps; i++ {
		time := float64(i) * stepSize
		var conc float64
		switch order {
		case 0:
			conc = a0 - k*time
		case 1:
			conc = a0 * math.Exp(-k*time)
		default:
			conc = a0 / (1 + k*a0*time)
		}
		if conc < 0 {
			conc = 0
		}
		points = append(points, ChartData{"time": time, "concentration": conc})
	}
	return points
}

func reactionOrder(inputs map[string]string) (CalcResult, error) {
	points, err := parseTimeConcentrationData(inputs["reaction-order-data"])
	if err != nil {
		return CalcResult{}, err
	}
	r2Zero := calculateRSquared(points, func(p dataPoint) float64 { return p.c })
	r2First := calculateRSquared(points, func(p dataPoint) float64 { return math.Log(p.c) })
	r2Second := calculateRSquared(points, func(p dataPoint) float64 { return 1 / p.c })

	bestOrder := 0.0
	bestR2 := r2Zero
	if r2First > bestR2 {
		bestOrder = 1
		bestR2 = r2First
	}
	if r2Second > bestR2 {
		bestOrder = 2
		bestR2 = r2Second
	}
	k, err := calculateSlope(points, bestOrder)
	if err != nil {
		return CalcResult{}, err
	}

	var kUnit string
	switch bestOrder {
	case 0:
		kUnit = "M/s"
	case 1:
		kUnit = "s\u207B\u00B9"
	default:
		kUnit = "M\u207B\u00B9s\u207B\u00B9"
	}
	kAbs := math.Abs(k)
	value := "Best-fit reaction order: " + jsNumber(bestOrder)
	explanation := "Best-fit reaction order: " + jsNumber(bestOrder) + "; " +
		"R\u00B2 zero order: " + formatFixed(r2Zero, 6) + "; " +
		"R\u00B2 first order: " + formatFixed(r2First, 6) + "; " +
		"R\u00B2 second order: " + formatFixed(r2Second, 6) + "; " +
		"Rate constant k \u2248 " + formatFixed(kAbs, 6) + " " + kUnit
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"bestOrder": bestOrder,
			"r2Zero":    r2Zero,
			"r2First":   r2First,
			"r2Second":  r2Second,
			"k":         kAbs,
			"kUnit":     kUnit,
		},
	}, nil
}

func parseTimeConcentrationData(dataInput string) ([]dataPoint, error) {
	if strings.TrimSpace(dataInput) == "" {
		return nil, errors.New("Please enter time-concentration data")
	}
	var points []dataPoint
	for _, entry := range regexp.MustCompile(`[;\n]+`).Split(dataInput, -1) {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		parts := strings.Split(entry, ",")
		if len(parts) != 2 {
			return nil, errors.New("Invalid data format. Use t1,c1;t2,c2;... or one pair per line")
		}
		t, okT := jsParseFloat(parts[0])
		c, okC := jsParseFloat(parts[1])
		if !okT || !okC {
			return nil, errors.New("Invalid number in data: " + entry)
		}
		if c <= 0 {
			return nil, errors.New("Concentrations must be positive for order determination")
		}
		points = append(points, dataPoint{t: t, c: c})
	}
	if len(points) < 3 {
		return nil, errors.New("At least 3 data points are required")
	}
	return points, nil
}

func calculateRSquared(points []dataPoint, transform func(dataPoint) float64) float64 {
	n := len(points)
	if n < 2 {
		return 0
	}
	var sumX, sumY, sumXY, sumX2, sumY2 float64
	for _, p := range points {
		x := p.t
		y := transform(p)
		sumX += x
		sumY += y
		sumXY += x * y
		sumX2 += x * x
		sumY2 += y * y
	}
	denom := math.Sqrt((float64(n)*sumX2 - sumX*sumX) * (float64(n)*sumY2 - sumY*sumY))
	if denom == 0 {
		return 0
	}
	r := (float64(n)*sumXY - sumX*sumY) / denom
	return r * r
}

func calculateSlope(points []dataPoint, order float64) (float64, error) {
	n := len(points)
	var sumX, sumY, sumXY, sumX2 float64
	for _, p := range points {
		x := p.t
		var y float64
		switch order {
		case 0:
			y = p.c
		case 1:
			y = math.Log(p.c)
		default:
			y = 1 / p.c
		}
		sumX += x
		sumY += y
		sumXY += x * y
		sumX2 += x * x
	}
	denom := float64(n)*sumX2 - sumX*sumX
	if denom == 0 {
		return 0, errors.New("Cannot determine slope: all time values are identical")
	}
	return (float64(n)*sumXY - sumX*sumY) / denom, nil
}

func collisionTheory(inputs map[string]string) (CalcResult, error) {
	solveFor := inputs["collision-solve-for"]
	ea := optionalFloat(inputs, "collision-Ea")
	t := optionalFloat(inputs, "collision-T")
	z := optionalFloat(inputs, "collision-Z")
	p := optionalFloat(inputs, "collision-p")
	k := optionalFloat(inputs, "collision-k")
	eaJ := ea * 1000

	var result float64
	var unit string
	var formula string
	switch solveFor {
	case "k":
		if anyNaN(ea, t, z, p) {
			return CalcResult{}, errors.New("Missing or invalid inputs for collision-Ea, collision-T, collision-Z, collision-p")
		}
		if t <= 0 {
			return CalcResult{}, errors.New("Temperature must be positive")
		}
		if z <= 0 {
			return CalcResult{}, errors.New("Collision frequency must be positive")
		}
		if p < 0 || p > 1 {
			return CalcResult{}, errors.New("Steric factor must be between 0 and 1")
		}
		result = z * p * math.Exp(-eaJ/(gasConstant*t))
		unit = "s\u207B\u00B9"
		formula = "k = Z\u00B7p\u00B7e^(-Ea/RT)"
	case "Z":
		if anyNaN(ea, t, p, k) {
			return CalcResult{}, errors.New("Missing or invalid inputs for collision-Ea, collision-T, collision-p, collision-k")
		}
		if t <= 0 {
			return CalcResult{}, errors.New("Temperature must be positive")
		}
		if p <= 0 {
			return CalcResult{}, errors.New("Steric factor must be positive")
		}
		if k <= 0 {
			return CalcResult{}, errors.New("Rate constant k must be positive")
		}
		denominator := p * math.Exp(-eaJ/(gasConstant*t))
		if denominator == 0 {
			return CalcResult{}, errors.New("Cannot compute collision frequency: denominator is zero")
		}
		result = k / denominator
		unit = "s\u207B\u00B9"
		formula = "Z = k / (p\u00B7e^(-Ea/RT))"
	case "p":
		if anyNaN(ea, t, z, k) {
			return CalcResult{}, errors.New("Missing or invalid inputs for collision-Ea, collision-T, collision-Z, collision-k")
		}
		if t <= 0 {
			return CalcResult{}, errors.New("Temperature must be positive")
		}
		if z <= 0 {
			return CalcResult{}, errors.New("Collision frequency must be positive")
		}
		if k <= 0 {
			return CalcResult{}, errors.New("Rate constant k must be positive")
		}
		denominator := z * math.Exp(-eaJ/(gasConstant*t))
		if denominator == 0 {
			return CalcResult{}, errors.New("Cannot compute steric factor: denominator is zero")
		}
		result = k / denominator
		unit = ""
		formula = "p = k / (Z\u00B7e^(-Ea/RT))"
		if result < 0 || result > 1 {
			formula += " (warning: steric factor should lie in [0, 1]; check inputs)"
		}
	default:
		return CalcResult{}, errors.New("Invalid solveFor value")
	}

	fractionEffective := math.Exp(-eaJ / (gasConstant * t))
	formatted := formatFixed(result, 6)
	value := formatted
	if unit != "" {
		value = formatted + " " + unit
	}
	explanation := formula + " = " + formatted
	if unit != "" {
		explanation += " " + unit
	}
	explanation += "; Fraction of effective collisions (e^(-Ea/RT)): " + formatFixed(fractionEffective, 6)
	return CalcResult{
		Value:       value,
		Explanation: explanation,
		Metadata: CalcMetadata{
			"fractionEffective": fractionEffective,
			"formula":           formula,
			"unit":              unit,
			"result":            result,
		},
	}, nil
}
