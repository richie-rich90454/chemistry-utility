import gsap from "gsap";

interface CalculatorInfo{
	id: string;
	name: string;
	category: string;
	icon: string;
	description: string;
}

const CALCULATORS: CalculatorInfo[]=[
	{id:"element-lookup",name:"Element Lookup",category:"General",icon:"element",description:"Look up element properties"},
	{id:"mass-calc",name:"Molar Mass",category:"General",icon:"mass",description:"Calculate molar mass of compounds"},
	{id:"balancing",name:"Equation Balancer",category:"General",icon:"balance",description:"Balance chemical equations"},
	{id:"dilution-calc",name:"Dilution",category:"Solutions",icon:"dilution",description:"Molarity and dilution calculations"},
	{id:"mass-percent-calc",name:"Mass Percent",category:"Solutions",icon:"percent",description:"Concentration and mass percent"},
	{id:"solution-mixing-calc",name:"Solution Mixing",category:"Solutions",icon:"mixing",description:"Mix solutions of different concentrations"},
	{id:"nuclear-chemistry",name:"Nuclear",category:"Physical Chemistry",icon:"nuclear",description:"Half-life and nuclear decay"},
	{id:"gas-laws",name:"Gas Laws",category:"Physical Chemistry",icon:"gas",description:"Ideal, combined, Van der Waals"},
	{id:"electrochemistry",name:"Electrochemistry",category:"Physical Chemistry",icon:"electro",description:"Cell potential, Nernst, electrolysis"},
	{id:"stoichiometry",name:"Stoichiometry",category:"Reactions & Bonds",icon:"stoich",description:"Reaction stoichiometry calculations"},
	{id:"bond-type-predictor",name:"Bond Type",category:"Reactions & Bonds",icon:"bond",description:"Predict ionic, covalent, or metallic"}
];

const TAB_CALCULATOR_IDS=["element-lookup","mass-calc","balancing","dilution-calc"];
const RECENT_KEY="chem-utility-recent";
const COLLAPSED_KEY="chem-utility-sidebar-collapsed";
const MAX_RECENT=3;

let activeViewId:string|null=null;
let navHistory:string[]=[];

function getIconSvg(type:string):string{
	const icons:Record<string,string>={
		element:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
		mass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M3 12h18"/><circle cx="12" cy="12" r="9"/></svg>',
		balance:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h5"/><path d="M17 12h5"/><path d="M7 12a5 5 0 0 1 10 0"/><path d="M12 2v4"/><path d="M12 18v4"/></svg>',
		dilution:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8l-1 9H9L8 2z"/><path d="M9 11a3 3 0 0 0 6 0"/><path d="M12 14v8"/></svg>',
		percent:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/></svg>',
		mixing:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h5"/><path d="M17 12h5"/><path d="M12 2v5"/><path d="M12 17v5"/><circle cx="12" cy="12" r="4"/></svg>',
		nuclear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>',
		gas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>',
		electro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
		stoich:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h6"/><path d="M17 12l5 5-5 5"/></svg>',
		bond:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
		more:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>',
		clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
		search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
		collapse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>',
		expand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
	};
	return icons[type]||icons.element;
}

function switchView(targetId:string,addToHistory:boolean=true):void{
	if (targetId===activeViewId) return;

	let sections=document.querySelectorAll(".app-view .main-groups.card") as NodeListOf<HTMLElement>;
	let welcomeScreen=document.querySelector(".app-view .welcome-screen") as HTMLElement;

	// Add to history before switching
	if (addToHistory&&activeViewId){
		navHistory.push(activeViewId);
		if (navHistory.length>20) navHistory.shift();
	}

	// Hide all sections
	sections.forEach(function(section:HTMLElement):void{
		section.classList.remove("view-active");
		section.classList.add("view-hidden");
	});

	// Hide welcome screen
	if (welcomeScreen) welcomeScreen.style.display="none";

	// Show target
	let target=document.getElementById(targetId) as HTMLElement;
	if (target){
		target.classList.remove("view-hidden");
		target.classList.add("view-active");
		// GSAP entrance
		if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
			gsap.fromTo(target,{opacity:0,y:10},{opacity:1,y:0,duration:0.2,ease:"power2.out"});
		}
	}

	activeViewId=targetId;

	// Update sidebar active state
	updateSidebarActive(targetId);
	// Update bottom tab active state
	updateTabActive(targetId);
	// Update nav sheet active state
	updateSheetActive(targetId);
	// Save to recent
	addRecent(targetId);
	// Update URL hash
	history.pushState(null,"","#"+targetId);
}

