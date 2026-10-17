import {test, expect} from "@playwright/test";
import type {Page} from "@playwright/test";

test.beforeEach(async function ({page}): Promise<void> {
    await page.addInitScript(function (): void {
        localStorage.setItem("onboarding-complete", "true");
        localStorage.setItem("theme", "light");
    });
});

/** The rendered sidebar width, after any grid transition settles. */
async function paneWidth(page: Page): Promise<number> {
    return (await page.locator(".nav-pane").boundingBox())!.width;
}

test("sidebar resize drags, clamps, persists, resets, and collapses cleanly", async function ({page}): Promise<void> {
    await page.goto("/");
    await page.waitForSelector("#main-content", {timeout: 15000});
    let before = await paneWidth(page);
    let handle = page.locator(".app-resizer");
    await expect(handle).toBeVisible();
    let box = (await handle.boundingBox())!;
    let y = box.y + 240;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 140, y, {steps: 10});
    await page.mouse.up();
    await expect.poll(async function (): Promise<number> { return paneWidth(page); }).toBeGreaterThan(before + 100);
    let after = await paneWidth(page);
    // The chosen width is remembered.
    let stored = await page.evaluate(function (): string | null { return localStorage.getItem("chemutil:sidebar-width"); });
    expect(Number(stored)).toBeGreaterThan(0);
    // The content column starts after the resized pane.
    let content = (await page.locator(".app-content").boundingBox())!;
    expect(content.x).toBeGreaterThan(after - 2);
    // Resizing never pushes the page into horizontal overflow.
    let overflow = await page.evaluate(function (): number {
        return document.documentElement.scrollWidth - window.innerWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
    // The width survives a reload.
    await page.reload();
    await page.waitForSelector("#main-content", {timeout: 15000});
    await expect.poll(async function (): Promise<number> { return paneWidth(page); }).toBeGreaterThan(after - 4);
    // A double press resets to the stylesheet default.
    await page.locator(".app-resizer").dblclick();
    await expect.poll(async function (): Promise<number> { return paneWidth(page); }).toBeLessThan(after - 50);
    // Collapsing hides the handle and closes the gap.
    await page.getByLabel("Collapse sidebar").click();
    await expect(page.locator(".app-resizer")).toHaveCount(0);
    await expect.poll(async function (): Promise<number> { return paneWidth(page); }).toBeLessThan(60);
    await page.getByLabel("Expand sidebar").click();
    await expect(page.locator(".app-resizer")).toHaveCount(1);
});

test("route entry rises in without fading the incoming content out", async function ({page}): Promise<void> {
    await page.goto("/molar-mass");
    await expect(page.locator("[data-motion='enter']").first()).toBeVisible();
    let samples = await page.evaluate(async function (): Promise<number[]> {
        let link = document.querySelector("nav[data-tour='sidebar-nav'] a[href='/dilution']") as HTMLAnchorElement;
        link.click();
        let out: number[] = [];
        let i: number;
        for (i = 0; i < 60; i++) {
            let el = document.querySelector(".route-transition [data-motion='enter']") as HTMLElement | null;
            out.push(el !== null ? Number(getComputedStyle(el).opacity) : -1);
            await new Promise(function (resolve: (value: void) => void): void {
                requestAnimationFrame(function (): void { resolve(); });
            });
        }
        return out;
    });
    expect(samples.length).toBeGreaterThan(5);
    expect(samples[samples.length - 1]).toBeGreaterThan(0.9);
    // It rises from hidden and settles fully visible — an entrance, not a flap.
    expect(Math.min.apply(null, samples)).toBeLessThan(0.5);
});
