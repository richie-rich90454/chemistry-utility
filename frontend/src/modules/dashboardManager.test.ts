import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockGet = vi.fn();
const mockAuthSubscribe = vi.fn();
const mockAuthGetState = vi.fn();

vi.mock("./apiClient.js", function () {
    return {
        ApiClient: {
            getInstance: function () {
                return {
                    get: mockGet
                };
            }
        },
        ApiError: function (this: { status: number; type: string; detail: string; name: string; message: string }, status: number, type: string, detail: string) {
            this.status = status;
            this.type = type;
            this.detail = detail;
            this.name = "ApiError";
            this.message = detail;
        }
    };
});

vi.mock("./authManager.js", function () {
    return {
        AuthManager: {
            getInstance: function () {
                return {
                    subscribe: mockAuthSubscribe,
                    getState: mockAuthGetState
                };
            }
        }
    };
});

import { DashboardManager, CalculationRecord, DashboardStats } from "./dashboardManager.js";
import { ApiError } from "./apiClient.js";

describe("DashboardManager", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        DashboardManager.resetInstance();
        mockGet.mockReset();
        mockAuthSubscribe.mockReset();
        mockAuthGetState.mockReset();
        mockAuthSubscribe.mockReturnValue(function () { return; });
        mockAuthGetState.mockReturnValue({
            "isAuthenticated": false,
            "user": null,
            "accessToken": null,
            "refreshToken": null
        });
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        DashboardManager.resetInstance();
        vi.restoreAllMocks();
    });

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
            let main: HTMLElement = document.createElement("main");
            main.id = "main-content";
            document.body.appendChild(main);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            let section: HTMLElement | null = document.getElementById("dashboard-view");
            expect(section).not.toBeNull();
        });

        it("should use existing dashboard-view section when present", function () {
            let main: HTMLElement = document.createElement("main");
            main.id = "main-content";
            let section: HTMLElement = document.createElement("section");
            section.id = "dashboard-view";
            section.className = "app-view dashboard-view";
            main.appendChild(section);
            document.body.appendChild(main);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            let found: HTMLElement | null = document.getElementById("dashboard-view");
            expect(found).toBe(section);
        });

        it("should subscribe to AuthManager", function () {
            let main: HTMLElement = document.createElement("main");
            main.id = "main-content";
            document.body.appendChild(main);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            expect(mockAuthSubscribe).toHaveBeenCalled();
        });

        it("should not re-initialize on second call", function () {
            let main: HTMLElement = document.createElement("main");
            main.id = "main-content";
            document.body.appendChild(main);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            manager.init();
            expect(mockAuthSubscribe).toHaveBeenCalledTimes(1);
        });
    });

    describe("show / hide", function () {
        it("show displays the container when authenticated and loads data", async function () {
            let main: HTMLElement = document.createElement("main");
            main.id = "main-content";
            document.body.appendChild(main);
            mockAuthGetState.mockReturnValue({
                "isAuthenticated": true,
                "user": {
                    "id": "u1",
                    "email": "a@b.com",
                    "name": "Test",
                    "role": "user",
                    "emailVerified": true,
                    "createdAt": "2026-01-01T00:00:00Z"
                },
                "accessToken": "tok",
                "refreshToken": "rtok"
            });
            mockGet.mockImplementation(function (path: string) {
                if (path === "/api/v1/calculations?limit=10") {
                    return Promise.resolve({
                        "calculations": [] as CalculationRecord[],
                        "page": 1,
                        "limit": 10
                    });
                }
                return Promise.reject(new Error("not found"));
            });
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            manager.show();
            await vi.waitFor(function () {
                expect(mockGet).toHaveBeenCalledWith("/api/v1/calculations?limit=10");
            });
            expect(manager.isVisible()).toBe(true);
        });

        it("show displays sign-in prompt when not authenticated", function () {
            let main: HTMLElement = document.createElement("main");
            main.id = "main-content";
            document.body.appendChild(main);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            manager.show();
            let prompt: HTMLElement | null = document.querySelector(".dashboard-signin-prompt");
            expect(prompt).not.toBeNull();
            if (prompt) {
                expect(prompt.style.display).toBe("block");
            }
        });

        it("hide sets container display to none", function () {
            let main: HTMLElement = document.createElement("main");
            main.id = "main-content";
            document.body.appendChild(main);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            manager.show();
            manager.hide();
            expect(manager.isVisible()).toBe(false);
        });
    });

    describe("loadDashboardData", function () {
        function setupAuthenticatedManager(): DashboardManager {
            let main: HTMLElement = document.createElement("main");
            main.id = "main-content";
            document.body.appendChild(main);
            mockAuthGetState.mockReturnValue({
                "isAuthenticated": true,
                "user": {
                    "id": "u1",
                    "email": "a@b.com",
                    "name": "Test",
                    "role": "user",
                    "emailVerified": true,
                    "createdAt": "2026-01-01T00:00:00Z"
                },
                "accessToken": "tok",
                "refreshToken": "rtok"
            });
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            return manager;
        }

        it("renders stats and recent calculations on success", async function () {
            let manager: DashboardManager = setupAuthenticatedManager();
            let calc: CalculationRecord = {
                "ID": "1",
                "UserID": "u1",
                "CalculatorType": "molar-mass",
                "Inputs": "H2O",
                "Result": "18.015",
                "Annotation": "",
                "Starred": true,
                "WorkspaceID": "",
                "CreatedAt": new Date().toISOString()
            };
            mockGet.mockImplementation(function (path: string) {
                if (path === "/api/v1/calculations?limit=10") {
                    return Promise.resolve({
                        "calculations": [calc],
                        "page": 1,
                        "limit": 10
                    });
                }
                return Promise.reject(new Error("not found"));
            });
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
            let manager: DashboardManager = setupAuthenticatedManager();
            let calc: CalculationRecord = {
                "ID": "2",
                "UserID": "u1",
                "CalculatorType": "balancing",
                "Inputs": "H2+O2->H2O",
                "Result": "balanced",
                "Annotation": "",
                "Starred": true,
                "WorkspaceID": "",
                "CreatedAt": new Date().toISOString()
            };
            mockGet.mockImplementation(function (path: string) {
                if (path === "/api/v1/calculations?limit=10") {
                    return Promise.resolve({
                        "calculations": [calc],
                        "page": 1,
                        "limit": 10
                    });
                }
                return Promise.reject(new Error("not found"));
            });
            await manager.loadDashboardData();
            let favorites: HTMLElement | null = document.querySelector(".dashboard-favorites");
            expect(favorites).not.toBeNull();
            if (favorites) {
                expect(favorites.querySelectorAll(".dashboard-list-item").length).toBe(1);
            }
        });

        it("shows empty state in favorites when no starred calculations", async function () {
            let manager: DashboardManager = setupAuthenticatedManager();
            let calc: CalculationRecord = {
                "ID": "3",
                "UserID": "u1",
                "CalculatorType": "balancing",
                "Inputs": "H2+O2->H2O",
                "Result": "balanced",
                "Annotation": "",
                "Starred": false,
                "WorkspaceID": "",
                "CreatedAt": new Date().toISOString()
            };
            mockGet.mockImplementation(function (path: string) {
                if (path === "/api/v1/calculations?limit=10") {
                    return Promise.resolve({
                        "calculations": [calc],
                        "page": 1,
                        "limit": 10
                    });
                }
                return Promise.reject(new Error("not found"));
            });
            await manager.loadDashboardData();
            let favorites: HTMLElement | null = document.querySelector(".dashboard-favorites");
            expect(favorites).not.toBeNull();
            if (favorites) {
                expect(favorites.textContent).toContain("No favorite");
            }
        });

        it("renders weekly activity bar chart with seven bars", async function () {
            let manager: DashboardManager = setupAuthenticatedManager();
            mockGet.mockImplementation(function (path: string) {
                if (path === "/api/v1/calculations?limit=10") {
                    return Promise.resolve({
                        "calculations": [] as CalculationRecord[],
                        "page": 1,
                        "limit": 10
                    });
                }
                return Promise.reject(new Error("not found"));
            });
            await manager.loadDashboardData();
            let activity: HTMLElement | null = document.querySelector(".dashboard-activity");
            expect(activity).not.toBeNull();
            if (activity) {
                // Chart.js renders the seven daily bars onto a canvas element.
                // Verify the canvas was created and the chart did not fall back
                // to the error message.
                expect(activity.querySelectorAll("canvas#dashboard-activity-chart").length).toBe(1);
                expect(activity.querySelectorAll(".dashboard-empty").length).toBe(0);
            }
        });

        it("renders sign-in prompt on 401 error", async function () {
            let manager: DashboardManager = setupAuthenticatedManager();
            let apiError: ApiError = new ApiError(401, "about:blank", "Unauthorized");
            mockGet.mockRejectedValue(apiError);
            await manager.loadDashboardData();
            let prompt: HTMLElement | null = document.querySelector(".dashboard-signin-prompt");
            expect(prompt).not.toBeNull();
            if (prompt) {
                expect(prompt.style.display).toBe("block");
            }
        });

        it("shows error message on non-401 ApiError", async function () {
            let manager: DashboardManager = setupAuthenticatedManager();
            let apiError: ApiError = new ApiError(500, "about:blank", "Server error");
            mockGet.mockRejectedValue(apiError);
            await manager.loadDashboardData();
            let errorEl: HTMLElement | null = document.querySelector(".dashboard-error");
            expect(errorEl).not.toBeNull();
            if (errorEl) {
                expect(errorEl.style.display).toBe("block");
                expect(errorEl.textContent).toContain("Failed to load dashboard");
            }
        });

        it("shows error message on network error", async function () {
            let manager: DashboardManager = setupAuthenticatedManager();
            let plainError: Error = new Error("Network failure");
            mockGet.mockRejectedValue(plainError);
            await manager.loadDashboardData();
            let errorEl: HTMLElement | null = document.querySelector(".dashboard-error");
            expect(errorEl).not.toBeNull();
            if (errorEl) {
                expect(errorEl.style.display).toBe("block");
                expect(errorEl.textContent).toContain("Network failure");
            }
        });

        it("does not fetch when already loading", async function () {
            let manager: DashboardManager = setupAuthenticatedManager();
            let resolveFirst: Function = function () { return; };
            mockGet.mockImplementation(function (path: string) {
                if (path === "/api/v1/calculations?limit=10") {
                    return new Promise(function (resolve: Function) {
                        resolveFirst = resolve;
                    });
                }
                return Promise.reject(new Error("not found"));
            });
            let p1: Promise<void> = manager.loadDashboardData();
            let p2: Promise<void> = manager.loadDashboardData();
            resolveFirst({ "calculations": [] as CalculationRecord[], "page": 1, "limit": 10 });
            await p1;
            await p2;
            expect(mockGet).toHaveBeenCalledWith("/api/v1/calculations?limit=10");
            let calcCalls: number = mockGet.mock.calls.filter(function (call: unknown[]) {
                return call[0] === "/api/v1/calculations?limit=10";
            }).length;
            expect(calcCalls).toBe(1);
        });
    });

    describe("handleAuthStateChange", function () {
        it("renders sign-in prompt when not authenticated and visible", function () {
            let main: HTMLElement = document.createElement("main");
            main.id = "main-content";
            document.body.appendChild(main);
            let manager: DashboardManager = DashboardManager.getInstance();
            manager.init();
            manager.show();
            manager.handleAuthStateChange({
                "isAuthenticated": false,
                "user": null,
                "accessToken": null,
                "refreshToken": null
            });
            let prompt: HTMLElement | null = document.querySelector(".dashboard-signin-prompt");
            expect(prompt).not.toBeNull();
            if (prompt) {
                expect(prompt.style.display).toBe("block");
            }
        });
    });

    describe("render methods", function () {
        let manager: DashboardManager;

        beforeEach(function () {
            let main: HTMLElement = document.createElement("main");
            main.id = "main-content";
            document.body.appendChild(main);
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
            let calc: CalculationRecord = {
                "ID": "x1",
                "UserID": "u1",
                "CalculatorType": "molar-mass",
                "Inputs": "H2O",
                "Result": "18.015",
                "Annotation": "",
                "Starred": false,
                "WorkspaceID": "",
                "CreatedAt": "2026-07-17T12:00:00Z"
            };
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
                // Chart.js renders the seven daily bars onto a canvas element.
                // Verify the canvas was created and the chart did not fall back
                // to the error message.
                expect(activity.querySelectorAll("canvas#dashboard-activity-chart").length).toBe(1);
                expect(activity.querySelectorAll(".dashboard-empty").length).toBe(0);
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
            let calc: CalculationRecord = {
                "ID": "f1",
                "UserID": "u1",
                "CalculatorType": "balancing",
                "Inputs": "H2+O2->H2O",
                "Result": "balanced",
                "Annotation": "",
                "Starred": true,
                "WorkspaceID": "",
                "CreatedAt": "2026-07-17T12:00:00Z"
            };
            manager.renderFavorites([calc]);
            let favorites: HTMLElement | null = document.querySelector(".dashboard-favorites");
            expect(favorites).not.toBeNull();
            if (favorites) {
                expect(favorites.querySelectorAll(".dashboard-list-item").length).toBe(1);
            }
        });
    });
});
