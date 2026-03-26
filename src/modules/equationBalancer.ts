function parseFormulaToCounts(formula: string): Record<string, number>{
	let stack: { multiplier: number; counts: Record<string, number> }[]=[];
	let currentCounts: Record<string, number>={};
	let currentMultiplier=1;
	let i=0;
	while (i<formula.length){
		let ch=formula[i];
		if (ch==='('){
			stack.push({ multiplier: currentMultiplier, counts: currentCounts });
			currentMultiplier=1;
			currentCounts={};
			i++;
		}
		else if (ch===')'){
			let j=i+1;
			let numStr="";
			while (j<formula.length&&formula[j]>='0'&&formula[j]<='9'){
				numStr+=formula[j];
				j++;
			}
			let repeat=numStr.length?parseInt(numStr,10):1;
			let prev=stack.pop()!;
			let multiplied: Record<string, number>={};
			for (let el in currentCounts){
				multiplied[el]=(currentCounts[el]||0)*repeat;
			}
			for (let el in multiplied){
				prev.counts[el]=(prev.counts[el]||0)+multiplied[el];
			}
			currentCounts=prev.counts;
			currentMultiplier=prev.multiplier;
			i=j;
		}
		else{
			let j=i;
			while (j<formula.length&&formula[j]!=='('&&formula[j]!==')'){
				j++;
			}
			let segment=formula.substring(i,j);
			let k=0;
			while (k<segment.length){
				if (segment[k]>='A'&&segment[k]<='Z'){
					let element=segment[k];
					k++;
					if (k<segment.length&&segment[k]>='a'&&segment[k]<='z'){
						element+=segment[k];
						k++;
					}
					let numStr="";
					while (k<segment.length&&segment[k]>='0'&&segment[k]<='9'){
						numStr+=segment[k];
						k++;
					}
					let count=numStr.length?parseInt(numStr,10):1;
					currentCounts[element]=(currentCounts[element]||0)+count*currentMultiplier;
				}
				else{
					k++;
				}
			}
			i=j;
		}
	}
	return currentCounts;
}
export function parseEquation(equation: string): { reactants: string[]; products: string[] }{
	let sides=equation.split("->");
	if (sides.length!==2){
		throw new Error("Equation must contain exactly one '->'");
	}
	let left=sides[0].trim();
	let right=sides[1].trim();
	if (left.length===0||right.length===0){
		throw new Error("Both sides of the equation must contain at least one compound");
	}
	let reactants=left.split("+").map(s=>s.trim()).filter(s=>s.length>0);
	let products=right.split("+").map(s=>s.trim()).filter(s=>s.length>0);
	if (reactants.length===0||products.length===0){
		throw new Error("Each side must contain at least one compound");
	}
	return { reactants, products };
}
function gcd(a: number, b: number): number{
	a=Math.abs(a);
	b=Math.abs(b);
	while (b!==0){
		let t=b;
		b=a%b;
		a=t;
	}
	return a;
}
function lcm(a: number, b: number): number{
	if (a===0||b===0) return 0;
	return (a/gcd(a,b))*b;
}
function lcmArray(nums: number[]): number{
	return nums.reduce((acc,n)=>lcm(acc,n),1);
}
class Fraction{
	numerator: number;
	denominator: number;
	constructor(numerator: number, denominator: number){
		if (denominator===0){
			throw new Error("Denominator cannot be zero");
		}
		this.numerator=numerator;
		this.denominator=denominator;
		this.normalize();
	}
	normalize(): void{
		if (this.denominator<0){
			this.numerator=-this.numerator;
			this.denominator=-this.denominator;
		}
		let g=gcd(Math.abs(this.numerator),this.denominator);
		if (g!==0){
			this.numerator/=g;
			this.denominator/=g;
		}
	}
	isZero(): boolean{
		return this.numerator===0;
	}
	equals(other: Fraction): boolean{
		return this.numerator===other.numerator&&this.denominator===other.denominator;
	}
	add(other: Fraction): Fraction{
		let num=this.numerator*other.denominator+other.numerator*this.denominator;
		let den=this.denominator*other.denominator;
		return new Fraction(num,den);
	}
	sub(other: Fraction): Fraction{
		let num=this.numerator*other.denominator-other.numerator*this.denominator;
		let den=this.denominator*other.denominator;
		return new Fraction(num,den);
	}
	mul(other: Fraction): Fraction{
		return new Fraction(this.numerator*other.numerator,this.denominator*other.denominator);
	}
	div(other: Fraction): Fraction{
		if (other.isZero()){
			throw new Error("Division by zero");
		}
		return new Fraction(this.numerator*other.denominator,this.denominator*other.numerator);
	}
	static fromNumber(n: number): Fraction{
		return new Fraction(n,1);
	}
}
interface RREFResult{
	solution: Fraction[];
	hasSolution: boolean;
}
function solveHomogeneous(matrix: Fraction[][]): RREFResult{
	let m=matrix.length;
	let n=matrix[0].length;
	let rref: Fraction[][]=matrix.map(row=>row.map(cell=>new Fraction(cell.numerator,cell.denominator)));
	let row=0;
	let pivotCols: number[]=[];
	for (let col=0; col<n&&row<m; col++){
		let pivot=row;
		while (pivot<m&&rref[pivot][col].isZero()){
			pivot++;
		}
		if (pivot===m) continue;
		[rref[row],rref[pivot]]=[rref[pivot],rref[row]];
		pivotCols.push(col);
		let pivotVal=rref[row][col];
		for (let j=col; j<n; j++){
			rref[row][j]=rref[row][j].div(pivotVal);
		}
		for (let i=0; i<m; i++){
			if (i!==row&&!rref[i][col].isZero()){
				let factor=rref[i][col];
				for (let j=col; j<n; j++){
					rref[i][j]=rref[i][j].sub(factor.mul(rref[row][j]));
				}
			}
		}
		row++;
	}
	let isPivot=new Array(n).fill(false);
	for (let col of pivotCols){
		isPivot[col]=true;
	}
	if (pivotCols.length===n){
		return { solution: [], hasSolution: false };
	}
	let solution=new Array<Fraction>(n).fill(Fraction.fromNumber(0));
	for (let j=0; j<n; j++){
		if (!isPivot[j]){
			solution[j]=Fraction.fromNumber(1);
		}
	}
	for (let i=0; i<pivotCols.length; i++){
		let col=pivotCols[i];
		let sum=Fraction.fromNumber(0);
		for (let j=0; j<n; j++){
			if (!isPivot[j]&&!rref[i][j].isZero()){
				sum=sum.add(rref[i][j].mul(solution[j]));
			}
		}
		solution[col]=sum.mul(Fraction.fromNumber(-1));
	}
	return { solution, hasSolution: true };
}
export function balanceEquation(equation: string, maxCoefficient: number=4000): string{
	let { reactants, products }=parseEquation(equation);
	let allCompounds=[...reactants,...products];
	let nCompounds=allCompounds.length;
	let parsed=allCompounds.map(comp=>parseFormulaToCounts(comp));
	let elementSet=new Set<string>();
	for (let counts of parsed){
		for (let el of Object.keys(counts)){
			elementSet.add(el);
		}
	}
	let elements=Array.from(elementSet);
	let nElements=elements.length;
	if (nElements===0){
		let left=reactants.map((c,i)=>(i>0?"+":"")+c).join("");
		let right=products.map((c,i)=>(i>0?"+":"")+c).join("");
		return left+" -> "+right;
	}
	let A: Fraction[][]=[];
	for (let i=0; i<nElements; i++){
		let el=elements[i];
		let row: Fraction[]=[];
		for (let j=0; j<nCompounds; j++){
			let count=parsed[j][el]||0;
			let sign=j<reactants.length?1:-1;
			row.push(Fraction.fromNumber(sign*count));
		}
		A.push(row);
	}
	let { solution, hasSolution }=solveHomogeneous(A);
	if (!hasSolution){
		throw new Error("The chemical equation cannot be balanced (only trivial solution exists).");
	}
	let denominators=solution.map(frac=>frac.denominator);
	let commonDen=lcmArray(denominators);
	let intCoeffs=solution.map(frac=>Math.round(frac.numerator*(commonDen/frac.denominator)));
	if (intCoeffs.some(c=>c===0)){
		throw new Error("One or more compounds have coefficient zero – the equation cannot be balanced as given.");
	}
	let allPositive=intCoeffs.every(c=>c>0);
	if (!allPositive){
		for (let i=0; i<intCoeffs.length; i++){
			intCoeffs[i]=-intCoeffs[i];
		}
		allPositive=intCoeffs.every(c=>c>0);
		if (!allPositive){
			throw new Error("Unable to obtain all positive coefficients – the equation may be unbalanced by nature.");
		}
		if (intCoeffs.some(c=>c===0)){
			throw new Error("One or more compounds have coefficient zero – the equation cannot be balanced as given.");
		}
	}
	let g=intCoeffs.reduce(gcd,0);
	if (g>1){
		for (let i=0; i<intCoeffs.length; i++){
			intCoeffs[i]/=g;
		}
	}
	if (intCoeffs.some(c=>Math.abs(c)>maxCoefficient)){
		throw new Error(`No solution found with coefficients up to ${maxCoefficient}`);
	}
	let leftSide=reactants.map((c,i)=>{
		let coeff=intCoeffs[i];
		return coeff===1?c:`${coeff}${c}`;
	}).join("+");
	let rightSide=products.map((c,i)=>{
		let coeff=intCoeffs[reactants.length+i];
		return coeff===1?c:`${coeff}${c}`;
	}).join("+");
	return `${leftSide} -> ${rightSide}`;
}