export function calculateIdealGasLaw(): void{
	try{
		let select=document.getElementById("ideal-solve-for") as HTMLSelectElement;
		let solveFor=select.value;
		let unitsSelect=document.getElementById("ideal-R-units") as HTMLSelectElement;
		let units=unitsSelect.value;
		let R=units=="atm-L"?0.08206:8.314;
		let P=parseFloat((document.getElementById("ideal-P") as HTMLInputElement).value);
		let V=parseFloat((document.getElementById("ideal-V") as HTMLInputElement).value);
		let n=parseFloat((document.getElementById("ideal-n") as HTMLInputElement).value);
		let T=parseFloat((document.getElementById("ideal-T") as HTMLInputElement).value);
		let result: number, formula: string;
		let inputs=document.querySelectorAll("#ideal-gas-law input") as NodeListOf<HTMLInputElement>;
		for (let i=0; i<inputs.length; i++){
			inputs[i].classList.remove("error");
		}
		if (solveFor=="P"){
			validateInputs([V, n, T], ["ideal-V", "ideal-n", "ideal-T"]);
			result=(n*R*T)/V;
			formula="P=(nRT)/V";
		}
		else if (solveFor=="V"){
			validateInputs([P, n, T], ["ideal-P", "ideal-n", "ideal-T"]);
			result=(n*R*T)/P;
			formula="V=(nRT)/P";
		}
		else if (solveFor=="n"){
			validateInputs([P, V, T], ["ideal-P", "ideal-V", "ideal-T"]);
			result=(P*V)/(R*T);
			formula="n=(PV)/(RT)";
		}
		else if (solveFor=="T"){
			validateInputs([P, V, n], ["ideal-P", "ideal-V", "ideal-n"]);
			result=(P*V)/(n*R);
			formula="T=(PV)/(nR)";
		}
		else{
			throw new Error("Invalid solveFor");
		}
		let unit: string;
		if (solveFor=="P"){
			unit=units=="atm-L"?"atm":"Pa";
		}
		else if (solveFor=="V"){
			unit=units=="atm-L"?"L":"m³";
		}
		else if (solveFor=="n"){
			unit="mol";
		}
		else{
			unit="K";
		}
		let resultDiv=document.getElementById("ideal-result") as HTMLElement;
		resultDiv.innerHTML="<p>"+formula+"</p><p>Result: "+result.toFixed(4)+" "+unit+"</p>";
		resultDiv.classList.add("show");
	}
	catch (error){
		let resultDiv=document.getElementById("ideal-result") as HTMLElement;
		resultDiv.innerHTML="<p>Error: "+(error as Error).message+"</p>";
		resultDiv.classList.add("show");
	}
}
export function calculateCombinedGasLaw(): void{
	try{
		let select=document.getElementById("combined-solve-for") as HTMLSelectElement;
		let solveFor=select.value;
		let P1=parseFloat((document.getElementById("combined-P1") as HTMLInputElement).value);
		let V1=parseFloat((document.getElementById("combined-V1") as HTMLInputElement).value);
		let T1=parseFloat((document.getElementById("combined-T1") as HTMLInputElement).value);
		let P2=parseFloat((document.getElementById("combined-P2") as HTMLInputElement).value);
		let V2=parseFloat((document.getElementById("combined-V2") as HTMLInputElement).value);
		let T2=parseFloat((document.getElementById("combined-T2") as HTMLInputElement).value);
		let result: number, formula: string;
		let inputs=document.querySelectorAll("#combined-gas-law input") as NodeListOf<HTMLInputElement>;
		for (let i=0; i<inputs.length; i++){
			inputs[i].classList.remove("error");
		}
		if (solveFor=="P1"){
			validateInputs([V1, T1, P2, V2, T2], ["combined-V1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"]);
			result=(P2*V2*T1)/(V1*T2);
			formula="P<sub>1</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(V<sub>1</sub> T<sub>2</sub>)";
		}
		else if (solveFor=="V1"){
			validateInputs([P1, T1, P2, V2, T2], ["combined-P1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"]);
			result=(P2*V2*T1)/(P1*T2);
			formula="V<sub>1</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(P<sub>1</sub> T<sub>2</sub>)";
		}
		else if (solveFor=="T1"){
			validateInputs([P1, V1, P2, V2, T2], ["combined-P1", "combined-V1", "combined-P2", "combined-V2", "combined-T2"]);
			result=(P1*V1*T2)/(P2*V2);
			formula="T<sub>1</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(P<sub>2</sub> V<sub>2</sub>)";
		}
		else if (solveFor=="P2"){
			validateInputs([P1, V1, T1, V2, T2], ["combined-P1", "combined-V1", "combined-T1", "combined-V2", "combined-T2"]);
			result=(P1*V1*T2)/(V2*T1);
			formula="P<sub>2</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(V<sub>2</sub> T<sub>1</sub>)";
		}
		else if (solveFor=="V2"){
			validateInputs([P1, V1, T1, P2, T2], ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-T2"]);
			result=(P1*V1*T2)/(P2*T1);
			formula="V<sub>2</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(P<sub>2</sub> T<sub>1</sub>)";
		}
		else if (solveFor=="T2"){
			validateInputs([P1, V1, T1, P2, V2], ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-V2"]);
			result=(P2*V2*T1)/(P1*V1);
			formula="T<sub>2</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(P<sub>1</sub> V<sub>1</sub>)";
		}
		else{
			throw new Error("Invalid solveFor");
		}
		let unit: string;
		if (solveFor.includes("P")){
			unit="pressure units";
		}
		else if (solveFor.includes("V")){
			unit="volume units";
		}
		else if (solveFor.includes("T")){
			unit="K";
		}
		else{
			unit="";
		}
		let resultDiv=document.getElementById("combined-result") as HTMLElement;
		resultDiv.innerHTML="<p>"+formula+"</p><p>Result: "+result.toFixed(4)+" "+unit+"</p>";
		resultDiv.classList.add("show");
	}
	catch (error){
		let resultDiv=document.getElementById("combined-result") as HTMLElement;
		resultDiv.innerHTML="<p>Error: "+(error as Error).message+"</p>";
		resultDiv.classList.add("show");
	}
}
export function calculateVanDerWaals(): void{
	try{
		let V=parseFloat((document.getElementById("vdw-V") as HTMLInputElement).value);
		let n=parseFloat((document.getElementById("vdw-n") as HTMLInputElement).value);
		let T=parseFloat((document.getElementById("vdw-T") as HTMLInputElement).value);
		let a=parseFloat((document.getElementById("vdw-a") as HTMLInputElement).value);
		let b=parseFloat((document.getElementById("vdw-b") as HTMLInputElement).value);
		let inputs=document.querySelectorAll("#van-der-waals input") as NodeListOf<HTMLInputElement>;
		for (let i=0; i<inputs.length; i++){
			inputs[i].classList.remove("error");
		}
		validateInputs([V, n, T, a, b], ["vdw-V", "vdw-n", "vdw-T", "vdw-a", "vdw-b"]);
		let R=0.08206;
		let P=(n*R*T)/(V-n*b)-a*Math.pow(n/V, 2);
		let resultDiv=document.getElementById("vdw-result") as HTMLElement;
		resultDiv.innerHTML="<p>P="+P.toFixed(4)+" atm</p>";
		resultDiv.classList.add("show");
	}
	catch (error){
		let resultDiv=document.getElementById("vdw-result") as HTMLElement;
		resultDiv.innerHTML="<p>Error: "+(error as Error).message+"</p>";
		resultDiv.classList.add("show");
	}
}
export function calculateHalfLife(): void{
	try{
		let select=document.getElementById("half-life-solve-for") as HTMLSelectElement;
		let solveFor=select.value;
		let N0=parseFloat((document.getElementById("initial-quantity") as HTMLInputElement).value);
		let t=parseFloat((document.getElementById("time-input") as HTMLInputElement).value);
		let t_half=parseFloat((document.getElementById("half-life-input") as HTMLInputElement).value);
		let Nt=parseFloat((document.getElementById("remaining-quantity") as HTMLInputElement).value);
		let inputs=document.querySelectorAll("#half-life-calc input") as NodeListOf<HTMLInputElement>;
		for (let i=0; i<inputs.length; i++){
			inputs[i].classList.remove("error");
		}
		let result: number;
		if (solveFor=="remaining"){
			validateInputs([N0, t, t_half], ["initial-quantity", "time-input", "half-life-input"]);
			result=N0*Math.pow(0.5, t/t_half);
			let resultDiv=document.getElementById("half-life-result") as HTMLElement;
			resultDiv.innerHTML="<p>Remaining: "+result.toFixed(4)+" (after "+t+" units)</p>";
			resultDiv.classList.add("show");
		}
		else if (solveFor=="time"){
			validateInputs([N0, t_half, Nt], ["initial-quantity", "half-life-input", "remaining-quantity"]);
			result=(Math.log(Nt/N0)/Math.log(0.5))*t_half;
			let resultDiv=document.getElementById("half-life-result") as HTMLElement;
			resultDiv.innerHTML="<p>Time needed: "+result.toFixed(4)+" units</p>";
			resultDiv.classList.add("show");
		}
		else if (solveFor=="half-life"){
			validateInputs([N0, t, Nt], ["initial-quantity", "time-input", "remaining-quantity"]);
			result=t/(Math.log(Nt/N0)/Math.log(0.5));
			let resultDiv=document.getElementById("half-life-result") as HTMLElement;
			resultDiv.innerHTML="<p>Half-life: "+result.toFixed(4)+" units</p>";
			resultDiv.classList.add("show");
		}
	}
	catch (error){
		let resultDiv=document.getElementById("half-life-result") as HTMLElement;
		resultDiv.innerHTML="<p>Error: "+(error as Error).message+"</p>";
		resultDiv.classList.add("show");
	}
}
function validateInputs(inputs: number[], ids: string[]): void{
	for (let i=0; i<inputs.length; i++){
		if (isNaN(inputs[i])){
			if (ids&&ids[i]){
				let input=document.getElementById(ids[i]) as HTMLInputElement;
				input.classList.add("error");
			}
			throw new Error("Please fill all required fields with valid numbers");
		}
	}
}