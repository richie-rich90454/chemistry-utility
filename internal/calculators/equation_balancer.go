package calculators

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"unicode"
)

// Fraction represents a rational number with exact arithmetic.
type Fraction struct {
	N int
	D int
}

// newFraction creates a new Fraction and simplifies it.
func newFraction(n, d int) Fraction {
	if d == 0 {
		panic("denominator zero")
	}
	f := Fraction{N: n, D: d}
	f.simplify()
	return f
}

func (f *Fraction) simplify() {
	g := gcd(abs(f.N), abs(f.D))
	if g != 0 {
		f.N /= g
		f.D /= g
	}
	if f.D < 0 {
		f.N = -f.N
		f.D = -f.D
	}
}

func (f Fraction) add(other Fraction) Fraction {
	return newFraction(f.N*other.D+other.N*f.D, f.D*other.D)
}

func (f Fraction) subtract(other Fraction) Fraction {
	return newFraction(f.N*other.D-other.N*f.D, f.D*other.D)
}

func (f Fraction) multiply(other Fraction) Fraction {
	return newFraction(f.N*other.N, f.D*other.D)
}

func (f Fraction) divide(other Fraction) Fraction {
	if other.N == 0 {
		panic("division by zero")
	}
	return newFraction(f.N*other.D, f.D*other.N)
}

