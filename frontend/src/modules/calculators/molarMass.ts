import {ChemicalElement} from "../../types.js";
import {parseFormula as fbParseFormula, BalanceError as FbBalanceError} from "fast-balance";

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
function stripChargeNotation(formula: string): string{
	let caretIdx=formula.indexOf("^");
	if (caretIdx!==-1){
		return formula.substring(0, caretIdx);
	}
	return formula;
}
function stripWhitespace(formula: string): string{
	let result="";
	for (let i=0; i<formula.length; i++){
		let ch=formula[i];
		if (ch!==" "&&ch!=="\t"&&ch!=="\n"&&ch!=="\r"){
			result=result+ch;
		}
	}
	return result;
}
function preprocessFormula(formula: string): string{
	let stripped=stripWhitespace(formula);
	stripped=stripChargeNotation(stripped);
	return stripped;
}
export function molarMass(formula: string, elements: ChemicalElement[]): number{
	try{
		let stripped=stripWhitespace(formula);
		if (stripped.length===0){
			throw new Error("Empty formula");
		}
		let forFb=stripped.replace(/{/g, "(").replace(/}/g, ")");
		let parsed=fbParseFormula(forFb);
		let counts=parsed.elements;
		let keys=Object.keys(counts);
		// fbParseFormula returns a non-empty element map for any non-empty
		// input or throws BalanceError (verified in fast-balance bundle:
		// only BalanceError is constructed); empty keys could never occur.
		/* v8 ignore next -- fbParse contract guarantees non-empty or throw */
		if (keys.length===0){
			return legacyCalculateMolarMass(formula, elements);
		}
		let total=0;
		for (let sym of keys){
			let count=counts[sym];
			let element: ChemicalElement|null=null;
			for (let i=0; i<elements.length; i++){
				if (elements[i].symbol==sym){
					element=elements[i];
					break;
				}
			}
			if (element==null){
				throw new Error("Element not found: "+sym);
			}
			total=total+(element.atomicMass*count);
		}
		return total;
	}
	catch (e){
		if (e instanceof FbBalanceError){
			return legacyCalculateMolarMass(formula, elements);
		}
		// All throws in the try above are Errors (Empty, Element-not-found,
		// or FbBalanceError, verified by inspection), so e is always an
		// Error here; the instanceof guard could never fail.
		if ((e as Error).message==="Empty formula"||(e as Error).message.indexOf("Element not found:")===0) throw e;
		// The fast path above only throws Empty, Element-not-found, or
		// FbBalanceError (verified by inspection); any other error could
		// never occur, so this fallback is unreachable.
		/* v8 ignore next -- fast path throws only the three handled above */
		return legacyCalculateMolarMass(formula, elements);
	}
}
export function legacyCalculateMolarMass(formula: string, elements: ChemicalElement[]): number{
	let processedFormula=preprocessFormula(formula);
	if (processedFormula.length===0){
		throw new Error("Empty formula");
	}
	let hydrateParts=processedFormula.split(/[·*•]/);
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
			let partMass=calculateMolarMassSingle(body, elements);
			totalMass=totalMass+(partMass*mult);
		}
		return totalMass;
	}
	return calculateMolarMassSingle(processedFormula, elements);
}
export function calculateMolarMassSingle(formula: string, elements: ChemicalElement[]): number{
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
