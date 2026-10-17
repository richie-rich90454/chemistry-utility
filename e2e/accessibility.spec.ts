import { test, expect } from "@playwright/test";

const SIDEBAR = 'aside[aria-label="Calculator sidebar"]';

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("onboarding-complete", "true");
      localStorage.setItem("theme", "light");
    });
    await page.goto("/");
    // Wait for the app to load
    await page.waitForSelector("#main-content", { timeout: 15000 });
  });

  test("Tab key navigates through interactive elements", async ({ page }) => {
    // Press Tab several times and verify focus moves to interactive elements
    await page.keyboard.press("Tab");

    // The sidebar collapse toggle is the first focusable element
    const firstControl = page.locator(`${SIDEBAR} button[aria-label="Collapse sidebar"]`);
    await expect(firstControl).toBeFocused();

    // Tab again to move to the next interactive element
    await page.keyboard.press("Tab");

    // Verify focus has moved away from the first control
    await expect(firstControl).not.toBeFocused();

    // Verify some element is focused (not body)
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeDefined();
    expect(focusedTag).not.toBe("BODY");
  });

  test("Escape key closes command palette", async ({ page }) => {
    // Open the command palette with Ctrl+K
    await page.keyboard.press("Control+k");

    // Verify the command palette is open
    const palette = page.getByRole("dialog", { name: "Calculator search" });
    await expect(palette).toBeVisible();

    // Press Escape to close it
    await page.keyboard.press("Escape");

    // Verify the command palette is closed
    await expect(palette).toBeHidden();
  });

  test("aria-labels are present on key elements", async ({ page }) => {
    // Verify aria-label on the sidebar navigation
    const sidebar = page.locator(SIDEBAR);
    await expect(sidebar).toHaveAttribute("aria-label", "Calculator sidebar");

    // Verify aria-label on the main content area
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toHaveAttribute("aria-label", "Main content");

    // Verify aria-label on the theme toggle button (sidebar instance)
    const themeToggle = page.locator(`${SIDEBAR} #theme-toggle`);
    await expect(themeToggle).toHaveAttribute("aria-label", /Switch to (dark|light) mode/);

    // Verify aria-label on the sidebar search input
    const searchInput = sidebar.locator('input[aria-label="Search calculators"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("aria-label", "Search calculators");

    // Verify aria-label on the command palette input
    await page.keyboard.press("Control+k");
    const paletteInput = page.getByRole("dialog", { name: "Calculator search" }).locator('input[aria-label="Search calculators"]');
    await expect(paletteInput).toBeVisible();
    await expect(paletteInput).toHaveAttribute("aria-label", "Search calculators");
  });
});
