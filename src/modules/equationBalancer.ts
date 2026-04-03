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
	return Math.abs(a*b)/gcd(a, b);
}
class Fraction{
	n: number;
	d: number;
	constructor(n: number, d: number=1){
		if (d===0) throw new Error("Denominator zero");
		this.n=n;
		this.d=d;
		this.simplify();
	}
	simplify(): void{
		let common=gcd(this.n, this.d);
		this.n/=common;
		this.d/=common;
		if (this.d<0){
			this.n=-this.n;
			this.d=-this.d;
		}
	}
	add(f: Fraction): Fraction{
		return new Fraction(this.n*f.d+f.n*this.d, this.d*f.d);
	}
	sub(f: Fraction): Fraction{
		return new Fraction(this.n*f.d-f.n*this.d, this.d*f.d);
	}
	mul(f: Fraction): Fraction{
		return new Fraction(this.n*f.n, this.d*f.d);
	}
	div(f: Fraction): Fraction{
		if (f.n===0) throw new Error("Div by zero");
		return new Fraction(this.n*f.d, this.d*f.n);
	}
	isZero(): boolean{
		return this.n===0;
	}
}
function parseFormulaToCounts(formula: string): Record<string, number>{
	let stack: Record<string, number>[]=[{}];
	let i=0;
	while (i<formula.length){
		let ch=formula[i];
		if (ch==="("||ch==="["||ch==="{"){
			stack.push({});
			i++;
		}
		else if (ch===")"||ch==="]"||ch==="}"){
			let top=stack.pop()!;
			i++;
			let start=i;
			while (i<formula.length&&/\d/.test(formula[i])) i++;
			let multiplier=parseInt(formula.substring(start, i), 10)||1;
			for (let el in top){
				stack[stack.length-1][el]=(stack[stack.length-1][el]||0)+top[el]*multiplier;
			}
		}
		else if (/[A-Z]/.test(ch)){
			let start=i++;
			while (i<formula.length&&/[a-z]/.test(formula[i])) i++;
			let el=formula.substring(start, i);
			start=i;
			while (i<formula.length&&/\d/.test(formula[i])) i++;
			let count=parseInt(formula.substring(start, i), 10)||1;
			stack[stack.length-1][el]=(stack[stack.length-1][el]||0)+count;
		}
		else if (ch==="+"||ch==="-"||/\d/.test(ch)){
			let sign=0;
			let mag=0;
			let start=i;
			while (i<formula.length&&/\d/.test(formula[i])) i++;
			let numStr=formula.substring(start, i);
			if (i<formula.length&&(formula[i]==="+"||formula[i]==="-")){
				sign=formula[i]==="+"?1:-1;
				mag=numStr===""?1:parseInt(numStr, 10);
				i++;
			}
			else if (ch==="+"||ch==="-" ){
				sign=ch==="+"?1:-1;
				i++;
				let numStart=i;
				while (i<formula.length&&/\d/.test(formula[i])) i++;
				let magStr=formula.substring(numStart, i);
				mag=magStr===""?1:parseInt(magStr, 10);
			}
			if (sign!==0){
				stack[stack.length-1]["_charge"]=(stack[stack.length-1]["_charge"]||0)+mag*sign;
			}
		}
		else i++;
	}
	return stack[0];
}
export function parseEquation(equation: string): { reactants: string[], products: string[] }{
	let sides=equation.split(/->|=/);
	if (sides.length!==2) throw new Error("Invalid format");
	let reactants=sides[0].split("+").map(s=>s.trim()).filter(s=>s.length>0);
	let products=sides[1].split("+").map(s=>s.trim()).filter(s=>s.length>0);
	return { reactants, products };
}
function solveHomogeneous(matrix: Fraction[][]): Fraction[]{
	let r=matrix.length;
	let c=matrix[0].length;
	let pivotRow=0;
	let pivotCol: number[]=[];
	for (let j=0;j<c&&pivotRow<r;j++){
		let sel=pivotRow;
		while (sel<r&&matrix[sel][j].isZero()) sel++;
		if (sel===r) continue;
		[matrix[pivotRow], matrix[sel]]=[matrix[sel], matrix[pivotRow]];
		let root=matrix[pivotRow][j];
		for (let k=j;k<c;k++) matrix[pivotRow][k]=matrix[pivotRow][k].div(root);
		for (let i=0;i<r;i++){
			if (i!==pivotRow){
				let factor=matrix[i][j];
				for (let k=j;k<c;k++) matrix[i][k]=matrix[i][k].sub(factor.mul(matrix[pivotRow][k]));
			}
		}
		pivotCol[pivotRow]=j;
		pivotRow++;
	}
	let sol=Array.from({ length: c }, ()=>new Fraction(0));
	let isPivot=new Array(c).fill(false);
	for (let i=0;i<pivotRow;i++) isPivot[pivotCol[i]]=true;
	let freeVars: number[]=[];
	for (let j=0;j<c;j++){
		if (!isPivot[j]) freeVars.push(j);
	}
	if (freeVars.length===0) return sol;
	let freeIdx=freeVars[0];
	sol[freeIdx]=new Fraction(1);
	for (let i=pivotRow-1;i>=0;i--){
		let pCol=pivotCol[i];
		let sum=new Fraction(0);
		for (let j=pCol+1;j<c;j++) sum=sum.add(matrix[i][j].mul(sol[j]));
		sol[pCol]=sum.mul(new Fraction(-1));
	}
	return sol;
}
export function balanceEquation(equation: string, maxCoefficient: number=4000): string{
	let { reactants, products }=parseEquation(equation);
	let all=reactants.concat(products);
	let parsed=all.map(parseFormulaToCounts);
	let allKeysSet=new Set<string>();
	for (let p of parsed){
		for (let k of Object.keys(p)) allKeysSet.add(k);
	}
	let elements=Array.from(allKeysSet);
	let A: Fraction[][]=elements.map(el=>{
		return all.map((_, col)=>{
			let count=parsed[col][el]||0;
			return new Fraction(col<reactants.length?count:-count);
		});
	});
	let sol=solveHomogeneous(A);
	if (sol.every(f=>f.isZero())) throw new Error("Could not balance");
	let firstNonZero=sol.find(f=>!f.isZero())!;
	if (firstNonZero.n<0) sol=sol.map(f=>f.mul(new Fraction(-1)));
	let denLcm=sol.reduce((acc, f)=>lcm(acc, f.d), 1);
	let coeffs=sol.map(f=>f.n*(denLcm/f.d));
	let signFix=coeffs.find(c=>c!==0)!<0?-1:1;
	coeffs=coeffs.map(c=>c*signFix);
	let commonGcd=coeffs.reduce((acc, c)=>gcd(acc, c), 0);
	coeffs=coeffs.map(c=>c/commonGcd);
	if (coeffs.every(c=>c===0)) throw new Error("Could not balance");
	if (coeffs.some(c=>c<=0||c>maxCoefficient)) throw new Error("Could not balance");
	let format=(parts: string[], offset: number)=>{
		return parts.map((p, i)=>{
			let c=coeffs[offset+i];
			return (c===1?"":c)+p;
		}).join(" + ");
	};
	return format(reactants, 0)+" -> "+format(products, reactants.length);
}