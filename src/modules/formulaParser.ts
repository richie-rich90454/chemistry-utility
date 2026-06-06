import {ChemicalElement} from "../types";
export function parseElement(formula: string, index: number): [string, number]{
	let formulaLength=formula.length;
	let currentChar=formula[index];
	let isUpperCase=/[A-Z]/.test(currentChar);
	if (index<formulaLength&&isUpperCase){
		let symbol=currentChar;
		index=index+1;
		if (index<formulaLength){
			let nextChar=formula[index];
			let isLowerCase=/[a-z]/.test(nextChar);
			if (isLowerCase){
				symbol=symbol+nextChar;
				index=index+1;
			}
		}
		return [symbol, index];
	}
	else{
		throw new Error("Invalid element at position "+index);
	}
}
export function parseNumber(formula: string, index: number): [number, number]{
	let number=0;
	let formulaLength=formula.length;
	while (index<formulaLength){
		let currentChar=formula[index];
		let isDigit=/[0-9]/.test(currentChar);
		if (!isDigit){
			break;
		}
		number=number*10+parseInt(currentChar);
		index=index+1;
	}
	let finalNumber=number>0?number:1;
	return [finalNumber, index];
}
export function calculateMolarMass(formula: string, elements: ChemicalElement[]): number{
	let massStack: number[]=[0];
	let index=0;
	let formulaLength=formula.length;
	while (index<formulaLength){
		let currentChar=formula[index];
		let isUpperCase=/[A-Z]/.test(currentChar);
		if (isUpperCase){
			let elementResult=parseElement(formula, index);
			let symbol=elementResult[0];
			index=elementResult[1];
			let numberResult=parseNumber(formula, index);
			let count=numberResult[0];
			index=numberResult[1];
			let element: ChemicalElement|null=null;
			for (let i=0; i<elements.length; i++){
				if (elements[i].symbol==symbol){
					element=elements[i];
					break;
				}
			}
			if (element!=null){
				let stackTopIndex=massStack.length-1;
				massStack[stackTopIndex]=massStack[stackTopIndex]+(element.atomicMass*count);
			}
			else{
				throw new Error("Element not found: "+symbol);
			}
		}
		else if (currentChar=="("){
			massStack.push(0);
			index=index+1;
		}
		else if (currentChar==")"){
			let stackLength=massStack.length;
			if (stackLength<2){
				throw new Error("Unmatched \")\"");
			}
			let subgroupMass=massStack.pop() as number;
			let numberResult=parseNumber(formula, index+1);
			let multiplier=numberResult[0];
			index=numberResult[1];
			let stackTopIndex=massStack.length-1;
			massStack[stackTopIndex]=massStack[stackTopIndex]+(subgroupMass*multiplier);
		}
		else{
			throw new Error("Invalid character: "+currentChar);
		}
	}
	let stackLength=massStack.length;
	if (stackLength>1){
		throw new Error("Unmatched \"(\"");
	}
	return massStack[0];
}
export function formatFormula(formula: string): string{
    let result="";
    let i=0;
    while (i<formula.length){
        if (formula[i]==="("||formula[i]==="["){
            let depth=1;
            let start=i;
            i++;
            while (i<formula.length&&depth>0){
                if (formula[i]==="("||formula[i]==="[") depth++;
                else if (formula[i]===")"||formula[i]==="]") depth--;
                i++;
            }
            let inner=formula.substring(start+1, i-1);
            let numStr="";
            while (i<formula.length&&/\d/.test(formula[i])){ numStr+=formula[i]; i++; }
            let count=numStr===""?1:parseInt(numStr, 10);
            let formatted=formatFormula(inner);
            for (let j=0; j<count; j++){
                result+=formatted;
            }
        }
        else if (/[A-Z]/.test(formula[i])){
            let start=i;
            i++;
            while (i<formula.length&&/[a-z]/.test(formula[i])) i++;
            let element=formula.substring(start, i);
            let numStr="";
            while (i<formula.length&&/\d/.test(formula[i])){ numStr+=formula[i]; i++; }
            let count=numStr===""?1:parseInt(numStr, 10);
            result+=element;
            if (count>1) result+=count;
        }
        else{
            i++;
        }
    }
    if (result==="") throw new Error("Bad formula");
    return result;
}