import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {ExperimentLogManager} from "../../modules/experimentLog.js";
import type {ExperimentLog, ExperimentStep} from "../../modules/experimentLog.js";
import {useExperimentLog} from "./experimentLog";
function makeLog(id: string, title: string, workspaceId: string): ExperimentLog {
    return {
        "id": id,
        "title": title,
        "workspaceId": workspaceId,
        "createdAt": "2026-07-10T10:00:00Z"
    };
}
function makeStep(id: string, logId: string, title: string, data: string): ExperimentStep {
    return {
        "id": id,
        "logId": logId,
        "title": title,
        "data": data,
        "annotation": "",
        "createdAt": "2026-07-10T10:05:00Z"
    };
}
function seedLogs(logs: ExperimentLog[]): void {
    localStorage.setItem("chemutil_experiment_logs", JSON.stringify(logs));
}
function seedSteps(logId: string, steps: ExperimentStep[]): void {
    localStorage.setItem("chemutil_experiment_steps_" + logId, JSON.stringify(steps));
}
describe("useExperimentLog", function (): void {
    beforeEach(function (): void {
        ExperimentLogManager.resetInstance();
        localStorage.clear();
    });
    afterEach(function (): void {
        ExperimentLogManager.resetInstance();
        localStorage.clear();
        vi.restoreAllMocks();
    });
    it("refresh loads logs from localStorage via the manager", async function (): Promise<void> {
        seedLogs([makeLog("log-a", "Log A", "ws-1"), makeLog("log-b", "Log B", "ws-1")]);
        let store = useExperimentLog();
        await store.refresh();
        expect(store.logs().length).toBe(2);
        expect(store.logs()[0].id).toBe("log-a");
        expect(store.logs()[1].title).toBe("Log B");
    });
    it("refresh sets loading false and clears error on success", async function (): Promise<void> {
        let store = useExperimentLog();
        await store.refresh();
        expect(store.loading()).toBe(false);
        expect(store.error()).toBe("");
    });
    it("refresh returns empty list when no logs stored", async function (): Promise<void> {
        let store = useExperimentLog();
        await store.refresh();
        expect(store.logs().length).toBe(0);
    });
    it("refresh sets error when manager loadLogs throws", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "loadLogs").mockRejectedValue(new Error("storage offline"));
        let store = useExperimentLog();
        await store.refresh();
        expect(store.error()).toBe("Failed to load experiment logs: storage offline");
        expect(store.loading()).toBe(false);
    });
    it("createLog persists via manager and refreshes the list", async function (): Promise<void> {
        seedLogs([makeLog("log-1", "Existing", "ws-1")]);
        let store = useExperimentLog();
        await store.refresh();
        expect(store.logs().length).toBe(1);
        await store.createLog("New Log", "ws-1");
        expect(store.logs().length).toBe(2);
        let titles: string[] = store.logs().map(function (log: ExperimentLog): string {return log.title;});
        expect(titles).toContain("New Log");
    });
    it("createLog sets error when manager throws", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "createLog").mockRejectedValue(new Error("disk full"));
        let store = useExperimentLog();
        await store.createLog("Boom", "ws-1");
        expect(store.error()).toBe("Failed to create experiment log: disk full");
        expect(store.loading()).toBe(false);
    });
    it("viewTimeline sets currentLogId and currentSteps sorted by createdAt", async function (): Promise<void> {
        seedLogs([makeLog("log-1", "Log One", "ws-1")]);
        seedSteps("log-1", [
            {"id": "s2", "logId": "log-1", "title": "Second", "data": "later", "annotation": "", "createdAt": "2026-07-10T11:00:00Z"},
            {"id": "s1", "logId": "log-1", "title": "First", "data": "earlier", "annotation": "", "createdAt": "2026-07-10T10:00:00Z"}
        ]);
        let store = useExperimentLog();
        await store.refresh();
        await store.viewTimeline("log-1");
        expect(store.currentLogId()).toBe("log-1");
        expect(store.currentSteps().length).toBe(2);
        expect(store.currentSteps()[0].id).toBe("s1");
        expect(store.currentSteps()[1].id).toBe("s2");
    });
    it("viewTimeline sets error when manager throws", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "viewTimeline").mockImplementation(function (): ExperimentStep[] {
            throw new Error("view failed");
        });
        let store = useExperimentLog();
        await store.viewTimeline("log-1");
        expect(store.error()).toBe("Failed to view timeline: view failed");
        expect(store.loading()).toBe(false);
    });
    it("addStep updates currentSteps when adding to the active log", async function (): Promise<void> {
        seedLogs([makeLog("log-1", "Log One", "ws-1")]);
        let store = useExperimentLog();
        await store.refresh();
        await store.viewTimeline("log-1");
        expect(store.currentSteps().length).toBe(0);
        await store.addStep("log-1", {"title": "Step 1", "data": "Mixed reagents"});
        expect(store.currentSteps().length).toBe(1);
        expect(store.currentSteps()[0].title).toBe("Step 1");
    });
    it("addStep does not update currentSteps when adding to a non-active log", async function (): Promise<void> {
        seedLogs([makeLog("log-1", "Log One", "ws-1"), makeLog("log-2", "Log Two", "ws-1")]);
        let store = useExperimentLog();
        await store.refresh();
        await store.viewTimeline("log-1");
        await store.addStep("log-2", {"title": "Other Log Step", "data": "data"});
        expect(store.currentSteps().length).toBe(0);
    });
    it("annotateStep refreshes currentSteps from the active log", async function (): Promise<void> {
        seedLogs([makeLog("log-1", "Log One", "ws-1")]);
        seedSteps("log-1", [makeStep("s1", "log-1", "Step One", "data")]);
        let store = useExperimentLog();
        await store.refresh();
        await store.viewTimeline("log-1");
        expect(store.currentSteps()[0].annotation).toBe("");
        await store.annotateStep("s1", "Color changed to blue");
        expect(store.currentSteps()[0].annotation).toBe("Color changed to blue");
    });
    it("deleteLog removes from list and clears current when deleting active log", async function (): Promise<void> {
        seedLogs([makeLog("log-1", "ToDelete", "ws-1"), makeLog("log-2", "Keep", "ws-1")]);
        let store = useExperimentLog();
        await store.refresh();
        await store.viewTimeline("log-1");
        await store.deleteLog("log-1");
        expect(store.logs().length).toBe(1);
        expect(store.logs()[0].id).toBe("log-2");
        expect(store.currentLogId()).toBeNull();
        expect(store.currentSteps()).toEqual([]);
    });
    it("actions are no-ops while another action is loading", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        let resolveFirst: () => void = function (): void {return;};
        let firstCall = new Promise<void>(function (resolve: () => void): void {resolveFirst = resolve;});
        let loadSpy = vi.spyOn(manager, "loadLogs").mockImplementation(function (): Promise<ExperimentLog[]> {
            return firstCall.then(function (): ExperimentLog[] {return [];});
        });
        let store = useExperimentLog();
        let firstRefresh = store.refresh();
        let secondRefresh = store.refresh();
        expect(loadSpy).toHaveBeenCalledTimes(1);
        resolveFirst();
        await firstRefresh;
        await secondRefresh;
        expect(loadSpy).toHaveBeenCalledTimes(1);
    });
    it("all actions are no-ops while loading", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        let resolveFirst: () => void = function (): void {return;};
        let firstCall = new Promise<void>(function (resolve: () => void): void {resolveFirst = resolve;});
        let loadSpy = vi.spyOn(manager, "loadLogs").mockImplementation(function (): Promise<ExperimentLog[]> {
            return firstCall.then(function (): ExperimentLog[] {return [];});
        });
        let createSpy = vi.spyOn(manager, "createLog");
        let addSpy = vi.spyOn(manager, "addStep");
        let annotateSpy = vi.spyOn(manager, "annotateStep");
        let viewSpy = vi.spyOn(manager, "viewTimeline");
        let deleteSpy = vi.spyOn(manager, "deleteLog");
        let store = useExperimentLog();
        let firstRefresh = store.refresh();
        await store.createLog("x", "ws-1");
        await store.addStep("log-1", {"title": "t", "data": "d"});
        await store.annotateStep("s1", "note");
        await store.viewTimeline("log-1");
        await store.deleteLog("log-1");
        expect(loadSpy).toHaveBeenCalledTimes(1);
        expect(createSpy).not.toHaveBeenCalled();
        expect(addSpy).not.toHaveBeenCalled();
        expect(annotateSpy).not.toHaveBeenCalled();
        expect(viewSpy).not.toHaveBeenCalled();
        expect(deleteSpy).not.toHaveBeenCalled();
        resolveFirst();
        await firstRefresh;
    });
    it("refresh sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "loadLogs").mockRejectedValue("boom");
        let store = useExperimentLog();
        await store.refresh();
        expect(store.error()).toBe("Failed to load experiment logs: Unknown error");
    });
    it("createLog sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "createLog").mockRejectedValue(42);
        let store = useExperimentLog();
        await store.createLog("x", "ws-1");
        expect(store.error()).toBe("Failed to create experiment log: Unknown error");
    });
    it("addStep sets error when manager throws", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "addStep").mockRejectedValue(new Error("add failed"));
        let store = useExperimentLog();
        await store.addStep("log-1", {"title": "t", "data": "d"});
        expect(store.error()).toBe("Failed to add step: add failed");
    });
    it("addStep sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "addStep").mockRejectedValue("bad");
        let store = useExperimentLog();
        await store.addStep("log-1", {"title": "t", "data": "d"});
        expect(store.error()).toBe("Failed to add step: Unknown error");
    });
    it("annotateStep does not update currentSteps when no log is active", async function (): Promise<void> {
        seedLogs([makeLog("log-1", "Log One", "ws-1")]);
        seedSteps("log-1", [makeStep("s1", "log-1", "Step One", "data")]);
        let store = useExperimentLog();
        await store.refresh();
        expect(store.currentSteps().length).toBe(0);
        await store.annotateStep("s1", "note without active timeline");
        expect(store.error()).toBe("");
        expect(store.currentSteps().length).toBe(0);
    });
    it("annotateStep sets error when manager throws", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "annotateStep").mockRejectedValue(new Error("annotate failed"));
        let store = useExperimentLog();
        await store.annotateStep("s1", "note");
        expect(store.error()).toBe("Failed to annotate step: annotate failed");
    });
    it("annotateStep sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "annotateStep").mockRejectedValue("bad");
        let store = useExperimentLog();
        await store.annotateStep("s1", "note");
        expect(store.error()).toBe("Failed to annotate step: Unknown error");
    });
    it("viewTimeline sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "viewTimeline").mockImplementation(function (): ExperimentStep[] {
            throw "bad";
        });
        let store = useExperimentLog();
        await store.viewTimeline("log-1");
        expect(store.error()).toBe("Failed to view timeline: Unknown error");
    });
    it("deleteLog sets error when manager throws", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "deleteLog").mockImplementation(function (): void {
            throw new Error("delete failed");
        });
        let store = useExperimentLog();
        await store.deleteLog("log-1");
        expect(store.error()).toBe("Failed to delete experiment log: delete failed");
    });
    it("deleteLog sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = ExperimentLogManager.getInstance();
        vi.spyOn(manager, "deleteLog").mockImplementation(function (): void {
            throw "bad";
        });
        let store = useExperimentLog();
        await store.deleteLog("log-1");
        expect(store.error()).toBe("Failed to delete experiment log: Unknown error");
    });
    it("deleteLog keeps current when deleting a non-active log", async function (): Promise<void> {
        seedLogs([makeLog("log-1", "One", "ws-1"), makeLog("log-2", "Two", "ws-1")]);
        let store = useExperimentLog();
        await store.refresh();
        await store.viewTimeline("log-1");
        await store.deleteLog("log-2");
        expect(store.logs().length).toBe(1);
        expect(store.currentLogId()).toBe("log-1");
    });
});
