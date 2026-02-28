import {slideDown, slideUp} from "./animationUtils.js";
export function initializeUIHandlers(): void{
	let headers=document.querySelectorAll(".main-groups h2") as NodeListOf<HTMLElement>;
	for (let i=0; i<headers.length; i++){
		headers[i].addEventListener("click", function(this: HTMLElement){
			let section=this.closest(".main-groups") as HTMLElement;
			let hasCollapsedClass=section.classList.contains("collapsed");
			if (hasCollapsedClass){
				section.classList.remove("collapsed");
				let children=section.querySelectorAll("*:not(h2)") as NodeListOf<HTMLElement>;
				for (let j=0; j<children.length; j++){
					slideDown(children[j], 300);
				}
			}
			else{
				section.classList.add("collapsed");
				let children=section.querySelectorAll("*:not(h2)") as NodeListOf<HTMLElement>;
				for (let j=0; j<children.length; j++){
					slideUp(children[j], 300);
				}
			}
		});
	}
	let inputs=document.querySelectorAll("input, select") as NodeListOf<HTMLElement>;
	for (let i=0; i<inputs.length; i++){
		inputs[i].addEventListener("focus", function(this: HTMLElement){
			this.style.borderColor="var(--primary-blue)";
			this.style.boxShadow="0 0 5px rgba(28, 148, 233, .5)";
		});
		inputs[i].addEventListener("blur", function(this: HTMLElement){
			let hasErrorClass=this.classList.contains("error");
			if (!hasErrorClass){
				this.style.borderColor="#DDD";
				this.style.boxShadow="none";
			}
		});
	}
	let clearButtons=document.querySelectorAll(".clear-button") as NodeListOf<HTMLElement>;
	for (let i=0; i<clearButtons.length; i++){
		clearButtons[i].addEventListener("click", function(this: HTMLElement){
			let sectionId=this.dataset.section!;
			let section=document.getElementById(sectionId) as HTMLElement;
			let inputs=section.querySelectorAll("input") as NodeListOf<HTMLInputElement>;
			for (let j=0; j<inputs.length; j++){
				inputs[j].value="";
				inputs[j].classList.remove("error");
			}
			let selects=section.querySelectorAll("select") as NodeListOf<HTMLSelectElement>;
			for (let j=0; j<selects.length; j++){
				selects[j].selectedIndex=0;
			}
			let result=section.querySelector(".result") as HTMLElement;
			if (result){
				result.innerHTML="";
				result.classList.remove("show");
			}
		});
	}
}