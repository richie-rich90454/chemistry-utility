import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockPatch = vi.fn();
const mockPost = vi.fn();
const mockAuthSubscribe = vi.fn();
const mockAuthGetState = vi.fn();
const mockLoadDashboardData = vi.fn();

vi.mock("./apiClient.js", function () {
    return {
        ApiClient: {
            getInstance: function () {
                return { "patch": mockPatch, "post": mockPost };
            }
        }
    };
});

vi.mock("./authManager.js", function () {
    return {
        AuthManager: {
            getInstance: function () {
                return { "subscribe": mockAuthSubscribe, "getState": mockAuthGetState };
            }
        }
    };
});

vi.mock("./dashboardManager.js", function () {
    return {
        DashboardManager: {
            getInstance: function () {
                return { "loadDashboardData": mockLoadDashboardData };
            }
        }
    };
});

import { ResultAnnotationManager } from "./resultAnnotation.js";

function unauthenticatedState(): { isAuthenticated: boolean; user: unknown; accessToken: unknown; refreshToken: unknown } {
    return {
        "isAuthenticated": false,
        "user": null,
        "accessToken": null,
        "refreshToken": null
    };
}

function authenticatedState(): { isAuthenticated: boolean; user: unknown; accessToken: unknown; refreshToken: unknown } {
    return {
        "isAuthenticated": true,
        "user": { "id": "u1", "email": "a@b.c", "name": "A", "role": "user", "emailVerified": true, "createdAt": "2026-01-01T00:00:00Z" },
        "accessToken": "token",
        "refreshToken": "refresh"
    };
}

