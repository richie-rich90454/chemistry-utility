import {createSignal} from "solid-js";
let [isOpen, setIsOpen] = createSignal(false);
let [selectedIndex, setSelectedIndex] = createSignal(0);
function open(): void {
    setIsOpen(true);
    setSelectedIndex(0);
}
function close(): void {
    setIsOpen(false);
}
function toggle(): void {
    setIsOpen(!isOpen());
}
function moveSelection(direction: 1 | -1, max: number): void {
    if (max <= 0) {
        setSelectedIndex(0);
        return;
    }
    let next = selectedIndex() + direction;
    if (next < 0) {
        next = 0;
    }
    if (next > max - 1) {
        next = max - 1;
    }
    setSelectedIndex(next);
}
function reset(): void {
    setIsOpen(false);
    setSelectedIndex(0);
}
interface PaletteStore {
    isOpen: () => boolean;
    selectedIndex: () => number;
    open: () => void;
    close: () => void;
    toggle: () => void;
    setSelectedIndex: (index: number) => void;
    moveSelection: (direction: 1 | -1, max: number) => void;
}
function usePalette(): PaletteStore {
    return {
        isOpen: isOpen,
        selectedIndex: selectedIndex,
        open: open,
        close: close,
        toggle: toggle,
        setSelectedIndex: setSelectedIndex,
        moveSelection: moveSelection
    };
}
export {usePalette, reset};