function updateSidebarActive(targetId:string):void{
	let links=document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
	links.forEach(function(link:HTMLElement):void{
		if (link.getAttribute("href")==="#"+targetId){
			link.classList.add("active");
		}else{
			link.classList.remove("active");
		}
	});
}

function updateTabActive(targetId:string):void{
	let tabs=document.querySelectorAll(".tab-item") as NodeListOf<HTMLElement>;
	tabs.forEach(function(tab:HTMLElement):void{
		let tabTarget=tab.getAttribute("data-target");
		if (tabTarget===targetId){
			tab.classList.add("active");
		}else{
			tab.classList.remove("active");
		}
	});
}

function updateSheetActive(targetId:string):void{
	let items=document.querySelectorAll(".nav-sheet .sheet-item") as NodeListOf<HTMLElement>;
	items.forEach(function(item:HTMLElement):void{
		if (item.getAttribute("data-target")===targetId){
			item.classList.add("active");
		}else{
			item.classList.remove("active");
		}
	});
}

function showWelcome():void{
	let sections=document.querySelectorAll(".app-view .main-groups.card") as NodeListOf<HTMLElement>;
	let welcomeScreen=document.querySelector(".app-view .welcome-screen") as HTMLElement;

	sections.forEach(function(section:HTMLElement):void{
		section.classList.remove("view-active");
		section.classList.add("view-hidden");
	});

	if (welcomeScreen){
		welcomeScreen.style.display="block";
		if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
			gsap.fromTo(welcomeScreen,{opacity:0,y:12},{opacity:1,y:0,duration:0.3,ease:"power2.out"});
		}
	}

	activeViewId=null;
	updateSidebarActive("");
	updateTabActive("");
}

// ── Recent calculators ──
function getRecent():string[]{
	try{
		let stored=localStorage.getItem(RECENT_KEY);
		return stored?JSON.parse(stored):[];
	}catch{return[];}
}

function addRecent(id:string):void{
	let recent=getRecent().filter(function(r:string):boolean{return r!==id});
	recent.unshift(id);
	recent=recent.slice(0,MAX_RECENT);
	try{localStorage.setItem(RECENT_KEY,JSON.stringify(recent))}catch{}
	renderRecent();
}

function renderRecent():void{
	let container=document.querySelector(".nav-recent");
	if (!container) return;
	let recent=getRecent();
	if (recent.length===0){
		container.innerHTML="";
		return;
	}
	let html='<div class="nav-recent-label">Recent</div>';
	recent.forEach(function(id:string):void{
		let calc=CALCULATORS.find(function(c:CalculatorInfo):boolean{return c.id===id});
		if (calc){
			html+='<a href="#'+id+'"><svg class="recent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'+calc.name+'</a>';
		}
	});
	container.innerHTML=html;

	// Add click handlers
	container.querySelectorAll("a").forEach(function(link:HTMLAnchorElement):void{
		link.addEventListener("click",function(e:MouseEvent):void{
			e.preventDefault();
			let targetId=link.getAttribute("href")?.slice(1);
			if (targetId) switchView(targetId);
		});
	});
}