func (f Fraction) isZero() bool {
	return f.N == 0
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func gcd(a, b int) int {
	a = abs(a)
	b = abs(b)
	for b != 0 {
		a, b = b, a%b
	}
	return a
}

func lcm(a, b int) int {
	if a == 0 || b == 0 {
		return 0
	}
	return abs(a*b) / gcd(a, b)
}

// parseFormulaToCounts parses a chemical formula into element counts.
// This is a port of the TypeScript EquationBalancer.parseFormulaToCounts.
func parseFormulaToCounts(formula string) map[string]int {
	stack := []map[string]int{{}}
	i := 0
	digitRe := regexp.MustCompile(`^\d+`)

	for i < len(formula) {
		ch := rune(formula[i])
		if ch == '(' || ch == '[' || ch == '{' {
			stack = append(stack, make(map[string]int))
			i++
		} else if ch == ')' || ch == ']' || ch == '}' {
			top := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			i++
			matches := digitRe.FindString(formula[i:])
			mul := 1
			if matches != "" {
				mul = atoi(matches)
				i += len(matches)
			}
			for el, cnt := range top {
				stack[len(stack)-1][el] += cnt * mul
			}
		} else if unicode.IsUpper(ch) {
			start := i
			i++
			for i < len(formula) && unicode.IsLower(rune(formula[i])) {
				i++
			}
			el := formula[start:i]
			start = i
			for i < len(formula) && unicode.IsDigit(rune(formula[i])) {
				i++
			}
			cnt := 1
			if start < i {
				// Digits directly followed by +/-, e.g. Fe2+, are the charge
				// magnitude, not an element subscript. Rewind so the charge
				// branch below consumes them.
				if i < len(formula) && (formula[i] == '+' || formula[i] == '-') {
					i = start
				} else {
					cnt = atoi(formula[start:i])
				}
			}
			stack[len(stack)-1][el] += cnt
		} else if ch == '+' || ch == '-' || unicode.IsDigit(ch) {
			start := i
			for i < len(formula) && unicode.IsDigit(rune(formula[i])) {
				i++
			}
			num := formula[start:i]
			sign := 0
			mag := 0
			if i < len(formula) && (formula[i] == '+' || formula[i] == '-') {
				if formula[i] == '+' {
					sign = 1
				} else {
					sign = -1
				}
				if num == "" {
					mag = 1
				} else {
					mag = atoi(num)
				}
				i++
			} else if ch == '+' || ch == '-' {
				if ch == '+' {
					sign = 1
				} else {
					sign = -1
				}
				i++
				s := i
				for i < len(formula) && unicode.IsDigit(rune(formula[i])) {
					i++
				}
				num2 := formula[s:i]
				if num2 == "" {
					mag = 1
				} else {
					mag = atoi(num2)
				}
			}
			if sign != 0 {
				stack[len(stack)-1]["_charge"] += mag * sign
			}
		} else {
			i++
		}
	}
	return stack[0]
}

// atoi parses a non-negative decimal integer. Inputs longer than 9 digits
// are clamped to a huge sentinel so any coefficient derived from them
// overflows the balance attempt instead of wrapping int arithmetic.
func atoi(s string) int {
	if len(s) > 9 {
		return 1 << 30
	}
	n := 0
	for _, ch := range s {
		n = n*10 + int(ch-'0')
	}
	return n
}

// ParseEquation splits a chemical equation string into reactants and products.
func ParseEquation(equation string) (reactants []string, products []string, err error) {
	sides := regexp.MustCompile(`->|=`).Split(equation, -1)
	if len(sides) != 2 {
		return nil, nil, errors.New("invalid equation format: expected exactly one '->' or '='")
	}
	splitSide := func(s string) []string {
		s = strings.TrimSpace(s)
		var terms []string
		start := 0
		for i := 0; i < len(s); i++ {
			if s[i] != '+' {
				continue
			}
			// A '+' is a term separator only when it starts a new term
			// (followed by a term-start character). A '+' attached to an
			// ion, e.g. Fe2+ or H+, is a charge. This lets both
			// "H2 + O2" and "H2+O2" parse, while "Fe2+ + Fe3+" stays intact.
			j := i + 1
			for j < len(s) && s[j] == ' ' {
				j++
			}
			isTermStart := j < len(s) && ((s[j] >= 'A' && s[j] <= 'Z') || (s[j] >= '0' && s[j] <= '9') || s[j] == '(' || s[j] == '[')
			if isTermStart {
				term := strings.TrimSpace(s[start:i])
				if term != "" {
					terms = append(terms, term)
				}
				start = j
				i = j - 1
			}
		}
		tail := strings.TrimSpace(s[start:])
		if tail != "" {
			terms = append(terms, tail)
		}
		return terms
	}
	return splitSide(sides[0]), splitSide(sides[1]), nil
}

// solveHomogeneous solves a homogeneous system of linear equations using
// Gaussian elimination with Fraction arithmetic. Returns null if no
// non-trivial positive solution is found.
func solveHomogeneous(matrix [][]Fraction) []Fraction {
	r := len(matrix)
	if r == 0 {
		return nil
	}
	c := len(matrix[0])

	// Deep copy
	m := make([][]Fraction, r)
	for i := range m {
		m[i] = make([]Fraction, c)
		for j := range m[i] {
			m[i][j] = newFraction(matrix[i][j].N, matrix[i][j].D)
		}
	}

	var pivotCol []int
	row := 0
	for col := 0; col < c && row < r; col++ {
		sel := row
		for sel < r && m[sel][col].isZero() {
			sel++
		}
		if sel == r {
			continue
		}
		m[row], m[sel] = m[sel], m[row]
		div := m[row][col]
		for j := col; j < c; j++ {
			m[row][j] = m[row][j].divide(div)
		}
		for i := 0; i < r; i++ {
			if i != row {
				f := m[i][col]
				for j := col; j < c; j++ {
					m[i][j] = m[i][j].subtract(f.multiply(m[row][j]))
				}
			}
		}
		pivotCol = append(pivotCol, col)
		row++
	}

	isPivot := make([]bool, c)
	for _, pc := range pivotCol {
		isPivot[pc] = true
	}
	var free []int
	for i := 0; i < c; i++ {
		if !isPivot[i] {
			free = append(free, i)
		}
	}
	if len(free) == 0 {
		return nil
	}

	for trial := 1; trial <= 10; trial++ {
		sol := make([]Fraction, c)
		for i := range sol {
			sol[i] = newFraction(0, 1)
		}
		for _, f := range free {
			sol[f] = newFraction(trial, 1)
		}
		for i := len(pivotCol) - 1; i >= 0; i-- {
			col := pivotCol[i]
			sum := newFraction(0, 1)
			for j := col + 1; j < c; j++ {
				sum = sum.add(m[i][j].multiply(sol[j]))
			}
			sol[col] = sum.multiply(newFraction(-1, 1))
		}
		den := 1
		for _, x := range sol {
			den = lcm(den, abs(x.D))
		}
		ints := make([]int, c)
		for i, x := range sol {
			ints[i] = x.N * (den / x.D)
		}
		allZero := true
		for _, v := range ints {
			if v != 0 {
				allZero = false
				break
			}
		}
		if allZero {
			continue
		}
		sign := 1
		for _, v := range ints {
			if v != 0 {
				if v < 0 {
					sign = -1
				}
				break
			}
		}
		for i := range ints {
			ints[i] *= sign
		}
		allPositive := true
		for _, v := range ints {
			if v <= 0 {
				allPositive = false
				break
			}
		}
		if allPositive {
			g := 0
			for _, v := range ints {
				g = gcd(g, v)
			}
			result := make([]Fraction, c)
			for i, v := range ints {
				result[i] = newFraction(v/g, 1)
			}
			return result
		}
	}
	return nil
}

// BalanceEquation balances a chemical equation string and returns the
// balanced equation with coefficients.
func BalanceEquation(equation string, maxCoefficient int) (string, error) {
	reactants, products, err := ParseEquation(equation)
	if err != nil {
		return "", err
	}

	all := append(reactants, products...)
	parsed := make([]map[string]int, len(all))
	for i, formula := range all {
		parsed[i] = parseFormulaToCounts(formula)
	}

	keysSet := make(map[string]bool)
	for _, p := range parsed {
		for k := range p {
			keysSet[k] = true
		}
	}
	var elements []string
	for k := range keysSet {
		elements = append(elements, k)
	}
	sort.Strings(elements)

	A := make([][]Fraction, len(elements))
	for ei, el := range elements {
		A[ei] = make([]Fraction, len(all))
		for i := range all {
			v := parsed[i][el]
			if i < len(reactants) {
				A[ei][i] = newFraction(v, 1)
			} else {
				A[ei][i] = newFraction(-v, 1)
			}
		}
	}

	sol := solveHomogeneous(A)
	if sol == nil {
		return "", errors.New("could not balance equation")
	}

	coeffs := make([]int, len(sol))
	for i, f := range sol {
		coeffs[i] = f.N
	}
	for _, c := range coeffs {
		if c <= 0 || c > maxCoefficient {
			return "", errors.New("could not balance equation")
		}
	}

	fmtSide := func(arr []string, off int) string {
		parts := make([]string, len(arr))
		for i, p := range arr {
			c := coeffs[off+i]
			if c == 1 {
				parts[i] = p
			} else {
				parts[i] = fmt.Sprintf("%d%s", c, p)
			}
		}
		return strings.Join(parts, " + ")
	}

	return fmtSide(reactants, 0) + " -> " + fmtSide(products, len(reactants)), nil
}

// EquationBalance is the CalculatorFunc wrapper for equation balancing.
func EquationBalance(ctx context.Context, input CalculationInput) (CalculationResult, error) {
	equation, err := getString(input, "equation")
	if err != nil {
		return CalculationResult{}, err
	}
	maxCoeff := int(getFloatWithDefault(input, "maxCoefficient", 4000))

	balanced, err := BalanceEquation(equation, maxCoeff)
	if err != nil {
		return CalculationResult{}, err
	}

	reactants, products, err := ParseEquation(equation)
	if err != nil {
		return CalculationResult{}, err
	}

	return CalculationResult{
		Value: 0,
		Unit:  "",
		Steps: []string{
			fmt.Sprintf("Original: %s", equation),
			fmt.Sprintf("Balanced: %s", balanced),
		},
		Metadata: map[string]interface{}{
			"balanced":  balanced,
			"reactants": reactants,
			"products":  products,
		},
	}, nil
}
