/**
 * Lab report route.
 *
 * Renders the calculation history as a printable document and hands it to
 * the browser print dialog, which is the PDF export ("Save as PDF") — no
 * PDF library is bundled. The markup comes from labReport.ts so the report
 * has exactly one implementation on both platforms.
 */
import type {JSX} from "solid-js";
import {createEffect, onCleanup, Show} from "solid-js";
import {ExportManager} from "../../modules/exportManager.js";
import {buildLabReportHtml} from "../../modules/labReport.js";
import styles from "./report.module.css";
const PRINT_BODY_CLASS = "printing-report";
function LabReport(): JSX.Element {
    // Marks the document so the print stylesheet can hide the app shell.
    createEffect(function (): void {
        document.body.classList.add(PRINT_BODY_CLASS);
        onCleanup(function (): void {
            document.body.classList.remove(PRINT_BODY_CLASS);
        });
    });
    function handlePrint(): void {
        window.print();
    }
    let entries = ExportManager.getInstance().getHistory();
    return (
        <section class={styles.reportPage} aria-label="Lab report">
            <div class={styles.reportHeader}>
                <h1 class={styles.reportTitle}>Lab Report</h1>
                <div class={styles.reportActions}>
                    <button type="button" class={styles.reportButton} onClick={handlePrint}>Print report</button>
                </div>
            </div>
            <Show when={entries.length > 0} fallback={<p class={styles.reportEmpty}>No calculations recorded yet.</p>}>
                {/* eslint-disable solid/no-innerhtml -- buildLabReportHtml escapes every interpolated value */}
                <div class={styles.reportBody} innerHTML={buildLabReportHtml(entries)} />
                {/* eslint-enable solid/no-innerhtml */}
            </Show>
        </section>
    );
}
export {LabReport};
