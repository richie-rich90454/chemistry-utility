let gasConstant: number=8.314;
let faradayConstant: number=96485;
export function calculateCellPotential(): void{
	let E1=parseFloat((document.getElementById("E1") as HTMLInputElement).value);
	let E2=parseFloat((document.getElementById("E2") as HTMLInputElement).value);
	let inputs=document.querySelectorAll("#cell-potential input") as NodeListOf<HTMLInputElement>;
	for (let i=0; i<inputs.length; i++){
		inputs[i].classList.remove("error");
	}
	let resultDiv=document.getElementById("cell-potential-result") as HTMLElement;
	if (isNaN(E1)||isNaN(E2)){
		resultDiv.innerHTML="<p>Please enter valid numbers for both potentials.</p>";
		resultDiv.classList.add("show");
		(document.getElementById("E1") as HTMLInputElement).classList.add("error");
		(document.getElementById("E2") as HTMLInputElement).classList.add("error");
		return;
	}
	let E_cathode=Math.max(E1, E2);
	let E_anode=Math.min(E1, E2);
	let E_cell=E_cathode-E_anode;
	let result="<p>The half-reaction with E&deg;="+E_cathode+" V is the cathode, and the one with E&deg;="+E_anode+" V is the anode.</p>"+"<p>The standard cell potential E&deg;_cell="+E_cell.toFixed(3)+" V</p>";
	resultDiv.innerHTML=result;
	resultDiv.classList.add("show");
}
export function calculateNernst(): void{
	let E_standard=parseFloat((document.getElementById("E-standard") as HTMLInputElement).value);
	let T=parseFloat((document.getElementById("temperature") as HTMLInputElement).value);
	let n=parseFloat((document.getElementById("n-electrons") as HTMLInputElement).value);
	let Q=parseFloat((document.getElementById("Q-reaction") as HTMLInputElement).value);
	let inputs=document.querySelectorAll("#nernst-equation input") as NodeListOf<HTMLInputElement>;
	for (let i=0; i<inputs.length; i++){
		inputs[i].classList.remove("error");
	}
	let resultDiv=document.getElementById("nernst-result") as HTMLElement;
	if (isNaN(E_standard)||isNaN(T)||isNaN(n)||isNaN(Q)||T<=0||n<=0||Q<=0){
		resultDiv.innerHTML="<p>Please enter valid positive numbers for all fields.</p>";
		resultDiv.classList.add("show");
		for (let i=0; i<inputs.length; i++){
			inputs[i].classList.add("error");
		}
		return;
	}
	let E=E_standard-((gasConstant*T)/(n*faradayConstant))*Math.log(Q);
	resultDiv.innerHTML="<p>The cell potential E="+E.toFixed(3)+" V</p>";
	resultDiv.classList.add("show");
}
export function calculateElectrolysis(): void{
	let select=document.getElementById("electrolysis-solve-for") as HTMLSelectElement;
	let solveFor=select.value;
	let m=parseFloat((document.getElementById("electrolysis-m") as HTMLInputElement).value);
	let I=parseFloat((document.getElementById("electrolysis-I") as HTMLInputElement).value);
	let t=parseFloat((document.getElementById("electrolysis-t") as HTMLInputElement).value);
	let z=parseFloat((document.getElementById("electrolysis-z") as HTMLInputElement).value);
	let M=parseFloat((document.getElementById("electrolysis-M") as HTMLInputElement).value);
	let inputs=document.querySelectorAll("#electrolysis input") as NodeListOf<HTMLInputElement>;
	for (let i=0; i<inputs.length; i++){
		inputs[i].classList.remove("error");
	}
	let resultDiv=document.getElementById("electrolysis-result") as HTMLElement;
	if (solveFor=="mass"){
		if (isNaN(I)||isNaN(t)||isNaN(z)||isNaN(M)||I<=0||t<=0||z<=0||M<=0){
			resultDiv.innerHTML="<p>Please enter valid positive numbers for I, t, z, and M.</p>";
			resultDiv.classList.add("show");
			(document.getElementById("electrolysis-I") as HTMLInputElement).classList.add("error");
			(document.getElementById("electrolysis-t") as HTMLInputElement).classList.add("error");
			(document.getElementById("electrolysis-z") as HTMLInputElement).classList.add("error");
			(document.getElementById("electrolysis-M") as HTMLInputElement).classList.add("error");
			return;
		}
		let n=(I*t)/(faradayConstant*z);
		let mass=n*M;
		resultDiv.innerHTML="<p>The mass deposited m="+mass.toFixed(3)+" g</p>";
		resultDiv.classList.add("show");
	}
	else if (solveFor=="current"){
		if (isNaN(m)||isNaN(t)||isNaN(z)||isNaN(M)||m<=0||t<=0||z<=0||M<=0){
			resultDiv.innerHTML="<p>Please enter valid positive numbers for m, t, z, and M.</p>";
			resultDiv.classList.add("show");
			(document.getElementById("electrolysis-m") as HTMLInputElement).classList.add("error");
			(document.getElementById("electrolysis-t") as HTMLInputElement).classList.add("error");
			(document.getElementById("electrolysis-z") as HTMLInputElement).classList.add("error");
			(document.getElementById("electrolysis-M") as HTMLInputElement).classList.add("error");
			return;
		}
		let n=m/M;
		let current=(n*faradayConstant*z)/t;
		resultDiv.innerHTML="<p>The current I="+current.toFixed(3)+" A</p>";
		resultDiv.classList.add("show");
	}
	else if (solveFor=="time"){
		if (isNaN(m)||isNaN(I)||isNaN(z)||isNaN(M)||m<=0||I<=0||z<=0||M<=0){
			resultDiv.innerHTML="<p>Please enter valid positive numbers for m, I, z, and M.</p>";
			resultDiv.classList.add("show");
			(document.getElementById("electrolysis-m") as HTMLInputElement).classList.add("error");
			(document.getElementById("electrolysis-I") as HTMLInputElement).classList.add("error");
			(document.getElementById("electrolysis-z") as HTMLInputElement).classList.add("error");
			(document.getElementById("electrolysis-M") as HTMLInputElement).classList.add("error");
			return;
		}
		let n=m/M;
		let time=(n*faradayConstant*z)/I;
		resultDiv.innerHTML="<p>The time t="+time.toFixed(3)+" s</p>";
		resultDiv.classList.add("show");
	}
}