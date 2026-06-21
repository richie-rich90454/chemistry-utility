import {calculateMolarMass} from "./formulaParser.js";
import {balanceEquation} from "./equationBalancer.js";
import {getCalculationType, calculateStoichiometry} from "./stoichiometryCalculator.js";
import {calculateDilution, calculateMassPercent, calculateMixing} from "./solutionCalculators.js";
import {calculateIdealGasLaw, calculateCombinedGasLaw, calculateVanDerWaals, calculateHalfLife} from "./gasLawCalculators.js";
import {calculateCellPotential, calculateNernst, calculateElectrolysis} from "./electrochemistryCalculators.js";
import {predictBondType} from "./bondPredictor.js";
import {ChemicalElement} from "../types.js";

/**
 * Encapsulates all DOM event listener wiring for the chemistry utility
 * calculators. Replaces the standalone {@link initializeEventListeners}
 * function with a class-based design that stores {@link elementsData} as
 * instance state.
 */
export class EventListenerInitializer {
	private elementsData: ChemicalElement[];

	constructor(elementsData: ChemicalElement[]) {
		this.elementsData = elementsData;
	}

	public initialize(): void {
		(document.getElementById("element-input") as HTMLInputElement).addEventListener("keyup", () => {
			this.lookUpElement();
		});
		(document.getElementById("formula-input") as HTMLInputElement).addEventListener("keyup", () => {
			this.calculateMass();
		});
		(document.getElementById("balance-button") as HTMLButtonElement).addEventListener("click", () => {
			this.balanceEquations();
		});
		(document.getElementById("calculation-type") as HTMLSelectElement).addEventListener("change", function(){
			let equation=(document.getElementById("stoich-equation-input") as HTMLInputElement).value.trim();
			if (equation){
				getCalculationType(equation);
			}
		});
		(document.getElementById("calculate-stoich-button") as HTMLButtonElement).addEventListener("click", function(){
			let equation=(document.getElementById("stoich-equation-input") as HTMLInputElement).value.trim();
			try {
				calculateStoichiometry(equation);
			} catch (e: any) {
				let result = document.getElementById("stoichiometry-result") as HTMLElement;
				if (result) result.textContent = e.message || "An error occurred";
			}
		});
		(document.getElementById("calculate-dilution") as HTMLButtonElement).addEventListener("click", calculateDilution);
		(document.getElementById("calculate-mass-percent") as HTMLButtonElement).addEventListener("click", calculateMassPercent);
		(document.getElementById("calculate-mixing") as HTMLButtonElement).addEventListener("click", calculateMixing);
		(document.getElementById("calculate-ideal") as HTMLButtonElement).addEventListener("click", calculateIdealGasLaw);
		(document.getElementById("calculate-combined") as HTMLButtonElement).addEventListener("click", calculateCombinedGasLaw);
		(document.getElementById("calculate-vdw") as HTMLButtonElement).addEventListener("click", calculateVanDerWaals);
		(document.getElementById("ideal-R-units") as HTMLSelectElement).addEventListener("change", function(this: HTMLSelectElement){
			let units=this.value;
			if (units=="atm-L"){
				(document.getElementById("ideal-P") as HTMLInputElement).setAttribute("placeholder", "P (atm)");
				(document.getElementById("ideal-V") as HTMLInputElement).setAttribute("placeholder", "V (L)");
			}
			else if (units=="SI"){
				(document.getElementById("ideal-P") as HTMLInputElement).setAttribute("placeholder", "P (Pa)");
				(document.getElementById("ideal-V") as HTMLInputElement).setAttribute("placeholder", "V (m³)");
			}
		});
		(document.getElementById("calculate-half-life") as HTMLButtonElement).addEventListener("click", calculateHalfLife);
		(document.getElementById("half-life-solve-for") as HTMLSelectElement).addEventListener("change", function(this: HTMLSelectElement){
			let solveFor=this.value;
			let displayStyle=(solveFor=="time"||solveFor=="half-life")?"block":"none";
			(document.getElementById("remaining-quantity-group") as HTMLElement).style.display=displayStyle;
		});
		(document.getElementById("calculate-cell-potential") as HTMLButtonElement).addEventListener("click", calculateCellPotential);
		(document.getElementById("calculate-nernst") as HTMLButtonElement).addEventListener("click", calculateNernst);
		(document.getElementById("calculate-electrolysis") as HTMLButtonElement).addEventListener("click", calculateElectrolysis);
		(document.getElementById("calculate-bond-type") as HTMLButtonElement).addEventListener("click", () => {
			try {
				predictBondType(this.elementsData);
			} catch (e: any) {
				let result = document.getElementById("bond-result") as HTMLElement;
				if (result) result.textContent = e.message || "An error occurred";
			}
		});
		// Enter key support for all calculator inputs
		// Dilution
		this.addEnterListener("dilution-M1", calculateDilution);
		this.addEnterListener("dilution-V1", calculateDilution);
		this.addEnterListener("dilution-M2", calculateDilution);
		this.addEnterListener("dilution-V2", calculateDilution);
		// Mass percent
		this.addEnterListener("mass-solute", calculateMassPercent);
		this.addEnterListener("mass-solution", calculateMassPercent);
		// Solution mixing
		this.addEnterListener("mix-C1", calculateMixing);
		this.addEnterListener("mix-V1", calculateMixing);
		this.addEnterListener("mix-C2", calculateMixing);
		this.addEnterListener("mix-V2", calculateMixing);
		// Ideal gas law
		this.addEnterListener("ideal-P", calculateIdealGasLaw);
		this.addEnterListener("ideal-V", calculateIdealGasLaw);
		this.addEnterListener("ideal-n", calculateIdealGasLaw);
		this.addEnterListener("ideal-T", calculateIdealGasLaw);
		// Combined gas law
		this.addEnterListener("combined-P1", calculateCombinedGasLaw);
		this.addEnterListener("combined-V1", calculateCombinedGasLaw);
		this.addEnterListener("combined-T1", calculateCombinedGasLaw);
		this.addEnterListener("combined-P2", calculateCombinedGasLaw);
		this.addEnterListener("combined-V2", calculateCombinedGasLaw);
		this.addEnterListener("combined-T2", calculateCombinedGasLaw);
		// Van der Waals
		this.addEnterListener("vdw-V", calculateVanDerWaals);
		this.addEnterListener("vdw-n", calculateVanDerWaals);
		this.addEnterListener("vdw-T", calculateVanDerWaals);
		this.addEnterListener("vdw-a", calculateVanDerWaals);
		this.addEnterListener("vdw-b", calculateVanDerWaals);
		// Cell potential
		this.addEnterListener("E1", calculateCellPotential);
		this.addEnterListener("E2", calculateCellPotential);
		// Nernst
		this.addEnterListener("E-standard", calculateNernst);
		this.addEnterListener("temperature", calculateNernst);
		this.addEnterListener("n-electrons", calculateNernst);
		this.addEnterListener("Q-reaction", calculateNernst);
		// Electrolysis
		this.addEnterListener("electrolysis-m", calculateElectrolysis);
		this.addEnterListener("electrolysis-I", calculateElectrolysis);
		this.addEnterListener("electrolysis-t", calculateElectrolysis);
		this.addEnterListener("electrolysis-z", calculateElectrolysis);
		this.addEnterListener("electrolysis-M", calculateElectrolysis);
		// Bond type
		this.addEnterListener("element1-input", () => { predictBondType(this.elementsData); });
		this.addEnterListener("element2-input", () => { predictBondType(this.elementsData); });
	}

