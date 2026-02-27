document.addEventListener("DOMContentLoaded", function(){
	let navLinks=document.querySelectorAll("nav a") as NodeListOf<HTMLAnchorElement>;
	let mainGroups=Array.from(document.querySelectorAll(".main-groups")) as HTMLElement[];
	let nav=document.querySelector("nav") as HTMLElement;
	let navHeight=nav.getBoundingClientRect().height;
	function clearActive(): void{
		navLinks.forEach(function(link){
			link.classList.remove("active");
		});
	}
	navLinks.forEach(function(link){
		link.addEventListener("click", function(e: MouseEvent){
			e.preventDefault();
			clearActive();
			this.classList.add("active");
			let targetEl=document.querySelector(this.getAttribute("href") as string) as HTMLElement;
			if (targetEl){
				window.scrollTo({
					top: targetEl.offsetTop-navHeight,
					behavior: "smooth"
				});
			}
		});
	});
	function onScroll(): void{
		let scrollPos=window.scrollY+navHeight+5;
		let current=mainGroups[0];
		for (let section of mainGroups){
			if (section.offsetTop<=scrollPos){
				current=section;
			}
		}
		if (window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-2){
			current=mainGroups[mainGroups.length-1];
		}
		clearActive();
		let activeLink=document.querySelector('nav a[href="#'+current.id+'"]') as HTMLAnchorElement;
		if (activeLink){
			activeLink.classList.add("active");
		}
	}
	window.addEventListener("scroll", onScroll);
	onScroll();
	let header=document.querySelector("header") as HTMLElement;
	if (header&&"IntersectionObserver" in window){
		let observer=new IntersectionObserver((entries: IntersectionObserverEntry[])=>{
			let entry=entries[0];
			if (!entry.isIntersecting){
				nav.classList.add("nav--pinned");
			}
			else{
				nav.classList.remove("nav--pinned");
			}
		},{
			root: null,
			threshold: 0
		});
		observer.observe(header);
	}
	else{
		let fallback=()=>{
			if (header.getBoundingClientRect().bottom<=0){
				nav.classList.add("nav--pinned");
			}
			else{
				nav.classList.remove("nav--pinned");
			}
		};
		window.addEventListener("scroll", fallback,{ passive: true });
		fallback();
	}
});