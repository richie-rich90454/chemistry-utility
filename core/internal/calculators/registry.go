package calculators

import "sort"

// Registry holds all registered calculator functions.
type Registry struct {
	calculators map[string]CalculatorFunc
}

// NewRegistry creates a new registry and registers all built-in calculators.
func NewRegistry() *Registry {
	r := &Registry{
		calculators: make(map[string]CalculatorFunc),
	}
	r.registerAll()
	return r
}

// Get looks up a calculator by type. Returns the function and true if found.
func (r *Registry) Get(calculatorType string) (CalculatorFunc, bool) {
	f, ok := r.calculators[calculatorType]
	return f, ok
}

// List returns a sorted list of all available calculator types.
func (r *Registry) List() []string {
	types := make([]string, 0, len(r.calculators))
	for t := range r.calculators {
		types = append(types, t)
	}
	sort.Strings(types)
	return types
}

// registerAll registers all built-in calculator functions.
func (r *Registry) registerAll() {
	r.calculators["molar-mass"] = CalculateMolarMass
	r.calculators["equation-balance"] = EquationBalance
	r.calculators["stoichiometry"] = Stoichiometry
	r.calculators["dilution"] = Dilution
	r.calculators["mass-percent"] = MassPercent
	r.calculators["solution-mixing"] = SolutionMixing
	r.calculators["ideal-gas"] = IdealGasLaw
	r.calculators["combined-gas"] = CombinedGasLaw
	r.calculators["van-der-waals"] = VanDerWaals
	r.calculators["half-life"] = HalfLife
	r.calculators["cell-potential"] = CellPotential
	r.calculators["nernst"] = Nernst
	r.calculators["electrolysis"] = Electrolysis
	r.calculators["bond-type"] = BondType
	r.calculators["gibbs-free-energy"] = GibbsFreeEnergy
	r.calculators["hess-law"] = HessLaw
	r.calculators["entropy"] = Entropy
	r.calculators["heat-capacity"] = HeatCapacity
	r.calculators["arrhenius"] = Arrhenius
	r.calculators["rate-law"] = RateLaw
	r.calculators["integrated-rate-law"] = IntegratedRateLaw
	r.calculators["buffer-solution"] = BufferSolution
	r.calculators["pka-pkb"] = PKaPKb
	r.calculators["ksp"] = Ksp
	r.calculators["colligative-properties"] = ColligativeProperties
	r.calculators["titration-curve"] = TitrationCurve
	r.calculators["quantum-numbers"] = QuantumNumbers
	r.calculators["electron-configuration"] = ElectronConfiguration
	r.calculators["debroglie-wavelength"] = DeBroglieWavelength
	r.calculators["photoelectric-effect"] = PhotoelectricEffect
	r.calculators["heisenberg-uncertainty"] = HeisenbergUncertainty
}
