/**
 * Element display formatting utilities.
 * Pure TypeScript, no JSX or SolidJS imports.
 */

export function formatOptional(value: number | null | undefined, suffix: string): string {
    if (value === null || value === undefined) {
        return "N/A";
    }
    return String(value) + suffix;
}
