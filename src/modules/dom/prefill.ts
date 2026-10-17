let idealGasDefaultsApplied: boolean = false;

/**
 * Clears the once-only guard installed by {@link applyIdealGasDefaults} so
 * the pre-fill runs again. Tests use it to restore a first-visit state
 * between cases.
 */
export function resetIdealGasDefaults(): void {
    idealGasDefaultsApplied = false;
}

/**
 * Pre-fills temperature with 298.15 K and pressure with 1 atm the first
 * time the ideal gas law calculator view is shown. Values already entered
 * by the user are left untouched, and a missing element is a no-op.
 */
export function applyIdealGasDefaults(): void {
    if (idealGasDefaultsApplied) return;
    idealGasDefaultsApplied = true;
    fillIfEmpty("ideal-T", "298.15");
    fillIfEmpty("ideal-P", "1");
}

function fillIfEmpty(id: string, value: string): void {
    let element = document.getElementById(id) as HTMLInputElement | null;
    if (element !== null && element.value === "") {
        element.value = value;
    }
}
