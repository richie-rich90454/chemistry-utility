import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the app to load
    await page.waitForSelector(".welcome-screen", { timeout: 15000 });
  });

  test("Click sidebar link for Molar Mass, verify calculator section is visible", async ({ page }) => {
    // Click the Molar Mass sidebar link
    await page.click('.sidebar-nav a[href="#mass-calc"]');

    // Verify the Molar Mass calculator section is visible
    const massSection = page.locator("#mass-calc");
    await expect(massSection).toBeVisible();

    // Verify the section has the expected heading
    const heading = massSection.locator("h2");
    await expect(heading).toContainText("Molar Mass");
  });

  test("Click sidebar link for Gas Laws, verify navigation works", async ({ page }) => {
    // Click the Gas Laws sidebar link
    await page.click('.sidebar-nav a[href="#gas-laws"]');

    // Verify the Gas Laws calculator section is visible
    const gasLawsSection = page.locator("#gas-laws");
    await expect(gasLawsSection).toBeVisible();

    // Verify the section has the expected heading
    const heading = gasLawsSection.locator("h2");
    await expect(heading).toContainText("Gas Laws");

    // Verify the Ideal Gas Law sub-section is present
    const idealGasHeading = page.locator("#ideal-gas-law h3");
    await expect(idealGasHeading).toContainText("Ideal Gas Law");
  });

  test("Theme toggle: click theme button, verify dark mode class is applied", async ({ page }) => {
    // Check initial theme state and get the theme toggle button
    const themeToggle = page.locator("#theme-toggle");
    await expect(themeToggle).toBeVisible();

    // Get the current theme class on <html>
    const htmlElement = page.locator("html");
    const initialIsDark = await htmlElement.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );

    // Click the theme toggle
    await themeToggle.click();

    // Verify the theme class toggled
    if (initialIsDark) {
      await expect(htmlElement).toHaveClass(/light/);
      await expect(htmlElement).not.toHaveClass(/dark/);
    } else {
      await expect(htmlElement).toHaveClass(/dark/);
      await expect(htmlElement).not.toHaveClass(/light/);
    }
  });
});