	private addEnterListener(id: string, handler: () => void): void {
		let el=document.getElementById(id) as HTMLInputElement;
		if (el) el.addEventListener("keyup", function(e: KeyboardEvent){
			if (e.key==="Enter") handler();
		});
	}

	private lookUpElement(): void {
		let input=document.getElementById("element-input") as HTMLInputElement;
		let inputValue=input.value.trim().toLowerCase();
		input.classList.remove("error");
		let element: ChemicalElement|null=null;
		for (let i=0; i<this.elementsData.length; i++){
			let currentElement=this.elementsData[i];
			if (currentElement.symbol.toLowerCase()==inputValue||currentElement.name.toLowerCase()==inputValue){
				element=currentElement;
				break;
			}
		}
		let elementInfo=document.getElementById("element-info") as HTMLElement;
		if (element!=null){
			let info="<p><strong>Symbol:</strong> "+EventListenerInitializer.escapeHtml(element.symbol)+"</p>"+
				"<p><strong>Name:</strong> "+EventListenerInitializer.escapeHtml(element.name)+"</p>"+
				"<p><strong>Atomic Mass:</strong> "+EventListenerInitializer.escapeHtml(element.atomicMass)+" u</p>"+
				"<p><strong>Atomic Number:</strong> "+EventListenerInitializer.escapeHtml(element.atomicNumber)+"</p>"+
				"<p><strong>Electronegativity:</strong> "+(element.electronegativity!=null?EventListenerInitializer.escapeHtml(element.electronegativity):"N/A")+"</p>"+
				"<p><strong>Electron Affinity:</strong> "+(element.electronAffinity!=null?EventListenerInitializer.escapeHtml(element.electronAffinity):"N/A")+" kJ/mol</p>"+
				"<p><strong>Atomic Radius:</strong> "+(element.atomicRadius!=null?EventListenerInitializer.escapeHtml(element.atomicRadius):"N/A")+" pm</p>"+
				"<p><strong>Ionization Energy:</strong> "+(element.ionizationEnergy!=null?EventListenerInitializer.escapeHtml(element.ionizationEnergy):"N/A")+" kJ/mol</p>"+
				"<p><strong>Valence Electrons:</strong> "+EventListenerInitializer.escapeHtml(element.valenceElectrons)+"</p>"+
				"<p><strong>Total Electrons:</strong> "+EventListenerInitializer.escapeHtml(element.totalElectrons)+"</p>"+
				"<p><strong>Group:</strong> "+EventListenerInitializer.escapeHtml(element.group)+"</p>"+
				"<p><strong>Period:</strong> "+EventListenerInitializer.escapeHtml(element.period)+"</p>"+
				"<p><strong>Type:</strong> "+EventListenerInitializer.escapeHtml(element.type)+"</p>";
			elementInfo.innerHTML=info;
			elementInfo.classList.add("show");
		}
		else{
			elementInfo.innerHTML="<p>Element not found</p>";
			elementInfo.classList.add("show");
			input.classList.add("error");
		}
	}

