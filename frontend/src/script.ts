import {initializeUIHandlers} from "./modules/uiHandlers.js";
import {initializeEventListeners} from "./modules/eventListeners.js";
import {initializeAppNav} from "./app-nav.js";
document.addEventListener("DOMContentLoaded", function(): void{
	initializeUIHandlers();
	initializeAppNav();

	// Dismiss page load overlay
	let overlay=document.querySelector(".page-overlay") as HTMLElement;
	if (overlay){
		setTimeout(function():void{
			overlay.classList.add("loaded");
			setTimeout(function():void{overlay.remove()},500);
		},300);
	}
	// Load periodic table data — use Wails bindings in desktop mode, direct JSON fetch in web mode
	async function loadPTableData(): Promise<any[]>{
		// Check if running in Wails desktop mode
		if (typeof window!=="undefined"&&"__wails__" in window){
			const {GetPTableData}=await import("../wailsjs/go/main/PTableService.js");
			const data=await GetPTableData();
			return JSON.parse(data);
		}
		// Direct JSON file fetch for web mode (no API server needed)
		const response=await fetch("/ptable.json");
		if (!response.ok){
			throw new Error("HTTP error! status: "+response.status);
		}
		return response.json();
	}
	loadPTableData()
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
		updateThemeColorMeta();
	}
	function updateThemeColorMeta(): void{
		let meta=document.querySelector('meta[name="theme-color"]');
		if (meta){
			let isDark=document.documentElement.classList.contains("dark")||(!document.documentElement.classList.contains("light")&&window.matchMedia("(prefers-color-scheme: dark)").matches);
			meta.setAttribute("content", isDark ? "#1c1b1f" : "#1a73e8");
		}
	}
	function updateThemeIcon(isDark: boolean): void{
		let themeToggle=document.getElementById("theme-toggle");
		if (themeToggle){
			if (isDark){
				themeToggle.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>';
			}
			else{
				themeToggle.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>';
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
	updateThemeIcon(document.documentElement.classList.contains("dark")||(!document.documentElement.classList.contains("light")&&window.matchMedia("(prefers-color-scheme: dark)").matches));
	let themeToggle=document.getElementById("theme-toggle");
	if (themeToggle){
		themeToggle.addEventListener("click", function(): void{
			let root=document.documentElement;
			let isDark=root.classList.contains("dark")||(!root.classList.contains("light")&&!root.classList.contains("dark")&&window.matchMedia("(prefers-color-scheme: dark)").matches);
			if (isDark){
				root.classList.remove("dark");
				root.classList.add("light");
				localStorage.setItem("theme", "light");
				updateThemeIcon(false);
			}
			else{
				root.classList.remove("light");
				root.classList.add("dark");
				localStorage.setItem("theme", "dark");
				updateThemeIcon(true);
			}
			updateThemeColorMeta();
		});
	}
	// Copy-to-clipboard for result areas
	document.querySelectorAll(".result").forEach(function(resultEl: Element){
		let copyBtn=document.createElement("button") as HTMLButtonElement;
		copyBtn.className="copy-button";
		copyBtn.setAttribute("aria-label", "Copy result");
		copyBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
		copyBtn.addEventListener("click", function(){
			let clone=resultEl.cloneNode(true) as HTMLElement;
			let btn=clone.querySelector(".copy-button");
			if (btn) btn.remove();
			let text=clone.textContent||"";
			navigator.clipboard.writeText(text.trim()).then(function(){
				copyBtn.classList.add("copied");
				copyBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
				setTimeout(function(){
					copyBtn.classList.remove("copied");
					copyBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
				}, 2000);
			}).catch(function(){
				copyBtn.style.color="var(--md-error)";
				setTimeout(function(){
					copyBtn.style.color="";
				}, 2000);
			});
		});
		(resultEl as HTMLElement).appendChild(copyBtn);
	});
});