/**
 * Calculator helper utilities — grouping, routing, and display helpers.
 * Pure TypeScript, no JSX or SolidJS imports.
 */

import type { CalculatorInfo } from "./navigationManager.js";

export interface GroupedCalculators {
    category: string;
    items: CalculatorInfo[];
}

export function groupByCategory(calculators: CalculatorInfo[]): GroupedCalculators[] {
    let groups: GroupedCalculators[] = [];
    for (let i = 0; i < calculators.length; i++) {
        let calc = calculators[i];
        let last = groups.length > 0 ? groups[groups.length - 1] : null;
        if (last !== null && last.category === calc.category) {
            last.items.push(calc);
        } else {
            groups.push({ category: calc.category, items: [calc] });
        }
    }
    return groups;
}

export function calculatorIdToRoute(id: string): string {
    return "/" + id;
}
