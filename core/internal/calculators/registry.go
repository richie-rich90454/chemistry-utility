package calculators

import "sort"

// calcFunc is the signature every calculator implements: a plain input
// record in, a shared-contract result out, an error for invalid input.
type calcFunc func(inputs map[string]string) (CalcResult, error)

// Registry maps calculator identifiers to their implementations.
//
// The registry is the binding surface for the desktop app: the frontend
// passes a calculator id and an input record, and gets back a CalcResult in
// the shared contract. Implementations are the ported calculators in
// shared_*.go, which mirror frontend/src/modules/calculators/ exactly.
type Registry struct {
	calculators map[string]calcFunc
}

// NewRegistry creates a registry and registers every ported calculator.
func NewRegistry() *Registry {
	r := &Registry{
		calculators: make(map[string]calcFunc),
	}
	r.registerAll()
	return r
}

// Get looks up a calculator by id. Returns the function and true if found.
func (r *Registry) Get(calculatorType string) (calcFunc, bool) {
	f, ok := r.calculators[calculatorType]
	return f, ok
}

// List returns a sorted list of available calculator ids.
func (r *Registry) List() []string {
	types := make([]string, 0, len(r.calculators))
	for t := range r.calculators {
		types = append(types, t)
	}
	sort.Strings(types)
	return types
}

func (r *Registry) registerAll() {
	r.calculators["arrhenius"] = arrhenius
	r.calculators["rate-law"] = rateLaw
	r.calculators["integrated-rate-law"] = integratedRateLaw
	r.calculators["reaction-order"] = reactionOrder
	r.calculators["collision-theory"] = collisionTheory
	r.calculators["stoichiometry"] = stoichiometry
	r.calculators["dilution"] = dilution
	r.calculators["mass-percent"] = massPercent
	r.calculators["solution-mixing"] = solutionMixing
	r.calculators["buffer-solution"] = bufferSolution
	r.calculators["pka-pkb"] = pKaPKb
	r.calculators["ksp"] = ksp
	r.calculators["colligative-properties"] = colligativeProperties
	r.calculators["titration-curve"] = titrationCurve
	r.calculators["debye-huckel"] = debyeHuckel
	r.calculators["common-ion"] = commonIonEffect
	r.calculators["bond-type"] = bondType
	r.calculators["gibbs-free-energy"] = gibbsFreeEnergy
	r.calculators["hess-law"] = hessLaw
	r.calculators["entropy"] = entropy
	r.calculators["heat-capacity"] = heatCapacity
	r.calculators["bond-enthalpy"] = bondEnthalpy
	r.calculators["born-haber"] = bornHaber
	r.calculators["quantum-numbers"] = quantumNumbers
	r.calculators["electron-configuration"] = electronConfiguration
	r.calculators["rydberg"] = rydberg
	r.calculators["debroglie-wavelength"] = deBroglie
	r.calculators["photoelectric-effect"] = photoelectric
	r.calculators["heisenberg-uncertainty"] = heisenberg
	r.calculators["cell-potential"] = cellPotential
	r.calculators["nernst"] = nernst
	r.calculators["electrolysis"] = electrolysis
	r.calculators["ideal-gas"] = idealGas
	r.calculators["combined-gas"] = combinedGas
	r.calculators["van-der-waals"] = vanDerWaals
	r.calculators["half-life"] = halfLife
	r.calculators["molar-mass"] = molarMass
}