describe("ResultAnnotationManager", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        ResultAnnotationManager.resetInstance();
        mockPatch.mockReset();
        mockPost.mockReset();
        mockAuthSubscribe.mockReset();
        mockAuthGetState.mockReset();
        mockLoadDashboardData.mockReset();
        mockAuthSubscribe.mockReturnValue(function () { return; });
        mockAuthGetState.mockReturnValue(unauthenticatedState());
        mockPatch.mockResolvedValue(undefined);
        mockPost.mockResolvedValue({ "starred": true });
        mockLoadDashboardData.mockResolvedValue(undefined);
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        ResultAnnotationManager.resetInstance();
        vi.restoreAllMocks();
    });

    describe("getInstance", function () {
        it("should return same instance on subsequent calls", function () {
            let m1: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let m2: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            expect(m1).toBe(m2);
        });

        it("should return new instance after resetInstance", function () {
            let m1: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            ResultAnnotationManager.resetInstance();
            let m2: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            expect(m1).not.toBe(m2);
        });
    });

    describe("addAnnotationUI", function () {
        it("should add annotation input and star button below result", function () {
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-1");
            let ui: HTMLElement | null = result.querySelector(".annotation-ui");
            expect(ui).not.toBeNull();
            let input: HTMLElement | null = result.querySelector(".annotation-input");
            expect(input).not.toBeNull();
            let starBtn: HTMLElement | null = result.querySelector(".annotation-star-button");
            expect(starBtn).not.toBeNull();
            expect(manager.getTrackedCount()).toBe(1);
        });

        it("should not duplicate annotation UI for same element", function () {
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-1");
            manager.addAnnotationUI(result, "calc-1");
            let uis: NodeListOf<HTMLElement> = result.querySelectorAll(".annotation-ui");
            expect(uis.length).toBe(1);
            expect(manager.getTrackedCount()).toBe(1);
        });

        it("should store calculation id on the annotation container", function () {
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-42");
            let ui: HTMLElement = result.querySelector(".annotation-ui") as HTMLElement;
            expect(ui.getAttribute("data-calculation-id")).toBe("calc-42");
        });
    });

    describe("saveAnnotation", function () {
        it("should call PATCH /api/v1/calculations/:id with annotation body", async function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            await manager.saveAnnotation("calc-7", "my note");
            expect(mockPatch).toHaveBeenCalledTimes(1);
            expect(mockPatch).toHaveBeenCalledWith("/api/v1/calculations/calc-7", { "annotation": "my note" });
        });

        it("should trigger save on annotation input blur", async function () {
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-blur");
            let input: HTMLInputElement = result.querySelector(".annotation-input") as HTMLInputElement;
            input.value = "blur note";
            input.dispatchEvent(new Event("blur"));
            await vi.waitFor(function () {
                expect(mockPatch).toHaveBeenCalledWith("/api/v1/calculations/calc-blur", { "annotation": "blur note" });
            });
        });
    });

    describe("toggleStar", function () {
        it("should call POST /api/v1/calculations/:id/star", async function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let starred: boolean = await manager.toggleStar("calc-9");
            expect(mockPost).toHaveBeenCalledTimes(1);
            expect(mockPost).toHaveBeenCalledWith("/api/v1/calculations/calc-9/star", {});
            expect(starred).toBe(true);
        });

        it("should refresh dashboard favorites after toggling star", async function () {
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            await manager.toggleStar("calc-9");
            expect(mockLoadDashboardData).toHaveBeenCalledTimes(1);
        });

        it("should still return starred when dashboard refresh fails", async function () {
            mockLoadDashboardData.mockRejectedValue(new Error("dashboard down"));
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let starred: boolean = await manager.toggleStar("calc-9");
            expect(starred).toBe(true);
        });

        it("should update star button visual state on click", async function () {
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-click");
            let starBtn: HTMLButtonElement = result.querySelector(".annotation-star-button") as HTMLButtonElement;
            expect(starBtn.getAttribute("aria-pressed")).toBe("false");
            starBtn.dispatchEvent(new Event("click"));
            await vi.waitFor(function () {
                expect(mockPost).toHaveBeenCalledWith("/api/v1/calculations/calc-click/star", {});
            });
            await vi.waitFor(function () {
                expect(starBtn.getAttribute("aria-pressed")).toBe("true");
            });
        });
    });

    describe("auth state handling", function () {
        it("should hide annotation UI when not authenticated", function () {
            mockAuthGetState.mockReturnValue(unauthenticatedState());
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-1");
            let ui: HTMLElement = result.querySelector(".annotation-ui") as HTMLElement;
            expect(ui.style.display).toBe("none");
        });

        it("should show annotation UI when authenticated", function () {
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.addAnnotationUI(result, "calc-1");
            let ui: HTMLElement = result.querySelector(".annotation-ui") as HTMLElement;
            expect(ui.style.display).toBe("");
        });

        it("should toggle visibility when auth state changes via subscription", function () {
            let subscribedCallback: Function | null = null;
            mockAuthSubscribe.mockImplementation(function (cb: Function): Function {
                subscribedCallback = cb;
                return function () { return; };
            });
            mockAuthGetState.mockReturnValue(unauthenticatedState());
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            result.className = "result";
            result.setAttribute("data-calculation-id", "calc-sub");
            document.body.appendChild(result);
            manager.init();
            let ui: HTMLElement = result.querySelector(".annotation-ui") as HTMLElement;
            expect(ui.style.display).toBe("none");
            expect(subscribedCallback).not.toBeNull();
            if (!subscribedCallback) {
                throw new Error("subscribe callback was not registered");
            }
            let cb: Function = subscribedCallback;
            cb(authenticatedState());
            expect(ui.style.display).toBe("");
            cb(unauthenticatedState());
            expect(ui.style.display).toBe("none");
        });
    });

    describe("init", function () {
        it("should attach annotation UI to existing result elements with data-calculation-id", function () {
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            let r1: HTMLElement = document.createElement("div");
            r1.className = "result";
            r1.setAttribute("data-calculation-id", "calc-a");
            let r2: HTMLElement = document.createElement("div");
            r2.className = "result";
            r2.setAttribute("data-calculation-id", "calc-b");
            let r3: HTMLElement = document.createElement("div");
            r3.className = "result";
            document.body.appendChild(r1);
            document.body.appendChild(r2);
            document.body.appendChild(r3);
            manager.init();
            expect(manager.getTrackedCount()).toBe(2);
            expect(mockAuthSubscribe).toHaveBeenCalledTimes(1);
        });

        it("should be idempotent", function () {
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ResultAnnotationManager = ResultAnnotationManager.getInstance();
            manager.init();
            manager.init();
            expect(mockAuthSubscribe).toHaveBeenCalledTimes(1);
        });
    });
});
