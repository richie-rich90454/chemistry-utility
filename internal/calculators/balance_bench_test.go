package calculators

import (
	"context"
	"testing"
)

// Representative equations spanning trivial, combustion, oxide, and
// double-replacement (nested brackets) shapes.
var benchEquations = []string{
	"H2 + O2 -> H2O",
	"C3H8 + O2 -> CO2 + H2O",
	"Fe + O2 -> Fe2O3",
	"C6H12O6 + O2 -> CO2 + H2O",
	"Al2(SO4)3 + Ca(OH)2 -> Al(OH)3 + CaSO4",
}

func BenchmarkBalanceEquation(b *testing.B) {
	for _, eq := range benchEquations {
		b.Run(eq, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				if _, err := BalanceEquation(eq, 4000); err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

// Representative formulas spanning small molecules, salts, nested
// brackets, and polyatomic ions.
var benchFormulas = []string{
	"H2O",
	"NaCl",
	"C6H12O6",
	"Ca3(PO4)2",
	"Al2(SO4)3",
	"Fe2(SO4)3",
}

func BenchmarkMolarMass(b *testing.B) {
	ctx := context.Background()
	for _, formula := range benchFormulas {
		b.Run(formula, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				if _, err := CalculateMolarMass(ctx, CalculationInput{"formula": formula}); err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}
