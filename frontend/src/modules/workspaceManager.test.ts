import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();
const mockAuthSubscribe = vi.fn();
const mockAuthGetState = vi.fn();

vi.mock("./apiClient.js", function () {
    return {
        ApiClient: {
            getInstance: function () {
                return {
                    "get": mockGet,
                    "post": mockPost,
                    "patch": mockPatch,
                    "delete": mockDelete
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

import { WorkspaceManager, Workspace, WorkspaceMember, SharedCalculation } from "./workspaceManager.js";
import { ApiError } from "./apiClient.js";

function unauthenticatedState(): { isAuthenticated: boolean; user: unknown; accessToken: unknown; refreshToken: unknown } {
    return {
        "isAuthenticated": false,
        "user": null,
        "accessToken": null,
        "refreshToken": null
    };
}

function authenticatedState(userId: string): { isAuthenticated: boolean; user: unknown; accessToken: unknown; refreshToken: unknown } {
    return {
        "isAuthenticated": true,
        "user": {
            "id": userId,
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

describe("WorkspaceManager", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        WorkspaceManager.resetInstance();
        mockGet.mockReset();
        mockPost.mockReset();
        mockPatch.mockReset();
        mockDelete.mockReset();
        mockAuthSubscribe.mockReset();
        mockAuthGetState.mockReset();
        mockAuthSubscribe.mockReturnValue(function () { return; });
        mockAuthGetState.mockReturnValue(unauthenticatedState());
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        WorkspaceManager.resetInstance();
        vi.restoreAllMocks();
    });

    function setupDOM(): void {
        let main: HTMLElement = document.createElement("main");
        main.id = "main-content";
        main.className = "app-view";
        let sidebar: HTMLElement = document.createElement("aside");
        sidebar.className = "sidebar";
        let authSection: HTMLElement = document.createElement("div");
        authSection.id = "sidebar-auth-section";
        sidebar.appendChild(authSection);
        document.body.appendChild(sidebar);
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
            let authSection: HTMLElement | null = document.getElementById("sidebar-auth-section");
            if (authSection && authSection.parentNode) {
                authSection.parentNode.appendChild(existing);
            }
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let found: HTMLElement | null = document.getElementById("sidebar-workspaces");
            expect(found).toBe(existing);
        });

        it("should subscribe to AuthManager", function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            expect(mockAuthSubscribe).toHaveBeenCalled();
        });

        it("should not re-initialize on second call", function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            manager.init();
            expect(mockAuthSubscribe).toHaveBeenCalledTimes(1);
        });

        it("should hide sidebar when not authenticated", function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(unauthenticatedState());
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let sidebar: HTMLElement = document.getElementById("sidebar-workspaces") as HTMLElement;
            expect(sidebar.style.display).toBe("none");
        });

        it("should show sidebar when authenticated", function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let sidebar: HTMLElement = document.getElementById("sidebar-workspaces") as HTMLElement;
            expect(sidebar.style.display).toBe("block");
        });
    });

    describe("loadWorkspaces", function () {
        it("should GET /api/v1/workspaces and render the list", async function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let workspaces: Workspace[] = [makeWorkspace("ws-1", "u1", 3), makeWorkspace("ws-2", "u1", 1)];
            mockGet.mockResolvedValue({ "workspaces": workspaces });
            let result: Workspace[] = await manager.loadWorkspaces();
            expect(mockGet).toHaveBeenCalledWith("/api/v1/workspaces");
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
            mockGet.mockResolvedValue({ "workspaces": [] });
            await manager.loadWorkspaces();
            let list: HTMLElement | null = document.querySelector(".workspace-list");
            expect(list).not.toBeNull();
            if (list) {
                expect(list.textContent).toContain("No workspaces yet.");
            }
        });
    });

    describe("createWorkspace", function () {
        it("should POST /api/v1/workspaces and refresh list", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let created: Workspace = makeWorkspace("ws-new", "u1", 1);
            mockPost.mockResolvedValue(created);
            mockGet.mockResolvedValue({ "workspaces": [created] });
            let result: Workspace = await manager.createWorkspace("New Lab", "description");
            expect(mockPost).toHaveBeenCalledWith("/api/v1/workspaces", { "name": "New Lab", "description": "description" });
            expect(result.id).toBe("ws-new");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/workspaces");
        });

        it("should still return workspace when list refresh fails", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let created: Workspace = makeWorkspace("ws-new", "u1", 1);
            mockPost.mockResolvedValue(created);
            mockGet.mockRejectedValue(new Error("network"));
            let result: Workspace = await manager.createWorkspace("New Lab", "description");
            expect(result.id).toBe("ws-new");
        });
    });

    describe("selectWorkspace", function () {
        it("should GET workspace, render detail, and load members + calculations", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let ws: Workspace = makeWorkspace("ws-1", "u1", 2);
            mockGet.mockImplementation(function (path: string) {
                if (path === "/api/v1/workspaces/ws-1") {
                    return Promise.resolve(ws);
                }
                if (path === "/api/v1/workspaces/ws-1/members") {
                    return Promise.resolve({ "members": [makeMember("u2", "member")] });
                }
                if (path === "/api/v1/workspaces/ws-1/calculations") {
                    return Promise.resolve({ "calculations": [makeCalculation("c1")] });
                }
                return Promise.reject(new Error("not found"));
            });
            let result: Workspace = await manager.selectWorkspace("ws-1");
            expect(result.id).toBe("ws-1");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/workspaces/ws-1");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/workspaces/ws-1/members");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/workspaces/ws-1/calculations");
            expect(manager.isDetailViewVisible()).toBe(true);
            let current: Workspace | null = manager.getCurrentWorkspace();
            expect(current).not.toBeNull();
            if (current) {
                expect(current.id).toBe("ws-1");
            }
            let detail: HTMLElement | null = document.getElementById("workspace-view");
            expect(detail).not.toBeNull();
            if (detail) {
                expect(detail.textContent).toContain("Workspace ws-1");
                expect(detail.textContent).toContain("Members");
                expect(detail.textContent).toContain("Shared Calculations");
            }
        });

        it("should still render detail when members fetch fails", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let ws: Workspace = makeWorkspace("ws-1", "u1", 2);
            mockGet.mockImplementation(function (path: string) {
                if (path === "/api/v1/workspaces/ws-1") {
                    return Promise.resolve(ws);
                }
                if (path === "/api/v1/workspaces/ws-1/members") {
                    return Promise.reject(new Error("network"));
                }
                if (path === "/api/v1/workspaces/ws-1/calculations") {
                    return Promise.resolve({ "calculations": [] });
                }
                return Promise.reject(new Error("not found"));
            });
            await manager.selectWorkspace("ws-1");
            expect(manager.isDetailViewVisible()).toBe(true);
        });
    });

    describe("updateWorkspace", function () {
        it("should PATCH the workspace and refresh the list", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let updated: Workspace = makeWorkspace("ws-1", "u1", 2);
            updated.name = "Renamed";
            mockPatch.mockResolvedValue(updated);
            mockGet.mockResolvedValue({ "workspaces": [updated] });
            let result: Workspace = await manager.updateWorkspace("ws-1", "Renamed", "desc");
            expect(mockPatch).toHaveBeenCalledWith("/api/v1/workspaces/ws-1", { "name": "Renamed", "description": "desc" });
            expect(result.name).toBe("Renamed");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/workspaces");
        });
    });

    describe("deleteWorkspace", function () {
        it("should DELETE the workspace and hide detail when current", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let ws: Workspace = makeWorkspace("ws-1", "u1", 2);
            mockGet.mockImplementation(function (path: string) {
                if (path === "/api/v1/workspaces/ws-1") {
                    return Promise.resolve(ws);
                }
                if (path === "/api/v1/workspaces/ws-1/members") {
                    return Promise.resolve({ "members": [] });
                }
                if (path === "/api/v1/workspaces/ws-1/calculations") {
                    return Promise.resolve({ "calculations": [] });
                }
                if (path === "/api/v1/workspaces") {
                    return Promise.resolve({ "workspaces": [] });
                }
                return Promise.reject(new Error("not found"));
            });
            mockDelete.mockResolvedValue(undefined);
            await manager.selectWorkspace("ws-1");
            expect(manager.isDetailViewVisible()).toBe(true);
            await manager.deleteWorkspace("ws-1");
            expect(mockDelete).toHaveBeenCalledWith("/api/v1/workspaces/ws-1");
            expect(manager.isDetailViewVisible()).toBe(false);
            expect(manager.getCurrentWorkspace()).toBeNull();
        });

        it("should still complete when list refresh fails", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            mockDelete.mockResolvedValue(undefined);
            mockGet.mockRejectedValue(new Error("network"));
            await manager.deleteWorkspace("ws-x");
            expect(mockDelete).toHaveBeenCalledWith("/api/v1/workspaces/ws-x");
        });
    });

    describe("loadMembers", function () {
        it("should GET members and render them", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let members: WorkspaceMember[] = [makeMember("u2", "member"), makeMember("u3", "admin")];
            mockGet.mockResolvedValue({ "members": members });
            let result: WorkspaceMember[] = await manager.loadMembers("ws-1");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/workspaces/ws-1/members");
            expect(result.length).toBe(2);
            expect(manager.getCurrentMembers().length).toBe(2);
        });
    });

    describe("addMember", function () {
        it("should POST member and refresh member list", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let added: WorkspaceMember = makeMember("u2", "member");
            mockPost.mockResolvedValue(added);
            mockGet.mockResolvedValue({ "members": [added] });
            let result: WorkspaceMember = await manager.addMember("ws-1", "u2", "member");
            expect(mockPost).toHaveBeenCalledWith("/api/v1/workspaces/ws-1/members", { "userId": "u2", "role": "member" });
            expect(result.userId).toBe("u2");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/workspaces/ws-1/members");
        });
    });

    describe("removeMember", function () {
        it("should DELETE member and refresh member list", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            mockDelete.mockResolvedValue(undefined);
            mockGet.mockResolvedValue({ "members": [] });
            await manager.removeMember("ws-1", "u2");
            expect(mockDelete).toHaveBeenCalledWith("/api/v1/workspaces/ws-1/members/u2");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/workspaces/ws-1/members");
        });
    });

    describe("loadWorkspaceCalculations", function () {
        it("should GET calculations and render them", async function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let calcs: SharedCalculation[] = [makeCalculation("c1"), makeCalculation("c2")];
            mockGet.mockResolvedValue({ "calculations": calcs });
            let result: SharedCalculation[] = await manager.loadWorkspaceCalculations("ws-1");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/workspaces/ws-1/calculations");
            expect(result.length).toBe(2);
            expect(manager.getCurrentCalculations().length).toBe(2);
        });
    });

    describe("render methods", function () {
        let manager: WorkspaceManager;

        beforeEach(function () {
            setupDOM();
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            manager = WorkspaceManager.getInstance();
            manager.init();
        });

        it("renderWorkspaceList renders clickable items with member count", function () {
            manager.renderWorkspaceList([makeWorkspace("ws-a", "u1", 5)]);
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
            let ws: Workspace = makeWorkspace("ws-1", "u1", 2);
            manager.renderWorkspaceDetail(ws);
            let detail: HTMLElement = document.getElementById("workspace-view") as HTMLElement;
            expect(detail.textContent).toContain("Workspace ws-1");
            expect(detail.querySelector(".workspace-detail-description")).not.toBeNull();
            expect(detail.querySelector(".workspace-export-pdf-btn")).not.toBeNull();
        });

        it("renderWorkspaceDetail shows delete button only for owner", function () {
            let ws: Workspace = makeWorkspace("ws-1", "owner-x", 2);
            manager.renderWorkspaceDetail(ws);
            let detail: HTMLElement = document.getElementById("workspace-view") as HTMLElement;
            expect(detail.querySelector(".workspace-delete-btn")).toBeNull();
        });

        it("renderWorkspaceDetail shows delete button when current user is owner", function () {
            let ws: Workspace = makeWorkspace("ws-1", "u1", 2);
            manager.renderWorkspaceDetail(ws);
            let detail: HTMLElement = document.getElementById("workspace-view") as HTMLElement;
            expect(detail.querySelector(".workspace-delete-btn")).not.toBeNull();
        });

        it("renderMembers renders member list with roles", function () {
            manager.renderMembers([makeMember("u2", "admin")]);
            let container: HTMLElement | null = document.querySelector(".workspace-members");
            expect(container).not.toBeNull();
            if (container) {
                expect(container.textContent).toContain("Member u2");
                expect(container.textContent).toContain("admin");
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

    describe("auth state handling", function () {
        it("should hide sidebar and detail when auth state changes to unauthenticated", function () {
            setupDOM();
            let subscribedCallback: Function | null = null;
            mockAuthSubscribe.mockImplementation(function (cb: Function): Function {
                subscribedCallback = cb;
                return function () { return; };
            });
            mockAuthGetState.mockReturnValue(authenticatedState("u1"));
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let sidebar: HTMLElement = document.getElementById("sidebar-workspaces") as HTMLElement;
            expect(sidebar.style.display).toBe("block");
            expect(subscribedCallback).not.toBeNull();
            if (!subscribedCallback) {
                throw new Error("subscribe callback was not registered");
            }
            let cb: Function = subscribedCallback;
            cb(unauthenticatedState());
            expect(sidebar.style.display).toBe("none");
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
            await vi.waitFor(function () {
                expect(navigator.clipboard.writeText).toHaveBeenCalled();
            });
            let calls: unknown[] = vi.mocked(navigator.clipboard.writeText).mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            let lastCallArgs: unknown = calls[calls.length - 1];
            let lastCall: string = String((lastCallArgs as unknown[])[0]);
            expect(lastCall).toContain("/shared/calc-9");
        });
    });

    describe("error handling", function () {
        it("loadWorkspaces propagates ApiError", async function () {
            setupDOM();
            let manager: WorkspaceManager = WorkspaceManager.getInstance();
            manager.init();
            let apiError: ApiError = new ApiError(500, "about:blank", "Server error");
            mockGet.mockRejectedValue(apiError);
            await expect(manager.loadWorkspaces()).rejects.toThrow();
        });
    });
});
