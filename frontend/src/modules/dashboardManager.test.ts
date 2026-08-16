import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { DashboardManager, CalculationRecord, DashboardStats } from "./dashboardManager.js";

function makeCalc(overrides: Partial<CalculationRecord>): CalculationRecord {
    let base: CalculationRecord = {
        "ID": "1",
        "UserID": "local-user",
        "CalculatorType": "molar-mass",
        "Inputs": "H2O",
        "Result": "18.015",
        "Annotation": "",
        "Starred": false,
        "WorkspaceID": "",
        "CreatedAt": new Date().toISOString()
    };
    let keys: string[] = Object.keys(overrides);
    let i: number;
    for (i = 0; i < keys.length; i++) {
        let k: string = keys[i];
        (base as unknown as Record<string, unknown>)[k] = (overrides as unknown as Record<string, unknown>)[k];
    }
    return base;
}

function seedCalculations(calculations: CalculationRecord[]): void {
    localStorage.setItem("chemutil_calculations", JSON.stringify(calculations));
}

describe("DashboardManager", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        DashboardManager.resetInstance();
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        DashboardManager.resetInstance();
    });

    function setupDOM(): void {
        let main: HTMLElement = document.createElement("main");
        main.id = "main-content";
        document.body.appendChild(main);
    }

    describe("getInstance", function () {
        it("should return same instance on subsequent calls", function () {
            let m1: DashboardManager = DashboardManager.getInstance();
            let m2: DashboardManager = DashboardManager.getInstance();
            expect(m1).toBe(m2);
        });

        it("should return new instance after resetInstance", function () {
            let m1: DashboardManager = DashboardManager.getInstance();
            DashboardManager.resetInstance();
            let m2: DashboardManager = DashboardManager.getInstance();
            expect(m1).not.toBe(m2);
        });
    });

    describe("init", function () {
        it("should create dashboard-view section when not present", function () {
            setupDOM();
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            let section: HTMLElement | null = document.getElementById("dashboard-view");
            expect(section).not.toBeNull();
        });

        it("should use existing dashboard-view section when present", function () {
            setupDOM();
            let section: HTMLElement = document.createElement("section");
            section.id = "dashboard-view";
            section.className = "app-view dashboard-view";
            let mainEl: HTMLElement | null = document.getElementById("main-content");
            if (mainEl) {
                mainEl.appendChild(section);
            }
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            let found: HTMLElement | null = document.getElementById("dashboard-view");
            expect(found).toBe(section);
        });

        it("should not re-initialize on second call", function () {
            setupDOM();
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            let section: HTMLElement | null = document.getElementById("dashboard-view");
            manager.init();
            let after: HTMLElement | null = document.getElementById("dashboard-view");
            expect(after).toBe(section);
        });
    });

    describe("show / hide", function () {
        it("show displays the container and loads local data", async function () {
            setupDOM();
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            manager.show();
            await new Promise(function (resolve: Function): void { setTimeout(resolve, 0); });
            expect(manager.isVisible()).toBe(true);
        });

        it("hide sets container display to none", function () {
            setupDOM();
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            manager.show();
            manager.hide();
            expect(manager.isVisible()).toBe(false);
        });
    });

    describe("loadDashboardData", function () {
        it("renders stats and recent calculations from localStorage", async function () {
            setupDOM();
            let calc: CalculationRecord = makeCalc({
                "ID": "1",
                "CalculatorType": "molar-mass",
                "Inputs": "H2O",
                "Starred": true,
                "CreatedAt": new Date().toISOString()
            });
            seedCalculations([calc]);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            await manager.loadDashboardData();
            let statsContainer: HTMLElement | null = document.querySelector(".dashboard-stats");
            expect(statsContainer).not.toBeNull();
            if (statsContainer) {
                expect(statsContainer.querySelectorAll(".dashboard-stat-card").length).toBeGreaterThan(0);
            }
            let recent: HTMLElement | null = document.querySelector(".dashboard-recent");
            expect(recent).not.toBeNull();
            if (recent) {
                expect(recent.textContent).toContain("Recent Calculations");
                expect(recent.querySelectorAll(".dashboard-list-item").length).toBe(1);
            }
            expect(manager.getLastCalculations().length).toBe(1);
        });

        it("renders favorites when calculations are starred", async function () {
            setupDOM();
            let calc: CalculationRecord = makeCalc({
                "ID": "2",
                "CalculatorType": "balancing",
                "Inputs": "H2+O2->H2O",
                "Starred": true
            });
            seedCalculations([calc]);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            await manager.loadDashboardData();
            let favorites: HTMLElement | null = document.querySelector(".dashboard-favorites");
            expect(favorites).not.toBeNull();
            if (favorites) {
                expect(favorites.querySelectorAll(".dashboard-list-item").length).toBe(1);
            }
        });

        it("shows empty state in favorites when no starred calculations", async function () {
            setupDOM();
            let calc: CalculationRecord = makeCalc({
                "ID": "3",
                "CalculatorType": "balancing",
                "Inputs": "H2+O2->H2O",
                "Starred": false
            });
            seedCalculations([calc]);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            await manager.loadDashboardData();
            let favorites: HTMLElement | null = document.querySelector(".dashboard-favorites");
            expect(favorites).not.toBeNull();
            if (favorites) {
                expect(favorites.textContent).toContain("No favorite");
            }
        });

        it("renders weekly activity chart canvas", async function () {
            setupDOM();
            seedCalculations([]);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            await manager.loadDashboardData();
            let activity: HTMLElement | null = document.querySelector(".dashboard-activity");
            expect(activity).not.toBeNull();
            if (activity) {
                expect(activity.querySelectorAll("canvas#dashboard-activity-chart").length).toBe(1);
            }
        });

        it("renders empty states when localStorage has no calculations", async function () {
            setupDOM();
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            await manager.loadDashboardData();
            let recent: HTMLElement | null = document.querySelector(".dashboard-recent");
            expect(recent).not.toBeNull();
            if (recent) {
                expect(recent.textContent).toContain("No calculations yet");
            }
            expect(manager.getLastCalculations().length).toBe(0);
        });

        it("does not fetch when already loading", async function () {
            setupDOM();
            seedCalculations([]);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            let p1: Promise<void> = manager.loadDashboardData();
            let p2: Promise<void> = manager.loadDashboardData();
            await p1;
            await p2;
            expect(manager.getLastCalculations().length).toBe(0);
        });
    });

    describe("render methods", function () {
        let manager: DashboardManager;

        beforeEach(function () {
            setupDOM();
            manager = DashboardManager.getInstance();
            manager.init();
        });

        it("renderUsageStats renders four stat cards", function () {
            let stats: DashboardStats = {
                "totalCalculations": 10,
                "favoriteCount": 2,
                "thisWeekCount": 5,
                "calculatorsUsed": 3
            };
            manager.renderUsageStats(stats);
            let statsContainer: HTMLElement | null = document.querySelector(".dashboard-stats");
            expect(statsContainer).not.toBeNull();
            if (statsContainer) {
                expect(statsContainer.querySelectorAll(".dashboard-stat-card").length).toBe(4);
                expect(statsContainer.textContent).toContain("10");
                expect(statsContainer.textContent).toContain("2");
                expect(statsContainer.textContent).toContain("5");
                expect(statsContainer.textContent).toContain("3");
            }
        });

        it("renderRecentCalculations renders empty state when no calculations", function () {
            manager.renderRecentCalculations([]);
            let recent: HTMLElement | null = document.querySelector(".dashboard-recent");
            expect(recent).not.toBeNull();
            if (recent) {
                expect(recent.textContent).toContain("No calculations yet");
            }
        });

        it("renderRecentCalculations renders list items when calculations present", function () {
            let calc: CalculationRecord = makeCalc({
                "ID": "x1",
                "CalculatorType": "molar-mass",
                "Inputs": "H2O",
                "CreatedAt": "2026-07-17T12:00:00Z"
            });
            manager.renderRecentCalculations([calc]);
            let recent: HTMLElement | null = document.querySelector(".dashboard-recent");
            expect(recent).not.toBeNull();
            if (recent) {
                let items: NodeListOf<Element> = recent.querySelectorAll(".dashboard-list-item");
                expect(items.length).toBe(1);
                expect(recent.textContent).toContain("molar-mass");
                expect(recent.textContent).toContain("H2O");
            }
        });

        it("renderWeeklyActivity renders weekly activity chart", function () {
            manager.renderWeeklyActivity([]);
            let activity: HTMLElement | null = document.querySelector(".dashboard-activity");
            expect(activity).not.toBeNull();
            if (activity) {
                expect(activity.querySelectorAll("canvas#dashboard-activity-chart").length).toBe(1);
            }
        });

        it("renderFavorites renders empty state when no favorites", function () {
            manager.renderFavorites([]);
            let favorites: HTMLElement | null = document.querySelector(".dashboard-favorites");
            expect(favorites).not.toBeNull();
            if (favorites) {
                expect(favorites.textContent).toContain("No favorite");
            }
        });

        it("renderFavorites renders list items when favorites present", function () {
            let calc: CalculationRecord = makeCalc({
                "ID": "f1",
                "CalculatorType": "balancing",
                "Inputs": "H2+O2->H2O",
                "Starred": true,
                "CreatedAt": "2026-07-17T12:00:00Z"
            });
            manager.renderFavorites([calc]);
            let favorites: HTMLElement | null = document.querySelector(".dashboard-favorites");
            expect(favorites).not.toBeNull();
            if (favorites) {
                expect(favorites.querySelectorAll(".dashboard-list-item").length).toBe(1);
            }
        });
    });
});
