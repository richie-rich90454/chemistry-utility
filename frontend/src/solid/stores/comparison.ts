import {createSignal} from "solid-js";
import {ComparisonManager} from "../../modules/comparisonManager.js";
import type {ComparisonItem} from "../../modules/comparisonManager.js";
interface ComparisonStore {
    items: () => ComparisonItem[];
    isModalOpen: () => boolean;
    addToComparison: (calculationId: string, data: unknown) => boolean;
    removeFromComparison: (calculationId: string) => void;
    clearComparison: () => void;
    openModal: () => void;
    closeModal: () => void;
}
let [items, setItems] = createSignal<ComparisonItem[]>([]);
let [isModalOpen, setIsModalOpen] = createSignal(false);
function syncItems(): void {
    let manager = ComparisonManager.getInstance();
    setItems(manager.getItems());
}
function addToComparison(calculationId: string, data: unknown): boolean {
    let manager = ComparisonManager.getInstance();
    let added: boolean = manager.addToComparison(calculationId, data);
    if (added) {
        syncItems();
        if (manager.getCount() === 2) {
            setIsModalOpen(true);
        }
    }
    return added;
}
function removeFromComparison(calculationId: string): void {
    let manager = ComparisonManager.getInstance();
    manager.removeFromComparison(calculationId);
    syncItems();
}
function clearComparison(): void {
    let manager = ComparisonManager.getInstance();
    manager.clearComparison();
    syncItems();
    setIsModalOpen(false);
}
function openModal(): void {
    setIsModalOpen(true);
}
function closeModal(): void {
    setIsModalOpen(false);
}
function useComparison(): ComparisonStore {
    return {
        items: items,
        isModalOpen: isModalOpen,
        addToComparison: addToComparison,
        removeFromComparison: removeFromComparison,
        clearComparison: clearComparison,
        openModal: openModal,
        closeModal: closeModal
    };
}
export {useComparison};
