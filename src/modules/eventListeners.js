import {calculateMolarMass} from "./formulaParser.js";
import {balanceEquation} from "./equationBalancer.js";
import {getCalculationType, calculateStoichiometry} from "./stoichiometryCalculator.js";
import {calculateDilution, calculateMassPercent, calculateMixing} from "./solutionCalculators.js";
import {calculateIdealGasLaw, calculateCombinedGasLaw, calculateVanDerWaals, calculateHalfLife} from "./gasLawCalculators.js";
import {calculateCellPotential, calculateNernst, calculateElectrolysis} from "./electrochemistryCalculators.js";
import {predictBondType } from "./bondPredictor.js";
export function initializeEventListeners(elementsData){
    document.getElementById("element-input").addEventListener("keyup", function(){
        lookUpElement(elementsData);
    });
    document.getElementById("formula-input").addEventListener("keyup", function(){
        calculateMass(elementsData);
    });
    document.getElementById("balance-button").addEventListener("click", balanceEquations);
    document.getElementById("calculation-type").addEventListener("change", function(){
        let equation=document.getElementById("stoich-equation-input").value.trim();
        if (equation){
            getCalculationType(equation);
        }
    });
    document.getElementById("calculate-stoich-button").addEventListener("click", function(){
        let equation=document.getElementById("stoich-equation-input").value.trim();
        calculateStoichiometry(equation);
    });
    document.getElementById("calculate-dilution").addEventListener("click", calculateDilution);
    document.getElementById("calculate-mass-percent").addEventListener("click", calculateMassPercent);
    document.getElementById("calculate-mixing").addEventListener("click", calculateMixing);
    document.getElementById("calculate-ideal").addEventListener("click", calculateIdealGasLaw);
    document.getElementById("calculate-combined").addEventListener("click", calculateCombinedGasLaw);
    document.getElementById("calculate-vdw").addEventListener("click", calculateVanDerWaals);
    document.getElementById("ideal-R-units").addEventListener("change", function(){
        let units=this.value;
        if (units=="atm-L"){
            document.getElementById("ideal-P").setAttribute("placeholder", "P (atm)");
            document.getElementById("ideal-V").setAttribute("placeholder", "V (L)");
        }
        else if (units=="SI"){
            document.getElementById("ideal-P").setAttribute("placeholder", "P (Pa)");
            document.getElementById("ideal-V").setAttribute("placeholder", "V (m³)");
        }
    });
    document.getElementById("calculate-half-life").addEventListener("click", calculateHalfLife);
    document.getElementById("half-life-solve-for").addEventListener("change", function(){
        let solveFor=this.value;
        let displayStyle=(solveFor=="time"||solveFor=="half-life")?"block":"none";
        document.getElementById("remaining-quantity-group").style.display=displayStyle;
    });
    document.getElementById("calculate-cell-potential").addEventListener("click", calculateCellPotential);
    document.getElementById("calculate-nernst").addEventListener("click", calculateNernst);
    document.getElementById("calculate-electrolysis").addEventListener("click", calculateElectrolysis);
    document.getElementById("calculate-bond-type").addEventListener("click", function(){
        predictBondType(elementsData);
    });
}
function lookUpElement(elementsData){
    let input=document.getElementById("element-input");
    let inputValue=input.value.trim().toLowerCase();
    input.classList.remove("error");
    let element=null;
    for (let i=0; i<elementsData.length; i++){
        let currentElement=elementsData[i];
        if (currentElement.symbol.toLowerCase()==inputValue||currentElement.name.toLowerCase()==inputValue){
            element=currentElement;
            break;
        }
    }
    let elementInfo=document.getElementById("element-info");
    if (element!=null){
        let info="<p><strong>Symbol:</strong> "+element.symbol+"</p>"+"<p><strong>Name:</strong> "+element.name+"</p>"+"<p><strong>Atomic Mass:</strong> "+element.atomicMass+" u</p>"+"<p><strong>Atomic Number:</strong> "+element.atomicNumber+"</p>"+"<p><strong>Electronegativity:</strong> "+(element.electronegativity!=null?element.electronegativity:"N/A")+"</p>"+"<p><strong>Electron Affinity:</strong> "+(element.electronAffinity!=null?element.electronAffinity:"N/A")+" kJ/mol</p>"+"<p><strong>Atomic Radius:</strong> "+(element.atomicRadius!=null?element.atomicRadius:"N/A")+" pm</p>"+"<p><strong>Ionization Energy:</strong> "+(element.ionizationEnergy!=null?element.ionizationEnergy:"N/A")+" kJ/mol</p>"+"<p><strong>Valence Electrons:</strong> "+element.valenceElectrons+"</p>"+"<p><strong>Total Electrons:</strong> "+element.totalElectrons+"</p>"+"<p><strong>Group:</strong> "+element.group+"</p>"+"<p><strong>Period:</strong> "+element.period+"</p>"+"<p><strong>Type:</strong> "+element.type+"</p>";
        elementInfo.innerHTML=info;
        elementInfo.classList.add("show");
    }
    else{
        elementInfo.innerHTML="<p>Element not found</p>";
        elementInfo.classList.add("show");
        input.classList.add("error");
    }
}
function calculateMass(elementsData){
    let input=document.getElementById("formula-input");
    let formula=input.value.trim();
    input.classList.remove("error");
    let massResult=document.getElementById("mass-result");
    if (formula==""){
        massResult.innerHTML="<p>Please enter a chemical formula</p>";
        massResult.classList.add("show");
        input.classList.add("error");
        return;
    }
    try{
        let totalMass=calculateMolarMass(formula, elementsData);
        massResult.innerHTML="<p>Molar Mass: "+totalMass.toFixed(2)+" g/mol</p>";
        massResult.classList.add("show");
    }
    catch (error){
        massResult.innerHTML="<p>"+error.message+"</p>";
        massResult.classList.add("show");
        input.classList.add("error");
    }
}
function balanceEquations(){
    let input=document.getElementById("equation-input");
    let equation=input.value.trim();
    input.classList.remove("error");
    let balanceResult=document.getElementById("balance-result");
    if (equation==""){
        balanceResult.innerHTML="<p>Please enter a chemical equation</p>";
        balanceResult.classList.add("show");
        input.classList.add("error");
        return;
    }
    try{
        balanceResult.innerHTML="Balancing...";
        balanceResult.classList.add("show");
        let balancedEquation=balanceEquation(equation);
        balanceResult.innerHTML="<p>Balanced Equation: "+balancedEquation+"</p>";
        balanceResult.classList.add("show");
    }
    catch (error){
        balanceResult.innerHTML="<p>"+error.message+"</p>";
        balanceResult.classList.add("show");
        input.classList.add("error");
    }
}