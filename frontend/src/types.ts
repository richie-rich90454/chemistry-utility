/**
 * Represents a chemical element from the periodic table. The data is typically
 * loaded from a JSON source (ptable.json) via {@link JSON.parse}, so the
 * resulting plain objects rely on TypeScript's structural typing to be
 * assignable to this class. The constructor is provided for explicit
 * construction when needed; parsed JSON data is simply cast.
 */
export class ChemicalElement {
	public symbol: string;
	public name: string;
	public atomicMass: number;
	public atomicNumber: number;
	public electronegativity?: number | null;
	public electronAffinity?: number | null;
	public atomicRadius?: number | null;
	public ionizationEnergy?: number | null;
	public valenceElectrons: number;
	public totalElectrons: number;
	public group: number;
	public period: number;
	public type: string;

	constructor(data: {
		symbol: string;
		name: string;
		atomicMass: number;
		atomicNumber: number;
		electronegativity?: number | null;
		electronAffinity?: number | null;
		atomicRadius?: number | null;
		ionizationEnergy?: number | null;
		valenceElectrons: number;
		totalElectrons: number;
		group: number;
		period: number;
		type: string;
	}) {
		this.symbol = data.symbol;
		this.name = data.name;
		this.atomicMass = data.atomicMass;
		this.atomicNumber = data.atomicNumber;
		this.electronegativity = data.electronegativity;
		this.electronAffinity = data.electronAffinity;
		this.atomicRadius = data.atomicRadius;
		this.ionizationEnergy = data.ionizationEnergy;
		this.valenceElectrons = data.valenceElectrons;
		this.totalElectrons = data.totalElectrons;
		this.group = data.group;
		this.period = data.period;
		this.type = data.type;
	}
}
