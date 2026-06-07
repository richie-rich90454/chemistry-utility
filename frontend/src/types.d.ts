export interface ChemicalElement{
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
}