	private calculateMass(): void {
		let input=document.getElementById("formula-input") as HTMLInputElement;
		let formula=input.value.trim();
		input.classList.remove("error");
		let massResult=document.getElementById("mass-result") as HTMLElement;
		if (formula==""){
			massResult.innerHTML="<p>Please enter a chemical formula</p>";
			massResult.classList.add("show");
			input.classList.add("error");
			return;
		}
		try{
			let totalMass=calculateMolarMass(formula, this.elementsData);
			massResult.innerHTML="<p>Molar Mass: "+totalMass.toFixed(2)+" g/mol</p>";
			massResult.classList.add("show");
		}
		catch (error){
			massResult.innerHTML="<p>"+(error as Error).message+"</p>";
			massResult.classList.add("show");
			input.classList.add("error");
		}
	}

	private balanceEquations(): void {
		let input=document.getElementById("equation-input") as HTMLInputElement;
		let equation=input.value.trim();
		input.classList.remove("error");
		let balanceResult=document.getElementById("balance-result") as HTMLElement;
		if (equation==""){
			balanceResult.innerHTML="<p>Please enter a chemical equation</p>";
			balanceResult.classList.add("show");
			input.classList.add("error");
			return;
		}
		try{
			balanceResult.innerHTML="Balancing...";
			balanceResult.classList.add("show");
			let balancedEquation=balanceEquation(equation);
			balanceResult.innerHTML="<p>Balanced Equation: "+balancedEquation+"</p>";
			balanceResult.classList.add("show");
		}
		catch (error){
			balanceResult.innerHTML="<p>"+(error as Error).message+"</p>";
			balanceResult.classList.add("show");
			input.classList.add("error");
		}
	}

	private static escapeHtml(str: string|number|undefined|null): string {
		if (str==null) return "";
		return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	}
}

/**
 * Backwards-compatible wrapper that creates an {@link EventListenerInitializer}
 * instance and runs the initialization.
 */
export function initializeEventListeners(elementsData: ChemicalElement[]): void {
	new EventListenerInitializer(elementsData).initialize();
}
