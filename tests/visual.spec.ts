import { test, expect } from "@playwright/test";

test.describe("Visual Regression Testing", () => {
  test(`Calibrate page`, async ({ page }) => {
    await page.goto("/en/calibrate");
    await page.waitForLoadState("networkidle");
    await page
      .getByTestId("projects-home")
      .getByRole("button", { name: "Calibrate", exact: true })
      .click();
    await expect(page.getByTestId("calibration-canvas")).toBeVisible();
    await page.addStyleTag({
      content:
        '[data-testid="calibration-canvas"] { visibility: hidden !important; }',
    });
    await expect(page).toHaveScreenshot(`calibrate.png`, {
      fullPage: true,
    });
  });

  test(`Home page`, async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("welcome-title")).toBeVisible();
    await expect(page).toHaveScreenshot(`home.png`, {
      fullPage: true,
    });
  });
});
