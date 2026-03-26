document.addEventListener("DOMContentLoaded",function(){
	let sidebarLinks=document.querySelectorAll(".sidebar-nav a")as NodeListOf<HTMLAnchorElement>;
	let sections=Array.from(document.querySelectorAll(".main-groups"))as HTMLElement[];
	let header=document.querySelector(".sidebar-header")as HTMLElement;
	function getTotalOffset():number{
		let headerHeight=header?header.offsetHeight:0;
		return headerHeight+20;
	}
	function setActiveLink(sectionId:string):void{
		sidebarLinks.forEach(link=>{
			let href=link.getAttribute("href");
			link.classList.toggle("active",href===`#${sectionId}`);
		});
	}
	let observerOptions={
		root:null,
		rootMargin:"-10% 0px -70% 0px",
		threshold:0
	};
	let observer=new IntersectionObserver((entries)=>{
		entries.forEach(entry=>{
			if(entry.isIntersecting){
				setActiveLink(entry.target.id);
			}
		});
	},observerOptions);
	sections.forEach(section=>observer.observe(section));
	window.addEventListener("scroll",()=>{
		let scrollY=window.scrollY;
		if(scrollY<10)setActiveLink(sections[0].id);
		if((window.innerHeight+scrollY)>=document.documentElement.scrollHeight-10){
			setActiveLink(sections[sections.length-1].id);
		}
	},{passive:true});
	sidebarLinks.forEach(link=>{
		link.addEventListener("click",function(e:MouseEvent){
			e.preventDefault();
			let targetId=this.getAttribute("href");
			if(targetId&&targetId.startsWith("#")){
				let targetEl=document.querySelector(targetId)as HTMLElement;
				if(targetEl){
					let offset=getTotalOffset();
					let bodyRect=document.body.getBoundingClientRect().top;
					let elementRect=targetEl.getBoundingClientRect().top;
					let elementPosition=elementRect-bodyRect;
					let offsetPosition=elementPosition-offset;
					window.scrollTo({
						top:offsetPosition,
						behavior:"smooth"
					});
					history.pushState(null,"",targetId);
				}
			}
		});
	});
});