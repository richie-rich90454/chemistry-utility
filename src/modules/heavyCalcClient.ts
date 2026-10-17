import {balanceEquation} from "./balanceEquation.js";
import type {BalanceResult, RedoxMedium} from "./balanceEquation.js";
import {processCsvText} from "./batchCalculator.js";
import type {BatchResult, ProgressInfo} from "./batchCalculator.js";

interface BalanceJobMessage {
    kind: "balance";
    equation: string;
    medium: RedoxMedium;
}
interface BatchJobMessage {
    kind: "batch";
    csv: string;
    calculatorType: string;
}
type JobPayload = BalanceJobMessage | BatchJobMessage;
type JobMessage = (BalanceJobMessage | BatchJobMessage) & {id: number};
interface DoneMessage {
    id: number;
    ok: true;
    result: BalanceResult | BatchResult;
}
interface FailMessage {
    id: number;
    ok: false;
    error: string;
}
interface ProgressMessage {
    id: number;
    progress: ProgressInfo;
}
type WorkerResponse = DoneMessage | FailMessage | ProgressMessage;
interface PendingJob {
    resolve: (value: BalanceResult | BatchResult) => void;
    reject: (reason: Error) => void;
    onProgress?: (info: ProgressInfo) => void;
}

// Marks a job that never reached the worker (no worker, or the worker died).
// Only these fall back to main-thread computation; an error the worker
// itself reports for the input is surfaced to the caller as-is.
class WorkerTransportError extends Error {}

let worker: Worker | null = null;
let workerBroken: boolean = false;
let nextJobId: number = 1;
let pending: Map<number, PendingJob> = new Map();

function createHeavyWorker(): Worker | null {
    if (typeof Worker === "undefined") {
        return null;
    }
    try {
        return new Worker(new URL("../workers/heavyCalc.worker.ts", import.meta.url), {type: "module"});
    }
    catch {
        workerBroken = true;
        return null;
    }
}

function getWorker(): Worker | null {
    if (worker === null && !workerBroken) {
        let created: Worker | null = createHeavyWorker();
        if (created !== null) {
            created.onmessage = handleWorkerMessage;
            created.onerror = handleWorkerFailure;
            created.onmessageerror = handleWorkerFailure;
            worker = created;
        }
    }
    return worker;
}

function handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    let data: WorkerResponse = event.data;
    let job: PendingJob | undefined = pending.get(data.id);
    if (job === undefined) {
        return;
    }
    if ("progress" in data) {
        if (job.onProgress) {
            job.onProgress(data.progress);
        }
        return;
    }
    pending.delete(data.id);
    if (data.ok) {
        job.resolve(data.result);
    }
    else {
        job.reject(new Error(data.error));
    }
}

function handleWorkerFailure(): void {
    let jobs: PendingJob[] = Array.from(pending.values());
    pending.clear();
    workerBroken = true;
    if (worker !== null) {
        worker.terminate();
        worker = null;
    }
    for (let i = 0; i < jobs.length; i++) {
        jobs[i].reject(new WorkerTransportError("Heavy calculation worker failed"));
    }
}

function postJob(message: JobPayload, onProgress?: (info: ProgressInfo) => void): Promise<BalanceResult | BatchResult> {
    let active: Worker | null = getWorker();
    if (active === null) {
        return Promise.reject(new WorkerTransportError("Heavy calculation worker unavailable"));
    }
    let id: number = nextJobId;
    nextJobId = nextJobId + 1;
    let job: JobMessage = message.kind === "balance"
        ? {id: id, kind: "balance", equation: message.equation, medium: message.medium}
        : {id: id, kind: "batch", csv: message.csv, calculatorType: message.calculatorType};
    let promise: Promise<BalanceResult | BatchResult> = new Promise(function (resolve: (value: BalanceResult | BatchResult) => void, reject: (reason: Error) => void): void {
        pending.set(id, {resolve: resolve, reject: reject, onProgress: onProgress});
    });
    active.postMessage(job);
    return promise;
}

/**
 * Balances an equation in the worker when available. Falls back to the same
 * synchronous computation on the main thread when workers are unavailable
 * (jsdom, older webviews) or the worker fails.
 */
function runBalance(equation: string, medium: RedoxMedium): Promise<BalanceResult> {
    return postJob({kind: "balance", equation: equation, medium: medium}).then(
        function (result: BalanceResult | BatchResult): BalanceResult {
            return result as BalanceResult;
        },
        function (err: unknown): BalanceResult {
            if (err instanceof WorkerTransportError) {
                return balanceEquation(equation, medium);
            }
            throw err;
        }
    );
}

/**
 * Processes a CSV batch in the worker when available, forwarding progress
 * updates. Falls back to the synchronous batch calculation on the main
 * thread when workers are unavailable or the worker fails.
 */
function runBatch(csv: string, calculatorType: string, onProgress?: (info: ProgressInfo) => void): Promise<BatchResult> {
    return postJob({kind: "batch", csv: csv, calculatorType: calculatorType}, onProgress).then(
        function (result: BalanceResult | BatchResult): BatchResult {
            return result as BatchResult;
        },
        function (err: unknown): Promise<BatchResult> {
            if (err instanceof WorkerTransportError) {
                return processCsvText(csv, calculatorType, onProgress);
            }
            throw err;
        }
    );
}

export {runBalance, runBatch};
