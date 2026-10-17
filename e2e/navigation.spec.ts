import { test, expect } from "@playwright/test";

const SIDEBAR = 'aside[aria-label="Calculator sidebar"]';

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("onboarding-complete", "true");
      localStorage.setItem("theme", "light");
    });
    await page.goto("/");
    // Wait for the app to load
    await page.waitForSelector("#main-content", { timeout: 15000 });
  });

  test("Click sidebar link for Molar Mass, verify calculator section is visible", async ({ page }) => {
    // Click the Molar Mass sidebar link
    await page.click(`${SIDEBAR} a[href="/molar-mass"]`);

    // Verify the Molar Mass calculator section is visible
    const heading = page.getByRole("heading", { name: "Molar Mass Calculator" });
    await expect(heading).toBeVisible();
  });

  test("Click sidebar link for Gas Laws, verify navigation works", async ({ page }) => {
    // Click the Gas Laws sidebar link
    await page.click(`${SIDEBAR} a[href="/gas-laws"]`);

    // Verify the Gas Laws calculator section is visible
    const heading = page.getByRole("heading", { name: "Gas Laws" });
    await expect(heading).toBeVisible();

    // Verify the Ideal Gas Law sub-section is present
    const idealGasHeading = page.getByRole("heading", { name: /Ideal Gas Law/ });
    await expect(idealGasHeading).toBeVisible();
  });

  test("Theme toggle: click theme button, verify dark mode class is applied", async ({ page }) => {
    // Check initial theme state and get the theme toggle button (sidebar instance)
    const themeToggle = page.locator(`${SIDEBAR} #theme-toggle`);
    await expect(themeToggle).toBeVisible();

    // Get the current theme class on <html>
    const htmlElement = page.locator("html");
    const initialClass = (await htmlElement.getAttribute("class")) ?? "";

    // Click the theme toggle
    await themeToggle.click();

    // Verify the theme class toggled
    await expect.poll(() => htmlElement.getAttribute("class")).not.toBe(initialClass);
  });
});
