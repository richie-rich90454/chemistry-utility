import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { ExperimentLogManager, ExperimentLog, ExperimentStep } from "./experimentLog.js";

describe("ExperimentLogManager", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        ExperimentLogManager.resetInstance();
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        ExperimentLogManager.resetInstance();
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

        it("should not re-initialize on second call", function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            manager.init();
            let view: HTMLElement | null = document.getElementById("experiment-log-view");
            expect(view).not.toBeNull();
        });

        it("should load persisted logs from localStorage", function () {
            setupDOM();
            let stored: ExperimentLog[] = [
                { "id": "log-existing", "title": "Existing Log", "workspaceId": "ws-1", "createdAt": "2026-07-10T10:00:00Z" }
            ];
            localStorage.setItem("chemutil_experiment_logs", JSON.stringify(stored));
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            expect(manager.getLogs().length).toBe(1);
            expect(manager.getLogs()[0].id).toBe("log-existing");
        });

        it("should load persisted steps from localStorage", function () {
            setupDOM();
            let storedLogs: ExperimentLog[] = [
                { "id": "log-1", "title": "Log One", "workspaceId": "ws-1", "createdAt": "2026-07-10T10:00:00Z" }
            ];
            let storedSteps: ExperimentStep[] = [
                { "id": "step-1", "logId": "log-1", "title": "Step One", "data": "first", "annotation": "", "createdAt": "2026-07-10T10:05:00Z" }
            ];
            localStorage.setItem("chemutil_experiment_logs", JSON.stringify(storedLogs));
            localStorage.setItem("chemutil_experiment_steps_log-1", JSON.stringify(storedSteps));
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            expect(manager.getSteps("log-1").length).toBe(1);
            expect(manager.getSteps("log-1")[0].id).toBe("step-1");
        });
    });

    describe("createLog", function () {
        it("should create a log with generated id and persist to localStorage", async function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            let log: ExperimentLog = await manager.createLog("My Log", "ws-1");
            expect(log.title).toBe("My Log");
            expect(log.workspaceId).toBe("ws-1");
            expect(typeof log.id).toBe("string");
            expect(log.id.length).toBeGreaterThan(0);
            expect(manager.getLogs().length).toBe(1);
            expect(manager.getCurrentLogId()).toBe(log.id);
            let raw: string | null = localStorage.getItem("chemutil_experiment_logs");
            expect(raw).not.toBeNull();
            if (raw) {
                let parsed: ExperimentLog[] = JSON.parse(raw) as ExperimentLog[];
                expect(parsed.length).toBe(1);
                expect(parsed[0].title).toBe("My Log");
            }
        });

        it("should render the log header and show the view", async function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            await manager.createLog("My Log", "ws-1");
            expect(manager.isViewVisible()).toBe(true);
            let view: HTMLElement = document.getElementById("experiment-log-view") as HTMLElement;
            expect(view.textContent).toContain("My Log");
            expect(view.querySelector(".experiment-log-export-pdf-btn")).not.toBeNull();
        });
    });

    describe("addStep", function () {
        it("should add a step to the log and persist to localStorage", async function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            let log: ExperimentLog = await manager.createLog("My Log", "ws-1");
            let step: ExperimentStep = await manager.addStep(log.id, { "title": "Step 1", "data": "Mixed reagents" });
            expect(step.logId).toBe(log.id);
            expect(step.title).toBe("Step 1");
            expect(step.data).toBe("Mixed reagents");
            expect(manager.getSteps(log.id).length).toBe(1);
            let raw: string | null = localStorage.getItem("chemutil_experiment_steps_" + log.id);
            expect(raw).not.toBeNull();
            if (raw) {
                let parsed: ExperimentStep[] = JSON.parse(raw) as ExperimentStep[];
                expect(parsed.length).toBe(1);
                expect(parsed[0].title).toBe("Step 1");
            }
        });
    });

    describe("annotateStep", function () {
        it("should update step annotation in memory and localStorage", async function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            let log: ExperimentLog = await manager.createLog("My Log", "ws-1");
            let step: ExperimentStep = await manager.addStep(log.id, { "title": "Step 1", "data": "Mixed reagents" });
            await manager.annotateStep(step.id, "Observation: color changed");
            let steps: ExperimentStep[] = manager.getSteps(log.id);
            expect(steps[0].annotation).toBe("Observation: color changed");
            let raw: string | null = localStorage.getItem("chemutil_experiment_steps_" + log.id);
            expect(raw).not.toBeNull();
            if (raw) {
                let parsed: ExperimentStep[] = JSON.parse(raw) as ExperimentStep[];
                expect(parsed[0].annotation).toBe("Observation: color changed");
            }
        });

        it("should be a no-op when step id is unknown", async function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            await manager.annotateStep("nonexistent", "note");
            // Should not throw and should not write anything
            expect(localStorage.getItem("chemutil_experiment_steps_nonexistent")).toBeNull();
        });
    });

    describe("viewTimeline", function () {
        it("should return steps sorted by createdAt and render them", async function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            let log: ExperimentLog = await manager.createLog("My Log", "ws-1");
            let later: ExperimentStep = await manager.addStep(log.id, { "title": "Second", "data": "later" });
            // Force createdAt ordering by overriding the timestamps in storage
            let earlier: ExperimentStep = await manager.addStep(log.id, { "title": "First", "data": "earlier" });
            let steps: ExperimentStep[] = manager.getSteps(log.id);
            steps[0].createdAt = "2026-07-10T11:00:00Z";
            steps[1].createdAt = "2026-07-10T10:05:00Z";
            manager.viewTimeline(log.id);
            let timeline: ExperimentStep[] = manager.viewTimeline(log.id);
            expect(timeline.length).toBe(2);
            expect(timeline[0].id).toBe(earlier.id);
            expect(timeline[1].id).toBe(later.id);
            let view: HTMLElement = document.getElementById("experiment-log-view") as HTMLElement;
            expect(view.textContent).toContain("Timeline");
            expect(view.querySelectorAll(".experiment-log-step").length).toBe(2);
        });

        it("should render empty state when no steps", function () {
            setupDOM();
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
        it("should read steps from localStorage and render them", async function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            let storedSteps: ExperimentStep[] = [
                { "id": "step-1", "logId": "log-1", "title": "Step 1", "data": "Mixed", "annotation": "", "createdAt": "2026-07-10T10:05:00Z" }
            ];
            localStorage.setItem("chemutil_experiment_steps_log-1", JSON.stringify(storedSteps));
            let steps: ExperimentStep[] = await manager.loadTimeline("log-1");
            expect(steps.length).toBe(1);
            expect(steps[0].id).toBe("step-1");
            expect(steps[0].data).toBe("Mixed");
        });

        it("should return empty array when no steps stored", async function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            let steps: ExperimentStep[] = await manager.loadTimeline("log-none");
            expect(steps.length).toBe(0);
        });
    });

    describe("deleteLog", function () {
        it("should remove log and its steps from memory and localStorage", async function () {
            setupDOM();
            let manager: ExperimentLogManager = ExperimentLogManager.getInstance();
            manager.init();
            let log: ExperimentLog = await manager.createLog("To Delete", "ws-1");
            await manager.addStep(log.id, { "title": "Step 1", "data": "data" });
            expect(manager.getLogs().length).toBe(1);
            expect(manager.getSteps(log.id).length).toBe(1);
            manager.deleteLog(log.id);
            expect(manager.getLogs().length).toBe(0);
            expect(manager.getSteps(log.id).length).toBe(0);
            expect(localStorage.getItem("chemutil_experiment_steps_" + log.id)).toBeNull();
            let raw: string | null = localStorage.getItem("chemutil_experiment_logs");
            expect(raw).not.toBeNull();
            if (raw) {
                let parsed: ExperimentLog[] = JSON.parse(raw) as ExperimentLog[];
                expect(parsed.length).toBe(0);
            }
        });
    });
});
