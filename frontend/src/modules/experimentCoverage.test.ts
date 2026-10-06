// @vitest-environment jsdom
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {ExperimentLogManager} from "./experimentLog.js";

describe("experimentCoverage: view visibility", () => {
    beforeEach(() => {
        ExperimentLogManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
    });
    afterEach(() => {
        ExperimentLogManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("shows, hides, and reports visibility with and without container", () => {
        const m = ExperimentLogManager.getInstance();
        m.showView();
        expect(m.isViewVisible()).toBe(false);
        m.init();
        m.showView();
        expect(m.isViewVisible()).toBe(true);
        m.hideView();
        expect(m.isViewVisible()).toBe(false);
        m.destroy();
        m.hideView();
        expect(m.isViewVisible()).toBe(false);
    });

    it("exports to PDF via window.print", () => {
        const m = ExperimentLogManager.getInstance();
        m.init();
        const p = vi.fn();
        (window as unknown as Record<string, unknown>)["print"] = p;
        m.exportToPDF();
        expect(p).toHaveBeenCalled();
    });
});

describe("experimentCoverage: promptAddStep", () => {
    beforeEach(() => {
        ExperimentLogManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
    });
    afterEach(() => {
        ExperimentLogManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("adds via prompts and handles cancel and failure", async () => {
        const m = ExperimentLogManager.getInstance();
        m.init();
        const log = await m.createLog("t", "w");
        vi.stubGlobal("prompt", vi.fn().mockReturnValueOnce("s1").mockReturnValueOnce("d1"));
        const s = await m.promptAddStep(log.id);
        expect(s).not.toBeNull();
        vi.stubGlobal("prompt", vi.fn().mockReturnValueOnce(null));
        expect(await m.promptAddStep(log.id)).toBeNull();
        vi.stubGlobal("prompt", vi.fn().mockReturnValueOnce("s2").mockReturnValueOnce(""));
        const s2 = await m.promptAddStep(log.id);
        expect(s2).not.toBeNull();
        const addMock = vi.spyOn(m, "addStep").mockRejectedValueOnce(new Error("nope"));
        vi.stubGlobal("prompt", vi.fn().mockReturnValueOnce("sx").mockReturnValueOnce("dx"));
        expect(await m.promptAddStep(log.id)).toBeNull();
        addMock.mockRestore();
        const addMock2 = vi.spyOn(m, "addStep").mockRejectedValueOnce("string-fail" as never);
        vi.stubGlobal("prompt", vi.fn().mockReturnValueOnce("sy").mockReturnValueOnce("dy"));
        expect(await m.promptAddStep(log.id)).toBeNull();
        addMock2.mockRestore();
    });
});

describe("experimentCoverage: absent elements and ties", () => {
    beforeEach(() => {
        ExperimentLogManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
    });
    afterEach(() => {
        ExperimentLogManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
    });

    it("covers existing view, missing parts, and sort ties", async () => {
        const pre = document.createElement("section");
        pre.id = "experiment-log-view";
        for (const cls of ["experiment-log-header", "experiment-log-error", "experiment-log-timeline"]) {
            const c = document.createElement("div");
            c.className = cls;
            pre.appendChild(c);
        }
        document.body.appendChild(pre);
        const main = document.createElement("div");
        main.id = "main-content";
        document.body.appendChild(main);
        for (const id of ["dashboard-view", "workspace-view"]) {
            const s = document.createElement("div");
            s.id = id;
            document.body.appendChild(s);
        }
        const appView = document.createElement("div");
        appView.className = "app-view";
        const welcome = document.createElement("div");
        welcome.className = "welcome-screen";
        appView.appendChild(welcome);
        const card = document.createElement("div");
        card.className = "main-groups card";
        appView.appendChild(card);
        document.body.appendChild(appView);
        const viewHeader = document.createElement("div");
        viewHeader.className = "view-header";
        document.body.appendChild(viewHeader);
        const m = ExperimentLogManager.getInstance();
        m.init();
        m.showView();
        const log = await m.createLog("t", "w");
        expect(m.getSteps(log.id)).toEqual([]);
        expect(m.getSteps("missing")).toEqual([]);
        m.deleteLog("missing");
        m.renderLog({id: "x", title: "t", workspaceId: "w", createdAt: new Date().toISOString()} as never);
        document.body.innerHTML = "";
        ExperimentLogManager.resetInstance();
        const fresh = ExperimentLogManager.getInstance();
        fresh.renderLog({id: "x", title: "t", workspaceId: "w", createdAt: new Date().toISOString()} as never);
        fresh.renderTimeline([]);
        fresh.showView();
        const m2 = ExperimentLogManager.getInstance();
        m2.init();
        const log2 = await m2.createLog("t2", "w");
        await m2.addStep(log2.id, {title: "s1", data: "d"});
        await m2.addStep(log2.id, {title: "s2", data: "d"});
        const steps = m2.getSteps(log2.id);
        if (steps.length >= 2) {
            (steps[1] as {createdAt: string}).createdAt = (steps[0] as {createdAt: string}).createdAt;
        }
        m2.viewTimeline(log2.id);
        const header = document.querySelector(".experiment-log-header");
        if (header) header.remove();
        m2.renderLog({id: log2.id, title: "t2", workspaceId: "w", createdAt: new Date().toISOString()} as never);
        const timeline = document.querySelector(".experiment-log-timeline");
        if (timeline) timeline.remove();
        m2.renderTimeline(m2.getSteps(log2.id));
        await m2.addStep("unknown-log", {title: "sx", data: "dx"});
        const created = m2.getSteps("unknown-log") as Array<{id: string}>;
        const anyM2 = m2 as unknown as Record<string, Record<string, unknown>>;
        delete (anyM2["stepsByLog"] as Record<string, unknown>)["unknown-log"];
        if (created.length > 0) await m2.annotateStep(created[0].id, "note");
        const errEl = document.querySelector(".experiment-log-error");
        if (errEl) errEl.remove();
        (m2 as unknown as Record<string, (msg: string) => void>)["showError"]("x");
    });
});

describe("experimentCoverage: UI events", () => {
    beforeEach(() => {
        ExperimentLogManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        const main = document.createElement("div");
        main.id = "main-content";
        document.body.appendChild(main);
    });
    afterEach(() => {
        ExperimentLogManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("dispatches add-step, export, and annotation events", async () => {
        const m = ExperimentLogManager.getInstance();
        m.init();
        const log = await m.createLog("t", "w");
        m.renderLog(log);
        vi.stubGlobal("prompt", vi.fn().mockReturnValueOnce(null));
        (document.querySelector(".experiment-log-add-step-btn") as HTMLButtonElement).click();
        const printMock = vi.fn();
        (window as unknown as Record<string, unknown>)["print"] = printMock;
        (document.querySelector(".experiment-log-export-pdf-btn") as HTMLButtonElement).click();
        expect(printMock).toHaveBeenCalled();
        await m.addStep(log.id, {title: "s", data: "d"});
        m.renderTimeline(m.getSteps(log.id));
        const input = document.querySelector(".experiment-log-step-annotate-input") as HTMLInputElement;
        input.value = "note";
        input.dispatchEvent(new Event("blur", {bubbles: true}));
        await new Promise((r) => setTimeout(r, 10));
        expect(document.querySelector(".experiment-log-step-annotation")!.textContent).toContain("note");
    });
});

describe("experimentCoverage: errors and dates", () => {    beforeEach(() => {
        ExperimentLogManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
    });
    afterEach(() => {
        ExperimentLogManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
    });

    it("shows and clears errors with and without elements", () => {
        const mgr = ExperimentLogManager.getInstance();
        const m = mgr as unknown as Record<string, (msg: string) => void>;
        m["showError"]("oops");
        const main = document.createElement("div");
        main.id = "main-content";
        document.body.appendChild(main);
        mgr.init();
        m["showError"]("oops");
        expect(document.querySelector(".experiment-log-error")!.textContent).toContain("oops");
        m["showError"]("");
        const anyM = ExperimentLogManager.getInstance() as unknown as Record<string, (e: unknown, f: string) => string>;
        expect(anyM["extractMessage"](new Error("x"), "F")).toContain("x");
        expect(anyM["extractMessage"]("str", "F")).toBe("F");
        const fmt = (ExperimentLogManager.getInstance() as unknown as Record<string, (s: string) => string>)["formatDate"];
        expect(fmt("2026-01-05T00:00:00.000Z")).toContain("2026");
        expect(fmt("not-a-date")).toBe("");
    });

    it("handles corrupt storage", async () => {
        localStorage.setItem("chemutil_experiment_logs", "not-json{{");
        const m = ExperimentLogManager.getInstance();
        m.init();
        expect(m.getLogs()).toEqual([]);
        localStorage.setItem("chemutil_experiment_steps_x", "not-json{{");
        expect(m.getSteps("x")).toEqual([]);
        expect(await m.loadTimeline("x")).toEqual([]);
    });
});
