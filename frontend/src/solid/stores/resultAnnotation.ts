import {createSignal} from "solid-js";
import {ResultAnnotationManager} from "../../modules/resultAnnotation.js";
interface ResultAnnotationStore {
    currentNote: () => string;
    currentFavorite: () => boolean;
    loadAnnotation: (resultId: string) => void;
    saveAnnotation: (resultId: string, note: string, favorite: boolean) => Promise<void>;
    removeAnnotation: (resultId: string) => void;
    toggleFavorite: (resultId: string) => boolean;
}
let [currentNote, setCurrentNote] = createSignal("");
let [currentFavorite, setCurrentFavorite] = createSignal(false);
function loadAnnotation(resultId: string): void {
    let manager = ResultAnnotationManager.getInstance();
    setCurrentNote(manager.loadAnnotation(resultId));
    setCurrentFavorite(manager.isStarred(resultId));
}
async function saveAnnotation(resultId: string, note: string, favorite: boolean): Promise<void> {
    let manager = ResultAnnotationManager.getInstance();
    await manager.saveAnnotation(resultId, note);
    let isCurrentlyStarred: boolean = manager.isStarred(resultId);
    if (isCurrentlyStarred !== favorite) {
        manager.toggleStar(resultId);
    }
    setCurrentNote(note);
    setCurrentFavorite(favorite);
}
function removeAnnotation(resultId: string): void {
    let manager = ResultAnnotationManager.getInstance();
    void manager.saveAnnotation(resultId, "");
    if (manager.isStarred(resultId)) {
        manager.toggleStar(resultId);
    }
    setCurrentNote("");
    setCurrentFavorite(false);
}
function toggleFavorite(resultId: string): boolean {
    let manager = ResultAnnotationManager.getInstance();
    let next: boolean = manager.toggleStar(resultId);
    setCurrentFavorite(next);
    return next;
}
function useResultAnnotation(): ResultAnnotationStore {
    return {
        currentNote: currentNote,
        currentFavorite: currentFavorite,
        loadAnnotation: loadAnnotation,
        saveAnnotation: saveAnnotation,
        removeAnnotation: removeAnnotation,
        toggleFavorite: toggleFavorite
    };
}
export {useResultAnnotation};
