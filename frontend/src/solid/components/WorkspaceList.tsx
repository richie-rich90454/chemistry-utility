import type {JSX} from "solid-js";
import {onMount, For, Show} from "solid-js";
import {useWorkspace} from "../stores/workspace";
import styles from "./WorkspaceList.module.css";
function WorkspaceList(): JSX.Element {
    let store = useWorkspace();
    onMount(function (): void {
        void store.refresh();
    });
    function handleCreate(): void {
        let name: string | null = window.prompt("Workspace name");
        if (!name) {
            return;
        }
        let description: string = window.prompt("Workspace description") || "";
        void store.createWorkspace(name, description);
    }
    function handleItemClick(e: MouseEvent): void {
        let target = e.currentTarget as HTMLElement;
        let id: string | null = target.getAttribute("data-workspace-id");
        if (id !== null) {
            void store.selectWorkspace(id);
        }
    }
    function handleItemKeyDown(e: KeyboardEvent): void {
        if (e.key !== "Enter" && e.key !== " ") {
            return;
        }
        e.preventDefault();
        let target = e.currentTarget as HTMLElement;
        let id: string | null = target.getAttribute("data-workspace-id");
        if (id !== null) {
            void store.selectWorkspace(id);
        }
    }
    return (
        <section class={styles.section} aria-label="Workspaces">
            <div class={styles.header}>
                <span class={styles.title}>
                    <svg class={styles.titleIcon} aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                    </svg>
                    Workspaces
                </span>
                <button class={styles.createBtn} type="button" aria-label="Create workspace" onClick={handleCreate}>+</button>
            </div>
            <ul class={styles.list}>
                <Show when={store.workspaces().length > 0} fallback={<li class={styles.empty}>No workspaces yet.</li>}>
                    <For each={store.workspaces()}>
                        {(ws) => (
                            <li
                                class={styles.item}
                                role="button"
                                tabindex="0"
                                data-workspace-id={ws.id}
                                onClick={handleItemClick}
                                onKeyDown={handleItemKeyDown}
                            >
                                <span class={styles.name}>{ws.name}</span>
                                <span class={styles.count}>{ws.memberCount} members</span>
                            </li>
                        )}
                    </For>
                </Show>
            </ul>
        </section>
    );
}
export {WorkspaceList};
