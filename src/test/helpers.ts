/**
 * Create a DOM element with an input and result div for testing calculators
 */
export function setupCalculatorDOM(inputIds: string[], resultId: string): void {
    // Create result div
    const result = document.createElement("div");
    result.id = resultId;
    document.body.appendChild(result);

    // Create input elements
    for (const id of inputIds) {
        const input = document.createElement("input");
        input.id = id;
        input.type = "number";
        document.body.appendChild(input);
    }
}

/**
 * Clean up all test DOM elements
 */
export function cleanupDOM(): void {
    document.body.innerHTML = "";
}

/**
 * Set input value and dispatch input event
 */
export function setInputValue(id: string, value: string): void {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
        input.value = value;
        input.dispatchEvent(new Event("input"));
    }
}

/**
 * Get result text content
 */
export function getResultText(id: string): string {
    const el = document.getElementById(id);
    return el?.textContent?.trim() || "";
}
