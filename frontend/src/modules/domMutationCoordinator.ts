/**
 * DOMMutationCoordinator — Singleton that consolidates all MutationObserver
 * instances into a single observer on the <main> element (or document.body).
 */
export class DOMMutationCoordinator {
	private static instance: DOMMutationCoordinator;
	private observer: MutationObserver | null = null;
	private handlers: Array<{
		selector: string;
		callback: (mutation: MutationRecord) => void;
	}> = [];
	private target: Element | null = null;

	private constructor() {}

	static getInstance(): DOMMutationCoordinator {
		if (!DOMMutationCoordinator.instance) {
			DOMMutationCoordinator.instance = new DOMMutationCoordinator();
		}
		return DOMMutationCoordinator.instance;
	}

	registerHandler(selector: string, callback: (mutation: MutationRecord) => void): void {
		this.handlers.push({ selector, callback });
	}

	observe(): void {
		if (this.observer) {
			return;
		}

		this.target = document.querySelector("main") || document.body;

		this.observer = new MutationObserver((mutations: MutationRecord[]) => {
			for (let i = 0; i < mutations.length; i++) {
				let mutation = mutations[i];
				let target = mutation.target as Element;
				for (let j = 0; j < this.handlers.length; j++) {
					let handler = this.handlers[j];
					if (target.matches(handler.selector)) {
						handler.callback(mutation);
					}
				}
			}
		});

		this.observer.observe(this.target, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ["class", "style"]
		});
	}

	disconnect(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
		this.target = null;
	}
}
