import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the app to load
    await page.waitForSelector(".welcome-screen", { timeout: 15000 });
  });

  test("Tab key navigates through interactive elements", async ({ page }) => {
    // Press Tab several times and verify focus moves to interactive elements
    await page.keyboard.press("Tab");

    // The skip link should be the first focusable element
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeFocused();

    // Tab again to move to the next interactive element
    await page.keyboard.press("Tab");

    // Verify focus has moved away from the skip link
    await expect(skipLink).not.toBeFocused();

    // Verify some element is focused (not body)
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeDefined();
    expect(focusedTag).not.toBe("BODY");
  });

  test("Escape key closes command palette", async ({ page }) => {
    // Open the command palette with Ctrl+K
    await page.keyboard.press("Control+k");

    // Verify the command palette is open
    const palette = page.locator(".command-palette");
    await expect(palette).toHaveClass(/open/);

    // Press Escape to close it
    await page.keyboard.press("Escape");

    // Verify the command palette is closed
    await expect(palette).not.toHaveClass(/open/);
  });

  test("aria-labels are present on key elements", async ({ page }) => {
    // Verify aria-label on the sidebar navigation
    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toHaveAttribute("aria-label", "Calculator sidebar");

    // Verify aria-label on the main content area
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toHaveAttribute("aria-label", "Main content");

    // Verify aria-label on the theme toggle button
    const themeToggle = page.locator("#theme-toggle");
    await expect(themeToggle).toHaveAttribute("aria-label", "Toggle theme");

    // Verify aria-label on the sidebar search input
    const searchInput = page.locator(".sidebar-search input");
    await expect(searchInput).toHaveAttribute("aria-label", "Search calculators");

    // Verify aria-label on the command palette input
    const paletteInput = page.locator(".palette-input");
    await expect(paletteInput).toHaveAttribute("aria-label", "Search calculators");
  });
});
