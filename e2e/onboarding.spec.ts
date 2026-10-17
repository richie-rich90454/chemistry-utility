import {test, expect} from "@playwright/test";

/**
 * The first-run tour.
 *
 * These specs deliberately do not pre-set `onboarding-complete`, so the tour
 * runs for real. The regression they guard against is a welcome screen that
 * offers nothing but "Skip tour", which leaves visitors no way to see the
 * steps it advertises.
 */

test("the welcome card leads into the tour instead of dead-ending", async function ({page}): Promise<void> {
    await page.goto("/");
    await page.waitForSelector("#main-content", {timeout: 15000});

    let dialog = page.getByRole("dialog", {name: "Welcome tour"});
    await expect(dialog).toBeVisible();
    await expect(page.getByText("1 of 5")).toBeVisible();
    await expect(page.getByText("Welcome to Chemistry Utility")).toBeVisible();

    // The welcome card is centered and offers a way forward that is not "skip".
    await expect(page.locator("[data-tour-card='centered']")).toBeVisible();
    let welcomeCard = await page.locator("[data-tour-card='centered']").boundingBox();
    expect(welcomeCard!.x).toBeGreaterThan(200);
    await expect(page.getByRole("button", {"name": "Next"})).toBeVisible();

    // Step two spotlights the sidebar and docks the card beside it.
    await page.getByRole("button", {"name": "Next"}).click();
    await expect(page.getByText("2 of 5")).toBeVisible();
    await expect(page.locator("[data-tour-spotlight]")).toBeVisible();
    await expect(page.locator("[data-tour-card='docked']")).toBeVisible();
    let dockedCard = await page.locator("[data-tour-card='docked']").boundingBox();
    expect(dockedCard!.x).toBeLessThan(200);

    // Every remaining step is reachable and the last one finishes the tour.
    await page.getByRole("button", {"name": "Next"}).click();
    await expect(page.getByText("3 of 5")).toBeVisible();
    await page.getByRole("button", {"name": "Back"}).click();
    await expect(page.getByText("2 of 5")).toBeVisible();
    await page.getByRole("button", {"name": "Next"}).click();
    await page.getByRole("button", {"name": "Next"}).click();
    await expect(page.getByText("4 of 5")).toBeVisible();
    await page.getByRole("button", {"name": "Next"}).click();
    await expect(page.getByText("5 of 5")).toBeVisible();
    await page.getByRole("button", {"name": "Finish"}).click();
    await expect(dialog).toBeHidden();

    let stored = await page.evaluate(function (): string | null {
        return localStorage.getItem("onboarding-complete");
    });
    expect(stored).toBe("true");

    // The tour does not come back on the next visit.
    await page.reload();
    await page.waitForSelector("#main-content", {timeout: 15000});
    await expect(page.getByRole("dialog", {name: "Welcome tour"})).toBeHidden();
});

test("the tour can be left at any step without losing the rest of the app", async function ({page}): Promise<void> {
    await page.goto("/");
    await page.waitForSelector("#main-content", {timeout: 15000});
    await expect(page.getByText("1 of 5")).toBeVisible();

    await page.getByRole("button", {"name": "Skip tour"}).click();
    await expect(page.getByRole("dialog", {name: "Welcome tour"})).toBeHidden();

    // Once the tour is gone, the shell underneath is fully usable.
    await page.locator("nav[data-tour='sidebar-nav'] a[href='/molar-mass']").click();
    await expect(page).toHaveURL(/\/molar-mass$/);
    await expect(page.getByRole("heading", {"name": /Molar Mass/})).toBeVisible();
});
