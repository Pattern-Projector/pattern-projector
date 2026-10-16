import { expect, Page } from "@playwright/test";
import { PDFDocument, rgb } from "@cantoo/pdf-lib";
import { writeFileSync } from "fs";

export const viewport = { width: 1280, height: 720 };
const points = [
  { x: 100, y: 100 },
  { x: 1180, y: 100 },
  { x: 1180, y: 660 },
  { x: 100, y: 660 },
];

export async function makePattern(path: string, label: string) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([10 * 72, 8 * 72]);
  page.drawRectangle({
    x: 72,
    y: 72,
    width: 8 * 72,
    height: 6 * 72,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  page.drawText(label, { x: 100, y: 300, size: 48 });
  writeFileSync(path, await doc.save());
}

// A returning user who calibrated before, in full screen unless told otherwise
export async function seedCalibration(
  page: Page,
  overrides: {
    fullScreen?: boolean;
    windowScreenLeft?: number;
    windowInnerWidth?: number;
  } = {},
) {
  await page.addInitScript(
    ({ points, viewport, overrides }) => {
      if (localStorage.getItem("points") === null) {
        localStorage.setItem("points", JSON.stringify(points));
        localStorage.setItem(
          "calibrationContext",
          JSON.stringify({
            windowInnerWidth: viewport.width,
            windowInnerHeight: viewport.height,
            windowScreenTop: 0,
            windowScreenLeft: 0,
            // Phones and tablets have their own pixel ratio
            devicePixelRatio: window.devicePixelRatio,
            clientScreenTop: 0,
            clientScreenLeft: 0,
            fullScreen: true,
            ...overrides,
          }),
        );
      }
    },
    { points, viewport, overrides },
  );
}

export const seedFullScreenCalibration = (page: Page) => seedCalibration(page);

export async function openApp(page: Page) {
  await page.setViewportSize(viewport);
  await page.goto("/en/calibrate");
  await expect(home(page)).toBeVisible();
  // Wait for React to attach its event handlers
  await page.waitForLoadState("networkidle");
}

export async function addPattern(page: Page, path: string, name: string) {
  await page.locator("#pdfFile").setInputFiles(path);
  await expect(home(page).getByRole("status")).toContainText(
    `${name} is added`,
  );
}

export const home = (page: Page) => page.getByTestId("projects-home");
export const isFullScreen = (page: Page) =>
  page.evaluate(() => document.fullscreenElement !== null);
export const patternTransform = (page: Page) =>
  page.locator('div[style*="matrix3d"]').first().getAttribute("style");
export const projectNames = (page: Page) =>
  page.getByTestId("project").locator("span.font-medium").allInnerTexts();
export const pdfPage = (page: Page) => page.locator(".react-pdf__Page").first();
