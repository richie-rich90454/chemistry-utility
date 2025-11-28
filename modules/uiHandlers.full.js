//Use "terser modules/uiHandlers.full.js -o modules/uiHandlers.js --config-file terser.config.json" to compress the file
import {slideDown, slideUp} from "./animationUtils.js";
export function initializeUIHandlers(){
    let headers=document.querySelectorAll(".main-groups h2");
    for (let i=0; i<headers.length; i++){
        headers[i].addEventListener("click", function(){
            let section=this.closest(".main-groups");
            let hasCollapsedClass=section.classList.contains("collapsed");
            if (hasCollapsedClass){
                section.classList.remove("collapsed");
                let children=section.querySelectorAll("*:not(h2)");
                for (let j=0; j<children.length; j++){
                    slideDown(children[j], 300);
                }
            }
            else{
                section.classList.add("collapsed");
                let children=section.querySelectorAll("*:not(h2)");
                for (let j=0; j<children.length; j++){
                    slideUp(children[j], 300);
                }
            }
        });
    }
    let inputs=document.querySelectorAll("input, select");
    for (let i=0; i<inputs.length; i++){
        inputs[i].addEventListener("focus", function(){
            this.style.borderColor="var(--primary-blue)";
            this.style.boxShadow="0 0 5px rgba(28, 148, 233, .5)";
        });
        inputs[i].addEventListener("blur", function(){
            let hasErrorClass=this.classList.contains("error");
            if (!hasErrorClass){
                this.style.borderColor="#DDD";
                this.style.boxShadow="none";
            }
        });
    }
    let buttons=document.querySelectorAll("button:not(.clear-button)");
    for (let i=0; i<buttons.length; i++){
        buttons[i].addEventListener("mouseenter", function(){
            this.style.backgroundColor="var(--dark-blue)";
            this.style.transform="translateY(-2px)";
            this.style.boxShadow="0 4px 8px var(--shadow-color)";
        });
        buttons[i].addEventListener("mouseleave", function(){
            this.style.backgroundColor="var(--primary-blue)";
            this.style.transform="translateY(0)";
            this.style.boxShadow="0 2px 4px var(--shadow-color)";
        });
    }
    let clearButtons=document.querySelectorAll(".clear-button");
    for (let i=0; i<clearButtons.length; i++){
        clearButtons[i].addEventListener("click", function(){
            let sectionId=this.dataset.section;
            let section=document.getElementById(sectionId);
            let inputs=section.querySelectorAll("input");
            for (let j=0; j<inputs.length; j++){
                inputs[j].value="";
                inputs[j].classList.remove("error");
            }
            let selects=section.querySelectorAll("select");
            for (let j=0; j<selects.length; j++){
                selects[j].selectedIndex=0;
            }
            let result=section.querySelector(".result");
            if (result){
                result.innerHTML="";
                result.classList.remove("show");
            }
        });
    }
}