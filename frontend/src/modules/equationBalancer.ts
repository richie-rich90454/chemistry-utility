export class Fraction{
	n: number;
	d: number;
	constructor(n: number, d: number=1){
		if (d===0) throw new Error("Denominator zero");
		this.n=n;
		this.d=d;
		this.simplify();
	}
	public simplify(): void{
		let g=EquationBalancer.gcd(this.n, this.d);
		this.n/=g;
		this.d/=g;
		if (this.d<0){
			this.n=-this.n;
			this.d=-this.d;
		}
	}
	public add(fraction: Fraction): Fraction{
		return new Fraction(this.n*fraction.d+fraction.n*this.d, this.d*fraction.d);
	}
	public subtract(fraction: Fraction): Fraction{
		return new Fraction(this.n*fraction.d-fraction.n*this.d, this.d*fraction.d);
	}
	public multiply(fraction: Fraction): Fraction{
		return new Fraction(this.n*fraction.n, this.d*fraction.d);
	}
	public divide(fraction: Fraction): Fraction{
		if (fraction.n===0) throw new Error("Div by zero");
		return new Fraction(this.n*fraction.d, this.d*fraction.n);
	}
	public isZero(): boolean{
		return this.n===0;
	}
}

export interface BalanceExplanation {
	method: string;
	steps: string[];
	coefficients: number[];
}

export interface BalanceResult {
	equation: string;
	explanation: BalanceExplanation;
}

const POLYATOMIC_IONS: { [key: string]: { charge: number; composition: { [key: string]: number } } } = {
	"NO3": { charge: -1, composition: { N: 1, O: 3 } },
	"SO4": { charge: -2, composition: { S: 1, O: 4 } },
	"PO4": { charge: -3, composition: { P: 1, O: 4 } },
	"CO3": { charge: -2, composition: { C: 1, O: 3 } },
	"OH": { charge: -1, composition: { O: 1, H: 1 } },
	"NH4": { charge: 1, composition: { N: 1, H: 4 } },
	"CH3COO": { charge: -1, composition: { C: 2, H: 3, O: 2 } },
	"CrO4": { charge: -2, composition: { Cr: 1, O: 4 } },
	"Cr2O7": { charge: -2, composition: { Cr: 2, O: 7 } },
	"MnO4": { charge: -1, composition: { Mn: 1, O: 4 } },
	"ClO3": { charge: -1, composition: { Cl: 1, O: 3 } },
	"ClO4": { charge: -1, composition: { Cl: 1, O: 4 } },
	"IO3": { charge: -1, composition: { I: 1, O: 3 } },
	"C2O4": { charge: -2, composition: { C: 2, O: 4 } },
	"CN": { charge: -1, composition: { C: 1, N: 1 } },
	"SCN": { charge: -1, composition: { S: 1, C: 1, N: 1 } },
	"HCO3": { charge: -1, composition: { H: 1, C: 1, O: 3 } },
	"HSO4": { charge: -1, composition: { H: 1, S: 1, O: 4 } },
	"H2PO4": { charge: -1, composition: { H: 2, P: 1, O: 4 } },
	"NO2": { charge: -1, composition: { N: 1, O: 2 } },
	"SO3": { charge: -2, composition: { S: 1, O: 3 } },
	"S2O3": { charge: -2, composition: { S: 2, O: 3 } }
};

