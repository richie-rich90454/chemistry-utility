export function parseElement(formula, index){
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
export function parseNumber(formula, index){
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
export function calculateMolarMass(formula, elements){
    let massStack=[0];
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
            let element=null;
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
            let subgroupMass=massStack.pop();
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
export function formatFormula(formula){
    let compound={};
    let regex=/([A-Z][a-z]*)(\d*)/g;
    let match;
    let lastIndex=0;
    while ((match=regex.exec(formula))!=null){
        let element=match[1];
        let subscript=match[2]?parseInt(match[2]):1;
        if (compound[element]){
            throw new Error("Oops, "+element+" shows up twice in "+formula);
        }
        compound[element]=subscript;
        lastIndex=regex.lastIndex;
    }
    if (lastIndex!=formula.length){
        throw new Error("Bad formula: "+formula);
    }
    return compound;
}