// ── Sidebar search ──
function initializeSearch():void{
	let searchInput=document.querySelector(".sidebar-search input") as HTMLInputElement;
	if (!searchInput) return;

	searchInput.addEventListener("input",function():void{
		let query=searchInput.value.toLowerCase().trim();
		let links=document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
		let categories=document.querySelectorAll(".sidebar-nav .nav-category") as NodeListOf<HTMLElement>;
		let noResults=document.querySelector(".sidebar-nav .no-results") as HTMLElement;

		if (!query){
			links.forEach(function(link:HTMLElement):void{link.style.display=""});
			categories.forEach(function(cat:HTMLElement):void{cat.style.display=""});
			if (noResults) noResults.style.display="none";
			return;
		}

		let visibleCount=0;
		links.forEach(function(link:HTMLElement):void{
			let text=link.textContent?.toLowerCase()||"";
			if (text.includes(query)){
				link.style.display="";
				visibleCount++;
			}else{
				link.style.display="none";
			}
		});

		// Hide categories with no visible links
		categories.forEach(function(cat:HTMLElement):void{
			let nextEl=cat.nextElementSibling;
			let hasVisible=false;
			while (nextEl&&!nextEl.classList.contains("nav-category")){
				if (nextEl.tagName==="A"&&(nextEl as HTMLElement).style.display!=="none"){
					hasVisible=true;
					break;
				}
				nextEl=nextEl.nextElementSibling;
			}
			cat.style.display=hasVisible?"":"none";
		});

		if (noResults) noResults.style.display=visibleCount===0?"block":"none";
	});

	// Ctrl+K shortcut
	document.addEventListener("keydown",function(e:KeyboardEvent):void{
		if ((e.ctrlKey||e.metaKey)&&e.key==="k"){
			e.preventDefault();
			searchInput.focus();
		}
	});
}

// ── Keyboard shortcuts ──
function initializeKeyboardShortcuts():void{
	document.addEventListener("keydown",function(e:KeyboardEvent):void{
		if (e.altKey&&e.key>="1"&&e.key<="9"){
			e.preventDefault();
			let index=parseInt(e.key)-1;
			if (index<CALCULATORS.length){
				switchView(CALCULATORS[index].id);
			}
		}
		if (e.altKey&&e.key==="0"){
			e.preventDefault();
			if (CALCULATORS.length>=10) switchView(CALCULATORS[9].id);
		}
		if (e.altKey&&e.key==="-"){
			e.preventDefault();
			if (CALCULATORS.length>=11) switchView(CALCULATORS[10].id);
		}
	});
}

// ── Sidebar collapse ──
function initializeSidebarCollapse():void{
	let sidebar=document.querySelector(".sidebar") as HTMLElement;
	let toggleBtn=document.querySelector(".sidebar-toggle") as HTMLElement;
	if (!sidebar||!toggleBtn) return;

	// Restore state
	let collapsed=localStorage.getItem(COLLAPSED_KEY)==="true";
	if (collapsed) sidebar.classList.add("collapsed");

	toggleBtn.addEventListener("click",function():void{
		sidebar.classList.toggle("collapsed");
		let isCollapsed=sidebar.classList.contains("collapsed");
		try{localStorage.setItem(COLLAPSED_KEY,String(isCollapsed))}catch{}

		// Update icon
		let svg=toggleBtn.querySelector("svg");
		if (svg) svg.innerHTML=isCollapsed?getIconSvg("expand").replace(/<svg[^>]*>|<\/svg>/g,""):getIconSvg("collapse").replace(/<svg[^>]*>|<\/svg>/g,"");
	});
}

// ── Nav sheet (mobile) ──
function initializeNavSheet():void{
	let backdrop=document.querySelector(".nav-sheet-backdrop") as HTMLElement;
	let sheet=document.querySelector(".nav-sheet") as HTMLElement;
	let moreBtn=document.querySelector(".tab-item[data-target='more']") as HTMLElement;
	if (!backdrop||!sheet||!moreBtn) return;

	function openSheet():void{
		backdrop.classList.add("open");
		sheet.classList.add("open");
	}
	function closeSheet():void{
		backdrop.classList.remove("open");
		sheet.classList.remove("open");
	}

	moreBtn.addEventListener("click",openSheet);
	backdrop.addEventListener("click",closeSheet);
	document.addEventListener("keydown",function(e:KeyboardEvent):void{
		if (e.key==="Escape") closeSheet();
	});

	// Sheet item clicks
	sheet.querySelectorAll(".sheet-item").forEach(function(item:HTMLElement):void{
		item.addEventListener("click",function():void{
			let targetId=item.getAttribute("data-target");
			if (targetId){
				switchView(targetId);
				closeSheet();
			}
		});
	});
}

