import type {JSX} from "solid-js";
import {createSignal, onMount, Show} from "solid-js";
import {ResultAnnotationManager} from "../../modules/resultAnnotation.js";
import styles from "./ResultAnnotation.module.css";
interface ResultAnnotationProps {
    resultId: string;
}
function ResultAnnotation(props: ResultAnnotationProps): JSX.Element {
    let manager = ResultAnnotationManager.getInstance();
    let [note, setNote] = createSignal("");
    let [favorite, setFavorite] = createSignal(false);
    let [saved, setSaved] = createSignal(false);
    onMount(function (): void {
        setNote(manager.loadAnnotation(props.resultId));
        setFavorite(manager.isStarred(props.resultId));
    });
    function handleNoteInput(e: InputEvent): void {
        let target = e.currentTarget as HTMLTextAreaElement;
        setNote(target.value);
        setSaved(false);
    }
    function handleSave(): void {
        void manager.saveAnnotation(props.resultId, note());
        setSaved(true);
    }
    function handleToggleFavorite(): void {
        let next: boolean = manager.toggleStar(props.resultId);
        setFavorite(next);
    }
    return (
        <div class={styles.annotation}>
            <button
                type="button"
                class={styles.favoriteToggle}
                aria-label="Toggle favorite"
                aria-pressed={favorite()}
                onClick={handleToggleFavorite}
            >
                <span aria-hidden="true">{"\u2605"}</span>
            </button>
            <textarea
                class={styles.noteInput}
                placeholder="Add a note..."
                aria-label="Annotation note"
                value={note()}
                onInput={handleNoteInput}
            />
            <button type="button" class={styles.saveButton} onClick={handleSave}>Save</button>
            <Show when={saved()}>
                <span class={styles.savedIndicator} aria-live="polite">Saved</span>
            </Show>
        </div>
    );
}
export {ResultAnnotation};
