import type {JSX} from "solid-js";
import {createSignal, onCleanup, onMount} from "solid-js";
import {useNavSheet} from "../stores/navSheet";
import {NavigationManager} from "../../modules/navigationManager.js";
import {isDesktop, isDesktopOnlyId} from "../lib/desktopOnly";
import {ThemeToggle} from "./ThemeToggle";
import styles from "./MobileBottomTabs.module.css";

let nameById: Map<string, string> = new Map();

function MobileBottomTabs(): JSX.Element {
    let sheet = useNavSheet();
    let [activeName, setActiveName] = createSignal("");

    onMount(function (): void {
        if (nameById.size === 0) {
            let nav = NavigationManager.getInstance();
            for (let calc of nav.getCalculators()) {
                nameById.set(calc.id, calc.name);
            }
        }
        updateActiveName();

        let popListener = function (): void {
            updateActiveName();
        };
        window.addEventListener("popstate", popListener);

        let nav = NavigationManager.getInstance();
        let navListener = function (id: string | null): void {
            if (id !== null) {
                setActiveName(nameById.get(id) ?? "");
            }
        };
        nav.subscribe(navListener);

        onCleanup(function (): void {
            window.removeEventListener("popstate", popListener);
            nav.unsubscribe(navListener);
        });
    });

    function updateActiveName(): void {
        let pathname = window.location.pathname;
        let id = pathname.replace(/^\//, "");
        if (id === "") {
            id = "dashboard";
        }
        if (!isDesktop() && isDesktopOnlyId(id)) {
            setActiveName("Chemistry Utility");
            return;
        }
        setActiveName(nameById.get(id) ?? "Chemistry Utility");
    }

    function handleMenu(): void {
        sheet.open();
    }

    return (
        <header class={styles.topBanner} aria-label="Navigation">
            <button type="button" class={styles.menuBtn} aria-label="Open navigation menu" onClick={handleMenu}>
                <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
                    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
            </button>
            <span class={styles.toolName}>{activeName()}</span>
            <ThemeToggle />
        </header>
    );
}

export {MobileBottomTabs};