// ── Bottom tab bar ──
function initializeBottomTabs():void{
	let tabs=document.querySelectorAll(".tab-item") as NodeListOf<HTMLElement>;
	tabs.forEach(function(tab:HTMLElement):void{
		let target=tab.getAttribute("data-target");
		if (target&&target!=="more"){
			tab.addEventListener("click",function():void{
				switchView(target);
			});
		}
	});
}

// ── Welcome screen ──
function buildWelcomeScreen():void{
	let container=document.querySelector(".app-view .welcome-screen");
	if (!container) return;

	let html='<h2>Chemistry Utility</h2><p>Pick a calculator to get started</p><div class="welcome-grid">';
	CALCULATORS.forEach(function(calc:CalculatorInfo):void{
		html+='<div class="welcome-card" data-target="'+calc.id+'">';
		html+='<div class="welcome-card-icon">'+getIconSvg(calc.icon)+'</div>';
		html+='<div class="welcome-card-title">'+calc.name+'</div>';
		html+='<div class="welcome-card-desc">'+calc.description+'</div>';
		html+='</div>';
	});
	html+='</div>';
	container.innerHTML=html;

	// Click handlers
	container.querySelectorAll(".welcome-card").forEach(function(card:HTMLElement):void{
		card.addEventListener("click",function():void{
			let targetId=card.getAttribute("data-target");
			if (targetId) switchView(targetId);
		});
	});
}

// ── Build nav sheet content ──
function buildNavSheet():void{
	let sheet=document.querySelector(".nav-sheet");
	if (!sheet) return;

	let html='<div class="sheet-handle"></div>';
	let currentCategory="";
	CALCULATORS.forEach(function(calc:CalculatorInfo):void{
		if (calc.category!==currentCategory){
			currentCategory=calc.category;
			html+='<div class="sheet-category">'+currentCategory+'</div>';
		}
		html+='<button class="sheet-item" data-target="'+calc.id+'">'+getIconSvg(calc.icon)+'<span>'+calc.name+'</span></button>';
	});
	sheet.innerHTML=html;
}

// ── Add shortcut hints to sidebar ──
function addShortcutHints():void{
	let links=document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
	links.forEach(function(link:HTMLElement,i:number):void{
		if (i<9){
			let hint=document.createElement("span");
			hint.className="shortcut-hint";
			hint.textContent="Alt+"+(i+1);
			link.appendChild(hint);
		}else if (i===9){
			let hint=document.createElement("span");
			hint.className="shortcut-hint";
			hint.textContent="Alt+0";
			link.appendChild(hint);
		}else if (i===10){
			let hint=document.createElement("span");
			hint.className="shortcut-hint";
			hint.textContent="Alt+-";
			link.appendChild(hint);
		}
	});
}

// ── Main initialization ──
export function initializeAppNav():void{
	let isAppView=document.querySelector(".app-view")!==null;
	if (!isAppView) return;

	// Build dynamic content
	buildWelcomeScreen();
	buildNavSheet();
	renderRecent();
	addShortcutHints();

	// Initialize features
	initializeSearch();
	initializeKeyboardShortcuts();
	initializeSidebarCollapse();
	initializeBottomTabs();
	initializeNavSheet();

	// Sidebar link click handlers (override scroll behavior)
	let sidebarLinks=document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
	sidebarLinks.forEach(function(link:HTMLElement):void{
		link.addEventListener("click",function(e:MouseEvent):void{
			e.preventDefault();
			let href=link.getAttribute("href");
			if (href){
				let targetId=href.slice(1);
				switchView(targetId);
			}
		});
	});

	// Handle initial hash
	let hash=window.location.hash.slice(1);
	if (hash&&document.getElementById(hash)){
		switchView(hash,false);
	}else{
		showWelcome();
	}

	// Handle browser back/forward
	window.addEventListener("popstate",function():void{
		let h=window.location.hash.slice(1);
		if (h&&document.getElementById(h)){
			switchView(h,false);
		}else{
			showWelcome();
		}
	});
}
