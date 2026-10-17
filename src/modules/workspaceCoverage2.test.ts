import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { WorkspaceManager, Workspace, WorkspaceMember, SharedCalculation } from "./workspaceManager.js";

function makeWorkspace(id: string): Workspace {
    return {
        "id": id,
        "name": "Workspace " + id,
        "description": "Description for " + id,
        "ownerId": "local-user",
        "memberCount": 1,
        "createdAt": "2026-07-01T00:00:00Z",
        "updatedAt": "2026-07-02T00:00:00Z"
    };
}

function makeMember(userId: string, role: string): WorkspaceMember {
    return {
        "userId": userId,
        "email": userId + "@example.com",
        "name": "Member " + userId,
        "role": role
    };
}

function makeCalculation(id: string): SharedCalculation {
    return {
        "ID": id,
        "UserID": "u1",
        "CalculatorType": "molar-mass",
        "Inputs": "H2O",
        "Result": "18.015",
        "Annotation": "",
        "Starred": false,
        "WorkspaceID": "ws-1",
        "CreatedAt": "2026-07-10T12:00:00Z"
    };
}

function setupDOM(): void {
    let main: HTMLElement = document.createElement("main");
    main.id = "main-content";
    main.className = "app-view";
    document.body.appendChild(main);
}

function seedWorkspaces(workspaces: Workspace[]): void {
    localStorage.setItem("chemutil_workspaces", JSON.stringify(workspaces));
}

function seedMembers(workspaceId: string, members: WorkspaceMember[]): void {
    localStorage.setItem("chemutil_workspace_members_" + workspaceId, JSON.stringify(members));
}

type DetailBackdoor = {
    renderDetailActions(workspace: Workspace): void;
    renderAddMemberForm(workspace: Workspace): void;
    showDetailError(message: string): void;
};

