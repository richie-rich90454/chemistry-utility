import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", function(): void{
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	// ── Page load animations ──

	// Logo icon pop
	let logoIcon=document.querySelector(".logo-icon") as HTMLElement;
	if (logoIcon){
		gsap.from(logoIcon, {
			scale: 0,
			duration: 0.4,
			ease: "back.out(1.7)",
			delay: 0.1
		});
	}

	// Sidebar header title slide
	let sidebarTitle=document.querySelector(".sidebar-header h1") as HTMLElement;
	if (sidebarTitle){
		gsap.from(sidebarTitle, {
			opacity: 0,
			x: -10,
			duration: 0.35,
			ease: "power2.out",
			delay: 0.15
		});
	}

	// Theme toggle fade
	let themeToggle=document.querySelector(".theme-toggle") as HTMLElement;
	if (themeToggle){
		gsap.from(themeToggle, {
			opacity: 0,
			scale: 0.5,
			duration: 0.3,
			ease: "back.out(2)",
			delay: 0.25
		});
	}

	// Sidebar nav items stagger entrance
	let navItems=document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
	if (navItems.length>0){
		gsap.from(navItems, {
			opacity: 0,
			x: -12,
			duration: 0.3,
			stagger: 0.03,
			ease: "power2.out",
			delay: 0.2
		});
	}

	// Sidebar footer fade
	let sidebarFooter=document.querySelector(".sidebar-footer") as HTMLElement;
	if (sidebarFooter){
		gsap.from(sidebarFooter, {
			opacity: 0,
			duration: 0.4,
			delay: 0.5
		});
	}

	// Card scroll-triggered entrances
	let cards=document.querySelectorAll(".main-groups.card") as NodeListOf<HTMLElement>;
	cards.forEach(function(card: HTMLElement): void{
		gsap.from(card, {
			scrollTrigger: {
				trigger: card,
				start: "top 92%",
				toggleActions: "play none none none"
			},
			opacity: 0,
			y: 16,
			duration: 0.4,
			ease: "power2.out"
		});
	});

	// Intro card entrance (now at bottom)
	let intro=document.querySelector(".intro") as HTMLElement;
	if (intro){
		gsap.from(intro, {
			scrollTrigger: {
				trigger: intro,
				start: "top 90%",
				toggleActions: "play none none none"
			},
			opacity: 0,
			y: 20,
			duration: 0.5,
			ease: "power2.out"
		});
	}

	// ── Interactive animations ──

	// Button press feedback
	document.querySelectorAll(".primary-button").forEach(function(btn: Element): void{
		btn.addEventListener("mousedown", function(): void{
			gsap.to(btn, {scale: 0.96, duration: 0.08, ease: "power2.out"});
		});
		btn.addEventListener("mouseup", function(): void{
			gsap.to(btn, {scale: 1, duration: 0.2, ease: "elastic.out(1, 0.5)"});
		});
		btn.addEventListener("mouseleave", function(): void{
			gsap.to(btn, {scale: 1, duration: 0.15, ease: "power2.out"});
		});
	});

	// Theme toggle spin
	if (themeToggle){
		themeToggle.addEventListener("click", function(): void{
			gsap.to(themeToggle, {
				rotation: "+=360",
				duration: 0.5,
				ease: "power2.inOut"
			});
		});
	}

	// Input focus glow animation
	document.querySelectorAll("input, select, textarea").forEach(function(el: Element): void{
		el.addEventListener("focus", function(): void{
			gsap.to(el, {
				scale: 1.01,
				duration: 0.15,
				ease: "power2.out"
			});
		});
		el.addEventListener("blur", function(): void{
			gsap.to(el, {
				scale: 1,
				duration: 0.15,
				ease: "power2.out"
			});
		});
	});

	// ── DOM change observer animations ──

	// Result area animation — observe for content changes
	let resultObserver=new MutationObserver(function(mutations: MutationRecord[]): void{
		mutations.forEach(function(mutation: MutationRecord): void{
			let target=mutation.target as HTMLElement;
			// Animate when result gets content
			if (mutation.type==="childList"&&target.classList.contains("result")&&target.textContent&&target.textContent.trim().length>0){
				gsap.fromTo(target, {opacity: 0, y: 8}, {
					opacity: 1,
					y: 0,
					duration: 0.25,
					ease: "power2.out",
					clearProps: "opacity,y"
				});
				// Green border flash on success
				if (!target.classList.contains("error")&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
					let computedBorder=getComputedStyle(target).borderLeftColor;
					gsap.fromTo(target,{borderLeftColor:getComputedStyle(document.documentElement).getPropertyValue("--success").trim()},{
						borderLeftColor:computedBorder,
						duration:0.6,
						ease:"power2.out",
						clearProps:"borderLeftColor"
					});
					gsap.fromTo(target,{boxShadow:"0 0 8px color-mix(in srgb, var(--success) 20%, transparent)"},{
						boxShadow:"0 0 0px transparent",
						duration:0.5,
						ease:"power2.out",
						clearProps:"boxShadow"
					});
				}
			}
			// Animate when .show class is added
			if (mutation.type==="attributes"&&mutation.attributeName==="class"){
				if (target.classList.contains("show")){
					gsap.fromTo(target, {opacity: 0, y: 8}, {
						opacity: 1,
						y: 0,
						duration: 0.25,
						ease: "power2.out",
						clearProps: "opacity,y"
					});
				}
			}
			// Animate when .error class is added to input
			if (mutation.type==="attributes"&&mutation.attributeName==="class"&&(mutation.target as HTMLElement).tagName==="INPUT"){
				if ((mutation.target as HTMLElement).classList.contains("error")){
					gsap.fromTo(mutation.target, {x: -4}, {
						x: 0,
						duration: 0.4,
						ease: "elastic.out(1, 0.3)",
						clearProps: "x"
					});
				}
			}
		});
	});

	// Observe all result divs for content changes
	document.querySelectorAll(".result").forEach(function(el: Element): void{
		resultObserver.observe(el, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["class"]
		});
	});

	// Observe all inputs for error class changes
	document.querySelectorAll("input, select").forEach(function(el: Element): void{
		resultObserver.observe(el, {
			attributes: true,
			attributeFilter: ["class"]
		});
	});

	// Observe #stoich-inputs for dynamic content (stoichiometry calculator)
	let stoichInputs=document.getElementById("stoich-inputs");
	if (stoichInputs){
		let stoichObserver=new MutationObserver(function(mutations: MutationRecord[]): void{
			mutations.forEach(function(mutation: MutationRecord[]): void{
				if (mutation.type==="childList"&&stoichInputs.children.length>0){
					// Animate newly added inputs
					let newChildren=Array.from(stoichInputs.children) as HTMLElement[];
					gsap.from(newChildren, {
						opacity: 0,
						y: 10,
						duration: 0.25,
						stagger: 0.05,
						ease: "power2.out"
					});
				}
			});
		});
		stoichObserver.observe(stoichInputs, {childList: true, subtree: true});
	}

	// Observe #remaining-quantity-group visibility toggle
	let remainingGroup=document.getElementById("remaining-quantity-group");
	if (remainingGroup){
		let remainingObserver=new MutationObserver(function(mutations: MutationRecord[]): void{
			mutations.forEach(function(mutation: MutationRecord[]): void{
				if (mutation.type==="attributes"&&mutation.attributeName==="style"){
					let display=remainingGroup.style.display;
					if (display!=="none"){
						gsap.from(remainingGroup, {
							opacity: 0,
							height: 0,
							duration: 0.25,
							ease: "power2.out"
						});
					}
				}
			});
		});
		remainingObserver.observe(remainingGroup, {attributes: true, attributeFilter: ["style"]});
	}

	// Scroll-to-top button appearance animation
	let scrollTopBtn=document.getElementById("scroll-top") as HTMLElement;
	if (scrollTopBtn){
		let scrollObserver=new MutationObserver(function(mutations: MutationRecord[]): void{
			mutations.forEach(function(mutation: MutationRecord[]): void{
				if (mutation.type==="attributes"&&mutation.attributeName==="class"){
					if (scrollTopBtn.classList.contains("visible")){
						gsap.from(scrollTopBtn, {
							scale: 0.5,
							opacity: 0,
							duration: 0.25,
							ease: "back.out(2)"
						});
					}
				}
			});
		});
		scrollObserver.observe(scrollTopBtn, {attributes: true, attributeFilter: ["class"]});
	}

	// Sidebar active link transition
	let sidebarLinks=document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
	sidebarLinks.forEach(function(link: HTMLElement): void{
		let linkObserver=new MutationObserver(function(mutations: MutationRecord[]): void{
			mutations.forEach(function(mutation: MutationRecord[]): void{
				if (mutation.type==="attributes"&&mutation.attributeName==="class"){
					if (link.classList.contains("active")){
						gsap.fromTo(link, {scale: 0.95}, {
							scale: 1,
							duration: 0.2,
							ease: "back.out(2)"
						});
					}
				}
			});
		});
		linkObserver.observe(link, {attributes: true, attributeFilter: ["class"]});
	});

	// ── Welcome card hover lift ──
	document.querySelectorAll(".welcome-card").forEach(function(card: Element): void{
		card.addEventListener("mouseenter", function(): void{
			gsap.to(card, {y: -4, duration: 0.15, ease: "power2.out"});
		});
		card.addEventListener("mouseleave", function(): void{
			gsap.to(card, {y: 0, duration: 0.2, ease: "power2.out"});
		});
	});

	// ── Calculator view content stagger on switch ──
	let viewObserver=new MutationObserver(function(mutations: MutationRecord[]): void{
		mutations.forEach(function(mutation: MutationRecord[]): void{
			if (mutation.type==="attributes"&&mutation.attributeName==="class"){
				let target=mutation.target as HTMLElement;
				if (target.classList.contains("view-active")&&target.classList.contains("main-groups")){
					let inputs=target.querySelectorAll("input, select, .input-group");
					let buttons=target.querySelectorAll(".primary-button");
					let results=target.querySelectorAll(".result");
					gsap.from(inputs, {opacity: 0, y: 8, duration: 0.2, stagger: 0.04, ease: "power2.out"});
					gsap.from(buttons, {opacity: 0, scale: 0.95, duration: 0.2, delay: 0.1, ease: "power2.out"});
					gsap.from(results, {opacity: 0, duration: 0.2, delay: 0.15, ease: "power2.out"});
				}
			}
		});
	});
	document.querySelectorAll(".main-groups.card").forEach(function(el: Element): void{
		viewObserver.observe(el, {attributes: true, attributeFilter: ["class"]});
	});

	// ── Button ripple effect ──
	document.querySelectorAll(".primary-button").forEach(function(btn: Element): void{
		btn.addEventListener("click", function(e: Event): void{
			let rect=(btn as HTMLElement).getBoundingClientRect();
			let x=(e as MouseEvent).clientX-rect.left;
			let y=(e as MouseEvent).clientY-rect.top;
			let ripple=document.createElement("span");
			ripple.style.cssText="position:absolute;border-radius:50%;background:rgba(255,255,255,0.3);pointer-events:none;transform:scale(0);";
			ripple.style.left=x+"px";
			ripple.style.top=y+"px";
			ripple.style.width=ripple.style.height="20px";
			(btn as HTMLElement).appendChild(ripple);
			gsap.to(ripple, {scale: 4, opacity: 0, duration: 0.5, ease: "power2.out", onComplete: function(): void{ripple.remove();}});
		});
	});
});
