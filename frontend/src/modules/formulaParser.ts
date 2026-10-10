import {
	calculateMolarMassSingle,
	legacyCalculateMolarMass,
	molarMass,
	parseElement,
	parseNumber
} from "./calculators/molarMass.js";
import {formatFormula} from "./calculators/formulaFormat.js";

export const FormulaParser={
	parseElement: parseElement,
	parseNumber: parseNumber,
	calculateMolarMass: molarMass,
	legacyCalculateMolarMass: legacyCalculateMolarMass,
	calculateMolarMassSingle: calculateMolarMassSingle,
	formatFormula: formatFormula
};

export {parseElement, parseNumber, molarMass as calculateMolarMass, formatFormula};
