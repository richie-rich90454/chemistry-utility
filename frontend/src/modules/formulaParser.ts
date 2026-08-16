import {ChemicalElement} from "../types.js";

export class FormulaParser {
	public static parseElement(formula: string, index: number): [string, number]{
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
	public static parseNumber(formula: string, index: number): [number, number]{
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
	private static stripChargeNotation(formula: string): string{
		let caretIdx=formula.indexOf("^");
		if (caretIdx!==-1){
			return formula.substring(0, caretIdx);
		}
		return formula;
	}
	private static stripWhitespace(formula: string): string{
		let result="";
		for (let i=0; i<formula.length; i++){
			let ch=formula[i];
			if (ch!==" "&&ch!=="\t"&&ch!=="\n"&&ch!=="\r"){
				result=result+ch;
			}
		}
		return result;
	}
	private static preprocessFormula(formula: string): string{
		let stripped=FormulaParser.stripWhitespace(formula);
		stripped=FormulaParser.stripChargeNotation(stripped);
		return stripped;
	}
	public static calculateMolarMass(formula: string, elements: ChemicalElement[]): number{
		let processedFormula=FormulaParser.preprocessFormula(formula);
		if (processedFormula.length===0){
			throw new Error("Empty formula");
		}
		let hydrateParts=processedFormula.split(/[·*]/);
		if (hydrateParts.length>1){
			let totalMass=0;
			for (let part of hydrateParts){
				if (part.length===0) continue;
				let mult=1;
				let body=part;
				let numMatch=part.match(/^\d+/);
				if (numMatch!==null){
					mult=parseInt(numMatch[0], 10);
					body=part.substring(numMatch[0].length);
				}
				if (body.length===0) continue;
				let partMass=FormulaParser.calculateMolarMassSingle(body, elements);
				totalMass=totalMass+(partMass*mult);
			}
			return totalMass;
		}
		return FormulaParser.calculateMolarMassSingle(processedFormula, elements);
	}
	private static calculateMolarMassSingle(formula: string, elements: ChemicalElement[]): number{
		let massStack: number[]=[0];
		let index=0;
		let formulaLength=formula.length;
		while (index<formulaLength){
			let currentChar=formula[index];
			let isUpperCase=/[A-Z]/.test(currentChar);
			if (isUpperCase){
				let elementResult=FormulaParser.parseElement(formula, index);
				let symbol=elementResult[0];
				index=elementResult[1];
				let numberResult=FormulaParser.parseNumber(formula, index);
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
			else if (currentChar=="("||currentChar=="["||currentChar=="{"){
				massStack.push(0);
				index=index+1;
			}
			else if (currentChar==")"||currentChar=="]"||currentChar=="}"){
				let stackLength=massStack.length;
				if (stackLength<2){
					throw new Error("Unmatched \""+currentChar+"\"");
				}
				let subgroupMass=massStack.pop() as number;
				let numberResult=FormulaParser.parseNumber(formula, index+1);
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
	public static formatFormula(formula: string): string{
		let result="";
		let i=0;
		let hydrateParts=formula.split(/[·*]/);
		if (hydrateParts.length>1){
			for (let p=0; p<hydrateParts.length; p++){
				let part=hydrateParts[p];
				if (part.length===0) continue;
				let mult=1;
				let body=part;
				let numMatch=part.match(/^\d+/);
				if (numMatch!==null){
					mult=parseInt(numMatch[0], 10);
					body=part.substring(numMatch[0].length);
				}
				if (body.length===0) continue;
				let formatted=FormulaParser.formatFormula(body);
				for (let k=0; k<mult; k++){
					result=result+formatted;
				}
			}
			if (result==="") throw new Error("Bad formula");
			return result;
		}
		while (i<formula.length){
			if (formula[i]==="("||formula[i]==="["||formula[i]==="{"){
				let depth=1;
				let start=i;
				i++;
				while (i<formula.length&&depth>0){
					if (formula[i]==="("||formula[i]==="["||formula[i]==="{") depth++;
					else if (formula[i]===")"||formula[i]==="]"||formula[i]==="}") depth--;
					i++;
				}
				if (depth>0){
					throw new Error("Unmatched \""+formula[start]+"\"");
				}
				let inner=formula.substring(start+1, i-1);
				let numStr="";
				while (i<formula.length&&/\d/.test(formula[i])){ numStr+=formula[i]; i++; }
				let count=numStr===""?1:parseInt(numStr, 10);
				let formatted=FormulaParser.formatFormula(inner);
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
			else if (formula[i]===")"||formula[i]==="]"||formula[i]==="}"){
				throw new Error("Unmatched \""+formula[i]+"\"");
			}
			else{
				i++;
			}
		}
		if (result==="") throw new Error("Bad formula");
		return result;
	}
}

export function parseElement(formula: string, index: number): [string, number]{
	return FormulaParser.parseElement(formula, index);
}
export function parseNumber(formula: string, index: number): [number, number]{
	return FormulaParser.parseNumber(formula, index);
}
export function calculateMolarMass(formula: string, elements: ChemicalElement[]): number{
	return FormulaParser.calculateMolarMass(formula, elements);
}
export function formatFormula(formula: string): string{
	return FormulaParser.formatFormula(formula);
}
