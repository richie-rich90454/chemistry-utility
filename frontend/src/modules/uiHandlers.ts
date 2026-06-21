import {slideDown, slideUp} from "./animationUtils.js";

/**
 * Initializes user interface handlers for collapsible sections and clear
 * buttons. Encapsulates the DOM event wiring that was previously done by the
 * standalone {@link initializeUIHandlers} function.
 */
export class UIHandlerInitializer {
	public initialize(): void {
		this.initializeSectionCollapse();
		this.initializeClearButtons();
	}

	private initializeSectionCollapse(): void {
		let headers = document.querySelectorAll(".main-groups h2") as NodeListOf<HTMLElement>;
		for (let i = 0; i < headers.length; i++) {
			headers[i].addEventListener("click", function(this: HTMLElement) {
				let section = this.closest(".main-groups") as HTMLElement;
				let hasCollapsedClass = section.classList.contains("collapsed");
				if (hasCollapsedClass) {
					section.classList.remove("collapsed");
					let children = section.querySelectorAll("*:not(h2)") as NodeListOf<HTMLElement>;
					for (let j = 0; j < children.length; j++) {
						slideDown(children[j], 300);
					}
				}
				else {
					section.classList.add("collapsed");
					let children = section.querySelectorAll("*:not(h2)") as NodeListOf<HTMLElement>;
					for (let j = 0; j < children.length; j++) {
						slideUp(children[j], 300);
					}
				}
			});
		}
	}

	private initializeClearButtons(): void {
		let clearButtons = document.querySelectorAll(".clear-button") as NodeListOf<HTMLElement>;
		for (let i = 0; i < clearButtons.length; i++) {
			clearButtons[i].addEventListener("click", function(this: HTMLElement) {
				let sectionId = this.dataset.section!;
				let section = document.getElementById(sectionId) as HTMLElement;
				let inputs = section.querySelectorAll("input") as NodeListOf<HTMLInputElement>;
				for (let j = 0; j < inputs.length; j++) {
					inputs[j].value = "";
					inputs[j].classList.remove("error");
				}
				let selects = section.querySelectorAll("select") as NodeListOf<HTMLSelectElement>;
				for (let j = 0; j < selects.length; j++) {
					selects[j].selectedIndex = 0;
				}
				let result = section.querySelector(".result") as HTMLElement;
				if (result) {
					result.innerHTML = "";
					result.classList.remove("show");
				}
			});
		}
	}
}

/**
 * Backwards-compatible wrapper that creates a {@link UIHandlerInitializer}
 * instance and runs the initialization.
 */
export function initializeUIHandlers(): void {
	let handler = new UIHandlerInitializer();
	handler.initialize();
}
