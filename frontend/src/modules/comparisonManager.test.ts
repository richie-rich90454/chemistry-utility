import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ComparisonManager } from "./comparisonManager.js";

function setupModal(): void {
    let modal: HTMLElement = document.createElement("div");
    modal.id = "comparison-modal";
    modal.style.display = "none";
    let content: HTMLElement = document.createElement("div");
    content.className = "comparison-modal-content";
    let close: HTMLElement = document.createElement("span");
    close.className = "comparison-close";
    close.textContent = "x";
    let heading: HTMLElement = document.createElement("h2");
    heading.textContent = "Comparison";
    let body: HTMLElement = document.createElement("div");
    body.id = "comparison-content";
    content.appendChild(close);
    content.appendChild(heading);
    content.appendChild(body);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

describe("ComparisonManager", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        ComparisonManager.resetInstance();
        setupModal();
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        ComparisonManager.resetInstance();
        vi.restoreAllMocks();
    });

    describe("getInstance", function () {
        it("should return same instance on subsequent calls", function () {
            let m1: ComparisonManager = ComparisonManager.getInstance();
            let m2: ComparisonManager = ComparisonManager.getInstance();
            expect(m1).toBe(m2);
        });

        it("should return new instance after resetInstance", function () {
            let m1: ComparisonManager = ComparisonManager.getInstance();
            ComparisonManager.resetInstance();
            let m2: ComparisonManager = ComparisonManager.getInstance();
            expect(m1).not.toBe(m2);
        });
    });

    describe("addToComparison", function () {
        it("should add an item and return true", function () {
            let manager: ComparisonManager = ComparisonManager.getInstance();
            let added: boolean = manager.addToComparison("c1", { "inputs": { "a": 1 } });
            expect(added).toBe(true);
            expect(manager.getCount()).toBe(1);
        });

        it("should update data when adding the same calculation id twice", function () {
            let manager: ComparisonManager = ComparisonManager.getInstance();
            manager.addToComparison("c1", { "inputs": { "a": 1 } });
            let added: boolean = manager.addToComparison("c1", { "inputs": { "a": 2 } });
            expect(added).toBe(true);
            expect(manager.getCount()).toBe(1);
        });

        it("should limit to a maximum of two items", function () {
            let manager: ComparisonManager = ComparisonManager.getInstance();
            manager.init();
            manager.clearComparison();
            let first: boolean = manager.addToComparison("c1", { "inputs": { "a": 1 } });
            let second: boolean = manager.addToComparison("c2", { "inputs": { "a": 2 } });
            let third: boolean = manager.addToComparison("c3", { "inputs": { "a": 3 } });
            expect(first).toBe(true);
            expect(second).toBe(true);
            expect(third).toBe(false);
            expect(manager.getCount()).toBe(2);
        });

        it("should auto-show comparison modal when two items are selected", function () {
            let manager: ComparisonManager = ComparisonManager.getInstance();
            manager.init();
            manager.clearComparison();
            let modal: HTMLElement = document.getElementById("comparison-modal") as HTMLElement;
            expect(modal.style.display).toBe("none");
            manager.addToComparison("c1", { "inputs": { "a": 1 } });
            manager.addToComparison("c2", { "inputs": { "a": 2 } });
            expect(modal.style.display).toBe("flex");
            let table: HTMLElement | null = document.querySelector(".comparison-table");
            expect(table).not.toBeNull();
        });
    });

    describe("showComparison", function () {
        it("should show empty message when no items", function () {
            let manager: ComparisonManager = ComparisonManager.getInstance();
            manager.init();
            manager.clearComparison();
            manager.showComparison();
            let modal: HTMLElement = document.getElementById("comparison-modal") as HTMLElement;
            expect(modal.style.display).toBe("flex");
            let content: HTMLElement = document.getElementById("comparison-content") as HTMLElement;
            expect(content.textContent).toContain("Select calculations to compare.");
        });

        it("should render side-by-side table highlighting same and different values", function () {
            let manager: ComparisonManager = ComparisonManager.getInstance();
            manager.init();
            manager.clearComparison();
            manager.addToComparison("c1", {
                "inputs": { "formula": "H2O", "temp": 25 },
                "result": { "mass": 18.015 }
            });
            manager.addToComparison("c2", {
                "inputs": { "formula": "H2O", "temp": 30 },
                "result": { "mass": 18.015 }
            });
            let rows: NodeListOf<HTMLTableRowElement> = document.querySelectorAll(".comparison-table tbody tr");
            expect(rows.length).toBe(3);

            let formulaCells: NodeListOf<HTMLTableCellElement> = rows[0].querySelectorAll("td");
            expect(formulaCells[1].className).toContain("comparison-same");
            expect(formulaCells[2].className).toContain("comparison-same");
            expect(formulaCells[3].textContent).toBe("—");

            let tempCells: NodeListOf<HTMLTableCellElement> = rows[1].querySelectorAll("td");
            expect(tempCells[1].textContent).toBe("25");
            expect(tempCells[2].textContent).toBe("30");
            expect(tempCells[1].className).toContain("comparison-different");
            expect(tempCells[2].className).toContain("comparison-different");
            expect(tempCells[3].textContent).toContain("%");

            let massCells: NodeListOf<HTMLTableCellElement> = rows[2].querySelectorAll("td");
            expect(massCells[1].className).toContain("comparison-same");
            expect(massCells[2].className).toContain("comparison-same");
        });

        it("should compute percentage difference for numeric values", function () {
            let manager: ComparisonManager = ComparisonManager.getInstance();
            manager.init();
            manager.clearComparison();
            manager.addToComparison("c1", { "result": { "value": 100 } });
            manager.addToComparison("c2", { "result": { "value": 150 } });
            let rows: NodeListOf<HTMLTableRowElement> = document.querySelectorAll(".comparison-table tbody tr");
            let diffCell: HTMLTableCellElement = rows[0].querySelectorAll("td")[3];
            expect(diffCell.textContent).toBe("40.00%");
        });
    });

    describe("clearComparison", function () {
        it("should remove all items and hide the modal", function () {
            let manager: ComparisonManager = ComparisonManager.getInstance();
            manager.init();
            manager.addToComparison("c1", { "inputs": { "a": 1 } });
            manager.addToComparison("c2", { "inputs": { "a": 2 } });
            let modal: HTMLElement = document.getElementById("comparison-modal") as HTMLElement;
            expect(modal.style.display).toBe("flex");
            manager.clearComparison();
            expect(manager.getCount()).toBe(0);
            expect(modal.style.display).toBe("none");
            let content: HTMLElement = document.getElementById("comparison-content") as HTMLElement;
            expect(content.innerHTML).toBe("");
        });
    });

    describe("init", function () {
        it("should wire close button to hide the modal", function () {
            let manager: ComparisonManager = ComparisonManager.getInstance();
            manager.init();
            manager.addToComparison("c1", { "inputs": { "a": 1 } });
            manager.addToComparison("c2", { "inputs": { "a": 2 } });
            let modal: HTMLElement = document.getElementById("comparison-modal") as HTMLElement;
            expect(modal.style.display).toBe("flex");
            let close: HTMLElement = document.querySelector(".comparison-close") as HTMLElement;
            close.dispatchEvent(new Event("click"));
            expect(modal.style.display).toBe("none");
        });

        it("should be idempotent", function () {
            let manager: ComparisonManager = ComparisonManager.getInstance();
            manager.init();
            manager.init();
            let modal: HTMLElement = document.getElementById("comparison-modal") as HTMLElement;
            let close: HTMLElement = document.querySelector(".comparison-close") as HTMLElement;
            let clickCount: number = 0;
            close.addEventListener("click", function () {
                clickCount = clickCount + 1;
            });
            manager.addToComparison("c1", { "inputs": { "a": 1 } });
            manager.addToComparison("c2", { "inputs": { "a": 2 } });
            close.dispatchEvent(new Event("click"));
            expect(modal.style.display).toBe("none");
            expect(clickCount).toBe(1);
        });
    });
});
