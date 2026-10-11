import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";

const batchMocks = vi.hoisted(function () {
    return {"processCsvText": vi.fn()};
});
vi.mock("./batchCalculator.js", function () {
    return {
        "BatchCalculator": {
            "getInstance": function () {
                return {"processCsvText": batchMocks.processCsvText};
            }
        }
    };
});

class FakeWorker {
    static instances: FakeWorker[] = [];
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: (() => void) | null = null;
    onmessageerror: (() => void) | null = null;
    posted: unknown[] = [];
    terminated: boolean = false;
    constructor(public url: URL, public options?: WorkerOptions) {
        FakeWorker.instances.push(this);
    }
    postMessage(message: unknown): void {
        this.posted.push(message);
    }
    terminate(): void {
        this.terminated = true;
    }
}

type ClientModule = typeof import("./heavyCalcClient.js");

async function loadClient(): Promise<ClientModule> {
    vi.resetModules();
    return import("./heavyCalcClient.js");
}

function latestWorker(): FakeWorker {
    let instance: FakeWorker | undefined = FakeWorker.instances[FakeWorker.instances.length - 1];
    if (instance === undefined) {
        throw new Error("no worker instance created");
    }
    return instance;
}

function deliver(instance: FakeWorker, data: unknown): void {
    instance.onmessage?.(new MessageEvent("message", {data: data}));
}

describe("heavyCalcClient", function (): void {
    let savedWorker: unknown;
    beforeEach(function (): void {
        FakeWorker.instances = [];
        batchMocks.processCsvText.mockReset();
        savedWorker = (globalThis as {Worker?: unknown}).Worker;
        (globalThis as {Worker?: unknown}).Worker = FakeWorker;
    });
    afterEach(function (): void {
        (globalThis as {Worker?: unknown}).Worker = savedWorker;
    });

    it("posts balance jobs to the worker and resolves with its result", async function (): Promise<void> {
        let client: ClientModule = await loadClient();
        let result: unknown = {"equation": "2H2 + O2 -> 2H2O", "reactants": [], "products": [], "explanation": {"method": "m", "steps": [], "coefficients": []}};
        let promise: Promise<unknown> = client.runBalance("H2 + O2 -> H2O", "acidic");
        let worker: FakeWorker = latestWorker();
        expect(worker.posted).toEqual([{"id": 1, "kind": "balance", "equation": "H2 + O2 -> H2O", "medium": "acidic"}]);
        deliver(worker, {"id": 1, "ok": true, "result": result});
        await expect(promise).resolves.toBe(result);
    });

    it("forwards batch progress updates and resolves with the batch result", async function (): Promise<void> {
        let client: ClientModule = await loadClient();
        let result: unknown = {"csvString": "formula,molar_mass\nH2O,18.015", "totalRows": 1, "successCount": 1, "errorCount": 0};
        let progress: {current: number; total: number}[] = [];
        let promise: Promise<unknown> = client.runBatch("formula\nH2O\n", "molar-mass", function (info: {current: number; total: number}): void {
            progress.push(info);
        });
        let worker: FakeWorker = latestWorker();
        expect(worker.posted).toEqual([{"id": 1, "kind": "batch", "csv": "formula\nH2O\n", "calculatorType": "molar-mass"}]);
        deliver(worker, {"id": 1, "progress": {"current": 1, "total": 1}});
        expect(progress).toEqual([{"current": 1, "total": 1}]);
        deliver(worker, {"id": 1, "ok": true, "result": result});
        await expect(promise).resolves.toBe(result);
        expect(batchMocks.processCsvText).not.toHaveBeenCalled();
    });

    it("falls back to synchronous balancing when Worker is unavailable", async function (): Promise<void> {
        delete (globalThis as {Worker?: unknown}).Worker;
        let client: ClientModule = await loadClient();
        expect(FakeWorker.instances.length).toBe(0);
        let result = await client.runBalance("H2 + O2 -> H2O", "acidic");
        expect(result.equation).toMatch(/2 H2 \+ O2 -> 2 H2O/);
        batchMocks.processCsvText.mockResolvedValue({"csvString": "a", "totalRows": 1, "successCount": 1, "errorCount": 0});
        let batch = await client.runBatch("formula\nH2O\n", "molar-mass");
        expect(batch.csvString).toBe("a");
        expect(batchMocks.processCsvText).toHaveBeenCalledWith("formula\nH2O\n", "molar-mass", undefined);
    });

    it("rejects when the worker reports a computation error", async function (): Promise<void> {
        let client: ClientModule = await loadClient();
        let promise: Promise<unknown> = client.runBalance("not a chemical equation !!!", "acidic");
        deliver(latestWorker(), {"id": 1, "ok": false, "error": "Unbalanceable equation"});
        await expect(promise).rejects.toThrow("Unbalanceable equation");
    });

    it("falls back to synchronous balancing when the worker fails", async function (): Promise<void> {
        let client: ClientModule = await loadClient();
        let promise: Promise<unknown> = client.runBalance("H2 + O2 -> H2O", "acidic");
        let worker: FakeWorker = latestWorker();
        worker.onerror?.();
        await expect(promise).resolves.toMatchObject({"equation": expect.stringMatching(/2 H2 \+ O2 -> 2 H2O/)});
        expect(worker.terminated).toBe(true);
        let second = await client.runBalance("H2 + O2 -> H2O", "acidic");
        expect(second.equation).toMatch(/2 H2 \+ O2 -> 2 H2O/);
        expect(FakeWorker.instances.length).toBe(1);
    });
});
