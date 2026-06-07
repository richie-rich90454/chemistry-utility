import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", function(): void{
	// Respect reduced motion preference
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	// Intro card entrance
	let intro=document.querySelector(".intro") as HTMLElement;
	if (intro){
		gsap.from(intro, {
			opacity: 0,
			y: 20,
			duration: 0.5,
			ease: "power2.out"
		});
	}

	// Stagger card entrances on scroll
	let cards=document.querySelectorAll(".main-groups.card") as NodeListOf<HTMLElement>;
	cards.forEach(function(card: HTMLElement): void{
		gsap.from(card, {
			scrollTrigger: {
				trigger: card,
				start: "top 90%",
				toggleActions: "play none none none"
			},
			opacity: 0,
			y: 16,
			duration: 0.4,
			ease: "power2.out"
		});
	});

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

	// Result area animation — observe for .show class
	let resultObserver=new MutationObserver(function(mutations: MutationRecord[]): void{
		mutations.forEach(function(mutation: MutationRecord): void{
			if (mutation.type==="attributes"&&mutation.attributeName==="class"){
				let target=mutation.target as HTMLElement;
				if (target.classList.contains("show")){
					gsap.from(target, {
						opacity: 0,
						y: 8,
						duration: 0.25,
						ease: "power2.out"
					});
				}
			}
		});
	});
	document.querySelectorAll(".result").forEach(function(el: Element): void{
		resultObserver.observe(el, {attributes: true, attributeFilter: ["class"]});
	});

	// Button press feedback via GSAP
	document.querySelectorAll(".primary-button").forEach(function(btn: Element): void{
		btn.addEventListener("mousedown", function(): void{
			gsap.to(btn, {scale: 0.96, duration: 0.08, ease: "power2.out"});
		});
		btn.addEventListener("mouseup", function(): void{
			gsap.to(btn, {scale: 1, duration: 0.15, ease: "elastic.out(1, 0.5)"});
		});
		btn.addEventListener("mouseleave", function(): void{
			gsap.to(btn, {scale: 1, duration: 0.15, ease: "power2.out"});
		});
	});
});
