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
});
