import {test, expect} from "@playwright/test";

test.beforeEach(async function ({page}): Promise<void> {
    await page.addInitScript(function (): void {
        localStorage.setItem("onboarding-complete", "true");
        localStorage.setItem("theme", "light");
    });
});

const ROUTES = [
    "/", "/molar-mass", "/element-lookup", "/periodic-table", "/equation-balancer", "/unit-converter",
    "/dilution", "/mass-percent", "/solution-mixing", "/buffer", "/pka-pkb", "/ksp", "/colligative",
    "/titration", "/debye-huckel", "/common-ion", "/nuclear", "/gas-laws", "/electrochemistry",
    "/thermodynamics", "/kinetics", "/quantum-atomic", "/stoichiometry", "/bond-type",
    "/photoelectron-spectroscopy", "/empirical-formula", "/mass-spectrometry", "/vsepr-geometry",
    "/calorimetry", "/gibbs-equilibrium", "/molality", "/beer-lambert", "/serial-dilution",
    "/le-chatelier", "/molecular-viewer", "/compound-search", "/batch-calc", "/report"
];

const WIDTHS = [1280, 1024, 820];

/**
 * No input prompt may be clipped by its box. The check measures the rendered
 * placeholder against the input's content box using the input's own font, so
 * it catches a too-long prompt or a too-narrow field on any route.
 */
test("no input placeholder is clipped at any supported width", async function ({page}): Promise<void> {
    let failures: string[] = [];
    for (const width of WIDTHS) {
        await page.setViewportSize({width: width, height: 900});
        for (const route of ROUTES) {
            await page.goto(route);
            await page.waitForSelector("#main-content", {timeout: 15000});
            let clipped = await page.evaluate(function (): Array<{p: string; need: number; have: number}> {
                let out: Array<{p: string; need: number; have: number}> = [];
                let canvas = document.createElement("canvas");
                let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
                let inputs = document.querySelectorAll("input[placeholder]");
                let i: number;
                for (i = 0; i < inputs.length; i++) {
                    let el = inputs[i] as HTMLInputElement;
                    if (el.placeholder === "" || el.offsetParent === null) {
                        continue;
                    }
                    let cs = getComputedStyle(el);
                    ctx.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
                    let need = ctx.measureText(el.placeholder).width;
                    let have = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
                    if (need > have + 0.5) {
                        out.push({p: el.placeholder, need: Math.round(need), have: Math.round(have)});
                    }
                }
                return out;
            });
            for (const item of clipped) {
                failures.push(width + "px " + route + " '" + item.p + "' needs " + item.need + "px, has " + item.have + "px");
            }
        }
    }
    expect(failures).toEqual([]);
});
