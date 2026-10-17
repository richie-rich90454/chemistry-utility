import { PureCalculator } from "./calculators/pureCalculator.js";
import type { CalculatorResult } from "./calculators/pureCalculator.js";
import {
    beerLambert,
    calorimetry,
    empiricalFormula,
    gibbsEquilibrium,
    leChatelier,
    massSpectrometry,
    molality,
    photoelectronSpectroscopy,
    serialDilution,
    vseprGeometry
} from "./calculators/advanced.js";

export class PhotoelectronSpectroscopyCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "photoelectron-spectroscopy";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return photoelectronSpectroscopy(inputs);
    }
}

export class EmpiricalFormulaCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "empirical-formula";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return empiricalFormula(inputs);
    }
}

export class MassSpectrometryCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "mass-spectrometry";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return massSpectrometry(inputs);
    }
}

export class VseprGeometryCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "vsepr-geometry";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return vseprGeometry(inputs);
    }
}

export class CalorimetryCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "calorimetry";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return calorimetry(inputs);
    }
}

export class GibbsEquilibriumCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "gibbs-equilibrium";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return gibbsEquilibrium(inputs);
    }
}

export class MolalityCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "molality";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return molality(inputs);
    }
}

export class BeerLambertCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "beer-lambert";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return beerLambert(inputs);
    }
}

export class SerialDilutionCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "serial-dilution";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return serialDilution(inputs);
    }
}

export class LeChatelierCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "le-chatelier";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return leChatelier(inputs);
    }
}
