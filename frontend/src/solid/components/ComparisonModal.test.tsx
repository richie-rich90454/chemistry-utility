import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {ComparisonManager} from "../../modules/comparisonManager.js";
import type {ComparisonItem} from "../../modules/comparisonManager.js";
const mocks = vi.hoisted(function () {
    return {
        "mockItems": vi.fn(),
        "mockIsModalOpen": vi.fn(),
        "mockCloseModal": vi.fn(),
        "mockAddToComparison": vi.fn(),
        "mockRemoveFromComparison": vi.fn(),
        "mockClearComparison": vi.fn(),
        "mockOpenModal": vi.fn()
    };
});
vi.mock("../stores/comparison", function () {
    return {
        "useComparison": function (): {
            "items": () => ComparisonItem[];
            "isModalOpen": () => boolean;
            "closeModal": () => void;
            "addToComparison": (id: string, data: unknown) => boolean;
            "removeFromComparison": (id: string) => void;
            "clearComparison": () => void;
            "openModal": () => void;
        } {
            return {
                "items": mocks.mockItems,
                "isModalOpen": mocks.mockIsModalOpen,
                "closeModal": mocks.mockCloseModal,
                "addToComparison": mocks.mockAddToComparison,
                "removeFromComparison": mocks.mockRemoveFromComparison,
                "clearComparison": mocks.mockClearComparison,
                "openModal": mocks.mockOpenModal
            };
        }
    };
});
import {ComparisonModal} from "./ComparisonModal";
function renderModal(): ReturnType<typeof render> {
    return render(function (): JSX.Element {
        return <ComparisonModal />;
    });
}
function dispatchEscape(): void {
    window.dispatchEvent(new KeyboardEvent("keydown", {"key": "Escape", "bubbles": true}));
}
describe("ComparisonModal", function (): void {
    beforeEach(function (): void {
        ComparisonManager.resetInstance();
        mocks.mockItems.mockReset();
        mocks.mockIsModalOpen.mockReset();
        mocks.mockCloseModal.mockReset();
        mocks.mockAddToComparison.mockReset();
        mocks.mockRemoveFromComparison.mockReset();
        mocks.mockClearComparison.mockReset();
        mocks.mockOpenModal.mockReset();
        mocks.mockItems.mockReturnValue([]);
        mocks.mockIsModalOpen.mockReturnValue(false);
    });
    afterEach(function (): void {
        cleanup();
        ComparisonManager.resetInstance();
        vi.restoreAllMocks();
    });
    it("renders nothing when modal is closed", function (): void {
        mocks.mockIsModalOpen.mockReturnValue(false);
        let result = renderModal();
        expect(result.queryByRole("dialog")).toBeNull();
    });
    it("renders modal content when open", function (): void {
        mocks.mockIsModalOpen.mockReturnValue(true);
        let result = renderModal();
        expect(result.getByRole("dialog")).toBeTruthy();
        expect(result.getByText("Comparison")).toBeTruthy();
    });
    it("renders empty message when no items", function (): void {
        mocks.mockIsModalOpen.mockReturnValue(true);
        mocks.mockItems.mockReturnValue([]);
        let result = renderModal();
        expect(result.getByText("Select calculations to compare.")).toBeTruthy();
    });
    it("renders single column view when one item is present", function (): void {
        mocks.mockIsModalOpen.mockReturnValue(true);
        let item: ComparisonItem = {"calculationId": "c1", "data": {"inputs": {"a": 1}, "result": {"value": 10}}};
        mocks.mockItems.mockReturnValue([item]);
        let result = renderModal();
        expect(result.getByText("Add one more calculation to compare.")).toBeTruthy();
        expect(result.getByText("Calculation 1")).toBeTruthy();
    });
    it("renders side-by-side table when two items are present", function (): void {
        mocks.mockIsModalOpen.mockReturnValue(true);
        let itemA: ComparisonItem = {"calculationId": "c1", "data": {"inputs": {"formula": "H2O", "temp": 25}, "result": {"mass": 18.015}}};
        let itemB: ComparisonItem = {"calculationId": "c2", "data": {"inputs": {"formula": "H2O", "temp": 30}, "result": {"mass": 18.015}}};
        mocks.mockItems.mockReturnValue([itemA, itemB]);
        let result = renderModal();
        expect(result.getByText("Field")).toBeTruthy();
        let headers: HTMLElement[] = result.getAllByText("Calculation 1");
        expect(headers.length).toBe(1);
        expect(result.getByText("Calculation 2")).toBeTruthy();
        expect(result.getByText("Difference")).toBeTruthy();
    });
    it("highlights same values with em dash and different values with percentage", function (): void {
        mocks.mockIsModalOpen.mockReturnValue(true);
        let itemA: ComparisonItem = {"calculationId": "c1", "data": {"result": {"value": 100}}};
        let itemB: ComparisonItem = {"calculationId": "c2", "data": {"result": {"value": 150}}};
        mocks.mockItems.mockReturnValue([itemA, itemB]);
        let result = renderModal();
        let rows: HTMLElement[] = result.container.querySelectorAll("tbody tr");
        expect(rows.length).toBe(1);
        let cells: HTMLElement[] = rows[0].querySelectorAll("td");
        expect(cells[3].textContent).toBe("40.00%");
    });
    it("calls closeModal when close button is clicked", function (): void {
        mocks.mockIsModalOpen.mockReturnValue(true);
        let result = renderModal();
        let closeBtn = result.getByRole("button", {"name": "Close comparison dialog"});
        fireEvent.click(closeBtn);
        expect(mocks.mockCloseModal).toHaveBeenCalled();
    });
    it("calls closeModal when backdrop is clicked", function (): void {
        mocks.mockIsModalOpen.mockReturnValue(true);
        let result = renderModal();
        let dialog = result.getByRole("dialog");
        fireEvent.click(dialog);
        expect(mocks.mockCloseModal).toHaveBeenCalled();
    });
    it("does not call closeModal when content is clicked", function (): void {
        mocks.mockIsModalOpen.mockReturnValue(true);
        let result = renderModal();
        let heading = result.getByText("Comparison");
        fireEvent.click(heading);
        expect(mocks.mockCloseModal).not.toHaveBeenCalled();
    });
    it("calls closeModal when Escape is pressed and modal is open", function (): void {
        mocks.mockIsModalOpen.mockReturnValue(true);
        renderModal();
        dispatchEscape();
        expect(mocks.mockCloseModal).toHaveBeenCalled();
    });
    it("does not call closeModal when Escape is pressed and modal is closed", function (): void {
        mocks.mockIsModalOpen.mockReturnValue(false);
        renderModal();
        dispatchEscape();
        expect(mocks.mockCloseModal).not.toHaveBeenCalled();
    });
});
