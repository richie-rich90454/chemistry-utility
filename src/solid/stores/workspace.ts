import {createSignal} from "solid-js";
import {WorkspaceManager} from "../../modules/workspaceManager.js";
import type {Workspace, WorkspaceMember, SharedCalculation} from "../../modules/workspaceManager.js";
interface WorkspaceStore {
    workspaces: () => Workspace[];
    currentWorkspace: () => Workspace | null;
    currentMembers: () => WorkspaceMember[];
    currentCalculations: () => SharedCalculation[];
    loading: () => boolean;
    error: () => string;
    refresh: () => Promise<void>;
    createWorkspace: (name: string, description: string) => Promise<void>;
    selectWorkspace: (id: string) => Promise<void>;
    updateWorkspace: (id: string, name: string, description: string) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;
    addMember: (workspaceId: string, userId: string, role: string) => Promise<void>;
    removeMember: (workspaceId: string, userId: string) => Promise<void>;
}
let [workspaces, setWorkspaces] = createSignal<Workspace[]>([]);
let [currentWorkspace, setCurrentWorkspace] = createSignal<Workspace | null>(null);
let [currentMembers, setCurrentMembers] = createSignal<WorkspaceMember[]>([]);
let [currentCalculations, setCurrentCalculations] = createSignal<SharedCalculation[]>([]);
let [loading, setLoading] = createSignal(false);
let [error, setError] = createSignal("");
async function refresh(): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = WorkspaceManager.getInstance();
        let result: Workspace[] = await manager.loadWorkspaces();
        setWorkspaces(result);
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to load workspaces: " + message);
    }
    finally {
        setLoading(false);
    }
}
async function createWorkspace(name: string, description: string): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = WorkspaceManager.getInstance();
        await manager.createWorkspace(name, description);
        let result: Workspace[] = await manager.loadWorkspaces();
        setWorkspaces(result);
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to create workspace: " + message);
    }
    finally {
        setLoading(false);
    }
}
async function selectWorkspace(id: string): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = WorkspaceManager.getInstance();
        let ws: Workspace = await manager.selectWorkspace(id);
        setCurrentWorkspace(ws);
        setCurrentMembers(manager.getCurrentMembers());
        setCurrentCalculations(manager.getCurrentCalculations());
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to select workspace: " + message);
    }
    finally {
        setLoading(false);
    }
}
async function updateWorkspace(id: string, name: string, description: string): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = WorkspaceManager.getInstance();
        let ws: Workspace = await manager.updateWorkspace(id, name, description);
        setCurrentWorkspace(ws);
        let result: Workspace[] = await manager.loadWorkspaces();
        setWorkspaces(result);
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to update workspace: " + message);
    }
    finally {
        setLoading(false);
    }
}
async function deleteWorkspace(id: string): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = WorkspaceManager.getInstance();
        await manager.deleteWorkspace(id);
        let result: Workspace[] = await manager.loadWorkspaces();
        setWorkspaces(result);
        if (manager.getCurrentWorkspace() === null) {
            setCurrentWorkspace(null);
            setCurrentMembers([]);
            setCurrentCalculations([]);
        }
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to delete workspace: " + message);
    }
    finally {
        setLoading(false);
    }
}
async function addMember(workspaceId: string, userId: string, role: string): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = WorkspaceManager.getInstance();
        await manager.addMember(workspaceId, userId, role);
        setCurrentMembers(manager.getCurrentMembers());
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to add member: " + message);
    }
    finally {
        setLoading(false);
    }
}
async function removeMember(workspaceId: string, userId: string): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = WorkspaceManager.getInstance();
        await manager.removeMember(workspaceId, userId);
        setCurrentMembers(manager.getCurrentMembers());
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to remove member: " + message);
    }
    finally {
        setLoading(false);
    }
}
function useWorkspace(): WorkspaceStore {
    return {
        workspaces: workspaces,
        currentWorkspace: currentWorkspace,
        currentMembers: currentMembers,
        currentCalculations: currentCalculations,
        loading: loading,
        error: error,
        refresh: refresh,
        createWorkspace: createWorkspace,
        selectWorkspace: selectWorkspace,
        updateWorkspace: updateWorkspace,
        deleteWorkspace: deleteWorkspace,
        addMember: addMember,
        removeMember: removeMember
    };
}
export {useWorkspace};
