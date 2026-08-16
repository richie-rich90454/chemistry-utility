import { test, expect } from "@playwright/test";

const SIDEBAR = 'aside[aria-label="Calculator sidebar"]';

test.describe("Calculator Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("onboarding-complete", "true");
      localStorage.setItem("theme", "light");
    });
    await page.goto("/");
    // Wait for the app to load
    await page.waitForSelector("#main-content", { timeout: 15000 });
  });

  test("Molar Mass: enter H2O and verify result contains 18.015", async ({ page }) => {
    // Navigate to Molar Mass calculator via sidebar
    await page.click(`${SIDEBAR} a[href="/molar-mass"]`);

    // Enter formula
    const formulaInput = page.locator("#formula-input");
    await formulaInput.fill("H2O");

    // Molar mass calculates automatically (debounced); verify result
    await expect(page.getByText(/Molar Mass: 18\.015/)).toBeVisible();
  });

  test("Ideal Gas Law: solve for V with P=1, n=1, T=273.15", async ({ page }) => {
    // Navigate to Gas Laws calculator via sidebar
    await page.click(`${SIDEBAR} a[href="/gas-laws"]`);

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

    // Click Calculate in the Ideal Gas Law section
    const idealSection = page.getByRole("heading", { name: /Ideal Gas Law/ }).locator("..");
    await idealSection.getByRole("button", { name: "Calculate" }).click();

    // Verify result — PV=nRT => V = nRT/P = 1*0.08206*273.15/1 ≈ 22.4
    await expect(idealSection.getByText(/V=\(nRT\)\/P = 22\.4/)).toBeVisible();
  });

  test("Dilution: solve for V2 with M1=6, V1=1, M2=3", async ({ page }) => {
    // Navigate to Dilution calculator via sidebar
    await page.click(`${SIDEBAR} a[href="/dilution"]`);

    // Select "Solve for V2" from the dropdown (it is the default)
    const solveForSelect = page.locator("#dilution-solve-for");
    await solveForSelect.selectOption("V2");

    // Fill in the known values
    await page.locator("#dilution-M1").fill("6");
    await page.locator("#dilution-V1").fill("1");
    await page.locator("#dilution-M2").fill("3");

    // Click Calculate
    await page.getByRole("button", { name: "Calculate" }).click();

    // Verify result — C1V1 = C2V2 => V2 = C1V1/C2 = 6*1/3 = 2
    await expect(page.getByText(/V2 = \(M1 \* V1\) \/ M2 = 2\.0000 L/)).toBeVisible();
  });
});
