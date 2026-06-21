import type { Calculator } from "./calculator.js";

/**
 * Singleton registry that maps calculator IDs to their {@link Calculator}
 * instances. Uses a type-only import for {@link Calculator} to avoid runtime
 * circular dependencies.
 */
export class CalculatorRegistry {
	private static instance: CalculatorRegistry;
	private calculators: Map<string, Calculator>;

	private constructor() {
		this.calculators = new Map<string, Calculator>();
	}

	/** Returns the singleton registry instance, creating it on first access. */
	public static getInstance(): CalculatorRegistry {
		if (!CalculatorRegistry.instance) {
			CalculatorRegistry.instance = new CalculatorRegistry();
		}
		return CalculatorRegistry.instance;
	}

	/** Stores a calculator under the given id, replacing any existing entry. */
	public register(id: string, calculator: Calculator): void {
		this.calculators.set(id, calculator);
	}

	/** Retrieves a calculator by id, or undefined if none is registered. */
	public get(id: string): Calculator | undefined {
		return this.calculators.get(id);
	}

	/** Returns the full map of registered calculators. */
	public getAll(): Map<string, Calculator> {
		return this.calculators;
	}
}