export class EquationBalancer {
	public static gcd(a: number, b: number): number{
		a=Math.abs(a);
		b=Math.abs(b);
		while (b!==0){
			let t=b;
			b=a%b;
			a=t;
		}
		return a;
	}
	private static lcm(a: number, b: number): number{
		if (a===0||b===0) return 0;
		return Math.abs(a*b)/EquationBalancer.gcd(a, b);
	}
	private static parseFormulaToCounts(formula: string): Record<string, number>{
		// Hydrate notation: CuSO4·5H2O or CuSO4*5H2O
		let hydrateParts=formula.split(/[·*]/);
		if (hydrateParts.length>1){
			let merged: Record<string, number>={};
			for (let part of hydrateParts){
				let trimmed=part.trim();
				if (trimmed.length===0) continue;
				let numMatch=trimmed.match(/^\d+/);
				let mult=numMatch!==null?parseInt(numMatch[0], 10):1;
				let body=numMatch!==null?trimmed.substring(numMatch[0].length):trimmed;
				let partCounts=EquationBalancer.parseFormulaToCounts(body);
				for (let el in partCounts){
					merged[el]=(merged[el]||0)+partCounts[el]*mult;
				}
			}
			return merged;
		}
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
	public static parseEquation(equation: string): { reactants: string[], products: string[] }{
		let sides=equation.split(/->|=/);
		if (sides.length!==2) throw new Error("Invalid format");
		let splitSide=(s: string)=>s.trim().split(/\s+\+\s+/).map(x=>x.trim()).filter(x=>x.length>0);
		return { reactants: splitSide(sides[0]), products: splitSide(sides[1]) };
	}
	private static solveHomogeneous(matrix: Fraction[][], maxCoefficient: number=10000): Fraction[]|null{
		let r=matrix.length;
		if (r===0) return null;
		let c=matrix[0].length;
		if (c===0) return null;
		let m=matrix.map(row=>row.map(x=>new Fraction(x.n, x.d)));
		let pivotCol:number[]=[];
		let row=0;
		for (let col=0;col<c&&row<r;col++){
			let sel=row;
			while (sel<r&&m[sel][col].isZero()) sel++;
			if (sel===r) continue;
			let tmp=m[row]; m[row]=m[sel]; m[sel]=tmp;
			let div=m[row][col];
			for (let j=col;j<c;j++) m[row][j]=m[row][j].divide(div);
			for (let i=0;i<r;i++){
				if (i!==row){
					let f=m[i][col];
					for (let j=col;j<c;j++) m[i][j]=m[i][j].subtract(f.multiply(m[row][j]));
				}
			}
			pivotCol[row]=col;
			row++;
		}
		let pivotCount=pivotCol.length;
		let isPivot=new Array(c).fill(false);
		for (let i=0;i<pivotCount;i++) isPivot[pivotCol[i]]=true;
		let free:number[]=[];
		for (let i=0;i<c;i++) if (!isPivot[i]) free.push(i);
		if (free.length===0) return null;
		let basis: Fraction[][]=[];
		for (let fi=0;fi<free.length;fi++){
			let f=free[fi];
			let vec: Fraction[]=new Array(c);
			for (let j=0;j<c;j++) vec[j]=new Fraction(0);
			vec[f]=new Fraction(1);
			for (let pr=0;pr<pivotCount;pr++){
				let pc=pivotCol[pr];
				vec[pc]=m[pr][f].multiply(new Fraction(-1));
			}
			basis.push(vec);
		}
		let intBasis: number[][]=[];
		for (let i=0;i<basis.length;i++){
			let den=1;
			for (let j=0;j<c;j++){
				den=EquationBalancer.lcm(den, Math.abs(basis[i][j].d));
			}
			let intVec: number[]=new Array(c);
			for (let j=0;j<c;j++){
				intVec[j]=basis[i][j].n*(den/basis[i][j].d);
			}
			let g=0;
			for (let j=0;j<c;j++) g=EquationBalancer.gcd(g, Math.abs(intVec[j]));
			if (g>1){
				for (let j=0;j<c;j++) intVec[j]=intVec[j]/g;
			}
			intBasis.push(intVec);
		}
		let k=intBasis.length;
		let best: number[]|null=null;
		let bestSum=0;
		function trySolution(result: number[]): void{
			let g=0;
			for (let j=0;j<c;j++) g=EquationBalancer.gcd(g, Math.abs(result[j]));
			if (g===0) return;
			let reduced=new Array(c);
			for (let j=0;j<c;j++) reduced[j]=result[j]/g;
			for (let j=0;j<c;j++){
				if (reduced[j]<=0 || reduced[j]>maxCoefficient) return;
			}
			let sum=0;
			for (let j=0;j<c;j++) sum=sum+reduced[j];
			if (best===null || sum<bestSum){
				best=reduced;
				bestSum=sum;
			}
		}
		if (k===1){
			let result=new Array(c);
			for (let j=0;j<c;j++) result[j]=intBasis[0][j];
			let allPos=true;
			let allNeg=true;
			for (let j=0;j<c;j++){
				if (result[j]<=0) allPos=false;
				if (result[j]>=0) allNeg=false;
			}
			if (allPos){
				trySolution(result);
			} else if (allNeg){
				let flipped=new Array(c);
				for (let j=0;j<c;j++) flipped[j]=-result[j];
				trySolution(flipped);
			}
		} else {
			function dfs(idx: number, current: number[]): void{
				if (best!==null && bestSum<=c+1) return;
				if (idx===k){
					trySolution(current);
					return;
				}
				let ciMax=maxCoefficient;
				for (let j=0;j<c;j++){
					if (intBasis[idx][j]>0){
						let headroom=maxCoefficient-current[j];
						let bound=Math.floor(headroom/intBasis[idx][j]);
						if (bound<ciMax) ciMax=bound;
					}
				}
				if (best!==null && bestSum<ciMax) ciMax=bestSum;
				for (let ci=1;ci<=ciMax;ci++){
					let newCurrent=new Array(c);
					for (let j=0;j<c;j++){
						newCurrent[j]=current[j]+ci*intBasis[idx][j];
					}
					dfs(idx+1, newCurrent);
				}
			}
			let initial=new Array(c);
			for (let j=0;j<c;j++) initial[j]=0;
			dfs(0, initial);
		}
		if (best===null) return null;
		let solution: number[]=best as number[];
		let out: Fraction[]=new Array(solution.length);
		for (let j=0;j<solution.length;j++) out[j]=new Fraction(solution[j], 1);
		return out;
	}
	public static balanceEquation(equation: string, maxCoefficient: number=10000, explain: boolean=false): string|BalanceResult{
		let { reactants, products }=EquationBalancer.parseEquation(equation);
		let all=reactants.concat(products);
		let parsed=all.map(EquationBalancer.parseFormulaToCounts);
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
		let sol=EquationBalancer.solveHomogeneous(A, maxCoefficient);
		if (!sol) throw new Error("Could not balance");
		let coeffs=sol.map(f=>f.n);
		if (coeffs.some(c=>c<=0||c>maxCoefficient)) throw new Error("Could not balance");
		let fmt=(arr: string[], off: number)=>arr.map((p, i)=>{
			let c=coeffs[off+i];
			return (c===1?"":c)+p;
		}).join(" + ");
		let balanced=fmt(reactants, 0)+" -> "+fmt(products, reactants.length);
		if (explain){
			let stepList: string[]=[];
			stepList.push("Parsed "+reactants.length+" reactants and "+products.length+" products");
			stepList.push("Built element matrix ("+elements.length+" elements x "+all.length+" species)");
			stepList.push("Solved via Gaussian elimination");
			stepList.push("Coefficients: "+coeffs.join(", "));
			let explanation: BalanceExplanation={
				method: "Gaussian elimination over rationals",
				steps: stepList,
				coefficients: coeffs
			};
			return {
				equation: balanced,
				explanation: explanation
			};
		}
		return balanced;
	}
	private static parseChargeSpec(spec: string): number{
		let idx=0;
		let numStr="";
		while (idx<spec.length && /\d/.test(spec[idx])){
			numStr+=spec[idx];
			idx++;
		}
		if (idx<spec.length && (spec[idx]==="+" || spec[idx]==="-")){
			let sign=spec[idx]==="+"?1:-1;
			let mag=numStr.length>0?parseInt(numStr, 10):1;
			return sign*mag;
		}
		return 0;
	}
	private static extractCharge(formula: string): { body: string; charge: number }{
		let caretIdx=formula.indexOf("^");
		if (caretIdx!==-1){
			let body=formula.substring(0, caretIdx);
			let chargeSpec=formula.substring(caretIdx+1);
			let charge=EquationBalancer.parseChargeSpec(chargeSpec);
			return { body: body, charge: charge };
		}
		let len=formula.length;
		if (len===0) return { body: formula, charge: 0 };
		let last=formula[len-1];
		if (last!=="+" && last!=="-") return { body: formula, charge: 0 };
		let sign=last==="+"?1:-1;
		let j=len-2;
		while (j>=0 && /\d/.test(formula[j])) j--;
		let digitsStart=j+1;
		let digits=formula.substring(digitsStart, len-1);
		if (digits.length===0) return { body: formula.substring(0, len-1), charge: sign };
		let charBeforeDigits=digitsStart>0?formula[digitsStart-1]:"";
		let isPrecededByLetter=digitsStart>0 && /[A-Za-z]/.test(charBeforeDigits);
		if (isPrecededByLetter){
			let bodyBeforeDigits=formula.substring(0, digitsStart);
			let uppercaseCount=0;
			for (let k=0;k<bodyBeforeDigits.length;k++){
				if (/[A-Z]/.test(bodyBeforeDigits[k])) uppercaseCount++;
			}
			if (uppercaseCount<=1){
				return { body: bodyBeforeDigits, charge: sign*parseInt(digits, 10) };
			}
			return { body: formula.substring(0, len-1), charge: sign };
		}
		let isPrecededByCloseBracket=digitsStart>0 && (charBeforeDigits===")" || charBeforeDigits==="]" || charBeforeDigits==="}");
		if (isPrecededByCloseBracket){
			return { body: formula.substring(0, len-1), charge: sign };
		}
		return { body: formula.substring(0, digitsStart), charge: sign*parseInt(digits, 10) };
	}
	private static stripLeadingCoefficient(term: string): string{
		let m=term.match(/^\d+/);
		if (m!==null){
			return term.substring(m[0].length);
		}
		return term;
	}
	private static parseFormulaWithCharge(formula: string): { counts: Record<string, number>; charge: number }{
		let stripped=EquationBalancer.stripLeadingCoefficient(formula);
		let extracted=EquationBalancer.extractCharge(stripped);
		let body=extracted.body;
		let charge=extracted.charge;
		let counts=EquationBalancer.parseFormulaToCounts(body);
		if (counts["_charge"]!==undefined){
			charge=charge+counts["_charge"];
			delete counts["_charge"];
		}
		if (charge===0){
			let ionInfo=POLYATOMIC_IONS[body];
			if (ionInfo!==undefined){
				charge=ionInfo.charge;
			}
		}
		return { counts: counts, charge: charge };
	}
	public static balanceIonic(equation: string, maxCoefficient: number=10000): string{
		let parsedEquation=EquationBalancer.parseEquation(equation);
		let reactants=parsedEquation.reactants;
		let products=parsedEquation.products;
		let reactantsStripped=reactants.map(EquationBalancer.stripLeadingCoefficient);
		let productsStripped=products.map(EquationBalancer.stripLeadingCoefficient);
		let all=reactantsStripped.concat(productsStripped);
		let parsedAll=all.map(EquationBalancer.parseFormulaWithCharge);
		let keys=new Set<string>();
		for (let p of parsedAll){
			for (let k of Object.keys(p.counts)){
				if (k!=="_charge") keys.add(k);
			}
		}
		let elements=Array.from(keys);
		let A: Fraction[][]=[];
		for (let e=0;e<elements.length;e++){
			let el=elements[e];
			let row: Fraction[]=[];
			for (let i=0;i<all.length;i++){
				let v=parsedAll[i].counts[el]||0;
				row.push(new Fraction(i<reactantsStripped.length?v:-v));
			}
			A.push(row);
		}
		let chargeRow: Fraction[]=[];
		for (let i=0;i<all.length;i++){
			let v=parsedAll[i].charge;
			chargeRow.push(new Fraction(i<reactantsStripped.length?v:-v));
		}
		A.push(chargeRow);
		let sol=EquationBalancer.solveHomogeneous(A, maxCoefficient);
		if (!sol) throw new Error("Could not balance ionic equation");
		let coeffs: number[]=[];
		for (let i=0;i<sol.length;i++){
			coeffs.push(sol[i].n);
		}
		for (let i=0;i<coeffs.length;i++){
			if (coeffs[i]<=0 || coeffs[i]>maxCoefficient) throw new Error("Could not balance ionic equation");
		}
		let fmt=function(arr: string[], off: number){
			let parts: string[]=[];
			for (let i=0;i<arr.length;i++){
				let c=coeffs[off+i];
				let prefix=c===1?"":""+c;
				parts.push(prefix+arr[i]);
			}
			return parts.join(" + ");
		};
		return fmt(reactantsStripped, 0)+" -> "+fmt(productsStripped, reactantsStripped.length);
	}
}

export function parseEquation(equation: string): { reactants: string[], products: string[] }{
	return EquationBalancer.parseEquation(equation);
}
export function balanceEquation(equation: string, maxCoefficient: number=10000, explain: boolean=false): string|BalanceResult{
	return EquationBalancer.balanceEquation(equation, maxCoefficient, explain);
}
export function balanceIonic(equation: string, maxCoefficient: number=10000): string{
	return EquationBalancer.balanceIonic(equation, maxCoefficient);
}
