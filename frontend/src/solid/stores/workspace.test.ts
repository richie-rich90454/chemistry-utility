import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {WorkspaceManager} from "../../modules/workspaceManager.js";
import type {Workspace} from "../../modules/workspaceManager.js";
import {useWorkspace} from "./workspace";
function makeWorkspace(id: string, name: string, memberCount: number): Workspace {
    return {
        "id": id,
        "name": name,
        "description": "Description for " + id,
        "ownerId": "local-user",
        "memberCount": memberCount,
        "createdAt": "2026-07-01T00:00:00Z",
        "updatedAt": "2026-07-02T00:00:00Z"
    };
}
function seedWorkspaces(workspaces: Workspace[]): void {
    localStorage.setItem("chemutil_workspaces", JSON.stringify(workspaces));
}
describe("useWorkspace", function (): void {
    beforeEach(function (): void {
        WorkspaceManager.resetInstance();
        localStorage.clear();
    });
    afterEach(function (): void {
        WorkspaceManager.resetInstance();
        localStorage.clear();
        vi.restoreAllMocks();
    });
    it("refresh loads workspaces from localStorage via the manager", async function (): Promise<void> {
        seedWorkspaces([makeWorkspace("ws-1", "Lab A", 2), makeWorkspace("ws-2", "Lab B", 5)]);
        let store = useWorkspace();
        await store.refresh();
        expect(store.workspaces().length).toBe(2);
        expect(store.workspaces()[0].id).toBe("ws-1");
        expect(store.workspaces()[1].name).toBe("Lab B");
    });
    it("refresh sets loading false and clears error on success", async function (): Promise<void> {
        let store = useWorkspace();
        await store.refresh();
        expect(store.loading()).toBe(false);
        expect(store.error()).toBe("");
    });
    it("refresh returns empty list when no workspaces stored", async function (): Promise<void> {
        let store = useWorkspace();
        await store.refresh();
        expect(store.workspaces().length).toBe(0);
    });
    it("refresh sets error when manager loadWorkspaces throws", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "loadWorkspaces").mockRejectedValue(new Error("storage offline"));
        let store = useWorkspace();
        await store.refresh();
        expect(store.error()).toBe("Failed to load workspaces: storage offline");
        expect(store.loading()).toBe(false);
    });
    it("createWorkspace persists via manager and refreshes the list", async function (): Promise<void> {
        seedWorkspaces([makeWorkspace("ws-1", "Existing", 1)]);
        let store = useWorkspace();
        await store.refresh();
        expect(store.workspaces().length).toBe(1);
        await store.createWorkspace("New Lab", "desc");
        expect(store.workspaces().length).toBe(2);
        let names: string[] = store.workspaces().map(function (ws: Workspace): string {return ws.name;});
        expect(names).toContain("New Lab");
    });
    it("createWorkspace sets error when manager throws", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "createWorkspace").mockRejectedValue(new Error("disk full"));
        let store = useWorkspace();
        await store.createWorkspace("Boom", "desc");
        expect(store.error()).toBe("Failed to create workspace: disk full");
        expect(store.loading()).toBe(false);
    });
    it("selectWorkspace sets currentWorkspace, members, and calculations", async function (): Promise<void> {
        seedWorkspaces([makeWorkspace("ws-1", "Lab A", 2)]);
        let store = useWorkspace();
        await store.refresh();
        await store.selectWorkspace("ws-1");
        expect(store.currentWorkspace() !== null).toBe(true);
        expect(store.currentWorkspace() && store.currentWorkspace()!.id).toBe("ws-1");
        expect(store.currentMembers()).toEqual([]);
        expect(store.currentCalculations()).toEqual([]);
    });
    it("selectWorkspace sets error when workspace not found", async function (): Promise<void> {
        let store = useWorkspace();
        await store.selectWorkspace("missing");
        expect(store.error()).toBe("Failed to select workspace: Workspace not found: missing");
        expect(store.loading()).toBe(false);
    });
    it("updateWorkspace refreshes the list and currentWorkspace", async function (): Promise<void> {
        seedWorkspaces([makeWorkspace("ws-1", "Old Name", 2)]);
        let store = useWorkspace();
        await store.refresh();
        await store.selectWorkspace("ws-1");
        await store.updateWorkspace("ws-1", "New Name", "new desc");
        expect(store.currentWorkspace() && store.currentWorkspace()!.name).toBe("New Name");
        expect(store.workspaces()[0].name).toBe("New Name");
    });
    it("deleteWorkspace removes from list and clears current when deleting selected", async function (): Promise<void> {
        seedWorkspaces([makeWorkspace("ws-1", "ToDelete", 1), makeWorkspace("ws-2", "Keep", 1)]);
        let store = useWorkspace();
        await store.refresh();
        await store.selectWorkspace("ws-1");
        await store.deleteWorkspace("ws-1");
        expect(store.workspaces().length).toBe(1);
        expect(store.workspaces()[0].id).toBe("ws-2");
        expect(store.currentWorkspace()).toBeNull();
        expect(store.currentMembers()).toEqual([]);
        expect(store.currentCalculations()).toEqual([]);
    });
    it("addMember updates currentMembers signal", async function (): Promise<void> {
        seedWorkspaces([makeWorkspace("ws-1", "Lab A", 1)]);
        let store = useWorkspace();
        await store.refresh();
        await store.selectWorkspace("ws-1");
        await store.addMember("ws-1", "alice@example.com", "member");
        expect(store.currentMembers().length).toBe(1);
        expect(store.currentMembers()[0].userId).toBe("alice@example.com");
    });
    it("removeMember updates currentMembers signal", async function (): Promise<void> {
        seedWorkspaces([makeWorkspace("ws-1", "Lab A", 2)]);
        let store = useWorkspace();
        await store.refresh();
        await store.selectWorkspace("ws-1");
        await store.addMember("ws-1", "bob@example.com", "member");
        await store.removeMember("ws-1", "bob@example.com");
        expect(store.currentMembers().length).toBe(0);
    });
    it("actions are no-ops while another action is loading", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        let resolveFirst: () => void = function (): void {return;};
        let firstCall = new Promise<void>(function (resolve: () => void): void {resolveFirst = resolve;});
        let loadSpy = vi.spyOn(manager, "loadWorkspaces").mockImplementation(function (): Promise<Workspace[]> {
            return firstCall.then(function (): Workspace[] {return [];});
        });
        let store = useWorkspace();
        let firstRefresh = store.refresh();
        let secondRefresh = store.refresh();
        expect(loadSpy).toHaveBeenCalledTimes(1);
        resolveFirst();
        await firstRefresh;
        await secondRefresh;
        expect(loadSpy).toHaveBeenCalledTimes(1);
    });
    it("all actions are no-ops while loading", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        let resolveFirst: () => void = function (): void {return;};
        let firstCall = new Promise<void>(function (resolve: () => void): void {resolveFirst = resolve;});
        let loadSpy = vi.spyOn(manager, "loadWorkspaces").mockImplementation(function (): Promise<Workspace[]> {
            return firstCall.then(function (): Workspace[] {return [];});
        });
        let createSpy = vi.spyOn(manager, "createWorkspace");
        let selectSpy = vi.spyOn(manager, "selectWorkspace");
        let updateSpy = vi.spyOn(manager, "updateWorkspace");
        let deleteSpy = vi.spyOn(manager, "deleteWorkspace");
        let addSpy = vi.spyOn(manager, "addMember");
        let removeSpy = vi.spyOn(manager, "removeMember");
        let store = useWorkspace();
        let firstRefresh = store.refresh();
        await store.createWorkspace("x", "y");
        await store.selectWorkspace("x");
        await store.updateWorkspace("x", "y", "z");
        await store.deleteWorkspace("x");
        await store.addMember("x", "u", "member");
        await store.removeMember("x", "u");
        expect(loadSpy).toHaveBeenCalledTimes(1);
        expect(createSpy).not.toHaveBeenCalled();
        expect(selectSpy).not.toHaveBeenCalled();
        expect(updateSpy).not.toHaveBeenCalled();
        expect(deleteSpy).not.toHaveBeenCalled();
        expect(addSpy).not.toHaveBeenCalled();
        expect(removeSpy).not.toHaveBeenCalled();
        resolveFirst();
        await firstRefresh;
    });
    it("refresh sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "loadWorkspaces").mockRejectedValue("boom");
        let store = useWorkspace();
        await store.refresh();
        expect(store.error()).toBe("Failed to load workspaces: Unknown error");
    });
    it("createWorkspace sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "createWorkspace").mockRejectedValue(42);
        let store = useWorkspace();
        await store.createWorkspace("x", "y");
        expect(store.error()).toBe("Failed to create workspace: Unknown error");
    });
    it("selectWorkspace sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "selectWorkspace").mockRejectedValue("nope");
        let store = useWorkspace();
        await store.selectWorkspace("x");
        expect(store.error()).toBe("Failed to select workspace: Unknown error");
    });
    it("updateWorkspace sets error when manager throws", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "updateWorkspace").mockRejectedValue(new Error("update failed"));
        let store = useWorkspace();
        await store.updateWorkspace("x", "y", "z");
        expect(store.error()).toBe("Failed to update workspace: update failed");
    });
    it("updateWorkspace sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "updateWorkspace").mockRejectedValue("bad");
        let store = useWorkspace();
        await store.updateWorkspace("x", "y", "z");
        expect(store.error()).toBe("Failed to update workspace: Unknown error");
    });
    it("deleteWorkspace sets error when manager throws", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "deleteWorkspace").mockRejectedValue(new Error("delete failed"));
        let store = useWorkspace();
        await store.deleteWorkspace("x");
        expect(store.error()).toBe("Failed to delete workspace: delete failed");
    });
    it("deleteWorkspace sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "deleteWorkspace").mockRejectedValue("bad");
        let store = useWorkspace();
        await store.deleteWorkspace("x");
        expect(store.error()).toBe("Failed to delete workspace: Unknown error");
    });
    it("deleteWorkspace keeps current when deleting a non-active workspace", async function (): Promise<void> {
        seedWorkspaces([makeWorkspace("ws-1", "A", 1), makeWorkspace("ws-2", "B", 1)]);
        let store = useWorkspace();
        await store.refresh();
        await store.selectWorkspace("ws-1");
        await store.deleteWorkspace("ws-2");
        expect(store.workspaces().length).toBe(1);
        expect(store.currentWorkspace() !== null).toBe(true);
        expect(store.currentWorkspace()!.id).toBe("ws-1");
    });
    it("addMember sets error when manager throws", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "addMember").mockRejectedValue(new Error("add failed"));
        let store = useWorkspace();
        await store.addMember("ws-1", "u", "member");
        expect(store.error()).toBe("Failed to add member: add failed");
    });
    it("addMember sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "addMember").mockRejectedValue("bad");
        let store = useWorkspace();
        await store.addMember("ws-1", "u", "member");
        expect(store.error()).toBe("Failed to add member: Unknown error");
    });
    it("removeMember sets error when manager throws", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "removeMember").mockRejectedValue(new Error("remove failed"));
        let store = useWorkspace();
        await store.removeMember("ws-1", "u");
        expect(store.error()).toBe("Failed to remove member: remove failed");
    });
    it("removeMember sets Unknown error when non-Error is thrown", async function (): Promise<void> {
        let manager = WorkspaceManager.getInstance();
        vi.spyOn(manager, "removeMember").mockRejectedValue("bad");
        let store = useWorkspace();
        await store.removeMember("ws-1", "u");
        expect(store.error()).toBe("Failed to remove member: Unknown error");
    });
});
