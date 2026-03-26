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
	function applyTheme(theme: string): void{
		let root=document.documentElement;
		if (theme==="dark"){
			root.classList.add("dark");
			root.classList.remove("light");
		}
		else if (theme==="light"){
			root.classList.add("light");
			root.classList.remove("dark");
		}
		else{
			let prefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;
			if (prefersDark){
				root.classList.add("dark");
				root.classList.remove("light");
			}
			else{
				root.classList.add("light");
				root.classList.remove("dark");
			}
		}
	}
	let storedTheme=localStorage.getItem("theme");
	if (storedTheme){
		applyTheme(storedTheme);
	}
	else{
		applyTheme("system");
	}
	let themeToggle=document.getElementById("theme-toggle");
	if (themeToggle){
		themeToggle.addEventListener("click", function(): void{
			let root=document.documentElement;
			if (root.classList.contains("dark")){
				root.classList.remove("dark");
				root.classList.add("light");
				localStorage.setItem("theme", "light");
			}
			else if (root.classList.contains("light")){
				root.classList.remove("light");
				root.classList.add("dark");
				localStorage.setItem("theme", "dark");
			}
			else{
				let isDark=window.matchMedia("(prefers-color-scheme: dark)").matches;
				if (isDark){
					root.classList.add("light");
					root.classList.remove("dark");
					localStorage.setItem("theme", "light");
				}
				else{
					root.classList.add("dark");
					root.classList.remove("light");
					localStorage.setItem("theme", "dark");
				}
			}
		});
	}
});