//Use "terser modules/bondPredictor.full.js -o modules/bondPredictor.js --config-file terser.config.json" to compress the file
export function predictBondType(elementsData){
    try{
        let element1Input=document.getElementById("element1-input");
        let element2Input=document.getElementById("element2-input");
        let resultDiv=document.getElementById("bond-type-result");
        element1Input.classList.remove("error");
        element2Input.classList.remove("error");
        resultDiv.classList.remove("show");
        let element1Value=element1Input.value.trim();
        let element2Value=element2Input.value.trim();
        if (!element1Value||!element2Value){
            element1Input.classList.add("error");
            element2Input.classList.add("error");
            throw new Error("Please enter both element symbols");
        }
        element1Value=element1Value.charAt(0).toUpperCase()+element1Value.slice(1).toLowerCase();
        element2Value=element2Value.charAt(0).toUpperCase()+element2Value.slice(1).toLowerCase();
        let element1=null;
        let element2=null;
        for (let i=0; i < elementsData.length; i++){
            let currentElement=elementsData[i];
            if (currentElement.symbol==element1Value){
                element1=currentElement;
            }
            if (currentElement.symbol==element2Value){
                element2=currentElement;
            }
            if (element1!=null&&element2!=null){
                break;
            }
        }
        if (!element1||!element2){
            element1Input.classList.add("error");
            element2Input.classList.add("error");
            throw new Error("One or both elements not found in periodic table");
        }
        let en1=element1.electronegativity;
        let en2=element2.electronegativity;
        if (en1==null||en2==null||en1==undefined||en2==undefined){
            resultDiv.innerHTML="<p>Bond prediction not possible due to unavailable electronegativity data</p>";
            resultDiv.classList.add("show");
            return;
        }
        let deltaEN=Math.abs(en1 - en2).toFixed(2);
        let type1=element1.type.toLowerCase();
        let type2=element2.type.toLowerCase();
        let isMetal1=(type1=="lanthanide"||type1=="actinide"||(type1.indexOf("metal")!=-1&&type1 != "metalloid"&&type1 != "non-metal"));
        let isMetal2=(type2=="lanthanide"||type2=="actinide"||(type2.indexOf("metal")!=-1&&type2 != "metalloid"&&type2 != "non-metal"));
        let bondType;
        if (isMetal1&&isMetal2){
            bondType="Metallic";
        }
        else if (isMetal1!=isMetal2||deltaEN>=1.7){
            bondType="Ionic";
        }
        else if (deltaEN>=.4){
            bondType="Polar Covalent";
        }
        else{
            bondType="Nonpolar Covalent";
        }
        let result="<p>"+element1.symbol+" ("+en1+") and "+element2.symbol+" ("+en2+") -> ΔEN="+deltaEN+" -> "+bondType+" bond</p>";
        resultDiv.innerHTML=result;
        resultDiv.classList.add("show");
    }
    catch (error){
        let resultDiv=document.getElementById("bond-type-result");
        resultDiv.innerHTML="<p>Error: "+error.message+"</p>";
        resultDiv.classList.add("show");
        document.getElementById("element1-input").classList.add("error");
        document.getElementById("element2-input").classList.add("error");
    }
}