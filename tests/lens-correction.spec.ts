import { test, expect, Page } from "@playwright/test";
import { lensSourcePoint } from "@/_lib/lens-correction";

const viewport = { width: 1280, height: 720 };
const points = [
  { x: 40, y: 40 },
  { x: 1240, y: 40 },
  { x: 1240, y: 680 },
  { x: 40, y: 680 },
];

async function openCalibration(page: Page, strength: number) {
  await page.setViewportSize(viewport);
  await page.goto("/en/calibrate");
  await page.evaluate(
    ({ points, strength }) => {
      localStorage.setItem("points", JSON.stringify(points));
      localStorage.setItem(
        "canvasSettings",
        JSON.stringify({
          width: "24",
          height: "16",
          lensCorrection: { strength },
        }),
      );
    },
    { points, strength },
  );
  await page.reload();
  await expect(page.getByTestId("calibration-canvas")).toBeVisible();
  // Wait for React to attach its event handlers
  await page.waitForLoadState("networkidle");
}

// A strip along the bottom edge of the calibration grid, clear of the menus
const bottomEdge = { x: 0, y: 600, width: viewport.width, height: 120 };

test.describe("Lens correction", () => {
  test("remembers the lens correction after a reload", async ({ page }) => {
    await openCalibration(page, 0);
    const input = page.locator("#lens_correction");
    await input.fill("4.5");
    await page.reload();
    await expect(page.locator("#lens_correction")).toHaveValue("4.5");
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("canvasSettings") ?? "{}"),
    );
    expect(saved.lensCorrection).toEqual({ strength: 4.5 });
  });

  test("bends the projected grid only when it is turned on", async ({
    page,
  }) => {
    await openCalibration(page, 0);
    const straight = await page.screenshot({ clip: bottomEdge });

    await page.locator("#lens_correction").fill("10");
    await expect(page.locator("#lens-correction")).toBeAttached();
    await expect
      .poll(async () =>
        (await page.screenshot({ clip: bottomEdge })).equals(straight),
      )
      .toBe(false);

    await page.locator("#lens_correction").fill("0");
    await expect(page.locator("#lens-correction")).not.toBeAttached();
    await expect
      .poll(async () =>
        (await page.screenshot({ clip: bottomEdge })).equals(straight),
      )
      .toBe(true);
  });

  test("drags calibration corners where they appear on the corrected screen", async ({
    page,
  }) => {
    const lens = { strength: 10 };
    await openCalibration(page, lens.strength);
    const start = { x: 60, y: 660 };
    const end = { x: 160, y: 560 };

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
    await page.mouse.up();

    const from = lensSourcePoint(start, viewport.width, viewport.height, lens);
    const to = lensSourcePoint(end, viewport.width, viewport.height, lens);
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("points") ?? "[]"),
    );
    expect(saved[3].x).toBeCloseTo(points[3].x + to.x - from.x, 0);
    expect(saved[3].y).toBeCloseTo(points[3].y + to.y - from.y, 0);
    // The other corners stay put
    expect(saved.slice(0, 3)).toEqual(points.slice(0, 3));
  });
});
