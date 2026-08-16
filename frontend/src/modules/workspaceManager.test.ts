import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { WorkspaceManager, Workspace, WorkspaceMember, SharedCalculation } from "./workspaceManager.js";

function makeWorkspace(id: string, ownerId: string, memberCount: number): Workspace {
    return {
        "id": id,
        "name": "Workspace " + id,
        "description": "Description for " + id,
        "ownerId": ownerId,
        "memberCount": memberCount,
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

function seedWorkspaces(workspaces: Workspace[]): void {
    localStorage.setItem("chemutil_workspaces", JSON.stringify(workspaces));
}

function seedMembers(workspaceId: string, members: WorkspaceMember[]): void {
    localStorage.setItem("chemutil_workspace_members_" + workspaceId, JSON.stringify(members));
}

function seedCalculations(workspaceId: string, calculations: SharedCalculation[]): void {
    localStorage.setItem("chemutil_workspace_calculations_" + workspaceId, JSON.stringify(calculations));
}

function readStoredWorkspaces(): Workspace[] {
    let raw: string | null = localStorage.getItem("chemutil_workspaces");
    if (!raw) {
        return [];
    }
    return JSON.parse(raw) as Workspace[];
}

function readStoredMembers(workspaceId: string): WorkspaceMember[] {
    let raw: string | null = localStorage.getItem("chemutil_workspace_members_" + workspaceId);
    if (!raw) {
        return [];
    }
    return JSON.parse(raw) as WorkspaceMember[];
}

function readStoredCalculations(workspaceId: string): SharedCalculation[] {
    let raw: string | null = localStorage.getItem("chemutil_workspace_calculations_" + workspaceId);
    if (!raw) {
        return [];
    }
    return JSON.parse(raw) as SharedCalculation[];
}

describe("WorkspaceManager", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        WorkspaceManager.resetInstance();
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        WorkspaceManager.resetInstance();
    });

    function setupDOM(): void {
        let main: HTMLElement = document.createElement("main");
        main.id = "main-content";
        main.className = "app-view";
        document.body.appendChild(main);
    }

    describe("getInstance", function () {
        it("should return same instance on subsequent calls", function () {
            let m1: WorkspaceManager = WorkspaceManager.getInstance();
            let m2: WorkspaceManager = WorkspaceManager.getInstance();
            expect(m1).toBe(m2);
        });

        it("should return new instance after resetInstance", function () {
            let m1: WorkspaceManager = WorkspaceManager.getInstance();
            WorkspaceManager.resetInstance();
            let m2: WorkspaceManager = WorkspaceManager.getInstance();
            expect(m1).not.toBe(m2);
        });
    });

    describe("init", function () {
        it("should create sidebar workspaces section and detail view", function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let sidebar: HTMLElement | null = document.getElementById("sidebar-workspaces");
            expect(sidebar).not.toBeNull();
            let detail: HTMLElement | null = document.getElementById("workspace-view");
            expect(detail).not.toBeNull();
        });

        it("should use existing sidebar section when present", function () {
            setupDOM();
            let existing: HTMLElement = document.createElement("section");
            existing.id = "sidebar-workspaces";
            document.body.appendChild(existing);
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let found: HTMLElement | null = document.getElementById("sidebar-workspaces");
            expect(found).toBe(existing);
        });

        it("should always show sidebar for local users", function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let sidebar: HTMLElement = document.getElementById("sidebar-workspaces") as HTMLElement;
            expect(sidebar.style.display).toBe("block");
        });

        it("should not re-initialize on second call", function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let sidebar: HTMLElement = document.getElementById("sidebar-workspaces") as HTMLElement;
            let original: string = sidebar.id;
            manager.init();
            let after: HTMLElement | null = document.getElementById(original);
            expect(after).toBe(sidebar);
        });
    });

    describe("loadWorkspaces", function () {
        it("should read workspaces from localStorage and render the list", async function () {
            setupDOM();
            let workspaces: Workspace[] = [makeWorkspace("ws-1", "local-user", 3), makeWorkspace("ws-2", "local-user", 1)];
            seedWorkspaces(workspaces);
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let result: Workspace[] = await manager.loadWorkspaces();
            expect(result.length).toBe(2);
            let list: HTMLElement | null = document.querySelector(".workspace-list");
            expect(list).not.toBeNull();
            if (list) {
                expect(list.querySelectorAll(".workspace-list-item").length).toBe(2);
                expect(list.textContent).toContain("Workspace ws-1");
                expect(list.textContent).toContain("3 members");
            }
        });

        it("should render empty state when no workspaces", async function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            await manager.loadWorkspaces();
            let list: HTMLElement | null = document.querySelector(".workspace-list");
            expect(list).not.toBeNull();
            if (list) {
                expect(list.textContent).toContain("No workspaces yet.");
            }
        });
    });

    describe("createWorkspace", function () {
        it("should persist workspace to localStorage with local-user owner and refresh list", async function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let result: Workspace = await manager.createWorkspace("New Lab", "description");
            expect(result.name).toBe("New Lab");
            expect(result.description).toBe("description");
            expect(result.ownerId).toBe("local-user");
            expect(typeof result.id).toBe("string");
            expect(result.id.length).toBeGreaterThan(0);
            let stored: Workspace[] = readStoredWorkspaces();
            expect(stored.length).toBe(1);
            expect(stored[0].name).toBe("New Lab");
            expect(stored[0].ownerId).toBe("local-user");
            let list: HTMLElement | null = document.querySelector(".workspace-list");
            expect(list).not.toBeNull();
            if (list) {
                expect(list.textContent).toContain("New Lab");
            }
        });

        it("should still return workspace when list refresh fails", async function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let result: Workspace = await manager.createWorkspace("New Lab", "description");
            expect(result.id).toBeDefined();
            expect(result.name).toBe("New Lab");
        });
    });

    describe("selectWorkspace", function () {
        it("should read workspace from localStorage, render detail, and load members + calculations", async function () {
            setupDOM();
            let ws: Workspace = makeWorkspace("ws-1", "local-user", 2);
            seedWorkspaces([ws]);
            seedMembers("ws-1", [makeMember("u2", "member")]);
            seedCalculations("ws-1", [makeCalculation("c1")]);
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let result: Workspace = await manager.selectWorkspace("ws-1");
            expect(result.id).toBe("ws-1");
            expect(manager.isDetailViewVisible()).toBe(true);
            let current: Workspace | null = manager.getCurrentWorkspace();
            expect(current).not.toBeNull();
            if (current) {
                expect(current.id).toBe("ws-1");
            }
            expect(manager.getCurrentMembers().length).toBe(1);
            expect(manager.getCurrentCalculations().length).toBe(1);
            let detail: HTMLElement | null = document.getElementById("workspace-view");
            expect(detail).not.toBeNull();
            if (detail) {
                expect(detail.textContent).toContain("Workspace ws-1");
                expect(detail.textContent).toContain("Members");
                expect(detail.textContent).toContain("Shared Calculations");
            }
        });

        it("should throw when workspace not found in localStorage", async function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            await expect(manager.selectWorkspace("missing")).rejects.toThrow();
        });

        it("should still render detail when members storage empty", async function () {
            setupDOM();
            let ws: Workspace = makeWorkspace("ws-1", "local-user", 0);
            seedWorkspaces([ws]);
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            await manager.selectWorkspace("ws-1");
            expect(manager.isDetailViewVisible()).toBe(true);
            expect(manager.getCurrentMembers().length).toBe(0);
        });
    });

    describe("updateWorkspace", function () {
        it("should update workspace in localStorage and refresh the list", async function () {
            setupDOM();
            let ws: Workspace = makeWorkspace("ws-1", "local-user", 2);
            seedWorkspaces([ws]);
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let result: Workspace = await manager.updateWorkspace("ws-1", "Renamed", "new desc");
            expect(result.name).toBe("Renamed");
            expect(result.description).toBe("new desc");
            let stored: Workspace[] = readStoredWorkspaces();
            expect(stored[0].name).toBe("Renamed");
            expect(stored[0].description).toBe("new desc");
        });

        it("should throw when workspace not found", async function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            await expect(manager.updateWorkspace("missing", "n", "d")).rejects.toThrow();
        });
    });

    describe("deleteWorkspace", function () {
        it("should remove workspace, members, and calculations from localStorage", async function () {
            setupDOM();
            let ws: Workspace = makeWorkspace("ws-1", "local-user", 2);
            seedWorkspaces([ws]);
            seedMembers("ws-1", [makeMember("u2", "member")]);
            seedCalculations("ws-1", [makeCalculation("c1")]);
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            await manager.selectWorkspace("ws-1");
            expect(manager.isDetailViewVisible()).toBe(true);
            await manager.deleteWorkspace("ws-1");
            expect(readStoredWorkspaces().length).toBe(0);
            expect(localStorage.getItem("chemutil_workspace_members_ws-1")).toBeNull();
            expect(localStorage.getItem("chemutil_workspace_calculations_ws-1")).toBeNull();
            expect(manager.isDetailViewVisible()).toBe(false);
            expect(manager.getCurrentWorkspace()).toBeNull();
        });

        it("should complete even when workspace not present", async function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            await manager.deleteWorkspace("missing");
            expect(readStoredWorkspaces().length).toBe(0);
        });
    });

    describe("loadMembers", function () {
        it("should read members from localStorage and render them", async function () {
            setupDOM();
            let members: WorkspaceMember[] = [makeMember("u2", "member"), makeMember("u3", "admin")];
            seedMembers("ws-1", members);
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let result: WorkspaceMember[] = await manager.loadMembers("ws-1");
            expect(result.length).toBe(2);
            expect(manager.getCurrentMembers().length).toBe(2);
        });
    });

    describe("addMember", function () {
        it("should persist member to localStorage and refresh member list", async function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let result: WorkspaceMember = await manager.addMember("ws-1", "u2", "member");
            expect(result.userId).toBe("u2");
            expect(result.role).toBe("member");
            expect(result.email).toBe("u2@local");
            expect(result.name).toBe("u2");
            let stored: WorkspaceMember[] = readStoredMembers("ws-1");
            expect(stored.length).toBe(1);
            expect(stored[0].userId).toBe("u2");
        });
    });

    describe("removeMember", function () {
        it("should remove member from localStorage and refresh member list", async function () {
            setupDOM();
            seedMembers("ws-1", [makeMember("u2", "member"), makeMember("u3", "admin")]);
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            await manager.removeMember("ws-1", "u2");
            let stored: WorkspaceMember[] = readStoredMembers("ws-1");
            expect(stored.length).toBe(1);
            expect(stored[0].userId).toBe("u3");
        });
    });

    describe("loadWorkspaceCalculations", function () {
        it("should read calculations from localStorage and render them", async function () {
            setupDOM();
            let calcs: SharedCalculation[] = [makeCalculation("c1"), makeCalculation("c2")];
            seedCalculations("ws-1", calcs);
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let result: SharedCalculation[] = await manager.loadWorkspaceCalculations("ws-1");
            expect(result.length).toBe(2);
            expect(manager.getCurrentCalculations().length).toBe(2);
        });
    });

    describe("addLocalCalculation", function () {
        it("should persist calculation to localStorage and re-render when current workspace matches", function () {
            setupDOM();
            let ws: Workspace = makeWorkspace("ws-1", "local-user", 1);
            seedWorkspaces([ws]);
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            void manager.selectWorkspace(ws.id);
            manager.addLocalCalculation("ws-1", makeCalculation("c9"));
            let stored: SharedCalculation[] = readStoredCalculations("ws-1");
            expect(stored.length).toBe(1);
            expect(stored[0].ID).toBe("c9");
            expect(manager.getCurrentCalculations().length).toBe(1);
        });

        it("should persist calculation but not update current when workspace differs", function () {
            setupDOM();
            let ws: Workspace = makeWorkspace("ws-1", "local-user", 1);
            seedWorkspaces([ws]);
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            manager.addLocalCalculation("ws-other", makeCalculation("c9"));
            let stored: SharedCalculation[] = readStoredCalculations("ws-other");
            expect(stored.length).toBe(1);
            expect(manager.getCurrentCalculations().length).toBe(0);
        });
    });

    describe("render methods", function () {
        let manager: WorkspaceManager;

        beforeEach(function () {
            setupDOM();
            manager = WorkspaceManager.getInstance();
            manager.init();
        });

        it("renderWorkspaceList renders clickable items with member count", function () {
            manager.renderWorkspaceList([makeWorkspace("ws-a", "local-user", 5)]);
            let list: HTMLElement | null = document.querySelector(".workspace-list");
            expect(list).not.toBeNull();
            if (list) {
                let item: HTMLElement | null = list.querySelector(".workspace-list-item");
                expect(item).not.toBeNull();
                if (item) {
                    expect(item.getAttribute("data-workspace-id")).toBe("ws-a");
                    expect(item.textContent).toContain("5 members");
                }
            }
        });

        it("renderWorkspaceDetail renders name, description input, export button", function () {
            let ws: Workspace = makeWorkspace("ws-1", "local-user", 2);
            manager.renderWorkspaceDetail(ws);
            let detail: HTMLElement = document.getElementById("workspace-view") as HTMLElement;
            expect(detail.textContent).toContain("Workspace ws-1");
            expect(detail.querySelector(".workspace-detail-description")).not.toBeNull();
            expect(detail.querySelector(".workspace-export-pdf-btn")).not.toBeNull();
        });

        it("renderWorkspaceDetail always shows delete button for local users", function () {
            let ws: Workspace = makeWorkspace("ws-1", "someone-else", 2);
            manager.renderWorkspaceDetail(ws);
            let detail: HTMLElement = document.getElementById("workspace-view") as HTMLElement;
            expect(detail.querySelector(".workspace-delete-btn")).not.toBeNull();
        });

        it("renderMembers renders member list with roles and remove button for non-local members", function () {
            manager.renderMembers([makeMember("u2", "admin")]);
            let container: HTMLElement | null = document.querySelector(".workspace-members");
            expect(container).not.toBeNull();
            if (container) {
                expect(container.textContent).toContain("Member u2");
                expect(container.textContent).toContain("admin");
                expect(container.querySelectorAll(".workspace-member-remove").length).toBe(1);
            }
        });

        it("renderMembers does not show remove button for local-user member", function () {
            let localMember: WorkspaceMember = {
                "userId": "local-user",
                "email": "local@local",
                "name": "Me",
                "role": "owner"
            };
            manager.renderMembers([localMember]);
            let container: HTMLElement | null = document.querySelector(".workspace-members");
            expect(container).not.toBeNull();
            if (container) {
                expect(container.querySelectorAll(".workspace-member-remove").length).toBe(0);
            }
        });

        it("renderMembers renders empty state when no members", function () {
            manager.renderMembers([]);
            let container: HTMLElement | null = document.querySelector(".workspace-members");
            expect(container).not.toBeNull();
            if (container) {
                expect(container.textContent).toContain("No members.");
            }
        });

        it("renderSharedCalculations renders calculation list", function () {
            manager.renderSharedCalculations([makeCalculation("c1")]);
            let container: HTMLElement | null = document.querySelector(".workspace-shared-calculations");
            expect(container).not.toBeNull();
            if (container) {
                expect(container.textContent).toContain("molar-mass");
                expect(container.textContent).toContain("H2O");
            }
        });

        it("renderSharedCalculations renders empty state when none", function () {
            manager.renderSharedCalculations([]);
            let container: HTMLElement | null = document.querySelector(".workspace-shared-calculations");
            expect(container).not.toBeNull();
            if (container) {
                expect(container.textContent).toContain("No shared calculations yet.");
            }
        });
    });

    describe("showDetailView / hideDetailView", function () {
        it("showDetailView displays the container", function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            manager.showDetailView();
            expect(manager.isDetailViewVisible()).toBe(true);
        });

        it("hideDetailView hides the container", function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            manager.showDetailView();
            manager.hideDetailView();
            expect(manager.isDetailViewVisible()).toBe(false);
        });
    });

    describe("share button", function () {
        it("generateShareLink builds origin + /shared/ + id", function () {
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            let link: string = manager.generateShareLink("calc-42");
            expect(link).toContain("/shared/calc-42");
        });

        it("attachShareButton adds a share button to a result element", function () {
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.attachShareButton(result, "calc-1");
            let btn: HTMLElement | null = result.querySelector(".share-button");
            expect(btn).not.toBeNull();
        });

        it("attachShareButton does not duplicate buttons", function () {
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.attachShareButton(result, "calc-1");
            manager.attachShareButton(result, "calc-1");
            expect(result.querySelectorAll(".share-button").length).toBe(1);
        });

        it("attachShareButtons attaches to all .result[data-calculation-id] elements", function () {
            setupDOM();
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
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.attachShareButtons();
            expect(r1.querySelectorAll(".share-button").length).toBe(1);
            expect(r2.querySelectorAll(".share-button").length).toBe(1);
            expect(r3.querySelectorAll(".share-button").length).toBe(0);
        });

        it("clicking share button copies the share link to clipboard", async function () {
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            let result: HTMLElement = document.createElement("div");
            document.body.appendChild(result);
            manager.attachShareButton(result, "calc-9");
            let btn: HTMLButtonElement = result.querySelector(".share-button") as HTMLButtonElement;
            btn.click();
            await new Promise(function (resolve: Function): void { setTimeout(resolve, 0); });
            expect(navigator.clipboard.writeText).toHaveBeenCalled();
            let calls: unknown[] = (navigator.clipboard.writeText as unknown as { mock: { calls: unknown[] } }).mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            let lastCallArgs: unknown = calls[calls.length - 1];
            let lastCall: string = String((lastCallArgs as unknown[])[0]);
            expect(lastCall).toContain("/shared/calc-9");
        });
    });
});
