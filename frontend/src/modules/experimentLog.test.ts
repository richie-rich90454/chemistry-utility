import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockAuthSubscribe = vi.fn();
const mockAuthGetState = vi.fn();

vi.mock("./apiClient.js", function () {
    return {
        ApiClient: {
            getInstance: function () {
                return {
                    "get": mockGet,
                    "post": mockPost,
                    "patch": mockPatch
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
                    "subscribe": mockAuthSubscribe,
                    "getState": mockAuthGetState
                };
            }
        }
    };
});

import { ExperimentLogManager, ExperimentLog, ExperimentStep } from "./experimentLog.js";

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
        "user": {
            "id": "u1",
            "email": "a@b.c",
            "name": "Test User",
            "role": "user",
            "emailVerified": true,
            "createdAt": "2026-01-01T00:00:00Z"
        },
        "accessToken": "token",
        "refreshToken": "refresh"
    };
}

function storedCalculation(id: string, calculatorType: string, inputs: string, annotation: string, createdAt: string): unknown {
    return {
        "ID": id,
        "UserID": "u1",
        "CalculatorType": calculatorType,
        "Inputs": inputs,
        "Result": "",
        "Annotation": annotation,
        "Starred": false,
        "WorkspaceID": "ws-1",
        "CreatedAt": createdAt
    };
}

