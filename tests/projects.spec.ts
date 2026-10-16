import { test, expect } from "@playwright/test";
import {
  addPattern,
  expectFullScreen,
  home,
  isFullScreen,
  makePattern,
  openApp,
  patternTransform,
  pdfPage,
  renderTimeout,
  projectNames,
  seedFullScreenCalibration,
} from "./helpers";

test.describe("Saved projects", () => {
  test("starts on the home screen, where adding patterns stays out of full screen", async ({
    page,
  }, testInfo) => {
    const shirt = testInfo.outputPath("Shirt.pdf");
    const pants = testInfo.outputPath("Pants.pdf");
    await makePattern(shirt, "Shirt");
    await makePattern(pants, "Pants");

    await openApp(page);
    await expect(home(page)).toContainText("No patterns yet");
    await addPattern(page, shirt, "Shirt");
    await addPattern(page, pants, "Pants");
    await expect.poll(() => projectNames(page)).toEqual(["Pants", "Shirt"]);
    expect(await isFullScreen(page)).toBe(false);
  });

  test("calibrates in full screen first when there is no calibration yet", async ({
    page,
  }, testInfo) => {
    const shirt = testInfo.outputPath("Shirt.pdf");
    await makePattern(shirt, "Shirt");
    await openApp(page);
    await addPattern(page, shirt, "Shirt");

    await home(page)
      .getByRole("button", { name: /^Shirt/ })
      .click();
    await expect(home(page)).toBeHidden();
    await expectFullScreen(page);
    await expect(page.getByTestId("calibration-guide")).toContainText(
      "Step 1 of 4",
    );

    // Once calibrated, Project shows the pattern that was opened
    await page
      .getByRole("button", { name: "Save calibration", exact: true })
      .click();
    await expect(pdfPage(page)).toBeVisible({ timeout: renderTimeout });
  });

  test("goes straight to projecting and switches patterns without the file browser", async ({
    page,
  }, testInfo) => {
    const shirt = testInfo.outputPath("Shirt.pdf");
    const pants = testInfo.outputPath("Pants.pdf");
    await makePattern(shirt, "Shirt");
    await makePattern(pants, "Pants");
    await seedFullScreenCalibration(page);
    await openApp(page);
    await addPattern(page, shirt, "Shirt");
    await addPattern(page, pants, "Pants");

    await home(page)
      .getByRole("button", { name: /^Shirt/ })
      .click();
    await expect(pdfPage(page)).toBeVisible({ timeout: renderTimeout });
    await expectFullScreen(page);
    await expect(page.getByTestId("calibration-guide")).toHaveCount(0);
    // No file browser anywhere while projecting
    await expect(page.locator('input[type="file"]')).toHaveCount(0);

    // Wait for the pattern to be centred on the mat, which is saved
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("localTransform:Shirt.pdf")),
      )
      .not.toBeNull();

    // Turn the shirt, then switch to the pants straight away
    const before = await patternTransform(page);
    await page
      .getByRole("button", { name: "Rotate 90 degrees clockwise (R)" })
      .click();
    await expect.poll(() => patternTransform(page)).not.toBe(before);
    const shirtTransform = await patternTransform(page);

    // Moving the mouse brings back the menu, which hides when idle
    await page.mouse.move(600, 400 + Math.random() * 10);
    await page.getByRole("button", { name: "Projects", exact: true }).click();
    await expect
      .poll(() => projectNames(page))
      .toEqual(["ShirtOpen now", "Pants"]);
    await page.getByRole("button", { name: /^Pants/ }).click();
    await expect.poll(() => patternTransform(page)).not.toBe(shirtTransform);
    await expectFullScreen(page);

    // The shirt comes back where it was left
    // Moving the mouse brings back the menu, which hides when idle
    await page.mouse.move(600, 400 + Math.random() * 10);
    await page.getByRole("button", { name: "Projects", exact: true }).click();
    // Wait for the list to refresh, so the click doesn't land while it re-renders
    await expect
      .poll(() => projectNames(page))
      .toEqual(["PantsOpen now", "Shirt"]);
    await page.getByRole("button", { name: /^Shirt/ }).click();
    await expect.poll(() => patternTransform(page)).toBe(shirtTransform);

    // Adding a pattern goes back to the home screen, out of full screen
    // Moving the mouse brings back the menu, which hides when idle
    await page.mouse.move(600, 400 + Math.random() * 10);
    await page.getByRole("button", { name: "Projects", exact: true }).click();
    await page.getByRole("button", { name: "All patterns" }).click();
    await expect(home(page)).toBeVisible();
    await expect.poll(() => isFullScreen(page)).toBe(false);
  });

  test("renames and deletes projects", async ({ page }, testInfo) => {
    const shirt = testInfo.outputPath("Shirt.pdf");
    await makePattern(shirt, "Shirt");
    await openApp(page);
    await addPattern(page, shirt, "Shirt");

    await page.getByRole("button", { name: "Rename Shirt" }).click();
    // Typing letters that are also keyboard shortcuts must still work
    await page.getByLabel("Project name").fill("");
    await page.getByLabel("Project name").pressSequentially("Summer shirt");
    await page.getByLabel("Project name").press("Enter");
    await expect.poll(() => projectNames(page)).toEqual(["Summer shirt"]);

    await page.reload();
    await expect(home(page)).toBeVisible();
    await expect.poll(() => projectNames(page)).toEqual(["Summer shirt"]);

    await page.getByRole("button", { name: "Delete Summer shirt" }).click();
    await page.getByRole("button", { name: "Delete for good" }).click();
    await expect(page.getByTestId("project")).toHaveCount(0);
  });
});
