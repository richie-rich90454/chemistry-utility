export function validateInputs(inputs, ids){
    for (let i=0; i<inputs.length; i++){
        if (isNaN(inputs[i])){
            if (ids&&ids[i]){
                let input=document.getElementById(ids[i]);
                input.classList.add("error");
            }
            throw new Error("Please fill all required fields with valid numbers");
        }
    }
}
export function calculateDilution(){
    try{
        let select=document.getElementById("dilution-solve-for");
        let solveFor=select.value;
        let M1=parseFloat(document.getElementById("dilution-M1").value);
        let V1=parseFloat(document.getElementById("dilution-V1").value);
        let M2=parseFloat(document.getElementById("dilution-M2").value);
        let V2=parseFloat(document.getElementById("dilution-V2").value);
        let result, formula;
        let inputs=document.querySelectorAll("#dilution-calc input");
        for (let i=0; i<inputs.length; i++){
            inputs[i].classList.remove("error");
        }
        if (solveFor=="M1"){
            validateInputs([V1, M2, V2], ["dilution-V1", "dilution-M2", "dilution-V2"]);
            result=(M2*V2)/V1;
            formula="M<sub>1</sub>=(M<sub>2</sub> x V<sub>2</sub>)/V<sub>1</sub>";
        }
        else if (solveFor=="V1"){
            validateInputs([M1, M2, V2], ["dilution-M1", "dilution-M2", "dilution-V2"]);
            result=(M2*V2)/M1;
            formula="V<sub>1</sub>=(M<sub>2</sub> x V<sub>2</sub>)/M<sub>1</sub>";
        }
        else if (solveFor=="M2"){
            validateInputs([M1, V1, V2], ["dilution-M1", "dilution-V1", "dilution-V2"]);
            result=(M1*V1)/V2;
            formula="M<sub>2</sub>=(M<sub>1</sub> x V<sub>1</sub>)/V<sub>2</sub>";
        }
        else if (solveFor=="V2"){
            validateInputs([M1, V1, M2], ["dilution-M1", "dilution-V1", "dilution-M2"]);
            result=(M1*V1)/M2;
            formula="V<sub>2</sub>=(M<sub>1</sub> x V<sub>1</sub>)/M<sub>2</sub>";
        }
        else{
            throw new Error("Invalid calculation type");
        }
        let unit=solveFor.startsWith("M")?"M":"L";
        let resultDiv=document.getElementById("dilution-result");
        resultDiv.innerHTML="<p>"+formula+"</p><p>Result: "+result.toFixed(4)+" "+unit+"</p>";
        resultDiv.classList.add("show");
    }
    catch (error){
        let resultDiv=document.getElementById("dilution-result");
        resultDiv.innerHTML="<p>Error: "+error.message+"</p>";
        resultDiv.classList.add("show");
    }
}
export function calculateMassPercent(){
    try{
        let solute=parseFloat(document.getElementById("mass-solute").value);
        let solution=parseFloat(document.getElementById("mass-solution").value);
        let select=document.getElementById("concentration-unit");
        let unit=select.value;
        let inputs=document.querySelectorAll("#mass-percent-calc input");
        for (let i=0; i<inputs.length; i++){
            inputs[i].classList.remove("error");
        }
        validateInputs([solute, solution], ["mass-solute", "mass-solution"]);
        if (solution==0){
            throw new Error("Solution mass cannot be zero");
        }
        let ratio=solute/solution;
        let result, unitText;
        if (unit=="percent"){
            result=ratio*100;
            unitText="%";
        }
        else if (unit=="ppm"){
            result=ratio*1000000;
            unitText="ppm";
        }
        else if (unit=="ppb"){
            result=ratio*1000000000;
            unitText="ppb";
        }
        else{
            throw new Error("Invalid unit");
        }
        let resultDiv=document.getElementById("mass-percent-result");
        resultDiv.innerHTML="<p>Concentration: "+result.toFixed(4)+" "+unitText+"</p>";
        resultDiv.classList.add("show");
    }
    catch (error){
        let resultDiv=document.getElementById("mass-percent-result");
        resultDiv.innerHTML="<p>Error: "+error.message+"</p>";
        resultDiv.classList.add("show");
    }
}
export function calculateMixing(){
    try{
        let C1=parseFloat(document.getElementById("mix-C1").value);
        let V1=parseFloat(document.getElementById("mix-V1").value);
        let C2=parseFloat(document.getElementById("mix-C2").value);
        let V2=parseFloat(document.getElementById("mix-V2").value);
        let inputs=document.querySelectorAll("#solution-mixing-calc input");
        for (let i=0; i<inputs.length; i++){
            inputs[i].classList.remove("error");
        }
        validateInputs([C1, V1, C2, V2], ["mix-C1", "mix-V1", "mix-C2", "mix-V2"]);
        if (V1+V2==0){
            throw new Error("Total volume cannot be zero");
        }
        let totalMoles=(C1*V1)+(C2*V2);
        let totalVolume=V1+V2;
        let finalConcentration=totalMoles/totalVolume;
        let resultDiv=document.getElementById("mixing-result");
        resultDiv.innerHTML="<p>Final Concentration: "+finalConcentration.toFixed(4)+" M</p><p>Total Volume: "+totalVolume.toFixed(4)+" L</p>";
        resultDiv.classList.add("show");
    }
    catch (error){
        let resultDiv=document.getElementById("mixing-result");
        resultDiv.innerHTML="<p>Error: "+error.message+"</p>";
        resultDiv.classList.add("show");
    }
}