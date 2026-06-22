import { NavigationManager } from "./modules/navigationManager.js";

document.addEventListener("DOMContentLoaded", function (): void {
	let isAppView = document.querySelector(".app-view") !== null;
	if (isAppView) return; // app-nav.ts handles navigation in app mode

	let manager = NavigationManager.getInstance();
	manager.initialize();

	let sidebarLinks = document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLAnchorElement>;
	let sections = Array.from(document.querySelectorAll(".main-groups")) as HTMLElement[];

	function setActiveLink(sectionId: string): void {
		sidebarLinks.forEach(function (link: HTMLAnchorElement): void {
			let href = link.getAttribute("href") || "";
			let linkId = href.charAt(0) === "/" || href.charAt(0) === "#" ? href.slice(1) : href;
			link.classList.toggle("active", linkId === sectionId);
		});
	}

	let observerOptions = {
		root: null,
		rootMargin: "-10% 0px -70% 0px",
		threshold: 0
	};

	let observer = new IntersectionObserver(function (entries: IntersectionObserverEntry[]): void {
		entries.forEach(function (entry: IntersectionObserverEntry): void {
			if (entry.isIntersecting) {
				setActiveLink(entry.target.id);
			}
		});
	}, observerOptions);

	sections.forEach(function (section: HTMLElement): void {
		observer.observe(section);
	});

	window.addEventListener("scroll", function (): void {
		if (sections.length === 0) return;
		let scrollY = window.scrollY;
		if (scrollY < 10) setActiveLink(sections[0].id);
		if ((window.innerHeight + scrollY) >= document.documentElement.scrollHeight - 10) {
			setActiveLink(sections[sections.length - 1].id);
		}
	}, { passive: true });

	sidebarLinks.forEach(function (link: HTMLAnchorElement): void {
		link.addEventListener("click", function (e: MouseEvent): void {
			e.preventDefault();
			let href = link.getAttribute("href");
			if (!href) return;
			let targetId = href.charAt(0) === "/" || href.charAt(0) === "#" ? href.slice(1) : href;
			manager.navigate(targetId);
			manager.updateBreadcrumbs(targetId);
		});
	});

	// Scroll-to-top button
	let scrollTopBtn = document.getElementById("scroll-top") as HTMLButtonElement;
	if (scrollTopBtn) {
		window.addEventListener("scroll", function (): void {
			if (window.scrollY > 400) {
				scrollTopBtn.classList.add("visible");
			} else {
				scrollTopBtn.classList.remove("visible");
			}
		}, { passive: true });
		scrollTopBtn.addEventListener("click", function (): void {
			window.scrollTo({ top: 0, behavior: "smooth" });
		});
	}
});
