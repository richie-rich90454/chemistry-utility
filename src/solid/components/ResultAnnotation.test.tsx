import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
const mocks = vi.hoisted(function () {
    return {
        "mockCurrentNote": vi.fn(),
        "mockCurrentFavorite": vi.fn(),
        "mockLoadAnnotation": vi.fn(),
        "mockSaveAnnotation": vi.fn(),
        "mockRemoveAnnotation": vi.fn(),
        "mockToggleFavorite": vi.fn()
    };
});
vi.mock("../stores/resultAnnotation", function () {
    return {
        "useResultAnnotation": function (): {
            "currentNote": () => string;
            "currentFavorite": () => boolean;
            "loadAnnotation": (resultId: string) => void;
            "saveAnnotation": (resultId: string, note: string, favorite: boolean) => Promise<void>;
            "removeAnnotation": (resultId: string) => void;
            "toggleFavorite": (resultId: string) => boolean;
        } {
            return {
                "currentNote": mocks.mockCurrentNote,
                "currentFavorite": mocks.mockCurrentFavorite,
                "loadAnnotation": mocks.mockLoadAnnotation,
                "saveAnnotation": mocks.mockSaveAnnotation,
                "removeAnnotation": mocks.mockRemoveAnnotation,
                "toggleFavorite": mocks.mockToggleFavorite
            };
        }
    };
});
import {ResultAnnotation} from "./ResultAnnotation";
function renderAnnotation(resultId: string): ReturnType<typeof render> {
    return render(function (): JSX.Element {
        return <ResultAnnotation resultId={resultId} />;
    });
}
describe("ResultAnnotation", function (): void {
    beforeEach(function (): void {
        mocks.mockCurrentNote.mockReset();
        mocks.mockCurrentFavorite.mockReset();
        mocks.mockLoadAnnotation.mockReset();
        mocks.mockSaveAnnotation.mockReset();
        mocks.mockRemoveAnnotation.mockReset();
        mocks.mockToggleFavorite.mockReset();
        mocks.mockCurrentNote.mockReturnValue("");
        mocks.mockCurrentFavorite.mockReturnValue(false);
        mocks.mockSaveAnnotation.mockResolvedValue(undefined);
        mocks.mockToggleFavorite.mockReturnValue(true);
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("renders without crashing", function (): void {
        let result = renderAnnotation("calc-1");
        expect(result.getByRole("button", {"name": "Toggle favorite"})).toBeTruthy();
        expect(result.getByRole("textbox", {"name": "Annotation note"})).toBeTruthy();
        expect(result.getByRole("button", {"name": "Save"})).toBeTruthy();
    });
    it("loads existing annotation on mount", function (): void {
        mocks.mockCurrentNote.mockReturnValue("saved note");
        let result = renderAnnotation("calc-2");
        expect(mocks.mockLoadAnnotation).toHaveBeenCalledWith("calc-2");
        let textarea = result.getByRole("textbox", {"name": "Annotation note"}) as HTMLTextAreaElement;
        expect(textarea.value).toBe("saved note");
    });
    it("typing note and clicking save calls store saveAnnotation with note and favorite", function (): void {
        mocks.mockCurrentFavorite.mockReturnValue(true);
        let result = renderAnnotation("calc-4");
        let textarea = result.getByRole("textbox", {"name": "Annotation note"}) as HTMLTextAreaElement;
        fireEvent.input(textarea, {"target": {"value": "my note"}});
        let saveBtn = result.getByRole("button", {"name": "Save"});
        fireEvent.click(saveBtn);
        expect(mocks.mockSaveAnnotation).toHaveBeenCalledWith("calc-4", "my note", true);
    });
    it("clicking save shows Saved indicator", function (): void {
        let result = renderAnnotation("calc-5");
        expect(result.queryByText("Saved")).toBeNull();
        let saveBtn = result.getByRole("button", {"name": "Save"});
        fireEvent.click(saveBtn);
        expect(result.getByText("Saved")).toBeTruthy();
    });
    it("toggling favorite calls store toggleFavorite", function (): void {
        let result = renderAnnotation("calc-6");
        let favBtn = result.getByRole("button", {"name": "Toggle favorite"});
        fireEvent.click(favBtn);
        expect(mocks.mockToggleFavorite).toHaveBeenCalledWith("calc-6");
    });
    it("aria-pressed reflects currentFavorite state when false", function (): void {
        mocks.mockCurrentFavorite.mockReturnValue(false);
        let result = renderAnnotation("calc-7");
        let favBtn = result.getByRole("button", {"name": "Toggle favorite"});
        expect(favBtn.getAttribute("aria-pressed")).toBe("false");
    });
    it("aria-pressed reflects currentFavorite state when true", function (): void {
        mocks.mockCurrentFavorite.mockReturnValue(true);
        let result = renderAnnotation("calc-8");
        let favBtn = result.getByRole("button", {"name": "Toggle favorite"});
        expect(favBtn.getAttribute("aria-pressed")).toBe("true");
    });
    it("does not show Saved indicator before save is clicked", function (): void {
        let result = renderAnnotation("calc-9");
        expect(result.queryByText("Saved")).toBeNull();
    });
});
