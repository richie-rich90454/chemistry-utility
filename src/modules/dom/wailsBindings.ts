/**
 * Wails binding typings for the desktop build.
 *
 * The Wails runtime injects `window.go` when the app is packaged, so the
 * web build compiles and typechecks against the same surface the desktop
 * build uses, with one code path and no build-time branch.
 */
export interface CalcResult {
    value: string;
    explanation?: string;
    chartData?: unknown;
    metadata?: Record<string, unknown>;
}

interface CalculatorServiceBinding {
    Calculate(calculatorID: string, inputs: Record<string, string>): Promise<CalcResult>;
    ListCalculators(): Promise<string[]>;
    BatchCalculate(calculatorID: string, rows: Array<Record<string, string>>): Promise<CalcResult[]>;
}

interface DataServiceBinding {
    GetPTableData(): Promise<string>;
}

interface FileServiceBinding {
    OpenFile(title: string, filters: string): Promise<string>;
    SaveFile(defaultName: string, data: string): Promise<string>;
}

export interface WailsBindings {
    go: {
        main: {
            CalculatorService: CalculatorServiceBinding;
            DataService: DataServiceBinding;
            FileService: FileServiceBinding;
        };
    };
}

/** Returns the Wails binding namespace, or null outside a Wails runtime. */
export function getBindings(): WailsBindings | null {
    if (typeof window === "undefined") {
        return null;
    }
    let w = window as unknown as { go?: WailsBindings["go"] };
    if (w.go === undefined) {
        return null;
    }
    return { go: w.go };
}
