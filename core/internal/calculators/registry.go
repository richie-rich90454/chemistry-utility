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
	r.calculators["dilution"] = dilution
	r.calculators["mass-percent"] = massPercent
	r.calculators["solution-mixing"] = solutionMixing
}
