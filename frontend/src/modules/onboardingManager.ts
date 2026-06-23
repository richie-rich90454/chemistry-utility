const ONBOARDING_KEY = "onboarding-complete";

/**
 * Singleton class that manages the first-run onboarding tour,
 * contextual help tooltips, and worked examples for the Chemistry Utility.
 */
export class OnboardingManager {
	private static instance: OnboardingManager;
	private overlay: HTMLElement | null = null;
	private currentStep: number = 0;
	private steps: Array<{ selector: string; text: string }> = [];

	private constructor() {}

	public static getInstance(): OnboardingManager {
		if (!OnboardingManager.instance) {
			OnboardingManager.instance = new OnboardingManager();
		}
		return OnboardingManager.instance;
	}

	/**
	 * Returns true if this is the user's first visit (no onboarding-complete key in localStorage).
	 */
	public isFirstRun(): boolean {
		try {
			return localStorage.getItem(ONBOARDING_KEY) === null;
		} catch {
			return true;
		}
	}

	/**
	 * Starts the guided onboarding tour. Highlights key UI elements
	 * with step-by-step tooltips.
	 */
	public startTour(): void {
		this.steps = [
			{ selector: ".sidebar", text: "This sidebar lists all available calculators. Click any item to navigate." },
			{ selector: ".sidebar-search input", text: "Use the search bar to quickly find a calculator by name." },
			{ selector: "#theme-toggle", text: "Toggle between light and dark themes here." },
			{ selector: ".sidebar-nav a", text: "Click a calculator to get started, or use keyboard shortcuts (Alt+1 through Alt+9)." }
		];
		this.currentStep = 0;
		this.showStep();
	}

	/**
	 * Shows a tooltip near the specified element with the given text.
	 * @param element - The DOM element to anchor the tooltip to
	 * @param text - The tooltip text to display
	 */
	public showTooltip(element: HTMLElement, text: string): void {
		this.removeTooltip();

		let tooltip = document.createElement("div");
		tooltip.className = "onboarding-tooltip";
		tooltip.setAttribute("role", "tooltip");
		tooltip.innerHTML = '<div class="onboarding-tooltip-content">' + text + '</div>' +
			'<div class="onboarding-tooltip-actions">' +
			'<button class="onboarding-tooltip-dismiss">Got it</button>' +
			'</div>';

		document.body.appendChild(tooltip);

		let rect = element.getBoundingClientRect();
		tooltip.style.top = (rect.bottom + window.scrollY + 8) + "px";
		tooltip.style.left = (rect.left + window.scrollX) + "px";

		let dismissBtn = tooltip.querySelector(".onboarding-tooltip-dismiss") as HTMLElement;
		dismissBtn.addEventListener("click", (): void => {
			tooltip.remove();
		});
	}

	/**
	 * Marks the onboarding as complete in localStorage.
	 */
	public completeTour(): void {
		try {
			localStorage.setItem(ONBOARDING_KEY, "true");
		} catch {}
		this.removeOverlay();
	}

	private showStep(): void {
		if (this.currentStep >= this.steps.length) {
			this.completeTour();
			return;
		}

		this.removeOverlay();

		let step = this.steps[this.currentStep];
		let target = document.querySelector(step.selector) as HTMLElement;
		if (!target) {
			this.currentStep++;
			this.showStep();
			return;
		}

		// Create overlay
		this.overlay = document.createElement("div");
		this.overlay.className = "onboarding-overlay";

		let tooltip = document.createElement("div");
		tooltip.className = "onboarding-step-tooltip";
		tooltip.innerHTML =
			'<div class="onboarding-step-content">' +
			'<span class="onboarding-step-indicator">' + (this.currentStep + 1) + ' / ' + this.steps.length + '</span>' +
			'<p>' + step.text + '</p>' +
			'</div>' +
			'<div class="onboarding-step-actions">' +
			(this.currentStep > 0 ? '<button class="onboarding-prev">Back</button>' : '') +
			'<button class="onboarding-next primary-button">' + (this.currentStep === this.steps.length - 1 ? "Done" : "Next") + '</button>' +
			'<button class="onboarding-skip">Skip tour</button>' +
			'</div>';

		this.overlay.appendChild(tooltip);
		document.body.appendChild(this.overlay);

		// Position tooltip near the target element
		let rect = target.getBoundingClientRect();
		tooltip.style.top = (rect.bottom + window.scrollY + 12) + "px";
		tooltip.style.left = Math.max(16, rect.left + window.scrollX) + "px";

		// Highlight the target
		target.classList.add("onboarding-highlight");

		// Wire up buttons
		let nextBtn = tooltip.querySelector(".onboarding-next") as HTMLElement;
		let prevBtn = tooltip.querySelector(".onboarding-prev") as HTMLElement;
		let skipBtn = tooltip.querySelector(".onboarding-skip") as HTMLElement;

		nextBtn.addEventListener("click", (): void => {
			target.classList.remove("onboarding-highlight");
			this.currentStep++;
			this.showStep();
		});

		if (prevBtn) {
			prevBtn.addEventListener("click", (): void => {
				target.classList.remove("onboarding-highlight");
				this.currentStep--;
				this.showStep();
			});
		}

		skipBtn.addEventListener("click", (): void => {
			target.classList.remove("onboarding-highlight");
			this.completeTour();
		});
	}

	private removeOverlay(): void {
		if (this.overlay) {
			this.overlay.remove();
			this.overlay = null;
		}
		// Clean up any remaining highlights
		document.querySelectorAll(".onboarding-highlight").forEach(function (el: Element): void {
			el.classList.remove("onboarding-highlight");
		});
	}

	private removeTooltip(): void {
		let existing = document.querySelector(".onboarding-tooltip");
		if (existing) existing.remove();
	}

	/** Resets the singleton instance. For testing only. */
	public static resetInstance(): void {
		OnboardingManager.instance = null as any;
	}
}
