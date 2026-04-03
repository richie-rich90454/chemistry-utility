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
		else if (ch==="+"||ch==="-"){
			let sign=ch==="+"?1:-1;
			i++;
			let start=i;
			while (i<formula.length&&/\d/.test(formula[i])) i++;
			let mag=parseInt(formula.substring(start, i), 10)||1;
			stack[stack.length-1]["_charge"]=(stack[stack.length-1]["_charge"]||0)+mag*sign;
		}
		else i++;
	}
	return stack[0];
}
export function parseEquation(equation: string): { reactants: string[], products: string[] }{
	let sides=equation.split(/->|=/);
	if (sides.length!==2) throw new Error("Invalid equation format");
	let reactants=sides[0].split("+").map(s=>s.trim()).filter(s=>s.length>0);
	let products=sides[1].split("+").map(s=>s.trim()).filter(s=>s.length>0);
	return { reactants, products };
}
function solveHomogeneous(matrix: Fraction[][]): Fraction[]{
	let r=matrix.length;
	let c=matrix[0].length;
	let pivot=0;
	for (let j=0; j<c&&pivot<r; j++){
		let sel=pivot;
		while (sel<r&&matrix[sel][j].isZero()) sel++;
		if (sel===r) continue;
		[matrix[pivot], matrix[sel]]=[matrix[sel], matrix[pivot]];
		let root=matrix[pivot][j];
		for (let k=j; k<c; k++) matrix[pivot][k]=matrix[pivot][k].div(root);
		for (let i=0; i<r; i++){
			if (i!==pivot){
				let factor=matrix[i][j];
				for (let k=j; k<c; k++) matrix[i][k]=matrix[i][k].sub(factor.mul(matrix[pivot][k]));
			}
		}
		pivot++;
	}
	let res=new Array(c).fill(new Fraction(0));
	res[c-1]=new Fraction(1);
	for (let i=0; i<pivot; i++){
		let firstIdx=-1;
		for (let k=0; k<matrix[i].length; k++){
			if (!matrix[i][k].isZero()){
				firstIdx=k;
				break;
			}
		}
		if (firstIdx!==-1&&firstIdx<c-1) res[firstIdx]=matrix[i][c-1].mul(new Fraction(-1));
	}
	return res;
}
export function balanceEquation(equation: string, maxCoefficient: number=4000): string{
	let { reactants, products }=parseEquation(equation);
	let all=reactants.concat(products);
	let parsed=all.map(parseFormulaToCounts);
	let allKeys: string[]=[];
	for (let i=0; i<parsed.length; i++){
		allKeys=allKeys.concat(Object.keys(parsed[i]));
	}
	let elements=Array.from(new Set(allKeys));
	let A: Fraction[][]=elements.map((el: string)=>{
		return all.map((_, col)=>{
			let count=parsed[col][el]||0;
			return new Fraction(col<reactants.length?count:-count);
		});
	});
	let sol=solveHomogeneous(A);
	let denLcm=sol.reduce((acc, f)=>lcm(acc, f.d), 1);
	let coeffs=sol.map(f=>Math.abs(f.n*(denLcm/f.d)));
	let commonGcd=coeffs.reduce((acc, c)=>gcd(acc, c), 0);
	coeffs=coeffs.map(c=>c/commonGcd);
	if (coeffs.some(c=>c>maxCoefficient)) throw new Error("Coefficients exceed limit");
	let format=(parts: string[], offset: number)=>{
		return parts.map((p, i)=>{
			let c=coeffs[offset+i];
			return (c===1?"": c)+p;
		}).join(" + ");
	};
	return format(reactants, 0) + " -> " + format(products, reactants.length);
}