describe("WorkspaceManager DOM-handler coverage", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        WorkspaceManager.resetInstance();
    });

    afterEach(function () {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
        document.body.innerHTML = "";
        localStorage.clear();
        WorkspaceManager.resetInstance();
    });

    it("clicking the sidebar create button prompts for a new workspace", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        let spy = vi.spyOn(manager, "promptCreateWorkspace").mockResolvedValue(null);
        let btn: HTMLElement | null = document.querySelector(".workspace-create-btn");
        expect(btn).not.toBeNull();
        btn?.dispatchEvent(new Event("click", { "bubbles": true }));
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("renderWorkspaceList tolerates a missing sidebar container", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.renderWorkspaceList([makeWorkspace("ws-1")]);
    });

    it("renderWorkspaceList tolerates a sidebar without a list element", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        document.querySelector(".workspace-list")?.remove();
        manager.renderWorkspaceList([makeWorkspace("ws-1")]);
        expect(document.querySelector(".workspace-list")).toBeNull();
    });

    it("workspace list items select on click and on Enter/Space but not on other keys", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        let ws: Workspace = makeWorkspace("ws-1");
        let spy = vi.spyOn(manager, "selectWorkspace").mockResolvedValue(ws);
        manager.renderWorkspaceList([ws]);
        let item: HTMLElement = document.querySelector(".workspace-list-item") as HTMLElement;
        item.dispatchEvent(new Event("click", { "bubbles": true }));
        expect(spy).toHaveBeenCalledWith("ws-1");
        spy.mockClear();
        item.dispatchEvent(new KeyboardEvent("keydown", { "key": "Enter", "bubbles": true }));
        item.dispatchEvent(new KeyboardEvent("keydown", { "key": " ", "bubbles": true }));
        item.dispatchEvent(new KeyboardEvent("keydown", { "key": "x", "bubbles": true }));
        expect(spy).toHaveBeenCalledTimes(2);
        await Promise.resolve();
    });

    it("renderWorkspaceDetail tolerates a missing detail container", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.renderWorkspaceDetail(makeWorkspace("ws-1"));
    });

    it("renderWorkspaceDetail tolerates a detail container without a header", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        document.querySelector(".workspace-detail-header")?.remove();
        manager.renderWorkspaceDetail(makeWorkspace("ws-1"));
        expect(document.querySelector(".workspace-export-pdf-btn")).not.toBeNull();
    });

    it("editing the description input updates the workspace", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        let ws: Workspace = makeWorkspace("ws-1");
        let updated: Workspace = { ...ws, "description": "changed" };
        let spy = vi.spyOn(manager, "updateWorkspace").mockResolvedValue(updated);
        manager.renderWorkspaceDetail(ws);
        let input: HTMLInputElement = document.querySelector(".workspace-detail-description") as HTMLInputElement;
        input.value = "changed";
        input.dispatchEvent(new Event("change", { "bubbles": true }));
        await Promise.resolve();
        expect(spy).toHaveBeenCalledWith("ws-1", ws.name, "changed");
    });

    it("renderDetailActions tolerates a missing detail container", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        let backdoor: DetailBackdoor = manager as unknown as DetailBackdoor;
        backdoor.renderDetailActions(makeWorkspace("ws-1"));
    });

    it("renderDetailActions tolerates a detail container without an actions element", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        document.querySelector(".workspace-detail-actions")?.remove();
        let backdoor: DetailBackdoor = manager as unknown as DetailBackdoor;
        backdoor.renderDetailActions(makeWorkspace("ws-1"));
    });

    it("clicking the export button prints the workspace", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        window.print = vi.fn(function (): void { return; });
        manager.renderWorkspaceDetail(makeWorkspace("ws-1"));
        let btn: HTMLElement = document.querySelector(".workspace-export-pdf-btn") as HTMLElement;
        btn.dispatchEvent(new Event("click", { "bubbles": true }));
        expect(window.print).toHaveBeenCalledTimes(1);
    });

    it("clicking delete with confirmation deletes the workspace", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        window.confirm = vi.fn(function (): boolean { return true; }) as unknown as typeof window.confirm;
        let spy = vi.spyOn(manager, "deleteWorkspace").mockResolvedValue(undefined);
        manager.renderWorkspaceDetail(makeWorkspace("ws-1"));
        let btn: HTMLElement = document.querySelector(".workspace-delete-btn") as HTMLElement;
        btn.dispatchEvent(new Event("click", { "bubbles": true }));
        await Promise.resolve();
        expect(spy).toHaveBeenCalledWith("ws-1");
    });

    it("clicking delete without confirmation keeps the workspace", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        window.confirm = vi.fn(function (): boolean { return false; }) as unknown as typeof window.confirm;
        let spy = vi.spyOn(manager, "deleteWorkspace").mockResolvedValue(undefined);
        manager.renderWorkspaceDetail(makeWorkspace("ws-1"));
        let btn: HTMLElement = document.querySelector(".workspace-delete-btn") as HTMLElement;
        btn.dispatchEvent(new Event("click", { "bubbles": true }));
        await Promise.resolve();
        expect(spy).not.toHaveBeenCalled();
    });

    it("renderAddMemberForm tolerates a missing detail container", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        let backdoor: DetailBackdoor = manager as unknown as DetailBackdoor;
        backdoor.renderAddMemberForm(makeWorkspace("ws-1"));
    });

    it("renderAddMemberForm tolerates a detail container without a form slot", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        document.querySelector(".workspace-add-member")?.remove();
        let backdoor: DetailBackdoor = manager as unknown as DetailBackdoor;
        backdoor.renderAddMemberForm(makeWorkspace("ws-1"));
    });

    it("submitting the add-member form with an empty email adds nobody", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        let spy = vi.spyOn(manager, "addMember");
        manager.renderWorkspaceDetail(makeWorkspace("ws-1"));
        let form: HTMLFormElement = document.querySelector(".workspace-add-member-form") as HTMLFormElement;
        form.dispatchEvent(new Event("submit", { "bubbles": true, "cancelable": true }));
        expect(spy).not.toHaveBeenCalled();
    });

    it("submitting the add-member form with an email adds the member and clears the input", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        manager.renderWorkspaceDetail(makeWorkspace("ws-1"));
        let form: HTMLFormElement = document.querySelector(".workspace-add-member-form") as HTMLFormElement;
        let email: HTMLInputElement = form.querySelector(".workspace-add-member-email") as HTMLInputElement;
        email.value = "new@example.com";
        form.dispatchEvent(new Event("submit", { "bubbles": true, "cancelable": true }));
        await Promise.resolve();
        let raw: string | null = localStorage.getItem("chemutil_workspace_members_ws-1");
        expect(raw).not.toBeNull();
        let stored: WorkspaceMember[] = JSON.parse(raw as string) as WorkspaceMember[];
        expect(stored.length).toBe(1);
        expect(stored[0].userId).toBe("new@example.com");
        expect(email.value).toBe("");
    });

    it("renderMembers tolerates a missing detail container", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.renderMembers([makeMember("u2", "member")]);
    });

    it("renderMembers tolerates a detail container without a members element", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        document.querySelector(".workspace-members")?.remove();
        manager.renderMembers([makeMember("u2", "member")]);
    });

    it("clicking a member remove button removes the member of the current workspace", async function () {
        setupDOM();
        seedWorkspaces([makeWorkspace("ws-1")]);
        seedMembers("ws-1", [makeMember("u2", "member")]);
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        await manager.selectWorkspace("ws-1");
        let btn: HTMLElement = document.querySelector(".workspace-member-remove") as HTMLElement;
        btn.dispatchEvent(new Event("click", { "bubbles": true }));
        await new Promise(function (resolve: (v: unknown) => void): void {
            setTimeout(function (): void { resolve(null); }, 0);
        });
        let raw: string | null = localStorage.getItem("chemutil_workspace_members_ws-1");
        expect(raw).not.toBeNull();
        expect((JSON.parse(raw as string) as WorkspaceMember[]).length).toBe(0);
    });

    it("clicking a member remove button without a current workspace removes nobody", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        let spy = vi.spyOn(manager, "removeMember");
        manager.renderMembers([makeMember("u2", "member")]);
        let btn: HTMLElement = document.querySelector(".workspace-member-remove") as HTMLElement;
        btn.dispatchEvent(new Event("click", { "bubbles": true }));
        await Promise.resolve();
        expect(spy).not.toHaveBeenCalled();
        expect(manager.getCurrentWorkspace()).toBeNull();
    });

    it("renderSharedCalculations tolerates a missing detail container", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.renderSharedCalculations([makeCalculation("c1")]);
    });

    it("renderSharedCalculations tolerates a detail container without a calculations element", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        document.querySelector(".workspace-shared-calculations")?.remove();
        manager.renderSharedCalculations([makeCalculation("c1")]);
    });

    it("showDetailView tolerates a missing detail container", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.showDetailView();
    });

    it("showDetailView hides surrounding views and reveals the workspace detail", function () {
        setupDOM();
        let main: HTMLElement = document.getElementById("main-content") as HTMLElement;
        for (let k = 0; k < 2; k++) {
            let s: HTMLElement = document.createElement("div");
            s.className = "main-groups card view-active";
            main.appendChild(s);
        }
        let dashboard: HTMLElement = document.createElement("div");
        dashboard.id = "dashboard-view";
        document.body.appendChild(dashboard);
        let welcome: HTMLElement = document.createElement("div");
        welcome.className = "welcome-screen";
        main.appendChild(welcome);
        let viewHeader: HTMLElement = document.createElement("div");
        viewHeader.className = "view-header";
        document.body.appendChild(viewHeader);
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        manager.showDetailView();
        expect(manager.isDetailViewVisible()).toBe(true);
        expect(main.querySelectorAll(".view-hidden").length).toBe(2);
        expect(dashboard.style.display).toBe("none");
        expect(welcome.style.display).toBe("none");
        expect(viewHeader.style.display).toBe("none");
    });

    it("hideDetailView and visibility tolerate a missing detail container", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.hideDetailView();
        expect(manager.isDetailViewVisible()).toBe(false);
    });

    it("showDetailError tolerates a missing detail container", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        let backdoor: DetailBackdoor = manager as unknown as DetailBackdoor;
        backdoor.showDetailError("boom");
    });

    it("showDetailError tolerates a detail container without an error element", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        document.querySelector(".workspace-detail-error")?.remove();
        let backdoor: DetailBackdoor = manager as unknown as DetailBackdoor;
        backdoor.showDetailError("boom");
    });

    it("showDetailError shows messages and hides on empty message", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        let backdoor: DetailBackdoor = manager as unknown as DetailBackdoor;
        backdoor.showDetailError("boom");
        let errorEl: HTMLElement = document.querySelector(".workspace-detail-error") as HTMLElement;
        expect(errorEl.textContent).toBe("boom");
        expect(errorEl.style.display).toBe("block");
        backdoor.showDetailError("");
        expect(errorEl.textContent).toBe("");
        expect(errorEl.style.display).toBe("none");
    });

    it("exportToPDF prints the current view", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        window.print = vi.fn(function (): void { return; });
        manager.exportToPDF();
        expect(window.print).toHaveBeenCalledTimes(1);
    });

    it("share button shows Link copied and restores the label after a delay", async function () {
        try {
            vi.useFakeTimers();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.attachShareButton(result, "calc-9");
            let btn: HTMLButtonElement = result.querySelector(".share-button") as HTMLButtonElement;
            btn.textContent = "";
            btn.dispatchEvent(new Event("click", { "bubbles": true }));
            await vi.advanceTimersByTimeAsync(0);
            expect(btn.textContent).toBe("Link copied");
            expect(btn.classList.contains("shared")).toBe(true);
            await vi.advanceTimersByTimeAsync(2000);
            expect(btn.textContent).toBe("Share");
            expect(btn.classList.contains("shared")).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });
});
