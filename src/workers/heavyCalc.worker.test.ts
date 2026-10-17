import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";

const balanceMock = vi.hoisted(function () {
    return {"balanceEquation": vi.fn()};
});
const batchMock = vi.hoisted(function () {
    return {"processCsvText": vi.fn()};
});

vi.mock("../modules/balanceEquation.js", function () {
    return {"balanceEquation": balanceMock.balanceEquation};
});
vi.mock("../modules/batchCalculator.js", function () {
    return {"processCsvText": batchMock.processCsvText};
});

interface FakeScope {
    onmessage: ((event: MessageEvent) => void) | null;
    postMessage: ReturnType<typeof vi.fn>;
}

async function loadWorker(): Promise<FakeScope> {
    let scope: FakeScope = {"onmessage": null, "postMessage": vi.fn()};
    vi.stubGlobal("self", scope);
    vi.resetModules();
    await import("./heavyCalc.worker.js");
    return scope;
}

function send(scope: FakeScope, job: unknown): void {
    scope.onmessage?.(new MessageEvent("message", {"data": job}));
}

function flush(): Promise<void> {
    return new Promise(function (resolve): void { setTimeout(resolve, 0); });
}

describe("heavyCalc.worker", function (): void {
    beforeEach(function (): void {
        balanceMock.balanceEquation.mockReset();
        batchMock.processCsvText.mockReset();
    });
    afterEach(function (): void {
        vi.unstubAllGlobals();
    });

    it("posts the balanced result for a balance job", async function (): Promise<void> {
        let scope: FakeScope = await loadWorker();
        let result = {"equation": "2 H2 + O2 -> 2 H2O"};
        balanceMock.balanceEquation.mockReturnValue(result);
        send(scope, {"id": 7, "kind": "balance", "equation": "H2 + O2 -> H2O", "medium": "acidic"});
        expect(balanceMock.balanceEquation).toHaveBeenCalledWith("H2 + O2 -> H2O", "acidic");
        expect(scope.postMessage).toHaveBeenCalledWith({"id": 7, "ok": true, "result": result});
    });

    it("posts a failure when balancing throws an Error", async function (): Promise<void> {
        let scope: FakeScope = await loadWorker();
        balanceMock.balanceEquation.mockImplementation(function (): never {
            throw new Error("Unbalanceable equation");
        });
        send(scope, {"id": 1, "kind": "balance", "equation": "???", "medium": "acidic"});
        expect(scope.postMessage).toHaveBeenCalledWith({"id": 1, "ok": false, "error": "Unbalanceable equation"});
    });

    it("stringifies a thrown non-Error during balancing", async function (): Promise<void> {
        let scope: FakeScope = await loadWorker();
        balanceMock.balanceEquation.mockImplementation(function (): never {
            throw "plain failure";
        });
        send(scope, {"id": 2, "kind": "balance", "equation": "???", "medium": "basic"});
        expect(scope.postMessage).toHaveBeenCalledWith({"id": 2, "ok": false, "error": "plain failure"});
    });

    it("posts progress updates and the batch result for a batch job", async function (): Promise<void> {
        let scope: FakeScope = await loadWorker();
        let result = {"csvString": "a", "totalRows": 1, "successCount": 1, "errorCount": 0};
        batchMock.processCsvText.mockImplementation(function (_csv: string, _type: string, onProgress?: (info: unknown) => void): Promise<unknown> {
            if (onProgress) {
                onProgress({"current": 1, "total": 1});
            }
            return Promise.resolve(result);
        });
        send(scope, {"id": 3, "kind": "batch", "csv": "formula\nH2O\n", "calculatorType": "molar-mass"});
        await flush();
        expect(scope.postMessage).toHaveBeenCalledWith({"id": 3, "progress": {"current": 1, "total": 1}});
        expect(scope.postMessage).toHaveBeenCalledWith({"id": 3, "ok": true, "result": result});
    });

    it("posts a failure when the batch job rejects", async function (): Promise<void> {
        let scope: FakeScope = await loadWorker();
        batchMock.processCsvText.mockRejectedValue(new Error("CSV file is empty"));
        send(scope, {"id": 4, "kind": "batch", "csv": "", "calculatorType": "molar-mass"});
        await flush();
        expect(scope.postMessage).toHaveBeenCalledWith({"id": 4, "ok": false, "error": "CSV file is empty"});
    });
});
