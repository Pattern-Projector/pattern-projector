import { test, expect, Page } from "@playwright/test";
import { waitForApp, waitForFullScreenToSettle, windowSize } from "./helpers";
import { placementFromPoints } from "@/_lib/guided-calibration";
import { lensDisplayPoint } from "@/_lib/lens-correction";

const viewport = { width: 1280, height: 720 };
const gridWidth = 24;
const gridHeight = 16;
const savedPoints = [
  { x: 300, y: 150 },
  { x: 980, y: 160 },
  { x: 975, y: 600 },
  { x: 290, y: 590 },
];

async function open(page: Page, points: typeof savedPoints | null) {
  await page.setViewportSize(viewport);
  // Each test starts with empty storage, so only returning users need anything saved before the page loads
  if (points) {
    await page.addInitScript((points) => {
      if (localStorage.getItem("points") === null) {
        localStorage.setItem("points", JSON.stringify(points));
      }
    }, points);
  }
  await page.goto("/en/calibrate");
  await waitForApp(page);
  // The app starts on the projects home screen
  await page
    .getByTestId("projects-home")
    .getByRole("button", { name: "Calibrate", exact: true })
    .click();
  await expect(page.getByTestId("projects-home")).toBeHidden();
  await expect(page.getByTestId("calibration-canvas")).toBeVisible();
  await waitForFullScreenToSettle(page);
}

async function getPlacement(page: Page) {
  const points = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("points") ?? "[]"),
  );
  return placementFromPoints(points, gridWidth, gridHeight);
}

const guide = (page: Page) => page.getByTestId("calibration-guide");
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });

