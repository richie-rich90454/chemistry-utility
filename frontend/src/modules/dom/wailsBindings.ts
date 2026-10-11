/**
 * Wails binding typings for the desktop build.
 *
 * The generated bindings in frontend/wailsjs are produced by `wails build`
 * and are not committed. Declaring the shapes here lets the web build
 * compile and typecheck against the same surface the desktop build uses,
 * so there is one code path with no build-time branch.
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

export interface WailsBindings {
    go: {
        main: {
            CalculatorService: CalculatorServiceBinding;
            DataService: DataServiceBinding;
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
