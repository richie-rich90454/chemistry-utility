import type {JSX} from "solid-js";
import {createSignal, onMount, Show} from "solid-js";
import {useResultAnnotation} from "../stores/resultAnnotation";
import styles from "./ResultAnnotation.module.css";
interface ResultAnnotationProps {
    resultId: string;
}
function ResultAnnotation(props: ResultAnnotationProps): JSX.Element {
    let store = useResultAnnotation();
    let [note, setNote] = createSignal("");
    let [saved, setSaved] = createSignal(false);
    onMount(function (): void {
        store.loadAnnotation(props.resultId);
        setNote(store.currentNote());
    });
    function handleNoteInput(e: InputEvent): void {
        let target = e.currentTarget as HTMLTextAreaElement;
        setNote(target.value);
        setSaved(false);
    }
    function handleSave(): void {
        void store.saveAnnotation(props.resultId, note(), store.currentFavorite());
        setSaved(true);
    }
    function handleToggleFavorite(): void {
        store.toggleFavorite(props.resultId);
    }
    return (
        <div class={styles.annotation}>
            <button
                type="button"
                class={styles.favoriteToggle}
                aria-label="Toggle favorite"
                aria-pressed={store.currentFavorite()}
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
