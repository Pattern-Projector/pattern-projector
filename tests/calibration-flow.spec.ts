import { test, expect, Page } from "@playwright/test";
import {
  addPattern,
  home,
  isFullScreen,
  makePattern,
  openApp,
  pdfPage,
  seedCalibration,
} from "./helpers";

const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const alert = (page: Page) => page.getByTestId("calibration-alert");
const savedContext = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("calibrationContext") ?? "null"),
  );

async function openShirt(page: Page, path: string) {
  await makePattern(path, "Shirt");
  await openApp(page);
  await addPattern(page, path, "Shirt");
  await home(page)
    .getByRole("button", { name: /^Shirt/ })
    .click();
}

test.describe("Calibration flow", () => {
  test("shows the menu again from the same spot it was hidden", async ({
    page,
  }) => {
    for (const width of [1280, 900]) {
      await page.setViewportSize({ width, height: 720 });
      await seedCalibration(page);
      await openApp(page);
      await home(page).getByRole("button", { name: "Calibrate" }).click();
      const hide = button(page, "Hide menu");
      // It is the first button, at the far left
      const hidden = (await hide.boundingBox())!;
      const cancel = (await button(page, "Cancel").boundingBox())!;
      expect(hidden.x).toBeLessThan(cancel.x);

      await hide.click();
      const show = button(page, "Show menu");
      await expect(show).toBeInViewport();
      await expect(page.locator("#width")).not.toBeInViewport();
      const shown = (await show.boundingBox())!;
      expect(shown.x).toBeCloseTo(hidden.x, 0);
      expect(shown.y).toBeCloseTo(hidden.y, 0);
      expect(shown.width).toBeCloseTo(hidden.width, 0);

      await show.click();
      await expect(page.locator("#width")).toBeInViewport();
    }
  });

  test("puts everything back when calibration is cancelled", async ({
    page,
  }) => {
    await seedCalibration(page);
    await openApp(page);
    const points = await page.evaluate(() => localStorage.getItem("points"));
    await home(page).getByRole("button", { name: "Calibrate" }).click();

    await page.locator("#width").fill("30");
    await button(page, "Reset calibration").click();
    expect(await page.evaluate(() => localStorage.getItem("points"))).not.toBe(
      points,
    );

    await button(page, "Cancel").click();
    // Nothing to project yet, so it goes back to the home screen
    await expect(home(page)).toBeVisible();
    await home(page).getByRole("button", { name: "Calibrate" }).click();
    await expect(page.locator("#width")).toHaveValue("24");
    expect(await page.evaluate(() => localStorage.getItem("points"))).toBe(
      points,
    );
  });

  test("goes back to the home screen when calibration started there, even with a pattern open", async ({
    page,
  }, testInfo) => {
    await seedCalibration(page);
    await openShirt(page, testInfo.outputPath("Shirt.pdf"));
    await expect(pdfPage(page)).toBeVisible();
    await button(page, "Projects").click();
    await button(page, "All patterns").click();
    await expect(home(page)).toBeVisible();

    await home(page).getByRole("button", { name: "Calibrate" }).click();
    await button(page, "Cancel").click();
    await expect(home(page)).toBeVisible();
    await expect.poll(() => isFullScreen(page)).toBe(false);
  });

  test("saving records that the calibration was made in full screen", async ({
    page,
  }) => {
    await openApp(page);
    await home(page).getByRole("button", { name: "Calibrate" }).click();
    await expect.poll(() => isFullScreen(page)).toBe(true);
    await button(page, "Save calibration").click();
    await expect(home(page)).toBeVisible();
    expect((await savedContext(page)).fullScreen).toBe(true);
  });

  test("ignores where the window was when projecting in full screen", async ({
    page,
  }, testInfo) => {
    // Calibrated in full screen with the window somewhere else on the screen
    await seedCalibration(page, { windowScreenLeft: 500 });
    await openShirt(page, testInfo.outputPath("Shirt.pdf"));
    await expect(pdfPage(page)).toBeVisible();
    await page.waitForTimeout(2500);
    await expect(alert(page)).toHaveCount(0);
  });

  test("asks to go back to full screen or recalibrate, and recalibrating clears the warning", async ({
    page,
  }, testInfo) => {
    await seedCalibration(page);
    await openShirt(page, testInfo.outputPath("Shirt.pdf"));
    await expect(pdfPage(page)).toBeVisible();
    await expect.poll(() => isFullScreen(page)).toBe(true);

    // Leaving full screen while projecting
    await page.evaluate(() => document.exitFullscreen());
    await expect(alert(page)).toContainText("You calibrated in full screen");
    await alert(page)
      .getByRole("button", { name: "Enter full screen" })
      .click();
    await expect(alert(page)).toHaveCount(0);

    // Recalibrating in the window replaces the full screen calibration
    await page.evaluate(() => document.exitFullscreen());
    await expect(alert(page)).toBeVisible();
    await alert(page)
      .getByRole("button", { name: "Recalibrate in this window" })
      .click();
    await button(page, "Save calibration").click();
    expect((await savedContext(page)).fullScreen).toBe(false);
    await page.waitForTimeout(2500);
    await expect(alert(page)).toHaveCount(0);
  });

  test("lets the size warning be put off, leaving a reminder until recalibrating", async ({
    page,
  }, testInfo) => {
    // Calibrated before the projector changed the screen resolution
    await seedCalibration(page, { windowInnerWidth: 1920 });
    await openShirt(page, testInfo.outputPath("Shirt.pdf"));
    await expect(alert(page)).toContainText("it was 1920 × 720");
    await expect(alert(page)).toContainText("projector");

    await alert(page).getByRole("button", { name: "Not now" }).click();
    await expect(alert(page)).toHaveCount(0);
    const reminder = page.getByTestId("calibration-reminder");
    await expect(reminder).toContainText("Recalibrate before cutting");
    // It sits at the bottom, out of the way of the menus and their dropdowns
    const box = await reminder.boundingBox();
    expect(box!.y).toBeGreaterThan(720 / 2);
    await page.mouse.move(600, 400);
    await page.getByRole("button", { name: "Line weight" }).click();
    await page.getByText("3px", { exact: true }).click();

    await reminder.getByRole("button", { name: "Recalibrate" }).click();
    await button(page, "Save calibration").click();
    await page.waitForTimeout(2500);
    await expect(reminder).toHaveCount(0);
    await expect(alert(page)).toHaveCount(0);
  });

  test("has info and mail on the home screen", async ({ page }) => {
    await openApp(page);
    await expect(home(page).getByLabel("Info page")).toBeVisible();
    await expect(home(page).getByLabel("Mail from Courtney")).toBeVisible();
  });
});
