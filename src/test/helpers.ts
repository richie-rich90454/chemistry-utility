/**
 * Create a container div with the given id
 */
export function createContainer(id: string): HTMLDivElement {
    const div = document.createElement("div");
    div.id = id;
    document.body.appendChild(div);
    return div;
}

/**
 * Create an input element and append it to a parent
 */
export function createInput(id: string, value: string, parentId: string, type = "number"): HTMLInputElement {
    const input = document.createElement("input");
    input.id = id;
    input.type = type;
    input.value = value;
    input.step = "any";
    document.getElementById(parentId)!.appendChild(input);
    return input;
}

/**
 * Create a select element with options and append it to a parent
 */
export function createSelect(id: string, value: string, optionValues: string[], parentId: string): HTMLSelectElement {
    const select = document.createElement("select");
    select.id = id;
    for (const v of optionValues) {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = v;
        select.appendChild(o);
    }
    select.value = value;
    document.getElementById(parentId)!.appendChild(select);
    return select;
}

/**
 * Create a result div and append it to a parent
 */
export function createResultDiv(id: string, parentId: string): HTMLDivElement {
    const div = document.createElement("div");
    div.id = id;
    document.getElementById(parentId)!.appendChild(div);
    return div;
}

/**
 * Find or create an input element inside a parent
 */
export function setOrCreateInput(id: string, value: string, parentId: string, type = "number"): HTMLInputElement {
    let input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) {
        input = document.createElement("input");
        input.id = id;
        input.type = type;
        if (type === "number") {
            input.step = "any";
        }
        document.getElementById(parentId)!.appendChild(input);
    }
    input.value = value;
    input.classList.remove("error");
    return input;
}

/**
 * Find or create a select element inside a parent
 */
export function setOrCreateSelect(id: string, value: string, parentId: string, optionValues?: string[]): HTMLSelectElement {
    let select = document.getElementById(id) as HTMLSelectElement | null;
    if (!select) {
        select = document.createElement("select");
        select.id = id;
        const opts = optionValues || [value];
        for (const v of opts) {
            const o = document.createElement("option");
            o.value = v;
            o.textContent = v;
            select.appendChild(o);
        }
        document.getElementById(parentId)!.appendChild(select);
    }
    select.value = value;
    return select;
}

/**
 * Get result innerHTML
 */
export function getResultHTML(id: string): string {
    const el = document.getElementById(id);
    return el ? el.innerHTML : "";
}

/**
 * Create a DOM element with an input and result div for testing calculators
 */
export function setupCalculatorDOM(inputIds: string[], resultId: string): void {
    const result = document.createElement("div");
    result.id = resultId;
    document.body.appendChild(result);

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
