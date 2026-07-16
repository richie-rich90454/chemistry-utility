interface ComparisonItem {
    calculationId: string;
    data: unknown;
}

interface ComparisonField {
    label: string;
    value: string;
    section: string;
}

/**
 * Tracks up to two calculations and renders a side-by-side comparison modal
 * that highlights differences between input and output values.
 */
export class ComparisonManager {
    private static instance: ComparisonManager | null = null;
    private items: ComparisonItem[];
    private modal: HTMLElement | null;
    private content: HTMLElement | null;
    private closeButton: HTMLElement | null;
    private initialized: boolean;

    private constructor() {
        this.items = [];
        this.modal = null;
        this.content = null;
        this.closeButton = null;
        this.initialized = false;
    }

    public static getInstance(): ComparisonManager {
        if (!ComparisonManager.instance) {
            ComparisonManager.instance = new ComparisonManager();
        }
        return ComparisonManager.instance;
    }

    public init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.modal = document.getElementById("comparison-modal");
        if (this.modal) {
            this.content = this.modal.querySelector("#comparison-content") as HTMLElement | null;
            this.closeButton = this.modal.querySelector(".comparison-close") as HTMLElement | null;
            if (this.closeButton) {
                let self: ComparisonManager = this;
                this.closeButton.addEventListener("click", function (): void {
                    self.hideComparison();
                });
            }
        }
    }

    public addToComparison(calculationId: string, calculationData: unknown): boolean {
        let i: number;
        for (i = 0; i < this.items.length; i++) {
            if (this.items[i].calculationId === calculationId) {
                this.items[i].data = calculationData;
                return true;
            }
        }
        if (this.items.length >= 2) {
            return false;
        }
        this.items.push({ "calculationId": calculationId, "data": calculationData });
        if (this.items.length === 2) {
            this.showComparison();
        }
        return true;
    }

    public showComparison(): void {
        if (!this.modal || !this.content) {
            this.ensureModal();
        }
        if (!this.modal || !this.content) {
            return;
        }
        this.content.innerHTML = "";
        if (this.items.length === 0) {
            let empty: HTMLElement = document.createElement("p");
            empty.className = "comparison-empty";
            empty.textContent = "Select calculations to compare.";
            this.content.appendChild(empty);
        } else if (this.items.length === 1) {
            let notice: HTMLElement = document.createElement("p");
            notice.className = "comparison-empty";
            notice.textContent = "Add one more calculation to compare.";
            this.content.appendChild(notice);
            this.content.appendChild(this.renderColumn(this.items[0], "Calculation 1"));
        } else {
            this.content.appendChild(this.renderSideBySide(this.items[0], this.items[1]));
        }
        this.modal.style.display = "flex";
    }

    private ensureModal(): void {
        this.modal = document.getElementById("comparison-modal");
        if (this.modal) {
            this.content = this.modal.querySelector("#comparison-content") as HTMLElement | null;
        }
    }

    private renderColumn(item: ComparisonItem, title: string): HTMLElement {
        let wrap: HTMLElement = document.createElement("div");
        wrap.className = "comparison-column";
        let heading: HTMLElement = document.createElement("h3");
        heading.textContent = title;
        wrap.appendChild(heading);
        wrap.appendChild(this.renderFieldList(this.extractFields(item.data)));
        return wrap;
    }

    private renderSideBySide(itemA: ComparisonItem, itemB: ComparisonItem): HTMLElement {
        let fieldsA: ComparisonField[] = this.extractFields(itemA.data);
        let fieldsB: ComparisonField[] = this.extractFields(itemB.data);
        let keys: string[] = this.mergeKeys(fieldsA, fieldsB);

        let table: HTMLTableElement = document.createElement("table");
        table.className = "comparison-table";

        let thead: HTMLElement = document.createElement("thead");
        let headerRow: HTMLTableRowElement = document.createElement("tr");
        headerRow.appendChild(this.createHeaderCell("Field"));
        headerRow.appendChild(this.createHeaderCell("Calculation 1"));
        headerRow.appendChild(this.createHeaderCell("Calculation 2"));
        headerRow.appendChild(this.createHeaderCell("Difference"));
        thead.appendChild(headerRow);
        table.appendChild(thead);

        let tbody: HTMLElement = document.createElement("tbody");
        let i: number;
        for (i = 0; i < keys.length; i++) {
            let key: string = keys[i];
            let valA: string = this.findValue(fieldsA, key);
            let valB: string = this.findValue(fieldsB, key);
            let same: boolean = valA === valB;

            let row: HTMLTableRowElement = document.createElement("tr");
            let labelCell: HTMLTableCellElement = this.createCell(key);
            labelCell.className = "comparison-field-label";
            row.appendChild(labelCell);

            let cellA: HTMLTableCellElement = this.createCell(valA);
            let cellB: HTMLTableCellElement = this.createCell(valB);
            let diffCell: HTMLTableCellElement = this.createCell("");
            if (same) {
                cellA.className = "comparison-same";
                cellB.className = "comparison-same";
                diffCell.textContent = "—";
                diffCell.className = "comparison-same";
            } else {
                cellA.className = "comparison-different";
                cellB.className = "comparison-different";
                let pct: string = this.percentageDifference(valA, valB);
                if (pct) {
                    diffCell.textContent = pct;
                } else {
                    diffCell.textContent = "diff";
                }
                diffCell.className = "comparison-different";
            }
            row.appendChild(cellA);
            row.appendChild(cellB);
            row.appendChild(diffCell);
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        return table;
    }

    private createHeaderCell(text: string): HTMLTableCellElement {
        let cell: HTMLTableCellElement = document.createElement("th");
        cell.textContent = text;
        return cell;
    }

    private createCell(text: string): HTMLTableCellElement {
        let cell: HTMLTableCellElement = document.createElement("td");
        cell.textContent = text;
        return cell;
    }

    private renderFieldList(fields: ComparisonField[]): HTMLElement {
        let list: HTMLElement = document.createElement("dl");
        list.className = "comparison-field-list";
        let i: number;
        for (i = 0; i < fields.length; i++) {
            let dt: HTMLElement = document.createElement("dt");
            dt.textContent = fields[i].label;
            let dd: HTMLElement = document.createElement("dd");
            dd.textContent = fields[i].value;
            list.appendChild(dt);
            list.appendChild(dd);
        }
        return list;
    }

    private extractFields(data: unknown): ComparisonField[] {
        let fields: ComparisonField[] = [];
        if (!data || typeof data !== "object") {
            return fields;
        }
        let obj: Record<string, unknown> = data as Record<string, unknown>;
        let inputsRaw: unknown = obj["Inputs"] !== undefined ? obj["Inputs"] : obj["inputs"];
        let inputs: Record<string, unknown> | null = this.coerceToRecord(inputsRaw);
        if (inputs) {
            this.collectFields(inputs, "input", fields);
        }
        let outputsRaw: unknown = obj["Result"] !== undefined ? obj["Result"] : obj["result"];
        let outputs: Record<string, unknown> | null = this.coerceToRecord(outputsRaw);
        if (outputs) {
            this.collectFields(outputs, "output", fields);
        }
        return fields;
    }

    private collectFields(record: Record<string, unknown>, section: string, fields: ComparisonField[]): void {
        let keys: string[] = Object.keys(record);
        let i: number;
        for (i = 0; i < keys.length; i++) {
            fields.push({ "label": keys[i], "value": this.stringify(record[keys[i]]), "section": section });
        }
    }

    private coerceToRecord(raw: unknown): Record<string, unknown> | null {
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            return raw as Record<string, unknown>;
        }
        if (typeof raw === "string") {
            try {
                let parsed: unknown = JSON.parse(raw);
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                    return parsed as Record<string, unknown>;
                }
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    private stringify(value: unknown): string {
        if (value === null || value === undefined) {
            return "";
        }
        if (typeof value === "string") {
            return value;
        }
        if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }
        try {
            return JSON.stringify(value);
        } catch (e) {
            return String(value);
        }
    }

    private mergeKeys(fieldsA: ComparisonField[], fieldsB: ComparisonField[]): string[] {
        let keys: string[] = [];
        let seen: Record<string, boolean> = {};
        let i: number;
        for (i = 0; i < fieldsA.length; i++) {
            let label: string = fieldsA[i].label;
            if (!seen[label]) {
                seen[label] = true;
                keys.push(label);
            }
        }
        for (i = 0; i < fieldsB.length; i++) {
            let label: string = fieldsB[i].label;
            if (!seen[label]) {
                seen[label] = true;
                keys.push(label);
            }
        }
        return keys;
    }

    private findValue(fields: ComparisonField[], key: string): string {
        let i: number;
        for (i = 0; i < fields.length; i++) {
            if (fields[i].label === key) {
                return fields[i].value;
            }
        }
        return "";
    }

    private percentageDifference(a: string, b: string): string {
        let numA: number = parseFloat(a);
        let numB: number = parseFloat(b);
        if (isNaN(numA) || isNaN(numB)) {
            return "";
        }
        let avg: number = (Math.abs(numA) + Math.abs(numB)) / 2;
        if (avg === 0) {
            return "0%";
        }
        let diff: number = Math.abs(numA - numB);
        let pct: number = (diff / avg) * 100;
        return pct.toFixed(2) + "%";
    }

    public clearComparison(): void {
        this.items = [];
        if (this.content) {
            this.content.innerHTML = "";
        }
        this.hideComparison();
    }

    public hideComparison(): void {
        if (this.modal) {
            this.modal.style.display = "none";
        }
    }

    public getCount(): number {
        return this.items.length;
    }

    public destroy(): void {
        this.items = [];
        this.modal = null;
        this.content = null;
        this.closeButton = null;
        this.initialized = false;
    }

    public static resetInstance(): void {
        if (ComparisonManager.instance) {
            ComparisonManager.instance.destroy();
        }
        ComparisonManager.instance = null;
    }
}
