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

export interface HalfReactionState {
	reactants: Map<string, number>;
	products: Map<string, number>;
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
		let reactants=splitSide(sides[0]);
		let products=splitSide(sides[1]);
		if (reactants.length===0 || products.length===0) throw new Error("Invalid format: both sides must have at least one species");
		return { reactants: reactants, products: products };
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
		if (free.length===0 && c>0){
			// All columns are pivot columns — full rank. In balancing,
			// we need one free variable. Treat the last species as free.
			free.push(c-1);
			isPivot[c-1]=false;
			pivotCount=pivotCount-1;
		}
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
	private static bruteForceBalance(matrix: Fraction[][], maxCoefficient: number=10000): Fraction[]|null{
		let r=matrix.length;
		let c=matrix[0].length;
		// Try coefficient combinations up to sqrt(maxCoefficient) each
		let limit=Math.min(Math.floor(Math.sqrt(maxCoefficient)), 100);
		for (let c0=1;c0<=limit;c0++){
			for (let c1=1;c1<=limit;c1++){
				let coeffs: number[]|null=null;
				if (c===2){
					// 2 species: check if c0 * col0 + c1 * col1 = 0 for all rows
					let ok=true;
					for (let i=0;i<r;i++){
						let val=c0*matrix[i][0].n/1+c1*matrix[i][1].n/1;
						if (val!==0){ok=false;break;}
					}
					if (ok) coeffs=[c0,c1];
				} else {
					// Try 3 species: fix c0,c1, solve for c2
					for (let c2=1;c2<=limit;c2++){
						let ok=true;
						for (let i=0;i<r;i++){
							let val=0;
							for (let j=0;j<c;j++){
								let v=matrix[i][j];
								let coeff=(j===0?c0:j===1?c1:c2);
								val+=coeff*(v.n/v.d);
							}
							if (Math.abs(val)>1e-9){ok=false;break;}
						}
						if (ok){coeffs=[c0,c1,c2];break;}
					}
				}
				if (coeffs!==null){
					let allPos=true;
					for (let j=0;j<coeffs.length;j++){
						if (coeffs[j]<=0){allPos=false;break;}
					}
					if (allPos){
						let g=0;
						for (let j=0;j<coeffs.length;j++) g=EquationBalancer.gcd(g,coeffs[j]);
						for (let j=0;j<coeffs.length;j++) coeffs[j]=coeffs[j]/g;
						let out: Fraction[]=new Array(coeffs.length);
						for (let j=0;j<coeffs.length;j++) out[j]=new Fraction(coeffs[j], 1);
						return out;
					}
				}
			}
		}
		return null;
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
		if (!sol){
			// Fallback: try brute-force small coefficient search
			sol=EquationBalancer.bruteForceBalance(A, maxCoefficient);
		}
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
			stepList.push("Parsed "+reactants.length+" reactants ("+reactants.join(", ")+") and "+products.length+" products ("+products.join(", ")+")");
			stepList.push("Tracked "+elements.length+" elements: "+elements.join(", "));
			stepList.push("Built element matrix ("+elements.length+" elements x "+all.length+" species) with reactant counts positive and product counts negative");
			stepList.push("Computed rational nullspace via Gaussian elimination over the rationals");
			stepList.push("Enumerated smallest positive integer solution via backtracking search bounded by "+maxCoefficient);
			stepList.push("Final coefficients: ["+coeffs.join(", ")+"]");
			let explanation: BalanceExplanation={
				method: "Gaussian elimination over rationals with backtracking search",
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
	private static countAtomInSide(side: Map<string, number>, element: string): number{
		let total=0;
		for (let entry of side){
			let formula=entry[0];
			let coeff=entry[1];
			let parsed=EquationBalancer.parseFormulaWithCharge(formula);
			let count=parsed.counts[element]||0;
			total=total+count*coeff;
		}
		return total;
	}
	private static countChargeInSide(side: Map<string, number>): number{
		let total=0;
		for (let entry of side){
			let formula=entry[0];
			let coeff=entry[1];
			let parsed=EquationBalancer.parseFormulaWithCharge(formula);
			total=total+parsed.charge*coeff;
		}
		return total;
	}
	private static balanceNonOHAtoms(state: HalfReactionState, maxCoefficient: number): void{
		let reactantList=Array.from(state.reactants.keys());
		let productList=Array.from(state.products.keys());
		let allSpecies=reactantList.concat(productList);
		let parsed=allSpecies.map(EquationBalancer.parseFormulaWithCharge);
		let elementSet=new Set<string>();
		for (let p of parsed){
			for (let el of Object.keys(p.counts)){
				if (el!=="O"&&el!=="H"){
					elementSet.add(el);
				}
			}
		}
		let elements=Array.from(elementSet);
		if (elements.length===0) return;
		let matrix: Fraction[][]=[];
		for (let el of elements){
			let row: Fraction[]=[];
			for (let i=0;i<allSpecies.length;i++){
				let count=parsed[i].counts[el]||0;
				let v=i<reactantList.length?count:-count;
				row.push(new Fraction(v));
			}
			matrix.push(row);
		}
		let sol=EquationBalancer.solveHomogeneous(matrix, maxCoefficient);
		if (!sol) return;
		for (let i=0;i<reactantList.length;i++){
			let c=sol[i].n;
			if (c<=0) return;
			state.reactants.set(reactantList[i], c);
		}
		for (let i=0;i<productList.length;i++){
			let c=sol[reactantList.length+i].n;
			if (c<=0) return;
			state.products.set(productList[i], c);
		}
	}
	private static balanceOxygen(state: HalfReactionState): void{
		let oReactants=EquationBalancer.countAtomInSide(state.reactants, "O");
		let oProducts=EquationBalancer.countAtomInSide(state.products, "O");
		if (oReactants===oProducts) return;
		if (oReactants>oProducts){
			let diff=oReactants-oProducts;
			state.products.set("H2O", (state.products.get("H2O")||0)+diff);
		}
		else {
			let diff=oProducts-oReactants;
			state.reactants.set("H2O", (state.reactants.get("H2O")||0)+diff);
		}
	}
	private static balanceHydrogenAcidic(state: HalfReactionState): void{
		let hReactants=EquationBalancer.countAtomInSide(state.reactants, "H");
		let hProducts=EquationBalancer.countAtomInSide(state.products, "H");
		if (hReactants===hProducts) return;
		if (hReactants>hProducts){
			let diff=hReactants-hProducts;
			state.products.set("H+", (state.products.get("H+")||0)+diff);
		}
		else {
			let diff=hProducts-hReactants;
			state.reactants.set("H+", (state.reactants.get("H+")||0)+diff);
		}
	}
	private static balanceChargeWithElectrons(state: HalfReactionState): void{
		let chargeReactants=EquationBalancer.countChargeInSide(state.reactants);
		let chargeProducts=EquationBalancer.countChargeInSide(state.products);
		if (chargeReactants===chargeProducts) return;
		if (chargeReactants>chargeProducts){
			let diff=chargeReactants-chargeProducts;
			state.reactants.set("e-", (state.reactants.get("e-")||0)+diff);
		}
		else {
			let diff=chargeProducts-chargeReactants;
			state.products.set("e-", (state.products.get("e-")||0)+diff);
		}
	}
	private static convertToBasic(state: HalfReactionState): void{
		let hPlusReactants=state.reactants.get("H+")||0;
		let hPlusProducts=state.products.get("H+")||0;
		if (hPlusReactants>0){
			state.products.set("OH-", (state.products.get("OH-")||0)+hPlusReactants);
			state.reactants.delete("H+");
			state.reactants.set("H2O", (state.reactants.get("H2O")||0)+hPlusReactants);
		}
		if (hPlusProducts>0){
			state.reactants.set("OH-", (state.reactants.get("OH-")||0)+hPlusProducts);
			state.products.delete("H+");
			state.products.set("H2O", (state.products.get("H2O")||0)+hPlusProducts);
		}
	}
	private static cancelSpecies(state: HalfReactionState): void{
		let reactantKeys=Array.from(state.reactants.keys());
		for (let species of reactantKeys){
			let r=state.reactants.get(species)||0;
			let p=state.products.get(species)||0;
			if (r>0&&p>0){
				let cancel=Math.min(r, p);
				if (r===cancel) state.reactants.delete(species);
				else state.reactants.set(species, r-cancel);
				if (p===cancel) state.products.delete(species);
				else state.products.set(species, p-cancel);
			}
		}
	}
	private static getElectronCount(state: HalfReactionState): number{
		let r=state.reactants.get("e-")||0;
		let p=state.products.get("e-")||0;
		return Math.max(r, p);
	}
	private static multiplyHalfReaction(state: HalfReactionState, factor: number): HalfReactionState{
		let reactants=new Map<string, number>();
		let products=new Map<string, number>();
		for (let entry of state.reactants){
			reactants.set(entry[0], entry[1]*factor);
		}
		for (let entry of state.products){
			products.set(entry[0], entry[1]*factor);
		}
		return { reactants: reactants, products: products };
	}
	private static combineHalfReactions(hr1: HalfReactionState, hr2: HalfReactionState): HalfReactionState{
		let reactants=new Map<string, number>();
		let products=new Map<string, number>();
		for (let entry of hr1.reactants){
			reactants.set(entry[0], entry[1]);
		}
		for (let entry of hr2.reactants){
			reactants.set(entry[0], (reactants.get(entry[0])||0)+entry[1]);
		}
		for (let entry of hr1.products){
			products.set(entry[0], entry[1]);
		}
		for (let entry of hr2.products){
			products.set(entry[0], (products.get(entry[0])||0)+entry[1]);
		}
		return { reactants: reactants, products: products };
	}
	private static formatHalfReaction(state: HalfReactionState): string{
		let formatSide=function(side: Map<string, number>): string{
			let main: string[]=[];
			let hPlus=0;
			let ohMinus=0;
			let h2o=0;
			for (let entry of side){
				let species=entry[0];
				let coeff=entry[1];
				if (species==="H+"){
					hPlus=coeff;
				}
				else if (species==="OH-"){
					ohMinus=coeff;
				}
				else if (species==="H2O"){
					h2o=coeff;
				}
				else if (species==="e-"){
					continue;
				}
				else {
					main.push((coeff===1?"":""+coeff)+species);
				}
			}
			if (hPlus>0) main.push((hPlus===1?"":""+hPlus)+"H+");
			if (ohMinus>0) main.push((ohMinus===1?"":""+ohMinus)+"OH-");
			if (h2o>0) main.push((h2o===1?"":""+h2o)+"H2O");
			return main.join(" + ");
		};
		return formatSide(state.reactants)+" -> "+formatSide(state.products);
	}
	private static balanceHalfReaction(hr: { reactants: string[], products: string[] }, maxCoefficient: number): HalfReactionState{
		let state: HalfReactionState={
			reactants: new Map<string, number>(),
			products: new Map<string, number>()
		};
		for (let r of hr.reactants) state.reactants.set(r, 1);
		for (let p of hr.products) state.products.set(p, 1);
		EquationBalancer.balanceNonOHAtoms(state, maxCoefficient);
		EquationBalancer.balanceOxygen(state);
		EquationBalancer.balanceHydrogenAcidic(state);
		EquationBalancer.balanceChargeWithElectrons(state);
		return state;
	}
	public static balanceRedox(equation: string, medium: "acidic"|"basic", maxCoefficient: number=10000): string{
		let parts=equation.split("||");
		if (parts.length!==2) throw new Error("Invalid redox format: expected '||' separator");
		let hr1Input=EquationBalancer.parseEquation(parts[0].trim());
		let hr2Input=EquationBalancer.parseEquation(parts[1].trim());
		let hr1=EquationBalancer.balanceHalfReaction(hr1Input, maxCoefficient);
		let hr2=EquationBalancer.balanceHalfReaction(hr2Input, maxCoefficient);
		let e1=EquationBalancer.getElectronCount(hr1);
		let e2=EquationBalancer.getElectronCount(hr2);
		if (e1===0||e2===0) throw new Error("Could not determine electron count for half-reaction");
		let lcmVal=EquationBalancer.lcm(e1, e2);
		let f1=lcmVal/e1;
		let f2=lcmVal/e2;
		hr1=EquationBalancer.multiplyHalfReaction(hr1, f1);
		hr2=EquationBalancer.multiplyHalfReaction(hr2, f2);
		let combined=EquationBalancer.combineHalfReactions(hr1, hr2);
		EquationBalancer.cancelSpecies(combined);
		if (medium==="basic"){
			EquationBalancer.convertToBasic(combined);
			EquationBalancer.cancelSpecies(combined);
		}
		return EquationBalancer.formatHalfReaction(combined);
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
export function balanceRedox(equation: string, medium: "acidic"|"basic", maxCoefficient: number=10000): string{
	return EquationBalancer.balanceRedox(equation, medium, maxCoefficient);
}
