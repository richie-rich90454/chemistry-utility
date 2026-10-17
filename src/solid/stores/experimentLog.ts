import {createSignal} from "solid-js";
import {ExperimentLogManager} from "../../modules/experimentLog.js";
import type {ExperimentLog, ExperimentStep, ExperimentStepData} from "../../modules/experimentLog.js";
interface ExperimentLogStore {
    logs: () => ExperimentLog[];
    currentLogId: () => string | null;
    currentSteps: () => ExperimentStep[];
    loading: () => boolean;
    error: () => string;
    refresh: () => Promise<void>;
    createLog: (title: string, workspaceId: string) => Promise<void>;
    addStep: (logId: string, stepData: ExperimentStepData) => Promise<void>;
    annotateStep: (stepId: string, annotation: string) => Promise<void>;
    viewTimeline: (logId: string) => Promise<void>;
    deleteLog: (logId: string) => Promise<void>;
}
let [logs, setLogs] = createSignal<ExperimentLog[]>([]);
let [currentLogId, setCurrentLogId] = createSignal<string | null>(null);
let [currentSteps, setCurrentSteps] = createSignal<ExperimentStep[]>([]);
let [loading, setLoading] = createSignal(false);
let [error, setError] = createSignal("");
async function refresh(): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = ExperimentLogManager.getInstance();
        let result: ExperimentLog[] = await manager.loadLogs();
        setLogs(result);
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to load experiment logs: " + message);
    }
    finally {
        setLoading(false);
    }
}
async function createLog(title: string, workspaceId: string): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = ExperimentLogManager.getInstance();
        await manager.createLog(title, workspaceId);
        let result: ExperimentLog[] = await manager.loadLogs();
        setLogs(result);
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to create experiment log: " + message);
    }
    finally {
        setLoading(false);
    }
}
async function addStep(logId: string, stepData: ExperimentStepData): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = ExperimentLogManager.getInstance();
        await manager.addStep(logId, stepData);
        if (manager.getCurrentLogId() === logId) {
            setCurrentSteps(manager.getSteps(logId));
        }
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to add step: " + message);
    }
    finally {
        setLoading(false);
    }
}
async function annotateStep(stepId: string, annotation: string): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = ExperimentLogManager.getInstance();
        await manager.annotateStep(stepId, annotation);
        let activeId: string | null = manager.getCurrentLogId();
        if (activeId !== null) {
            setCurrentSteps(manager.getSteps(activeId));
        }
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to annotate step: " + message);
    }
    finally {
        setLoading(false);
    }
}
async function viewTimeline(logId: string): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = ExperimentLogManager.getInstance();
        let steps: ExperimentStep[] = manager.viewTimeline(logId);
        setCurrentLogId(manager.getCurrentLogId());
        setCurrentSteps(steps);
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to view timeline: " + message);
    }
    finally {
        setLoading(false);
    }
}
async function deleteLog(logId: string): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = ExperimentLogManager.getInstance();
        manager.deleteLog(logId);
        let result: ExperimentLog[] = await manager.loadLogs();
        setLogs(result);
        if (manager.getCurrentLogId() === null) {
            setCurrentLogId(null);
            setCurrentSteps([]);
        }
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to delete experiment log: " + message);
    }
    finally {
        setLoading(false);
    }
}
function useExperimentLog(): ExperimentLogStore {
    return {
        logs: logs,
        currentLogId: currentLogId,
        currentSteps: currentSteps,
        loading: loading,
        error: error,
        refresh: refresh,
        createLog: createLog,
        addStep: addStep,
        annotateStep: annotateStep,
        viewTimeline: viewTimeline,
        deleteLog: deleteLog
    };
}
export {useExperimentLog};
