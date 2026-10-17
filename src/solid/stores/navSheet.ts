import {createSignal} from "solid-js";
let [isOpen, setIsOpen] = createSignal(false);
function open(): void {
    setIsOpen(true);
}
function close(): void {
    setIsOpen(false);
}
function toggle(): void {
    setIsOpen(!isOpen());
}
function reset(): void {
    setIsOpen(false);
}
interface NavSheetStore {
    isOpen: () => boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}
function useNavSheet(): NavSheetStore {
    return {
        isOpen: isOpen,
        open: open,
        close: close,
        toggle: toggle
    };
}
export {useNavSheet, reset};
