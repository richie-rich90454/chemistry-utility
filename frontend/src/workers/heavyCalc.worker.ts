import {balanceEquation} from "../modules/balanceEquation.js";
import type {BalanceResult, RedoxMedium} from "../modules/balanceEquation.js";
import {BatchCalculator} from "../modules/batchCalculator.js";
import type {BatchResult, ProgressInfo} from "../modules/batchCalculator.js";

interface BalanceJob {
    id: number;
    kind: "balance";
    equation: string;
    medium: RedoxMedium;
}
interface BatchJob {
    id: number;
    kind: "batch";
    csv: string;
    calculatorType: string;
}
type HeavyJob = BalanceJob | BatchJob;
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

function toMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

interface WorkerScope {
    onmessage: ((event: MessageEvent<HeavyJob>) => void) | null;
    postMessage(message: unknown): void;
}
const scope: WorkerScope = self as unknown as WorkerScope;

scope.onmessage = function (event: MessageEvent<HeavyJob>): void {
    let job: HeavyJob = event.data;
    if (job.kind === "balance") {
        try {
            let result: BalanceResult = balanceEquation(job.equation, job.medium);
            let done: DoneMessage = {id: job.id, ok: true, result: result};
            scope.postMessage(done);
        }
        catch (err: unknown) {
            let failed: FailMessage = {id: job.id, ok: false, error: toMessage(err)};
            scope.postMessage(failed);
        }
        return;
    }
    BatchCalculator.getInstance().processCsvText(job.csv, job.calculatorType, function (info: ProgressInfo): void {
        let progress: ProgressMessage = {id: job.id, progress: info};
        scope.postMessage(progress);
    }).then(function (result: BatchResult): void {
        let done: DoneMessage = {id: job.id, ok: true, result: result};
        scope.postMessage(done);
    }, function (err: unknown): void {
        let failed: FailMessage = {id: job.id, ok: false, error: toMessage(err)};
        scope.postMessage(failed);
    });
};