test.describe("Guided calibration", () => {
  test("starts for new users and offers a printable target", async ({
    page,
    request,
  }) => {
    await open(page, null);
    await expect(guide(page)).toContainText("Step 1 of 4");
    // It downloads instead of opening, so full screen isn't lost
    const downloading = page.waitForEvent("download");
    await page
      .getByRole("link", { name: "Download the printable target" })
      .click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe(
      "pattern-projector-calibration-target.pdf",
    );
    const response = await request.get(download.url());
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    await expect(guide(page)).toBeVisible();
  });

  test("stays out of the way for people who already calibrated", async ({
    page,
  }) => {
    await open(page, savedPoints);
    await expect(guide(page)).toHaveCount(0);
    await button(page, "Guided setup").click();
    await expect(guide(page)).toContainText("Step 1 of 4");
    await page.getByRole("button", { name: "Skip to corners" }).click();
    await expect(guide(page)).toHaveCount(0);
  });

  test("ignores the pointer while printing the target", async ({ page }) => {
    await open(page, null);
    const before = await page.evaluate(() => localStorage.getItem("points"));
    await page.mouse.move(400, 150);
    await page.mouse.down();
    await page.mouse.move(500, 250, { steps: 4 });
    await page.mouse.up();
    expect(await page.evaluate(() => localStorage.getItem("points"))).toBe(
      before,
    );
  });

  test("squares up the grid, then moves, resizes and rotates it", async ({
    page,
    browserName,
    isMobile,
  }) => {
    await open(page, savedPoints);
    await button(page, "Guided setup").click();
    await button(page, "Next").click();
    await expect(guide(page)).toContainText("Line up the target");

    // The slightly skewed calibration is replaced by a rectangle with the same centre, size and angle
    const squared = await getPlacement(page);
    const points = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("points") ?? "[]"),
    );
    const top = Math.hypot(
      points[1].x - points[0].x,
      points[1].y - points[0].y,
    );
    const bottom = Math.hypot(
      points[2].x - points[3].x,
      points[2].y - points[3].y,
    );
    expect(top).toBeCloseTo(bottom, 6);

    // Drag anywhere on the grid to move it
    await page.mouse.move(700, 300);
    await page.mouse.down();
    await page.mouse.move(760, 270, { steps: 5 });
    await page.mouse.up();
    const moved = await getPlacement(page);
    expect(moved.center.x).toBeCloseTo(squared.center.x + 60, 0);
    expect(moved.center.y).toBeCloseTo(squared.center.y - 30, 0);
    expect(moved.scale).toBeCloseTo(squared.scale, 6);

    // Small steps per click, ten times bigger with Shift
    await button(page, "Bigger").click();
    const bigger = await getPlacement(page);
    expect(bigger.scale).toBeCloseTo(moved.scale * 1.002, 6);
    await button(page, "Bigger").click({ modifiers: ["Shift"] });
    expect((await getPlacement(page)).scale).toBeCloseTo(
      bigger.scale * Math.pow(1.002, 10),
      6,
    );
    await button(page, "Smaller").click({ modifiers: ["Shift"] });
    expect(bigger.center.x).toBeCloseTo(moved.center.x, 6);

    await button(page, "Rotate right").click();
    const rotated = await getPlacement(page);
    expect(rotated.rotation - bigger.rotation).toBeCloseTo(
      (0.1 * Math.PI) / 180,
      6,
    );

    // Scrolling resizes too, where there is a mouse wheel
    if (browserName === "webkit" && isMobile) return;
    await page.mouse.move(700, 300);
    await page.mouse.wheel(0, 100);
    await expect
      .poll(async () => (await getPlacement(page)).scale)
      .toBeLessThan(rotated.scale);
  });

  test("adjusts the lens last without moving the corners on screen", async ({
    page,
  }) => {
    await open(page, savedPoints);
    await button(page, "Guided setup").click();
    await button(page, "Next").click();
    await button(page, "Next").click();
    await expect(guide(page)).toContainText("Fine-tune the corners");
    const cornersBefore = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("points") ?? "[]"),
    );
    await button(page, "Next").click();
    await expect(guide(page)).toContainText("Step 4 of 4");
    await expect(guide(page)).toContainText("Straighten the lines");

    // The grid ignores the pointer during this step
    await page.mouse.move(300, 150);
    await page.mouse.down();
    await page.mouse.move(350, 200, { steps: 4 });
    await page.mouse.up();
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("points") ?? "[]"),
      ),
    ).toEqual(cornersBefore);

    await button(page, "More lens correction").click();
    await button(page, "More lens correction").click();
    await button(page, "Less lens correction").click();
    await expect(page.getByTestId("guide-lens-value")).toHaveText("0.25%");
    await expect(page.locator("#lens_correction")).toHaveValue("0.25");

    // The saved points change so each corner is still shown at the same place
    const cornersAfter = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("points") ?? "[]"),
    );
    // Full screen can be bigger than the window (Firefox uses its screen size)
    const size = await windowSize(page);
    cornersAfter.forEach((p: { x: number; y: number }, i: number) => {
      const shown = lensDisplayPoint(p, size.width, size.height, {
        strength: 0.25,
      });
      expect(shown.x).toBeCloseTo(cornersBefore[i].x, 3);
      expect(shown.y).toBeCloseTo(cornersBefore[i].y, 3);
    });
    expect(cornersAfter).not.toEqual(cornersBefore);

    await button(page, "Done").click();
    await expect(guide(page)).toHaveCount(0);

    await page.reload();
    await waitForApp(page);
    await page
      .getByTestId("projects-home")
      .getByRole("button", { name: "Calibrate", exact: true })
      .click();
    await expect(page.locator("#lens_correction")).toHaveValue("0.25");
  });

  test("keeps the guide panel in one place and lets it be dragged away", async ({
    page,
  }) => {
    await open(page, null);
    // Bottom edge of the panel, measured from the bottom of the screen once any full screen change has settled
    const gapBelow = async () => {
      const box = (await guide(page).boundingBox())!;
      return (await windowSize(page)).height - (box.y + box.height);
    };
    // It starts in the bottom left, away from the centre where the target is
    await expect.poll(gapBelow).toBeCloseTo(16, 0);
    const start = await guide(page).boundingBox();
    expect(start!.x + start!.width).toBeLessThan(viewport.width / 2);

    await button(page, "Next").click();
    await button(page, "Next").click();
    await button(page, "Next").click();
    // Same left and bottom edges on every step; only the height follows the text
    const last = await guide(page).boundingBox();
    expect(last!.x).toBeCloseTo(start!.x, 0);
    expect(await gapBelow()).toBeCloseTo(16, 0);

    const handle = page.getByTestId("calibration-guide-handle");
    const box = await handle.boundingBox();
    await page.mouse.move(box!.x + 20, box!.y + 10);
    await page.mouse.down();
    await page.mouse.move(box!.x + 220, box!.y - 90, { steps: 5 });
    await page.mouse.up();
    const moved = await guide(page).boundingBox();
    expect(moved!.x).toBeCloseTo(last!.x + 200, 0);
    expect(moved!.y).toBeCloseTo(last!.y - 100, 0);

    // The new place is remembered
    await page.reload();
    await waitForApp(page);
    await page
      .getByTestId("projects-home")
      .getByRole("button", { name: "Calibrate", exact: true })
      .click();
    await button(page, "Guided setup").click();
    const reopened = await guide(page).boundingBox();
    expect(reopened!.x).toBeCloseTo(moved!.x, 0);
  });
});
