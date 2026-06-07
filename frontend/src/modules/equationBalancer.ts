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
		let g=gcd(this.n, this.d);
		this.n/=g;
		this.d/=g;
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
			let mul=parseInt(formula.substring(start, i), 10)||1;
			for (let el in top){
				stack[stack.length-1][el]=(stack[stack.length-1][el]||0)+top[el]*mul;
			}
		}
		else if (/[A-Z]/.test(ch)){
			let start=i++;
			while (i<formula.length&&/[a-z]/.test(formula[i])) i++;
			let el=formula.substring(start, i);
			start=i;
			while (i<formula.length&&/\d/.test(formula[i])) i++;
			let cnt=parseInt(formula.substring(start, i), 10)||1;
			stack[stack.length-1][el]=(stack[stack.length-1][el]||0)+cnt;
		}
		else if (ch==="+"||ch==="-"||/\d/.test(ch)){
			let sign=0;
			let mag=0;
			let start=i;
			while (i<formula.length&&/\d/.test(formula[i])) i++;
			let num=formula.substring(start, i);
			if (i<formula.length&&(formula[i]==="+"||formula[i]==="-")){
				sign=formula[i]==="+"?1:-1;
				mag=num===""?1:parseInt(num, 10);
				i++;
			}
			else if (ch==="+"||ch==="-" ){
				sign=ch==="+"?1:-1;
				i++;
				let s=i;
				while (i<formula.length&&/\d/.test(formula[i])) i++;
				let num2=formula.substring(s, i);
				mag=num2===""?1:parseInt(num2, 10);
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
	let splitSide=(s: string)=>s.trim().split(/\s+\+\s+/).map(x=>x.trim()).filter(x=>x.length>0);
	return { reactants: splitSide(sides[0]), products: splitSide(sides[1]) };
}
function solveHomogeneous(matrix: Fraction[][]): Fraction[]|null{
	let r=matrix.length;
	let c=matrix[0].length;
	let m=matrix.map(row=>row.map(x=>new Fraction(x.n, x.d)));
	let pivotCol:number[]=[];
	let row=0;
	for (let col=0;col<c&&row<r;col++){
		let sel=row;
		while (sel<r&&m[sel][col].isZero()) sel++;
		if (sel===r) continue;
		[m[row], m[sel]]=[m[sel], m[row]];
		let div=m[row][col];
		for (let j=col;j<c;j++) m[row][j]=m[row][j].div(div);
		for (let i=0;i<r;i++){
			if (i!==row){
				let f=m[i][col];
				for (let j=col;j<c;j++) m[i][j]=m[i][j].sub(f.mul(m[row][j]));
			}
		}
		pivotCol[row]=col;
		row++;
	}
	let isPivot=new Array(c).fill(false);
	for (let i=0;i<pivotCol.length;i++) isPivot[pivotCol[i]]=true;
	let free:number[]=[];
	for (let i=0;i<c;i++) if (!isPivot[i]) free.push(i);
	if (free.length===0) return null;
	for (let trial=1;trial<=10;trial++){
		let sol=Array.from({ length:c },()=>new Fraction(0));
		for (let f of free) sol[f]=new Fraction(trial);
		for (let i=pivotCol.length-1;i>=0;i--){
			let col=pivotCol[i];
			let sum=new Fraction(0);
			for (let j=col+1;j<c;j++) sum=sum.add(m[i][j].mul(sol[j]));
			sol[col]=sum.mul(new Fraction(-1));
		}
		let den=sol.reduce((a,x)=>lcm(a, x.d),1);
		let ints=sol.map(x=>x.n*(den/x.d));
		if (ints.every(v=>v===0)) continue;
		let sign=ints.find(v=>v!==0)!<0?-1:1;
		ints=ints.map(v=>v*sign);
		if (ints.every(v=>v>0)){
			let g=ints.reduce((a,v)=>gcd(a,v),0);
			return ints.map(v=>new Fraction(v/g));
		}
	}
	return null;
}
export function balanceEquation(equation: string, maxCoefficient: number=4000): string{
	let { reactants, products }=parseEquation(equation);
	let all=reactants.concat(products);
	let parsed=all.map(parseFormulaToCounts);
	let keys=new Set<string>();
	for (let p of parsed){
		for (let k of Object.keys(p)) keys.add(k);
	}
	let elements=Array.from(keys);
	let A: Fraction[][]=elements.map(el=>{
		return all.map((_, i)=>{
			let v=parsed[i][el]||0;
			return new Fraction(i<reactants.length?v:-v);
		});
	});
	let sol=solveHomogeneous(A);
	if (!sol) throw new Error("Could not balance");
	let coeffs=sol.map(f=>f.n);
	if (coeffs.some(c=>c<=0||c>maxCoefficient)) throw new Error("Could not balance");
	let fmt=(arr: string[], off: number)=>arr.map((p, i)=>{
		let c=coeffs[off+i];
		return (c===1?"":c)+p;
	}).join(" + ");
	return fmt(reactants, 0)+" -> "+fmt(products, reactants.length);
}