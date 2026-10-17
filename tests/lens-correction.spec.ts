import { test, expect, Page } from "@playwright/test";
import { waitForApp, waitForFullScreenToSettle, windowSize } from "./helpers";
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

// A strip along the bottom edge of the calibration grid, clear of the menus
const bottomEdge = { x: 0, y: 600, width: viewport.width, height: 120 };

// Share of pixels that differ clearly between two screenshots. Browsers can redraw a few antialiased pixels
// slightly differently, so the screenshots are compared by eye-level difference, not byte for byte.
async function changedShare(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(
    async ([a, b]) => {
      const pixels = async (base64: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, image.width, image.height).data;
      };
      const [pa, pb] = [await pixels(a), await pixels(b)];
      let changed = 0;
      for (let i = 0; i < pa.length; i += 4) {
        const diff =
          Math.abs(pa[i] - pb[i]) +
          Math.abs(pa[i + 1] - pb[i + 1]) +
          Math.abs(pa[i + 2] - pb[i + 2]);
        if (diff > 96) changed++;
      }
      return changed / (pa.length / 4);
    },
    [a.toString("base64"), b.toString("base64")],
  );
}

test.describe("Lens correction", () => {
  test("remembers the lens correction after a reload", async ({ page }) => {
    await openCalibration(page, 0);
    const input = page.locator("#lens_correction");
    await input.fill("4.5");
    await page.reload();
    await waitForApp(page);
    await page
      .getByTestId("projects-home")
      .getByRole("button", { name: "Calibrate", exact: true })
      .click();
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
        changedShare(
          page,
          await page.screenshot({ clip: bottomEdge }),
          straight,
        ),
      )
      .toBeGreaterThan(0.002);

    await page.locator("#lens_correction").fill("0");
    await expect(page.locator("#lens-correction")).not.toBeAttached();
    await expect
      .poll(async () =>
        changedShare(
          page,
          await page.screenshot({ clip: bottomEdge }),
          straight,
        ),
      )
      .toBeLessThan(0.0005);
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

    // Full screen can be bigger than the window (Firefox uses its screen size)
    const size = await windowSize(page);
    const from = lensSourcePoint(start, size.width, size.height, lens);
    const to = lensSourcePoint(end, size.width, size.height, lens);
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("points") ?? "[]"),
    );
    expect(saved[3].x).toBeCloseTo(points[3].x + to.x - from.x, 0);
    expect(saved[3].y).toBeCloseTo(points[3].y + to.y - from.y, 0);
    // The other corners stay put
    expect(saved.slice(0, 3)).toEqual(points.slice(0, 3));
  });
});