describe("ExperimentLogManager", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        ExperimentLogManager.resetInstance();
        mockGet.mockReset();
        mockPost.mockReset();
        mockPatch.mockReset();
        mockAuthSubscribe.mockReset();
        mockAuthGetState.mockReset();
        mockAuthSubscribe.mockReturnValue(function () { return; });
        mockAuthGetState.mockReturnValue(unauthenticatedState());
        mockPatch.mockResolvedValue(undefined);
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        ExperimentLogManager.resetInstance();
        vi.restoreAllMocks();
    });

    function setupDOM(): void {
        let main: HTMLElement = document.createElement("main");
        main.id = "main-content";
        main.className = "app-view";
        document.body.appendChild(main);
    }

    describe("getInstance", function () {
        it("should return same instance on subsequent calls", function () {
            let m1: ExperimentLogManager = ExperimentLogManager.getInstance();
            let m2: ExperimentLogManager = ExperimentLogManager.getInstance();
            expect(m1).toBe(m2);
        });

        it("should return new instance after resetInstance", function () {
            let m1: ExperimentLogManager = ExperimentLogManager.getInstance();
            ExperimentLogManager.resetInstance();
            let m2: ExperimentLogManager = ExperimentLogManager.getInstance();
            expect(m1).not.toBe(m2);
        });
    });

    describe("init", function () {
        it("should create the experiment log view container", function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            let view: HTMLElement | null = document.getElementById("experiment-log-view");
            expect(view).not.toBeNull();
        });

        it("should subscribe to AuthManager", function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            expect(mockAuthSubscribe).toHaveBeenCalled();
        });

        it("should not re-initialize on second call", function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            manager.init();
            expect(mockAuthSubscribe).toHaveBeenCalledTimes(1);
        });

        it("should hide the view when not authenticated", function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(unauthenticatedState());
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            let view: HTMLElement = document.getElementById("experiment-log-view") as HTMLElement;
            expect(view.style.display).toBe("none");
        });
    });

    describe("createLog", function () {
        it("should POST /api/v1/calculations with experiment-log body", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            mockPost.mockResolvedValue(storedCalculation("log-1", "experiment-log", "My Log", "My Log", "2026-07-10T10:00:00Z"));
            let log: ExperimentLog = await manager.createLog("My Log", "ws-1");
            expect(mockPost).toHaveBeenCalledWith("/api/v1/calculations", {
                "calculatorType": "experiment-log",
                "inputs": "My Log",
                "annotation": "My Log",
                "workspaceId": "ws-1"
            });
            expect(log.id).toBe("log-1");
            expect(log.title).toBe("My Log");
            expect(log.workspaceId).toBe("ws-1");
            expect(manager.getLogs().length).toBe(1);
            expect(manager.getCurrentLogId()).toBe("log-1");
        });

        it("should render the log header and show the view", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            mockPost.mockResolvedValue(storedCalculation("log-1", "experiment-log", "My Log", "My Log", "2026-07-10T10:00:00Z"));
            await manager.createLog("My Log", "ws-1");
            expect(manager.isViewVisible()).toBe(true);
            let view: HTMLElement = document.getElementById("experiment-log-view") as HTMLElement;
            expect(view.textContent).toContain("My Log");
            expect(view.querySelector(".experiment-log-export-pdf-btn")).not.toBeNull();
        });
    });

    describe("addStep", function () {
        it("should POST /api/v1/calculations with experiment-step body", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            mockPost.mockResolvedValueOnce(storedCalculation("log-1", "experiment-log", "My Log", "My Log", "2026-07-10T10:00:00Z"));
            await manager.createLog("My Log", "ws-1");
            mockPost.mockResolvedValueOnce(storedCalculation("step-1", "experiment-step", "Step 1", "", "2026-07-10T10:05:00Z"));
            let step: ExperimentStep = await manager.addStep("log-1", { "title": "Step 1", "data": "Mixed reagents" });
            expect(mockPost).toHaveBeenCalledWith("/api/v1/calculations", {
                "calculatorType": "experiment-step",
                "inputs": "Step 1",
                "annotation": "",
                "workspaceId": "ws-1",
                "logId": "log-1",
                "data": "Mixed reagents"
            });
            expect(step.id).toBe("step-1");
            expect(step.logId).toBe("log-1");
            expect(step.title).toBe("Step 1");
            expect(manager.getSteps("log-1").length).toBe(1);
        });
    });

    describe("annotateStep", function () {
        it("should PATCH /api/v1/calculations/:id with annotation", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            mockPost.mockResolvedValueOnce(storedCalculation("log-1", "experiment-log", "My Log", "My Log", "2026-07-10T10:00:00Z"));
            await manager.createLog("My Log", "ws-1");
            mockPost.mockResolvedValueOnce(storedCalculation("step-1", "experiment-step", "Step 1", "", "2026-07-10T10:05:00Z"));
            await manager.addStep("log-1", { "title": "Step 1", "data": "Mixed reagents" });
            await manager.annotateStep("step-1", "Observation: color changed");
            expect(mockPatch).toHaveBeenCalledWith("/api/v1/calculations/step-1", { "annotation": "Observation: color changed" });
            let steps: ExperimentStep[] = manager.getSteps("log-1");
            expect(steps[0].annotation).toBe("Observation: color changed");
        });
    });

    describe("viewTimeline", function () {
        it("should return steps sorted by createdAt and render them", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            mockPost.mockResolvedValueOnce(storedCalculation("log-1", "experiment-log", "My Log", "My Log", "2026-07-10T10:00:00Z"));
            await manager.createLog("My Log", "ws-1");
            mockPost.mockResolvedValueOnce(storedCalculation("step-2", "experiment-step", "Second", "", "2026-07-10T11:00:00Z"));
            await manager.addStep("log-1", { "title": "Second", "data": "later" });
            mockPost.mockResolvedValueOnce(storedCalculation("step-1", "experiment-step", "First", "", "2026-07-10T10:05:00Z"));
            await manager.addStep("log-1", { "title": "First", "data": "earlier" });
            let timeline: ExperimentStep[] = manager.viewTimeline("log-1");
            expect(timeline.length).toBe(2);
            expect(timeline[0].id).toBe("step-1");
            expect(timeline[1].id).toBe("step-2");
            let view: HTMLElement = document.getElementById("experiment-log-view") as HTMLElement;
            expect(view.textContent).toContain("Timeline");
            expect(view.querySelectorAll(".experiment-log-step").length).toBe(2);
        });

        it("should render empty state when no steps", function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            manager.renderLog({ "id": "log-1", "title": "Empty Log", "workspaceId": "ws-1", "createdAt": "2026-07-10T10:00:00Z" });
            let timeline: ExperimentStep[] = manager.viewTimeline("log-1");
            expect(timeline.length).toBe(0);
            let view: HTMLElement = document.getElementById("experiment-log-view") as HTMLElement;
            expect(view.textContent).toContain("No steps recorded yet.");
        });
    });

    describe("renderLog", function () {
        it("should render title, meta, add-step button and export button", function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            manager.renderLog({ "id": "log-1", "title": "Synthesis", "workspaceId": "ws-1", "createdAt": "2026-07-10T10:00:00Z" });
            let view: HTMLElement = document.getElementById("experiment-log-view") as HTMLElement;
            expect(view.textContent).toContain("Synthesis");
            expect(view.querySelector(".experiment-log-add-step-btn")).not.toBeNull();
            expect(view.querySelector(".experiment-log-export-pdf-btn")).not.toBeNull();
        });
    });

    describe("renderTimeline", function () {
        it("should render each step with title, data and annotation input", function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            let steps: ExperimentStep[] = [
                {
                    "id": "s1",
                    "logId": "log-1",
                    "title": "Step One",
                    "data": "Added HCl",
                    "annotation": "Fizzed",
                    "createdAt": "2026-07-10T10:00:00Z"
                }
            ];
            manager.renderTimeline(steps);
            let view: HTMLElement = document.getElementById("experiment-log-view") as HTMLElement;
            expect(view.textContent).toContain("Step One");
            expect(view.textContent).toContain("Added HCl");
            expect(view.querySelectorAll(".experiment-log-step").length).toBe(1);
            expect(view.querySelectorAll(".experiment-log-step-annotate-input").length).toBe(1);
        });
    });

    describe("loadTimeline", function () {
        it("should GET /api/v1/calculations and filter steps for the log", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            mockPost.mockResolvedValueOnce(storedCalculation("log-1", "experiment-log", "My Log", "My Log", "2026-07-10T10:00:00Z"));
            await manager.createLog("My Log", "ws-1");
            mockGet.mockResolvedValue({
                "calculations": [
                    storedCalculation("step-1", "experiment-step", "Step 1", "logId:log-1data:Mixed", "2026-07-10T10:05:00Z"),
                    storedCalculation("step-2", "experiment-step", "Step 2", "logId:otherdata:Foo", "2026-07-10T10:10:00Z")
                ]
            });
            let steps: ExperimentStep[] = await manager.loadTimeline("log-1");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/calculations?calculatorType=experiment-step");
            expect(steps.length).toBe(1);
            expect(steps[0].id).toBe("step-1");
            expect(steps[0].data).toBe("Mixed");
        });
    });

    describe("auth state handling", function () {
        it("should hide the view when auth state changes to unauthenticated", function () {
            setupDOM();
            let subscribedCallback: Function | null = null;
            mockAuthSubscribe.mockImplementation(function (cb: Function): Function {
                subscribedCallback = cb;
                return function () { return; };
            });
            mockAuthGetState.mockReturnValue(authenticatedState());
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            manager.showView();
            expect(manager.isViewVisible()).toBe(true);
            expect(subscribedCallback).not.toBeNull();
            if (!subscribedCallback) {
                throw new Error("subscribe callback was not registered");
            }
            let cb: Function = subscribedCallback;
            cb(unauthenticatedState());
            expect(manager.isViewVisible()).toBe(false);
        });
    });
});
