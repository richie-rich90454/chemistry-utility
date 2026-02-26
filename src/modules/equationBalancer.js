import {formatFormula} from "./formulaParser.js";
export function parseEquation(equation){
    let sides=equation.split("->");
    let trimmedSides=[];
    for (let i=0; i<sides.length; i++){
        trimmedSides.push(sides[i].trim());
    }
    if (trimmedSides.length!=2){
        throw new Error("Equation format is off, use \"->\" between sides");
    }
    let reactants=trimmedSides[0].split("+");
    let trimmedReactants=[];
    for (let i=0; i<reactants.length; i++){
        trimmedReactants.push(reactants[i].trim());
    }
    let products=trimmedSides[1].split("+");
    let trimmedProducts=[];
    for (let i=0; i<products.length; i++){
        trimmedProducts.push(products[i].trim());
    }
    return{ reactants: trimmedReactants, products: trimmedProducts };
}
function calculateGCD(a, b){
    if (b==0){
        return a;
    }
    return calculateGCD(b, a%b);
}
function calculateLCM(a, b){
    return (a/calculateGCD(a, b))*b;
}
class Fraction{
    constructor(numerator, denominator){
        this.numerator=numerator;
        this.denominator=denominator;
        this.normalize();
    }
    normalize(){
        if (this.denominator<0){
            this.numerator=-this.numerator;
            this.denominator=-this.denominator;
        }
        let gcdValue=calculateGCD(Math.abs(this.numerator), Math.abs(this.denominator));
        this.numerator=this.numerator/gcdValue;
        this.denominator=this.denominator/gcdValue;
    }
    add(fraction){
        let newNumerator=(this.numerator*fraction.denominator)+(fraction.numerator*this.denominator);
        let newDenominator=this.denominator*fraction.denominator;
        return new Fraction(newNumerator, newDenominator);
    }
    sub(fraction){
        let newNumerator=(this.numerator*fraction.denominator)-(fraction.numerator*this.denominator);
        let newDenominator=this.denominator*fraction.denominator;
        return new Fraction(newNumerator, newDenominator);
    }
    mul(fraction){
        let newNumerator=this.numerator*fraction.numerator;
        let newDenominator=this.denominator*fraction.denominator;
        return new Fraction(newNumerator, newDenominator);
    }
    div(fraction){
        let newNumerator=this.numerator*fraction.denominator;
        let newDenominator=this.denominator*fraction.numerator;
        return new Fraction(newNumerator, newDenominator);
    }
}
export function balanceEquation(equation){
    let maxCoefficient=1250;
    let equationParts=parseEquation(equation);
    let reactants=equationParts.reactants;
    let products=equationParts.products;
    let allCompounds=reactants.concat(products);
    let parsedCompounds=[];
    for (let i=0; i<allCompounds.length; i++){
        parsedCompounds.push(formatFormula(allCompounds[i]));
    }
    let uniqueElements=[];
    let elementSet=new Set();
    for (let i=0; i<parsedCompounds.length; i++){
        let compound=parsedCompounds[i];
        let compoundKeys=Object.keys(compound);
        for (let j=0; j<compoundKeys.length; j++){
            elementSet.add(compoundKeys[j]);
        }
    }
    uniqueElements=Array.from(elementSet);
    let compoundCount=allCompounds.length;
    let elementCount=uniqueElements.length;
    let coefficientMatrix=[];
    for (let i=0; i<elementCount; i++){
        let element=uniqueElements[i];
        let row=[];
        for (let j=0; j<compoundCount; j++){
            let sign=j<reactants.length?1:-1;
            let compound=parsedCompounds[j];
            let elementCountInCompound=compound[element]||0;
            row.push(sign*elementCountInCompound);
        }
        coefficientMatrix.push(row);
    }
    let variableCount=compoundCount-1;
    let equationCount=elementCount;
    let augmentedMatrix=[];
    for (let i=0; i<equationCount; i++){
        let row=[];
        for (let j=0; j<variableCount; j++){
            row.push(new Fraction(coefficientMatrix[i][j], 1));
        }
        row.push(new Fraction(-coefficientMatrix[i][compoundCount-1], 1));
        augmentedMatrix.push(row);
    }
    let rank=0;
    for (let col=0; col<variableCount&&rank<equationCount; col++){
        let pivotRow=rank;
        while (pivotRow<equationCount&&augmentedMatrix[pivotRow][col].numerator==0){
            pivotRow=pivotRow+1;
        }
        if (pivotRow==equationCount){
            continue;
        }
        let temp=augmentedMatrix[rank];
        augmentedMatrix[rank]=augmentedMatrix[pivotRow];
        augmentedMatrix[pivotRow]=temp;
        let pivot=augmentedMatrix[rank][col];
        let inverse=new Fraction(pivot.denominator, pivot.numerator);
        for (let j=col; j<=variableCount; j++){
            augmentedMatrix[rank][j]=augmentedMatrix[rank][j].mul(inverse);
        }
        for (let i=0; i<equationCount; i++){
            if (i!=rank&&augmentedMatrix[i][col].numerator!=0){
                let factor=augmentedMatrix[i][col];
                for (let j=col; j<=variableCount; j++){
                    augmentedMatrix[i][j]=augmentedMatrix[i][j].sub(factor.mul(augmentedMatrix[rank][j]));
                }
            }
        }
        rank=rank+1;
    }
    let solution=new Array(compoundCount);
    for (let j=0; j<variableCount; j++){
        let value=new Fraction(0, 1);
        for (let i=0; i<equationCount; i++){
            if (augmentedMatrix[i][j].numerator==1&&augmentedMatrix[i][j].denominator==1){
                value=augmentedMatrix[i][variableCount];
                break;
            }
        }
        solution[j]=value;
    }
    solution[compoundCount-1]=new Fraction(1, 1);
    let denominators=[];
    for (let i=0; i<solution.length; i++){
        denominators.push(solution[i].denominator);
    }
    let commonDenominator=denominators[0];
    for (let i=1; i<denominators.length; i++){
        commonDenominator=calculateLCM(commonDenominator, denominators[i]);
    }
    let coefficients=[];
    for (let i=0; i<solution.length; i++){
        let fraction=solution[i];
        let coefficient=fraction.numerator*(commonDenominator/fraction.denominator);
        coefficients.push(Math.round(coefficient));
    }
    let hasNegative=false;
    for (let i=0; i<coefficients.length; i++){
        if (coefficients[i]<0){
            hasNegative=true;
            break;
        }
    }
    if (hasNegative){
        for (let i=0; i<coefficients.length; i++){
            coefficients[i]=-coefficients[i];
        }
    }
    let gcdAll=coefficients[0];
    for (let i=1; i<coefficients.length; i++){
        gcdAll=calculateGCD(gcdAll, coefficients[i]);
    }
    for (let i=0; i<coefficients.length; i++){
        coefficients[i]=coefficients[i]/gcdAll;
    }
    let hasLargeCoefficient=false;
    for (let i=0; i<coefficients.length; i++){
        if (Math.abs(coefficients[i])>maxCoefficient){
            hasLargeCoefficient=true;
            break;
        }
    }
    if (hasLargeCoefficient){
        throw new Error("No solution found with coefficients up to "+maxCoefficient);
    }
    let leftSide="";
    for (let i=0; i<reactants.length; i++){
        let coefficient=coefficients[i];
        let term=coefficient==1?reactants[i]:coefficient+reactants[i];
        leftSide=leftSide+(i>0?"+":"")+term;
    }
    let rightSide="";
    for (let i=0; i<products.length; i++){
        let coefficient=coefficients[i+reactants.length];
        let term=coefficient==1?products[i]:coefficient+products[i];
        rightSide=rightSide+(i>0?"+":"")+term;
    }
    return leftSide+" -> "+rightSide;
}