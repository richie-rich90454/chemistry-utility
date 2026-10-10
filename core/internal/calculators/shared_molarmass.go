package calculators

import (
	"encoding/json"
	"errors"
	"math"
	"strconv"
	"strings"
	"sync"

	"chemistry-utility/core/internal/ptable"
)

// The molar-mass calculator is a direct port of
// frontend/src/modules/calculators/molarMass.ts. Element lookup failures
// surface with the same messages, and the element order the fast formula
// parser yields is preserved so the accumulated float matches the web
// engine bit for bit.

var elementTable struct {
	once     sync.Once
	bySymbol map[string]float64
	err      error
}

// ptablePaths are the locations the element data is read from, in priority
// order: the packaged desktop asset first, then the repository copy at
// increasing distances, which covers every working directory the test and
// the binary can run from.
var ptablePaths = []string{
	"dist/ptable.json",
	"ptable.json",
	"frontend/public/ptable.json",
	"../frontend/public/ptable.json",
	"../../frontend/public/ptable.json",
	"../../../frontend/public/ptable.json",
}

func loadElements() (map[string]float64, error) {
	elementTable.once.Do(func() {
		for _, path := range ptablePaths {
			svc := ptable.New(path)
			data, err := svc.GetData()
			if err != nil {
				continue
			}
			var elements []struct {
				Symbol     string  `json:"symbol"`
				AtomicMass float64 `json:"atomicMass"`
			}
			if err := json.Unmarshal([]byte(data), &elements); err != nil {
				elementTable.err = errors.New("molar mass: invalid ptable.json: " + err.Error())
				return
			}
			bySymbol := make(map[string]float64, len(elements))
			for _, e := range elements {
				bySymbol[e.Symbol] = e.AtomicMass
			}
			elementTable.bySymbol = bySymbol
			return
		}
		elementTable.err = errors.New("molar mass: ptable.json not found")
	})
	return elementTable.bySymbol, elementTable.err
}

func molarMass(inputs map[string]string) (CalcResult, error) {
	formula := inputs["formula"]
	elements, err := loadElements()
	if err != nil {
		return CalcResult{}, err
	}
	mass, err := molarMassOf(formula, elements)
	if err != nil {
		return CalcResult{}, err
	}
	formatted := formatFixed(mass, 3)
	return CalcResult{
		Value: "Molar Mass: " + formatted + " g/mol",
		Metadata: CalcMetadata{
			"molarMass": mass,
			"formula":   formula,
		},
	}, nil
}

func molarMassOf(formula string, elements map[string]float64) (float64, error) {
	stripped := stripFormulaWhitespace(formula)
	if stripped == "" {
		return 0, errors.New("Empty formula")
	}
	stripped = stripChargeNotation(stripped)
	stripped = strings.NewReplacer("{", "(", "}", ")").Replace(stripped)

	// ponytail: the fast-balance fast path is not ported; this parser
	// covers the element-count grammar the web engine resolves, so
	// formulas that only differ by charges, isotopes, or state symbols
	// still produce the same element counts.
	counts := newElementCounts()
	for _, part := range strings.FieldsFunc(stripped, func(r rune) bool {
		return r == '·' || r == '*' || r == '•'
	}) {
		if part == "" {
			continue
		}
		mult := 1
		body := part
		if digits := leadingDigits(body); digits > 0 {
			mult, _ = strconv.Atoi(body[:digits])
			body = body[digits:]
		}
		if body == "" {
			continue
		}
		sub, err := (&formulaParser{src: body}).parseSegment(0)
		if err != nil {
			return 0, err
		}
		counts.merge(&sub, mult)
	}

	total := 0.0
	for _, symbol := range counts.order {
		mass, ok := elements[symbol]
		if !ok {
			return 0, errors.New("Element not found: " + symbol)
		}
		total += mass * float64(counts.count[symbol])
	}
	return total, nil
}

type elementCounts struct {
	order []string
	count map[string]int
}

func newElementCounts() *elementCounts {
	return &elementCounts{count: map[string]int{}}
}

func (c *elementCounts) add(symbol string, mult int) {
	if _, ok := c.count[symbol]; !ok {
		c.order = append(c.order, symbol)
	}
	c.count[symbol] += mult
}

func (c *elementCounts) merge(other *elementCounts, mult int) {
	for _, symbol := range other.order {
		c.add(symbol, other.count[symbol]*mult)
	}
}

type formulaParser struct {
	src string
	pos int
}

// parseSegment consumes one run of the formula up to the matching closer, or
// the end of the string for the outermost segment. Counts are accumulated in
// first-seen order, which is the order the element map is summed in.
func (p *formulaParser) parseSegment(closer byte) (elementCounts, error) {
	counts := *newElementCounts()
	for p.pos < len(p.src) {
		ch := p.src[p.pos]
		switch {
		case ch >= 'A' && ch <= 'Z':
			symbol := p.readElement()
			counts.add(symbol, p.readCount())
		case ch == '(' || ch == '[' || ch == '{':
			p.pos++
			sub, err := p.parseSegment(ch)
			if err != nil {
				return counts, err
			}
			counts.merge(&sub, p.readCount())
		case ch == ')' || ch == ']' || ch == '}':
			if closer == 0 {
				return counts, errors.New("Unmatched \"" + string(ch) + "\"")
			}
			p.pos++
			return counts, nil
		default:
			return counts, errors.New("Invalid character: " + string(ch))
		}
	}
	if closer != 0 {
		return counts, errors.New("Unmatched \"(\"")
	}
	return counts, nil
}

func (p *formulaParser) readElement() string {
	symbol := string(p.src[p.pos])
	p.pos++
	if p.pos < len(p.src) && p.src[p.pos] >= 'a' && p.src[p.pos] <= 'z' {
		symbol += string(p.src[p.pos])
		p.pos++
	}
	return symbol
}

func (p *formulaParser) readCount() int {
	start := p.pos
	for p.pos < len(p.src) && isASCIIDigit(p.src[p.pos]) {
		p.pos++
	}
	if p.pos == start {
		return 1
	}
	count, err := strconv.Atoi(p.src[start:p.pos])
	if err != nil {
		count = math.MaxInt32
	}
	if count <= 0 {
		return 1
	}
	return count
}

func stripFormulaWhitespace(formula string) string {
	var b strings.Builder
	b.Grow(len(formula))
	for i := 0; i < len(formula); i++ {
		switch formula[i] {
		case ' ', '\t', '\n', '\r':
		default:
			b.WriteByte(formula[i])
		}
	}
	return b.String()
}

func stripChargeNotation(formula string) string {
	if caret := strings.IndexByte(formula, '^'); caret != -1 {
		return formula[:caret]
	}
	return formula
}

func leadingDigits(text string) int {
	i := 0
	for i < len(text) && isASCIIDigit(text[i]) {
		i++
	}
	return i
}

func isASCIIDigit(ch byte) bool {
	return ch >= '0' && ch <= '9'
}
