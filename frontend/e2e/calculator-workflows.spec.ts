import { test, expect } from "@playwright/test";

test.describe("Calculator Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the app to load (page overlay dismissed)
    await page.waitForSelector(".welcome-screen", { timeout: 15000 });
  });

  test("Molar Mass: enter H2O and verify result contains 18.015", async ({ page }) => {
    // Navigate to Molar Mass calculator via sidebar
    await page.click('.sidebar-nav a[href="#mass-calc"]');

    // Wait for the calculator section to become visible
    const massSection = page.locator("#mass-calc");
    await expect(massSection).toBeVisible();

    // Enter formula
    const formulaInput = page.locator("#formula-input");
    await formulaInput.fill("H2O");

    // Trigger calculation (molar mass calculates on keyup)
    await formulaInput.press("Enter");

    // Verify result
    const result = page.locator("#mass-result");
    await expect(result).toContainText("18.015");
  });

  test("Ideal Gas Law: solve for V with P=1, n=1, T=273.15", async ({ page }) => {
    // Navigate to Gas Laws calculator via sidebar
    await page.click('.sidebar-nav a[href="#gas-laws"]');

    // Wait for the gas laws section to become visible
    const gasLawsSection = page.locator("#gas-laws");
    await expect(gasLawsSection).toBeVisible();

    // Select "Solve for V" from the dropdown
    const solveForSelect = page.locator("#ideal-solve-for");
    await solveForSelect.selectOption("V");

    // Fill in the known values
    await page.locator("#ideal-P").fill("1");
    await page.locator("#ideal-n").fill("1");
    await page.locator("#ideal-T").fill("273.15");

    // Ensure atm-L units (default)
    const rUnits = page.locator("#ideal-R-units");
    await expect(rUnits).toHaveValue("atm-L");

    // Click Calculate
    await page.locator("#calculate-ideal").click();

    // Verify result — PV=nRT => V = nRT/P = 1*0.08206*273.15/1 ≈ 22.4
    const result = page.locator("#ideal-result");
    await expect(result).toContainText("22.4");
  });

  test("Dilution: solve for V2 with M1=6, V1=1, M2=3", async ({ page }) => {
    // Navigate to Dilution calculator via sidebar
    await page.click('.sidebar-nav a[href="#dilution-calc"]');

    // Wait for the dilution section to become visible
    const dilutionSection = page.locator("#dilution-calc");
    await expect(dilutionSection).toBeVisible();

    // Select "Solve for V2" from the dropdown
    const solveForSelect = page.locator("#dilution-solve-for");
    await solveForSelect.selectOption("V2");

    // Fill in the known values
    await page.locator("#dilution-M1").fill("6");
    await page.locator("#dilution-V1").fill("1");
    await page.locator("#dilution-M2").fill("3");

    // Click Calculate
    await page.locator("#calculate-dilution").click();

    // Verify result — C1V1 = C2V2 => V2 = C1V1/C2 = 6*1/3 = 2
    const result = page.locator("#dilution-result");
    await expect(result).toContainText("2");
  });
});
