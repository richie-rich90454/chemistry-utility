import {initializeUIHandlers} from "./modules/uiHandlers.js";
import {initializeEventListeners} from "./modules/eventListeners.js";
document.addEventListener("DOMContentLoaded", function(): void{
	initializeUIHandlers();
	fetch("/api/ptable",{
		headers:{
			"X-Requested-With": "XMLHttpRequest"
		}
	})
	.then(function(response: Response): Promise<any>{
		if (!response.ok){
			throw new Error("HTTP error! status: "+response.status);
		}
		return response.json();
	})
	.then(function(elementsData: any): void{
		initializeEventListeners(elementsData);
	})
	.catch(function(error: Error): void{
		console.error("Error fetching data:", error);
		let elementInfo=document.getElementById("element-info") as HTMLElement;
		elementInfo.innerHTML="<p>Error loading element data table</p>";
		elementInfo.classList.add("show");
	});
});