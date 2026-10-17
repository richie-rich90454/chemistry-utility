/**
 * Periodic-table category colours.
 *
 * A curated categorical palette: evenly spaced hues at a shared muted
 * register, so the table reads as one designed surface rather than a bag of
 * swatches. One palette serves every theme — colour is data here, so tiles
 * keep their identity in light and dark. Each foreground is chosen for its
 * own swatch to hold WCAG AA contrast (asserted in elementPalette.test.ts),
 * and no fill is reused between categories.
 */

interface CategoryColors {
    background: string;
    foreground: string;
}

/** Neutral colours for a category the dataset does not name. */
const FALLBACK_CATEGORY_COLORS: CategoryColors = {"background": "#E9ECEF", "foreground": "#111827"};

const CATEGORY_COLORS: Record<string, CategoryColors> = {
    "alkali metal": {"background": "#E15759", "foreground": "#111827"},
    "alkaline earth metal": {"background": "#F28E2B", "foreground": "#111827"},
    "transition metal": {"background": "#3F6E9E", "foreground": "#FFFFFF"},
    "post-transition metal": {"background": "#76B7B2", "foreground": "#111827"},
    "metalloid": {"background": "#59A14F", "foreground": "#111827"},
    "non-metal": {"background": "#EDC948", "foreground": "#111827"},
    "halogen": {"background": "#FF9DA7", "foreground": "#111827"},
    "noble gas": {"background": "#BAB0AC", "foreground": "#111827"},
    "lanthanide": {"background": "#B07AA1", "foreground": "#111827"},
    "actinide": {"background": "#8C6552", "foreground": "#FFFFFF"}
};

/** The background/foreground pair for a category, with a neutral fallback. */
function categoryColors(type: string): CategoryColors {
    let entry = CATEGORY_COLORS[type];
    return entry !== undefined ? entry : FALLBACK_CATEGORY_COLORS;
}

export {categoryColors, CATEGORY_COLORS, FALLBACK_CATEGORY_COLORS};
export type {CategoryColors};
