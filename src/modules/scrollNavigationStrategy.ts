import type { NavigationStrategy } from "./navigationManager.js";

export class ScrollNavigationStrategy implements NavigationStrategy {
	constructor() {}

	public navigate(targetId: string): void {
		let targetEl = document.getElementById(targetId) as HTMLElement;
		if (!targetEl) return;
		let header = document.querySelector(".sidebar-header") as HTMLElement;
		let headerHeight = header ? header.offsetHeight : 0;
		let offset = headerHeight + 20;
		let bodyRect = document.body.getBoundingClientRect().top;
		let elementRect = targetEl.getBoundingClientRect().top;
		let elementPosition = elementRect - bodyRect;
		let offsetPosition = elementPosition - offset;
		window.scrollTo({
			top: offsetPosition,
			behavior: "smooth"
		});
		history.pushState(null, "", "/" + targetId);
		this.setActiveLink(targetId);
	}

	private setActiveLink(sectionId: string): void {
		let sidebarLinks = document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLAnchorElement>;
		sidebarLinks.forEach(function (link: HTMLAnchorElement): void {
			let href = link.getAttribute("href") || "";
			let linkId = href.charAt(0) === "/" || href.charAt(0) === "#" ? href.slice(1) : href;
			link.classList.toggle("active", linkId === sectionId);
		});
	}
}
