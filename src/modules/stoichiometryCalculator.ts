interface Term{
	formula: string;
	coefficient: number;
}
interface BalancedEquation{
	reactants: Term[];
	products: Term[];
}
export function parseBalancedEquation(equation: string): BalancedEquation{
	let cleanedEquation=equation.replace(/\s+/g, "");
	let parts=cleanedEquation.split("->");
	if (parts.length!=2){
		throw new Error("Invalid equation format: missing \"->\"");
	}
	let reactants=parts[0].split("+");
	let products=parts[1].split("+");
	let parsedReactants: Term[]=[];
	let parsedProducts: Term[]=[];
	for (let i=0; i<reactants.length; i++){
		parsedReactants.push(parseTerm(reactants[i]));
	}
	for (let i=0; i<products.length; i++){
		parsedProducts.push(parseTerm(products[i]));
	}
	return{
		reactants: parsedReactants, products: parsedProducts
	};
}
export function parseTerm(term: string): Term{
	let match=term.match(/^(\d+)?(.+)$/);
	if (!match){
		throw new Error("Invalid term: "+term);
	}
	let coefficient=match[1]?parseInt(match[1]):1;
	let formula=match[2];
	return{ formula: formula, coefficient: coefficient };
}
export function getCalculationType(equation: string): void{
	let parsed=parseBalancedEquation(equation);
	let inputsDiv=document.getElementById("stoich-inputs") as HTMLElement;
	inputsDiv.innerHTML="";
	let type=(document.getElementById("calculation-type") as HTMLSelectElement).value;
	if (type=="product-from-reactant"){
		let reactantOptions="";
		for (let i=0; i<parsed.reactants.length; i++){
			let reactant=parsed.reactants[i];
			reactantOptions=reactantOptions+"<option value=\""+reactant.formula+"\">"+reactant.formula+"</option>";
		}
		let reactantSelect="<select id=\"reactant-select\">"+reactantOptions+"</select>";
		let molesInput="<input type=\"number\" id=\"reactant-moles\" placeholder=\"Moles of reactant\" min=\"0\" step=\"any\">";
		let productOptions="";
		for (let i=0; i<parsed.products.length; i++){
			let product=parsed.products[i];
			productOptions=productOptions+"<option value=\""+product.formula+"\">"+product.formula+"</option>";
		}
		let productSelect="<select id=\"product-select\">"+productOptions+"</select>";
		inputsDiv.innerHTML="<p>Select reactant: "+reactantSelect+"</p><p>Enter moles: "+molesInput+"</p><p>Select product: "+productSelect+"</p>";
		inputsDiv.classList.add("show");
	}
	else if (type=="reactant-from-product"){
		let productOptions="";
		for (let i=0; i<parsed.products.length; i++){
			let product=parsed.products[i];
			productOptions=productOptions+"<option value=\""+product.formula+"\">"+product.formula+"</option>";
		}
		let productSelect="<select id=\"product-select\">"+productOptions+"</select>";
		let molesInput="<input type=\"number\" id=\"product-moles\" placeholder=\"Moles of product\" min=\"0\" step=\"any\">";
		let reactantOptions="";
		for (let i=0; i<parsed.reactants.length; i++){
			let reactant=parsed.reactants[i];
			reactantOptions=reactantOptions+"<option value=\""+reactant.formula+"\">"+reactant.formula+"</option>";
		}
		let reactantSelect="<select id=\"reactant-select\">"+reactantOptions+"</select>";
		inputsDiv.innerHTML="<p>Select product: "+productSelect+"</p><p>Enter moles: "+molesInput+"</p><p>Select reactant: "+reactantSelect+"</p>";
		inputsDiv.classList.add("show");
	}
	else if (type=="limiting-reactant"){
		let reactantInputs="";
		for (let i=0; i<parsed.reactants.length; i++){
			let reactant=parsed.reactants[i];
			reactantInputs=reactantInputs+"<p>"+reactant.formula+": <input type=\"number\" id=\"moles-"+reactant.formula+"\" placeholder=\"Moles of "+reactant.formula+"\" min=\"0\" step=\"any\"></p>";
		}
		let productOptions="";
		for (let i=0; i<parsed.products.length; i++){
			let product=parsed.products[i];
			productOptions=productOptions+"<option value=\""+product.formula+"\">"+product.formula+"</option>";
		}
		let productSelect="<select id=\"product-select\">"+productOptions+"</select>";
		inputsDiv.innerHTML=reactantInputs+"<p>Select product to calculate: "+productSelect+"</p>";
		inputsDiv.classList.add("show");
	}
}
export function calculateStoichiometry(equation: string): void{
	let type=(document.getElementById("calculation-type") as HTMLSelectElement).value;
	let resultDiv=document.getElementById("stoich-result") as HTMLElement;
	let parsed=parseBalancedEquation(equation);
	if (type=="product-from-reactant"){
		let reactantSelect=document.getElementById("reactant-select") as HTMLSelectElement;
		let reactantFormula=reactantSelect.value;
		let molesInput=document.getElementById("reactant-moles") as HTMLInputElement;
		let molesReactant=parseFloat(molesInput.value);
		let productSelect=document.getElementById("product-select") as HTMLSelectElement;
		let productFormula=productSelect.value;
		let isMolesValid=!isNaN(molesReactant)&&molesReactant>0;
		if (!isMolesValid){
			molesInput.classList.add("error");
			throw new Error("Invalid moles input");
		}
		molesInput.classList.remove("error");
		let reactant: Term|null=null;
		for (let i=0; i<parsed.reactants.length; i++){
			if (parsed.reactants[i].formula==reactantFormula){
				reactant=parsed.reactants[i];
				break;
			}
		}
		let product: Term|null=null;
		for (let i=0; i<parsed.products.length; i++){
			if (parsed.products[i].formula==productFormula){
				product=parsed.products[i];
				break;
			}
		}
		if (reactant==null||product==null){
			throw new Error("Selected compound not found");
		}
		let molesProduct=(molesReactant/reactant.coefficient)*product.coefficient;
		resultDiv.innerHTML="<p>Moles of "+productFormula+": "+molesProduct.toFixed(2)+"</p>";
		resultDiv.classList.add("show");
	}
	else if (type=="reactant-from-product"){
		let productSelect=document.getElementById("product-select") as HTMLSelectElement;
		let productFormula=productSelect.value;
		let molesInput=document.getElementById("product-moles") as HTMLInputElement;
		let molesProduct=parseFloat(molesInput.value);
		let reactantSelect=document.getElementById("reactant-select") as HTMLSelectElement;
		let reactantFormula=reactantSelect.value;
		let isMolesValid=!isNaN(molesProduct)&&molesProduct>0;
		if (!isMolesValid){
			molesInput.classList.add("error");
			throw new Error("Invalid moles input");
		}
		molesInput.classList.remove("error");
		let product: Term|null=null;
		for (let i=0; i<parsed.products.length; i++){
			if (parsed.products[i].formula==productFormula){
				product=parsed.products[i];
				break;
			}
		}
		let reactant: Term|null=null;
		for (let i=0; i<parsed.reactants.length; i++){
			if (parsed.reactants[i].formula==reactantFormula){
				reactant=parsed.reactants[i];
				break;
			}
		}
		if (product==null||reactant==null){
			throw new Error("Selected compound not found");
		}
		let molesReactant=(molesProduct/product.coefficient)*reactant.coefficient;
		resultDiv.innerHTML="<p>Moles of "+reactantFormula+": "+molesReactant.toFixed(2)+"</p>";
		resultDiv.classList.add("show");
	}
	else if (type=="limiting-reactant"){
		let reactantMoles: Record<string, number>={};
		for (let i=0; i<parsed.reactants.length; i++){
			let reactant=parsed.reactants[i];
			let molesInput=document.getElementById("moles-"+reactant.formula) as HTMLInputElement;
			let moles=parseFloat(molesInput.value);
			let isMolesValid=!isNaN(moles)&&moles>0;
			if (!isMolesValid){
				molesInput.classList.add("error");
				throw new Error("Invalid moles for "+reactant.formula);
			}
			molesInput.classList.remove("error");
			reactantMoles[reactant.formula]=moles;
		}
		let productSelect=document.getElementById("product-select") as HTMLSelectElement;
		let productFormula=productSelect.value;
		let product: Term|null=null;
		for (let i=0; i<parsed.products.length; i++){
			if (parsed.products[i].formula==productFormula){
				product=parsed.products[i];
				break;
			}
		}
		if (product==null){
			throw new Error("Selected product not found");
		}
		let minRatio=Infinity;
		let limitingReactant: string|null=null;
		for (let i=0; i<parsed.reactants.length; i++){
			let reactant=parsed.reactants[i];
			let ratio=reactantMoles[reactant.formula]/reactant.coefficient;
			if (ratio<minRatio){
				minRatio=ratio;
				limitingReactant=reactant.formula;
			}
		}
		let molesProduct=minRatio*product.coefficient;
		resultDiv.innerHTML="<p>Limiting reactant: "+limitingReactant+"</p><p>Moles of "+productFormula+": "+molesProduct.toFixed(2)+"</p>";
		resultDiv.classList.add("show");
	}
}