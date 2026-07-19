import type {JSX} from "solid-js";
import {For} from "solid-js";
import {A} from "@solidjs/router";
import {useNavSheet} from "../stores/navSheet";
import styles from "./MobileBottomTabs.module.css";
interface TabDef {
    label: string;
    href: string;
    ariaLabel: string;
}
const TABS: TabDef[] = [
    {label: "Elements", href: "/element-lookup", ariaLabel: "Element lookup"},
    {label: "Molar Mass", href: "/molar-mass", ariaLabel: "Molar mass calculator"},
    {label: "Balancer", href: "/equation-balancer", ariaLabel: "Equation balancer"},
    {label: "Dilution", href: "/dilution", ariaLabel: "Dilution calculator"}
];
function MobileBottomTabs(): JSX.Element {
    let sheet = useNavSheet();
    function handleMore(): void {
        sheet.open();
    }
    return (
        <nav class={styles.bottomTabs} aria-label="Quick access">
            <For each={TABS}>
                {(tab) => (
                    <A href={tab.href} class={styles.tabItem} activeClass={styles.active} aria-label={tab.ariaLabel}>
                        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="24" height="24">
                            <circle cx="12" cy="12" r="4" fill="currentColor" />
                        </svg>
                        <span class={styles.tabLabel}>{tab.label}</span>
                    </A>
                )}
            </For>
            <button type="button" class={styles.tabItem} aria-label="More calculators" onClick={handleMore}>
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="24" height="24">
                    <circle cx="5" cy="12" r="2" fill="currentColor" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                    <circle cx="19" cy="12" r="2" fill="currentColor" />
                </svg>
                <span class={styles.tabLabel}>More</span>
            </button>
        </nav>
    );
}
export {MobileBottomTabs};
