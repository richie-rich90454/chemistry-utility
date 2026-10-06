import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import type {Workspace, WorkspaceMember, SharedCalculation} from "../../modules/workspaceManager.js";
const mocks = vi.hoisted(function () {
    return {
        "mockRefresh": vi.fn(),
        "mockWorkspaces": vi.fn(),
        "mockCurrentWorkspace": vi.fn(),
        "mockCurrentMembers": vi.fn(),
        "mockCurrentCalculations": vi.fn(),
        "mockLoading": vi.fn(),
        "mockError": vi.fn(),
        "mockCreateWorkspace": vi.fn(),
        "mockSelectWorkspace": vi.fn(),
        "mockUpdateWorkspace": vi.fn(),
        "mockDeleteWorkspace": vi.fn(),
        "mockAddMember": vi.fn(),
        "mockRemoveMember": vi.fn()
    };
});
vi.mock("../stores/workspace", function () {
    return {
        "useWorkspace": function (): {
            "workspaces": () => Workspace[];
            "currentWorkspace": () => Workspace | null;
            "currentMembers": () => WorkspaceMember[];
            "currentCalculations": () => SharedCalculation[];
            "loading": () => boolean;
            "error": () => string;
            "refresh": () => Promise<void>;
            "createWorkspace": (name: string, description: string) => Promise<void>;
            "selectWorkspace": (id: string) => Promise<void>;
            "updateWorkspace": (id: string, name: string, description: string) => Promise<void>;
            "deleteWorkspace": (id: string) => Promise<void>;
            "addMember": (workspaceId: string, userId: string, role: string) => Promise<void>;
            "removeMember": (workspaceId: string, userId: string) => Promise<void>;
        } {
            return {
                "workspaces": mocks.mockWorkspaces,
                "currentWorkspace": mocks.mockCurrentWorkspace,
                "currentMembers": mocks.mockCurrentMembers,
                "currentCalculations": mocks.mockCurrentCalculations,
                "loading": mocks.mockLoading,
                "error": mocks.mockError,
                "refresh": mocks.mockRefresh,
                "createWorkspace": mocks.mockCreateWorkspace,
                "selectWorkspace": mocks.mockSelectWorkspace,
                "updateWorkspace": mocks.mockUpdateWorkspace,
                "deleteWorkspace": mocks.mockDeleteWorkspace,
                "addMember": mocks.mockAddMember,
                "removeMember": mocks.mockRemoveMember
            };
        }
    };
});
import {WorkspaceList} from "./WorkspaceList";
function makeWorkspace(id: string, name: string, memberCount: number): Workspace {
    return {
        "id": id,
        "name": name,
        "description": "",
        "ownerId": "local-user",
        "memberCount": memberCount,
        "createdAt": "2026-07-01T00:00:00Z",
        "updatedAt": "2026-07-02T00:00:00Z"
    };
}
function renderWorkspaceList(): ReturnType<typeof render> {
    return render(function (): JSX.Element {
        return <WorkspaceList />;
    });
}
describe("WorkspaceList", function (): void {
    let promptSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        promptSpy = vi.spyOn(window, "prompt");
        mocks.mockRefresh.mockReset();
        mocks.mockWorkspaces.mockReset();
        mocks.mockCurrentWorkspace.mockReset();
        mocks.mockCurrentMembers.mockReset();
        mocks.mockCurrentCalculations.mockReset();
        mocks.mockLoading.mockReset();
        mocks.mockError.mockReset();
        mocks.mockCreateWorkspace.mockReset();
        mocks.mockSelectWorkspace.mockReset();
        mocks.mockUpdateWorkspace.mockReset();
        mocks.mockDeleteWorkspace.mockReset();
        mocks.mockAddMember.mockReset();
        mocks.mockRemoveMember.mockReset();
        mocks.mockRefresh.mockResolvedValue(undefined);
        mocks.mockWorkspaces.mockReturnValue([]);
        mocks.mockCurrentWorkspace.mockReturnValue(null);
        mocks.mockCurrentMembers.mockReturnValue([]);
        mocks.mockCurrentCalculations.mockReturnValue([]);
        mocks.mockLoading.mockReturnValue(false);
        mocks.mockError.mockReturnValue("");
        mocks.mockCreateWorkspace.mockResolvedValue(undefined);
        mocks.mockSelectWorkspace.mockResolvedValue(undefined);
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("renders the Workspaces section with aria-label", function (): void {
        let result = renderWorkspaceList();
        let section = result.getByRole("region", {"name": "Workspaces"});
        expect(section).toBeTruthy();
    });
    it("renders the Workspaces title heading", function (): void {
        let result = renderWorkspaceList();
        expect(result.getByText("Workspaces")).toBeTruthy();
    });
    it("renders the create workspace button with accessible label", function (): void {
        let result = renderWorkspaceList();
        let button = result.getByRole("button", {"name": "Create workspace"});
        expect(button).toBeTruthy();
        expect(button.textContent).toBe("+");
    });
    it("calls refresh on mount", function (): void {
        renderWorkspaceList();
        expect(mocks.mockRefresh).toHaveBeenCalled();
    });
    it("renders empty state when no workspaces exist", function (): void {
        mocks.mockWorkspaces.mockReturnValue([]);
        let result = renderWorkspaceList();
        expect(result.getByText("No workspaces yet.")).toBeTruthy();
    });
    it("renders workspace items with name and member count", function (): void {
        mocks.mockWorkspaces.mockReturnValue([
            makeWorkspace("ws-1", "Lab A", 3),
            makeWorkspace("ws-2", "Lab B", 1)
        ]);
        let result = renderWorkspaceList();
        expect(result.getByText("Lab A")).toBeTruthy();
        expect(result.getByText("Lab B")).toBeTruthy();
        expect(result.getByText("3 members")).toBeTruthy();
        expect(result.getByText("1 members")).toBeTruthy();
    });
    it("does not render empty state when workspaces exist", function (): void {
        mocks.mockWorkspaces.mockReturnValue([makeWorkspace("ws-1", "Lab A", 1)]);
        let result = renderWorkspaceList();
        expect(result.queryByText("No workspaces yet.")).toBeNull();
    });
    it("calls selectWorkspace when a workspace item is clicked", function (): void {
        mocks.mockWorkspaces.mockReturnValue([makeWorkspace("ws-1", "Lab A", 2)]);
        let result = renderWorkspaceList();
        let item = result.getByText("Lab A").closest("li") as HTMLElement;
        fireEvent.click(item);
        expect(mocks.mockSelectWorkspace).toHaveBeenCalledWith("ws-1");
    });
    it("calls selectWorkspace when Enter is pressed on a focused item", function (): void {
        mocks.mockWorkspaces.mockReturnValue([makeWorkspace("ws-1", "Lab A", 2)]);
        let result = renderWorkspaceList();
        let item = result.getByText("Lab A").closest("li") as HTMLElement;
        fireEvent.keyDown(item, {"key": "Enter"});
        expect(mocks.mockSelectWorkspace).toHaveBeenCalledWith("ws-1");
    });
    it("calls selectWorkspace when Space is pressed on a focused item", function (): void {
        mocks.mockWorkspaces.mockReturnValue([makeWorkspace("ws-1", "Lab A", 2)]);
        let result = renderWorkspaceList();
        let item = result.getByText("Lab A").closest("li") as HTMLElement;
        fireEvent.keyDown(item, {"key": " "});
        expect(mocks.mockSelectWorkspace).toHaveBeenCalledWith("ws-1");
    });
    it("does not call selectWorkspace when other keys are pressed", function (): void {
        mocks.mockWorkspaces.mockReturnValue([makeWorkspace("ws-1", "Lab A", 2)]);
        let result = renderWorkspaceList();
        let item = result.getByText("Lab A").closest("li") as HTMLElement;
        fireEvent.keyDown(item, {"key": "Tab"});
        expect(mocks.mockSelectWorkspace).not.toHaveBeenCalled();
    });
    it("does not call createWorkspace when prompt is cancelled", function (): void {
        promptSpy.mockReturnValue(null);
        let result = renderWorkspaceList();
        let button = result.getByRole("button", {"name": "Create workspace"});
        fireEvent.click(button);
        expect(mocks.mockCreateWorkspace).not.toHaveBeenCalled();
    });
    it("does not call createWorkspace when name is empty", function (): void {
        promptSpy.mockReturnValueOnce("").mockReturnValueOnce("");
        let result = renderWorkspaceList();
        let button = result.getByRole("button", {"name": "Create workspace"});
        fireEvent.click(button);
        expect(mocks.mockCreateWorkspace).not.toHaveBeenCalled();
    });
    it("calls createWorkspace with name and description from prompts", function (): void {
        promptSpy.mockReturnValueOnce("New Lab").mockReturnValueOnce("desc");
        let result = renderWorkspaceList();
        let button = result.getByRole("button", {"name": "Create workspace"});
        fireEvent.click(button);
        expect(mocks.mockCreateWorkspace).toHaveBeenCalledWith("New Lab", "desc");
    });
    it("uses empty string description when description prompt is cancelled", function (): void {
        promptSpy.mockReturnValueOnce("Named").mockReturnValueOnce(null);
        let result = renderWorkspaceList();
        let button = result.getByRole("button", {"name": "Create workspace"});
        fireEvent.click(button);
        expect(mocks.mockCreateWorkspace).toHaveBeenCalledWith("Named", "");
    });
    it("sets role=button and tabindex=0 on workspace items for accessibility", function (): void {
        mocks.mockWorkspaces.mockReturnValue([makeWorkspace("ws-1", "Lab A", 2)]);
        let result = renderWorkspaceList();
        let item = result.getByText("Lab A").closest("li") as HTMLElement;
        expect(item.getAttribute("role")).toBe("button");
        expect(item.getAttribute("tabindex")).toBe("0");
        expect(item.getAttribute("data-workspace-id")).toBe("ws-1");
    });
    it("does not call selectWorkspace when clicked item has no workspace id", function (): void {
        mocks.mockWorkspaces.mockReturnValue([makeWorkspace("ws-1", "Lab A", 2)]);
        let result = renderWorkspaceList();
        let item = result.getByText("Lab A").closest("li") as HTMLElement;
        item.removeAttribute("data-workspace-id");
        fireEvent.click(item);
        expect(mocks.mockSelectWorkspace).not.toHaveBeenCalled();
    });
    it("does not call selectWorkspace when keydown item has no workspace id", function (): void {
        mocks.mockWorkspaces.mockReturnValue([makeWorkspace("ws-1", "Lab A", 2)]);
        let result = renderWorkspaceList();
        let item = result.getByText("Lab A").closest("li") as HTMLElement;
        item.removeAttribute("data-workspace-id");
        fireEvent.keyDown(item, {"key": "Enter"});
        expect(mocks.mockSelectWorkspace).not.toHaveBeenCalled();
    });
});
