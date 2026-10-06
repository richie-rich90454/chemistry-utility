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

function makeCalculation(id: string, createdAt: string): SharedCalculation {
    return {
        "ID": id,
        "UserID": "u1",
        "CalculatorType": "molar-mass",
        "Inputs": "H2O",
        "Result": "18.015",
        "Annotation": "",
        "Starred": false,
        "WorkspaceID": "ws-1",
        "CreatedAt": createdAt
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

describe("WorkspaceManager storage/init/prompt coverage", function () {
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

    it("init works with no main-content element in the document", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        expect(document.getElementById("sidebar-workspaces")).toBeNull();
        expect(manager.isDetailViewVisible()).toBe(false);
    });

    it("init reuses a fully-built sidebar and detail structure", function () {
        setupDOM();
        let side: HTMLElement = document.createElement("section");
        side.id = "sidebar-workspaces";
        let header: HTMLElement = document.createElement("div");
        header.className = "sidebar-workspaces-header";
        side.appendChild(header);
        let list: HTMLElement = document.createElement("ul");
        list.className = "workspace-list";
        side.appendChild(list);
        document.body.appendChild(side);
        let detail: HTMLElement = document.createElement("section");
        detail.id = "workspace-view";
        let classes: string[] = [
            "workspace-detail-header",
            "workspace-detail-error",
            "workspace-members",
            "workspace-add-member",
            "workspace-shared-calculations",
            "workspace-detail-actions"
        ];
        for (let c of classes) {
            let d: HTMLElement = document.createElement("div");
            d.className = c;
            detail.appendChild(d);
        }
        document.body.appendChild(detail);
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        expect(document.getElementById("sidebar-workspaces")).toBe(side);
        expect(document.getElementById("workspace-view")).toBe(detail);
        expect(side.querySelectorAll(".sidebar-workspaces-header").length).toBe(1);
        expect(side.querySelectorAll(".workspace-list").length).toBe(1);
    });

    it("init skips showing the sidebar when the sidebar container is missing", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        type Backdoor = {
            renderSidebarSection(): HTMLElement;
        };
        let backdoor: Backdoor = manager as unknown as Backdoor;
        vi.spyOn(backdoor, "renderSidebarSection").mockReturnValue(document.createElement("div"));
        manager.init();
        expect(document.getElementById("sidebar-workspaces")).toBeNull();
    });

    it("selectWorkspace finds a workspace that is not first in storage", async function () {
        setupDOM();
        seedWorkspaces([makeWorkspace("ws-1"), makeWorkspace("ws-2")]);
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        let result: Workspace = await manager.selectWorkspace("ws-2");
        expect(result.id).toBe("ws-2");
        expect(manager.getCurrentWorkspace()?.id).toBe("ws-2");
    });

    it("updateWorkspace updates a workspace that is not first in storage", async function () {
        setupDOM();
        seedWorkspaces([makeWorkspace("ws-1"), makeWorkspace("ws-2")]);
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        let result: Workspace = await manager.updateWorkspace("ws-2", "Second Renamed", "second desc");
        expect(result.name).toBe("Second Renamed");
        let raw: string | null = localStorage.getItem("chemutil_workspaces");
        expect(raw).not.toBeNull();
        let stored: Workspace[] = JSON.parse(raw as string) as Workspace[];
        expect(stored[0].name).toBe("Workspace ws-1");
        expect(stored[1].name).toBe("Second Renamed");
    });

    it("deleteWorkspace keeps workspaces that do not match the deleted id", async function () {
        setupDOM();
        seedWorkspaces([makeWorkspace("ws-1"), makeWorkspace("ws-2")]);
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        await manager.deleteWorkspace("ws-1");
        let raw: string | null = localStorage.getItem("chemutil_workspaces");
        expect(raw).not.toBeNull();
        let stored: Workspace[] = JSON.parse(raw as string) as Workspace[];
        expect(stored.length).toBe(1);
        expect(stored[0].id).toBe("ws-2");
    });

    it("createWorkspace still resolves when the list refresh rejects", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        vi.spyOn(manager, "loadWorkspaces").mockRejectedValueOnce(new Error("refresh down"));
        let result: Workspace = await manager.createWorkspace("Resilient", "d");
        expect(result.name).toBe("Resilient");
    });

    it("selectWorkspace still resolves when member and calculation loads reject", async function () {
        setupDOM();
        seedWorkspaces([makeWorkspace("ws-1")]);
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        vi.spyOn(manager, "loadMembers").mockRejectedValueOnce(new Error("members down"));
        vi.spyOn(manager, "loadWorkspaceCalculations").mockRejectedValueOnce(new Error("calcs down"));
        let result: Workspace = await manager.selectWorkspace("ws-1");
        expect(result.id).toBe("ws-1");
        expect(manager.isDetailViewVisible()).toBe(true);
    });

    it("updateWorkspace still resolves when the list refresh rejects", async function () {
        setupDOM();
        seedWorkspaces([makeWorkspace("ws-1")]);
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        vi.spyOn(manager, "loadWorkspaces").mockRejectedValueOnce(new Error("refresh down"));
        let result: Workspace = await manager.updateWorkspace("ws-1", "Renamed", "d");
        expect(result.name).toBe("Renamed");
    });

    it("deleteWorkspace still resolves when the list refresh rejects", async function () {
        setupDOM();
        seedWorkspaces([makeWorkspace("ws-1")]);
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        vi.spyOn(manager, "loadWorkspaces").mockRejectedValueOnce(new Error("refresh down"));
        await manager.deleteWorkspace("ws-1");
        expect(localStorage.getItem("chemutil_workspaces")).toBe("[]");
    });

    it("promptCreateWorkspace returns null when the name prompt is cancelled", async function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        window.prompt = vi.fn(function (): null { return null; }) as unknown as typeof window.prompt;
        let spy = vi.spyOn(manager, "createWorkspace");
        let result = await manager.promptCreateWorkspace();
        expect(result).toBeNull();
        expect(spy).not.toHaveBeenCalled();
    });

    it("promptCreateWorkspace defaults an empty description prompt to empty string", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        window.prompt = vi.fn()
            .mockReturnValueOnce("My Lab")
            .mockReturnValueOnce(null) as unknown as typeof window.prompt;
        let result = await manager.promptCreateWorkspace();
        expect(result).not.toBeNull();
        expect(result?.description).toBe("");
    });

    it("promptCreateWorkspace creates with the given name and description", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        window.prompt = vi.fn()
            .mockReturnValueOnce("My Lab")
            .mockReturnValueOnce("Cool place") as unknown as typeof window.prompt;
        let result = await manager.promptCreateWorkspace();
        expect(result?.name).toBe("My Lab");
        expect(result?.description).toBe("Cool place");
    });

    it("promptCreateWorkspace surfaces Error failures in the detail error box", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        window.prompt = vi.fn()
            .mockReturnValueOnce("My Lab")
            .mockReturnValueOnce("desc") as unknown as typeof window.prompt;
        vi.spyOn(manager, "createWorkspace").mockRejectedValueOnce(new Error("nope"));
        let result = await manager.promptCreateWorkspace();
        expect(result).toBeNull();
        let detail: HTMLElement = document.getElementById("workspace-view") as HTMLElement;
        let errorEl: HTMLElement | null = detail.querySelector(".workspace-detail-error");
        expect(errorEl?.textContent).toContain("Failed to create workspace: nope");
        expect(errorEl?.style.display).toBe("block");
    });

    it("promptCreateWorkspace surfaces non-Error failures with the fallback message", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        window.prompt = vi.fn()
            .mockReturnValueOnce("My Lab")
            .mockReturnValueOnce("desc") as unknown as typeof window.prompt;
        vi.spyOn(manager, "createWorkspace").mockRejectedValueOnce("string-fail");
        let result = await manager.promptCreateWorkspace();
        expect(result).toBeNull();
        let detail: HTMLElement = document.getElementById("workspace-view") as HTMLElement;
        let errorEl: HTMLElement | null = detail.querySelector(".workspace-detail-error");
        expect(errorEl?.textContent).toBe("Failed to create workspace");
    });

    it("generateShareLink falls back to protocol/host when origin is empty", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        vi.stubGlobal("location", { "origin": "", "protocol": "https:", "host": "example.com" });
        try {
            expect(manager.generateShareLink("c1")).toBe("https://example.com/shared/c1");
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it("copyShareLink returns the link even when no clipboard API exists", async function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        let nav: { clipboard: unknown } = navigator as unknown as { clipboard: unknown };
        let original: unknown = nav.clipboard;
        nav.clipboard = undefined;
        try {
            let link: string = await manager.copyShareLink("c7");
            expect(link).toContain("/shared/c7");
        } finally {
            nav.clipboard = original;
        }
    });

    it("readers return empty arrays for corrupt or non-array storage payloads", async function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        localStorage.setItem("chemutil_workspaces", "not-json{");
        expect(await manager.loadWorkspaces()).toEqual([]);
        localStorage.setItem("chemutil_workspaces", "{\"a\":1}");
        expect(await manager.loadWorkspaces()).toEqual([]);
        localStorage.setItem("chemutil_workspace_members_ws-1", "[[broken");
        expect(await manager.loadMembers("ws-1")).toEqual([]);
        localStorage.setItem("chemutil_workspace_members_ws-1", "42");
        expect(await manager.loadMembers("ws-1")).toEqual([]);
        localStorage.setItem("chemutil_workspace_calculations_ws-1", "nope{");
        expect(await manager.loadWorkspaceCalculations("ws-1")).toEqual([]);
        localStorage.setItem("chemutil_workspace_calculations_ws-1", "\"str\"");
        expect(await manager.loadWorkspaceCalculations("ws-1")).toEqual([]);
    });

    it("renderSharedCalculations formats double-digit months/days and tolerates bad dates", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        manager.renderSharedCalculations([
            makeCalculation("c-dec", "2026-12-05T00:00:00Z"),
            makeCalculation("c-bad", "not-a-date")
        ]);
        let container: HTMLElement | null = document.querySelector(".workspace-shared-calculations");
        expect(container?.textContent).toContain("2026-12-05");
        expect(container?.querySelectorAll(".workspace-calc-item").length).toBe(2);
    });

    it("renderMembers falls back to email when a member has no name", function () {
        setupDOM();
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        manager.init();
        let nameless: WorkspaceMember = {
            "userId": "u9",
            "email": "u9@example.com",
            "name": "",
            "role": "member"
        };
        manager.renderMembers([nameless]);
        let container: HTMLElement | null = document.querySelector(".workspace-members");
        expect(container?.textContent).toContain("u9@example.com");
        let removeBtn: HTMLElement | null = container?.querySelector(".workspace-member-remove") as HTMLElement | null;
        expect(removeBtn?.getAttribute("aria-label")).toBe("Remove member u9@example.com");
    });

    it("attachShareButtons skips results whose calculation id is empty", function () {
        let manager: WorkspaceManager = WorkspaceManager.getInstance();
        let r: HTMLElement = document.createElement("div");
        r.className = "result";
        r.setAttribute("data-calculation-id", "");
        document.body.appendChild(r);
        manager.attachShareButtons();
        expect(r.querySelectorAll(".share-button").length).toBe(0);
    });
});
